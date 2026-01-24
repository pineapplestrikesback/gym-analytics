/**
 * TanStack Query hooks for Muscle Group operations
 */

import { useCallback, useMemo } from 'react';
import { useProfile, useUpdateProfile } from './useProfiles';
import {
  DEFAULT_MUSCLE_GROUP_CONFIG,
  validateMuscleGroupConfig,
} from '@core/muscle-groups';
import type { MuscleGroupConfig } from '../schema';

/**
 * Return type for useEffectiveMuscleGroupConfig hook
 */
export interface EffectiveMuscleGroupConfigResult {
  config: MuscleGroupConfig;
  isLoading: boolean;
  isUsingDefault: boolean;
  error: Error | null;
}

/**
 * Hook to get the effective muscle group configuration for a profile
 *
 * Returns:
 * - The profile's custom configuration if set
 * - DEFAULT_MUSCLE_GROUP_CONFIG if profile has no customization
 * - DEFAULT_MUSCLE_GROUP_CONFIG with isLoading=true while profile is loading
 *
 * @param profileId - Profile ID, or null if no profile selected
 */
export function useEffectiveMuscleGroupConfig(
  profileId: string | null
): EffectiveMuscleGroupConfigResult {
  const { profile, isLoading, error } = useProfile(profileId);

  return useMemo(() => {
    // Handle null profileId case
    if (!profileId) {
      return {
        config: DEFAULT_MUSCLE_GROUP_CONFIG,
        isLoading: false,
        isUsingDefault: true,
        error: null,
      };
    }

    // While profile is loading
    if (isLoading) {
      return {
        config: DEFAULT_MUSCLE_GROUP_CONFIG,
        isLoading: true,
        isUsingDefault: true,
        error: null,
      };
    }

    // Profile loaded - check for custom config
    if (profile?.customMuscleGroups) {
      return {
        config: profile.customMuscleGroups,
        isLoading: false,
        isUsingDefault: false,
        error,
      };
    }

    // Profile loaded but no custom config
    return {
      config: DEFAULT_MUSCLE_GROUP_CONFIG,
      isLoading: false,
      isUsingDefault: true,
      error,
    };
  }, [profileId, profile?.customMuscleGroups, isLoading, error]);
}

/**
 * Return type for useMuscleGroupMutations hook
 */
export interface MuscleGroupMutationsResult {
  saveConfig: (config: MuscleGroupConfig) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isSaving: boolean;
}

/**
 * Hook to get mutation functions for muscle group configuration
 *
 * Provides:
 * - saveConfig: Validates and saves a new configuration to the profile
 * - resetToDefaults: Removes custom configuration, reverting to defaults
 *
 * @param profileId - Profile ID, or null if no profile selected
 */
export function useMuscleGroupMutations(
  profileId: string | null
): MuscleGroupMutationsResult {
  const { profile } = useProfile(profileId);
  const { updateProfile, isUpdating } = useUpdateProfile();

  const saveConfig = useCallback(
    async (config: MuscleGroupConfig): Promise<void> => {
      if (!profile) {
        throw new Error('Cannot save: no profile loaded');
      }

      // Validate configuration
      const validation = validateMuscleGroupConfig(config);
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join('; ')}`);
      }

      // Save to profile
      await updateProfile({
        ...profile,
        customMuscleGroups: config,
      });
    },
    [profile, updateProfile]
  );

  const resetToDefaults = useCallback(async (): Promise<void> => {
    if (!profile) {
      throw new Error('Cannot reset: no profile loaded');
    }

    // Remove custom config by setting to undefined
    await updateProfile({
      ...profile,
      customMuscleGroups: undefined,
    });
  }, [profile, updateProfile]);

  return {
    saveConfig,
    resetToDefaults,
    isSaving: isUpdating,
  };
}
