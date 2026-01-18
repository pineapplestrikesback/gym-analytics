# Phase 1: Component Foundation - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish isolated mobile component architecture with shared data hooks. Mobile heatmap component exists separately from desktop, with data hooks imported from shared location (not duplicated). This phase creates the structural foundation that all subsequent mobile phases build upon.

</domain>

<decisions>
## Implementation Decisions

### Component location

- Mobile components live in separate directory: `src/ui/components/mobile/`
- Fresh structure for mobile (not mirroring desktop) — organize based on mobile-specific needs
- Expect multiple mobile views beyond heatmap in future phases — architect directory accordingly

### Desktop coexistence

- User agent detection to determine mobile vs desktop
- Tablets get desktop version (more screen real estate)
- Pages/routes explicitly import MobileHeatmap or DesktopHeatmap — no shared wrapper that decides internally
- Light refactoring of desktop code is acceptable if it improves both versions
- Offline support is nice-to-have, not required for Phase 1

### Data hook structure

- Mobile uses exact same data shape as desktop — no different transformations needed
- Both platforms share data hooks (no duplication)

### Claude's Discretion

- Barrel file vs direct imports for mobile components
- Mobile detection timing (app load vs on-demand)
- Whether to provide user override for mobile/desktop detection
- Hook location (keep in `src/db/hooks` vs new `src/shared/hooks`)
- Hook API consistency (loading/error state patterns)
- Which existing hooks to extract for sharing
- React Query cache strategy (shared vs isolated)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for PWA mobile architecture.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 01-component-foundation_
_Context gathered: 2026-01-18_
