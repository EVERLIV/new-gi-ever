import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon } from '../components/icons/IconComponents';

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('alex.doe@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    
    const from = location.state?.from?.pathname || "/";

    const handleEmailSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isLoginView) {
                await auth.login(email, password);
            } else {
                await auth.register(name, email, password);
            }
            navigate(from, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        setError('');
        try {
            await auth.loginWithGoogle();
            navigate(from, { replace: true });
        } catch (err) {
             setError(err instanceof Error ? err.message : 'An unknown error occurred during Google Sign-in.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setError('');
        setName('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-white flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-scaleIn">
                <div className="text-center mb-8">
                     <div className="flex items-center justify-center">
                        <img src="https://www.everlivhealth.online/assets/logo_1756364617629-BwNFO1aW.png" alt="Everliv Health Logo" className="h-10 w-10 mr-3" />
                        <h1 className="text-4xl font-extrabold text-primary tracking-tight">EVERLIV</h1>
                    </div>
                    <p className="text-on-surface-variant mt-2">{t('header.subtitle')}</p>
                </div>

                <div className="bg-surface/80 backdrop-blur-lg p-8 rounded-2xl shadow-soft-lg border border-gray-200/60">
                    <h2 className="text-xl font-bold text-center text-on-surface mb-6">
                        {isLoginView ? t('login.title') : t('login.createTitle')}
                    </h2>
                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                        {!isLoginView && (
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-on-surface-variant">
                                    {t('login.nameLabel')}
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-on-surface"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant">
                                {t('login.emailLabel')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-on-surface"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-on-surface-variant">
                                {t('login.passwordLabel')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-on-surface"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                        <div>
                             <Button type="submit" isLoading={isLoading} disabled={isGoogleLoading} className="w-full justify-center py-3 text-base">
                                {isLoginView ? t('login.submit') : t('login.createSubmit')}
                            </Button>
                        </div>
                    </form>
                    
                     <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-surface px-2 text-on-surface-variant">{t('common.orContinueWith')}</span>
                        </div>
                    </div>

                    <div>
                        <Button
                            onClick={handleGoogleLogin}
                            isLoading={isGoogleLoading}
                            disabled={isLoading}
                            variant="secondary"
                            className="w-full justify-center py-3 text-base"
                            leftIcon={<GoogleIcon className="h-5 w-5 mr-3" />}
                        >
                            {t('login.googleSubmit')}
                        </Button>
                    </div>

                </div>
                 <div className="mt-8 text-center text-sm text-on-surface-variant">
                    <p>
                        {isLoginView ? t('login.noAccount') : t('login.hasAccount')}
                        <button onClick={toggleView} className="font-medium text-primary hover:text-primary-dark focus:outline-none focus:underline">
                            {isLoginView ? t('login.signup') : t('login.signin')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;