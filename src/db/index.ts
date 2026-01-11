/**
 * Database module exports
 */

// Schema and types
export {
  db,
  generateId,
  createDefaultProfile,
  DEFAULT_MUSCLE_GOAL,
  DEFAULT_TOTAL_GOAL,
  type Profile,
  type Workout,
  type WorkoutSet,
  type UnmappedExercise,
} from './schema';

// Hooks
export {
  useProfiles,
  useProfile,
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
} from './hooks/useProfiles';

export {
  useWorkouts,
  useAddWorkout,
  useImportWorkouts,
  useDeleteWorkout,
  useWorkoutSets,
} from './hooks/useWorkouts';

export {
  useScientificMuscleVolume,
  useFunctionalGroupVolume,
  useFunctionalGroupBreakdown,
  type VolumeStatItem,
} from './hooks/useVolumeStats';

export {
  useDailyStats,
  type DailyActivity,
  type DailyWorkout,
  type DailyExercise,
} from './hooks/useDailyStats';
