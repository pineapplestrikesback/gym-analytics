import { describe, it, expect } from 'vitest';
import {
  calculateMuscleVolume,
  aggregateToFunctionalGroups,
  type WorkoutSet,
} from '../volume-calculator';
import { DEFAULT_SCIENTIFIC_TO_FUNCTIONAL, type ExerciseMapping } from '../taxonomy';

describe('volume-calculator', () => {
  describe('calculateMuscleVolume', () => {
    const benchPressMapping: ExerciseMapping = {
      'Pectoralis Major (Sternal)': 1.0,
      'Pectoralis Major (Clavicular)': 0.5,
      'Anterior Deltoid': 0.8,
      'Triceps (Lateral/Medial)': 0.7,
    };

    const pullUpMapping: ExerciseMapping = {
      'Latissimus Dorsi': 1.0,
      'Middle Trapezius': 0.6,
      'Biceps Brachii': 0.4,
    };

    const exerciseMappings = new Map<string, ExerciseMapping>([
      ['bench-press', benchPressMapping],
      ['pull-up', pullUpMapping],
    ]);

    it('should calculate volume for a single set', () => {
      const sets: WorkoutSet[] = [
        { exerciseId: 'bench-press', setType: 'normal', weight: 100, reps: 10 },
      ];

      const result = calculateMuscleVolume(sets, exerciseMappings);

      expect(result['Pectoralis Major (Sternal)']).toBe(1.0);
      expect(result['Pectoralis Major (Clavicular)']).toBe(0.5);
      expect(result['Anterior Deltoid']).toBe(0.8);
      expect(result['Triceps (Lateral/Medial)']).toBe(0.7);
    });

    it('should sum volume across multiple sets', () => {
      const sets: WorkoutSet[] = [
        { exerciseId: 'bench-press', setType: 'normal', weight: 100, reps: 10 },
        { exerciseId: 'bench-press', setType: 'normal', weight: 100, reps: 8 },
        { exerciseId: 'bench-press', setType: 'normal', weight: 100, reps: 6 },
      ];

      const result = calculateMuscleVolume(sets, exerciseMappings);

      expect(result['Pectoralis Major (Sternal)']).toBe(3.0);
      expect(result['Anterior Deltoid']).toBeCloseTo(2.4);
    });

    it('should exclude warmup sets', () => {
      const sets: WorkoutSet[] = [
        { exerciseId: 'bench-press', setType: 'warmup', weight: 50, reps: 10 },
        { exerciseId: 'bench-press', setType: 'normal', weight: 100, reps: 10 },
      ];

      const result = calculateMuscleVolume(sets, exerciseMappings);

      expect(result['Pectoralis Major (Sternal)']).toBe(1.0);
    });

    it('should ignore unmapped exercises', () => {
      const sets: WorkoutSet[] = [
        { exerciseId: 'unknown-exercise', setType: 'normal', weight: 100, reps: 10 },
        { exerciseId: 'bench-press', setType: 'normal', weight: 100, reps: 10 },
      ];

      const result = calculateMuscleVolume(sets, exerciseMappings);

      expect(result['Pectoralis Major (Sternal)']).toBe(1.0);
    });

    it('should handle multiple exercises', () => {
      const sets: WorkoutSet[] = [
        { exerciseId: 'bench-press', setType: 'normal', weight: 100, reps: 10 },
        { exerciseId: 'pull-up', setType: 'normal', weight: 0, reps: 10 },
      ];

      const result = calculateMuscleVolume(sets, exerciseMappings);

      expect(result['Pectoralis Major (Sternal)']).toBe(1.0);
      expect(result['Latissimus Dorsi']).toBe(1.0);
      expect(result['Biceps Brachii']).toBe(0.4);
    });

    it('should include failure and drop sets', () => {
      const sets: WorkoutSet[] = [
        { exerciseId: 'bench-press', setType: 'failure', weight: 100, reps: 10 },
        { exerciseId: 'bench-press', setType: 'drop', weight: 80, reps: 8 },
      ];

      const result = calculateMuscleVolume(sets, exerciseMappings);

      expect(result['Pectoralis Major (Sternal)']).toBe(2.0);
    });

    it('should return empty object for empty sets', () => {
      const result = calculateMuscleVolume([], exerciseMappings);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('aggregateToFunctionalGroups', () => {
    it('should aggregate scientific muscles to functional groups', () => {
      const scientificVolume = {
        'Pectoralis Major (Sternal)': 3.0,
        'Pectoralis Major (Clavicular)': 1.5,
        'Triceps (Lateral/Medial)': 2.1,
        'Triceps (Long Head)': 0.9,
      };

      const result = aggregateToFunctionalGroups(
        scientificVolume,
        DEFAULT_SCIENTIFIC_TO_FUNCTIONAL
      );

      expect(result['Chest']).toBe(3.0);
      expect(result['Upper Chest']).toBe(1.5);
      expect(result['Triceps']).toBe(3.0); // 2.1 + 0.9
    });

    it('should handle muscles that map to the same group', () => {
      const scientificVolume = {
        'Quadriceps (Vasti)': 4.0,
        'Quadriceps (RF)': 1.2,
        Gastrocnemius: 2.0,
        Soleus: 1.0,
      };

      const result = aggregateToFunctionalGroups(
        scientificVolume,
        DEFAULT_SCIENTIFIC_TO_FUNCTIONAL
      );

      expect(result['Quads']).toBeCloseTo(5.2); // 4.0 + 1.2
      expect(result['Calves']).toBe(3.0); // 2.0 + 1.0
    });

    it('should return empty object for empty input', () => {
      const result = aggregateToFunctionalGroups({}, DEFAULT_SCIENTIFIC_TO_FUNCTIONAL);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
