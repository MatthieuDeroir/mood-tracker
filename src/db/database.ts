// src/db/database.ts - Configuration Drizzle pour PostgreSQL
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

// Récupérer l'URL de la base de données depuis les variables d'environnement
const databaseUrl = Deno.env.get('DATABASE_URL') || "postgres://postgres:78934797497@localhost:5432/mood-tracker";

if (!databaseUrl) {
    console.error('❌ DATABASE_URL n\'est pas définie dans les variables d\'environnement');
    Deno.exit(1);
}

// Initialiser le client PostgreSQL
const client = postgres(databaseUrl, { max: 10 });

// Initialiser Drizzle avec le client et le schéma
export const db = drizzle(client, { schema });

// Fonctions utilitaires
export async function testConnection(): Promise<void> {
    try {
        // Tester la connexion en effectuant une requête simple
        const result = await client`SELECT current_timestamp as now`;
        console.log(`✅ Connexion à la base de données établie`);
        console.log(`🕒 Heure du serveur: ${result[0].now}`);
        return Promise.resolve();
    } catch (error) {
        console.error('❌ Échec de la connexion à la base de données:', error);
        return Promise.reject(error);
    }
}

export async function closeConnection(): Promise<void> {
    try {
        await client.end();
        console.log('🔒 Connexion à la base de données fermée');
        return Promise.resolve();
    } catch (error) {
        console.error('❌ Erreur lors de la fermeture de la connexion:', error);
        return Promise.reject(error);
    }
}

// Fonction pour assurer l'existence d'un utilisateur par défaut
export async function ensureDefaultUser(): Promise<schema.User> {
    try {
        // Rechercher l'utilisateur par email au lieu de l'ID
        const existingUsers = await db.select().from(schema.users).where(
            (users) => users.email.equals('user1@example.com')
        );

        if (existingUsers.length > 0) {
            console.log('👤 Utilisateur par défaut trouvé');
            return existingUsers[0];
        }

        // Créer l'utilisateur par défaut s'il n'existe pas
        // Sans spécifier d'ID explicitement - PostgreSQL générera un UUID automatiquement
        const [newUser] = await db.insert(schema.users)
            .values({
                email: 'user1@example.com',
                name: 'Default User',
                settings: {
                    timezone: 'Europe/Paris',
                    moodLabels: {
                        0: 'Terrible', 1: 'Très mal', 2: 'Mal', 3: 'Pas bien', 4: 'Faible',
                        5: 'Neutre', 6: 'Correct', 7: 'Bien', 8: 'Très bien', 9: 'Super', 10: 'Incroyable'
                    }
                }
            })
            .returning();

        console.log('👤 Utilisateur par défaut créé');
        return newUser;
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'utilisateur par défaut:', error);
        throw error;
    }
}