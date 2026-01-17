/**
 * TanStack Query hooks for Profile operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, createDefaultProfile, type Profile, type Gender } from '../schema';

const PROFILES_KEY = ['profiles'];

/**
 * Fetch all profiles
 */
export function useProfiles(): {
  profiles: Profile[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: PROFILES_KEY,
    queryFn: async () => {
      return db.profiles.toArray();
    },
  });

  return {
    profiles: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Fetch a single profile by ID
 */
export function useProfile(profileId: string | null): {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: [...PROFILES_KEY, profileId],
    queryFn: async () => {
      if (!profileId) return null;
      return db.profiles.get(profileId) ?? null;
    },
    enabled: !!profileId,
  });

  return {
    profile: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Create a new profile
 */
export function useCreateProfile(): {
  createProfile: (name: string, gender: Gender) => Promise<Profile>;
  isCreating: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ name, gender }: { name: string; gender: Gender }) => {
      const profile = createDefaultProfile(name, gender);
      await db.profiles.add(profile);
      return profile;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
    },
  });

  return {
    createProfile: (name: string, gender: Gender) => mutation.mutateAsync({ name, gender }),
    isCreating: mutation.isPending,
  };
}

/**
 * Update an existing profile
 */
export function useUpdateProfile(): {
  updateProfile: (profile: Profile) => Promise<void>;
  isUpdating: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (profile: Profile) => {
      await db.profiles.put(profile);
    },
    onSuccess: (_data, profile) => {
      void queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
      void queryClient.invalidateQueries({ queryKey: [...PROFILES_KEY, profile.id] });
    },
  });

  return {
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

/**
 * Delete a profile and all associated data
 */
export function useDeleteProfile(): {
  deleteProfile: (profileId: string) => Promise<void>;
  isDeleting: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (profileId: string) => {
      await db.transaction(
        'rw',
        [db.profiles, db.workouts, db.unmappedExercises, db.exerciseMappings],
        async () => {
          await db.profiles.delete(profileId);
          await db.workouts.where('profileId').equals(profileId).delete();
          await db.unmappedExercises.where('profileId').equals(profileId).delete();
          await db.exerciseMappings.where('profileId').equals(profileId).delete();
        }
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILES_KEY });
    },
  });

  return {
    deleteProfile: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
