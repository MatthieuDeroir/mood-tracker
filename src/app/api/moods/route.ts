import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { moodEntries, users } from "@/lib/db/schema";
import { CreateMoodRequest } from "@/types";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body: CreateMoodRequest = await request.json();
    
    // For now, we'll use a hardcoded user email to find/create user
    // In a real app, you'd get this from authentication
    const userEmail = "user@example.com";
    
    // Ensure user exists
    let user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (user.length === 0) {
      // Create default user
      const newUser = await db.insert(users).values({
        email: userEmail,
        name: "Default User",
      }).returning();
      user = newUser;
    }

    // Create mood entry
    const newMoodEntry = await db
      .insert(moodEntries)
      .values({
        userId: user[0].id,
        mood: body.mood,
        note: body.note,
        tags: body.tags || [],
        sleepHours: body.sleepHours,
        medication: body.medication,
        emotions: body.emotions,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newMoodEntry[0],
    });
  } catch (error) {
    console.error("Error creating mood entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create mood entry" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const userEmail = "user@example.com";
    
    // Get user first
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }
    
    const moods = await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, user[0].id))
      .orderBy(moodEntries.timestamp);

    return NextResponse.json({
      success: true,
      data: moods,
    });
  } catch (error) {
    console.error("Error fetching mood entries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch mood entries" },
      { status: 500 }
    );
  }
}