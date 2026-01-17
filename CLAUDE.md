# ScientificMuscle (GymAnalytics)

A local-first PWA for advanced bodybuilders who track fractional muscle volume per set using the "Scientific Muscle" taxonomy.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run lint` | Check ESLint violations |
| `npm run lint:fix` | Auto-fix ESLint violations |
| `npm run format` | Format with Prettier |

---

## Project Structure

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
│   │   └── index.ts
│   ├── ui/                      # React components & pages
│   │   ├── components/          # 25 reusable components
│   │   │   ├── anatomy/         # Body diagram SVGs
│   │   │   ├── exercise-mapping/
│   │   │   └── *.tsx
│   │   ├── context/             # ProfileContext (global state)
│   │   ├── layouts/             # MainLayout
│   │   ├── pages/               # Dashboard, Settings, etc.
│   │   └── App.tsx              # Router + provider setup
│   ├── main.tsx                 # App entry point
│   └── index.css                # Global Tailwind styles
├── tests/e2e/                   # Playwright E2E tests
├── config/                      # JSON data files
│   ├── exercise_list_complete.json  # 200+ exercises with muscle mappings
│   ├── exercise_name_mappings.json  # Gym-specific name aliases
│   └── exercise_list.json
├── scripts/
│   └── pr-review-agent/         # PR review automation
└── .github/workflows/           # GitHub Actions
```

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 + TypeScript (strict mode) |
| **Build** | Vite 7 + PWA plugin |
| **Database** | Dexie.js (IndexedDB wrapper) |
| **State** | TanStack Query (server state) + React Context (UI state) |
| **Styling** | Tailwind CSS 4 |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **Deployment** | Vercel (static) |

**Path Aliases:**
- `@/` → `src/`
- `@core/` → `src/core/`
- `@db/` → `src/db/`
- `@ui/` → `src/ui/`

---

## Database Schema (Dexie/IndexedDB)

**Database:** `ScientificMuscleDB`

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles | `id`, `name`, `gender`, `hevyApiKey?`, `goals`, `totalGoal` |
| `workouts` | Workout sessions | `id`, `profileId`, `date`, `title`, `sets[]` |
| `exerciseMappings` | User exercise → muscle mappings | `profileId`, `originalPattern`, `canonicalExerciseId` |
| `unmappedExercises` | Exercises needing mapping | `profileId`, `normalizedName` |
| `defaultExerciseOverrides` | Custom muscle values | `profileId`, `exerciseName`, `muscleValues` |
| `defaultNameMappingOverrides` | Custom name → canonical | `profileId`, `gymName`, `canonicalName` |

**Key Types (from `src/db/schema.ts`):**
```typescript
interface WorkoutSet {
  exerciseId: string;
  originalName: string;
  setType: 'warmup' | 'normal' | 'failure' | 'drop';
  weight: number;
  reps: number;
  rpe?: number;
}
```

---

## Core Logic: Scientific Muscle Taxonomy

**26 Individual Muscles** (tracked for precision):
- **Back (5):** Latissimus Dorsi, Upper/Middle/Lower Trapezius, Erector Spinae
- **Shoulders (3):** Anterior/Lateral/Posterior Deltoid
- **Arms (4):** Biceps Brachii, Triceps Lateral/Medial Head, Triceps Long Head, Brachialis
- **Legs (8):** Quads (Vasti & Rectus Femoris), Glutes (Maximus & Medius), Hamstrings, Adductors, Gastrocnemius, Soleus
- **Chest (2):** Pectoralis Major (Sternal & Clavicular)
- **Core (3):** Rectus Abdominis, Obliques, Hip Flexors
- **Forearms (2):** Flexors & Extensors

**17 Functional Groups** (for UI display):
Chest, Upper Chest, Lats, Traps, Lower Back, Front Delts, Side Delts, Rear Delts, Triceps, Biceps, Quads, Hamstrings, Glutes, Calves, Core, Forearms, Adductors

**Volume Calculation:**
- Each exercise maps to fractional muscle contributions (0.0-1.0)
- Example: Bench Press = 1.0 Chest + 0.8 Front Delts + 0.7 Triceps
- Warmup sets excluded; only normal/failure/drop sets counted

---

## State Management Patterns

**TanStack Query Hooks (server/async state):**
```typescript
useWorkouts(profileId, daysBack)      // Fetch workouts
useProfiles()                          // All user profiles
useVolumeStats(profileId, daysBack)   // Aggregate volume
useDailyStats(profileId, daysBack)    // Daily breakdown
useExerciseMappings(profileId)        // User mappings
useHevySync()                          // Sync from Hevy API
useEnhancedImport()                    // CSV import with validation
```

**React Context (global UI state):**
```typescript
ProfileContext: { currentProfile, setCurrentProfileId, profiles, isLoading }
```

**Local State:** Use `useState` for form inputs, UI toggles, modal visibility.

---

## Coding Standards

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files (logic) | `kebab-case.ts` | `volume-calculator.ts` |
| Components | `PascalCase.tsx` | `MuscleVolumeCard.tsx` |
| Constants | `UPPER_SNAKE_CASE` | `DEFAULT_GOALS` |
| Hooks | `use` prefix | `useWorkouts` |

### TypeScript Rules
- **Strict mode enabled** - no `any` allowed
- **Explicit return types** on exported functions
- **Path aliases** for imports (`@core/`, `@db/`, `@ui/`)

### React Rules
- **Functional components only** - no class components
- **Hooks for state** - useState, useContext, custom hooks
- **No prop drilling** - use Context for shared state

### File Organization
- **Pure logic** → `src/core/` (no React dependencies)
- **Database hooks** → `src/db/hooks/`
- **UI components** → `src/ui/components/`
- **Pages** → `src/ui/pages/`

---

## Testing

### Unit Tests (Vitest)
- Location: `src/core/__tests__/*.test.ts`
- Run: `npm run test`
- Focus: Pure functions in `src/core/`
- TDD recommended: write tests first

### E2E Tests (Playwright)
- Location: `tests/e2e/*.spec.ts`
- Run: `npm run test:e2e`
- Browsers: Chromium (desktop) + iPhone 12 (mobile)
- Auto-starts dev server on port 3000

---

## Agent Orchestration

This project uses a multi-agent development workflow. The orchestrator dispatches tasks to specialized agents.

### Available Agents

| Agent | Scope | Activation |
|-------|-------|------------|
| `logic-architect` | `src/core/` - Pure TypeScript, parsers, taxonomy | "Logic Agent, implement X" |
| `database-guardian` | `src/db/` - Dexie schemas, TanStack Query hooks | "DB Agent, create X" |
| `ui-builder` | `src/ui/` - React, Tailwind, Recharts | "UI Agent, build X" |
| `qa-inspector` | `tests/e2e/` - Playwright, verification | "QA Agent, test X" |
| `pr-reviewer` | PR feedback - Code fixes, commits | "Review Agent, address X" |

### Agent Tool Access
- **TypeScript LSP:** Logic, DB, UI agents
- **Playwright:** QA agent only

### PR Review Automation
1. Agent creates PR → Session registered
2. Reviewer comments → GitHub Action triggers
3. Webhook handler → Resumes agent with context
4. Agent fixes code → Pushes updated commits

See `scripts/pr-review-agent/` for setup.

---

## Development Protocol

### Database-First Rule
The UI Agent MUST NOT mock data. It connects to real IndexedDB. If the DB isn't ready, the UI Agent waits for the Database Agent.

### TDD for Core Logic
1. Write `.test.ts` asserting desired behavior
2. Run test (MUST fail)
3. Write minimum implementation to pass
4. Refactor

### Migration Strategy
For now, schema changes = "Nuke & Rebuild" (delete IndexedDB in DevTools).

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/core/taxonomy.ts` | Muscle definitions & functional groups |
| `src/core/volume-calculator.ts` | Fractional volume computation |
| `src/db/schema.ts` | Database schema & TypeScript types |
| `src/db/hooks/use-workouts.ts` | Primary workout data hook |
| `src/ui/App.tsx` | Router & provider setup |
| `src/ui/pages/Dashboard.tsx` | Main dashboard view |
| `config/exercise_list_complete.json` | 200+ exercise → muscle mappings |

---

## Common Tasks

### Adding a New Exercise Mapping
1. Edit `config/exercise_list_complete.json`
2. Add entry with `muscleContributions` object
3. Run `npm run test` to verify

### Adding a New Database Table
1. Update schema in `src/db/schema.ts`
2. Add version migration
3. Create TanStack Query hook in `src/db/hooks/`
4. Nuke & rebuild DB in DevTools

### Adding a New UI Component
1. Create `src/ui/components/YourComponent.tsx`
2. Use `PascalCase` naming
3. Import with `@ui/components/YourComponent`
4. Use Tailwind for styling

### Adding a New Page
1. Create `src/ui/pages/YourPage.tsx`
2. Add route in `src/ui/App.tsx`
3. Add nav link in `src/ui/layouts/MainLayout.tsx`
