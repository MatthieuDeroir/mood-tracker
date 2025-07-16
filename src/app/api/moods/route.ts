// src/app/api/moods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { moodEntries } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

// GET - Récupérer toutes les entrées d'humeur
export async function GET() {
  try {
    const entries = await db
        .select()
        .from(moodEntries)
        .orderBy(desc(moodEntries.timestamp))
        .limit(100);

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    return NextResponse.json(
        { error: 'Failed to fetch mood entries' },
        { status: 500 }
    );
  }
}

// POST - Créer une nouvelle entrée d'humeur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { mood, note, tags, sleepHours, medication, emotions } = body;

    // Validation
    if (typeof mood !== 'number' || mood < 0 || mood > 10) {
      return NextResponse.json(
          { error: 'Mood must be a number between 0 and 10' },
          { status: 400 }
      );
    }

    // Pour la démo, on utilise un userId fixe
    // En production, récupérer depuis la session/JWT
    const defaultUserId = '00000000-0000-0000-0000-000000000001';

    const newEntry = await db
        .insert(moodEntries)
        .values({
          userId: defaultUserId,
          mood,
          note: note || null,
          tags: tags || [],
          sleepHours: sleepHours || null,
          medication: medication || null,
          emotions: emotions || null,
          timestamp: new Date(),
        })
        .returning();

    return NextResponse.json(newEntry[0], { status: 201 });
  } catch (error) {
    console.error('Error creating mood entry:', error);
    return NextResponse.json(
        { error: 'Failed to create mood entry' },
        { status: 500 }
    );
  }
}