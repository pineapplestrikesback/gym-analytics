import { describe, it, expect } from 'vitest';
import { cleanExerciseName, normalizeId } from '../utils/normalization';

describe('normalization', () => {
  describe('cleanExerciseName', () => {
    it('should remove parenthetical suffixes', () => {
      expect(cleanExerciseName('Bench Press (Dumbbell)')).toBe('Bench Press');
      expect(cleanExerciseName('Bench Press (Barbell)')).toBe('Bench Press');
      expect(cleanExerciseName('Squat (Smith Machine)')).toBe('Squat');
    });

    it('should handle multiple parentheses', () => {
      expect(cleanExerciseName('Bicep Curl (Dumbbell) (Single Arm)')).toBe('Bicep Curl');
    });

    it('should trim whitespace', () => {
      expect(cleanExerciseName('  Bench Press  ')).toBe('Bench Press');
      expect(cleanExerciseName('Bench Press (Dumbbell)  ')).toBe('Bench Press');
    });

    it('should return original name if no parentheses', () => {
      expect(cleanExerciseName('Bench Press')).toBe('Bench Press');
      expect(cleanExerciseName('Pull Up')).toBe('Pull Up');
    });

    it('should handle empty strings', () => {
      expect(cleanExerciseName('')).toBe('');
    });

    it('should handle names that are only parentheses content', () => {
      expect(cleanExerciseName('(Dumbbell)')).toBe('');
    });
  });

  describe('normalizeId', () => {
    it('should convert to lowercase kebab-case', () => {
      expect(normalizeId('Bench Press')).toBe('bench-press');
      expect(normalizeId('Pull Up')).toBe('pull-up');
      expect(normalizeId('Bicep Curl')).toBe('bicep-curl');
    });

    it('should strip parentheses before normalizing', () => {
      expect(normalizeId('Bench Press (Dumbbell)')).toBe('bench-press');
      expect(normalizeId('Squat (Smith Machine)')).toBe('squat');
    });

    it('should handle multiple spaces', () => {
      expect(normalizeId('Bench   Press')).toBe('bench-press');
    });

    it('should handle leading/trailing spaces', () => {
      expect(normalizeId('  Bench Press  ')).toBe('bench-press');
    });

    it('should handle empty strings', () => {
      expect(normalizeId('')).toBe('');
    });
  });
});
