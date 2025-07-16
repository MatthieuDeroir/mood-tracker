import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { moodEntries, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface MoodCsvRow {
  date: string;
  score: number;
  sleepHours: number;
  medication: number;
  emotions: string;
  comment: string;
}

interface ImportResult {
  success: boolean;
  imported?: number;
  errors?: number;
  errorDetails?: string[];
  error?: string;
  preview?: {
    totalLinesProcessed: number;
    entriesFound: number;
    sampleEntries: Array<{
      date: string;
      score: number;
      comment: string;
      lineNumber: number;
    }>;
  };
}

// Formats de date supportés
const datePatterns = [
  // JJ/MM/AAAA
  {
    regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    parse: (match: RegExpMatchArray) => {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
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
    regex: /^(\w+)\s+(\d{1,2})\s+(\w+)\s+(\d{4})$/,
    parse: (match: RegExpMatchArray) => {
      const day = parseInt(match[2], 10);
      const monthName = match[3].toLowerCase();
      const year = parseInt(match[4], 10);

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

// Fonction pour détecter si une ligne commence par une date
function lineStartsWithDate(line: string): boolean {
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

// Fonction pour parser une ligne CSV avec gestion des guillemets
function parseCsvLine(line: string, delimiter: string = ','): MoodCsvRow | null {
  let parts: string[] = [];

  // Gestion des guillemets
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

    parts.push(currentPart);
  } else {
    parts = line.split(delimiter);
  }

  // Nettoyer les parties
  parts = parts.map(p => p.trim());

  // Si on a moins de 6 parties mais au moins 2, compléter avec des valeurs par défaut
  while (parts.length < 6) {
    parts.push('');
  }

  return {
    date: parts[0],
    score: parseInt(parts[1], 10) || 5,
    sleepHours: parseFloat(parts[2]) || 0,
    medication: parseFloat(parts[3]) || 0,
    emotions: parts[4] || '',
    comment: parts[5] || ''
  };
}

// Fonction pour parser une date dans différents formats
function parseDate(dateStr: string): Date {
  for (const pattern of datePatterns) {
    const match = dateStr.match(pattern.regex);
    if (match) {
      try {
        return pattern.parse(match);
      } catch (e) {
        continue;
      }
    }
  }

  throw new Error(`Format de date non reconnu: ${dateStr}`);
}

// Fonction principale pour traiter le CSV avec gestion des commentaires multi-lignes
function processCSVWithMultiline(csvContent: string): {
  processedEntries: MoodCsvRow[];
  errors: string[];
  totalLinesProcessed: number;
} {
  const errors: string[] = [];
  let lines = csvContent.replace(/\r/g, '').split('\n');

  // Filtrer les lignes vides
  lines = lines.filter(line => line.trim().length > 0);

  let currentEntry: MoodCsvRow | null = null;
  let lineNumber = 1; // Commencer à 1 pour l'en-tête
  const processedEntries: MoodCsvRow[] = [];

  // Traiter les lignes en tenant compte des commentaires multi-lignes
  for (let i = 1; i < lines.length; i++) { // Commencer à 1 pour ignorer l'en-tête
    const line = lines[i].trim();
    if (!line) continue;

    lineNumber = i + 1;

    // Détecter si la ligne commence par une date
    const hasDate = lineStartsWithDate(line);

    if (hasDate) {
      // Si une entrée est en cours, l'ajouter au tableau des entrées traitées
      if (currentEntry) {
        processedEntries.push(currentEntry);
      }

      // Essayer de parser la nouvelle ligne comme une entrée complète
      try {
        const row = parseCsvLine(line);
        if (row) {
          currentEntry = row;
        } else {
          errors.push(`Erreur ligne ${lineNumber}: Format CSV invalide: ${line}`);
          currentEntry = null;
        }
      } catch (error) {
        errors.push(`Erreur ligne ${lineNumber}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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

  return {
    processedEntries,
    errors,
    totalLinesProcessed: lines.length
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const preview = formData.get("preview") === "true";

    if (!file) {
      return NextResponse.json(
          { success: false, error: "No file uploaded" },
          { status: 400 }
      );
    }

    const csvContent = await file.text();
    console.log(`📁 Fichier reçu: ${file.name} (${file.size} bytes)`);

    // Traiter le CSV avec gestion des commentaires multi-lignes
    const { processedEntries, errors, totalLinesProcessed } = processCSVWithMultiline(csvContent);

    console.log(`📊 Analyse terminée:`);
    console.log(`   - Lignes totales traitées: ${totalLinesProcessed}`);
    console.log(`   - Entrées trouvées: ${processedEntries.length}`);
    console.log(`   - Erreurs: ${errors.length}`);

    // Mode preview : retourner les informations sans importer
    if (preview) {
      const sampleEntries = processedEntries.slice(0, 5).map((entry, index) => ({
        date: entry.date,
        score: entry.score,
        comment: entry.comment.substring(0, 100) + (entry.comment.length > 100 ? '...' : ''),
        lineNumber: index + 2 // +2 car on ignore l'en-tête et commence à 1
      }));

      return NextResponse.json({
        success: true,
        preview: {
          totalLinesProcessed,
          entriesFound: processedEntries.length,
          sampleEntries
        },
        errorDetails: errors
      });
    }

    // Mode import : insérer en base de données
    const userEmail = "user@example.com";

    // Ensure user exists
    let user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        email: userEmail,
        name: "Default User",
      }).returning();
      user = newUser;
    }

    let imported = 0;
    const importErrors: string[] = [...errors];

    // Importer les entrées traitées
    for (const entry of processedEntries) {
      try {
        const date = parseDate(entry.date);

        // Insérer en base
        await db.insert(moodEntries).values({
          userId: user[0].id,
          mood: entry.score,
          note: entry.comment || null,
          tags: [], // Peut être étendu plus tard
          sleepHours: entry.sleepHours > 0 ? entry.sleepHours : null,
          medication: entry.medication > 0 ? entry.medication : null,
          emotions: entry.emotions || null,
          timestamp: date,
        });

        imported++;
        console.log(`✅ Importé: ${entry.date} - Score: ${entry.score}`);
      } catch (error) {
        const errorMsg = `Échec de l'import pour l'entrée ${entry.date}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        importErrors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`🎉 Import terminé: ${imported}/${processedEntries.length} entrées importées`);

    return NextResponse.json({
      success: true,
      imported,
      errors: importErrors.length,
      errorDetails: importErrors,
    });

  } catch (error) {
    console.error("❌ Erreur générale d'import:", error);
    return NextResponse.json(
        { success: false, error: "Failed to process CSV file" },
        { status: 500 }
    );
  }
}