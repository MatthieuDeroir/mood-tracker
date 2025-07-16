"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface AnalyticsData {
  weeklyTrend: Array<{
    date: string;
    average: number;
    count: number;
  }>;
  monthlyStats: {
    totalEntries: number;
    averageMood: number;
    bestDay: string | null;
    worstDay: string | null;
    averageSleep: number;
  };
  tagStats: Record<string, {
    count: number;
    avgMood: number;
  }>;
  sleepCorrelation: Array<{
    sleepHours: number;
    mood: number;
    date: string;
  }>;
}

const moodEmojis = {
  0: "😫", 1: "😞", 2: "😔", 3: "😕", 4: "😐",
  5: "😐", 6: "🙂", 7: "😊", 8: "😄", 9: "😁", 10: "🤩",
};

const tagLabels: Record<string, string> = {
  work: "💼 Travail",
  family: "👨‍👩‍👧‍👦 Famille",
  health: "🏥 Santé",
  friends: "👥 Amis",
  exercise: "🏃‍♂️ Sport",
  food: "🍕 Nourriture",
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [periodData, setPeriodData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [mainResponse, periodResponse] = await Promise.all([
          fetch("/api/analytics"),
          fetch(`/api/analytics/${selectedPeriod}`)
        ]);
        
        if (mainResponse.ok) {
          const result = await mainResponse.json();
          setAnalytics(result.data);
        }
        
        if (periodResponse.ok) {
          const result = await periodResponse.json();
          setPeriodData(result.data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center">Chargement des analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center">Erreur lors du chargement des données</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">📊 Mood Tracker</h1>
        <nav className="flex justify-center space-x-4">
          <Link href="/">
            <Button variant="outline">Dashboard</Button>
          </Link>
          <Button variant="default">Analytics</Button>
          <Link href="/import">
            <Button variant="outline">Import</Button>
          </Link>
        </nav>
      </header>

      <main className="grid gap-6">
        {/* Period Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Sélectionner la période</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {['daily', 'weekly', 'monthly', 'yearly', 'all'].map(period => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod(period)}
                  className="capitalize"
                >
                  {period === 'daily' ? 'Quotidien' : 
                   period === 'weekly' ? 'Hebdomadaire' :
                   period === 'monthly' ? 'Mensuel' :
                   period === 'yearly' ? 'Annuel' : 'Depuis le début'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé général</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Entrées totales</p>
                <p className="text-2xl font-bold">{analytics.monthlyStats.totalEntries}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Humeur moyenne</p>
                <p className="text-2xl font-bold flex items-center justify-center gap-2">
                  {analytics.monthlyStats.averageMood ? analytics.monthlyStats.averageMood.toFixed(1) : "N/A"}
                  {analytics.monthlyStats.averageMood > 0 && (
                    <span className="text-lg">
                      {moodEmojis[Math.round(analytics.monthlyStats.averageMood) as keyof typeof moodEmojis]}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Meilleur jour</p>
                <p className="text-sm font-medium">
                  {analytics.monthlyStats.bestDay 
                    ? new Date(analytics.monthlyStats.bestDay).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Sommeil moyen</p>
                <p className="text-2xl font-bold">
                  {analytics.monthlyStats.averageSleep ? 
                    `${analytics.monthlyStats.averageSleep}h` : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Period Data Visualization */}
        {periodData && (
          <Card>
            <CardHeader>
              <CardTitle>
                Évolution de l'humeur - {
                  selectedPeriod === 'daily' ? 'Quotidien' : 
                  selectedPeriod === 'weekly' ? 'Hebdomadaire' :
                  selectedPeriod === 'monthly' ? 'Mensuel' :
                  selectedPeriod === 'yearly' ? 'Annuel' : 'Depuis le début'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {periodData.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-sm font-medium">
                        {selectedPeriod === 'daily' ? 
                          new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) :
                          selectedPeriod === 'weekly' ? 
                          `S. ${new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` :
                          selectedPeriod === 'monthly' ?
                          new Date(item.date + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) :
                          selectedPeriod === 'yearly' ? item.date :
                          new Date(item.date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                        }
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {item.averageMood > 0 ? moodEmojis[Math.round(item.averageMood) as keyof typeof moodEmojis] : "📝"}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {item.averageMood > 0 ? `${item.averageMood}/10` : "Aucune"}
                          </span>
                          {item.minMood !== item.maxMood && item.averageMood > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {item.minMood}-{item.maxMood}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.entryCount} entrée{item.entryCount > 1 ? 's' : ''}</div>
                      {item.averageSleep > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {item.averageSleep.toFixed(1)}h sommeil
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {periodData.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune donnée pour cette période
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendance de la semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.weeklyTrend.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-20 text-sm">
                      {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {day.average > 0 ? moodEmojis[Math.round(day.average) as keyof typeof moodEmojis] : "📝"}
                      </span>
                      <span className="font-medium">
                        {day.average > 0 ? day.average.toFixed(1) : "Aucune"}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {day.count} entrée{day.count > 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tag Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques par tag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.tagStats)
                .sort(([,a], [,b]) => b.count - a.count)
                .map(([tag, stats]) => (
                  <div key={tag} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {tagLabels[tag] || tag}
                      </Badge>
                      <span className="text-sm">
                        {stats.count} fois
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {moodEmojis[Math.round(stats.avgMood) as keyof typeof moodEmojis]}
                      </span>
                      <span className="font-medium">
                        {stats.avgMood.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              {Object.keys(analytics.tagStats).length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Aucun tag utilisé pour le moment
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sleep Correlation */}
        {analytics.sleepCorrelation.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Corrélation sommeil/humeur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.sleepCorrelation
                  .slice(-10) // Show last 10 entries
                  .map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                        <span className="text-sm">
                          {entry.sleepHours}h de sommeil
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {moodEmojis[entry.mood as keyof typeof moodEmojis]}
                        </span>
                        <span className="font-medium">
                          {entry.mood}/10
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}