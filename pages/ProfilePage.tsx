import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { ArrowDownTrayIcon, TrashIcon, ArrowRightOnRectangleIcon, XMarkIcon, ExclamationTriangleIcon, Cog6ToothIcon, SparklesIcon } from '../components/icons/IconComponents';
import HealthProfileForm from '../components/forms/HealthProfileForm';
import type { HealthProfile, User } from '../types';

const AVATARS = [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Yoga
    'https://images.unsplash.com/photo-1530037594992-58d35a9fe272?q=80&w=400&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Running
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Healthy food
    'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=400&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Hiking
    'https://images.unsplash.com/photo-1506126613408-4e05860f5d58?q=80&w=400&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'  // Meditation
];

const EditAccountModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSave: (data: { name: string; avatarUrl: string }) => Promise<void>;
}> = ({ isOpen, onClose, user, onSave }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(user.name);
    const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        await onSave({ name, avatarUrl: selectedAvatar });
        setIsSaving(false);
    };

    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div className="w-full max-w-lg bg-surface rounded-2xl shadow-soft-lg flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">{t('profile.editAccount')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="h-6 w-6"/>
                    </button>
                </div>
                <div className="overflow-y-auto p-6 space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-variant">
                            {t('profile.nameLabel')}
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant">
                            {t('profile.avatarLabel')}
                        </label>
                        <div className="mt-2 grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4">
                            {AVATARS.map((avatar, index) => (
                                <button key={index} onClick={() => setSelectedAvatar(avatar)} className={`relative w-full aspect-square rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all ${selectedAvatar === avatar ? 'ring-2 ring-offset-2 ring-primary' : ''}`}>
                                    <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full rounded-full object-cover"/>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end items-center p-4 border-t bg-gray-50/50 rounded-b-2xl">
                    <Button onClick={onClose} variant="secondary" className="mr-3" disabled={isSaving}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSave} isLoading={isSaving} disabled={!name.trim()}>
                        {t('common.saveChanges')}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}


const EditProfileModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    profile: HealthProfile;
    onSave: (data: HealthProfile) => void;
}> = ({ isOpen, onClose, profile, onSave }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-soft-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">{t('profile.editProfile')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="h-6 w-6"/>
                    </button>
                </div>
                <div className="overflow-y-auto p-6">
                    <HealthProfileForm
                        initialData={profile}
                        onSubmit={onSave}
                        onCancel={onClose}
                        submitButtonText={t('common.saveChanges')}
                        isModalVersion={true}
                    />
                </div>
            </div>
        </div>,
        document.body
    )
}

const ProfilePage: React.FC = () => {
    const { user, logout, updateHealthProfile, updateUserProfile, subscriptionStatus, subscriptionExpiry, openUpgradeModal } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleExportData = async () => {
        try {
            const dataToExport = await apiService.exportAllData();
            if (Object.keys(dataToExport).length === 0) {
                alert('Нет данных для экспорта.');
                return;
            }
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `everliv_health_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting data:", error);
            alert(t('profile.exportError'));
        }
    };
    
    const handleClearData = async () => {
        if (window.confirm(t('profile.clearConfirm'))) {
            try {
                await apiService.deleteAllData();
                alert(t('profile.clearSuccess'));
                logout();
                window.location.reload();
            } catch (error) {
                console.error("Error clearing data:", error);
                alert(t('profile.clearError'));
            }
        }
    };
    
    const handleSaveProfile = async (data: HealthProfile) => {
        try {
            await updateHealthProfile(data);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Failed to save profile:", error);
        }
    };
    
    const handleSaveAccount = async (data: { name: string; avatarUrl: string }) => {
        try {
            await updateUserProfile(data);
            setIsEditAccountModalOpen(false);
        } catch (error) {
            console.error("Failed to update profile:", error);
        }
    };

    const formattedExpiryDate = subscriptionExpiry
        ? subscriptionExpiry.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : null;

    const InfoField: React.FC<{ label: string; value?: string | number | string[]; className?: string }> = ({ label, value, className = '' }) => {
        const displayValue = Array.isArray(value) && value.length > 0 ? value.join(', ') : value;
        const finalValue = displayValue || 'Не указано';
        return (
            <div className={className}>
                <p className="text-sm text-on-surface-variant">{label}</p>
                <p className="font-semibold text-on-surface capitalize whitespace-pre-wrap">{finalValue}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{t('profile.title')}</h1>
                <p className="text-on-surface-variant mt-1">{t('profile.subtitle')}</p>
            </div>
            
            <Card>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-on-surface">{t('profile.accountInfo')}</h2>
                        <p className="text-sm text-on-surface-variant mt-1">{t('profile.accountInfoSubtitle')}</p>
                    </div>
                    <Button onClick={() => setIsEditAccountModalOpen(true)} variant="secondary">{t('common.edit')}</Button>
                </div>
                <div className="border-t border-gray-200/80 pt-4">
                    <div className="flex items-center space-x-4">
                        <img src={user.avatarUrl} alt="User avatar" className="w-16 h-16 rounded-full object-cover"/>
                        <div>
                            <p className="font-bold text-on-surface">{user.name}</p>
                            <p className="text-sm text-on-surface-variant">{user.email}</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Button onClick={handleLogout} variant="secondary" leftIcon={<ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />}>
                            {t('sidebar.logout')}
                        </Button>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-semibold text-on-surface">{t('profile.subscriptionManagement')}</h2>
                <p className="text-sm text-on-surface-variant mt-1">{t('profile.subscriptionManagementSubtitle')}</p>
                <div className="mt-6 border-t pt-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <div>
                            <p className="text-sm text-on-surface-variant">{t('profile.currentStatus')}</p>
                            {subscriptionStatus === 'pro' ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-3 py-1 text-sm font-bold bg-primary/10 text-primary rounded-full">{t('common.pro')}</span>
                                    {formattedExpiryDate && (
                                        <p className="font-semibold text-on-surface">{t('profile.expiresOn', { date: formattedExpiryDate })}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="font-bold text-lg text-on-surface mt-1">{t('profile.statusFree')}</p>
                            )}
                        </div>
                        {subscriptionStatus === 'free' && (
                            <div className="mt-4 sm:mt-0">
                                <Button onClick={openUpgradeModal} leftIcon={<SparklesIcon className="h-5 w-5 mr-2" />}>
                                    {t('profile.upgradeToPro')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {user.healthProfile && (
                 <Card>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-semibold text-on-surface">{t('profile.healthProfile')}</h2>
                            <p className="text-sm text-on-surface-variant mt-1">{t('profile.healthProfileSubtitle')}</p>
                        </div>
                        <Button onClick={() => setIsEditModalOpen(true)} variant="secondary">{t('common.edit')}</Button>
                    </div>
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-6 border-t pt-6">
                        <InfoField label={t('healthProfileForm.age')} value={user.healthProfile.age} />
                        <InfoField label={t('healthProfileForm.sex')} value={user.healthProfile.sex} />
                        <InfoField label={t('healthProfileForm.activity')} value={user.healthProfile.activityLevel.replace('_', ' ')} />
                        <InfoField label={t('healthProfileForm.height')} value={user.healthProfile.height ? `${user.healthProfile.height} cm` : ''} />
                        <InfoField label={t('healthProfileForm.weight')} value={user.healthProfile.weight ? `${user.healthProfile.weight} kg` : ''} />
                        <InfoField label={t('healthProfileForm.goals')} value={user.healthProfile.healthGoals.map(g => t(`healthProfileForm.goalOptions.${g.split(' ')[0].toLowerCase()}`, g))} />
                    </div>
                     <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                        <InfoField label={t('healthProfileForm.conditions')} value={user.healthProfile.chronicConditions} />
                        <InfoField label={t('healthProfileForm.allergies')} value={user.healthProfile.allergies} />
                    </div>
                     <div className="mt-6 border-t pt-6">
                        <InfoField label={t('healthProfileForm.supplements')} value={user.healthProfile.supplements} />
                    </div>
                     <div className="mt-6 border-t pt-6">
                        <InfoField label={t('healthProfileForm.diet')} value={user.healthProfile.dietaryPreferences} />
                    </div>
                </Card>
            )}

            <Card>
                <h2 className="text-lg font-semibold text-on-surface">{t('profile.dataManagement')}</h2>
                <p className="text-sm text-on-surface-variant mt-1">{t('profile.dataManagementSubtitle')}</p>
                <div className="mt-6 flex">
                    <Button onClick={handleExportData} variant="secondary" leftIcon={<ArrowDownTrayIcon className="h-5 w-5 mr-2" />}>
                        {t('profile.exportMyData')}
                    </Button>
                </div>
            </Card>
            
            <Card>
                <h2 className="text-lg font-semibold text-red-600">{t('profile.dangerZone')}</h2>
                <div className="mt-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                            <p className="font-medium text-on-surface">{t('profile.clearAllData')}</p>
                            <p className="text-sm text-on-surface-variant mt-1">{t('profile.clearAllDataSubtitle')}</p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex-shrink-0">
                            <Button onClick={handleClearData} variant="danger" leftIcon={<TrashIcon className="h-5 w-5 mr-2" />}>
                                {t('profile.clearAllDataButton')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            <EditAccountModal 
                isOpen={isEditAccountModalOpen}
                onClose={() => setIsEditAccountModalOpen(false)}
                user={user}
                onSave={handleSaveAccount}
            />

            {user.healthProfile && 
                <EditProfileModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)}
                    profile={user.healthProfile}
                    onSave={handleSaveProfile}
                />
            }
        </div>
    );
};

export default ProfilePage;