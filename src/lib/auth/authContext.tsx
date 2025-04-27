'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  role: 'user' | 'admin'; // Add role
  dob?: string | null; // Date of Birth (optional, store as ISO string e.g., 'YYYY-MM-DD')
  phone?: string | null; // Phone number (optional)
  joinedAt?: Date | string; // Date the user joined (optional)
}

interface AuthContextType {
  currentUser: AuthUser | null | undefined; // undefined means loading
  login: (user: AuthUser) => void;
  logout: () => void;
  updateCurrentUser: (updatedFields: Partial<AuthUser>) => void; // Add function to update context
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
        const parsedUser = JSON.parse(storedUser);
        // Ensure joinedAt is a Date object if it exists
        if (parsedUser.joinedAt) {
            parsedUser.joinedAt = new Date(parsedUser.joinedAt);
        }
        setCurrentUser(parsedUser);
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
    // Ensure joinedAt is stored as a string or Date object that can be stringified
    const userToStore = {
        ...user,
        joinedAt: user.joinedAt instanceof Date ? user.joinedAt.toISOString() : user.joinedAt,
    };
    setCurrentUser(user); // Keep Date object in state
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
    setLoading(false); // Ensure loading is false after login
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setLoading(false); // Ensure loading is false after logout
  };

  // Function to update specific fields of the current user in context and storage
   const updateCurrentUser = (updatedFields: Partial<AuthUser>) => {
       setCurrentUser(prevUser => {
           if (!prevUser) return null;
           const newUser = { ...prevUser, ...updatedFields };
           // Update local storage as well
            const userToStore = {
                ...newUser,
                joinedAt: newUser.joinedAt instanceof Date ? newUser.joinedAt.toISOString() : newUser.joinedAt,
            };
           localStorage.setItem('currentUser', JSON.stringify(userToStore));
           return newUser;
       });
   };


  // Display skeleton or loading indicator while checking auth state
  if (loading && currentUser === undefined) { // Only show skeleton during initial load
    return (
         <div className="flex items-center justify-center min-h-screen">
             {/* Use a simple loader or keep the skeleton */}
             <Skeleton className="h-12 w-12 rounded-full" />
             <div className="ml-4 space-y-2">
                 <Skeleton className="h-4 w-[250px]" />
                 <Skeleton className="h-4 w-[200px]" />
            </div>
         </div>
     ); // Or a more sophisticated loading screen
  }


  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateCurrentUser, loading }}>
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
