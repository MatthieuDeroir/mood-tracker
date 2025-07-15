// src/db/migrate.ts - Script de migration Drizzle
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, testConnection, ensureDefaultUser } from './database.ts';
import { sql } from 'drizzle-orm';
import * as schema from './schema.ts';

async function runMigration() {
    try {
        console.log('🔧 Démarrage de la migration de la base de données...');

        // Tester la connexion à la base de données
        await testConnection();

        // Option 1: Utiliser les migrations Drizzle
        try {
            console.log('📦 Exécution des migrations depuis le dossier drizzle/...');
            await migrate(db, { migrationsFolder: './drizzle' });
            console.log('✅ Migrations terminées avec succès');
        } catch (error) {
            console.error('⚠️ Erreur avec les migrations Drizzle:', error.message);
            console.log('⚠️ Tentative d\'exécution manuelle du schéma SQL...');

            // Option 2: Exécuter manuellement le schéma SQL si les migrations échouent
            await createTablesManually();
        }

        // Créer un utilisateur par défaut
        await ensureDefaultUser();

        // Récupérer des statistiques de la base de données
        const userResult = await db.execute(sql`SELECT COUNT(*) FROM users`);
        const moodResult = await db.execute(sql`SELECT COUNT(*) FROM mood_entries`);

        console.log(`📊 Statistiques de la base de données:`);
        console.log(`   - Utilisateurs: ${userResult[0]?.[0]?.count || 0}`);
        console.log(`   - Entrées d'humeur: ${moodResult[0]?.[0]?.count || 0}`);

        // Afficher la version PostgreSQL
        const versionResult = await db.execute(sql`SELECT version()`);
        console.log(`📦 Version PostgreSQL: ${versionResult[0]?.[0]?.version || 'Inconnue'}`);

        console.log('✅ Migration terminée avec succès!');

    } catch (error) {
        console.error('❌ Échec de la migration:', error);
        throw error;
    }
}

// Fonction pour créer les tables manuellement si les migrations échouent
async function createTablesManually() {
    try {
        // Créer l'extension uuid-ossp si elle n'existe pas
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Créer la table des utilisateurs
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "users" (
                                                   "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                                   "email" VARCHAR(255) NOT NULL UNIQUE,
                                                   "name" VARCHAR(255) NOT NULL,
                                                   "settings" JSONB NOT NULL DEFAULT '{"timezone":"Europe/Paris","moodLabels":{"0":"Terrible","1":"Très mal","2":"Mal","3":"Pas bien","4":"Faible","5":"Neutre","6":"Correct","7":"Bien","8":"Très bien","9":"Super","10":"Incroyable"}}',
                                                   "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                                                   "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);

        // Créer la table des entrées d'humeur
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "mood_entries" (
                                                          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                                          "user_id" UUID NOT NULL,
                                                          "mood" INTEGER NOT NULL CHECK (mood >= 0 AND mood <= 10),
                                                          "note" TEXT,
                                                          "tags" JSONB NOT NULL DEFAULT '[]',
                                                          "sleep_hours" REAL, 
                                                          "medication" REAL,
                                                          "emotions" TEXT,
                                                          "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
                                                          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                                                          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                                                          FOREIGN KEY ("user_id") REFERENCES "users" ("id")
            )
        `);

        // Créer les index
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS "user_timestamp_idx" ON "mood_entries" ("user_id", "timestamp")
        `);

        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS "timestamp_idx" ON "mood_entries" ("timestamp")
        `);

        console.log('✅ Tables créées manuellement avec succès');
    } catch (error) {
        console.error('❌ Échec de la création manuelle des tables:', error);
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
            console.log('Usage: deno run --allow-net --allow-read --allow-write --allow-env src/db/migrate.ts [migrate|reset|seed|reset-and-seed]');
            break;
    }
}