// src/routes/api-import.ts
import { Hono } from 'hono';
import ImportService from '../services/importService.ts';
import { ensureDefaultUser } from '../db/database.ts';

const importApi = new Hono();

// POST /api/import/csv - Importer des données depuis un CSV
importApi.post('/csv', async (c) => {
    try {
        const user = await ensureDefaultUser();
        const userId = user.id;

        // Récupérer le fichier téléchargé
        const { file, options } = await c.req.json();

        if (!file) {
            return c.json({ error: 'Aucun contenu CSV fourni' }, 400);
        }

        // Importer les données avec options de correction
        const importOptions = {
            ...options,
            fixMode: options?.fixMode !== false // Activer par défaut
        };

        const importResults = await ImportService.importFromCsv(userId, file, importOptions);

        // Limiter le nombre d'erreurs affichées pour éviter une réponse trop volumineuse
        const displayErrors = importResults.errors.slice(0, 20);
        const hasMoreErrors = importResults.errors.length > 20;

        return c.json({
            success: true,
            results: {
                success: importResults.success,
                failed: importResults.failed,
                total: importResults.total,
                errors: displayErrors,
                hasMoreErrors,
                totalErrors: importResults.errors.length
            },
            message: `Importation terminée : ${importResults.success} entrées importées avec succès, ${importResults.failed} échouées sur ${importResults.total} total.`
        });
    } catch (error) {
        console.error('Erreur lors de l\'importation CSV:', error);
        return c.json({ error: 'Échec de l\'importation CSV', details: error.message }, 500);
    }
});

export { importApi };