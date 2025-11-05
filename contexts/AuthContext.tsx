import React, { createContext, useState, useContext, useEffect } from 'react';
import type { User, HealthProfile } from '../types';
import { apiService } from '../services/apiService';

type SubscriptionStatus = 'free' | 'pro';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User;
  subscriptionStatus: SubscriptionStatus;
  isUpgradeModalOpen: boolean;
  isProfileComplete: boolean;
  isBackendConfigured: boolean;
  isInitializing: boolean;
  login: (email: string, a: string) => Promise<void>;
  logout: () => void;
  upgradeToPro: () => void;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  updateHealthProfile: (profile: HealthProfile) => Promise<void>;
  configureBackend: (url: string) => void;
}

const MOCK_USER_BASE: Omit<User, 'healthProfile'> = {
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    avatarUrl: 'https://picsum.photos/100',
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User>({ ...MOCK_USER_BASE, healthProfile: undefined });
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('pro');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [isBackendConfigured, setIsBackendConfigured] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const storedBackendUrl = localStorage.getItem('everliv_backend_url');
        const storedToken = localStorage.getItem('everliv_auth_token');

        if (storedBackendUrl) {
          apiService.setBackendUrl(storedBackendUrl);
          setIsBackendConfigured(true);
        }

        if (storedBackendUrl && storedToken) {
          setAuthToken(storedToken);
          apiService.setAuthToken(storedToken);
          
          // Verify token by fetching user profile
          const userProfile = await apiService.getProfile();
          if (userProfile) {
            setUser({ ...MOCK_USER_BASE, healthProfile: userProfile });
            setIsProfileComplete(!!userProfile.age);
            setIsAuthenticated(true);
             // TODO: Fetch subscription status from backend
            setSubscriptionStatus('pro');
          } else {
             // Token is invalid, clear it
            logout();
          }
        }
      } catch (error) {
        console.error("Initialization failed:", error);
        // If profile fetch fails, treat as logged out
        logout();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  const login = async (email: string, password: string) => {
    console.log(`Attempting login for ${email}`);
    const { token } = await apiService.login(email, password);
    if (token) {
        localStorage.setItem('everliv_auth_token', token);
        setAuthToken(token);
        apiService.setAuthToken(token);

        const userProfile = await apiService.getProfile();
        setUser({ ...MOCK_USER_BASE, healthProfile: userProfile });
        setIsProfileComplete(!!userProfile?.age);
        setIsAuthenticated(true);
        // In a real app, this would come from the backend user profile
        setSubscriptionStatus('pro'); 
        localStorage.setItem('everliv_subscription', JSON.stringify('pro'));
    } else {
        throw new Error("Login failed: Invalid credentials");
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    apiService.setAuthToken(null);
    localStorage.removeItem('everliv_auth_token');
    localStorage.removeItem('everliv_subscription');
  };
  
  const upgradeToPro = () => {
    setSubscriptionStatus('pro');
    localStorage.setItem('everliv_subscription', JSON.stringify('pro'));
    // In a real app, this would be an API call to the backend
  };

  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  const updateHealthProfile = async (profile: HealthProfile) => {
    const updatedProfile = await apiService.updateProfile(profile);
    setUser(prev => ({ ...prev, healthProfile: updatedProfile }));
    setIsProfileComplete(!!updatedProfile.age);
  };
  
  const configureBackend = (url: string) => {
    apiService.setBackendUrl(url);
    localStorage.setItem('everliv_backend_url', url);
    setIsBackendConfigured(true);
  };

  return (
    <AuthContext.Provider value={{ 
        isAuthenticated, 
        user, 
        login, 
        logout,
        subscriptionStatus,
        upgradeToPro,
        isUpgradeModalOpen,
        openUpgradeModal,
        closeUpgradeModal,
        isProfileComplete,
        updateHealthProfile,
        isBackendConfigured,
        isInitializing,
        configureBackend,
    }}>
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
