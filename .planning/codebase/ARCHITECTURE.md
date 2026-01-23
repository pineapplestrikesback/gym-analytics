# Architecture

**Analysis Date:** 2026-01-18

## Pattern Overview

**Overall:** Feature-Sliced Layered Architecture with Local-First Data

**Key Characteristics:**

- Three-layer separation: Core (pure logic) -> DB (persistence + hooks) -> UI (React components)
- Local-first PWA with IndexedDB via Dexie.js
- TanStack Query for async state management with React Context for UI state
- No backend server - all data stored locally with optional Hevy API sync

## Layers

**Core Layer (`src/core/`):**

- Purpose: Pure TypeScript business logic with zero React dependencies
- Location: `src/core/`
- Contains: Taxonomy definitions, volume calculations, parsers (CSV, Hevy API), exercise search/matching
- Depends on: Nothing (except config JSON files)
- Used by: DB hooks for calculations, UI components via re-exports

**Database Layer (`src/db/`):**

- Purpose: Data persistence and async state management
- Location: `src/db/`
- Contains: Dexie schema, TanStack Query hooks (13 hooks), mapping resolver utilities
- Depends on: Core layer (taxonomy types, volume calculator)
- Used by: UI components consume hooks directly

**UI Layer (`src/ui/`):**

- Purpose: React components, pages, layouts, and context providers
- Location: `src/ui/`
- Contains: 25+ components, 5 pages, MainLayout, ProfileContext
- Depends on: DB hooks, Core types (via path aliases)
- Used by: Entry point (`src/main.tsx`) and App router

## Data Flow

**Workout Import Flow:**

1. User uploads CSV or triggers Hevy sync via Settings page
2. Parser (`src/core/parsers/csv-parser.ts` or `src/core/parsers/hevy-api.ts`) converts to `ParsedWorkout[]`
3. Import hook (`src/db/hooks/useEnhancedImport.ts` or `src/db/hooks/useHevySync.ts`) stores to IndexedDB
4. Unmapped exercises detected and stored in `unmappedExercises` table
5. Query invalidation triggers UI refresh

**Volume Calculation Flow:**

1. Dashboard requests volume via `useFunctionalGroupVolume(profileId, daysBack)`
2. Hook fetches workouts from IndexedDB via `useWorkouts`
3. Exercise mappings resolved: user overrides -> canonical JSON -> unmapped
4. `calculateMuscleVolume()` computes fractional sets per ScientificMuscle
5. `aggregateToFunctionalGroups()` rolls up to 17 FunctionalGroups for display
6. Results rendered in MuscleHeatmap and volume cards

**State Management:**

- **Async/Server State:** TanStack Query hooks (workouts, profiles, mappings, stats)
- **Global UI State:** ProfileContext (current profile selection, persisted to localStorage)
- **Local UI State:** useState for forms, modals, toggles

## Key Abstractions

**ScientificMuscle (26 muscles):**

- Purpose: Precise muscle tracking at anatomical level
- Examples: `src/core/taxonomy.ts`
- Pattern: TypeScript union type with const array for iteration

**FunctionalGroup (17 groups):**

- Purpose: User-facing muscle groupings for dashboard display
- Examples: `src/core/taxonomy.ts`
- Pattern: Aggregated from ScientificMuscle via configurable mapping

**ExerciseMapping:**

- Purpose: Maps exercise names to fractional muscle contributions (0.0-1.0)
- Examples: `config/exercise_list_complete.json`, `src/db/schema.ts`
- Pattern: Partial<Record<ScientificMuscle, number>>

**WorkoutSet:**

- Purpose: Single set within a workout with exercise reference and metrics
- Examples: `src/db/schema.ts`, `src/core/volume-calculator.ts`
- Pattern: Normalized structure used across parsers and database

## Entry Points

**Application Entry (`src/main.tsx`):**

- Location: `src/main.tsx`
- Triggers: Browser loads `index.html`
- Responsibilities: PWA registration, QueryClient setup, React root rendering

**App Router (`src/App.tsx`):**

- Location: `src/App.tsx`
- Triggers: React mounts App component
- Responsibilities: Route definitions, ProfileProvider context, MainLayout wrapper

**Routes:**
| Path | Page | Purpose |
|------|------|---------|
| `/` | Dashboard | Weekly volume stats, muscle heatmap |
| `/settings` | Settings | Profile management, import, Hevy sync |
| `/settings/exercise-mappings` | ExerciseMappingPage | Map unmapped exercises |
| `/settings/default-mappings` | DefaultMappingsEditor | Override default muscle values |
| `/debug` | Debug | Development utilities |

## Error Handling

**Strategy:** Graceful degradation with user feedback

**Patterns:**

- TanStack Query error states exposed via `error` property in hooks
- Conditional rendering for loading/error/empty states in components
- Hevy API errors wrapped in `HevyApiError` class with status codes
- Unmapped exercises tracked and surfaced with alert banner on Dashboard

## Cross-Cutting Concerns

**Logging:** console.log/error for PWA registration and debug; no structured logging framework

**Validation:** TypeScript strict mode for compile-time; runtime validation in parsers for CSV/API data

**Authentication:** None (local-first). Hevy API key stored in profile, validated before use

**Profile Isolation:** All data scoped by `profileId`. Queries filter by current profile from context

**Normalization:** Exercise names normalized via `cleanExerciseName()` and `normalizeId()` in `src/core/utils/normalization.ts`

---

_Architecture analysis: 2026-01-18_
