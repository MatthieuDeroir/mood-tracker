// src/lib/db/schema.ts
import { pgTable, uuid, varchar, integer, text, jsonb, real, timestamp, check } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default('gen_random_uuid()'),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const moodEntries = pgTable('mood_entries', {
  id: uuid('id').primaryKey().default('gen_random_uuid()'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

  // Mesure principale (obligatoire)
  mood: integer('mood').notNull(),

  // Données complémentaires optionnelles
  note: text('note'),
  tags: jsonb('tags').$type<string[]>().default([]),
  sleepHours: real('sleep_hours'),
  medication: real('medication'),
  emotions: text('emotions'),

  // Métadonnées
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  moodCheck: check('mood_check', 'mood >= 0 AND mood <= 10'),
}));

// Types TypeScript dérivés
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type NewMoodEntry = typeof moodEntries.$inferInsert;