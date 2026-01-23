# Phase 8: Tap Interactions - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Connect taps on heatmap muscle regions and list rows to the existing detail pop-up. Heatmap taps already work from Phase 7 — this phase adds list row taps and fixes the bilateral animation bug.

</domain>

<decisions>
## Implementation Decisions

### List row taps
- Entire row is tappable (name, ratio, progress bar — all open modal)
- Group headers remain expand/collapse only — they do NOT open modal
- Brief highlight/press state on tap (similar to iOS list behavior)

### Bilateral animation fix
- When tapping a muscle on heatmap, BOTH left and right SVG regions should animate
- Currently only the tapped side animates — both connected regions need feedback
- List rows have their own feedback (row highlight), no cross-view sync needed

### Touch feedback consistency
- Heatmap: both bilateral regions animate on tap
- List: row background briefly highlights on touch
- Each view handles its own feedback (carousel slides are never visible together)

### Claude's Discretion
- Exact animation timing and easing
- Highlight color/opacity for list rows
- Whether to use :active pseudo-class or state-based styling for list feedback

</decisions>

<specifics>
## Specific Ideas

- Row highlight should feel like native iOS list tap behavior
- Animation feedback should make clear that both sides of a bilateral muscle are connected

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-tap-interactions*
*Context gathered: 2026-01-23*
