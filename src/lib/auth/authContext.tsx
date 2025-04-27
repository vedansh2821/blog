'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  role: 'user' | 'admin'; // Add role
}

interface AuthContextType {
  currentUser: AuthUser | null | undefined; // undefined means loading
  login: (user: AuthUser) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null | undefined>(undefined); // Start as loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking local storage or a session cookie
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        setCurrentUser(null); // No user found
      }
    } catch (error) {
      console.error("Error reading user from storage:", error);
      setCurrentUser(null); // Treat errors as logged out
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setLoading(false); // Ensure loading is false after login
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
     setLoading(false); // Ensure loading is false after logout
  };

  // Display skeleton or loading indicator while checking auth state
  if (loading) {
    return (
         <div className="flex items-center justify-center min-h-screen">
             <Skeleton className="h-12 w-12 rounded-full" />
             <div className="ml-4 space-y-2">
                 <Skeleton className="h-4 w-[250px]" />
                 <Skeleton className="h-4 w-[200px]" />
            </div>
         </div>
     ); // Or a more sophisticated loading screen
  }


  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
