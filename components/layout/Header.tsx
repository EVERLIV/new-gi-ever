import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, ArrowLeftIcon } from '../icons/IconComponents';

const pageConfigs: { [key: string]: { title: string; color: string } } = {
  '/dashboard': { title: 'Dashboard', color: 'text-primary' },
  '/blood-test': { title: 'AI Blood Analysis', color: 'text-card-red-text' },
  '/assistant': { title: 'AI Health Assistant', color: 'text-card-blue-text' },
  '/biomarkers': { title: 'Biomarker Tracking', color: 'text-primary' },
  '/articles': { title: 'Health Articles', color: 'text-card-purple-text' },
  '/profile': { title: 'Profile & Settings', color: 'text-card-orange-text' },
};

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getConfig = () => {
    const { pathname } = location;
    
    // Match biomarker detail pages
    const biomarkerMatch = pathname.match(/^\/biomarkers\/(.+)$/);
    if (biomarkerMatch && biomarkerMatch[1]) {
        try {
            const name = decodeURIComponent(biomarkerMatch[1]);
            return { title: name.charAt(0).toUpperCase() + name.slice(1), color: pageConfigs['/biomarkers'].color };
        } catch (e) {
            return { title: 'Biomarker Details', color: pageConfigs['/biomarkers'].color };
        }
    }

    // Match article detail pages
    const articleMatch = pathname.match(/^\/articles\/(.+)$/);
    if (articleMatch && articleMatch[1]) {
        try {
            const name = decodeURIComponent(articleMatch[1]);
            return { title: name, color: pageConfigs['/articles'].color };
        } catch (e) {
            return { title: 'Article', color: pageConfigs['/articles'].color };
        }
    }

    return pageConfigs[pathname] || { title: 'EVERLIV HEALTH', color: 'text-on-surface' };
  };
  
  const { title, color } = getConfig();
  const isDetailPage = (location.pathname.startsWith('/biomarkers/') && location.pathname.length > '/biomarkers/'.length) || 
                       (location.pathname.startsWith('/articles/') && location.pathname.length > '/articles/'.length);

  return (
    <header className="flex-shrink-0 bg-surface/80 backdrop-blur-lg h-20 flex items-center justify-between px-4 sm:px-6 z-10 border-b border-gray-200/80">
      <div className="flex items-center">
        {isDetailPage ? (
            <button 
                onClick={() => navigate(-1)} 
                className="mr-4 p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-gray-100 transition-colors -ml-2"
                aria-label="Go back"
            >
                <ArrowLeftIcon className="h-6 w-6" />
            </button>
        ) : (
            <button 
                onClick={toggleSidebar} 
                className="mr-4 text-on-surface-variant hover:text-on-surface hidden md:block"
                aria-label="Toggle sidebar"
            >
                <Bars3Icon className="h-6 w-6" />
            </button>
        )}
        <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${color}`}>{title}</h2>
      </div>
      {/* Additional header content can go here, e.g., notifications */}
    </header>
  );
};

export default Header;