# Default Mappings and User Customizations

This document explains how the three types of default mappings work and how users can customize them.

## Overview

The app has three types of default mappings that users can customize per-profile:

1. **Exercise-to-Muscle Mappings** - Fractional muscle contributions for each exercise
2. **Exercise Name Mappings** - Gym-specific names to canonical exercise names
3. **Scientific-to-Functional Mappings** - Scientific muscle names to functional groups for UI display

## 1. Exercise-to-Muscle Mappings

### Source
`config/exercise_list_complete.json` (74 canonical exercises)

### Structure
```json
{
  "Pull Up": {
    "Latissimus Dorsi": 1.0,
    "Middle Trapezius": 0.6,
    "Upper Trapezius": 0.2,
    "Posterior Deltoid": 0.5,
    "Biceps Brachii": 0.4
  }
}
```

### Database Tables
- **Defaults**: Config file (read-only)
- **Overrides**: `defaultExerciseOverrides` table

### Schema
```typescript
interface DefaultExerciseOverride {
  id: string;
  profileId: string;
  exerciseName: string; // "Pull Up"
  customMuscleValues: Partial<Record<ScientificMuscle, number>>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Hooks

#### Query Hooks
```typescript
// Get all overrides for a profile
const { overrides, isLoading } = useDefaultExerciseOverrides(profileId);

// Get specific override (and check if customized)
const { override, isCustomized } = useDefaultExerciseOverride(profileId, "Pull Up");

// Get set of customized exercise names
const { customizedNames } = useCustomizedExerciseNames(profileId);
```

#### Mutation Hooks
```typescript
// Create or update override
const { upsertOverride } = useUpsertDefaultExerciseOverride();
await upsertOverride(profileId, "Pull Up", {
  "Latissimus Dorsi": 0.9,
  "Biceps Brachii": 0.5
});

// Delete override (revert to default)
const { deleteOverride } = useDeleteDefaultExerciseOverride();
await deleteOverride(profileId, "Pull Up");
```

### Utilities
```typescript
import {
  getDefaultExerciseMuscleValues,
  getEffectiveExerciseMuscleValues,
  isDefaultExercise
} from '@db';

// Get default values
const defaultValues = getDefaultExerciseMuscleValues("Pull Up");

// Get effective values (with override applied)
const effectiveValues = getEffectiveExerciseMuscleValues("Pull Up", override);
```

## 2. Exercise Name Mappings

### Source
`config/exercise_name_mappings.json` (~60 gym-specific names)

### Structure
```json
{
  "name_mappings": {
    "Glute Ham Raise": "Glute Ham Raise",
    "Lunge (Barbell)": "Lunge",
    "Back Delt Raise": "Rear Delt Raise"
  }
}
```

### Database Tables
- **Defaults**: Config file (read-only)
- **Overrides**: `defaultNameMappingOverrides` table

### Schema
```typescript
interface DefaultNameMappingOverride {
  id: string;
  profileId: string;
  gymName: string; // "Back Delt Raise"
  canonicalName: string; // "Rear Delt Raise"
  createdAt: Date;
  updatedAt: Date;
}
```

### Hooks

#### Query Hooks
```typescript
// Get all overrides for a profile
const { overrides, isLoading } = useDefaultNameMappingOverrides(profileId);

// Get specific override (and check if customized)
const { override, isCustomized } = useDefaultNameMappingOverride(profileId, "Back Delt Raise");

// Get set of customized gym names
const { customizedNames } = useCustomizedGymNames(profileId);

// Get Map for batch lookups
const { mappingMap } = useNameMappingOverridesMap(profileId);
```

#### Mutation Hooks
```typescript
// Create or update override
const { upsertOverride } = useUpsertDefaultNameMappingOverride();
await upsertOverride(profileId, "Back Delt Raise", "Posterior Deltoid Raise");

// Delete override (revert to default)
const { deleteOverride } = useDeleteDefaultNameMappingOverride();
await deleteOverride(profileId, "Back Delt Raise");
```

### Utilities
```typescript
import {
  getDefaultCanonicalName,
  getEffectiveCanonicalName,
  hasDefaultGymNameMapping
} from '@db';

// Get default mapping
const defaultName = getDefaultCanonicalName("Back Delt Raise");

// Get effective mapping (with override applied)
const effectiveName = getEffectiveCanonicalName("Back Delt Raise", override);

// Check if mapping exists
const hasMapping = hasDefaultGymNameMapping("Back Delt Raise");
```

## 3. Scientific-to-Functional Mappings

### Source
`src/core/taxonomy.ts` - `DEFAULT_SCIENTIFIC_TO_FUNCTIONAL` (26 muscles)

### Structure
```typescript
const DEFAULT_SCIENTIFIC_TO_FUNCTIONAL: Record<ScientificMuscle, FunctionalGroup> = {
  "Latissimus Dorsi": "Lats",
  "Middle Trapezius": "Traps",
  "Biceps Brachii": "Biceps",
  // ...
};
```

### Database Tables
- **Defaults**: TypeScript constant (read-only)
- **Overrides**: `Profile.muscleGroupCustomization` field

### Schema
```typescript
interface Profile {
  // ...
  muscleGroupCustomization: Partial<Record<ScientificMuscle, FunctionalGroup>>;
}
```

### Hooks
Uses existing profile hooks:

```typescript
const { profile, isLoading } = useProfile(profileId);
const { updateProfile } = useUpdateProfile();

// Customize mapping
await updateProfile({
  ...profile,
  muscleGroupCustomization: {
    ...profile.muscleGroupCustomization,
    "Latissimus Dorsi": "Back" // Change from "Lats" to "Back"
  }
});
```

### Utilities
```typescript
import {
  getDefaultFunctionalGroup,
  getEffectiveFunctionalGroup
} from '@db';

// Get default functional group
const defaultGroup = getDefaultFunctionalGroup("Latissimus Dorsi");

// Get effective functional group (with profile override applied)
const effectiveGroup = getEffectiveFunctionalGroup("Latissimus Dorsi", profile);
```

## Usage Patterns

### Pattern 1: Display UI with Revert Button

```typescript
function ExerciseMappingEditor({ profileId, exerciseName }: Props) {
  const { override, isCustomized } = useDefaultExerciseOverride(profileId, exerciseName);
  const { upsertOverride } = useUpsertDefaultExerciseOverride();
  const { deleteOverride } = useDeleteDefaultExerciseOverride();

  const defaultValues = getDefaultExerciseMuscleValues(exerciseName);
  const effectiveValues = getEffectiveExerciseMuscleValues(exerciseName, override);

  return (
    <div>
      <MuscleValueEditor values={effectiveValues} onChange={upsertOverride} />
      {isCustomized && (
        <button onClick={() => deleteOverride(profileId, exerciseName)}>
          Revert to Default
        </button>
      )}
    </div>
  );
}
```

### Pattern 2: Bulk Resolution During Import

```typescript
function importWorkout(profileId: string, gymData: GymWorkoutData) {
  const { overrides: exerciseOverrides } = useDefaultExerciseOverrides(profileId);
  const { overrides: nameOverrides } = useDefaultNameMappingOverrides(profileId);

  // Batch resolve all names
  const gymNames = gymData.exercises.map(e => e.name);
  const canonicalNames = batchResolveGymNameMappings(gymNames, nameOverrides);

  // Batch resolve all muscle values
  const exerciseNames = Array.from(new Set(Array.from(canonicalNames.values())));
  const muscleValues = batchResolveExerciseMuscleValues(exerciseNames, exerciseOverrides);

  // Process workout with resolved values...
}
```

### Pattern 3: Check for Customizations

```typescript
function DefaultMappingsStatus({ profileId }: Props) {
  const { customizedNames: exercises } = useCustomizedExerciseNames(profileId);
  const { customizedNames: gymNames } = useCustomizedGymNames(profileId);
  const { profile } = useProfile(profileId);

  const scientificCustomizations = Object.keys(profile?.muscleGroupCustomization ?? {});

  return (
    <div>
      <p>{exercises.size} exercise mappings customized</p>
      <p>{gymNames.size} name mappings customized</p>
      <p>{scientificCustomizations.length} muscle group mappings customized</p>
    </div>
  );
}
```

## Migration Notes

When the database schema is updated (version 3), the new tables are automatically created:
- `defaultExerciseOverrides`
- `defaultNameMappingOverrides`

Existing data is preserved. No migration needed for existing profiles.

## Testing

To verify the system:
1. Create an override
2. Verify effective value uses override
3. Delete override
4. Verify effective value reverts to default
5. Check `isCustomized` flag changes appropriately
