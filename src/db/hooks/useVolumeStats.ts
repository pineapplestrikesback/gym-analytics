/**
 * TanStack Query hooks for Volume Statistics
 */

import { useMemo } from 'react';
import { useWorkouts } from './useWorkouts';
import { useProfile } from './useProfiles';
import { calculateMuscleVolume, aggregateToFunctionalGroups } from '@core/volume-calculator';
import {
  DEFAULT_SCIENTIFIC_TO_FUNCTIONAL,
  SCIENTIFIC_MUSCLES,
  FUNCTIONAL_GROUPS,
  type ScientificMuscle,
  type FunctionalGroup,
  type ExerciseMapping,
} from '@core/taxonomy';
import { DEFAULT_MUSCLE_GOAL, DEFAULT_TOTAL_GOAL, type WorkoutSet } from '../schema';

// Load exercise mappings from config
import exerciseListJson from '../../../config/exercise_list.json';

/**
 * Volume stats for a single muscle/group
 */
export interface VolumeStatItem {
  name: string;
  volume: number;
  goal: number;
  percentage: number;
}

/**
 * Build exercise mappings from the config JSON
 */
function buildExerciseMappings(): Map<string, ExerciseMapping> {
  const mappings = new Map<string, ExerciseMapping>();

  for (const [exerciseName, muscleData] of Object.entries(exerciseListJson)) {
    if (exerciseName === '_comment') continue;

    const normalizedId = exerciseName.toLowerCase().replace(/\s+/g, '-');
    mappings.set(normalizedId, muscleData as ExerciseMapping);
  }

  return mappings;
}

const EXERCISE_MAPPINGS = buildExerciseMappings();

/**
 * Convert DB WorkoutSets to format for volume calculator
 */
function convertSets(dbSets: WorkoutSet[]): WorkoutSet[] {
  return dbSets;
}

/**
 * Get volume statistics at the ScientificMuscle level
 */
export function useScientificMuscleVolume(
  profileId: string | null,
  daysBack: number = 7
): {
  stats: VolumeStatItem[];
  totalVolume: number;
  isLoading: boolean;
  error: Error | null;
} {
  const { workouts, isLoading, error } = useWorkouts(profileId, daysBack);
  const { profile } = useProfile(profileId);

  const { stats, totalVolume } = useMemo(() => {
    // Flatten all sets from all workouts
    const allSets = workouts.flatMap((w) => convertSets(w.sets));

    // Calculate total volume as the actual count of sets performed
    const actualSetCount = allSets.length;

    // Calculate volume per scientific muscle
    const volumeMap = calculateMuscleVolume(allSets, EXERCISE_MAPPINGS);

    // Build stats array
    const statsArray = SCIENTIFIC_MUSCLES.map((muscle) => {
      const volume = volumeMap[muscle] ?? 0;
      const goal = profile?.goals[muscle] ?? DEFAULT_MUSCLE_GOAL;
      return {
        name: muscle,
        volume,
        goal,
        percentage: goal > 0 ? (volume / goal) * 100 : 0,
      };
    });

    return { stats: statsArray, totalVolume: actualSetCount };
  }, [workouts, profile]);

  return { stats, totalVolume, isLoading, error };
}

/**
 * Get volume statistics at the FunctionalGroup level
 */
export function useFunctionalGroupVolume(
  profileId: string | null,
  daysBack: number = 7
): {
  stats: VolumeStatItem[];
  totalVolume: number;
  totalGoal: number;
  isLoading: boolean;
  error: Error | null;
} {
  const { workouts, isLoading, error } = useWorkouts(profileId, daysBack);
  const { profile } = useProfile(profileId);

  const { stats, totalVolume } = useMemo(() => {
    // Flatten all sets from all workouts
    const allSets = workouts.flatMap((w) => convertSets(w.sets));

    // Calculate total volume as the actual count of sets performed
    // Each set is counted exactly once, regardless of how many muscles it stimulates
    const actualSetCount = allSets.length;

    // Calculate volume per scientific muscle (for per-muscle stats display)
    const scientificVolume = calculateMuscleVolume(allSets, EXERCISE_MAPPINGS);

    // Get muscle group customization or use defaults
    const muscleMapping = {
      ...DEFAULT_SCIENTIFIC_TO_FUNCTIONAL,
      ...(profile?.muscleGroupCustomization ?? {}),
    } as Record<ScientificMuscle, FunctionalGroup>;

    // Aggregate to functional groups
    const groupVolume = aggregateToFunctionalGroups(scientificVolume, muscleMapping);

    // Calculate goals per functional group by summing scientific muscle goals
    const groupGoals: Partial<Record<FunctionalGroup, number>> = {};
    for (const muscle of SCIENTIFIC_MUSCLES) {
      const group = muscleMapping[muscle];
      const muscleGoal = profile?.goals[muscle] ?? DEFAULT_MUSCLE_GOAL;
      groupGoals[group] = (groupGoals[group] ?? 0) + muscleGoal;
    }

    // Build stats array
    const statsArray = FUNCTIONAL_GROUPS.map((group) => {
      const volume = groupVolume[group] ?? 0;
      const goal = groupGoals[group] ?? DEFAULT_MUSCLE_GOAL;
      return {
        name: group,
        volume,
        goal,
        percentage: goal > 0 ? (volume / goal) * 100 : 0,
      };
    });

    // Return actual set count as totalVolume (not sum of fractional muscle volumes)
    return { stats: statsArray, totalVolume: actualSetCount };
  }, [workouts, profile]);

  const totalGoal = profile?.totalGoal ?? DEFAULT_TOTAL_GOAL;

  return { stats, totalVolume, totalGoal, isLoading, error };
}

/**
 * Get the breakdown of scientific muscles within a functional group
 */
export function useFunctionalGroupBreakdown(
  profileId: string | null,
  functionalGroup: FunctionalGroup,
  daysBack: number = 7
): {
  breakdown: VolumeStatItem[];
  isLoading: boolean;
  error: Error | null;
} {
  const { stats, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);
  const { profile } = useProfile(profileId);

  const breakdown = useMemo(() => {
    const muscleMapping = {
      ...DEFAULT_SCIENTIFIC_TO_FUNCTIONAL,
      ...(profile?.muscleGroupCustomization ?? {}),
    } as Record<ScientificMuscle, FunctionalGroup>;

    return stats.filter((stat) => {
      const muscle = stat.name as ScientificMuscle;
      return muscleMapping[muscle] === functionalGroup;
    });
  }, [stats, functionalGroup, profile]);

  return { breakdown, isLoading, error };
}
