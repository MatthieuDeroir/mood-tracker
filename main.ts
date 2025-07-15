// main.ts - Version Drizzle
import { Hono } from 'hono';
import { serveStatic } from 'hono/middleware';
import { logger } from 'hono/middleware';
import { cors } from 'hono/middleware';

import { apiRoutes } from './src/routes/api.ts';
import { pageRoutes } from './src/routes/pages.ts';
import { importApi } from './src/routes/api-import.ts';
import { testConnection, closeConnection } from './src/db/database.ts';

// Charger les variables d'environnement depuis .env

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Fichiers statiques (CSS, JS, images)
app.use('/static/*', serveStatic({ root: './' }));

// Routes API
app.route('/api', apiRoutes);
app.route('/api/import', importApi);

// Routes des pages (HTML)
app.route('/', pageRoutes);

// Initialiser la base de données Drizzle
console.log('🔧 Initialisation de la base de données Drizzle...');
try {
    await testConnection();
    console.log('✅ Base de données prête!');
} catch (error) {
    console.error('❌ Échec de l\'initialisation de la base de données:', error);
    console.log('🔄 Sortie...');
    Deno.exit(1);
}

// Arrêt gracieux
function gracefulShutdown() {
    console.log('🔄 Arrêt gracieux...');
    closeConnection().then(() => {
        console.log('👋 Au revoir!');
        Deno.exit(0);
    }).catch((error) => {
        console.error('❌ Erreur lors de l\'arrêt:', error);
        Deno.exit(1);
    });
}

// Gérer les signaux d'arrêt
Deno.addSignalListener('SIGINT', gracefulShutdown);
Deno.addSignalListener('SIGTERM', gracefulShutdown);

// Démarrer le serveur
const port = 3000;
console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
console.log(`📊 Ouvrez http://localhost:${port} pour commencer à suivre votre humeur!`);
console.log(`🔍 Débogage: http://localhost:${port}/api/debug`);
console.log(`❤️  Santé: http://localhost:${port}/api/health`);
console.log(`🔧 Base de données: PostgreSQL + Drizzle`);

try {
    await Deno.serve({ port }, app.fetch);
} catch (error) {
    console.error('❌ Échec du démarrage du serveur:', error);
    await gracefulShutdown();
}