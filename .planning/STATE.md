# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** The body itself must carry the primary signal - users see training distribution at a glance without reading numbers.
**Current focus:** Phase 5 - Muscle List

## Current Position

Phase: 5 of 9 (Muscle List)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-01-22 - Completed 05-01-PLAN.md

Progress: [======....] 58%

## Performance Metrics

**Velocity:**

- Total plans completed: 7
- Average duration: 3 min
- Total execution time: 21 min

**By Phase:**

| Phase                   | Plans | Total | Avg/Plan |
| ----------------------- | ----- | ----- | -------- |
| 01-component-foundation | 1     | 4 min | 4 min    |
| 02-visual-system        | 2     | 7 min | 3.5 min  |
| 03-heatmap-core         | 2     | 7 min | 3.5 min  |
| 04-front-back-toggle    | 1     | 2 min | 2 min    |
| 05-muscle-list          | 1     | 1 min | 1 min    |

**Recent Trend:**

- Last 5 plans: 3 min, 3 min, 4 min, 2 min, 1 min
- Trend: Stable (faster on smaller plans)

_Updated after each plan completion_

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- User-agent detection excludes tablets (iPad, Android tablets get desktop view)
- Mobile components in dedicated directory (src/ui/components/mobile/) for clean separation
- Removed dead toggle buttons from Dashboard (MuscleHeatmap shows both views simultaneously)
- Use oklch() CSS format for perceptually uniform color gradients (VIS-COLOR-01)
- Centralized color utility in src/core/ with no React dependencies (VIS-COLOR-02)
- Purple-to-green-to-red gradient with green at 100% goal (VIS-COLOR-03)
- Text colors use cool-to-warm progression without red below 100% (VIS-01-TEXT)
- Dynamic progress bar colors for goal feedback (VIS-02-PROGRESS)
- Removed all floating UI (cards, lines, toggle) for clean body-only visualization (HEAT-01)
- Used calc(100vh-220px) for viewport-filling layout (HEAT-LAYOUT)
- Reuse REGION_TO_MUSCLES mappings in mobile component (HEAT-02-MAPPINGS)
- 18rem maxWidth for mobile body model (HEAT-02-SIZING)
- Use @media (hover: hover) for touch vs mouse device handling (HEAT-02-TOUCH)
- Combined Task 1 and Task 2 into single atomic commit for 3D flip (toggle button integral to container)
- Button shows opposite view label ('Back'/'Front') for discoverability (TOGGLE-LABEL)
- First group starts expanded for mobile muscle list (LIST-MOBILE-01)
- Use existing 7 UI_MUSCLE_GROUPS for consistency with WeeklyGoalEditor

### Patterns Established

- **ARCH-01:** Mobile components isolated in src/ui/components/mobile/
- **ARCH-02:** Mobile components import shared hooks from @db/hooks, no data duplication
- **Device detection:** useMemo for stable value across renders (no viewport width)
- **VIS-01:** Centralized color utility in src/core/color-scale.ts for all volume-to-color mapping
- **VIS-02:** oklch() color space for perceptually uniform gradients
- **VIS-03:** CSS design tokens in @theme for surface/text/status colors
- **VIS-04:** Components import getVolumeColor from @core/color-scale (no local color logic)
- **HEAT-01:** Color carries the primary signal for training distribution (no floating UI over body)
- **MOBILE-01:** Mobile body visualization uses same color scale as desktop via @core/color-scale
- **MOBILE-02:** Touch feedback via :active pseudo-class, not hover
- **TOGGLE-01:** CSS rotateY(180deg) creates body rotation animation
- **TOGGLE-02:** Low-contrast text-primary-400 and bg-primary-800/40 for subtle toggle
- **TOGGLE-03:** useSessionState hook provides session-scoped persistence
- **FLIP-01:** Perspective on parent container, preserve-3d on rotating element
- **FLIP-02:** Both faces have backfaceVisibility hidden, back face pre-rotated 180deg
- **LIST-EXPAND-01:** useState<Set<string>> for tracking multiple expanded sections
- **LIST-MOBILE-01:** First item expanded by default for mobile scroll optimization

### Pending Todos

None.

### Blockers/Concerns

None - Plan 05-01 complete, ready for 05-02 (progress bars and data wiring).

## Session Continuity

Last session: 2026-01-22T21:47:24Z
Stopped at: Completed 05-01-PLAN.md
Resume file: None
