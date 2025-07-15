// src/services/moodService.ts
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
    /**
     * Crée une nouvelle entrée d'humeur
     */
    static async createMood(userId: string, mood: number, note?: string, tags: string[] = [], sleepHours?: number, medication?: number, emotions?: string): Promise<MoodEntry> {
        try {
            const newMood: NewMoodEntry = {
                userId,
                mood,
                note,
                tags,
                sleepHours,
                medication,
                emotions,
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

    /**
     * Récupère une entrée d'humeur par ID
     */
    static async getMoodById(id: string): Promise<MoodEntry | null> {
        try {
            const [mood] = await db.select()
                .from(moodEntries)
                .where(eq(moodEntries.id, id));

            return mood || null;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'humeur:', error);
            throw error;
        }
    }

    /**
     * Met à jour une entrée d'humeur
     */
    static async updateMood(id: string, updates: Partial<MoodEntry>): Promise<MoodEntry | null> {
        try {
            const { userId, ...validUpdates } = updates;

            const [updatedMood] = await db.update(moodEntries)
                .set(validUpdates)
                .where(eq(moodEntries.id, id))
                .returning();

            return updatedMood || null;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'humeur:', error);
            throw error;
        }
    }

    /**
     * Supprime une entrée d'humeur
     */
    static async deleteMood(id: string): Promise<boolean> {
        try {
            const result = await db.delete(moodEntries)
                .where(eq(moodEntries.id, id))
                .returning();

            return result.length > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'humeur:', error);
            throw error;
        }
    }

    /**
     * Récupère toutes les entrées d'humeur d'un utilisateur
     */
    static async getUserMoods(
        userId: string,
        startDate?: Date,
        endDate?: Date,
        limit = 100
    ): Promise<MoodEntry[]> {
        try {
            let query = db.select().from(moodEntries)
                .where(eq(moodEntries.userId, userId))
                .orderBy(desc(moodEntries.timestamp))
                .limit(limit);

            if (startDate) {
                // Assurez-vous que la date de début est correctement formatée et au début de la journée
                const startOfDay = new Date(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate(),
                    0, 0, 0
                );
                console.log(`Filtrage par date de début: ${startOfDay.toISOString()}`);
                query = query.where(gte(moodEntries.timestamp, startOfDay));
            }

            if (endDate) {
                // Assurez-vous que la date de fin est correctement formatée et à la fin de la journée
                const endOfDay = new Date(
                    endDate.getFullYear(),
                    endDate.getMonth(),
                    endDate.getDate(),
                    23, 59, 59
                );
                console.log(`Filtrage par date de fin: ${endOfDay.toISOString()}`);
                query = query.where(lte(moodEntries.timestamp, endOfDay));
            }

            const results = await query;
            console.log(`Récupération des humeurs: ${results.length} entrées trouvées`);
            return results;
        } catch (error) {
            console.error('Erreur lors de la récupération des humeurs:', error);
            throw error;
        }
    }

    /**
     * Récupère les statistiques des humeurs pour une période donnée
     */
    static async getMoodStats(userId: string, days: number = 30): Promise<MoodStats> {
        try {
            // Calculer la date de début pour la période
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Requête pour les statistiques de base
            const [stats] = await db
                .select({
                    average: avg(moodEntries.mood),
                    count: count(),
                    min: min(moodEntries.mood),
                    max: max(moodEntries.mood)
                })
                .from(moodEntries)
                .where(
                    and(
                        eq(moodEntries.userId, userId),
                        gte(moodEntries.timestamp, startDate)
                    )
                );

            // Initialiser les tableaux de tendances vides
            const byHour: Array<{ hour: number; avgMood: number; count: number }> = [];
            const byDayOfWeek: Array<{ dayOfWeek: number; avgMood: number; count: number }> = [];
            const byMonth: Array<{ month: number; avgMood: number; count: number }> = [];

            try {
                // Requête pour les tendances par heure
                const byHourQuery = sql`
                    SELECT 
                        EXTRACT(HOUR FROM timestamp) as hour,
                        AVG(mood) as avg_mood,
                        COUNT(*) as entry_count
                    FROM mood_entries
                    WHERE user_id = ${userId}
                      AND timestamp >= ${startDate.toISOString()}
                    GROUP BY EXTRACT(HOUR FROM timestamp)
                    ORDER BY hour
                `;

                // Requête pour les tendances par jour de la semaine
                const byDayOfWeekQuery = sql`
                    SELECT 
                        EXTRACT(DOW FROM timestamp) as day_of_week,
                        AVG(mood) as avg_mood,
                        COUNT(*) as entry_count
                    FROM mood_entries
                    WHERE user_id = ${userId}
                      AND timestamp >= ${startDate.toISOString()}
                    GROUP BY EXTRACT(DOW FROM timestamp)
                    ORDER BY day_of_week
                `;

                // Requête pour les tendances par mois
                const byMonthQuery = sql`
                    SELECT 
                        EXTRACT(MONTH FROM timestamp) as month,
                        AVG(mood) as avg_mood,
                        COUNT(*) as entry_count
                    FROM mood_entries
                    WHERE user_id = ${userId}
                      AND timestamp >= ${startDate.toISOString()}
                    GROUP BY EXTRACT(MONTH FROM timestamp)
                    ORDER BY month
                `;

                // Exécuter toutes les requêtes de tendances
                const hourResult = await db.execute(byHourQuery);
                const dayResult = await db.execute(byDayOfWeekQuery);
                const monthResult = await db.execute(byMonthQuery);

                // Transformer les résultats si les requêtes ont réussi
                if (hourResult && hourResult.rows) {
                    for (const row of hourResult.rows) {
                        byHour.push({
                            hour: parseInt(row.hour),
                            avgMood: parseFloat(row.avg_mood),
                            count: parseInt(row.entry_count)
                        });
                    }
                }

                if (dayResult && dayResult.rows) {
                    for (const row of dayResult.rows) {
                        byDayOfWeek.push({
                            dayOfWeek: parseInt(row.day_of_week),
                            avgMood: parseFloat(row.avg_mood),
                            count: parseInt(row.entry_count)
                        });
                    }
                }

                if (monthResult && monthResult.rows) {
                    for (const row of monthResult.rows) {
                        byMonth.push({
                            month: parseInt(row.month),
                            avgMood: parseFloat(row.avg_mood),
                            count: parseInt(row.entry_count)
                        });
                    }
                }
            } catch (trendError) {
                console.error('Erreur lors de la récupération des tendances:', trendError);
                // Continuer avec des tendances vides
            }

            return {
                average: stats?.average ? Math.round(stats.average * 10) / 10 : 0,
                count: stats?.count || 0,
                min: stats?.min || 0,
                max: stats?.max || 0,
                period: `${days} jours`,
                trends: {
                    byHour,
                    byDayOfWeek,
                    byMonth
                }
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            // Retourner des statistiques par défaut en cas d'erreur
            return {
                average: 0,
                count: 0,
                min: 0,
                max: 0,
                period: `${days} jours`,
                trends: {
                    byHour: [],
                    byDayOfWeek: [],
                    byMonth: []
                }
            };
        }
    }

    // Remplacer la méthode getTimelineData dans src/services/moodService.ts

    /**
     * Récupère les données de timeline pour un graphique
     */
    static async getTimelineData(
        userId: string,
        period: 'day' | 'week' | 'month' | 'year',  // Ajout de 'year'
        startDate: Date,
        endDate: Date
    ): Promise<TimelineData[]> {
        try {
            let groupByQuery;

            // S'assurer que les dates sont correctement formatées pour la requête SQL
            const formattedStartDate = startDate.toISOString();
            const formattedEndDate = endDate.toISOString();

            console.log(`Récupération timeline du ${formattedStartDate} au ${formattedEndDate}, période: ${period}`);

            // Vérifier si la plage de dates contient des données
            const countCheck = await db.select({ count: count() })
                .from(moodEntries)
                .where(and(
                    eq(moodEntries.userId, userId),
                    gte(moodEntries.timestamp, startDate),
                    lte(moodEntries.timestamp, endDate)
                ));

            const entriesCount = countCheck[0]?.count || 0;
            console.log(`Nombre total d'entrées dans la plage de dates: ${entriesCount}`);

            if (entriesCount === 0) {
                console.log('Aucune entrée trouvée dans la plage de dates sélectionnée');
                return [];
            }

            // Créer la requête en fonction de la période
            switch (period) {
                case 'day':
                    groupByQuery = sql`
                    SELECT
                        date_trunc('hour', timestamp) as period,
                        AVG(mood) as average_mood,
                        COUNT(*) as entry_count,
                        array_agg(id) as entry_ids
                    FROM mood_entries
                    WHERE user_id = ${userId}
                      AND timestamp >= ${formattedStartDate}
                      AND timestamp <= ${formattedEndDate}
                    GROUP BY date_trunc('hour', timestamp)
                    ORDER BY period
                `;
                    break;
                case 'week':
                    groupByQuery = sql`
                    SELECT
                        date_trunc('day', timestamp) as period,
                        AVG(mood) as average_mood,
                        COUNT(*) as entry_count,
                        array_agg(id) as entry_ids
                    FROM mood_entries
                    WHERE user_id = ${userId}
                      AND timestamp >= ${formattedStartDate}
                      AND timestamp <= ${formattedEndDate}
                    GROUP BY date_trunc('day', timestamp)
                    ORDER BY period
                `;
                    break;
                case 'month':
                    groupByQuery = sql`
                    SELECT
                        date_trunc('day', timestamp) as period,
                        AVG(mood) as average_mood,
                        COUNT(*) as entry_count,
                        array_agg(id) as entry_ids
                    FROM mood_entries
                    WHERE user_id = ${userId}
                      AND timestamp >= ${formattedStartDate}
                      AND timestamp <= ${formattedEndDate}
                    GROUP BY date_trunc('day', timestamp)
                    ORDER BY period
                `;
                    break;
                case 'year':
                    groupByQuery = sql`
                    SELECT
                        date_trunc('month', timestamp) as period,
                        AVG(mood) as average_mood,
                        COUNT(*) as entry_count,
                        array_agg(id) as entry_ids
                    FROM mood_entries
                    WHERE user_id = ${userId}
                      AND timestamp >= ${formattedStartDate}
                      AND timestamp <= ${formattedEndDate}
                    GROUP BY date_trunc('month', timestamp)
                    ORDER BY period
                `;
                    break;
                default:
                    throw new Error('Période non valide');
            }

            // Exécuter la requête
            const result = await db.execute(groupByQuery);

            // Vérifier si result.rows est défini avant de l'utiliser
            if (!result || !result.rows) {
                console.log('Aucun résultat retourné par la requête timeline');
                return [];
            }

            console.log(`Résultats timeline: ${result.rows.length} périodes trouvées`);

            // Si aucun résultat, retourner un tableau vide
            if (result.rows.length === 0) {
                console.log('Aucune donnée groupée trouvée pour la période spécifiée');
                return [];
            }

            // Transformer les résultats en objets TimelineData
            const timelineData: TimelineData[] = [];

            for (const row of result.rows) {
                try {
                    // Vérifier que les données nécessaires sont présentes
                    if (row && row.period) {
                        const avgMood = row.average_mood ? parseFloat(row.average_mood) : 0;
                        const entryCount = row.entry_count ? parseInt(row.entry_count) : 0;

                        // Récupérer les entrées détaillées si nécessaire
                        let entries: MoodEntry[] = [];

                        if (row.entry_ids && Array.isArray(row.entry_ids)) {
                            // Simplification: on ne récupère pas toutes les entrées
                            // Cela pourrait être trop lourd pour le frontend
                            entries = [];
                        }

                        timelineData.push({
                            date: row.period.toISOString(),
                            averageMood: Math.round(avgMood * 10) / 10,
                            entryCount: entryCount,
                            entries: entries
                        });
                    }
                } catch (rowError) {
                    console.error('Erreur lors du traitement d\'une ligne de timeline:', rowError);
                    // Continuer avec la ligne suivante
                }
            }

            return timelineData;
        } catch (error) {
            console.error('Erreur lors de la récupération des données de timeline:', error);
            // Retourner un tableau vide en cas d'erreur
            return [];
        }
    }
}

export default MoodService;