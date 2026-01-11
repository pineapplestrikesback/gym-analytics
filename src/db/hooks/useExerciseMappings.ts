/**
 * TanStack Query hooks for ExerciseMapping operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, generateId, type ExerciseMapping } from '../schema';

const EXERCISE_MAPPINGS_KEY = ['exerciseMappings'];
const UNMAPPED_EXERCISES_KEY = ['unmappedExercises'];

/**
 * Get user-defined mappings for a profile
 */
export function useExerciseMappings(profileId: string | null): {
  mappings: ExerciseMapping[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: [...EXERCISE_MAPPINGS_KEY, profileId],
    queryFn: async () => {
      if (!profileId) return [];

      return db.exerciseMappings.where('profileId').equals(profileId).toArray();
    },
    enabled: !!profileId,
  });

  return {
    mappings: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Create a new mapping (and remove from unmapped list)
 */
export function useCreateExerciseMapping(): {
  createMapping: (mapping: Omit<ExerciseMapping, 'id' | 'createdAt'>) => Promise<string>;
  isCreating: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (mappingData: Omit<ExerciseMapping, 'id' | 'createdAt'>) => {
      const mapping: ExerciseMapping = {
        ...mappingData,
        id: generateId(),
        createdAt: new Date(),
      };

      // Create mapping and delete unmapped exercise in a transaction
      await db.transaction('rw', [db.exerciseMappings, db.unmappedExercises], async () => {
        await db.exerciseMappings.add(mapping);

        // Delete the corresponding unmapped exercise
        await db.unmappedExercises
          .where('[profileId+normalizedName]')
          .equals([mapping.profileId, mapping.originalPattern])
          .delete();
      });

      return mapping.id;
    },
    onSuccess: (_data, mapping) => {
      void queryClient.invalidateQueries({ queryKey: EXERCISE_MAPPINGS_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...EXERCISE_MAPPINGS_KEY, mapping.profileId],
      });
      void queryClient.invalidateQueries({ queryKey: UNMAPPED_EXERCISES_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...UNMAPPED_EXERCISES_KEY, mapping.profileId],
      });
    },
  });

  return {
    createMapping: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

/**
 * Delete a mapping
 */
export function useDeleteExerciseMapping(): {
  deleteMapping: (id: string) => Promise<void>;
  isDeleting: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await db.exerciseMappings.delete(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EXERCISE_MAPPINGS_KEY });
    },
  });

  return {
    deleteMapping: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}

/**
 * Get a single mapping by original pattern (for lookups during volume calc)
 */
export function useGetMappingByPattern(
  profileId: string | null,
  pattern: string
): {
  mapping: ExerciseMapping | null;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: [...EXERCISE_MAPPINGS_KEY, profileId, pattern],
    queryFn: async () => {
      if (!profileId || !pattern) return null;

      const result = await db.exerciseMappings
        .where('[profileId+originalPattern]')
        .equals([profileId, pattern])
        .first();

      return result ?? null;
    },
    enabled: !!profileId && !!pattern,
  });

  return {
    mapping: data ?? null,
    isLoading,
  };
}
