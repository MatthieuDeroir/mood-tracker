"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  RefreshCw,
  Bot,
  Sparkles,
  CheckCircle,
  Plus,
  FileText,
  Brain,
  Edit3,
  Save,
  RotateCcw
} from "lucide-react";
import Link from "next/link";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { DashboardGridDnd } from "@/components/DashboardGridDnd";
import { MetricsSelector } from "@/components/MetricsSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardSettings } from "@/components/DashboardSettings";

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

// Removed unused CreateMoodRequest interface

function DashboardControls() {
  const { state, dispatch } = useDashboard();

  return (
    <div className="flex items-center gap-2">
      <Select value={state.selectedPeriod} onValueChange={(value) => dispatch({ type: 'SET_PERIOD', payload: value })}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Quotidien</SelectItem>
          <SelectItem value="weekly">Hebdomadaire</SelectItem>
          <SelectItem value="monthly">Mensuel</SelectItem>
          <SelectItem value="yearly">Annuel</SelectItem>
          <SelectItem value="all">Tout</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant={state.isEditing ? "default" : "outline"}
        size="sm"
        className="h-8 text-xs"
        onClick={() => dispatch({ type: 'SET_EDITING_MODE', payload: !state.isEditing })}
      >
        {state.isEditing ? (
          <><Save className="w-3 h-3 mr-1" />Sauvegarder</>
        ) : (
          <><Edit3 className="w-3 h-3 mr-1" />Éditer</>
        )}
      </Button>

      {state.isEditing && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => dispatch({ type: 'RESET_LAYOUT' })}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      )}

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

      <DashboardSettings />
      <ThemeToggle />
    </div>
  );
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
  { id: "work", label: "💼 Travail", color: "hsl(0 0% 70%)" },
  { id: "family", label: "🏠 Famille", color: "hsl(0 0% 60%)" },
  { id: "health", label: "🏥 Santé", color: "hsl(0 0% 50%)" },
  { id: "friends", label: "👥 Amis", color: "hsl(0 0% 40%)" },
  { id: "exercise", label: "🏃‍♂️ Sport", color: "hsl(0 0% 30%)" },
  { id: "food", label: "🍕 Nourriture", color: "hsl(0 0% 80%)" }
];

const periods = [
  { id: "daily", label: "Quotidien" },
  { id: "weekly", label: "Hebdomadaire" },
  { id: "monthly", label: "Mensuel" },
  { id: "yearly", label: "Annuel" },
  { id: "all", label: "Tout" }
];

function MoodDashboardContent() {
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
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // AI states
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiReportType, setAiReportType] = useState("daily");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiInput, setAiInput] = useState("");

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
        prev.includes(tagId)
            ? prev.filter(id => id !== tagId)
            : [...prev, tagId]
    );
  };

  const generateAIReport = async () => {
    setAiGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAiAnalysis(`🌟 Analyse de votre humeur (${aiReportType})

📊 Résumé: Humeur moyenne: 7.2/10 (+12% vs période précédente)
🔍 Patterns: Pics d'énergie les mercredis et vendredis
💡 Recommandations: Maintenir 7-8h de sommeil quotidien`);
    setAiGenerating(false);
  };

  const saveMood = async () => {
    setIsLoading(true);
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

    setIsLoading(false);
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
        {/* Header */}
        <div className="border-b border-border/50 backdrop-blur-xl bg-card/80 sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg group cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-3">
                  <Brain className="w-6 h-6 text-primary-foreground transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    MoodTracker
                  </h1>
                  <p className="text-sm text-muted-foreground">Dashboard & Analytics</p>
                </div>
              </div>

              <DashboardControls />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="ai">IA Assistant</TabsTrigger>
              <TabsTrigger value="entry">Nouvelle Entrée</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <DashboardGridDnd />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <MetricsSelector />
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

export default function IntegratedMoodDashboard() {
  return (
    <DashboardProvider>
      <MoodDashboardContent />
    </DashboardProvider>
  );
}
