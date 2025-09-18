import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, DocumentTextIcon, SparklesIcon, ChartBarIcon } from '../icons/IconComponents';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Blood Test', href: '/blood-test', icon: DocumentTextIcon },
  { name: 'Assistant', href: '/assistant', icon: SparklesIcon },
  { name: 'Biomarkers', href: '/biomarkers', icon: ChartBarIcon },
];

const BottomNavBar: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-surface/70 backdrop-blur-lg shadow-soft-lg rounded-2xl z-20 border border-gray-200/60">
      <div className="flex justify-around items-center h-16">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href !== '/biomarkers'} // Allow prefix match for biomarker detail pages
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
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;