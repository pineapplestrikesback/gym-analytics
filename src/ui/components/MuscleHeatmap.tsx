/**
 * MuscleHeatmap Component - Mobile Redesign
 * Split anatomical view showing front/back simultaneously with floating muscle cards
 */

import React, { useMemo, useState, useEffect, useId } from 'react';
import { useScientificMuscleVolume } from '@db/hooks/useVolumeStats';
import type { ScientificMuscle } from '@core/taxonomy';
import Model from 'react-body-highlighter';
import type { IMuscleStats, IExerciseData, Muscle } from 'react-body-highlighter';

interface MuscleHeatmapProps {
  profileId: string | null;
  daysBack?: number;
}

/**
 * Body regions for anatomical grouping
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

/**
 * Mapping from body regions to scientific muscles
 */
const REGION_TO_MUSCLES: Record<BodyRegion, ScientificMuscle[]> = {
  chest: ['Pectoralis Major (Sternal)', 'Pectoralis Major (Clavicular)'],
  shoulders: ['Anterior Deltoid', 'Lateral Deltoid', 'Posterior Deltoid'],
  upperBack: ['Latissimus Dorsi', 'Middle Trapezius', 'Upper Trapezius'],
  lowerBack: ['Lower Trapezius', 'Erector Spinae'],
  biceps: ['Biceps Brachii'],
  triceps: ['Triceps (Lateral/Medial)', 'Triceps (Long Head)'],
  forearms: ['Forearm Flexors', 'Forearm Extensors'],
  abs: ['Rectus Abdominis', 'Hip Flexors'],
  obliques: ['Obliques'],
  quads: ['Quadriceps (Vasti)', 'Quadriceps (RF)'],
  hamstrings: ['Hamstrings'],
  glutes: ['Gluteus Maximus', 'Gluteus Medius'],
  calves: ['Gastrocnemius', 'Soleus'],
  adductors: ['Adductors'],
};

/**
 * Abbreviated muscle names for compact display
 */
const MUSCLE_ABBREVIATIONS: Record<ScientificMuscle, string> = {
  'Pectoralis Major (Sternal)': 'Pec (St)',
  'Pectoralis Major (Clavicular)': 'Pec (Cl)',
  'Anterior Deltoid': 'Ant Delt',
  'Lateral Deltoid': 'Lat Delt',
  'Posterior Deltoid': 'Post Delt',
  'Latissimus Dorsi': 'Lats',
  'Middle Trapezius': 'Mid Trap',
  'Upper Trapezius': 'Up Trap',
  'Lower Trapezius': 'Low Trap',
  'Erector Spinae': 'Erectors',
  'Biceps Brachii': 'Biceps',
  'Triceps (Lateral/Medial)': 'Tri (L/M)',
  'Triceps (Long Head)': 'Tri (Long)',
  'Forearm Flexors': 'Forearm Fl',
  'Forearm Extensors': 'Forearm Ex',
  'Rectus Abdominis': 'Abs',
  'Hip Flexors': 'Hip Flex',
  'Obliques': 'Obliques',
  'Quadriceps (Vasti)': 'Quads (V)',
  'Quadriceps (RF)': 'Quads (RF)',
  'Hamstrings': 'Hams',
  'Gluteus Maximus': 'Glute Max',
  'Gluteus Medius': 'Glute Med',
  'Gastrocnemius': 'Gastroc',
  'Soleus': 'Soleus',
  'Adductors': 'Adductors',
};

/**
 * Map body regions to react-body-highlighter muscle slugs
 */
const REGION_TO_LIBRARY_MUSCLES: Record<BodyRegion, { front: string[]; back: string[] }> = {
  chest: { front: ['chest'], back: [] },
  shoulders: { front: ['front-deltoids'], back: ['back-deltoids'] },
  upperBack: { front: [], back: ['trapezius', 'upper-back'] },
  lowerBack: { front: [], back: ['lower-back'] },
  biceps: { front: ['biceps'], back: [] },
  triceps: { front: [], back: ['triceps'] },
  forearms: { front: ['forearm'], back: ['forearm'] },
  abs: { front: ['abs'], back: [] },
  obliques: { front: ['obliques'], back: [] },
  quads: { front: ['quadriceps'], back: [] },
  hamstrings: { front: [], back: ['hamstring'] },
  glutes: { front: [], back: ['gluteal'] },
  calves: { front: [], back: ['calves'] },
  adductors: { front: ['adductor'], back: [] },
};

/**
 * Leader line offset constants (based on card dimensions)
 */
const LEADER_LINE_OFFSETS = {
  mobile: { x: 9, y: 3 },    // Offset for 60px wide cards
  desktop: { x: 7, y: 2.5 }, // Offset for 80px wide cards
} as const;

/**
 * Fixed card positions to prevent overlap
 * Positions are percentages relative to container
 */
const CARD_POSITIONS: Record<
  ScientificMuscle,
  { top: string; left?: string; right?: string; anchorX: number; anchorY: number }
> = {
  // Front - Left column
  'Pectoralis Major (Sternal)': { top: '15%', left: '2%', anchorX: 25, anchorY: 35 },
  'Pectoralis Major (Clavicular)': { top: '21%', left: '2%', anchorX: 25, anchorY: 32 },
  'Anterior Deltoid': { top: '8%', left: '2%', anchorX: 20, anchorY: 25 },
  'Biceps Brachii': { top: '27%', left: '2%', anchorX: 15, anchorY: 40 },
  'Forearm Flexors': { top: '39%', left: '2%', anchorX: 10, anchorY: 55 },
  'Rectus Abdominis': { top: '33%', left: '2%', anchorX: 25, anchorY: 50 },
  'Hip Flexors': { top: '45%', left: '2%', anchorX: 25, anchorY: 58 },
  'Obliques': { top: '51%', left: '2%', anchorX: 20, anchorY: 55 },
  'Quadriceps (Vasti)': { top: '63%', left: '2%', anchorX: 25, anchorY: 70 },
  'Quadriceps (RF)': { top: '69%', left: '2%', anchorX: 25, anchorY: 73 },
  'Adductors': { top: '75%', left: '2%', anchorX: 25, anchorY: 75 },

  // Back - Right column
  'Lateral Deltoid': { top: '2%', right: '2%', anchorX: 75, anchorY: 25 },
  'Posterior Deltoid': { top: '8%', right: '2%', anchorX: 80, anchorY: 28 },
  'Latissimus Dorsi': { top: '21%', right: '2%', anchorX: 75, anchorY: 35 },
  'Middle Trapezius': { top: '14%', right: '2%', anchorX: 75, anchorY: 30 },
  'Upper Trapezius': { top: '27%', right: '2%', anchorX: 75, anchorY: 28 },
  'Lower Trapezius': { top: '33%', right: '2%', anchorX: 75, anchorY: 42 },
  'Erector Spinae': { top: '39%', right: '2%', anchorX: 75, anchorY: 50 },
  'Triceps (Lateral/Medial)': { top: '45%', right: '2%', anchorX: 85, anchorY: 40 },
  'Triceps (Long Head)': { top: '51%', right: '2%', anchorX: 85, anchorY: 43 },
  'Forearm Extensors': { top: '57%', right: '2%', anchorX: 90, anchorY: 55 },
  'Gluteus Maximus': { top: '63%', right: '2%', anchorX: 75, anchorY: 60 },
  'Gluteus Medius': { top: '69%', right: '2%', anchorX: 75, anchorY: 57 },
  'Hamstrings': { top: '75%', right: '2%', anchorX: 75, anchorY: 70 },
  'Gastrocnemius': { top: '81%', right: '2%', anchorX: 75, anchorY: 85 },
  'Soleus': { top: '87%', right: '2%', anchorX: 75, anchorY: 88 },
};

interface MuscleStats {
  muscle: ScientificMuscle;
  volume: number;
  goal: number;
  percentage: number;
}

/**
 * Map a percentage (0–100) to a heatmap color.
 *
 * @param percentage - Percentage value between 0 and 100 used to select the color
 * @returns A CSS `rgb(...)` color string corresponding to the input percentage
 */
function getHeatColor(percentage: number): string {
  if (percentage === 0) return 'rgb(63, 63, 70)'; // primary-500 (dim gray)
  if (percentage < 25) return 'rgb(120, 53, 15)'; // dark orange
  if (percentage < 50) return 'rgb(249, 115, 22)'; // orange
  if (percentage < 75) return 'rgb(251, 191, 36)'; // amber
  if (percentage < 100) return 'rgb(34, 211, 238)'; // cyan
  return 'rgb(6, 182, 212)'; // bright cyan (goal met/exceeded)
}

/**
 * Convert a percentage (0–100) into a discrete frequency level used for body highlighting.
 *
 * @param percentage - A percentage value between 0 and 100
 * @returns An integer frequency level from 0 to 5
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
 * Hook to detect mobile viewport (SSR-safe, mobile-first default)
 *
 * @returns `true` if the viewport width is less than 768 pixels, `false` otherwise.
 */
function useIsMobile(): boolean {
  // Default to true (mobile-first) to prevent hydration mismatch
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Render a responsive split-view muscle heatmap with interactive muscle cards and region highlighting.
 *
 * @param profileId - Profile identifier to fetch muscle stats for; pass `null` to skip data retrieval
 * @param daysBack - Number of days to aggregate stats over (default: 7)
 * @returns A React element containing the split anterior/posterior muscle heatmap with controls
 */
export function MuscleHeatmap({
  profileId,
  daysBack = 7,
}: MuscleHeatmapProps): React.ReactElement {
  const { stats, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);
  const [visibleMuscles, setVisibleMuscles] = useState<Set<ScientificMuscle>>(new Set());
  const isMobile = useIsMobile();

  // Map stats to muscle-level data
  const muscleStats = useMemo((): MuscleStats[] => {
    return stats.map((s: { name: string; volume: number; goal: number; percentage: number }) => ({
      muscle: s.name as ScientificMuscle,
      volume: s.volume,
      goal: s.goal,
      percentage: s.percentage,
    }));
  }, [stats]);

  // Sync visible muscles with actual data from API
  useEffect(() => {
    if (muscleStats.length > 0) {
      setVisibleMuscles(new Set(muscleStats.map((s) => s.muscle)));
    }
  }, [muscleStats]);

  // Create stats map for quick lookup
  const statsMap = useMemo(() => {
    return new Map(muscleStats.map((s: MuscleStats) => [s.muscle, s]));
  }, [muscleStats]);

  // Calculate regional stats for body highlighting
  const regionStatsForBody = useMemo(() => {
    const regions = new Map<BodyRegion, { percentage: number }>();

    for (const [region, muscles] of Object.entries(REGION_TO_MUSCLES)) {
      const muscleData = muscles
        .map((m) => statsMap.get(m as ScientificMuscle))
        .filter((s): s is MuscleStats => s !== undefined);

      const totalVolume = muscleData.reduce((sum, s) => sum + s.volume, 0);
      const totalGoal = muscleData.reduce((sum, s) => sum + s.goal, 0);
      const percentage = totalGoal > 0 ? (totalVolume / totalGoal) * 100 : 0;

      regions.set(region as BodyRegion, { percentage });
    }

    return regions;
  }, [statsMap]);

  // Toggle individual muscle visibility
  const toggleMuscle = (muscle: ScientificMuscle): void => {
    setVisibleMuscles((prev: Set<ScientificMuscle>) => {
      const next = new Set(prev);
      if (next.has(muscle)) {
        next.delete(muscle);
      } else {
        next.add(muscle);
      }
      return next;
    });
  };

  // Toggle all muscles
  const toggleAll = (): void => {
    if (visibleMuscles.size === muscleStats.length && muscleStats.length > 0) {
      // All visible, hide all
      setVisibleMuscles(new Set());
    } else {
      // Some hidden, show all
      setVisibleMuscles(new Set(muscleStats.map((s: MuscleStats) => s.muscle)));
    }
  };

  // Handle region click on body - toggle all muscles in that region
  const handleRegionClick = (region: BodyRegion): void => {
    const muscles = REGION_TO_MUSCLES[region] as ScientificMuscle[];
    const allVisible = muscles.every((m) => visibleMuscles.has(m));

    setVisibleMuscles((prev: Set<ScientificMuscle>) => {
      const next = new Set(prev);
      if (allVisible) {
        // Hide all muscles in region
        muscles.forEach((m) => next.delete(m));
      } else {
        // Show all muscles in region
        muscles.forEach((m) => next.add(m));
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-300 border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 border-2 border-red-500/50 p-4 text-red-400">
        Error loading muscle data: {error.message}
      </div>
    );
  }

  const allVisible = visibleMuscles.size === muscleStats.length && muscleStats.length > 0;
  const toggleLabel = allVisible ? 'Hide All' : 'Show All';

  return (
    <div className="relative">
      {/* Toggle Button */}
      <div className="mb-4 flex justify-center">
        <button
          onClick={toggleAll}
          className="px-6 py-2 rounded-lg bg-primary-800 hover:bg-primary-700 text-white font-medium text-sm transition-colors border border-orange-500/30 hover:border-orange-500/50"
        >
          {toggleLabel}
        </button>
      </div>

      {/* Split Body View with Cards and Leader Lines */}
      <SplitView
        muscleStats={muscleStats}
        visibleMuscles={visibleMuscles}
        regionStats={regionStatsForBody}
        onMuscleClick={toggleMuscle}
        onRegionClick={handleRegionClick}
        desktop={!isMobile}
      />
    </div>
  );
}

/**
 * Unified Split View Component - shows front/back bodies side-by-side with muscle cards
 *
 * @param muscleStats - Array of per-muscle stats used to render cards and leader lines.
 * @param visibleMuscles - Set of muscles that should be shown as cards and connected by leader lines.
 * @param regionStats - Map of body regions to their aggregated percentage used by the body highlighters.
 * @param onMuscleClick - Callback invoked with the muscle when a MuscleCard is clicked.
 * @param onRegionClick - Callback invoked with the region when a region on the body model is clicked.
 * @param desktop - When true, render larger desktop sizing and spacing.
 * @returns The split-view React element containing the body diagrams, leader lines, and muscle cards.
 */
function SplitView({
  muscleStats,
  visibleMuscles,
  regionStats,
  onMuscleClick,
  onRegionClick,
  desktop = false,
}: {
  muscleStats: MuscleStats[];
  visibleMuscles: Set<ScientificMuscle>;
  regionStats: Map<BodyRegion, { percentage: number }>;
  onMuscleClick: (muscle: ScientificMuscle) => void;
  onRegionClick: (region: BodyRegion) => void;
  desktop?: boolean;
}): React.ReactElement {
  const offsets = desktop ? LEADER_LINE_OFFSETS.desktop : LEADER_LINE_OFFSETS.mobile;
  const minHeight = desktop ? 'min-h-[600px]' : 'min-h-[500px]';
  const containerClass = desktop ? `${minHeight} max-w-4xl mx-auto` : minHeight;

  return (
    <div className="relative">
      {/* Split Body Container */}
      <div className={`relative flex justify-center ${containerClass}`}>
        {/* SVG Container for Leader Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ overflow: 'visible' }}
        >
          {muscleStats
            .filter((s) => visibleMuscles.has(s.muscle))
            .map((stat) => {
              const pos = CARD_POSITIONS[stat.muscle];
              if (!pos) return null;

              // Calculate card center position using named constants
              const cardLeft = pos.left
                ? parseFloat(pos.left)
                : 100 - parseFloat(pos.right || '0');
              const cardTop = parseFloat(pos.top);
              const cardX = cardLeft + offsets.x;
              const cardY = cardTop + offsets.y;

              return (
                <line
                  key={stat.muscle}
                  x1={`${cardX}%`}
                  y1={`${cardY}%`}
                  x2={`${pos.anchorX}%`}
                  y2={`${pos.anchorY}%`}
                  stroke={desktop ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth={desktop ? '1.5' : '1'}
                  className="transition-opacity duration-300"
                />
              );
            })}
        </svg>

        {/* Front Half - Left Side */}
        <div className="w-1/2 overflow-hidden relative">
          <div className="relative -right-1/2">
            <SplitBodyHighlighter
              type="anterior"
              regionStats={regionStats}
              onRegionClick={onRegionClick}
            />
          </div>
        </div>

        {/* Back Half - Right Side */}
        <div className="w-1/2 overflow-hidden relative">
          <div className="relative -left-1/2">
            <SplitBodyHighlighter
              type="posterior"
              regionStats={regionStats}
              onRegionClick={onRegionClick}
            />
          </div>
        </div>

        {/* Orange Divider */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-orange-500 z-20" />

        {/* Muscle Cards */}
        {muscleStats.map((stat) => {
          if (!visibleMuscles.has(stat.muscle)) return null;

          const pos = CARD_POSITIONS[stat.muscle];
          if (!pos) return null;

          return (
            <MuscleCard
              key={stat.muscle}
              muscle={stat.muscle}
              volume={stat.volume}
              goal={stat.goal}
              percentage={stat.percentage}
              position={pos}
              onClick={() => onMuscleClick(stat.muscle)}
              desktop={desktop}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Render a positioned compact muscle card showing an abbreviation, volume/goal and a color-coded border.
 *
 * @param muscle - The scientific muscle identifier to display (used to look up an abbreviation).
 * @param volume - The measured muscle volume to show (displayed with one decimal).
 * @param goal - The target volume to show alongside `volume`.
 * @param percentage - The progress percentage used to determine border and text color.
 * @param position - CSS position values for the card and anchor coordinates.
 * @param onClick - Click handler invoked when the card is activated.
 * @param desktop - When true, render larger desktop sizing and spacing.
 * @returns A positioned React element that visually represents the muscle card.
 */
function MuscleCard({
  muscle,
  volume,
  goal,
  percentage,
  position,
  onClick,
  desktop = false,
}: {
  muscle: ScientificMuscle;
  volume: number;
  goal: number;
  percentage: number;
  position: { top: string; left?: string; right?: string; anchorX: number; anchorY: number };
  onClick: () => void;
  desktop?: boolean;
}): React.ReactElement {
  // Determine color based on percentage
  let borderColor: string;
  let textColor: string;

  if (percentage >= 100) {
    borderColor = 'rgb(34, 197, 94)';
    textColor = 'text-green-400';
  } else if (percentage >= 50) {
    borderColor = 'rgb(245, 158, 11)';
    textColor = 'text-orange-400';
  } else {
    borderColor = 'rgb(239, 68, 68)';
    textColor = 'text-red-400';
  }

  const abbreviation = MUSCLE_ABBREVIATIONS[muscle] || muscle;

  return (
    <button
      onClick={onClick}
      className="absolute z-30 transition-transform hover:scale-105 active:scale-95"
      style={{
        top: position.top,
        left: position.left,
        right: position.right,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        padding: desktop ? '6px 8px' : '4px 6px',
        width: desktop ? '80px' : '60px',
        boxShadow: `0 0 10px ${borderColor}40`,
      }}
    >
      <div className="text-left">
        {/* Muscle Name */}
        <div className={`${textColor} font-bold leading-tight`} style={{ fontSize: desktop ? '11px' : '10px' }}>
          {abbreviation}
        </div>
        {/* Volume / Goal - consistent formatting */}
        <div className="text-white/80 font-medium mt-0.5" style={{ fontSize: desktop ? '10px' : '9px' }}>
          {volume.toFixed(1)} / {goal.toFixed(0)}
        </div>
      </div>
    </button>
  );
}

/**
 * Render an anterior or posterior body model with regions colored by their aggregated percentage.
 *
 * @param type - Which model to render: 'anterior' (front) or 'posterior' (back)
 * @param regionStats - Map from BodyRegion to an object with `percentage`
 * @param onRegionClick - Called with the BodyRegion whose mapped muscle was clicked
 * @returns A React element containing a configured body model with region-based highlighting
 */
function SplitBodyHighlighter({
  type,
  regionStats,
  onRegionClick,
}: {
  type: 'anterior' | 'posterior';
  regionStats: Map<BodyRegion, { percentage: number }>;
  onRegionClick: (region: BodyRegion) => void;
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
        const frequency = getFrequencyLevel(stats.percentage);

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
  }, [type, regionStats]);

  // Color array for highlighting
  const highlightedColors = useMemo(() => {
    return [
      getHeatColor(12.5),  // 0-25%
      getHeatColor(37.5),  // 25-50%
      getHeatColor(62.5),  // 50-75%
      getHeatColor(87.5),  // 75-100%
      getHeatColor(100),   // 100%+
    ];
  }, []);

  // Handle muscle click - map back to region
  const handleMuscleClick = (muscleStats: IMuscleStats) => {
    const clickedMuscle = muscleStats.muscle;
    const viewKey = type === 'anterior' ? 'front' : 'back';

    for (const [region] of regionStats) {
      const muscles = REGION_TO_LIBRARY_MUSCLES[region][viewKey];
      if (muscles.includes(clickedMuscle)) {
        onRegionClick(region);
        break;
      }
    }
  };

  return (
    <>
      <div className="flex justify-center" data-muscle-heatmap={scopeId}>
        <Model
          type={type}
          data={exerciseData}
          highlightedColors={highlightedColors}
          bodyColor="rgb(63, 63, 70)"
          onClick={handleMuscleClick}
          style={{
            width: '100%',
            maxWidth: '20rem',
          }}
          svgStyle={{
            filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.1))',
          }}
        />
      </div>

      {/* Scoped hover styles using data-attribute */}
      <style>{`
        [data-muscle-heatmap="${scopeId}"] .rbh polygon {
          transition: all 0.2s ease;
          cursor: pointer;
          stroke: rgb(24, 24, 27);
          stroke-width: 0.5px;
        }

        [data-muscle-heatmap="${scopeId}"] .rbh polygon:hover {
          filter: brightness(1.4) drop-shadow(0 0 6px currentColor);
          stroke: rgb(245, 158, 11);
          stroke-width: 1.5px;
        }

        [data-muscle-heatmap="${scopeId}"] .rbh polygon:active {
          filter: brightness(1.2);
        }
      `}</style>
    </>
  );
}
