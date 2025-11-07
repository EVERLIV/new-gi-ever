import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
// FIX: Use Firebase v8 compat imports
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth, googleProvider, functions } from '../services/firebase';
import { apiService } from '../services/apiService';
import type { User, HealthProfile } from '../types';

type SubscriptionStatus = 'free' | 'pro';

// A hardcoded list of Firebase UIDs for admin users.
// In a production app, this would be managed via a database role or custom claims.
const ADMIN_UIDS = ['uE4kQ8tJ1YghR62a3B4c5D6e7F8g'];

// FIX: Define Firebase user type using v8 style. It should be firebase.User
type FirebaseUser = firebase.User;

interface AuthContextType {
  isAuthenticated: boolean;
  user: User;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry: Date | null;
  isUpgradeModalOpen: boolean;
  isProfileComplete: boolean;
  isInitializing: boolean;
  isAdmin: boolean;
  isUpgrading: boolean;
  login: (email: string, a: string) => Promise<void>;
  register: (name: string, email: string, a: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  upgradeToPro: () => Promise<void>;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  updateHealthProfile: (profile: HealthProfile) => Promise<void>;
  updateUserProfile: (updates: { name?: string; avatarUrl?: string }) => Promise<void>;
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('free');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<Date | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const logout = useCallback(async () => {
    if (auth.currentUser) {
        localStorage.removeItem(`profile_complete_${auth.currentUser.uid}`);
    }
    await auth.signOut();
  }, []);

  useEffect(() => {
    auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(error => {
        console.error("Firebase auth persistence error:", error);
    });

    const unsubscribe = auth.onAuthStateChanged((firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            // User is logged in. Fetch their full profile before we stop initializing.
            apiService.getUserData()
                .then(userData => {
                    const userProfile = userData?.healthProfile;
                    let subStatus: SubscriptionStatus = userData?.subscriptionStatus || 'free';
                    let expiryDate: Date | null = null;
                    
                    // Check for subscription expiration
                    if (subStatus === 'pro' && userData?.subscriptionExpiresAt) {
                        const expiry = userData.subscriptionExpiresAt.toDate();
                        if (new Date() > expiry) {
                            subStatus = 'free'; // Subscription has expired
                            expiryDate = null;
                        } else {
                            expiryDate = expiry;
                        }
                    } else {
                        subStatus = 'free'; // Ensure status is free if no pro or no expiry date
                    }

                    setUser({
                        name: firebaseUser.displayName || 'User',
                        email: firebaseUser.email || '',
                        avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
                        healthProfile: userProfile,
                    });
                    setIsAuthenticated(true);
                    setSubscriptionStatus(subStatus);
                    setSubscriptionExpiry(expiryDate);
                    setIsAdmin(ADMIN_UIDS.includes(firebaseUser.uid));

                    const isActuallyComplete = !!userProfile?.age;
                    setIsProfileComplete(isActuallyComplete);
                    
                    if (isActuallyComplete) {
                        localStorage.setItem(`profile_complete_${firebaseUser.uid}`, 'true');
                    } else {
                        localStorage.removeItem(`profile_complete_${firebaseUser.uid}`);
                    }
                })
                .catch(error => {
                    console.warn("Could not fetch user profile, assuming new user or profile needs creation:", error);
                    setUser({
                        name: firebaseUser.displayName || 'User',
                        email: firebaseUser.email || '',
                        avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
                        healthProfile: undefined,
                    });
                    setIsAuthenticated(true);
                    setSubscriptionStatus('free');
                    setSubscriptionExpiry(null);
                    setIsAdmin(ADMIN_UIDS.includes(firebaseUser.uid));
                    setIsProfileComplete(false);
                    localStorage.removeItem(`profile_complete_${firebaseUser.uid}`);
                })
                .finally(() => {
                    setIsInitializing(false);
                });
        } else {
            // User is logged out, clear all state synchronously.
            setUser({ ...MOCK_USER_BASE, healthProfile: undefined });
            setIsAuthenticated(false);
            setIsProfileComplete(false);
            setIsAdmin(false);
            setSubscriptionStatus('free');
            setSubscriptionExpiry(null);
            setIsInitializing(false);
        }
    });

    return () => unsubscribe();
  }, [logout]);


  const login = async (email: string, password: string) => {
    setIsInitializing(true);
    await auth.signInWithEmailAndPassword(email, password);
  };

  const register = async (name: string, email: string, password: string) => {
      setIsInitializing(true);
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      if (userCredential.user) {
        await userCredential.user.updateProfile({
            displayName: name,
            photoURL: `https://i.pravatar.cc/150?u=${userCredential.user.uid}`
        });
      }
  };

  const loginWithGoogle = async () => {
      setIsInitializing(true);
      await auth.signInWithPopup(googleProvider);
  };
  
  const upgradeToPro = async () => {
    setIsUpgrading(true);
    console.log("Инициирование процесса оплаты через RuStore...");

    try {
      // ===== РЕАЛЬНАЯ ЛОГИКА ДЛЯ ПРОДАКШЕНА (требует развернутой Firebase Function) =====
      // 1. Получаем ссылку на нашу облачную функцию.
      const createRuStorePayment = functions.httpsCallable('createRuStorePayment');
      
      // 2. Вызываем функцию. Она безопасно сгенерирует счет на стороне сервера.
      console.log("Вызов облачной функции 'createRuStorePayment'...");
      const result = await createRuStorePayment();
      const invoiceUrl = (result.data as { invoiceUrl: string }).invoiceUrl;

      // 3. Если ссылка получена, перенаправляем пользователя на страницу оплаты RuStore.
      if (invoiceUrl) {
        console.log("Получена ссылка на оплату, перенаправляем пользователя...");
        window.location.href = invoiceUrl;
      } else {
        throw new Error("Не удалось получить ссылку на оплату от сервера.");
      }
      
      // ВАЖНО: После успешной оплаты RuStore отправит уведомление (вебхук) на другую
      // вашу облачную функцию, которая и должна будет вызвать apiService.grantProSubscription().
      // Прямой вызов на фронтенде после редиректа небезопасен.

    } catch (error) {
      console.error("Ошибка при вызове облачной функции:", error);
      // Здесь можно показать сообщение об ошибке пользователю

      // ===== СИМУЛЯЦИЯ ДЛЯ ДЕМОНСТРАЦИИ (если реальный вызов не удался) =====
      // Этот блок нужен только для того, чтобы приложение работало без развернутого бэкенда.
      // В продакшене его следует удалить и обрабатывать ошибку.
      console.log("Не удалось выполнить реальный вызов. Запускаю симуляцию оплаты...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      await apiService.grantProSubscription();
      
      const userData = await apiService.getUserData();
      if (userData?.subscriptionStatus === 'pro' && userData?.subscriptionExpiresAt) {
          setSubscriptionStatus('pro');
          setSubscriptionExpiry(userData.subscriptionExpiresAt.toDate());
      }
      closeUpgradeModal();
      console.log("Симуляция оплаты прошла успешно.");
      // ===== КОНЕЦ БЛОКА СИМУЛЯЦИИ =====

    } finally {
      // isUpgrading останется true при редиректе, но сбросится при возврате на сайт.
      // Сбрасываем его здесь на случай ошибки, чтобы кнопка снова стала активной.
      setIsUpgrading(false);
    }
  };


  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  const updateHealthProfile = async (profile: HealthProfile) => {
    const updatedProfile = await apiService.updateProfile(profile);
    setUser(prev => ({ ...prev, healthProfile: updatedProfile }));
    const isComplete = !!updatedProfile.age;
    setIsProfileComplete(isComplete);
    if (isComplete && auth.currentUser) {
        localStorage.setItem(`profile_complete_${auth.currentUser.uid}`, 'true');
    }
  };

  const updateUserProfile = async (updates: { name?: string; avatarUrl?: string }) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("User not authenticated for API call.");

    const profileUpdates: { displayName?: string | null; photoURL?: string | null } = {};
    if (updates.name !== undefined) profileUpdates.displayName = updates.name;
    if (updates.avatarUrl !== undefined) profileUpdates.photoURL = updates.avatarUrl;
    
    if (Object.keys(profileUpdates).length > 0) {
        await firebaseUser.updateProfile(profileUpdates);
        
        setUser(prevUser => ({
            ...prevUser,
            name: updates.name ?? prevUser.name,
            avatarUrl: updates.avatarUrl ?? prevUser.avatarUrl,
        }));
    }
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
        subscriptionExpiry,
        upgradeToPro,
        isUpgradeModalOpen,
        openUpgradeModal,
        closeUpgradeModal,
        isProfileComplete,
        updateHealthProfile,
        updateUserProfile,
        isInitializing,
        isAdmin,
        isUpgrading,
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