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
  type Gender,
  type Profile,
  type Workout,
  type WorkoutSet,
  type UnmappedExercise,
  type ExerciseMapping,
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

export {
  useUnmappedExercises,
  useAddUnmappedExercise,
  useIncrementUnmappedCount,
  useTrackUnmappedExercise,
  useDeleteUnmappedExercise,
} from './hooks/useUnmappedExercises';

export {
  useExerciseMappings,
  useCreateExerciseMapping,
  useUpdateExerciseMapping,
  useDeleteExerciseMapping,
  useGetMappingByPattern,
} from './hooks/useExerciseMappings';
