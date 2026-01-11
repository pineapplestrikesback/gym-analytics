/**
 * MuscleVolumeCard Component
 * Displays volume stats for a single muscle group
 */

import type { VolumeStatItem } from '@db/hooks/useVolumeStats';

interface MuscleVolumeCardProps {
  stat: VolumeStatItem;
  isExpanded?: boolean;
  breakdown?: VolumeStatItem[];
  onToggleExpand?: () => void;
}

export function MuscleVolumeCard({
  stat,
  isExpanded = false,
  breakdown,
  onToggleExpand,
}: MuscleVolumeCardProps): React.ReactElement {
  const isBelowGoal = stat.volume < stat.goal;
  const volumeDisplay = stat.volume % 1 === 0 ? stat.volume.toString() : stat.volume.toFixed(1);

  return (
    <div className="rounded-lg bg-primary-700 p-4 shadow-sm">
      <div
        className={`${onToggleExpand ? 'cursor-pointer' : ''}`}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (onToggleExpand && (e.key === 'Enter' || e.key === ' ')) {
            onToggleExpand();
          }
        }}
        role={onToggleExpand ? 'button' : undefined}
        tabIndex={onToggleExpand ? 0 : undefined}
      >
        {/* Muscle Name */}
        <h4 className="mb-1 text-sm font-medium text-primary-200">{stat.name}</h4>

        {/* Volume Value */}
        <p
          className={`text-xl font-bold ${isBelowGoal ? 'text-accent-orange' : 'text-accent-cyan'}`}
        >
          {volumeDisplay} sets
        </p>

        {/* Goal */}
        <p className="text-xs text-primary-300">Goal: {stat.goal}</p>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && breakdown && breakdown.length > 0 && (
        <div className="mt-3 border-t border-primary-600 pt-3">
          {breakdown.map((item) => (
            <div key={item.name} className="flex items-center justify-between py-1 text-sm">
              <span className="text-primary-300">{item.name}</span>
              <span className={item.volume < item.goal ? 'text-accent-orange' : 'text-primary-200'}>
                {item.volume % 1 === 0 ? item.volume : item.volume.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
