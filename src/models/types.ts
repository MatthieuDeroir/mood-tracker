// src/models/types.ts
import type { User as DbUser, MoodEntry as DbMoodEntry } from '../db/schema.ts';

// Types pour l'API
export type User = DbUser;
export type MoodEntry = DbMoodEntry;

// Langues supportées
export type SupportedLanguage = 'fr' | 'en' | 'es' | 'de';

// Statistiques d'humeur
export interface MoodStats {
    average: number;
    count: number;
    min: number;
    max: number;
    period: string;
    trends?: {
        byHour: Array<{ hour: number; avgMood: number; count: number }>;
        byDayOfWeek: Array<{ dayOfWeek: number; avgMood: number; count: number }>;
        byMonth: Array<{ month: number; avgMood: number; count: number }>;
    };
}

// Données de timeline pour les graphiques
export interface TimelineData {
    date: string;
    averageMood: number;
    entryCount: number;
    entries: MoodEntry[];
}

// Réponse API générique
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Types pour les requêtes
export interface CreateMoodRequest {
    mood: number;
    note?: string;
    tags?: string[];
}

export interface UpdateMoodRequest {
    mood?: number;
    note?: string;
    tags?: string[];
}