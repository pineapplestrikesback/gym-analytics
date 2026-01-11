/**
 * Global Profile Context
 * Manages the currently selected profile across the app
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useProfiles } from '@db/hooks/useProfiles';
import type { Profile } from '@db/schema';

interface ProfileContextValue {
  currentProfile: Profile | null;
  setCurrentProfileId: (id: string | null) => void;
  profiles: Profile[];
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const STORAGE_KEY = 'scientificmuscle_current_profile';

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps): React.ReactElement {
  const { profiles, isLoading } = useProfiles();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  });

  // Find the current profile from the list
  const currentProfile = profiles.find((p) => p.id === currentProfileId) ?? null;

  // Auto-select first profile if none selected and profiles exist
  useEffect(() => {
    if (!isLoading && profiles.length > 0 && !currentProfile) {
      const firstProfile = profiles[0];
      if (firstProfile) {
        setCurrentProfileId(firstProfile.id);
      }
    }
  }, [profiles, isLoading, currentProfile]);

  // Persist selection to localStorage
  useEffect(() => {
    if (currentProfileId) {
      localStorage.setItem(STORAGE_KEY, currentProfileId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentProfileId]);

  const value: ProfileContextValue = {
    currentProfile,
    setCurrentProfileId,
    profiles,
    isLoading,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useCurrentProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useCurrentProfile must be used within a ProfileProvider');
  }
  return context;
}
