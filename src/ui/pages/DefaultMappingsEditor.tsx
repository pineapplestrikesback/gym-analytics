/**
 * Default Mappings Editor Page
 * Comprehensive interface for editing exercise muscle values, name mappings, and muscle group mappings
 */

import { useState, useMemo } from 'react';
import { useCurrentProfile } from '../context/ProfileContext';
import {
  useDefaultExerciseOverrides,
  useUpsertDefaultExerciseOverride,
  useDeleteDefaultExerciseOverride,
} from '@db/hooks/useDefaultExerciseOverrides';
import {
  useDefaultNameMappingOverrides,
  useUpsertDefaultNameMappingOverride,
  useDeleteDefaultNameMappingOverride,
} from '@db/hooks/useDefaultNameMappingOverrides';
import { useUpdateProfile } from '@db/hooks/useProfiles';
import {
  getAllDefaultExerciseNames,
  getAllDefaultGymNameMappings,
  getDefaultCanonicalName,
  getEffectiveExerciseMuscleValues,
  getEffectiveCanonicalName,
} from '@db/utils/mapping-resolver';
import {
  SCIENTIFIC_MUSCLES,
  DEFAULT_SCIENTIFIC_TO_FUNCTIONAL,
  FUNCTIONAL_GROUPS,
  type ScientificMuscle,
  type FunctionalGroup,
} from '@core/taxonomy';
import type { DefaultExerciseOverride, DefaultNameMappingOverride } from '@db/schema';
import { MuscleValueEditor } from '../components/exercise-mapping/MuscleValueEditor';

type TabView = 'exercises' | 'names' | 'groups';

export function DefaultMappingsEditor(): React.ReactElement {
  const { currentProfile, isLoading: profileLoading } = useCurrentProfile();
  const [activeTab, setActiveTab] = useState<TabView>('exercises');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedGymName, setSelectedGymName] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<ScientificMuscle | null>(null);

  // Hooks for exercise overrides
  const { overrides: exerciseOverrides, isLoading: exerciseOverridesLoading } =
    useDefaultExerciseOverrides(currentProfile?.id ?? null);
  const { upsertOverride: upsertExerciseOverride, isUpserting: isSavingExercise } =
    useUpsertDefaultExerciseOverride();
  const { deleteOverride: deleteExerciseOverride, isDeleting: isDeletingExercise } =
    useDeleteDefaultExerciseOverride();

  // Hooks for name mapping overrides
  const { overrides: nameMappingOverrides, isLoading: nameMappingOverridesLoading } =
    useDefaultNameMappingOverrides(currentProfile?.id ?? null);
  const { upsertOverride: upsertNameMappingOverride, isUpserting: isSavingName } =
    useUpsertDefaultNameMappingOverride();
  const { deleteOverride: deleteNameMappingOverride, isDeleting: isDeletingName } =
    useDeleteDefaultNameMappingOverride();

  // Hook for muscle group customization
  const { updateProfile, isUpdating: isUpdatingProfile } = useUpdateProfile();

  // Get all default data
  const allExercises = useMemo(() => getAllDefaultExerciseNames(), []);
  const allGymNameMappings = useMemo(() => getAllDefaultGymNameMappings(), []);
  const allGymNames = useMemo(() => Array.from(allGymNameMappings.keys()), [allGymNameMappings]);

  // Create sets for quick lookup
  const customizedExercises = useMemo(
    () => new Set(exerciseOverrides.map((o) => o.exerciseName)),
    [exerciseOverrides]
  );
  const customizedGymNames = useMemo(
    () => new Set(nameMappingOverrides.map((o) => o.gymName)),
    [nameMappingOverrides]
  );
  const customizedMuscles = useMemo(() => {
    if (!currentProfile) return new Set<ScientificMuscle>();
    return new Set(
      SCIENTIFIC_MUSCLES.filter(
        (muscle) => currentProfile.muscleGroupCustomization[muscle] !== undefined
      )
    );
  }, [currentProfile]);

  // Filter data based on search
  const filteredExercises = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allExercises.filter((ex) => ex.toLowerCase().includes(query)).sort();
  }, [allExercises, searchQuery]);

  const filteredGymNames = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allGymNames.filter((name) => name.toLowerCase().includes(query)).sort();
  }, [allGymNames, searchQuery]);

  const filteredMuscles = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return SCIENTIFIC_MUSCLES.filter((muscle) => muscle.toLowerCase().includes(query));
  }, [searchQuery]);

  // Handlers
  const handleSaveExerciseMuscleValues = async (
    exerciseName: string,
    values: Partial<Record<ScientificMuscle, number>>
  ): Promise<void> => {
    if (!currentProfile) return;
    await upsertExerciseOverride(currentProfile.id, exerciseName, values);
  };

  const handleRevertExercise = async (exerciseName: string): Promise<void> => {
    if (!currentProfile) return;
    await deleteExerciseOverride(currentProfile.id, exerciseName);
    if (selectedExercise === exerciseName) {
      setSelectedExercise(null);
    }
  };

  const handleRevertAllExercises = async (): Promise<void> => {
    if (!currentProfile) return;
    for (const override of exerciseOverrides) {
      await deleteExerciseOverride(currentProfile.id, override.exerciseName);
    }
    setSelectedExercise(null);
  };

  const handleSaveNameMapping = async (
    gymName: string,
    canonicalName: string
  ): Promise<void> => {
    if (!currentProfile) return;
    await upsertNameMappingOverride(currentProfile.id, gymName, canonicalName);
  };

  const handleRevertNameMapping = async (gymName: string): Promise<void> => {
    if (!currentProfile) return;
    await deleteNameMappingOverride(currentProfile.id, gymName);
    if (selectedGymName === gymName) {
      setSelectedGymName(null);
    }
  };

  const handleRevertAllNameMappings = async (): Promise<void> => {
    if (!currentProfile) return;
    for (const override of nameMappingOverrides) {
      await deleteNameMappingOverride(currentProfile.id, override.gymName);
    }
    setSelectedGymName(null);
  };

  const handleSaveMuscleGroupMapping = async (
    muscle: ScientificMuscle,
    functionalGroup: FunctionalGroup
  ): Promise<void> => {
    if (!currentProfile) return;
    await updateProfile({
      ...currentProfile,
      muscleGroupCustomization: {
        ...currentProfile.muscleGroupCustomization,
        [muscle]: functionalGroup,
      },
    });
  };

  const handleRevertMuscleGroupMapping = async (muscle: ScientificMuscle): Promise<void> => {
    if (!currentProfile) return;
    const newCustomization = { ...currentProfile.muscleGroupCustomization };
    delete newCustomization[muscle];
    await updateProfile({
      ...currentProfile,
      muscleGroupCustomization: newCustomization,
    });
    if (selectedMuscle === muscle) {
      setSelectedMuscle(null);
    }
  };

  const handleRevertAllMuscleGroupMappings = async (): Promise<void> => {
    if (!currentProfile) return;
    await updateProfile({
      ...currentProfile,
      muscleGroupCustomization: {},
    });
    setSelectedMuscle(null);
  };

  if (profileLoading || exerciseOverridesLoading || nameMappingOverridesLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent opacity-30"
            style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
          />
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="relative overflow-hidden rounded border-2 border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-950 p-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(113,113,122,0.05),transparent_50%)]" />
        <div className="relative">
          <h2 className="mb-3 font-mono text-2xl font-black uppercase tracking-tight text-white">
            No Profile Selected
          </h2>
          <p className="font-mono text-sm text-zinc-500">
            Create or select a profile to manage default mappings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(6,182,212,0.3); }
          50% { box-shadow: 0 0 20px rgba(6,182,212,0.5); }
        }
        .edited-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Page Header */}
      <div
        className="relative border-b-2 border-cyan-500 pb-6"
        style={{ animation: 'slideDown 0.4s ease-out' }}
      >
        <div className="absolute bottom-0 left-0 h-0.5 w-40 bg-gradient-to-r from-cyan-400 to-transparent" />
        <h1 className="font-mono text-4xl font-black uppercase tracking-tighter text-white">
          Default Mappings
        </h1>
        <p className="mt-3 font-mono text-sm text-zinc-500">
          Customize exercise muscle values, name mappings, and functional groupings
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search mappings..."
          className="w-full rounded-lg border-2 border-zinc-700 bg-zinc-900 px-4 py-3 pl-12 font-mono text-sm text-white placeholder-zinc-600 transition-all duration-200 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] focus:outline-none"
        />
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600"
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
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-3 gap-0 overflow-hidden border-2 border-zinc-700">
        <button
          onClick={() => {
            setActiveTab('exercises');
            setSelectedExercise(null);
            setSearchQuery('');
          }}
          className={`group relative overflow-hidden border-r-2 border-zinc-700 px-6 py-4 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'exercises'
              ? 'bg-cyan-500 text-zinc-900 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {activeTab !== 'exercises' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          )}
          <span className="relative block">
            Exercise Muscle Values
            {customizedExercises.size > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                {customizedExercises.size}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab('names');
            setSelectedGymName(null);
            setSearchQuery('');
          }}
          className={`group relative overflow-hidden border-r-2 border-zinc-700 px-6 py-4 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'names'
              ? 'bg-cyan-500 text-zinc-900 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {activeTab !== 'names' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          )}
          <span className="relative block">
            Exercise Name Mappings
            {customizedGymNames.size > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                {customizedGymNames.size}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab('groups');
            setSelectedMuscle(null);
            setSearchQuery('');
          }}
          className={`group relative overflow-hidden px-6 py-4 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'groups'
              ? 'bg-cyan-500 text-zinc-900 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {activeTab !== 'groups' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          )}
          <span className="relative block">
            Muscle Group Mappings
            {customizedMuscles.size > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                {customizedMuscles.size}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]" style={{ animation: 'fadeIn 0.6s ease-out' }}>
        {activeTab === 'exercises' && (
          <ExerciseMuscleValuesTab
            exercises={filteredExercises}
            customizedExercises={customizedExercises}
            exerciseOverrides={exerciseOverrides}
            selectedExercise={selectedExercise}
            onSelectExercise={setSelectedExercise}
            onSave={handleSaveExerciseMuscleValues}
            onRevert={handleRevertExercise}
            onRevertAll={handleRevertAllExercises}
            isSaving={isSavingExercise}
            isDeleting={isDeletingExercise}
          />
        )}
        {activeTab === 'names' && (
          <ExerciseNameMappingsTab
            gymNames={filteredGymNames}
            customizedGymNames={customizedGymNames}
            nameMappingOverrides={nameMappingOverrides}
            defaultMappings={allGymNameMappings}
            selectedGymName={selectedGymName}
            onSelectGymName={setSelectedGymName}
            onSave={handleSaveNameMapping}
            onRevert={handleRevertNameMapping}
            onRevertAll={handleRevertAllNameMappings}
            isSaving={isSavingName}
            isDeleting={isDeletingName}
          />
        )}
        {activeTab === 'groups' && (
          <MuscleGroupMappingsTab
            muscles={filteredMuscles}
            customizedMuscles={customizedMuscles}
            profile={currentProfile}
            selectedMuscle={selectedMuscle}
            onSelectMuscle={setSelectedMuscle}
            onSave={handleSaveMuscleGroupMapping}
            onRevert={handleRevertMuscleGroupMapping}
            onRevertAll={handleRevertAllMuscleGroupMappings}
            isSaving={isUpdatingProfile}
            isDeleting={isUpdatingProfile}
          />
        )}
      </div>
    </div>
  );
}

// Exercise Muscle Values Tab Component
interface ExerciseMuscleValuesTabProps {
  exercises: string[];
  customizedExercises: Set<string>;
  exerciseOverrides: DefaultExerciseOverride[];
  selectedExercise: string | null;
  onSelectExercise: (exercise: string | null) => void;
  onSave: (exerciseName: string, values: Partial<Record<ScientificMuscle, number>>) => Promise<void>;
  onRevert: (exerciseName: string) => Promise<void>;
  onRevertAll: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}

function ExerciseMuscleValuesTab({
  exercises,
  customizedExercises,
  exerciseOverrides,
  selectedExercise,
  onSelectExercise,
  onSave,
  onRevert,
  onRevertAll,
  isSaving,
  isDeleting,
}: ExerciseMuscleValuesTabProps): React.ReactElement {
  const [editedValues, setEditedValues] = useState<Partial<Record<ScientificMuscle, number>>>({});

  const handleSelect = (exercise: string): void => {
    onSelectExercise(exercise);
    const override = exerciseOverrides.find((o) => o.exerciseName === exercise);
    const values = getEffectiveExerciseMuscleValues(exercise, override ?? null) ?? {};
    setEditedValues(values);
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedExercise) return;
    await onSave(selectedExercise, editedValues);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* List Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-400">
            Exercises ({exercises.length})
          </h3>
          {customizedExercises.size > 0 && (
            <button
              onClick={() => void onRevertAll()}
              disabled={isDeleting}
              className="rounded bg-red-600 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-red-500 disabled:opacity-50"
            >
              Revert All
            </button>
          )}
        </div>
        <div className="max-h-[700px] space-y-2 overflow-y-auto rounded border-2 border-zinc-700 bg-zinc-900 p-4">
          {exercises.map((exercise, index) => {
            const isCustomized = customizedExercises.has(exercise);
            const isSelected = selectedExercise === exercise;
            return (
              <button
                key={exercise}
                onClick={() => handleSelect(exercise)}
                className={`group relative w-full overflow-hidden rounded-lg border-2 px-4 py-3 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : isCustomized
                    ? 'border-amber-500 bg-amber-500/5 hover:bg-amber-500/10'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-750'
                }`}
                style={{ animationDelay: `${index * 20}ms`, animation: 'fadeIn 0.3s ease-out' }}
              >
                {isCustomized && !isSelected && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-white">{exercise}</span>
                  {isCustomized && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edited
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="space-y-4">
        {selectedExercise ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-mono text-lg font-bold text-white">{selectedExercise}</h3>
                <p className="mt-1 font-mono text-xs text-zinc-500">
                  {customizedExercises.has(selectedExercise)
                    ? 'Custom muscle values'
                    : 'Default muscle values'}
                </p>
              </div>
              <button
                onClick={() => onSelectExercise(null)}
                className="text-zinc-500 transition-colors hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="rounded-lg border-2 border-zinc-700 bg-zinc-900 p-6">
              <MuscleValueEditor values={editedValues} onChange={setEditedValues} />
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="flex-1 rounded-lg bg-cyan-500 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-cyan-400 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                {customizedExercises.has(selectedExercise) && (
                  <button
                    onClick={() => void onRevert(selectedExercise)}
                    disabled={isDeleting}
                    className="rounded-lg border-2 border-red-600 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider text-red-500 transition-all hover:bg-red-600 hover:text-white disabled:opacity-50"
                  >
                    Revert
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
            <div>
              <svg
                className="mx-auto h-16 w-16 text-zinc-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 font-mono text-sm text-zinc-600">
                Select an exercise to edit muscle values
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Exercise Name Mappings Tab Component
interface ExerciseNameMappingsTabProps {
  gymNames: string[];
  customizedGymNames: Set<string>;
  nameMappingOverrides: DefaultNameMappingOverride[];
  defaultMappings: Map<string, string>;
  selectedGymName: string | null;
  onSelectGymName: (gymName: string | null) => void;
  onSave: (gymName: string, canonicalName: string) => Promise<void>;
  onRevert: (gymName: string) => Promise<void>;
  onRevertAll: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}

function ExerciseNameMappingsTab({
  gymNames,
  customizedGymNames,
  nameMappingOverrides,
  defaultMappings,
  selectedGymName,
  onSelectGymName,
  onSave,
  onRevert,
  onRevertAll,
  isSaving,
  isDeleting,
}: ExerciseNameMappingsTabProps): React.ReactElement {
  const [editedCanonicalName, setEditedCanonicalName] = useState('');

  const selectedOverride = nameMappingOverrides.find((o) => o.gymName === selectedGymName) ?? null;
  const currentCanonicalName = selectedGymName
    ? getEffectiveCanonicalName(selectedGymName, selectedOverride) ?? ''
    : '';
  const defaultCanonicalName = selectedGymName ? getDefaultCanonicalName(selectedGymName) ?? '' : '';

  const handleSelect = (gymName: string): void => {
    onSelectGymName(gymName);
    const override = nameMappingOverrides.find((o) => o.gymName === gymName) ?? null;
    const canonical = getEffectiveCanonicalName(gymName, override) ?? '';
    setEditedCanonicalName(canonical);
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedGymName || !editedCanonicalName.trim()) return;
    await onSave(selectedGymName, editedCanonicalName.trim());
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* List Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-400">
            Gym Names ({gymNames.length})
          </h3>
          {customizedGymNames.size > 0 && (
            <button
              onClick={() => void onRevertAll()}
              disabled={isDeleting}
              className="rounded bg-red-600 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-red-500 disabled:opacity-50"
            >
              Revert All
            </button>
          )}
        </div>
        <div className="max-h-[700px] space-y-2 overflow-y-auto rounded border-2 border-zinc-700 bg-zinc-900 p-4">
          {gymNames.map((gymName, index) => {
            const isCustomized = customizedGymNames.has(gymName);
            const isSelected = selectedGymName === gymName;
            const canonical = defaultMappings.get(gymName) ?? '';
            return (
              <button
                key={gymName}
                onClick={() => handleSelect(gymName)}
                className={`group relative w-full overflow-hidden rounded-lg border-2 px-4 py-3 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : isCustomized
                    ? 'border-amber-500 bg-amber-500/5 hover:bg-amber-500/10'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-750'
                }`}
                style={{ animationDelay: `${index * 20}ms`, animation: 'fadeIn 0.3s ease-out' }}
              >
                {isCustomized && !isSelected && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm text-white">{gymName}</div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-xs text-zinc-500">
                      <span>→</span>
                      <span className="truncate">{canonical}</span>
                    </div>
                  </div>
                  {isCustomized && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edited
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="space-y-4">
        {selectedGymName ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-mono text-lg font-bold text-white">{selectedGymName}</h3>
                <p className="mt-1 font-mono text-xs text-zinc-500">
                  {customizedGymNames.has(selectedGymName)
                    ? 'Custom mapping'
                    : 'Default mapping'}
                </p>
              </div>
              <button
                onClick={() => onSelectGymName(null)}
                className="text-zinc-500 transition-colors hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4 rounded-lg border-2 border-zinc-700 bg-zinc-900 p-6">
              <div>
                <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Gym Exercise Name
                </label>
                <div className="rounded border-2 border-zinc-700 bg-zinc-850 px-4 py-3 font-mono text-sm text-white">
                  {selectedGymName}
                </div>
              </div>
              <div>
                <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Canonical Name
                </label>
                <input
                  type="text"
                  value={editedCanonicalName}
                  onChange={(e) => setEditedCanonicalName(e.target.value)}
                  placeholder="Enter canonical exercise name"
                  className="w-full rounded border-2 border-zinc-700 bg-zinc-850 px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 transition-colors focus:border-cyan-500 focus:outline-none"
                />
              </div>
              {defaultCanonicalName !== currentCanonicalName && (
                <div className="rounded-lg bg-amber-500/10 border-2 border-amber-500/30 p-4">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
                    Default Value
                  </p>
                  <p className="mt-1 font-mono text-sm text-white">{defaultCanonicalName}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => void handleSave()}
                  disabled={isSaving || !editedCanonicalName.trim()}
                  className="flex-1 rounded-lg bg-cyan-500 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-cyan-400 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                {customizedGymNames.has(selectedGymName) && (
                  <button
                    onClick={() => void onRevert(selectedGymName)}
                    disabled={isDeleting}
                    className="rounded-lg border-2 border-red-600 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider text-red-500 transition-all hover:bg-red-600 hover:text-white disabled:opacity-50"
                  >
                    Revert
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
            <div>
              <svg
                className="mx-auto h-16 w-16 text-zinc-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <p className="mt-4 font-mono text-sm text-zinc-600">
                Select a gym name to edit its mapping
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Muscle Group Mappings Tab Component
interface MuscleGroupMappingsTabProps {
  muscles: readonly ScientificMuscle[];
  customizedMuscles: Set<ScientificMuscle>;
  profile: { muscleGroupCustomization: Partial<Record<ScientificMuscle, FunctionalGroup>> };
  selectedMuscle: ScientificMuscle | null;
  onSelectMuscle: (muscle: ScientificMuscle | null) => void;
  onSave: (muscle: ScientificMuscle, functionalGroup: FunctionalGroup) => Promise<void>;
  onRevert: (muscle: ScientificMuscle) => Promise<void>;
  onRevertAll: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}

function MuscleGroupMappingsTab({
  muscles,
  customizedMuscles,
  profile,
  selectedMuscle,
  onSelectMuscle,
  onSave,
  onRevert,
  onRevertAll,
  isSaving,
  isDeleting,
}: MuscleGroupMappingsTabProps): React.ReactElement {
  const [editedFunctionalGroup, setEditedFunctionalGroup] = useState<FunctionalGroup | null>(null);

  const currentFunctionalGroup = selectedMuscle
    ? profile.muscleGroupCustomization[selectedMuscle] ?? DEFAULT_SCIENTIFIC_TO_FUNCTIONAL[selectedMuscle]
    : null;
  const defaultFunctionalGroup = selectedMuscle ? DEFAULT_SCIENTIFIC_TO_FUNCTIONAL[selectedMuscle] : null;

  const handleSelect = (muscle: ScientificMuscle): void => {
    onSelectMuscle(muscle);
    const group = profile.muscleGroupCustomization[muscle] ?? DEFAULT_SCIENTIFIC_TO_FUNCTIONAL[muscle];
    setEditedFunctionalGroup(group);
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedMuscle || !editedFunctionalGroup) return;
    await onSave(selectedMuscle, editedFunctionalGroup);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* List Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-400">
            Scientific Muscles ({muscles.length})
          </h3>
          {customizedMuscles.size > 0 && (
            <button
              onClick={() => void onRevertAll()}
              disabled={isDeleting}
              className="rounded bg-red-600 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-red-500 disabled:opacity-50"
            >
              Revert All
            </button>
          )}
        </div>
        <div className="max-h-[700px] space-y-2 overflow-y-auto rounded border-2 border-zinc-700 bg-zinc-900 p-4">
          {muscles.map((muscle, index) => {
            const isCustomized = customizedMuscles.has(muscle);
            const isSelected = selectedMuscle === muscle;
            const functionalGroup = profile.muscleGroupCustomization[muscle] ?? DEFAULT_SCIENTIFIC_TO_FUNCTIONAL[muscle];
            return (
              <button
                key={muscle}
                onClick={() => handleSelect(muscle)}
                className={`group relative w-full overflow-hidden rounded-lg border-2 px-4 py-3 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : isCustomized
                    ? 'border-amber-500 bg-amber-500/5 hover:bg-amber-500/10'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-750'
                }`}
                style={{ animationDelay: `${index * 20}ms`, animation: 'fadeIn 0.3s ease-out' }}
              >
                {isCustomized && !isSelected && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm text-white">{muscle}</div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-xs text-zinc-500">
                      <span>→</span>
                      <span className="truncate">{functionalGroup}</span>
                    </div>
                  </div>
                  {isCustomized && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edited
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="space-y-4">
        {selectedMuscle ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-mono text-lg font-bold text-white">{selectedMuscle}</h3>
                <p className="mt-1 font-mono text-xs text-zinc-500">
                  {customizedMuscles.has(selectedMuscle)
                    ? 'Custom functional group'
                    : 'Default functional group'}
                </p>
              </div>
              <button
                onClick={() => onSelectMuscle(null)}
                className="text-zinc-500 transition-colors hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4 rounded-lg border-2 border-zinc-700 bg-zinc-900 p-6">
              <div>
                <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Scientific Muscle
                </label>
                <div className="rounded border-2 border-zinc-700 bg-zinc-850 px-4 py-3 font-mono text-sm text-white">
                  {selectedMuscle}
                </div>
              </div>
              <div>
                <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Functional Group
                </label>
                <select
                  value={editedFunctionalGroup ?? ''}
                  onChange={(e) => setEditedFunctionalGroup(e.target.value as FunctionalGroup)}
                  className="w-full rounded border-2 border-zinc-700 bg-zinc-850 px-4 py-3 font-mono text-sm text-white transition-colors focus:border-cyan-500 focus:outline-none"
                >
                  {FUNCTIONAL_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
              {defaultFunctionalGroup !== currentFunctionalGroup && (
                <div className="rounded-lg bg-amber-500/10 border-2 border-amber-500/30 p-4">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
                    Default Value
                  </p>
                  <p className="mt-1 font-mono text-sm text-white">{defaultFunctionalGroup}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => void handleSave()}
                  disabled={isSaving || !editedFunctionalGroup}
                  className="flex-1 rounded-lg bg-cyan-500 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider text-black transition-all hover:bg-cyan-400 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                {customizedMuscles.has(selectedMuscle) && (
                  <button
                    onClick={() => void onRevert(selectedMuscle)}
                    disabled={isDeleting}
                    className="rounded-lg border-2 border-red-600 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider text-red-500 transition-all hover:bg-red-600 hover:text-white disabled:opacity-50"
                  >
                    Revert
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
            <div>
              <svg
                className="mx-auto h-16 w-16 text-zinc-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="mt-4 font-mono text-sm text-zinc-600">
                Select a muscle to edit its functional group
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
