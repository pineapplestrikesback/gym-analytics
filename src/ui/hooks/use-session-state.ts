/**
 * Session State Hook
 *
 * Provides session-scoped state persistence using sessionStorage.
 * State persists across navigation within the same tab but resets on:
 * - Page refresh
 * - Tab close
 * - Opening the same URL in a new tab
 *
 * Follows TOGGLE-03: View state persists within session.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for session-scoped state persistence.
 * Uses sessionStorage to persist state across navigation but clear on refresh/tab close.
 *
 * @param key - Unique key for sessionStorage
 * @param defaultValue - Default value when no stored value exists
 * @returns Tuple of [current value, setter function]
 */
export function useSessionState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    // SSR guard: Check if we're in a browser environment
    if (typeof window === 'undefined') return defaultValue;

    try {
      const stored = sessionStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      // Handle JSON parse errors or sessionStorage unavailability (e.g., private browsing)
      return defaultValue;
    }
  });

  const setSessionState = useCallback(
    (value: T) => {
      setState(value);
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch {
        // sessionStorage may be unavailable in private browsing mode
        // State will still work in React, just won't persist
      }
    },
    [key]
  );

  return [state, setSessionState];
}
