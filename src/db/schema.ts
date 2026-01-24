/**
 * Dexie Database Schema for ScientificMuscle
 * Local-first IndexedDB storage for workout data
 */

import Dexie, { type Table } from 'dexie';
import type { ScientificMuscle, FunctionalGroup } from '@core/taxonomy';

/**
 * User-defined muscle group for organizing the muscle list
 */
export interface CustomMuscleGroup {
  id: string;                       // Unique identifier (for drag-drop keys)
  name: string;                     // Display name (user-editable)
  muscles: ScientificMuscle[];      // Ordered list of muscles in this group
}

/**
 * Complete muscle grouping configuration for a profile
 */
export interface MuscleGroupConfig {
  groups: CustomMuscleGroup[];      // Ordered custom groups (max 8)
  ungrouped: ScientificMuscle[];    // Muscles shown at top (promoted)
  hidden: ScientificMuscle[];       // Muscles excluded from list/heatmap
}

/**
 * Default goal for each muscle (sets per week)
 */
export const DEFAULT_MUSCLE_GOAL = 20;

/**
 * Default total weekly set goal
 */
export const DEFAULT_TOTAL_GOAL = 150;

/**
 * User gender for anatomical diagrams
 */
export type Gender = 'male' | 'female' | 'other';

/**
 * Workout set stored in the database
 */
export interface WorkoutSet {
  exerciseId: string;
  originalName: string;
  setType: 'normal' | 'warmup' | 'failure' | 'drop';
  weight: number;
  reps: number;
  rpe?: number;
}

/**
 * Workout record stored in IndexedDB
 */
export interface Workout {
  id: string;
  profileId: string;
  date: Date;
  title: string;
  sets: WorkoutSet[];
}

/**
 * User profile with settings and goals
 */
export interface Profile {
  id: string;
  name: string;
  gender: Gender;
  hevyApiKey?: string;
  lastSyncTimestamp?: number;
  goals: Partial<Record<ScientificMuscle, number>>;
  totalGoal: number;
  muscleGroupCustomization: Partial<Record<ScientificMuscle, FunctionalGroup>>;
  customMuscleGroups?: MuscleGroupConfig;  // Optional, defaults to preset
  createdAt: Date;
}

/**
 * Tracks exercises that don't have muscle mappings
 */
export interface UnmappedExercise {
  id: string;
  profileId: string;
  originalName: string;
  normalizedName: string;
  firstSeenAt: Date;
  occurrenceCount: number;
}

/**
 * User-defined exercise mapping to canonical exercises or custom muscle values
 */
export interface ExerciseMapping {
  id: string;
  profileId: string;
  originalPattern: string;
  canonicalExerciseId: string | null;
  customMuscleValues: Partial<Record<ScientificMuscle, number>> | null;
  isIgnored: boolean;
  createdAt: Date;
}

/**
 * User customization of default exercise muscle values.
 * Overrides exercises from exercise_list_complete.json.
 * Stores only user modifications; absence means use default.
 */
export interface DefaultExerciseOverride {
  id: string;
  profileId: string;
  exerciseName: string;
  customMuscleValues: Partial<Record<ScientificMuscle, number>>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User customization of default exercise name mappings.
 * Overrides mappings from exercise_name_mappings.json.
 * Stores only user modifications; absence means use default.
 */
export interface DefaultNameMappingOverride {
  id: string;
  profileId: string;
  gymName: string;
  canonicalName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dexie database class for ScientificMuscle
 */
class ScientificMuscleDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  workouts!: Table<Workout, string>;
  unmappedExercises!: Table<UnmappedExercise, string>;
  exerciseMappings!: Table<ExerciseMapping, string>;
  defaultExerciseOverrides!: Table<DefaultExerciseOverride, string>;
  defaultNameMappingOverrides!: Table<DefaultNameMappingOverride, string>;

  constructor() {
    super('ScientificMuscleDB');

    this.version(1).stores({
      profiles: 'id, name',
      workouts: 'id, profileId, date, [profileId+date]',
      unmappedExercises: 'id, profileId, normalizedName, [profileId+normalizedName]',
    });

    this.version(2).stores({
      profiles: 'id, name',
      workouts: 'id, profileId, date, [profileId+date]',
      unmappedExercises: 'id, profileId, normalizedName, [profileId+normalizedName]',
      exerciseMappings: 'id, profileId, originalPattern, [profileId+originalPattern]',
    });

    this.version(3).stores({
      profiles: 'id, name',
      workouts: 'id, profileId, date, [profileId+date]',
      unmappedExercises: 'id, profileId, normalizedName, [profileId+normalizedName]',
      exerciseMappings: 'id, profileId, originalPattern, [profileId+originalPattern]',
      defaultExerciseOverrides: 'id, profileId, [profileId+exerciseName]',
      defaultNameMappingOverrides: 'id, profileId, [profileId+gymName]',
    });
  }
}

/**
 * Singleton database instance
 */
export const db = new ScientificMuscleDatabase();

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new profile with default values
 */
export function createDefaultProfile(name: string, gender: Gender): Profile {
  return {
    id: generateId(),
    name,
    gender,
    goals: {},
    totalGoal: DEFAULT_TOTAL_GOAL,
    muscleGroupCustomization: {},
    createdAt: new Date(),
  };
}
