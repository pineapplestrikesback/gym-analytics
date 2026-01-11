/**
 * TanStack Query hooks for Workout operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, generateId, type Workout, type WorkoutSet } from '../schema';

const WORKOUTS_KEY = ['workouts'];

/**
 * Get the start of today in the user's local timezone
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Get workouts for a profile within a date range
 */
export function useWorkouts(
  profileId: string | null,
  daysBack: number = 7
): {
  workouts: Workout[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: [...WORKOUTS_KEY, profileId, daysBack],
    queryFn: async () => {
      if (!profileId) return [];

      const endDate = new Date();
      const startDate = new Date(getStartOfToday());
      startDate.setDate(startDate.getDate() - daysBack + 1);

      return db.workouts
        .where('profileId')
        .equals(profileId)
        .and((workout) => workout.date >= startDate && workout.date <= endDate)
        .toArray();
    },
    enabled: !!profileId,
  });

  return {
    workouts: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Add a single workout
 */
export function useAddWorkout(): {
  addWorkout: (workout: Omit<Workout, 'id'>) => Promise<Workout>;
  isAdding: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (workoutData: Omit<Workout, 'id'>) => {
      const workout: Workout = {
        ...workoutData,
        id: generateId(),
      };
      await db.workouts.add(workout);
      return workout;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKOUTS_KEY });
    },
  });

  return {
    addWorkout: mutation.mutateAsync,
    isAdding: mutation.isPending,
  };
}

/**
 * Import multiple workouts (with deduplication by ID)
 */
export function useImportWorkouts(): {
  importWorkouts: (workouts: Workout[]) => Promise<{ imported: number; skipped: number }>;
  isImporting: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (workouts: Workout[]) => {
      let imported = 0;
      let skipped = 0;

      await db.transaction('rw', db.workouts, async () => {
        for (const workout of workouts) {
          const existing = await db.workouts.get(workout.id);
          if (existing) {
            skipped++;
          } else {
            await db.workouts.add(workout);
            imported++;
          }
        }
      });

      return { imported, skipped };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKOUTS_KEY });
    },
  });

  return {
    importWorkouts: mutation.mutateAsync,
    isImporting: mutation.isPending,
  };
}

/**
 * Delete a workout
 */
export function useDeleteWorkout(): {
  deleteWorkout: (workoutId: string) => Promise<void>;
  isDeleting: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (workoutId: string) => {
      await db.workouts.delete(workoutId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKOUTS_KEY });
    },
  });

  return {
    deleteWorkout: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}

/**
 * Get all sets from workouts (flattened)
 */
export function useWorkoutSets(
  profileId: string | null,
  daysBack: number = 7
): {
  sets: (WorkoutSet & { workoutId: string; workoutDate: Date })[];
  isLoading: boolean;
  error: Error | null;
} {
  const { workouts, isLoading, error } = useWorkouts(profileId, daysBack);

  const sets = workouts.flatMap((workout) =>
    workout.sets.map((set) => ({
      ...set,
      workoutId: workout.id,
      workoutDate: workout.date,
    }))
  );

  return { sets, isLoading, error };
}
