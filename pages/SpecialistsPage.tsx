import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    UserGroupIcon, 
    DocumentTextIcon, 
    SparklesIcon, 
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    ShieldCheckIcon,
    NoSymbolIcon
} from '../components/icons/IconComponents';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const FeatureCard: React.FC<{
    step: string;
    icon: React.ReactNode;
    title: string;
    text: string;
}> = ({ step, icon, title, text }) => {
    return (
        <Card className="text-center relative overflow-hidden flex flex-col items-center p-6 h-full">
            <span className="absolute -top-4 -right-4 text-7xl font-extrabold text-primary/10 select-none">{step}</span>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-4 border-primary/20">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-on-surface">{title}</h3>
            <p className="mt-2 text-on-surface-variant flex-grow">{text}</p>
        </Card>
    );
};

const TrustFeatureItem: React.FC<{ icon: React.ReactNode; title: string; }> = ({ icon, title }) => (
    <div className="flex flex-col items-center text-center p-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
    </div>
);

const TestimonialCard: React.FC<{
    avatar: string;
    name: string;
    text: string;
}> = ({ avatar, name, text }) => (
    <Card className="h-full flex flex-col">
        <div className="flex items-center mb-4">
            <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover mr-4"/>
            <div>
                <p className="font-bold text-on-surface">{name}</p>
            </div>
        </div>
        <p className="text-on-surface-variant flex-grow">{text}</p>
    </Card>
);


const SpecialistsPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [email, setEmail] = useState(user.email || '');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const trustFeatures = [
        { icon: <ClipboardDocumentListIcon className="h-8 w-8 text-primary" />, title: t('specialistsPage.whyTrustUs.feature1') },
        { icon: <ShieldCheckIcon className="h-8 w-8 text-primary" />, title: t('specialistsPage.whyTrustUs.feature2') },
        { icon: <UserGroupIcon className="h-8 w-8 text-primary" />, title: t('specialistsPage.whyTrustUs.feature3') },
        { icon: <NoSymbolIcon className="h-8 w-8 text-primary" />, title: t('specialistsPage.whyTrustUs.feature4') },
    ];

    const testimonials = [
        { avatar: 'https://i.pravatar.cc/150?u=sam', name: t('specialistsPage.testimonials.t1_name'), text: t('specialistsPage.testimonials.t1_text') },
        { avatar: 'https://i.pravatar.cc/150?u=andrew', name: t('specialistsPage.testimonials.t2_name'), text: t('specialistsPage.testimonials.t2_text') },
        { avatar: 'https://i.pravatar.cc/150?u=alexa', name: t('specialistsPage.testimonials.t3_name'), text: t('specialistsPage.testimonials.t3_text') },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError(t('specialistsPage.invalidEmail'));
            return;
        }

        setIsLoading(true);
        try {
            await apiService.subscribeToSpecialists(email);
            setIsSubscribed(true);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-fadeIn pb-10">
            <header className="text-center">
                <span className="inline-block px-4 py-1 text-sm font-semibold tracking-wider text-primary bg-primary/10 rounded-full mb-4">
                    {t('specialistsPage.comingSoon')}
                </span>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-on-surface tracking-tight">{t('specialistsPage.title')}</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-on-surface-variant">{t('specialistsPage.subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard
                    step="01"
                    icon={<UserGroupIcon className="h-8 w-8 text-primary" />}
                    title={t('specialistsPage.feature1Title')}
                    text={t('specialistsPage.feature1Text')}
                />
                <FeatureCard
                    step="02"
                    icon={<DocumentTextIcon className="h-8 w-8 text-primary" />}
                    title={t('specialistsPage.feature2Title')}
                    text={t('specialistsPage.feature2Text')}
                />
                <FeatureCard
                    step="03"
                    icon={<SparklesIcon className="h-8 w-8 text-primary" />}
                    title={t('specialistsPage.feature3Title')}
                    text={t('specialistsPage.feature3Text')}
                />
            </div>

             {/* Why Trust Us Section */}
            <div className="my-16 sm:my-24">
                <div className="text-center max-w-3xl mx-auto">
                     <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                            <SparklesIcon className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">{t('specialistsPage.whyTrustUs.title')}</h2>
                    <p className="mt-4 text-lg text-on-surface-variant">{t('specialistsPage.whyTrustUs.subtitle')}</p>
                </div>
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {trustFeatures.map((feature, index) => (
                        <TrustFeatureItem key={index} icon={feature.icon} title={feature.title} />
                    ))}
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="my-16 sm:my-24 bg-gradient-to-b from-gray-50/50 to-transparent py-16 rounded-3xl">
                <div className="text-center max-w-3xl mx-auto px-4">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">{t('specialistsPage.testimonials.title')}</h2>
                    <p className="mt-4 text-lg text-on-surface-variant">{t('specialistsPage.testimonials.subtitle')}</p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                    {testimonials.map((testimonial, index) => (
                        <TestimonialCard key={index} {...testimonial} />
                    ))}
                </div>
                <div className="mt-8 flex justify-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                    <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                </div>
            </div>

            <div className="bg-gradient-to-br from-primary/5 via-surface to-surface p-8 rounded-2xl shadow-soft border border-gray-200/60">
                <div className="text-center max-w-xl mx-auto">
                    {isSubscribed ? (
                        <div className="animate-scaleIn">
                            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
                            <h2 className="text-2xl font-bold text-on-surface mt-4">{t('specialistsPage.subscribeSuccessTitle')}</h2>
                            <p className="mt-2 text-on-surface-variant">{t('specialistsPage.subscribeSuccessText')}</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-on-surface">{t('specialistsPage.subscribeTitle')}</h2>
                            <p className="mt-2 text-on-surface-variant">{t('specialistsPage.subscribeText')}</p>

                            <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('specialistsPage.emailPlaceholder')}
                                    required
                                    className="flex-grow block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-on-surface"
                                />
                                <Button type="submit" isLoading={isLoading} className="py-3 text-base">
                                    {t('specialistsPage.subscribeButton')}
                                </Button>
                            </form>
                             {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpecialistsPage;