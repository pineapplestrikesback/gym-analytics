import { describe, it, expect } from 'vitest';
import { generateAutoMatchSuggestions } from '../exercise-auto-match';
import type { UnmappedExercise } from '@db/schema';

describe('exercise-auto-match', () => {
  describe('generateAutoMatchSuggestions', () => {
    describe('gym-specific marker stripping', () => {
      it('should match "Reverse fly squeeze Domar" to "Reverse Fly" with high confidence', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '1',
            profileId: 'profile1',
            originalName: 'Reverse fly squeeze Domar',
            normalizedName: 'reverse-fly-squeeze-domar',
            firstSeenAt: new Date(),
            occurrenceCount: 5,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.unmappedExerciseName).toBe('Reverse fly squeeze Domar');
        expect(suggestions[0]?.suggestedCanonicalName).toBe('Reverse Fly');
        expect(suggestions[0]?.confidence).toBeGreaterThanOrEqual(0.7);
        expect(suggestions[0]?.matchReason).toContain('reverse');
        expect(suggestions[0]?.matchReason).toContain('fly');
      });

      it('should match "Lateral raise Domar" to "Lateral Raise"', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '2',
            profileId: 'profile1',
            originalName: 'Lateral raise Domar',
            normalizedName: 'lateral-raise-domar',
            firstSeenAt: new Date(),
            occurrenceCount: 3,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.suggestedCanonicalName).toBe('Lateral Raise');
        expect(suggestions[0]?.confidence).toBeGreaterThanOrEqual(0.6);
      });
    });

    describe('abbreviation expansion', () => {
      it('should match "Triceps Ext One Hand DB" to a triceps extension exercise', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '3',
            profileId: 'profile1',
            originalName: 'Triceps Ext One Hand DB',
            normalizedName: 'triceps-ext-one-hand-db',
            firstSeenAt: new Date(),
            occurrenceCount: 4,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.suggestedCanonicalName).toContain('Triceps Extension');
        expect(suggestions[0]?.confidence).toBeGreaterThanOrEqual(0.6);
        expect(suggestions[0]?.matchReason).toContain('triceps');
        expect(suggestions[0]?.matchReason).toContain('extension');
      });

      it('should expand "BB" to "Barbell"', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '4',
            profileId: 'profile1',
            originalName: 'BB Row',
            normalizedName: 'bb-row',
            firstSeenAt: new Date(),
            occurrenceCount: 2,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.suggestedCanonicalName).toContain('Row');
        expect(suggestions[0]?.confidence).toBeGreaterThanOrEqual(0.6);
      });

      it('should expand "DB" to "Dumbbell"', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '5',
            profileId: 'profile1',
            originalName: 'DB Curl',
            normalizedName: 'db-curl',
            firstSeenAt: new Date(),
            occurrenceCount: 2,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.suggestedCanonicalName).toContain('Curl');
        expect(suggestions[0]?.confidence).toBeGreaterThanOrEqual(0.6);
      });
    });

    describe('equipment variation handling', () => {
      it('should match "Chest Press (Machine)" to "Chest Press (Machine)"', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '6',
            profileId: 'profile1',
            originalName: 'Chest Press (Machine)',
            normalizedName: 'chest-press',
            firstSeenAt: new Date(),
            occurrenceCount: 5,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.suggestedCanonicalName).toContain('Chest Press');
        expect(suggestions[0]?.confidence).toBeGreaterThanOrEqual(0.6);
      });

      it('should match "Seated Shoulder Press (Machine)" to "Shoulder Press (Machine)"', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '7',
            profileId: 'profile1',
            originalName: 'Seated Shoulder Press (Machine)',
            normalizedName: 'seated-shoulder-press',
            firstSeenAt: new Date(),
            occurrenceCount: 3,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.suggestedCanonicalName).toContain('Shoulder Press');
        expect(suggestions[0]?.confidence).toBeGreaterThanOrEqual(0.6);
      });
    });

    describe('position prefix handling', () => {
      it('should match exercise with "Seated" prefix', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '8',
            profileId: 'profile1',
            originalName: 'Seated Calf Raise',
            normalizedName: 'seated-calf-raise',
            firstSeenAt: new Date(),
            occurrenceCount: 2,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.suggestedCanonicalName).toContain('Calf Raise');
      });

      it('should match exercise with "Incline" prefix', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '9',
            profileId: 'profile1',
            originalName: 'Incline Bench',
            normalizedName: 'incline-bench',
            firstSeenAt: new Date(),
            occurrenceCount: 2,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.suggestedCanonicalName).toContain('Bench');
      });
    });

    describe('unilateral marker handling', () => {
      it('should match "Single Arm Row" to a row exercise', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '10',
            profileId: 'profile1',
            originalName: 'Single Arm Row',
            normalizedName: 'single-arm-row',
            firstSeenAt: new Date(),
            occurrenceCount: 3,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.suggestedCanonicalName).toContain('Row');
        expect(suggestions[0]?.confidence).toBeGreaterThanOrEqual(0.6);
      });

      it('should match "One Hand Press" to a press exercise', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '11',
            profileId: 'profile1',
            originalName: 'One Hand Press',
            normalizedName: 'one-hand-press',
            firstSeenAt: new Date(),
            occurrenceCount: 2,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.suggestedCanonicalName).toContain('Press');
      });
    });

    describe('confidence threshold', () => {
      it('should not return suggestions with confidence < 0.6', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '12',
            profileId: 'profile1',
            originalName: 'Completely Random Exercise XYZ123',
            normalizedName: 'completely-random-exercise-xyz123',
            firstSeenAt: new Date(),
            occurrenceCount: 1,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(0);
      });

      it('should return high confidence for close matches', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '13',
            profileId: 'profile1',
            originalName: 'Bench Press',
            normalizedName: 'bench-press',
            firstSeenAt: new Date(),
            occurrenceCount: 10,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.confidence).toBeGreaterThanOrEqual(0.9);
      });
    });

    describe('multiple unmapped exercises', () => {
      it('should return at most 1 suggestion per unmapped exercise', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '14',
            profileId: 'profile1',
            originalName: 'Lateral raise Domar',
            normalizedName: 'lateral-raise-domar',
            firstSeenAt: new Date(),
            occurrenceCount: 3,
          },
          {
            id: '15',
            profileId: 'profile1',
            originalName: 'Chest Press (Machine)',
            normalizedName: 'chest-press',
            firstSeenAt: new Date(),
            occurrenceCount: 5,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        // Should have at most 2 suggestions (1 per unmapped exercise)
        expect(suggestions.length).toBeLessThanOrEqual(2);

        // Each unmapped exercise should appear at most once
        const unmappedNames = suggestions.map(s => s.unmappedExerciseName);
        const uniqueNames = new Set(unmappedNames);
        expect(unmappedNames.length).toBe(uniqueNames.size);
      });

      it('should handle mix of matchable and unmatchable exercises', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '16',
            profileId: 'profile1',
            originalName: 'Lateral raise Domar',
            normalizedName: 'lateral-raise-domar',
            firstSeenAt: new Date(),
            occurrenceCount: 3,
          },
          {
            id: '17',
            profileId: 'profile1',
            originalName: 'ZZZ No Match XYZ',
            normalizedName: 'zzz-no-match-xyz',
            firstSeenAt: new Date(),
            occurrenceCount: 1,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        // Should only return suggestion for matchable exercise
        expect(suggestions.length).toBe(1);
        expect(suggestions[0]?.unmappedExerciseName).toBe('Lateral raise Domar');
      });
    });

    describe('edge cases', () => {
      it('should handle empty array', () => {
        const suggestions = generateAutoMatchSuggestions([]);

        expect(suggestions).toEqual([]);
      });

      it('should return suggestions with proper structure', () => {
        const unmappedExercises: UnmappedExercise[] = [
          {
            id: '18',
            profileId: 'profile1',
            originalName: 'Lateral Raise',
            normalizedName: 'lateral-raise',
            firstSeenAt: new Date(),
            occurrenceCount: 3,
          },
        ];

        const suggestions = generateAutoMatchSuggestions(unmappedExercises);

        expect(suggestions.length).toBe(1);
        const suggestion = suggestions[0];

        expect(suggestion).toHaveProperty('unmappedExerciseName');
        expect(suggestion).toHaveProperty('unmappedNormalizedName');
        expect(suggestion).toHaveProperty('suggestedCanonicalId');
        expect(suggestion).toHaveProperty('suggestedCanonicalName');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion).toHaveProperty('matchReason');

        expect(typeof suggestion?.unmappedExerciseName).toBe('string');
        expect(typeof suggestion?.unmappedNormalizedName).toBe('string');
        expect(typeof suggestion?.suggestedCanonicalId).toBe('string');
        expect(typeof suggestion?.suggestedCanonicalName).toBe('string');
        expect(typeof suggestion?.confidence).toBe('number');
        expect(typeof suggestion?.matchReason).toBe('string');

        expect(suggestion?.confidence).toBeGreaterThanOrEqual(0);
        expect(suggestion?.confidence).toBeLessThanOrEqual(1);
      });
    });
  });
});
