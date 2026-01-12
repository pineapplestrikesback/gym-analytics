import exerciseListJson from '../../config/exercise_list.json';
import { normalizeId } from './utils/normalization';

/**
 * Result structure for exercise search operations.
 */
export interface ExerciseSearchResult {
  id: string; // Normalized ID (kebab-case)
  name: string; // Original display name
  score: number; // Match score (0-1, higher is better)
}

/**
 * Common abbreviations mapping for fuzzy search.
 */
const ABBREVIATIONS: Record<string, string> = {
  db: 'dumbbell',
  bb: 'barbell',
};

/**
 * Cached list of all canonical exercises loaded once at module initialization.
 */
let cachedExercises: ExerciseSearchResult[] | null = null;

/**
 * Loads and caches all canonical exercises from the exercise list.
 */
function loadCanonicalExercises(): ExerciseSearchResult[] {
  if (cachedExercises) {
    return cachedExercises;
  }

  cachedExercises = Object.keys(exerciseListJson)
    .filter((name) => name !== '_comment')
    .map((name) => ({
      id: normalizeId(name),
      name,
      score: 1.0,
    }));

  return cachedExercises;
}

/**
 * Returns all canonical exercises for browsing.
 */
export function getAllCanonicalExercises(): ExerciseSearchResult[] {
  return loadCanonicalExercises();
}

/**
 * Expands abbreviations in the query string.
 */
function expandAbbreviations(query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  const expanded = words.map((word) => ABBREVIATIONS[word] || word);
  return expanded.join(' ');
}

/**
 * Calculates match score for an exercise name against a query.
 *
 * Scoring:
 * - Exact match = 1.0
 * - Starts with query = 0.9
 * - Contains all words = 0.7-0.8 (based on word match ratio)
 * - Contains some words = 0.3-0.6 (based on word match ratio)
 * - No match = 0 (filtered out)
 */
function calculateScore(exerciseName: string, query: string): number {
  const normalizedExercise = exerciseName.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return 0;
  }

  // Exact match
  if (normalizedExercise === normalizedQuery) {
    return 1.0;
  }

  // Starts with query
  if (normalizedExercise.startsWith(normalizedQuery)) {
    return 0.9;
  }

  // Multi-word matching
  const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);
  const exerciseWords = normalizedExercise.split(/\s+/);

  if (queryWords.length === 0) {
    return 0;
  }

  // Count how many query words are found in the exercise name
  const matchedWords = queryWords.filter((qWord) =>
    exerciseWords.some((eWord) => eWord.includes(qWord) || qWord.includes(eWord))
  ).length;

  if (matchedWords === 0) {
    return 0;
  }

  const matchRatio = matchedWords / queryWords.length;

  // All words match
  if (matchedWords === queryWords.length) {
    // Scale between 0.7 and 0.8 based on how well they match
    // More words matched = higher score
    return 0.7 + 0.1 * matchRatio;
  }

  // Some words match
  // Scale between 0.3 and 0.6 based on match ratio
  return 0.3 + 0.3 * matchRatio;
}

/**
 * Searches for canonical exercises matching the query.
 *
 * @param query - Search query string (case-insensitive, supports partial matches)
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of matching exercises sorted by score (best match first)
 */
export function searchExercises(query: string, limit: number = 10): ExerciseSearchResult[] {
  const expandedQuery = expandAbbreviations(query);
  const exercises = loadCanonicalExercises();

  const results = exercises
    .map((exercise) => ({
      ...exercise,
      score: calculateScore(exercise.name, expandedQuery),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      // Sort by score descending
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort alphabetically
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);

  return results;
}
