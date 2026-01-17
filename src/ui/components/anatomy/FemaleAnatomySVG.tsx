/**
 * Female Anatomical Diagram
 * Detailed muscle visualization for female body with realistic anatomy
 */

import { useState } from 'react';

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

interface AnatomyProps {
  view: 'front' | 'back';
  regionStats: Map<BodyRegion, RegionStats>;
  onRegionClick: (region: RegionStats) => void;
  getHeatColor: (percentage: number) => string;
  getGlowFilter: (percentage: number) => string;
}

export function FemaleAnatomySVG({
  view,
  regionStats,
  onRegionClick,
  getHeatColor,
  getGlowFilter,
}: AnatomyProps): React.ReactElement {
  return view === 'front' ? (
    <FemaleFrontView
      regionStats={regionStats}
      onRegionClick={onRegionClick}
      getHeatColor={getHeatColor}
      getGlowFilter={getGlowFilter}
    />
  ) : (
    <FemaleBackView
      regionStats={regionStats}
      onRegionClick={onRegionClick}
      getHeatColor={getHeatColor}
      getGlowFilter={getGlowFilter}
    />
  );
}

/**
 * Female Front View
 * Features: Narrower shoulders, wider hips, different chest contour
 */
function FemaleFrontView({
  regionStats,
  onRegionClick,
  getHeatColor,
  getGlowFilter,
}: Omit<AnatomyProps, 'view'>): React.ReactElement {
  const getRegion = (region: BodyRegion) => regionStats.get(region);

  return (
    <svg
      viewBox="0 0 200 400"
      className="w-full max-w-xs md:max-w-sm"
      style={{ filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.1))' }}
    >
      {/* Head */}
      <ellipse cx="100" cy="24" rx="15" ry="18" fill="rgb(39, 39, 42)" opacity="0.4" />
      <rect x="94" y="38" width="12" height="14" fill="rgb(39, 39, 42)" opacity="0.4" />

      {/* Chest - Pectoralis (narrower, higher placement for female anatomy) */}
      <MuscleRegion
        d="M 75 56 Q 73 60 72 66 Q 71 72 72 78 L 76 86 L 82 92 L 90 95 L 95 96 L 100 96 L 105 96 L 110 95 L 118 92 L 124 86 L 128 78 Q 129 72 128 66 Q 127 60 125 56 L 100 58 Z"
        region={getRegion('chest')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Shoulder - Deltoid (smaller, rounder) */}
      <MuscleRegion
        d="M 54 56 Q 50 54 46 58 Q 43 62 42 68 L 43 76 Q 45 82 50 86 L 58 88 Q 64 84 66 80 L 68 72 L 70 62 L 68 57 Z"
        region={getRegion('shoulders')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Shoulder - Deltoid (smaller, rounder) */}
      <MuscleRegion
        d="M 146 56 Q 150 54 154 58 Q 157 62 158 68 L 157 76 Q 155 82 150 86 L 142 88 Q 136 84 134 80 L 132 72 L 130 62 L 132 57 Z"
        region={getRegion('shoulders')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Abs - Rectus Abdominis (more tapered) */}
      <MuscleRegion
        d="M 83 96 L 84 108 Q 85 118 86 128 Q 87 140 88 152 Q 89 164 90 174 L 94 178 L 100 179 L 106 178 L 110 174 Q 111 164 112 152 Q 113 140 114 128 Q 115 118 116 108 L 117 96 Z"
        region={getRegion('abs')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Oblique */}
      <MuscleRegion
        d="M 72 102 L 68 114 Q 66 126 66 138 L 68 152 L 73 162 L 80 160 L 84 148 L 86 132 L 85 118 Z"
        region={getRegion('obliques')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Oblique */}
      <MuscleRegion
        d="M 128 102 L 132 114 Q 134 126 134 138 L 132 152 L 127 162 L 120 160 L 116 148 L 114 132 L 115 118 Z"
        region={getRegion('obliques')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Bicep */}
      <MuscleRegion
        d="M 42 88 L 38 96 Q 35 104 34 113 L 34 123 L 36 130 L 42 133 L 48 130 L 52 123 Q 54 113 54 103 L 52 93 Z"
        region={getRegion('biceps')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Bicep */}
      <MuscleRegion
        d="M 158 88 L 162 96 Q 165 104 166 113 L 166 123 L 164 130 L 158 133 L 152 130 L 148 123 Q 146 113 146 103 L 148 93 Z"
        region={getRegion('biceps')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Forearm */}
      <MuscleRegion
        d="M 34 133 L 30 146 Q 28 156 27 166 L 28 176 L 32 183 L 38 185 L 44 182 L 48 173 Q 50 163 50 153 L 48 140 L 42 134 Z"
        region={getRegion('forearms')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Forearm */}
      <MuscleRegion
        d="M 166 133 L 170 146 Q 172 156 173 166 L 172 176 L 168 183 L 162 185 L 156 182 L 152 173 Q 150 163 150 153 L 152 140 L 158 134 Z"
        region={getRegion('forearms')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Quad (wider hips) */}
      <MuscleRegion
        d="M 78 179 Q 74 189 71 201 Q 68 216 68 231 Q 68 246 70 258 L 74 271 L 80 274 L 88 271 Q 92 258 94 246 Q 95 231 95 216 Q 95 201 92 189 L 88 179 Z"
        region={getRegion('quads')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Quad (wider hips) */}
      <MuscleRegion
        d="M 122 179 Q 126 189 129 201 Q 132 216 132 231 Q 132 246 130 258 L 126 271 L 120 274 L 112 271 Q 108 258 106 246 Q 105 231 105 216 Q 105 201 108 189 L 112 179 Z"
        region={getRegion('quads')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Adductors */}
      <MuscleRegion
        d="M 92 184 L 94 201 Q 96 216 98 231 Q 99 244 100 254 L 102 254 Q 103 244 104 231 Q 106 216 108 201 L 110 184 L 100 181 Z"
        region={getRegion('adductors')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Calf */}
      <path d="M 72 274 L 68 291 Q 66 304 68 316 L 72 328 L 78 324 L 82 311 Q 84 298 82 286 L 80 274 Z" fill="rgb(39, 39, 42)" opacity="0.4" stroke="rgb(24, 24, 27)" />

      {/* Right Calf */}
      <path d="M 128 274 L 132 291 Q 134 304 132 316 L 128 328 L 122 324 L 118 311 Q 116 298 118 286 L 120 274 Z" fill="rgb(39, 39, 42)" opacity="0.4" stroke="rgb(24, 24, 27)" />

      {/* Hands */}
      <ellipse cx="35" cy="193" rx="5" ry="8" fill="rgb(39, 39, 42)" opacity="0.4" />
      <ellipse cx="165" cy="193" rx="5" ry="8" fill="rgb(39, 39, 42)" opacity="0.4" />

      {/* Feet */}
      <ellipse cx="75" cy="340" rx="7" ry="11" fill="rgb(39, 39, 42)" opacity="0.4" />
      <ellipse cx="125" cy="340" rx="7" ry="11" fill="rgb(39, 39, 42)" opacity="0.4" />
    </svg>
  );
}

/**
 * Female Back View
 */
function FemaleBackView({
  regionStats,
  onRegionClick,
  getHeatColor,
  getGlowFilter,
}: Omit<AnatomyProps, 'view'>): React.ReactElement {
  const getRegion = (region: BodyRegion) => regionStats.get(region);

  return (
    <svg
      viewBox="0 0 200 400"
      className="w-full max-w-xs md:max-w-sm"
      style={{ filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.1))' }}
    >
      {/* Head */}
      <ellipse cx="100" cy="24" rx="15" ry="18" fill="rgb(39, 39, 42)" opacity="0.4" />
      <rect x="94" y="38" width="12" height="14" fill="rgb(39, 39, 42)" opacity="0.4" />

      {/* Left Shoulder (Rear Deltoid) */}
      <MuscleRegion
        d="M 54 56 Q 50 54 46 58 Q 43 62 42 68 L 43 76 Q 45 82 50 86 L 58 88 Q 64 84 66 80 L 68 72 L 70 62 L 68 57 Z"
        region={getRegion('shoulders')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Shoulder (Rear Deltoid) */}
      <MuscleRegion
        d="M 146 56 Q 150 54 154 58 Q 157 62 158 68 L 157 76 Q 155 82 150 86 L 142 88 Q 136 84 134 80 L 132 72 L 130 62 L 132 57 Z"
        region={getRegion('shoulders')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Upper Back - Trapezius + Lats (more tapered, less wide) */}
      <MuscleRegion
        d="M 72 54 Q 70 58 68 64 L 64 76 Q 60 88 58 100 L 60 112 Q 64 120 70 126 L 80 130 L 90 132 L 100 133 L 110 132 L 120 130 L 130 126 Q 136 120 140 112 L 142 100 Q 140 88 136 76 L 132 64 Q 130 58 128 54 Z"
        region={getRegion('upperBack')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Lower Back - Erector Spinae */}
      <MuscleRegion
        d="M 80 132 L 78 144 Q 76 156 76 168 L 78 180 L 84 184 L 92 185 L 100 185 L 108 185 L 116 184 L 122 180 L 124 168 Q 124 156 122 144 L 120 132 Z"
        region={getRegion('lowerBack')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Tricep */}
      <MuscleRegion
        d="M 42 88 L 38 96 Q 35 104 34 113 L 34 123 L 36 130 L 42 133 L 48 130 L 52 123 Q 54 113 54 103 L 52 93 Z"
        region={getRegion('triceps')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Tricep */}
      <MuscleRegion
        d="M 158 88 L 162 96 Q 165 104 166 113 L 166 123 L 164 130 L 158 133 L 152 130 L 148 123 Q 146 113 146 103 L 148 93 Z"
        region={getRegion('triceps')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Forearm (back) */}
      <MuscleRegion
        d="M 34 133 L 30 146 Q 28 156 27 166 L 28 176 L 32 183 L 38 185 L 44 182 L 48 173 Q 50 163 50 153 L 48 140 L 42 134 Z"
        region={getRegion('forearms')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Forearm (back) */}
      <MuscleRegion
        d="M 166 133 L 170 146 Q 172 156 173 166 L 172 176 L 168 183 L 162 185 L 156 182 L 152 173 Q 150 163 150 153 L 152 140 L 158 134 Z"
        region={getRegion('forearms')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Glute (more prominent, rounded) */}
      <MuscleRegion
        d="M 78 185 L 73 197 Q 68 210 68 224 L 70 236 L 76 243 L 84 244 L 92 241 L 96 230 Q 98 218 98 206 L 94 190 Z"
        region={getRegion('glutes')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Glute (more prominent, rounded) */}
      <MuscleRegion
        d="M 122 185 L 127 197 Q 132 210 132 224 L 130 236 L 124 243 L 116 244 L 108 241 L 104 230 Q 102 218 102 206 L 106 190 Z"
        region={getRegion('glutes')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Hamstring */}
      <MuscleRegion
        d="M 72 244 Q 68 257 66 272 L 68 286 L 74 295 L 82 297 L 90 293 Q 94 282 96 270 Q 98 258 98 246 L 92 242 Z"
        region={getRegion('hamstrings')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Hamstring */}
      <MuscleRegion
        d="M 128 244 Q 132 257 134 272 L 132 286 L 126 295 L 118 297 L 110 293 Q 106 282 104 270 Q 102 258 102 246 L 108 242 Z"
        region={getRegion('hamstrings')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Calf */}
      <MuscleRegion
        d="M 70 297 Q 66 308 66 320 L 68 332 L 74 338 L 82 336 L 88 328 Q 90 316 90 304 L 86 296 Z"
        region={getRegion('calves')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Calf */}
      <MuscleRegion
        d="M 130 297 Q 134 308 134 320 L 132 332 L 126 338 L 118 336 L 112 328 Q 110 316 110 304 L 114 296 Z"
        region={getRegion('calves')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Hands */}
      <ellipse cx="35" cy="193" rx="5" ry="8" fill="rgb(39, 39, 42)" opacity="0.4" />
      <ellipse cx="165" cy="193" rx="5" ry="8" fill="rgb(39, 39, 42)" opacity="0.4" />

      {/* Feet */}
      <ellipse cx="75" cy="348" rx="7" ry="11" fill="rgb(39, 39, 42)" opacity="0.4" />
      <ellipse cx="125" cy="348" rx="7" ry="11" fill="rgb(39, 39, 42)" opacity="0.4" />
    </svg>
  );
}

/**
 * Interactive Muscle Region Component
 */
function MuscleRegion({
  d,
  region,
  onRegionClick,
  getHeatColor,
  getGlowFilter,
}: {
  d: string;
  region: RegionStats | undefined;
  onRegionClick: (region: RegionStats) => void;
  getHeatColor: (percentage: number) => string;
  getGlowFilter: (percentage: number) => string;
}): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  if (!region) {
    return <path d={d} fill="rgb(39, 39, 42)" opacity="0.4" stroke="rgb(24, 24, 27)" strokeWidth="1" />;
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
