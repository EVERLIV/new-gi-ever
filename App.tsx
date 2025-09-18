import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

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

// A component to handle protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after a
    // successful login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};


const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  
  return (
    <div className="flex h-screen bg-background font-sans text-on-surface">
      <Sidebar isSidebarOpen={isSidebarOpen} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out md:${isSidebarOpen ? 'pl-64' : 'pl-20'}`}>
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 bg-gradient-to-b from-white/30 to-transparent">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/blood-test" element={<ProtectedRoute><BloodTestPage /></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
            <Route path="/biomarkers" element={<ProtectedRoute><BiomarkersPage /></ProtectedRoute>} />
            <Route path="/biomarkers/:biomarkerName" element={<ProtectedRoute><BiomarkersPage /></ProtectedRoute>} />
            <Route path="/articles" element={<ProtectedRoute><ArticlesPage /></ProtectedRoute>} />
            <Route path="/articles/:articleTitle" element={<ProtectedRoute><ArticlesPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
        <HashRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                {/* All other routes are handled by AppContent which includes the sidebar/header layout and protected routes */}
                <Route path="*" element={<AppContentWithAuthCheck />} />
            </Routes>
        </HashRouter>
    </AuthProvider>
  );
};

// This component ensures that the redirect to /login happens correctly if a user is not authenticated
const AppContentWithAuthCheck: React.FC = () => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return <AppContent />;
}

export default App;