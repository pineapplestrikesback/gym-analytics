---
phase: 06-carousel-navigation
plan: 02
subsystem: ui
tags: [react, embla-carousel, mobile, ux]

# Dependency graph
requires:
  - phase: 06-01
    provides: MobileCarousel component with swipeable navigation
provides:
  - Dashboard with integrated MobileCarousel for mobile users
  - Two-line muscle list layout with improved readability
  - Forearms merged into Arms group (6 UI groups instead of 7)
  - Bilateral persistent muscle highlighting on heatmap
affects: [mobile-ui, muscle-taxonomy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Two-line muscle list layout (name+ratio on line 1, progress bar on line 2)
    - Bilateral muscle highlighting (both sides highlight when one tapped)
    - Persistent selection state (highlights stay until user changes selection)

key-files:
  created: []
  modified:
    - src/ui/pages/Dashboard.tsx
    - src/ui/components/mobile/MobileMuscleList.tsx
    - src/ui/components/mobile/MobileHeatmap.tsx
    - src/core/taxonomy.ts

key-decisions:
  - "Two-line layout per muscle provides better readability than inline layout"
  - "Remove set totals from group headers to reduce visual clutter"
  - "Merge Forearms into Arms group (from 7 to 6 UI groups)"
  - "Bilateral highlighting ensures users see both left and right muscle activation"
  - "Persistent highlights stay visible until user changes selection"

patterns-established:
  - "LIST-MOBILE-02: Two-line muscle layout with h-1 progress bar spanning full width"
  - "LIST-MOBILE-03: Clean group headers showing only name + chevron"
  - "HEAT-BILATERAL-01: Tapping one side highlights both left and right muscles"
  - "HEAT-PERSIST-01: Selected muscle highlight persists across view flips and until user changes selection"

# Metrics
duration: 5min
completed: 2026-01-22
---

# Phase 6 Plan 2: Dashboard Integration Summary

**Mobile carousel with swipeable heatmap/list navigation, improved two-line muscle layout, and bilateral persistent highlighting**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-22T23:06:00Z
- **Completed:** 2026-01-22T23:11:00Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint with 5 UX fixes)
- **Files modified:** 4

## Accomplishments
- Dashboard renders MobileCarousel for mobile users (replaces standalone MobileHeatmap)
- Improved muscle list layout: two lines per muscle (name+ratio, then progress bar)
- Cleaner group headers: removed set totals, show only name + chevron
- Simplified taxonomy: merged Forearms into Arms group (6 UI groups)
- Bilateral muscle highlighting: tapping one side highlights both left and right
- Persistent highlights: selection stays visible until user changes it

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace MobileHeatmap with MobileCarousel in Dashboard** - `3f0dc3f` (feat)
2. **Task 2 (checkpoint continuation - 5 UX fixes):**
   - **Fix 1-3: Muscle list layout improvements** - `a18b834` (fix)
   - **Fix 4-5: Bilateral persistent highlighting** - `c19adc3` (feat)

**Plan metadata:** (this commit, pending)

## Files Created/Modified
- `src/ui/pages/Dashboard.tsx` - Integrated MobileCarousel for mobile users
- `src/ui/components/mobile/MobileMuscleList.tsx` - Two-line layout per muscle, removed group totals
- `src/core/taxonomy.ts` - Merged Forearms into Arms group, removed Forearms from UIMuscleGroup type
- `src/ui/components/mobile/MobileHeatmap.tsx` - Added bilateral persistent muscle highlighting with click handlers

## Decisions Made

**1. Two-line muscle list layout**
- Rationale: User feedback indicated cramped inline layout was hard to read
- Line 1: Full muscle name (left) + current/target ratio (right)
- Line 2: 4px tall progress bar spanning full width
- Improves readability and allows full muscle names without truncation

**2. Remove set totals from group headers**
- Rationale: Group totals created visual clutter and redundant information
- Clean headers show only group name + chevron for expand/collapse

**3. Merge Forearms into Arms group**
- Rationale: Reduced from 7 to 6 UI groups for simpler navigation
- Anatomically logical: forearms are part of arm musculature
- Reduces scrolling in muscle list and group selector

**4. Bilateral muscle highlighting**
- Rationale: User expected both left and right sides to highlight when tapping muscle
- Implementation: Map muscle clicks to regions, highlight ALL muscles in region (front + back)
- Uses frequency level 6 with amber color for selected state

**5. Persistent highlights**
- Rationale: Highlights were disappearing immediately after touch release
- Solution: State-managed selection that persists until user selects different region or deselects
- Highlights persist across front/back view flips

## Deviations from Plan

**User-requested UX improvements at checkpoint**

After Task 1 (Dashboard integration), user tested carousel and identified 5 UX issues:
- Issue 1: Cramped muscle list layout
- Issue 2: Group header set totals
- Issue 3: Forearms should be in Arms group
- Issue 4: Non-bilateral highlighting
- Issue 5: Highlights disappearing

**Resolution:** Implemented all 5 fixes as part of checkpoint continuation (Task 2). These were not deviations but planned checkpoint feedback integration. The plan explicitly included human verification with user feedback loop.

**Total deviations:** 0 (checkpoint feedback is expected plan flow, not deviation)

## Issues Encountered

None - all implementations worked as expected.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Mobile carousel navigation complete with improved UX
- All user feedback addressed
- Ready for next phase: additional mobile features or analytics enhancements
- No blockers or concerns

---
*Phase: 06-carousel-navigation*
*Completed: 2026-01-22*
