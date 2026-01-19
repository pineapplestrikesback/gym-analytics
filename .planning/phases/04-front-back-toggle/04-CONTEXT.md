# Phase 4: Front/Back Toggle - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Toggle between front and back body views with rotation-style animation. The toggle control is subtle, and state persists appropriately. This phase does not include the carousel navigation (Phase 6) or tap interactions (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Default state

- Front view shows first when user opens heatmap
- User's last-selected view (front/back) is remembered and restored on return
- View state persists within the current session (survives navigation between slides)
- State resets to front on page refresh or tab close

### Claude's Discretion

- What triggers "session end" (page refresh vs profile switch vs other)
- Animation style, timing, and easing for rotation effect
- Toggle control placement and visual design (icon vs text, size, position)
- Whether rotation implies 3D depth or flat crossfade

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for the animation and control styling.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 04-front-back-toggle_
_Context gathered: 2026-01-19_
