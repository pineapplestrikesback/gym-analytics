/**
 * useResponsiveVariant Hook
 * Detects desktop vs mobile breakpoint using matchMedia
 */

import { useEffect, useState } from 'react';

interface ResponsiveVariant {
  isDesktop: boolean;
  isMobile: boolean;
}

/**
 * Hook to determine if the viewport is desktop or mobile
 * Uses Tailwind's lg breakpoint (1024px)
 */
export function useResponsiveVariant(): ResponsiveVariant {
  const [isDesktop, setIsDesktop] = useState(() => {
    // Initialize with matchMedia if available (SSR safety)
    if (typeof window !== 'undefined') {
      return window.matchMedia('(min-width: 1024px)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    // Update state when media query changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return {
    isDesktop,
    isMobile: !isDesktop,
  };
}
