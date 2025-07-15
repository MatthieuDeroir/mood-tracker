// src/db/schema.ts - Schéma Drizzle
import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    integer,
    json,
    foreignKey,
    index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Table utilisateurs
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    settings: json('settings').$type<{
        timezone: string;
        moodLabels: Record<number, string>;
    }>().notNull().default({
        timezone: 'UTC',
        moodLabels: {
            0: 'Terrible',
            1: 'Très mal',
            2: 'Mal',
            3: 'Pas bien',
            4: 'Faible',
            5: 'Neutre',
            6: 'Correct',
            7: 'Bien',
            8: 'Très bien',
            9: 'Super',
            10: 'Incroyable'
        }
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Table des entrées d'humeur
export const moodEntries = pgTable('mood_entries', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id),
    mood: integer('mood').notNull().check('mood >= 0 AND mood <= 10'),
    note: text('note'),
    tags: json('tags').$type<string[]>().notNull().default([]),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
    return {
        userTimestampIdx: index('user_timestamp_idx').on(table.userId, table.timestamp),
        timestampIdx: index('timestamp_idx').on(table.timestamp)
    };
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    moods: many(moodEntries)
}));

export const moodEntriesRelations = relations(moodEntries, ({ one }) => ({
    user: one(users, {
        fields: [moodEntries.userId],
        references: [users.id]
    })
}));

// Types exportés pour l'utilisation dans l'application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type MoodEntry = typeof moodEntries.$inferSelect;
export type NewMoodEntry = typeof moodEntries.$inferInsert;