"use client";

import React, { useState, useMemo } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { DraggableWidget } from '@/components/DraggableWidget';
import { SortableWidget } from '@/components/SortableWidget';
import { MetricsSelector } from '@/components/MetricsSelector';
import { MetricsTable } from '@/components/MetricsTable';
import { Button } from '@/components/ui/button';
import {
  DndContext, 
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
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
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Smile,
  Moon,
  Zap,
  AlertCircle,
  Briefcase,
  Users,
  Activity,
  Target,
  Lightbulb,
  Brain
} from 'lucide-react';

import '@/styles/grid-layout.css';
import '@/styles/dashboard-grid.css';
import '@/styles/animations.css';

// Mock data for charts
const generateSampleData = () => {
  const sampleEntries = [];
  const today = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const mood = Math.floor(Math.random() * 5) + 5 + Math.random() * 2;
    const sleep = 6 + Math.random() * 3;
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
  const tags = [
    { label: '💼 Travail', color: '#3b82f6' },
    { label: '🏠 Famille', color: '#10b981' },
    { label: '🏥 Santé', color: '#ef4444' },
    { label: '👥 Amis', color: '#8b5cf6' },
    { label: '🏃‍♂️ Sport', color: '#f59e0b' },
    { label: '🍕 Nourriture', color: '#06b6d4' }
  ];

  return tags.map(tag => ({
    name: tag.label,
    value: Math.floor(Math.random() * 20) + 5,
    color: tag.color
  }));
};

const generateRadarData = () => {
  const metrics = [
    { label: 'Humeur' },
    { label: 'Sommeil' },
    { label: 'Énergie' },
    { label: 'Stress' },
    { label: 'Travail' },
    { label: 'Social' },
    { label: 'Seul' }
  ];

  return metrics.map(metric => ({
    subject: metric.label,
    A: Math.round((Math.random() * 10) * 10) / 10,
    fullMark: 10
  }));
};

export function DashboardGridDnd() {
  const { state, dispatch } = useDashboard();
  const [activeId, setActiveId] = useState<string | null>(null);

  const chartData = useMemo(() => generateSampleData(), []);
  const weeklyData = useMemo(() => generateWeeklyData(), []);
  const tagData = useMemo(() => generateTagData(), []);
  const radarData = useMemo(() => generateRadarData(), []);

  const stats = {
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

  const patterns = [
    { type: "positive", message: "Votre humeur s'améliore les weekends", confidence: 85 },
    { type: "correlation", message: "Corrélation forte entre sommeil et énergie", confidence: 92 },
    { type: "warning", message: "Stress élevé les lundis et mardis", confidence: 78 },
    { type: "insight", message: "Meilleure humeur après 8h de sommeil", confidence: 88 }
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = state.widgets.findIndex(w => w.id === active.id);
      const newIndex = state.widgets.findIndex(w => w.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = arrayMove(state.widgets, oldIndex, newIndex);

        // Update the widgets in the context
        dispatch({
          type: 'LOAD_LAYOUT',
          payload: newWidgets
        });
      }
    }

    setActiveId(null);
  };

  const renderWidget = (widget: any) => {
    const commonProps = {
      id: widget.id,
      title: widget.title,
      isVisible: widget.isVisible,
    };

    switch (widget.type) {
      case 'stats-cards':
        return (
          <SortableWidget key={widget.id} {...commonProps}>
            <div className="grid grid-cols-3 lg:grid-cols-7 gap-4">
              {[
                { label: 'Humeur', value: stats.avgMood, icon: Smile, trend: stats.moodTrend, color: 'hsl(var(--chart-1))', bgColor: 'from-chart-1/10 to-chart-1/5' },
                { label: 'Sommeil', value: `${stats.avgSleep}h`, icon: Moon, trend: stats.sleepTrend, color: 'hsl(var(--chart-2))', bgColor: 'from-chart-2/10 to-chart-2/5' },
                { label: 'Énergie', value: stats.avgEnergy, icon: Zap, trend: stats.energyTrend, color: 'hsl(var(--chart-3))', bgColor: 'from-chart-3/10 to-chart-3/5' },
                { label: 'Stress', value: stats.avgStress, icon: AlertCircle, trend: stats.stressTrend, color: 'hsl(var(--chart-4))', bgColor: 'from-chart-4/10 to-chart-4/5' },
                { label: 'Travail', value: 6.8, icon: Briefcase, trend: 3, color: 'hsl(var(--chart-5))', bgColor: 'from-chart-5/10 to-chart-5/5' },
                { label: 'Social', value: 7.1, icon: Users, trend: 7, color: 'hsl(var(--primary))', bgColor: 'from-primary/10 to-primary/5' },
                { label: 'Entrées', value: stats.totalEntries, icon: Activity, trend: 18, color: 'hsl(var(--accent))', bgColor: 'from-accent/10 to-accent/5' }
              ].map((stat, index) => (
                <div 
                  key={index} 
                  className={`stat-card stat-card-${stat.label.toLowerCase()} group`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="stat-card-content">
                    <div className="stat-card-header">
                      <span className="stat-card-label">
                        {stat.label}
                      </span>
                      <stat.icon className="stat-card-icon" style={{ color: stat.color }} />
                    </div>
                    <div className="stat-card-value">
                      <span>{stat.value}</span>
                    </div>
                    <div className="stat-card-trend" style={{ color: stat.color }}>
                      {stat.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{Math.abs(stat.trend)}% ce mois</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SortableWidget>
        );

      case 'mood-trend':
        return (
          <SortableWidget key={widget.id} {...commonProps}>
            <div className="mb-4">
              <MetricsSelector variant="compact" showTitle={false} />
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
                {state.selectedMetrics.includes('mood') && (
                  <Line type="monotone" dataKey="mood" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} name="Humeur" />
                )}
                {state.selectedMetrics.includes('energy') && (
                  <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} name="Énergie" />
                )}
                {state.selectedMetrics.includes('stress') && (
                  <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} name="Stress" />
                )}
                {state.selectedMetrics.includes('sleep') && (
                  <Line type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} name="Sommeil" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </SortableWidget>
        );

      case 'weekly-summary':
        return (
          <SortableWidget key={widget.id} {...commonProps}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
                <Bar dataKey="mood" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SortableWidget>
        );

      case 'tags-distribution':
        return (
          <SortableWidget key={widget.id} {...commonProps}>
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
          </SortableWidget>
        );

      case 'radar-chart':
        return (
          <SortableWidget key={widget.id} {...commonProps}>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 9 }} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </SortableWidget>
        );

      case 'correlation-chart':
        return (
          <SortableWidget key={widget.id} {...commonProps}>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="sleep" name="Sommeil" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                <YAxis dataKey="mood" name="Humeur" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
                <Scatter dataKey="mood" fill="#10b981" />
              </ScatterChart>
            </ResponsiveContainer>
          </SortableWidget>
        );

      case 'patterns':
        return (
          <SortableWidget key={widget.id} {...commonProps}>
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
          </SortableWidget>
        );

      case 'metrics-table':
        return (
          <SortableWidget key={widget.id} {...commonProps}>
            <div className="h-full">
              <MetricsTable />
            </div>
          </SortableWidget>
        );

      default:
        return (
          <SortableWidget key={widget.id} {...commonProps}>
            <div>Widget content for {widget.type}</div>
          </SortableWidget>
        );
    }
  };

  return (
    <div className="w-full px-4 py-4">
      <div className="dashboard-banner">
        <div className="dashboard-banner-content">
          <div className="flex flex-col gap-2">
            <div className="dashboard-banner-title">
              <div className="dashboard-banner-indicator"></div>
              <p className="dashboard-banner-heading">
                Tableau de bord interactif
              </p>
            </div>
            <div className="dashboard-banner-instructions">
              <div className="dashboard-banner-instruction">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 9H19M9 5V19M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Déplacez les widgets en les faisant glisser</span>
              </div>
              <div className="dashboard-banner-instruction">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L12 12M22 8V2H16M22 22L12 12M16 22H22V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Redimensionnez depuis le coin inférieur droit</span>
              </div>
            </div>
          </div>
          {state.isEditing ? (
            <Button 
              variant="default" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => dispatch({ type: 'SET_EDITING_MODE', payload: false })}
            >
              Sauvegarder la disposition
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => dispatch({ type: 'SET_EDITING_MODE', payload: true })}
            >
              Activer le mode édition
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={state.widgets.filter(w => w.isVisible).map(w => w.id)}
            strategy={rectSortingStrategy}
          >
            {state.widgets.filter(w => w.isVisible).map(renderWidget)}
          </SortableContext>

          <DragOverlay>
            {activeId ? renderWidget(state.widgets.find(w => w.id === activeId)) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
