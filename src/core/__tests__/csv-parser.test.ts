import { describe, it, expect } from 'vitest';
import { parseCsv, detectCsvFormat } from '../parsers/csv-parser';

describe('csv-parser', () => {
  describe('detectCsvFormat', () => {
    it('should detect Hevy format', () => {
      const hevyCsv = `"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
"Morning workout","31 Dec 2025, 13:18","31 Dec 2025, 15:11","","Bench Press",,"",0,"normal",100,10,,0,`;

      expect(detectCsvFormat(hevyCsv)).toBe('hevy');
    });

    it('should detect Strong format', () => {
      const strongCsv = `Date,Workout Name,Exercise Name,Set Order,Weight,Reps,RPE,Distance,Seconds,Notes,Workout Notes
2025-12-31 14:00:00,Push Day,Bench Press,1,100,10,8,,,`;

      expect(detectCsvFormat(strongCsv)).toBe('strong');
    });

    it('should return unknown for unrecognized format', () => {
      const unknownCsv = `column1,column2,column3
value1,value2,value3`;

      expect(detectCsvFormat(unknownCsv)).toBe('unknown');
    });
  });

  describe('parseCsv - Hevy format', () => {
    const hevyCsv = `"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
"Morning workout","31 Dec 2025, 13:18","31 Dec 2025, 15:11","","Bench Press (Barbell)",,"",0,"normal",100,10,,0,
"Morning workout","31 Dec 2025, 13:18","31 Dec 2025, 15:11","","Bench Press (Barbell)",,"",1,"normal",100,8,,0,
"Morning workout","31 Dec 2025, 13:18","31 Dec 2025, 15:11","","Squat (Smith Machine)",,"",0,"warmup",60,10,,0,
"Morning workout","31 Dec 2025, 13:18","31 Dec 2025, 15:11","","Squat (Smith Machine)",,"",1,"normal",100,8,,0,`;

    it('should parse Hevy CSV and return correct format', () => {
      const result = parseCsv(hevyCsv);
      expect(result.format).toBe('hevy');
    });

    it('should group sets into a single workout by start_time', () => {
      const result = parseCsv(hevyCsv);
      expect(result.workouts).toHaveLength(1);
    });

    it('should parse all sets from the workout', () => {
      const result = parseCsv(hevyCsv);
      expect(result.workouts[0]?.sets).toHaveLength(4);
    });

    it('should normalize exercise names (strip parentheses)', () => {
      const result = parseCsv(hevyCsv);
      const exerciseIds = result.workouts[0]?.sets.map((s) => s.exerciseId);
      expect(exerciseIds).toContain('bench-press');
      expect(exerciseIds).toContain('squat');
    });

    it('should parse weight and reps correctly', () => {
      const result = parseCsv(hevyCsv);
      const firstSet = result.workouts[0]?.sets[0];
      expect(firstSet?.weight).toBe(100);
      expect(firstSet?.reps).toBe(10);
    });

    it('should identify warmup sets', () => {
      const result = parseCsv(hevyCsv);
      const warmupSet = result.workouts[0]?.sets.find((s) => s.setType === 'warmup');
      expect(warmupSet).toBeDefined();
      expect(warmupSet?.exerciseId).toBe('squat');
    });

    it('should parse the workout date correctly', () => {
      const result = parseCsv(hevyCsv);
      const workout = result.workouts[0];
      expect(workout?.date.getFullYear()).toBe(2025);
      expect(workout?.date.getMonth()).toBe(11); // December (0-indexed)
      expect(workout?.date.getDate()).toBe(31);
    });

    it('should preserve original exercise name', () => {
      const result = parseCsv(hevyCsv);
      const firstSet = result.workouts[0]?.sets[0];
      expect(firstSet?.originalName).toBe('Bench Press (Barbell)');
    });
  });

  describe('parseCsv - multiple workouts', () => {
    const multiWorkoutCsv = `"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
"Morning workout","31 Dec 2025, 13:18","31 Dec 2025, 15:11","","Bench Press",,"",0,"normal",100,10,,0,
"Evening workout","29 Dec 2025, 18:38","29 Dec 2025, 20:35","","Squat",,"",0,"normal",120,8,,0,`;

    it('should parse multiple workouts', () => {
      const result = parseCsv(multiWorkoutCsv);
      expect(result.workouts).toHaveLength(2);
    });

    it('should sort workouts by date descending (newest first)', () => {
      const result = parseCsv(multiWorkoutCsv);
      const dates = result.workouts.map((w) => w.date.getTime());
      expect(dates[0]).toBeGreaterThan(dates[1] ?? 0);
    });
  });

  describe('parseCsv - edge cases', () => {
    it('should return empty array for empty CSV', () => {
      const result = parseCsv('');
      expect(result.workouts).toHaveLength(0);
      expect(result.format).toBe('unknown');
    });

    it('should return empty array for header-only CSV', () => {
      const headerOnly = `"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"`;
      const result = parseCsv(headerOnly);
      expect(result.workouts).toHaveLength(0);
    });

    it('should handle missing weight values', () => {
      const csvWithMissingWeight = `"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
"Morning","31 Dec 2025, 13:18","31 Dec 2025, 15:11","","Pull Up",,"",0,"normal",,10,,0,`;

      const result = parseCsv(csvWithMissingWeight);
      expect(result.workouts[0]?.sets[0]?.weight).toBe(0);
    });

    it('should handle quoted fields with commas', () => {
      const csvWithQuotes = `"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
"Morning, Dec 31","31 Dec 2025, 13:18","31 Dec 2025, 15:11","","Bench Press",,"",0,"normal",100,10,,0,`;

      const result = parseCsv(csvWithQuotes);
      expect(result.workouts).toHaveLength(1);
      expect(result.workouts[0]?.title).toBe('Morning, Dec 31');
    });
  });
});
