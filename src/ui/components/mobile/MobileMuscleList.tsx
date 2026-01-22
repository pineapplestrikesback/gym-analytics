/**
 * Mobile Muscle List Component
 *
 * Collapsible muscle group list for mobile viewing.
 * Displays 26 muscles organized into 7 anatomical groups.
 *
 * Pattern: useState<Set<string>> for expanded state (from WeeklyGoalEditor)
 * Touch: :active pseudo-class for feedback (MOBILE-02)
 */

import { useState, useMemo } from 'react';
import { UI_MUSCLE_GROUPS } from '@core/taxonomy';
import { useScientificMuscleVolume, type VolumeStatItem } from '@db/hooks/useVolumeStats';
import { getVolumeColor } from '@core/color-scale';

interface MobileMuscleListProps {
  profileId: string | null;
  daysBack?: number;
}

/**
 * Format volume value for display.
 * Shows whole numbers without decimals, fractions with one decimal place.
 */
function formatVolume(volume: number): string {
  return volume % 1 === 0 ? volume.toString() : volume.toFixed(1);
}

/**
 * Mobile muscle list with collapsible groups.
 * First group starts expanded for mobile-optimized viewing.
 */
export function MobileMuscleList({
  profileId,
  daysBack = 7,
}: MobileMuscleListProps): React.ReactElement {
  // Fetch volume data for all muscles
  const { stats, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);

  // Create stats map for quick lookup by muscle name
  const statsMap = useMemo(() => {
    return new Map<string, VolumeStatItem>(stats.map((s) => [s.name, s]));
  }, [stats]);

  // Calculate group summaries for header display
  const groupSummaries = useMemo(() => {
    const summaries = new Map<
      string,
      { totalVolume: number; totalGoal: number; percentage: number }
    >();

    for (const group of UI_MUSCLE_GROUPS) {
      let totalVolume = 0;
      let totalGoal = 0;

      for (const muscle of group.muscles) {
        const muscleStats = statsMap.get(muscle);
        totalVolume += muscleStats?.volume ?? 0;
        totalGoal += muscleStats?.goal ?? 0;
      }

      const percentage = totalGoal > 0 ? (totalVolume / totalGoal) * 100 : 0;
      summaries.set(group.name, { totalVolume, totalGoal, percentage });
    }

    return summaries;
  }, [statsMap]);

  // Start with first group expanded (mobile-optimized: less initial scrolling)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const firstGroup = UI_MUSCLE_GROUPS[0];
    return firstGroup ? new Set([firstGroup.name]) : new Set();
  });

  const toggleGroup = (groupName: string): void => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

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

  return (
    <div className="space-y-2">
      {UI_MUSCLE_GROUPS.map((group) => {
        const isExpanded = expandedGroups.has(group.name);
        const summary = groupSummaries.get(group.name);
        const groupPercentage = summary?.percentage ?? 0;
        const groupVolume = summary?.totalVolume ?? 0;

        return (
          <div
            key={group.name}
            className="rounded-lg overflow-hidden border border-primary-700"
          >
            {/* Group header - tap to toggle */}
            <button
              onClick={() => toggleGroup(group.name)}
              className="w-full flex items-center gap-3 p-3 bg-primary-800 transition-colors active:bg-primary-700"
            >
              {/* Chevron icon - rotates when expanded */}
              <svg
                className={`w-4 h-4 text-primary-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>

              {/* Group name */}
              <span className="font-medium text-white">{group.name}</span>

              {/* Group summary - total sets with color indicating progress */}
              <div className="ml-auto flex items-center gap-2">
                <span
                  className="font-mono text-sm"
                  style={{ color: getVolumeColor(groupPercentage) }}
                >
                  {formatVolume(groupVolume)}
                </span>
                <span className="text-primary-400 text-xs">sets</span>
              </div>
            </button>

            {/* Group content - conditionally rendered */}
            {isExpanded && (
              <div className="bg-primary-900 p-3 space-y-1">
                {group.muscles.map((muscle) => {
                  const muscleStats = statsMap.get(muscle);
                  const volume = muscleStats?.volume ?? 0;
                  const percentage = muscleStats?.percentage ?? 0;

                  return (
                    <div key={muscle} className="flex items-center gap-3 py-2">
                      {/* Muscle name - flex-1 for overflow handling */}
                      <span className="flex-1 text-sm text-primary-200 truncate">
                        {muscle}
                      </span>

                      {/* Progress bar container - fixed width for consistency */}
                      <div className="w-24 h-2 overflow-hidden rounded-full bg-primary-800">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: getVolumeColor(percentage),
                          }}
                        />
                      </div>

                      {/* Numeric value - secondary emphasis (LIST-04) */}
                      <span className="w-12 text-right text-xs text-primary-400 font-mono">
                        {formatVolume(volume)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
