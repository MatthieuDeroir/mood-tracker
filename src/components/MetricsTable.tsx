"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';

interface MoodEntry {
  id: string;
  date: string;
  mood?: number;
  energy?: number;
  stress?: number;
  work?: number;
  social?: number;
  alone?: number;
  sleepHours?: number;
  note?: string;
  tags: string[];
}

interface MetricsTableProps {
  data?: MoodEntry[];
}

const mockData: MoodEntry[] = [
  {
    id: '1',
    date: '2024-01-20',
    mood: 8,
    energy: 7,
    stress: 3,
    work: 9,
    social: 8,
    alone: 7,
    sleepHours: 8.5,
    note: 'Excellente journée productive',
    tags: ['travail', 'sport']
  },
  {
    id: '2',
    date: '2024-01-19',
    mood: 6,
    energy: 5,
    stress: 6,
    work: 7,
    social: 5,
    alone: 6,
    sleepHours: 7.0,
    note: 'Journée moyenne',
    tags: ['famille', 'repos']
  },
  {
    id: '3',
    date: '2024-01-18',
    mood: 9,
    energy: 8,
    stress: 2,
    work: 8,
    social: 9,
    alone: 8,
    sleepHours: 9.0,
    note: 'Super soirée entre amis',
    tags: ['amis', 'sortie']
  },
  {
    id: '4',
    date: '2024-01-17',
    mood: 4,
    energy: 3,
    stress: 8,
    work: 5,
    social: 3,
    alone: 4,
    sleepHours: 5.5,
    note: 'Journée difficile au travail',
    tags: ['travail', 'stress']
  },
  {
    id: '5',
    date: '2024-01-16',
    mood: 7,
    energy: 6,
    stress: 4,
    work: 7,
    social: 7,
    alone: 6,
    sleepHours: 8.0,
    note: 'Bonne journée équilibrée',
    tags: ['équilibre', 'santé']
  },
];

type SortField = keyof MoodEntry;
type SortDirection = 'asc' | 'desc';

const columnConfig = {
  date: { label: 'Date', icon: Calendar },
  mood: { label: 'Humeur', icon: null },
  energy: { label: 'Énergie', icon: null },
  stress: { label: 'Stress', icon: null },
  work: { label: 'Travail', icon: null },
  social: { label: 'Social', icon: null },
  alone: { label: 'Seul', icon: null },
  sleepHours: { label: 'Sommeil (h)', icon: null },
  note: { label: 'Note', icon: null },
  tags: { label: 'Tags', icon: null },
};

export function MetricsTable({ data = mockData }: MetricsTableProps) {
  const { state } = useDashboard();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['date', 'mood', ...state.selectedMetrics, 'note'])
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleColumn = (column: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(column)) {
      newVisibleColumns.delete(column);
    } else {
      newVisibleColumns.add(column);
    }
    setVisibleColumns(newVisibleColumns);
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        entry.date.includes(searchTerm)
      );
    }

    // Sort data
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      } else if (sortField === 'tags') {
        aVal = a.tags.join(', ');
        bVal = b.tags.join(', ');
      }

      if (aVal === undefined) aVal = 0;
      if (bVal === undefined) bVal = 0;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortDirection]);

  const formatValue = (value: any, field: string) => {
    if (value === undefined || value === null) {
      return <Minus className="w-4 h-4 text-muted-foreground" />;
    }

    switch (field) {
      case 'date':
        return new Date(value).toLocaleDateString('fr-FR');
      case 'sleepHours':
        return `${value}h`;
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        );
      case 'note':
        return (
          <div className="max-w-xs truncate" title={value}>
            {value}
          </div>
        );
      default:
        if (typeof value === 'number') {
          return (
            <div className="flex items-center gap-1">
              <span>{value}</span>
              {value >= 7 && <TrendingUp className="w-3 h-3 text-green-500" />}
              {value <= 3 && <TrendingDown className="w-3 h-3 text-red-500" />}
            </div>
          );
        }
        return value;
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Tableau des métriques</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 w-40"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="w-4 h-4" />
                  Colonnes
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {Object.entries(columnConfig).map(([key, config]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={visibleColumns.has(key)}
                    onCheckedChange={() => toggleColumn(key)}
                  >
                    {config.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.entries(columnConfig)
                    .filter(([key]) => visibleColumns.has(key))
                    .map(([key, config]) => (
                      <TableHead 
                        key={key} 
                        className="cursor-pointer hover:bg-muted/50 sticky top-0 bg-background"
                        onClick={() => handleSort(key as SortField)}
                      >
                        <div className="flex items-center gap-1">
                          {config.icon && <config.icon className="w-4 h-4" />}
                          {config.label}
                          <SortIcon field={key} />
                        </div>
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/50">
                    {Object.keys(columnConfig)
                      .filter(key => visibleColumns.has(key))
                      .map(key => (
                        <TableCell key={key} className="text-sm">
                          {formatValue(entry[key as keyof MoodEntry], key)}
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
          <span>{filteredAndSortedData.length} entrées</span>
          <span>Dernière mise à jour: il y a 2 min</span>
        </div>
      </CardContent>
    </Card>
  );
}