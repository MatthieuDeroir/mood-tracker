import { db } from "@/lib/db";
import { moodEntries, users } from "@/lib/db/schema";
import { CreateMoodRequest, UpdateMoodRequest, MoodEntry, MoodStats } from "@/types";
import { eq, and, gte, lt, desc, asc } from "drizzle-orm";

export class MoodService {
  private static readonly DEFAULT_USER_ID = "default-user";

  static async ensureUserExists() {
    const user = await db.select().from(users).where(eq(users.id, this.DEFAULT_USER_ID)).limit(1);
    if (user.length === 0) {
      await db.insert(users).values({
        id: this.DEFAULT_USER_ID,
        email: "user@example.com",
        name: "Default User",
      });
    }
  }

  static async createMoodEntry(data: CreateMoodRequest): Promise<MoodEntry> {
    await this.ensureUserExists();
    
    const newMoodEntry = await db
      .insert(moodEntries)
      .values({
        userId: this.DEFAULT_USER_ID,
        mood: data.mood,
        note: data.note,
        tags: data.tags || [],
        sleepHours: data.sleepHours,
        medication: data.medication,
        emotions: data.emotions,
      })
      .returning();

    return newMoodEntry[0];
  }

  static async updateMoodEntry(id: string, data: UpdateMoodRequest): Promise<MoodEntry | null> {
    const updatedEntry = await db
      .update(moodEntries)
      .set({
        mood: data.mood,
        note: data.note,
        tags: data.tags,
        sleepHours: data.sleepHours,
        medication: data.medication,
        emotions: data.emotions,
        updatedAt: new Date(),
      })
      .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, this.DEFAULT_USER_ID)))
      .returning();

    return updatedEntry[0] || null;
  }

  static async deleteMoodEntry(id: string): Promise<boolean> {
    const result = await db
      .delete(moodEntries)
      .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, this.DEFAULT_USER_ID)))
      .returning();

    return result.length > 0;
  }

  static async getAllMoodEntries(): Promise<MoodEntry[]> {
    return await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, this.DEFAULT_USER_ID))
      .orderBy(desc(moodEntries.timestamp));
  }

  static async getTodayMoodEntries(): Promise<MoodEntry[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, this.DEFAULT_USER_ID),
          gte(moodEntries.timestamp, startOfDay),
          lt(moodEntries.timestamp, endOfDay)
        )
      )
      .orderBy(asc(moodEntries.timestamp));
  }

  static async getMoodStats(period: 'today' | 'week' | 'month' | 'year' = 'today'): Promise<MoodStats> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
    }

    const entries = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, this.DEFAULT_USER_ID),
          gte(moodEntries.timestamp, startDate)
        )
      )
      .orderBy(asc(moodEntries.timestamp));

    if (entries.length === 0) {
      return {
        average: 0,
        count: 0,
        min: 0,
        max: 0,
        period,
      };
    }

    const moods = entries.map(entry => entry.mood);
    const average = moods.reduce((sum, mood) => sum + mood, 0) / moods.length;
    const min = Math.min(...moods);
    const max = Math.max(...moods);

    return {
      average,
      count: entries.length,
      min,
      max,
      period,
    };
  }
}