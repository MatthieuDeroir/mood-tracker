import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { moodEntries, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface CSVRow {
  date: string;
  mood: string;
  note?: string;
  tags?: string;
  sleepHours?: string;
  medication?: string;
  emotions?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  
  result.push(current.trim());
  return result;
}

function parseFrenchDate(dateStr: string): Date | null {
  // Remove day names and clean up
  const cleaned = dateStr.replace(/^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+/i, '').trim();
  
  // Try different date formats
  const formats = [
    // DD mois YYYY
    /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
    // DD/MM/YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    // YYYY-MM-DD
    /(\d{4})-(\d{1,2})-(\d{1,2})/
  ];
  
  const monthNames = {
    'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
    'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
  };
  
  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      if (format === formats[0]) { // French format
        const day = parseInt(match[1]);
        const month = monthNames[match[2].toLowerCase() as keyof typeof monthNames];
        const year = parseInt(match[3]);
        return new Date(year, month - 1, day);
      } else if (format === formats[1]) { // DD/MM/YYYY
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        return new Date(year, month - 1, day);
      } else if (format === formats[2]) { // YYYY-MM-DD
        const year = parseInt(match[1]);
        const month = parseInt(match[2]);
        const day = parseInt(match[3]);
        return new Date(year, month - 1, day);
      }
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split('\n');

    if (lines.length === 0) {
      return NextResponse.json(
        { success: false, error: "Empty file" },
        { status: 400 }
      );
    }

    // Parse CSV with proper quote handling
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const rows: CSVRow[] = [];

    let currentRow: string[] = [];
    let inMultilineField = false;
    let currentFieldIndex = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      if (!inMultilineField) {
        // Start of new row
        currentRow = parseCSVLine(line);
        
        // Check if any field is incomplete (has opening quote but no closing quote)
        let hasOpenQuote = false;
        for (let j = 0; j < currentRow.length; j++) {
          const field = currentRow[j];
          if (field.startsWith('"') && !field.endsWith('"')) {
            hasOpenQuote = true;
            currentFieldIndex = j;
            inMultilineField = true;
            break;
          }
        }
        
        if (!hasOpenQuote && currentRow.length >= headers.length) {
          // Complete row
          const row: any = {};
          headers.forEach((header, index) => {
            if (index < currentRow.length) {
              row[header] = currentRow[index].replace(/^"(.*)"$/, '$1');
            }
          });
          rows.push(row);
        }
      } else {
        // Continue multiline field
        currentRow[currentFieldIndex] += '\n' + line;
        if (line.includes('"')) {
          inMultilineField = false;
          // Process the completed row
          const row: any = {};
          headers.forEach((header, index) => {
            if (index < currentRow.length) {
              row[header] = currentRow[index].replace(/^"(.*)"$/, '$1');
            }
          });
          rows.push(row);
        }
      }
    }

    // Map French headers to English
    const headerMap: Record<string, string> = {
      'date de l\'humeur': 'date',
      'score de l\'humeur': 'mood',
      'heures de sommeil': 'sleepHours',
      'médicaments': 'medication',
      'émotions': 'emotions',
      'commentaire': 'note'
    };

    // Normalize headers
    const normalizedHeaders = headers.map(h => headerMap[h] || h);
    
    // Validate required fields
    const requiredFields = ['date', 'mood'];
    const missingFields = requiredFields.filter(field => !normalizedHeaders.includes(field));
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Get or create user
    const userEmail = "user@example.com";
    let user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        email: userEmail,
        name: "Default User",
      }).returning();
      user = newUser;
    }

    // Process and insert mood entries
    const importedEntries = [];
    const errors = [];

    for (const [index, row] of rows.entries()) {
      try {
        // Create normalized row with mapped headers
        const normalizedRow: any = {};
        headers.forEach((header, index) => {
          const normalizedHeader = headerMap[header] || header;
          normalizedRow[normalizedHeader] = row[header];
        });

        // Parse date using French date parser
        const date = parseFrenchDate(normalizedRow.date);
        if (!date) {
          errors.push(`Row ${index + 2}: Invalid date format: ${normalizedRow.date}`);
          continue;
        }

        // Parse mood
        const mood = parseInt(normalizedRow.mood);
        if (isNaN(mood) || mood < 0 || mood > 10) {
          errors.push(`Row ${index + 2}: Invalid mood value (must be 0-10): ${normalizedRow.mood}`);
          continue;
        }

        // Parse optional fields
        const tags = normalizedRow.tags ? normalizedRow.tags.split(';').map((t: string) => t.trim()).filter((t: string) => t) : [];
        const sleepHours = normalizedRow.sleepHours ? parseFloat(normalizedRow.sleepHours) : null;
        const medication = normalizedRow.medication ? parseFloat(normalizedRow.medication) : null;

        // Insert mood entry
        const newEntry = await db.insert(moodEntries).values({
          userId: user[0].id,
          mood,
          note: normalizedRow.note || null,
          tags,
          sleepHours,
          medication,
          emotions: normalizedRow.emotions || null,
          timestamp: date,
        }).returning();

        importedEntries.push(newEntry[0]);
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedEntries.length,
      errors: errors.length,
      errorDetails: errors,
    });

  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process CSV file" },
      { status: 500 }
    );
  }
}