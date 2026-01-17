/**
 * Utilities for resolving default mappings with user overrides applied
 */

import type { ScientificMuscle, FunctionalGroup } from '@core/taxonomy';
import { DEFAULT_SCIENTIFIC_TO_FUNCTIONAL } from '@core/taxonomy';
import exerciseListJson from '../../../config/exercise_list_complete.json';
import exerciseNameMappingsJson from '../../../config/exercise_name_mappings.json';
import type { DefaultExerciseOverride, DefaultNameMappingOverride, Profile } from '../schema';

/**
 * Type for exercise muscle mappings (0.0 to 1.0 contribution per muscle)
 */
export type ExerciseMuscleMapping = Partial<Record<ScientificMuscle, number>>;

/**
 * Get default exercise muscle values from config
 */
export function getDefaultExerciseMuscleValues(
  exerciseName: string
): ExerciseMuscleMapping | null {
  const exerciseData = exerciseListJson as Record<string, unknown>;
  const values = exerciseData[exerciseName];

  if (!values || typeof values !== 'object' || values === null) {
    return null;
  }

  return values as ExerciseMuscleMapping;
}

/**
 * Get effective exercise muscle values (with override applied)
 */
export function getEffectiveExerciseMuscleValues(
  exerciseName: string,
  override: DefaultExerciseOverride | null
): ExerciseMuscleMapping | null {
  if (override) {
    return override.customMuscleValues;
  }

  return getDefaultExerciseMuscleValues(exerciseName);
}

/**
 * Get default canonical name for a gym name
 */
export function getDefaultCanonicalName(gymName: string): string | null {
  const mappings = exerciseNameMappingsJson as { name_mappings?: Record<string, string> };
  return mappings.name_mappings?.[gymName] ?? null;
}

/**
 * Get effective canonical name (with override applied)
 */
export function getEffectiveCanonicalName(
  gymName: string,
  override: DefaultNameMappingOverride | null
): string | null {
  if (override) {
    return override.canonicalName;
  }

  return getDefaultCanonicalName(gymName);
}

/**
 * Get default functional group for a scientific muscle
 */
export function getDefaultFunctionalGroup(muscle: ScientificMuscle): FunctionalGroup {
  return DEFAULT_SCIENTIFIC_TO_FUNCTIONAL[muscle];
}

/**
 * Get effective functional group (with profile override applied)
 */
export function getEffectiveFunctionalGroup(
  muscle: ScientificMuscle,
  profile: Profile
): FunctionalGroup {
  return profile.muscleGroupCustomization[muscle] ?? DEFAULT_SCIENTIFIC_TO_FUNCTIONAL[muscle];
}

/**
 * Get all default exercise names
 */
export function getAllDefaultExerciseNames(): string[] {
  const exerciseData = exerciseListJson as Record<string, unknown>;
  return Object.keys(exerciseData).filter((key) => key !== '_comment' && key !== '_muscles_taxonomy');
}

/**
 * Get all default gym name mappings
 */
export function getAllDefaultGymNameMappings(): Map<string, string> {
  const mappings = exerciseNameMappingsJson as { name_mappings?: Record<string, string> };
  const nameMappings = mappings.name_mappings ?? {};
  return new Map(Object.entries(nameMappings));
}

/**
 * Check if an exercise exists in defaults
 */
export function isDefaultExercise(exerciseName: string): boolean {
  const exerciseData = exerciseListJson as Record<string, unknown>;
  return exerciseName in exerciseData && exerciseName !== '_comment' && exerciseName !== '_muscles_taxonomy';
}

/**
 * Check if a gym name has a default mapping
 */
export function hasDefaultGymNameMapping(gymName: string): boolean {
  return getDefaultCanonicalName(gymName) !== null;
}

/**
 * Batch resolve exercise muscle values with overrides
 */
export function batchResolveExerciseMuscleValues(
  exerciseNames: string[],
  overrides: DefaultExerciseOverride[]
): Map<string, ExerciseMuscleMapping> {
  const overrideMap = new Map(
    overrides.map((o) => [o.exerciseName, o.customMuscleValues])
  );

  const result = new Map<string, ExerciseMuscleMapping>();

  for (const name of exerciseNames) {
    const override = overrideMap.get(name);
    const values = getEffectiveExerciseMuscleValues(name, override ? { id: '', profileId: '', exerciseName: name, customMuscleValues: override, createdAt: new Date(), updatedAt: new Date() } : null);
    if (values) {
      result.set(name, values);
    }
  }

  return result;
}

/**
 * Batch resolve gym name mappings with overrides
 */
export function batchResolveGymNameMappings(
  gymNames: string[],
  overrides: DefaultNameMappingOverride[]
): Map<string, string> {
  const overrideMap = new Map(overrides.map((o) => [o.gymName, o.canonicalName]));

  const result = new Map<string, string>();

  for (const gymName of gymNames) {
    const override = overrideMap.get(gymName);
    const canonical = getEffectiveCanonicalName(gymName, override ? { id: '', profileId: '', gymName, canonicalName: override, createdAt: new Date(), updatedAt: new Date() } : null);
    if (canonical) {
      result.set(gymName, canonical);
    }
  }

  return result;
}
