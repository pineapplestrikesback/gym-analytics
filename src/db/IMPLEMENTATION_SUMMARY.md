# Default Mappings Implementation Summary

## Overview
Extended the database schema to support user-editable default mappings with revert capability for all three mapping types in the application.

## Schema Changes (Version 3)

### New Tables

#### 1. `defaultExerciseOverrides`
Stores user customizations of default exercise muscle values from `exercise_list_complete.json`.

**Fields:**
- `id` (string) - Unique identifier
- `profileId` (string) - Profile this override belongs to
- `exerciseName` (string) - Canonical exercise name (e.g., "Pull Up")
- `customMuscleValues` (Partial<Record<ScientificMuscle, number>>) - Custom muscle contributions
- `createdAt` (Date) - When override was created
- `updatedAt` (Date) - When override was last modified

**Indexes:**
- Primary: `id`
- Secondary: `profileId`, `[profileId+exerciseName]`

#### 2. `defaultNameMappingOverrides`
Stores user customizations of default exercise name mappings from `exercise_name_mappings.json`.

**Fields:**
- `id` (string) - Unique identifier
- `profileId` (string) - Profile this override belongs to
- `gymName` (string) - Gym-specific exercise name (e.g., "Back Delt Raise")
- `canonicalName` (string) - Canonical exercise name (e.g., "Rear Delt Raise")
- `createdAt` (Date) - When override was created
- `updatedAt` (Date) - When override was last modified

**Indexes:**
- Primary: `id`
- Secondary: `profileId`, `[profileId+gymName]`

### Existing Support
Scientific-to-Functional mappings already supported via `Profile.muscleGroupCustomization` field. No changes needed.

## New Hooks

### Default Exercise Overrides
**File:** `/home/user/gym-analytics/src/db/hooks/useDefaultExerciseOverrides.ts`

- `useDefaultExerciseOverrides(profileId)` - Get all overrides for a profile
- `useDefaultExerciseOverride(profileId, exerciseName)` - Get specific override + isCustomized flag
- `useUpsertDefaultExerciseOverride()` - Create or update an override
- `useDeleteDefaultExerciseOverride()` - Delete override (revert to default)
- `useCustomizedExerciseNames(profileId)` - Get Set of customized exercise names

### Default Name Mapping Overrides
**File:** `/home/user/gym-analytics/src/db/hooks/useDefaultNameMappingOverrides.ts`

- `useDefaultNameMappingOverrides(profileId)` - Get all overrides for a profile
- `useDefaultNameMappingOverride(profileId, gymName)` - Get specific override + isCustomized flag
- `useUpsertDefaultNameMappingOverride()` - Create or update an override
- `useDeleteDefaultNameMappingOverride()` - Delete override (revert to default)
- `useCustomizedGymNames(profileId)` - Get Set of customized gym names
- `useNameMappingOverridesMap(profileId)` - Get Map<gymName, canonicalName> for batch lookups

## Utility Module

### Mapping Resolver
**File:** `/home/user/gym-analytics/src/db/utils/mapping-resolver.ts`

Provides utilities to resolve default mappings with overrides applied:

**Exercise Muscle Values:**
- `getDefaultExerciseMuscleValues(exerciseName)` - Get from config
- `getEffectiveExerciseMuscleValues(exerciseName, override)` - With override applied
- `isDefaultExercise(exerciseName)` - Check if exists in defaults
- `batchResolveExerciseMuscleValues(names, overrides)` - Batch resolution

**Exercise Name Mappings:**
- `getDefaultCanonicalName(gymName)` - Get from config
- `getEffectiveCanonicalName(gymName, override)` - With override applied
- `hasDefaultGymNameMapping(gymName)` - Check if exists in defaults
- `batchResolveGymNameMappings(gymNames, overrides)` - Batch resolution

**Scientific-to-Functional Mappings:**
- `getDefaultFunctionalGroup(muscle)` - Get from taxonomy
- `getEffectiveFunctionalGroup(muscle, profile)` - With profile override applied

**List Functions:**
- `getAllDefaultExerciseNames()` - Get all canonical exercise names
- `getAllDefaultGymNameMappings()` - Get all default name mappings

## Documentation

### User Guide
**File:** `/home/user/gym-analytics/src/db/MAPPINGS.md`

Comprehensive documentation including:
- Overview of all three mapping types
- Schema details for each
- Hook usage examples
- Utility function examples
- Common usage patterns
- Migration notes

## Updated Files

### Schema
- `/home/user/gym-analytics/src/db/schema.ts` - Added new interfaces and tables

### Hooks
- `/home/user/gym-analytics/src/db/hooks/useDefaultExerciseOverrides.ts` - NEW
- `/home/user/gym-analytics/src/db/hooks/useDefaultNameMappingOverrides.ts` - NEW
- `/home/user/gym-analytics/src/db/hooks/useProfiles.ts` - Updated deleteProfile to clean up new tables
- `/home/user/gym-analytics/src/db/hooks/index.ts` - Export new hooks

### Utilities
- `/home/user/gym-analytics/src/db/utils/mapping-resolver.ts` - NEW

### Exports
- `/home/user/gym-analytics/src/db/index.ts` - Export new types, hooks, and utilities

## Key Design Decisions

### 1. Override-Only Storage
Only user modifications are stored in the database. Defaults remain in config files. This:
- Minimizes database size
- Makes it trivial to determine if something is customized (record exists or not)
- Makes revert operations simple (delete the record)
- Allows defaults to be updated without affecting user customizations

### 2. Per-Profile Customization
All overrides are scoped to profiles, allowing different users to have different customizations.

### 3. Compound Indexes
Using `[profileId+exerciseName]` and `[profileId+gymName]` compound indexes enables:
- Fast lookups during volume calculation
- Efficient querying of profile-specific overrides
- Guaranteed uniqueness per profile

### 4. Upsert Pattern
The `useUpsert*` hooks handle both create and update operations, simplifying UI code that doesn't need to know if an override already exists.

### 5. Batch Resolution
Utility functions support batch resolution to optimize performance during imports where hundreds of exercises need to be resolved at once.

## Migration Path

The database will automatically upgrade from version 2 to version 3 when the app loads:
1. New tables `defaultExerciseOverrides` and `defaultNameMappingOverrides` are created
2. Existing data is preserved
3. No data migration needed (tables start empty)

Users can start customizing defaults immediately after upgrade.

## Testing Verification

Build status: **PASSED**
- TypeScript compilation: ✅
- Vite build: ✅
- No type errors related to new code
- All exports properly typed

## Next Steps for UI Implementation

To use this system in the UI:

1. **Exercise Editor Page:**
   - Show list of all default exercises
   - Mark customized ones with indicator
   - Allow editing muscle values
   - Show "Revert to Default" button when customized

2. **Name Mapping Editor Page:**
   - Show list of all default gym name mappings
   - Mark customized ones with indicator
   - Allow changing canonical name
   - Show "Revert to Default" button when customized

3. **Muscle Group Editor:**
   - Already exists in Settings
   - Uses `Profile.muscleGroupCustomization`

4. **Import Flow:**
   - Use batch resolution functions for performance
   - Show which mappings are customized vs default

5. **Settings Dashboard:**
   - Show count of customizations per type
   - Option to reset all customizations
   - Export/import customizations
