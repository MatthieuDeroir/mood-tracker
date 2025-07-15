// src/routes/api.ts - Version Sequelize
import { Hono } from 'hono';
import MoodService from '../services/moodService.ts';
import { User } from '../models/index.ts';

const api = new Hono();

// Middleware pour créer un utilisateur par défaut si nécessaire
async function ensureUser(userId: string) {
    let user = await User.findByPk(userId);

    if (!user) {
        user = await User.create({
            id: userId,
            email: `${userId}@example.com`,
            name: 'Default User',
            settings: {
                timezone: 'Europe/Paris',
                moodLabels: {
                    0: 'Terrible', 1: 'Très mal', 2: 'Mal', 3: 'Pas bien', 4: 'Faible',
                    5: 'Neutre', 6: 'Correct', 7: 'Bien', 8: 'Très bien', 9: 'Super', 10: 'Incroyable'
                }
            }
        });
        console.log(`👤 User created: ${userId}`);
    }

    return user;
}

// GET /api/health - Health check
api.get('/health', async (c) => {
    try {
        const totalMoods = await MoodService.getUserMoods('user1');

        return c.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'sequelize + sqlite3',
            totalMoods: totalMoods.length
        });
    } catch (error) {
        return c.json({
            status: 'error',
            error: error.message
        }, 500);
    }
});

// GET /api/moods - Liste des moods
api.get('/moods', async (c) => {
    try {
        const userId = 'user1'; // TODO: auth plus tard
        const startDate = c.req.query('start');
        const limit = parseInt(c.req.query('limit') || '100');

        await ensureUser(userId);

        let start: Date | undefined;
        if (startDate) {
            start = new Date(startDate);
        }

        const moods = await MoodService.getUserMoods(userId, start, undefined, limit);

        return c.json(moods);
    } catch (error) {
        console.error('Error fetching moods:', error);
        return c.json({ error: 'Failed to fetch moods' }, 500);
    }
});

// POST /api/moods - Créer un mood
api.post('/moods', async (c) => {
    try {
        const { mood, note, tags } = await c.req.json();
        const userId = 'user1'; // TODO: auth plus tard

        // Validation
        if (typeof mood !== 'number' || mood < 0 || mood > 10) {
            return c.json({ error: 'Mood must be a number between 0 and 10' }, 400);
        }

        await ensureUser(userId);

        const moodEntry = await MoodService.createMood(userId, mood, note, tags || []);

        return c.json({
            success: true,
            id: moodEntry.id,
            mood: moodEntry,
            message: 'Mood created successfully'
        });
    } catch (error) {
        console.error('Error creating mood:', error);
        return c.json({ error: 'Failed to create mood' }, 500);
    }
});

// PUT /api/moods/:id - Mettre à jour un mood
api.put('/moods/:id', async (c) => {
    try {
        const userId = 'user1';
        const moodId = c.req.param('id');
        const { mood, note, tags } = await c.req.json();

        // Validation
        if (mood !== undefined && (typeof mood !== 'number' || mood < 0 || mood > 10)) {
            return c.json({ error: 'Mood must be a number between 0 and 10' }, 400);
        }

        const updates: any = {};
        if (mood !== undefined) updates.mood = mood;
        if (note !== undefined) updates.note = note;
        if (tags !== undefined) updates.tags = tags;

        const updatedMood = await MoodService.updateMood(moodId, userId, updates);

        if (!updatedMood) {
            return c.json({ error: 'Mood not found' }, 404);
        }

        return c.json({
            success: true,
            mood: updatedMood,
            message: 'Mood updated successfully'
        });
    } catch (error) {
        console.error('Error updating mood:', error);
        return c.json({ error: 'Failed to update mood' }, 500);
    }
});

// DELETE /api/moods/:id - Supprimer un mood
api.delete('/moods/:id', async (c) => {
    try {
        const userId = 'user1';
        const moodId = c.req.param('id');

        const success = await MoodService.deleteMood(moodId, userId);

        if (!success) {
            return c.json({ error: 'Mood not found' }, 404);
        }

        return c.json({
            success: true,
            message: 'Mood deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting mood:', error);
        return c.json({ error: 'Failed to delete mood' }, 500);
    }
});

// GET /api/analytics - Statistiques
api.get('/analytics', async (c) => {
    try {
        const userId = 'user1';
        const days = parseInt(c.req.query('days') || '7');

        await ensureUser(userId);

        const stats = await MoodService.getMoodStats(userId, days);

        return c.json(stats);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return c.json({ error: 'Failed to fetch analytics' }, 500);
    }
});

// GET /api/timeline - Données pour graphiques
api.get('/timeline', async (c) => {
    try {
        const userId = 'user1';
        const period = c.req.query('period') as 'day' | 'week' | 'month' || 'week';
        const startDate = new Date(c.req.query('start') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        const endDate = new Date(c.req.query('end') || new Date());

        await ensureUser(userId);

        const timelineData = await MoodService.getTimelineData(userId, period, startDate, endDate);

        return c.json(timelineData);
    } catch (error) {
        console.error('Error fetching timeline:', error);
        return c.json({ error: 'Failed to fetch timeline' }, 500);
    }
});

// GET /api/search - Recherche dans les notes
api.get('/search', async (c) => {
    try {
        const userId = 'user1';
        const query = c.req.query('q') || '';
        const limit = parseInt(c.req.query('limit') || '50');

        if (!query.trim()) {
            return c.json({ error: 'Search query is required' }, 400);
        }

        await ensureUser(userId);

        const results = await MoodService.searchMoods(userId, query, limit);

        return c.json({
            query,
            results,
            count: results.length
        });
    } catch (error) {
        console.error('Error searching moods:', error);
        return c.json({ error: 'Failed to search moods' }, 500);
    }
});

// GET /api/debug - Debug info
api.get('/debug', async (c) => {
    try {
        const userId = 'user1';

        await ensureUser(userId);

        const recentMoods = await MoodService.getUserMoods(userId, undefined, undefined, 5);
        const stats = await MoodService.getMoodStats(userId, 7);

        return c.json({
            recentMoods,
            stats,
            timestamp: new Date().toISOString(),
            database: 'sequelize + sqlite3'
        });
    } catch (error) {
        console.error('Error getting debug info:', error);
        return c.json({ error: 'Failed to get debug info' }, 500);
    }
});

export { api as apiRoutes };