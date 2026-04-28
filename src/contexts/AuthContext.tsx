import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Permission } from '../types';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInAnonymously,
  browserPopupRedirectResolver 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  loginWithAuth0: () => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission | Permission[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for Auth0 session
    const checkAuth0Session = async () => {
      try {
        const response = await fetch('/auth/profile');
        if (response.ok) {
          const auth0Data = await response.json();
          if (auth0Data && auth0Data.sub) {
            const auth0User: User = {
              id: auth0Data.sub,
              email: auth0Data.email,
              username: auth0Data.nickname || auth0Data.email?.split('@')[0],
              name: auth0Data.name || auth0Data.nickname,
              role: 'doctor', // Default role for external login
              permissions: ['clinical' as Permission],
              status: 'active'
            };
            setUser(auth0User);
            setIsLoading(false);
            return true;
          }
        }
      } catch (error) {
        console.error("Auth0 session check failed:", error);
      }
      return false;
    };

    const handleMessage = async (event: MessageEvent) => {
      // Basic origin check
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        console.log("Auth0 Login success message received");
        await checkAuth0Session();
      }
    };

    window.addEventListener('message', handleMessage);

    const init = async () => {
      const hasAuth0 = await checkAuth0Session();
      if (hasAuth0) return;

      const unsub = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            // If anonymous, treat as the demo admin
            if (fbUser.isAnonymous) {
              const demoAdmin: User = {
                id: fbUser.uid,
                username: 'admin',
                name: 'Demo Admin (Guest)',
                role: 'admin',
                permissions: ['all' as Permission],
                status: 'active'
              };
              setUser(demoAdmin);
              setIsLoading(false);
              return;
            }

            // Try to get user from Firestore
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            if (userDoc.exists()) {
              setUser({ id: userDoc.id, ...userDoc.data() } as User);
            } else {
              // Check if it's the bootstrapped admin
              if (fbUser.email === 'alwaliabdlelah7@gmail.com') {
                const adminData: User = {
                  id: fbUser.uid,
                  email: fbUser.email || '',
                  username: fbUser.email?.split('@')[0] || 'admin',
                  name: fbUser.displayName || 'System Admin',
                  role: 'admin',
                  permissions: ['all' as Permission],
                  status: 'active'
                };
                // Persist the admin user in Firestore if it doesn't exist
                await setDoc(doc(db, 'users', fbUser.uid), adminData);
                setUser(adminData);
                
                // Trigger seeding if database is empty (since we are now an authorized admin)
                const { dataStore } = await import('../services/dataService');
                await dataStore.autoSeedIfNeeded();
              } else {
                setUser(null);
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

      return unsub;
    };

    let unsubFn: (() => void) | undefined;
    init().then(unsub => {
      if (unsub) unsubFn = unsub;
    });

    return () => {
      window.removeEventListener('message', handleMessage);
      if (unsubFn) unsubFn();
    };
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
        const projectId = "ai-studio-applet-webapp-772b2";
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

  const loginWithAuth0 = async () => {
    try {
      // 1. Fetch the OAuth URL from server
      const response = await fetch('/api/auth/url');
      if (!response.ok) throw new Error('Failed to fetch Auth0 URL');
      const { url } = await response.json();
      
      // 2. Open in popup directly to Auth0
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(url, 'auth0_login', `width=${width},height=${height},left=${left},top=${top}`);
    } catch (error) {
      console.error("Auth0 login init failed:", error);
      alert("فشل بدء تسجيل الدخول عبر Auth0");
    }
  };

  const login = async (username: string, password?: string): Promise<boolean> => {
    // In this HIS, for initial setup we might still want the legacy admin login
    if (username === 'admin' && (!password || password === '123')) {
       try {
         // Perform anonymous sign-in to get a valid Firebase token for Firestore rules
         await signInAnonymously(auth);
         // The state will be updated by onAuthStateChanged
         return true;
       } catch (error) {
         console.error("Anonymous login failed:", error);
         return false;
       }
    }
    
    // In a real Firebase setup, we'd use signInWithEmailAndPassword
    // But for now we try to find the user in Firestore via username (not ideal)
    return false;
  };

  const logout = async () => {
    if (user?.id.startsWith('auth0')) {
      window.location.href = '/auth/logout';
      return;
    }
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
    <AuthContext.Provider value={{ user, login, loginWithGoogle, loginWithAuth0, logout, hasPermission, isLoading }}>
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
