/**
 * TotalVolumeCard Component
 * Shows total weekly volume with progress bar
 */

import { useFunctionalGroupVolume, type ViewMode } from '@db/hooks/useVolumeStats';
import { useCurrentProfile } from '../context/ProfileContext';

interface TotalVolumeCardProps {
  viewMode?: ViewMode;
}

export function TotalVolumeCard({ viewMode = 'last7days' }: TotalVolumeCardProps): React.ReactElement {
  const { currentProfile } = useCurrentProfile();
  const { totalVolume, totalGoal, isLoading } = useFunctionalGroupVolume(
    currentProfile?.id ?? null,
    viewMode
  );

  if (isLoading) {
    return <div className="min-h-[72px] animate-pulse rounded-lg bg-zinc-900" />;
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
    <div className="min-h-[72px] rounded-lg border-2 border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Total Weekly Volume
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{volumeDisplay}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              sets
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-zinc-400">Target {totalGoal}</p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">sets/week</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getProgressBarClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
