# Phase 8: Tap Interactions - Research

**Researched:** 2026-01-23
**Domain:** Mobile touch interactions, React event handling, CSS tap feedback
**Confidence:** HIGH

## Summary

This phase connects tap interactions to the existing detail pop-up system. The heatmap already has functional tap-to-modal behavior from Phase 7 - this phase adds list row taps and fixes the bilateral tap animation feedback issue.

The primary challenge is two-fold:
1. **List row taps:** Add onClick handlers to muscle rows (not group headers) that open the same modal used by the heatmap
2. **Bilateral animation fix:** When tapping a muscle on the heatmap, both left and right SVG polygons should show the `:active` feedback animation, not just the tapped side

The architecture is already established - both components share the same data hooks and the modal pattern exists. This is primarily a wiring task with one CSS/event handling refinement.

**Primary recommendation:** Use state-based approach for bilateral tap feedback (not CSS `:active`) since CSS pseudo-classes only apply to the actual tapped element. For list rows, use Tailwind's `active:` variant which works correctly on mobile.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | Component framework | Project foundation |
| Tailwind CSS | 4.1.18 | Styling with `active:` variant | Mobile touch states |
| react-body-highlighter | 2.0.5 | SVG body model with onClick | Already integrated |

### Supporting (Already in Use)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| embla-carousel-react | 8.6.0 | Carousel container | List and heatmap container |

### No New Libraries Needed

This phase requires no additional dependencies. All tap interaction patterns can be implemented with existing React state management and Tailwind CSS utilities.

**Installation:** None required.

## Architecture Patterns

### Current Component Structure
```
src/ui/components/mobile/
├── MobileCarousel.tsx      # Parent: renders both slides
├── MobileHeatmap.tsx       # Has: onClick, selectedRegion state, MuscleDetailModal
├── MobileMuscleList.tsx    # Needs: onClick handlers, shared modal
└── MuscleDetailModal.tsx   # Shared: can be used by either component
```

### Pattern 1: Lifted State for Shared Modal

**What:** Move selectedRegion state up to MobileCarousel so both slides can share one modal
**When to use:** When multiple sibling components need to trigger the same modal
**Current limitation:** Modal is inside MobileHeatmap - list cannot open it

```typescript
// MobileCarousel owns the state
const [selectedMuscle, setSelectedMuscle] = useState<ScientificMuscle | null>(null);

// Pass down to both children
<MobileHeatmap onMuscleSelect={setSelectedMuscle} />
<MobileMuscleList onMuscleSelect={setSelectedMuscle} />

// Render modal once at carousel level
<MuscleDetailModal muscle={selectedMuscle} />
```

### Pattern 2: Alternative - Sibling Modals (Simpler)

**What:** Each slide renders its own modal; only one is ever visible at a time
**When to use:** When lift would complicate props or when slides don't need to share state
**Trade-off:** Slight code duplication, but simpler data flow

Since slides are never visible simultaneously (carousel), having two independent modals is acceptable. Each manages its own selectedRegion/selectedMuscle state.

### Pattern 3: List Row as Tappable Region

**What:** Wrap entire muscle row content in a tappable element with touch feedback
**When to use:** For list items that should open a detail view

```typescript
// Full row is tappable - NOT the group header
<button
  onClick={() => onMuscleSelect(muscle)}
  className="w-full text-left active:bg-primary-700/50 transition-colors"
>
  <MuscleRowContent muscle={muscle} stats={muscleStats} />
</button>
```

### Pattern 4: Bilateral Animation via State (Not CSS :active)

**What:** Use React state to show tap feedback on both bilateral SVG regions
**Why:** CSS `:active` only applies to the element receiving the touch event
**Implementation:** Brief state toggle on click that affects both regions' appearance

```typescript
const [tapAnimating, setTapAnimating] = useState<BodyRegion | null>(null);

const handleMuscleClick = (region: BodyRegion) => {
  // Show bilateral animation feedback
  setTapAnimating(region);
  setTimeout(() => setTapAnimating(null), 150);

  // Toggle selection
  onRegionClick(selectedRegion === region ? null : region);
};

// In exerciseData memo - apply animation frequency to BOTH front and back
const frequency = tapAnimating === region
  ? 7  // New tap animation level
  : selectedRegion === region
    ? 6  // Selected state
    : getFrequencyLevel(stats.percentage);
```

### Anti-Patterns to Avoid

- **DOM event listeners for SVG clicks:** The react-body-highlighter polygons don't have predictable IDs; use the library's onClick prop
- **Relying on CSS :active for bilateral feedback:** Only fires on the tapped element
- **Group headers opening modals:** Users expect expand/collapse, not navigation
- **Heavy haptic feedback:** Web Vibration API has limited support and should be avoided

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Touch feedback styling | Custom JS touch handlers | Tailwind `active:` variant | Works on mobile, handles edge cases |
| SVG region click detection | DOM event listeners | react-body-highlighter onClick | Library handles coordinate mapping |
| Modal z-index isolation | Manual z-index stacking | createPortal to document.body | Already established in codebase |
| Tap target sizing | Eyeballing | min-w-[44px] min-h-[44px] | Apple HIG minimum |

**Key insight:** The project already has all the patterns needed - this phase is wiring, not architecture.

## Common Pitfalls

### Pitfall 1: CSS :active Not Firing on iOS Safari

**What goes wrong:** Tap feedback via `:active` doesn't show on iOS Safari
**Why it happens:** iOS Safari requires JavaScript touch listeners to enable `:active`
**How to avoid:** Either add empty `touchstart` listener or use state-based approach
**Warning signs:** Feedback works on Android/desktop but not iOS Safari

**Solution already in codebase:** The MobileHeatmap uses `:active` with a touchstart handler on the parent container, which enables `:active` in Safari.

### Pitfall 2: Tap Highlight Color Interference

**What goes wrong:** Blue tap highlight rectangle appears over tapped elements
**Why it happens:** Default `-webkit-tap-highlight-color` on iOS/Android
**How to avoid:** Add `-webkit-tap-highlight-color: transparent` to base styles
**Warning signs:** Blue flash on tap, especially on buttons/links

**Current status:** Not explicitly set in index.css - may need to add.

### Pitfall 3: Group Header vs Row Tap Confusion

**What goes wrong:** Tapping group headers opens modal instead of expanding
**Why it happens:** Adding onClick to entire list section instead of individual rows
**How to avoid:** Only muscle rows have modal-opening behavior; headers keep expand/collapse
**Warning signs:** User complains "I can't expand the list anymore"

### Pitfall 4: Missing Tap Feedback on List Rows

**What goes wrong:** Rows don't visually respond to tap, feels unresponsive
**Why it happens:** Forgot `active:` styles or iOS Safari issue
**How to avoid:** Use `active:bg-primary-700/50` or similar visible feedback
**Warning signs:** Users tap multiple times thinking first tap didn't register

### Pitfall 5: Modal Not Receiving Correct Muscle Data

**What goes wrong:** Modal opens but shows wrong muscle or empty data
**Why it happens:** Passing muscle name instead of region, or wrong mapping
**How to avoid:** List rows work with ScientificMuscle; heatmap works with BodyRegion - map correctly
**Warning signs:** Modal content doesn't match tapped item

## Code Examples

Verified patterns from the existing codebase.

### List Row with Tap Feedback (Recommended Pattern)

```typescript
// Source: Pattern from MobileHeatmap button + Tailwind active: variant
<button
  onClick={() => onMuscleSelect(muscle)}
  className="w-full text-left p-3 active:bg-primary-700/50 transition-colors duration-75"
>
  <div className="flex items-center justify-between">
    <span className="text-sm text-primary-200">{muscle}</span>
    <span className="text-xs text-primary-400 font-mono">
      {formatVolume(volume)}/{formatVolume(goal)}
    </span>
  </div>
  <div className="w-full h-1 mt-1 rounded-full bg-primary-800">
    <div
      className="h-full rounded-full"
      style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: getVolumeColor(percentage) }}
    />
  </div>
</button>
```

### Bilateral Tap Animation Feedback

```typescript
// Source: Derived from existing MobileHeatmap selectedRegion pattern
// Add 7th color for tap animation (distinct from selection amber)
const HIGHLIGHTED_COLORS = [
  getVolumeColor(12.5),   // frequency 1
  getVolumeColor(37.5),   // frequency 2
  getVolumeColor(62.5),   // frequency 3
  getVolumeColor(87.5),   // frequency 4
  getVolumeColor(100),    // frequency 5
  'rgb(245, 158, 11)',    // frequency 6: selected (amber)
  'rgb(255, 255, 255)',   // frequency 7: tap animation (white flash)
];

// In component
const [tappedRegion, setTappedRegion] = useState<BodyRegion | null>(null);

const handleMuscleClick = useCallback((region: BodyRegion) => {
  // Brief bilateral animation
  setTappedRegion(region);
  setTimeout(() => setTappedRegion(null), 150);

  // Toggle selection
  onRegionClick(selectedRegion === region ? null : region);
}, [onRegionClick, selectedRegion]);
```

### Suppress Default Tap Highlight (Global CSS)

```css
/* Source: Tailwind CSS discussions for mobile tap behavior */
@layer base {
  html {
    -webkit-tap-highlight-color: transparent;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS :hover for feedback | Tailwind v4 hover guard + :active | Tailwind v4.0 | Mobile gets proper touch states |
| Manual touch events | Library onClick props | react-body-highlighter 2.x | Cleaner event handling |
| Single modal per view | Portal to document.body | React 18+ standard | Z-index isolation |

**Tailwind v4 consideration:** The project uses Tailwind 4.1.18 which has hover guard enabled by default (hover only on `@media (hover: hover)` devices). This is correct for mobile - use `active:` for touch feedback, not `hover:`.

## Open Questions

Things that couldn't be fully resolved:

1. **Modal architecture: Lift vs duplicate?**
   - What we know: Both patterns work; lifting is "cleaner" but requires prop threading
   - What's unclear: User preference on implementation complexity
   - Recommendation: Start with duplicate modals (simpler); refactor if needed

2. **Exact tap animation timing**
   - What we know: 100-150ms is standard for touch feedback
   - What's unclear: Optimal value for this specific use case
   - Recommendation: Start with 150ms; adjust based on feel

3. **Need for -webkit-tap-highlight-color: transparent**
   - What we know: Not currently in index.css; may cause blue flash on some devices
   - What's unclear: Whether existing styles already suppress it
   - Recommendation: Test first; add if blue highlight observed

## Sources

### Primary (HIGH confidence)
- Existing codebase: MobileHeatmap.tsx, MobileMuscleList.tsx, MuscleDetailModal.tsx
- Tailwind CSS official docs: https://tailwindcss.com/docs/hover-focus-and-other-states

### Secondary (MEDIUM confidence)
- Apple HIG: 44x44pt minimum tap targets
- Web search: Mobile tap feedback patterns 2025
- Tailwind GitHub discussions: -webkit-tap-highlight-color handling

### Tertiary (LOW confidence)
- None - all findings verified against official sources or codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - uses existing libraries, no new dependencies
- Architecture: HIGH - patterns already established in codebase
- Pitfalls: HIGH - verified against iOS Safari testing notes in STATE.md

**Research date:** 2026-01-23
**Valid until:** 60 days (stable patterns, no fast-moving dependencies)
