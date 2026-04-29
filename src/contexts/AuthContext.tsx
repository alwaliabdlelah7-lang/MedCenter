import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Permission } from '../types';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  browserPopupRedirectResolver,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => Promise<boolean>;
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
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Try to get user from Firestore
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() } as User);
          } else {
            // Check if it's the bootstrapped admin
            const isAdminEmail = fbUser.email === 'alwaliabdlelah7@gmail.com';
            
            const newUserProfile: User = {
              id: fbUser.uid,
              email: fbUser.email || '',
              username: fbUser.email?.split('@')[0] || fbUser.displayName?.split(' ')[0]?.toLowerCase() || 'user',
              name: fbUser.displayName || 'جديد موظف',
              role: isAdminEmail ? 'admin' : 'receptionist',
              permissions: isAdminEmail ? ['all' as Permission] : ['registration' as Permission],
              status: 'active'
            };

            // Persist the user profile in Firestore
            await setDoc(doc(db, 'users', fbUser.uid), newUserProfile);
            setUser(newUserProfile);
            
            // Trigger seeding if database is empty (since we are now an authorized admin)
            if (isAdminEmail) {
              const { dataStore } = await import('../services/dataService');
              await dataStore.autoSeedIfNeeded();
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      // Explicitly passing the resolver can help in some restricted environments
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    } catch (error: any) {
      console.error("Google login failed details:", error);
      
      const errorCode = error.code;
      const errorMessage = error.message;

      if (errorCode === 'auth/internal-error' || errorMessage?.includes('internal-error')) {
        const hostname = window.location.hostname;
        const projectId = "ai-studio-applet-webapp-6fbf2";
        const authSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

        alert("تنبيه: فشل في التواصل مع موفر تسجيل الدخول (auth/internal-error).\n\n" +
              "هذا الخطأ غالباً ما يكون بسبب عوائق في المتصفح أو إعدادات الحماية. يرجى تجربة ما يلي:\n\n" +
              "1. افتح التطبيق في نافذة مستقلة (Open in new tab) بدلاً من الإطار الحالي.\n" +
              "2. تأكد من إضافة النطاقات التالية إلى قائمة 'Authorized Domains' في إعدادات Firebase:\n" +
              "   - " + hostname + "\n" +
              "   - ais-dev-ptbtc6rsmho3m6illzcrog-799672221951.europe-west2.run.app\n" +
              "   - ais-pre-ptbtc6rsmho3m6illzcrog-799672221951.europe-west2.run.app\n\n" +
              "رابط الإعدادات:\n" + authSettingsUrl + "\n\n" +
              "3. تأكد من تفعيل موفر Google في لوحة التحكم.");
      } else if (errorCode === 'auth/popup-blocked') {
        alert("تنبيه: تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.");
      } else if (errorCode === 'auth/cancelled-popup-request') {
        console.log("User closed the popup.");
      } else if (errorCode === 'auth/unauthorized-domain') {
        alert("هذا النطاق غير معتمد في إعدادات Firebase.\n\n" +
              "النطاق الحالي: " + window.location.hostname);
      } else {
        alert("خطأ في تسجيل الدخول: " + (errorCode || "Error") + "\n" + errorMessage);
      }
    }
  };

  const login = async (username: string, password?: string): Promise<boolean> => {
    try {
      // 1. Try Firebase Authentication (Email/Password)
      // Note: We use username as email here
      const email = username.includes('@') ? username : `${username}@medcenter.com`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password || '');
      const fbUser = userCredential.user;
      
      // The onAuthStateChanged will handle the Firestore profile fetch/creation
      return true;
    } catch (firebaseError: any) {
      console.warn("Firebase Auth login failed, checking legacy admin:", firebaseError.message);
      
      // 2. Legacy admin fallback (only if Firebase Auth fails and it matches the specific hardcoded credentials)
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
      
      // If we are here, it's a real failure
      throw firebaseError;
    }
  };

  const logout = async () => {
    await signOut(auth);
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
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, hasPermission, isLoading }}>
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
