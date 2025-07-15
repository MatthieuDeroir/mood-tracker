// src/models/types.ts
export interface MoodEntry {
    id: string;
    userId: string;
    mood: number;
    note?: string;
    tags: string[];
    timestamp: string;
    createdAt: string;
}

export interface MoodStats {
    average: number;
    count: number;
    min: number;
    max: number;
    period: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}