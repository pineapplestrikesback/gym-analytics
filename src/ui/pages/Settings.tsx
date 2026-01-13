/**
 * Settings Page
 * Profile settings, API keys, goals, and exercise mappings
 */

import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentProfile } from '../context/ProfileContext';
import { useEnhancedImport } from '@db/hooks/useEnhancedImport';
import { useUpdateProfile } from '@db/hooks/useProfiles';
import { useHevySync, useValidateHevyApiKey, type HevySyncResult } from '@db/hooks/useHevySync';
import { useUnmappedExercises } from '@db/hooks/useUnmappedExercises';
import { parseCsv } from '@core/parsers/csv-parser';
import type { Workout } from '@db/schema';
import type { ScientificMuscle } from '@core/taxonomy';
import { WeeklyGoalEditor } from '../components/WeeklyGoalEditor';

export function Settings(): React.ReactElement {
  const { currentProfile, isLoading } = useCurrentProfile();
  const { importWorkouts, isImporting } = useEnhancedImport();
  const { updateProfile, isUpdating } = useUpdateProfile();
  const { syncWorkouts, isSyncing } = useHevySync();
  const { validateKey, isValidating } = useValidateHevyApiKey();
  const { count: unmappedCount } = useUnmappedExercises(currentProfile?.id ?? null);

  // CSV import state
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    unmappedCount?: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // API key state
  const [apiKey, setApiKey] = useState('');
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [apiKeySaveSuccess, setApiKeySaveSuccess] = useState(false);

  // Hevy sync state
  const [syncResult, setSyncResult] = useState<HevySyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !currentProfile) return;

    setImportError(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const { workouts, format } = parseCsv(text);

      if (format === 'unknown') {
        setImportError('Unknown CSV format. Please use a Hevy export file.');
        return;
      }

      if (workouts.length === 0) {
        setImportError('No workouts found in the file.');
        return;
      }

      // Add profileId to each workout
      const workoutsWithProfile: Workout[] = workouts.map((w) => ({
        id: w.id,
        profileId: currentProfile.id,
        date: w.date,
        title: w.title,
        sets: w.sets,
      }));

      const result = await importWorkouts(workoutsWithProfile);
      setImportResult(result);

      // Clear the file input
      e.target.value = '';
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import file');
    }
  };

  const handleValidateApiKey = async (): Promise<void> => {
    const keyToValidate = apiKey.trim() || currentProfile?.hevyApiKey;
    if (!keyToValidate) return;

    setApiKeyValid(null);
    try {
      const isValid = await validateKey(keyToValidate);
      setApiKeyValid(isValid);
    } catch {
      setApiKeyValid(false);
    }
  };

  const handleSaveApiKey = async (): Promise<void> => {
    if (!currentProfile || !apiKey.trim()) return;

    setApiKeySaveSuccess(false);
    await updateProfile({
      ...currentProfile,
      hevyApiKey: apiKey.trim(),
    });
    setApiKeySaveSuccess(true);
    setApiKeyValid(null);

    // Clear success message after 3 seconds
    setTimeout(() => setApiKeySaveSuccess(false), 3000);
  };

  const handleSyncWorkouts = async (): Promise<void> => {
    if (!currentProfile) return;

    setSyncResult(null);
    setSyncError(null);

    try {
      const result = await syncWorkouts(currentProfile);
      setSyncResult(result);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to sync workouts');
    }
  };

  const handleSaveGoals = async (
    goals: Partial<Record<ScientificMuscle, number>>,
    totalGoal: number
  ): Promise<void> => {
    if (!currentProfile) return;

    await updateProfile({
      ...currentProfile,
      goals,
      totalGoal,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-300 border-t-white" />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="rounded-lg bg-primary-700 p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-white">No Profile Selected</h2>
        <p className="text-primary-200">
          Create or select a profile using the dropdown in the header to access settings.
        </p>
      </div>
    );
  }

  const hasApiKey = !!(apiKey.trim() || currentProfile.hevyApiKey);
  const lastSyncDate = currentProfile.lastSyncTimestamp
    ? new Date(currentProfile.lastSyncTimestamp * 1000).toLocaleString()
    : 'Never';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h2 className="text-2xl font-bold text-white">Settings</h2>

      {/* Profile Section */}
      <section className="rounded-lg bg-primary-700 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-primary-200">Profile Name</label>
            <p className="text-white">{currentProfile.name}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm text-primary-200">Created</label>
            <p className="text-white">{currentProfile.createdAt.toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      {/* Hevy API Section */}
      <section className="rounded-lg bg-primary-700 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Hevy Integration</h3>
        <div className="space-y-4">
          {/* API Key Input */}
          <div>
            <label className="mb-1 block text-sm text-primary-200">API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder={currentProfile.hevyApiKey ? '••••••••' : 'Enter your Hevy API key...'}
                className="flex-1 rounded border border-primary-500 bg-primary-800 px-4 py-2 text-white placeholder-primary-400 focus:border-primary-300 focus:outline-none"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setApiKeyValid(null);
                  setApiKeySaveSuccess(false);
                }}
              />
              <button
                onClick={() => void handleValidateApiKey()}
                disabled={isValidating || !hasApiKey}
                className="rounded bg-primary-500 px-4 py-2 text-white transition-colors hover:bg-primary-400 disabled:opacity-50"
              >
                {isValidating ? 'Checking...' : 'Test'}
              </button>
            </div>
            {apiKeyValid === true && (
              <p className="mt-1 text-sm text-green-400">API key is valid</p>
            )}
            {apiKeyValid === false && (
              <p className="mt-1 text-sm text-red-400">API key is invalid</p>
            )}
          </div>

          {/* Save API Key Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => void handleSaveApiKey()}
              disabled={isUpdating || !apiKey.trim()}
              className="rounded bg-accent-blue px-4 py-2 text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save API Key'}
            </button>
            {apiKeySaveSuccess && <span className="text-sm text-green-400">Saved!</span>}
          </div>

          {/* Sync Section */}
          {currentProfile.hevyApiKey && (
            <div className="border-t border-primary-600 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-200">Last synced: {lastSyncDate}</p>
                  {currentProfile.lastSyncTimestamp && (
                    <p className="text-xs text-primary-300">
                      Next sync will be incremental (only new/updated workouts)
                    </p>
                  )}
                </div>
                <button
                  onClick={() => void handleSyncWorkouts()}
                  disabled={isSyncing}
                  className="rounded bg-accent-orange px-4 py-2 text-white transition-colors hover:bg-orange-500 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Syncing...
                    </span>
                  ) : (
                    'Sync Now'
                  )}
                </button>
              </div>

              {/* Sync Result */}
              {syncResult && (
                <div className="rounded bg-green-800 p-3 text-green-100">
                  <p className="font-medium">
                    {syncResult.syncType === 'full' ? 'Full sync' : 'Incremental sync'} complete!
                  </p>
                  <ul className="mt-1 text-sm">
                    {syncResult.imported > 0 && <li>Imported: {syncResult.imported} workouts</li>}
                    {syncResult.updated > 0 && <li>Updated: {syncResult.updated} workouts</li>}
                    {syncResult.deleted > 0 && <li>Deleted: {syncResult.deleted} workouts</li>}
                    {syncResult.skipped > 0 && <li>Skipped: {syncResult.skipped} workouts</li>}
                    {syncResult.imported === 0 &&
                      syncResult.updated === 0 &&
                      syncResult.deleted === 0 && <li>No changes found</li>}
                  </ul>
                </div>
              )}

              {/* Sync Error */}
              {syncError && <div className="rounded bg-red-800 p-3 text-red-100">{syncError}</div>}
            </div>
          )}
        </div>
      </section>

      {/* Import/Export Section */}
      <section className="rounded-lg bg-primary-700 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">CSV Import</h3>
        <p className="mb-4 text-sm text-primary-300">
          Import workouts from a Hevy CSV export file. This is useful if you don&apos;t have an API
          key or want to import historical data.
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-primary-200">
              Import from CSV (Hevy format)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => void handleFileUpload(e)}
              disabled={isImporting}
              className="block w-full text-sm text-primary-200 file:mr-4 file:rounded file:border-0 file:bg-primary-500 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-primary-400 disabled:opacity-50"
            />
          </div>

          {/* Import Status */}
          {isImporting && (
            <div className="flex items-center gap-2 text-primary-200">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-300 border-t-white" />
              Importing workouts...
            </div>
          )}

          {importResult && (
            <div className="rounded bg-green-800 p-3 text-green-100">
              Successfully imported {importResult.imported} workout(s).
              {importResult.skipped > 0 && ` Skipped ${importResult.skipped} duplicate(s).`}
              {importResult.unmappedCount && importResult.unmappedCount > 0 && (
                <span className="block mt-1 text-sm">
                  Found {importResult.unmappedCount} unmapped exercise(s). Visit Exercise Mappings
                  to map them.
                </span>
              )}
            </div>
          )}

          {importError && <div className="rounded bg-red-800 p-3 text-red-100">{importError}</div>}
        </div>
      </section>

      {/* Goals Section */}
      <section className="rounded-lg bg-primary-700 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Weekly Goals</h3>
        <WeeklyGoalEditor
          goals={currentProfile.goals}
          totalGoal={currentProfile.totalGoal}
          onSave={handleSaveGoals}
          isSaving={isUpdating}
        />
      </section>

      {/* Exercise Mappings Section */}
      <section className="rounded-lg bg-primary-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Exercise Mappings
              {unmappedCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-medium text-black">
                  {unmappedCount} unmapped
                </span>
              )}
            </h3>
            <p className="mt-1 text-sm text-primary-300">
              {unmappedCount > 0
                ? 'Some exercises need manual mapping for accurate volume tracking.'
                : 'All exercises are mapped correctly.'}
            </p>
          </div>
          <Link
            to="/settings/exercise-mappings"
            className="rounded bg-cyan-500 px-4 py-2 font-medium text-black transition-colors hover:bg-cyan-400"
          >
            Manage Mappings
          </Link>
        </div>
      </section>
    </div>
  );
}
