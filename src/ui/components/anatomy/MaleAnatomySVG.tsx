/**
 * Male Anatomical Diagram
 * Detailed muscle visualization for male body with realistic anatomy
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

export function MaleAnatomySVG({
  view,
  regionStats,
  onRegionClick,
  getHeatColor,
  getGlowFilter,
}: AnatomyProps): React.ReactElement {
  return view === 'front' ? (
    <MaleFrontView
      regionStats={regionStats}
      onRegionClick={onRegionClick}
      getHeatColor={getHeatColor}
      getGlowFilter={getGlowFilter}
    />
  ) : (
    <MaleBackView
      regionStats={regionStats}
      onRegionClick={onRegionClick}
      getHeatColor={getHeatColor}
      getGlowFilter={getGlowFilter}
    />
  );
}

/**
 * Male Front View
 */
function MaleFrontView({
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
      <ellipse cx="100" cy="22" rx="16" ry="20" fill="rgb(39, 39, 42)" opacity="0.4" />
      <rect x="93" y="38" width="14" height="16" fill="rgb(39, 39, 42)" opacity="0.4" />

      {/* Chest - Pectoralis Major (fan-shaped) */}
      <MuscleRegion
        d="M 70 55 Q 68 60 68 68 Q 68 76 70 84 L 75 92 L 85 98 L 95 100 L 100 100 L 105 100 L 115 98 L 125 92 L 130 84 Q 132 76 132 68 Q 132 60 130 55 L 100 58 Z"
        region={getRegion('chest')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Shoulder - Deltoid (rounded cap) */}
      <MuscleRegion
        d="M 48 55 Q 42 53 38 58 Q 35 62 35 68 L 36 78 Q 38 85 45 90 L 55 92 Q 62 88 65 82 L 68 72 L 70 62 L 68 56 Z"
        region={getRegion('shoulders')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Shoulder - Deltoid (rounded cap) */}
      <MuscleRegion
        d="M 152 55 Q 158 53 162 58 Q 165 62 165 68 L 164 78 Q 162 85 155 90 L 145 92 Q 138 88 135 82 L 132 72 L 130 62 L 132 56 Z"
        region={getRegion('shoulders')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Abs - Rectus Abdominis (6-pack grid) */}
      <MuscleRegion
        d="M 80 100 L 82 112 Q 83 120 84 128 Q 85 138 86 148 Q 87 158 88 168 L 92 172 L 100 173 L 108 172 L 112 168 Q 113 158 114 148 Q 115 138 116 128 Q 117 120 118 112 L 120 100 Z"
        region={getRegion('abs')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Oblique (diagonal side) */}
      <MuscleRegion
        d="M 68 105 L 64 115 Q 62 125 62 135 L 64 148 L 70 155 L 78 152 L 82 142 L 84 128 L 82 115 Z"
        region={getRegion('obliques')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Oblique (diagonal side) */}
      <MuscleRegion
        d="M 132 105 L 136 115 Q 138 125 138 135 L 136 148 L 130 155 L 122 152 L 118 142 L 116 128 L 118 115 Z"
        region={getRegion('obliques')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Bicep (oval bulge) */}
      <MuscleRegion
        d="M 38 90 L 34 98 Q 31 106 30 115 L 30 125 L 32 132 L 38 135 L 44 132 L 48 125 Q 50 115 50 105 L 48 95 Z"
        region={getRegion('biceps')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Bicep (oval bulge) */}
      <MuscleRegion
        d="M 162 90 L 166 98 Q 169 106 170 115 L 170 125 L 168 132 L 162 135 L 156 132 L 152 125 Q 150 115 150 105 L 152 95 Z"
        region={getRegion('biceps')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Forearm (tapered) */}
      <MuscleRegion
        d="M 30 135 L 26 148 Q 24 158 23 168 L 24 178 L 28 185 L 34 187 L 40 184 L 44 175 Q 46 165 46 155 L 44 142 L 38 136 Z"
        region={getRegion('forearms')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Forearm (tapered) */}
      <MuscleRegion
        d="M 170 135 L 174 148 Q 176 158 177 168 L 176 178 L 172 185 L 166 187 L 160 184 L 156 175 Q 154 165 154 155 L 156 142 L 162 136 Z"
        region={getRegion('forearms')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Quad (4 distinct heads) */}
      <MuscleRegion
        d="M 75 173 Q 72 183 70 195 Q 68 210 68 225 Q 68 240 70 252 L 74 265 L 80 268 L 88 265 Q 92 252 94 240 Q 95 225 95 210 Q 95 195 92 183 L 88 173 Z"
        region={getRegion('quads')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Quad (4 distinct heads) */}
      <MuscleRegion
        d="M 125 173 Q 128 183 130 195 Q 132 210 132 225 Q 132 240 130 252 L 126 265 L 120 268 L 112 265 Q 108 252 106 240 Q 105 225 105 210 Q 105 195 108 183 L 112 173 Z"
        region={getRegion('quads')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Adductors (inner thigh) */}
      <MuscleRegion
        d="M 92 178 L 94 195 Q 96 210 98 225 Q 99 238 100 248 L 102 248 Q 103 238 104 225 Q 106 210 108 195 L 110 178 L 100 175 Z"
        region={getRegion('adductors')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Calf */}
      <path d="M 72 268 L 68 285 Q 66 298 68 310 L 72 322 L 78 318 L 82 305 Q 84 292 82 280 L 80 268 Z" fill="rgb(39, 39, 42)" opacity="0.4" stroke="rgb(24, 24, 27)" />

      {/* Right Calf */}
      <path d="M 128 268 L 132 285 Q 134 298 132 310 L 128 322 L 122 318 L 118 305 Q 116 292 118 280 L 120 268 Z" fill="rgb(39, 39, 42)" opacity="0.4" stroke="rgb(24, 24, 27)" />

      {/* Hands */}
      <ellipse cx="31" cy="195" rx="6" ry="9" fill="rgb(39, 39, 42)" opacity="0.4" />
      <ellipse cx="169" cy="195" rx="6" ry="9" fill="rgb(39, 39, 42)" opacity="0.4" />

      {/* Feet */}
      <ellipse cx="75" cy="335" rx="8" ry="12" fill="rgb(39, 39, 42)" opacity="0.4" />
      <ellipse cx="125" cy="335" rx="8" ry="12" fill="rgb(39, 39, 42)" opacity="0.4" />
    </svg>
  );
}

/**
 * Male Back View
 */
function MaleBackView({
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
      <ellipse cx="100" cy="22" rx="16" ry="20" fill="rgb(39, 39, 42)" opacity="0.4" />
      <rect x="93" y="38" width="14" height="16" fill="rgb(39, 39, 42)" opacity="0.4" />

      {/* Left Shoulder (Rear Deltoid) */}
      <MuscleRegion
        d="M 48 55 Q 42 53 38 58 Q 35 62 35 68 L 36 78 Q 38 85 45 90 L 55 92 Q 62 88 65 82 L 68 72 L 70 62 L 68 56 Z"
        region={getRegion('shoulders')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Shoulder (Rear Deltoid) */}
      <MuscleRegion
        d="M 152 55 Q 158 53 162 58 Q 165 62 165 68 L 164 78 Q 162 85 155 90 L 145 92 Q 138 88 135 82 L 132 72 L 130 62 L 132 56 Z"
        region={getRegion('shoulders')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Upper Back - Trapezius (diamond/kite) + Lats (wing shapes) */}
      <MuscleRegion
        d="M 70 54 Q 68 58 66 64 L 62 75 Q 58 86 56 98 L 58 110 Q 62 118 68 124 L 78 128 L 90 130 L 100 131 L 110 130 L 122 128 L 132 124 Q 138 118 142 110 L 144 98 Q 142 86 138 75 L 134 64 Q 132 58 130 54 Z"
        region={getRegion('upperBack')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Lower Back - Erector Spinae (vertical strips) */}
      <MuscleRegion
        d="M 78 130 L 76 142 Q 74 154 74 166 L 76 178 L 82 182 L 90 183 L 100 183 L 110 183 L 118 182 L 124 178 L 126 166 Q 126 154 124 142 L 122 130 Z"
        region={getRegion('lowerBack')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Tricep (horseshoe) */}
      <MuscleRegion
        d="M 38 90 L 34 98 Q 31 106 30 115 L 30 125 L 32 132 L 38 135 L 44 132 L 48 125 Q 50 115 50 105 L 48 95 Z"
        region={getRegion('triceps')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Tricep (horseshoe) */}
      <MuscleRegion
        d="M 162 90 L 166 98 Q 169 106 170 115 L 170 125 L 168 132 L 162 135 L 156 132 L 152 125 Q 150 115 150 105 L 152 95 Z"
        region={getRegion('triceps')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Forearm (back) */}
      <MuscleRegion
        d="M 30 135 L 26 148 Q 24 158 23 168 L 24 178 L 28 185 L 34 187 L 40 184 L 44 175 Q 46 165 46 155 L 44 142 L 38 136 Z"
        region={getRegion('forearms')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Forearm (back) */}
      <MuscleRegion
        d="M 170 135 L 174 148 Q 176 158 177 168 L 176 178 L 172 185 L 166 187 L 160 184 L 156 175 Q 154 165 154 155 L 156 142 L 162 136 Z"
        region={getRegion('forearms')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Glute (rounded) */}
      <MuscleRegion
        d="M 76 183 L 72 195 Q 68 206 68 218 L 70 228 L 76 234 L 84 235 L 92 232 L 96 222 Q 98 210 98 198 L 94 186 Z"
        region={getRegion('glutes')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Glute (rounded) */}
      <MuscleRegion
        d="M 124 183 L 128 195 Q 132 206 132 218 L 130 228 L 124 234 L 116 235 L 108 232 L 104 222 Q 102 210 102 198 L 106 186 Z"
        region={getRegion('glutes')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Hamstring (3 muscles) */}
      <MuscleRegion
        d="M 72 235 Q 68 248 66 262 L 68 276 L 74 285 L 82 287 L 90 283 Q 94 272 96 260 Q 98 248 98 236 L 92 233 Z"
        region={getRegion('hamstrings')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Hamstring (3 muscles) */}
      <MuscleRegion
        d="M 128 235 Q 132 248 134 262 L 132 276 L 126 285 L 118 287 L 110 283 Q 106 272 104 260 Q 102 248 102 236 L 108 233 Z"
        region={getRegion('hamstrings')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Left Calf (gastrocnemius & soleus - diamond/heart) */}
      <MuscleRegion
        d="M 70 287 Q 66 298 66 310 L 68 322 L 74 328 L 82 326 L 88 318 Q 90 306 90 294 L 86 286 Z"
        region={getRegion('calves')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Right Calf (gastrocnemius & soleus - diamond/heart) */}
      <MuscleRegion
        d="M 130 287 Q 134 298 134 310 L 132 322 L 126 328 L 118 326 L 112 318 Q 110 306 110 294 L 114 286 Z"
        region={getRegion('calves')}
        onRegionClick={onRegionClick}
        getHeatColor={getHeatColor}
        getGlowFilter={getGlowFilter}
      />

      {/* Hands */}
      <ellipse cx="31" cy="195" rx="6" ry="9" fill="rgb(39, 39, 42)" opacity="0.4" />
      <ellipse cx="169" cy="195" rx="6" ry="9" fill="rgb(39, 39, 42)" opacity="0.4" />

      {/* Feet */}
      <ellipse cx="75" cy="340" rx="8" ry="12" fill="rgb(39, 39, 42)" opacity="0.4" />
      <ellipse cx="125" cy="340" rx="8" ry="12" fill="rgb(39, 39, 42)" opacity="0.4" />
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
