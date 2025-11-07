// services/apiService.ts
import { auth, db } from './firebase';
import firebase from 'firebase/compat/app';

import { getBiomarkerRecommendations } from './geminiService';
import type { 
    HealthProfile, 
    BloodTestAnalysis, 
    BloodTestRecord, 
    Biomarker, 
    BiomarkerAlert, 
    ChatMessage,
    Article,
    Meditation
} from '../types';

/**
 * Custom error class for Firestore permission issues.
 */
export class FirestorePermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirestorePermissionError';
  }
}

interface UserDataFromFirestore {
    healthProfile?: HealthProfile;
    subscriptionStatus?: 'free' | 'pro';
    subscriptionExpiresAt?: firebase.firestore.Timestamp;
}


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

    // --- PROFILE & USER DATA ---
    async getUserData(): Promise<UserDataFromFirestore | null> {
        return withRetry(async () => {
            const uid = this.getCurrentUserId();
            const docRef = db.collection('users').doc(uid);
            const docSnap = await docRef.get();
            if (!docSnap.exists) {
                return null;
            }
            return docSnap.data() as UserDataFromFirestore;
        });
    }

    async updateProfile(profile: HealthProfile): Promise<HealthProfile> {
        const uid = this.getCurrentUserId();
        const docRef = db.collection('users').doc(uid);
        await docRef.set({ healthProfile: profile }, { merge: true });
        return profile;
    }

    async grantProSubscription(): Promise<void> {
        const uid = this.getCurrentUserId();
        const docRef = db.collection('users').doc(uid);
        
        const now = new Date();
        const expiryDate = new Date(now.setDate(now.getDate() + 30));

        await docRef.set({ 
            subscriptionStatus: 'pro',
            subscriptionExpiresAt: firebase.firestore.Timestamp.fromDate(expiryDate)
        }, { merge: true });
    }

    // --- BIOMARKERS ---
    async getBiomarkers(): Promise<Biomarker[]> {
        return withRetry(async () => {
            const uid = this.getCurrentUserId();
            const biomarkersCol = db.collection('users').doc(uid).collection('biomarkers');
            const snapshot = await biomarkersCol.get();
            return snapshot.docs.map(doc => doc.data() as Biomarker);
        });
    }

    // --- TEST HISTORY ---
    async getTestHistory(): Promise<BloodTestRecord[]> {
        return withRetry(async () => {
            const uid = this.getCurrentUserId();
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

        const testHistoryCol = db.collection('users').doc(uid).collection('testHistory');
        const newTestDocRef = testHistoryCol.doc();
        const newTestRecord: BloodTestRecord = {
            id: newTestDocRef.id,
            date: currentDateISO,
            analysis: analysis,
        };
        
        const batch = db.batch();
        batch.set(newTestDocRef, newTestRecord);

        const biomarkersCol = db.collection('users').doc(uid).collection('biomarkers');

        for (const resultMarker of analysis.biomarkers) {
            const recommendations = await getBiomarkerRecommendations({ name: resultMarker.name, value: resultMarker.value, unit: resultMarker.unit, status: resultMarker.status });
            
            const newValue = parseFloat(resultMarker.value);
            if (isNaN(newValue)) continue;

            const newHistoryEntry = { value: newValue, date: currentDateISO, sourceTestId: newTestRecord.id };
            
            const biomarkerDocRef = biomarkersCol.doc(resultMarker.name);
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
            const docRef = db.collection('users').doc(uid).collection('settings').doc('alerts');
            const docSnap = await docRef.get();
            return docSnap.exists ? (docSnap.data()!.alerts as BiomarkerAlert[]) : [];
        });
    }
    
    async saveAlerts(alerts: BiomarkerAlert[]): Promise<void> {
        const uid = this.getCurrentUserId();
        const docRef = db.collection('users').doc(uid).collection('settings').doc('alerts');
        await docRef.set({ alerts });
    }

    // --- CHAT ---
    async getChatHistory(): Promise<ChatMessage[]> {
        return withRetry(async () => {
            const uid = this.getCurrentUserId();
            const docRef = db.collection('users').doc(uid).collection('chat').doc('history');
            const docSnap = await docRef.get();
            return docSnap.exists ? (docSnap.data()!.messages as ChatMessage[]) : [];
        });
    }

    async saveChatHistory(messages: ChatMessage[]): Promise<void> {
        const uid = this.getCurrentUserId();
        const docRef = db.collection('users').doc(uid).collection('chat').doc('history');
        await docRef.set({ messages });
    }

    // --- LIKED ARTICLES ---
    async getArticleLikes(): Promise<string[]> {
        return withRetry(async () => {
            const uid = this.getCurrentUserId();
            const docRef = db.collection('users').doc(uid).collection('preferences').doc('articleLikes');
            const docSnap = await docRef.get();
            return docSnap.exists ? (docSnap.data()!.likes as string[]) : [];
        });
    }

    async saveArticleLikes(likes: string[]): Promise<void> {
        const uid = this.getCurrentUserId();
        const docRef = db.collection('users').doc(uid).collection('preferences').doc('articleLikes');
        await docRef.set({ likes });
    }

    // --- CONTENT MANAGEMENT: ARTICLES ---
    async getArticles(): Promise<Article[]> {
        try {
            const snapshot = await db.collection('articles').orderBy('publishedDate', 'desc').get();
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
        } catch (error: any) {
            if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission'))) {
                throw new FirestorePermissionError("Firestore permission denied. Please check your security rules.");
            }
            throw error;
        }
    }

    async addArticle(article: Omit<Article, 'id'>): Promise<string> {
        const docRef = await db.collection('articles').add(article);
        return docRef.id;
    }
    
    async updateArticle(id: string, article: Partial<Article>): Promise<void> {
        await db.collection('articles').doc(id).update(article);
    }

    async deleteArticle(id: string): Promise<void> {
        await db.collection('articles').doc(id).delete();
    }
    
    // --- CONTENT MANAGEMENT: MEDITATIONS ---
    async getMeditations(): Promise<Meditation[]> {
        try {
            const snapshot = await db.collection('meditations').get();
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meditation));
        } catch (error: any) {
            if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission'))) {
                 throw new FirestorePermissionError("Firestore permission denied. Please check your security rules.");
            }
            throw error;
        }
    }

    async addMeditation(meditation: Omit<Meditation, 'id'>): Promise<string> {
        const docRef = await db.collection('meditations').add(meditation);
        return docRef.id;
    }
    
    async updateMeditation(id: string, meditation: Partial<Meditation>): Promise<void> {
        await db.collection('meditations').doc(id).update(meditation);
    }

    async deleteMeditation(id: string): Promise<void> {
        await db.collection('meditations').doc(id).delete();
    }
    
    // --- SPECIALISTS SUBSCRIPTION ---
    async subscribeToSpecialists(email: string): Promise<void> {
        const uid = this.getCurrentUserId();
        // Use a collection for subscriptions and user's UID as doc ID to prevent duplicates.
        const docRef = db.collection('specialists_subscriptions').doc(uid);
        await docRef.set({
            email,
            userId: uid,
            subscribedAt: new Date().toISOString()
        }, { merge: true }); // Merge true in case we want to add more fields later without overwriting
    }

    // --- DATA MANAGEMENT ---
    async exportAllData(): Promise<object> {
        const uid = this.getCurrentUserId();
        const data: { [key: string]: any } = {};
        
        const userData = await this.getUserData();
        const [biomarkers, testHistory, alerts, chatHistory, articleLikes] = await Promise.all([
            this.getBiomarkers(),
            this.getTestHistory(),
            this.getAlerts(),
            this.getChatHistory(),
            this.getArticleLikes()
        ]);
        
        data['healthProfile'] = userData?.healthProfile || null;
        data['subscriptionStatus'] = userData?.subscriptionStatus || 'free';
        data['biomarkers'] = biomarkers;
        data['testHistory'] = testHistory;
        data['alerts'] = alerts;
        data['chatHistory'] = chatHistory;
        data['articleLikes'] = articleLikes;
        
        return data;
    }

    async deleteAllData(): Promise<void> {
        const uid = this.getCurrentUserId();
        const batch = db.batch();

        const collectionsToDelete = ['biomarkers', 'testHistory'];
        for (const col of collectionsToDelete) {
            const snapshot = await db.collection('users').doc(uid).collection(col).get();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
        }

        const docsToDelete = [
            db.collection('users').doc(uid).collection('settings').doc('alerts'),
            db.collection('users').doc(uid).collection('chat').doc('history'),
            db.collection('users').doc(uid).collection('preferences').doc('articleLikes'),
            db.collection('specialists_subscriptions').doc(uid),
            db.collection('users').doc(uid) // This deletes the health profile as well
        ];
        docsToDelete.forEach(d => batch.delete(d));

        await batch.commit();
    }
}

export const apiService = new ApiService();