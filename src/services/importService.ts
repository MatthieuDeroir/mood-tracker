// src/services/importService.ts
import { db } from '../db/database.ts';
import { moodEntries } from '../db/schema.ts';

// Interface pour le format CSV
interface MoodCsvRow {
    date: string;            // Date de l'humeur
    score: number;           // Score de l'humeur
    sleepHours: number;      // Heures de sommeil
    medication: number;      // Médicaments
    emotions: string;        // Émotions
    comment: string;         // Commentaire
}

// Formats de date connus
const datePatterns = [
    // JJ/MM/AAAA
    {
        regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        parse: (match: RegExpMatchArray) => {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1; // Les mois sont indexés à partir de 0
            const year = parseInt(match[3], 10);
            return new Date(year, month, day);
        }
    },
    // AAAA-MM-JJ
    {
        regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        parse: (match: RegExpMatchArray) => {
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            const day = parseInt(match[3], 10);
            return new Date(year, month, day);
        }
    },
    // Format jour de la semaine DD mois AAAA (ex: "vendredi 27 juin 2025")
    {
        regex: /^(\w+) (\d{1,2}) (\w+) (\d{4})$/,
        parse: (match: RegExpMatchArray) => {
            const day = parseInt(match[2], 10);
            const monthName = match[3].toLowerCase();
            const year = parseInt(match[4], 10);

            // Conversion des noms de mois en français
            const months: Record<string, number> = {
                'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
                'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
            };

            const monthIndex = months[monthName];
            if (monthIndex !== undefined) {
                return new Date(year, monthIndex, day);
            }
            throw new Error(`Mois inconnu: ${monthName}`);
        }
    },
    // Format jour de la semaine seul (lundi, mardi, etc.) - ajouté pour meilleure détection
    {
        regex: /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
        parse: (match: RegExpMatchArray) => {
            const day = parseInt(match[2], 10);
            const monthName = match[3].toLowerCase();
            const year = parseInt(match[4], 10);

            // Conversion des noms de mois en français
            const months: Record<string, number> = {
                'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
                'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
            };

            const monthIndex = months[monthName];
            if (monthIndex !== undefined) {
                return new Date(year, monthIndex, day);
            }
            throw new Error(`Mois inconnu: ${monthName}`);
        }
    }
];

export class ImportService {
    /**
     * Importe des données depuis un CSV au format spécifié
     * Gère les commentaires multi-lignes
     */
    static async importFromCsv(
        userId: string,
        csvContent: string,
        options: {
            dateFormat?: string;
            delimiter?: string;
            skipHeader?: boolean;
            fixMode?: boolean; // Mode de correction automatique
        } = {}
    ): Promise<{ success: number; failed: number; total: number; errors: string[] }> {
        // Options par défaut
        const {
            delimiter = ',',
            skipHeader = true,
            dateFormat = 'DD/MM/YYYY',
            fixMode = true  // Activer par défaut
        } = options;

        // Tableau pour stocker les erreurs détaillées
        const errors: string[] = [];

        // Nettoyer le contenu CSV (enlever les caractères invisibles)
        csvContent = csvContent.replace(/\r/g, '');

        // Séparer les lignes
        let lines = csvContent.split('\n');
        let startIndex = skipHeader ? 1 : 0;

        // Filtrer les lignes vides
        lines = lines.filter(line => line.trim().length > 0);

        // Résultats de l'importation
        const results = {
            success: 0,
            failed: 0,
            total: 0,
            errors
        };

        // Variable pour stocker l'entrée en cours de traitement
        let currentEntry: MoodCsvRow | null = null;
        let lineNumber = startIndex;

        // Tableau pour stocker les entrées traitées
        const processedEntries: MoodCsvRow[] = [];

        // Traiter les lignes en tenant compte des commentaires multi-lignes
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            lineNumber = startIndex + i + 1;

            // Détecter si la ligne commence par une date
            const hasDate = this.lineStartsWithDate(line);

            if (hasDate) {
                // Si une entrée est en cours, l'ajouter au tableau des entrées traitées
                if (currentEntry) {
                    processedEntries.push(currentEntry);
                }

                // Essayer de parser la nouvelle ligne comme une entrée complète
                try {
                    const row = this.parseCsvLine(line, delimiter, fixMode);
                    if (row) {
                        currentEntry = row;
                    } else {
                        errors.push(`Erreur ligne ${lineNumber}: Format CSV invalide: ${line}`);
                        currentEntry = null;
                    }
                } catch (error) {
                    errors.push(`Erreur ligne ${lineNumber}: ${error.message}`);
                    currentEntry = null;
                }
            } else if (currentEntry) {
                // Cette ligne est une continuation du commentaire
                currentEntry.comment = currentEntry.comment
                    ? `${currentEntry.comment}\n${line}`
                    : line;
            } else {
                // Ligne sans date et sans entrée en cours
                errors.push(`Erreur ligne ${lineNumber}: Pas de date détectée et aucune entrée précédente: ${line}`);
            }
        }

        // Ajouter la dernière entrée si elle existe
        if (currentEntry) {
            processedEntries.push(currentEntry);
        }

        // Mettre à jour le total
        results.total = processedEntries.length;

        // Importer les entrées traitées
        for (const entry of processedEntries) {
            try {
                const moodEntry = await this.createMoodEntryFromCsv(userId, entry);
                if (moodEntry) {
                    results.success++;
                } else {
                    results.failed++;
                    errors.push(`Échec de création de l'entrée avec date: ${entry.date}`);
                }
            } catch (error) {
                results.failed++;
                errors.push(`Erreur lors de la création de l'entrée avec date ${entry.date}: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Vérifie si une ligne commence par une date valide
     */
    private static lineStartsWithDate(line: string): boolean {
        // Récupérer le premier segment qui pourrait être une date
        const firstPart = line.split(',')[0].trim();

        // Vérifier les formats de date connus
        for (const pattern of datePatterns) {
            if (pattern.regex.test(firstPart)) {
                return true;
            }
        }

        // Formats spécifiques pour les dates textuelles (français)
        const joursSemaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

        for (const jour of joursSemaine) {
            if (firstPart.toLowerCase().startsWith(jour)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Analyse une ligne CSV en objet, avec tolérance aux erreurs
     */
    private static parseCsvLine(line: string, delimiter: string, fixMode = true): MoodCsvRow | null {
        // Adaptation pour les guillemets
        let parts: string[] = [];

        // Si la ligne est entourée de guillemets, utiliser une approche plus robuste
        if (line.includes('"')) {
            let inQuotes = false;
            let currentPart = '';

            for (let i = 0; i < line.length; i++) {
                const char = line[i];

                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === delimiter && !inQuotes) {
                    parts.push(currentPart);
                    currentPart = '';
                } else {
                    currentPart += char;
                }
            }

            // Ajouter la dernière partie
            parts.push(currentPart);
        } else {
            // Sinon, simplement diviser par le délimiteur
            parts = line.split(delimiter);
        }

        // S'assurer qu'il y a au moins 2 parties (date et score)
        if (parts.length < 2) {
            if (!fixMode) return null;

            // En mode correction, essayer de trouver la date et le score
            const datePatterns = [
                /^(\d{1,2}\/\d{1,2}\/\d{4})/,
                /^(\d{4}-\d{1,2}-\d{1,2})/,
                /^(\w+ \d{1,2} \w+ \d{4})/
            ];

            let dateMatch = null;
            for (const pattern of datePatterns) {
                const match = line.match(pattern);
                if (match) {
                    dateMatch = match;
                    break;
                }
            }

            // Chercher aussi pour les jours de la semaine français
            if (!dateMatch) {
                const joursSemaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
                for (const jour of joursSemaine) {
                    if (line.toLowerCase().startsWith(jour)) {
                        dateMatch = [line.split(' ').slice(0, 4).join(' ')];
                        break;
                    }
                }
            }

            const scoreMatch = line.match(/(\d+)\/10/) || line.match(/score\s*[:=]?\s*(\d+)/i) || line.match(/(\d+)/);

            if (dateMatch) {
                const date = dateMatch[0];
                const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;

                let commentStart = date.length;
                if (scoreMatch) {
                    commentStart = line.indexOf(scoreMatch[0]) + scoreMatch[0].length;
                }

                const comment = line.substring(commentStart).trim();

                return {
                    date,
                    score,
                    sleepHours: 0,
                    medication: 0,
                    emotions: '',
                    comment
                };
            }

            return null;
        }

        // Si on a moins de 6 parties mais au moins 2, compléter avec des valeurs par défaut
        while (parts.length < 6) {
            parts.push('');
        }

        // Nettoyer les parties
        parts = parts.map(p => p.trim());

        // Créer l'objet de ligne
        return {
            date: parts[0],
            score: parseInt(parts[1], 10) || 5, // Valeur par défaut 5 si non valide
            sleepHours: parseFloat(parts[2]) || 0,
            medication: parseFloat(parts[3]) || 0,
            emotions: parts[4],
            comment: parts[5]
        };
    }

    /**
     * Tente de convertir une chaîne de date dans différents formats en objet Date
     */
    private static parseDate(dateStr: string): Date {
        // Essayer chaque format connu
        for (const pattern of datePatterns) {
            const match = dateStr.match(pattern.regex);
            if (match) {
                try {
                    return pattern.parse(match);
                } catch (e) {
                    // Continuer avec le prochain pattern
                }
            }
        }

        // Chercher aussi pour les jours de la semaine français
        const joursSemaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        for (const jour of joursSemaine) {
            if (dateStr.toLowerCase().startsWith(jour)) {
                const parts = dateStr.split(' ');
                if (parts.length >= 4) {
                    const day = parseInt(parts[1], 10);
                    const monthName = parts[2].toLowerCase();
                    const year = parseInt(parts[3], 10);

                    // Conversion des noms de mois en français
                    const months: Record<string, number> = {
                        'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
                        'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
                    };

                    const monthIndex = months[monthName];
                    if (monthIndex !== undefined) {
                        return new Date(year, monthIndex, day);
                    }
                }
            }
        }

        // Si on arrive ici, aucun format n'a fonctionné
        throw new Error(`Date invalide: ${dateStr}`);
    }

    /**
     * Crée une entrée d'humeur à partir d'une ligne CSV
     */
    private static async createMoodEntryFromCsv(userId: string, row: MoodCsvRow) {
        try {
            // Conversion du score au format 0-10 si nécessaire
            let normalizedScore = row.score;

            // Si le score est sur une autre échelle, le normaliser
            if (row.score > 10) {
                normalizedScore = Math.min(10, Math.round((row.score / 100) * 10));
            } else if (row.score < 0) {
                normalizedScore = 0;
            }

            // Créer des tags à partir des émotions
            const emotions = row.emotions.split(',').map(e => e.trim());
            const tags = emotions.filter(e => e.length > 0);

            // Créer la date à partir du format
            let timestamp: Date;
            try {
                timestamp = this.parseDate(row.date);
            } catch (error) {
                console.error('Erreur lors de la création de l\'entrée:', error);
                throw error;
            }

            // Vérifier si la date est valide
            if (isNaN(timestamp.getTime())) {
                throw new Error(`Date invalide: ${row.date}`);
            }

            // Insérer l'entrée dans la base de données
            const [newEntry] = await db.insert(moodEntries)
                .values({
                    userId,
                    mood: normalizedScore,
                    note: row.comment,
                    tags,
                    sleepHours: row.sleepHours,
                    medication: row.medication,
                    emotions: row.emotions,
                    timestamp
                })
                .returning();

            return newEntry;
        } catch (error) {
            console.error('Erreur lors de la création de l\'entrée:', error);
            throw error;
        }
    }

    /**
     * Extrait les émotions du texte du commentaire
     * Utile lorsque les émotions ne sont pas explicitement indiquées
     */
    private static extractEmotionsFromText(text: string): string {
        const emotions = [
            'heureux', 'triste', 'anxieux', 'calme', 'énervé', 'stressé', 'content',
            'fatigué', 'excité', 'déprimé', 'enthousiaste', 'irrité', 'nerveux',
            'bien', 'mal', 'inquiet', 'serein', 'joyeux', 'confus', 'apaisé'
        ];

        const foundEmotions = emotions.filter(emotion =>
            text.toLowerCase().includes(emotion)
        );

        return foundEmotions.join(', ');
    }

    /**
     * Estime un score d'humeur à partir du texte du commentaire
     * Utile lorsque le score n'est pas explicitement indiqué
     */
    private static estimateMoodFromText(text: string): number {
        const positiveWords = [
            'heureux', 'content', 'super', 'bien', 'cool', 'génial', 'excellent',
            'incroyable', 'fantastique', 'top', 'joyeux', 'agréable', 'serein', 'calme'
        ];

        const negativeWords = [
            'triste', 'déprimé', 'mal', 'anxieux', 'anxiété', 'stressé', 'fatigué',
            'horrible', 'terrible', 'énervé', 'irrité', 'nerveux', 'inquiet', 'pire'
        ];

        text = text.toLowerCase();
        let score = 5; // Score neutre par défaut

        // Ajuster le score en fonction des mots présents
        for (const word of positiveWords) {
            if (text.includes(word)) score += 1;
        }

        for (const word of negativeWords) {
            if (text.includes(word)) score -= 1;
        }

        // Limiter le score entre 0 et 10
        return Math.max(0, Math.min(10, score));
    }
}

export default ImportService;