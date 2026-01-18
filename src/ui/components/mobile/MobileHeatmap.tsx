/**
 * Mobile Heatmap Component
 *
 * Mobile-specific muscle volume visualization. Uses shared data hooks
 * from @db/hooks (ARCH-02 - no data duplication).
 *
 * Renders a split body view (front/back) with volume-based coloring
 * optimized for mobile screens.
 */

import { useMemo, useId } from 'react';
import Model from 'react-body-highlighter';
import type { IExerciseData, Muscle } from 'react-body-highlighter';
import { useScientificMuscleVolume } from '@db/hooks';
import type { ScientificMuscle } from '@core/taxonomy';
import { getVolumeColor, getNoTargetColor } from '@core/color-scale';

interface MobileHeatmapProps {
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

interface MuscleStats {
  muscle: ScientificMuscle;
  volume: number;
  goal: number;
  percentage: number;
}

/**
 * Mobile heatmap component.
 * Displays a split body view with volume-based muscle coloring.
 */
export function MobileHeatmap({ profileId, daysBack = 7 }: MobileHeatmapProps): React.ReactElement {
  const { stats, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);

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

  // Calculate regional stats for body highlighting
  const regionStats = useMemo(() => {
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

  // Render split body view
  return (
    <div className="relative flex justify-center min-h-[400px]">
      {/* Front Half */}
      <div className="w-1/2 overflow-hidden">
        <div className="relative -right-1/2">
          <MobileBodyHighlighter type="anterior" regionStats={regionStats} />
        </div>
      </div>
      {/* Back Half */}
      <div className="w-1/2 overflow-hidden">
        <div className="relative -left-1/2">
          <MobileBodyHighlighter type="posterior" regionStats={regionStats} />
        </div>
      </div>
      {/* Center Divider */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-orange-500/50" />
    </div>
  );
}

/**
 * Render an anterior or posterior body model with regions colored by their aggregated percentage.
 */
function MobileBodyHighlighter({
  type,
  regionStats,
}: {
  type: 'anterior' | 'posterior';
  regionStats: Map<BodyRegion, { percentage: number }>;
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

  // Color array for highlighting - uses centralized color scale
  const highlightedColors = useMemo(() => {
    return [
      getVolumeColor(12.5), // frequency 1: 0-25%
      getVolumeColor(37.5), // frequency 2: 25-50%
      getVolumeColor(62.5), // frequency 3: 50-75%
      getVolumeColor(87.5), // frequency 4: 75-100%
      getVolumeColor(100), // frequency 5: 100%+
    ];
  }, []);

  return (
    <>
      <div className="flex justify-center" data-mobile-heatmap={scopeId}>
        <Model
          type={type}
          data={exerciseData}
          highlightedColors={highlightedColors}
          bodyColor={getNoTargetColor()}
          style={{
            width: '100%',
            maxWidth: '16rem',
          }}
          svgStyle={{
            filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.1))',
          }}
        />
      </div>

      {/* Scoped hover styles using data-attribute */}
      <style>{`
        [data-mobile-heatmap="${scopeId}"] .rbh polygon {
          transition: all 0.2s ease;
          stroke: rgb(24, 24, 27);
          stroke-width: 0.5px;
        }
      `}</style>
    </>
  );
}
