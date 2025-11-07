

import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { initializeFirebase } from './services/firebase';
import { firebaseConfig } from './services/firebaseConfig';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import BloodTestPage from './pages/BloodTestPage';
import AssistantPage from './pages/AssistantPage';
import BiomarkersPage from './pages/BiomarkersPage';
import ArticlesPage from './pages/ArticlesPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import Header from './components/layout/Header';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BottomNavBar from './components/layout/BottomNavBar';
import UpgradeModal from './components/ui/UpgradeModal';
import HealthProfileSetupPage from './pages/HealthProfileSetupPage';
import MindfulMomentsPage from './pages/VideoConsultationPage';
import ContentManagementPage from './pages/ContentManagementPage';
import SpecialistsPage from './pages/SpecialistsPage';
import LandingPage from './pages/LandingPage';

// Initialize Firebase once when the app loads
initializeFirebase(firebaseConfig);

// A component to handle protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// A component to protect Pro-only features
const ProRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { subscriptionStatus, openUpgradeModal } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (subscriptionStatus === 'free') {
            // Open the upgrade modal and redirect the user to a safe (free) page.
            openUpgradeModal();
            navigate('/assistant', { replace: true });
        }
    }, [subscriptionStatus, openUpgradeModal, navigate]);

    if (subscriptionStatus === 'free') {
        // Render null or a loading spinner while the redirect and modal activation occurs.
        return null; 
    }
    
    return <>{children}</>;
};

// A component to protect Admin-only features
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdmin) {
            // Redirect non-admins to a safe page.
            navigate('/dashboard', { replace: true });
        }
    }, [isAdmin, navigate]);

    if (!isAdmin) {
        // Render nothing while redirecting.
        return null;
    }
    
    return <>{children}</>;
};


const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { subscriptionStatus, isUpgradeModalOpen, closeUpgradeModal } = useAuth();
  
  const isAssistantPage = location.pathname === '/assistant';
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  
  React.useEffect(() => {
    if (isAssistantPage) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isAssistantPage]);

  // PWA File Handling Logic
  useEffect(() => {
    // 1. Handle files from 'share_target' (via Service Worker)
    const handleSharedFile = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SHARED_FILE') {
        const file = event.data.file;
        if (file instanceof File) {
          // Navigate to the blood test page and pass the file in the state
          navigate('/blood-test', { state: { sharedFile: file } });
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSharedFile);

    // 2. Handle files from 'file_handlers' (via Launch Queue API)
    if ('launchQueue' in window) {
      (window as any).launchQueue.setConsumer(async (launchParams: { files: any[] }) => {
        if (!launchParams.files || launchParams.files.length === 0) {
          return;
        }
        const fileHandle = launchParams.files[0];
        const file = await fileHandle.getFile();
        if (file) {
          navigate('/blood-test', { state: { sharedFile: file } });
        }
      });
    }

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSharedFile);
    };
  }, [navigate]);
  
  const showBottomNav = !isAssistantPage && subscriptionStatus === 'pro';

  return (
    <div className="flex h-screen bg-background font-sans text-on-surface">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        forceHidden={isAssistantPage && !isSidebarOpen}
      />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out md:${isSidebarOpen ? 'pl-64' : (isAssistantPage ? 'pl-0' : 'pl-20')}`}>
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isAssistantPage={isAssistantPage}
        />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-b from-white/30 to-transparent ${!isAssistantPage ? `p-4 sm:p-6 md:p-8 lg:p-10 ${showBottomNav ? 'pb-24 md:pb-8' : ''}` : ''}`}>
          <Routes>
            <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/specialists" element={<ProtectedRoute><SpecialistsPage /></ProtectedRoute>} />
            
            {/* Pro Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><ProRoute><DashboardPage /></ProRoute></ProtectedRoute>} />
            <Route path="/blood-test" element={<ProtectedRoute><ProRoute><BloodTestPage /></ProRoute></ProtectedRoute>} />
            <Route path="/biomarkers" element={<ProtectedRoute><ProRoute><BiomarkersPage /></ProRoute></ProtectedRoute>} />
            <Route path="/biomarkers/:biomarkerName" element={<ProtectedRoute><ProRoute><BiomarkersPage /></ProRoute></ProtectedRoute>} />
            <Route path="/articles" element={<ProtectedRoute><ProRoute><ArticlesPage /></ProRoute></ProtectedRoute>} />
            <Route path="/articles/:articleTitle" element={<ProtectedRoute><ProRoute><ArticlesPage /></ProRoute></ProtectedRoute>} />
            <Route path="/mindful-moments" element={<ProtectedRoute><ProRoute><MindfulMomentsPage /></ProRoute></ProtectedRoute>} />
            
            {/* Admin Route */}
            <Route path="/content-management" element={<ProtectedRoute><AdminRoute><ContentManagementPage /></AdminRoute></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
      {showBottomNav && <BottomNavBar />}
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={closeUpgradeModal} />
    </div>
  );
};

const App: React.FC = () => {
    return (
      <AuthProvider>
          <HashRouter>
              <AppInitializer />
          </HashRouter>
      </AuthProvider>
    );
};

const RootGate: React.FC = () => {
    const { isAuthenticated, isProfileComplete, subscriptionStatus } = useAuth();
    if (!isAuthenticated) {
        return <LandingPage />;
    }
    if (!isProfileComplete) {
        return <HealthProfileSetupPage />;
    }
    // If authenticated and profile is complete, redirect to dashboard/assistant
    return <Navigate to={subscriptionStatus === 'pro' ? "/dashboard" : "/assistant"} replace />;
};

const AppInitializer: React.FC = () => {
    const { isInitializing } = useAuth();

    if (isInitializing) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-background">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootGate />} />
            <Route path="/*" element={<AppContentWithAuthCheck />} />
        </Routes>
    );
};

const AppContentWithAuthCheck: React.FC = () => {
    const { isAuthenticated, isProfileComplete } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    // If authenticated but profile is not complete, show the setup page.
    if (!isProfileComplete) {
        return <HealthProfileSetupPage />;
    }
    return <AppContent />;
}

export default App;