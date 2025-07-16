"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  RefreshCw,
  MessageSquare,
  Bot,
  Sparkles,
  Users,
  Coffee,
  Briefcase,
  Home,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Plus,
  Settings,
  FileText,
  Flame
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
  energy?: number;
  stress?: number;
  work?: number;
  social?: number;
  alone?: number;
}

interface CreateMoodRequest {
  mood: number;
  note?: string;
  tags?: string[];
  sleepHours?: number;
  medication?: number;
  emotions?: string;
  energy?: number;
  stress?: number;
  work?: number;
  social?: number;
  alone?: number;
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
  { id: "work", label: "💼 Travail", color: "hsl(var(--sidebar-primary))" },
  { id: "family", label: "🏠 Famille", color: "hsl(var(--chart-2))" },
  { id: "health", label: "🏥 Santé", color: "hsl(var(--chart-3))" },
  { id: "friends", label: "👥 Amis", color: "hsl(var(--chart-4))" },
  { id: "exercise", label: "🏃‍♂️ Sport", color: "hsl(var(--chart-5))" },
  { id: "food", label: "🍕 Nourriture", color: "hsl(var(--chart-1))" }
];

const periods = [
  { id: "hourly", label: "Horaires", icon: Clock },
  { id: "daily", label: "Quotidien", icon: Calendar },
  { id: "weekly", label: "Hebdomadaire", icon: Calendar },
  { id: "monthly", label: "Mensuel", icon: Calendar },
  { id: "yearly", label: "Annuel", icon: Calendar },
  { id: "all", label: "Depuis toujours", icon: Activity }
];

const metrics = [
  { id: "mood", label: "Humeur", icon: Smile, color: "hsl(var(--chart-1))" },
  { id: "sleep", label: "Sommeil", icon: Moon, color: "hsl(var(--chart-2))" },
  { id: "energy", label: "Énergie", icon: Zap, color: "hsl(var(--chart-3))" },
  { id: "stress", label: "Stress", icon: AlertCircle, color: "hsl(var(--chart-4))" },
  { id: "work", label: "Travail", icon: Briefcase, color: "hsl(var(--chart-5))" },
  { id: "social", label: "Social", icon: Users, color: "hsl(var(--sidebar-primary))" },
  { id: "alone", label: "Seul", icon: Coffee, color: "hsl(var(--accent))" }
];

export default function IntegratedMoodDashboard() {
  const [mood, setMood] = useState([7]);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sleepHours, setSleepHours] = useState("");
  const [medication, setMedication] = useState("");
  const [emotions, setEmotions] = useState("");
  const [energy, setEnergy] = useState([7]);
  const [stress, setStress] = useState([3]);
  const [work, setWork] = useState([5]);
  const [social, setSocial] = useState([6]);
  const [alone, setAlone] = useState([5]);
  const [period, setPeriod] = useState("weekly");
  const [selectedMetrics, setSelectedMetrics] = useState(["mood", "sleep", "energy"]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // AI states
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiReportType, setAiReportType] = useState("daily");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiInput, setAiInput] = useState("");

  // Data states
  const [todayMoods, setTodayMoods] = useState<MoodEntry[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [allEntries, setAllEntries] = useState<MoodEntry[]>([]);
  const [chartData, setChartData] = useState([]);
  const [patterns, setPatterns] = useState([]);

  // Sample data for demo
  const generateSampleData = () => {
    const sampleEntries = [];
    const today = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const mood = Math.floor(Math.random() * 5) + 5 + Math.random() * 2; // 5-8 range mostly
      const sleep = 6 + Math.random() * 3; // 6-9 hours
      const energy = mood + Math.random() * 2 - 1;
      const stress = Math.max(0, 10 - mood + Math.random() * 3);

      sampleEntries.push({
        date: date.toISOString().split('T')[0],
        mood: Math.round(mood * 10) / 10,
        sleep: Math.round(sleep * 10) / 10,
        energy: Math.round(energy * 10) / 10,
        stress: Math.round(stress * 10) / 10,
        work: Math.round((Math.random() * 10) * 10) / 10,
        social: Math.round((Math.random() * 10) * 10) / 10,
        alone: Math.round((Math.random() * 10) * 10) / 10
      });
    }

    return sampleEntries;
  };

  const generateWeeklyData = () => {
    const weekData = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });

      weekData.push({
        name: dayName,
        mood: Math.round((Math.random() * 3 + 6) * 10) / 10,
        sleep: Math.round((Math.random() * 2 + 7) * 10) / 10,
        energy: Math.round((Math.random() * 3 + 6) * 10) / 10,
        stress: Math.round((Math.random() * 4 + 2) * 10) / 10,
        work: Math.round((Math.random() * 10) * 10) / 10,
        social: Math.round((Math.random() * 10) * 10) / 10,
        alone: Math.round((Math.random() * 10) * 10) / 10
      });
    }

    return weekData;
  };

  const generateTagData = () => {
    return tags.map(tag => ({
      name: tag.label,
      value: Math.floor(Math.random() * 20) + 5,
      color: tag.color
    }));
  };

  const generateRadarData = () => {
    return metrics.map(metric => ({
      subject: metric.label,
      A: Math.round((Math.random() * 10) * 10) / 10,
      fullMark: 10
    }));
  };

  const generatePatterns = () => {
    return [
      { type: "positive", message: "Votre humeur s'améliore les weekends", confidence: 85 },
      { type: "correlation", message: "Corrélation forte entre sommeil et énergie", confidence: 92 },
      { type: "warning", message: "Stress élevé les lundis et mardis", confidence: 78 },
      { type: "insight", message: "Meilleure humeur après 8h de sommeil", confidence: 88 }
    ];
  };

  const calculateStats = () => {
    return {
      avgMood: 7.2,
      avgSleep: 7.8,
      avgEnergy: 6.9,
      avgStress: 3.4,
      totalEntries: 127,
      moodTrend: 12,
      sleepTrend: -5,
      energyTrend: 8,
      stressTrend: -15
    };
  };

  useEffect(() => {
    setChartData(generateSampleData());
    setPatterns(generatePatterns());
  }, []);

  const weeklyData = generateWeeklyData();
  const tagData = generateTagData();
  const radarData = generateRadarData();
  const stats = calculateStats();

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
        prev.includes(tagId)
            ? prev.filter(id => id !== tagId)
            : [...prev, tagId]
    );
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
        prev.includes(metricId)
            ? prev.filter(id => id !== metricId)
            : [...prev, metricId]
    );
  };

  const generateAIReport = async () => {
    setAiGenerating(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAiAnalysis(`
🌟 Analyse de votre humeur (${periods.find(p => p.id === aiReportType)?.label})

📊 Résumé:
• Humeur moyenne: 7.2/10 (+12% vs période précédente)
• Tendance générale: Amélioration graduelle
• Facteurs positifs: Sommeil régulier, exercice physique

🔍 Patterns détectés:
• Pics d'énergie les mercredis et vendredis
• Stress réduit après les weekends
• Corrélation forte entre sommeil et humeur (r=0.78)

💡 Recommandations:
• Maintenir 7-8h de sommeil quotidien
• Planifier activités sociales en semaine
• Réduire charge de travail les lundis

🎯 Prochaines actions:
• Essayer méditation 10min/jour
• Programmer rappels sommeil
• Augmenter exposition soleil matinale
    `);
    setAiGenerating(false);
  };

  const saveMood = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reset form
    setNote("");
    setSelectedTags([]);
    setSleepHours("");
    setMedication("");
    setEmotions("");
    setMood([7]);
    setEnergy([7]);
    setStress([3]);
    setWork([5]);
    setSocial([6]);
    setAlone([5]);

    setIsLoading(false);
  };

  const MetricIcon = ({ metricId }: { metricId: string }) => {
    const metric = metrics.find(m => m.id === metricId);
    if (!metric) return null;
    const Icon = metric.icon;
    return <Icon className="w-4 h-4" style={{ color: metric.color }} />;
  };

  return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <div className="border-b border-border backdrop-blur-sm bg-card/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">
                    MoodTracker
                  </h1>
                  <p className="text-xs text-muted-foreground">Dashboard & Analytics</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map(period => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.label}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Actualiser
                </Button>

                <Link href="/import">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Upload className="w-3 h-3 mr-1" />
                    Import
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="ai">IA Assistant</TabsTrigger>
              <TabsTrigger value="entry">Nouvelle Entrée</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Humeur</p>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold">{stats.avgMood}</span>
                          <Smile className="w-3 h-3 text-primary" />
                        </div>
                        <p className="text-xs flex items-center gap-1 text-primary">
                          <TrendingUp className="w-2 h-2" />
                          +{stats.moodTrend}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Sommeil</p>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold">{stats.avgSleep}h</span>
                          <Moon className="w-3 h-3" style={{ color: "hsl(var(--chart-2))" }} />
                        </div>
                        <p className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--chart-2))" }}>
                          <TrendingDown className="w-2 h-2" />
                          {stats.sleepTrend}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 border-chart-3/20">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Énergie</p>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold">{stats.avgEnergy}</span>
                          <Zap className="w-3 h-3" style={{ color: "hsl(var(--chart-3))" }} />
                        </div>
                        <p className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--chart-3))" }}>
                          <TrendingUp className="w-2 h-2" />
                          +{stats.energyTrend}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-chart-4/10 to-chart-4/5 border-chart-4/20">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Stress</p>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold">{stats.avgStress}</span>
                          <AlertCircle className="w-3 h-3" style={{ color: "hsl(var(--chart-4))" }} />
                        </div>
                        <p className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--chart-4))" }}>
                          <TrendingDown className="w-2 h-2" />
                          {stats.stressTrend}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-chart-5/10 to-chart-5/5 border-chart-5/20">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Travail</p>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold">6.8</span>
                          <Briefcase className="w-3 h-3" style={{ color: "hsl(var(--chart-5))" }} />
                        </div>
                        <p className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--chart-5))" }}>
                          <TrendingUp className="w-2 h-2" />
                          +3%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-sidebar-primary/10 to-sidebar-primary/5 border-sidebar-primary/20">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Social</p>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold">7.1</span>
                          <Users className="w-3 h-3" style={{ color: "hsl(var(--sidebar-primary))" }} />
                        </div>
                        <p className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--sidebar-primary))" }}>
                          <TrendingUp className="w-2 h-2" />
                          +7%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Entrées</p>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold">{stats.totalEntries}</span>
                          <Activity className="w-3 h-3 text-accent-foreground" />
                        </div>
                        <p className="text-xs flex items-center gap-1 text-accent-foreground">
                          <TrendingUp className="w-2 h-2" />
                          +18%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Mood Trend */}
                <Card className="xl:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Tendances temporelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-1 mb-3">
                      {metrics.slice(0, 4).map(metric => (
                          <Button
                              key={metric.id}
                              variant={selectedMetrics.includes(metric.id) ? "default" : "outline"}
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => toggleMetric(metric.id)}
                          >
                            <MetricIcon metricId={metric.id} />
                            {metric.label}
                          </Button>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                        />
                        {selectedMetrics.includes('mood') && (
                            <Line
                                type="monotone"
                                dataKey="mood"
                                stroke="hsl(var(--chart-1))"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--chart-1))', r: 2 }}
                            />
                        )}
                        {selectedMetrics.includes('energy') && (
                            <Line
                                type="monotone"
                                dataKey="energy"
                                stroke="hsl(var(--chart-3))"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--chart-3))', r: 2 }}
                            />
                        )}
                        {selectedMetrics.includes('stress') && (
                            <Line
                                type="monotone"
                                dataKey="stress"
                                stroke="hsl(var(--chart-4))"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--chart-4))', r: 2 }}
                            />
                        )}
                        {selectedMetrics.includes('sleep') && (
                            <Line
                                type="monotone"
                                dataKey="sleep"
                                stroke="hsl(var(--chart-2))"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--chart-2))', r: 2 }}
                            />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Weekly Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-chart-2" />
                      Semaine actuelle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                        />
                        <Bar dataKey="mood" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Tags Distribution */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-chart-4" />
                      Distribution tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                            data={tagData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                        >
                          {tagData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Radar Chart */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Flame className="w-4 h-4 text-chart-3" />
                      Profil bien-être
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <PolarRadiusAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <Radar
                            name="Score"
                            dataKey="A"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.2}
                            strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Patterns Detection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4 text-sidebar-primary" />
                    Patterns détectés
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {patterns.map((pattern, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {pattern.type === 'positive' && <TrendingUp className="w-4 h-4 text-green-500" />}
                            {pattern.type === 'correlation' && <Target className="w-4 h-4 text-blue-500" />}
                            {pattern.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                            {pattern.type === 'insight' && <Lightbulb className="w-4 h-4 text-purple-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{pattern.message}</p>
                            <p className="text-xs text-muted-foreground">Confiance: {pattern.confidence}%</p>
                          </div>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Metrics Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Métriques personnalisées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {metrics.map(metric => (
                        <Button
                            key={metric.id}
                            variant={selectedMetrics.includes(metric.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleMetric(metric.id)}
                            className="gap-2"
                        >
                          <MetricIcon metricId={metric.id} />
                          {metric.label}
                        </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--popover))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                            />
                            {selectedMetrics.map((metricId, index) => (
                                <Area
                                    key={metricId}
                                    type="monotone"
                                    dataKey={metricId}
                                    stroke={metrics.find(m => m.id === metricId)?.color}
                                    fill={metrics.find(m => m.id === metricId)?.color}
                                    fillOpacity={0.1}
                                    strokeWidth={2}
                                />
                            ))}
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <ResponsiveContainer width="100%" height={300}>
                          <ScatterChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="sleep" name="Sommeil" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis dataKey="mood" name="Humeur" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--popover))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                            />
                            <Scatter dataKey="mood" fill="hsl(var(--primary))" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              {/* AI Assistant */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-sidebar-primary" />
                      Assistant IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Type de rapport</label>
                      <Select value={aiReportType} onValueChange={setAiReportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {periods.map(period => (
                              <SelectItem key={period.id} value={period.id}>
                                {period.label}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Décrivez votre état actuel</label>
                      <Textarea
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          placeholder="Je me sens un peu fatigué aujourd'hui, j'ai eu du mal à me concentrer au travail..."
                          rows={4}
                      />
                    </div>

                    <Button onClick={generateAIReport} disabled={aiGenerating} className="w-full">
                      {aiGenerating ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Génération...</>
                      ) : (
                          <><Sparkles className="w-4 h-4 mr-2" />Générer rapport IA</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-chart-3" />
                      Analyse générée
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiAnalysis ? (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap">{aiAnalysis}</pre>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bot className="w-8 h-8 mx-auto mb-3 opacity-50" />
                          <p>Cliquez sur "Générer rapport IA" pour obtenir une analyse personnalisée</p>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="entry" className="space-y-6">
              {/* Entry Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Nouvelle entrée d'humeur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Mood Slider */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium">Humeur actuelle</label>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{moodEmojis[mood[0] as keyof typeof moodEmojis]}</span>
                            <Badge>{mood[0]}/10</Badge>
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
                        <p className="text-sm text-center text-muted-foreground mt-2">
                          {moodLabels[mood[0] as keyof typeof moodLabels]}
                        </p>
                      </div>

                      {/* Additional Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Énergie</label>
                          <Slider
                              value={energy}
                              onValueChange={setEnergy}
                              max={10}
                              min={0}
                              step={1}
                              className="w-full"
                          />
                          <p className="text-xs text-center text-muted-foreground mt-1">{energy[0]}/10</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Stress</label>
                          <Slider
                              value={stress}
                              onValueChange={setStress}
                              max={10}
                              min={0}
                              step={1}
                              className="w-full"
                          />
                          <p className="text-xs text-center text-muted-foreground mt-1">{stress[0]}/10</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Travail</label>
                          <Slider
                              value={work}
                              onValueChange={setWork}
                              max={10}
                              min={0}
                              step={1}
                              className="w-full"
                          />
                          <p className="text-xs text-center text-muted-foreground mt-1">{work[0]}/10</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Social</label>
                          <Slider
                              value={social}
                              onValueChange={setSocial}
                              max={10}
                              min={0}
                              step={1}
                              className="w-full"
                          />
                          <p className="text-xs text-center text-muted-foreground mt-1">{social[0]}/10</p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="text-sm font-medium mb-3 block">Tags</label>
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
                    </div>

                    <div className="space-y-4">
                      {/* Additional Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Sommeil (h)</label>
                          <Input
                              type="number"
                              value={sleepHours}
                              onChange={(e) => setSleepHours(e.target.value)}
                              placeholder="8.5"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Médicament</label>
                          <Input
                              type="number"
                              value={medication}
                              onChange={(e) => setMedication(e.target.value)}
                              placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Emotions */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Émotions ressenties</label>
                        <Input
                            value={emotions}
                            onChange={(e) => setEmotions(e.target.value)}
                            placeholder="Joie, anxiété, excitation..."
                        />
                      </div>

                      {/* Note */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Note</label>
                        <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Comment vous sentez-vous aujourd'hui ?"
                            rows={4}
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={saveMood} disabled={isLoading} className="w-full">
                    {isLoading ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</>
                    ) : (
                        <><CheckCircle className="w-4 h-4 mr-2" />Enregistrer l'entrée</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}