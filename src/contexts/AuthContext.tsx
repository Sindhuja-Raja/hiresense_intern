import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getToken, setToken, removeToken, ApiError, AuthUser } from '@/lib/api';

export type UserRole = 'recruiter' | 'applicant';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (fullName: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  login: (token: string, user: User) => void; // For OAuth callback
  updateUser: (updates: Partial<User>) => void; // For updating user data like avatarUrl
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          // Verify token with backend
          const response = await authApi.getMe();
          if (response.data?.user) {
            setUser(response.data.user);
          } else {
            removeToken();
          }
        } catch (error) {
          removeToken();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const signUp = async (
    fullName: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.signup(fullName, email, password, role);
      
      if (response.data) {
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authApi.signin(email, password);
      
      if (response.data) {
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      
      return { success: false, error: 'Sign in failed' };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = () => {
    setUser(null);
    removeToken();
  };

  // Direct login for OAuth callback
  const login = (token: string, userData: User) => {
    setToken(token);
    setUser(userData);
  };

  // Update user data (for avatar, etc.)
  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signUp, signIn, signOut, login, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
