import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('alex.doe@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    
    const from = location.state?.from?.pathname || "/";

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate API call
        setTimeout(() => {
            // In a real app, you would validate credentials against a backend.
            // Here, we just check if the fields are not empty for demo purposes.
            if (email && password) {
                auth.login(email, password);
                // Send them back to the page they tried to visit before being redirected to login
                navigate(from, { replace: true });
            } else {
                setError('Please enter both email and password.');
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-white flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-scaleIn">
                <div className="text-center mb-8">
                     <div className="flex items-center justify-center">
                        <img src="https://www.everlivhealth.online/assets/logo_1756364617629-BwNFO1aW.png" alt="Everliv Health Logo" className="h-10 w-10 mr-3" />
                        <h1 className="text-4xl font-extrabold text-primary tracking-tight">EVERLIV</h1>
                    </div>
                    <p className="text-on-surface-variant mt-2">Get Your health in Order</p>
                </div>

                <div className="bg-surface/80 backdrop-blur-lg p-8 rounded-2xl shadow-soft-lg border border-gray-200/60">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant">
                                Email address
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
                                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-on-surface-variant">
                                Password
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
                                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div>
                             <Button type="submit" isLoading={isLoading} className="w-full justify-center py-3 text-base">
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </div>
                    </form>
                    <div className="mt-6 text-center text-sm">
                        <p className="text-on-surface-variant">
                            This is a demo. Use any non-empty credentials.
                        </p>
                    </div>
                </div>
                 <div className="mt-8 text-center text-sm text-on-surface-variant">
                    <p>Don't have an account? <a href="#" className="font-medium text-primary hover:text-primary-dark">Sign up</a></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;