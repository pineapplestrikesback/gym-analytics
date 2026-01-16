/**
 * Enhanced import hook that tracks unmapped exercises during workout import
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, type Workout } from '../schema';
import { useTrackUnmappedExercise } from './useUnmappedExercises';
import exerciseListJson from '../../../config/exercise_list_complete.json';

// Build set of canonical exercise IDs
function getCanonicalExerciseIds(): Set<string> {
  const ids = new Set<string>();

  for (const exerciseName of Object.keys(exerciseListJson)) {
    if (exerciseName === '_comment') continue;

    // Normalize the same way as the parser does
    const normalizedId = exerciseName.toLowerCase().replace(/\s+/g, '-');
    ids.add(normalizedId);
  }

  return ids;
}

const CANONICAL_IDS = getCanonicalExerciseIds();

/**
 * Enhanced import that tracks unmapped exercises
 */
export function useEnhancedImport(): {
  importWorkouts: (workouts: Workout[]) => Promise<{
    imported: number;
    skipped: number;
    unmappedCount: number;
  }>;
  isImporting: boolean;
} {
  const queryClient = useQueryClient();
  const { trackUnmapped } = useTrackUnmappedExercise();

  const mutation = useMutation({
    mutationFn: async (workouts: Workout[]) => {
      let imported = 0;
      let skipped = 0;
      const unmappedExercises = new Map<string, { original: string; count: number }>();

      await db.transaction('rw', db.workouts, db.unmappedExercises, async () => {
        for (const workout of workouts) {
          // Check if workout already exists
          const existing = await db.workouts.get(workout.id);
          if (existing) {
            skipped++;
            continue;
          }

          // Import the workout
          await db.workouts.add(workout);
          imported++;

          // Check each exercise in the workout for unmapped ones
          for (const set of workout.sets) {
            const exerciseId = set.exerciseId;

            // If not in canonical list, track as unmapped
            if (!CANONICAL_IDS.has(exerciseId)) {
              const key = `${workout.profileId}:${exerciseId}`;

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

        // Track all unmapped exercises
        for (const [key, data] of unmappedExercises) {
          const [profileId, normalizedName] = key.split(':');

          // Track unmapped exercise (will create or increment count)
          if (profileId && normalizedName) {
            await trackUnmapped(profileId, data.original, normalizedName);
          }
        }
      });

      // Invalidate all relevant queries
      void queryClient.invalidateQueries({ queryKey: ['workouts'] });
      void queryClient.invalidateQueries({ queryKey: ['unmappedExercises'] });

      return {
        imported,
        skipped,
        unmappedCount: unmappedExercises.size,
      };
    },
  });

  return {
    importWorkouts: mutation.mutateAsync,
    isImporting: mutation.isPending,
  };
}
