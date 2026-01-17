/**
 * TanStack Query hooks for DefaultExerciseOverride operations
 * Manages user customizations of default exercise muscle values
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, generateId, type DefaultExerciseOverride } from '../schema';
import type { ScientificMuscle } from '@core/taxonomy';

const DEFAULT_EXERCISE_OVERRIDES_KEY = ['defaultExerciseOverrides'];

/**
 * Get all exercise overrides for a profile
 */
export function useDefaultExerciseOverrides(profileId: string | null): {
  overrides: DefaultExerciseOverride[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: [...DEFAULT_EXERCISE_OVERRIDES_KEY, profileId],
    queryFn: async () => {
      if (!profileId) return [];

      return db.defaultExerciseOverrides.where('profileId').equals(profileId).toArray();
    },
    enabled: !!profileId,
  });

  return {
    overrides: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Get a specific exercise override
 */
export function useDefaultExerciseOverride(
  profileId: string | null,
  exerciseName: string | null
): {
  override: DefaultExerciseOverride | null;
  isLoading: boolean;
  isCustomized: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: [...DEFAULT_EXERCISE_OVERRIDES_KEY, profileId, exerciseName],
    queryFn: async () => {
      if (!profileId || !exerciseName) return null;

      const result = await db.defaultExerciseOverrides
        .where('[profileId+exerciseName]')
        .equals([profileId, exerciseName])
        .first();

      return result ?? null;
    },
    enabled: !!profileId && !!exerciseName,
  });

  return {
    override: data ?? null,
    isLoading,
    isCustomized: !!data,
  };
}

/**
 * Create or update an exercise override
 */
export function useUpsertDefaultExerciseOverride(): {
  upsertOverride: (
    profileId: string,
    exerciseName: string,
    customMuscleValues: Partial<Record<ScientificMuscle, number>>
  ) => Promise<void>;
  isUpserting: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      profileId,
      exerciseName,
      customMuscleValues,
    }: {
      profileId: string;
      exerciseName: string;
      customMuscleValues: Partial<Record<ScientificMuscle, number>>;
    }) => {
      // Check if override exists
      const existing = await db.defaultExerciseOverrides
        .where('[profileId+exerciseName]')
        .equals([profileId, exerciseName])
        .first();

      if (existing) {
        // Update existing
        await db.defaultExerciseOverrides.update(existing.id, {
          customMuscleValues,
          updatedAt: new Date(),
        });
      } else {
        // Create new
        const override: DefaultExerciseOverride = {
          id: generateId(),
          profileId,
          exerciseName,
          customMuscleValues,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.defaultExerciseOverrides.add(override);
      }
    },
    onSuccess: (_data, { profileId, exerciseName }) => {
      void queryClient.invalidateQueries({ queryKey: DEFAULT_EXERCISE_OVERRIDES_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...DEFAULT_EXERCISE_OVERRIDES_KEY, profileId],
      });
      void queryClient.invalidateQueries({
        queryKey: [...DEFAULT_EXERCISE_OVERRIDES_KEY, profileId, exerciseName],
      });
    },
  });

  return {
    upsertOverride: (profileId, exerciseName, customMuscleValues) =>
      mutation.mutateAsync({ profileId, exerciseName, customMuscleValues }),
    isUpserting: mutation.isPending,
  };
}

/**
 * Delete an exercise override (revert to default)
 */
export function useDeleteDefaultExerciseOverride(): {
  deleteOverride: (profileId: string, exerciseName: string) => Promise<void>;
  isDeleting: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      profileId,
      exerciseName,
    }: {
      profileId: string;
      exerciseName: string;
    }) => {
      await db.defaultExerciseOverrides
        .where('[profileId+exerciseName]')
        .equals([profileId, exerciseName])
        .delete();
    },
    onSuccess: (_data, { profileId, exerciseName }) => {
      void queryClient.invalidateQueries({ queryKey: DEFAULT_EXERCISE_OVERRIDES_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...DEFAULT_EXERCISE_OVERRIDES_KEY, profileId],
      });
      void queryClient.invalidateQueries({
        queryKey: [...DEFAULT_EXERCISE_OVERRIDES_KEY, profileId, exerciseName],
      });
    },
  });

  return {
    deleteOverride: (profileId, exerciseName) =>
      mutation.mutateAsync({ profileId, exerciseName }),
    isDeleting: mutation.isPending,
  };
}

/**
 * Get all exercises that have been customized for a profile
 * Returns a Set of exercise names for efficient lookups
 */
export function useCustomizedExerciseNames(profileId: string | null): {
  customizedNames: Set<string>;
  isLoading: boolean;
} {
  const { overrides, isLoading } = useDefaultExerciseOverrides(profileId);

  return {
    customizedNames: new Set(overrides.map((o) => o.exerciseName)),
    isLoading,
  };
}
