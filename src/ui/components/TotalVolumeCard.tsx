/**
 * TotalVolumeCard Component
 * Shows total weekly volume with progress bar
 */

import { useFunctionalGroupVolume } from '@db/hooks/useVolumeStats';
import { useCurrentProfile } from '../context/ProfileContext';

export function TotalVolumeCard(): React.ReactElement {
  const { currentProfile } = useCurrentProfile();
  const { totalVolume, totalGoal, isLoading } = useFunctionalGroupVolume(
    currentProfile?.id ?? null
  );

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-lg bg-primary-500" />;
  }

  const percentage = totalGoal > 0 ? Math.min((totalVolume / totalGoal) * 100, 100) : 0;
  const volumeDisplay = totalVolume % 1 === 0 ? totalVolume : totalVolume.toFixed(1);

  // Progress bar color reflects status (VIS-02: consistent accent, VIS-01: green at goal)
  const getProgressBarClass = (): string => {
    if (percentage >= 100) return 'bg-status-success'; // Green - goal met
    if (percentage >= 75) return 'bg-amber-500'; // Approaching goal
    return 'bg-teal-500'; // In progress
  };

  return (
    <div className="rounded-lg bg-surface-raised p-6">
      <h3 className="mb-2 text-lg font-semibold text-white">Total Weekly Volume</h3>

      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-white">{volumeDisplay}</span>
        <span className="text-lg text-primary-200">sets</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-2 h-3 overflow-hidden rounded-full bg-primary-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressBarClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm text-primary-200">Target: {totalGoal} sets/week</p>
    </div>
  );
}
