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

const WORKOUTS_KEY = ['workouts'];
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
        }

        // Update lastSyncTimestamp on the profile
        const newTimestamp = Math.floor(Date.now() / 1000);
        await db.profiles.update(profile.id, {
          lastSyncTimestamp: newTimestamp,
        });
      });

      return { syncType, imported, updated, deleted, skipped };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKOUTS_KEY });
      void queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
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
