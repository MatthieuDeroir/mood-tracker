"use client";

import React, { useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useDashboard } from '@/contexts/DashboardContext';
import { DraggableWidget } from '@/components/DraggableWidget';
import { MetricsSelector } from '@/components/MetricsSelector';
import { MetricsTable } from '@/components/MetricsTable';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const ResponsiveGridLayout = WidthProvider(Responsive);

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

export function DashboardGrid() {
  const { state, dispatch } = useDashboard();

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

  const handleLayoutChange = (layout: Layout[]) => {
    layout.forEach(item => {
      dispatch({
        type: 'UPDATE_WIDGET_LAYOUT',
        payload: {
          id: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h
        }
      });
    });
  };

  const layouts = {
    lg: state.widgets.map(widget => ({
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: widget.minW,
      minH: widget.minH,
      maxW: widget.maxW,
      maxH: widget.maxH,
    })),
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
          <DraggableWidget key={widget.id} {...commonProps}>
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
                <Card 
                  key={index} 
                  className={`bg-gradient-to-br ${stat.bgColor} border-0 shadow-sm hover-lift transition-all duration-300 group cursor-default`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {stat.label}
                      </span>
                      <stat.icon className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: stat.color }} />
                    </div>
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium" style={{ color: stat.color }}>
                      {stat.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{Math.abs(stat.trend)}% ce mois</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DraggableWidget>
        );

      case 'mood-trend':
        return (
          <DraggableWidget key={widget.id} {...commonProps}>
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
          </DraggableWidget>
        );

      case 'weekly-summary':
        return (
          <DraggableWidget key={widget.id} {...commonProps}>
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
          </DraggableWidget>
        );

      case 'tags-distribution':
        return (
          <DraggableWidget key={widget.id} {...commonProps}>
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
          </DraggableWidget>
        );

      case 'radar-chart':
        return (
          <DraggableWidget key={widget.id} {...commonProps}>
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
          </DraggableWidget>
        );

      case 'correlation-chart':
        return (
          <DraggableWidget key={widget.id} {...commonProps}>
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
          </DraggableWidget>
        );

      case 'patterns':
        return (
          <DraggableWidget key={widget.id} {...commonProps}>
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
          </DraggableWidget>
        );

      case 'metrics-table':
        return (
          <DraggableWidget key={widget.id} {...commonProps}>
            <div className="h-full">
              <MetricsTable />
            </div>
          </DraggableWidget>
        );

      default:
        return (
          <DraggableWidget key={widget.id} {...commonProps}>
            <div>Widget content for {widget.type}</div>
          </DraggableWidget>
        );
    }
  };

  return (
    <div className="w-full px-4 py-4">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={state.rowHeight}
        onLayoutChange={handleLayoutChange}
        isDraggable={state.isEditing}
        isResizable={state.isEditing}
        margin={[12, 12]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        preventCollision={false}
        autoSize={true}
        compactType="vertical"
        allowOverlap={false}
        draggableHandle=".drag-handle"
      >
        {state.widgets.filter(w => w.isVisible).map(renderWidget)}
      </ResponsiveGridLayout>
    </div>
  );
}