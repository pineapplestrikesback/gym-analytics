# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** The body itself must carry the primary signal - users see training distribution at a glance without reading numbers.
**Current focus:** Phase 3 - Heatmap Core

## Current Position

Phase: 3 of 9 (Heatmap Core)
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-01-19 - Completed 03-02-PLAN.md

Progress: [====......] 40%

## Performance Metrics

**Velocity:**

- Total plans completed: 5
- Average duration: 4 min
- Total execution time: 18 min

**By Phase:**

| Phase                   | Plans | Total | Avg/Plan |
| ----------------------- | ----- | ----- | -------- |
| 01-component-foundation | 1     | 4 min | 4 min    |
| 02-visual-system        | 2     | 7 min | 3.5 min  |
| 03-heatmap-core         | 2     | 7 min | 3.5 min  |

**Recent Trend:**

- Last 5 plans: 4 min, 4 min, 3 min, 3 min, 4 min
- Trend: Stable

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

### Pending Todos

None.

### Blockers/Concerns

None - Phase 3 complete, ready for Phase 4.

## Session Continuity

Last session: 2026-01-18T23:44:50Z
Stopped at: Completed 03-02-PLAN.md (Phase 3 complete)
Resume file: None
