/**
 * TanStack Query hook for Daily Activity Statistics
 */

import { useQuery } from '@tanstack/react-query';
import { db, type Workout } from '../schema';
import type { FunctionalGroup, ExerciseMapping } from '@core/taxonomy';

// Load exercise mappings from config
import exerciseListJson from '../../../config/exercise_list.json';

const DAILY_STATS_KEY = ['dailyStats'];

/**
 * Exercise details for daily activity breakdown
 */
export interface DailyExercise {
  name: string;
  sets: number;
  musclesWorked: FunctionalGroup[];
}

/**
 * Workout details for daily activity breakdown
 */
export interface DailyWorkout {
  id: string;
  title: string;
  exercises: DailyExercise[];
}

/**
 * Daily activity data for bar chart
 */
export interface DailyActivity {
  date: Date;
  dayLabel: string;
  totalSets: number;
  workouts: DailyWorkout[];
}

/**
 * Build exercise mappings from the config JSON
 */
function buildExerciseMappings(): Map<string, ExerciseMapping> {
  const mappings = new Map<string, ExerciseMapping>();

  for (const [exerciseName, muscleData] of Object.entries(exerciseListJson)) {
    if (exerciseName === '_comment') continue;

    const normalizedId = exerciseName.toLowerCase().replace(/\s+/g, '-');
    mappings.set(normalizedId, muscleData as ExerciseMapping);
  }

  return mappings;
}

const EXERCISE_MAPPINGS = buildExerciseMappings();

/**
 * Default mapping from ScientificMuscle to FunctionalGroup
 */
const DEFAULT_SCIENTIFIC_TO_FUNCTIONAL: Record<string, FunctionalGroup> = {
  'Latissimus Dorsi': 'Lats',
  'Middle Trapezius': 'Traps',
  'Upper Trapezius': 'Traps',
  'Erector Spinae': 'Lower Back',
  'Posterior Deltoid': 'Rear Delts',
  'Anterior Deltoid': 'Front Delts',
  'Lateral Deltoid': 'Side Delts',
  'Biceps Brachii': 'Biceps',
  'Triceps (Lateral/Medial)': 'Triceps',
  'Triceps (Long Head)': 'Triceps',
  'Quadriceps (Vasti)': 'Quads',
  'Quadriceps (RF)': 'Quads',
  'Gluteus Maximus': 'Glutes',
  Hamstrings: 'Hamstrings',
  Gastrocnemius: 'Calves',
  Soleus: 'Calves',
  'Pectoralis Major (Sternal)': 'Chest',
  'Pectoralis Major (Clavicular)': 'Upper Chest',
};

/**
 * Get functional groups for an exercise
 */
function getExerciseMuscles(exerciseId: string): FunctionalGroup[] {
  const mapping = EXERCISE_MAPPINGS.get(exerciseId);
  if (!mapping) return [];

  const functionalGroups = new Set<FunctionalGroup>();

  for (const [scientificMuscle, contribution] of Object.entries(mapping)) {
    if (contribution > 0) {
      const functionalGroup = DEFAULT_SCIENTIFIC_TO_FUNCTIONAL[scientificMuscle];
      if (functionalGroup) {
        functionalGroups.add(functionalGroup);
      }
    }
  }

  return Array.from(functionalGroups);
}

/**
 * Get the start of today in the user's local timezone
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Get the start of the current calendar week (Monday)
 */
function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust when Sunday (0)
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
}

/**
 * Get day label (Mon, Tue, Wed, etc.)
 */
function getDayLabel(date: Date): string {
  const days: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = date.getDay();
  return days[dayIndex] as string;
}

/**
 * Convert a Date to a local date key (YYYY-MM-DD) using local timezone
 */
function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Process workouts into daily breakdown
 */
function processDailyActivities(
  workouts: Workout[],
  startDate: Date,
  endDate: Date
): DailyActivity[] {
  // Create a map of date string -> workouts
  const workoutsByDate = new Map<string, Workout[]>();

  for (const workout of workouts) {
    const dateKey = toLocalDateKey(workout.date);
    const existing = workoutsByDate.get(dateKey) ?? [];
    existing.push(workout);
    workoutsByDate.set(dateKey, existing);
  }

  // Generate all 7 days
  const activities: DailyActivity[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateKey = toLocalDateKey(currentDate);
    const dayWorkouts = workoutsByDate.get(dateKey) ?? [];

    const dailyWorkouts: DailyWorkout[] = dayWorkouts.map((workout) => {
      // Group sets by exercise
      const exerciseMap = new Map<string, { name: string; count: number }>();

      for (const set of workout.sets) {
        const existing = exerciseMap.get(set.exerciseId);
        if (existing) {
          existing.count++;
        } else {
          exerciseMap.set(set.exerciseId, {
            name: set.originalName,
            count: 1,
          });
        }
      }

      // Convert to DailyExercise array
      const exercises: DailyExercise[] = Array.from(exerciseMap.entries()).map(
        ([exerciseId, { name, count }]) => ({
          name,
          sets: count,
          musclesWorked: getExerciseMuscles(exerciseId),
        })
      );

      return {
        id: workout.id,
        title: workout.title,
        exercises,
      };
    });

    const totalSets = dailyWorkouts.reduce(
      (sum, workout) => sum + workout.exercises.reduce((exSum, ex) => exSum + ex.sets, 0),
      0
    );

    activities.push({
      date: new Date(currentDate),
      dayLabel: getDayLabel(currentDate),
      totalSets,
      workouts: dailyWorkouts,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return activities;
}

/**
 * Get daily activity statistics for a profile
 */
export function useDailyStats(
  profileId: string | null,
  options: {
    mode: 'last7days' | 'calendarWeek';
  }
): {
  days: DailyActivity[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: [...DAILY_STATS_KEY, profileId, options.mode],
    queryFn: async () => {
      if (!profileId) return [];

      // Calculate date range based on mode
      let startDate: Date;
      let endDate: Date;

      if (options.mode === 'last7days') {
        endDate = getStartOfToday();
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6); // 6 days back + today = 7 days
      } else {
        // calendarWeek mode
        startDate = getStartOfWeek();
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // Monday + 6 days = Sunday
      }

      // Fetch workouts in the date range
      const workouts = await db.workouts
        .where('profileId')
        .equals(profileId)
        .and((workout) => workout.date >= startDate && workout.date <= endDate)
        .toArray();

      // Process into daily activities
      return processDailyActivities(workouts, startDate, endDate);
    },
    enabled: !!profileId,
  });

  return {
    days: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}
