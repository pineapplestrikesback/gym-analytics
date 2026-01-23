# Mobile Muscle Heatmap Refactor

## What This Is

A mobile UI refactor for the muscle heatmap component in ScientificMuscle. The body is now a readable heatmap where users see training distribution at a glance — pattern recognition over label reading. Features Instagram-style swipeable carousel, 3D flip animation, grouped muscle list with progress bars, and user-configurable muscle groups.

## Core Value

The body itself must carry the primary signal. Users should see training distribution at a glance without reading numbers.

## Requirements

### Validated

- ✓ Weekly volume tracking per muscle — existing
- ✓ Front/back anatomical views — existing
- ✓ 26-muscle granularity with fractional contributions — existing
- ✓ Per-muscle target goals (0-20 sets) — existing
- ✓ Body heatmap as primary visualization (no floating labels) — v1.0
- ✓ Two-slide horizontal carousel (Instagram-style swipe) — v1.0
- ✓ Slide 1: Body heatmap with color-based volume indication — v1.0
- ✓ Slide 2: Muscle list grouped by region with progress bars — v1.0
- ✓ Tap-to-reveal detail pop-up for individual muscles — v1.0
- ✓ Front/Back toggle feels like rotation, not mode switch — v1.0
- ✓ Color semantics fixed (red = warnings/overtraining only) — v1.0
- ✓ Component isolation from future desktop implementation — v1.0
- ✓ User-configurable muscle groups with drag-and-drop editor — v1.0

### Active

- [ ] Desktop layout with side-by-side body + panel
- [ ] Week-vs-week comparison view
- [ ] Symmetry warnings (left/right imbalance)

### Out of Scope

- Advanced analytics on this screen — belongs elsewhere
- Recommendations or coaching text — not this screen's job
- Training recommendations based on gaps — future feature
- Data model changes — presentation only, model stays

## Context

### Current State (v1.0 shipped)

**Codebase:** ~14,087 LOC TypeScript across 81 files
**Tech stack:** React 19, Vite 7, Dexie.js, TanStack Query, Tailwind CSS 4, Recharts, embla-carousel-react, @dnd-kit

**Architecture:**
- Mobile components isolated in `src/ui/components/mobile/`
- Shared data hooks in `src/db/hooks/` (no duplication)
- Color system centralized in `src/core/color-scale.ts` using oklch()
- Custom muscle groups stored in Profile schema (IndexedDB)

**User patterns established:**
- Pattern-driven visualization (body carries the signal)
- Bilateral muscle highlighting (tap one side, both highlight)
- Persistent selection state across view flips
- 4 default muscle groups: Push, Pull, Legs, Core

### Muscle Grouping Structure

Default groups (user-customizable):

- **Push:** Pec (Clavicular), Pec (Sternal), Ant Delt, Lat Delt, Triceps Lateral/Medial, Triceps Long Head
- **Pull:** Lats, Upper Trap, Mid Trap, Low Trap, Erectors, Post Delt, Biceps, Brachialis, Forearms
- **Legs:** Quads (RF/Vasti), Hamstrings, Adductors, Glutes (Max/Med), Calves, Hip Flexors
- **Core:** Abs, Obliques

Users can create up to 8 groups, mark muscles as "Ungrouped" (priority display) or "Hidden" (grayed out).

## Constraints

- **Data model:** Preserved — no changes to taxonomy, volume calculation, or DB schema
- **Mobile-first:** v1.0 is mobile-only; desktop handled separately in next milestone
- **Component isolation:** Clear separation so mobile and desktop don't affect each other
- **Tech stack:** React, Tailwind, existing anatomy SVGs in `src/ui/components/anatomy/`

## Key Decisions

| Decision | Rationale | Outcome |
| --- | --- | --- |
| Two-slide carousel for mobile | Instagram-familiar pattern, separates glance vs detail | ✓ Good |
| Pop-up for muscle detail | Avoids third slide, respects progressive disclosure | ✓ Good |
| Groups are visual only | Keeps data granularity, reduces cognitive load | ✓ Good |
| Red reserved for warnings | Current red-as-neutral felt angry/judgmental | ✓ Good |
| Front/Back as rotation | Should feel like turning an object, not switching tools | ✓ Good |
| oklch() color space | Perceptually uniform gradients across browsers | ✓ Good |
| embla-carousel-react | Better iOS Safari compatibility than custom touch handling | ✓ Good |
| 4 default muscle groups | PPL split with distributed arms (Push/Pull) | ✓ Good |
| Floating modal over blocking | Allows clicking other muscles while modal open | ✓ Good |
| Bilateral highlighting | User expectation when tapping one side of body | ✓ Good |
| @dnd-kit for drag-drop | Nested contexts for group and muscle sorting | ✓ Good |

---

*Last updated: 2026-01-24 after v1.0 milestone*
