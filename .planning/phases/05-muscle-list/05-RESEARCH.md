# Phase 5: Muscle List - Research

**Researched:** 2026-01-22
**Domain:** React collapsible list components, progress bars, muscle grouping
**Confidence:** HIGH

## Summary

Phase 5 implements a grouped muscle list with collapsible sections and progress bars. The research reveals this phase can leverage extensive existing patterns in the codebase:

1. **Collapsible groups**: WeeklyGoalEditor and MuscleValueEditor already implement the exact expand/collapse pattern needed - using `useState<Set<string>>` for expanded state, chevron rotation animation, and clean header/content separation
2. **Data hooks**: `useScientificMuscleVolume` returns exactly the data structure needed (`VolumeStatItem[]` with name, volume, goal, percentage)
3. **Color scale**: `getVolumeColor()` from `@core/color-scale` provides the oklch() colors for dynamic progress bar fills
4. **Muscle groupings**: `UI_MUSCLE_GROUPS` from `@core/taxonomy` provides the canonical grouping structure

The main implementation work is creating a mobile-optimized list component that combines these existing patterns with horizontal progress bars.

**Primary recommendation:** Create a single `MobileMuscleList.tsx` component that follows the established WeeklyGoalEditor collapsible pattern, using `useScientificMuscleVolume` for data and `getVolumeColor` for progress bar fills.

## Standard Stack

This phase uses only existing project dependencies - no new packages needed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | Component framework | Project standard |
| TanStack Query | (via hooks) | Data fetching/caching | Already used in all data components |
| Tailwind CSS | 4 | Styling with design tokens | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @core/color-scale | local | Volume-to-color mapping | Progress bar fill colors |
| @core/taxonomy | local | Muscle groupings | UI_MUSCLE_GROUPS for section structure |
| @db/hooks | local | Volume statistics | useScientificMuscleVolume for data |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom collapsible | Headless UI Disclosure | Overkill - existing pattern sufficient |
| Native progress element | Div-based bar | Native requires complex cross-browser styling |
| Accordion library | useState pattern | Already implemented in codebase |

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/ui/components/mobile/
├── MobileHeatmap.tsx        # Existing - body visualization
└── MobileMuscleList.tsx     # NEW - grouped list with progress bars
```

### Pattern 1: Collapsible Group State

**What:** Use `useState<Set<string>>` to track which groups are expanded
**When to use:** Any multi-section collapsible UI
**Example:**
```typescript
// Source: src/ui/components/WeeklyGoalEditor.tsx (lines 25-38)
const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
  new Set(UI_MUSCLE_GROUPS.map((g) => g.name)) // All expanded by default
);

const toggleGroup = (groupName: string): void => {
  const newExpanded = new Set(expandedGroups);
  if (newExpanded.has(groupName)) {
    newExpanded.delete(groupName);
  } else {
    newExpanded.add(groupName);
  }
  setExpandedGroups(newExpanded);
};
```

### Pattern 2: Dynamic oklch Progress Bar

**What:** Use inline style with getVolumeColor() for progress bar fill
**When to use:** Any progress indicator tied to volume percentage
**Example:**
```typescript
// Combining TotalVolumeCard pattern with color-scale
import { getVolumeColor } from '@core/color-scale';

// Progress bar with dynamic color
<div className="h-2 overflow-hidden rounded-full bg-primary-800">
  <div
    className="h-full rounded-full transition-all duration-300"
    style={{
      width: `${Math.min(percentage, 100)}%`,
      backgroundColor: getVolumeColor(percentage),
    }}
  />
</div>
```

### Pattern 3: Mobile Component Isolation

**What:** Mobile components in dedicated directory, import shared hooks
**When to use:** All mobile-specific UI components
**Example:**
```typescript
// Source: ARCH-01, ARCH-02 patterns from STATE.md
// Mobile component imports from shared hooks
import { useScientificMuscleVolume } from '@db/hooks';
import type { ScientificMuscle } from '@core/taxonomy';
import { getVolumeColor } from '@core/color-scale';
```

### Anti-Patterns to Avoid
- **Duplicating data logic in components:** Use existing hooks from @db/hooks
- **Hardcoding colors:** Always use getVolumeColor() from color-scale.ts
- **Creating new muscle groupings:** Use UI_MUSCLE_GROUPS from taxonomy.ts
- **Hover states for mobile:** Use :active pseudo-class per MOBILE-02

## Don't Hand-Roll

Problems that have existing solutions in this codebase:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expanded/collapsed state | Custom reducer | useState<Set<string>> | Pattern in WeeklyGoalEditor works perfectly |
| Muscle grouping structure | New grouping object | UI_MUSCLE_GROUPS | Single source of truth in taxonomy.ts |
| Volume statistics | Calculate in component | useScientificMuscleVolume | Hook handles all data fetching and calculation |
| Progress bar colors | Color logic in component | getVolumeColor() | Centralized, perceptually uniform |
| Loading/error states | Custom loading UI | Pattern from MobileHeatmap | Consistent with existing mobile component |

**Key insight:** This phase is primarily about composition, not creation. All building blocks exist.

## Common Pitfalls

### Pitfall 1: Incorrect Muscle Grouping for Requirements

**What goes wrong:** Using UI_MUSCLE_GROUPS directly gives 7 groups (Back, Chest, Shoulders, Arms, Legs, Core, Forearms) but LIST-01 specifies 6 groups (Shoulders, Chest, Back, Arms, Core, Legs)
**Why it happens:** Requirements and existing data structure don't match exactly
**How to avoid:** Need to decide: either (a) use existing 7 groups and update requirements, or (b) create mobile-specific grouping that merges Forearms into Arms
**Warning signs:** Rendered UI doesn't match requirements document

**Recommendation:** Use existing UI_MUSCLE_GROUPS (7 groups). The Forearms separation is anatomically correct and consistent with WeeklyGoalEditor. Update requirements to reflect actual grouping.

### Pitfall 2: Progress Bar Scale Mismatch

**What goes wrong:** LIST-03 specifies "0-20 sets scale" but actual goals vary per muscle
**Why it happens:** The 20-set scale is illustrative; real scale should be 0% to 100% of goal
**How to avoid:** Use percentage-based scaling (0-100%) where width matches stat.percentage clamped to 100
**Warning signs:** Progress bars overflow or don't fill at goal

### Pitfall 3: Missing Touch Feedback

**What goes wrong:** Headers feel unresponsive on mobile
**Why it happens:** Using hover states instead of active states
**How to avoid:** Follow MOBILE-02 pattern - use :active pseudo-class for touch feedback
**Warning signs:** No visual feedback when tapping group headers

### Pitfall 4: Numeric Display Formatting

**What goes wrong:** Showing "4.5 sets" when volume is fractional
**Why it happens:** Fractional volume from multi-muscle exercises
**How to avoid:** Use formatting pattern from existing components: `volume % 1 === 0 ? volume.toString() : volume.toFixed(1)`
**Warning signs:** Excessive decimal places or unexpected fractional values

## Code Examples

Verified patterns from the existing codebase:

### Group Header Button (from WeeklyGoalEditor)
```typescript
// Source: src/ui/components/WeeklyGoalEditor.tsx (lines 122-151)
<button
  onClick={() => toggleGroup(group.name)}
  className="w-full flex items-center justify-between p-3 bg-primary-800 hover:bg-primary-750 transition-colors"
>
  <div className="flex items-center gap-3">
    <svg
      className={`w-4 h-4 text-primary-400 transition-transform ${
        isExpanded ? 'rotate-90' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
    <span className="font-medium text-white">{group.name}</span>
  </div>
  {/* Group summary on right */}
</button>
```

### Progress Bar Container (from TotalVolumeCard)
```typescript
// Source: src/ui/components/TotalVolumeCard.tsx (lines 38-44)
<div className="mb-2 h-3 overflow-hidden rounded-full bg-primary-800">
  <div
    className={`h-full rounded-full transition-all duration-500`}
    style={{ width: `${percentage}%` }}
  />
</div>
```

### Volume Data Hook Usage (from MobileHeatmap)
```typescript
// Source: src/ui/components/mobile/MobileHeatmap.tsx (lines 106-111)
const { stats, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);

// Stats structure: VolumeStatItem[]
// Each item: { name: string, volume: number, goal: number, percentage: number }
```

### Scoped Mobile Touch Styles (from MobileHeatmap)
```typescript
// Source: src/ui/components/mobile/MobileHeatmap.tsx (lines 323-344)
// Use :active for touch feedback, @media (hover: hover) for mouse devices
<style>{`
  .group-header:active {
    background-color: rgb(39, 39, 42); /* primary-600 */
  }

  @media (hover: hover) {
    .group-header:hover {
      background-color: rgb(63, 63, 70); /* primary-500 */
    }
  }
`}</style>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| RGB colors | oklch() colors | Tailwind v4 (2024) | Better perceptual uniformity |
| Native progress element | Div-based bars | Common practice | Better cross-browser styling |
| Third-party accordion | useState pattern | Project convention | Simpler, no dependencies |

**Deprecated/outdated:**
- None for this phase - all patterns are current

## Open Questions

Things that couldn't be fully resolved:

1. **Muscle group count discrepancy**
   - What we know: UI_MUSCLE_GROUPS has 7 groups; LIST-01 specifies 6 groups
   - What's unclear: Whether to follow existing code or requirements
   - Recommendation: Follow existing UI_MUSCLE_GROUPS (7 groups) for consistency with WeeklyGoalEditor and anatomical correctness

2. **Progress bar scale interpretation**
   - What we know: LIST-03 says "0-20 sets scale"
   - What's unclear: Whether this is a fixed scale or illustrative
   - Recommendation: Use percentage-based (0-100% of goal) which is dynamic per muscle

3. **Initial expanded state**
   - What we know: WeeklyGoalEditor starts all groups expanded
   - What's unclear: Whether muscle list should start expanded or collapsed
   - Recommendation: Start collapsed for mobile (less scrolling), except first group

## Sources

### Primary (HIGH confidence)
- `src/ui/components/WeeklyGoalEditor.tsx` - Collapsible group pattern
- `src/ui/components/exercise-mapping/MuscleValueEditor.tsx` - Alternative collapsible pattern
- `src/ui/components/TotalVolumeCard.tsx` - Progress bar pattern
- `src/ui/components/mobile/MobileHeatmap.tsx` - Mobile component patterns
- `src/core/taxonomy.ts` - UI_MUSCLE_GROUPS structure
- `src/core/color-scale.ts` - getVolumeColor() function
- `src/db/hooks/useVolumeStats.ts` - useScientificMuscleVolume hook

### Secondary (MEDIUM confidence)
- [Material UI Accordion](https://mui.com/material-ui/react-accordion/) - Accessibility best practices
- [Base UI Accordion](https://base-ui.com/react/components/accordion) - Multiple panel patterns
- [Tailwind CSS Progress Bar](https://flowbite.com/docs/components/progress/) - Progress bar styling patterns
- [OKLCH for Tailwind v4](https://kyrylo.org/css/2025/02/09/oklch-css-variables-for-tailwind-v4-colors.html) - Color space usage

### Tertiary (LOW confidence)
- None - all findings verified with codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project
- Architecture: HIGH - Patterns copied from existing components
- Pitfalls: HIGH - Derived from requirements analysis and codebase review

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (stable patterns, low change risk)
