/**
 * Muscle Detail Modal Component
 *
 * Portal-based modal that displays individual muscle details for a tapped body region.
 * Shows muscles within the region with name, current/goal ratio, and progress bar.
 *
 * Features:
 * - React portal rendering at document.body (avoids z-index stacking issues)
 * - Body scroll locking when open
 * - Fade-in animation
 * - Compact spacing for modal context
 *
 * Pattern references:
 * - Portal: AutoMatchReviewModal pattern
 * - Data: useScientificMuscleVolume for muscle-level volume
 * - Layout: MobileMuscleList two-line pattern (adapted for compact modal)
 * - Colors: @core/color-scale for volume-to-color mapping
 */

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useScientificMuscleVolume, type VolumeStatItem } from '@db/hooks/useVolumeStats';
import { getVolumeColor } from '@core/color-scale';
import type { ScientificMuscle } from '@core/taxonomy';

/**
 * Body regions for anatomical grouping
 * (Copied from MobileHeatmap - not exported there)
 */
type BodyRegion =
  | 'chest'
  | 'shoulders'
  | 'upperBack'
  | 'lowerBack'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'adductors';

interface MuscleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  region: BodyRegion | null;
  muscles: ScientificMuscle[];
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
 * Modal component displaying muscle details for a body region.
 * Rendered via React portal to escape stacking context.
 */
export function MuscleDetailModal({
  isOpen,
  onClose,
  region,
  muscles,
  profileId,
  daysBack = 7,
}: MuscleDetailModalProps): React.ReactElement | null {
  // Fetch volume data for all muscles
  const { stats } = useScientificMuscleVolume(profileId, daysBack);

  // Create stats map for O(1) muscle lookup
  const statsMap = useMemo(() => {
    return new Map<string, VolumeStatItem>(stats.map((s) => [s.name, s]));
  }, [stats]);

  // Filter stats to only muscles in the provided array
  const filteredMuscles = useMemo(() => {
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
      .filter((m) => m.goal > 0 || m.volume > 0); // Only show muscles with data
  }, [muscles, statsMap]);

  // Lock body scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

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

  // Backdrop click dismiss
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render if modal is closed or no data to show
  if (!isOpen || region === null || muscles.length === 0) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={handleBackdropClick}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Modal Card - with swipe-down dismiss handlers */}
      <div
        className="relative max-w-lg w-full bg-primary-800 rounded-lg overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* X button - top-right corner with 44x44 touch target */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-primary-400 hover:text-primary-200 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Muscle List - compact spacing (space-y-2), with padding for X button */}
        <div className="p-4 pt-12 space-y-2 max-h-[70vh] overflow-y-auto">
          {filteredMuscles.map((muscle) => (
            <div key={muscle.name} className="space-y-1">
              {/* Line 1: Muscle name (left) + volume/goal ratio (right) */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-200">{muscle.name}</span>
                <span className="text-xs text-primary-400 font-mono">
                  {formatVolume(muscle.volume)}/{formatVolume(muscle.goal)}
                </span>
              </div>

              {/* Line 2: Progress bar - 4px tall (h-1), full width */}
              <div className="w-full h-1 overflow-hidden rounded-full bg-primary-900">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(muscle.percentage, 100)}%`,
                    backgroundColor: getVolumeColor(muscle.percentage),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
