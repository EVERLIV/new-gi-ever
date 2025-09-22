import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

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

const AppContent: React.FC = () => {
  const location = useLocation();
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
            <Route path="/" element={<Navigate to={subscriptionStatus === 'pro' ? "/dashboard" : "/assistant"} replace />} />
            <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            
            {/* Pro Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><ProRoute><DashboardPage /></ProRoute></ProtectedRoute>} />
            <Route path="/blood-test" element={<ProtectedRoute><ProRoute><BloodTestPage /></ProRoute></ProtectedRoute>} />
            <Route path="/biomarkers" element={<ProtectedRoute><ProRoute><BiomarkersPage /></ProRoute></ProtectedRoute>} />
            <Route path="/biomarkers/:biomarkerName" element={<ProtectedRoute><ProRoute><BiomarkersPage /></ProRoute></ProtectedRoute>} />
            <Route path="/articles" element={<ProtectedRoute><ProRoute><ArticlesPage /></ProRoute></ProtectedRoute>} />
            <Route path="/articles/:articleTitle" element={<ProtectedRoute><ProRoute><ArticlesPage /></ProRoute></ProtectedRoute>} />
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
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<AppContentWithAuthCheck />} />
            </Routes>
        </HashRouter>
    </AuthProvider>
  );
};

const AppContentWithAuthCheck: React.FC = () => {
    const { isAuthenticated, isProfileComplete } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    // If authenticated but profile is not complete, show the setup page.
    if (!isProfileComplete) {
        return <HealthProfileSetupPage />;
    }
    return <AppContent />;
}

export default App;