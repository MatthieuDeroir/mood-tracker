// src/lib/services/mood-service.ts
import { db } from '@/lib/db';
import { moodEntries, users } from '@/lib/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export interface MoodStats {
  average: number;
  median: number;
  min: number;
  max: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MoodAnalytics {
  moodStats: MoodStats;
  sleepStats: MoodStats;
  energyStats: MoodStats;
  stressStats: MoodStats;
  workStats: MoodStats;
  socialStats: MoodStats;
  aloneStats: MoodStats;
  correlations: {
    moodSleep: number;
    moodEnergy: number;
    stressSleep: number;
    energyWork: number;
    socialMood: number;
    aloneStress: number;
    stressWork: number;
  };
  bestDay: {
    date: string;
    mood: number;
    note?: string;
  };
  worstDay: {
    date: string;
    mood: number;
    note?: string;
  };
  tagsFrequency: Record<string, number>;
}

export class MoodService {
  private static defaultUserId = '00000000-0000-0000-0000-000000000001';

  static async getMoodEntries(period: Period = 'all', userId?: string) {
    const uid = userId || this.defaultUserId;
    const dateRange = this.getDateRange(period);

    let query = db
        .select()
        .from(moodEntries)
        .where(eq(moodEntries.userId, uid))
        .orderBy(desc(moodEntries.timestamp));

    if (dateRange) {
      query = query.where(
          and(
              eq(moodEntries.userId, uid),
              gte(moodEntries.timestamp, dateRange.start),
              lte(moodEntries.timestamp, dateRange.end)
          )
      );
    }

    return await query;
  }

  static async getMoodAnalytics(period: Period = 'all', userId?: string): Promise<MoodAnalytics> {
    const entries = await this.getMoodEntries(period, userId);

    if (entries.length === 0) {
      return this.getEmptyAnalytics();
    }

    // Calculer les statistiques pour chaque mesure
    const moodStats = this.calculateStats(entries, 'mood');
    const sleepStats = this.calculateStats(entries, 'sleepHours');
    const energyStats = this.calculateStats(entries, 'energy');
    const stressStats = this.calculateStats(entries, 'stress');
    const workStats = this.calculateStats(entries, 'work');
    const socialStats = this.calculateStats(entries, 'social');
    const aloneStats = this.calculateStats(entries, 'alone');

    // Calculer les corrélations
    const correlations = this.calculateCorrelations(entries);

    // Meilleur et pire jour
    const bestDay = this.getBestWorstDay(entries, 'best');
    const worstDay = this.getBestWorstDay(entries, 'worst');

    // Fréquence des tags
    const tagsFrequency = this.calculateTagsFrequency(entries);

    return {
      moodStats,
      sleepStats,
      energyStats,
      stressStats,
      workStats,
      socialStats,
      aloneStats,
      correlations,
      bestDay,
      worstDay,
      tagsFrequency,
    };
  }

  private static getDateRange(period: Period) {
    const now = new Date();

    switch (period) {
      case 'daily':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        };
      case 'weekly':
        return {
          start: startOfWeek(now, { locale: fr }),
          end: now
        };
      case 'monthly':
        return {
          start: startOfMonth(now),
          end: now
        };
      case 'yearly':
        return {
          start: startOfYear(now),
          end: now
        };
      case 'all':
      default:
        return null;
    }
  }

  private static calculateStats(entries: any[], field: string): MoodStats {
    const values = entries
        .map(entry => entry[field])
        .filter(value => value !== null && value !== undefined)
        .map(value => Number(value));

    if (values.length === 0) {
      return {
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        count: 0,
        trend: 'stable'
      };
    }

    const sorted = values.sort((a, b) => a - b);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    // Calculer la tendance (simple approximation)
    const trend = this.calculateTrend(entries, field);

    return {
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      trend
    };
  }

  private static calculateTrend(entries: any[], field: string): 'up' | 'down' | 'stable' {
    const values = entries
        .map(entry => ({ value: entry[field], date: entry.timestamp }))
        .filter(item => item.value !== null && item.value !== undefined)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (difference > 0.5) return 'up';
    if (difference < -0.5) return 'down';
    return 'stable';
  }

  private static calculateCorrelations(entries: any[]) {
    const correlations = {
      moodSleep: this.correlation(entries, 'mood', 'sleepHours'),
      moodEnergy: this.correlation(entries, 'mood', 'energy'),
      stressSleep: this.correlation(entries, 'stress', 'sleepHours'),
      energyWork: this.correlation(entries, 'energy', 'work'),
      socialMood: this.correlation(entries, 'social', 'mood'),
      aloneStress: this.correlation(entries, 'alone', 'stress'),
      stressWork: this.correlation(entries, 'stress', 'work'),
    };

    return correlations;
  }

  private static correlation(entries: any[], field1: string, field2: string): number {
    const pairs = entries
        .map(entry => [entry[field1], entry[field2]])
        .filter(pair => pair[0] !== null && pair[0] !== undefined &&
            pair[1] !== null && pair[1] !== undefined);

    if (pairs.length < 2) return 0;

    const n = pairs.length;
    const sum1 = pairs.reduce((sum, pair) => sum + pair[0], 0);
    const sum2 = pairs.reduce((sum, pair) => sum + pair[1], 0);
    const sum1Sq = pairs.reduce((sum, pair) => sum + pair[0] * pair[0], 0);
    const sum2Sq = pairs.reduce((sum, pair) => sum + pair[1] * pair[1], 0);
    const pSum = pairs.reduce((sum, pair) => sum + pair[0] * pair[1], 0);

    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

    if (den === 0) return 0;

    return Math.round((num / den) * 100) / 100;
  }

  private static getBestWorstDay(entries: any[], type: 'best' | 'worst') {
    const validEntries = entries.filter(entry => entry.mood !== null && entry.mood !== undefined);

    if (validEntries.length === 0) {
      return {
        date: '',
        mood: 0,
        note: ''
      };
    }

    const sortedEntries = validEntries.sort((a, b) =>
        type === 'best' ? b.mood - a.mood : a.mood - b.mood
    );

    const bestWorst = sortedEntries[0];

    return {
      date: format(new Date(bestWorst.timestamp), 'dd/MM/yyyy', { locale: fr }),
      mood: bestWorst.mood,
      note: bestWorst.note || ''
    };
  }

  private static calculateTagsFrequency(entries: any[]): Record<string, number> {
    const frequency: Record<string, number> = {};

    entries.forEach(entry => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach((tag: string) => {
          frequency[tag] = (frequency[tag] || 0) + 1;
        });
      }
    });

    return frequency;
  }

  private static getEmptyAnalytics(): MoodAnalytics {
    const emptyStats: MoodStats = {
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      count: 0,
      trend: 'stable'
    };

    return {
      moodStats: emptyStats,
      sleepStats: emptyStats,
      energyStats: emptyStats,
      stressStats: emptyStats,
      workStats: emptyStats,
      socialStats: emptyStats,
      aloneStats: emptyStats,
      correlations: {
        moodSleep: 0,
        moodEnergy: 0,
        stressSleep: 0,
        energyWork: 0,
        socialMood: 0,
        aloneStress: 0,
        stressWork: 0,
      },
      bestDay: { date: '', mood: 0, note: '' },
      worstDay: { date: '', mood: 0, note: '' },
      tagsFrequency: {},
    };
  }

  static async createMoodEntry(data: {
    mood?: number;
    sleepHours?: number;
    energy?: number;
    stress?: number;
    work?: number;
    social?: number;
    alone?: number;
    note?: string;
    tags?: string[];
    medication?: number;
    emotions?: string;
    userId?: string;
  }) {
    const uid = data.userId || this.defaultUserId;

    const newEntry = await db
        .insert(moodEntries)
        .values({
          userId: uid,
          mood: data.mood || null,
          sleepHours: data.sleepHours || null,
          energy: data.energy || null,
          stress: data.stress || null,
          work: data.work || null,
          social: data.social || null,
          alone: data.alone || null,
          note: data.note || null,
          tags: data.tags || [],
          medication: data.medication || null,
          emotions: data.emotions || null,
          timestamp: new Date(),
        })
        .returning();

    return newEntry[0];
  }
}
