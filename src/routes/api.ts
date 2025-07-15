// src/routes/api.ts - Version Drizzle
import { Hono } from 'hono';
import MoodService from '../services/moodService.ts';
import { ensureDefaultUser } from '../db/database.ts';

const api = new Hono();

// GET /api/health - Vérification d'état
api.get('/health', async (c) => {
    try {
        const totalMoods = await MoodService.getUserMoods('user1');

        return c.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'drizzle + postgresql',
            totalMoods: totalMoods.length
        });
    } catch (error) {
        return c.json({
            status: 'error',
            error: error.message
        }, 500);
    }
});

// GET /api/moods - Liste des humeurs
api.get('/moods', async (c) => {
    try {
        const userId = 'user1'; // TODO: authentification plus tard
        const startDate = c.req.query('start');
        const limit = parseInt(c.req.query('limit') || '100');

        await ensureDefaultUser();

        let start: Date | undefined;
        if (startDate) {
            start = new Date(startDate);
        }

        const moods = await MoodService.getUserMoods(userId, start, undefined, limit);

        return c.json(moods);
    } catch (error) {
        console.error('Erreur lors de la récupération des humeurs:', error);
        return c.json({ error: 'Échec de la récupération des humeurs' }, 500);
    }
});

// POST /api/moods - Créer une humeur
api.post('/moods', async (c) => {
    try {
        const { mood, note, tags } = await c.req.json();
        const userId = 'user1'; // TODO: authentification plus tard

        // Validation
        if (typeof mood !== 'number' || mood < 0 || mood > 10) {
            return c.json({ error: 'L\'humeur doit être un nombre entre 0 et 10' }, 400);
        }

        await ensureDefaultUser();

        const moodEntry = await MoodService.createMood(userId, mood, note, tags || []);

        return c.json({
            success: true,
            id: moodEntry.id,
            mood: moodEntry,
            message: 'Humeur créée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'humeur:', error);
        return c.json({ error: 'Échec de la création de l\'humeur' }, 500);
    }
});

// PUT /api/moods/:id - Mettre à jour une humeur
api.put('/moods/:id', async (c) => {
    try {
        const userId = 'user1';
        const moodId = c.req.param('id');
        const { mood, note, tags } = await c.req.json();

        // Validation
        if (mood !== undefined && (typeof mood !== 'number' || mood < 0 || mood > 10)) {
            return c.json({ error: 'L\'humeur doit être un nombre entre 0 et 10' }, 400);
        }

        const updates: any = {};
        if (mood !== undefined) updates.mood = mood;
        if (note !== undefined) updates.note = note;
        if (tags !== undefined) updates.tags = tags;

        const updatedMood = await MoodService.updateMood(moodId, userId, updates);

        if (!updatedMood) {
            return c.json({ error: 'Humeur non trouvée' }, 404);
        }

        return c.json({
            success: true,
            mood: updatedMood,
            message: 'Humeur mise à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'humeur:', error);
        return c.json({ error: 'Échec de la mise à jour de l\'humeur' }, 500);
    }
});

// DELETE /api/moods/:id - Supprimer une humeur
api.delete('/moods/:id', async (c) => {
    try {
        const userId = 'user1';
        const moodId = c.req.param('id');

        const success = await MoodService.deleteMood(moodId, userId);

        if (!success) {
            return c.json({ error: 'Humeur non trouvée' }, 404);
        }

        return c.json({
            success: true,
            message: 'Humeur supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'humeur:', error);
        return c.json({ error: 'Échec de la suppression de l\'humeur' }, 500);
    }
});

// GET /api/analytics - Statistiques
api.get('/analytics', async (c) => {
    try {
        const userId = 'user1';
        const days = parseInt(c.req.query('days') || '7');

        await ensureDefaultUser();

        const stats = await MoodService.getMoodStats(userId, days);

        return c.json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des analyses:', error);
        return c.json({ error: 'Échec de la récupération des analyses' }, 500);
    }
});

// GET /api/timeline - Données pour graphiques
api.get('/timeline', async (c) => {
    try {
        const userId = 'user1';
        const period = c.req.query('period') as 'day' | 'week' | 'month' || 'week';
        const startDate = new Date(c.req.query('start') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        const endDate = new Date(c.req.query('end') || new Date());

        await ensureDefaultUser();

        const timelineData = await MoodService.getTimelineData(userId, period, startDate, endDate);

        return c.json(timelineData);
    } catch (error) {
        console.error('Erreur lors de la récupération de la timeline:', error);
        return c.json({ error: 'Échec de la récupération de la timeline' }, 500);
    }
});

// GET /api/search - Recherche dans les notes
api.get('/search', async (c) => {
    try {
        const userId = 'user1';
        const query = c.req.query('q') || '';
        const limit = parseInt(c.req.query('limit') || '50');

        if (!query.trim()) {
            return c.json({ error: 'Une requête de recherche est nécessaire' }, 400);
        }

        await ensureDefaultUser();

        const results = await MoodService.searchMoods(userId, query, limit);

        return c.json({
            query,
            results,
            count: results.length
        });
    } catch (error) {
        console.error('Erreur lors de la recherche des humeurs:', error);
        return c.json({ error: 'Échec de la recherche des humeurs' }, 500);
    }
});

// GET /api/debug - Info de débogage
api.get('/debug', async (c) => {
    try {
        const userId = 'user1';

        await ensureDefaultUser();

        const recentMoods = await MoodService.getUserMoods(userId, undefined, undefined, 5);
        const stats = await MoodService.getMoodStats(userId, 7);

        return c.json({
            recentMoods,
            stats,
            timestamp: new Date().toISOString(),
            database: 'drizzle + postgresql'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des infos de débogage:', error);
        return c.json({ error: 'Échec de la récupération des infos de débogage' }, 500);
    }
});

export { api as apiRoutes };