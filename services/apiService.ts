// services/apiService.ts
// FIX: Use Firebase v8 namespaced/compat API to resolve module export errors.
import { auth, db } from './firebase';
import firebase from 'firebase/compat/app';

import { getBiomarkerRecommendations } from './geminiService';
import type { 
    HealthProfile, 
    BloodTestAnalysis, 
    BloodTestRecord, 
    Biomarker, 
    BiomarkerAlert, 
    ChatMessage 
} from '../types';

/**
 * A utility to retry a function that returns a Promise if it fails due to network issues.
 * This helps handle Firestore's initial "client is offline" state upon app load.
 * @param fn The async function to execute.
 * @param retries Number of retries.
 * @param delay Initial delay in ms.
 * @returns The result of the async function.
 */
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const errorMessage = (error as Error)?.message?.toLowerCase() || '';
            const errorCode = (error as any)?.code;

            // Retry only on specific network-related Firestore errors.
            if (errorMessage.includes('offline') || errorCode === 'unavailable') {
                if (i < retries - 1) {
                    // Exponential backoff
                    await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
                }
            } else {
                // For other errors (e.g., permissions), fail fast.
                throw error;
            }
        }
    }
    throw lastError;
};


class ApiService {
    private getCurrentUserId(): string {
        if (!auth.currentUser) {
            throw new Error("User not authenticated for API call.");
        }
        return auth.currentUser.uid;
    }

    // --- PROFILE ---
    async getProfile(): Promise<HealthProfile | null> {
        return withRetry(async () => {
            const uid = this.getCurrentUserId();
            // FIX: Use v8 chained method syntax.
            const docRef = db.collection('users').doc(uid);
            const docSnap = await docRef.get();
            const data = docSnap.data();
            return data && data.healthProfile ? (data.healthProfile as HealthProfile) : null;
        });
    }

    async updateProfile(profile: HealthProfile): Promise<HealthProfile> {
        const uid = this.getCurrentUserId();
        // FIX: Use v8 chained method syntax.
        const docRef = db.collection('users').doc(uid);
        await docRef.set({ healthProfile: profile }, { merge: true });
        return profile;
    }

    // --- BIOMARKERS ---
    async getBiomarkers(): Promise<Biomarker[]> {
        return withRetry(async () => {
            const uid = this.getCurrentUserId();
            // FIX: Use v8 chained method syntax.
            const biomarkersCol = db.collection('users').doc(uid).collection('biomarkers');
            const snapshot = await biomarkersCol.get();
            return snapshot.docs.map(doc => doc.data() as Biomarker);
        });
    }

    // --- TEST HISTORY ---
    async getTestHistory(): Promise<BloodTestRecord[]> {
        return withRetry(async () => {
            const uid = this.getCurrentUserId();
            // FIX: Use v8 chained method syntax.
            const historyCol = db.collection('users').doc(uid).collection('testHistory');
            const q = historyCol.orderBy('date', 'asc');
            const snapshot = await q.get();
            return snapshot.docs.map(doc => doc.data() as BloodTestRecord);
        });
    }

    async saveTestResult(analysis: BloodTestAnalysis): Promise<void> {
        const uid = this.getCurrentUserId();
        const currentDate = new Date();
        const currentDateISO = currentDate.toISOString();

        // FIX: Use v8 chained method syntax.
        const testHistoryCol = db.collection('users').doc(uid).collection('testHistory');
        // FIX: Get a new document reference with an auto-ID in v8 style.
        const newTestDocRef = testHistoryCol.doc();
        const newTestRecord: BloodTestRecord = {
            id: newTestDocRef.id,
            date: currentDateISO,
            analysis: analysis,
        };
        
        // FIX: Get batch from db instance in v8 style.
        const batch = db.batch();
        batch.set(newTestDocRef, newTestRecord);

        // FIX: Use v8 chained method syntax.
        const biomarkersCol = db.collection('users').doc(uid).collection('biomarkers');

        for (const resultMarker of analysis.biomarkers) {
            const recommendations = await getBiomarkerRecommendations({ name: resultMarker.name, value: resultMarker.value, unit: resultMarker.unit, status: resultMarker.status });
            
            const newValue = parseFloat(resultMarker.value);
            if (isNaN(newValue)) continue;

            const newHistoryEntry = { value: newValue, date: currentDateISO, sourceTestId: newTestRecord.id };
            
            // FIX: Use v8 chained method syntax.
            const biomarkerDocRef = biomarkersCol.doc(resultMarker.name);
            // FIX: Explicitly cast snapshot type to resolve `unknown` type error on `.exists` and `.data()`.
            const biomarkerSnap = await withRetry(() => biomarkerDocRef.get()) as firebase.firestore.DocumentSnapshot;

            if (biomarkerSnap.exists) {
                const existing = biomarkerSnap.data() as Biomarker;
                const lastValue = existing.history.length > 0 ? existing.history[existing.history.length - 1].value : newValue;
                
                batch.update(biomarkerDocRef, {
                    value: resultMarker.value,
                    unit: resultMarker.unit,
                    status: resultMarker.status,
                    range: resultMarker.range,
                    description: resultMarker.explanation,
                    lastUpdated: currentDateISO,
                    trend: newValue > lastValue ? 'up' : newValue < lastValue ? 'down' : 'stable',
                    history: [...existing.history, newHistoryEntry],
                    recommendations: recommendations,
                });
            } else {
                 batch.set(biomarkerDocRef, {
                    name: resultMarker.name,
                    value: resultMarker.value,
                    unit: resultMarker.unit,
                    status: resultMarker.status,
                    range: resultMarker.range,
                    description: resultMarker.explanation,
                    trend: 'stable',
                    lastUpdated: currentDateISO,
                    history: [newHistoryEntry],
                    recommendations: recommendations,
                });
            }
        }
        
        await batch.commit();
    }
    
    // --- ALERTS ---
    async getAlerts(): Promise<BiomarkerAlert[]> {
        return withRetry(async () => {
            const uid = this.getCurrentUserId();
            // FIX: Use v8 chained method syntax.
            const docRef = db.collection('users').doc(uid).collection('settings').doc('alerts');
            const docSnap = await docRef.get();
            return docSnap.exists ? (docSnap.data()!.alerts as BiomarkerAlert[]) : [];
        });
    }
    
    async saveAlerts(alerts: BiomarkerAlert[]): Promise<void> {
        const uid = this.getCurrentUserId();
        // FIX: Use v8 chained method syntax.
        const docRef = db.collection('users').doc(uid).collection('settings').doc('alerts');
        await docRef.set({ alerts });
    }

    // --- CHAT ---
    async getChatHistory(): Promise<ChatMessage[]> {
        return withRetry(async () => {
            const uid = this.getCurrentUserId();
            // FIX: Use v8 chained method syntax.
            const docRef = db.collection('users').doc(uid).collection('chat').doc('history');
            const docSnap = await docRef.get();
            return docSnap.exists ? (docSnap.data()!.messages as ChatMessage[]) : [];
        });
    }

    async saveChatHistory(messages: ChatMessage[]): Promise<void> {
        const uid = this.getCurrentUserId();
        // FIX: Use v8 chained method syntax.
        const docRef = db.collection('users').doc(uid).collection('chat').doc('history');
        await docRef.set({ messages });
    }

    // --- ARTICLES ---
    async getArticleLikes(): Promise<string[]> {
        return withRetry(async () => {
            const uid = this.getCurrentUserId();
            // FIX: Use v8 chained method syntax.
            const docRef = db.collection('users').doc(uid).collection('preferences').doc('articleLikes');
            const docSnap = await docRef.get();
            return docSnap.exists ? (docSnap.data()!.likes as string[]) : [];
        });
    }

    async saveArticleLikes(likes: string[]): Promise<void> {
        const uid = this.getCurrentUserId();
        // FIX: Use v8 chained method syntax.
        const docRef = db.collection('users').doc(uid).collection('preferences').doc('articleLikes');
        await docRef.set({ likes });
    }
    
    // --- DATA MANAGEMENT ---
    async exportAllData(): Promise<object> {
        const uid = this.getCurrentUserId();
        const data: { [key: string]: any } = {};
        
        const [profile, biomarkers, testHistory, alerts, chatHistory, articleLikes] = await Promise.all([
            this.getProfile(),
            this.getBiomarkers(),
            this.getTestHistory(),
            this.getAlerts(),
            this.getChatHistory(),
            this.getArticleLikes()
        ]);

        data['healthProfile'] = profile;
        data['biomarkers'] = biomarkers;
        data['testHistory'] = testHistory;
        data['alerts'] = alerts;
        data['chatHistory'] = chatHistory;
        data['articleLikes'] = articleLikes;
        
        return data;
    }

    async deleteAllData(): Promise<void> {
        const uid = this.getCurrentUserId();
        // FIX: Get batch from db instance in v8 style.
        const batch = db.batch();

        const collectionsToDelete = ['biomarkers', 'testHistory'];
        for (const col of collectionsToDelete) {
            // FIX: Use v8 chained method syntax.
            const snapshot = await db.collection('users').doc(uid).collection(col).get();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
        }

        // FIX: Use v8 chained method syntax to get doc references.
        const docsToDelete = [
            db.collection('users').doc(uid).collection('settings').doc('alerts'),
            db.collection('users').doc(uid).collection('chat').doc('history'),
            db.collection('users').doc(uid).collection('preferences').doc('articleLikes'),
            db.collection('users').doc(uid) // This deletes the health profile as well
        ];
        docsToDelete.forEach(d => batch.delete(d));

        await batch.commit();
    }
}

export const apiService = new ApiService();