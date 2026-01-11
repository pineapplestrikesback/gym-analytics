/**
 * MuscleVolumeGrid Component
 * Grid layout of MuscleVolumeCards with expandable breakdown
 */

import { useState } from 'react';
import { MuscleVolumeCard } from './MuscleVolumeCard';
import { useFunctionalGroupVolume, useFunctionalGroupBreakdown } from '@db/hooks/useVolumeStats';
import { useCurrentProfile } from '../context/ProfileContext';
import type { FunctionalGroup } from '@core/taxonomy';

interface MuscleVolumeGridProps {
  showDetails?: boolean;
}

export function MuscleVolumeGrid({
  showDetails = false,
}: MuscleVolumeGridProps): React.ReactElement {
  const { currentProfile } = useCurrentProfile();
  const { stats, isLoading, error } = useFunctionalGroupVolume(currentProfile?.id ?? null);
  const [expandedGroup, setExpandedGroup] = useState<FunctionalGroup | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 14 }).map((_, i) => (
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

  const handleToggleExpand = (group: FunctionalGroup): void => {
    setExpandedGroup(expandedGroup === group ? null : group);
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {stats.map((stat) => (
        <MuscleVolumeCardWithBreakdown
          key={stat.name}
          stat={stat}
          profileId={currentProfile?.id ?? null}
          isExpanded={showDetails && expandedGroup === stat.name}
          onToggleExpand={
            showDetails ? () => handleToggleExpand(stat.name as FunctionalGroup) : undefined
          }
        />
      ))}
    </div>
  );
}

/**
 * Wrapper component that fetches breakdown data when expanded
 */
interface CardWithBreakdownProps {
  stat: { name: string; volume: number; goal: number; percentage: number };
  profileId: string | null;
  isExpanded: boolean;
  onToggleExpand?: () => void;
}

function MuscleVolumeCardWithBreakdown({
  stat,
  profileId,
  isExpanded,
  onToggleExpand,
}: CardWithBreakdownProps): React.ReactElement {
  const { breakdown } = useFunctionalGroupBreakdown(profileId, stat.name as FunctionalGroup, 7);

  return (
    <MuscleVolumeCard
      stat={stat}
      isExpanded={isExpanded}
      breakdown={isExpanded ? breakdown : undefined}
      onToggleExpand={onToggleExpand}
    />
  );
}
