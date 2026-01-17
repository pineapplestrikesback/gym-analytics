/**
 * MuscleHeatmap Mobile Variant
 * Bottom sheet modal experience for mobile devices
 */

import { useMemo, useState } from 'react';
import { useScientificMuscleVolume } from '@db/hooks/useVolumeStats';
import { BodyHighlighter } from '../anatomy/BodyHighlighter';
import { X } from 'lucide-react';
import {
  type MuscleHeatmapProps,
  type RegionStats,
  getHeatColor,
  calculateRegionStats,
} from './MuscleHeatmap.base';

export function MobileHeatmap({ profileId, daysBack = 7 }: MuscleHeatmapProps): React.ReactElement {
  const { stats, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);
  const [selectedRegion, setSelectedRegion] = useState<RegionStats | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');

  // Calculate regional stats
  const regionStats = useMemo(() => calculateRegionStats(stats), [stats]);

  // Convert to Map for anatomy components
  const regionStatsMap = useMemo(() => {
    return new Map(regionStats.map((r) => [r.region, r]));
  }, [regionStats]);

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
      <BodyHighlighter
        view={view}
        regionStats={regionStatsMap}
        onRegionClick={handleRegionClick}
        getHeatColor={getHeatColor}
      />

      {/* Heat Map Legend */}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs">
        <span className="text-primary-300">Low</span>
        <div className="flex h-3 w-48 overflow-hidden rounded-full">
          <div className="flex-1 bg-gradient-to-r from-primary-500 via-accent-orange via-amber-400 to-accent-cyan" />
        </div>
        <span className="text-primary-300">Goal Met</span>
      </div>

      {/* Detail Panel - Modal */}
      {selectedRegion && (
        <MuscleDetailModal region={selectedRegion} onClose={closeDetail} />
      )}
    </div>
  );
}

/**
 * Muscle Detail Modal Component
 * Bottom sheet on mobile, side panel on tablet
 */
function MuscleDetailModal({
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
