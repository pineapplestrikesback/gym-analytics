/**
 * MuscleHeatmap Component
 * Interactive anatomical body diagram showing muscle volume as a heat map
 */

import { useMemo, useState } from 'react';
import { useScientificMuscleVolume } from '@db/hooks/useVolumeStats';
import type { VolumeStatItem } from '@db/hooks/useVolumeStats';
import type { ScientificMuscle } from '@core/taxonomy';
import { X } from 'lucide-react';

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
 * Display names for body regions
 */
const REGION_NAMES: Record<BodyRegion, string> = {
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

interface RegionStats {
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
function getHeatColor(percentage: number): string {
  if (percentage === 0) return 'rgb(63, 63, 70)'; // primary-500 (dim gray)
  if (percentage < 25) return 'rgb(120, 53, 15)'; // dark orange
  if (percentage < 50) return 'rgb(249, 115, 22)'; // orange
  if (percentage < 75) return 'rgb(251, 191, 36)'; // amber
  if (percentage < 100) return 'rgb(34, 211, 238)'; // cyan
  return 'rgb(6, 182, 212)'; // bright cyan (goal met/exceeded)
}

/**
 * Get glow intensity for region based on percentage
 */
function getGlowFilter(percentage: number): string {
  if (percentage === 0) return 'none';
  const intensity = Math.min(percentage / 100, 1.5);
  return `drop-shadow(0 0 ${4 + intensity * 8}px ${getHeatColor(percentage)})`;
}

export function MuscleHeatmap({ profileId, daysBack = 7 }: MuscleHeatmapProps): React.ReactElement {
  const { stats, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);
  const [selectedRegion, setSelectedRegion] = useState<RegionStats | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');

  // Calculate regional stats
  const regionStats = useMemo(() => {
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
  }, [stats]);

  const handleRegionClick = (region: RegionStats) => {
    setSelectedRegion(region);
  };

  const closeDetail = () => {
    setSelectedRegion(null);
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

  const frontRegions = regionStats.filter((r) =>
    ['chest', 'shoulders', 'biceps', 'forearms', 'abs', 'obliques', 'quads', 'adductors'].includes(
      r.region
    )
  );
  const backRegions = regionStats.filter((r) =>
    [
      'shoulders',
      'upperBack',
      'lowerBack',
      'triceps',
      'forearms',
      'glutes',
      'hamstrings',
      'calves',
    ].includes(r.region)
  );

  return (
    <div className="relative">
      {/* View Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-lg bg-primary-800 p-1">
          <button
            onClick={() => setView('front')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'front'
                ? 'bg-accent-cyan text-black shadow-lg shadow-accent-cyan/50'
                : 'text-primary-300 hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'back'
                ? 'bg-accent-cyan text-black shadow-lg shadow-accent-cyan/50'
                : 'text-primary-300 hover:text-white'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      {/* Body Diagram */}
      <div className="flex justify-center">
        {view === 'front' ? (
          <FrontBodySVG regions={frontRegions} onRegionClick={handleRegionClick} />
        ) : (
          <BackBodySVG regions={backRegions} onRegionClick={handleRegionClick} />
        )}
      </div>

      {/* Heat Map Legend */}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs">
        <span className="text-primary-300">Low</span>
        <div className="flex h-3 w-48 overflow-hidden rounded-full">
          <div className="flex-1 bg-gradient-to-r from-primary-500 via-accent-orange via-amber-400 to-accent-cyan" />
        </div>
        <span className="text-primary-300">Goal Met</span>
      </div>

      {/* Detail Panel */}
      {selectedRegion && (
        <MuscleDetailPanel region={selectedRegion} onClose={closeDetail} />
      )}
    </div>
  );
}

/**
 * Front Body SVG Component
 */
function FrontBodySVG({
  regions,
  onRegionClick,
}: {
  regions: RegionStats[];
  onRegionClick: (region: RegionStats) => void;
}): React.ReactElement {
  const getRegionStats = (region: BodyRegion) => regions.find((r) => r.region === region);

  return (
    <svg
      viewBox="0 0 200 400"
      className="w-full max-w-xs md:max-w-sm"
      style={{ filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.1))' }}
    >
      {/* Head */}
      <ellipse cx="100" cy="25" rx="18" ry="22" fill="rgb(39, 39, 42)" className="opacity-40" />

      {/* Neck */}
      <rect x="92" y="42" width="16" height="18" fill="rgb(39, 39, 42)" className="opacity-40" />

      {/* Chest */}
      <BodyRegion
        d="M 70 60 Q 65 80 70 95 L 80 105 L 100 108 L 120 105 L 130 95 Q 135 80 130 60 L 100 62 Z"
        region={getRegionStats('chest')}
        onRegionClick={onRegionClick}
      />

      {/* Shoulders */}
      <BodyRegion
        d="M 50 60 Q 45 55 42 62 L 38 75 Q 40 82 48 85 L 65 80 L 70 70 Z"
        region={getRegionStats('shoulders')}
        onRegionClick={onRegionClick}
      />
      <BodyRegion
        d="M 150 60 Q 155 55 158 62 L 162 75 Q 160 82 152 85 L 135 80 L 130 70 Z"
        region={getRegionStats('shoulders')}
        onRegionClick={onRegionClick}
      />

      {/* Abs */}
      <BodyRegion
        d="M 78 108 L 80 135 Q 82 155 85 170 L 100 173 L 115 170 Q 118 155 120 135 L 122 108 Z"
        region={getRegionStats('abs')}
        onRegionClick={onRegionClick}
      />

      {/* Obliques */}
      <BodyRegion
        d="M 70 110 L 65 125 L 68 145 L 78 140 L 80 120 Z"
        region={getRegionStats('obliques')}
        onRegionClick={onRegionClick}
      />
      <BodyRegion
        d="M 130 110 L 135 125 L 132 145 L 122 140 L 120 120 Z"
        region={getRegionStats('obliques')}
        onRegionClick={onRegionClick}
      />

      {/* Biceps */}
      <BodyRegion
        d="M 40 85 L 35 95 L 32 110 L 35 125 L 42 120 L 45 100 Z"
        region={getRegionStats('biceps')}
        onRegionClick={onRegionClick}
      />
      <BodyRegion
        d="M 160 85 L 165 95 L 168 110 L 165 125 L 158 120 L 155 100 Z"
        region={getRegionStats('biceps')}
        onRegionClick={onRegionClick}
      />

      {/* Forearms */}
      <BodyRegion
        d="M 32 125 L 28 145 L 25 165 L 28 175 L 35 172 L 38 150 L 40 130 Z"
        region={getRegionStats('forearms')}
        onRegionClick={onRegionClick}
      />
      <BodyRegion
        d="M 168 125 L 172 145 L 175 165 L 172 175 L 165 172 L 162 150 L 160 130 Z"
        region={getRegionStats('forearms')}
        onRegionClick={onRegionClick}
      />

      {/* Quads */}
      <BodyRegion
        d="M 75 175 L 72 200 L 70 235 L 72 260 L 80 262 L 85 240 L 88 210 L 90 180 Z"
        region={getRegionStats('quads')}
        onRegionClick={onRegionClick}
      />
      <BodyRegion
        d="M 125 175 L 128 200 L 130 235 L 128 260 L 120 262 L 115 240 L 112 210 L 110 180 Z"
        region={getRegionStats('quads')}
        onRegionClick={onRegionClick}
      />

      {/* Adductors */}
      <BodyRegion
        d="M 90 180 L 92 210 L 95 240 L 100 245 L 105 240 L 108 210 L 110 180 Z"
        region={getRegionStats('adductors')}
        onRegionClick={onRegionClick}
      />

      {/* Lower Legs */}
      <rect x="70" y="262" width="12" height="60" rx="4" fill="rgb(39, 39, 42)" className="opacity-40" />
      <rect x="118" y="262" width="12" height="60" rx="4" fill="rgb(39, 39, 42)" className="opacity-40" />

      {/* Feet */}
      <ellipse cx="76" cy="330" rx="8" ry="12" fill="rgb(39, 39, 42)" className="opacity-40" />
      <ellipse cx="124" cy="330" rx="8" ry="12" fill="rgb(39, 39, 42)" className="opacity-40" />
    </svg>
  );
}

/**
 * Back Body SVG Component
 */
function BackBodySVG({
  regions,
  onRegionClick,
}: {
  regions: RegionStats[];
  onRegionClick: (region: RegionStats) => void;
}): React.ReactElement {
  const getRegionStats = (region: BodyRegion) => regions.find((r) => r.region === region);

  return (
    <svg
      viewBox="0 0 200 400"
      className="w-full max-w-xs md:max-w-sm"
      style={{ filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.1))' }}
    >
      {/* Head */}
      <ellipse cx="100" cy="25" rx="18" ry="22" fill="rgb(39, 39, 42)" className="opacity-40" />

      {/* Neck */}
      <rect x="92" y="42" width="16" height="18" fill="rgb(39, 39, 42)" className="opacity-40" />

      {/* Shoulders (Rear) */}
      <BodyRegion
        d="M 50 60 Q 45 55 42 62 L 38 75 Q 40 82 48 85 L 65 80 L 70 70 Z"
        region={getRegionStats('shoulders')}
        onRegionClick={onRegionClick}
      />
      <BodyRegion
        d="M 150 60 Q 155 55 158 62 L 162 75 Q 160 82 152 85 L 135 80 L 130 70 Z"
        region={getRegionStats('shoulders')}
        onRegionClick={onRegionClick}
      />

      {/* Upper Back (Lats & Traps) */}
      <BodyRegion
        d="M 70 60 L 65 70 L 60 85 L 62 105 L 70 120 L 100 125 L 130 120 L 138 105 L 140 85 L 135 70 L 130 60 Z"
        region={getRegionStats('upperBack')}
        onRegionClick={onRegionClick}
      />

      {/* Lower Back */}
      <BodyRegion
        d="M 75 125 L 72 140 L 70 160 L 75 175 L 100 178 L 125 175 L 130 160 L 128 140 L 125 125 Z"
        region={getRegionStats('lowerBack')}
        onRegionClick={onRegionClick}
      />

      {/* Triceps */}
      <BodyRegion
        d="M 40 85 L 35 95 L 32 110 L 35 125 L 42 120 L 45 100 Z"
        region={getRegionStats('triceps')}
        onRegionClick={onRegionClick}
      />
      <BodyRegion
        d="M 160 85 L 165 95 L 168 110 L 165 125 L 158 120 L 155 100 Z"
        region={getRegionStats('triceps')}
        onRegionClick={onRegionClick}
      />

      {/* Forearms (Back) */}
      <BodyRegion
        d="M 32 125 L 28 145 L 25 165 L 28 175 L 35 172 L 38 150 L 40 130 Z"
        region={getRegionStats('forearms')}
        onRegionClick={onRegionClick}
      />
      <BodyRegion
        d="M 168 125 L 172 145 L 175 165 L 172 175 L 165 172 L 162 150 L 160 130 Z"
        region={getRegionStats('forearms')}
        onRegionClick={onRegionClick}
      />

      {/* Glutes */}
      <BodyRegion
        d="M 75 178 L 72 195 L 70 210 L 75 220 L 85 222 L 90 210 L 92 188 Z"
        region={getRegionStats('glutes')}
        onRegionClick={onRegionClick}
      />
      <BodyRegion
        d="M 125 178 L 128 195 L 130 210 L 125 220 L 115 222 L 110 210 L 108 188 Z"
        region={getRegionStats('glutes')}
        onRegionClick={onRegionClick}
      />

      {/* Hamstrings */}
      <BodyRegion
        d="M 72 220 L 70 240 L 68 260 L 72 275 L 82 277 L 88 255 L 90 230 Z"
        region={getRegionStats('hamstrings')}
        onRegionClick={onRegionClick}
      />
      <BodyRegion
        d="M 128 220 L 130 240 L 132 260 L 128 275 L 118 277 L 112 255 L 110 230 Z"
        region={getRegionStats('hamstrings')}
        onRegionClick={onRegionClick}
      />

      {/* Calves */}
      <BodyRegion
        d="M 70 277 L 68 295 L 70 315 L 76 320 L 82 315 L 84 295 L 82 277 Z"
        region={getRegionStats('calves')}
        onRegionClick={onRegionClick}
      />
      <BodyRegion
        d="M 130 277 L 132 295 L 130 315 L 124 320 L 118 315 L 116 295 L 118 277 Z"
        region={getRegionStats('calves')}
        onRegionClick={onRegionClick}
      />

      {/* Feet */}
      <ellipse cx="76" cy="330" rx="8" ry="12" fill="rgb(39, 39, 42)" className="opacity-40" />
      <ellipse cx="124" cy="330" rx="8" ry="12" fill="rgb(39, 39, 42)" className="opacity-40" />
    </svg>
  );
}

/**
 * Clickable Body Region Component
 */
function BodyRegion({
  d,
  region,
  onRegionClick,
}: {
  d: string;
  region: RegionStats | undefined;
  onRegionClick: (region: RegionStats) => void;
}): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  if (!region) {
    return <path d={d} fill="rgb(39, 39, 42)" className="opacity-40" />;
  }

  const fillColor = getHeatColor(region.percentage);
  const glowFilter = getGlowFilter(region.percentage);

  return (
    <path
      d={d}
      fill={fillColor}
      stroke={isHovered ? 'white' : 'rgb(24, 24, 27)'}
      strokeWidth={isHovered ? '2' : '1'}
      className="cursor-pointer transition-all duration-300"
      style={{
        filter: isHovered ? `${glowFilter} brightness(1.2)` : glowFilter,
        opacity: isHovered ? 0.95 : 0.85,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onRegionClick(region)}
    />
  );
}

/**
 * Muscle Detail Panel Component
 */
function MuscleDetailPanel({
  region,
  onClose,
}: {
  region: RegionStats;
  onClose: () => void;
}): React.ReactElement {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 md:right-0 md:left-auto md:top-0 md:bottom-0 md:w-96 bg-primary-800 border-t-2 md:border-t-0 md:border-l-2 border-accent-cyan shadow-2xl shadow-accent-cyan/20 z-50 animate-slideUp md:animate-slideLeft">
        <div className="flex flex-col h-full max-h-[80vh] md:max-h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary-700">
            <div>
              <h3 className="text-xl font-bold text-white">{region.name}</h3>
              <p className="text-sm text-primary-300 mt-1">
                {region.totalVolume.toFixed(1)} / {region.totalGoal} sets
                <span
                  className={`ml-2 font-semibold ${
                    region.percentage >= 100 ? 'text-accent-cyan' : 'text-accent-orange'
                  }`}
                >
                  ({region.percentage.toFixed(0)}%)
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-primary-700 transition-colors text-primary-300 hover:text-white"
              aria-label="Close detail panel"
            >
              <X size={24} />
            </button>
          </div>

          {/* Muscle List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {region.muscles.map((muscle) => (
              <div
                key={muscle.name}
                className="p-4 rounded-lg bg-primary-900 border border-primary-700 hover:border-accent-cyan/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-white">{muscle.name}</h4>
                  <span
                    className={`text-sm font-bold ${
                      muscle.volume >= muscle.goal ? 'text-accent-cyan' : 'text-accent-orange'
                    }`}
                  >
                    {muscle.volume.toFixed(1)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-primary-400">
                    <span>Goal: {muscle.goal}</span>
                    <span>{muscle.percentage.toFixed(0)}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 bg-primary-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        muscle.percentage >= 100
                          ? 'bg-gradient-to-r from-accent-cyan to-cyan-400'
                          : muscle.percentage >= 50
                            ? 'bg-gradient-to-r from-amber-400 to-accent-orange'
                            : 'bg-accent-orange'
                      }`}
                      style={{ width: `${Math.min(muscle.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-slideLeft {
          animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
