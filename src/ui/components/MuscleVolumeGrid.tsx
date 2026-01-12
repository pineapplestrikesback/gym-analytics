/**
 * MuscleVolumeGrid Component
 * Grid layout of MuscleVolumeCards showing scientific muscles
 */

import { MuscleVolumeCard } from './MuscleVolumeCard';
import { useScientificMuscleVolume } from '@db/hooks/useVolumeStats';
import { useCurrentProfile } from '../context/ProfileContext';

export function MuscleVolumeGrid(): React.ReactElement {
  const { currentProfile } = useCurrentProfile();
  const { stats, isLoading, error } = useScientificMuscleVolume(currentProfile?.id ?? null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-primary-500" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-100 p-4 text-red-700">
        Error loading volume stats: {error.message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {stats.map((stat) => (
        <MuscleVolumeCard key={stat.name} stat={stat} />
      ))}
    </div>
  );
}
