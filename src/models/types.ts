// src/models/types.ts
import { MoodEntry as DbMoodEntry, User as DbUser } from '../db/schema.ts';

// Type MoodEntry pour l'API
export interface MoodEntry extends DbMoodEntry {
    // Extensions ou propriétés supplémentaires si nécessaire
}

// Type User pour l'API
export interface User extends DbUser {
    // Extensions ou propriétés supplémentaires si nécessaire
}

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

// Traductions pour l'interface
export interface Translations {
    moodLabels: {
        [key: number]: string;
    };
    interface: {
        [key: string]: string;
    };
}

// Format pour les paramètres de langue
export type SupportedLanguage = 'fr' | 'en' | 'es' | 'de';