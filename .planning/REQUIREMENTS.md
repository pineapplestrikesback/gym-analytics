# Requirements: Mobile Muscle Heatmap Refactor

**Defined:** 2026-01-18
**Core Value:** The body itself must carry the primary signal — users see training distribution at a glance without reading numbers.

## v1 Requirements

### Carousel Navigation

- [ ] **NAV-01**: User can swipe horizontally between heatmap and muscle list slides
- [ ] **NAV-02**: Slide indicator shows current position (dots or similar)
- [ ] **NAV-03**: Default view is heatmap (slide 1)

### Heatmap

- [x] **HEAT-01**: Body fills screen without floating labels
- [x] **HEAT-02**: Each muscle region shows color based on weekly volume
- [x] **HEAT-03**: Color scale uses warm progression (not red as neutral)
- [ ] **HEAT-04**: Tapping a muscle opens detail pop-up

### Muscle List

- [ ] **LIST-01**: Muscles grouped by region (Shoulders, Chest, Back, Arms, Core, Legs)
- [ ] **LIST-02**: Groups are collapsible
- [ ] **LIST-03**: Each muscle shows name + progress bar (0-20 sets)
- [ ] **LIST-04**: Numeric value shown with secondary emphasis
- [ ] **LIST-05**: Tapping a muscle opens detail pop-up

### Detail Pop-up

- [ ] **DETAIL-01**: Pop-up shows muscle name, weekly sets, target range
- [ ] **DETAIL-02**: Pop-up can be dismissed (tap outside or X)
- [ ] **DETAIL-03**: Pop-up highlights corresponding muscle on heatmap

### Visual Language

- [ ] **VIS-01**: Red reserved for warnings/exceeding limits only
- [ ] **VIS-02**: Consistent accent color across heatmap, progress bars, highlights
- [ ] **VIS-03**: Dark neutral background maintained

### Front/Back Toggle

- [ ] **TOGGLE-01**: Toggle feels like rotation, not mode switch
- [ ] **TOGGLE-02**: Toggle is visually quiet (not emphasized)
- [ ] **TOGGLE-03**: State persists across slide navigation

### Component Architecture

- [ ] **ARCH-01**: Mobile heatmap component isolated from desktop implementation
- [ ] **ARCH-02**: Shared data hooks, separate presentation components

### Custom Grouping

- [ ] **GROUP-01**: User can create/edit/delete muscle groups in Settings
- [ ] **GROUP-02**: Each muscle belongs to exactly one group
- [ ] **GROUP-03**: Default groupings provided as starting point
- [ ] **GROUP-04**: Maximum 8 groups allowed
- [ ] **GROUP-05**: Custom groupings persist per profile

## v2 Requirements

### Future Enhancements

- **FUTURE-01**: Desktop layout with side-by-side body + panel
- **FUTURE-02**: Week-vs-week comparison view
- **FUTURE-03**: Symmetry warnings (left/right imbalance)
- **FUTURE-04**: Training recommendations based on gaps

## Out of Scope

| Feature                           | Reason                                   |
| --------------------------------- | ---------------------------------------- |
| Desktop layout                    | Separate milestone with different design |
| Analytics/insights on this screen | Belongs in dedicated analytics view      |
| Coaching/recommendation text      | Not this screen's purpose                |
| Data model changes                | Presentation refactor only               |

## Traceability

| Requirement | Phase | Status   |
| ----------- | ----- | -------- |
| NAV-01      | 6     | Complete |
| NAV-02      | 6     | Complete |
| NAV-03      | 6     | Complete |
| HEAT-01     | 3     | Complete |
| HEAT-02     | 3     | Complete |
| HEAT-03     | 3     | Complete |
| HEAT-04     | 8     | Pending  |
| LIST-01     | 5     | Complete |
| LIST-02     | 5     | Complete |
| LIST-03     | 5     | Complete |
| LIST-04     | 5     | Complete |
| LIST-05     | 8     | Pending  |
| DETAIL-01   | 7     | Pending  |
| DETAIL-02   | 7     | Pending  |
| DETAIL-03   | 7     | Pending  |
| VIS-01      | 2     | Complete |
| VIS-02      | 2     | Complete |
| VIS-03      | 2     | Complete |
| TOGGLE-01   | 4     | Complete |
| TOGGLE-02   | 4     | Complete |
| TOGGLE-03   | 4     | Complete |
| ARCH-01     | 1     | Complete |
| ARCH-02     | 1     | Complete |
| GROUP-01    | 9     | Pending  |
| GROUP-02    | 9     | Pending  |
| GROUP-03    | 9     | Pending  |
| GROUP-04    | 9     | Pending  |
| GROUP-05    | 9     | Pending  |

**Coverage:**

- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---

_Requirements defined: 2026-01-18_
_Last updated: 2026-01-23 after Phase 6 completion_
