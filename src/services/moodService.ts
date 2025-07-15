// src/services/moodService.ts - Service avec Drizzle
import { db } from '../db/database.ts';
import { moodEntries, users, MoodEntry, NewMoodEntry } from '../db/schema.ts';
import { eq, and, gte, lte, like, desc, sql, avg, count, min, max } from 'drizzle-orm';

// Interface pour les statistiques
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

// Interface pour les données de timeline
export interface TimelineData {
    date: string;
    averageMood: number;
    entryCount: number;
    entries: MoodEntry[];
}

export class MoodService {
    // Créer une entrée d'humeur
    static async createMood(userId: string, mood: number, note?: string, tags: string[] = []): Promise<MoodEntry> {
        try {
            const newMood: NewMoodEntry = {
                userId,
                mood,
                note,
                tags,
                timestamp: new Date(),
            };

            const [moodEntry] = await db.insert(moodEntries)
                .values(newMood)
                .returning();

            console.log(`💾 Humeur créée: ${mood}/10 pour l'utilisateur ${userId}`);
            return moodEntry;
        } catch (error) {
            console.error('Erreur lors de la création de l\'humeur:', error);
            throw error;
        }
    }

    // Récupérer les humeurs d'un utilisateur
    static async getUserMoods(userId: string, startDate?: Date, endDate?: Date, limit = 100): Promise<MoodEntry[]> {
        try {
            let query = db.select().from(moodEntries)
                .where(eq(moodEntries.userId, userId))
                .orderBy(desc(moodEntries.timestamp))
                .limit(limit);

            if (startDate) {
                query = query.where(gte(moodEntries.timestamp, startDate));
            }

            if (endDate) {
                query = query.where(lte(moodEntries.timestamp, endDate));
            }

            return await query;
        } catch (error) {
            console.error('Erreur lors de la récupération des humeurs:', error);
            throw error;
        }
    }

    // Récupérer une humeur par ID
    static async getMoodById(moodId: string, userId: string): Promise<MoodEntry | undefined> {
        try {
            const [mood] = await db.select()
                .from(moodEntries)
                .where(and(
                    eq(moodEntries.id, moodId),
                    eq(moodEntries.userId, userId)
                ));

            return mood;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'humeur:', error);
            throw error;
        }
    }

    // Supprimer une humeur
    static async deleteMood(moodId: string, userId: string): Promise<boolean> {
        try {
            const result = await db.delete(moodEntries)
                .where(and(
                    eq(moodEntries.id, moodId),
                    eq(moodEntries.userId, userId)
                ));

            console.log(`🗑️ Humeur supprimée: ${moodId} pour l'utilisateur ${userId}`);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'humeur:', error);
            throw error;
        }
    }

    // Mettre à jour une humeur
    static async updateMood(
        moodId: string,
        userId: string,
        updates: Partial<{ mood: number; note: string; tags: string[] }>
    ): Promise<MoodEntry | undefined> {
        try {
            const [updatedMood] = await db.update(moodEntries)
                .set({
                    ...updates,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(moodEntries.id, moodId),
                    eq(moodEntries.userId, userId)
                ))
                .returning();

            if (!updatedMood) {
                return undefined;
            }

            console.log(`📝 Humeur mise à jour: ${moodId} pour l'utilisateur ${userId}`);
            return updatedMood;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'humeur:', error);
            throw error;
        }
    }

    // Statistiques générales
    static async getMoodStats(userId: string, days = 7): Promise<MoodStats> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const result = await db.select({
                avgMood: avg(moodEntries.mood),
                moodCount: count(),
                minMood: min(moodEntries.mood),
                maxMood: max(moodEntries.mood),
            })
                .from(moodEntries)
                .where(and(
                    eq(moodEntries.userId, userId),
                    gte(moodEntries.timestamp, cutoffDate)
                ));

            const stats = result[0];

            if (!stats || stats.moodCount === 0) {
                return {
                    average: 0,
                    count: 0,
                    min: 0,
                    max: 0,
                    period: `${days} days`,
                };
            }

            // Arrondir la moyenne à 1 décimale
            const average = Math.round((stats.avgMood || 0) * 10) / 10;

            // Récupérer les tendances
            const trends = await this.getTrends(userId, cutoffDate);

            return {
                average,
                count: Number(stats.moodCount),
                min: stats.minMood || 0,
                max: stats.maxMood || 0,
                period: `${days} jours`,
                trends,
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques d\'humeur:', error);
            throw error;
        }
    }

    // Tendances détaillées
    static async getTrends(userId: string, startDate: Date) {
        try {
            // Tendances par heure (avec PostgreSQL)
            const hourlyQuery = sql`
                SELECT
                    EXTRACT(HOUR FROM timestamp) as hour,
                    AVG(mood) as avg_mood,
                    COUNT(*) as count
                FROM mood_entries
                WHERE user_id = ${userId} AND timestamp >= ${startDate}
                GROUP BY EXTRACT(HOUR FROM timestamp)
                ORDER BY hour
            `;

            const hourlyTrends = await db.execute(hourlyQuery);

            // Tendances par jour de la semaine
            const weeklyQuery = sql`
                SELECT
                    EXTRACT(DOW FROM timestamp) as day_of_week,
                    AVG(mood) as avg_mood,
                    COUNT(*) as count
                FROM mood_entries
                WHERE user_id = ${userId} AND timestamp >= ${startDate}
                GROUP BY EXTRACT(DOW FROM timestamp)
                ORDER BY day_of_week
            `;

            const weeklyTrends = await db.execute(weeklyQuery);

            // Tendances par mois
            const monthlyQuery = sql`
                SELECT
                    EXTRACT(MONTH FROM timestamp) as month,
                    AVG(mood) as avg_mood,
                    COUNT(*) as count
                FROM mood_entries
                WHERE user_id = ${userId} AND timestamp >= ${startDate}
                GROUP BY EXTRACT(MONTH FROM timestamp)
                ORDER BY month
            `;

            const monthlyTrends = await db.execute(monthlyQuery);

            return {
                byHour: hourlyTrends.rows.map((t: any) => ({
                    hour: parseInt(t.hour),
                    avgMood: Math.round(t.avg_mood * 10) / 10,
                    count: parseInt(t.count),
                })),
                byDayOfWeek: weeklyTrends.rows.map((t: any) => ({
                    dayOfWeek: parseInt(t.day_of_week),
                    avgMood: Math.round(t.avg_mood * 10) / 10,
                    count: parseInt(t.count),
                })),
                byMonth: monthlyTrends.rows.map((t: any) => ({
                    month: parseInt(t.month),
                    avgMood: Math.round(t.avg_mood * 10) / 10,
                    count: parseInt(t.count),
                })),
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des tendances:', error);
            return {
                byHour: [],
                byDayOfWeek: [],
                byMonth: [],
            };
        }
    }

    // Données pour les graphiques timeline
    static async getTimelineData(
        userId: string,
        period: 'day' | 'week' | 'month',
        startDate: Date,
        endDate: Date
    ): Promise<TimelineData[]> {
        try {
            let groupByQuery;

            switch (period) {
                case 'day':
                    groupByQuery = sql`
                        SELECT
                            date_trunc('hour', timestamp) as period,
                            AVG(mood) as average_mood,
                            COUNT(*) as entry_count
                        FROM mood_entries
                        WHERE user_id = ${userId}
                          AND timestamp >= ${startDate}
                          AND timestamp <= ${endDate}
                        GROUP BY date_trunc('hour', timestamp)
                        ORDER BY period
                    `;
                    break;
                case 'week':
                    groupByQuery = sql`
                        SELECT
                            date_trunc('day', timestamp) as period,
                            AVG(mood) as average_mood,
                            COUNT(*) as entry_count
                        FROM mood_entries
                        WHERE user_id = ${userId}
                          AND timestamp >= ${startDate}
                          AND timestamp <= ${endDate}
                        GROUP BY date_trunc('day', timestamp)
                        ORDER BY period
                    `;
                    break;
                case 'month':
                    groupByQuery = sql`
                        SELECT
                            date_trunc('month', timestamp) as period,
                            AVG(mood) as average_mood,
                            COUNT(*) as entry_count
                        FROM mood_entries
                        WHERE user_id = ${userId}
                          AND timestamp >= ${startDate}
                          AND timestamp <= ${endDate}
                        GROUP BY date_trunc('month', timestamp)
                        ORDER BY period
                    `;
                    break;
                default:
                    throw new Error('Période non valide');
            }

            const result = await db.execute(groupByQuery);

            return result.rows.map((row: any) => ({
                date: row.period.toISOString(),
                averageMood: Math.round(row.average_mood * 10) / 10,
                entryCount: parseInt(row.entry_count),
                entries: [], // Peut être rempli si nécessaire
            }));
        } catch (error) {
            console.error('Erreur lors de la récupération des données de timeline:', error);
            throw error;
        }
    }

    // Recherche dans les notes
    static async searchMoods(userId: string, query: string, limit = 50): Promise<MoodEntry[]> {
        try {
            const moods = await db.select()
                .from(moodEntries)
                .where(and(
                    eq(moodEntries.userId, userId),
                    like(moodEntries.note || '', `%${query}%`)
                ))
                .orderBy(desc(moodEntries.timestamp))
                .limit(limit);

            return moods;
        } catch (error) {
            console.error('Erreur lors de la recherche des humeurs:', error);
            throw error;
        }
    }
}

export default MoodService;