# Phase 7: Detail Pop-up - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

A modal component that displays individual muscle details when a body region is tapped on the heatmap. The pop-up shows muscles within the tapped region, each with name, current/goal sets, and progress bar. Triggering the pop-up (tap handlers) is Phase 8. This phase focuses on the modal component itself — layout, styling, dismiss behavior, and heatmap highlighting.

</domain>

<decisions>
## Implementation Decisions

### Information hierarchy
- Pop-up shows muscles grouped by tapped body region (not functional groups)
- No region header — just the muscle list
- Each muscle displays: name, current/goal ratio (e.g., "15/12-20"), progress bar
- Same data format as carousel muscle list, scoped to the tapped region
- Different grouping than carousel: muscles grouped by anatomical region tapped on body diagram

### Visual presentation
- Centered modal (card-like) that floats over dimmed background
- No header or title — muscle list starts immediately
- No X button — dismissed by tapping outside
- Slightly more compact styling than carousel muscle list (tighter spacing, smaller text)
- Background dimming opacity: Claude's discretion

### Dismiss behavior
- Tap outside modal to dismiss
- X button in corner (alternative dismiss method)
- Swipe down gesture dismisses modal
- Escape key dismisses (desktop support)
- Close animation: fade out (opacity)
- Dismissing clears the highlighted region on heatmap
- Flipping body (front/back toggle) while pop-up is open closes the pop-up automatically

### Heatmap highlighting
- Highlighted region uses outline/stroke (white or accent color)
- Highlight depends on region: some muscles span both sides (shoulders), others don't (chest)
- Constant highlight style (no variation in thickness or color based on volume)
- Highlight renders behind pop-up (z-index layering)

### Claude's Discretion
- Background dimming opacity level
- Exact stroke width and color for region highlight
- Which regions span front/back views (anatomical mapping)
- Exact spacing and padding for compact muscle list layout

</decisions>

<specifics>
## Specific Ideas

- "Pop-up is regional — tapping 'upper back' shows Lats + Upper/Middle Traps, tapping 'lower back' shows Lower Traps + Erector Spinae"
- "Same data as carousel muscle list, just filtered to one body region"
- Pop-up should feel lightweight and dismissible — user can quickly check a region and return to heatmap

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-detail-pop-up*
*Context gathered: 2026-01-23*
