import React, { createContext, useState, useContext, useEffect } from 'react';
// FIX: Use Firebase v8 compat imports
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth, googleProvider } from '../services/firebase';
import { apiService } from '../services/apiService';
import type { User, HealthProfile } from '../types';

type SubscriptionStatus = 'free' | 'pro';

// FIX: Define Firebase user type using v8 style. It should be firebase.User
type FirebaseUser = firebase.User;

interface AuthContextType {
  isAuthenticated: boolean;
  user: User;
  subscriptionStatus: SubscriptionStatus;
  isUpgradeModalOpen: boolean;
  isProfileComplete: boolean;
  isInitializing: boolean;
  login: (email: string, a: string) => Promise<void>;
  register: (name: string, email: string, a: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  upgradeToPro: () => void;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  updateHealthProfile: (profile: HealthProfile) => Promise<void>;
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
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = async () => {
      try {
        // FIX: Use firebase.auth.Auth.Persistence.SESSION for v8 compat
        await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
      } catch (error) {
        console.error("Firebase auth persistence error:", error);
      }

      unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
        try {
            if (firebaseUser) {
                // Set auth status immediately to prevent race conditions on redirect
                setIsAuthenticated(true);
                setSubscriptionStatus('pro');

                const userProfile = await apiService.getProfile();
                setUser({
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email || '',
                    avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
                    healthProfile: userProfile,
                });
                setIsProfileComplete(!!userProfile?.age);
            } else {
                setUser({ ...MOCK_USER_BASE, healthProfile: undefined });
                setIsAuthenticated(false);
                setIsProfileComplete(false);
            }
        } catch (error) {
            console.error("Auth state change error, failed to fetch profile:", error);
            // Fallback state in case of an error (e.g., Firestore rules issue).
            // Log the user out to be safe and ensure a clean state.
            if (firebaseUser) {
                await auth.signOut().catch(e => console.error("Sign out failed after auth error:", e));
            }
            setUser({ ...MOCK_USER_BASE, healthProfile: undefined });
            setIsAuthenticated(false);
            setIsProfileComplete(false);
        } finally {
            // This is crucial to prevent the app from being stuck in a loading state.
            setIsInitializing(false);
        }
      });
    };

    setupAuthListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    await auth.signInWithEmailAndPassword(email, password);
  };

  const register = async (name: string, email: string, password: string) => {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      if (userCredential.user) {
        await userCredential.user.updateProfile({
            displayName: name,
            photoURL: `https://i.pravatar.cc/150?u=${userCredential.user.uid}`
        });
      }
  };

  const loginWithGoogle = async () => {
      await auth.signInWithPopup(googleProvider);
  };

  const logout = async () => {
    await auth.signOut();
  };
  
  const upgradeToPro = () => {
    setSubscriptionStatus('pro');
  };

  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  const updateHealthProfile = async (profile: HealthProfile) => {
    const updatedProfile = await apiService.updateProfile(profile);
    setUser(prev => ({ ...prev, healthProfile: updatedProfile }));
    setIsProfileComplete(!!updatedProfile.age);
  };

  return (
    <AuthContext.Provider value={{ 
        isAuthenticated, 
        user, 
        login,
        register,
        loginWithGoogle,
        logout,
        subscriptionStatus,
        upgradeToPro,
        isUpgradeModalOpen,
        openUpgradeModal,
        closeUpgradeModal,
        isProfileComplete,
        updateHealthProfile,
        isInitializing,
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