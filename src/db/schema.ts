/**
 * Dexie Database Schema for ScientificMuscle
 * Local-first IndexedDB storage for workout data
 */

import Dexie, { type Table } from 'dexie';
import type { ScientificMuscle, FunctionalGroup } from '@core/taxonomy';

/**
 * Default goal for each muscle (sets per week)
 */
export const DEFAULT_MUSCLE_GOAL = 20;

/**
 * Default total weekly set goal
 */
export const DEFAULT_TOTAL_GOAL = 150;

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
  hevyApiKey?: string;
  lastSyncTimestamp?: number;
  goals: Partial<Record<ScientificMuscle, number>>;
  totalGoal: number;
  muscleGroupCustomization: Partial<Record<ScientificMuscle, FunctionalGroup>>;
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
 * Dexie database class for ScientificMuscle
 */
class ScientificMuscleDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  workouts!: Table<Workout, string>;
  unmappedExercises!: Table<UnmappedExercise, string>;
  exerciseMappings!: Table<ExerciseMapping, string>;

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
export function createDefaultProfile(name: string): Profile {
  return {
    id: generateId(),
    name,
    goals: {},
    totalGoal: DEFAULT_TOTAL_GOAL,
    muscleGroupCustomization: {},
    createdAt: new Date(),
  };
}
