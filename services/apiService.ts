// services/apiService.ts

import { getBiomarkerRecommendations } from './geminiService';
import type { 
    HealthProfile, 
    BloodTestAnalysis, 
    BloodTestRecord, 
    Biomarker, 
    BiomarkerAlert, 
    AIGeneratedRecommendations, 
    ChatMessage 
} from '../types';
import { MessageSender } from '../types';

// --- STORAGE KEYS (used by the mock backend) ---
const PROFILE_KEY = 'everliv_health_profile';
const BIOMARKERS_KEY = 'everliv_health_biomarkers';
const TEST_HISTORY_KEY = 'everliv_health_test_history';
const ALERTS_KEY = 'everliv_health_alerts';
const CHAT_HISTORY_KEY = 'everliv_health_chat_history';
const ARTICLE_LIKES_KEY = 'everliv_health_article_likes';

// --- MOCK DATABASE HELPER ---
const mockDb = {
    getItem: <T>(key: string): T | null => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error(`Failed to parse ${key} from localStorage`, e);
            return null;
        }
    },
    setItem: <T>(key: string, value: T): void => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key: string): void => {
        localStorage.removeItem(key);
    },
};

// --- API SIMULATION ---
const simulateNetworkDelay = (delay = 500) => new Promise(res => setTimeout(res, delay));

class ApiService {
    private backendUrl: string | null = null;
    private authToken: string | null = null;

    setBackendUrl(url: string) {
        this.backendUrl = url;
        console.log(`Backend URL set to: ${url}`);
    }

    setAuthToken(token: string | null) {
        this.authToken = token;
    }

    // --- MOCK DATA SEEDING ---
    private async seedInitialData() {
        console.log("Seeding initial mock data into the 'database' (localStorage)...");
        const mockProfile: HealthProfile = {
            age: 34, sex: 'male', height: 180, weight: 82, activityLevel: 'moderate',
            healthGoals: ['Improve heart health', 'Increase energy levels'],
            dietaryPreferences: 'Low-carb, focuses on whole foods.', chronicConditions: 'None reported',
            allergies: 'Seasonal pollen', supplements: 'Vitamin D (2000 IU), Omega-3 Fish Oil',
        };
        mockDb.setItem(PROFILE_KEY, mockProfile);

        const date1 = new Date('2023-11-15T10:00:00.000Z').toISOString();
        const date2 = new Date('2024-02-20T10:00:00.000Z').toISOString();
        const date3 = new Date('2024-05-01T10:00:00.000Z').toISOString();

        const mockTestHistory: BloodTestRecord[] = [
            { id: 'test-1', date: date1, analysis: { summary: 'Initial test shows elevated LDL cholesterol and low Vitamin D.', biomarkers: [{ name: 'LDL Cholesterol', value: '130', unit: 'mg/dL', range: '0-100 mg/dL', explanation: 'LDL is "bad" cholesterol.', status: 'high' }, { name: 'Vitamin D', value: '25', unit: 'ng/mL', range: '30-100 ng/mL', explanation: 'Essential for bones.', status: 'low' }], recommendations: ['Reduce saturated fats.', 'Consider Vitamin D supplement.'] } },
            { id: 'test-2', date: date2, analysis: { summary: 'Follow-up shows positive progress.', biomarkers: [{ name: 'LDL Cholesterol', value: '110', unit: 'mg/dL', range: '0-100 mg/dL', explanation: 'LDL is "bad" cholesterol.', status: 'borderline' }, { name: 'Vitamin D', value: '38', unit: 'ng/mL', range: '30-100 ng/mL', explanation: 'Essential for bones.', status: 'normal' }], recommendations: ['Continue current diet.', 'Maintain exercise.'] } },
            { id: 'test-3', date: date3, analysis: { summary: 'Excellent results, LDL is now normal.', biomarkers: [{ name: 'LDL Cholesterol', value: '95', unit: 'mg/dL', range: '0-100 mg/dL', explanation: 'LDL is "bad" cholesterol.', status: 'normal' }, { name: 'Vitamin D', value: '45', unit: 'ng/mL', range: '30-100 ng/mL', explanation: 'Essential for bones.', status: 'normal' }], recommendations: ['Maintain lifestyle.', 'Re-check in 6-12 months.'] } },
        ];
        mockDb.setItem(TEST_HISTORY_KEY, mockTestHistory);

        const mockBiomarkers: Biomarker[] = [
            { name: 'LDL Cholesterol', value: '95', unit: 'mg/dL', status: 'normal', range: '0-100 mg/dL', description: 'LDL is "bad" cholesterol.', trend: 'down', lastUpdated: date3, history: [{ value: 130, date: date1, sourceTestId: 'test-1' }, { value: 110, date: date2, sourceTestId: 'test-2' }, { value: 95, date: date3, sourceTestId: 'test-3' }], recommendations: { nutrition: ['Increase soluble fiber.'], lifestyle: ['Engage in aerobic exercise.'], supplements: ['Consult doctor about plant sterols.'], next_checkup: 'In 6-12 months.' } },
            { name: 'Vitamin D', value: '45', unit: 'ng/mL', status: 'normal', range: '30-100 ng/mL', description: 'Essential for bone health.', trend: 'up', lastUpdated: date3, history: [{ value: 25, date: date1, sourceTestId: 'test-1' }, { value: 38, date: date2, sourceTestId: 'test-2' }, { value: 45, date: date3, sourceTestId: 'test-3' }], recommendations: { nutrition: ['Eat fatty fish.'], lifestyle: ['Get sensible sun exposure.'], supplements: ['Continue current supplement.'], next_checkup: 'Annually.' } },
        ];
        mockDb.setItem(BIOMARKERS_KEY, mockBiomarkers);
        
        mockDb.setItem(ALERTS_KEY, [{ biomarkerName: 'LDL Cholesterol', enabled: true, thresholdAbove: 100 }, { biomarkerName: 'Vitamin D', enabled: true, thresholdBelow: 30 }]);
        mockDb.setItem(CHAT_HISTORY_KEY, [{ sender: MessageSender.AI, text: "Hello! How can I help you today?" }]);
        mockDb.setItem(ARTICLE_LIKES_KEY, ['The Benefits of a Mediterranean Diet']);
    }

    // --- AUTH ---
    async login(email: string, password: string): Promise<{ token: string }> {
        await simulateNetworkDelay();
        if (email && password) {
            // Check if data exists, if not, it's the first login
            if (!mockDb.getItem(PROFILE_KEY)) {
                await this.seedInitialData();
            }
            return { token: `mock_token_for_${email}` };
        }
        throw new Error("Invalid credentials");
    }

    // --- PROFILE ---
    async getProfile(): Promise<HealthProfile | null> {
        await simulateNetworkDelay();
        return mockDb.getItem<HealthProfile>(PROFILE_KEY);
    }

    async updateProfile(profile: HealthProfile): Promise<HealthProfile> {
        await simulateNetworkDelay();
        mockDb.setItem(PROFILE_KEY, profile);
        return profile;
    }

    // --- BIOMARKERS ---
    async getBiomarkers(): Promise<Biomarker[]> {
        await simulateNetworkDelay();
        return mockDb.getItem<Biomarker[]>(BIOMARKERS_KEY) || [];
    }

    // --- TEST HISTORY ---
    async getTestHistory(): Promise<BloodTestRecord[]> {
        await simulateNetworkDelay(800); // Slower endpoint
        return mockDb.getItem<BloodTestRecord[]>(TEST_HISTORY_KEY) || [];
    }

    async saveTestResult(analysis: BloodTestAnalysis): Promise<void> {
        await simulateNetworkDelay(1500); // Simulate processing time
        
        const currentDate = new Date();
        const currentDateISO = currentDate.toISOString();
        
        const newTestRecord: BloodTestRecord = {
            id: `test-${currentDate.getTime()}`,
            date: currentDateISO,
            analysis: analysis,
        };

        const allTestHistory = await this.getTestHistory();
        allTestHistory.push(newTestRecord);
        mockDb.setItem(TEST_HISTORY_KEY, allTestHistory);

        let allBiomarkers = await this.getBiomarkers();

        for (const resultMarker of analysis.biomarkers) {
            const recommendations = await getBiomarkerRecommendations({ name: resultMarker.name, value: resultMarker.value, unit: resultMarker.unit, status: resultMarker.status });
            
            const newValue = parseFloat(resultMarker.value);
            if (isNaN(newValue)) continue;

            const newHistoryEntry = { value: newValue, date: currentDateISO, sourceTestId: newTestRecord.id };
            const existingIndex = allBiomarkers.findIndex(b => b.name.toLowerCase() === resultMarker.name.toLowerCase());
            
            if (existingIndex > -1) {
                const existing = allBiomarkers[existingIndex];
                const lastValue = existing.history.length > 0 ? existing.history[existing.history.length - 1].value : newValue;
                
                existing.value = resultMarker.value;
                existing.unit = resultMarker.unit;
                existing.status = resultMarker.status;
                existing.range = resultMarker.range;
                existing.description = resultMarker.explanation;
                existing.lastUpdated = currentDateISO;
                existing.trend = newValue > lastValue ? 'up' : newValue < lastValue ? 'down' : 'stable';
                existing.history.push(newHistoryEntry);
                existing.recommendations = recommendations;
            } else {
                allBiomarkers.push({
                    name: resultMarker.name, value: resultMarker.value, unit: resultMarker.unit, status: resultMarker.status,
                    range: resultMarker.range, description: resultMarker.explanation, trend: 'stable',
                    lastUpdated: currentDateISO, history: [newHistoryEntry], recommendations: recommendations,
                });
            }
        }
        mockDb.setItem(BIOMARKERS_KEY, allBiomarkers);
    }
    
    // --- ALERTS ---
    async getAlerts(): Promise<BiomarkerAlert[]> {
        await simulateNetworkDelay();
        return mockDb.getItem<BiomarkerAlert[]>(ALERTS_KEY) || [];
    }
    
    async saveAlerts(alerts: BiomarkerAlert[]): Promise<void> {
        await simulateNetworkDelay();
        mockDb.setItem(ALERTS_KEY, alerts);
    }

    // --- CHAT ---
    async getChatHistory(): Promise<ChatMessage[]> {
        await simulateNetworkDelay(300);
        return mockDb.getItem<ChatMessage[]>(CHAT_HISTORY_KEY) || [];
    }

    async saveChatHistory(messages: ChatMessage[]): Promise<void> {
        // No network delay for this as it's a background save
        mockDb.setItem(CHAT_HISTORY_KEY, messages);
    }

    // --- ARTICLES ---
    async getArticleLikes(): Promise<string[]> {
        await simulateNetworkDelay(200);
        return mockDb.getItem<string[]>(ARTICLE_LIKES_KEY) || [];
    }

    async saveArticleLikes(likes: string[]): Promise<void> {
        await simulateNetworkDelay(400);
        mockDb.setItem(ARTICLE_LIKES_KEY, likes);
    }
    
    // --- DATA MANAGEMENT ---
    async exportAllData(): Promise<object> {
        await simulateNetworkDelay(1000);
        const data: { [key: string]: any } = {};
        data[PROFILE_KEY] = mockDb.getItem(PROFILE_KEY);
        data[BIOMARKERS_KEY] = mockDb.getItem(BIOMARKERS_KEY);
        data[TEST_HISTORY_KEY] = mockDb.getItem(TEST_HISTORY_KEY);
        data[ALERTS_KEY] = mockDb.getItem(ALERTS_KEY);
        data[CHAT_HISTORY_KEY] = mockDb.getItem(CHAT_HISTORY_KEY);
        data[ARTICLE_LIKES_KEY] = mockDb.getItem(ARTICLE_LIKES_KEY);
        return data;
    }

    async deleteAllData(): Promise<void> {
        await simulateNetworkDelay(1200);
        [PROFILE_KEY, BIOMARKERS_KEY, TEST_HISTORY_KEY, ALERTS_KEY, CHAT_HISTORY_KEY, ARTICLE_LIKES_KEY].forEach(key => {
            mockDb.removeItem(key);
        });
    }
}

export const apiService = new ApiService();
