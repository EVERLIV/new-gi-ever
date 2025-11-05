import React, { useState } from 'react';
import type { HealthProfile } from '../../types';
import Button from '../ui/Button';

interface HealthProfileFormProps {
    initialData: HealthProfile;
    onSubmit: (data: HealthProfile) => void;
    submitButtonText: string;
    onCancel?: () => void;
    isModalVersion?: boolean;
    isSubmitting?: boolean;
}

const steps = [
    { id: 1, name: 'Basics' },
    { id: 2, name: 'Metrics' },
    { id: 3, name: 'Lifestyle' },
    { id: 4, name: 'Goals' },
    { id: 5, name: 'Medical' }
];

const healthGoalOptions = [
    'Improve heart health',
    'Lose weight',
    'Build muscle',
    'Improve sleep',
    'Reduce stress',
    'Increase energy levels',
    'Improve gut health',
    'Longevity & anti-aging',
];

const activityLevelOptions: { value: HealthProfile['activityLevel']; label: string; description: string }[] = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
    { value: 'light', label: 'Light', description: 'Light exercise/sports 1-3 days/week' },
    { value: 'moderate', label: 'Moderate', description: 'Moderate exercise/sports 3-5 days/week' },
    { value: 'active', label: 'Active', description: 'Hard exercise/sports 6-7 days/week' },
    { value: 'very_active', label: 'Very Active', description: 'Very hard exercise & physical job' },
];

const ProgressBar: React.FC<{ currentStep: number }> = ({ currentStep }) => {
    const currentStepInfo = steps.find(s => s.id === currentStep);

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-primary">{currentStepInfo?.name}</h3>
                <span className="text-sm font-medium text-on-surface-variant">
                    Step {currentStep} of {steps.length}
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


const HealthProfileForm: React.FC<HealthProfileFormProps> = ({ initialData, onSubmit, submitButtonText, onCancel, isModalVersion = false, isSubmitting = false }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<HealthProfile>(initialData);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field if it exists
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
        // Clear error for this field if it exists
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
            if (!formData.age || formData.age <= 0) newErrors.age = "A valid age is required.";
            if (!formData.sex) newErrors.sex = "Sex is required.";
        }
        if (currentStep === 2) {
            if (!formData.height || formData.height <= 0) newErrors.height = "A valid height is required.";
            if (!formData.weight || formData.weight <= 0) newErrors.weight = "A valid weight is required.";
        }
        if (currentStep === 3) {
            if (!formData.activityLevel) newErrors.activityLevel = "An activity level is required.";
        }
        // Step 4 and 5 have optional fields, so no validation needed unless specified
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
        // Final validation of all required fields before submitting
        const newErrors: { [key: string]: string } = {};
        if (!formData.age || formData.age <= 0) newErrors.age = "A valid age is required.";
        if (!formData.sex) newErrors.sex = "Sex is required.";
        if (!formData.height || formData.height <= 0) newErrors.height = "A valid height is required.";
        if (!formData.weight || formData.weight <= 0) newErrors.weight = "A valid weight is required.";
        if (!formData.activityLevel) newErrors.activityLevel = "An activity level is required.";

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onSubmit(formData);
        } else {
            // If there are errors from any step, navigate to the first problematic step
            if (newErrors.age || newErrors.sex) {
                setCurrentStep(1);
            } else if (newErrors.height || newErrors.weight) {
                setCurrentStep(2);
            } else if (newErrors.activityLevel) {
                setCurrentStep(3);
            }
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
                    <FormField label="Age" name="age" error={errors.age}>
                        <input type="number" name="age" id="age" value={formData.age} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2" />
                    </FormField>
                     <FormField label="Biological Sex" name="sex" error={errors.sex}>
                        <select name="sex" id="sex" value={formData.sex} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2">
                            <option value="" disabled>Select...</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </FormField>
                </div>
            )}
            
            {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                    <FormField label="Height (cm)" name="height" error={errors.height}>
                         <input type="number" name="height" id="height" value={formData.height} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2" />
                    </FormField>
                    <FormField label="Weight (kg)" name="weight" error={errors.weight}>
                         <input type="number" name="weight" id="weight" value={formData.weight} onChange={handleChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2" />
                    </FormField>
                </div>
            )}
            
            {currentStep === 3 && (
                 <div className="space-y-6 animate-fadeIn">
                    <FormField label="How active are you?" name="activityLevel" error={errors.activityLevel}>
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
                    <FormField label="Dietary Preferences (Optional)" name="dietaryPreferences">
                        <textarea name="dietaryPreferences" id="dietaryPreferences" value={formData.dietaryPreferences} onChange={handleChange} rows={3} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2" placeholder="e.g., Vegetarian, gluten-free, low-carb..." />
                    </FormField>
                </div>
            )}
            
            {currentStep === 4 && (
                <div className="animate-fadeIn">
                    <FormField label="What are your main health goals?" name="healthGoals">
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
                        <p className="text-xs text-on-surface-variant mt-2">Select up to 3.</p>
                    </FormField>
                </div>
            )}

             {currentStep === 5 && (
                <div className="space-y-4 animate-fadeIn">
                     <FormField label="Any chronic conditions? (Optional)" name="chronicConditions">
                        <textarea name="chronicConditions" id="chronicConditions" value={formData.chronicConditions} onChange={handleChange} rows={3} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2" placeholder="e.g., Type 2 Diabetes, high blood pressure..." />
                    </FormField>
                    <FormField label="Any known allergies? (Optional)" name="allergies">
                        <textarea name="allergies" id="allergies" value={formData.allergies} onChange={handleChange} rows={3} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2" placeholder="e.g., Peanuts, penicillin, pollen..." />
                    </FormField>
                     <FormField label="Any vitamins or supplements you take regularly? (Optional)" name="supplements">
                        <textarea name="supplements" id="supplements" value={formData.supplements} onChange={handleChange} rows={3} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2" placeholder="e.g., Vitamin D, fish oil, protein powder..." />
                    </FormField>
                </div>
            )}
            
            <div className={`pt-5 flex ${currentStep > 1 || onCancel ? 'justify-between' : 'justify-end'} items-center`}>
                {currentStep > 1 && (
                    <Button type="button" onClick={handleBack} variant="secondary" disabled={isSubmitting}>Back</Button>
                )}
                {onCancel && currentStep === 1 && (
                     <Button type="button" onClick={onCancel} variant="secondary" disabled={isSubmitting}>Cancel</Button>
                )}

                {currentStep < steps.length ? (
                    <Button type="button" onClick={handleNext} disabled={isSubmitting}>Next</Button>
                ) : (
                    <Button type="submit" isLoading={isSubmitting}>{submitButtonText}</Button>
                )}
            </div>
        </form>
    );
};

export default HealthProfileForm;
