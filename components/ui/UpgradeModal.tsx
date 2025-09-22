import React from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';
import Card from './Card';
import { XMarkIcon, CheckCircleIcon, SparklesIcon } from '../icons/IconComponents';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProFeature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start">
        <CheckCircleIcon className="h-6 w-6 text-primary flex-shrink-0 mr-3 mt-1" />
        <span className="text-on-surface-variant">{children}</span>
    </li>
);

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { upgradeToPro } = useAuth();

  if (!isOpen) {
    return null;
  }

  const handleUpgrade = () => {
    upgradeToPro();
    onClose();
  };

  return createPortal(
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
    >
      <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
        <Card className="animate-scaleIn relative">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
            >
                <XMarkIcon className="h-6 w-6 text-on-surface-variant" />
            </button>
            
            <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 border-4 border-primary/20">
                    <SparklesIcon className="h-9 w-9 text-primary" />
                </div>
                <h2 id="upgrade-modal-title" className="text-2xl font-bold text-on-surface">Upgrade to EVERLIV PRO</h2>
                <p className="mt-2 text-on-surface-variant">Unlock your full health potential with our advanced features.</p>
            </div>

            <ul className="mt-8 space-y-4 text-left">
                <ProFeature>
                    <strong>AI Blood Analysis:</strong> Get detailed insights from your test results.
                </ProFeature>
                <ProFeature>
                    <strong>Unlimited Biomarker Tracking:</strong> Monitor all your key health indicators over time.
                </ProFeature>
                <ProFeature>
                    <strong>Personalized Health Dashboard:</strong> See your health overview at a glance.
                </ProFeature>
                 <ProFeature>
                    <strong>Curated Health Articles:</strong> Access our full library of wellness content.
                </ProFeature>
            </ul>

            <div className="mt-8">
                <Button onClick={handleUpgrade} className="w-full py-3 text-base font-bold">
                    Upgrade Now
                </Button>
            </div>
        </Card>
      </div>
    </div>,
    document.body
  );
};

export default UpgradeModal;