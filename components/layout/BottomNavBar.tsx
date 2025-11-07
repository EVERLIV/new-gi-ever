import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeIcon, DocumentTextIcon, SparklesIcon, ChartBarIcon, LockClosedIcon, MoonIcon, UserGroupIcon } from '../icons/IconComponents';
import { useAuth } from '../../contexts/AuthContext';

const BottomNavItem: React.FC<{ item: any }> = ({ item }) => {
    const { subscriptionStatus, openUpgradeModal } = useAuth();
    const { t } = useTranslation();

    if (item.pro && subscriptionStatus === 'free') {
        return (
            <button
                onClick={openUpgradeModal}
                className="flex flex-col items-center justify-center flex-1 h-full text-on-surface-variant/70"
                title={t('sidebar.proFeature', { name: item.name })}
            >
                <div className="relative">
                    <item.icon className="h-7 w-7" />
                    <span className="absolute -top-1 -right-2 text-xs font-bold text-primary px-1 py-0.5 rounded-full bg-primary/10" style={{ fontSize: '0.6rem' }}>{t('common.pro')}</span>
                </div>
            </button>
        );
    }

    return (
        <NavLink
            to={item.href}
            end={item.href !== '/biomarkers'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 group ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
              }`
            }
            title={item.name}
        >
            {({ isActive }) => (
                <>
                    <item.icon className="h-7 w-7" />
                    <span className={`absolute bottom-1.5 h-1 rounded-full bg-primary transition-all duration-300 ${isActive ? 'w-4' : 'w-0 group-hover:w-2'}`}></span>
                </>
            )}
        </NavLink>
    );
};

const BottomNavBar: React.FC = () => {
  const { t } = useTranslation();
  const navigation = [
    { name: t('bottomNav.dashboard'), href: '/dashboard', icon: HomeIcon, pro: true },
    { name: t('bottomNav.bloodTest'), href: '/blood-test', icon: DocumentTextIcon, pro: true },
    { name: t('bottomNav.assistant'), href: '/assistant', icon: SparklesIcon, pro: false },
    { name: t('bottomNav.biomarkers'), href: '/biomarkers', icon: ChartBarIcon, pro: true },
    { name: t('bottomNav.specialists'), href: '/specialists', icon: UserGroupIcon, pro: false },
    { name: t('bottomNav.moments'), href: '/mindful-moments', icon: MoonIcon, pro: true },
  ];

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-surface/70 backdrop-blur-lg shadow-soft-lg rounded-2xl z-20 border border-gray-200/60">
      <div className="flex justify-around items-center h-16">
        {navigation.map((item) => (
          <BottomNavItem key={item.name} item={item} />
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;