// src/hooks/use-mood-data.ts
import { useState, useEffect } from 'react';
import { MoodService, Period, MoodAnalytics } from '@/lib/services/mood-service';

export interface MoodEntry {
    id: string;
    mood: number | null;
    sleepHours: number | null;
    energy: number | null;
    stress: number | null;
    work: number | null;
    social: number | null;
    alone: number | null;
    note: string | null;
    tags: string[];
    medication: number | null;
    emotions: string | null;
    timestamp: Date;
}

export function useMoodData(period: Period = 'all') {
    const [entries, setEntries] = useState<MoodEntry[]>([]);
    const [analytics, setAnalytics] = useState<MoodAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [entriesData, analyticsData] = await Promise.all([
                MoodService.getMoodEntries(period),
                MoodService.getMoodAnalytics(period)
            ]);

            setEntries(entriesData);
            setAnalytics(analyticsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period]);

    const refetch = () => {
        fetchData();
    };

    const createEntry = async (data: Parameters<typeof MoodService.createMoodEntry>[0]) => {
        try {
            const newEntry = await MoodService.createMoodEntry(data);
            await refetch(); // Recharger les données après création
            return newEntry;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la création');
            throw err;
        }
    };

    return {
        entries,
        analytics,
        loading,
        error,
        refetch,
        createEntry,
    };
}