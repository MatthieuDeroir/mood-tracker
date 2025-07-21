"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  
  const handleWidgetClick = (e: React.MouseEvent) => {
    // Only trigger size toggle if we're not in editing mode and not clicking on controls
    if (!state.isEditing && !e.currentTarget.classList.contains('drag-handle')) {
      const target = e.target as HTMLElement;
      // Don't toggle if clicking on interactive elements
      if (!target.closest('button') && !target.closest('.widget-controls')) {
        handleToggleSize();
      }
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card 
      className={`relative group animate-in hover-lift ${className} bg-gradient-to-br from-card via-card to-card/95 border shadow-md transition-all duration-300 ${
        widget.isFavorite ? 'ring-2 ring-primary/20 shadow-lg' : ''
      } ${
        !state.isEditing ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''
      }`}
      onClick={handleWidgetClick}
    >
      {/* Drag Handle - Only visible in editing mode */}
      {state.isEditing && (
        <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110 drag-handle">
          <div className="flex items-center gap-1 bg-primary/10 backdrop-blur-md rounded-lg px-3 py-2 border border-primary/20 shadow-lg cursor-grab active:cursor-grabbing">
            <GripHorizontal className="w-4 h-4 text-primary pointer-events-none" />
            <span className="text-xs text-primary font-medium pointer-events-none">Drag</span>
          </div>
        </div>
      )}

      {/* Widget Controls */}
      <div className={`absolute top-3 right-3 z-20 widget-controls transition-all duration-300 ${
        state.isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <div className="flex items-center gap-1 bg-card/90 backdrop-blur-md rounded-lg border shadow-lg">
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

      <CardHeader className={`pb-4 pt-12 px-6 ${state.isEditing ? 'drag-handle cursor-grab' : ''}`}>
        <CardTitle className="text-base font-semibold flex items-center gap-3 text-foreground pointer-events-none">
          <div className={`w-2 h-2 rounded-full transition-colors ${
            widget.isFavorite ? 'bg-yellow-500' : 'bg-primary'
          }`}></div>
          <span>{title}</span>
          <div className="flex items-center gap-1 ml-auto">
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
      
      <CardContent className="pt-0 px-6 pb-6">
        {children}
      </CardContent>
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 rounded-lg pointer-events-none" />
    </Card>
  );
}