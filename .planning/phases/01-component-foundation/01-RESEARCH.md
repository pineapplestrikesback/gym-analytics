# Phase 1: Component Foundation - Research

**Researched:** 2026-01-18
**Domain:** Mobile component architecture, data hook sharing, device detection
**Confidence:** HIGH

## Summary

This phase establishes the structural foundation for mobile-specific muscle heatmap components while ensuring data hooks remain shared between mobile and desktop. The existing codebase has a mature pattern for this: `src/db/hooks/` exports volume statistics hooks that both versions can import directly.

The current `MuscleHeatmap.tsx` (661 lines) contains both desktop and mobile logic intertwined via a `useIsMobile()` hook that uses viewport width detection. Phase 1 extracts the mobile path into a dedicated component in `src/ui/components/mobile/` while keeping data consumption identical.

**Primary recommendation:** Create `src/ui/components/mobile/MobileHeatmap.tsx` that imports `useScientificMuscleVolume` from `@db/hooks`, and update Dashboard to explicitly render `MobileHeatmap` or the existing component based on user-agent detection at the page level.

## Existing Implementation

### Current MuscleHeatmap Component

**File:** `/Users/opera_user/repo/GymAnalytics/gym-analytics/src/ui/components/MuscleHeatmap.tsx`

The current implementation (661 lines) handles both desktop and mobile through internal branching:

```typescript
// Current approach - viewport-based detection
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}
```

**Key structures to understand:**

| Structure              | Purpose                                                   | Lines   |
| ---------------------- | --------------------------------------------------------- | ------- |
| `MuscleHeatmap`        | Main component, handles loading/error states              | 221-354 |
| `SplitView`            | Renders front/back body split with cards and leader lines | 367-472 |
| `MuscleCard`           | Floating label card for individual muscles                | 486-549 |
| `SplitBodyHighlighter` | Wraps react-body-highlighter with region coloring         | 559-660 |
| `REGION_TO_MUSCLES`    | Maps body regions to ScientificMuscle types               | 39-54   |
| `CARD_POSITIONS`       | Fixed CSS positions for muscle cards                      | 120-153 |

**Current data flow:**

```
Dashboard
  -> MuscleHeatmap(profileId, daysBack)
     -> useScientificMuscleVolume(profileId, daysBack)
        -> returns { stats, totalVolume, isLoading, error }
           -> stats: VolumeStatItem[] with { name, volume, goal, percentage }
```

### Body Visualization Library

**Library:** `react-body-highlighter` v2.0.5

This third-party library provides SVG body diagrams with muscle region highlighting.

**Usage pattern:**

```typescript
import Model from 'react-body-highlighter';
import type { IExerciseData, IMuscleStats, Muscle } from 'react-body-highlighter';

<Model
  type="anterior" | "posterior"
  data={exerciseData}  // IExerciseData[] with muscle + frequency
  highlightedColors={['color1', 'color2', ...]}  // 5 colors for frequency levels
  bodyColor="rgb(63, 63, 70)"
  onClick={(muscleStats: IMuscleStats) => void}
  style={{ width: '100%', maxWidth: '20rem' }}
  svgStyle={{ filter: 'drop-shadow(...)' }}
/>
```

**Muscle slug mapping (library muscle names):**

- Front: chest, front-deltoids, biceps, forearm, abs, obliques, quadriceps, adductor
- Back: back-deltoids, trapezius, upper-back, lower-back, triceps, gluteal, hamstring, calves

### Anatomy SVG Components (Unused)

**Location:** `/Users/opera_user/repo/GymAnalytics/gym-analytics/src/ui/components/anatomy/`

Custom SVG components exist (`MaleAnatomySVG.tsx`, `FemaleAnatomySVG.tsx`, `BodyHighlighter.tsx`) but the current MuscleHeatmap uses `react-body-highlighter` instead. These may be useful for Phase 3 if custom SVG control is needed.

## Data Hooks Available

### Volume Statistics Hooks

**File:** `/Users/opera_user/repo/GymAnalytics/gym-analytics/src/db/hooks/useVolumeStats.ts`

| Hook                                                      | Returns                                               | Use Case                      |
| --------------------------------------------------------- | ----------------------------------------------------- | ----------------------------- |
| `useScientificMuscleVolume(profileId, daysBack)`          | `{ stats, totalVolume, isLoading, error }`            | Per-muscle volume for heatmap |
| `useFunctionalGroupVolume(profileId, daysBack)`           | `{ stats, totalVolume, totalGoal, isLoading, error }` | Grouped volume for list view  |
| `useFunctionalGroupBreakdown(profileId, group, daysBack)` | `{ breakdown, isLoading, error }`                     | Drill-down within a group     |

**VolumeStatItem interface:**

```typescript
interface VolumeStatItem {
  name: string; // ScientificMuscle or FunctionalGroup name
  volume: number; // Calculated fractional volume
  goal: number; // Target sets per week
  percentage: number; // (volume / goal) * 100
}
```

**Hook barrel export:** `/Users/opera_user/repo/GymAnalytics/gym-analytics/src/db/hooks/index.ts`

```typescript
export * from './useVolumeStats';
// ... other hooks
```

### Supporting Hooks

| Hook                               | Purpose                                            |
| ---------------------------------- | -------------------------------------------------- |
| `useWorkouts(profileId, daysBack)` | Raw workout data (used internally by volume hooks) |
| `useProfile(profileId)`            | User goals and settings                            |
| `useExerciseMappings(profileId)`   | Exercise-to-muscle mappings                        |

### Hook API Consistency

All hooks follow the same pattern:

```typescript
{
  data: T | T[],      // Main payload
  isLoading: boolean, // TanStack Query loading state
  error: Error | null // Error if query failed
}
```

**Recommendation:** Mobile component uses the exact same hooks with no wrapper needed. The data shape is already mobile-appropriate.

## Component Patterns

### Current Directory Structure

```
src/ui/components/
  MuscleHeatmap.tsx          # 661 lines - monolithic
  MuscleVolumeCard.tsx       # Small card component
  TotalVolumeCard.tsx        # Volume summary
  WeeklyActivityChart.tsx    # Chart component
  anatomy/                   # Custom SVG components (unused)
    BodyHighlighter.tsx
    MaleAnatomySVG.tsx
    FemaleAnatomySVG.tsx
    index.ts                 # Barrel export
  exercise-mapping/          # Exercise mapping UI
```

### Proposed Mobile Directory Structure

Per CONTEXT.md decision: Mobile components live in `src/ui/components/mobile/`

```
src/ui/components/
  mobile/
    MobileHeatmap.tsx        # New mobile-specific heatmap
    index.ts                 # Barrel export (optional)
  MuscleHeatmap.tsx          # Becomes desktop-only (or renamed)
```

### Component Import Patterns

**Path aliases available:**

- `@ui/` -> `src/ui/`
- `@db/` -> `src/db/`
- `@core/` -> `src/core/`

**Standard import pattern:**

```typescript
// In mobile component
import { useScientificMuscleVolume } from '@db/hooks';
import type { ScientificMuscle } from '@core/taxonomy';
```

### Naming Conventions

From CLAUDE.md:

- Components: `PascalCase.tsx` (e.g., `MobileHeatmap.tsx`)
- Hooks: `use` prefix (e.g., `useIsMobile`)
- Types: In component file or imported from `@core/taxonomy`

## Mobile Detection

### Current Approach

The existing `useIsMobile()` hook in MuscleHeatmap.tsx uses viewport width:

- Threshold: 768px
- Method: `window.innerWidth`
- Updates on resize

**Problems with current approach:**

1. Causes layout shift on initial render (defaults to mobile, then may switch)
2. Doesn't distinguish touch devices from small desktop windows
3. Tablet at 768px gets mobile view, but CONTEXT.md wants tablets on desktop

### Recommended Approach: User-Agent Detection

Per CONTEXT.md decision: User agent detection to determine mobile vs desktop, tablets get desktop.

**Two options (Claude's discretion):**

**Option A: Lightweight navigator check**

```typescript
// No library needed - native API
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  // Note: Deliberately excludes iPad for tablet -> desktop
}
```

**Option B: react-device-detect library**

```typescript
import { isMobile, isTablet } from 'react-device-detect';
// isMobile excludes tablets by default
const showMobileView = isMobile && !isTablet;
```

**Recommendation:** Use native `navigator.userAgent` check. Avoids adding dependency for a simple check, and gives explicit control over tablet behavior.

### Detection Timing

Per CONTEXT.md (Claude's discretion): Mobile detection timing.

**Recommendation:** Detect at app load, provide via context.

```typescript
// In ProfileContext or new DeviceContext
const isMobileDevice = useMemo(() => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}, []);
```

**Rationale:**

- Runs once, stable across session
- Available to all components via context
- No flash/layout shift
- Pages can import and use for explicit component selection

### Page-Level Routing

Per CONTEXT.md: Pages/routes explicitly import MobileHeatmap or DesktopHeatmap.

```typescript
// Dashboard.tsx
import { MobileHeatmap } from '@ui/components/mobile/MobileHeatmap';
import { MuscleHeatmap } from '@ui/components/MuscleHeatmap';
import { useIsMobileDevice } from '@ui/context/DeviceContext';

function Dashboard() {
  const isMobile = useIsMobileDevice();

  return (
    <div>
      {isMobile ? (
        <MobileHeatmap profileId={currentProfile.id} />
      ) : (
        <MuscleHeatmap profileId={currentProfile.id} />
      )}
    </div>
  );
}
```

## Don't Hand-Roll

| Problem            | Don't Build        | Use Instead                                  | Why                                        |
| ------------------ | ------------------ | -------------------------------------------- | ------------------------------------------ |
| Body SVG rendering | Custom SVG paths   | `react-body-highlighter`                     | Already integrated, handles muscle regions |
| Volume calculation | Custom aggregation | `useScientificMuscleVolume`                  | Existing hook handles mappings, goals      |
| Query caching      | Manual cache       | TanStack Query (already used)                | Handles dedup, caching, refetch            |
| User-agent parsing | Complex regex      | Simple mobile regex or `react-device-detect` | Overkill for mobile/not-mobile             |

## Common Pitfalls

### Pitfall 1: Duplicating Data Hook Logic

**What goes wrong:** Creating mobile-specific volume calculation or transformation
**Why it happens:** Temptation to "optimize" data shape for mobile
**How to avoid:** Import existing hooks directly; both views use identical data
**Warning signs:** Any new hook in mobile directory that calls useWorkouts

### Pitfall 2: Shared Component with Internal Branching

**What goes wrong:** Adding more `if (isMobile)` branches to existing component
**Why it happens:** Seems faster than creating new component
**How to avoid:** ARCH-01 explicitly requires separate components
**Warning signs:** MuscleHeatmap.tsx growing, nested conditionals

### Pitfall 3: Detection at Wrong Level

**What goes wrong:** Each component detects mobile independently
**Why it happens:** Convenient to check where needed
**How to avoid:** Detect once at app/page level, pass decision down
**Warning signs:** Multiple useIsMobile() calls across component tree

### Pitfall 4: Breaking Desktop During Refactor

**What goes wrong:** Modifying existing MuscleHeatmap and breaking desktop
**Why it happens:** Trying to "refactor" instead of "add alongside"
**How to avoid:** Leave existing component untouched in Phase 1
**Warning signs:** Changes to MuscleHeatmap.tsx in Phase 1

### Pitfall 5: Premature SVG Optimization

**What goes wrong:** Trying to simplify body rendering in Phase 1
**Why it happens:** Current SVG has complexity (leader lines, cards)
**How to avoid:** Phase 1 is structure only; Phase 3 handles visualization
**Warning signs:** Modifying SplitBodyHighlighter or CARD_POSITIONS

## Code Examples

### Mobile Component Shell (Phase 1 Target)

```typescript
// src/ui/components/mobile/MobileHeatmap.tsx
import { useScientificMuscleVolume } from '@db/hooks';
import type { ScientificMuscle } from '@core/taxonomy';

interface MobileHeatmapProps {
  profileId: string | null;
  daysBack?: number;
}

export function MobileHeatmap({
  profileId,
  daysBack = 7,
}: MobileHeatmapProps): React.ReactElement {
  const { stats, isLoading, error } = useScientificMuscleVolume(profileId, daysBack);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-300 border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 border-2 border-red-500/50 p-4 text-red-400">
        Error loading muscle data: {error.message}
      </div>
    );
  }

  // Phase 1: Just render placeholder to prove data flows
  // Phase 2+ will add actual visualization
  return (
    <div className="rounded-lg bg-primary-700 p-4">
      <h3 className="text-white font-medium mb-2">Mobile Heatmap (Phase 1)</h3>
      <p className="text-primary-300 text-sm">
        Loaded {stats.length} muscles
      </p>
    </div>
  );
}
```

### Device Detection Hook

```typescript
// src/ui/hooks/useIsMobileDevice.ts
import { useMemo } from 'react';

/**
 * Detect if the device is a mobile phone (not tablet)
 * Uses user-agent rather than viewport for consistent behavior
 */
export function useIsMobileDevice(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    // Excludes iPad, Android tablets
    return /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);
}
```

### Dashboard Integration Pattern

```typescript
// src/ui/pages/Dashboard.tsx (modified)
import { MobileHeatmap } from '@ui/components/mobile/MobileHeatmap';
import { MuscleHeatmap } from '@ui/components/MuscleHeatmap';
import { useIsMobileDevice } from '@ui/hooks/useIsMobileDevice';

export function Dashboard(): React.ReactElement {
  const isMobile = useIsMobileDevice();
  const { currentProfile } = useCurrentProfile();

  // ... existing code ...

  return (
    <div className="space-y-6">
      {/* ... alerts and header ... */}

      <div className="rounded-lg bg-primary-700 p-6">
        {isMobile ? (
          <MobileHeatmap profileId={currentProfile.id} />
        ) : (
          <>
            {/* Existing desktop toggle and heatmap */}
            <div className="mb-6 flex items-center justify-between">
              {/* ... toggle buttons ... */}
            </div>
            <MuscleHeatmap profileId={currentProfile.id} view={bodyView} />
          </>
        )}
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach                | Current Approach        | When Changed     | Impact                               |
| --------------------------- | ----------------------- | ---------------- | ------------------------------------ |
| Viewport width detection    | User-agent detection    | Project decision | More accurate device targeting       |
| Single responsive component | Separate mobile/desktop | Project decision | Cleaner code, better UX per platform |

**No deprecated patterns to worry about** - the codebase is modern (React 19, Vite 7, TanStack Query 5).

## Open Questions

1. **Hook location for device detection**
   - What we know: Need a `useIsMobileDevice` hook somewhere
   - What's unclear: `src/ui/hooks/` (new) vs `src/ui/context/` (extend ProfileContext)
   - Recommendation: Create `src/ui/hooks/useIsMobileDevice.ts` - simple, discoverable

2. **Barrel file for mobile components**
   - What we know: `src/ui/components/mobile/` will have multiple components eventually
   - What's unclear: Barrel now or later?
   - Recommendation: Skip barrel in Phase 1, add when second component arrives

3. **Rename existing MuscleHeatmap?**
   - What we know: Current component becomes desktop-only
   - What's unclear: Rename to `DesktopHeatmap` now or leave as-is?
   - Recommendation: Leave as `MuscleHeatmap` for Phase 1 (minimal changes), consider rename in later phase

## Sources

### Primary (HIGH confidence)

- `/Users/opera_user/repo/GymAnalytics/gym-analytics/src/ui/components/MuscleHeatmap.tsx` - Current implementation (661 lines)
- `/Users/opera_user/repo/GymAnalytics/gym-analytics/src/db/hooks/useVolumeStats.ts` - Volume statistics hooks
- `/Users/opera_user/repo/GymAnalytics/gym-analytics/src/db/hooks/index.ts` - Hook barrel export
- `/Users/opera_user/repo/GymAnalytics/gym-analytics/src/core/taxonomy.ts` - Muscle type definitions
- `/Users/opera_user/repo/GymAnalytics/gym-analytics/.planning/phases/01-component-foundation/01-CONTEXT.md` - User decisions

### Secondary (MEDIUM confidence)

- [react-device-detect npm](https://www.npmjs.com/package/react-device-detect) - Device detection library reference
- [LogRocket: How to detect device types in React](https://blog.logrocket.com/how-to-detect-render-device-types-react/) - Detection patterns

### Tertiary (LOW confidence)

- General React best practices from web search (verified against codebase patterns)

## Metadata

**Confidence breakdown:**

- Existing implementation analysis: HIGH - Direct code review
- Data hooks: HIGH - Direct code review
- Mobile detection approach: MEDIUM - Based on web search + CONTEXT.md decisions
- Component structure: HIGH - Follows codebase conventions

**Research date:** 2026-01-18
**Valid until:** 30 days (stable codebase, no fast-moving dependencies)

---

_Phase: 01-component-foundation_
_Research completed: 2026-01-18_
