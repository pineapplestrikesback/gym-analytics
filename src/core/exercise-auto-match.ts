/**
 * Auto-match algorithm for suggesting canonical exercises for unmapped exercises.
 * Strips gym-specific markers, expands abbreviations, and calculates match confidence.
 */

import { getAllCanonicalExercises } from './exercise-search';
import { cleanExerciseName } from './utils/normalization';
import type { UnmappedExercise } from '@db/schema';

/**
 * Suggestion for auto-matching an unmapped exercise to a canonical exercise.
 */
export interface AutoMatchSuggestion {
  unmappedExerciseName: string;
  unmappedNormalizedName: string;
  suggestedCanonicalId: string;
  suggestedCanonicalName: string;
  confidence: number; // 0-1, higher = more confident
  matchReason: string; // e.g. "Core words match: lateral, raise"
}

/**
 * Gym-specific markers to strip from exercise names.
 */
const GYM_MARKERS = [
  'domar',
  'brama',
  'italy',
  'gym',
  'fitness',
  'squeeze',
];

/**
 * Common abbreviations to expand.
 */
const ABBREVIATIONS: Record<string, string> = {
  ext: 'extension',
  db: 'dumbbell',
  bb: 'barbell',
  ez: 'ez bar',
  ohp: 'overhead press',
  rdl: 'romanian deadlift',
  cgbp: 'close grip bench press',
};

/**
 * Position prefixes that can be optional.
 */
const POSITION_PREFIXES = [
  'seated',
  'standing',
  'incline',
  'decline',
  'flat',
  'lying',
  'prone',
  'supine',
  'kneeling',
];

/**
 * Unilateral markers that can be stripped.
 */
const UNILATERAL_MARKERS = [
  'single arm',
  'one arm',
  'single hand',
  'one hand',
  'unilateral',
  'single leg',
  'one leg',
];

/**
 * Equipment variations that can be optional.
 */
const EQUIPMENT_VARIATIONS = [
  'machine',
  'cable',
  'dumbbell',
  'barbell',
  'kettlebell',
  'band',
  'bodyweight',
];

/**
 * Common stopwords that should not be used for matching.
 */
const STOPWORDS = [
  'no',
  'the',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'at',
  'for',
  'with',
  'from',
];

/**
 * Minimum confidence threshold for returning suggestions.
 */
const MIN_CONFIDENCE = 0.6;

/**
 * Normalizes an exercise name for matching by:
 * - Converting to lowercase
 * - Stripping gym-specific markers
 * - Expanding abbreviations
 * - Removing parenthetical content
 */
function normalizeForMatching(name: string): string {
  let normalized = name.toLowerCase().trim();

  // Remove parenthetical content
  normalized = cleanExerciseName(normalized);

  // Expand abbreviations
  const words = normalized.split(/\s+/);
  const expandedWords = words.map(word => ABBREVIATIONS[word] || word);
  normalized = expandedWords.join(' ');

  // Strip gym-specific markers
  GYM_MARKERS.forEach(marker => {
    const regex = new RegExp(`\\b${marker}\\b`, 'gi');
    normalized = normalized.replace(regex, '');
  });

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Extracts core words from an exercise name by removing:
 * - Position prefixes (seated, standing, etc.)
 * - Unilateral markers (single arm, one hand, etc.)
 * - Common filler words
 */
function extractCoreWords(normalizedName: string): string[] {
  let name = normalizedName;

  // Remove unilateral markers
  UNILATERAL_MARKERS.forEach(marker => {
    const regex = new RegExp(`\\b${marker}\\b`, 'gi');
    name = name.replace(regex, '');
  });

  // Remove position prefixes
  POSITION_PREFIXES.forEach(prefix => {
    const regex = new RegExp(`\\b${prefix}\\b`, 'gi');
    name = name.replace(regex, '');
  });

  // Remove equipment variations (they'll be matched separately)
  EQUIPMENT_VARIATIONS.forEach(equipment => {
    const regex = new RegExp(`\\b${equipment}\\b`, 'gi');
    name = name.replace(regex, '');
  });

  // Split into words and filter out empty strings, very short words, and stopwords
  const words = name
    .split(/\s+/)
    .filter(word => word.length >= 3)
    .filter(word => !STOPWORDS.includes(word.toLowerCase()))
    .map(word => word.trim());

  return words;
}

/**
 * Calculates confidence score for a match between normalized names.
 *
 * Scoring:
 * - Exact match after normalization = 1.0
 * - All core words match = 0.8-0.9
 * - Most core words match = 0.6-0.8
 * - Few core words match = below threshold
 */
function calculateMatchConfidence(
  unmappedNormalized: string,
  canonicalNormalized: string
): number {
  // Exact match after normalization
  if (unmappedNormalized === canonicalNormalized) {
    return 1.0;
  }

  // Extract core words from both
  const unmappedCoreWords = extractCoreWords(unmappedNormalized);
  const canonicalCoreWords = extractCoreWords(canonicalNormalized);

  if (unmappedCoreWords.length === 0 || canonicalCoreWords.length === 0) {
    return 0;
  }

  // Count matching core words
  let matchedWords = 0;
  const matchedWordsList: string[] = [];

  unmappedCoreWords.forEach(unmappedWord => {
    const foundMatch = canonicalCoreWords.some(canonicalWord => {
      // Check for substring matches in either direction
      return canonicalWord.includes(unmappedWord) || unmappedWord.includes(canonicalWord);
    });

    if (foundMatch) {
      matchedWords++;
      matchedWordsList.push(unmappedWord);
    }
  });

  if (matchedWords === 0) {
    return 0;
  }

  // Calculate match ratio based on the shorter list
  const minWords = Math.min(unmappedCoreWords.length, canonicalCoreWords.length);
  const matchRatio = matchedWords / minWords;

  // All core words match
  if (matchedWords === unmappedCoreWords.length && matchedWords === canonicalCoreWords.length) {
    return 0.9;
  }

  // Most core words match
  if (matchRatio >= 0.8) {
    return 0.7 + 0.2 * matchRatio;
  }

  // Some core words match
  if (matchRatio >= 0.5) {
    return 0.5 + 0.2 * matchRatio;
  }

  // Few core words match
  return 0.3 * matchRatio;
}

/**
 * Generates auto-match suggestions for a list of unmapped exercises.
 *
 * @param unmappedExercises - List of exercises that need mapping
 * @returns List of suggestions with confidence scores, filtered by minimum confidence threshold
 */
export function generateAutoMatchSuggestions(
  unmappedExercises: UnmappedExercise[]
): AutoMatchSuggestion[] {
  const canonicalExercises = getAllCanonicalExercises();
  const suggestions: AutoMatchSuggestion[] = [];

  for (const unmappedExercise of unmappedExercises) {
    const unmappedNormalized = normalizeForMatching(unmappedExercise.originalName);

    let bestMatch: {
      canonicalId: string;
      canonicalName: string;
      confidence: number;
      matchedWords: string[];
    } | null = null;

    // Find the best matching canonical exercise
    for (const canonical of canonicalExercises) {
      const canonicalNormalized = normalizeForMatching(canonical.name);
      const confidence = calculateMatchConfidence(unmappedNormalized, canonicalNormalized);

      if (confidence > (bestMatch?.confidence || 0)) {
        const unmappedCoreWords = extractCoreWords(unmappedNormalized);
        const canonicalCoreWords = extractCoreWords(canonicalNormalized);

        const matchedWords = unmappedCoreWords.filter(unmappedWord =>
          canonicalCoreWords.some(canonicalWord =>
            canonicalWord.includes(unmappedWord) || unmappedWord.includes(canonicalWord)
          )
        );

        bestMatch = {
          canonicalId: canonical.id,
          canonicalName: canonical.name,
          confidence,
          matchedWords,
        };
      }
    }

    // Only include suggestions above confidence threshold
    if (bestMatch && bestMatch.confidence >= MIN_CONFIDENCE) {
      suggestions.push({
        unmappedExerciseName: unmappedExercise.originalName,
        unmappedNormalizedName: unmappedExercise.normalizedName,
        suggestedCanonicalId: bestMatch.canonicalId,
        suggestedCanonicalName: bestMatch.canonicalName,
        confidence: bestMatch.confidence,
        matchReason: bestMatch.matchedWords.length > 0
          ? `Core words match: ${bestMatch.matchedWords.join(', ')}`
          : 'Names match after normalization',
      });
    }
  }

  return suggestions;
}
