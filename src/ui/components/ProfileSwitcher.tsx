/**
 * ProfileSwitcher Component
 * Dropdown for switching between profiles or creating new ones
 */

import { useState } from 'react';
import { useCurrentProfile } from '../context/ProfileContext';
import { useCreateProfile } from '@db/hooks/useProfiles';

export function ProfileSwitcher(): React.ReactElement {
  const { currentProfile, setCurrentProfileId, profiles, isLoading } = useCurrentProfile();
  const { createProfile, isCreating } = useCreateProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const handleSelectProfile = (profileId: string): void => {
    setCurrentProfileId(profileId);
    setIsOpen(false);
  };

  const handleCreateProfile = async (): Promise<void> => {
    if (!newProfileName.trim()) return;

    const profile = await createProfile(newProfileName.trim());
    setCurrentProfileId(profile.id);
    setNewProfileName('');
    setIsCreatingNew(false);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      void handleCreateProfile();
    } else if (e.key === 'Escape') {
      setIsCreatingNew(false);
      setNewProfileName('');
    }
  };

  if (isLoading) {
    return <div className="h-10 w-32 animate-pulse rounded-lg bg-primary-500" />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-white transition-colors hover:bg-primary-400"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="max-w-[120px] truncate">{currentProfile?.name ?? 'Select Profile'}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border border-primary-400 bg-primary-700 py-1 shadow-lg">
          {/* Profile list */}
          <ul role="listbox" className="max-h-48 overflow-y-auto">
            {profiles.map((profile) => (
              <li key={profile.id}>
                <button
                  onClick={() => handleSelectProfile(profile.id)}
                  className={`w-full px-4 py-2 text-left text-white transition-colors hover:bg-primary-600 ${
                    profile.id === currentProfile?.id ? 'bg-primary-600' : ''
                  }`}
                  role="option"
                  aria-selected={profile.id === currentProfile?.id}
                >
                  {profile.name}
                </button>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-1 border-t border-primary-500" />

          {/* Create new profile */}
          {isCreatingNew ? (
            <div className="px-4 py-2">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Profile name..."
                className="w-full rounded border border-primary-400 bg-primary-800 px-3 py-1 text-white placeholder-primary-300 focus:border-primary-300 focus:outline-none"
                autoFocus
                disabled={isCreating}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => void handleCreateProfile()}
                  disabled={!newProfileName.trim() || isCreating}
                  className="flex-1 rounded bg-accent-blue px-3 py-1 text-sm text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setIsCreatingNew(false);
                    setNewProfileName('');
                  }}
                  className="rounded px-3 py-1 text-sm text-primary-200 transition-colors hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingNew(true)}
              className="flex w-full items-center gap-2 px-4 py-2 text-primary-200 transition-colors hover:bg-primary-600 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Profile
            </button>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setIsCreatingNew(false);
            setNewProfileName('');
          }}
        />
      )}
    </div>
  );
}
