/**
 * CSV Parser for workout data
 * Supports Hevy export format (Strong support can be added later)
 */

import { cleanExerciseName, normalizeId } from '../utils/normalization';

/**
 * Detected CSV format
 */
export type CsvFormat = 'hevy' | 'strong' | 'unknown';

/**
 * Raw parsed row from CSV
 */
interface RawCsvRow {
  [key: string]: string;
}

/**
 * Parsed workout set from CSV
 */
export interface ParsedSet {
  exerciseId: string;
  originalName: string;
  setType: 'normal' | 'warmup' | 'failure' | 'drop';
  weight: number;
  reps: number;
  rpe?: number;
}

/**
 * Parsed workout from CSV
 */
export interface ParsedWorkout {
  id: string;
  date: Date;
  title: string;
  sets: ParsedSet[];
}

/**
 * Result of CSV parsing
 */
export interface ParseCsvResult {
  workouts: ParsedWorkout[];
  format: CsvFormat;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse CSV string into rows
 */
function parseCsvString(csv: string): RawCsvRow[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  if (!firstLine) return [];

  // Parse header
  const headers = parseCsvLine(firstLine);

  // Parse data rows
  const rows: RawCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const values = parseCsvLine(line);
    const row: RawCsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Detect CSV format from headers
 */
export function detectCsvFormat(csv: string): CsvFormat {
  const firstLine = csv.split('\n')[0]?.toLowerCase() ?? '';

  if (firstLine.includes('exercise_title') && firstLine.includes('start_time')) {
    return 'hevy';
  }

  if (firstLine.includes('exercise name') && firstLine.includes('workout name')) {
    return 'strong';
  }

  return 'unknown';
}

/**
 * Parse Hevy date format: "21 Dec 2025, 14:29"
 */
function parseHevyDate(dateStr: string): Date {
  const [datePart, timePart] = dateStr.split(', ');
  if (!datePart || !timePart) return new Date(0);

  const parts = datePart.split(' ');
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];

  if (!day || !month || !year) return new Date(0);

  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const timeParts = timePart.split(':');
  const hours = parseInt(timeParts[0] ?? '0', 10);
  const minutes = parseInt(timeParts[1] ?? '0', 10);

  return new Date(parseInt(year, 10), months[month] ?? 0, parseInt(day, 10), hours, minutes);
}

/**
 * Generate a unique workout ID from date
 */
function generateWorkoutId(date: Date): string {
  return `workout_${date.getTime().toString()}`;
}

/**
 * Map Hevy set_type to our set type
 */
function mapSetType(hevySetType: string): ParsedSet['setType'] {
  switch (hevySetType.toLowerCase()) {
    case 'warmup':
      return 'warmup';
    case 'failure':
      return 'failure';
    case 'dropset':
    case 'drop':
      return 'drop';
    default:
      return 'normal';
  }
}

/**
 * Parse Hevy CSV format
 */
function parseHevyCsv(rows: RawCsvRow[]): ParsedWorkout[] {
  // Group rows by start_time (each unique start_time is a workout)
  const workoutGroups = new Map<string, RawCsvRow[]>();

  for (const row of rows) {
    const key = row['start_time'] ?? '';
    if (!key) continue;

    if (!workoutGroups.has(key)) {
      workoutGroups.set(key, []);
    }
    workoutGroups.get(key)?.push(row);
  }

  // Convert groups to Workout objects
  const workouts: ParsedWorkout[] = [];

  for (const [startTime, group] of workoutGroups) {
    const date = parseHevyDate(startTime);
    const sets: ParsedSet[] = [];
    let title = '';

    for (const row of group) {
      const exerciseTitle = row['exercise_title'] ?? '';
      if (!exerciseTitle) continue;

      if (!title) {
        title = row['title'] ?? '';
      }

      const cleanedName = cleanExerciseName(exerciseTitle);
      const exerciseId = normalizeId(cleanedName);

      sets.push({
        exerciseId,
        originalName: exerciseTitle,
        setType: mapSetType(row['set_type'] ?? 'normal'),
        weight: parseFloat(row['weight_kg'] ?? '0') || 0,
        reps: parseInt(row['reps'] ?? '0', 10) || 0,
        rpe: row['rpe'] ? parseFloat(row['rpe']) : undefined,
      });
    }

    if (sets.length > 0) {
      workouts.push({
        id: generateWorkoutId(date),
        date,
        title,
        sets,
      });
    }
  }

  return workouts;
}

/**
 * Parse CSV string into Workout array
 * Automatically detects format (Hevy vs Strong)
 */
export function parseCsv(csv: string): ParseCsvResult {
  const format = detectCsvFormat(csv);
  const rows = parseCsvString(csv);

  let workouts: ParsedWorkout[];

  switch (format) {
    case 'hevy':
      workouts = parseHevyCsv(rows);
      break;
    case 'strong':
      // Strong format support can be added later
      workouts = [];
      break;
    default:
      workouts = [];
  }

  // Sort by date descending (newest first)
  workouts.sort((a, b) => b.date.getTime() - a.date.getTime());

  return { workouts, format };
}

/**
 * Extract unique exercise IDs from workouts
 */
export function extractExerciseIds(workouts: ParsedWorkout[]): Set<string> {
  const ids = new Set<string>();

  for (const workout of workouts) {
    for (const set of workout.sets) {
      ids.add(set.exerciseId);
    }
  }

  return ids;
}
