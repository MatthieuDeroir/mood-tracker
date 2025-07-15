// src/routes/api.ts - Version corrigée

import { Hono } from 'hono';
import MoodService from '../services/moodService.ts';
import ImportService from '../services/importService.ts';
import { ensureDefaultUser } from '../db/database.ts';
import { eq } from 'drizzle-orm';

const api = new Hono();

// GET /api/health - Vérification d'état
api.get('/health', async (c) => {
    try {
        const user = await ensureDefaultUser();
        const totalMoods = await MoodService.getUserMoods(user.id);

        return c.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'drizzle + postgresql',
            totalMoods: totalMoods.length
        });
    } catch (error) {
        console.error('Erreur health check:', error);
        return c.json({
            status: 'error',
            error: error.message
        }, 500);
    }
});

// GET /api/moods - Liste des humeurs
api.get('/moods', async (c) => {
    try {
        // Pour une approche simplifiée, nous récupérons d'abord l'utilisateur par défaut
        const user = await ensureDefaultUser();
        const userId = user.id;

        // Récupérer les paramètres de requête
        const startParam = c.req.query('start');
        const endParam = c.req.query('end');
        const limitParam = c.req.query('limit');

        const limit = limitParam ? parseInt(limitParam) : 100;

        // Convertir les dates si présentes
        let startDate, endDate;
        if (startParam) {
            startDate = new Date(startParam);
            console.log(`Date de début demandée: ${startParam}, convertie en: ${startDate}`);
        }
        if (endParam) {
            endDate = new Date(endParam);
        }

        // Vérifier que les dates sont valides
        if (startParam && isNaN(startDate.getTime())) {
            return c.json({ error: 'Date de début invalide' }, 400);
        }
        if (endParam && isNaN(endDate.getTime())) {
            return c.json({ error: 'Date de fin invalide' }, 400);
        }

        const moods = await MoodService.getUserMoods(userId, startDate, endDate, limit);
        console.log(`Moods récupérés: ${moods.length}`);

        return c.json(moods);
    } catch (error) {
        console.error('Erreur lors de la récupération des humeurs:', error);
        return c.json({ error: 'Échec de la récupération des humeurs', details: error.message }, 500);
    }
});

// POST /api/moods - Créer une humeur
api.post('/moods', async (c) => {
    try {
        const { mood, note, tags, sleepHours, medication, emotions } = await c.req.json();

        // Récupérer l'utilisateur par défaut
        const user = await ensureDefaultUser();
        const userId = user.id;

        // Validation
        if (typeof mood !== 'number' || mood < 0 || mood > 10) {
            return c.json({ error: 'L\'humeur doit être un nombre entre 0 et 10' }, 400);
        }

        const newMood = {
            userId,
            mood,
            note,
            tags: tags || [],
            sleepHours: sleepHours !== undefined ? parseFloat(sleepHours) : null,
            medication: medication !== undefined ? parseFloat(medication) : null,
            emotions,
            timestamp: new Date()
        };

        const moodEntry = await MoodService.createMood(userId, newMood);

        return c.json({
            success: true,
            id: moodEntry.id,
            mood: moodEntry,
            message: 'Humeur créée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'humeur:', error);
        return c.json({ error: 'Échec de la création de l\'humeur', details: error.message }, 500);
    }
});

// PUT /api/moods/:id - Mettre à jour une humeur
api.put('/moods/:id', async (c) => {
    try {
        const moodId = c.req.param('id');
        const updates = await c.req.json();

        // Validation
        if (updates.mood !== undefined && (typeof updates.mood !== 'number' || updates.mood < 0 || updates.mood > 10)) {
            return c.json({ error: 'L\'humeur doit être un nombre entre 0 et 10' }, 400);
        }

        const updatedMood = await MoodService.updateMood(moodId, updates);

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
        return c.json({ error: 'Échec de la mise à jour de l\'humeur', details: error.message }, 500);
    }
});

// DELETE /api/moods/:id - Supprimer une humeur
api.delete('/moods/:id', async (c) => {
    try {
        const moodId = c.req.param('id');

        const success = await MoodService.deleteMood(moodId);

        if (!success) {
            return c.json({ error: 'Humeur non trouvée' }, 404);
        }

        return c.json({
            success: true,
            message: 'Humeur supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'humeur:', error);
        return c.json({ error: 'Échec de la suppression de l\'humeur', details: error.message }, 500);
    }
});

// GET /api/analytics - Statistiques
api.get('/analytics', async (c) => {
    try {
        const user = await ensureDefaultUser();
        const userId = user.id;

        const days = parseInt(c.req.query('days') || '30');

        const stats = await MoodService.getMoodStats(userId, days);
        console.log('Stats récupérées:', JSON.stringify(stats, null, 2));

        // Vérifier les valeurs pour éviter les undefined
        const safeStats = {
            average: stats.average || 0,
            count: stats.count || 0,
            min: stats.min || 0,
            max: stats.max || 0,
            period: stats.period || `${days} jours`,
            trends: stats.trends || {
                byHour: [],
                byDayOfWeek: [],
                byMonth: []
            }
        };

        return c.json(safeStats);
    } catch (error) {
        console.error('Erreur lors de la récupération des analyses:', error);
        return c.json({
            error: 'Échec de la récupération des analyses',
            details: error.message,
            // Retourner des valeurs par défaut pour éviter les erreurs côté client
            average: 0,
            count: 0,
            min: 0,
            max: 0,
            period: '30 jours',
            trends: {
                byHour: [],
                byDayOfWeek: [],
                byMonth: []
            }
        }, 500);
    }
});

// GET /api/timeline - Données pour graphiques
api.get('/timeline', async (c) => {
    try {
        const user = await ensureDefaultUser();
        const userId = user.id;

        const period = c.req.query('period') as 'day' | 'week' | 'month' || 'week';
        let startDate = new Date(c.req.query('start') || '');
        let endDate = new Date(c.req.query('end') || '');

        // Vérifier si les dates sont valides, sinon utiliser des valeurs par défaut
        if (isNaN(startDate.getTime())) {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        }

        if (isNaN(endDate.getTime())) {
            endDate = new Date();
        }

        console.log(`Récupération timeline: période=${period}, début=${startDate.toISOString()}, fin=${endDate.toISOString()}`);

        const timelineData = await MoodService.getTimelineData(userId, period, startDate, endDate);
        console.log(`Données timeline récupérées: ${timelineData.length} points`);

        return c.json(timelineData);
    } catch (error) {
        console.error('Erreur lors de la récupération de la timeline:', error);
        return c.json({ error: 'Échec de la récupération de la timeline', details: error.message }, 500);
    }
});

// GET /api/search - Recherche dans les notes
api.get('/search', async (c) => {
    try {
        const user = await ensureDefaultUser();
        const userId = user.id;

        const query = c.req.query('q') || '';
        const limit = parseInt(c.req.query('limit') || '50');

        if (!query.trim()) {
            return c.json({ error: 'Une requête de recherche est nécessaire' }, 400);
        }

        const results = await MoodService.searchMoods(userId, query, limit);

        return c.json({
            query,
            results,
            count: results.length
        });
    } catch (error) {
        console.error('Erreur lors de la recherche des humeurs:', error);
        return c.json({ error: 'Échec de la recherche des humeurs', details: error.message }, 500);
    }
});

// GET /api/debug - Info de débogage
api.get('/debug', async (c) => {
    try {
        const user = await ensureDefaultUser();
        const userId = user.id;

        const recentMoods = await MoodService.getUserMoods(userId, undefined, undefined, 5);
        const stats = await MoodService.getMoodStats(userId, 7);

        return c.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            recentMoods,
            stats,
            timestamp: new Date().toISOString(),
            database: 'drizzle + postgresql'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des infos de débogage:', error);
        return c.json({ error: 'Échec de la récupération des infos de débogage', details: error.message }, 500);
    }
});

export { api as apiRoutes };