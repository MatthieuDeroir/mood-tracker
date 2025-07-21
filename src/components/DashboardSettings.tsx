"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Settings,
  Layout,
  Palette,
  Grid,
  Eye,
  EyeOff,
  RotateCcw,
  Save
} from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';

export function DashboardSettings() {
  const { state, dispatch } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleWidget = (widgetId: string) => {
    dispatch({ type: 'TOGGLE_WIDGET_VISIBILITY', payload: widgetId });
  };

  const handleResetLayout = () => {
    dispatch({ type: 'RESET_LAYOUT' });
    setIsOpen(false);
  };

  const handleRowHeightChange = (value: number[]) => {
    // This would need to be implemented in the context
    console.log('Row height changed:', value[0]);
  };

  const visibleWidgetsCount = state.widgets.filter(w => w.isVisible).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Settings className="w-3 h-3 mr-1" />
          Paramètres
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paramètres du tableau de bord</DialogTitle>
          <DialogDescription>
            Personnalisez l'apparence et l'organisation de votre tableau de bord
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="widgets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="widgets" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Widgets
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Disposition
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Apparence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="widgets" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Widgets visibles</h3>
                <Badge variant="secondary">{visibleWidgetsCount} / {state.widgets.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {state.widgets.map((widget) => (
                  <Card key={widget.id} className={`transition-opacity ${widget.isVisible ? '' : 'opacity-60'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {widget.isVisible ? (
                            <Eye className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium text-sm">{widget.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Taille: {widget.w}x{widget.h} · Position: ({widget.x}, {widget.y})
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={widget.isVisible}
                          onCheckedChange={() => handleToggleWidget(widget.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Mode d'édition</Label>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">
                      {state.isEditing ? 'Édition activée' : 'Édition désactivée'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Permet de déplacer et redimensionner les widgets
                    </div>
                  </div>
                  <Switch
                    checked={state.isEditing}
                    onCheckedChange={(checked) => 
                      dispatch({ type: 'SET_EDITING_MODE', payload: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Hauteur des lignes</Label>
                <div className="px-3">
                  <Slider
                    value={[state.rowHeight]}
                    onValueChange={handleRowHeightChange}
                    min={40}
                    max={120}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Compact (40px)</span>
                    <span>Actuel: {state.rowHeight}px</span>
                    <span>Large (120px)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Actions</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetLayout}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Réinitialiser la disposition
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Grille</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Colonnes</Label>
                    <div className="text-sm font-mono bg-muted/30 px-2 py-1 rounded">
                      {state.gridCols}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Widgets actifs</Label>
                    <div className="text-sm font-mono bg-muted/30 px-2 py-1 rounded">
                      {visibleWidgetsCount}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Métriques sélectionnées</Label>
                <div className="flex flex-wrap gap-2">
                  {state.selectedMetrics.map((metric) => (
                    <Badge key={metric} variant="default" className="text-xs">
                      {metric}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Période active</Label>
                <div className="text-sm bg-muted/30 px-3 py-2 rounded-lg">
                  {state.selectedPeriod}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}