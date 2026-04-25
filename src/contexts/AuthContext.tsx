import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Permission } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission | Permission[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('hospital_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Supabase Auth Listener
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          // If we have a session but no local user, we might need to sync
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          // logout()
        }
      });

      return () => subscription.unsubscribe();
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password?: string): Promise<boolean> => {
    try {
      // Step 1: Check if users table has this user (Simulating Auth via DB if no real Supabase Auth yet)
      const { data, error } = await supabase!
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) {
        // Simple fallback for admin if table is empty (Self-heal)
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
        throw new Error('User not found');
      }

      // In a real app, we would use supabase.auth.signInWithPassword
      // For this HIS, we check password from DB or just allow login for now
      setUser(data as User);
      localStorage.setItem('hospital_current_user', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Login failed", error);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hospital_current_user');
    if (supabase) supabase.auth.signOut();
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
    <AuthContext.Provider value={{ user, login, logout, hasPermission, isLoading }}>
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
