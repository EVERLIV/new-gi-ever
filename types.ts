// types.ts

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface BloodTestRecord {
  id: string;
  date: string; // ISO date string
  analysis: BloodTestAnalysis;
}

export interface AIGeneratedRecommendations {
  nutrition: string[];
  lifestyle: string[];
  supplements: string[];
  next_checkup: string;
}

export interface Biomarker {
  name:string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'borderline' | 'high' | 'low';
  lastUpdated: string; // ISO date string
  description: string;
  range: string;
  history: { value: number; date: string; sourceTestId?: string }[];
  recommendations?: AIGeneratedRecommendations;
}

export interface BiomarkerAlert {
  biomarkerName: string; // Links to the Biomarker's name
  enabled: boolean;
  thresholdBelow?: number;
  thresholdAbove?: number;
}

export interface BloodTestAnalysis {
  summary: string;
  biomarkers: Array<{
    name: string;
    value: string;
    unit: string;
    range: string;
    explanation: string;
    status: 'normal' | 'borderline' | 'high' | 'low';
  }>;
  recommendations: string[];
}

export enum MessageSender {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  sender: MessageSender;
  text: string;
  image?: string; // Optional: for displaying uploaded images (e.g., base64 or blob URL)
}