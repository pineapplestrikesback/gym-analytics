# Phase 7: Detail Pop-up - Research

**Researched:** 2026-01-23
**Domain:** React modal overlays, mobile gesture handling, SVG highlighting
**Confidence:** HIGH

## Summary

Phase 7 requires a modal component that displays muscle details when a body region is tapped. The modal must support multiple dismiss methods (tap outside, X button, swipe down, Escape key), animate smoothly (fade in/out), highlight the selected region on the body diagram, and prevent background scrolling while open.

The research focused on three primary domains:
1. **React modal patterns** - Portal-based overlays with focus trapping and accessibility
2. **Mobile gesture handling** - Touch events for swipe-to-dismiss without heavy libraries
3. **SVG region highlighting** - Stroke/outline effects for body diagram regions

**Primary recommendation:** Use React portals for modal rendering, vanilla touch events for swipe detection, CSS transitions for fade animations, and overflow:hidden for scroll locking. Leverage existing project patterns (MobileHeatmap's REGION_TO_MUSCLES mapping, MobileMuscleList's progress bar layout, AutoMatchReviewModal's backdrop click handling).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Portals | Built-in | Render modal outside DOM hierarchy | Solves z-index stacking context issues, standard React API |
| Vanilla Touch Events | Built-in | Swipe gesture detection | Lightweight, no dependencies, 50 LOC implementation |
| CSS Transitions | Built-in | Fade in/out animations | Native performance, widely supported, simple declarative syntax |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-body-highlighter | ^2.0.5 | SVG body diagram | Already installed, provides muscle polygon mapping |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla touch events | react-swipeable, use-gesture | Libraries add ~10KB for functionality achievable in 50 lines |
| CSS transitions | react-transition-group, framer-motion | Animation libraries add overhead for simple fade effects |
| React portals | modal container in-place | Portals necessary to escape stacking context and z-index issues |

**Installation:**
No new packages required - all functionality uses React built-ins and existing dependencies.

## Architecture Patterns

### Recommended Project Structure
```
src/ui/components/mobile/
├── MobileHeatmap.tsx          # Existing - contains REGION_TO_MUSCLES mapping
├── MobileMuscleList.tsx       # Existing - contains muscle list layout pattern
├── MobileCarousel.tsx         # Existing - carousel container
└── MuscleDetailModal.tsx      # New - modal component for this phase
```

### Pattern 1: Portal-Based Modal with Backdrop
**What:** Modal rendered via ReactDOM.createPortal to document.body, with backdrop click handler
**When to use:** All overlay/modal components to avoid z-index conflicts
**Example:**
```typescript
// Source: Existing AutoMatchReviewModal pattern + https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function MuscleDetailModal({ isOpen, onClose, children }) {
  // Lock body scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-w-lg w-full bg-surface-overlay rounded-lg">
        {children}
      </div>
    </div>,
    document.body
  );
}
```

### Pattern 2: Vanilla Touch Events for Swipe Detection
**What:** Track touchstart Y position and touchend Y position to detect downward swipe
**When to use:** Simple gesture detection without complex multi-touch or velocity requirements
**Example:**
```typescript
// Source: https://www.freecodecamp.org/news/how-to-build-mobile-swiping-component-in-react/
function useSwipeDown(onSwipeDown: () => void) {
  const [startY, setStartY] = useState(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    setStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - startY;

    // Downward swipe threshold: 50px
    if (deltaY > 50) {
      onSwipeDown();
    }
  }, [startY, onSwipeDown]);

  return { handleTouchStart, handleTouchEnd };
}
```

**Critical:** Must use `{ passive: false }` when adding touch event listeners to prevent default scroll behavior:
```typescript
window.addEventListener("touchstart", handleTouchStart, { passive: false });
```

### Pattern 3: CSS Fade Animations with Conditional Rendering
**What:** Use CSS opacity transitions with delayed unmount for exit animations
**When to use:** Simple fade in/out effects without complex orchestration
**Example:**
```typescript
// Source: Existing AutoMatchReviewModal + https://medium.com/@meric.emmanuel/fade-out-animations-in-react-the-right-way-b2a95156b71f
function Modal({ isOpen, onClose, children }) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      // Delay unmount for exit animation
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: isOpen ? 1 : 0 }}
    >
      {children}
    </div>
  );
}
```

**Alternative (simpler):** Use inline style animation like existing AutoMatchReviewModal:
```typescript
<div style={{ animation: 'fadeIn 0.2s ease-out' }}>
  <style>{`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `}</style>
  {/* Modal content */}
</div>
```

### Pattern 4: SVG Region Highlighting with Stroke
**What:** Apply stroke/outline to SVG path elements for selected body regions
**When to use:** Highlighting interactive SVG regions (body diagram muscles)
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke
// In react-body-highlighter, target specific muscles with CSS
<style>{`
  .rbh polygon[data-name="${selectedMuscle}"] {
    stroke: white;
    stroke-width: 2px;
    stroke-opacity: 1;
  }
`}</style>
```

**Note:** react-body-highlighter uses polygon elements, not path. The library exposes a `.rbh` class for styling.

### Pattern 5: Keyboard Event Handling
**What:** Listen for Escape key to dismiss modal
**When to use:** All modal/overlay components for accessibility
**Example:**
```typescript
// Source: https://headlessui.com/react/dialog (patterns)
useEffect(() => {
  if (!isOpen) return;

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);
```

### Anti-Patterns to Avoid
- **Don't use backdrop-filter blur on mobile:** Causes significant performance issues on low-end devices and large screens. Opacity dimming (bg-black/90) is sufficient.
- **Don't trap focus without proper cleanup:** Focus trapping can block nested modals. This phase doesn't require focus trap (tap-based UI), so skip it unless keyboard navigation is critical.
- **Don't use position: fixed for scroll locking alone:** iOS Safari ignores this. Use overflow: hidden on body element instead.
- **Don't forget passive: false:** Touch event listeners default to passive mode in modern browsers, preventing preventDefault() for scroll blocking.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal z-index conflicts | Custom positioning logic | React portals (createPortal) | Escapes stacking context automatically, standard React API |
| Swipe gesture library | Full gesture recognizer | Vanilla touch events (50 LOC) | Simple up/down detection doesn't need library overhead |
| Scroll locking on mobile | Custom scroll prevention | overflow: hidden on body | Standard CSS, works across browsers including iOS |
| Regional muscle grouping | New mapping structure | Existing REGION_TO_MUSCLES from MobileHeatmap | Already maps body regions to scientific muscles |
| Muscle list layout | New component | Adapt MobileMuscleList pattern | Same data format (name, volume/goal, progress bar) |

**Key insight:** This phase reuses three existing patterns: MobileHeatmap's region mapping, MobileMuscleList's layout, and AutoMatchReviewModal's portal/backdrop handling. Don't rebuild what already works.

## Common Pitfalls

### Pitfall 1: Body Scroll Leaks on iOS Safari
**What goes wrong:** Setting overflow: hidden on body doesn't prevent scrolling on iOS Safari when user drags within modal
**Why it happens:** iOS Safari has non-standard scroll behavior; body { overflow: hidden } is ignored in some contexts
**How to avoid:** Combine overflow: hidden with touch-action: none on modal container, and use preventDefault() on touch events with passive: false
**Warning signs:** Modal content is fine but background page still scrolls when swiping on iOS devices

### Pitfall 2: Z-Index Wars Between Modal and Heatmap
**What goes wrong:** Modal appears behind body diagram or other UI elements despite high z-index
**Why it happens:** Stacking contexts - child elements can't escape parent's stacking context regardless of z-index value
**How to avoid:** Always use React portals (createPortal) to render modals at document.body level, outside all other containers
**Warning signs:** Setting z-index to 9999 doesn't fix the layering issue

### Pitfall 3: Exit Animation Doesn't Play
**What goes wrong:** Modal disappears instantly without fade-out animation when closing
**Why it happens:** Component unmounts immediately when isOpen becomes false, removing DOM element before CSS transition completes
**How to avoid:** Delay unmount with setTimeout (duration matches CSS transition time), or keep DOM element mounted and only toggle opacity
**Warning signs:** Fade-in works but fade-out is instant

### Pitfall 4: Touch Events Block All Scrolling
**What goes wrong:** After adding touch event listeners for swipe detection, user can't scroll modal content
**Why it happens:** preventDefault() in touch handlers blocks all touch-based scrolling, including legitimate scroll gestures
**How to avoid:** Only call preventDefault() when gesture is confirmed (sufficient deltaY), not on every touchmove. Or, attach listeners only to modal header (drag handle), not entire modal.
**Warning signs:** Swipe-to-dismiss works but user can't scroll through muscle list

### Pitfall 5: Highlighting Wrong Muscles (Bilateral vs Unilateral)
**What goes wrong:** Tapping left shoulder only highlights left side, but phase context requires bilateral highlighting
**Why it happens:** Body diagram has separate left/right polygons for symmetric muscles
**How to avoid:** When highlighting a region, check if it's a bilateral muscle group (shoulders, chest, lats) and apply stroke to both left and right polygons
**Warning signs:** Asymmetric highlighting on body diagram when user expects both sides to light up

### Pitfall 6: Backdrop Blur Performance on Low-End Devices
**What goes wrong:** Modal opening causes frame drops, sluggish UI, and device heating on older phones
**Why it happens:** backdrop-filter: blur() is GPU-intensive and must re-render entire scene behind the element
**How to avoid:** Use solid color dimming (bg-black/90) instead of backdrop-filter. Performance gain is significant with no visual quality loss for this use case.
**Warning signs:** Modal animations are smooth on desktop but janky on mobile, especially on 4K screens or low-end devices

## Code Examples

Verified patterns from official sources:

### Modal Container with Portal and Scroll Lock
```typescript
// Source: Existing AutoMatchReviewModal pattern + https://medium.com/@nikhil_gupta/how-to-disable-background-scroll-when-a-modal-side-drawer-is-open-in-react-js-999653a8eebb
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Keyboard dismiss (Escape key)
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      {children}
    </div>,
    document.body
  );
}
```

### Swipe-Down Dismiss Hook
```typescript
// Source: https://www.freecodecamp.org/news/how-to-build-mobile-swiping-component-in-react/
import { useState, useCallback, useEffect, useRef } from 'react';

interface UseSwipeDownOptions {
  onSwipeDown: () => void;
  threshold?: number; // Minimum pixels for swipe
}

export function useSwipeDown({ onSwipeDown, threshold = 50 }: UseSwipeDownOptions) {
  const [startY, setStartY] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    setStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - startY;

    if (deltaY > threshold) {
      onSwipeDown();
    }
  }, [startY, onSwipeDown, threshold]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // CRITICAL: passive: false allows preventDefault()
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return ref;
}
```

### Muscle List Item (from MobileMuscleList pattern)
```typescript
// Source: Existing MobileMuscleList.tsx
import { getVolumeColor } from '@core/color-scale';

interface MuscleItemProps {
  name: string;
  volume: number;
  goal: number;
  percentage: number;
}

function MuscleItem({ name, volume, goal, percentage }: MuscleItemProps) {
  const formatVolume = (v: number) => v % 1 === 0 ? v.toString() : v.toFixed(1);

  return (
    <div className="space-y-1">
      {/* Line 1: Muscle name (left) + volume/goal ratio (right) */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-primary-200">{name}</span>
        <span className="text-xs text-primary-400 font-mono">
          {formatVolume(volume)}/{formatVolume(goal)}
        </span>
      </div>

      {/* Line 2: Progress bar - 4px tall, full width */}
      <div className="w-full h-1 overflow-hidden rounded-full bg-primary-800">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: getVolumeColor(percentage),
          }}
        />
      </div>
    </div>
  );
}
```

### SVG Region Highlighting
```typescript
// Source: react-body-highlighter patterns + https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke
// Apply stroke to selected muscles in body diagram

interface HighlightedRegion {
  region: string; // e.g., 'chest', 'shoulders'
  muscles: string[]; // react-body-highlighter muscle slugs
}

function applyRegionHighlight(region: HighlightedRegion | null) {
  if (!region) return null;

  // Generate CSS to highlight specific muscle polygons
  return (
    <style>{`
      ${region.muscles.map(muscle => `
        .rbh polygon[data-name="${muscle}"] {
          stroke: white;
          stroke-width: 2px;
          stroke-opacity: 0.8;
        }
      `).join('\n')}
    `}</style>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-modal library | React portals (built-in) | React 16.0 (2017) | No dependency needed, native API |
| react-transition-group for simple fades | CSS transitions + delayed unmount | 2024-2025 | Lighter weight for simple animations |
| body-scroll-lock package | overflow: hidden + touch-action | 2024+ | One less dependency, native CSS solution |
| Complex gesture libraries | Vanilla touch events | 2024-2025 | 50 LOC vs 10KB+ bundle for simple swipes |

**Deprecated/outdated:**
- **react-modal package:** Still maintained but unnecessary - React portals achieve the same result with built-in API
- **backdrop-filter: blur() for all modals:** Performance issues on mobile led to preference for solid color dimming (bg-black/90)
- **position: fixed for scroll locking:** Doesn't work on iOS Safari; overflow: hidden is standard approach

## Open Questions

Things that couldn't be fully resolved:

1. **Which body regions span front and back views?**
   - What we know: Shoulders appear on both front (anterior deltoid) and back (posterior deltoid) views
   - What's unclear: Do we keep highlighting when user flips body view, or clear it?
   - Recommendation: Clear highlight when flipping (per CONTEXT.md decision: "Flipping body while pop-up is open closes the pop-up automatically")

2. **Should progress bars show target range zone (12-20 sets) or just current/goal ratio?**
   - What we know: CONTEXT.md specifies "current/goal ratio (e.g., 15/12-20)"
   - What's unclear: Does this mean show 15/(12-20) as text, or visualize the range on progress bar?
   - Recommendation: Show text format "15/12-20" (current/min-max), progress bar fills to percentage of min target (15/12 = 125%)

3. **Exact touch threshold for swipe-down dismissal**
   - What we know: 50px is common threshold in mobile gesture libraries
   - What's unclear: Optimal threshold for this specific modal size and use case
   - Recommendation: Start with 50px, adjust based on user testing if needed

## Sources

### Primary (HIGH confidence)
- React Portals: https://react.dev/reference/react-dom/createPortal (official docs)
- Touch Events: https://www.freecodecamp.org/news/how-to-build-mobile-swiping-component-in-react/ (50 LOC implementation)
- SVG Stroke: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke (MDN official)
- react-body-highlighter: https://github.com/giavinh79/react-body-highlighter (official repo)
- Existing codebase patterns: AutoMatchReviewModal, MobileHeatmap, MobileMuscleList

### Secondary (MEDIUM confidence)
- Modal accessibility: https://headlessui.com/react/dialog (Headless UI patterns)
- Scroll locking: https://medium.com/@nikhil_gupta/how-to-disable-background-scroll-when-a-modal-side-drawer-is-open-in-react-js-999653a8eebb
- Fade animations: https://medium.com/@meric.emmanuel/fade-out-animations-in-react-the-right-way-b2a95156b71f
- CSS Tricks modal scroll: https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/

### Tertiary (LOW confidence)
- backdrop-filter performance: https://github.com/tailwindlabs/headlessui/issues/690 (GitHub issue report)
- iOS scroll behavior: https://github.com/reactjs/react-modal/issues/829 (community discussion)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - React built-ins (portals, touch events, CSS) are authoritative
- Architecture: HIGH - Patterns verified in existing codebase (AutoMatchReviewModal, MobileHeatmap)
- Pitfalls: MEDIUM - Based on community reports (GitHub issues, Medium articles) and codebase patterns

**Research date:** 2026-01-23
**Valid until:** 2026-03-23 (60 days - stable web platform APIs, slow-moving domain)
