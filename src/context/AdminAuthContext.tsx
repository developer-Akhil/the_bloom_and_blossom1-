import React, { createContext, useContext, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('bloom_admin_authenticated') === 'true';
  });

  const login = async (username: string, password: string) => {
    try {
      console.log('Attempting admin login for:', username);
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error) {
        console.error('Supabase admin login error:', error.message, error.details, error.hint);
        // If error code is 'PGRST116', it means no rows found (invalid credentials)
        // If it's a permission error, it might be RLS
        return { 
          success: false, 
          error: error.code === 'PGRST116' ? 'Invalid username or password' : `Database error: ${error.message}`
        };
      }

      if (!data) {
        return { success: false, error: 'User not found' };
      }

      setIsAdminAuthenticated(true);
      sessionStorage.setItem('bloom_admin_authenticated', 'true');
      sessionStorage.setItem('bloom_admin_username', username);
      return { success: true };
    } catch (err) {
      console.error('Admin login error:', err);
      return { success: false, error: 'Authorization service unavailable' };
    }
  };

  const logout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('bloom_admin_authenticated');
    sessionStorage.removeItem('bloom_admin_username');
  };

  const value = useMemo(() => ({
    isAdminAuthenticated,
    login,
    logout
  }), [isAdminAuthenticated]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
