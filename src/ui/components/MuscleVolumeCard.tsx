/**
 * MuscleVolumeCard Component
 * Displays volume stats for a single scientific muscle
 */

import type { VolumeStatItem } from '@db/hooks/useVolumeStats';

interface MuscleVolumeCardProps {
  stat: VolumeStatItem;
}

export function MuscleVolumeCard({ stat }: MuscleVolumeCardProps): React.ReactElement {
  const isBelowGoal = stat.volume < stat.goal;
  const volumeDisplay = stat.volume % 1 === 0 ? stat.volume.toString() : stat.volume.toFixed(1);

  return (
    <div className="rounded-lg bg-primary-700 p-4 shadow-sm">
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
  );
}
