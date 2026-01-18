/**
 * Device Detection Hook
 *
 * Detects mobile phones via user agent. Deliberately excludes tablets
 * (iPad, Android tablets) so they get the desktop experience with more
 * screen real estate.
 *
 * Uses useMemo for stable value across renders - no useEffect or resize
 * listeners needed since user agent doesn't change during session.
 */

import { useMemo } from 'react';

/**
 * Mobile phone user agent patterns.
 * Excludes iPad and Android tablets (they get desktop view).
 */
const MOBILE_PHONE_PATTERN = /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;

/**
 * Detects if the current device is a mobile phone.
 *
 * @returns true if mobile phone, false for desktop/tablet or SSR
 */
export function useIsMobileDevice(): boolean {
  return useMemo(() => {
    // Handle SSR case where navigator is undefined
    if (typeof navigator === 'undefined') {
      return false;
    }

    return MOBILE_PHONE_PATTERN.test(navigator.userAgent);
  }, []);
}
