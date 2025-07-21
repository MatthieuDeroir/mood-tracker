"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';

export type WidgetSize = 'small' | 'medium' | 'large' | 'xl';

export interface DashboardWidget {
  id: string;
  type: 'mood-trend' | 'weekly-summary' | 'tags-distribution' | 'radar-chart' | 'stats-cards' | 'patterns' | 'metrics-table' | 'correlation-chart';
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  isVisible: boolean;
  isFavorite: boolean;
  size: WidgetSize;
  settings?: Record<string, any>;
}

export interface DashboardState {
  widgets: DashboardWidget[];
  selectedMetrics: string[];
  selectedPeriod: string;
  gridCols: number;
  rowHeight: number;
  isEditing: boolean;
  widgetSizes: Record<WidgetSize, { w: number; h: number }>;
}

type DashboardAction =
  | { type: 'UPDATE_WIDGET_LAYOUT'; payload: { id: string; x: number; y: number; w: number; h: number } }
  | { type: 'TOGGLE_WIDGET_VISIBILITY'; payload: string }
  | { type: 'UPDATE_WIDGET_SETTINGS'; payload: { id: string; settings: Record<string, any> } }
  | { type: 'TOGGLE_METRIC'; payload: string }
  | { type: 'SET_PERIOD'; payload: string }
  | { type: 'SET_EDITING_MODE'; payload: boolean }
  | { type: 'RESET_LAYOUT' }
  | { type: 'LOAD_LAYOUT'; payload: DashboardWidget[] }
  | { type: 'TOGGLE_WIDGET_SIZE'; payload: string }
  | { type: 'SET_WIDGET_SIZE'; payload: { id: string; size: WidgetSize } }
  | { type: 'TOGGLE_FAVORITE'; payload: string };

// Size configurations for different widget sizes
const WIDGET_SIZES: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 3, h: 3 },
  medium: { w: 4, h: 4 },
  large: { w: 6, h: 5 },
  xl: { w: 12, h: 6 }
};

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'stats-cards',
    type: 'stats-cards',
    title: 'Statistiques',
    x: 0,
    y: 0,
    w: 12,
    h: 2,
    minW: 8,
    minH: 2,
    maxW: 12,
    maxH: 3,
    isVisible: true,
    isFavorite: true,
    size: 'xl',
  },
  {
    id: 'mood-trend',
    type: 'mood-trend',
    title: 'Tendances temporelles',
    x: 0,
    y: 2,
    w: 6,
    h: 5,
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 8,
    isVisible: true,
    isFavorite: true,
    size: 'large',
  },
  {
    id: 'weekly-summary',
    type: 'weekly-summary',
    title: 'Semaine actuelle',
    x: 6,
    y: 2,
    w: 4,
    h: 4,
    minW: 3,
    minH: 3,
    maxW: 6,
    maxH: 5,
    isVisible: true,
    isFavorite: false,
    size: 'medium',
  },
  {
    id: 'radar-chart',
    type: 'radar-chart',
    title: 'Profil bien-être',
    x: 10,
    y: 2,
    w: 2,
    h: 3,
    minW: 2,
    minH: 3,
    maxW: 5,
    maxH: 4,
    isVisible: true,
    isFavorite: false,
    size: 'small',
  },
  {
    id: 'tags-distribution',
    type: 'tags-distribution',
    title: 'Distribution tags',
    x: 0,
    y: 7,
    w: 3,
    h: 3,
    minW: 3,
    minH: 3,
    maxW: 5,
    maxH: 5,
    isVisible: true,
    isFavorite: false,
    size: 'small',
  },
  {
    id: 'correlation-chart',
    type: 'correlation-chart',
    title: 'Corrélations',
    x: 3,
    y: 7,
    w: 4,
    h: 4,
    minW: 3,
    minH: 3,
    maxW: 8,
    maxH: 5,
    isVisible: true,
    isFavorite: false,
    size: 'medium',
  },
  {
    id: 'patterns',
    type: 'patterns',
    title: 'Patterns détectés',
    x: 7,
    y: 7,
    w: 3,
    h: 3,
    minW: 3,
    minH: 3,
    maxW: 4,
    maxH: 5,
    isVisible: true,
    isFavorite: false,
    size: 'small',
  },
  {
    id: 'metrics-table',
    type: 'metrics-table',
    title: 'Tableau des métriques',
    x: 10,
    y: 7,
    w: 2,
    h: 3,
    minW: 2,
    minH: 3,
    maxW: 12,
    maxH: 7,
    isVisible: true,
    isFavorite: false,
    size: 'small',
  },
];

const initialState: DashboardState = {
  widgets: defaultWidgets,
  selectedMetrics: ['mood', 'energy', 'stress'],
  selectedPeriod: 'weekly',
  gridCols: 12,
  rowHeight: 60,
  isEditing: false,
  widgetSizes: WIDGET_SIZES,
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'UPDATE_WIDGET_LAYOUT':
      return {
        ...state,
        widgets: state.widgets.map(widget =>
          widget.id === action.payload.id
            ? { ...widget, ...action.payload }
            : widget
        ),
      };

    case 'TOGGLE_WIDGET_VISIBILITY':
      return {
        ...state,
        widgets: state.widgets.map(widget =>
          widget.id === action.payload
            ? { ...widget, isVisible: !widget.isVisible }
            : widget
        ),
      };

    case 'UPDATE_WIDGET_SETTINGS':
      return {
        ...state,
        widgets: state.widgets.map(widget =>
          widget.id === action.payload.id
            ? { ...widget, settings: { ...widget.settings, ...action.payload.settings } }
            : widget
        ),
      };

    case 'TOGGLE_METRIC':
      const metrics = state.selectedMetrics.includes(action.payload)
        ? state.selectedMetrics.filter(m => m !== action.payload)
        : [...state.selectedMetrics, action.payload];
      return {
        ...state,
        selectedMetrics: metrics.length > 0 ? metrics : [action.payload],
      };

    case 'SET_PERIOD':
      return {
        ...state,
        selectedPeriod: action.payload,
      };

    case 'SET_EDITING_MODE':
      return {
        ...state,
        isEditing: action.payload,
      };

    case 'RESET_LAYOUT':
      return {
        ...state,
        widgets: defaultWidgets,
      };

    case 'LOAD_LAYOUT':
      return {
        ...state,
        widgets: action.payload,
      };

    case 'TOGGLE_WIDGET_SIZE':
      const widget = state.widgets.find(w => w.id === action.payload);
      if (!widget) return state;
      
      const sizeOrder: WidgetSize[] = ['small', 'medium', 'large', 'xl'];
      const currentIndex = sizeOrder.indexOf(widget.size);
      const nextIndex = (currentIndex + 1) % sizeOrder.length;
      const newSize = sizeOrder[nextIndex];
      const newDimensions = state.widgetSizes[newSize];
      
      return {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.payload
            ? { ...w, size: newSize, w: newDimensions.w, h: newDimensions.h }
            : w
        ),
      };

    case 'SET_WIDGET_SIZE':
      const targetWidget = state.widgets.find(w => w.id === action.payload.id);
      if (!targetWidget) return state;
      
      const dimensions = state.widgetSizes[action.payload.size];
      
      return {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.payload.id
            ? { ...w, size: action.payload.size, w: dimensions.w, h: dimensions.h }
            : w
        ),
      };

    case 'TOGGLE_FAVORITE':
      const favoriteWidget = state.widgets.find(w => w.id === action.payload);
      if (!favoriteWidget) return state;
      
      const newFavoriteState = !favoriteWidget.isFavorite;
      const favoriteSize = newFavoriteState ? 'large' : 'medium';
      const favoriteDimensions = state.widgetSizes[favoriteSize];
      
      return {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.payload
            ? { 
                ...w, 
                isFavorite: newFavoriteState, 
                size: favoriteSize,
                w: favoriteDimensions.w,
                h: favoriteDimensions.h
              }
            : w
        ),
      };

    default:
      return state;
  }
}

const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Load layout from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem('dashboard-layout');
      if (savedLayout) {
        try {
          const parsedLayout = JSON.parse(savedLayout);
          dispatch({ type: 'LOAD_LAYOUT', payload: parsedLayout });
        } catch (error) {
          console.error('Failed to load dashboard layout:', error);
        }
      }
    }
  }, []);

  // Save layout to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-layout', JSON.stringify(state.widgets));
    }
  }, [state.widgets]);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}