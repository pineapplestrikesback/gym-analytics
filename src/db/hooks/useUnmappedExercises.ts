/**
 * TanStack Query hooks for UnmappedExercise operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, generateId, type UnmappedExercise } from '../schema';

const UNMAPPED_EXERCISES_KEY = ['unmappedExercises'];

/**
 * Get unmapped exercises for a profile, sorted by occurrence count DESC
 */
export function useUnmappedExercises(profileId: string | null): {
  unmappedExercises: UnmappedExercise[];
  count: number;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: [...UNMAPPED_EXERCISES_KEY, profileId],
    queryFn: async () => {
      if (!profileId) return [];

      return db.unmappedExercises
        .where('profileId')
        .equals(profileId)
        .reverse()
        .sortBy('occurrenceCount');
    },
    enabled: !!profileId,
  });

  return {
    unmappedExercises: data ?? [],
    count: data?.length ?? 0,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Add a new unmapped exercise (called during import)
 */
export function useAddUnmappedExercise(): {
  addUnmappedExercise: (exercise: Omit<UnmappedExercise, 'id'>) => Promise<string>;
  isAdding: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (exerciseData: Omit<UnmappedExercise, 'id'>) => {
      const exercise: UnmappedExercise = {
        ...exerciseData,
        id: generateId(),
      };
      await db.unmappedExercises.add(exercise);
      return exercise.id;
    },
    onSuccess: (_data, exercise) => {
      void queryClient.invalidateQueries({ queryKey: UNMAPPED_EXERCISES_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...UNMAPPED_EXERCISES_KEY, exercise.profileId],
      });
    },
  });

  return {
    addUnmappedExercise: mutation.mutateAsync,
    isAdding: mutation.isPending,
  };
}

/**
 * Increment occurrence count for existing unmapped exercise
 */
export function useIncrementUnmappedCount(): {
  incrementCount: (profileId: string, normalizedName: string) => Promise<void>;
  isIncrementing: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      profileId,
      normalizedName,
    }: {
      profileId: string;
      normalizedName: string;
    }) => {
      const existing = await db.unmappedExercises
        .where('[profileId+normalizedName]')
        .equals([profileId, normalizedName])
        .first();

      if (existing) {
        await db.unmappedExercises.update(existing.id, {
          occurrenceCount: existing.occurrenceCount + 1,
        });
      }
    },
    onSuccess: (_data, { profileId }) => {
      void queryClient.invalidateQueries({ queryKey: UNMAPPED_EXERCISES_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...UNMAPPED_EXERCISES_KEY, profileId],
      });
    },
  });

  return {
    incrementCount: (profileId: string, normalizedName: string) =>
      mutation.mutateAsync({ profileId, normalizedName }),
    isIncrementing: mutation.isPending,
  };
}

/**
 * Track unmapped exercise: create new or increment existing count
 * Used during workout import to automatically track unmapped exercises
 */
export function useTrackUnmappedExercise(): {
  trackUnmapped: (profileId: string, originalName: string, normalizedName: string) => Promise<void>;
  isTracking: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      profileId,
      originalName,
      normalizedName,
    }: {
      profileId: string;
      originalName: string;
      normalizedName: string;
    }) => {
      // Check if unmapped exercise already exists
      const existing = await db.unmappedExercises
        .where('[profileId+normalizedName]')
        .equals([profileId, normalizedName])
        .first();

      if (existing) {
        // Increment occurrence count
        await db.unmappedExercises.update(existing.id, {
          occurrenceCount: existing.occurrenceCount + 1,
        });
      } else {
        // Create new unmapped exercise
        const exercise: UnmappedExercise = {
          id: generateId(),
          profileId,
          originalName,
          normalizedName,
          firstSeenAt: new Date(),
          occurrenceCount: 1,
        };
        await db.unmappedExercises.add(exercise);
      }
    },
    onSuccess: (_data, { profileId }) => {
      void queryClient.invalidateQueries({ queryKey: UNMAPPED_EXERCISES_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...UNMAPPED_EXERCISES_KEY, profileId],
      });
    },
  });

  return {
    trackUnmapped: (profileId: string, originalName: string, normalizedName: string) =>
      mutation.mutateAsync({ profileId, originalName, normalizedName }),
    isTracking: mutation.isPending,
  };
}

/**
 * Delete unmapped exercise (after it's been mapped)
 */
export function useDeleteUnmappedExercise(): {
  deleteUnmappedExercise: (id: string) => Promise<void>;
  isDeleting: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await db.unmappedExercises.delete(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: UNMAPPED_EXERCISES_KEY });
    },
  });

  return {
    deleteUnmappedExercise: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
