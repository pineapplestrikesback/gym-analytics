/**
 * ScientificMuscle represents the 26 individual muscles tracked in the system.
 * These are derived from the exercise_list_complete.json mappings.
 */
export type ScientificMuscle =
  // Back
  | 'Latissimus Dorsi'
  | 'Middle Trapezius'
  | 'Upper Trapezius'
  | 'Lower Trapezius'
  | 'Erector Spinae'
  // Shoulders
  | 'Posterior Deltoid'
  | 'Anterior Deltoid'
  | 'Lateral Deltoid'
  // Arms
  | 'Biceps Brachii'
  | 'Triceps (Lateral/Medial)'
  | 'Triceps (Long Head)'
  // Legs
  | 'Quadriceps (Vasti)'
  | 'Quadriceps (RF)'
  | 'Gluteus Maximus'
  | 'Gluteus Medius'
  | 'Hamstrings'
  | 'Adductors'
  | 'Gastrocnemius'
  | 'Soleus'
  // Chest
  | 'Pectoralis Major (Sternal)'
  | 'Pectoralis Major (Clavicular)'
  // Core
  | 'Rectus Abdominis'
  | 'Obliques'
  | 'Hip Flexors'
  // Forearms
  | 'Forearm Flexors'
  | 'Forearm Extensors';

/**
 * Array of all ScientificMuscle values for iteration.
 */
export const SCIENTIFIC_MUSCLES: readonly ScientificMuscle[] = [
  // Back
  'Latissimus Dorsi',
  'Middle Trapezius',
  'Upper Trapezius',
  'Lower Trapezius',
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
  'Gluteus Medius',
  'Hamstrings',
  'Adductors',
  'Gastrocnemius',
  'Soleus',
  // Chest
  'Pectoralis Major (Sternal)',
  'Pectoralis Major (Clavicular)',
  // Core
  'Rectus Abdominis',
  'Obliques',
  'Hip Flexors',
  // Forearms
  'Forearm Flexors',
  'Forearm Extensors',
] as const;

/**
 * FunctionalGroup represents broader muscle groupings shown in the UI.
 * Users see these on the dashboard rather than individual scientific muscles.
 */
export type FunctionalGroup =
  | 'Chest'
  | 'Upper Chest'
  | 'Lats'
  | 'Traps'
  | 'Lower Back'
  | 'Front Delts'
  | 'Side Delts'
  | 'Rear Delts'
  | 'Triceps'
  | 'Biceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'
  | 'Forearms'
  | 'Adductors';

/**
 * Array of all FunctionalGroup values for iteration.
 */
export const FUNCTIONAL_GROUPS: readonly FunctionalGroup[] = [
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
  'Core',
  'Forearms',
  'Adductors',
] as const;

/**
 * Default mapping from ScientificMuscle to FunctionalGroup.
 * Users can customize this per profile.
 */
export const DEFAULT_SCIENTIFIC_TO_FUNCTIONAL: Record<ScientificMuscle, FunctionalGroup> = {
  // Back
  'Latissimus Dorsi': 'Lats',
  'Middle Trapezius': 'Traps',
  'Upper Trapezius': 'Traps',
  'Lower Trapezius': 'Traps',
  'Erector Spinae': 'Lower Back',
  // Shoulders
  'Posterior Deltoid': 'Rear Delts',
  'Anterior Deltoid': 'Front Delts',
  'Lateral Deltoid': 'Side Delts',
  // Arms
  'Biceps Brachii': 'Biceps',
  'Triceps (Lateral/Medial)': 'Triceps',
  'Triceps (Long Head)': 'Triceps',
  // Legs
  'Quadriceps (Vasti)': 'Quads',
  'Quadriceps (RF)': 'Quads',
  'Gluteus Maximus': 'Glutes',
  'Gluteus Medius': 'Glutes',
  Hamstrings: 'Hamstrings',
  Adductors: 'Adductors',
  Gastrocnemius: 'Calves',
  Soleus: 'Calves',
  // Chest
  'Pectoralis Major (Sternal)': 'Chest',
  'Pectoralis Major (Clavicular)': 'Upper Chest',
  // Core
  'Rectus Abdominis': 'Core',
  Obliques: 'Core',
  'Hip Flexors': 'Core',
  // Forearms
  'Forearm Flexors': 'Forearms',
  'Forearm Extensors': 'Forearms',
};

/**
 * Type for exercise muscle mappings (0.0 to 1.0 contribution per muscle).
 */
export type ExerciseMapping = Partial<Record<ScientificMuscle, number>>;

/**
 * UI muscle group categories for displaying muscles in forms/editors.
 * This is the single source of truth for UI components like MuscleValueEditor.
 */
export type UIMuscleGroup = 'Back' | 'Chest' | 'Shoulders' | 'Arms' | 'Legs' | 'Core';

/**
 * UI muscle groups with their constituent ScientificMuscles.
 * Used by MuscleValueEditor, WeeklyGoalEditor, and other UI components.
 */
export const UI_MUSCLE_GROUPS: readonly { name: UIMuscleGroup; muscles: readonly ScientificMuscle[] }[] = [
  {
    name: 'Back',
    muscles: [
      'Latissimus Dorsi',
      'Upper Trapezius',
      'Middle Trapezius',
      'Lower Trapezius',
      'Erector Spinae',
    ],
  },
  {
    name: 'Chest',
    muscles: [
      'Pectoralis Major (Sternal)',
      'Pectoralis Major (Clavicular)',
    ],
  },
  {
    name: 'Shoulders',
    muscles: [
      'Anterior Deltoid',
      'Lateral Deltoid',
      'Posterior Deltoid',
    ],
  },
  {
    name: 'Arms',
    muscles: [
      'Biceps Brachii',
      'Triceps (Long Head)',
      'Triceps (Lateral/Medial)',
      'Forearm Flexors',
      'Forearm Extensors',
    ],
  },
  {
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
    name: 'Core',
    muscles: [
      'Rectus Abdominis',
      'Obliques',
      'Hip Flexors',
    ],
  },
] as const;
