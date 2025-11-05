import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import HealthProfileForm from '../components/forms/HealthProfileForm';
import type { HealthProfile } from '../types';

const HealthProfileSetupPage: React.FC = () => {
    const { user, updateHealthProfile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const initialProfileData: HealthProfile = {
        age: '',
        sex: '',
        height: '',
        weight: '',
        activityLevel: '',
        healthGoals: [],
        dietaryPreferences: '',
        chronicConditions: '',
        allergies: '',
        supplements: '',
    };

    const handleSubmit = async (data: HealthProfile) => {
        setIsSubmitting(true);
        try {
            await updateHealthProfile(data);
            // The App.tsx component will automatically navigate the user away from this page
            // once the profile is updated in the context.
        } catch (error) {
            console.error("Failed to submit health profile:", error);
            // Optionally, show an error message to the user
            alert("Could not save your profile. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-white flex items-center justify-center p-4">
            <div className="w-full max-w-2xl animate-scaleIn">
                 <div className="text-center mb-8">
                     <div className="flex items-center justify-center">
                        <img src="https://www.everlivhealth.online/assets/logo_1756364617629-BwNFO1aW.png" alt="Everliv Health Logo" className="h-10 w-10 mr-3" />
                        <h1 className="text-4xl font-extrabold text-primary tracking-tight">EVERLIV</h1>
                    </div>
                    <p className="text-on-surface-variant mt-2">Welcome, {user.name.split(' ')[0]}!</p>
                </div>
                
                <div className="bg-surface/80 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-soft-lg border border-gray-200/60">
                     <div className="text-center">
                        <h2 className="text-2xl font-bold text-on-surface">Let's set up your Health Profile</h2>
                        <p className="mt-2 text-on-surface-variant max-w-lg mx-auto">
                            To give you the best recommendations, we need a little bit of information about you. This will only take a minute.
                        </p>
                    </div>
                    <div className="mt-8">
                       <HealthProfileForm 
                            initialData={initialProfileData}
                            onSubmit={handleSubmit}
                            submitButtonText={isSubmitting ? "Saving..." : "Complete Profile & Continue"}
                            isSubmitting={isSubmitting}
                       />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthProfileSetupPage;
