import React, { createContext, useState, useContext, useEffect } from 'react';
import type { User, HealthProfile } from '../types';
import { MessageSender } from '../types';

type SubscriptionStatus = 'free' | 'pro';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User;
  subscriptionStatus: SubscriptionStatus;
  isUpgradeModalOpen: boolean;
  isProfileComplete: boolean;
  login: (email: string, a: string) => void;
  logout: () => void;
  upgradeToPro: () => void;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  updateHealthProfile: (profile: HealthProfile) => void;
}

// A mock user for demonstration purposes
const MOCK_USER: Omit<User, 'healthProfile'> = {
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    avatarUrl: 'https://picsum.photos/100',
};

const AuthContext = createContext<AuthContextType | null>(null);

const doesDemoDataExist = () => {
    return !!localStorage.getItem('everliv_health_profile');
};

const generateMockData = () => {
    try {
        // 1. Health Profile
        const mockProfile: HealthProfile = {
            age: 34,
            sex: 'male',
            height: 180,
            weight: 82,
            activityLevel: 'moderate',
            healthGoals: ['Improve heart health', 'Increase energy levels'],
            dietaryPreferences: 'Low-carb, focuses on whole foods.',
            chronicConditions: 'None reported',
            allergies: 'Seasonal pollen',
            supplements: 'Vitamin D (2000 IU), Omega-3 Fish Oil',
        };
        localStorage.setItem('everliv_health_profile', JSON.stringify(mockProfile));

        // 2. Test History & Biomarkers (interlinked)
        const date1 = new Date('2023-11-15T10:00:00.000Z').toISOString();
        const date2 = new Date('2024-02-20T10:00:00.000Z').toISOString();
        const date3 = new Date('2024-05-01T10:00:00.000Z').toISOString();

        const mockTestHistory = [
            {
                id: 'test-1', date: date1,
                analysis: {
                    summary: 'This initial test shows elevated LDL cholesterol and low Vitamin D, suggesting areas for lifestyle and dietary improvements. Other markers are within normal ranges.',
                    biomarkers: [
                        { name: 'LDL Cholesterol', value: '130', unit: 'mg/dL', range: '0-100 mg/dL', explanation: 'LDL cholesterol is often called "bad" cholesterol.', status: 'high' as const },
                        { name: 'Vitamin D', value: '25', unit: 'ng/mL', range: '30-100 ng/mL', explanation: 'Essential for bone health and immune function.', status: 'low' as const },
                        { name: 'Glucose', value: '88', unit: 'mg/dL', range: '70-99 mg/dL', explanation: 'Measures the amount of sugar in your blood.', status: 'normal' as const },
                        { name: 'Hemoglobin A1c', value: '5.2', unit: '%', range: '< 5.7%', explanation: 'Provides an average of your blood sugar over the past 2-3 months.', status: 'normal' as const },
                    ],
                    recommendations: ['Focus on reducing saturated fats.', 'Consider a Vitamin D supplement.', 'Incorporate more leafy greens into your diet.']
                }
            },
            {
                id: 'test-2', date: date2,
                analysis: {
                    summary: 'Follow-up test shows positive progress. LDL cholesterol has decreased, and Vitamin D levels are improving. Continued focus on diet and lifestyle is recommended.',
                    biomarkers: [
                        { name: 'LDL Cholesterol', value: '110', unit: 'mg/dL', range: '0-100 mg/dL', explanation: 'LDL cholesterol is often called "bad" cholesterol.', status: 'borderline' as const },
                        { name: 'Vitamin D', value: '38', unit: 'ng/mL', range: '30-100 ng/mL', explanation: 'Essential for bone health and immune function.', status: 'normal' as const },
                        { name: 'Glucose', value: '90', unit: 'mg/dL', range: '70-99 mg/dL', explanation: 'Measures the amount of sugar in your blood.', status: 'normal' as const },
                        { name: 'Hemoglobin A1c', value: '5.3', unit: '%', range: '< 5.7%', explanation: 'Provides an average of your blood sugar over the past 2-3 months.', status: 'normal' as const },
                    ],
                    recommendations: ['Continue with the current diet plan.', 'Maintain regular exercise.', 'Ensure consistent Vitamin D supplementation.']
                }
            },
            {
                id: 'test-3', date: date3,
                analysis: {
                    summary: 'Excellent results. LDL cholesterol is now within the normal range, and Vitamin D levels are optimal. All markers look healthy.',
                    biomarkers: [
                        { name: 'LDL Cholesterol', value: '95', unit: 'mg/dL', range: '0-100 mg/dL', explanation: 'LDL cholesterol is often called "bad" cholesterol.', status: 'normal' as const },
                        { name: 'Vitamin D', value: '45', unit: 'ng/mL', range: '30-100 ng/mL', explanation: 'Essential for bone health and immune function.', status: 'normal' as const },
                        { name: 'Glucose', value: '89', unit: 'mg/dL', range: '70-99 mg/dL', explanation: 'Measures the amount of sugar in your blood.', status: 'normal' as const },
                        { name: 'Hemoglobin A1c', value: '5.1', unit: '%', range: '< 5.7%', explanation: 'Provides an average of your blood sugar over the past 2-3 months.', status: 'normal' as const },
                    ],
                    recommendations: ['Maintain current lifestyle habits.', 'Continue monitoring key biomarkers in 6-12 months.', 'Great job on improving your health metrics!']
                }
            },
        ];
        localStorage.setItem('everliv_health_test_history', JSON.stringify(mockTestHistory));

        const mockBiomarkers = [
            {
                name: 'LDL Cholesterol', value: '95', unit: 'mg/dL', status: 'normal', range: '0-100 mg/dL',
                description: 'LDL cholesterol is often called "bad" cholesterol because high levels can lead to a buildup of plaque in your arteries, increasing your risk of heart disease and stroke.',
                trend: 'down', lastUpdated: date3,
                history: [
                    { value: 130, date: date1, sourceTestId: 'test-1' },
                    { value: 110, date: date2, sourceTestId: 'test-2' },
                    { value: 95, date: date3, sourceTestId: 'test-3' },
                ],
                recommendations: {
                    nutrition: ['Increase intake of soluble fiber from oats, apples, and beans.', 'Choose healthy fats like those in avocados, nuts, and olive oil.'],
                    lifestyle: ['Engage in at least 150 minutes of moderate-intensity aerobic exercise per week.', 'Maintain a healthy weight.'],
                    supplements: ['Consider plant sterols and stanols. Always consult a doctor before starting.'],
                    next_checkup: 'In 6-12 months to monitor levels.'
                }
            },
            {
                name: 'Vitamin D', value: '45', unit: 'ng/mL', status: 'normal', range: '30-100 ng/mL',
                description: 'Vitamin D is a fat-soluble vitamin that is essential for bone health, immune function, and cell growth. It helps the body absorb calcium.',
                trend: 'up', lastUpdated: date3,
                history: [
                    { value: 25, date: date1, sourceTestId: 'test-1' },
                    { value: 38, date: date2, sourceTestId: 'test-2' },
                    { value: 45, date: date3, sourceTestId: 'test-3' },
                ],
                recommendations: {
                    nutrition: ['Eat fatty fish like salmon and mackerel.', 'Look for fortified foods like milk, orange juice, and cereals.'],
                    lifestyle: ['Get sensible sun exposure (10-30 minutes of midday sun, several times per week).'],
                    supplements: ['Continue with your Vitamin D supplement as advised by your doctor.'],
                    next_checkup: 'Annually, or as recommended by your doctor.'
                }
            },
            {
                name: 'Glucose', value: '89', unit: 'mg/dL', status: 'normal', range: '70-99 mg/dL',
                description: 'This test measures the amount of glucose (sugar) in your blood. It is a primary screening tool for diabetes.',
                trend: 'stable', lastUpdated: date3,
                history: [
                    { value: 88, date: date1, sourceTestId: 'test-1' },
                    { value: 90, date: date2, sourceTestId: 'test-2' },
                    { value: 89, date: date3, sourceTestId: 'test-3' },
                ],
                recommendations: {
                    nutrition: ['Focus on a balanced diet with whole grains, lean proteins, and plenty of vegetables.', 'Limit sugary drinks and processed foods.'],
                    lifestyle: ['Regular physical activity helps your body use insulin more effectively.', 'Manage stress levels through practices like mindfulness or yoga.'],
                    supplements: ['Generally not needed for glucose control unless advised by a doctor for specific conditions.'],
                    next_checkup: 'During your next routine physical exam.'
                }
            },
            {
                name: 'Hemoglobin A1c', value: '5.1', unit: '%', status: 'normal', range: '< 5.7%',
                description: 'The A1c test provides an average of your blood sugar levels over the past 2 to 3 months, offering a longer-term view of glucose control.',
                trend: 'stable', lastUpdated: date3,
                history: [
                    { value: 5.2, date: date1, sourceTestId: 'test-1' },
                    { value: 5.3, date: date2, sourceTestId: 'test-2' },
                    { value: 5.1, date: date3, sourceTestId: 'test-3' },
                ],
                recommendations: {
                    nutrition: ['Maintain a consistent intake of complex carbohydrates.', 'Avoid large portions of refined sugars and grains.'],
                    lifestyle: ['Combine aerobic exercise with resistance training for optimal blood sugar management.'],
                    supplements: ['Consult a healthcare professional for any supplement advice.'],
                    next_checkup: 'Every 1-2 years as part of a routine check-up.'
                }
            }
        ];
        localStorage.setItem('everliv_health_biomarkers', JSON.stringify(mockBiomarkers));

        // 3. Alerts
        const mockAlerts = [
            { biomarkerName: 'LDL Cholesterol', enabled: true, thresholdAbove: 100 },
            { biomarkerName: 'Glucose', enabled: false },
            { biomarkerName: 'Vitamin D', enabled: true, thresholdBelow: 30 },
            { biomarkerName: 'Hemoglobin A1c', enabled: false }
        ];
        localStorage.setItem('everliv_health_alerts', JSON.stringify(mockAlerts));

        // 4. Chat History
        const mockChatHistory = [
          { sender: MessageSender.AI, text: "Hello! I'm your AI Health Assistant. How can I help you today?" },
          { sender: MessageSender.USER, text: "What are some good sources of Vitamin D?" },
          { sender: MessageSender.AI, text: "Great question! Some of the best sources of Vitamin D include fatty fish like salmon and mackerel, fortified milk and cereals, and egg yolks. Your body also produces Vitamin D when your skin is exposed to sunlight. Based on your profile, spending about 15-20 minutes in the sun a few times a week could be beneficial, but always remember to use sunscreen!" }
        ];
        localStorage.setItem('everliv_health_chat_history', JSON.stringify(mockChatHistory));

        // 5. Article Likes
        const mockLikes = ['The Benefits of a Mediterranean Diet'];
        localStorage.setItem('everliv_health_article_likes', JSON.stringify(mockLikes));

    } catch (error) {
        console.error("Failed to generate and save mock data:", error);
    }
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User>({ ...MOCK_USER, healthProfile: undefined });
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('free');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for auth and subscription state in localStorage on initial load
    try {
      const storedAuthState = localStorage.getItem('everliv_auth');
      if (storedAuthState) {
        setIsAuthenticated(JSON.parse(storedAuthState));
      }

      const storedSubState = localStorage.getItem('everliv_subscription');
      if (storedSubState) {
        setSubscriptionStatus(JSON.parse(storedSubState));
      }
      
      const storedProfile = localStorage.getItem('everliv_health_profile');
      if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          setUser(prev => ({ ...prev, healthProfile: profile }));
          // A simple check: if age is filled, consider profile complete
          if (profile.age) {
              setIsProfileComplete(true);
          }
      }

    } catch (error) {
      console.error("Could not parse state from localStorage", error);
    }
    setLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    console.log(`Simulating login for ${email}`);
    
    // Generate demo data if it's the first time logging in
    if (!doesDemoDataExist()) {
        generateMockData();
    }

    setIsAuthenticated(true);
    // New users default to 'free' plan
    setSubscriptionStatus('free'); 
    localStorage.setItem('everliv_auth', 'true');
    localStorage.setItem('everliv_subscription', JSON.stringify('free'));
    
    // Check for profile. If not present, isProfileComplete remains false.
    const storedProfile = localStorage.getItem('everliv_health_profile');
    if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setUser({ ...MOCK_USER, healthProfile: profile });
        setIsProfileComplete(!!profile.age);
    } else {
        setUser({ ...MOCK_USER, healthProfile: undefined });
        setIsProfileComplete(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('everliv_auth');
    localStorage.removeItem('everliv_subscription');
    // Keep demo data on logout for easy re-login/demo
    // localStorage.removeItem('everliv_health_profile');
  };
  
  const upgradeToPro = () => {
    setSubscriptionStatus('pro');
    localStorage.setItem('everliv_subscription', JSON.stringify('pro'));
  };

  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);

  const updateHealthProfile = (profile: HealthProfile) => {
    localStorage.setItem('everliv_health_profile', JSON.stringify(profile));
    setUser(prev => ({ ...prev, healthProfile: profile }));
    setIsProfileComplete(!!profile.age);
  };

  // Don't render children until we've checked localStorage
  if (loading) {
      return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ 
        isAuthenticated, 
        user, 
        login, 
        logout,
        subscriptionStatus,
        upgradeToPro,
        isUpgradeModalOpen,
        openUpgradeModal,
        closeUpgradeModal,
        isProfileComplete,
        updateHealthProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};