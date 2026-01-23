# Mobile Muscle Heatmap Refactor

## What This Is

A mobile UI refactor for the muscle heatmap component in ScientificMuscle. The current UI shows everything at once with floating label boxes, creating visual noise and cognitive overload. This refactor moves from label-driven to pattern-driven design — the body becomes a readable heatmap, with numbers relegated to a secondary panel.

## Core Value

The body itself must carry the primary signal. Users should see training distribution at a glance without reading numbers.

## Requirements

### Validated

- ✓ Weekly volume tracking per muscle — existing
- ✓ Front/back anatomical views — existing
- ✓ 26-muscle granularity with fractional contributions — existing
- ✓ Per-muscle target goals (0-20 sets) — existing

### Active

- [ ] Body heatmap as primary visualization (no floating labels)
- [ ] Two-slide horizontal carousel (Instagram-style swipe)
- [ ] Slide 1: Body heatmap with color-based volume indication
- [ ] Slide 2: Muscle list grouped by region with progress bars
- [ ] Tap-to-reveal detail pop-up for individual muscles
- [ ] Front/Back toggle feels like rotation, not mode switch
- [ ] Color semantics fixed (red = warnings/overtraining only)
- [ ] Component isolation from future desktop implementation

### Out of Scope

- Desktop layout — separate milestone, different design
- Advanced analytics on this screen — belongs elsewhere
- Recommendations or coaching text — not this screen's job
- Week-vs-week comparisons — future feature
- Symmetry warnings — future feature
- Data model changes — presentation only, model stays

## Context

The existing MuscleHeatmap component works but has misaligned information architecture:

- Floating red boxes dominate the screen and feel detached from anatomy
- Red used as neutral color (conventionally signals error/danger)
- Too many labels = cognitive overload
- Body diagram is visually interrupted, not the star
- Users read boxes instead of reading the body

The refactor preserves the solid data model while changing visual hierarchy:

- **Primary layer:** Body as heatmap (pattern recognition)
- **Secondary layer:** Side panel with grouped muscles + progress bars
- **Tertiary layer:** Pop-up detail cards on interaction

Mobile layout: Two-slide carousel + modal overlay for detail.

### Muscle Grouping Structure

Groups are visual/navigational, not analytical. Individual muscles stay distinct:

- **Shoulders:** Ant Delt, Lat Delt, Post Delt
- **Chest:** Pec (Clavicular), Pec (Sternal)
- **Back:** Upper Trap, Mid Trap, Low Trap, Lats, Erectors
- **Arms:** Biceps, Triceps (Long/Lat-Med), Forearms (Flex/Ext)
- **Core:** Abs, Obliques
- **Legs:** Quads (RF/Vasti), Hamstrings, Adductors, Glutes (Max/Med), Calves (Gastroc/Soleus)

## Constraints

- **Data model:** Preserve existing — no changes to taxonomy, volume calculation, or DB schema
- **Mobile-first:** This milestone is mobile-only; desktop handled separately
- **Component isolation:** Clear separation so mobile and desktop don't affect each other
- **Tech stack:** React, Tailwind, existing anatomy SVGs in `src/ui/components/anatomy/`

## Key Decisions

| Decision                      | Rationale                                               | Outcome   |
| ----------------------------- | ------------------------------------------------------- | --------- |
| Two-slide carousel for mobile | Instagram-familiar pattern, separates glance vs detail  | — Pending |
| Pop-up for muscle detail      | Avoids third slide, respects progressive disclosure     | — Pending |
| Groups are visual only        | Keeps data granularity, reduces cognitive load          | — Pending |
| Red reserved for warnings     | Current red-as-neutral feels angry/judgmental           | — Pending |
| Front/Back as rotation        | Should feel like turning an object, not switching tools | — Pending |

---

_Last updated: 2026-01-18 after initialization_
