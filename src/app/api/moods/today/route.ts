import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { moodEntries, users } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";

export async function GET() {
  try {
    const userEmail = "user@example.com";
    
    // Get user first
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({
        success: true,
        moods: [],
        stats: { average: 0, count: 0, sleepAverage: 0 },
      });
    }
    
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Fetch today's mood entries
    const todayMoods = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, user[0].id),
          gte(moodEntries.timestamp, startOfDay),
          lt(moodEntries.timestamp, endOfDay)
        )
      )
      .orderBy(moodEntries.timestamp);

    // Calculate statistics
    const stats = {
      average: 0,
      count: todayMoods.length,
      sleepAverage: 0,
    };

    if (todayMoods.length > 0) {
      const totalMood = todayMoods.reduce((sum, entry) => sum + entry.mood, 0);
      stats.average = totalMood / todayMoods.length;

      const sleepEntries = todayMoods.filter(entry => entry.sleepHours !== null);
      if (sleepEntries.length > 0) {
        const totalSleep = sleepEntries.reduce((sum, entry) => sum + (entry.sleepHours || 0), 0);
        stats.sleepAverage = totalSleep / sleepEntries.length;
      }
    }

    return NextResponse.json({
      success: true,
      moods: todayMoods,
      stats,
    });
  } catch (error) {
    console.error("Error fetching today's mood entries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch today's mood entries" },
      { status: 500 }
    );
  }
}