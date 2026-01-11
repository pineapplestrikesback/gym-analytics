/**
 * Exercise Search Modal Component
 * Modal for searching and selecting canonical exercises
 */

import { useState, useEffect, useRef } from 'react';
import { searchExercises, getAllCanonicalExercises } from '@core/exercise-search';
import { useCreateExerciseMapping } from '@db/hooks/useExerciseMappings';
import type { UnmappedExercise } from '@db/schema';
import type { ExerciseSearchResult } from '@core/exercise-search';

interface ExerciseSearchModalProps {
  profileId: string;
  unmappedExercise: UnmappedExercise;
  onClose: () => void;
}

export function ExerciseSearchModal({
  profileId,
  unmappedExercise,
  onClose,
}: ExerciseSearchModalProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ExerciseSearchResult[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const { createMapping, isCreating } = useCreateExerciseMapping();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Search for exercises when query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // Show all exercises when search is empty
      setResults(getAllCanonicalExercises().slice(0, 20));
    } else {
      setResults(searchExercises(searchQuery, 20));
    }
  }, [searchQuery]);

  // Initial load - show top exercises
  useEffect(() => {
    setResults(getAllCanonicalExercises().slice(0, 20));
  }, []);

  const handleCreateMapping = async (
    canonicalExerciseId: string | null,
    ignored: boolean
  ): Promise<void> => {
    try {
      await createMapping({
        profileId,
        originalPattern: unmappedExercise.normalizedName,
        canonicalExerciseId,
        isIgnored: ignored,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create mapping:', error);
    }
  };

  const handleSelectAndConfirm = async (): Promise<void> => {
    if (selectedExerciseId) {
      await handleCreateMapping(selectedExerciseId, false);
    }
  };

  const handleMarkAsIgnored = async (): Promise<void> => {
    await handleCreateMapping(null, true);
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      onClick={handleBackdropClick}
      style={{
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .modal-content {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
      <div className="modal-content w-full max-w-2xl border-2 border-cyan-500 bg-zinc-900 shadow-[0_0_60px_rgba(6,182,212,0.3)]">
        {/* Modal Header */}
        <div className="relative overflow-hidden border-b-2 border-cyan-500 bg-gradient-to-r from-zinc-800 via-zinc-850 to-zinc-800 p-6">
          {/* Animated scanline effect */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"
            style={{
              animation: 'scanline 3s linear infinite',
            }}
          />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <div className="font-mono text-xs uppercase tracking-widest text-cyan-500">
                Map Exercise
              </div>
            </div>
            <h2 className="mb-2 font-mono text-2xl font-black text-white">
              {unmappedExercise.originalName}
            </h2>
            <p className="font-mono text-sm text-zinc-500">
              Select a canonical exercise or mark as ignored
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="border-b-2 border-zinc-700 bg-zinc-950 p-5">
          <div className="relative">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <svg
                className="h-5 w-5 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-zinc-700 bg-zinc-900 py-4 pl-12 pr-4 font-mono text-sm text-white placeholder-zinc-600 transition-all duration-200 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] focus:outline-none"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto border-b-2 border-zinc-700 bg-zinc-950">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <svg
                className="mb-4 h-16 w-16 text-zinc-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-mono text-sm font-medium text-zinc-600">No exercises found</p>
              <p className="mt-1 font-mono text-xs text-zinc-700">Try a different search term</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => setSelectedExerciseId(result.id)}
                  className={`group relative w-full overflow-hidden p-4 text-left font-mono text-sm transition-all duration-150 ${
                    selectedExerciseId === result.id
                      ? 'bg-cyan-500 text-zinc-900 shadow-[inset_0_0_20px_rgba(6,182,212,0.3)]'
                      : 'bg-zinc-900 text-white hover:bg-zinc-850'
                  }`}
                  style={{
                    animation: 'fadeIn 0.2s ease-out',
                    animationDelay: `${index * 0.02}s`,
                    animationFillMode: 'backwards',
                  }}
                >
                  {selectedExerciseId !== result.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  )}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                          selectedExerciseId === result.id
                            ? 'h-2 w-2 bg-zinc-900 shadow-[0_0_8px_rgba(0,0,0,0.5)]'
                            : 'bg-cyan-500 opacity-40 group-hover:opacity-100'
                        }`}
                      />
                      <span className="font-medium">{result.name}</span>
                    </div>
                    {selectedExerciseId === result.id && (
                      <span className="text-lg font-black">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-0">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="group relative overflow-hidden border-r-2 border-zinc-700 bg-zinc-800 px-4 py-5 font-mono text-sm font-bold uppercase tracking-wider text-zinc-500 transition-all duration-200 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-700/50 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <span className="relative">Cancel</span>
          </button>
          <button
            onClick={() => void handleMarkAsIgnored()}
            disabled={isCreating}
            className="group relative overflow-hidden border-r-2 border-zinc-700 bg-zinc-800 px-4 py-5 font-mono text-sm font-bold uppercase tracking-wider text-amber-500 transition-all duration-200 hover:bg-zinc-700 hover:text-amber-400 disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <span className="relative">{isCreating ? 'Saving...' : 'Ignore'}</span>
          </button>
          <button
            onClick={() => void handleSelectAndConfirm()}
            disabled={!selectedExerciseId || isCreating}
            className="group relative overflow-hidden bg-cyan-500 px-4 py-5 font-mono text-sm font-bold uppercase tracking-wider text-zinc-900 transition-all duration-200 hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:hover:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-600/50 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-disabled:opacity-0" />
            <span className="relative">{isCreating ? 'Saving...' : 'Confirm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
