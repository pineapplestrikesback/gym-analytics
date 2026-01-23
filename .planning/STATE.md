# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** The body itself must carry the primary signal - users see training distribution at a glance without reading numbers.
**Current focus:** Phase 7 - Detail Pop-up (Plan 1 complete)

## Current Position

Phase: 7 of 9 (Detail Pop-up)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-01-23 - Completed 07-01-PLAN.md

Progress: [==========] 85%

## Performance Metrics

**Velocity:**

- Total plans completed: 11
- Average duration: 2.6 min
- Total execution time: 32 min

**By Phase:**

| Phase                   | Plans | Total | Avg/Plan |
| ----------------------- | ----- | ----- | -------- |
| 01-component-foundation | 1     | 4 min | 4 min    |
| 02-visual-system        | 2     | 7 min | 3.5 min  |
| 03-heatmap-core         | 2     | 7 min | 3.5 min  |
| 04-front-back-toggle    | 1     | 2 min | 2 min    |
| 05-muscle-list          | 2     | 3 min | 1.5 min  |
| 06-carousel-navigation  | 2     | 7 min | 3.5 min  |
| 07-detail-pop-up        | 1     | 2 min | 2 min    |

**Recent Trend:**

- Last 5 plans: 1 min, 2 min, 2 min, 5 min, 2 min
- Trend: Stable (consistently fast on focused plans)

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
- Use existing 6 UI_MUSCLE_GROUPS (Forearms merged into Arms)
- Progress bar width clamped to 100% (data can exceed but bar fills at max)
- Group totals removed from headers for cleaner UI
- formatVolume shows whole numbers without decimals, fractions with one decimal
- embla-carousel-react over custom touch handling for iOS Safari compatibility
- loop: false for 2-slide carousels (loop breaks with only 2 slides in Embla)
- touch-pan-y CSS class for vertical scroll compatibility on carousels
- Elongated active dot (w-4) vs round inactive (w-2) for carousel indicators
- Two-line muscle list layout (name+ratio, then progress bar) for better readability
- Bilateral muscle highlighting: tapping one side highlights both left and right
- Persistent muscle highlights: selection stays until user changes it
- Combined modal tasks into single commit (dismiss handlers integral to modal functionality)
- X button in top-right with pt-12 padding for content clearance
- Simple touchStart/touchEnd for swipe (no passive: false to preserve list scrolling)

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
- **LIST-DATA-01:** useScientificMuscleVolume for muscle-level volume data
- **LIST-DATA-02:** statsMap via useMemo for O(1) muscle lookup
- **LIST-PROGRESS-01:** w-24 h-2 progress bar with rounded-full and dynamic backgroundColor
- **LIST-SUMMARY-01:** Group headers show aggregate volume with getVolumeColor
- **NAV-EMBLA-01:** useEmblaCarousel with loop: false for 2-slide carousels
- **NAV-DOT-01:** Track selected index via emblaApi.on('select') event
- **NAV-A11Y-01:** aria-label and aria-selected on dot indicators for accessibility
- **NAV-SCROLL-01:** touch-pan-y class on flex container allows vertical scroll
- **LIST-MOBILE-02:** Two-line muscle layout with h-1 progress bar spanning full width
- **LIST-MOBILE-03:** Clean group headers showing only name + chevron
- **HEAT-BILATERAL-01:** Tapping one side highlights both left and right muscles
- **HEAT-PERSIST-01:** Selected muscle highlight persists across view flips and until user changes selection
- **MODAL-01:** Portal rendering via createPortal to document.body for z-index isolation
- **MODAL-02:** Body scroll lock via document.body.style.overflow = 'hidden'
- **MODAL-03:** Touch guard pattern with optional chaining for touch events
- **MODAL-04:** 44x44px minimum touch target for close button accessibility

### Pending Todos

None.

### Blockers/Concerns

None - Plan 07-01 complete, MuscleDetailModal ready for integration.

## Session Continuity

Last session: 2026-01-23T13:37:38Z
Stopped at: Completed 07-01-PLAN.md
Resume file: None
