/**
 * Existing Mappings List Component
 * Shows all user-created exercise mappings with edit and delete functionality
 */

import { useState } from 'react';
import { useExerciseMappings, useDeleteExerciseMapping } from '@db/hooks/useExerciseMappings';
import { getAllCanonicalExercises } from '@core/exercise-search';
import type { ExerciseMapping, UnmappedExercise } from '@db/schema';
import { ExerciseSearchModal } from './ExerciseSearchModal';

interface ExistingMappingsListProps {
  profileId: string;
}

export function ExistingMappingsList({ profileId }: ExistingMappingsListProps): React.ReactElement {
  const { mappings, isLoading } = useExerciseMappings(profileId);
  const { deleteMapping, isDeleting } = useDeleteExerciseMapping();
  const [editingMapping, setEditingMapping] = useState<ExerciseMapping | null>(null);

  // Create a lookup map for canonical exercise names
  const exerciseMap = new Map(getAllCanonicalExercises().map((ex) => [ex.id, ex.name]));

  // Create a fake UnmappedExercise for editing existing mappings
  const createUnmappedForEdit = (mapping: ExerciseMapping): UnmappedExercise => ({
    id: `edit-${mapping.id}`,
    profileId: mapping.profileId,
    originalName: mapping.originalPattern,
    normalizedName: mapping.originalPattern,
    firstSeenAt: mapping.createdAt,
    occurrenceCount: 0,
  });

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Delete this mapping? The exercise will return to the unmapped list.')) {
      try {
        await deleteMapping(id);
      } catch (error) {
        console.error('Failed to delete mapping:', error);
      }
    }
  };

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

  if (mappings.length === 0) {
    return (
      <div
        className="relative overflow-hidden rounded border-2 border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-950 p-12 text-center"
        style={{ animation: 'fadeIn 0.4s ease-out' }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(113,113,122,0.05),transparent_50%)]" />
        <div className="relative">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full border-2 border-zinc-700 bg-zinc-800 p-5">
            <svg
              className="h-full w-full text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="mb-3 font-mono text-2xl font-black uppercase tracking-tight text-white">
            No Mappings Yet
          </h3>
          <p className="font-mono text-sm text-zinc-500">
            Map unmapped exercises to start building your mappings library
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {/* Header Stats */}
      <div
        className="relative mb-6 overflow-hidden rounded border-2 border-zinc-700 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 p-5"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-cyan-500/5 to-transparent" />
        <div className="relative flex items-center justify-between">
          <div className="font-mono text-sm uppercase tracking-wider text-zinc-500">
            Total Mappings
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl font-black text-cyan-500">{mappings.length}</span>
            <span className="font-mono text-sm text-zinc-600">active</span>
          </div>
        </div>
      </div>

      {/* Mappings List */}
      {mappings.map((mapping, index) => {
        const canonicalName = mapping.canonicalExerciseId
          ? (exerciseMap.get(mapping.canonicalExerciseId) ?? 'Unknown Exercise')
          : null;

        return (
          <div
            key={mapping.id}
            className="group relative overflow-hidden border-2 border-zinc-700 bg-zinc-900 p-5 transition-all duration-200 hover:border-zinc-600 hover:shadow-lg"
            style={{
              animation: 'slideIn 0.4s ease-out',
              animationDelay: `${index * 0.05}s`,
              animationFillMode: 'backwards',
            }}
          >
            {/* Background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative flex items-start justify-between gap-4">
              {/* Mapping Info */}
              <div className="flex-1 space-y-3">
                {/* Original Pattern */}
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-zinc-600" />
                  <div className="font-mono text-xs uppercase tracking-wider text-zinc-600">
                    Original Pattern
                  </div>
                </div>
                <div className="pl-3 font-mono text-sm text-zinc-400">
                  {mapping.originalPattern}
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-2 pl-3">
                  <svg
                    className="h-4 w-4 text-cyan-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  <span className="font-mono text-xs uppercase tracking-wider text-cyan-500">
                    maps to
                  </span>
                </div>

                {/* Canonical Name, Custom Mapping, or Ignored */}
                <div className="pl-3">
                  {mapping.isIgnored ? (
                    <div className="inline-flex items-center gap-2 rounded border-2 border-amber-900 bg-amber-950/50 px-3 py-1.5">
                      <svg
                        className="h-4 w-4 text-amber-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                      <span className="font-mono text-sm font-bold uppercase text-amber-500">
                        Ignored
                      </span>
                    </div>
                  ) : mapping.customMuscleValues ? (
                    <div>
                      <div className="inline-flex items-center gap-2 rounded border-2 border-purple-900 bg-purple-950/50 px-3 py-1.5">
                        <svg
                          className="h-4 w-4 text-purple-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                          />
                        </svg>
                        <span className="font-mono text-sm font-bold uppercase text-purple-500">
                          Custom Mapping
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-zinc-500">
                        {Object.keys(mapping.customMuscleValues).length} muscles defined
                      </div>
                    </div>
                  ) : (
                    <div className="font-mono text-lg font-bold text-white">{canonicalName}</div>
                  )}
                </div>

                {/* Created Date */}
                <div className="flex items-center gap-2 pl-3 pt-2">
                  <svg
                    className="h-3 w-3 text-zinc-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="font-mono text-xs text-zinc-700">
                    Created{' '}
                    {mapping.createdAt.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex shrink-0 gap-2">
                {/* Edit Button */}
                <button
                  onClick={() => setEditingMapping(mapping)}
                  className="group/btn relative overflow-hidden border-2 border-cyan-900 bg-cyan-950 px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-cyan-500 transition-all duration-200 hover:border-cyan-700 hover:bg-cyan-900 hover:text-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-800/50 to-transparent opacity-0 transition-opacity duration-200 group-hover/btn:opacity-100" />
                  <div className="relative flex items-center gap-2">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>Edit</span>
                  </div>
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => void handleDelete(mapping.id)}
                  disabled={isDeleting}
                  className="group/btn relative overflow-hidden border-2 border-red-900 bg-red-950 px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-red-500 transition-all duration-200 hover:border-red-700 hover:bg-red-900 hover:text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-red-800/50 to-transparent opacity-0 transition-opacity duration-200 group-hover/btn:opacity-100" />
                  <div className="relative flex items-center gap-2">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Edit Modal */}
      {editingMapping && (
        <ExerciseSearchModal
          profileId={profileId}
          unmappedExercise={createUnmappedForEdit(editingMapping)}
          editingMapping={editingMapping}
          onClose={() => setEditingMapping(null)}
        />
      )}
    </div>
  );
}
