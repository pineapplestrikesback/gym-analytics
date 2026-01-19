# Phase 4: Front/Back Toggle - Research

**Researched:** 2026-01-19
**Domain:** CSS 3D animations, state persistence, mobile toggle UI
**Confidence:** HIGH

## Summary

This phase adds a toggle between front and back body views with a rotation animation that feels like rotating the body rather than switching modes. The toggle control must be visually quiet (subtle), and the selected view state persists within the session but resets on page refresh.

The existing codebase already renders both front and back views simultaneously in a split layout. This phase changes the mobile behavior to show one view at a time with an animated transition between them. The standard approach uses CSS 3D transforms (perspective, rotateY, backface-visibility) to create a convincing body rotation effect. State persistence uses sessionStorage for session-scoped memory that clears on tab close.

**Primary recommendation:** Implement a CSS 3D flip container wrapping both body views, controlled by a single toggle button positioned subtly near the body diagram. Use sessionStorage for state persistence with a dedicated key for the view state.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library                | Version | Purpose                                  | Why Standard                                                     |
| ---------------------- | ------- | ---------------------------------------- | ---------------------------------------------------------------- |
| CSS 3D Transforms      | Native  | Rotation animation                       | No external library needed; browser-native, hardware-accelerated |
| sessionStorage         | Native  | Session-scoped state persistence         | Clears on tab close per requirement; simpler than localStorage   |
| react-body-highlighter | 2.0.5   | Body model with anterior/posterior types | Already in use for heatmap                                       |

### Supporting

| Library           | Version | Purpose               | When to Use                       |
| ----------------- | ------- | --------------------- | --------------------------------- |
| @core/color-scale | -       | Volume coloring       | Same as Phase 3 for muscle colors |
| Tailwind CSS 4    | 4.1.18  | Toggle button styling | Consistent with existing UI       |

### Alternatives Considered

| Instead of     | Could Use          | Tradeoff                                                                 |
| -------------- | ------------------ | ------------------------------------------------------------------------ |
| CSS 3D flip    | Framer Motion      | Framer adds dependency; CSS is sufficient for simple Y-axis rotation     |
| sessionStorage | React state only   | React state loses selection on navigation; sessionStorage persists       |
| sessionStorage | localStorage       | localStorage persists across sessions; requirement says reset on refresh |
| Custom 3D flip | react-flip-toolkit | Library overhead unnecessary for single element transition               |

**Installation:**
No new packages required. CSS 3D transforms and sessionStorage are browser-native.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── ui/
│   └── components/
│       └── mobile/
│           ├── MobileHeatmap.tsx        # MODIFY - add flip container and toggle
│           └── MobileHeatmapToggle.tsx  # NEW - subtle toggle button component
```

### Pattern 1: CSS 3D Flip Container

**What:** A scene/card/face structure that rotates 180deg on Y-axis to show front/back
**When to use:** When toggling between two related views that represent opposite sides
**Example:**

```typescript
// Source: https://3dtransforms.desandro.com/card-flip
interface FlipContainerProps {
  view: 'front' | 'back';
  children: React.ReactNode;
}

function FlipContainer({ view, children }: FlipContainerProps): React.ReactElement {
  return (
    <div className="flip-scene" style={{ perspective: '1000px' }}>
      <div
        className="flip-card"
        style={{
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transformStyle: 'preserve-3d',
          transform: view === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

### Pattern 2: Backface Hidden Faces

**What:** Two child elements positioned absolutely, one pre-rotated 180deg with backface-visibility: hidden
**When to use:** For the front and back content within the flip container
**Example:**

```typescript
// Front face - visible by default
<div
  className="flip-face flip-face--front"
  style={{
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  }}
>
  <Model type="anterior" ... />
</div>

// Back face - pre-rotated, hidden until card flips
<div
  className="flip-face flip-face--back"
  style={{
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    transform: 'rotateY(180deg)',
  }}
>
  <Model type="posterior" ... />
</div>
```

### Pattern 3: Session-Scoped State Hook

**What:** Custom hook that syncs React state with sessionStorage
**When to use:** For state that should persist across navigation but clear on tab close
**Example:**

```typescript
// Source: Common React pattern for sessionStorage
function useSessionState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    const stored = sessionStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  });

  const setSessionState = (value: T) => {
    setState(value);
    sessionStorage.setItem(key, JSON.stringify(value));
  };

  return [state, setSessionState];
}

// Usage
const [view, setView] = useSessionState<'front' | 'back'>('heatmap_view', 'front');
```

### Pattern 4: Subtle Toggle Button

**What:** Low-contrast, small button that doesn't compete with the body diagram
**When to use:** For the front/back toggle control per TOGGLE-02
**Example:**

```typescript
// Subtle toggle - low contrast, positioned unobtrusively
<button
  onClick={() => setView(view === 'front' ? 'back' : 'front')}
  className="
    absolute bottom-4 left-1/2 -translate-x-1/2
    px-3 py-1.5 rounded-full
    text-xs text-primary-400
    bg-primary-800/50 backdrop-blur-sm
    border border-primary-700/30
    transition-colors
    active:bg-primary-700/50
  "
  aria-label={`Show ${view === 'front' ? 'back' : 'front'} view`}
>
  {view === 'front' ? 'Back' : 'Front'}
</button>
```

### Anti-Patterns to Avoid

- **Prominent toggle button:** Toggle should be visually quiet, not emphasized (TOGGLE-02)
- **React state only:** State will reset on navigation without sessionStorage
- **localStorage for session state:** localStorage persists across sessions; use sessionStorage
- **2D crossfade:** User decision: rotation feels like rotating body, not mode switching (TOGGLE-01)
- **Flat opacity transitions:** Lacks the spatial metaphor of rotation

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem           | Don't Build              | Use Instead              | Why                                                   |
| ----------------- | ------------------------ | ------------------------ | ----------------------------------------------------- |
| 3D rotation       | Custom animation library | CSS 3D transforms        | Browser-native, hardware-accelerated, well-documented |
| State persistence | Custom cookie logic      | sessionStorage API       | Built-in, simple, session-scoped by design            |
| Easing curves     | Custom math              | CSS cubic-bezier presets | Optimized by browser, standard values available       |
| Touch feedback    | Custom gesture detection | CSS :active states       | Native touch feedback, no JS needed                   |

**Key insight:** CSS 3D transforms are mature (supported since 2013), well-documented, and hardware-accelerated. No animation library is needed for a simple Y-axis rotation.

## Common Pitfalls

### Pitfall 1: Perspective Applied to Wrong Element

**What goes wrong:** 3D rotation looks flat or distorted
**Why it happens:** Perspective must be on the parent (scene), not the rotating element
**How to avoid:** Apply perspective to the container, transform-style: preserve-3d to the rotating card
**Warning signs:** Rotation looks 2D, no depth perception

### Pitfall 2: Backface Visibility Not Hidden

**What goes wrong:** Both faces visible simultaneously during rotation
**Why it happens:** backface-visibility: hidden must be on BOTH faces
**How to avoid:** Ensure both front and back faces have backface-visibility: hidden
**Warning signs:** See-through effect, content overlapping mid-rotation

### Pitfall 3: Session End Definition Ambiguity

**What goes wrong:** State persists or clears unexpectedly
**Why it happens:** sessionStorage clears on tab close, not on navigation or profile switch
**How to avoid:** Document that session = browser tab lifetime; profile switch within tab retains view
**Warning signs:** User confused about when state resets

### Pitfall 4: Toggle Button Touch Target Too Small

**What goes wrong:** Difficult to tap on mobile
**Why it happens:** Making button subtle can reduce size below 44px minimum
**How to avoid:** Keep visual appearance subtle but maintain 44x44px minimum touch target
**Warning signs:** Users missing taps, frustration feedback

### Pitfall 5: Animation Duration Too Long

**What goes wrong:** Toggle feels sluggish
**Why it happens:** Prioritizing dramatic effect over responsiveness
**How to avoid:** Keep duration 300-600ms; prefer ease-out for snappy feel
**Warning signs:** Users tapping multiple times, impatience

### Pitfall 6: Z-Index Conflicts During Rotation

**What goes wrong:** Faces render in wrong order mid-rotation
**Why it happens:** 3D stacking context conflicts with other positioned elements
**How to avoid:** Isolate flip container from other z-index contexts; use isolation: isolate
**Warning signs:** Flickering, wrong face showing, visual glitches

## Code Examples

Verified patterns from research:

### Complete 3D Flip Implementation

```typescript
// Source: https://3dtransforms.desandro.com/card-flip + React adaptation
interface BodyFlipViewProps {
  view: 'front' | 'back';
  onToggle: () => void;
  regionStats: Map<BodyRegion, { percentage: number }>;
}

function BodyFlipView({ view, onToggle, regionStats }: BodyFlipViewProps): React.ReactElement {
  return (
    <div className="relative w-full">
      {/* 3D Scene Container */}
      <div
        className="relative mx-auto"
        style={{
          perspective: '1000px',
          maxWidth: '18rem', // HEAT-02-SIZING
        }}
      >
        {/* Rotating Card */}
        <div
          className="relative w-full"
          style={{
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transformStyle: 'preserve-3d',
            transform: view === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Face (Anterior) */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden', // Safari
            }}
          >
            <MobileBodyHighlighter type="anterior" regionStats={regionStats} />
          </div>

          {/* Back Face (Posterior) */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden', // Safari
              transform: 'rotateY(180deg)',
            }}
          >
            <MobileBodyHighlighter type="posterior" regionStats={regionStats} />
          </div>
        </div>
      </div>

      {/* Subtle Toggle Button */}
      <button
        onClick={onToggle}
        className="
          absolute bottom-2 left-1/2 -translate-x-1/2
          min-w-[44px] min-h-[44px]
          px-3 py-1.5 rounded-full
          text-xs text-primary-400
          bg-primary-800/40 backdrop-blur-sm
          border border-primary-700/20
          transition-colors duration-150
          active:bg-primary-700/50
        "
        aria-label={`Show ${view === 'front' ? 'back' : 'front'} view`}
      >
        <span className="flex items-center gap-1.5">
          <RotateIcon className="w-3.5 h-3.5" />
          <span>{view === 'front' ? 'Back' : 'Front'}</span>
        </span>
      </button>
    </div>
  );
}
```

### Session State Hook

```typescript
// Reusable hook for session-scoped state
function useSessionState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = sessionStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setSessionState = useCallback(
    (value: T) => {
      setState(value);
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch {
        // sessionStorage may be unavailable in private mode
      }
    },
    [key]
  );

  return [state, setSessionState];
}

// Usage in MobileHeatmap
const [view, setView] = useSessionState<'front' | 'back'>('scientificmuscle_heatmap_view', 'front');
const toggleView = () => setView(view === 'front' ? 'back' : 'front');
```

### Inline Rotate Icon (SVG)

```typescript
// Consistent with codebase pattern of inline SVG icons
function RotateIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
```

### CSS Animation Timing Values

```css
/* Recommended easing for rotation animation */

/* Default ease-out: Fast start, slow end - feels responsive */
transition: transform 0.5s cubic-bezier(0, 0, 0.58, 1);

/* Ease-in-out: Slow start and end - feels more dramatic */
transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);

/* Spring-like: Slight overshoot for organic feel */
transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
```

## State of the Art

| Old Approach                     | Current Approach                  | When Changed        | Impact                                    |
| -------------------------------- | --------------------------------- | ------------------- | ----------------------------------------- |
| JavaScript animation libraries   | CSS 3D transforms                 | 2013+               | Hardware-accelerated, no dependencies     |
| localStorage for all persistence | sessionStorage for session-scoped | Standard practice   | Appropriate lifecycle for different needs |
| Crossfade/opacity transitions    | 3D rotation                       | Modern UX           | Spatial metaphor, more engaging           |
| Large toggle buttons             | Subtle, low-contrast toggles      | 2024-2025 UX trends | Reduced visual noise, content focus       |

**Deprecated/outdated:**

- CSS vendor prefixes for transforms: Only -webkit-backface-visibility still needed for Safari
- jQuery animation: Native CSS is superior for simple transforms

## Session End Definition

Per CONTEXT.md, session ends on page refresh or tab close. Implementation details:

| Event                    | State Behavior    | Mechanism                                   |
| ------------------------ | ----------------- | ------------------------------------------- |
| Navigation between pages | Persists          | sessionStorage survives navigation          |
| Profile switch           | Persists          | Same sessionStorage key, not profile-scoped |
| Page refresh             | Resets to 'front' | sessionStorage clears                       |
| Tab close                | Resets            | sessionStorage clears                       |
| New tab to same URL      | Fresh 'front'     | sessionStorage is per-tab                   |

**Recommendation:** Keep state in sessionStorage without profile scoping. If a user switches profiles, they likely want to continue viewing the same side of the body. This simplifies implementation and aligns with the "session = browser tab" mental model.

## Open Questions

Things that couldn't be fully resolved:

1. **Icon choice for toggle**
   - What we know: Codebase uses inline SVG icons; lucide-react is in dependencies but unused
   - What's unclear: Exact icon design - rotate arrows, flip symbol, or text-only
   - Recommendation: Use rotate-style icon (refresh/rotate arrows) with text label; matches "rotation" metaphor

2. **Toggle button exact position**
   - What we know: Should be subtle (TOGGLE-02), near the body diagram
   - What's unclear: Bottom center, corner, or floating at side
   - Recommendation: Bottom center, below body diagram - unobtrusive but discoverable

3. **Animation direction**
   - What we know: Y-axis rotation (rotateY) creates left-right flip
   - What's unclear: Clockwise vs counterclockwise direction
   - Recommendation: Toggle front->back rotates clockwise (standard mental model: reading left to right)

## Sources

### Primary (HIGH confidence)

- [Intro to CSS 3D Transforms - Card Flip](https://3dtransforms.desandro.com/card-flip) - Authoritative tutorial on 3D flip pattern
- [MDN rotate3d()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/transform-function/rotate3d) - Official CSS reference
- [MDN cubic-bezier()](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/cubic-bezier) - Easing function reference
- Existing codebase: `src/ui/context/ProfileContext.tsx` - localStorage pattern to adapt for sessionStorage

### Secondary (MEDIUM confidence)

- [GeeksforGeeks - sessionStorage in React](https://www.geeksforgeeks.org/reactjs/how-to-persist-state-with-local-or-session-storage-in-react/) - Hook pattern reference
- [UXTweak - Toggle Button Design](https://www.uxtweak.com/research/toggle-button-design/) - UX best practices
- [CSS-Tricks - cubic-bezier](https://css-tricks.com/almanac/functions/c/cubic-bezier/) - Easing function examples

### Tertiary (LOW confidence)

- WebSearch results for 2025 toggle design trends - general guidance, not verified

## Metadata

**Confidence breakdown:**

- CSS 3D animation: HIGH - Well-documented, browser-native, widely used
- sessionStorage persistence: HIGH - Native API, matches requirements exactly
- Toggle UI design: MEDIUM - UX recommendations vary; final design needs iteration
- Animation timing: MEDIUM - Easing preferences are subjective; defaults provided

**Research date:** 2026-01-19
**Valid until:** 60 days (CSS 3D transforms are stable; no breaking changes expected)
