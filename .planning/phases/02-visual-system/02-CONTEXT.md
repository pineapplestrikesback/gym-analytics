# Phase 2: Visual System - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish color semantics and design tokens that make the body readable at a glance. This phase defines the visual language — color scale for volume levels, over-target treatment, and dark theme consistency. No UI components are built here; this provides the foundation for heatmap and list phases.

</domain>

<decisions>
## Implementation Decisions

### Color Scale Semantics

- Low volume (0%) starts with **cool blue/purple tint** — muscles are visible but clearly "cold"
- **Progression:** Purple → Blue → Teal → Green (100%) → Yellow (>100%) → Red (way over)
- **Green at 100% target** — universal "good" signal for hitting your goal
- **Yellow for exceeding target** — transitional state before red warning
- **Continuous gradient** — smooth interpolation, every % has a unique shade
- **Breakpoints at quarters:** 0% = purple, 25% = blue, 50% = teal, 75% → green, 100% = green peak
- **Weighted toward middle ranges** — more color variation in 40-80% where most muscles land
- **No target = gray/neutral** — can't show progress without a defined target
- **No legend needed** — colors should be intuitive without explicit labeling
- **Slight transparency** — some see-through effect, especially for lower volumes
- **Opacity variation:** Claude's discretion on how transparency ties to volume

### Over-target Treatment

- **Gradient intensity** — gets redder the more you exceed (110% looks different than 150%)
- **Maximum warning at 150%** — 50% over target = darkest red, caps there
- **Additional visual treatment:** Claude's discretion (glow, pulse, border, or just color)
- **Progress bar treatment:** Claude's discretion on consistent list/heatmap approach

### Dark Theme

- **Background darkness:** Claude's discretion (optimize for color vibrancy and eye comfort)
- **Background tone:** Claude's discretion (neutral, cool, or warm based on palette harmony)
- **Subtle layering** — cards slightly lighter than background for visual depth
- **Text colors:** Claude's discretion on hierarchy (primary, secondary, muted levels)

### Claude's Discretion

- Exact background shade and temperature
- Text color hierarchy
- How transparency varies with volume
- Additional over-target visual treatment (beyond color)
- Progress bar overflow behavior for over-target

</decisions>

<specifics>
## Specific Ideas

- "Green at 100% target" — user wants the universal success signal
- Color scale weighted toward middle ranges where most training volume actually lands
- No legend — the colors should communicate without explanation
- Gray for muscles without targets — can't show progress without a goal defined

</specifics>

<deferred>
## Deferred Ideas

- Colorblind accessibility mode — add later as accessibility phase
- Light theme — focus on dark theme for now

</deferred>

---

_Phase: 02-visual-system_
_Context gathered: 2026-01-18_
