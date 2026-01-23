# Coding Conventions

**Analysis Date:** 2026-01-18

## Naming Patterns

**Files:**

- Logic files: `kebab-case.ts` (e.g., `volume-calculator.ts`, `exercise-auto-match.ts`)
- React components: `PascalCase.tsx` (e.g., `MuscleVolumeCard.tsx`, `Dashboard.tsx`)
- Test files: `*.test.ts` in `__tests__/` directories (e.g., `src/core/__tests__/volume-calculator.test.ts`)
- Hooks: `use*.ts` with camelCase (e.g., `useWorkouts.ts`, `useVolumeStats.ts`)
- Index files: `index.ts` for barrel exports

**Functions:**

- Regular functions: `camelCase` (e.g., `calculateMuscleVolume`, `normalizeId`)
- React components: `PascalCase` (e.g., `MuscleVolumeCard`, `Dashboard`)
- Hook functions: `use` prefix with camelCase (e.g., `useWorkouts`, `useCurrentProfile`)

**Variables:**

- Regular variables: `camelCase` (e.g., `currentProfile`, `exerciseMappings`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_MUSCLE_GOAL`, `SCIENTIFIC_MUSCLES`)
- Boolean variables: prefix with `is`, `has`, `should` (e.g., `isLoading`, `isBelowGoal`)

**Types:**

- Type aliases: `PascalCase` (e.g., `ScientificMuscle`, `FunctionalGroup`, `WorkoutSet`)
- Interfaces: `PascalCase` (e.g., `Profile`, `Workout`, `ExerciseMapping`)
- Props interfaces: `ComponentNameProps` pattern (e.g., `MuscleVolumeCardProps`, `ProfileProviderProps`)

## Code Style

**Formatting:**

- Tool: Prettier (`.prettierrc`)
- Semicolons: Always (`"semi": true`)
- Quotes: Single quotes (`"singleQuote": true`)
- Tab width: 2 spaces (`"tabWidth": 2`)
- Trailing commas: ES5 style (`"trailingComma": "es5"`)
- Print width: 100 characters (`"printWidth": 100`)
- Run: `npm run format`

**Linting:**

- Tool: ESLint 9 with flat config (`eslint.config.js`)
- TypeScript: `typescript-eslint/strict` preset
- React: `eslint-plugin-react` and `eslint-plugin-react-hooks`
- Key rules:
  - `@typescript-eslint/no-explicit-any`: error (no `any` allowed)
  - `@typescript-eslint/explicit-function-return-type`: warn (prefer explicit returns)
  - `@typescript-eslint/no-unused-vars`: error (except `_` prefixed args)
  - `react-hooks/rules-of-hooks`: error
  - `react-hooks/exhaustive-deps`: warn
  - `no-console`: warn (except `warn`, `error`)
- Run: `npm run lint` or `npm run lint:fix`

## Import Organization

**Order:**

1. External dependencies (React, libraries)
2. Path alias imports (`@core/`, `@db/`, `@ui/`)
3. Relative imports (same directory)

**Path Aliases:**

- `@/` -> `src/`
- `@core/` -> `src/core/`
- `@db/` -> `src/db/`
- `@ui/` -> `src/ui/`

**Example:**

```typescript
// External
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

// Path aliases
import type { ScientificMuscle, ExerciseMapping } from '@core/taxonomy';
import { useWorkouts } from '@db/hooks/useWorkouts';
import { MuscleHeatmap } from '@ui/components/MuscleHeatmap';

// Relative
import { normalizeId } from './normalization';
```

**Type Imports:**

- Use `import type` for type-only imports
- Example: `import type { Profile } from '@db/schema';`

## Error Handling

**Patterns:**

- Null checks with early returns:

```typescript
if (!profileId) return [];
```

- Optional chaining for safe access:

```typescript
const firstSet = result.workouts[0]?.sets[0];
```

- Nullish coalescing for defaults:

```typescript
volume[muscleKey] = (volume[muscleKey] ?? 0) + contribution;
```

- Context validation:

```typescript
const context = useContext(ProfileContext);
if (!context) {
  throw new Error('useCurrentProfile must be used within a ProfileProvider');
}
```

**Async Error Handling:**

- TanStack Query handles async errors automatically
- Access via `error` property from hooks:

```typescript
const { workouts, isLoading, error } = useWorkouts(profileId, daysBack);
```

## Logging

**Framework:** Browser console (no external logging service)

**Patterns:**

- Use `console.warn()` and `console.error()` only (enforced by ESLint)
- `console.log()` triggers lint warnings
- E2E tests use `console.log()` for debugging (not production code)

## Comments

**When to Comment:**

- JSDoc on exported functions with `@param` and `@returns`
- Single-line comments for non-obvious logic
- File header comments for module purpose

**JSDoc/TSDoc Pattern:**

```typescript
/**
 * Calculates the fractional muscle volume from a collection of workout sets.
 * Warmup sets are excluded from the calculation.
 * Unmapped exercises contribute 0 volume.
 *
 * @param sets - Array of workout sets
 * @param exerciseMappings - Map of exercise ID to muscle contribution mappings
 * @returns Record of ScientificMuscle to total volume
 */
export function calculateMuscleVolume(
  sets: WorkoutSet[],
  exerciseMappings: Map<string, ExerciseMapping>
): Partial<Record<ScientificMuscle, number>> {
```

**Component Documentation:**

```typescript
/**
 * MuscleVolumeCard Component
 * Displays volume stats for a single scientific muscle
 */
```

## Function Design

**Size:** Functions should be focused and concise. Most are under 30 lines.

**Parameters:**

- Use object destructuring for component props:

```typescript
export function MuscleVolumeCard({ stat }: MuscleVolumeCardProps): React.ReactElement {
```

- Use explicit types for function parameters:

```typescript
export function useWorkouts(
  profileId: string | null,
  daysBack: number = 7
): { workouts: Workout[]; isLoading: boolean; error: Error | null };
```

**Return Values:**

- Explicit return type annotations on exported functions
- Return objects from hooks with named properties:

```typescript
return {
  workouts: data ?? [],
  isLoading,
  error: error as Error | null,
};
```

- React components return `React.ReactElement`

## Module Design

**Exports:**

- Named exports for all functions, types, and components
- No default exports (except for pages in some cases)
- Export types separately: `export type { WorkoutSet };`

**Barrel Files:**

- Use `index.ts` for directory exports
- Location: `src/db/hooks/index.ts`, `src/ui/components/anatomy/index.ts`

**Example barrel file:**

```typescript
// src/db/hooks/index.ts
export { useWorkouts, useAddWorkout, useImportWorkouts } from './useWorkouts';
export { useProfiles, useCreateProfile } from './useProfiles';
export { useVolumeStats } from './useVolumeStats';
```

## React Patterns

**Components:**

- Functional components only (no class components)
- Explicit return type: `React.ReactElement`
- Props interface defined above component

**State Management:**

- Local UI state: `useState`
- Global UI state: React Context (`ProfileContext`)
- Server/async state: TanStack Query hooks
- No prop drilling - use Context for shared state

**Hook Rules:**

- Custom hooks must start with `use`
- Place hooks at top of component
- Never call hooks conditionally

**Conditional Rendering:**

```typescript
if (isLoading) {
  return <LoadingSpinner />;
}

if (!currentProfile) {
  return <NoProfileMessage />;
}

return <MainContent />;
```

## TypeScript Patterns

**Strict Mode:** Enabled with additional checks:

- `noUnusedLocals`: true
- `noUnusedParameters`: true
- `noFallthroughCasesInSwitch`: true
- `noUncheckedIndexedAccess`: true

**Type Assertions:**

- Use `as` keyword sparingly:

```typescript
const muscleKey = muscle as ScientificMuscle;
error: error as Error | null,
```

**Partial Records:**

```typescript
Partial<Record<ScientificMuscle, number>>;
```

**Union Types for Enums:**

```typescript
export type Gender = 'male' | 'female' | 'other';
export type SetType = 'normal' | 'warmup' | 'failure' | 'drop';
```

**Readonly Arrays:**

```typescript
export const SCIENTIFIC_MUSCLES: readonly ScientificMuscle[] = [...] as const;
```

---

_Convention analysis: 2026-01-18_
