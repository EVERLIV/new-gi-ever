import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HealthProfile } from '../../types';
import Button from '../ui/Button';

const HealthProfileForm: React.FC<{
    initialData: HealthProfile;
    onSubmit: (data: HealthProfile) => void;
    submitButtonText: string;
    onCancel?: () => void;
    isModalVersion?: boolean;
    isSubmitting?: boolean;
}> = ({ initialData, onSubmit, submitButtonText, onCancel, isModalVersion = false, isSubmitting = false }) => {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<HealthProfile>(initialData);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const steps = [
        { id: 1, name: t('healthProfileForm.step1') },
        { id: 2, name: t('healthProfileForm.step2') },
        { id: 3, name: t('healthProfileForm.step3') },
        { id: 4, name: t('healthProfileForm.step4') },
        { id: 5, name: t('healthProfileForm.step5') }
    ];

    const healthGoalOptions = [
        t('healthProfileForm.goalOptions.heart'),
        t('healthProfileForm.goalOptions.weight'),
        t('healthProfileForm.goalOptions.muscle'),
        t('healthProfileForm.goalOptions.sleep'),
        t('healthProfileForm.goalOptions.stress'),
        t('healthProfileForm.goalOptions.energy'),
        t('healthProfileForm.goalOptions.gut'),
        t('healthProfileForm.goalOptions.longevity'),
    ];

    const activityLevelOptions: { value: HealthProfile['activityLevel']; label: string; description: string }[] = [
        { value: 'sedentary', label: t('healthProfileForm.activityOptions.sedentary'), description: t('healthProfileForm.activityOptions.sedentaryDesc') },
        { value: 'light', label: t('healthProfileForm.activityOptions.light'), description: t('healthProfileForm.activityOptions.lightDesc') },
        { value: 'moderate', label: t('healthProfileForm.activityOptions.moderate'), description: t('healthProfileForm.activityOptions.moderateDesc') },
        { value: 'active', label: t('healthProfileForm.activityOptions.active'), description: t('healthProfileForm.activityOptions.activeDesc') },
        { value: 'very_active', label: t('healthProfileForm.activityOptions.very_active'), description: t('healthProfileForm.activityOptions.very_activeDesc') },
    ];

    const ProgressBar: React.FC<{ currentStep: number }> = ({ currentStep }) => {
        const currentStepInfo = steps.find(s => s.id === currentStep);

        return (
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-primary">{currentStepInfo?.name}</h3>
                    <span className="text-sm font-medium text-on-surface-variant">
                        {t('healthProfileForm.stepLabel', { current: currentStep, total: steps.length })}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />
                </div>
            </div>
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const handleActivityLevelChange = (value: HealthProfile['activityLevel']) => {
        setFormData(prev => ({ ...prev, activityLevel: value }));
        if (errors.activityLevel) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.activityLevel;
                return newErrors;
            });
        }
    };

    const handleGoalToggle = (goal: string) => {
        setFormData(prev => {
            const currentGoals = prev.healthGoals || [];
            const isSelected = currentGoals.includes(goal);
            if (isSelected) {
                return { ...prev, healthGoals: currentGoals.filter(g => g !== goal) };
            } else if (currentGoals.length < 3) {
                return { ...prev, healthGoals: [...currentGoals, goal] };
            }
            return prev;
        });
    };

    const validateStep = () => {
        const newErrors: { [key: string]: string } = {};
        if (currentStep === 1) {
            if (!formData.age || formData.age <= 0) newErrors.age = t('healthProfileForm.ageError');
            if (!formData.sex) newErrors.sex = t('healthProfileForm.sexError');
        }
        if (currentStep === 2) {
            if (!formData.height || formData.height <= 0) newErrors.height = t('healthProfileForm.heightError');
            if (!formData.weight || formData.weight <= 0) newErrors.weight = t('healthProfileForm.weightError');
        }
        if (currentStep === 3) {
            if (!formData.activityLevel) newErrors.activityLevel = t('healthProfileForm.activityError');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            if (currentStep < steps.length) {
                setCurrentStep(prev => prev + 1);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { [key: string]: string } = {};
        if (!formData.age || formData.age <= 0) newErrors.age = t('healthProfileForm.ageError');
        if (!formData.sex) newErrors.sex = t('healthProfileForm.sexError');
        if (!formData.height || formData.height <= 0) newErrors.height = t('healthProfileForm.heightError');
        if (!formData.weight || formData.weight <= 0) newErrors.weight = t('healthProfileForm.weightError');
        if (!formData.activityLevel) newErrors.activityLevel = t('healthProfileForm.activityError');

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onSubmit(formData);
        } else {
            if (newErrors.age || newErrors.sex) setCurrentStep(1);
            else if (newErrors.height || newErrors.weight) setCurrentStep(2);
            else if (newErrors.activityLevel) setCurrentStep(3);
        }
    };

    const FormField: React.FC<{ label: string; name: string; error?: string; children: React.ReactNode }> = ({label, name, error, children}) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-on-surface-variant">
                {label}
            </label>
            <div className="mt-1">{children}</div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {!isModalVersion && <ProgressBar currentStep={currentStep} />}

            {currentStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                    <FormField label={t('healthProfileForm.age')} name="age" error={errors.age}>
                        <input type="number" name="age" id="age" value={formData.age} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" />
                    </FormField>
                     <FormField label={t('healthProfileForm.sex')} name="sex" error={errors.sex}>
                        <select name="sex" id="sex" value={formData.sex} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface">
                            <option value="" disabled>{t('healthProfileForm.sexOptions.select')}</option>
                            <option value="male">{t('healthProfileForm.sexOptions.male')}</option>
                            <option value="female">{t('healthProfileForm.sexOptions.female')}</option>
                            <option value="other">{t('healthProfileForm.sexOptions.other')}</option>
                        </select>
                    </FormField>
                </div>
            )}
            
            {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                    <FormField label={t('healthProfileForm.height')} name="height" error={errors.height}>
                         <input type="number" name="height" id="height" value={formData.height} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" />
                    </FormField>
                    <FormField label={t('healthProfileForm.weight')} name="weight" error={errors.weight}>
                         <input type="number" name="weight" id="weight" value={formData.weight} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" />
                    </FormField>
                </div>
            )}
            
            {currentStep === 3 && (
                 <div className="space-y-6 animate-fadeIn">
                    <FormField label={t('healthProfileForm.activity')} name="activityLevel" error={errors.activityLevel}>
                        <div className="grid grid-cols-1 gap-3 mt-2">
                            {activityLevelOptions.map(option => (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => handleActivityLevelChange(option.value)}
                                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${formData.activityLevel === option.value ? 'bg-primary/10 border-primary shadow-soft' : 'bg-gray-50 border-gray-200 hover:border-primary/50'}`}
                                >
                                    <p className="font-semibold text-on-surface">{option.label}</p>
                                    <p className="text-sm text-on-surface-variant">{option.description}</p>
                                </button>
                            ))}
                        </div>
                    </FormField>
                    <FormField label={t('healthProfileForm.diet')} name="dietaryPreferences">
                        <textarea name="dietaryPreferences" id="dietaryPreferences" value={formData.dietaryPreferences} onChange={handleChange} rows={3} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" placeholder={t('healthProfileForm.dietPlaceholder')} />
                    </FormField>
                </div>
            )}
            
            {currentStep === 4 && (
                <div className="animate-fadeIn">
                    <FormField label={t('healthProfileForm.goals')} name="healthGoals">
                        <div className="flex flex-wrap gap-3 mt-2">
                            {healthGoalOptions.map(goal => (
                                <button
                                    type="button"
                                    key={goal}
                                    onClick={() => handleGoalToggle(goal)}
                                    disabled={!formData.healthGoals.includes(goal) && formData.healthGoals.length >= 3}
                                    className={`px-4 py-2 rounded-full border-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${formData.healthGoals.includes(goal) ? 'bg-primary text-white border-primary' : 'bg-surface text-on-surface-variant border-gray-300 hover:border-primary'}`}
                                >
                                    {goal}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-on-surface-variant mt-2">{t('healthProfileForm.goalsHint')}</p>
                    </FormField>
                </div>
            )}

             {currentStep === 5 && (
                <div className="space-y-4 animate-fadeIn">
                     <FormField label={t('healthProfileForm.conditions')} name="chronicConditions">
                        <textarea name="chronicConditions" id="chronicConditions" value={formData.chronicConditions} onChange={handleChange} rows={3} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" placeholder={t('healthProfileForm.conditionsPlaceholder')} />
                    </FormField>
                    <FormField label={t('healthProfileForm.allergies')} name="allergies">
                        <textarea name="allergies" id="allergies" value={formData.allergies} onChange={handleChange} rows={3} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" placeholder={t('healthProfileForm.allergiesPlaceholder')} />
                    </FormField>
                     <FormField label={t('healthProfileForm.supplements')} name="supplements">
                        <textarea name="supplements" id="supplements" value={formData.supplements} onChange={handleChange} rows={3} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" placeholder={t('healthProfileForm.supplementsPlaceholder')} />
                    </FormField>
                </div>
            )}
            
            <div className={`pt-5 flex ${currentStep > 1 || onCancel ? 'justify-between' : 'justify-end'} items-center`}>
                {currentStep > 1 && (
                    <Button type="button" onClick={handleBack} variant="secondary" disabled={isSubmitting}>{t('common.back')}</Button>
                )}
                {onCancel && currentStep === 1 && (
                     <Button type="button" onClick={onCancel} variant="secondary" disabled={isSubmitting}>{t('common.cancel')}</Button>
                )}

                {currentStep < steps.length ? (
                    <Button type="button" onClick={handleNext} disabled={isSubmitting}>{t('common.next')}</Button>
                ) : (
                    <Button type="submit" isLoading={isSubmitting}>{submitButtonText}</Button>
                )}
            </div>
        </form>
    );
};

export default HealthProfileForm;