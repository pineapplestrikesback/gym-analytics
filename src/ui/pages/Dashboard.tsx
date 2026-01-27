/**
 * Dashboard Page
 * Shows weekly muscle volume statistics
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentProfile } from '../context/ProfileContext';
import { useUnmappedExercises } from '@db/hooks/useUnmappedExercises';
import { useIsMobileDevice } from '@ui/hooks/useIsMobileDevice';
import { MuscleHeatmap } from '../components/MuscleHeatmap';
import { MobileCarousel } from '@ui/components/mobile/MobileCarousel';
import { TotalVolumeCard } from '../components/TotalVolumeCard';
import { WeeklyActivityChart } from '../components/WeeklyActivityChart';

type ViewMode = 'last7days' | 'calendarWeek';

export function Dashboard(): React.ReactElement {
  const { currentProfile, isLoading } = useCurrentProfile();
  const { count: unmappedCount } = useUnmappedExercises(currentProfile?.id ?? null);
  const isMobile = useIsMobileDevice();
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('last7days');

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
          Create or select a profile using the dropdown in the header to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unmapped Exercises Alert */}
      {unmappedCount > 0 && !dismissedAlert && (
        <div className="flex items-center justify-between rounded-lg border-2 border-amber-500/50 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-amber-200">
                {unmappedCount} exercise{unmappedCount > 1 ? 's' : ''} need mapping
              </p>
              <p className="text-sm text-amber-200/70">
                Some exercises aren&apos;t tracked for volume. Map them for accurate stats.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/settings/exercise-mappings"
              className="rounded bg-amber-500 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-amber-400"
            >
              Fix Now
            </Link>
            <button
              onClick={() => setDismissedAlert(true)}
              className="rounded px-2 py-1.5 text-sm text-amber-200/70 transition-colors hover:bg-amber-500/20 hover:text-amber-200"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Workout Overview</h2>
      </div>

      {/* Total Weekly Volume */}
      <TotalVolumeCard viewMode={viewMode} />

      {/* Weekly Activity Chart */}
      <WeeklyActivityChart viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* Volume Display Section */}
      <div className="rounded-lg bg-primary-700 p-6">
        {isMobile ? (
          <MobileCarousel profileId={currentProfile.id} viewMode={viewMode} />
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">
                {viewMode === 'calendarWeek' ? 'This Week' : 'Last 7 Days'}
              </h3>
            </div>

            <MuscleHeatmap profileId={currentProfile.id} viewMode={viewMode} />
          </>
        )}
      </div>

    </div>
  );
}
