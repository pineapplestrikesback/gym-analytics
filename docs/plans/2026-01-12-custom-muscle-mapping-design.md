# Custom Muscle Mapping Design

## Overview

Allow users to define custom muscle values (0.0-1.0) for exercises, in addition to mapping to canonical exercises.

## Requirements

- Users can create mappings with custom muscle values from scratch
- Users can copy a canonical exercise's values and edit them
- Users can edit existing mappings after creation
- Muscle values use 0.01 step increments for fine control
- UI groups muscles by body part with collapsible sections

## Schema Changes

### ExerciseMapping (src/db/schema.ts)

```typescript
export interface ExerciseMapping {
  id: string;
  profileId: string;
  originalPattern: string;
  canonicalExerciseId: string | null;
  customMuscleValues: Partial<Record<ScientificMuscle, number>> | null; // NEW
  isIgnored: boolean;
  createdAt: Date;
}
```

**Logic:**

- If `customMuscleValues` is set → use those values
- Else if `canonicalExerciseId` is set → use canonical exercise's values
- Else if `isIgnored` → 0 volume

No DB migration needed - Dexie handles new nullable fields.

## UI Design

### Redesigned ExerciseSearchModal

3 tabs:

1. **"Search Canonical"** - Existing search functionality
2. **"Copy & Edit"** - Search + pre-fill muscle editor with selected exercise's values
3. **"From Scratch"** - Empty muscle editor

### MuscleValueEditor Component (new)

Collapsible sections by body part:

- **Back**: Latissimus Dorsi, Middle Trapezius, Upper Trapezius, Erector Spinae
- **Chest**: Pectoralis Major (Sternal), Pectoralis Major (Clavicular)
- **Shoulders**: Anterior Deltoid, Lateral Deltoid, Posterior Deltoid
- **Arms**: Biceps Brachii, Triceps (Lateral/Medial), Triceps (Long Head)
- **Legs**: Quadriceps (Vasti), Quadriceps (RF), Gluteus Maximus, Hamstrings, Gastrocnemius, Soleus

Each muscle has a number input (0.00-1.00, step 0.01).
Only non-zero values are saved.

### Editing Existing Mappings

Click existing mapping in "My Mappings" → opens modal pre-filled with current values.

## Volume Calculator Integration

```typescript
function getMuscleValues(
  exerciseId: string,
  canonicalMappings: Map<string, ExerciseMapping>,
  userMappings: Map<string, DbExerciseMapping>
): Partial<Record<ScientificMuscle, number>> | null {
  // 1. Check user mapping first
  const userMapping = userMappings.get(exerciseId);
  if (userMapping) {
    if (userMapping.isIgnored) return null;
    if (userMapping.customMuscleValues) return userMapping.customMuscleValues;
    if (userMapping.canonicalExerciseId) {
      return canonicalMappings.get(userMapping.canonicalExerciseId) ?? null;
    }
  }

  // 2. Fall back to canonical mapping
  return canonicalMappings.get(exerciseId) ?? null;
}
```

## Implementation Plan

### Phase 1: Database (database-guardian)

- [ ] Update `ExerciseMapping` interface in schema.ts
- [ ] Add `useUpdateExerciseMapping` hook

### Phase 2: Logic (logic-architect)

- [ ] Update volume-calculator.ts to check user mappings first
- [ ] Add helper to resolve exercise → muscle values

### Phase 3: UI (ui-builder)

- [ ] Create `MuscleValueEditor` component
- [ ] Redesign `ExerciseSearchModal` with 3 tabs
- [ ] Update `ExistingMappingsList` with edit functionality

## Files Changed

| File                                                          | Change                         |
| ------------------------------------------------------------- | ------------------------------ |
| `src/db/schema.ts`                                            | Add `customMuscleValues` field |
| `src/db/hooks/useExerciseMappings.ts`                         | Add update hook                |
| `src/core/volume-calculator.ts`                               | Check user mappings first      |
| `src/ui/components/exercise-mapping/MuscleValueEditor.tsx`    | New component                  |
| `src/ui/components/exercise-mapping/ExerciseSearchModal.tsx`  | Redesign with tabs             |
| `src/ui/components/exercise-mapping/ExistingMappingsList.tsx` | Add edit button                |
