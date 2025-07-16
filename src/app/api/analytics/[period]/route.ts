import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { moodEntries, users } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ period: string }> }
) {
  try {
    // Await params before using its properties (Next.js 15 requirement)
    const { period } = await params;
    const userEmail = "user@example.com";

    // Get user first
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let groupBy: string;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        groupBy = 'day';
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        groupBy = 'week';
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        groupBy = 'month';
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
        groupBy = 'year';
        break;
      case 'all':
        startDate = new Date(2020, 0, 1); // Start from a very early date
        groupBy = 'month';
        break;
      default:
        return NextResponse.json(
            { success: false, error: "Invalid period" },
            { status: 400 }
        );
    }

    // Get mood entries for the period
    const moods = await db
        .select()
        .from(moodEntries)
        .where(
            and(
                eq(moodEntries.userId, user[0].id),
                gte(moodEntries.timestamp, startDate)
            )
        )
        .orderBy(moodEntries.timestamp);

    // Group data by period
    const groupedData: Record<string, {
      date: string;
      moods: number[];
      sleepHours: number[];
      entries: typeof moods;
    }> = {};

    moods.forEach(mood => {
      let key: string;
      const date = new Date(mood.timestamp);

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          moods: [],
          sleepHours: [],
          entries: []
        };
      }

      groupedData[key].moods.push(mood.mood);
      if (mood.sleepHours !== null) {
        groupedData[key].sleepHours.push(mood.sleepHours);
      }
      groupedData[key].entries.push(mood);
    });

    // Calculate statistics for each period
    const result = Object.values(groupedData).map(group => ({
      date: group.date,
      averageMood: group.moods.length > 0
          ? Math.round((group.moods.reduce((sum, mood) => sum + mood, 0) / group.moods.length) * 10) / 10
          : 0,
      minMood: group.moods.length > 0 ? Math.min(...group.moods) : 0,
      maxMood: group.moods.length > 0 ? Math.max(...group.moods) : 0,
      entryCount: group.moods.length,
      averageSleep: group.sleepHours.length > 0
          ? Math.round((group.sleepHours.reduce((sum, sleep) => sum + sleep, 0) / group.sleepHours.length) * 10) / 10
          : 0,
      entries: group.entries.length
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: result,
      period,
      totalEntries: moods.length,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error) {
    console.error(`Error fetching analytics:`, error);
    return NextResponse.json(
        { success: false, error: "Failed to fetch analytics data" },
        { status: 500 }
    );
  }
}