// src/db/migrate.ts - Script de migration Drizzle
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, testConnection, ensureDefaultUser } from './database.ts';

async function runMigration() {
    try {
        console.log('🔧 Démarrage de la migration de la base de données...');

        // Tester la connexion à la base de données
        await testConnection();

        // Exécuter les migrations
        console.log('📦 Exécution des migrations...');
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('✅ Migrations terminées avec succès');

        // Créer un utilisateur par défaut
        await ensureDefaultUser();

        // Récupérer des statistiques de la base de données
        const userCount = await db.query.users.count();
        const moodCount = await db.query.moodEntries.count();

        console.log(`📊 Statistiques de la base de données:`);
        console.log(`   - Utilisateurs: ${userCount}`);
        console.log(`   - Entrées d'humeur: ${moodCount}`);

        // Afficher la version PostgreSQL
        const versionResult = await db.execute(sql`SELECT version()`);
        console.log(`📦 Version PostgreSQL: ${versionResult.rows[0].version}`);

        console.log('✅ Migration terminée avec succès!');

    } catch (error) {
        console.error('❌ Échec de la migration:', error);
        throw error;
    }
}

// Fonction pour réinitialiser la base de données
async function resetDatabase() {
    try {
        console.log('🔄 Réinitialisation de la base de données...');

        // Supprimer toutes les entrées
        await db.delete(schema.moodEntries);
        await db.delete(schema.users);

        console.log('✅ Réinitialisation terminée!');
    } catch (error) {
        console.error('❌ Échec de la réinitialisation de la base de données:', error);
        throw error;
    }
}

// Fonction pour peupler la base de données avec des données de test
async function seedDatabase() {
    try {
        console.log('🌱 Peuplement de la base de données...');

        // Créer l'utilisateur par défaut
        const user = await ensureDefaultUser();

        // Créer quelques humeurs de test
        const testMoods = [
            { mood: 7, note: 'Bonne journée au travail', tags: ['work', 'productive'] },
            { mood: 5, note: 'Journée normale', tags: ['routine'] },
            { mood: 8, note: 'Soirée avec des amis', tags: ['friends', 'social'] },
            { mood: 6, note: 'Exercice matinal', tags: ['health', 'exercise'] },
            { mood: 9, note: 'Excellent weekend !', tags: ['weekend', 'family'] },
        ];

        for (const moodData of testMoods) {
            // Calculer un timestamp aléatoire dans les 7 derniers jours
            const randomDate = new Date();
            randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 7));

            await db.insert(schema.moodEntries).values({
                userId: user.id,
                mood: moodData.mood,
                note: moodData.note,
                tags: moodData.tags,
                timestamp: randomDate
            });
        }

        console.log(`✅ Base de données peuplée avec ${testMoods.length} humeurs de test`);

    } catch (error) {
        console.error('❌ Échec du peuplement de la base de données:', error);
        throw error;
    }
}

// Interface CLI
if (import.meta.main) {
    const command = Deno.args[0] || 'migrate';

    switch (command) {
        case 'migrate':
            await runMigration();
            break;
        case 'reset':
            await resetDatabase();
            break;
        case 'seed':
            await seedDatabase();
            break;
        case 'reset-and-seed':
            await resetDatabase();
            await seedDatabase();
            break;
        default:
            console.log('Usage: deno run --allow-net --allow-read --allow-env src/db/migrate.ts [migrate|reset|seed|reset-and-seed]');
            break;
    }
}