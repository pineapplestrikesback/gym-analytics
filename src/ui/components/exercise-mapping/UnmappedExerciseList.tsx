/**
 * Unmapped Exercise List Component
 * Shows exercises that need mapping, sorted by occurrence count
 */

import { useState } from 'react';
import { useUnmappedExercises } from '@db/hooks/useUnmappedExercises';
import { ExerciseSearchModal } from './ExerciseSearchModal';
import type { UnmappedExercise } from '@db/schema';

interface UnmappedExerciseListProps {
  profileId: string;
}

export function UnmappedExerciseList({ profileId }: UnmappedExerciseListProps): React.ReactElement {
  const { unmappedExercises, count, isLoading } = useUnmappedExercises(profileId);
  const [selectedExercise, setSelectedExercise] = useState<UnmappedExercise | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent opacity-30"
            style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
          />
        </div>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div
        className="relative overflow-hidden rounded border-2 border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-950 p-12 text-center"
        style={{
          animation: 'fadeIn 0.4s ease-out',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_50%)]" />
        <div className="relative">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full border-2 border-cyan-500 bg-cyan-500/10 p-5 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <svg
              className="h-full w-full animate-pulse text-cyan-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
              style={{ animationDuration: '2s' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-3 font-mono text-2xl font-black uppercase tracking-tight text-white">
            All Mapped
          </h3>
          <p className="font-mono text-sm text-zinc-500">
            No unmapped exercises found. Great work!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(6,182,212,0.4); }
          50% { box-shadow: 0 0 20px rgba(6,182,212,0.6); }
        }
      `}</style>
      <div className="space-y-3">
        {/* Header Stats */}
        <div
          className="relative mb-6 overflow-hidden rounded border-2 border-zinc-700 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 p-5"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-cyan-500/5 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="font-mono text-sm uppercase tracking-wider text-zinc-500">
              Total Unmapped
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-black text-cyan-500">{count}</span>
              <span className="font-mono text-sm text-zinc-600">exercises</span>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        {unmappedExercises.map((exercise, index) => (
          <button
            key={exercise.id}
            onClick={() => setSelectedExercise(exercise)}
            className="group relative w-full overflow-hidden border-2 border-zinc-700 bg-zinc-900 p-5 text-left transition-all duration-200 hover:border-cyan-500 hover:bg-zinc-800 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] active:scale-[0.99]"
            style={{
              animation: 'slideInRight 0.4s ease-out',
              animationDelay: `${index * 0.05}s`,
              animationFillMode: 'backwards',
            }}
          >
            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative flex items-start justify-between gap-4">
              {/* Exercise Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-1 rounded-full bg-cyan-500 opacity-60 transition-all duration-300 group-hover:h-2 group-hover:w-2 group-hover:opacity-100 group-hover:shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <h4 className="font-mono text-lg font-bold text-white transition-colors duration-200 group-hover:text-cyan-400">
                    {exercise.originalName}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-4 pl-4 font-mono text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {exercise.firstSeenAt.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Occurrence Count Badge */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="rounded border-2 border-cyan-500 bg-cyan-500/10 px-4 py-2 transition-all duration-200 group-hover:border-cyan-400 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  <div className="text-center">
                    <div className="font-mono text-2xl font-black text-cyan-500">
                      {exercise.occurrenceCount}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-cyan-600">
                      {exercise.occurrenceCount === 1 ? 'set' : 'sets'}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-xs text-zinc-600 transition-all duration-200 group-hover:text-cyan-500">
                  Click to map →
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Search Modal */}
      {selectedExercise && (
        <ExerciseSearchModal
          profileId={profileId}
          unmappedExercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </>
  );
}
