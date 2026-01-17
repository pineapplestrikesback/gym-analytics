/**
 * MuscleHeatmap Desktop Variant
 * Two-column inline experience with hover and "Show All" modes
 */

import { useMemo, useState } from 'react';
import { useScientificMuscleVolume } from '@db/hooks/useVolumeStats';
import { BodyHighlighter } from '../anatomy/BodyHighlighter';
import { Eye, EyeOff } from 'lucide-react';
import {
  type MuscleHeatmapProps,
  type RegionStats,
  type BodyRegion,
  getHeatColor,
  calculateRegionStats,
} from './MuscleHeatmap.base';

export function DesktopHeatmap({ profileId, daysBack = 7 }: MuscleHeatmapProps): React.ReactElement {
  const { stats, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [showAll, setShowAll] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<RegionStats | null>(null);

  // Calculate regional stats
  const regionStats = useMemo(() => calculateRegionStats(stats), [stats]);

  // Convert to Map for anatomy components
  const regionStatsMap = useMemo(() => {
    return new Map(regionStats.map((r) => [r.region, r]));
  }, [regionStats]);

  // Filter regions by current view
  const visibleRegions = useMemo(() => {
    const frontRegions: BodyRegion[] = ['chest', 'shoulders', 'biceps', 'forearms', 'abs', 'obliques', 'quads', 'adductors'];
    const backRegions: BodyRegion[] = ['shoulders', 'upperBack', 'lowerBack', 'triceps', 'forearms', 'hamstrings', 'glutes', 'calves'];

    const relevantRegions = view === 'front' ? frontRegions : backRegions;
    return regionStats.filter(r => relevantRegions.includes(r.region));
  }, [regionStats, view]);

  const handleRegionHover = (region: RegionStats | null) => {
    if (!showAll) {
      setHoveredRegion(region);
    }
  };

  const handleRegionClick = (_region: RegionStats) => {
    // On desktop, clicking toggles the showAll state and highlights the region
    if (!showAll) {
      setShowAll(true);
    }
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
      {/* View Toggle */}
      <div className="mb-8 flex justify-center">
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

      {/* Two-Column Layout */}
      <div className="grid grid-cols-2 gap-8 items-start">
        {/* LEFT: Body Diagram */}
        <div className="flex flex-col items-center space-y-6">
          <BodyHighlighter
            view={view}
            regionStats={regionStatsMap}
            onRegionClick={handleRegionClick}
            onRegionHover={handleRegionHover}
            getHeatColor={getHeatColor}
          />

          {/* Heat Map Legend */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-primary-300">Low</span>
            <div className="flex h-3 w-48 overflow-hidden rounded-full">
              <div className="flex-1 bg-gradient-to-r from-primary-500 via-accent-orange via-amber-400 to-accent-cyan" />
            </div>
            <span className="text-primary-300">Goal Met</span>
          </div>
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="flex flex-col h-full">
          {/* Toggle Header */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Muscle Details</h3>
            <button
              onClick={() => setShowAll(!showAll)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showAll
                  ? 'bg-accent-cyan text-black shadow-lg shadow-accent-cyan/30'
                  : 'bg-primary-800 text-primary-300 hover:text-white hover:bg-primary-700'
              }`}
            >
              {showAll ? (
                <>
                  <Eye size={16} />
                  Show All
                </>
              ) : (
                <>
                  <EyeOff size={16} />
                  Hide All
                </>
              )}
            </button>
          </div>

          {/* Detail Content */}
          {showAll ? (
            <ShowAllPanel regions={visibleRegions} />
          ) : (
            <HoverPanel region={hoveredRegion} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hide All Mode: Hover Panel
 */
function HoverPanel({ region }: { region: RegionStats | null }): React.ReactElement {
  if (!region) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-primary-700 bg-primary-900/30">
        <p className="text-primary-400 text-sm">Hover over a muscle region</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <RegionCard region={region} variant="large" />
    </div>
  );
}

/**
 * Show All Mode: Scrollable List
 */
function ShowAllPanel({ regions }: { regions: RegionStats[] }): React.ReactElement {
  return (
    <>
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {regions.map((region) => (
          <RegionCard key={region.region} region={region} variant="compact" />
        ))}
      </div>

      {/* Custom scrollbar styling */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgb(24, 24, 27);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(82, 82, 91);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(113, 113, 122);
        }
      `}</style>
    </>
  );
}

/**
 * Region Detail Card
 */
function RegionCard({
  region,
  variant,
}: {
  region: RegionStats;
  variant: 'large' | 'compact';
}): React.ReactElement {
  const isLarge = variant === 'large';

  return (
    <div
      className={`rounded-xl bg-primary-800 border-2 border-primary-700 hover:border-accent-cyan/50 transition-all duration-300 ${
        isLarge ? 'p-6' : 'p-4'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className={`font-bold text-white ${isLarge ? 'text-xl' : 'text-base'}`}>
            {region.name}
          </h4>
          <p className={`text-primary-300 mt-1 ${isLarge ? 'text-sm' : 'text-xs'}`}>
            {region.totalVolume.toFixed(1)} / {region.totalGoal} sets
          </p>
        </div>
        <div
          className={`font-bold ${
            region.percentage >= 100 ? 'text-accent-cyan' : 'text-accent-orange'
          } ${isLarge ? 'text-2xl' : 'text-lg'}`}
        >
          {region.percentage.toFixed(0)}%
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className={`bg-primary-900 rounded-full overflow-hidden ${isLarge ? 'h-3' : 'h-2'}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              region.percentage >= 100
                ? 'bg-gradient-to-r from-accent-cyan to-cyan-400'
                : region.percentage >= 50
                  ? 'bg-gradient-to-r from-amber-400 to-accent-orange'
                  : 'bg-accent-orange'
            }`}
            style={{ width: `${Math.min(region.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Muscle List */}
      <div className={`space-y-2 ${isLarge ? '' : 'text-sm'}`}>
        {region.muscles.map((muscle) => (
          <div
            key={muscle.name}
            className={`rounded-lg bg-primary-900/50 border border-primary-700/50 ${
              isLarge ? 'p-3' : 'p-2'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-white ${isLarge ? 'text-sm' : 'text-xs'}`}>
                {muscle.name}
              </span>
              <span
                className={`font-semibold ${
                  muscle.volume >= muscle.goal ? 'text-accent-cyan' : 'text-accent-orange'
                } ${isLarge ? 'text-sm' : 'text-xs'}`}
              >
                {muscle.volume.toFixed(1)}
              </span>
            </div>
            <div className={`bg-primary-800 rounded-full overflow-hidden ${isLarge ? 'h-1.5' : 'h-1'}`}>
              <div
                className={`h-full rounded-full ${
                  muscle.percentage >= 100
                    ? 'bg-accent-cyan'
                    : muscle.percentage >= 50
                      ? 'bg-amber-400'
                      : 'bg-accent-orange'
                }`}
                style={{ width: `${Math.min(muscle.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
