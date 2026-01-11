import { describe, it, expect } from 'vitest';
import {
  SCIENTIFIC_MUSCLES,
  FUNCTIONAL_GROUPS,
  DEFAULT_SCIENTIFIC_TO_FUNCTIONAL,
  type ScientificMuscle,
  type FunctionalGroup,
} from '../taxonomy';

describe('taxonomy', () => {
  describe('ScientificMuscle', () => {
    it('should contain all 22 scientific muscles from exercise_list.json', () => {
      const expectedMuscles: ScientificMuscle[] = [
        // Back
        'Latissimus Dorsi',
        'Middle Trapezius',
        'Upper Trapezius',
        'Erector Spinae',
        // Shoulders
        'Posterior Deltoid',
        'Anterior Deltoid',
        'Lateral Deltoid',
        // Arms
        'Biceps Brachii',
        'Triceps (Lateral/Medial)',
        'Triceps (Long Head)',
        // Legs
        'Quadriceps (Vasti)',
        'Quadriceps (RF)',
        'Gluteus Maximus',
        'Hamstrings',
        'Gastrocnemius',
        'Soleus',
        // Chest
        'Pectoralis Major (Sternal)',
        'Pectoralis Major (Clavicular)',
      ];

      expectedMuscles.forEach((muscle) => {
        expect(SCIENTIFIC_MUSCLES).toContain(muscle);
      });
    });

    it('should have exactly 18 unique muscles', () => {
      expect(SCIENTIFIC_MUSCLES).toHaveLength(18);
    });
  });

  describe('FunctionalGroup', () => {
    it('should contain expected functional groups', () => {
      const expectedGroups: FunctionalGroup[] = [
        'Chest',
        'Upper Chest',
        'Lats',
        'Traps',
        'Lower Back',
        'Front Delts',
        'Side Delts',
        'Rear Delts',
        'Triceps',
        'Biceps',
        'Quads',
        'Hamstrings',
        'Glutes',
        'Calves',
      ];

      expectedGroups.forEach((group) => {
        expect(FUNCTIONAL_GROUPS).toContain(group);
      });
    });
  });

  describe('DEFAULT_SCIENTIFIC_TO_FUNCTIONAL', () => {
    it('should map every ScientificMuscle to a FunctionalGroup', () => {
      SCIENTIFIC_MUSCLES.forEach((muscle) => {
        expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL[muscle]).toBeDefined();
        expect(FUNCTIONAL_GROUPS).toContain(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL[muscle]);
      });
    });

    it('should map chest muscles correctly', () => {
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Pectoralis Major (Sternal)']).toBe('Chest');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Pectoralis Major (Clavicular)']).toBe('Upper Chest');
    });

    it('should map leg muscles correctly', () => {
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Quadriceps (Vasti)']).toBe('Quads');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Quadriceps (RF)']).toBe('Quads');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Hamstrings']).toBe('Hamstrings');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Gluteus Maximus']).toBe('Glutes');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Gastrocnemius']).toBe('Calves');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Soleus']).toBe('Calves');
    });

    it('should map arm muscles correctly', () => {
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Triceps (Lateral/Medial)']).toBe('Triceps');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Triceps (Long Head)']).toBe('Triceps');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Biceps Brachii']).toBe('Biceps');
    });

    it('should map shoulder muscles correctly', () => {
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Anterior Deltoid']).toBe('Front Delts');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Lateral Deltoid']).toBe('Side Delts');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Posterior Deltoid']).toBe('Rear Delts');
    });

    it('should map back muscles correctly', () => {
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Latissimus Dorsi']).toBe('Lats');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Middle Trapezius']).toBe('Traps');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Upper Trapezius']).toBe('Traps');
      expect(DEFAULT_SCIENTIFIC_TO_FUNCTIONAL['Erector Spinae']).toBe('Lower Back');
    });
  });
});
