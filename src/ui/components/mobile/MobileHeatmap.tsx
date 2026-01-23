/**
 * Mobile Heatmap Component
 *
 * Mobile-specific muscle volume visualization. Uses shared data hooks
 * from @db/hooks (ARCH-02 - no data duplication).
 *
 * Renders a single body view (front/back) with 3D flip animation
 * and session-persisted view state (TOGGLE-01, TOGGLE-03).
 */

import { useMemo, useId, useState, useCallback, useEffect } from 'react';
import Model from 'react-body-highlighter';
import type { IExerciseData, Muscle } from 'react-body-highlighter';
import { useScientificMuscleVolume } from '@db/hooks';
import { useEffectiveMuscleGroupConfig } from '@db/hooks/useMuscleGroups';
import type { ScientificMuscle } from '@core/taxonomy';
import { getVolumeColor, getNoTargetColor } from '@core/color-scale';
import { useSessionState } from '@ui/hooks/use-session-state';
import { MuscleDetailModal } from './MuscleDetailModal';

interface MobileHeatmapProps {
  profileId: string | null;
  daysBack?: number;
}

/**
 * Body regions for anatomical grouping.
 * - Back split into: traps, lats, lowerBack (erectors)
 * - Hip flexors/adductors combined into hipFlexors region
 */
type BodyRegion =
  | 'chest'
  | 'shoulders'
  | 'traps'
  | 'lats'
  | 'lowerBack'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'hipFlexors'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

export type { BodyRegion };

/**
 * Mapping from body regions to scientific muscles.
 * - primary: muscles that affect this region's color and are shown first in modal
 * - related: muscles shown below a separator in modal (don't affect color)
 */
const REGION_TO_MUSCLES: Record<BodyRegion, { primary: ScientificMuscle[]; related?: ScientificMuscle[] }> = {
  chest: { primary: ['Pectoralis Major (Sternal)', 'Pectoralis Major (Clavicular)'] },
  shoulders: { primary: ['Anterior Deltoid', 'Lateral Deltoid', 'Posterior Deltoid'] },
  traps: { primary: ['Upper Trapezius', 'Middle Trapezius', 'Lower Trapezius'] },
  lats: { primary: ['Latissimus Dorsi'] },
  lowerBack: { primary: ['Erector Spinae'] },
  biceps: { primary: ['Biceps Brachii'] },
  triceps: { primary: ['Triceps (Lateral/Medial)', 'Triceps (Long Head)'] },
  forearms: { primary: ['Forearm Flexors', 'Forearm Extensors'] },
  abs: { primary: ['Rectus Abdominis'], related: ['Erector Spinae'] },
  obliques: { primary: ['Obliques'], related: ['Latissimus Dorsi'] },
  hipFlexors: { primary: ['Hip Flexors', 'Adductors'], related: ['Gluteus Maximus', 'Gluteus Medius'] },
  quads: { primary: ['Quadriceps (Vasti)', 'Quadriceps (RF)'], related: ['Hamstrings'] },
  hamstrings: { primary: ['Hamstrings'] },
  glutes: { primary: ['Gluteus Maximus', 'Gluteus Medius'] },
  calves: { primary: ['Gastrocnemius', 'Soleus'] },
};

/**
 * Map body regions to react-body-highlighter muscle slugs.
 * Note: Library only has trapezius in back view, not front.
 */
const REGION_TO_LIBRARY_MUSCLES: Record<BodyRegion, { front: string[]; back: string[] }> = {
  chest: { front: ['chest'], back: [] },
  shoulders: { front: ['front-deltoids'], back: ['back-deltoids'] },
  traps: { front: ['neck'], back: ['trapezius'] }, // neck region shows upper traps from front
  lats: { front: [], back: ['upper-back'] },
  lowerBack: { front: [], back: ['lower-back'] },
  biceps: { front: ['biceps'], back: [] },
  triceps: { front: ['triceps'], back: ['triceps'] },
  forearms: { front: ['forearm'], back: ['forearm'] },
  abs: { front: ['abs'], back: [] },
  obliques: { front: ['obliques'], back: [] },
  hipFlexors: { front: ['adductor', 'abductors'], back: [] }, // Hip flexor area = adductor region in library
  quads: { front: ['quadriceps'], back: [] },
  hamstrings: { front: [], back: ['hamstring'] },
  glutes: { front: [], back: ['gluteal'] },
  calves: { front: ['calves'], back: ['calves'] },
};

/**
 * Convert a percentage (0-100) into a discrete frequency level used for body highlighting.
 */
function getFrequencyLevel(percentage: number): number {
  if (percentage === 0) return 0;
  if (percentage < 25) return 1;
  if (percentage < 50) return 2;
  if (percentage < 75) return 3;
  if (percentage < 100) return 4;
  return 5;
}

/**
 * Color array for muscle highlighting based on volume percentage.
 * Uses centralized color scale from @core/color-scale.
 */
const HIGHLIGHTED_COLORS = [
  getVolumeColor(12.5), // frequency 1: 0-25%
  getVolumeColor(37.5), // frequency 2: 25-50%
  getVolumeColor(62.5), // frequency 3: 50-75%
  getVolumeColor(87.5), // frequency 4: 75-100%
  getVolumeColor(100), // frequency 5: 100%+
  'rgb(245, 158, 11)', // frequency 6: selected state (amber highlight)
  'rgb(255, 255, 255)', // frequency 7: tap animation (white flash)
  'rgb(55, 65, 81)', // frequency 8: hidden muscle (gray - primary-700 equivalent)
];

interface MuscleStats {
  muscle: ScientificMuscle;
  volume: number;
  goal: number;
  percentage: number;
}

/**
 * Mobile heatmap component.
 * Displays a single body view with 3D flip animation between front and back.
 */
export function MobileHeatmap({ profileId, daysBack = 7 }: MobileHeatmapProps): React.ReactElement {
  const { stats, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);
  const { config } = useEffectiveMuscleGroupConfig(profileId);
  const [view, setView] = useSessionState<'front' | 'back'>(
    'scientificmuscle_heatmap_view',
    'front'
  );
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);
  const [tappedRegion, setTappedRegion] = useState<BodyRegion | null>(null);

  // Auto-clear tappedRegion after animation duration (prevents memory leak from setTimeout)
  useEffect(() => {
    if (tappedRegion !== null) {
      const timer = setTimeout(() => setTappedRegion(null), 150);
      return () => clearTimeout(timer);
    }
  }, [tappedRegion]);

  // Create set of hidden muscles for quick lookup
  const hiddenMuscles = useMemo(
    () => new Set<ScientificMuscle>(config.hidden),
    [config.hidden]
  );

  // Map stats to muscle-level data
  const muscleStats = useMemo((): MuscleStats[] => {
    return stats.map((s: { name: string; volume: number; goal: number; percentage: number }) => ({
      muscle: s.name as ScientificMuscle,
      volume: s.volume,
      goal: s.goal,
      percentage: s.percentage,
    }));
  }, [stats]);

  // Create stats map for quick lookup
  const statsMap = useMemo(() => {
    return new Map(muscleStats.map((s: MuscleStats) => [s.muscle, s]));
  }, [muscleStats]);

  // Calculate regional stats for body highlighting (only primary muscles affect color)
  // Regions with all primary muscles hidden are marked with isHidden: true
  const regionStats = useMemo(() => {
    const regions = new Map<BodyRegion, { percentage: number; isHidden: boolean }>();

    for (const [region, { primary }] of Object.entries(REGION_TO_MUSCLES)) {
      // Check if all primary muscles in this region are hidden
      const visibleMuscles = primary.filter((m) => !hiddenMuscles.has(m));
      const isHidden = visibleMuscles.length === 0;

      if (isHidden) {
        // All muscles in this region are hidden - use special flag
        regions.set(region as BodyRegion, { percentage: 0, isHidden: true });
      } else {
        // Calculate stats based on visible muscles only
        const muscleData = visibleMuscles
          .map((m) => statsMap.get(m))
          .filter((s): s is MuscleStats => s !== undefined);

        const totalVolume = muscleData.reduce((sum, s) => sum + s.volume, 0);
        const totalGoal = muscleData.reduce((sum, s) => sum + s.goal, 0);
        const percentage = totalGoal > 0 ? (totalVolume / totalGoal) * 100 : 0;

        regions.set(region as BodyRegion, { percentage, isHidden: false });
      }
    }

    return regions;
  }, [statsMap, hiddenMuscles]);

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

  // No data state
  const hasData = muscleStats.some((s) => s.volume > 0);
  if (!hasData) {
    return (
      <div className="rounded-lg bg-primary-800/50 p-6 text-center">
        <p className="text-primary-200">No workout data this week</p>
        <p className="mt-1 text-sm text-primary-400">
          Complete a workout to see your muscle heatmap
        </p>
      </div>
    );
  }

  // Toggle view handler - clear selection when flipping (auto-close modal)
  const toggleView = (): void => {
    setSelectedRegion(null);
    setView(view === 'front' ? 'back' : 'front');
  };

  // Render 3D flip body view
  return (
    <div className="relative min-h-[420px] max-w-md mx-auto">
      {/* 3D Scene Container - perspective on parent */}
      <div
        className="relative mx-auto"
        style={{
          perspective: '1000px',
          maxWidth: '18rem',
        }}
      >
        {/* Rotating Card */}
        <div
          className="relative w-full"
          style={{
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transformStyle: 'preserve-3d',
            transform: view === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Face (Anterior) */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <MobileBodyHighlighter
              type="anterior"
              regionStats={regionStats}
              selectedRegion={selectedRegion}
              tappedRegion={tappedRegion}
              onRegionClick={setSelectedRegion}
              onTap={setTappedRegion}
            />
          </div>

          {/* Back Face (Posterior) - pre-rotated 180deg */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <MobileBodyHighlighter
              type="posterior"
              regionStats={regionStats}
              selectedRegion={selectedRegion}
              tappedRegion={tappedRegion}
              onRegionClick={setSelectedRegion}
              onTap={setTappedRegion}
            />
          </div>
        </div>
      </div>

      {/* Subtle Toggle Button - TOGGLE-02: visually quiet */}
      <button
        onClick={toggleView}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-full text-xs text-primary-400 bg-primary-800/40 backdrop-blur-sm border border-primary-700/20 transition-colors duration-150 active:bg-primary-700/50"
        aria-label={`Show ${view === 'front' ? 'back' : 'front'} view`}
      >
        <span className="flex items-center gap-1.5">
          {/* Inline rotate icon SVG */}
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{view === 'front' ? 'Back' : 'Front'}</span>
        </span>
      </button>

      {/* Muscle Detail Modal */}
      <MuscleDetailModal
        isOpen={selectedRegion !== null}
        onClose={() => setSelectedRegion(null)}
        region={selectedRegion}
        primaryMuscles={selectedRegion ? REGION_TO_MUSCLES[selectedRegion].primary : []}
        relatedMuscles={selectedRegion ? REGION_TO_MUSCLES[selectedRegion].related : undefined}
        profileId={profileId}
        daysBack={daysBack}
      />
    </div>
  );
}

/**
 * Render an anterior or posterior body model with regions colored by their aggregated percentage.
 */
function MobileBodyHighlighter({
  type,
  regionStats,
  selectedRegion,
  tappedRegion,
  onRegionClick,
  onTap,
}: {
  type: 'anterior' | 'posterior';
  regionStats: Map<BodyRegion, { percentage: number; isHidden: boolean }>;
  selectedRegion: BodyRegion | null;
  tappedRegion: BodyRegion | null;
  onRegionClick: (region: BodyRegion | null) => void;
  onTap: (region: BodyRegion | null) => void;
}): React.ReactElement {
  // Generate unique ID for scoped styles
  const scopeId = useId().replace(/:/g, '');

  // Create exercise data for the library
  const exerciseData = useMemo((): IExerciseData[] => {
    const data: IExerciseData[] = [];
    const viewKey = type === 'anterior' ? 'front' : 'back';

    regionStats.forEach((stats, region) => {
      const muscles = REGION_TO_LIBRARY_MUSCLES[region][viewKey];

      if (muscles.length > 0) {
        // Priority: hidden (8) > tap animation (7) > selected (6) > volume-based color
        // Note: hidden regions can still be tapped/selected for visual feedback
        const frequency = stats.isHidden
          ? 8 // Hidden muscle (gray)
          : tappedRegion === region
            ? 7 // Tap animation (highest priority - white flash)
            : selectedRegion === region
              ? 6 // Selected state (amber highlight)
              : getFrequencyLevel(stats.percentage);

        muscles.forEach((muscle) => {
          data.push({
            name: region,
            muscles: [muscle as Muscle],
            frequency,
          });
        });
      }
    });

    return data;
  }, [type, regionStats, selectedRegion, tappedRegion]);

  // Use module-level constant for highlight colors
  const highlightedColors = HIGHLIGHTED_COLORS;

  // Map library muscle slugs back to regions
  const muscleToRegion = useMemo(() => {
    const map = new Map<string, BodyRegion>();
    Object.entries(REGION_TO_LIBRARY_MUSCLES).forEach(([region, views]) => {
      [...views.front, ...views.back].forEach((muscle) => {
        map.set(muscle, region as BodyRegion);
      });
    });
    return map;
  }, []);

  // Handle muscle clicks from library's onClick callback
  // IMuscleStats: { muscle: Muscle, data: { exercises: string[], frequency: number } }
  // data.exercises contains the 'name' values we passed in IExerciseData (which are region names)
  const handleMuscleClick = useCallback(
    (stats: { muscle: string; data: { exercises: string[]; frequency: number } }) => {
      // Get region from our data (we set name = region when creating exerciseData)
      const region = stats.data?.exercises?.[0] as BodyRegion;
      if (!region) {
        // Fallback: try to map the library muscle slug to a region
        const mappedRegion = muscleToRegion.get(stats.muscle);
        if (mappedRegion) {
          // Trigger bilateral tap animation (both views will flash)
          // Auto-cleared by useEffect after 150ms
          onTap(mappedRegion);
          onRegionClick(selectedRegion === mappedRegion ? null : mappedRegion);
        }
        return;
      }

      // Trigger bilateral tap animation (both views will flash)
      // Auto-cleared by useEffect after 150ms
      onTap(region);
      onRegionClick(selectedRegion === region ? null : region);
    },
    [muscleToRegion, onRegionClick, onTap, selectedRegion]
  );

  return (
    <>
      <div className="flex justify-center py-2" data-mobile-heatmap={scopeId}>
        <Model
          type={type}
          data={exerciseData}
          highlightedColors={highlightedColors}
          bodyColor={getNoTargetColor()}
          onClick={handleMuscleClick}
          style={{
            width: '100%',
            maxWidth: '18rem',
          }}
          svgStyle={{
            filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.15))',
          }}
        />
      </div>

      {/* Scoped styles for muscle regions - optimized for mobile touch */}
      <style>{`
        [data-mobile-heatmap="${scopeId}"] .rbh polygon {
          transition: all 0.15s ease;
          stroke: rgb(24, 24, 27);
          stroke-width: 0.5px;
          cursor: pointer;
        }

        [data-mobile-heatmap="${scopeId}"] .rbh polygon:active {
          filter: brightness(1.2);
          stroke: rgba(245, 158, 11, 0.5);
          stroke-width: 0.75px;
        }

        @media (hover: hover) {
          [data-mobile-heatmap="${scopeId}"] .rbh polygon:hover {
            filter: brightness(1.2);
            stroke: rgba(245, 158, 11, 0.5);
            stroke-width: 0.75px;
          }
        }

        ${selectedRegion && REGION_TO_LIBRARY_MUSCLES[selectedRegion][type === 'anterior' ? 'front' : 'back'].length > 0 ? `
        /* Selected region highlighting - white stroke when modal open */
        ${REGION_TO_LIBRARY_MUSCLES[selectedRegion][type === 'anterior' ? 'front' : 'back']
          .map((muscle) => `[data-mobile-heatmap="${scopeId}"] .rbh polygon#${muscle}`)
          .join(',\n        ')} {
          stroke: white;
          stroke-width: 2px;
          stroke-opacity: 0.8;
        }
        ` : ''}
      `}</style>
    </>
  );
}
