// src/db/migrate.ts - Script de migration
import { sequelize } from './database.ts';
import { User, MoodEntry } from '../models/index.ts';

async function migrate() {
    try {
        console.log('🔧 Starting database migration...');

        // Tester la connexion
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Synchroniser les modèles (créer les tables)
        await sequelize.sync({ force: false, alter: true });
        console.log('✅ Database schema synchronized');

        // Créer un utilisateur par défaut si nécessaire
        const defaultUser = await User.findOrCreate({
            where: { email: 'user1@example.com' },
            defaults: {
                id: 'user1',
                email: 'user1@example.com',
                name: 'Default User',
                settings: {
                    timezone: 'Europe/Paris',
                    moodLabels: {
                        0: 'Terrible', 1: 'Très mal', 2: 'Mal', 3: 'Pas bien', 4: 'Faible',
                        5: 'Neutre', 6: 'Correct', 7: 'Bien', 8: 'Très bien', 9: 'Super', 10: 'Incroyable'
                    }
                }
            }
        });

        if (defaultUser[1]) {
            console.log('👤 Default user created');
        } else {
            console.log('👤 Default user already exists');
        }

        // Afficher les statistiques
        const userCount = await User.count();
        const moodCount = await MoodEntry.count();

        console.log(`📊 Database statistics:`);
        console.log(`   - Users: ${userCount}`);
        console.log(`   - Mood entries: ${moodCount}`);

        // Afficher la version SQLite
        const result = await sequelize.query('SELECT sqlite_version() as version');
        console.log(`📦 SQLite version: ${(result[0] as any)[0].version}`);

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Fonction pour reset la base de données
async function resetDatabase() {
    try {
        console.log('🔄 Resetting database...');

        await sequelize.authenticate();
        await sequelize.sync({ force: true });

        console.log('✅ Database reset completed!');
    } catch (error) {
        console.error('❌ Database reset failed:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Fonction pour seed avec des données de test
async function seedDatabase() {
    try {
        console.log('🌱 Seeding database...');

        await sequelize.authenticate();

        // Créer l'utilisateur par défaut
        const user = await User.findOrCreate({
            where: { email: 'user1@example.com' },
            defaults: {
                id: 'user1',
                email: 'user1@example.com',
                name: 'Default User',
                settings: {
                    timezone: 'Europe/Paris',
                    moodLabels: {
                        0: 'Terrible', 1: 'Très mal', 2: 'Mal', 3: 'Pas bien', 4: 'Faible',
                        5: 'Neutre', 6: 'Correct', 7: 'Bien', 8: 'Très bien', 9: 'Super', 10: 'Incroyable'
                    }
                }
            }
        });

        // Créer quelques moods de test
        const testMoods = [
            { mood: 7, note: 'Bonne journée au travail', tags: ['work', 'productive'] },
            { mood: 5, note: 'Journée normale', tags: ['routine'] },
            { mood: 8, note: 'Soirée avec des amis', tags: ['friends', 'social'] },
            { mood: 6, note: 'Exercice matinal', tags: ['health', 'exercise'] },
            { mood: 9, note: 'Excellent weekend !', tags: ['weekend', 'family'] },
        ];

        for (const moodData of testMoods) {
            await MoodEntry.create({
                user_id: 'user1',
                mood: moodData.mood,
                note: moodData.note,
                tags: moodData.tags,
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random dans les 7 derniers jours
            });
        }

        console.log(`✅ Database seeded with ${testMoods.length} test moods`);

    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// CLI interface
if (import.meta.main) {
    const command = Deno.args[0] || 'migrate';

    switch (command) {
        case 'migrate':
            await migrate();
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
            console.log('Usage: deno run migrate.ts [migrate|reset|seed|reset-and-seed]');
            break;
    }
}