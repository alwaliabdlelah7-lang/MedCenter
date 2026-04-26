import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Permission } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
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
              // Sign out if not allowed/not registered yet? 
              // Or just set a basic user profile
              setUser(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        // Fallback for local dev if needed, or if manual login happened
        const savedUser = localStorage.getItem('hospital_current_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google login failed details:", error);
      if (error.code === 'auth/internal-error') {
        alert("تنبيه: فشل تسجيل الدخول (Internal Error). تأكد من إضافة رابط التطبيق "+window.location.origin+" إلى Authorized Domains في Firebase Console.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("تنبيه: تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.");
      } else {
        alert("فشل تسجيل الدخول: " + error.message);
      }
    }
  };

  const login = async (username: string, password?: string): Promise<boolean> => {
    // In this HIS, for initial setup we might still want the legacy admin login
    if (username === 'admin' && (!password || password === '123')) {
       const adminData: User = {
         id: 'u-1',
         username: 'admin',
         name: 'System Admin',
         role: 'admin',
         permissions: ['all' as Permission],
         status: 'active'
       };
       setUser(adminData);
       localStorage.setItem('hospital_current_user', JSON.stringify(adminData));
       return true;
    }
    
    // In a real Firebase setup, we'd use signInWithEmailAndPassword
    // But for now we try to find the user in Firestore via username (not ideal)
    return false;
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
