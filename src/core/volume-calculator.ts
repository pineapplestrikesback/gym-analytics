import type { ScientificMuscle, FunctionalGroup, ExerciseMapping } from './taxonomy';

/**
 * Represents a single set from a workout.
 */
export interface WorkoutSet {
  exerciseId: string;
  setType: 'normal' | 'warmup' | 'failure' | 'drop';
  weight: number;
  reps: number;
  rpe?: number;
}

/**
 * Calculates the fractional muscle volume from a collection of workout sets.
 * Warmup sets are excluded from the calculation.
 * Unmapped exercises contribute 0 volume.
 *
 * @param sets - Array of workout sets
 * @param exerciseMappings - Map of exercise ID to muscle contribution mappings
 * @returns Record of ScientificMuscle to total volume
 */
export function calculateMuscleVolume(
  sets: WorkoutSet[],
  exerciseMappings: Map<string, ExerciseMapping>
): Partial<Record<ScientificMuscle, number>> {
  const volume: Partial<Record<ScientificMuscle, number>> = {};

  for (const set of sets) {
    // Skip warmup sets
    if (set.setType === 'warmup') {
      continue;
    }

    const mapping = exerciseMappings.get(set.exerciseId);
    if (!mapping) {
      // Unmapped exercise - contributes 0 volume
      continue;
    }

    // Add fractional contribution for each muscle
    for (const [muscle, contribution] of Object.entries(mapping)) {
      const muscleKey = muscle as ScientificMuscle;
      volume[muscleKey] = (volume[muscleKey] ?? 0) + contribution;
    }
  }

  return volume;
}

/**
 * Aggregates scientific muscle volumes into functional groups.
 *
 * @param scientificVolume - Record of ScientificMuscle to volume
 * @param muscleMapping - Mapping from ScientificMuscle to FunctionalGroup
 * @returns Record of FunctionalGroup to aggregated volume
 */
export function aggregateToFunctionalGroups(
  scientificVolume: Partial<Record<ScientificMuscle, number>>,
  muscleMapping: Record<ScientificMuscle, FunctionalGroup>
): Partial<Record<FunctionalGroup, number>> {
  const grouped: Partial<Record<FunctionalGroup, number>> = {};

  for (const [muscle, volume] of Object.entries(scientificVolume)) {
    const muscleKey = muscle as ScientificMuscle;
    const group = muscleMapping[muscleKey];

    if (group) {
      grouped[group] = (grouped[group] ?? 0) + volume;
    }
  }

  return grouped;
}
