/**
 * Exercise Search Modal Component
 * Modal for searching canonical exercises or creating custom muscle mappings
 *
 * 3 Tabs:
 * 1. Search Canonical - existing search functionality
 * 2. Copy & Edit - search + pre-fill MuscleValueEditor with selected exercise's values
 * 3. From Scratch - empty MuscleValueEditor for custom entry
 */

import { useState, useEffect, useRef } from 'react';
import { searchExercises, getAllCanonicalExercises } from '@core/exercise-search';
import { useCreateExerciseMapping, useUpdateExerciseMapping } from '@db/hooks/useExerciseMappings';
import type { UnmappedExercise, ExerciseMapping } from '@db/schema';
import type { ExerciseSearchResult } from '@core/exercise-search';
import type { ScientificMuscle } from '@core/taxonomy';
import { MuscleValueEditor } from './MuscleValueEditor';
import exerciseListJson from '../../../../config/exercise_list_complete.json';

type TabType = 'search' | 'copyEdit' | 'scratch';

interface ExerciseSearchModalProps {
  profileId: string;
  unmappedExercise: UnmappedExercise;
  onClose: () => void;
  /** If provided, we're editing an existing mapping */
  editingMapping?: ExerciseMapping | null;
  /** If provided, start on scratch tab with values copied from this exercise */
  prefillFromExercise?: string | null;
}

// Get muscle values for a canonical exercise
function getCanonicalMuscleValues(
  exerciseName: string
): Partial<Record<ScientificMuscle, number>> | null {
  const data = exerciseListJson as unknown as Record<string, Record<string, number>>;
  const values = data[exerciseName];
  if (!values || typeof values === 'string') return null;
  return values as Partial<Record<ScientificMuscle, number>>;
}

export function ExerciseSearchModal({
  profileId,
  unmappedExercise,
  onClose,
  editingMapping = null,
  prefillFromExercise = null,
}: ExerciseSearchModalProps): React.ReactElement {
  // Get canonical exercise name from ID (for display when editing)
  const getCanonicalNameFromId = (id: string): string | null => {
    const exercises = getAllCanonicalExercises();
    const found = exercises.find((ex) => ex.id === id);
    return found?.name ?? null;
  };

  // Get initial muscle values if prefilling or editing
  const getInitialMuscleValues = (): Partial<Record<ScientificMuscle, number>> => {
    if (editingMapping?.customMuscleValues) return editingMapping.customMuscleValues;
    if (editingMapping?.canonicalExerciseId) {
      // Load values from the canonical exercise when editing a canonical mapping
      const canonicalName = getCanonicalNameFromId(editingMapping.canonicalExerciseId);
      if (canonicalName) {
        const values = getCanonicalMuscleValues(canonicalName);
        if (values) return values;
      }
    }
    if (prefillFromExercise) {
      const values = getCanonicalMuscleValues(prefillFromExercise);
      if (values) return values;
    }
    return {};
  };

  // Get the exercise name to show as "copied from"
  const getInitialCopiedFrom = (): string | null => {
    if (prefillFromExercise) return prefillFromExercise;
    if (editingMapping?.canonicalExerciseId) {
      return getCanonicalNameFromId(editingMapping.canonicalExerciseId);
    }
    return null;
  };

  // Determine initial tab based on editing mode or prefill
  // When editing any existing mapping, always go to scratch tab so user can see/modify values
  const getInitialTab = (): TabType => {
    if (prefillFromExercise) return 'scratch';
    if (editingMapping) return 'scratch'; // Always scratch when editing existing mappings
    return 'search';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ExerciseSearchResult[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    editingMapping?.canonicalExerciseId ?? null
  );
  const [muscleValues, setMuscleValues] = useState<Partial<Record<ScientificMuscle, number>>>(
    getInitialMuscleValues
  );
  const [copiedFromExercise, setCopiedFromExercise] = useState<string | null>(
    getInitialCopiedFrom
  );

  const { createMapping, isCreating } = useCreateExerciseMapping();
  const { updateMapping, isUpdating } = useUpdateExerciseMapping();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isSaving = isCreating || isUpdating;

  // Auto-focus search input on mount or tab change
  useEffect(() => {
    if (activeTab === 'search' || activeTab === 'copyEdit') {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  // Search for exercises when query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults(getAllCanonicalExercises().slice(0, 20));
    } else {
      setResults(searchExercises(searchQuery, 20));
    }
  }, [searchQuery]);

  // Initial load - show top exercises
  useEffect(() => {
    setResults(getAllCanonicalExercises().slice(0, 20));
  }, []);

  // Handle saving a mapping (canonical or custom)
  const handleSaveMapping = async (
    canonicalExerciseId: string | null,
    customValues: Partial<Record<ScientificMuscle, number>> | null,
    ignored: boolean
  ): Promise<void> => {
    try {
      const mappingData = {
        profileId,
        originalPattern: unmappedExercise.normalizedName,
        canonicalExerciseId,
        customMuscleValues: customValues,
        isIgnored: ignored,
      };

      if (editingMapping) {
        await updateMapping(editingMapping.id, mappingData);
      } else {
        await createMapping(mappingData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save mapping:', error);
    }
  };

  // Tab 1: Search - confirm canonical selection
  const handleConfirmCanonical = async (): Promise<void> => {
    if (selectedExerciseId) {
      await handleSaveMapping(selectedExerciseId, null, false);
    }
  };

  // Tab 2: Copy & Edit - copy values from selected exercise
  const handleCopyFromExercise = (exerciseName: string): void => {
    const values = getCanonicalMuscleValues(exerciseName);
    if (values) {
      setMuscleValues(values);
      setCopiedFromExercise(exerciseName);
      setActiveTab('scratch'); // Switch to scratch tab to edit
    }
  };

  // Tab 3: From Scratch - save custom values
  const handleConfirmCustom = async (): Promise<void> => {
    // Filter out zero values
    const nonZeroValues = Object.fromEntries(
      Object.entries(muscleValues).filter(([, v]) => v && v > 0)
    ) as Partial<Record<ScientificMuscle, number>>;

    if (Object.keys(nonZeroValues).length === 0) {
      return; // Button should be disabled anyway
    }

    await handleSaveMapping(null, nonZeroValues, false);
  };

  // Mark as ignored
  const handleMarkAsIgnored = async (): Promise<void> => {
    await handleSaveMapping(null, null, true);
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'search', label: 'Search Canonical' },
    { id: 'copyEdit', label: 'Copy & Edit' },
    { id: 'scratch', label: 'From Scratch' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      onClick={handleBackdropClick}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
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
        .modal-content {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      <div className="modal-content flex max-h-[90vh] w-full max-w-2xl flex-col border-2 border-cyan-500 bg-zinc-900 shadow-[0_0_60px_rgba(6,182,212,0.3)]">
        {/* Modal Header */}
        <div className="border-b-2 border-cyan-500 bg-gradient-to-r from-zinc-800 via-zinc-850 to-zinc-800 p-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <div className="font-mono text-xs uppercase tracking-widest text-cyan-500">
              {editingMapping ? 'Edit Mapping' : 'Map Exercise'}
            </div>
          </div>
          <h2 className="mb-2 font-mono text-2xl font-black text-white">
            {unmappedExercise.originalName}
          </h2>
          <p className="font-mono text-sm text-zinc-500">
            {activeTab === 'search' && 'Select a canonical exercise'}
            {activeTab === 'copyEdit' && 'Copy values from an exercise, then customize'}
            {activeTab === 'scratch' && 'Define custom muscle values'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-zinc-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 font-mono text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'border-b-2 border-cyan-500 bg-zinc-800 text-cyan-400'
                  : 'text-zinc-500 hover:bg-zinc-850 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <>
              {/* Search Input */}
              <div className="border-b-2 border-zinc-700 bg-zinc-950 p-4">
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
                    className="w-full border-2 border-zinc-700 bg-zinc-900 py-3 pl-12 pr-4 font-mono text-sm text-white placeholder-zinc-600 transition-all focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Results List */}
              <div className="max-h-80 overflow-y-auto bg-zinc-950">
                {results.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="font-mono text-sm text-zinc-600">No exercises found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => setSelectedExerciseId(result.id)}
                        className={`w-full p-4 text-left font-mono text-sm transition-all ${
                          selectedExerciseId === result.id
                            ? 'bg-cyan-500 text-zinc-900'
                            : 'bg-zinc-900 text-white hover:bg-zinc-850'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.name}</span>
                          {selectedExerciseId === result.id && <span className="text-lg">✓</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Copy & Edit Tab */}
          {activeTab === 'copyEdit' && (
            <>
              {/* Search Input */}
              <div className="border-b-2 border-zinc-700 bg-zinc-950 p-4">
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
                    placeholder="Search exercise to copy from..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border-2 border-zinc-700 bg-zinc-900 py-3 pl-12 pr-4 font-mono text-sm text-white placeholder-zinc-600 transition-all focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Results List with Copy Buttons */}
              <div className="max-h-80 overflow-y-auto bg-zinc-950">
                {results.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="font-mono text-sm text-zinc-600">No exercises found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleCopyFromExercise(result.name)}
                        className="group w-full p-4 text-left font-mono text-sm transition-all bg-zinc-900 text-white hover:bg-zinc-850"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.name}</span>
                          <span className="text-xs text-cyan-500 opacity-0 transition-opacity group-hover:opacity-100">
                            Copy & Edit →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* From Scratch Tab */}
          {activeTab === 'scratch' && (
            <div className="p-4">
              {copiedFromExercise && (
                <div className="mb-4 rounded border border-cyan-500/30 bg-cyan-500/10 p-3">
                  <p className="font-mono text-xs text-cyan-400">
                    Copied from: <span className="font-bold">{copiedFromExercise}</span>
                  </p>
                </div>
              )}
              <MuscleValueEditor values={muscleValues} onChange={setMuscleValues} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-0 border-t-2 border-zinc-700">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="border-r-2 border-zinc-700 bg-zinc-800 px-4 py-4 font-mono text-sm font-bold uppercase tracking-wider text-zinc-500 transition-all hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleMarkAsIgnored()}
            disabled={isSaving}
            className="border-r-2 border-zinc-700 bg-zinc-800 px-4 py-4 font-mono text-sm font-bold uppercase tracking-wider text-amber-500 transition-all hover:bg-zinc-700 hover:text-amber-400 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Ignore'}
          </button>
          {activeTab === 'search' ? (
            <button
              onClick={() => void handleConfirmCanonical()}
              disabled={!selectedExerciseId || isSaving}
              className="bg-cyan-500 px-4 py-4 font-mono text-sm font-bold uppercase tracking-wider text-zinc-900 transition-all hover:bg-cyan-400 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Confirm'}
            </button>
          ) : activeTab === 'copyEdit' ? (
            <button
              disabled
              className="bg-zinc-700 px-4 py-4 font-mono text-sm font-bold uppercase tracking-wider text-zinc-500 cursor-not-allowed"
            >
              Select Exercise
            </button>
          ) : (
            <button
              onClick={() => void handleConfirmCustom()}
              disabled={Object.keys(muscleValues).length === 0 || isSaving}
              className="bg-cyan-500 px-4 py-4 font-mono text-sm font-bold uppercase tracking-wider text-zinc-900 transition-all hover:bg-cyan-400 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingMapping ? 'Update' : 'Save Custom'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
