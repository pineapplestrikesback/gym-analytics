/**
 * TanStack Query hook for Hevy API synchronization
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, type Workout, type Profile } from '../schema';
import {
  fetchHevyWorkouts,
  validateHevyApiKey,
  type HevyWorkoutResult,
} from '@core/parsers/hevy-api';
import { useTrackUnmappedExercise } from './useUnmappedExercises';
import exerciseListJson from '../../../config/exercise_list.json';

// Build set of canonical exercise IDs for unmapped detection
function getCanonicalExerciseIds(): Set<string> {
  const ids = new Set<string>();
  for (const exerciseName of Object.keys(exerciseListJson)) {
    if (exerciseName === '_comment') continue;
    const normalizedId = exerciseName.toLowerCase().replace(/\s+/g, '-');
    ids.add(normalizedId);
  }
  return ids;
}

const CANONICAL_IDS = getCanonicalExerciseIds();

const WORKOUTS_KEY = ['workouts'];
const UNMAPPED_EXERCISES_KEY = ['unmappedExercises'];
const PROFILES_KEY = ['profiles'];

/**
 * Result of a Hevy sync operation
 */
export interface HevySyncResult {
  syncType: 'full' | 'incremental';
  imported: number;
  updated: number;
  deleted: number;
  skipped: number;
}

/**
 * Convert Hevy API workout result to DB Workout format
 */
function convertToDbWorkout(hevyWorkout: HevyWorkoutResult, profileId: string): Workout {
  return {
    id: hevyWorkout.id,
    profileId,
    date: hevyWorkout.date,
    title: hevyWorkout.title,
    sets: hevyWorkout.sets,
  };
}

/**
 * Hook for validating a Hevy API key
 */
export function useValidateHevyApiKey(): {
  validateKey: (apiKey: string) => Promise<boolean>;
  isValidating: boolean;
} {
  const mutation = useMutation({
    mutationFn: validateHevyApiKey,
  });

  return {
    validateKey: mutation.mutateAsync,
    isValidating: mutation.isPending,
  };
}

/**
 * Hook for syncing workouts from Hevy API
 * Handles both full sync (no lastSyncTimestamp) and incremental sync
 */
export function useHevySync(): {
  syncWorkouts: (profile: Profile) => Promise<HevySyncResult>;
  isSyncing: boolean;
  error: Error | null;
} {
  const queryClient = useQueryClient();
  const { trackUnmapped } = useTrackUnmappedExercise();

  const mutation = useMutation({
    mutationFn: async (profile: Profile): Promise<HevySyncResult> => {
      if (!profile.hevyApiKey) {
        throw new Error('No API key configured for this profile');
      }

      // Fetch workouts from Hevy
      const { workouts, deletedIds, syncType } = await fetchHevyWorkouts(
        profile.hevyApiKey,
        profile.lastSyncTimestamp
      );

      let imported = 0;
      let updated = 0;
      let deleted = 0;
      let skipped = 0;

      // Track unmapped exercises: collect unique exercises not in canonical list
      const unmappedExercises = new Map<string, { original: string; count: number }>();

      // Process workouts in transaction (DB operations only)
      await db.transaction('rw', [db.workouts, db.profiles], async () => {
        // Process deletions (for incremental sync)
        for (const deletedId of deletedIds) {
          const existing = await db.workouts.get(deletedId);
          if (existing && existing.profileId === profile.id) {
            await db.workouts.delete(deletedId);
            deleted++;
          }
        }

        // Process workouts (add or update)
        for (const hevyWorkout of workouts) {
          const dbWorkout = convertToDbWorkout(hevyWorkout, profile.id);
          const existing = await db.workouts.get(dbWorkout.id);

          if (existing) {
            if (existing.profileId === profile.id) {
              // Update existing workout
              await db.workouts.put(dbWorkout);
              updated++;
            } else {
              // Workout belongs to different profile, skip
              skipped++;
            }
          } else {
            // New workout
            await db.workouts.add(dbWorkout);
            imported++;
          }

          // Check each exercise in the workout for unmapped ones
          for (const set of dbWorkout.sets) {
            const exerciseId = set.exerciseId;

            // If not in canonical list, track as unmapped
            if (!CANONICAL_IDS.has(exerciseId)) {
              const key = `${profile.id}:${exerciseId}`;

              if (!unmappedExercises.has(key)) {
                unmappedExercises.set(key, {
                  original: set.originalName,
                  count: 0,
                });
              }

              const entry = unmappedExercises.get(key);
              if (entry) {
                entry.count++;
              }
            }
          }
        }

        // Update lastSyncTimestamp on the profile
        const newTimestamp = Math.floor(Date.now() / 1000);
        await db.profiles.update(profile.id, {
          lastSyncTimestamp: newTimestamp,
        });
      });

      // Track all unmapped exercises AFTER transaction completes
      // This must be outside the transaction because trackUnmapped does its own DB operations
      for (const [key, data] of unmappedExercises) {
        const [profileId, normalizedName] = key.split(':');

        // Track unmapped exercise (will create or increment count)
        if (profileId && normalizedName) {
          await trackUnmapped(profileId, data.original, normalizedName);
        }
      }

      return { syncType, imported, updated, deleted, skipped };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKOUTS_KEY });
      void queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
      void queryClient.invalidateQueries({ queryKey: UNMAPPED_EXERCISES_KEY });
    },
  });

  return {
    syncWorkouts: mutation.mutateAsync,
    isSyncing: mutation.isPending,
    error: mutation.error as Error | null,
  };
}

/**
 * Hook for deleting workouts by IDs (used for manual cleanup)
 */
export function useDeleteWorkouts(): {
  deleteWorkouts: (workoutIds: string[]) => Promise<number>;
  isDeleting: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (workoutIds: string[]) => {
      let deleted = 0;
      await db.transaction('rw', db.workouts, async () => {
        for (const id of workoutIds) {
          await db.workouts.delete(id);
          deleted++;
        }
      });
      return deleted;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKOUTS_KEY });
    },
  });

  return {
    deleteWorkouts: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
