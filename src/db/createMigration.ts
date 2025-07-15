// src/db/createMigration.ts
import { dirname } from "https://deno.land/std/path/mod.ts";

// Nom du fichier basé sur l'horodatage
const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
const migrationName = `${timestamp}_initial_schema.sql`;
const migrationDir = "./drizzle";

// Vérifier si le répertoire existe, sinon le créer
try {
    await Deno.mkdir(migrationDir, { recursive: true });
} catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
    }
}

// Le contenu de la migration SQL
const migrationContent = `-- Migration initiale: création des tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table utilisateurs
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "name" VARCHAR(255) NOT NULL,
  "settings" JSONB NOT NULL DEFAULT '{"timezone":"Europe/Paris","moodLabels":{"0":"Terrible","1":"Très mal","2":"Mal","3":"Pas bien","4":"Faible","5":"Neutre","6":"Correct","7":"Bien","8":"Très bien","9":"Super","10":"Incroyable"}}',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table des entrées d'humeur
CREATE TABLE IF NOT EXISTS "mood_entries" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "mood" INTEGER NOT NULL CHECK (mood >= 0 AND mood <= 10),
  "note" TEXT,
  "tags" JSONB NOT NULL DEFAULT '[]',
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id")
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS "user_timestamp_idx" ON "mood_entries" ("user_id", "timestamp");
CREATE INDEX IF NOT EXISTS "timestamp_idx" ON "mood_entries" ("timestamp");
`;

// Écrire la migration dans un fichier
const migrationPath = `${migrationDir}/${migrationName}`;
await Deno.writeTextFile(migrationPath, migrationContent);

console.log(`✅ Migration créée à ${migrationPath}`);