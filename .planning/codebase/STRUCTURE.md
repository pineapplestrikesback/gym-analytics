# Codebase Structure

**Analysis Date:** 2026-01-18

## Directory Layout

```
gym-analytics/
├── src/
│   ├── core/                    # Pure business logic (NO React)
│   │   ├── __tests__/           # Unit tests for core logic
│   │   ├── parsers/             # CSV & Hevy API parsers
│   │   ├── utils/               # Normalization utilities
│   │   ├── taxonomy.ts          # 26 muscles + 17 functional groups
│   │   ├── volume-calculator.ts # Fractional volume computation
│   │   ├── exercise-auto-match.ts
│   │   └── exercise-search.ts
│   ├── db/                      # Data persistence layer
│   │   ├── hooks/               # TanStack Query hooks (13 hooks)
│   │   ├── utils/               # Mapping resolver utilities
│   │   ├── schema.ts            # Dexie database schema + types
│   │   └── index.ts             # Barrel export for db module
│   ├── ui/                      # React components & pages
│   │   ├── components/          # Reusable components
│   │   │   ├── anatomy/         # Body diagram SVGs
│   │   │   └── exercise-mapping/# Exercise mapping modals
│   │   ├── context/             # ProfileContext
│   │   ├── layouts/             # MainLayout
│   │   └── pages/               # Route pages
│   ├── App.tsx                  # Router + provider setup
│   ├── main.tsx                 # App entry point
│   └── index.css                # Global Tailwind styles
├── config/                      # JSON data files
├── tests/e2e/                   # Playwright E2E tests
├── scripts/                     # Automation scripts
├── public/                      # Static assets + PWA manifest
└── .planning/                   # GSD planning documents
```

## Directory Purposes

**`src/core/`:**

- Purpose: Pure TypeScript business logic with zero React dependencies
- Contains: Type definitions, calculations, parsers, search algorithms
- Key files: `taxonomy.ts`, `volume-calculator.ts`, `exercise-search.ts`, `exercise-auto-match.ts`

**`src/core/parsers/`:**

- Purpose: Convert external data formats to internal structures
- Contains: `csv-parser.ts` (Hevy CSV format), `hevy-api.ts` (REST API client)

**`src/core/utils/`:**

- Purpose: Shared utility functions
- Contains: `normalization.ts` (exercise name cleaning, ID generation)

**`src/core/__tests__/`:**

- Purpose: Unit tests for core logic (Vitest)
- Contains: Test files matching core modules (e.g., `volume-calculator.test.ts`)

**`src/db/`:**

- Purpose: IndexedDB persistence and async state hooks
- Contains: Schema definition, TanStack Query hooks, mapping utilities
- Key files: `schema.ts`, `index.ts`

**`src/db/hooks/`:**

- Purpose: TanStack Query hooks for database operations
- Contains: 11 hook files covering profiles, workouts, mappings, stats
- Key files: `useWorkouts.ts`, `useVolumeStats.ts`, `useProfiles.ts`, `useExerciseMappings.ts`

**`src/db/utils/`:**

- Purpose: Utilities for resolving default vs override mappings
- Contains: `mapping-resolver.ts`

**`src/ui/`:**

- Purpose: All React code - components, pages, layouts, context
- Contains: Component hierarchy, routing pages, global context

**`src/ui/components/`:**

- Purpose: Reusable React components
- Contains: 16 component files in root, 2 subdirectories
- Key files: `MuscleHeatmap.tsx`, `TotalVolumeCard.tsx`, `ProfileSwitcher.tsx`

**`src/ui/components/anatomy/`:**

- Purpose: Body diagram SVG components for muscle visualization
- Contains: `BodyHighlighter.tsx`, `MaleAnatomySVG.tsx`, `FemaleAnatomySVG.tsx`

**`src/ui/components/exercise-mapping/`:**

- Purpose: Exercise mapping workflow components
- Contains: `UnmappedExerciseList.tsx`, `ExerciseSearchModal.tsx`, `AutoMatchReviewModal.tsx`, `MuscleValueEditor.tsx`, `ExistingMappingsList.tsx`

**`src/ui/context/`:**

- Purpose: React Context providers for global state
- Contains: `ProfileContext.tsx`

**`src/ui/layouts/`:**

- Purpose: Page layout wrappers
- Contains: `MainLayout.tsx`

**`src/ui/pages/`:**

- Purpose: Route-level page components
- Contains: `Dashboard.tsx`, `Settings.tsx`, `ExerciseMappingPage.tsx`, `DefaultMappingsEditor.tsx`, `Debug.tsx`

**`config/`:**

- Purpose: Static JSON data files for exercise definitions
- Contains: `exercise_list_complete.json` (200+ exercises), `exercise_name_mappings.json` (gym aliases), `exercise_list.json`

**`tests/e2e/`:**

- Purpose: Playwright end-to-end tests
- Contains: `*.spec.ts` test files

**`public/`:**

- Purpose: Static assets served directly
- Contains: PWA manifest, icons, favicon

## Key File Locations

**Entry Points:**

- `src/main.tsx`: Application bootstrap, PWA registration, React root
- `src/App.tsx`: Router configuration, context providers

**Configuration:**

- `vite.config.ts`: Vite build config with PWA plugin
- `tsconfig.json`: TypeScript config with path aliases
- `tailwind.config.js`: Tailwind CSS customization
- `vitest.config.ts`: Unit test configuration
- `playwright.config.ts`: E2E test configuration

**Core Logic:**

- `src/core/taxonomy.ts`: ScientificMuscle and FunctionalGroup definitions
- `src/core/volume-calculator.ts`: `calculateMuscleVolume()`, `aggregateToFunctionalGroups()`
- `src/core/exercise-search.ts`: `searchExercises()`, `getAllCanonicalExercises()`
- `src/core/exercise-auto-match.ts`: `generateAutoMatchSuggestions()`

**Database:**

- `src/db/schema.ts`: Dexie class, table definitions, types
- `src/db/index.ts`: Barrel export for all db exports
- `src/db/hooks/useVolumeStats.ts`: Volume calculation hooks with mapping resolution

**Testing:**

- `src/core/__tests__/*.test.ts`: Unit tests
- `tests/e2e/*.spec.ts`: E2E tests

## Naming Conventions

**Files:**

- Logic files: `kebab-case.ts` (e.g., `volume-calculator.ts`, `csv-parser.ts`)
- React components: `PascalCase.tsx` (e.g., `MuscleHeatmap.tsx`, `Dashboard.tsx`)
- Test files: `*.test.ts` (unit) or `*.spec.ts` (E2E)
- Barrel exports: `index.ts`

**Directories:**

- All lowercase with hyphens: `exercise-mapping/`, `__tests__/`
- Feature grouping: components grouped by feature (anatomy, exercise-mapping)

**Imports:**

- Path aliases: `@/` -> `src/`, `@core/` -> `src/core/`, `@db/` -> `src/db/`, `@ui/` -> `src/ui/`
- Prefer aliases over relative paths for cross-layer imports

## Where to Add New Code

**New Core Logic:**

- Primary code: `src/core/your-module.ts`
- Tests: `src/core/__tests__/your-module.test.ts`
- Write tests first (TDD), ensure no React dependencies

**New Database Hook:**

- Implementation: `src/db/hooks/useYourHook.ts`
- Export from: `src/db/hooks/index.ts` and `src/db/index.ts`
- Follow TanStack Query patterns from existing hooks

**New UI Component:**

- Implementation: `src/ui/components/YourComponent.tsx`
- Feature subdirectory if related components exist: `src/ui/components/your-feature/`
- Export via barrel file if in subdirectory

**New Page:**

- Implementation: `src/ui/pages/YourPage.tsx`
- Add route in: `src/App.tsx`
- Add nav link in: `src/ui/layouts/MainLayout.tsx` (if top-level nav)

**New Parser:**

- Implementation: `src/core/parsers/your-parser.ts`
- Tests: `src/core/__tests__/your-parser.test.ts`
- Hook for import: `src/db/hooks/useYourImport.ts`

**Utilities:**

- Core utilities: `src/core/utils/your-util.ts`
- DB utilities: `src/db/utils/your-util.ts`

**E2E Tests:**

- Tests: `tests/e2e/your-feature.spec.ts`

## Special Directories

**`node_modules/`:**

- Purpose: npm dependencies
- Generated: Yes (npm install)
- Committed: No (.gitignore)

**`dist/`:**

- Purpose: Production build output
- Generated: Yes (npm run build)
- Committed: No (.gitignore)

**`.planning/`:**

- Purpose: GSD planning and codebase analysis documents
- Generated: By GSD agents
- Committed: Yes (useful context)

**`public/`:**

- Purpose: Static assets copied directly to build
- Generated: No
- Committed: Yes

**`config/`:**

- Purpose: Static JSON data files
- Generated: No (hand-maintained or script-generated)
- Committed: Yes

---

_Structure analysis: 2026-01-18_
