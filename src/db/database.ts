// Import SQLite module
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import {Database} from "npm:sqlite@5.1.1";
// Initialize the database

let db: Database;

export async function initDatabase(): Promise<void> {
    try {
        console.log('🔧 Initializing SQLite database...');

        // Créer/ouvrir la base de données
        db = new Database("database.sqlite");

        // Activer les foreign keys
        db.exec("PRAGMA foreign_keys = ON");

        // Créer les tables
        createTables();

        console.log('✅ SQLite database initialized successfully');

        // Afficher la version SQLite
        const version = db.prepare("SELECT sqlite_version()").get() as { "sqlite_version()": string };
        console.log(`📦 SQLite version: ${version["sqlite_version()"]}`);

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

function createTables(): void {
    // Table users
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      settings TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Table mood_entries
    db.exec(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mood INTEGER NOT NULL CHECK (mood >= 0 AND mood <= 10),
      note TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      timestamp DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

    // Index pour les requêtes fréquentes
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_mood_user_timestamp 
    ON mood_entries(user_id, timestamp)
  `);

    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_mood_timestamp 
    ON mood_entries(timestamp)
  `);

    console.log('✅ Database tables created/verified');
}

export function getDatabase(): Database {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

export function closeDatabase(): void {
    if (db) {
        db.close();
        console.log('🔒 Database connection closed');
    }
}

// Créer un utilisateur par défaut
export async function ensureDefaultUser(): Promise<void> {
    const userId = 'user1';

    const existingUser = db.prepare(`
    SELECT id FROM users WHERE id = ?
  `).get(userId);

    if (!existingUser) {
        const defaultSettings = JSON.stringify({
            timezone: 'Europe/Paris',
            moodLabels: {
                0: 'Terrible', 1: 'Très mal', 2: 'Mal', 3: 'Pas bien', 4: 'Faible',
                5: 'Neutre', 6: 'Correct', 7: 'Bien', 8: 'Très bien', 9: 'Super', 10: 'Incroyable'
            }
        });

        db.prepare(`
      INSERT INTO users (id, email, name, settings) 
      VALUES (?, ?, ?, ?)
    `).run(userId, 'user1@example.com', 'Default User', defaultSettings);

        console.log('👤 Default user created');
    }
}