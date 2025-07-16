import type { User as DbUser, MoodEntry as DbMoodEntry } from "@/lib/db/schema";

export type User = DbUser;
export type MoodEntry = DbMoodEntry;

export type SupportedLanguage = "fr" | "en" | "es" | "de";

export interface Translations {
  moodLabels: Record<number, string>;
  interface: {
    appTitle: string;
    dashboard: string;
    analytics: string;
    save: string;
    delete: string;
    edit: string;
    cancel: string;
    confirm: string;
    howAreYouFeeling: string;
    today: string;
    noteOptional: string;
    averageToday: string;
    entries: string;
    currentMood: string;
    tagWork: string;
    tagFamily: string;
    tagHealth: string;
    tagFriends: string;
    tagExercise: string;
    tagFood: string;
    thisWeek: string;
    thisMonth: string;
    thisYear: string;
    average: string;
    totalEntries: string;
    bestMood: string;
    worstMood: string;
    moodEvolution: string;
    detectedPatterns: string;
    moodSaved: string;
    moodUpdated: string;
    moodDeleted: string;
    errorSaving: string;
    errorUpdating: string;
    errorDeleting: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
    january: string;
    february: string;
    march: string;
    april: string;
    may: string;
    june: string;
    july: string;
    august: string;
    september: string;
    october: string;
    november: string;
    december: string;
  };
}

export interface MoodStats {
  average: number;
  count: number;
  min: number;
  max: number;
  period: string;
  trends?: {
    byHour: Array<{ hour: number; avgMood: number; count: number }>;
    byDayOfWeek: Array<{ dayOfWeek: number; avgMood: number; count: number }>;
    byMonth: Array<{ month: number; avgMood: number; count: number }>;
  };
}

export interface TimelineData {
  date: string;
  averageMood: number;
  entryCount: number;
  entries: MoodEntry[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateMoodRequest {
  mood: number;
  note?: string;
  tags?: string[];
  sleepHours?: number;
  medication?: number;
  emotions?: string;
}

export interface UpdateMoodRequest {
  mood?: number;
  note?: string;
  tags?: string[];
  sleepHours?: number;
  medication?: number;
  emotions?: string;
}