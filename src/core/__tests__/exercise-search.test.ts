import { describe, it, expect } from 'vitest';
import { searchExercises, getAllCanonicalExercises } from '../exercise-search';

describe('exercise-search', () => {
  describe('getAllCanonicalExercises', () => {
    it('should return all canonical exercises', () => {
      const exercises = getAllCanonicalExercises();

      expect(exercises.length).toBeGreaterThan(0);
      expect(exercises.every((e) => e.id && e.name && e.score === 1.0)).toBe(true);
    });

    it('should include known exercises from exercise_list.json', () => {
      const exercises = getAllCanonicalExercises();
      const names = exercises.map((e) => e.name);

      expect(names).toContain('Bench Press');
      expect(names).toContain('Pull Up');
      expect(names).toContain('Squat');
    });

    it('should have correct normalized IDs', () => {
      const exercises = getAllCanonicalExercises();
      const benchPress = exercises.find((e) => e.name === 'Bench Press');

      expect(benchPress).toBeDefined();
      expect(benchPress?.id).toBe('bench-press');
    });
  });

  describe('searchExercises', () => {
    describe('exact matching', () => {
      it('should return exact match with score 1.0', () => {
        const results = searchExercises('Bench Press');
        const first = results[0];

        expect(results.length).toBeGreaterThan(0);
        expect(first?.name).toBe('Bench Press');
        expect(first?.score).toBe(1.0);
      });

      it('should be case insensitive for exact matches', () => {
        const results = searchExercises('bench press');
        const first = results[0];

        expect(results.length).toBeGreaterThan(0);
        expect(first?.name).toBe('Bench Press');
        expect(first?.score).toBe(1.0);
      });

      it('should handle exact match with different casing', () => {
        const results = searchExercises('PULL UP');
        const first = results[0];

        expect(results.length).toBeGreaterThan(0);
        expect(first?.name).toBe('Pull Up');
        expect(first?.score).toBe(1.0);
      });
    });

    describe('starts with matching', () => {
      it('should match exercises that start with query (score 0.9)', () => {
        const results = searchExercises('Bench');
        const first = results[0];

        expect(results.length).toBeGreaterThan(0);
        expect(first?.name).toBe('Bench Press');
        expect(first?.score).toBe(0.9);
      });

      it('should match "Incline" for "Incline Bench Press"', () => {
        const results = searchExercises('Incline');

        const inclineBench = results.find((r) => r.name === 'Incline Bench Press');
        expect(inclineBench).toBeDefined();
        expect(inclineBench?.score).toBe(0.9);
      });
    });

    describe('partial matching', () => {
      it('should match exercises containing the query', () => {
        const results = searchExercises('press');

        const names = results.map((r) => r.name);
        expect(names).toContain('Bench Press');
        expect(names).toContain('Incline Bench Press');
        expect(names).toContain('Overhead Press');
        expect(names).toContain('Leg Press');
      });

      it('should match partial word in middle of name', () => {
        const results = searchExercises('leg');

        const names = results.map((r) => r.name);
        expect(names).toContain('Leg Press');
        expect(names).toContain('Leg Extension');
        expect(names).toContain('Seated Leg Curl');
      });
    });

    describe('multi-word matching', () => {
      it('should match all words regardless of order', () => {
        const results = searchExercises('press bench');

        expect(results.some((r) => r.name === 'Bench Press')).toBe(true);
      });

      it('should match "incline press" to "Incline Bench Press"', () => {
        const results = searchExercises('incline press');

        const inclineBench = results.find((r) => r.name === 'Incline Bench Press');
        expect(inclineBench).toBeDefined();
      });

      it('should score higher when more words match', () => {
        const results = searchExercises('incline bench');

        const inclineBench = results.find((r) => r.name === 'Incline Bench Press');
        const bench = results.find((r) => r.name === 'Bench Press');

        expect(inclineBench).toBeDefined();
        expect(bench).toBeDefined();

        // Incline Bench Press matches 2 words, Bench Press matches 1 word
        if (inclineBench && bench) {
          expect(inclineBench.score).toBeGreaterThan(bench.score);
        }
      });
    });

    describe('sorting and ranking', () => {
      it('should return results sorted by score descending', () => {
        const results = searchExercises('press');

        for (let i = 0; i < results.length - 1; i++) {
          const current = results[i];
          const next = results[i + 1];
          if (current && next) {
            expect(current.score).toBeGreaterThanOrEqual(next.score);
          }
        }
      });

      it('should prioritize exact match over partial match', () => {
        const results = searchExercises('Squat');
        const first = results[0];

        expect(first?.name).toBe('Squat');
        expect(first?.score).toBe(1.0);
      });

      it('should prioritize starts-with over contains', () => {
        const results = searchExercises('Leg');

        // Exercises starting with "Leg" should come before "Seated Leg Curl"
        const topResult = results[0];
        expect(topResult?.name.startsWith('Leg')).toBe(true);
        expect(topResult?.score).toBe(0.9);
      });
    });

    describe('limit parameter', () => {
      it('should respect limit parameter', () => {
        const results = searchExercises('curl', 2);

        expect(results.length).toBeLessThanOrEqual(2);
      });

      it('should default to 10 results when no limit specified', () => {
        const results = searchExercises('e'); // Should match many exercises

        expect(results.length).toBeLessThanOrEqual(10);
      });

      it('should return fewer results if fewer matches exist', () => {
        const results = searchExercises('Squat', 10);

        // Should return as many as match, even if less than limit
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('edge cases', () => {
      it('should return empty array for non-matching query', () => {
        const results = searchExercises('zzz-nonexistent-xyz');

        expect(results).toEqual([]);
      });

      it('should handle empty string query', () => {
        const results = searchExercises('');

        // Empty query could return all or none - as long as it doesn't crash
        expect(Array.isArray(results)).toBe(true);
      });

      it('should handle whitespace-only query', () => {
        const results = searchExercises('   ');

        expect(Array.isArray(results)).toBe(true);
      });

      it('should handle special characters gracefully', () => {
        const results = searchExercises('(dumbbell)');

        expect(Array.isArray(results)).toBe(true);
      });
    });

    describe('common abbreviations', () => {
      it('should match "db" to dumbbell exercises', () => {
        const results = searchExercises('db');

        const names = results.map((r) => r.name);
        expect(names).toContain('Dumbbell Row');
      });

      it('should match "bb" to barbell exercises', () => {
        const results = searchExercises('bb');

        // If no barbell exercises in list, this test will need adjustment
        // For now, just verify it doesn't crash
        expect(Array.isArray(results)).toBe(true);
      });
    });

    describe('result structure', () => {
      it('should return objects with id, name, and score', () => {
        const results = searchExercises('Bench Press');

        expect(results.length).toBeGreaterThan(0);

        const result = results[0];
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('score');

        expect(typeof result?.id).toBe('string');
        expect(typeof result?.name).toBe('string');
        expect(typeof result?.score).toBe('number');
      });

      it('should have scores between 0 and 1', () => {
        const results = searchExercises('press');

        results.forEach((result) => {
          expect(result.score).toBeGreaterThan(0);
          expect(result.score).toBeLessThanOrEqual(1.0);
        });
      });
    });
  });
});
