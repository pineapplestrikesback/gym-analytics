/**
 * TanStack Query hooks for Workout operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, generateId, type Workout, type WorkoutSet } from '../schema';

const WORKOUTS_KEY = ['workouts'];

export type ViewMode = 'last7days' | 'calendarWeek';

/**
 * Get the start of today in the user's local timezone
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Get the end of today in the user's local timezone (23:59:59.999)
 */
function getEndOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

/**
 * Get the start of the current calendar week (Monday)
 */
function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust when Sunday (0)
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
}

export interface UseWorkoutsOptions {
  mode?: ViewMode;
}

/**
 * Get workouts for a profile within a date range
 * @param profileId - Profile ID
 * @param daysBackOrOptions - Number of days back (legacy) or options object with mode
 */
export function useWorkouts(
  profileId: string | null,
  daysBackOrOptions: number | UseWorkoutsOptions = 7
): {
  workouts: Workout[];
  isLoading: boolean;
  error: Error | null;
} {
  // Support both legacy daysBack number and new options object
  const options: UseWorkoutsOptions = typeof daysBackOrOptions === 'number'
    ? { mode: 'last7days' }
    : daysBackOrOptions;
  const mode = options.mode ?? 'last7days';

  // For legacy daysBack support, extract the number
  const daysBack = typeof daysBackOrOptions === 'number' ? daysBackOrOptions : 7;

  const { data, isLoading, error } = useQuery({
    queryKey: [...WORKOUTS_KEY, profileId, mode, daysBack],
    queryFn: async () => {
      if (!profileId) return [];

      let startDate: Date;
      let endDate: Date;

      if (typeof daysBackOrOptions === 'number') {
        // Legacy behavior: rolling daysBack window
        endDate = new Date();
        startDate = new Date(getStartOfToday());
        startDate.setDate(startDate.getDate() - daysBackOrOptions + 1);
      } else if (mode === 'last7days') {
        endDate = getEndOfToday();
        startDate = new Date(getStartOfToday());
        startDate.setDate(startDate.getDate() - 6); // 6 days back + today = 7 days
      } else {
        // calendarWeek mode
        startDate = getStartOfWeek();
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // Monday + 6 days = Sunday
        endDate.setHours(23, 59, 59, 999);
      }

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
