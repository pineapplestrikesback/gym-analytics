/**
 * Mobile Heatmap Component
 *
 * Mobile-specific muscle volume visualization. Uses shared data hooks
 * from @db/hooks (ARCH-02 - no data duplication).
 *
 * Phase 1: Shell component with loading/error/success states
 * Phase 3: Will add actual visualization
 */

import { useScientificMuscleVolume } from '@db/hooks';

interface MobileHeatmapProps {
  profileId: string | null;
  daysBack?: number;
}

/**
 * Mobile heatmap component shell.
 * Displays muscle volume data in a mobile-optimized format.
 */
export function MobileHeatmap({ profileId, daysBack = 7 }: MobileHeatmapProps): React.ReactElement {
  const { stats, totalVolume, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-300 border-t-white" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg bg-red-900/50 p-4 text-center">
        <p className="font-medium text-red-200">Failed to load muscle data</p>
        <p className="mt-1 text-sm text-red-300/70">{error.message}</p>
      </div>
    );
  }

  // Success state - placeholder for Phase 3 visualization
  const musclesWithVolume = stats.filter((s) => s.volume > 0).length;

  return (
    <div className="rounded-lg bg-primary-800 p-4">
      <h3 className="mb-2 text-lg font-semibold text-white">This Week</h3>
      <p className="text-primary-200">
        Loaded {stats.length} muscles ({musclesWithVolume} with volume)
      </p>
      <p className="mt-1 text-sm text-primary-300">Total sets: {totalVolume}</p>
      <p className="mt-2 text-xs text-primary-400">Mobile visualization coming in Phase 3</p>
    </div>
  );
}
