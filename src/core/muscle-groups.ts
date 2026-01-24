/**
 * Muscle Group Configuration
 *
 * Provides default muscle grouping, validation, and helper functions
 * for managing custom muscle group configurations.
 */

import type { ScientificMuscle } from '@core/taxonomy';
import { SCIENTIFIC_MUSCLES } from '@core/taxonomy';
import type { MuscleGroupConfig, CustomMuscleGroup } from '@db/schema';

/**
 * Maximum number of custom groups allowed per profile
 */
export const MAX_GROUPS = 8;

/**
 * Default muscle group configuration using Push/Pull/Legs/Core split
 *
 * - Push: Chest, front/side delts, triceps
 * - Pull: Back, rear delts, biceps, brachialis, forearms
 * - Legs: All lower body muscles
 * - Core: Abs, obliques, hip flexors
 *
 * Arms muscles are distributed into Push (triceps) and Pull (biceps, forearms)
 * rather than having a separate Arms group.
 */
export const DEFAULT_MUSCLE_GROUP_CONFIG: MuscleGroupConfig = {
  groups: [
    {
      id: 'default-push',
      name: 'Push',
      muscles: [
        'Pectoralis Major (Sternal)',
        'Pectoralis Major (Clavicular)',
        'Anterior Deltoid',
        'Lateral Deltoid',
        'Triceps (Lateral/Medial)',
        'Triceps (Long Head)',
      ],
    },
    {
      id: 'default-pull',
      name: 'Pull',
      muscles: [
        'Latissimus Dorsi',
        'Upper Trapezius',
        'Middle Trapezius',
        'Lower Trapezius',
        'Posterior Deltoid',
        'Biceps Brachii',
        'Erector Spinae',
        'Forearm Flexors',
        'Forearm Extensors',
      ],
    },
    {
      id: 'default-legs',
      name: 'Legs',
      muscles: [
        'Quadriceps (Vasti)',
        'Quadriceps (RF)',
        'Gluteus Maximus',
        'Gluteus Medius',
        'Hamstrings',
        'Adductors',
        'Gastrocnemius',
        'Soleus',
      ],
    },
    {
      id: 'default-core',
      name: 'Core',
      muscles: [
        'Rectus Abdominis',
        'Obliques',
        'Hip Flexors',
      ],
    },
  ],
  ungrouped: [],
  hidden: [],
};

/**
 * Validation result for muscle group configuration
 */
export interface MuscleGroupValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a muscle group configuration
 *
 * Checks:
 * - All 26 SCIENTIFIC_MUSCLES are accounted for exactly once
 * - Number of groups does not exceed MAX_GROUPS
 * - No duplicate muscles across groups, ungrouped, and hidden
 *
 * @param config - The configuration to validate
 * @returns Validation result with boolean and array of error messages
 */
export function validateMuscleGroupConfig(
  config: MuscleGroupConfig
): MuscleGroupValidationResult {
  const errors: string[] = [];

  // Check group count limit
  if (config.groups.length > MAX_GROUPS) {
    errors.push(`Too many groups: ${config.groups.length} (max ${MAX_GROUPS})`);
  }

  // Collect all muscles from all locations
  const allMuscles: ScientificMuscle[] = [
    ...config.groups.flatMap(g => g.muscles),
    ...config.ungrouped,
    ...config.hidden,
  ];

  // Check for duplicates
  const seen = new Set<ScientificMuscle>();
  const duplicates = new Set<ScientificMuscle>();
  for (const muscle of allMuscles) {
    if (seen.has(muscle)) {
      duplicates.add(muscle);
    }
    seen.add(muscle);
  }
  if (duplicates.size > 0) {
    errors.push(`Duplicate muscles found: ${Array.from(duplicates).join(', ')}`);
  }

  // Check for missing muscles
  const missingMuscles = SCIENTIFIC_MUSCLES.filter(m => !seen.has(m));
  if (missingMuscles.length > 0) {
    errors.push(`Missing muscles: ${missingMuscles.join(', ')}`);
  }

  // Check for invalid muscles (muscles not in SCIENTIFIC_MUSCLES)
  const validMuscleSet = new Set<string>(SCIENTIFIC_MUSCLES);
  const invalidMuscles = allMuscles.filter(m => !validMuscleSet.has(m));
  if (invalidMuscles.length > 0) {
    errors.push(`Invalid muscles: ${invalidMuscles.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Target location for moving a muscle
 */
export type MuscleTargetLocation =
  | { type: 'group'; groupId: string }
  | { type: 'ungrouped' }
  | { type: 'hidden' };

/**
 * Moves a muscle from its current location to a new location
 *
 * This function:
 * 1. Removes the muscle from all current locations (groups, ungrouped, hidden)
 * 2. Adds it to the specified target location
 *
 * Returns a new config object (immutable update).
 *
 * @param config - Current muscle group configuration
 * @param muscle - The muscle to move
 * @param toLocation - Target location specification
 * @returns New configuration with the muscle moved
 * @throws Error if target group ID doesn't exist
 */
export function moveMuscle(
  config: MuscleGroupConfig,
  muscle: ScientificMuscle,
  toLocation: MuscleTargetLocation
): MuscleGroupConfig {
  // Remove muscle from all locations first
  const cleanedGroups: CustomMuscleGroup[] = config.groups.map(g => ({
    ...g,
    muscles: g.muscles.filter(m => m !== muscle),
  }));
  const cleanedUngrouped = config.ungrouped.filter(m => m !== muscle);
  const cleanedHidden = config.hidden.filter(m => m !== muscle);

  // Add to target location
  switch (toLocation.type) {
    case 'ungrouped':
      return {
        groups: cleanedGroups,
        ungrouped: [...cleanedUngrouped, muscle],
        hidden: cleanedHidden,
      };

    case 'hidden':
      return {
        groups: cleanedGroups,
        ungrouped: cleanedUngrouped,
        hidden: [...cleanedHidden, muscle],
      };

    case 'group': {
      const targetGroupIndex = cleanedGroups.findIndex(
        g => g.id === toLocation.groupId
      );
      if (targetGroupIndex === -1) {
        throw new Error(`Group with ID "${toLocation.groupId}" not found`);
      }

      const updatedGroups = cleanedGroups.map((g, index) => {
        if (index === targetGroupIndex) {
          return {
            ...g,
            muscles: [...g.muscles, muscle],
          };
        }
        return g;
      });

      return {
        groups: updatedGroups,
        ungrouped: cleanedUngrouped,
        hidden: cleanedHidden,
      };
    }
  }
}
