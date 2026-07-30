import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

interface CustomUser {
  id: string;
  email: string;
  phone?: string;
  user_metadata?: {
    full_name?: string;
    has_used_first_discount?: boolean;
    phone?: string;
  }
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  loginUser: (user: CustomUser, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for user and token
    const storedUser = localStorage.getItem('app_user');
    const storedToken = localStorage.getItem('app_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const loginUser = useCallback((newUser: CustomUser, token: string) => {
    localStorage.setItem('app_user', JSON.stringify(newUser));
    localStorage.setItem('app_token', token);
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('app_user');
    localStorage.removeItem('app_token');
    setUser(null);
  }, []);

  const isAdmin = useMemo(() => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    if (adminEmail) {
      return user?.email === adminEmail;
    }
    // Fallback logic, maybe check role if available
    return user?.email === 'info@bloomandblossom.in'; 
  }, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin,
    signOut,
    loginUser
  }), [user, loading, isAdmin, signOut, loginUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
