/**
 * BodyHighlighter Component
 * Wrapper around react-body-highlighter that maps our body regions to library muscle slugs
 */

import { useMemo, useRef, useEffect, useCallback } from 'react';
import Model from 'react-body-highlighter';
import type { IExerciseData, IMuscleStats } from 'react-body-highlighter';

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

interface RegionStats {
  region: BodyRegion;
  name: string;
  totalVolume: number;
  totalGoal: number;
  percentage: number;
  muscles: Array<{
    name: string;
    volume: number;
    goal: number;
    percentage: number;
  }>;
}

interface BodyHighlighterProps {
  view: 'front' | 'back';
  regionStats: Map<BodyRegion, RegionStats>;
  onRegionClick: (region: RegionStats) => void;
  onRegionHover?: (region: RegionStats | null) => void;
  getHeatColor: (percentage: number) => string;
}

/**
 * Map body regions to react-body-highlighter muscle slugs
 * Some regions map to multiple muscles depending on the view
 */
const REGION_TO_MUSCLES: Record<BodyRegion, { front: string[]; back: string[] }> = {
  chest: {
    front: ['chest'],
    back: [],
  },
  shoulders: {
    front: ['front-deltoids'],
    back: ['back-deltoids'],
  },
  upperBack: {
    front: [],
    back: ['trapezius', 'upper-back'],
  },
  lowerBack: {
    front: [],
    back: ['lower-back'],
  },
  biceps: {
    front: ['biceps'],
    back: [],
  },
  triceps: {
    front: [],
    back: ['triceps'],
  },
  forearms: {
    front: ['forearm'],
    back: ['forearm'],
  },
  abs: {
    front: ['abs'],
    back: [],
  },
  obliques: {
    front: ['obliques'],
    back: [],
  },
  quads: {
    front: ['quadriceps'],
    back: [],
  },
  hamstrings: {
    front: [],
    back: ['hamstring'],
  },
  glutes: {
    front: [],
    back: ['gluteal'],
  },
  calves: {
    front: [],
    back: ['calves'],
  },
  adductors: {
    front: ['adductor'],
    back: [],
  },
};

/**
 * Map percentage to frequency level (0-5)
 * This determines which color from highlightedColors array to use
 */
function getFrequencyLevel(percentage: number): number {
  if (percentage === 0) return 0;
  if (percentage < 25) return 1;
  if (percentage < 50) return 2;
  if (percentage < 75) return 3;
  if (percentage < 100) return 4;
  return 5;
}

export function BodyHighlighter({
  view,
  regionStats,
  onRegionClick,
  onRegionHover,
  getHeatColor,
}: BodyHighlighterProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  // Create exercise data for the library
  const exerciseData = useMemo(() => {
    const data: IExerciseData[] = [];
    const viewKey = view === 'front' ? 'front' : 'back';

    // For each region, create a "fake" exercise that targets its muscles
    regionStats.forEach((stats, region) => {
      const muscles = REGION_TO_MUSCLES[region][viewKey];

      // Only add if this region has muscles on the current view
      if (muscles.length > 0) {
        const frequency = getFrequencyLevel(stats.percentage);

        // Add one exercise per muscle to ensure proper coloring
        muscles.forEach((muscle) => {
          data.push({
            name: stats.name,
            muscles: [muscle as any],
            frequency,
          });
        });
      }
    });

    return data;
  }, [view, regionStats]);

  // Create color array based on heat color function
  // Index 0 = frequency 1, Index 1 = frequency 2, etc.
  const highlightedColors = useMemo(() => {
    return [
      getHeatColor(12.5), // frequency 1: 0-25% (12.5% midpoint)
      getHeatColor(37.5), // frequency 2: 25-50% (37.5% midpoint)
      getHeatColor(62.5), // frequency 3: 50-75% (62.5% midpoint)
      getHeatColor(87.5), // frequency 4: 75-100% (87.5% midpoint)
      getHeatColor(100),  // frequency 5: 100%+ (goal met)
    ];
  }, [getHeatColor]);

  // Handle muscle click - map muscle slug back to region
  const handleMuscleClick = (muscleStats: IMuscleStats) => {
    const clickedMuscle = muscleStats.muscle;

    // Find which region this muscle belongs to
    for (const [region, stats] of regionStats) {
      const viewKey = view === 'front' ? 'front' : 'back';
      const muscles = REGION_TO_MUSCLES[region][viewKey];

      if (muscles.includes(clickedMuscle)) {
        onRegionClick(stats);
        break;
      }
    }
  };

  // Map muscle slug back to region stats
  const findRegionByMuscle = useCallback((muscleSlug: string): RegionStats | null => {
    const viewKey = view === 'front' ? 'front' : 'back';

    for (const [region, stats] of regionStats) {
      const muscles = REGION_TO_MUSCLES[region][viewKey];
      if (muscles.includes(muscleSlug)) {
        return stats;
      }
    }
    return null;
  }, [view, regionStats]);

  // Attach hover event listeners via DOM since library doesn't support hover props
  useEffect(() => {
    if (!onRegionHover || !containerRef.current) return;

    const container = containerRef.current;

    // Muscle slug mapping from polygon fill colors or data attributes
    // The library uses polygons, we need to identify them by their position/content
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.tagName.toLowerCase() !== 'polygon') return;

      // The library adds 'id' attributes to polygons with muscle names
      const polygonId = target.getAttribute('id');
      if (polygonId) {
        const region = findRegionByMuscle(polygonId);
        if (region) {
          onRegionHover(region);
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.tagName.toLowerCase() !== 'polygon') return;
      onRegionHover(null);
    };

    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);

    return () => {
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
    };
  }, [onRegionHover, findRegionByMuscle]);

  return (
    <>
      <div ref={containerRef} className="flex justify-center">
        <Model
          type={view === 'front' ? 'anterior' : 'posterior'}
          data={exerciseData}
          highlightedColors={highlightedColors}
          bodyColor="rgb(63, 63, 70)" // dim gray for unworked muscles
          onClick={handleMuscleClick}
          style={{
            width: '100%',
            maxWidth: '20rem',
          }}
          svgStyle={{
            filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.1))',
          }}
        />
      </div>

      {/* Custom hover styles for dark gym aesthetic */}
      <style>{`
        .rbh polygon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          stroke: rgb(24, 24, 27);
          stroke-width: 1px;
        }

        .rbh polygon:hover {
          filter: brightness(1.3) drop-shadow(0 0 8px currentColor);
          stroke: white;
          stroke-width: 2px;
        }
      `}</style>
    </>
  );
}
