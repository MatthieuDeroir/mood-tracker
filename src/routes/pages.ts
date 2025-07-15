import { Hono } from 'hono';

const pages = new Hono();

// Page principale
pages.get('/', async (c) => {
    const html = await Deno.readTextFile('./views/dashboard.html');
    return c.html(html);
});

// Page analytics
pages.get('/analytics', async (c) => {
    const html = await Deno.readTextFile('./views/analytics.html');
    return c.html(html);
});

// API de test pour vérifier que tout fonctionne
pages.get('/test', async (c) => {
    return c.json({
        message: "Pages router fonctionne !",
        timestamp: new Date().toISOString()
    });
});

export { pages as pageRoutes };