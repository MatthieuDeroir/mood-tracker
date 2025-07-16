import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { moodEntries, users } from "@/lib/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";

export async function GET() {
  try {
    const userEmail = "user@example.com";
    
    // Get user first
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          weeklyTrend: [],
          monthlyStats: {
            totalEntries: 0,
            averageMood: 0,
            bestDay: null,
            worstDay: null,
            averageSleep: 0,
          },
          tagStats: {},
          sleepCorrelation: [],
        },
      });
    }

    // Get data from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMoods = await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, user[0].id))
      .orderBy(moodEntries.timestamp);

    // Calculate weekly trend (last 7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayMoods = recentMoods.filter(mood => 
        mood.timestamp >= startOfDay && mood.timestamp < endOfDay
      );
      
      const average = dayMoods.length > 0 
        ? dayMoods.reduce((sum, mood) => sum + mood.mood, 0) / dayMoods.length
        : 0;
      
      weeklyTrend.push({
        date: startOfDay.toISOString().split('T')[0],
        average: Math.round(average * 10) / 10,
        count: dayMoods.length,
      });
    }

    // Calculate monthly stats
    const monthlyStats = {
      totalEntries: recentMoods.length,
      averageMood: recentMoods.length > 0 
        ? Math.round((recentMoods.reduce((sum, mood) => sum + mood.mood, 0) / recentMoods.length) * 10) / 10
        : 0,
      bestDay: null as string | null,
      worstDay: null as string | null,
      averageSleep: 0,
    };

    // Find best and worst days
    const dailyAverages = new Map<string, { sum: number; count: number }>();
    recentMoods.forEach(mood => {
      const day = mood.timestamp.toISOString().split('T')[0];
      if (!dailyAverages.has(day)) {
        dailyAverages.set(day, { sum: 0, count: 0 });
      }
      const dayData = dailyAverages.get(day)!;
      dayData.sum += mood.mood;
      dayData.count += 1;
    });

    let bestAverage = -1;
    let worstAverage = 11;
    dailyAverages.forEach((data, day) => {
      const avg = data.sum / data.count;
      if (avg > bestAverage) {
        bestAverage = avg;
        monthlyStats.bestDay = day;
      }
      if (avg < worstAverage) {
        worstAverage = avg;
        monthlyStats.worstDay = day;
      }
    });

    // Calculate sleep average
    const sleepEntries = recentMoods.filter(mood => mood.sleepHours !== null);
    if (sleepEntries.length > 0) {
      monthlyStats.averageSleep = Math.round(
        (sleepEntries.reduce((sum, mood) => sum + (mood.sleepHours || 0), 0) / sleepEntries.length) * 10
      ) / 10;
    }

    // Calculate tag statistics
    const tagStats: Record<string, { count: number; avgMood: number }> = {};
    recentMoods.forEach(mood => {
      let tags = mood.tags;
      // Handle malformed tags from old data
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch {
          tags = tags.split(';').filter(t => t.trim());
        }
      }
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            const cleanTag = tag.trim();
            if (cleanTag) {
              if (!tagStats[cleanTag]) {
                tagStats[cleanTag] = { count: 0, avgMood: 0 };
              }
              tagStats[cleanTag].count += 1;
              tagStats[cleanTag].avgMood += mood.mood;
            }
          }
        });
      }
    });

    // Calculate average mood for each tag
    Object.keys(tagStats).forEach(tag => {
      tagStats[tag].avgMood = Math.round((tagStats[tag].avgMood / tagStats[tag].count) * 10) / 10;
    });

    // Sleep correlation data
    const sleepCorrelation = sleepEntries.map(mood => ({
      sleepHours: mood.sleepHours || 0,
      mood: mood.mood,
      date: mood.timestamp.toISOString().split('T')[0],
    }));

    return NextResponse.json({
      success: true,
      data: {
        weeklyTrend,
        monthlyStats,
        tagStats,
        sleepCorrelation,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}