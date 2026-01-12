/**
 * Hevy API Client
 * Fetches workout data from Hevy's REST API
 */

import { cleanExerciseName, normalizeId } from '../utils/normalization';

const HEVY_BASE_URL = 'https://api.hevyapp.com/v1';
const DEFAULT_PAGE_SIZE = 10;

/**
 * Hevy API response types (exported for testing)
 */
export interface HevyExercise {
  index: number;
  title: string;
  notes: string;
  exercise_template_id: string;
  superset_id: number | null;
  sets: HevySet[];
}

export interface HevySet {
  index: number;
  type: string;
  weight_kg: number | null;
  reps: number | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  rpe: number | null;
}

export interface HevyWorkout {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  exercises: HevyExercise[];
}

interface HevyWorkoutsResponse {
  page: number;
  page_count: number;
  workouts: HevyWorkout[];
}

interface HevyWorkoutEvent {
  id: string;
  type: 'created' | 'updated' | 'deleted';
  workout: HevyWorkout | null;
}

interface HevyEventsResponse {
  page: number;
  page_count: number;
  events: HevyWorkoutEvent[];
}

/**
 * Internal workout format (matches DB schema but without profileId)
 */
export interface HevyWorkoutResult {
  id: string;
  title: string;
  date: Date;
  sets: HevyWorkoutSet[];
}

export interface HevyWorkoutSet {
  exerciseId: string;
  originalName: string;
  setType: 'normal' | 'warmup' | 'failure' | 'drop';
  weight: number;
  reps: number;
  rpe?: number;
}

/**
 * Hevy API error
 */
export class HevyApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'HevyApiError';
  }
}

/**
 * Map Hevy type to our internal set type
 */
function mapSetType(
  hevySetType: string | undefined | null
): 'normal' | 'warmup' | 'failure' | 'drop' {
  if (!hevySetType) {
    return 'normal';
  }
  switch (hevySetType.toLowerCase()) {
    case 'warmup':
      return 'warmup';
    case 'failure':
      return 'failure';
    case 'dropset':
    case 'drop':
      return 'drop';
    default:
      return 'normal';
  }
}

/**
 * Make authenticated request to Hevy API
 */
async function hevyFetch<T>(
  endpoint: string,
  apiKey: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const url = new URL(`${HEVY_BASE_URL}${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new HevyApiError(
      response.status,
      `Hevy API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Convert Hevy workout to our internal format
 */
export function convertHevyWorkout(hevyWorkout: HevyWorkout): HevyWorkoutResult {
  const sets: HevyWorkoutSet[] = [];

  for (const exercise of hevyWorkout.exercises) {
    const exerciseId = normalizeId(cleanExerciseName(exercise.title));

    for (const set of exercise.sets) {
      sets.push({
        exerciseId,
        originalName: exercise.title,
        setType: mapSetType(set.type),
        weight: set.weight_kg ?? 0,
        reps: set.reps ?? 0,
        rpe: set.rpe ?? undefined,
      });
    }
  }

  return {
    id: hevyWorkout.id,
    title: hevyWorkout.title,
    date: new Date(hevyWorkout.start_time),
    sets,
  };
}

/**
 * Fetch all workouts (full sync)
 * Used when no lastSyncTimestamp is provided
 */
async function fetchAllWorkouts(apiKey: string): Promise<HevyWorkoutResult[]> {
  const workouts: HevyWorkoutResult[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await hevyFetch<HevyWorkoutsResponse>('/workouts', apiKey, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    });

    for (const hevyWorkout of response.workouts) {
      workouts.push(convertHevyWorkout(hevyWorkout));
    }

    hasMore = page < response.page_count;
    page++;
  }

  return workouts;
}

/**
 * Fetch workout events (incremental sync)
 * Used when lastSyncTimestamp is provided
 */
async function fetchWorkoutEvents(
  apiKey: string,
  since: number
): Promise<{ workouts: HevyWorkoutResult[]; deletedIds: string[] }> {
  const workouts: HevyWorkoutResult[] = [];
  const deletedIds: string[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    // Convert Unix timestamp (seconds) to ISO 8601 string for Hevy API
    const sinceIso = new Date(since * 1000).toISOString();
    const response = await hevyFetch<HevyEventsResponse>('/workouts/events', apiKey, {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      since: sinceIso,
    });

    for (const event of response.events) {
      switch (event.type) {
        case 'created':
        case 'updated':
          if (event.workout) {
            workouts.push(convertHevyWorkout(event.workout));
          }
          break;
        case 'deleted':
          deletedIds.push(event.id);
          break;
      }
    }

    hasMore = page < response.page_count;
    page++;
  }

  return { workouts, deletedIds };
}

/**
 * Main entry point: Fetch workouts from Hevy API
 *
 * @param apiKey - User's Hevy API key
 * @param lastSyncTimestamp - Unix timestamp of last sync (optional)
 *   - If undefined: Full sync (fetch all workouts from /workouts)
 *   - If provided: Incremental sync (fetch events from /workouts/events)
 */
export async function fetchHevyWorkouts(
  apiKey: string,
  lastSyncTimestamp?: number
): Promise<{
  workouts: HevyWorkoutResult[];
  deletedIds: string[];
  syncType: 'full' | 'incremental';
}> {
  if (lastSyncTimestamp === undefined) {
    const workouts = await fetchAllWorkouts(apiKey);
    return {
      workouts,
      deletedIds: [],
      syncType: 'full',
    };
  } else {
    const { workouts, deletedIds } = await fetchWorkoutEvents(apiKey, lastSyncTimestamp);
    return {
      workouts,
      deletedIds,
      syncType: 'incremental',
    };
  }
}

/**
 * Validate API key by making a test request
 */
export async function validateHevyApiKey(apiKey: string): Promise<boolean> {
  try {
    await hevyFetch<HevyWorkoutsResponse>('/workouts', apiKey, { page: 1, pageSize: 1 });
    return true;
  } catch (error) {
    if (error instanceof HevyApiError && error.status === 401) {
      return false;
    }
    throw error;
  }
}
