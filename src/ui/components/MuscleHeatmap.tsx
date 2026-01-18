/**
 * MuscleHeatmap Component - Simplified Body View
 * Split anatomical view showing front/back simultaneously with color-coded regions
 * Color is the primary signal - no floating cards or leader lines
 */

import React, { useMemo, useId } from 'react';
import { useScientificMuscleVolume } from '@db/hooks/useVolumeStats';
import type { ScientificMuscle } from '@core/taxonomy';
import { getVolumeColor, getNoTargetColor } from '@core/color-scale';
import Model from 'react-body-highlighter';
import type { IExerciseData, Muscle } from 'react-body-highlighter';

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
 * Kept for potential use by other components
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
  Obliques: 'Obliques',
  'Quadriceps (Vasti)': 'Quads (V)',
  'Quadriceps (RF)': 'Quads (RF)',
  Hamstrings: 'Hams',
  'Gluteus Maximus': 'Glute Max',
  'Gluteus Medius': 'Glute Med',
  Gastrocnemius: 'Gastroc',
  Soleus: 'Soleus',
  Adductors: 'Adductors',
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

interface MuscleStats {
  muscle: ScientificMuscle;
  volume: number;
  goal: number;
  percentage: number;
}

/**
 * Convert a percentage (0-100) into a discrete frequency level used for body highlighting.
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
 * Render a responsive split-view muscle heatmap with color-coded region highlighting.
 * Color is the primary signal for training distribution - no floating cards or labels.
 *
 * @param profileId - Profile identifier to fetch muscle stats for; pass `null` to skip data retrieval
 * @param daysBack - Number of days to aggregate stats over (default: 7)
 * @returns A React element containing the split anterior/posterior muscle heatmap
 */
export function MuscleHeatmap({ profileId, daysBack = 7 }: MuscleHeatmapProps): React.ReactElement {
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

  return (
    <div className="relative">
      {/* Split Body View - Color Only */}
      <SplitView regionStats={regionStatsForBody} />
    </div>
  );
}

/**
 * Unified Split View Component - shows front/back bodies side-by-side
 * Clean visualization with color as the primary signal
 *
 * @param regionStats - Map of body regions to their aggregated percentage used by the body highlighters.
 * @returns The split-view React element containing the body diagrams.
 */
function SplitView({
  regionStats,
}: {
  regionStats: Map<BodyRegion, { percentage: number }>;
}): React.ReactElement {
  return (
    <div className="relative">
      {/* Split Body Container - fills available viewport space */}
      <div className="relative flex justify-center items-center min-h-[calc(100vh-220px)] md:min-h-[calc(100vh-200px)]">
        {/* Front Half - Left Side */}
        <div className="w-1/2 overflow-hidden relative">
          <div className="relative -right-1/2">
            <SplitBodyHighlighter type="anterior" regionStats={regionStats} />
          </div>
        </div>

        {/* Back Half - Right Side */}
        <div className="w-1/2 overflow-hidden relative">
          <div className="relative -left-1/2">
            <SplitBodyHighlighter type="posterior" regionStats={regionStats} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Render an anterior or posterior body model with regions colored by their aggregated percentage.
 *
 * @param type - Which model to render: 'anterior' (front) or 'posterior' (back)
 * @param regionStats - Map from BodyRegion to an object with `percentage`
 * @returns A React element containing a configured body model with region-based highlighting
 */
function SplitBodyHighlighter({
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
      <div className="flex justify-center" data-muscle-heatmap={scopeId}>
        <Model
          type={type}
          data={exerciseData}
          highlightedColors={highlightedColors}
          bodyColor={getNoTargetColor()}
          style={{
            width: '100%',
            maxWidth: '24rem',
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

// Export for potential use by other components
export { MUSCLE_ABBREVIATIONS, REGION_TO_MUSCLES, REGION_TO_LIBRARY_MUSCLES };
export type { BodyRegion, MuscleStats };
