/**
 * TanStack Query hooks for DefaultNameMappingOverride operations
 * Manages user customizations of default exercise name mappings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, generateId, type DefaultNameMappingOverride } from '../schema';

const DEFAULT_NAME_MAPPING_OVERRIDES_KEY = ['defaultNameMappingOverrides'];

/**
 * Get all name mapping overrides for a profile
 */
export function useDefaultNameMappingOverrides(profileId: string | null): {
  overrides: DefaultNameMappingOverride[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: [...DEFAULT_NAME_MAPPING_OVERRIDES_KEY, profileId],
    queryFn: async () => {
      if (!profileId) return [];

      return db.defaultNameMappingOverrides.where('profileId').equals(profileId).toArray();
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
 * Get a specific name mapping override
 */
export function useDefaultNameMappingOverride(
  profileId: string | null,
  gymName: string | null
): {
  override: DefaultNameMappingOverride | null;
  isLoading: boolean;
  isCustomized: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: [...DEFAULT_NAME_MAPPING_OVERRIDES_KEY, profileId, gymName],
    queryFn: async () => {
      if (!profileId || !gymName) return null;

      const result = await db.defaultNameMappingOverrides
        .where('[profileId+gymName]')
        .equals([profileId, gymName])
        .first();

      return result ?? null;
    },
    enabled: !!profileId && !!gymName,
  });

  return {
    override: data ?? null,
    isLoading,
    isCustomized: !!data,
  };
}

/**
 * Create or update a name mapping override
 */
export function useUpsertDefaultNameMappingOverride(): {
  upsertOverride: (
    profileId: string,
    gymName: string,
    canonicalName: string
  ) => Promise<void>;
  isUpserting: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      profileId,
      gymName,
      canonicalName,
    }: {
      profileId: string;
      gymName: string;
      canonicalName: string;
    }) => {
      // Check if override exists
      const existing = await db.defaultNameMappingOverrides
        .where('[profileId+gymName]')
        .equals([profileId, gymName])
        .first();

      if (existing) {
        // Update existing
        await db.defaultNameMappingOverrides.update(existing.id, {
          canonicalName,
          updatedAt: new Date(),
        });
      } else {
        // Create new
        const override: DefaultNameMappingOverride = {
          id: generateId(),
          profileId,
          gymName,
          canonicalName,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.defaultNameMappingOverrides.add(override);
      }
    },
    onSuccess: (_data, { profileId, gymName }) => {
      void queryClient.invalidateQueries({ queryKey: DEFAULT_NAME_MAPPING_OVERRIDES_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...DEFAULT_NAME_MAPPING_OVERRIDES_KEY, profileId],
      });
      void queryClient.invalidateQueries({
        queryKey: [...DEFAULT_NAME_MAPPING_OVERRIDES_KEY, profileId, gymName],
      });
    },
  });

  return {
    upsertOverride: (profileId, gymName, canonicalName) =>
      mutation.mutateAsync({ profileId, gymName, canonicalName }),
    isUpserting: mutation.isPending,
  };
}

/**
 * Delete a name mapping override (revert to default)
 */
export function useDeleteDefaultNameMappingOverride(): {
  deleteOverride: (profileId: string, gymName: string) => Promise<void>;
  isDeleting: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      profileId,
      gymName,
    }: {
      profileId: string;
      gymName: string;
    }) => {
      await db.defaultNameMappingOverrides
        .where('[profileId+gymName]')
        .equals([profileId, gymName])
        .delete();
    },
    onSuccess: (_data, { profileId, gymName }) => {
      void queryClient.invalidateQueries({ queryKey: DEFAULT_NAME_MAPPING_OVERRIDES_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...DEFAULT_NAME_MAPPING_OVERRIDES_KEY, profileId],
      });
      void queryClient.invalidateQueries({
        queryKey: [...DEFAULT_NAME_MAPPING_OVERRIDES_KEY, profileId, gymName],
      });
    },
  });

  return {
    deleteOverride: (profileId, gymName) => mutation.mutateAsync({ profileId, gymName }),
    isDeleting: mutation.isPending,
  };
}

/**
 * Get all gym names that have been customized for a profile
 * Returns a Set of gym names for efficient lookups
 */
export function useCustomizedGymNames(profileId: string | null): {
  customizedNames: Set<string>;
  isLoading: boolean;
} {
  const { overrides, isLoading } = useDefaultNameMappingOverrides(profileId);

  return {
    customizedNames: new Set(overrides.map((o) => o.gymName)),
    isLoading,
  };
}

/**
 * Get a Map of gym name -> canonical name for all overrides
 * Useful for batch lookups during import
 */
export function useNameMappingOverridesMap(profileId: string | null): {
  mappingMap: Map<string, string>;
  isLoading: boolean;
} {
  const { overrides, isLoading } = useDefaultNameMappingOverrides(profileId);

  return {
    mappingMap: new Map(overrides.map((o) => [o.gymName, o.canonicalName])),
    isLoading,
  };
}
