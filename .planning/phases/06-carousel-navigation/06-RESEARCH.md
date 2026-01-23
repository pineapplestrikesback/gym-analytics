# Phase 6: Carousel Navigation - Research

**Researched:** 2026-01-22
**Domain:** Mobile carousel/swipe navigation, touch gesture handling, React
**Confidence:** HIGH

## Summary

Phase 6 combines the existing MobileHeatmap and MobileMuscleList components into an Instagram-style swipeable carousel. The research evaluated two approaches: using a carousel library vs building custom touch handling.

**Key finding:** For a 2-slide carousel, embla-carousel-react is the recommended choice. Despite the simplicity of only 2 slides, the library provides:
1. Smooth physics-based swiping (the hardest part to get right)
2. Cross-browser touch handling (iOS Safari quirks handled)
3. Only ~7KB gzipped with zero dependencies
4. Clean hook-based API (`useEmblaCarousel`)

Custom implementation was considered but rejected because:
- Touch gesture physics are subtle and hard to perfect
- iOS Safari has touch event quirks that libraries handle
- The 50-100 lines saved doesn't justify the risk
- Embla's bundle cost is negligible (~7KB)

**Primary recommendation:** Use `embla-carousel-react` v8.6.0 with minimal CSS setup. Implement dot indicators using the `select` event to track current slide.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| embla-carousel-react | 8.6.0 | Swipe carousel | Industry standard, 800K weekly downloads, ~7KB gzipped |
| React | 19 | Component framework | Project standard |
| Tailwind CSS | 4 | Styling | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @db/hooks | local | Volume data | useScientificMuscleVolume for both slides |
| @core/taxonomy | local | Muscle groupings | Passed to MobileMuscleList |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| embla-carousel-react | Custom touch handler | More control but high risk - iOS Safari quirks, physics tuning |
| embla-carousel-react | react-swipeable | Lower-level - still need to implement snap/momentum |
| embla-carousel-react | swiper.js | Larger bundle (~45KB vs ~7KB), more features than needed |
| CSS scroll-snap | embla | Native but inconsistent cross-browser, no JS control for indicators |

**Installation:**
```bash
npm install embla-carousel-react
```

## Architecture Patterns

### Recommended Project Structure
```
src/ui/components/mobile/
├── MobileHeatmap.tsx         # Existing - slide 1 content
├── MobileMuscleList.tsx      # Existing - slide 2 content
└── MobileCarousel.tsx        # NEW - carousel container with navigation
```

### Pattern 1: Embla Carousel Setup

**What:** Basic carousel with useEmblaCarousel hook
**When to use:** Any horizontal swipe navigation
**Example:**
```typescript
// Source: https://www.embla-carousel.com/get-started/react/
import useEmblaCarousel from 'embla-carousel-react';
import { useState, useEffect, useCallback } from 'react';

interface MobileCarouselProps {
  profileId: string | null;
  daysBack?: number;
}

export function MobileCarousel({ profileId, daysBack = 7 }: MobileCarouselProps): React.ReactElement {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,         // No looping for 2 slides
    dragFree: false,     // Snap to slides
    startIndex: 0,       // NAV-03: Default to heatmap (slide 1)
    duration: 25,        // Smooth animation (default)
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Track slide changes for dot indicator
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect(); // Set initial state
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div className="embla">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {/* Slide 1: Heatmap */}
          <div className="flex-[0_0_100%] min-w-0">
            <MobileHeatmap profileId={profileId} daysBack={daysBack} />
          </div>
          {/* Slide 2: Muscle List */}
          <div className="flex-[0_0_100%] min-w-0">
            <MobileMuscleList profileId={profileId} daysBack={daysBack} />
          </div>
        </div>
      </div>
      {/* Dot indicators - NAV-02 */}
      <DotIndicators count={2} selected={selectedIndex} onSelect={(i) => emblaApi?.scrollTo(i)} />
    </div>
  );
}
```

### Pattern 2: Dot Indicators Component

**What:** Simple dot navigation for 2 slides
**When to use:** Carousel pagination
**Example:**
```typescript
// Source: Adapted from https://www.jkturner.site/tutorials/ui-enhancements/embla-setup
interface DotIndicatorsProps {
  count: number;
  selected: number;
  onSelect: (index: number) => void;
}

function DotIndicators({ count, selected, onSelect }: DotIndicatorsProps): React.ReactElement {
  return (
    <div className="flex justify-center gap-2 py-4">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`
            w-2 h-2 rounded-full transition-all duration-200
            ${index === selected
              ? 'bg-amber-500 w-4'
              : 'bg-primary-600 active:bg-primary-500'
            }
          `}
          aria-label={`Go to slide ${index + 1}`}
          aria-current={index === selected ? 'true' : undefined}
        />
      ))}
    </div>
  );
}
```

### Pattern 3: Required CSS for Embla

**What:** Minimal CSS structure for carousel to work
**When to use:** Always with embla-carousel
**Example:**
```css
/* These classes are critical for Embla to function */
.embla__viewport {
  overflow: hidden;
}

.embla__container {
  display: flex;
  touch-action: pan-y pinch-zoom; /* Allow vertical scroll, prevent horizontal browser scroll */
}

.embla__slide {
  flex: 0 0 100%;
  min-width: 0; /* Prevent flex item from overflowing */
}
```

With Tailwind (no separate CSS needed):
```tsx
<div className="overflow-hidden" ref={emblaRef}>
  <div className="flex touch-pan-y">
    <div className="flex-[0_0_100%] min-w-0">{/* slide */}</div>
  </div>
</div>
```

### Anti-Patterns to Avoid
- **Setting `loop: true` with 2 slides:** Known bug in Embla - looping breaks with only 2 slides
- **Using `dragFree: true`:** Causes slides to stop mid-transition; we want snap behavior
- **Forgetting `min-w-0`:** Flex children can overflow without this
- **Missing `touch-action: pan-y`:** Causes vertical scroll to be blocked on mobile
- **Nesting data fetching:** Both slides already fetch data - don't refetch in carousel

## Don't Hand-Roll

Problems that have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Touch swipe physics | Custom onTouchStart/Move/End | embla-carousel-react | Momentum, deceleration, snap physics are subtle |
| iOS Safari quirks | Manual workarounds | embla-carousel-react | Library handles touch event differences |
| Slide transitions | CSS animations + state | embla-carousel-react | Hardware-accelerated transforms built-in |
| Swipe direction detection | Touch delta calculation | embla-carousel-react | Handles edge cases (diagonal swipe, velocity) |
| Scroll conflict | preventDefault logic | touch-action CSS | Browser handles it natively |

**Key insight:** The 2-slide simplicity is deceptive. The swipe UX quality comes from physics (momentum, snap-back, velocity detection) which is hard to perfect manually. Embla gives this for ~7KB.

## Common Pitfalls

### Pitfall 1: Loop Mode with 2 Slides

**What goes wrong:** Carousel behaves erratically or gets stuck
**Why it happens:** Embla's loop creates clones; with only 2 slides there aren't enough for smooth looping
**How to avoid:** Always set `loop: false` for 2-slide carousels
**Warning signs:** Slides snap to wrong positions or animation stutters

### Pitfall 2: Vertical Scroll Blocked

**What goes wrong:** User can't scroll the page when touch starts on carousel
**Why it happens:** Default touch handling prevents all scroll
**How to avoid:** Add `touch-action: pan-y pinch-zoom` to container (or Tailwind `touch-pan-y`)
**Warning signs:** Testing on mobile - page won't scroll when starting from carousel area

### Pitfall 3: Slide Content Overflow

**What goes wrong:** MobileMuscleList (with expandable groups) makes carousel height jump
**Why it happens:** Embla doesn't auto-adjust height by default
**How to avoid:** Either (a) give carousel fixed height with internal scroll, or (b) let page scroll naturally within slide
**Warning signs:** Layout shifts when expanding muscle groups

**Recommendation:** Let MobileMuscleList expand naturally within its slide. The carousel height will be determined by the tallest content. This matches Instagram-style UX where content determines height.

### Pitfall 4: Double Data Fetching

**What goes wrong:** Both MobileHeatmap and MobileMuscleList fetch from useScientificMuscleVolume
**Why it happens:** Each component is self-contained with its own data hook
**How to avoid:** This is actually fine - TanStack Query deduplicates identical requests within the same render cycle
**Warning signs:** None - this is expected behavior

### Pitfall 5: Missing Accessibility for Indicators

**What goes wrong:** Screen readers can't navigate or understand carousel state
**Why it happens:** Dots without ARIA labels are meaningless to assistive tech
**How to avoid:** Add `aria-label` to each dot, `aria-current` to active dot
**Warning signs:** Lighthouse accessibility audit failures

### Pitfall 6: Indicator State Out of Sync

**What goes wrong:** Dot shows slide 0 while viewing slide 1 after programmatic navigation
**Why it happens:** Not listening to Embla's `select` event properly
**How to avoid:** Always update state from `emblaApi.selectedScrollSnap()` in event callback
**Warning signs:** Dots don't update when swiping

## Code Examples

Verified patterns for this implementation:

### Complete Carousel Component
```typescript
// Source: Synthesized from embla-carousel docs + project patterns
import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { MobileHeatmap } from './MobileHeatmap';
import { MobileMuscleList } from './MobileMuscleList';

interface MobileCarouselProps {
  profileId: string | null;
  daysBack?: number;
}

export function MobileCarousel({ profileId, daysBack = 7 }: MobileCarouselProps): React.ReactElement {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    startIndex: 0,  // NAV-03: Heatmap first
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  return (
    <div>
      {/* Carousel viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {/* Slide 1: Heatmap (NAV-03: default) */}
          <div className="flex-[0_0_100%] min-w-0 px-4">
            <MobileHeatmap profileId={profileId} daysBack={daysBack} />
          </div>
          {/* Slide 2: Muscle List */}
          <div className="flex-[0_0_100%] min-w-0 px-4">
            <MobileMuscleList profileId={profileId} daysBack={daysBack} />
          </div>
        </div>
      </div>

      {/* Dot indicators (NAV-02) */}
      <div className="flex justify-center gap-2 py-4" role="tablist" aria-label="Carousel navigation">
        {[0, 1].map((index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`
              h-2 rounded-full transition-all duration-200
              ${index === selectedIndex
                ? 'w-4 bg-amber-500'
                : 'w-2 bg-primary-600 active:bg-primary-500'
              }
            `}
            role="tab"
            aria-selected={index === selectedIndex}
            aria-label={index === 0 ? 'Body heatmap view' : 'Muscle list view'}
          />
        ))}
      </div>
    </div>
  );
}
```

### Mobile Touch Styles (from existing MobileHeatmap)
```typescript
// Source: src/ui/components/mobile/MobileHeatmap.tsx (lines 323-344)
// Pattern for active states on touch devices
<style>{`
  .dot-indicator:active {
    background-color: rgb(39, 39, 42); /* primary-600 */
  }

  @media (hover: hover) {
    .dot-indicator:hover {
      background-color: rgb(63, 63, 70); /* primary-500 */
    }
  }
`}</style>
```

### Embla API Methods Reference
```typescript
// Source: https://www.embla-carousel.com/api/methods/
emblaApi.scrollTo(index)           // Scroll to slide by index
emblaApi.scrollPrev()              // Go to previous slide
emblaApi.scrollNext()              // Go to next slide
emblaApi.selectedScrollSnap()      // Get current slide index (0-based)
emblaApi.scrollSnapList()          // Get array of snap point positions
emblaApi.canScrollPrev()           // Check if can scroll back
emblaApi.canScrollNext()           // Check if can scroll forward
emblaApi.on('select', callback)    // Subscribe to slide change
emblaApi.off('select', callback)   // Unsubscribe from event
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery carousels | Hook-based libraries | 2020+ | Better React integration |
| CSS scroll-snap only | JS + scroll-snap | 2022+ | Reliable indicators + API control |
| Heavy libraries (Swiper) | Lightweight (Embla) | 2023+ | ~40KB savings |
| Manual touch events | Library touch handling | Always | iOS Safari quirks handled |

**Deprecated/outdated:**
- **react-slick:** jQuery dependency, not hooks-based
- **Manual touchstart/move/end:** Too many edge cases for production quality
- **CSS-only scroll-snap:** No JS control for indicators, inconsistent mobile support

## Open Questions

Things that need design decision:

1. **Carousel height behavior**
   - What we know: MobileMuscleList expands when groups open
   - What's unclear: Should carousel have fixed height with internal scroll, or grow with content?
   - Recommendation: Let content determine height (Instagram-style). Most natural mobile UX.

2. **Swipe sensitivity tuning**
   - What we know: Embla defaults work well for most cases
   - What's unclear: Whether defaults feel right for this specific content
   - Recommendation: Use defaults initially, tune `dragThreshold` if feedback indicates too sensitive/insensitive

3. **Indicator style**
   - What we know: NAV-02 requires "dots or similar"
   - What's unclear: Exact visual treatment
   - Recommendation: Use elongated active dot (w-4) vs round inactive (w-2) for clear affordance

## Sources

### Primary (HIGH confidence)
- [Embla Carousel Official Docs](https://www.embla-carousel.com/get-started/react/) - React setup guide
- [Embla Carousel Options](https://www.embla-carousel.com/api/options/) - Configuration reference
- [Embla Carousel Events](https://www.embla-carousel.com/api/events/) - Event subscription API
- [Bundlephobia](https://bundlephobia.com/package/embla-carousel) - Bundle size verification (~7KB gzipped)
- [npm embla-carousel-react](https://www.npmjs.com/package/embla-carousel-react) - Latest version 8.6.0

### Secondary (MEDIUM confidence)
- [Embla Carousel GitHub Issues](https://github.com/davidjerleke/embla-carousel/issues) - Loop bug with 2 slides
- [How to Set Up Embla Carousel](https://www.jkturner.site/tutorials/ui-enhancements/embla-setup) - Dot indicator pattern
- [2025's Best Carousel Libraries](https://logixbuilt.com/blogs/top-carousel-js-libraries-for-2025) - Library comparison
- [Custom Swiper Tutorial](https://dominicarrojado.com/posts/how-to-create-your-own-swiper-in-react-and-typescript-with-tests-part-1/) - Touch event patterns (for understanding what Embla handles)

### Tertiary (LOW confidence)
- Community blog posts on carousel accessibility - Verified patterns but implementation details may vary

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - embla-carousel-react is well-documented, actively maintained, verified bundle size
- Architecture: HIGH - Patterns derived from official docs and existing project components
- Pitfalls: HIGH - Loop bug verified in GitHub issues, iOS quirks well-documented

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (Embla v8.x stable, low change risk)
