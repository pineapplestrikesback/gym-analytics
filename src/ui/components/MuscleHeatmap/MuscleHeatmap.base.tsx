/**
 * MuscleHeatmap Base
 * Shared types, utilities, and constants for MuscleHeatmap variants
 */

import type { VolumeStatItem } from '@db/hooks/useVolumeStats';
import type { ScientificMuscle } from '@core/taxonomy';

export interface MuscleHeatmapProps {
  profileId: string | null;
  daysBack?: number;
}

/**
 * Body regions for anatomical grouping
 */
export type BodyRegion =
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
export const REGION_TO_MUSCLES: Record<BodyRegion, ScientificMuscle[]> = {
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
 * Display names for body regions
 */
export const REGION_NAMES: Record<BodyRegion, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  upperBack: 'Upper Back',
  lowerBack: 'Lower Back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  quads: 'Quadriceps',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  adductors: 'Adductors',
};

export interface RegionStats {
  region: BodyRegion;
  name: string;
  totalVolume: number;
  totalGoal: number;
  percentage: number;
  muscles: VolumeStatItem[];
}

/**
 * Calculate heat map color based on percentage
 */
export function getHeatColor(percentage: number): string {
  if (percentage === 0) return 'rgb(63, 63, 70)'; // primary-500 (dim gray)
  if (percentage < 25) return 'rgb(120, 53, 15)'; // dark orange
  if (percentage < 50) return 'rgb(249, 115, 22)'; // orange
  if (percentage < 75) return 'rgb(251, 191, 36)'; // amber
  if (percentage < 100) return 'rgb(34, 211, 238)'; // cyan
  return 'rgb(6, 182, 212)'; // bright cyan (goal met/exceeded)
}

/**
 * Calculate regional stats from volume stats
 */
export function calculateRegionStats(stats: VolumeStatItem[]): RegionStats[] {
  const statsMap = new Map(stats.map((s) => [s.name, s]));
  const regions: RegionStats[] = [];

  for (const [region, muscles] of Object.entries(REGION_TO_MUSCLES)) {
    const muscleStats = muscles
      .map((m) => statsMap.get(m))
      .filter((s): s is VolumeStatItem => s !== undefined);

    const totalVolume = muscleStats.reduce((sum, s) => sum + s.volume, 0);
    const totalGoal = muscleStats.reduce((sum, s) => sum + s.goal, 0);
    const percentage = totalGoal > 0 ? (totalVolume / totalGoal) * 100 : 0;

    regions.push({
      region: region as BodyRegion,
      name: REGION_NAMES[region as BodyRegion],
      totalVolume,
      totalGoal,
      percentage,
      muscles: muscleStats,
    });
  }

  return regions;
}
