/**
 * MuscleHeatmap Component
 * Interactive anatomical body diagram showing muscle volume as a heat map
 * with floating tooltip cards
 */

import { useMemo, useState, useEffect } from 'react';
import { useScientificMuscleVolume } from '@db/hooks/useVolumeStats';
import type { VolumeStatItem } from '@db/hooks/useVolumeStats';
import type { ScientificMuscle } from '@core/taxonomy';
import { BodyHighlighter } from './anatomy/BodyHighlighter';
import { X, Grid3x3, Eye } from 'lucide-react';

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

/**
 * Positioning strategy for each region
 * Defines where floating cards should appear relative to the body diagram
 */
const REGION_POSITIONS: Record<BodyRegion, { top?: string; bottom?: string; left?: string; right?: string }> = {
  shoulders: { top: '5%', left: '50%', right: 'auto' },
  chest: { top: '20%', right: '2%' },
  upperBack: { top: '20%', left: '2%' },
  lowerBack: { top: '40%', left: '2%' },
  biceps: { top: '30%', right: '2%' },
  triceps: { top: '30%', left: '2%' },
  forearms: { top: '45%', right: '2%' },
  abs: { top: '35%', right: '2%' },
  obliques: { top: '40%', left: '50%', right: 'auto' },
  quads: { bottom: '25%', left: '2%' },
  hamstrings: { bottom: '25%', right: '2%' },
  glutes: { top: '45%', right: '2%' },
  calves: { bottom: '5%', right: '2%' },
  adductors: { bottom: '30%', left: '50%', right: 'auto' },
};

/**
 * Mobile-specific positioning - more compact for showing all tooltips
 */
const MOBILE_REGION_POSITIONS: Record<BodyRegion, { top?: string; bottom?: string; left?: string; right?: string }> = {
  shoulders: { top: '2%', left: '50%', right: 'auto' },
  chest: { top: '12%', right: '1%' },
  upperBack: { top: '12%', left: '1%' },
  lowerBack: { top: '32%', left: '1%' },
  biceps: { top: '22%', right: '1%' },
  triceps: { top: '22%', left: '1%' },
  forearms: { top: '38%', right: '1%' },
  abs: { top: '28%', right: '1%' },
  obliques: { top: '38%', left: '50%', right: 'auto' },
  quads: { bottom: '22%', left: '1%' },
  hamstrings: { bottom: '22%', right: '1%' },
  glutes: { top: '50%', right: '1%' },
  calves: { bottom: '2%', right: '1%' },
  adductors: { bottom: '30%', left: '50%', right: 'auto' },
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
 * Hook to detect mobile viewport
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function MuscleHeatmap({ profileId, daysBack = 7 }: MuscleHeatmapProps): React.ReactElement {
  const { stats, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);
  const [visibleRegions, setVisibleRegions] = useState<Set<BodyRegion>>(new Set());
  const [view, setView] = useState<'front' | 'back'>('front');
  const [mobileShowAll, setMobileShowAll] = useState(false);
  const isMobile = useIsMobile();

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

  // Convert to Map for anatomy components
  const regionStatsMap = useMemo(() => {
    return new Map(regionStats.map((r) => [r.region, r]));
  }, [regionStats]);

  const handleRegionClick = (region: RegionStats) => {
    // On mobile with "show all" mode, don't toggle individual regions
    if (isMobile && mobileShowAll) {
      return;
    }

    setVisibleRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region.region)) {
        next.delete(region.region);
      } else {
        next.add(region.region);
      }
      return next;
    });
  };

  // Handle mobile "show all" toggle
  const handleMobileToggle = (showAll: boolean) => {
    setMobileShowAll(showAll);
    if (showAll) {
      // Show all regions
      const allRegions = new Set(regionStats.map((r) => r.region));
      setVisibleRegions(allRegions);
    } else {
      // Hide all regions
      setVisibleRegions(new Set());
    }
  };

  const closeCard = (region: BodyRegion) => {
    setVisibleRegions((prev) => {
      const next = new Set(prev);
      next.delete(region);
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

  return (
    <div className="relative">
      {/* View Toggle - Desktop (Front/Back) | Mobile (Hide All/Show All) */}
      <div className="mb-6 flex justify-center gap-3">
        {/* Front/Back Toggle (Desktop) or Mobile Show/Hide Toggle */}
        <div className="inline-flex rounded-lg bg-primary-800 p-1">
          {isMobile ? (
            <>
              <button
                onClick={() => handleMobileToggle(false)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  !mobileShowAll
                    ? 'bg-accent-cyan text-black shadow-lg shadow-accent-cyan/50'
                    : 'text-primary-300 hover:text-white'
                }`}
              >
                <Eye size={14} />
                <span>Tap Muscles</span>
              </button>
              <button
                onClick={() => handleMobileToggle(true)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  mobileShowAll
                    ? 'bg-accent-cyan text-black shadow-lg shadow-accent-cyan/50'
                    : 'text-primary-300 hover:text-white'
                }`}
              >
                <Grid3x3 size={14} />
                <span>Show All</span>
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Body Diagram with Floating Cards Container */}
      <div className="relative min-h-[600px] md:min-h-[700px]">
        <BodyHighlighter
          view={view}
          regionStats={regionStatsMap}
          onRegionClick={handleRegionClick}
          getHeatColor={getHeatColor}
        />

        {/* Floating Tooltip Cards */}
        {regionStats.map((region) =>
          visibleRegions.has(region.region) ? (
            isMobile ? (
              <MobileMuscleTooltip
                key={region.region}
                region={region}
                position={MOBILE_REGION_POSITIONS[region.region]}
                onClose={() => closeCard(region.region)}
                showCloseButton={!mobileShowAll}
              />
            ) : (
              <FloatingMuscleCard
                key={region.region}
                region={region}
                position={REGION_POSITIONS[region.region]}
                onClose={() => closeCard(region.region)}
              />
            )
          ) : null
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
    </div>
  );
}

/**
 * Mobile Muscle Tooltip Component
 * Ultra-compact text-only tooltip for mobile devices
 * Shows individual muscles with color-coded progress indicators
 */
function MobileMuscleTooltip({
  region,
  position,
  onClose,
  showCloseButton,
}: {
  region: RegionStats;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  onClose: () => void;
  showCloseButton: boolean;
}): React.ReactElement {
  // Calculate transform for centered cards
  const needsTransform = position.left === '50%';
  const transform = needsTransform ? 'translateX(-50%)' : undefined;

  /**
   * Get color classes based on muscle progress percentage
   */
  const getProgressColors = (percentage: number) => {
    if (percentage >= 100) {
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
        dot: 'bg-cyan-400',
      };
    } else if (percentage >= 50) {
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
      };
    } else {
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
        dot: 'bg-red-400',
      };
    }
  };

  /**
   * Abbreviate long muscle names for mobile
   */
  const abbreviateMuscle = (name: ScientificMuscle): string => {
    return name
      .replace('Pectoralis Major', 'Pec Major')
      .replace('(Sternal)', '(Stern)')
      .replace('(Clavicular)', '(Clav)')
      .replace('Triceps (Lateral/Medial)', 'Tri (Lat/Med)')
      .replace('Triceps (Long Head)', 'Tri (Long)')
      .replace('Quadriceps', 'Quads')
      .replace('Latissimus Dorsi', 'Lats')
      .replace('Gastrocnemius', 'Gastroc');
  };

  return (
    <>
      <div
        className="absolute z-50 animate-mobileTooltipIn"
        style={{
          top: position.top,
          bottom: position.bottom,
          left: position.left,
          right: position.right,
          transform,
        }}
      >
        <div className="min-w-[140px] max-w-[180px] bg-zinc-900/95 backdrop-blur-sm rounded-md border border-zinc-700/50 shadow-xl shadow-black/30 overflow-hidden">
          {/* Muscle List - No header, just individual muscles */}
          <div className="p-2 space-y-1">
            {region.muscles.map((muscle) => {
              const colors = getProgressColors(muscle.percentage);
              return (
                <div
                  key={muscle.name}
                  className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded ${colors.bg} border ${colors.border}`}
                >
                  {/* Muscle name */}
                  <span className={`text-[10px] leading-tight ${colors.text} font-medium truncate flex-1`}>
                    {abbreviateMuscle(muscle.name as ScientificMuscle)}
                  </span>

                  {/* Volume/Goal */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-bold ${colors.text} tabular-nums`}>
                      {muscle.volume.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-zinc-500">/</span>
                    <span className="text-[9px] text-zinc-500 tabular-nums">{muscle.goal}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Close button (only when in tap mode) */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute -top-1 -right-1 p-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors shadow-lg"
              aria-label="Close"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes mobileTooltipIn {
          from {
            opacity: 0;
            transform: ${transform || 'none'} scale(0.9);
          }
          to {
            opacity: 1;
            transform: ${transform || 'none'} scale(1);
          }
        }
        .animate-mobileTooltipIn {
          animation: mobileTooltipIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}

/**
 * Floating Muscle Card Component
 * Displays regional muscle stats in a tooltip-style card positioned near the muscle
 */
function FloatingMuscleCard({
  region,
  position,
  onClose,
}: {
  region: RegionStats;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  onClose: () => void;
}): React.ReactElement {
  // Calculate transform for centered cards
  const needsTransform = position.left === '50%';
  const transform = needsTransform ? 'translateX(-50%)' : undefined;

  return (
    <>
      <div
        className="absolute z-50 animate-floatIn"
        style={{
          top: position.top,
          bottom: position.bottom,
          left: position.left,
          right: position.right,
          transform,
        }}
      >
        <div className="w-[280px] max-w-[calc(100vw-2rem)] md:w-[320px] bg-zinc-900/95 backdrop-blur-md rounded-lg border border-zinc-700/50 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="relative px-4 pt-4 pb-3 border-b border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-bold text-white truncate">{region.name}</h3>
                <p className="text-xs md:text-sm text-zinc-400 mt-0.5">
                  <span className="font-semibold text-orange-500">{region.totalVolume.toFixed(1)}</span>
                  <span className="mx-1">/</span>
                  <span>{region.totalGoal}</span>
                  <span className="ml-1">sets</span>
                </p>
              </div>
              <div className="flex items-start gap-2 flex-shrink-0">
                {/* Percentage Badge */}
                <div
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    region.percentage >= 100
                      ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                      : 'bg-orange-500/20 text-orange-500 border border-orange-500/30'
                  }`}
                >
                  {region.percentage.toFixed(0)}%
                </div>
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                  aria-label="Close card"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(region.percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Muscle List */}
          <div className="max-h-[280px] md:max-h-[320px] overflow-y-auto p-3 space-y-2.5">
            {region.muscles.map((muscle) => (
              <div key={muscle.name} className="group">
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-xs md:text-sm text-zinc-300 leading-tight flex-1 min-w-0">
                    {muscle.name}
                  </span>
                  <span className="text-xs md:text-sm font-bold text-orange-500 tabular-nums flex-shrink-0">
                    {muscle.volume.toFixed(1)}
                  </span>
                </div>
                {/* Individual Progress Bar */}
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      muscle.percentage >= 100
                        ? 'bg-gradient-to-r from-accent-cyan to-cyan-400'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600'
                    }`}
                    style={{ width: `${Math.min(muscle.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes floatIn {
          from {
            opacity: 0;
            transform: ${transform || 'none'} scale(0.85) translateY(10px);
          }
          to {
            opacity: 1;
            transform: ${transform || 'none'} scale(1) translateY(0);
          }
        }
        .animate-floatIn {
          animation: floatIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Custom scrollbar for muscle list */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgb(39, 39, 42);
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgb(113, 113, 122);
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgb(161, 161, 170);
        }
      `}</style>
    </>
  );
}
