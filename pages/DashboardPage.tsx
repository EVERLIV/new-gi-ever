import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getDailyHealthTip, generateDashboardActionPlan } from '../services/geminiService';
import type { Biomarker, BloodTestRecord, ActionPlan } from '../types';
import { apiService } from '../services/apiService';
import {
  SparklesIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  BookOpenIcon,
  ChevronRightIcon,
  LightBulbIcon,
  ClipboardDocumentListIcon,
  BoltIcon,
  CalendarDaysIcon,
} from '../components/icons/IconComponents';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded-md animate-pulse ${className}`} />
);

const RecommendationCard: React.FC<{ tip: string }> = ({ tip }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-gradient-to-r from-primary/90 to-primary p-6 rounded-2xl shadow-soft-md text-white">
            <h3 className="font-bold flex items-center">
                <SparklesIcon className="h-5 w-5 mr-2 text-white/80"/>
                {t('dashboard.recommendationTitle')}
            </h3>
            <div className="mt-2 text-lg min-h-[40px]">
                {tip}
            </div>
        </div>
    );
};

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

const ActionPlanCard: React.FC<{ plan: ActionPlan }> = ({ plan }) => {
    const { t } = useTranslation();
    const sections = [
        { title: t('dashboard.actionPlan.nutrition'), items: plan.nutrition, icon: <ClipboardDocumentListIcon className="h-6 w-6 text-card-blue-text" /> },
        { title: t('dashboard.actionPlan.lifestyle'), items: plan.lifestyle, icon: <BoltIcon className="h-6 w-6 text-card-teal-text" /> },
        { title: t('dashboard.actionPlan.monitoring'), items: plan.monitoring, icon: <CalendarDaysIcon className="h-6 w-6 text-card-purple-text" /> },
    ];

    return (
        <div className="bg-gradient-to-br from-card-blue-from to-card-blue-to rounded-2xl shadow-soft border border-blue-200/80 p-6 flex flex-col">
            <h3 className="font-bold text-card-blue-text text-lg mb-4">
                {t('dashboard.actionPlanTitle')}
            </h3>
            <div className="space-y-5">
                {sections.map(section => (
                    <div key={section.title}>
                        <h4 className="font-semibold text-on-surface flex items-center mb-2">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center mr-3">{section.icon}</span>
                            {section.title}
                        </h4>
                        <ul className="space-y-2 pl-4">
                            {section.items.map((item, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckCircleIcon className="h-5 w-5 text-primary/80 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-on-surface-variant text-sm">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
             <div className="mt-auto text-center pt-6">
                <Link to="/biomarkers" className="inline-flex items-center px-5 py-2 text-sm font-semibold text-primary bg-white/90 rounded-xl shadow-soft hover:bg-white transition-all transform hover:-translate-y-0.5 hover:shadow-soft-md">
                    {t('dashboard.viewAllRecommendations')}
                    <ChevronRightIcon className="w-4 h-4 ml-1.5" />
                </Link>
            </div>
        </div>
    );
};

const ActionPlanCardSkeleton: React.FC = () => (
    <div className="bg-gray-100 rounded-2xl shadow-soft p-6 flex flex-col">
        <Skeleton className="h-6 w-3/4 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="mb-5">
                <div className="flex items-center mb-3">
                    <Skeleton className="h-8 w-8 rounded-full mr-3" />
                    <Skeleton className="h-5 w-1/3" />
                </div>
                <div className="space-y-3 pl-4">
                    <div className="flex items-start">
                        <Skeleton className="h-5 w-5 rounded-full mr-3" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                     <div className="flex items-start">
                        <Skeleton className="h-5 w-5 rounded-full mr-3" />
                        <Skeleton className="h-4 w-4/6" />
                    </div>
                </div>
            </div>
        ))}
        <div className="mt-auto pt-4 flex justify-center">
            <Skeleton className="h-9 w-48 rounded-xl" />
        </div>
    </div>
);


const AttentionBiomarkers: React.FC<{ biomarkers: Biomarker[] }> = ({ biomarkers }) => {
    const { t } = useTranslation();
    const attentionBiomarkers = biomarkers.filter(b => b.status !== 'normal');
    const statusPillColors = {
        borderline: 'bg-yellow-100 text-yellow-800',
        high: 'bg-red-100 text-red-800',
        low: 'bg-blue-100 text-blue-800',
        normal: ''
    };

    return (
        <div className="bg-surface rounded-2xl shadow-soft border border-gray-200/60 p-6">
            <h3 className="font-bold text-on-surface flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                {t('dashboard.attentionBiomarkersTitle')}
            </h3>
            {attentionBiomarkers.length > 0 ? (
                <ul className="mt-4 space-y-3">
                    {attentionBiomarkers.map(marker => (
                        <li key={marker.name}>
                            <Link to={`/biomarkers/${encodeURIComponent(marker.name)}`} className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">{marker.name}</span>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${statusPillColors[marker.status]}`}>{marker.status}</span>
                                </div>
                                <p className="text-sm text-on-surface-variant">{marker.value} {marker.unit}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="mt-4 flex items-center p-4 rounded-lg bg-green-50/80 border border-green-200/80">
                    <CheckCircleIcon className="h-8 w-8 text-green-500 mr-4 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-green-800">{t('dashboard.allNormal')}</p>
                        <p className="text-sm text-green-700">{t('dashboard.allNormalSubtitle')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const AttentionBiomarkersSkeleton: React.FC = () => (
    <div className="bg-surface rounded-2xl shadow-soft border border-gray-200/60 p-6">
         <div className="flex items-center">
            <Skeleton className="h-5 w-5 mr-2 rounded-full" />
            <Skeleton className="h-4 w-48" />
        </div>
        <div className="mt-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-2/5" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-3 w-1/3 mt-1" />
                </div>
            ))}
        </div>
    </div>
);

const HealthChecklist: React.FC = () => {
    const { t } = useTranslation();
    const essentialTests = [
        { name: t('dashboard.essentialTests.cbc'), description: t('dashboard.essentialTests.cbcDesc') },
        { name: t('dashboard.essentialTests.cmp'), description: t('dashboard.essentialTests.cmpDesc') },
        { name: t('dashboard.essentialTests.lipid'), description: t('dashboard.essentialTests.lipidDesc') },
    ];
    return (
        <div className="bg-surface rounded-2xl shadow-soft border border-gray-200/60 p-6">
            <h3 className="font-bold text-on-surface">{t('dashboard.checklistTitle')}</h3>
            <p className="text-sm text-on-surface-variant mt-1">{t('dashboard.checklistSubtitle')}</p>
             <ul className="mt-4 space-y-2 divide-y divide-gray-200/80">
                {essentialTests.map(test => (
                    <li key={test.name} className="py-3 flex items-start justify-between">
                        <div>
                            <p className="font-semibold text-on-surface">{test.name}</p>
                            <p className="text-sm text-on-surface-variant">{test.description}</p>
                        </div>
                        <Link to="/blood-test" className="ml-4 flex-shrink-0">
                            <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                {t('dashboard.addResults')}
                            </button>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const HealthChecklistSkeleton: React.FC = () => (
    <div className="bg-surface rounded-2xl shadow-soft border border-gray-200/60 p-6">
        <Skeleton className="h-5 w-1/3 mb-1" />
        <Skeleton className="h-3 w-3/4 mb-4" />
        <div className="space-y-3 divide-y divide-gray-200/80">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-3 flex justify-between items-start">
                    <div className="w-2/3 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-5/6" />
                    </div>
                    <Skeleton className="h-7 w-20 rounded-lg ml-4" />
                </div>
            ))}
        </div>
    </div>
);

const QuickStartCard: React.FC = () => {
    const { t } = useTranslation();
    const items = [
        { name: t('dashboard.quickStart.bloodAnalysis'), description: t('dashboard.quickStart.bloodAnalysisDesc'), href: '/blood-test', icon: DocumentTextIcon, color: 'bg-card-blue-from text-card-blue-text' },
        { name: t('dashboard.quickStart.aiAssistant'), description: t('dashboard.quickStart.aiAssistantDesc'), href: '/assistant', icon: SparklesIcon, color: 'bg-card-purple-from text-card-purple-text' },
        { name: t('dashboard.quickStart.viewBiomarkers'), description: t('dashboard.quickStart.viewBiomarkersDesc'), href: '/biomarkers', icon: ChartBarIcon, color: 'bg-card-teal-from text-card-teal-text' },
        { name: t('dashboard.quickStart.readArticles'), description: t('dashboard.quickStart.readArticlesDesc'), href: '/articles', icon: BookOpenIcon, color: 'bg-card-orange-from text-card-orange-text' },
    ];

    return (
        <div className="bg-surface rounded-2xl shadow-soft border border-gray-200/60 p-6">
            <h3 className="font-bold text-on-surface">{t('dashboard.quickStartTitle')}</h3>
            <div className="mt-4 space-y-3">
                {items.map(item => (
                    <Link key={item.name} to={item.href} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <div className="ml-4 flex-grow">
                            <p className="font-semibold text-on-surface">{item.name}</p>
                            <p className="text-sm text-on-surface-variant">{item.description}</p>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                ))}
            </div>
        </div>
    );
};

const QuickStartCardSkeleton: React.FC = () => (
    <div className="bg-surface rounded-2xl shadow-soft border border-gray-200/60 p-6">
        <Skeleton className="h-5 w-1/3 mb-4" />
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center p-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="ml-4 flex-grow space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [allBiomarkers, setAllBiomarkers] = useState<Biomarker[]>([]);
    const [dailyTip, setDailyTip] = useState<string>('');
    const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Effect 1: Load core data (biomarkers) from Firestore.
    // This is the fast, essential data needed to render the page quickly.
    useEffect(() => {
        const loadCoreData = async () => {
            setIsLoading(true);
            try {
                const biomarkers = await apiService.getBiomarkers();
                setAllBiomarkers(biomarkers);
            } catch (error) {
                console.error("Error loading core dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user.healthProfile) {
            loadCoreData();
        } else {
            setIsLoading(false); // If no profile, nothing to load.
        }
    }, [user.healthProfile]);

    // Effect 2: Load slower, AI-generated content in the background.
    // This runs after the core data is loaded.
    useEffect(() => {
        // Don't run if core data is still loading or if there's no profile.
        if (isLoading || !user.healthProfile) {
            return;
        }

        const loadAiData = async () => {
            // Generate Action Plan if the user has test history
            try {
                const testHistory = await apiService.getTestHistory();
                if (testHistory.length > 0) {
                    const lastTest = testHistory[testHistory.length - 1];
                    if (lastTest.analysis && lastTest.analysis.summary) {
                         const plan = await generateDashboardActionPlan(user, allBiomarkers, lastTest.analysis.summary);
                         setActionPlan(plan);
                    }
                }
            } catch (error) {
                console.error("Error generating action plan:", error);
            }
           
            // Generate Daily Tip, checking cache first
            try {
                const today = new Date().toISOString().split('T')[0];
                const DAILY_TIP_STORAGE_KEY = 'everliv_health_daily_tip';
                let tip = '';
                const storedTip = window.localStorage.getItem(DAILY_TIP_STORAGE_KEY);
                if (storedTip) {
                    const cachedTipData = JSON.parse(storedTip);
                    if (cachedTipData && cachedTipData.date === today && cachedTipData.tip) {
                        tip = cachedTipData.tip;
                    }
                }
                
                if (!tip) {
                    tip = await getDailyHealthTip(user, allBiomarkers);
                    window.localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify({ tip, date: today }));
                }
                setDailyTip(tip);
            } catch (error) {
                 console.error("Error generating daily tip:", error);
                 // Provide a fallback tip on error
                 setDailyTip(t('assistant.generalError'));
            }
        };
        
        loadAiData();
    }, [isLoading, allBiomarkers, user, t]);
    

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-10">
            <header>
                <div>
                    <h1 className="text-3xl font-bold text-on-surface">{t('dashboard.greeting', { name: user.name.split(' ')[0] })}</h1>
                    <p className="text-on-surface-variant">{t('dashboard.welcome')}</p>
                </div>
            </header>

            {isLoading ? <QuickStartCardSkeleton /> : <QuickStartCard />}
            
            {dailyTip ? <RecommendationCard tip={dailyTip} /> : <RecommendationCardSkeleton />}
            
            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {actionPlan ? <ActionPlanCard plan={actionPlan} /> : <ActionPlanCardSkeleton />}
                    {isLoading ? <AttentionBiomarkersSkeleton /> : <AttentionBiomarkers biomarkers={allBiomarkers} />}
                </div>
                <div className="lg:col-span-1 space-y-6">
                     {isLoading ? <HealthChecklistSkeleton /> : <HealthChecklist />}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;