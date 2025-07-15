// src/services/moodService.ts - Services Sequelize
import { Op, fn, col, QueryTypes } from 'sequelize';
import { MoodEntry, User, sequelize } from '../models/index.ts';

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
    entries: any[];
}

export class MoodService {

    // Créer un mood
    static async createMood(userId: string, mood: number, note?: string, tags: string[] = []): Promise<MoodEntry> {
        try {
            const moodEntry = await MoodEntry.create({
                user_id: userId,
                mood,
                note,
                tags,
                timestamp: new Date(),
            });

            console.log(`💾 Mood created: ${mood}/10 for user ${userId}`);
            return moodEntry;
        } catch (error) {
            console.error('Error creating mood:', error);
            throw error;
        }
    }

    // Récupérer les moods d'un utilisateur
    static async getUserMoods(userId: string, startDate?: Date, endDate?: Date, limit = 100): Promise<MoodEntry[]> {
        try {
            const whereConditions: any = { user_id: userId };

            if (startDate || endDate) {
                whereConditions.timestamp = {};
                if (startDate) whereConditions.timestamp[Op.gte] = startDate;
                if (endDate) whereConditions.timestamp[Op.lte] = endDate;
            }

            const moods = await MoodEntry.findAll({
                where: whereConditions,
                order: [['timestamp', 'DESC']],
                limit,
            });

            return moods;
        } catch (error) {
            console.error('Error fetching moods:', error);
            throw error;
        }
    }

    // Récupérer un mood par ID
    static async getMoodById(moodId: string, userId: string): Promise<MoodEntry | null> {
        try {
            const mood = await MoodEntry.findOne({
                where: { id: moodId, user_id: userId },
            });

            return mood;
        } catch (error) {
            console.error('Error fetching mood:', error);
            throw error;
        }
    }

    // Supprimer un mood
    static async deleteMood(moodId: string, userId: string): Promise<boolean> {
        try {
            const result = await MoodEntry.destroy({
                where: { id: moodId, user_id: userId },
            });

            console.log(`🗑️ Mood deleted: ${moodId} for user ${userId}`);
            return result > 0;
        } catch (error) {
            console.error('Error deleting mood:', error);
            throw error;
        }
    }

    // Mettre à jour un mood
    static async updateMood(moodId: string, userId: string, updates: Partial<{ mood: number; note: string; tags: string[] }>): Promise<MoodEntry | null> {
        try {
            const [affectedCount] = await MoodEntry.update(updates, {
                where: { id: moodId, user_id: userId },
            });

            if (affectedCount === 0) {
                return null;
            }

            const updatedMood = await MoodEntry.findByPk(moodId);
            console.log(`📝 Mood updated: ${moodId} for user ${userId}`);
            return updatedMood;
        } catch (error) {
            console.error('Error updating mood:', error);
            throw error;
        }
    }

    // Statistiques générales
    static async getMoodStats(userId: string, days = 7): Promise<MoodStats> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const moods = await MoodEntry.findAll({
                where: {
                    user_id: userId,
                    timestamp: { [Op.gte]: cutoffDate },
                },
                attributes: ['mood', 'timestamp'],
                order: [['timestamp', 'ASC']],
            });

            if (moods.length === 0) {
                return {
                    average: 0,
                    count: 0,
                    min: 0,
                    max: 0,
                    period: `${days} days`,
                };
            }

            const moodValues = moods.map(m => m.mood);
            const average = moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length;

            // Tendances par heure
            const trends = await this.getTrends(userId, cutoffDate);

            return {
                average: Math.round(average * 10) / 10,
                count: moods.length,
                min: Math.min(...moodValues),
                max: Math.max(...moodValues),
                period: `${days} days`,
                trends,
            };
        } catch (error) {
            console.error('Error getting mood stats:', error);
            throw error;
        }
    }

    // Tendances détaillées
    static async getTrends(userId: string, startDate: Date) {
        try {
            // Tendances par heure
            const hourlyTrends = await sequelize.query(`
        SELECT 
          strftime('%H', timestamp) as hour,
          AVG(mood) as avgMood,
          COUNT(*) as count
        FROM mood_entries 
        WHERE user_id = :userId AND timestamp >= :startDate
        GROUP BY strftime('%H', timestamp)
        ORDER BY hour
      `, {
                replacements: { userId, startDate: startDate.toISOString() },
                type: QueryTypes.SELECT,
            });

            // Tendances par jour de la semaine
            const weeklyTrends = await sequelize.query(`
        SELECT 
          strftime('%w', timestamp) as dayOfWeek,
          AVG(mood) as avgMood,
          COUNT(*) as count
        FROM mood_entries 
        WHERE user_id = :userId AND timestamp >= :startDate
        GROUP BY strftime('%w', timestamp)
        ORDER BY dayOfWeek
      `, {
                replacements: { userId, startDate: startDate.toISOString() },
                type: QueryTypes.SELECT,
            });

            // Tendances par mois
            const monthlyTrends = await sequelize.query(`
        SELECT 
          strftime('%m', timestamp) as month,
          AVG(mood) as avgMood,
          COUNT(*) as count
        FROM mood_entries 
        WHERE user_id = :userId AND timestamp >= :startDate
        GROUP BY strftime('%m', timestamp)
        ORDER BY month
      `, {
                replacements: { userId, startDate: startDate.toISOString() },
                type: QueryTypes.SELECT,
            });

            return {
                byHour: hourlyTrends.map((t: any) => ({
                    hour: parseInt(t.hour),
                    avgMood: Math.round(t.avgMood * 10) / 10,
                    count: t.count,
                })),
                byDayOfWeek: weeklyTrends.map((t: any) => ({
                    dayOfWeek: parseInt(t.dayOfWeek),
                    avgMood: Math.round(t.avgMood * 10) / 10,
                    count: t.count,
                })),
                byMonth: monthlyTrends.map((t: any) => ({
                    month: parseInt(t.month),
                    avgMood: Math.round(t.avgMood * 10) / 10,
                    count: t.count,
                })),
            };
        } catch (error) {
            console.error('Error getting trends:', error);
            return {
                byHour: [],
                byDayOfWeek: [],
                byMonth: [],
            };
        }
    }

    // Données pour les graphiques timeline
    static async getTimelineData(userId: string, period: 'day' | 'week' | 'month', startDate: Date, endDate: Date): Promise<TimelineData[]> {
        try {
            let groupBy = '';
            let dateFormat = '';

            switch (period) {
                case 'day':
                    groupBy = "strftime('%Y-%m-%d %H', timestamp)";
                    dateFormat = '%Y-%m-%d %H:00';
                    break;
                case 'week':
                    groupBy = "strftime('%Y-%m-%d', timestamp)";
                    dateFormat = '%Y-%m-%d';
                    break;
                case 'month':
                    groupBy = "strftime('%Y-%m', timestamp)";
                    dateFormat = '%Y-%m';
                    break;
            }

            const results = await sequelize.query(`
        SELECT 
          ${groupBy} as period,
          AVG(mood) as averageMood,
          COUNT(*) as entryCount
        FROM mood_entries 
        WHERE user_id = :userId 
          AND timestamp >= :startDate 
          AND timestamp <= :endDate
        GROUP BY ${groupBy}
        ORDER BY period
      `, {
                replacements: {
                    userId,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                },
                type: QueryTypes.SELECT,
            });

            return results.map((row: any) => ({
                date: row.period,
                averageMood: Math.round(row.averageMood * 10) / 10,
                entryCount: row.entryCount,
                entries: [], // Peut être rempli si nécessaire
            }));
        } catch (error) {
            console.error('Error getting timeline data:', error);
            throw error;
        }
    }

    // Recherche dans les notes
    static async searchMoods(userId: string, query: string, limit = 50): Promise<MoodEntry[]> {
        try {
            const moods = await MoodEntry.findAll({
                where: {
                    user_id: userId,
                    note: { [Op.like]: `%${query}%` },
                },
                order: [['timestamp', 'DESC']],
                limit,
            });

            return moods;
        } catch (error) {
            console.error('Error searching moods:', error);
            throw error;
        }
    }
}

export default MoodService;