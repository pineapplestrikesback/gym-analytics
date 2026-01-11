/**
 * Strips parenthetical content from exercise names.
 * "Bench Press (Dumbbell)" -> "Bench Press"
 * "Bicep Curl (Dumbbell) (Single Arm)" -> "Bicep Curl"
 */
export function cleanExerciseName(name: string | undefined | null): string {
  if (!name) {
    return '';
  }
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Converts an exercise name to a normalized ID.
 * "Bench Press (Dumbbell)" -> "bench-press"
 */
export function normalizeId(name: string): string {
  const cleaned = cleanExerciseName(name);
  if (cleaned === '') return '';
  return cleaned.toLowerCase().replace(/\s+/g, '-');
}
