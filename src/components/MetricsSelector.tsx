"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Smile,
  Moon,
  Zap,
  AlertCircle,
  Briefcase,
  Users,
  Coffee,
  Filter
} from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';

const metrics = [
  { id: "mood", label: "Humeur", icon: Smile, color: "hsl(0 0% 80%)" },
  { id: "sleep", label: "Sommeil", icon: Moon, color: "hsl(0 0% 70%)" },
  { id: "energy", label: "Énergie", icon: Zap, color: "hsl(0 0% 60%)" },
  { id: "stress", label: "Stress", icon: AlertCircle, color: "hsl(0 0% 50%)" },
  { id: "work", label: "Travail", icon: Briefcase, color: "hsl(0 0% 40%)" },
  { id: "social", label: "Social", icon: Users, color: "hsl(0 0% 30%)" },
  { id: "alone", label: "Seul", icon: Coffee, color: "hsl(0 0% 20%)" }
];

interface MetricsSelectorProps {
  variant?: 'default' | 'compact';
  showTitle?: boolean;
}

export function MetricsSelector({ 
  variant = 'default', 
  showTitle = true 
}: MetricsSelectorProps) {
  const { state, dispatch } = useDashboard();

  const toggleMetric = (metricId: string) => {
    dispatch({ type: 'TOGGLE_METRIC', payload: metricId });
  };

  const MetricIcon = ({ metricId }: { metricId: string }) => {
    const metric = metrics.find(m => m.id === metricId);
    if (!metric) return null;
    const Icon = metric.icon;
    return <Icon className="w-4 h-4" style={{ color: metric.color }} />;
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-1">
        {metrics.map(metric => (
          <Button
            key={metric.id}
            variant={state.selectedMetrics.includes(metric.id) ? "default" : "outline"}
            size="sm"
            className="h-6 text-xs"
            onClick={() => toggleMetric(metric.id)}
          >
            <MetricIcon metricId={metric.id} />
            {metric.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Sélection des métriques
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {metrics.map(metric => {
              const Icon = metric.icon;
              const isSelected = state.selectedMetrics.includes(metric.id);
              
              return (
                <Button
                  key={metric.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleMetric(metric.id)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" style={{ color: isSelected ? 'currentColor' : metric.color }} />
                  {metric.label}
                </Button>
              );
            })}
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">Sélectionnées:</span>
            <div className="flex flex-wrap gap-1">
              {state.selectedMetrics.map(metricId => {
                const metric = metrics.find(m => m.id === metricId);
                if (!metric) return null;
                return (
                  <Badge key={metricId} variant="secondary" className="text-xs">
                    {metric.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}