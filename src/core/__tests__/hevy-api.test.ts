/**
 * Hevy API Client Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchHevyWorkouts,
  validateHevyApiKey,
  HevyApiError,
  convertHevyWorkout,
  type HevyWorkout,
} from '../parsers/hevy-api';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('hevy-api', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateHevyApiKey', () => {
    it('should return true for valid API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ page: 1, page_count: 1, workouts: [] }),
      });

      const result = await validateHevyApiKey('valid-api-key');
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.hevyapp.com/v1/workouts'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'api-key': 'valid-api-key',
          }),
        })
      );
    });

    it('should return false for invalid API key (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await validateHevyApiKey('invalid-api-key');
      expect(result).toBe(false);
    });

    it('should throw for other errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(validateHevyApiKey('api-key')).rejects.toThrow(HevyApiError);
    });
  });

  describe('fetchHevyWorkouts - full sync', () => {
    it('should fetch all workouts when no lastSyncTimestamp provided', async () => {
      const mockWorkout = {
        id: 'workout-1',
        title: 'Morning Workout',
        description: '',
        start_time: '2024-01-15T08:00:00Z',
        end_time: '2024-01-15T09:00:00Z',
        exercises: [
          {
            index: 0,
            title: 'Bench Press (Barbell)',
            notes: '',
            exercise_template_id: 'bench-1',
            superset_id: null,
            sets: [
              {
                index: 0,
                type: 'normal',
                weight_kg: 80,
                reps: 10,
                distance_meters: null,
                duration_seconds: null,
                rpe: 8,
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          page: 1,
          page_count: 1,
          workouts: [mockWorkout],
        }),
      });

      const result = await fetchHevyWorkouts('api-key');

      expect(result.syncType).toBe('full');
      expect(result.deletedIds).toEqual([]);
      expect(result.workouts).toHaveLength(1);

      const firstWorkout = result.workouts[0];
      expect(firstWorkout).toBeDefined();
      expect(firstWorkout?.id).toBe('workout-1');
      expect(firstWorkout?.title).toBe('Morning Workout');
    });

    it('should paginate through all pages', async () => {
      // First page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          page: 1,
          page_count: 2,
          workouts: [
            {
              id: 'workout-1',
              title: 'Workout 1',
              description: '',
              start_time: '2024-01-15T08:00:00Z',
              end_time: '2024-01-15T09:00:00Z',
              exercises: [],
            },
          ],
        }),
      });

      // Second page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          page: 2,
          page_count: 2,
          workouts: [
            {
              id: 'workout-2',
              title: 'Workout 2',
              description: '',
              start_time: '2024-01-16T08:00:00Z',
              end_time: '2024-01-16T09:00:00Z',
              exercises: [],
            },
          ],
        }),
      });

      const result = await fetchHevyWorkouts('api-key');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.workouts).toHaveLength(2);

      const firstWorkout = result.workouts[0];
      const secondWorkout = result.workouts[1];
      expect(firstWorkout?.id).toBe('workout-1');
      expect(secondWorkout?.id).toBe('workout-2');
    });
  });

  describe('fetchHevyWorkouts - incremental sync', () => {
    it('should fetch events when lastSyncTimestamp provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          page: 1,
          page_count: 1,
          events: [
            {
              id: 'workout-1',
              type: 'created',
              workout: {
                id: 'workout-1',
                title: 'New Workout',
                description: '',
                start_time: '2024-01-15T08:00:00Z',
                end_time: '2024-01-15T09:00:00Z',
                exercises: [],
              },
            },
            {
              id: 'workout-2',
              type: 'deleted',
              workout: null,
            },
          ],
        }),
      });

      const result = await fetchHevyWorkouts('api-key', 1704067200);

      expect(result.syncType).toBe('incremental');
      expect(result.workouts).toHaveLength(1);
      expect(result.deletedIds).toEqual(['workout-2']);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/workouts/events'),
        expect.any(Object)
      );
    });

    it('should handle updated workouts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          page: 1,
          page_count: 1,
          events: [
            {
              id: 'workout-1',
              type: 'updated',
              workout: {
                id: 'workout-1',
                title: 'Updated Workout',
                description: '',
                start_time: '2024-01-15T08:00:00Z',
                end_time: '2024-01-15T09:00:00Z',
                exercises: [],
              },
            },
          ],
        }),
      });

      const result = await fetchHevyWorkouts('api-key', 1704067200);

      expect(result.workouts).toHaveLength(1);
      const firstWorkout = result.workouts[0];
      expect(firstWorkout?.title).toBe('Updated Workout');
    });
  });

  describe('convertHevyWorkout', () => {
    it('should convert Hevy workout format to internal format', () => {
      const hevyWorkout: HevyWorkout = {
        id: 'hevy-123',
        title: 'Push Day',
        description: 'Chest and triceps',
        start_time: '2024-01-15T08:00:00Z',
        end_time: '2024-01-15T09:30:00Z',
        exercises: [
          {
            index: 0,
            title: 'Bench Press (Dumbbell)',
            notes: '',
            exercise_template_id: 'db-bench',
            superset_id: null,
            sets: [
              {
                index: 0,
                type: 'warmup',
                weight_kg: 20,
                reps: 15,
                distance_meters: null,
                duration_seconds: null,
                rpe: null,
              },
              {
                index: 1,
                type: 'normal',
                weight_kg: 30,
                reps: 10,
                distance_meters: null,
                duration_seconds: null,
                rpe: 7,
              },
            ],
          },
        ],
      };

      const result = convertHevyWorkout(hevyWorkout);

      expect(result.id).toBe('hevy-123');
      expect(result.title).toBe('Push Day');
      expect(result.date).toEqual(new Date('2024-01-15T08:00:00Z'));
      expect(result.sets).toHaveLength(2);

      // First set (warmup)
      const firstSet = result.sets[0];
      expect(firstSet).toBeDefined();
      expect(firstSet?.exerciseId).toBe('bench-press');
      expect(firstSet?.originalName).toBe('Bench Press (Dumbbell)');
      expect(firstSet?.setType).toBe('warmup');
      expect(firstSet?.weight).toBe(20);
      expect(firstSet?.reps).toBe(15);

      // Second set (normal)
      const secondSet = result.sets[1];
      expect(secondSet).toBeDefined();
      expect(secondSet?.exerciseId).toBe('bench-press');
      expect(secondSet?.setType).toBe('normal');
      expect(secondSet?.rpe).toBe(7);
    });

    it('should handle exercises with null values', () => {
      const hevyWorkout: HevyWorkout = {
        id: 'workout-1',
        title: 'Cardio',
        description: '',
        start_time: '2024-01-15T08:00:00Z',
        end_time: '2024-01-15T08:30:00Z',
        exercises: [
          {
            index: 0,
            title: 'Running',
            notes: '',
            exercise_template_id: 'run',
            superset_id: null,
            sets: [
              {
                index: 0,
                type: 'normal',
                weight_kg: null,
                reps: null,
                distance_meters: 5000,
                duration_seconds: 1800,
                rpe: null,
              },
            ],
          },
        ],
      };

      const result = convertHevyWorkout(hevyWorkout);

      const firstSet = result.sets[0];
      expect(firstSet).toBeDefined();
      expect(firstSet?.weight).toBe(0);
      expect(firstSet?.reps).toBe(0);
      expect(firstSet?.rpe).toBeUndefined();
    });

    it('should map type correctly', () => {
      const createWorkoutWithSetType = (setType: string): HevyWorkout => ({
        id: 'workout-1',
        title: 'Test',
        description: '',
        start_time: '2024-01-15T08:00:00Z',
        end_time: '2024-01-15T09:00:00Z',
        exercises: [
          {
            index: 0,
            title: 'Squat',
            notes: '',
            exercise_template_id: 'squat',
            superset_id: null,
            sets: [
              {
                index: 0,
                type: setType,
                weight_kg: 100,
                reps: 5,
                distance_meters: null,
                duration_seconds: null,
                rpe: null,
              },
            ],
          },
        ],
      });

      const normalResult = convertHevyWorkout(createWorkoutWithSetType('normal'));
      const warmupResult = convertHevyWorkout(createWorkoutWithSetType('warmup'));
      const failureResult = convertHevyWorkout(createWorkoutWithSetType('failure'));
      const dropResult = convertHevyWorkout(createWorkoutWithSetType('dropset'));

      expect(normalResult.sets[0]?.setType).toBe('normal');
      expect(warmupResult.sets[0]?.setType).toBe('warmup');
      expect(failureResult.sets[0]?.setType).toBe('failure');
      expect(dropResult.sets[0]?.setType).toBe('drop');
    });
  });

  describe('HevyApiError', () => {
    it('should create error with status and message', () => {
      const error = new HevyApiError(401, 'Unauthorized');
      expect(error.status).toBe(401);
      expect(error.message).toBe('Unauthorized');
      expect(error.name).toBe('HevyApiError');
    });
  });
});
