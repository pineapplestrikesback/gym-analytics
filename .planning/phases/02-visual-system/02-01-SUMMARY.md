---
phase: 02-visual-system
plan: 01
title: Color Scale Foundation
subsystem: visual-system

tags: [color-scale, oklch, design-tokens, dark-theme]

dependency-graph:
  requires: []
  provides: [getVolumeColor, getVolumeOpacity, getNoTargetColor, CSS-design-tokens]
  affects: [02-02, heatmap-integration, progress-bars]

tech-stack:
  added: []
  patterns: [oklch-color-space, centralized-color-utility, css-custom-properties]

key-files:
  created:
    - src/core/color-scale.ts
    - src/core/__tests__/color-scale.test.ts
  modified:
    - src/index.css

decisions:
  - id: VIS-COLOR-01
    choice: Use oklch() CSS format for perceptually uniform gradients
    reason: Oklab color space produces smooth, natural-looking color transitions
  - id: VIS-COLOR-02
    choice: Centralized color utility in src/core/ with no React dependencies
    reason: Follows existing codebase architecture for pure business logic
  - id: VIS-COLOR-03
    choice: Purple-to-green-to-red gradient with green at 100% goal
    reason: Universal "success" signal at target achievement with warning for over-training

metrics:
  duration: 4 min
  completed: 2026-01-18
---

# Phase 2 Plan 1: Color Scale Foundation Summary

Centralized color scale utility and CSS design tokens for volume visualization with perceptually uniform Oklab color gradients.

## One-liner

Pure color utility with oklch() Oklab interpolation for volume-to-color mapping (purple 0% -> green 100% -> red 150%) plus dark theme CSS design tokens.

## What Changed

### Created

| File                                     | Purpose                                        | Key Exports                                              |
| ---------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| `src/core/color-scale.ts`                | Pure color utility for volume-to-color mapping | `getVolumeColor`, `getVolumeOpacity`, `getNoTargetColor` |
| `src/core/__tests__/color-scale.test.ts` | Comprehensive unit tests (20 tests)            | Test coverage for all color functions                    |

### Modified

| File            | Changes                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| `src/index.css` | Added surface hierarchy, text hierarchy, and semantic status color tokens using oklch() |

## Technical Decisions

### Color Scale Design

The color gradient progresses through these stops:

| Percentage | Color        | oklch Values           | Meaning             |
| ---------- | ------------ | ---------------------- | ------------------- |
| 0%         | Purple       | `oklch(0.45 0.12 290)` | Cold, low volume    |
| 25%        | Blue         | `oklch(0.55 0.15 250)` | Early progress      |
| 50%        | Teal         | `oklch(0.60 0.14 200)` | Halfway to goal     |
| 75%        | Yellow-green | `oklch(0.65 0.16 160)` | Approaching goal    |
| 100%       | Green        | `oklch(0.72 0.19 142)` | Goal achieved       |
| 110%       | Yellow       | `oklch(0.75 0.18 85)`  | Slight over-target  |
| 150%       | Red          | `oklch(0.55 0.22 29)`  | Warning (caps here) |

### CSS Design Tokens

Added semantic tokens following Tailwind 4 @theme pattern:

```css
/* Surface hierarchy */
--color-surface-base: oklch(0.13 0.01 270); /* Page background */
--color-surface-raised: oklch(0.16 0.01 270); /* Cards, panels */
--color-surface-overlay: oklch(0.2 0.01 270); /* Modals */

/* Text hierarchy */
--color-text-primary: oklch(0.95 0 0); /* Main text */
--color-text-secondary: oklch(0.75 0 0); /* Supporting text */
--color-text-muted: oklch(0.55 0 0); /* Disabled/dimmed */

/* Status colors (aligned with color-scale.ts) */
--color-status-success: oklch(0.72 0.19 142); /* Green - goal met */
--color-status-warning: oklch(0.75 0.18 85); /* Yellow - over target */
--color-status-danger: oklch(0.55 0.22 29); /* Red - significantly over */
```

### Opacity Function

Volume opacity scales linearly from 0.4 (at 0%) to 1.0 (at 100%+), making low-volume muscles visually recede while high-volume muscles draw attention.

### No-Target Distinction

`getNoTargetColor()` returns `oklch(0.35 0.02 270)` - a distinct gray with minimal chroma, differentiating "no target set" from "has target but 0% progress" (which is purple with higher chroma).

## Verification Results

- All 126 unit tests pass (20 new color-scale tests)
- Production build succeeds
- TypeScript strict mode compliant

## Integration Points

This color utility is designed to replace scattered inline color logic throughout the codebase:

```typescript
// Usage in components
import { getVolumeColor, getVolumeOpacity, getNoTargetColor } from '@core/color-scale';

const color = goal > 0 ? getVolumeColor(percentage) : getNoTargetColor();
const opacity = getVolumeOpacity(percentage);
```

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 02-02:** Heatmap SVG Integration

The color utility exports are ready for immediate consumption by:

- MuscleHeatmap.tsx (replace `getHeatColor()` function)
- BodyHighlighter.tsx (replace `getFrequencyLevel()` mapping)
- Future progress bar components

No blockers identified.
