# Phase 3: Heatmap Core - Research

**Researched:** 2026-01-19
**Domain:** Body diagram visualization, SVG heatmaps, volume-to-color mapping
**Confidence:** HIGH

## Summary

This phase implements the core heatmap visualization where the body diagram fills the screen and displays training distribution through color. The codebase already has substantial infrastructure in place from Phase 2 (color-scale.ts) and Phase 1 (MobileHeatmap shell, device detection).

The primary work is refactoring the existing MuscleHeatmap component to remove floating muscle cards for a cleaner "color-only" visualization that meets HEAT-01. The react-body-highlighter library (v2.0.5) is already integrated and provides the SVG body model. The centralized color-scale.ts from Phase 2 provides the volume-to-color mapping using oklch() for perceptually uniform gradients.

**Primary recommendation:** Modify MuscleHeatmap.tsx to render a simplified full-screen body view without floating labels/cards, using the existing color-scale.ts integration. Then update MobileHeatmap.tsx to provide an equivalent mobile-optimized view.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library                | Version | Purpose                            | Why Standard                                      |
| ---------------------- | ------- | ---------------------------------- | ------------------------------------------------- |
| react-body-highlighter | 2.0.5   | SVG body model with muscle regions | Already in use, provides anterior/posterior views |
| @core/color-scale      | -       | Volume-to-color mapping            | Phase 2 established centralized color utility     |
| Tailwind CSS 4         | 4.1.18  | Layout and responsive design       | Already configured with @theme tokens             |

### Supporting

| Library                  | Version | Purpose                  | When to Use                   |
| ------------------------ | ------- | ------------------------ | ----------------------------- |
| @db/hooks/useVolumeStats | -       | Fetch muscle volume data | For percentage calculations   |
| CSS oklch()              | Native  | Color definitions        | For all volume-based coloring |

### Alternatives Considered

| Instead of             | Could Use                      | Tradeoff                                                                     |
| ---------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| react-body-highlighter | Custom SVG anatomy             | Custom gives more control but significantly more work; library is sufficient |
| Frequency-based colors | Direct percentage colors       | Library uses frequency (0-5); must map percentages to frequency levels       |
| Split view (current)   | Single body, toggle front/back | Split view already works; users see both at once                             |

**Installation:**
No new packages required. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── core/
│   └── color-scale.ts              # Already exists - volume-to-color mapping (VIS-01)
├── ui/
│   └── components/
│       ├── MuscleHeatmap.tsx       # MODIFY - simplified view without floating cards
│       ├── mobile/
│       │   └── MobileHeatmap.tsx   # MODIFY - implement mobile-specific visualization
│       └── anatomy/
│           ├── BodyHighlighter.tsx # May need cleanup (older wrapper)
│           ├── MaleAnatomySVG.tsx  # Custom SVG (not currently used with react-body-highlighter)
│           └── FemaleAnatomySVG.tsx# Custom SVG (not currently used)
```

### Pattern 1: Simplified Heatmap Without Labels (HEAT-01)

**What:** Remove floating MuscleCards and leader lines for a clean body-fills-screen visualization
**When to use:** When implementing the core heatmap view that emphasizes color over numbers
**Example:**

```typescript
// Source: Existing MuscleHeatmap.tsx refactored
// Remove SplitView with MuscleCards, keep only the body highlighters

function SimplifiedHeatmap({ profileId, daysBack = 7 }: Props): React.ReactElement {
  const { stats } = useScientificMuscleVolume(profileId, daysBack);

  // Calculate region stats (aggregate scientific muscles to body regions)
  const regionStats = useMemo(() => calculateRegionStats(stats), [stats]);

  // Map percentage to frequency for library
  const exerciseData = useMemo(() => buildExerciseData(regionStats), [regionStats]);

  // Color array using centralized color-scale
  const highlightedColors = useMemo(() => [
    getVolumeColor(12.5),  // frequency 1: 0-25%
    getVolumeColor(37.5),  // frequency 2: 25-50%
    getVolumeColor(62.5),  // frequency 3: 50-75%
    getVolumeColor(87.5),  // frequency 4: 75-100%
    getVolumeColor(100),   // frequency 5: 100%+
  ], []);

  return (
    <div className="flex justify-center gap-0">
      {/* Front half */}
      <div className="flex-1 max-w-xs">
        <Model type="anterior" data={exerciseData.front} highlightedColors={highlightedColors} />
      </div>
      {/* Back half */}
      <div className="flex-1 max-w-xs">
        <Model type="posterior" data={exerciseData.back} highlightedColors={highlightedColors} />
      </div>
    </div>
  );
}
```

### Pattern 2: Full-Screen Body Layout

**What:** Body diagram uses available viewport space without being cramped by other elements
**When to use:** For the main heatmap view that users glance at for quick volume feedback
**Example:**

```typescript
// Container sizing to fill available space
<div className="relative w-full min-h-[500px] md:min-h-[600px] flex items-center justify-center">
  <Model
    style={{
      width: '100%',
      maxWidth: '20rem',  // Prevent oversizing on large screens
    }}
    svgStyle={{
      filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.1))', // Orange glow
    }}
  />
</div>
```

### Pattern 3: Color Scale Integration (Existing from Phase 2)

**What:** Use centralized getVolumeColor() for all muscle coloring
**When to use:** Everywhere a muscle needs a color based on volume percentage
**Example:**

```typescript
// From @core/color-scale (already implemented in Phase 2)
import { getVolumeColor, getNoTargetColor } from '@core/color-scale';

// Purple (0%) -> Blue (25%) -> Teal (50%) -> Green (100%) -> Yellow (110%) -> Red (150%)
const color = getVolumeColor(percentage);
const noTargetColor = getNoTargetColor(); // Distinct gray for muscles without goals
```

### Anti-Patterns to Avoid

- **Floating labels on mobile:** Mobile screens are too small for overlapping cards with leader lines
- **Inline color calculations:** Use getVolumeColor() from @core/color-scale, not local logic
- **Separate front/back toggles:** Current split view shows both simultaneously - do not add toggle buttons
- **Tablet as mobile:** Tablets get desktop view per ARCH decision (useIsMobileDevice excludes tablets)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                 | Don't Build           | Use Instead                     | Why                                                         |
| ----------------------- | --------------------- | ------------------------------- | ----------------------------------------------------------- |
| Body SVG model          | Custom SVG paths      | react-body-highlighter          | Library handles muscle polygons, click detection, views     |
| Volume-to-color         | Local color functions | @core/color-scale.ts            | Phase 2 established centralized, tested color utility       |
| Muscle aggregation      | Manual grouping       | Existing REGION_TO_MUSCLES maps | Already defined in MuscleHeatmap.tsx                        |
| Percentage-to-frequency | New function          | getFrequencyLevel()             | Already exists in BodyHighlighter.tsx and MuscleHeatmap.tsx |

**Key insight:** The codebase has most infrastructure already. This phase is primarily about simplification (removing UI elements) rather than building new features.

## Common Pitfalls

### Pitfall 1: react-body-highlighter Frequency Mapping

**What goes wrong:** Color array index doesn't match expected frequency
**Why it happens:** Library uses `highlightedColors[frequency-1]` where frequency 1-5, but array is 0-indexed
**How to avoid:** Provide exactly 5 colors in highlightedColors array, mapped to midpoints of each range
**Warning signs:** Colors don't match expected percentage ranges

### Pitfall 2: Split View Overflow

**What goes wrong:** Body halves get cut off or don't center properly
**Why it happens:** Clipping each body to show only left/right half requires careful overflow handling
**How to avoid:** Use `overflow-hidden` on containers, position inner body with negative offset
**Warning signs:** Bodies shifted incorrectly, parts cut off unexpectedly

### Pitfall 3: Mobile Screen Real Estate

**What goes wrong:** Body diagram too small to be useful on mobile
**Why it happens:** Trying to fit desktop layout into mobile viewport
**How to avoid:** Design mobile-specific layout, possibly stacked front/back or single scrollable view
**Warning signs:** Muscles too small to distinguish, touch targets too small

### Pitfall 4: Color Gradient Not Smooth Across Muscles

**What goes wrong:** Adjacent muscles with similar percentages look very different
**Why it happens:** Frequency bucketing creates discrete jumps (0-25, 25-50, etc.)
**How to avoid:** This is a library limitation; each bucket uses one color. Document that smooth continuous gradients aren't possible with react-body-highlighter
**Warning signs:** 24% and 26% look drastically different (different buckets)

### Pitfall 5: No Visual Feedback for No-Goal Muscles

**What goes wrong:** Muscles without goals look identical to muscles with 0 volume
**Why it happens:** Both default to `bodyColor`
**How to avoid:** Use getNoTargetColor() from color-scale.ts for muscles where goal === 0
**Warning signs:** Users can't distinguish "no target" from "no progress"

## Code Examples

Verified patterns from the existing codebase:

### Frequency Level Calculation

```typescript
// Source: src/ui/components/MuscleHeatmap.tsx (lines 169-176)
function getFrequencyLevel(percentage: number): number {
  if (percentage === 0) return 0;
  if (percentage < 25) return 1;
  if (percentage < 50) return 2;
  if (percentage < 75) return 3;
  if (percentage < 100) return 4;
  return 5;
}
```

### Region-to-Muscle Mapping

```typescript
// Source: src/ui/components/MuscleHeatmap.tsx (lines 40-55)
const REGION_TO_MUSCLES: Record<BodyRegion, ScientificMuscle[]> = {
  chest: ['Pectoralis Major (Sternal)', 'Pectoralis Major (Clavicular)'],
  shoulders: ['Anterior Deltoid', 'Lateral Deltoid', 'Posterior Deltoid'],
  upperBack: ['Latissimus Dorsi', 'Middle Trapezius', 'Upper Trapezius'],
  lowerBack: ['Lower Trapezius', 'Erector Spinae'],
  biceps: ['Biceps Brachii'],
  triceps: ['Triceps (Lateral/Medial)', 'Triceps (Long Head)'],
  forearms: ['Forearm Flexors', 'Forearm Extensors'],
  abs: ['Rectus Abdominis', 'Hip Flexors'],
  obliques: ['Obliques'],
  quads: ['Quadriceps (Vasti)', 'Quadriceps (RF)'],
  hamstrings: ['Hamstrings'],
  glutes: ['Gluteus Maximus', 'Gluteus Medius'],
  calves: ['Gastrocnemius', 'Soleus'],
  adductors: ['Adductors'],
};
```

### react-body-highlighter Integration

```typescript
// Source: src/ui/components/MuscleHeatmap.tsx (lines 606-622)
<Model
  type={type}
  data={exerciseData}
  highlightedColors={highlightedColors}
  bodyColor={getNoTargetColor()}
  onClick={handleMuscleClick}
  style={{
    width: '100%',
    maxWidth: '20rem',
  }}
  svgStyle={{
    filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.1))',
  }}
/>
```

### Library Muscle Slugs

```typescript
// Source: react-body-highlighter documentation and src/ui/components/MuscleHeatmap.tsx
const REGION_TO_LIBRARY_MUSCLES: Record<BodyRegion, { front: string[]; back: string[] }> = {
  chest: { front: ['chest'], back: [] },
  shoulders: { front: ['front-deltoids'], back: ['back-deltoids'] },
  upperBack: { front: [], back: ['trapezius', 'upper-back'] },
  lowerBack: { front: [], back: ['lower-back'] },
  biceps: { front: ['biceps'], back: [] },
  triceps: { front: [], back: ['triceps'] },
  forearms: { front: ['forearm'], back: ['forearm'] },
  abs: { front: ['abs'], back: [] },
  obliques: { front: ['obliques'], back: [] },
  quads: { front: ['quadriceps'], back: [] },
  hamstrings: { front: [], back: ['hamstring'] },
  glutes: { front: [], back: ['gluteal'] },
  calves: { front: [], back: ['calves'] },
  adductors: { front: ['adductor'], back: [] },
};
```

## State of the Art

| Old Approach               | Current Approach           | When Changed        | Impact                       |
| -------------------------- | -------------------------- | ------------------- | ---------------------------- |
| Floating labels everywhere | Color-as-primary-signal    | This phase          | Cleaner glanceable UI        |
| Toggle front/back          | Split view simultaneous    | Already implemented | Users see full body at once  |
| Scattered color logic      | Centralized color-scale.ts | Phase 2             | Consistent colors everywhere |

**Deprecated/outdated:**

- Inline `getHeatColor()` functions: Replaced by `@core/color-scale.ts` in Phase 2
- RGB color values: Replaced by oklch() for perceptual uniformity

## Open Questions

Things that couldn't be fully resolved:

1. **Mobile layout: stacked vs side-by-side**
   - What we know: Desktop uses split view (front half + back half side by side)
   - What's unclear: Best mobile layout - same split, stacked vertically, or swipe between?
   - Recommendation: Try split view first (scaled down), fallback to stacked if too small

2. **Muscle click interaction for simplified view**
   - What we know: Current MuscleHeatmap has click handlers that toggle muscle cards
   - What's unclear: Without cards, what should clicking a muscle do?
   - Recommendation: For Phase 3, clicking can be no-op or show a tooltip; defer detailed interaction

3. **Color legend/key**
   - What we know: Users should understand what purple vs green means
   - What's unclear: Where to place a color legend without cluttering the view
   - Recommendation: Add compact legend below body or in a collapsible section

## Requirements Mapping

| Requirement                                         | Implementation Approach                                               |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| HEAT-01: Body fills screen without floating labels  | Remove MuscleCards and leader lines from MuscleHeatmap.tsx            |
| HEAT-02: Each region displays color based on volume | Already working via react-body-highlighter + getVolumeColor           |
| HEAT-03: Color scale uses warm progression          | Implemented in color-scale.ts: purple->blue->teal->green->yellow->red |

## Sources

### Primary (HIGH confidence)

- Existing codebase: `src/ui/components/MuscleHeatmap.tsx` - current implementation
- Existing codebase: `src/core/color-scale.ts` - Phase 2 color utility
- react-body-highlighter GitHub: https://github.com/giavinh79/react-body-highlighter

### Secondary (MEDIUM confidence)

- Phase 2 Research: `.planning/phases/02-visual-system/02-RESEARCH.md`
- STATE.md decisions and patterns

### Tertiary (LOW confidence)

- None - this phase builds on verified existing infrastructure

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries already in use and verified
- Architecture: HIGH - Follows established codebase patterns
- Pitfalls: MEDIUM - Based on codebase analysis and library documentation
- Mobile layout: MEDIUM - Will need visual iteration

**Research date:** 2026-01-19
**Valid until:** 30 days (implementation-focused, codebase may evolve)
