"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import {
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  Smile,
  Frown,
  Meh,
  Calendar,
  Clock,
  Activity,
  Heart,
  Brain,
  Zap,
  Target,
  BarChart3,
  Upload,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

// Types
interface MoodEntry {
  id: string;
  mood: number;
  note?: string;
  tags: string[];
  sleepHours?: number;
  medication?: number;
  emotions?: string;
  timestamp: string;
}

interface CreateMoodRequest {
  mood: number;
  note?: string;
  tags?: string[];
  sleepHours?: number;
  medication?: number;
  emotions?: string;
}

// Constants
const moodEmojis = {
  0: "😫", 1: "😞", 2: "😔", 3: "😕", 4: "😐",
  5: "😐", 6: "🙂", 7: "😊", 8: "😄", 9: "😁", 10: "🤩"
};

const moodLabels = {
  0: "Terrible", 1: "Très mal", 2: "Mal", 3: "Pas bien", 4: "Faible",
  5: "Neutre", 6: "Correct", 7: "Bien", 8: "Très bien", 9: "Super", 10: "Incroyable"
};

const tags = [
  { id: "work", label: "💼 Travail", color: "#3B82F6" },
  { id: "family", label: "👨‍👩‍👧‍👦 Famille", color: "#10B981" },
  { id: "health", label: "🏥 Santé", color: "#F59E0B" },
  { id: "friends", label: "👥 Amis", color: "#8B5CF6" },
  { id: "exercise", label: "🏃‍♂️ Sport", color: "#EF4444" },
  { id: "food", label: "🍕 Nourriture", color: "#F97316" }
];

const moodColors = {
  0: "#dc2626", 1: "#ea580c", 2: "#d97706", 3: "#ca8a04", 4: "#eab308",
  5: "#84cc16", 6: "#22c55e", 7: "#10b981", 8: "#14b8a6", 9: "#06b6d4", 10: "#3b82f6"
};

export default function ModernDashboard() {
  const [mood, setMood] = useState([7]);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sleepHours, setSleepHours] = useState("");
  const [medication, setMedication] = useState("");
  const [emotions, setEmotions] = useState("");
  const [period, setPeriod] = useState("weekly");
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [todayMoods, setTodayMoods] = useState<MoodEntry[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [periodData, setPeriodData] = useState<any[]>([]);
  const [allEntries, setAllEntries] = useState<MoodEntry[]>([]);

  const [chartData, setChartData] = useState([]);

  // Data processing functions
  const generateRealTimeData = () => {
    if (!allEntries.length) return [];

    const last30Days = allEntries
        .filter(entry => {
          const entryDate = new Date(entry.timestamp);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return entryDate >= thirtyDaysAgo;
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(entry => ({
          date: entry.timestamp.split('T')[0],
          mood: entry.mood,
          sleep: entry.sleepHours || 0,
          stress: Math.max(0, 10 - entry.mood), // Inverse correlation with mood
          energy: Math.min(10, entry.mood + (entry.sleepHours || 0) - 7), // Based on mood + sleep
          day: new Date(entry.timestamp).toLocaleDateString('fr-FR', { weekday: 'short' })
        }));

    return last30Days;
  };

  const generateWeeklyData = () => {
    if (!allEntries.length) return [];

    const weekData = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });

      const dayEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate.toDateString() === date.toDateString();
      });

      const avgMood = dayEntries.length > 0
          ? dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length
          : 0;

      const avgSleep = dayEntries.length > 0
          ? dayEntries.reduce((sum, entry) => sum + (entry.sleepHours || 0), 0) / dayEntries.length
          : 0;

      weekData.push({
        name: dayName,
        mood: Math.round(avgMood * 10) / 10,
        sleep: Math.round(avgSleep * 10) / 10,
        entries: dayEntries.length
      });
    }

    return weekData;
  };

  const generateTagData = () => {
    if (!allEntries.length) return [];

    const tagCounts = {};
    const tagColors = {
      'work': '#3B82F6',
      'family': '#10B981',
      'health': '#F59E0B',
      'friends': '#8B5CF6',
      'exercise': '#EF4444',
      'food': '#F97316'
    };

    allEntries.forEach(entry => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
        .map(([tag, count]) => ({
          name: tags.find(t => t.id === tag)?.label || tag,
          value: count,
          color: tagColors[tag] || '#6B7280'
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
  };

  const generateSleepMoodData = () => {
    if (!allEntries.length) return [];

    return allEntries
        .filter(entry => entry.sleepHours && entry.sleepHours > 0)
        .map(entry => ({
          sleep: entry.sleepHours,
          mood: entry.mood,
          date: entry.timestamp.split('T')[0]
        }))
        .slice(-50); // Last 50 entries with sleep data
  };

  const generateRadarData = () => {
    if (!allEntries.length) return [];

    const recentEntries = allEntries.slice(-30); // Last 30 entries
    const avgMood = recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length;
    const avgSleep = recentEntries.reduce((sum, entry) => sum + (entry.sleepHours || 0), 0) / recentEntries.length;

    // Calculate tag frequencies
    const workEntries = recentEntries.filter(entry => entry.tags?.includes('work')).length;
    const socialEntries = recentEntries.filter(entry => entry.tags?.includes('friends') || entry.tags?.includes('family')).length;
    const healthEntries = recentEntries.filter(entry => entry.tags?.includes('health') || entry.tags?.includes('exercise')).length;

    return [
      { subject: 'Humeur', A: Math.round(avgMood * 10) / 10, fullMark: 10 },
      { subject: 'Sommeil', A: Math.round(avgSleep * 10) / 10, fullMark: 10 },
      { subject: 'Énergie', A: Math.round(Math.min(10, avgMood + avgSleep - 7) * 10) / 10, fullMark: 10 },
      { subject: 'Stress', A: Math.round(Math.max(0, 10 - avgMood) * 10) / 10, fullMark: 10 },
      { subject: 'Social', A: Math.round((socialEntries / Math.max(1, recentEntries.length)) * 10), fullMark: 10 },
      { subject: 'Travail', A: Math.round((workEntries / Math.max(1, recentEntries.length)) * 10), fullMark: 10 }
    ];
  };

  const calculateStats = () => {
    if (!allEntries.length) {
      return {
        avgMood: 0,
        avgSleep: 0,
        totalEntries: 0,
        moodTrend: 0,
        sleepTrend: 0,
        entriesTrend: 0
      };
    }

    const currentMonth = allEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      const now = new Date();
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    });

    const lastMonth = allEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      const now = new Date();
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return entryDate.getMonth() === lastMonthDate.getMonth() && entryDate.getFullYear() === lastMonthDate.getFullYear();
    });

    const avgMood = currentMonth.length > 0
        ? currentMonth.reduce((sum, entry) => sum + entry.mood, 0) / currentMonth.length
        : 0;

    const avgSleep = currentMonth.length > 0
        ? currentMonth.reduce((sum, entry) => sum + (entry.sleepHours || 0), 0) / currentMonth.length
        : 0;

    const lastMonthAvgMood = lastMonth.length > 0
        ? lastMonth.reduce((sum, entry) => sum + entry.mood, 0) / lastMonth.length
        : 0;

    const lastMonthAvgSleep = lastMonth.length > 0
        ? lastMonth.reduce((sum, entry) => sum + (entry.sleepHours || 0), 0) / lastMonth.length
        : 0;

    const moodTrend = lastMonthAvgMood > 0
        ? Math.round(((avgMood - lastMonthAvgMood) / lastMonthAvgMood) * 100)
        : 0;

    const sleepTrend = lastMonthAvgSleep > 0
        ? Math.round(((avgSleep - lastMonthAvgSleep) / lastMonthAvgSleep) * 100)
        : 0;

    const entriesTrend = lastMonth.length > 0
        ? Math.round(((currentMonth.length - lastMonth.length) / lastMonth.length) * 100)
        : 0;

    return {
      avgMood: Math.round(avgMood * 10) / 10,
      avgSleep: Math.round(avgSleep * 10) / 10,
      totalEntries: allEntries.length,
      moodTrend,
      sleepTrend,
      entriesTrend
    };
  };

  // Update data when allEntries changes
  useEffect(() => {
    if (allEntries.length > 0) {
      setChartData(generateRealTimeData());
    }
  }, [allEntries]);

  // Computed values
  const weeklyData = generateWeeklyData();
  const tagData = generateTagData();
  const sleepMoodData = generateSleepMoodData();
  const radarData = generateRadarData();
  const stats = calculateStats();

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
        prev.includes(tagId)
            ? prev.filter(id => id !== tagId)
            : [...prev, tagId]
    );
  };

  const saveMood = async () => {
    setIsLoading(true);

    const moodData: CreateMoodRequest = {
      mood: mood[0],
      note: note || undefined,
      tags: selectedTags,
      sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
      medication: medication ? parseFloat(medication) : undefined,
      emotions: emotions || undefined,
    };

    try {
      const response = await fetch("/api/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moodData),
      });

      if (response.ok) {
        setNote("");
        setSelectedTags([]);
        setSleepHours("");
        setMedication("");
        setEmotions("");
        setMood([7]);
        // Refresh data
        loadData();
      }
    } catch (error) {
      console.error("Error saving mood:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [todayResponse, analyticsResponse, allResponse] = await Promise.all([
        fetch("/api/moods/today"),
        fetch("/api/analytics"),
        fetch("/api/moods")
      ]);

      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        setTodayMoods(todayData.moods || []);
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data || {});
      }

      if (allResponse.ok) {
        const allData = await allResponse.json();
        setAllEntries(allData.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Header */}
        <div className="border-b border-gray-700/50 backdrop-blur-sm bg-gray-800/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    MoodTracker
                  </h1>
                  <p className="text-sm text-gray-400">Dashboard & Analytics</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" className="border-gray-600">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>

                <Link href="/import">
                  <Button variant="outline" size="sm" className="border-gray-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Quick Entry Panel */}
            <Card className="lg:col-span-1 bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Entrée rapide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mood Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Humeur actuelle</label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{moodEmojis[mood[0] as keyof typeof moodEmojis]}</span>
                      <Badge variant="secondary">{mood[0]}/10</Badge>
                    </div>
                  </div>
                  <Slider
                      value={mood}
                      onValueChange={setMood}
                      max={10}
                      min={0}
                      step={1}
                      className="w-full"
                  />
                  <p className="text-sm text-center text-gray-400">
                    {moodLabels[mood[0] as keyof typeof moodLabels]}
                  </p>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                        <Button
                            key={tag.id}
                            variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleTag(tag.id)}
                            className="text-xs"
                        >
                          {tag.label}
                        </Button>
                    ))}
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Sommeil (h)</label>
                    <Input
                        type="number"
                        value={sleepHours}
                        onChange={(e) => setSleepHours(e.target.value)}
                        placeholder="8.5"
                        className="mt-1 bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Médicament</label>
                    <Input
                        type="number"
                        value={medication}
                        onChange={(e) => setMedication(e.target.value)}
                        placeholder="0"
                        className="mt-1 bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-sm font-medium">Note</label>
                  <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Comment vous sentez-vous aujourd'hui ?"
                      className="mt-1 bg-gray-700 border-gray-600"
                      rows={3}
                  />
                </div>

                <Button onClick={saveMood} disabled={isLoading} className="w-full">
                  {isLoading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-300">Humeur moyenne</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{stats.avgMood || 0}</span>
                        <Smile className="w-5 h-5 text-blue-400" />
                      </div>
                      <p className="text-xs text-blue-300 flex items-center gap-1">
                        {stats.moodTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {stats.moodTrend >= 0 ? '+' : ''}{stats.moodTrend}% ce mois
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-300">Sommeil moyen</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{stats.avgSleep || 0}h</span>
                        <Moon className="w-5 h-5 text-purple-400" />
                      </div>
                      <p className="text-xs text-purple-300 flex items-center gap-1">
                        {stats.sleepTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {stats.sleepTrend >= 0 ? '+' : ''}{stats.sleepTrend}% ce mois
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-300">Entrées totales</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{stats.totalEntries}</span>
                        <Activity className="w-5 h-5 text-green-400" />
                      </div>
                      <p className="text-xs text-green-300 flex items-center gap-1">
                        {stats.entriesTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {stats.entriesTrend >= 0 ? '+' : ''}{stats.entriesTrend}% ce mois
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* Mood Trend Chart */}
            <Card className="xl:col-span-2 bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Tendance de l'humeur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#9CA3AF' }} />
                    <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="mood"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="url(#moodGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {chartData.length === 0 && (
                    <div className="flex items-center justify-center h-[300px] text-gray-400">
                      <p>Aucune donnée disponible</p>
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Summary */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  Résumé hebdomadaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#9CA3AF' }} />
                    <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                    />
                    <Bar dataKey="mood" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sleep vs Mood Correlation */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  Sommeil vs Humeur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={sleepMoodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="sleep" tick={{ fill: '#9CA3AF' }} />
                    <YAxis dataKey="mood" tick={{ fill: '#9CA3AF' }} />
                    <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                    />
                    <Scatter dataKey="mood" fill="#EF4444" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tag Distribution */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  Distribution des tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                        data={tagData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                    >
                      {tagData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  Profil bien-être
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF' }} />
                    <PolarRadiusAxis tick={{ fill: '#9CA3AF' }} />
                    <Radar
                        name="Score"
                        dataKey="A"
                        stroke="#F59E0B"
                        fill="#F59E0B"
                        fillOpacity={0.3}
                        strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Entries */}
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Entrées récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayMoods.slice(-5).map((entry, i) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{moodEmojis[entry.mood as keyof typeof moodEmojis]}</span>
                        <div>
                          <p className="font-medium">{entry.note || "Pas de note"}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(entry.timestamp).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{entry.mood}/10</Badge>
                        {entry.tags && entry.tags.length > 0 && (
                            <Badge variant="outline">
                              {tags.find(t => t.id === entry.tags[0])?.label || entry.tags[0]}
                            </Badge>
                        )}
                      </div>
                    </div>
                ))}
                {todayMoods.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p>Aucune entrée aujourd'hui</p>
                      <p className="text-sm">Ajoutez votre première entrée ci-dessus</p>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}