import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bars3Icon, ArrowLeftIcon } from '../icons/IconComponents';

interface HeaderProps {
    toggleSidebar: () => void;
    isAssistantPage?: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isAssistantPage = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const isDetailPage = (location.pathname.startsWith('/biomarkers/') && location.pathname.length > '/biomarkers/'.length) || 
                       (location.pathname.startsWith('/articles/') && location.pathname.length > '/articles/'.length);

  return (
    <header className="flex-shrink-0 bg-surface/80 backdrop-blur-lg h-20 flex items-center justify-between px-4 sm:px-6 z-10 border-b border-gray-200/80">
      <div className="flex items-center">
        {isDetailPage ? (
            <button 
                onClick={() => navigate(-1)} 
                className="mr-4 p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-gray-100 transition-colors -ml-2"
                aria-label={t('common.back')}
            >
                <ArrowLeftIcon className="h-6 w-6" />
            </button>
        ) : (
            <button 
                onClick={toggleSidebar} 
                className={`mr-4 text-on-surface-variant hover:text-on-surface ${!isAssistantPage && 'hidden md:block'}`}
                aria-label="Toggle sidebar"
            >
                <Bars3Icon className="h-6 w-6" />
            </button>
        )}
        <div className="flex items-center">
            <img src="https://www.everlivhealth.online/assets/logo_1756364617629-BwNFO1aW.png" alt="Everliv Health Logo" className="h-8 w-auto mr-3" />
            <div>
                <h1 className="text-2xl font-extrabold text-primary tracking-tight">
                    EVERLIV
                </h1>
                <p className="text-xs text-on-surface-variant mt-0.5">
                    {t('header.subtitle')}
                </p>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;