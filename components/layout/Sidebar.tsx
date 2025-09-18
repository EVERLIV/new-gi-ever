import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ChartBarIcon, DocumentTextIcon, HomeIcon, SparklesIcon, XMarkIcon, UserCircleIcon, ArrowRightOnRectangleIcon, BookOpenIcon, LogoIcon } from '../icons/IconComponents';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'AI Blood Analysis', href: '/blood-test', icon: DocumentTextIcon },
  { name: 'AI Assistant', href: '/assistant', icon: SparklesIcon },
  { name: 'Biomarkers', href: '/biomarkers', icon: ChartBarIcon },
  { name: 'Articles', href: '/articles', icon: BookOpenIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
];

interface SidebarProps {
    isSidebarOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`fixed top-0 left-0 h-full bg-surface/80 backdrop-blur-lg flex flex-col z-30 transition-all duration-300 ease-in-out border-r border-gray-200/80 hidden md:flex ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-20 flex items-center justify-center px-4">
             <div className={`transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center justify-center">
                    <LogoIcon className="h-8 w-8 mr-2 text-primary" />
                    <h1 className="text-2xl font-extrabold text-primary tracking-tight whitespace-nowrap">
                        EVERLIV
                    </h1>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 text-center whitespace-nowrap">
                    Get Your health in Order
                </p>
            </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2">
            {navigation.map((item) => (
            <NavLink
                key={item.name}
                to={item.href}
                title={isSidebarOpen ? undefined : item.name}
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
                <span>Logout</span>
            </button>
        </div>
    </aside>
  );
};

export default Sidebar;