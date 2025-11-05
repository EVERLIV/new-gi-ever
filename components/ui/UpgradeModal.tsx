import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
                aria-label={t('common.close')}
            >
                <XMarkIcon className="h-6 w-6 text-on-surface-variant" />
            </button>
            
            <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 border-4 border-primary/20">
                    <SparklesIcon className="h-9 w-9 text-primary" />
                </div>
                <h2 id="upgrade-modal-title" className="text-2xl font-bold text-on-surface">{t('upgradeModal.title')}</h2>
                <p className="mt-2 text-on-surface-variant">{t('upgradeModal.subtitle')}</p>
            </div>

            <ul className="mt-8 space-y-4 text-left">
                <ProFeature>
                    <strong>{t('sidebar.bloodAnalysis')}:</strong> {t('upgradeModal.feature1')}
                </ProFeature>
                <ProFeature>
                    {t('upgradeModal.feature2')}
                </ProFeature>
                <ProFeature>
                    {t('upgradeModal.feature3')}
                </ProFeature>
                 <ProFeature>
                    {t('upgradeModal.feature4')}
                </ProFeature>
            </ul>

            <div className="mt-8">
                <Button onClick={handleUpgrade} className="w-full py-3 text-base font-bold">
                    {t('upgradeModal.upgradeButton')}
                </Button>
            </div>
        </Card>
      </div>
    </div>,
    document.body
  );
};

export default UpgradeModal;