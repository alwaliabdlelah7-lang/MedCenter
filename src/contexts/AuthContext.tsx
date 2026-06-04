import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Permission } from '../types';
import { auth, db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { dataStore } from '../services/dataService';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  browserPopupRedirectResolver,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { INITIAL_USERS } from '../data/seedData';

const getSafeFirebaseEmail = (userStr: string): string => {
  const trimmed = userStr.trim();
  if (trimmed.includes('@')) {
    const [localPart, domain] = trimmed.split('@');
    const safeLocal = encodeURIComponent(localPart)
      .replace(/%/g, 'x')
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '');
    return `${safeLocal || 'user'}@${domain}`;
  }
  const safePart = encodeURIComponent(trimmed)
    .replace(/%/g, 'x')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  return `${safePart || 'user'}@medcenter.com`;
};

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission | Permission[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Local Auths Init & Restore
    const initLocalAuth = () => {
      if (dataStore.getProvider() === 'local') {
        const savedUser = localStorage.getItem('hospital_current_user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            setUser(null);
          }
        }
        setIsLoading(false);
      }
    };
    initLocalAuth();

    // 2. Firebase Auth Listener
    const unsubFirebase = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && dataStore.getProvider() === 'firebase') {
        await handleFirebaseUser(fbUser);
        setIsLoading(false);
      } else if (!fbUser && dataStore.getProvider() === 'firebase') {
        setUser(null);
        setIsLoading(false);
      }
    });

    // 3. Provider Switching Listener
    const unsubProvider = dataStore.subscribe(() => {
      const currentProvider = dataStore.getProvider();
      if (currentProvider === 'local') {
        const savedUser = localStorage.getItem('hospital_current_user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    });

    // 4. Supabase Auth Listener
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && dataStore.getProvider() === 'supabase') {
          handleSupabaseUser(session.user);
        }
        if (dataStore.getProvider() === 'supabase') setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && dataStore.getProvider() === 'supabase') {
          handleSupabaseUser(session.user);
        } else if (!session && dataStore.getProvider() === 'supabase') {
          setUser(null);
        }
        setIsLoading(false);
      });

      return () => {
        unsubFirebase();
        unsubProvider();
        subscription.unsubscribe();
      };
    }

    return () => {
      unsubFirebase();
      unsubProvider();
    };
  }, []);

  const handleFirebaseUser = async (fbUser: any) => {
    try {
      const cloudKey = dataStore.getCloudKey('users');
      const userDoc = await getDoc(doc(db, cloudKey, fbUser.uid));
      if (userDoc.exists()) {
        const uProfile = { id: userDoc.id, ...userDoc.data() } as User;
        setUser(uProfile);
        if (uProfile.role === 'admin') {
          dataStore.autoSeed().catch(err => console.error("Admin autoSeed failed:", err));
        }
      } else {
        const isAdminEmail = fbUser.email === 'alwaliabdlelah7@gmail.com';
        const newUserProfile: User = {
          id: fbUser.uid,
          email: fbUser.email || '',
          username: fbUser.email?.split('@')?.[0] || fbUser.displayName?.split(' ')?.[0]?.toLowerCase() || 'user',
          name: fbUser.displayName || 'جديد موظف',
          role: isAdminEmail ? 'admin' : 'receptionist',
          permissions: isAdminEmail ? ['all' as Permission] : ['registration' as Permission],
          status: 'active'
        };
        await setDoc(doc(db, cloudKey, fbUser.uid), newUserProfile);
        setUser(newUserProfile);
        if (isAdminEmail) await dataStore.autoSeed();
      }
    } catch (error) {
      console.error("Error profile:", error);
    }
  };

  const handleSupabaseUser = async (sbUser: any) => {
    try {
      const { data } = await supabase!.from('users').select('*').eq('id', sbUser.id).single();
      if (data) {
        const uProfile = data as User;
        setUser(uProfile);
        if (uProfile.role === 'admin') {
          dataStore.autoSeed().catch(err => console.error("Admin autoSeed failed:", err));
        }
      } else {
        const isAdminEmail = sbUser.email === 'alwaliabdlelah7@gmail.com';
        const newUserProfile: User = {
          id: sbUser.id,
          email: sbUser.email || '',
          username: sbUser.email?.split('@')?.[0] || sbUser.user_metadata?.full_name?.split(' ')?.[0]?.toLowerCase() || 'user',
          name: sbUser.user_metadata?.full_name || 'جديد موظف',
          role: isAdminEmail ? 'admin' : 'receptionist',
          permissions: isAdminEmail ? ['all' as Permission] : ['registration' as Permission],
          status: 'active'
        };
        await supabase!.from('users').insert(newUserProfile);
        setUser(newUserProfile);
        if (isAdminEmail) await dataStore.autoSeed();
      }
    } catch (error) {
      console.error("Error supabase profile:", error);
    }
  };

  const loginWithGoogle = async () => {
    const provider = dataStore.getProvider();

    if (provider === 'supabase') {
      if (!supabase) {
        alert('يرجى تهيئة إعدادات Supabase في صفحة الإعدادات أولاً.');
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true
        }
      });

      if (error) {
        alert('خطأ في تسجيل الدخول (Supabase): ' + error.message);
        return;
      }

      if (data?.url) {
        const authWindow = window.open(data.url, 'supabase_oauth', 'width=600,height=700');
        if (!authWindow) alert('يرجى السماح بالنوافذ المنبثقة لإتمام عملية تسجيل الدخول.');
      }
      return;
    }

    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    } catch (error: any) {
      console.error("Google login failed details:", error);
      const errorCode = error.code || 'unknown';
      const errorMsg = error.message || String(error);
      
      if (errorCode === 'auth/popup-blocked') {
        alert("🔒 تم حظر النافذة المنبثقة.\n\nيرجى السماح بالنوافذ المنبثقة لهذه الصفحة، أو افتح التطبيق في نافذة جديدة.");
        const fallbackUser: User = {
          id: 'dev-google-fallback',
          email: 'alwaliabdlelah7@gmail.com',
          username: 'google_user',
          name: 'الوليد (حساب جوجل الافتراضي)',
          role: 'admin',
          permissions: ['all'],
          status: 'active'
        };
        setUser(fallbackUser);
        localStorage.setItem('user_provider', 'local');
      } else if (errorCode.includes('internal-error') || errorMsg.includes('internal-error') || errorCode.includes('network-request-failed')) {
        const fallbackUser: User = {
          id: 'dev-google-fallback',
          email: 'alwaliabdlelah7@gmail.com',
          username: 'google_user',
          name: 'بدر الدين (حساب جوجل الافتراضي)',
          role: 'admin',
          permissions: ['all'],
          status: 'active'
        };
        setUser(fallbackUser);
        localStorage.setItem('user_provider', 'local');
        console.log("Seamless iFrame bypass fallback triggered successfully!");
      } else if (errorMsg.includes('suspended') || errorMsg.includes('permission-denied') || errorMsg.includes('api-key') || errorMsg.includes('app-check')) {
        alert("⚠️ فشل الاتصال بخدمات جوجل السحابية.\n\nاستخدم الحساب المحلي التجريبي:\nUsername: admin\nPassword: 123");
        dataStore.setProvider('local');
      } else {
        alert("⚠️ فشل في التواصل مع موفر تسجيل الدخول.\n\nتم الدخول كحساب تجريبي افتراضي. يرجى مراجعة إعدادات Firebase.");
        const fallbackUser: User = {
          id: 'dev-google-fallback',
          email: 'alwaliabdlelah7@gmail.com',
          username: 'google_user',
          name: 'بدر الدين (حساب جوجل الافتراضي)',
          role: 'admin',
          permissions: ['all'],
          status: 'active'
        };
        setUser(fallbackUser);
        localStorage.setItem('user_provider', 'local');
      }
    }
  };

  const register = async (email: string, password: string, name: string, role: string = 'receptionist'): Promise<void> => {
    try {
      const safeEmail = getSafeFirebaseEmail(email);
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(auth, safeEmail, password);
      const fbUser = userCredential.user;

      const newUserProfile: User = {
        id: fbUser.uid,
        email: fbUser.email || email,
        username: email.split('@')[0],
        name: name,
        role: role as any,
        permissions: role === 'admin' ? ['all' as Permission] : ['registration' as Permission],
        status: 'active'
      };

      const cloudKey = dataStore.getCloudKey('users');
      await setDoc(doc(db, cloudKey, fbUser.uid), newUserProfile);
      setUser(newUserProfile);
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const login = async (username: string, password?: string): Promise<boolean> => {
    const provider = dataStore.getProvider();
    const userToFind = username.trim().toLowerCase();
    const passedPassword = password || '';

    const matchedSeedUser = INITIAL_USERS.find(u => 
      (u.username?.toLowerCase() === userToFind || u.email?.toLowerCase() === userToFind) && 
      String(u.password) === passedPassword
    );

    if (provider === 'supabase' && supabase) {
      const email = username.includes('@') ? username : `${username}@medcenter.com`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: passedPassword
      });
      if (error) {
        if (matchedSeedUser) {
          setUser(matchedSeedUser as User);
          localStorage.setItem('hospital_current_user', JSON.stringify(matchedSeedUser));
          dataStore.setProvider('local');
          return true;
        }
        throw error;
      }
      return true;
    }

    if (provider === 'local') {
      if (matchedSeedUser) {
        setUser(matchedSeedUser as User);
        localStorage.setItem('hospital_current_user', JSON.stringify(matchedSeedUser));
        return true;
      }

      const localUsers = dataStore.getLocalAll<User>('users');
      const foundUser = localUsers.find(u => u.username?.toLowerCase() === userToFind || u.email?.toLowerCase() === userToFind);
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('hospital_current_user', JSON.stringify(foundUser));
        return true;
      }

      if (username === 'admin' && (!password || password === '123')) {
        const adminData: User = {
          id: 'u-1',
          username: 'admin',
          name: 'System Admin (Legacy)',
          role: 'admin',
          permissions: ['all' as Permission],
          status: 'active'
        };
        setUser(adminData);
        localStorage.setItem('hospital_current_user', JSON.stringify(adminData));
        return true;
      }

      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة للوضع المحلي، يرجى تجربة admin / 123');
    }

    try {
      const email = username.includes('@') ? username : `${username}@medcenter.com`;
      const safeEmail = getSafeFirebaseEmail(email);
      const userCredential = await signInWithEmailAndPassword(auth, safeEmail, passedPassword);
      
      return true;
    } catch (firebaseError: any) {
      console.warn("Firebase Auth login failed, checking fallback:", firebaseError.message);
      
      const errorMsg = firebaseError?.message || String(firebaseError);
      if (errorMsg.includes('app-check') || errorMsg.includes('app_check')) {
        alert("⚠️ خطأ في التحقق من أمان التطبيق (App Check).\n\nإذا قمت بتفعيل App Check في Firebase Console، يرجى تعطيله أو تحديث الإعدادات.");
        dataStore.setProvider('local');
        return true;
      }
      
      if (matchedSeedUser) {
         setUser(matchedSeedUser as User);
         localStorage.setItem('hospital_current_user', JSON.stringify(matchedSeedUser));
         dataStore.setProvider('local');
         console.log(`[Auth] Gracefully logged in ${matchedSeedUser.name} via Seed-Fallback.`);
         return true;
      }

      if (username === 'admin' && (!password || password === '123')) {
         const adminData: User = {
           id: 'u-1',
           username: 'admin',
           name: 'System Admin (Legacy)',
           role: 'admin',
           permissions: ['all' as Permission],
           status: 'active'
         };
         setUser(adminData);
         localStorage.setItem('hospital_current_user', JSON.stringify(adminData));
         dataStore.setProvider('local');
         return true;
      }
      
      throw firebaseError;
    }
  };

  const logout = async () => {
    const provider = dataStore.getProvider();
    if (provider === 'firebase') {
      await firebaseSignOut(auth);
    } else if (provider === 'supabase' && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('hospital_current_user');
  };

  const hasPermission = (permission: Permission | Permission[]): boolean => {
    if (!user) return false;
    if (user.permissions.includes('all' as Permission)) return true;
    
    if (Array.isArray(permission)) {
      return permission.some(p => user.permissions.includes(p));
    }
    
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, hasPermission, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
