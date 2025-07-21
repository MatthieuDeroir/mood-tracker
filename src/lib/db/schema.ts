// src/lib/db/schema.ts
import { pgTable, uuid, varchar, integer, real, text, timestamp, jsonb, check } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  settings: jsonb('settings').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const moodEntries = pgTable('mood_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // 7 Mesures principales (0-10) - toutes optionnelles
  mood: integer('mood'), // Humeur générale
  sleepHours: real('sleep_hours'), // Heures de sommeil (peut être décimal)
  energy: integer('energy'), // Niveau d'énergie (0-10)
  stress: integer('stress'), // Niveau de stress (0-10)
  work: integer('work'), // Satisfaction travail (0-10)
  social: integer('social'), // Satisfaction sociale (0-10)
  alone: integer('alone'), // Bien-être en solitude (0-10)

  // Données complémentaires
  note: text('note'),
  tags: jsonb('tags').default('[]'),
  medication: real('medication'), // Médicaments pris
  emotions: text('emotions'), // Émotions ressenties

  // Métadonnées
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // Contraintes de validation
  moodCheck: check('mood_check', 'mood IS NULL OR (mood >= 0 AND mood <= 10)'),
  energyCheck: check('energy_check', 'energy IS NULL OR (energy >= 0 AND energy <= 10)'),
  stressCheck: check('stress_check', 'stress IS NULL OR (stress >= 0 AND stress <= 10)'),
  workCheck: check('work_check', 'work IS NULL OR (work >= 0 AND work <= 10)'),
  socialCheck: check('social_check', 'social IS NULL OR (social >= 0 AND social <= 10)'),
  aloneCheck: check('alone_check', 'alone IS NULL OR (alone >= 0 AND alone <= 10)'),

  // Au moins une mesure doit être renseignée
  atLeastOneMeasure: check('at_least_one_measure',
      'mood IS NOT NULL OR energy IS NOT NULL OR stress IS NOT NULL OR work IS NOT NULL OR social IS NOT NULL OR alone IS NOT NULL OR sleep_hours IS NOT NULL'
  )
}));

export const usersRelations = relations(users, ({ many }) => ({
  moodEntries: many(moodEntries),
}));

export const moodEntriesRelations = relations(moodEntries, ({ one }) => ({
  user: one(users, {
    fields: [moodEntries.userId],
    references: [users.id],
  }),
}));

// Types TypeScript pour l'utilisation dans l'app
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type NewMoodEntry = typeof moodEntries.$inferInsert;

// Migration SQL pour mettre à jour le schéma existant
export const migrationSQL = `
-- Ajouter les nouvelles colonnes des 7 mesures
ALTER TABLE mood_entries 
ADD COLUMN IF NOT EXISTS energy INTEGER,
ADD COLUMN IF NOT EXISTS stress INTEGER,
ADD COLUMN IF NOT EXISTS work INTEGER,
ADD COLUMN IF NOT EXISTS social INTEGER,
ADD COLUMN IF NOT EXISTS alone INTEGER;

-- Ajouter les contraintes de validation
ALTER TABLE mood_entries 
ADD CONSTRAINT IF NOT EXISTS mood_check CHECK (mood IS NULL OR (mood >= 0 AND mood <= 10)),
ADD CONSTRAINT IF NOT EXISTS energy_check CHECK (energy IS NULL OR (energy >= 0 AND energy <= 10)),
ADD CONSTRAINT IF NOT EXISTS stress_check CHECK (stress IS NULL OR (stress >= 0 AND stress <= 10)),
ADD CONSTRAINT IF NOT EXISTS work_check CHECK (work IS NULL OR (work >= 0 AND work <= 10)),
ADD CONSTRAINT IF NOT EXISTS social_check CHECK (social IS NULL OR (social >= 0 AND social <= 10)),
ADD CONSTRAINT IF NOT EXISTS alone_check CHECK (alone IS NULL OR (alone >= 0 AND alone <= 10));

-- Modifier la contrainte pour inclure toutes les mesures
ALTER TABLE mood_entries 
DROP CONSTRAINT IF EXISTS at_least_one_measure,
ADD CONSTRAINT at_least_one_measure CHECK (
  mood IS NOT NULL OR energy IS NOT NULL OR stress IS NOT NULL OR 
  work IS NOT NULL OR social IS NOT NULL OR alone IS NOT NULL OR 
  sleep_hours IS NOT NULL
);

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_timestamp ON mood_entries(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mood_entries_mood ON mood_entries(mood) WHERE mood IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mood_entries_energy ON mood_entries(energy) WHERE energy IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mood_entries_stress ON mood_entries(stress) WHERE stress IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mood_entries_work ON mood_entries(work) WHERE work IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mood_entries_social ON mood_entries(social) WHERE social IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mood_entries_alone ON mood_entries(alone) WHERE alone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mood_entries_sleep_hours ON mood_entries(sleep_hours) WHERE sleep_hours IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mood_entries_tags ON mood_entries USING GIN(tags);

-- Créer un utilisateur par défaut pour les tests
INSERT INTO users (id, email, name, settings) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@moodtracker.com',
  'Utilisateur Demo',
  '{
    "moodLabels": {
      "0": "Très mal",
      "1": "Mal",
      "2": "Pas bien",
      "3": "Moyen -",
      "4": "Moyen",
      "5": "Neutre",
      "6": "Bien",
      "7": "Très bien",
      "8": "Excellent",
      "9": "Fantastique",
      "10": "Euphorie"
    },
    "defaultTags": ["travail", "famille", "santé", "amis", "sport", "nourriture", "sommeil"]
  }'
) ON CONFLICT (id) DO NOTHING;
`;

// Constantes pour l'interface utilisateur
export const MOOD_MEASURES = {
  mood: {
    key: 'mood',
    emoji: '😊',
    label: 'Humeur générale',
    description: 'Comment vous sentez-vous globalement ?',
    color: 'bg-blue-500',
    scale: [
      { value: 0, emoji: '😰', label: 'Très mal' },
      { value: 2, emoji: '😔', label: 'Mal' },
      { value: 5, emoji: '😐', label: 'Neutre' },
      { value: 7, emoji: '🙂', label: 'Bien' },
      { value: 10, emoji: '🥳', label: 'Euphorie' }
    ]
  },
  energy: {
    key: 'energy',
    emoji: '⚡',
    label: 'Niveau d\'énergie',
    description: 'Quel est votre niveau d\'énergie ?',
    color: 'bg-yellow-500',
    scale: [
      { value: 0, emoji: '🔋', label: 'Épuisé' },
      { value: 2, emoji: '😴', label: 'Fatigué' },
      { value: 5, emoji: '😐', label: 'Moyen' },
      { value: 7, emoji: '💪', label: 'Énergique' },
      { value: 10, emoji: '⚡', label: 'Plein d\'énergie' }
    ]
  },
  stress: {
    key: 'stress',
    emoji: '😰',
    label: 'Niveau de stress',
    description: 'À quel point vous sentez-vous stressé ?',
    color: 'bg-red-500',
    scale: [
      { value: 0, emoji: '😌', label: 'Très détendu' },
      { value: 2, emoji: '🙂', label: 'Détendu' },
      { value: 5, emoji: '😐', label: 'Moyen' },
      { value: 7, emoji: '😟', label: 'Stressé' },
      { value: 10, emoji: '😰', label: 'Très stressé' }
    ]
  },
  work: {
    key: 'work',
    emoji: '💼',
    label: 'Satisfaction travail',
    description: 'Comment s\'est passé votre travail ?',
    color: 'bg-purple-500',
    scale: [
      { value: 0, emoji: '😫', label: 'Très difficile' },
      { value: 2, emoji: '😔', label: 'Difficile' },
      { value: 5, emoji: '😐', label: 'Correct' },
      { value: 7, emoji: '😊', label: 'Bien' },
      { value: 10, emoji: '🚀', label: 'Excellent' }
    ]
  },
  social: {
    key: 'social',
    emoji: '👥',
    label: 'Satisfaction sociale',
    description: 'Comment se sont passées vos interactions sociales ?',
    color: 'bg-green-500',
    scale: [
      { value: 0, emoji: '😞', label: 'Très mal' },
      { value: 2, emoji: '😔', label: 'Mal' },
      { value: 5, emoji: '😐', label: 'Correct' },
      { value: 7, emoji: '😊', label: 'Bien' },
      { value: 10, emoji: '🤝', label: 'Parfait' }
    ]
  },
  alone: {
    key: 'alone',
    emoji: '🧘',
    label: 'Bien-être en solitude',
    description: 'Comment vous sentez-vous quand vous êtes seul ?',
    color: 'bg-indigo-500',
    scale: [
      { value: 0, emoji: '😰', label: 'Très mal' },
      { value: 2, emoji: '😔', label: 'Mal' },
      { value: 5, emoji: '😐', label: 'Correct' },
      { value: 7, emoji: '😊', label: 'Bien' },
      { value: 10, emoji: '🧘', label: 'Parfait' }
    ]
  },
  sleepHours: {
    key: 'sleepHours',
    emoji: '😴',
    label: 'Heures de sommeil',
    description: 'Combien d\'heures avez-vous dormi ?',
    color: 'bg-cyan-500',
    unit: 'heures',
    min: 0,
    max: 24,
    step: 0.5
  }
} as const;

export const DEFAULT_TAGS = [
  'travail', 'famille', 'santé', 'amis', 'sport', 'nourriture',
  'sommeil', 'médecine', 'voyage', 'loisirs', 'stress', 'amour'
];

export type MeasureKey = keyof typeof MOOD_MEASURES;