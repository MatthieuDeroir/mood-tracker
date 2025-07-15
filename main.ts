// main.ts - Version Sequelize
import { Hono } from 'hono';
import { serveStatic } from 'hono/middleware';
import { logger } from 'hono/middleware';
import { cors } from 'hono/middleware';

import { apiRoutes } from './src/routes/api.ts';
import { pageRoutes } from './src/routes/pages.ts';
import { initDatabase, closeDatabase } from './src/db/database.ts';

// Import des modèles pour s'assurer qu'ils sont initialisés
import './src/models/index.ts';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Static files (CSS, JS, images)
app.use('/static/*', serveStatic({ root: './' }));

// API routes
app.route('/api', apiRoutes);

// Page routes (HTML)
app.route('/', pageRoutes);

// Initialize Sequelize database
console.log('🔧 Initializing Sequelize database...');
try {
    await initDatabase();
    console.log('✅ Database ready!');
} catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('🔄 Exiting...');
    Deno.exit(1);
}

// Graceful shutdown
function gracefulShutdown() {
    console.log('🔄 Shutting down gracefully...');
    closeDatabase().then(() => {
        console.log('👋 Goodbye!');
        Deno.exit(0);
    }).catch((error) => {
        console.error('❌ Error during shutdown:', error);
        Deno.exit(1);
    });
}

// Handle shutdown signals
Deno.addSignalListener('SIGINT', gracefulShutdown);
Deno.addSignalListener('SIGTERM', gracefulShutdown);

// Start server
const port = 3000;
console.log(`🚀 Server running at http://localhost:${port}`);
console.log(`📊 Open http://localhost:${port} to start tracking your mood!`);
console.log(`🔍 Debug: http://localhost:${port}/api/debug`);
console.log(`❤️  Health: http://localhost:${port}/api/health`);
console.log(`🔧 Database: SQLite3 + Sequelize`);

try {
    await Deno.serve({ port }, app.fetch);
} catch (error) {
    console.error('❌ Server failed to start:', error);
    await gracefulShutdown();
}