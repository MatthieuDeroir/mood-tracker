// src/app/api/moods/today/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { moodEntries } from '@/lib/db/schema';
import { and, gte, lt, avg, count, max, min } from 'drizzle-orm';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Entrées d'aujourd'hui
    const todayEntries = await db
        .select()
        .from(moodEntries)
        .where(
            and(
                gte(moodEntries.timestamp, today),
                lt(moodEntries.timestamp, tomorrow)
            )
        );

    // Statistiques d'aujourd'hui
    const todayStats = await db
        .select({
          avgMood: avg(moodEntries.mood),
          count: count(),
          maxMood: max(moodEntries.mood),
          minMood: min(moodEntries.mood),
        })
        .from(moodEntries)
        .where(
            and(
                gte(moodEntries.timestamp, today),
                lt(moodEntries.timestamp, tomorrow)
            )
        );

    return NextResponse.json({
      entries: todayEntries,
      stats: todayStats[0] || {
        avgMood: null,
        count: 0,
        maxMood: null,
        minMood: null,
      },
    });
  } catch (error) {
    console.error('Error fetching today mood data:', error);
    return NextResponse.json(
        { error: 'Failed to fetch today mood data' },
        { status: 500 }
    );
  }
}