/**
 * Mobile Carousel Component
 *
 * Swipeable carousel container for horizontal navigation between
 * MobileHeatmap (slide 1) and MobileMuscleList (slide 2).
 *
 * Pattern: Instagram-style horizontal swipe with dot indicators
 * Library: embla-carousel-react for physics-based swipe handling
 */

import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { MobileHeatmap } from '@ui/components/mobile/MobileHeatmap';
import { MobileMuscleList } from '@ui/components/mobile/MobileMuscleList';

interface MobileCarouselProps {
  profileId: string | null;
  daysBack?: number;
}

/**
 * Mobile carousel with swipeable navigation between heatmap and muscle list.
 * NAV-01: Horizontal swipe gesture for navigation
 * NAV-02: Dot indicators track current slide position
 * NAV-03: Default to heatmap view (slide 0)
 */
export function MobileCarousel({
  profileId,
  daysBack = 7
}: MobileCarouselProps): React.ReactElement {
  // Initialize Embla with critical options
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,      // Critical: loop breaks with only 2 slides
    dragFree: false,  // Snap to slides (no free-drag)
    startIndex: 0,    // NAV-03: Default to heatmap
  });

  // Track selected slide index for dot indicators
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Update selected index when slide changes
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Subscribe to Embla's select event
  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on('select', onSelect);
    onSelect(); // Set initial state

    return (): void => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Programmatic scroll to slide
  const scrollTo = useCallback((index: number): void => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  return (
    <div>
      {/* Carousel viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {/* Slide 1: Body Heatmap (NAV-03: default view) */}
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
      <div
        className="flex justify-center gap-2 py-4"
        role="tablist"
        aria-label="Carousel navigation"
      >
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
