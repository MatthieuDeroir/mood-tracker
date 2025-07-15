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
    }
];

export class ImportService {
    /**
     * Importe des données depuis un CSV au format spécifié
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
            total: lines.length - startIndex,
            errors
        };

        // Fonction de correction intelligente pour les lignes
        const fixLine = (line: string, delimiter: string): string => {
            if (!fixMode) return line;

            // Si la ligne contient des guillemets, les gérer spécialement
            if (line.includes('"')) {
                // Remplacer temporairement les virgules dans les guillemets
                let inQuotes = false;
                let newLine = '';

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];

                    if (char === '"') {
                        inQuotes = !inQuotes;
                        newLine += char;
                    } else if (char === ',' && inQuotes) {
                        newLine += '###COMMA###';
                    } else {
                        newLine += char;
                    }
                }

                // Traiter la ligne sans les virgules entre guillemets
                let processed = fixLine(newLine.replace(/"/g, ''), delimiter);

                // Remettre les virgules d'origine
                return processed.replace(/###COMMA###/g, ',');
            }

            // Si la ligne ne contient pas assez de délimiteurs, essayer de deviner
            const delimCount = (line.match(new RegExp(delimiter === '|' ? '\\|' : delimiter, 'g')) || []).length;

            if (delimCount < 5) {
                // Détection de date au début
                const datePatterns = [
                    /^\d{1,2}\/\d{1,2}\/\d{4}/,
                    /^\d{4}-\d{1,2}-\d{1,2}/,
                    /^\w+ \d{1,2} \w+ \d{4}/
                ];

                let dateMatch = null;
                for (const pattern of datePatterns) {
                    const match = line.match(pattern);
                    if (match) {
                        dateMatch = match;
                        break;
                    }
                }

                if (dateMatch) {
                    // C'est probablement une ligne de données qui a besoin de plus de délimiteurs
                    const parts = line.split(delimiter);

                    // Si on a la date mais pas assez d'autres champs
                    if (parts.length === 1) {
                        // Essayer de détecter le score à partir du premier nombre après la date
                        const restOfLine = line.substring(dateMatch[0].length);
                        const scoreMatch = restOfLine.match(/(\d+)/);

                        if (scoreMatch) {
                            const score = scoreMatch[1];
                            const scoreIndex = restOfLine.indexOf(score);
                            const comment = restOfLine.substring(scoreIndex + score.length).trim();

                            // Reconstruire la ligne avec des valeurs par défaut
                            return `${dateMatch[0]}${delimiter}${score}${delimiter}0${delimiter}0${delimiter}${delimiter}${comment}`;
                        } else {
                            // Pas de score trouvé, ajouter des valeurs par défaut
                            return `${dateMatch[0]}${delimiter}5${delimiter}0${delimiter}0${delimiter}${delimiter}${restOfLine.trim()}`;
                        }
                    }

                    // Si on a déjà quelques champs mais pas tous
                    while (parts.length < 6) {
                        parts.push('');
                    }

                    return parts.join(delimiter);
                }
            }

            return line;
        };

        // Prétraiter et filtrer les lignes
        lines = lines
            .filter(line => line.trim().length > 0)
            .map(line => fixLine(line.trim(), delimiter));

        // Recalculer le total après filtrage
        results.total = lines.length - startIndex;

        // Traiter chaque ligne
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            try {
                // Essayer d'extraire les parties de la ligne
                const row = this.parseCsvLine(line, delimiter, fixMode);

                if (row) {
                    try {
                        const moodEntry = await this.createMoodEntryFromCsv(userId, row);
                        if (moodEntry) {
                            results.success++;
                        } else {
                            results.failed++;
                            errors.push(`Erreur ligne ${i+1}: Échec de création de l'entrée`);
                        }
                    } catch (error) {
                        console.error(`Erreur lors de la création de l'entrée:`, error);
                        results.failed++;
                        errors.push(`Erreur ligne ${i+1}: ${error.message}`);
                    }
                } else {
                    results.failed++;
                    errors.push(`Erreur ligne ${i+1}: Format CSV invalide: ${line}`);
                }
            } catch (error) {
                console.error(`Erreur ligne ${i+1}:`, error);
                results.failed++;
                errors.push(`Erreur ligne ${i+1}: ${error.message}`);
            }
        }

        return results;
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

            const scoreMatch = line.match(/(\d+)\/10/) || line.match(/(\d+)/);

            if (dateMatch) {
                const date = dateMatch[1];
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
}

export default ImportService;