

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDailyHealthTip } from '../services/geminiService';
import type { Biomarker } from '../types';
import {
  MagnifyingGlassIcon,
  BellIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserCircleIcon,
  BookOpenIcon,
} from '../components/icons/IconComponents';

const BIOMARKERS_STORAGE_KEY = 'everliv_health_biomarkers';
const DAILY_TIP_STORAGE_KEY = 'everliv_health_daily_tip';

// --- Sub-components for the new Dashboard Design ---

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded-md animate-pulse ${className}`} />
);

interface NavCardProps {
  title: string;
  // Fix: Changed type from React.ReactNode to React.ReactElement for better type safety with React.cloneElement.
  icon: React.ReactElement;
  colorClasses: { bg: string; text: string };
  link: string;
}

const NavCard: React.FC<NavCardProps> = ({ title, icon, colorClasses, link }) => (
    <Link to={link} className="block group h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg rounded-2xl">
        <div className={`p-5 rounded-2xl h-full flex flex-col justify-between ${colorClasses.bg} bg-gradient-to-br from-white to-gray-50`}>
            <div className={`p-3 rounded-xl bg-white/60 shadow-soft w-12 h-12 flex items-center justify-center`}>
                {React.cloneElement(icon, { className: `h-7 w-7 ${colorClasses.text}` })}
            </div>
            <h3 className={`text-xl font-bold mt-4 ${colorClasses.text}`}>{title}</h3>
        </div>
    </Link>
);


const RecommendationCard: React.FC<{ tip: string }> = ({ tip }) => (
    <div className="bg-gradient-to-r from-primary/90 to-primary p-6 rounded-2xl shadow-soft-md text-white">
        <h3 className="font-bold flex items-center">
            <SparklesIcon className="h-5 w-5 mr-2 text-white/80"/>
            Today's Recommendation
        </h3>
        <div className="mt-2 text-lg min-h-[40px]">
            {tip}
        </div>
    </div>
);

const RecommendationCardSkeleton: React.FC = () => (
    <div className="p-6 rounded-2xl shadow-soft bg-gray-200 animate-pulse">
        <div className="flex items-center">
            <Skeleton className="h-5 w-5 mr-2 rounded-full bg-gray-300" />
            <Skeleton className="h-4 w-40 bg-gray-300" />
        </div>
        <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full bg-gray-300" />
            <Skeleton className="h-4 w-3/4 bg-gray-300" />
        </div>
    </div>
);


const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [allBiomarkers, setAllBiomarkers] = useState<Biomarker[]>([]);
    const [dailyTip, setDailyTip] = useState<string>('');
    const [isTipLoading, setIsTipLoading] = useState(true);

    useEffect(() => {
        try {
            const storedBiomarkersJSON = window.localStorage.getItem(BIOMARKERS_STORAGE_KEY);
            if (storedBiomarkersJSON) {
                const biomarkers: Biomarker[] = JSON.parse(storedBiomarkersJSON);
                setAllBiomarkers(biomarkers);
            }
        } catch (error) {
            console.error("Error loading biomarkers from localStorage:", error);
        }
    }, []);

    useEffect(() => {
        const fetchTip = async () => {
            setIsTipLoading(true);
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            try {
                const storedTip = window.localStorage.getItem(DAILY_TIP_STORAGE_KEY);
                if (storedTip) {
                    const cachedTipData = JSON.parse(storedTip);
                    // Use cached tip if it's from today
                    if (cachedTipData && cachedTipData.date === today) {
                        setDailyTip(cachedTipData.tip);
                        setIsTipLoading(false);
                        return;
                    }
                }
            } catch (error) {
                console.error("Error reading cached daily tip:", error);
            }

            // If no valid cached tip, fetch a new one
            const userGoals = ['Improve heart health', 'Maintain a healthy weight'];
            // The service function handles its own errors and returns a fallback tip
            const tip = await getDailyHealthTip(userGoals, allBiomarkers);
            
            setDailyTip(tip);
            // Save the new tip to localStorage for today
            window.localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify({ tip, date: today }));
            setIsTipLoading(false);
        };

        fetchTip();
    }, [allBiomarkers]);
    
    const mainNavItems = [
        {
            title: 'AI Blood Analysis',
            link: '/blood-test',
            icon: <DocumentTextIcon />,
            colors: { bg: 'bg-card-red-light', text: 'text-card-red-text' }
        },
        {
            title: 'AI Assistant',
            link: '/assistant',
            icon: <SparklesIcon />,
            colors: { bg: 'bg-card-blue-light', text: 'text-card-blue-text' }
        },
        {
            title: 'Biomarkers',
            link: '/biomarkers',
            icon: <ChartBarIcon />,
            colors: { bg: 'bg-card-teal-light', text: 'text-primary' }
        },
        {
            title: 'Articles',
            link: '/articles',
            icon: <BookOpenIcon />,
            colors: { bg: 'bg-card-purple-light', text: 'text-card-purple-text' }
        },
        {
            title: 'Profile',
            link: '/profile',
            icon: <UserCircleIcon />,
            colors: { bg: 'bg-card-orange-light', text: 'text-card-orange-text' }
        },
    ];

    return (
        <div className="space-y-8 animate-fadeIn pb-10">
            {/* Header */}
            <header>
                <div className="flex items-center gap-3">
                    <img src={user.avatarUrl} alt="User Avatar" className="w-14 h-14 rounded-full shadow-soft-md border-2 border-white" />
                    <div>
                        <h1 className="text-3xl font-bold text-on-surface">Hello, {user.name.split(' ')[0]}!</h1>
                        <p className="text-on-surface-variant">Welcome back to your health dashboard.</p>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {mainNavItems.slice(0, 3).map(item => (
                    <NavCard
                        key={item.title}
                        title={item.title}
                        icon={item.icon}
                        colorClasses={item.colors}
                        link={item.link}
                    />
                ))}
            </div>

            {isTipLoading ? <RecommendationCardSkeleton /> : <RecommendationCard tip={dailyTip} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {mainNavItems.slice(3).map(item => (
                    <NavCard
                        key={item.title}
                        title={item.title}
                        icon={item.icon}
                        colorClasses={item.colors}
                        link={item.link}
                    />
                ))}
            </div>
             
        </div>
    );
};

export default DashboardPage;