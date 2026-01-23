# Phase 2: Visual System - Research

**Researched:** 2026-01-18
**Domain:** Color semantics, design tokens, dark theme visual system
**Confidence:** HIGH

## Summary

This research investigates how to implement a comprehensive color system for the GymAnalytics heatmap visualization. The codebase already has basic color infrastructure with Tailwind CSS 4's `@theme` directive and CSS custom properties, but color handling for the heatmap is currently scattered across multiple components with inline RGB values and inconsistent color logic.

The recommended approach is to create a centralized color utility module in `src/core/` that provides pure functions for percentage-to-color mapping using the Oklab color space for perceptually uniform gradients. This will be combined with Tailwind 4's CSS custom properties system for semantic color tokens.

**Primary recommendation:** Create `src/core/color-scale.ts` with a single `getVolumeColor(percentage: number): string` function that implements the purple-to-green-to-red gradient using Oklab interpolation, then refactor all existing color usage to call this centralized function.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library            | Version     | Purpose                                         | Why Standard                                                |
| ------------------ | ----------- | ----------------------------------------------- | ----------------------------------------------------------- |
| Native CSS oklch() | CSS Level 4 | Color definitions in perceptually uniform space | Browser-native, no JS dependency, produces smooth gradients |
| Tailwind CSS 4     | 4.1.18      | Design tokens via @theme directive              | Already in use, CSS-first config                            |

### Supporting

| Library   | Version | Purpose                             | When to Use                                     |
| --------- | ------- | ----------------------------------- | ----------------------------------------------- |
| chroma.js | 3.x     | JS color manipulation/interpolation | Only if browser oklch() support is insufficient |

### Alternatives Considered

| Instead of               | Could Use                   | Tradeoff                                                                      |
| ------------------------ | --------------------------- | ----------------------------------------------------------------------------- |
| Pure JS Oklab            | chroma.js                   | chroma.js adds 13.5kB; pure JS is zero-dependency but more code               |
| CSS oklch()              | HSL interpolation           | HSL produces inconsistent perceived brightness; oklch is perceptually uniform |
| Multiple color functions | Single centralized function | Scattered logic is current state; centralized is maintainable                 |

**Installation:**
No new packages required. Using native CSS and existing Tailwind 4.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── core/
│   ├── color-scale.ts          # Pure color utility (NO React)
│   └── __tests__/
│       └── color-scale.test.ts # TDD tests
├── index.css                   # @theme color tokens
└── ui/
    └── components/             # Components consume color-scale.ts
```

### Pattern 1: Pure Color Utility in Core

**What:** All color logic lives in `src/core/color-scale.ts` as pure functions with no React dependencies
**When to use:** Always - this follows the existing codebase architecture where `src/core/` contains pure business logic
**Example:**

```typescript
// src/core/color-scale.ts
// Source: Follows existing src/core/ pattern (e.g., volume-calculator.ts)

/**
 * Volume-to-color mapping using Oklab interpolation
 * Returns CSS oklch() string for perceptually uniform gradients
 */
export function getVolumeColor(percentage: number): string {
  // Clamp to valid range
  const clamped = Math.max(0, Math.min(150, percentage));

  // Define color stops in oklch (L, C, H)
  // 0% = Purple (cool, low volume)
  // 25% = Blue
  // 50% = Teal
  // 75% = Yellow-green
  // 100% = Green (goal achieved)
  // 150% = Red (over-trained)

  if (clamped === 0) {
    // Gray for 0%
    return 'oklch(0.35 0 0)';
  }

  // Interpolate through color stops
  // Implementation details in code
}

/**
 * Get opacity based on volume percentage
 * Higher volume = more opaque
 */
export function getVolumeOpacity(percentage: number): number {
  if (percentage === 0) return 0.3;
  return 0.5 + Math.min(percentage, 100) * 0.005; // 0.5 to 1.0
}
```

### Pattern 2: CSS Design Tokens via @theme

**What:** Semantic color tokens defined in CSS, consumed by Tailwind utilities
**When to use:** For consistent theming across the app (backgrounds, text, borders)
**Example:**

```css
/* src/index.css */
/* Source: Tailwind CSS 4 docs - https://tailwindcss.com/docs/theme */

@theme {
  /* Background hierarchy (dark theme) */
  --color-surface-base: oklch(0.13 0.01 270); /* Darkest - page bg */
  --color-surface-raised: oklch(0.16 0.01 270); /* Cards */
  --color-surface-overlay: oklch(0.2 0.01 270); /* Modals */

  /* Text hierarchy */
  --color-text-primary: oklch(0.95 0 0);
  --color-text-secondary: oklch(0.75 0 0);
  --color-text-muted: oklch(0.55 0 0);

  /* Semantic colors */
  --color-success: oklch(0.72 0.19 142); /* Green - goal met */
  --color-warning: oklch(0.8 0.18 85); /* Yellow - over target */
  --color-danger: oklch(0.63 0.24 29); /* Red - significantly over */

  /* Accent (existing orange, keep for buttons/highlights) */
  --color-accent: oklch(0.7 0.18 45);
}
```

### Pattern 3: Component Color Consumption

**What:** UI components import color functions and apply to SVG/CSS
**When to use:** In heatmap components, progress bars, muscle cards
**Example:**

```typescript
// In MuscleHeatmap.tsx
import { getVolumeColor, getVolumeOpacity } from '@core/color-scale';

function MuscleRegion({ percentage }: { percentage: number }) {
  const color = getVolumeColor(percentage);
  const opacity = getVolumeOpacity(percentage);

  return (
    <path
      fill={color}
      opacity={opacity}
      // ...
    />
  );
}
```

### Anti-Patterns to Avoid

- **Inline color logic:** Don't compute colors inside components (e.g., existing `getHeatColor()` in MuscleHeatmap.tsx)
- **RGB string manipulation:** Don't use `rgb()` format; oklch is more intuitive for gradients
- **Hardcoded hex values:** Don't scatter `#22d3ee` throughout components; use tokens
- **Multiple color functions:** Don't create separate functions per component; one source of truth

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                | Don't Build           | Use Instead                  | Why                                                                      |
| ---------------------- | --------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| Color interpolation    | Manual RGB lerp       | Oklab math or chroma.js      | RGB interpolation produces muddy midtones; Oklab is perceptually uniform |
| Multi-stop gradients   | Manual if/else chains | Domain-mapped scale function | Current codebase has brittle if/else; scale function is cleaner          |
| Color space conversion | Manual HSL↔RGB        | CSS oklch() native           | Browser handles conversion; reduces JS bundle                            |
| Design tokens          | Manual CSS variables  | Tailwind @theme              | @theme generates utility classes automatically                           |

**Key insight:** The existing `getHeatColor()` function uses discrete buckets with RGB values. This produces visible color "jumps" between ranges. A proper interpolation function with Oklab produces smooth, continuous gradients where every percentage has a unique, perceptually distinct shade.

## Common Pitfalls

### Pitfall 1: HSL Interpolation Produces Inconsistent Brightness

**What goes wrong:** Using HSL hue rotation for gradients produces colors that appear to "flash" brighter or darker at certain hues (especially around cyan/yellow)
**Why it happens:** HSL is not perceptually uniform - equal steps in H don't produce equal perceived changes
**How to avoid:** Use Oklab/oklch color space which is designed for perceptual uniformity
**Warning signs:** Green appears brighter than blue at same saturation; yellow "pops" more than other colors

### Pitfall 2: react-body-highlighter Color Array Mismatch

**What goes wrong:** The `highlightedColors` array uses 0-indexed frequency mapping where `array[frequency-1]` = color
**Why it happens:** Frequency starts at 1 but arrays start at 0
**How to avoid:** Ensure color array has entries for all expected frequency levels (0-5 in current code)
**Warning signs:** Off-by-one errors where frequency=1 gets wrong color

### Pitfall 3: SVG Fill vs CSS Background Color Inconsistency

**What goes wrong:** Colors look different on SVG `fill` vs CSS `background-color`
**Why it happens:** SVG rendering can differ; opacity stacking behaves differently
**How to avoid:** Use identical oklch values; test both contexts; be explicit about opacity
**Warning signs:** Heatmap body and progress bars show visually different "greens"

### Pitfall 4: Over-target Colors Lacking Warning Semantics

**What goes wrong:** Users don't perceive >100% as a warning state
**Why it happens:** Smooth gradient continuation doesn't signal "you've crossed a threshold"
**How to avoid:** Make the transition at 100% more pronounced; consider additional visual treatment (glow, intensity)
**Warning signs:** Users don't notice they're significantly over-training a muscle group

### Pitfall 5: Gray for No-Target Muscle Conflicts with 0% Volume

**What goes wrong:** Can't distinguish "no target set" from "has target but 0 volume"
**Why it happens:** Both render as gray
**How to avoid:** Use distinctly different grays or add a pattern/texture for no-target state
**Warning signs:** Users confused about whether a gray muscle has no data or no goal

## Code Examples

Verified patterns from official sources:

### Oklab Color Interpolation in Pure JS

```typescript
// Source: Mathematical Oklab spec - https://bottosson.github.io/posts/oklab/

interface OklabColor {
  L: number; // Lightness 0-1
  a: number; // Green-red axis
  b: number; // Blue-yellow axis
}

function lerpOklab(color1: OklabColor, color2: OklabColor, t: number): OklabColor {
  return {
    L: color1.L + (color2.L - color1.L) * t,
    a: color1.a + (color2.a - color1.a) * t,
    b: color1.b + (color2.b - color1.b) * t,
  };
}

function oklabToCss(color: OklabColor): string {
  return `oklab(${color.L} ${color.a} ${color.b})`;
}
```

### Multi-Stop Color Scale

```typescript
// Source: chroma.js pattern - https://gka.github.io/chroma.js/

interface ColorStop {
  position: number; // 0-1 or 0-150 for percentage
  color: OklabColor;
}

function getColorAtPosition(stops: ColorStop[], position: number): OklabColor {
  // Find surrounding stops
  const sorted = stops.sort((a, b) => a.position - b.position);

  // Clamp to range
  if (position <= sorted[0].position) return sorted[0].color;
  if (position >= sorted[sorted.length - 1].position) return sorted[sorted.length - 1].color;

  // Find interpolation segment
  for (let i = 0; i < sorted.length - 1; i++) {
    if (position >= sorted[i].position && position <= sorted[i + 1].position) {
      const t = (position - sorted[i].position) / (sorted[i + 1].position - sorted[i].position);
      return lerpOklab(sorted[i].color, sorted[i + 1].color, t);
    }
  }

  return sorted[sorted.length - 1].color;
}
```

### Tailwind 4 @theme Design Tokens

```css
/* Source: Tailwind CSS 4 docs - https://tailwindcss.com/docs/theme */

@import 'tailwindcss';

@theme {
  /* Remove default primary if replacing */
  --color-primary-*: initial;

  /* Define semantic surface colors */
  --color-surface-100: oklch(0.13 0.01 270);
  --color-surface-200: oklch(0.16 0.01 270);
  --color-surface-300: oklch(0.2 0.01 270);

  /* Volume color tokens for CSS usage */
  --color-volume-zero: oklch(0.35 0.02 270);
  --color-volume-low: oklch(0.55 0.15 290);
  --color-volume-mid: oklch(0.65 0.15 220);
  --color-volume-high: oklch(0.72 0.17 160);
  --color-volume-goal: oklch(0.75 0.19 142);
  --color-volume-over: oklch(0.7 0.22 60);
  --color-volume-warning: oklch(0.63 0.24 29);
}
```

### react-body-highlighter Integration

```typescript
// Source: react-body-highlighter docs - https://github.com/giavinh79/react-body-highlighter

import { getVolumeColor } from '@core/color-scale';

// Generate color array for frequency levels 1-5
const highlightedColors = useMemo(
  () => [
    getVolumeColor(20), // frequency 1: ~20%
    getVolumeColor(40), // frequency 2: ~40%
    getVolumeColor(60), // frequency 3: ~60%
    getVolumeColor(80), // frequency 4: ~80%
    getVolumeColor(100), // frequency 5: 100%+
  ],
  []
);
```

## State of the Art

| Old Approach            | Current Approach         | When Changed              | Impact                         |
| ----------------------- | ------------------------ | ------------------------- | ------------------------------ |
| RGB/HSL colors          | Oklab/oklch color space  | CSS Color Level 4 (2022+) | Perceptually uniform gradients |
| tailwind.config.js      | @theme directive in CSS  | Tailwind CSS 4 (2024)     | CSS-first configuration        |
| Discrete color buckets  | Continuous interpolation | Modern data viz practice  | Smoother gradients             |
| Scattered inline colors | Centralized color tokens | Design systems evolution  | Maintainable theming           |

**Deprecated/outdated:**

- `tailwind.config.js` for colors: Tailwind 4 prefers @theme in CSS
- HSL interpolation: Oklab is now the standard for perceptual uniformity
- RGB hex codes in JS: oklch() is more intuitive for gradients

## Open Questions

Things that couldn't be fully resolved:

1. **Exact color values for the gradient**
   - What we know: Purple→Blue→Teal→Green→Yellow→Red progression at 0/25/50/75/100/150%
   - What's unclear: Exact oklch values that look "right" on dark background
   - Recommendation: Define initial values, iterate visually with real data

2. **No-target vs zero-volume distinction**
   - What we know: Both currently render gray; need differentiation
   - What's unclear: Best visual treatment for "no target set" state
   - Recommendation: Use slightly different gray + optional indicator icon/pattern

3. **Over-target visual treatment beyond color**
   - What we know: Context allows "glow, pulse, border, or just color"
   - What's unclear: Which treatment is most effective without being distracting
   - Recommendation: Start with subtle glow; can add pulse/border in future iteration

## Sources

### Primary (HIGH confidence)

- Tailwind CSS 4 @theme docs - https://tailwindcss.com/docs/theme
- Oklab color space specification - https://bottosson.github.io/posts/oklab/
- MDN oklch() documentation - https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch
- react-body-highlighter GitHub - https://github.com/giavinh79/react-body-highlighter

### Secondary (MEDIUM confidence)

- chroma.js documentation - https://gka.github.io/chroma.js/
- CSS Tricks oklch() guide - https://css-tricks.com/almanac/functions/o/oklch/
- Evil Martians OKLCH article - https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl

### Tertiary (LOW confidence)

- WebSearch results for "dark theme design tokens 2025"

## Codebase Analysis

### Current State

The codebase has multiple instances of color logic that need consolidation:

1. **MuscleHeatmap.tsx (lines 168-175):** `getHeatColor()` uses discrete RGB buckets
2. **MuscleHeatmap.tsx (lines 503-516):** `MuscleCard` has separate percentage→color logic
3. **BodyHighlighter.tsx (lines 114-121):** Duplicate `getFrequencyLevel()` function
4. **MaleAnatomySVG.tsx:** Accepts `getHeatColor` and `getGlowFilter` as props
5. **TotalVolumeCard.tsx (line 34):** Uses `bg-accent-orange` for progress bar
6. **index.css:** Defines basic color tokens but not volume-specific ones

### Existing Tailwind Setup

- Using Tailwind CSS 4 with `@theme` directive in `src/index.css`
- Has primary scale (gray) and accent colors (cyan, orange, red, yellow, blue)
- Current primary colors are zinc-based grays (good for dark theme)
- `tailwind.config.js` exists but should migrate to CSS-only

### Files to Modify

1. `src/core/color-scale.ts` - CREATE new file
2. `src/core/__tests__/color-scale.test.ts` - CREATE tests
3. `src/index.css` - UPDATE with volume color tokens
4. `src/ui/components/MuscleHeatmap.tsx` - REFACTOR to use centralized colors
5. `src/ui/components/anatomy/BodyHighlighter.tsx` - REFACTOR
6. `src/ui/components/TotalVolumeCard.tsx` - REFACTOR progress bar color

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Native CSS oklch() and Tailwind 4 are well-documented
- Architecture: HIGH - Follows existing codebase patterns (core/ for pure logic)
- Pitfalls: MEDIUM - Based on general color theory and codebase analysis
- Color values: LOW - Exact oklch values need visual iteration

**Research date:** 2026-01-18
**Valid until:** 60 days (stable domain, slow-moving CSS standards)
