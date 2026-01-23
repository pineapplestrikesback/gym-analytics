---
phase: 09-custom-grouping
plan: 01
subsystem: database
tags: [tanstack-query, dexie, indexeddb, muscle-groups]

# Dependency graph
requires:
  - phase: 01-component-foundation
    provides: Profile schema and useProfiles hook pattern
provides:
  - CustomMuscleGroup and MuscleGroupConfig types in schema.ts
  - DEFAULT_MUSCLE_GROUP_CONFIG with Push/Pull/Legs/Core groups
  - validateMuscleGroupConfig and moveMuscle helpers
  - useEffectiveMuscleGroupConfig hook with isUsingDefault flag
  - useMuscleGroupMutations hook with saveConfig and resetToDefaults
affects: [09-02-PLAN, 09-03-PLAN, MobileMuscleList, MobileHeatmap, Settings]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Computed effective config from profile + defaults"
    - "Validation before save with detailed error messages"
    - "Immutable update helpers for nested data structures"

key-files:
  created:
    - src/core/muscle-groups.ts
    - src/db/hooks/useMuscleGroups.ts
  modified:
    - src/db/schema.ts
    - src/db/hooks/index.ts

key-decisions:
  - "4 default groups (Push, Pull, Legs, Core) instead of 5 - arms distributed into Push/Pull"
  - "MAX_GROUPS = 8 enforced at validation level, not type level"
  - "Optional customMuscleGroups field - no schema migration needed"

patterns-established:
  - "GROUP-CONFIG-01: useEffectiveMuscleGroupConfig returns isUsingDefault flag for UI"
  - "GROUP-CONFIG-02: validateMuscleGroupConfig checks all 26 muscles accounted for"
  - "GROUP-CONFIG-03: moveMuscle removes from all locations before adding to target"

# Metrics
duration: 3min
completed: 2026-01-23
---

# Phase 9 Plan 01: Data Layer Summary

**MuscleGroupConfig schema types, DEFAULT_MUSCLE_GROUP_CONFIG with 4 groups (Push/Pull/Legs/Core), validation helpers, and TanStack Query hooks for reading/saving configurations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-23T18:30:14Z
- **Completed:** 2026-01-23T18:33:11Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Schema extended with CustomMuscleGroup and MuscleGroupConfig interfaces
- Default 4-group configuration distributes all 26 muscles (Push, Pull, Legs, Core)
- Validation ensures no duplicate muscles and all muscles accounted for
- Hooks provide effective config (custom or default) with isUsingDefault flag

## Task Commits

Each task was committed atomically:

1. **Task 1: Add schema types and default configuration** - `252c555` (feat)
2. **Task 2: Create useMuscleGroups hook** - `91b6a08` (feat)

## Files Created/Modified
- `src/db/schema.ts` - Added CustomMuscleGroup, MuscleGroupConfig interfaces, customMuscleGroups Profile field
- `src/core/muscle-groups.ts` - MAX_GROUPS, DEFAULT_MUSCLE_GROUP_CONFIG, validateMuscleGroupConfig, moveMuscle
- `src/db/hooks/useMuscleGroups.ts` - useEffectiveMuscleGroupConfig, useMuscleGroupMutations
- `src/db/hooks/index.ts` - Export new hooks

## Decisions Made
- **4 default groups instead of 5:** Plan mentioned 5 groups (Push, Pull, Legs, Arms, Core) but research recommended distributing arm muscles into Push (triceps) and Pull (biceps, forearms) for cleaner PPL split
- **Validation-level enforcement:** MAX_GROUPS checked at runtime via validateMuscleGroupConfig rather than TypeScript tuple types for flexibility
- **No schema migration:** customMuscleGroups is optional field with runtime defaults - no Dexie version bump needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. Incorrect muscle name in default config**
- Initially included 'Brachialis' in Pull group, but this muscle doesn't exist in SCIENTIFIC_MUSCLES (taxonomy only has 'Biceps Brachii')
- Fixed by removing 'Brachialis' - final config has correct 26 muscles

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Data layer complete and ready for UI implementation
- useEffectiveMuscleGroupConfig provides read access for MobileMuscleList/MobileHeatmap
- useMuscleGroupMutations provides write access for Settings page
- Validation ensures data integrity for any UI modifications

---
*Phase: 09-custom-grouping*
*Completed: 2026-01-23*
