/**
 * Mobile Muscle List Component
 *
 * Collapsible muscle group list for mobile viewing.
 * Displays 26 muscles organized into custom user groups.
 * Reads group configuration from profile via useEffectiveMuscleGroupConfig.
 *
 * Pattern: useState<Set<string>> for expanded state (from WeeklyGoalEditor)
 * Touch: :active pseudo-class for feedback (MOBILE-02)
 *
 * Group behavior:
 * - Ungrouped muscles render at top as flat list (no accordion)
 * - Custom groups render in user-defined order with accordion
 * - Hidden muscles excluded entirely from display
 */

import { useState, useMemo, useEffect } from 'react';
import { useScientificMuscleVolume, type VolumeStatItem, type ViewMode } from '@db/hooks/useVolumeStats';
import { useEffectiveMuscleGroupConfig } from '@db/hooks/useMuscleGroups';
import { getVolumeColor } from '@core/color-scale';
import type { ScientificMuscle } from '@core/taxonomy';

interface MobileMuscleListProps {
  profileId: string | null;
  daysBack?: number;
  viewMode?: ViewMode;
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
  viewMode,
}: MobileMuscleListProps): React.ReactElement {
  // Fetch volume data for all muscles
  // Use viewMode if provided, otherwise fall back to daysBack
  const volumeArg = viewMode ?? daysBack;
  const { stats, isLoading: volumeLoading, error } = useScientificMuscleVolume(profileId, volumeArg);

  // Fetch custom group configuration
  const { config, isLoading: configLoading } = useEffectiveMuscleGroupConfig(profileId);

  // Combined loading state
  const isLoading = volumeLoading || configLoading;

  // Create stats map for quick lookup by muscle name
  const statsMap = useMemo(() => {
    return new Map<string, VolumeStatItem>(stats.map((s) => [s.name, s]));
  }, [stats]);

  // Track expanded groups by group ID
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Reset expanded state when config changes (expand first group by default)
  useEffect(() => {
    const firstGroup = config.groups[0];
    if (firstGroup) {
      setExpandedGroups(new Set([firstGroup.id]));
    } else {
      setExpandedGroups(new Set());
    }
  }, [config.groups]);

  const toggleGroup = (groupId: string): void => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
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

  // Helper to render a single muscle row
  const renderMuscleRow = (muscle: ScientificMuscle): React.ReactElement => {
    const muscleStats = statsMap.get(muscle);
    const volume = muscleStats?.volume ?? 0;
    const goal = muscleStats?.goal ?? 0;
    const percentage = muscleStats?.percentage ?? 0;

    return (
      <div key={muscle} className="rounded-md -mx-1 px-1 py-1">
        <div className="space-y-1">
          {/* Line 1: Muscle name (left) + volume/goal ratio (right) */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-200">{muscle}</span>
            <span className="text-xs text-primary-400 font-mono">
              {formatVolume(volume)}/{formatVolume(goal)}
            </span>
          </div>

          {/* Line 2: Progress bar - 4px tall (h-1), full width */}
          <div className="w-full h-1 overflow-hidden rounded-full bg-primary-800">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: getVolumeColor(percentage),
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Ungrouped muscles - flat list at top (no accordion) */}
      {config.ungrouped.length > 0 && (
        <div className="rounded-lg overflow-hidden border border-primary-700 bg-primary-900 p-3 space-y-3">
          {config.ungrouped.map((muscle) => renderMuscleRow(muscle))}
        </div>
      )}

      {/* Custom groups - in user-defined order */}
      {config.groups.map((group) => {
        const isExpanded = expandedGroups.has(group.id);

        return (
          <div
            key={group.id}
            className="rounded-lg overflow-hidden border border-primary-700"
          >
            {/* Group header - tap to toggle */}
            <button
              onClick={() => toggleGroup(group.id)}
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
            </button>

            {/* Group content - conditionally rendered */}
            {isExpanded && (
              <div className="bg-primary-900 p-3 space-y-3">
                {group.muscles.map((muscle) => renderMuscleRow(muscle))}
              </div>
            )}
          </div>
        );
      })}

      {/* Hidden muscles (config.hidden) are intentionally NOT rendered */}
    </div>
  );
}
