/**
 * Muscle Detail Panel Component
 *
 * Floating panel that displays individual muscle details for a tapped body region.
 * Shows primary muscles (affect region color) and optionally related muscles
 * (shown below separator, don't affect color).
 *
 * Features:
 * - Non-blocking: allows clicking other muscles while open
 * - Compact width for mobile
 * - Positioned at bottom of viewport (above navigation)
 * - Swipe down to dismiss
 * - Separator between primary and related muscles
 */

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useScientificMuscleVolume, type VolumeStatItem } from '@db/hooks/useVolumeStats';
import { getVolumeColor } from '@core/color-scale';
import type { ScientificMuscle } from '@core/taxonomy';
import type { BodyRegion } from './MobileHeatmap';

interface MuscleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  region: BodyRegion | null;
  primaryMuscles: ScientificMuscle[];
  relatedMuscles?: ScientificMuscle[];
  profileId: string | null;
  daysBack?: number;
}

interface MuscleData {
  name: string;
  volume: number;
  goal: number;
  percentage: number;
}

/**
 * Format volume value for display.
 * Shows whole numbers without decimals, fractions with one decimal place.
 */
function formatVolume(volume: number): string {
  return volume % 1 === 0 ? volume.toString() : volume.toFixed(1);
}

/**
 * Convert muscle names to display data with stats
 */
function getMuscleData(
  muscles: ScientificMuscle[],
  statsMap: Map<string, VolumeStatItem>
): MuscleData[] {
  return muscles
    .map((muscle) => {
      const muscleStats = statsMap.get(muscle);
      return {
        name: muscle,
        volume: muscleStats?.volume ?? 0,
        goal: muscleStats?.goal ?? 0,
        percentage: muscleStats?.percentage ?? 0,
      };
    })
    .filter((m) => m.goal > 0 || m.volume > 0);
}

/**
 * Render a single muscle row
 */
function MuscleRow({ muscle }: { muscle: MuscleData }): React.ReactElement {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-primary-200 truncate">{muscle.name}</span>
        <span className="text-xs text-primary-400 font-mono flex-shrink-0">
          {formatVolume(muscle.volume)}/{formatVolume(muscle.goal)}
        </span>
      </div>
      <div className="w-full h-0.5 overflow-hidden rounded-full bg-primary-900">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(muscle.percentage, 100)}%`,
            backgroundColor: getVolumeColor(muscle.percentage),
          }}
        />
      </div>
    </div>
  );
}

/**
 * Floating panel displaying muscle details for a body region.
 * Non-blocking - allows interaction with body diagram while open.
 */
export function MuscleDetailModal({
  isOpen,
  onClose,
  region,
  primaryMuscles,
  relatedMuscles,
  profileId,
  daysBack = 7,
}: MuscleDetailModalProps): React.ReactElement | null {
  // Fetch volume data for all muscles
  const { stats } = useScientificMuscleVolume(profileId, daysBack);

  // Create stats map for O(1) muscle lookup
  const statsMap = useMemo(() => {
    return new Map<string, VolumeStatItem>(stats.map((s) => [s.name, s]));
  }, [stats]);

  // Get data for primary and related muscles
  const primaryData = useMemo(
    () => getMuscleData(primaryMuscles, statsMap),
    [primaryMuscles, statsMap]
  );

  const relatedData = useMemo(
    () => (relatedMuscles ? getMuscleData(relatedMuscles, statsMap) : []),
    [relatedMuscles, statsMap]
  );

  // Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Swipe-down dismiss state
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e: React.TouchEvent): void => {
    const touch = e.touches[0];
    if (touch) {
      setTouchStart(touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent): void => {
    const touch = e.changedTouches[0];
    if (!touch) return;

    const touchEnd = touch.clientY;
    const deltaY = touchEnd - touchStart;

    // Downward swipe threshold: 50px
    if (deltaY > 50) {
      onClose();
    }
  };

  // Don't render if modal is closed or no data to show
  if (!isOpen || region === null || primaryMuscles.length === 0) {
    return null;
  }

  // Format region name for display (camelCase to Title Case)
  const formatRegionName = (r: string): string => {
    return r.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  };

  return createPortal(
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-56 bg-primary-800 rounded-lg shadow-xl border border-primary-700 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with region name and X button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-primary-700">
        <span className="text-xs font-medium text-primary-300">{formatRegionName(region)}</span>
        <button
          onClick={onClose}
          className="min-w-[32px] min-h-[32px] flex items-center justify-center text-primary-400 hover:text-primary-200 transition-colors -mr-1"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Muscle List - compact spacing */}
      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
        {/* Primary muscles */}
        {primaryData.map((muscle) => (
          <MuscleRow key={muscle.name} muscle={muscle} />
        ))}

        {/* Separator and related muscles */}
        {relatedData.length > 0 && (
          <>
            <div className="border-t border-primary-700 my-2" />
            {relatedData.map((muscle) => (
              <MuscleRow key={muscle.name} muscle={muscle} />
            ))}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
