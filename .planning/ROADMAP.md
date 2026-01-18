# Roadmap: Mobile Muscle Heatmap Refactor

## Overview

This roadmap transforms the muscle heatmap from a label-cluttered display into a pattern-driven visualization where the body itself carries the signal. We start by establishing component architecture and visual foundations, build the two main views (heatmap and muscle list), connect them with carousel navigation, add interactive detail pop-ups, and finish with custom grouping settings. Nine phases deliver all 28 requirements in natural build order.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Component Foundation** - Establish mobile component architecture and data hooks
- [ ] **Phase 2: Visual System** - Define color scale and design tokens
- [ ] **Phase 3: Heatmap Core** - Body visualization with volume-based coloring
- [ ] **Phase 4: Front/Back Toggle** - Rotation-style view switching
- [ ] **Phase 5: Muscle List** - Grouped list with progress bars
- [ ] **Phase 6: Carousel Navigation** - Swipeable two-slide interface
- [ ] **Phase 7: Detail Pop-up** - Muscle detail overlay component
- [ ] **Phase 8: Tap Interactions** - Connect taps to pop-up system
- [ ] **Phase 9: Custom Grouping** - User-configurable muscle groups in Settings

## Phase Details

### Phase 1: Component Foundation

**Goal**: Establish isolated mobile component architecture with shared data hooks
**Depends on**: Nothing (first phase)
**Requirements**: ARCH-01, ARCH-02
**Success Criteria** (what must be TRUE):

1. Mobile heatmap component exists separately from desktop (ARCH-01)
2. Data hooks are imported from shared location, not duplicated (ARCH-02)
3. Mobile component renders without affecting existing desktop code
   **Plans**: TBD

Plans:

- [ ] 01-01: Create mobile component structure and data hook integration

### Phase 2: Visual System

**Goal**: Establish color semantics and design tokens that make the body readable
**Depends on**: Phase 1
**Requirements**: VIS-01, VIS-02, VIS-03
**Success Criteria** (what must be TRUE):

1. Red appears only when muscle volume exceeds target (VIS-01)
2. Heatmap, progress bars, and highlights all use the same accent color (VIS-02)
3. Background is dark neutral, consistent across all views (VIS-03)
4. Color scale progresses from cool (low volume) to warm (high volume)
   **Plans**: TBD

Plans:

- [ ] 02-01: Define color scale and design tokens
- [ ] 02-02: Create reusable color utility functions

### Phase 3: Heatmap Core

**Goal**: Body diagram fills screen and shows training distribution through color
**Depends on**: Phase 2
**Requirements**: HEAT-01, HEAT-02, HEAT-03
**Success Criteria** (what must be TRUE):

1. Body diagram fills available screen space without floating labels (HEAT-01)
2. Each muscle region displays color corresponding to weekly volume (HEAT-02)
3. Color scale uses warm progression - blue/purple for low, orange/yellow for high, red only for over-target (HEAT-03)
4. User can visually identify high/low volume muscles at a glance without reading numbers
   **Plans**: TBD

Plans:

- [ ] 03-01: Refactor SVG rendering for full-screen body display
- [ ] 03-02: Implement volume-to-color mapping on muscle regions

### Phase 4: Front/Back Toggle

**Goal**: Toggle between front and back views feels like rotating the body
**Depends on**: Phase 3
**Requirements**: TOGGLE-01, TOGGLE-02, TOGGLE-03
**Success Criteria** (what must be TRUE):

1. Toggle animates like rotation, not abrupt switch (TOGGLE-01)
2. Toggle control is visually subtle, not prominent (TOGGLE-02)
3. Toggle state persists when swiping to list slide and back (TOGGLE-03)
   **Plans**: TBD

Plans:

- [ ] 04-01: Implement rotation-style toggle with animation
- [ ] 04-02: Add state persistence across navigation

### Phase 5: Muscle List

**Goal**: Secondary view shows all muscles grouped by region with progress bars
**Depends on**: Phase 2
**Requirements**: LIST-01, LIST-02, LIST-03, LIST-04
**Success Criteria** (what must be TRUE):

1. Muscles appear grouped under region headers (Shoulders, Chest, Back, Arms, Core, Legs) (LIST-01)
2. Groups can be collapsed/expanded by tapping header (LIST-02)
3. Each muscle shows name and horizontal progress bar (0-20 sets scale) (LIST-03)
4. Numeric set count appears with secondary visual emphasis (smaller/dimmer) (LIST-04)
   **Plans**: TBD

Plans:

- [ ] 05-01: Create collapsible group component structure
- [ ] 05-02: Implement muscle row with progress bar
- [ ] 05-03: Integrate data and render full list

### Phase 6: Carousel Navigation

**Goal**: User can swipe between heatmap and muscle list in Instagram-style carousel
**Depends on**: Phase 3, Phase 5
**Requirements**: NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):

1. Horizontal swipe gesture moves between heatmap and list slides (NAV-01)
2. Dot indicators show which slide is active (NAV-02)
3. Opening the view defaults to heatmap slide (NAV-03)
4. Swipe feels smooth and responsive
   **Plans**: TBD

Plans:

- [ ] 06-01: Implement carousel container with swipe detection
- [ ] 06-02: Add slide indicators and default view logic

### Phase 7: Detail Pop-up

**Goal**: Modal component displays individual muscle details
**Depends on**: Phase 2
**Requirements**: DETAIL-01, DETAIL-02, DETAIL-03
**Success Criteria** (what must be TRUE):

1. Pop-up displays muscle name, current weekly sets, and target range (DETAIL-01)
2. Pop-up closes when tapping outside or X button (DETAIL-02)
3. When pop-up is open, corresponding muscle is highlighted on heatmap (DETAIL-03)
   **Plans**: TBD

Plans:

- [ ] 07-01: Create modal component with muscle detail layout
- [ ] 07-02: Implement dismiss behavior and heatmap highlighting

### Phase 8: Tap Interactions

**Goal**: Tapping muscles on heatmap or list opens detail pop-up
**Depends on**: Phase 3, Phase 5, Phase 7
**Requirements**: HEAT-04, LIST-05
**Success Criteria** (what must be TRUE):

1. Tapping a muscle region on heatmap opens detail pop-up for that muscle (HEAT-04)
2. Tapping a muscle row in list opens detail pop-up for that muscle (LIST-05)
3. Touch targets are appropriately sized for mobile
   **Plans**: TBD

Plans:

- [ ] 08-01: Add tap handlers to heatmap regions
- [ ] 08-02: Add tap handlers to list rows
- [ ] 08-03: Wire up pop-up state management

### Phase 9: Custom Grouping

**Goal**: Users can customize how muscles are grouped in Settings
**Depends on**: Phase 5
**Requirements**: GROUP-01, GROUP-02, GROUP-03, GROUP-04, GROUP-05
**Success Criteria** (what must be TRUE):

1. User can create, edit, and delete custom groups in Settings (GROUP-01)
2. Each muscle belongs to exactly one group - no overlap (GROUP-02)
3. Default groupings are provided when user has no customizations (GROUP-03)
4. User cannot create more than 8 groups (GROUP-04)
5. Groupings are saved per-profile and persist across sessions (GROUP-05)
   **Plans**: TBD

Plans:

- [ ] 09-01: Add database schema for custom groupings
- [ ] 09-02: Create Settings UI for group management
- [ ] 09-03: Integrate custom groupings into muscle list display

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase                   | Plans Complete | Status      | Completed |
| ----------------------- | -------------- | ----------- | --------- |
| 1. Component Foundation | 0/1            | Not started | -         |
| 2. Visual System        | 0/2            | Not started | -         |
| 3. Heatmap Core         | 0/2            | Not started | -         |
| 4. Front/Back Toggle    | 0/2            | Not started | -         |
| 5. Muscle List          | 0/3            | Not started | -         |
| 6. Carousel Navigation  | 0/2            | Not started | -         |
| 7. Detail Pop-up        | 0/2            | Not started | -         |
| 8. Tap Interactions     | 0/3            | Not started | -         |
| 9. Custom Grouping      | 0/3            | Not started | -         |

---

_Roadmap created: 2026-01-18_
_Last updated: 2026-01-18_
