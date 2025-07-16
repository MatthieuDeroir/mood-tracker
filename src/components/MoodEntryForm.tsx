// src/components/MoodEntryForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

// Échelle d'humeur avec emojis et labels français
const MOOD_SCALE = [
    { value: 0, emoji: '😞', label: 'Très mal' },
    { value: 1, emoji: '😟', label: 'Mal' },
    { value: 2, emoji: '😔', label: 'Plutôt mal' },
    { value: 3, emoji: '😕', label: 'Pas bien' },
    { value: 4, emoji: '😐', label: 'Moyen' },
    { value: 5, emoji: '🙂', label: 'Neutre' },
    { value: 6, emoji: '😊', label: 'Plutôt bien' },
    { value: 7, emoji: '😄', label: 'Bien' },
    { value: 8, emoji: '😁', label: 'Très bien' },
    { value: 9, emoji: '🤩', label: 'Excellent' },
    { value: 10, emoji: '🥳', label: 'Extraordinaire' },
];

// Tags prédéfinis
const PREDEFINED_TAGS = [
    'travail', 'famille', 'santé', 'amis', 'sport', 'nourriture',
    'stress', 'fatigue', 'voyage', 'weekend', 'maladie', 'exercice'
];

interface MoodEntryFormProps {
    onSubmit: (entry: MoodEntryData) => void;
    isSubmitting?: boolean;
}

export interface MoodEntryData {
    mood: number;
    note?: string;
    tags: string[];
    sleepHours?: number;
    medication?: number;
    emotions?: string;
}

export function MoodEntryForm({ onSubmit, isSubmitting = false }: MoodEntryFormProps) {
    const [mood, setMood] = useState<number>(5);
    const [note, setNote] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [sleepHours, setSleepHours] = useState<string>('');
    const [medication, setMedication] = useState<string>('');
    const [emotions, setEmotions] = useState('');
    const [customTag, setCustomTag] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const entryData: MoodEntryData = {
            mood,
            note: note.trim() || undefined,
            tags,
            sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
            medication: medication ? parseFloat(medication) : undefined,
            emotions: emotions.trim() || undefined,
        };

        onSubmit(entryData);

        // Reset form
        setMood(5);
        setNote('');
        setTags([]);
        setSleepHours('');
        setMedication('');
        setEmotions('');
    };

    const addTag = (tag: string) => {
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const addCustomTag = () => {
        if (customTag.trim()) {
            addTag(customTag.trim().toLowerCase());
            setCustomTag('');
        }
    };

    const currentMoodInfo = MOOD_SCALE.find(item => item.value === mood);

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-center">
                    Comment vous sentez-vous aujourd'hui ?
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Échelle d'humeur */}
                    <div className="space-y-4">
                        <Label htmlFor="mood" className="text-base font-medium">
                            Humeur {currentMoodInfo && (
                            <span className="ml-2 text-2xl">
                  {currentMoodInfo.emoji} {currentMoodInfo.label}
                </span>
                        )}
                        </Label>
                        <div className="px-3">
                            <Slider
                                id="mood"
                                min={0}
                                max={10}
                                step={1}
                                value={[mood]}
                                onValueChange={(value) => setMood(value[0])}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                <span>0 - Très mal</span>
                                <span>5 - Neutre</span>
                                <span>10 - Extraordinaire</span>
                            </div>
                        </div>
                    </div>

                    {/* Note/Commentaire */}
                    <div className="space-y-2">
                        <Label htmlFor="note">Commentaire (optionnel)</Label>
                        <Textarea
                            id="note"
                            placeholder="Décrivez votre journée, vos sentiments..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label>Tags</Label>

                        {/* Tags sélectionnés */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="px-2 py-1">
                                        {tag}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="ml-1 h-4 w-4 p-0"
                                            onClick={() => removeTag(tag)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Tags prédéfinis */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {PREDEFINED_TAGS.map((tag) => (
                                <Button
                                    key={tag}
                                    type="button"
                                    variant={tags.includes(tag) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                                >
                                    {tag}
                                </Button>
                            ))}
                        </div>

                        {/* Tag personnalisé */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ajouter un tag personnalisé..."
                                value={customTag}
                                onChange={(e) => setCustomTag(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addCustomTag();
                                    }
                                }}
                            />
                            <Button type="button" variant="outline" onClick={addCustomTag}>
                                Ajouter
                            </Button>
                        </div>
                    </div>

                    {/* Données supplémentaires */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sleep">Heures de sommeil</Label>
                            <Input
                                id="sleep"
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                placeholder="8.5"
                                value={sleepHours}
                                onChange={(e) => setSleepHours(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="medication">Médicaments (mg)</Label>
                            <Input
                                id="medication"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="10.5"
                                value={medication}
                                onChange={(e) => setMedication(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Émotions */}
                    <div className="space-y-2">
                        <Label htmlFor="emotions">Émotions ressenties</Label>
                        <Input
                            id="emotions"
                            placeholder="Calme, anxieux, joyeux, frustré..."
                            value={emotions}
                            onChange={(e) => setEmotions(e.target.value)}
                        />
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer mon humeur'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}