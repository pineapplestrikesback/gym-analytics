/**
 * OfflineIndicator Component
 * Shows a badge when the app is offline
 */

import { useState, useEffect } from 'react';

export function OfflineIndicator(): React.ReactElement | null {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-lg bg-accent-orange px-4 py-2 text-sm font-medium text-white shadow-lg">
      Offline Mode
    </div>
  );
}
