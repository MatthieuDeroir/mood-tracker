"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import '@/styles/draggable-widget.css';
import { 
  GripHorizontal, 
  Settings, 
  EyeOff, 
  Eye,
  X,
  Maximize2,
  Minimize2,
  Star,
  StarOff
} from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import { Badge } from '@/components/ui/badge';

interface DraggableWidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  isVisible?: boolean;
}

export function DraggableWidget({ 
  id, 
  title, 
  children, 
  className = "",
  isVisible = true 
}: DraggableWidgetProps) {
  const { state, dispatch } = useDashboard();

  const widget = state.widgets.find(w => w.id === id);
  if (!widget) return null;

  const handleToggleVisibility = () => {
    dispatch({ type: 'TOGGLE_WIDGET_VISIBILITY', payload: id });
  };

  const handleSettings = () => {
    // TODO: Open settings modal
    console.log('Settings for widget:', id);
  };

  const handleToggleSize = () => {
    dispatch({ type: 'TOGGLE_WIDGET_SIZE', payload: id });
  };

  const handleToggleFavorite = () => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: id });
  };

  // Disable click handler to avoid interfering with react-grid-layout's functionality
  const handleWidgetClick = (e: React.MouseEvent) => {
    // Only handle clicks on buttons and controls
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.widget-controls')) {
      // Let the event propagate normally
    } else {
      // Prevent the event from propagating to react-grid-layout
      e.stopPropagation();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card 
      className={`draggable-widget ${className} ${widget.isFavorite ? 'favorite' : ''}`}
      onClick={handleWidgetClick}
    >
      {/* Removed custom drag indicator to avoid conflicts with react-grid-layout */}

      {/* Widget Controls */}
      <div className={`widget-controls ${state.isEditing ? 'editing' : ''}`}>
        <div className="widget-controls-container">
          {/* Favorite Toggle - Always visible on hover */}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite();
            }}
            className={`h-8 w-8 p-0 transition-colors ${
              widget.isFavorite ? 'text-yellow-500 hover:bg-yellow-500/10' : 'hover:bg-primary/10'
            }`}
            title={widget.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            {widget.isFavorite ? <Star className="w-3 h-3 fill-current" /> : <StarOff className="w-3 h-3" />}
          </Button>

          {/* Size Toggle - Always visible on hover */}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSize();
            }}
            className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
            title={`Taille: ${widget.size} (cliquez pour changer)`}
          >
            {widget.size === 'small' || widget.size === 'medium' ? 
              <Maximize2 className="w-3 h-3" /> : 
              <Minimize2 className="w-3 h-3" />
            }
          </Button>

          {/* Editing Controls - Only visible in editing mode */}
          {state.isEditing && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSettings();
                }}
                className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
                title="Paramètres"
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility();
                }}
                className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
                title={isVisible ? "Masquer" : "Afficher"}
              >
                {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            </>
          )}
        </div>
      </div>

      <CardHeader className="widget-header">
        <CardTitle className="widget-title">
          <div className={`widget-title-indicator ${widget.isFavorite ? 'favorite' : 'default'}`}></div>
          <span>{title}</span>
          <div className="widget-title-badges">
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {widget.size}
            </Badge>
            {widget.isFavorite && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                ★
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="widget-content">
        {children}
      </CardContent>

      {/* Subtle gradient overlay for depth */}
      <div className="widget-gradient-overlay" />

      {/* Removed custom resize indicator to avoid conflicts with react-grid-layout */}
    </Card>
  );
}
