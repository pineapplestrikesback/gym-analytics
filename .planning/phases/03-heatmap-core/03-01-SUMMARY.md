---
phase: 03-heatmap-core
plan: 01
subsystem: ui
tags: [react-body-highlighter, heatmap, visualization, color-scale]

# Dependency graph
requires:
  - phase: 02-visual-system
    provides: getVolumeColor from @core/color-scale for perceptually uniform colors
provides:
  - Simplified MuscleHeatmap with color-only body visualization
  - No floating cards, leader lines, or toggle buttons
  - Viewport-filling body diagram layout
affects: [03-heatmap-core, mobile-heatmap, dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'HEAT-01: Color as primary signal - no floating UI elements over body diagram'
    - 'HEAT-LAYOUT: Viewport-filling layout with calc(100vh-Xpx)'

key-files:
  created: []
  modified:
    - src/ui/components/MuscleHeatmap.tsx

key-decisions:
  - 'Removed all floating UI (cards, lines, toggle) for clean body-only visualization'
  - 'Increased body maxWidth from 20rem to 24rem for prominence'
  - 'Used calc(100vh-220px) for viewport-filling layout'

patterns-established:
  - 'HEAT-01: Color carries the primary signal for training distribution'

# Metrics
duration: 3min
completed: 2026-01-19
---

# Phase 3 Plan 1: Simplify Heatmap Summary

**Simplified MuscleHeatmap to color-only body visualization without floating cards, leader lines, or toggle buttons**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-18T23:41:21Z
- **Completed:** 2026-01-18T23:44:25Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Removed MuscleCard component, CARD_POSITIONS, LEADER_LINE_OFFSETS constants
- Removed visibleMuscles state and toggle functions (toggleMuscle, toggleAll)
- Removed SVG leader lines, orange divider, and Show All/Hide All button
- Optimized layout to fill viewport with calc(100vh-220px)
- Increased body diagram maxWidth from 20rem to 24rem

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove floating cards and leader lines** - `170e3fa` (refactor)
2. **Task 2: Optimize layout for screen fill** - `cf70449` (feat)

## Files Created/Modified

- `src/ui/components/MuscleHeatmap.tsx` - Simplified from 646 to 331 lines, color-only body visualization

## Decisions Made

- **Kept MUSCLE_ABBREVIATIONS export:** Preserved for potential use by other components
- **Kept region-to-muscle mappings:** REGION_TO_MUSCLES and REGION_TO_LIBRARY_MUSCLES may be needed elsewhere
- **Viewport-filling layout:** Used calc(100vh-220px) on mobile, calc(100vh-200px) on desktop to account for header/nav

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- MuscleHeatmap now renders a clean body-only view with color as the primary signal (HEAT-01)
- Ready for plan 02 mobile optimization
- Color integration with @core/color-scale working correctly

---

_Phase: 03-heatmap-core_
_Completed: 2026-01-19_
