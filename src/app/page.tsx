"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CreateMoodRequest, MoodEntry } from "@/types";
import Link from "next/link";

const moodEmojis = {
  0: "😫",
  1: "😞",
  2: "😔",
  3: "😕",
  4: "😐",
  5: "😐",
  6: "🙂",
  7: "😊",
  8: "😄",
  9: "😁",
  10: "🤩",
};

const moodLabels = {
  0: "Terrible",
  1: "Très mal",
  2: "Mal",
  3: "Pas bien",
  4: "Faible",
  5: "Neutre",
  6: "Correct",
  7: "Bien",
  8: "Très bien",
  9: "Super",
  10: "Incroyable",
};

const tags = [
  { id: "work", label: "💼 Travail" },
  { id: "family", label: "👨‍👩‍👧‍👦 Famille" },
  { id: "health", label: "🏥 Santé" },
  { id: "friends", label: "👥 Amis" },
  { id: "exercise", label: "🏃‍♂️ Sport" },
  { id: "food", label: "🍕 Nourriture" },
];

export default function Dashboard() {
  const [mood, setMood] = useState([5]);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sleepHours, setSleepHours] = useState("");
  const [medication, setMedication] = useState("");
  const [emotions, setEmotions] = useState("");
  const [todayMoods, setTodayMoods] = useState<MoodEntry[]>([]);
  const [todayStats, setTodayStats] = useState({
    average: 0,
    count: 0,
    sleepAverage: 0,
  });

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const saveMood = async () => {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(moodData),
      });

      if (response.ok) {
        // Reset form
        setNote("");
        setSelectedTags([]);
        setSleepHours("");
        setMedication("");
        setEmotions("");
        // Refresh today's moods
        loadTodayMoods();
      }
    } catch (error) {
      console.error("Error saving mood:", error);
    }
  };

  const loadTodayMoods = async () => {
    try {
      const response = await fetch("/api/moods/today");
      if (response.ok) {
        const data = await response.json();
        setTodayMoods(data.moods);
        setTodayStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading today's moods:", error);
    }
  };

  useEffect(() => {
    loadTodayMoods();
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">📊 Mood Tracker</h1>
        <nav className="flex justify-center space-x-4">
          <Button variant="default">Dashboard</Button>
          <Link href="/analytics">
            <Button variant="outline">Analytics</Button>
          </Link>
          <Link href="/import">
            <Button variant="outline">Import</Button>
          </Link>
        </nav>
      </header>

      <main className="grid gap-6">
        {/* Mood Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Comment tu te sens maintenant ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <span className="text-4xl">{moodEmojis[mood[0] as keyof typeof moodEmojis]}</span>
                <div className="text-center">
                  <p className="text-lg font-semibold">{moodLabels[mood[0] as keyof typeof moodLabels]}</p>
                  <p className="text-sm text-muted-foreground">{mood[0]}/10</p>
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
            </div>

            <Textarea
              placeholder="Raconte-moi ce qui se passe... (optionnel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />

            {/* Sleep Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suivi du sommeil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Heures de sommeil:</label>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    placeholder="7.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Médicaments (dose):</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Émotions (séparées par des virgules):</label>
                  <Input
                    type="text"
                    placeholder="calme, anxieux, joyeux..."
                    value={emotions}
                    onChange={(e) => setEmotions(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags:</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={saveMood} className="w-full">
              Sauvegarder
            </Button>
          </CardContent>
        </Card>

        {/* Today's Moods */}
        <Card>
          <CardHeader>
            <CardTitle>Aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayMoods.length === 0 ? (
                <p className="text-muted-foreground">Aucune entrée pour aujourd'hui</p>
              ) : (
                todayMoods.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{moodEmojis[entry.mood as keyof typeof moodEmojis]}</span>
                      <div>
                        <p className="font-medium">{moodLabels[entry.mood as keyof typeof moodLabels]} ({entry.mood}/10)</p>
                        {entry.note && <p className="text-sm text-muted-foreground">{entry.note}</p>}
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1">
                        {entry.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tags.find(t => t.id === tag)?.label || tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Moyenne aujourd'hui</p>
              <p className="text-2xl font-bold">{todayStats.average ? todayStats.average.toFixed(1) : "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Entrées</p>
              <p className="text-2xl font-bold">{todayStats.count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Sommeil moyen</p>
              <p className="text-2xl font-bold">{todayStats.sleepAverage ? todayStats.sleepAverage.toFixed(1) + "h" : "-"}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
