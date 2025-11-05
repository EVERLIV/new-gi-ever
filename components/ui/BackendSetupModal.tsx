import React, { useState } from 'react';
import Button from './Button';

interface BackendSetupModalProps {
    onSave: (url: string) => void;
}

const BackendSetupModal: React.FC<BackendSetupModalProps> = ({ onSave }) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!url.trim() || !url.startsWith('http')) {
            setError('Please enter a valid URL (e.g., https://api.example.com)');
            return;
        }

        onSave(url.trim());
    };

    return (
        <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
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
                         <div className="text-center">
                            <h2 className="text-xl font-bold text-on-surface">Connect to Backend</h2>
                            <p className="mt-2 text-on-surface-variant">
                                Please provide the API URL for your Yandex Cloud backend to continue.
                            </p>
                        </div>
                        <div>
                            <label htmlFor="backend-url" className="block text-sm font-medium text-on-surface-variant">
                                Backend API URL
                            </label>
                            <div className="mt-1">
                                <input
                                    id="backend-url"
                                    name="backend-url"
                                    type="url"
                                    autoComplete="off"
                                    required
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="https://your-api-gateway-id.apigateway.yandexcloud.net"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                        <div>
                             <Button type="submit" className="w-full justify-center py-3 text-base">
                                Connect & Start
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BackendSetupModal;
