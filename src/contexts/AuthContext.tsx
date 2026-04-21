import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Permission } from '../types';
import { dataStore } from '../services/dataService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
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
    setIsLoading(false);
  }, []);

  const login = async (username: string, password?: string): Promise<boolean> => {
    try {
      const users = await dataStore.getAll<User>('users');
      const foundUser = users.find(u => 
        u.username === username && 
        u.status === 'active' && 
        (!u.password || u.password === password)
      );
      
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('hospital_current_user', JSON.stringify(foundUser));
        return true;
      }

      // Initial admin fallback if no users in DB yet
      if (username === 'admin' && users.length === 0) {
        const adminUser: User = {
          id: '1',
          username: 'admin',
          name: 'مدير النظام',
          role: 'admin',
          permissions: ['all' as Permission],
          status: 'active'
        };
        setUser(adminUser);
        return true;
      }
    } catch (error) {
      console.error("Login check failed", error);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hospital_current_user');
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.permissions.includes('all' as Permission)) return true;
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
