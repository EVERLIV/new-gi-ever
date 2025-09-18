import React, { createContext, useState, useContext, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User;
  login: (email: string, a: string) => void;
  logout: () => void;
}

// A mock user for demonstration purposes
const MOCK_USER: User = {
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    avatarUrl: 'https://picsum.photos/100',
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User>(MOCK_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for auth state in localStorage on initial load
    try {
      const storedAuthState = localStorage.getItem('everliv_auth');
      if (storedAuthState) {
        setIsAuthenticated(JSON.parse(storedAuthState));
      }
    } catch (error) {
      console.error("Could not parse auth state from localStorage", error);
    }
    setLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    // In a real app, you'd make an API call here.
    // For this demo, we'll just simulate a successful login.
    console.log(`Simulating login for ${email}`);
    setIsAuthenticated(true);
    localStorage.setItem('everliv_auth', 'true');
    setUser(MOCK_USER);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('everliv_auth');
  };

  // Don't render children until we've checked localStorage
  if (loading) {
      return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
