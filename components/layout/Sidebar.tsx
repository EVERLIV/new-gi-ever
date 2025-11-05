import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChartBarIcon, DocumentTextIcon, HomeIcon, SparklesIcon, XMarkIcon, UserCircleIcon, ArrowRightOnRectangleIcon, BookOpenIcon, LockClosedIcon, MoonIcon } from '../icons/IconComponents';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    forceHidden?: boolean;
}

const NavItem: React.FC<{ item: any; isSidebarOpen: boolean; onClick: () => void; }> = ({ item, isSidebarOpen, onClick }) => {
    const { subscriptionStatus, openUpgradeModal } = useAuth();
    const { t } = useTranslation();
    const isProFeature = item.pro;
    const isFreeUser = subscriptionStatus === 'free';

    if (isProFeature && isFreeUser) {
        return (
            <button
                key={item.name}
                title={t('sidebar.proFeature', { name: item.name })}
                onClick={openUpgradeModal}
                className={`group relative flex items-center w-full px-3 py-3 text-sm font-semibold rounded-lg transition-all duration-200 text-on-surface-variant/80 hover:bg-gray-100 hover:text-on-surface ${!isSidebarOpen && 'justify-center'}`}
            >
                <item.icon className="flex-shrink-0 h-6 w-6" />
                <span className={`whitespace-nowrap ${isSidebarOpen ? 'ml-4' : 'hidden'}`}>{item.name}</span>
                {isSidebarOpen && (
                    <span className="ml-auto text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t('common.pro')}</span>
                )}
            </button>
        );
    }
    
    return (
        <NavLink
            to={item.href}
            title={isSidebarOpen ? undefined : item.name}
            onClick={onClick}
            className={({ isActive }) =>
            `group relative flex items-center px-3 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                isActive
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-variant hover:bg-gray-100 hover:text-on-surface'
            } ${!isSidebarOpen && 'justify-center'}`
            }
        >
            {({ isActive }) => (
                <>
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
                    <item.icon className="flex-shrink-0 h-6 w-6" />
                    <span className={`whitespace-nowrap ${isSidebarOpen ? 'ml-4' : 'hidden'}`}>{item.name}</span>
                </>
            )}
        </NavLink>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen, forceHidden = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navigation = [
    { name: t('sidebar.dashboard'), href: '/dashboard', icon: HomeIcon, pro: true },
    { name: t('sidebar.bloodAnalysis'), href: '/blood-test', icon: DocumentTextIcon, pro: true },
    { name: t('sidebar.mindfulMoments'), href: '/mindful-moments', icon: MoonIcon, pro: true },
    { name: t('sidebar.aiAssistant'), href: '/assistant', icon: SparklesIcon, pro: false },
    { name: t('sidebar.biomarkers'), href: '/biomarkers', icon: ChartBarIcon, pro: true },
    { name: t('sidebar.articles'), href: '/articles', icon: BookOpenIcon, pro: true },
    { name: t('sidebar.profile'), href: '/profile', icon: UserCircleIcon, pro: false },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavLinkClick = () => {
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
  };

  return (
    <>
        <div
            className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
        />

        <aside className={`fixed top-0 left-0 h-full bg-surface/80 backdrop-blur-lg flex flex-col z-30 transition-all duration-300 ease-in-out border-r border-gray-200/80 overflow-hidden w-64
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0 
            md:${isSidebarOpen ? 'w-64' : (forceHidden ? 'w-0 border-none' : 'w-20')}
        `}>
            <div className="h-20 flex items-center justify-center px-4">
                 <div className={`transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex items-center justify-center">
                        <img src="https://www.everlivhealth.online/assets/logo_1756364617629-BwNFO1aW.png" alt="Everliv Health Logo" className="h-8 w-8 mr-2" />
                        <h1 className="text-2xl font-extrabold text-primary tracking-tight whitespace-nowrap">
                            EVERLIV
                        </h1>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 text-center whitespace-nowrap">
                        {t('header.subtitle')}
                    </p>
                </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-2">
                {navigation.map((item) => (
                    <NavItem 
                        key={item.name}
                        item={item}
                        isSidebarOpen={isSidebarOpen}
                        onClick={handleNavLinkClick}
                    />
                ))}
            </nav>
            <div className={`p-4 border-t border-gray-200/80 ${!isSidebarOpen && 'hidden'}`}>
                <div className="flex items-center mb-4">
                    <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt="User Avatar" />
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-semibold text-on-surface truncate">{user.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full group flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-lg text-on-surface-variant bg-gray-100 hover:bg-gray-200 hover:text-on-surface transition-all duration-200"
                >
                    <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5"/>
                    <span>{t('sidebar.logout')}</span>
                </button>
            </div>
        </aside>
    </>
  );
};

export default Sidebar;