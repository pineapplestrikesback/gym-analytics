/**
 * Main Layout Component
 * Provides the app shell with header and navigation
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { ProfileSwitcher } from '../components/ProfileSwitcher';
import { OfflineIndicator } from '../components/OfflineIndicator';

export function MainLayout(): React.ReactElement {
  const location = useLocation();

  const isActive = (path: string): boolean => location.pathname === path;

  return (
    <div className="min-h-screen bg-primary-800">
      {/* Header */}
      <header className="border-b border-primary-600 bg-primary-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center gap-3">
            <span className="text-2xl">🏋️</span>
            <h1 className="text-xl font-bold text-white">GymAnalytics</h1>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  isActive('/') ? 'text-white' : 'text-primary-200 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/settings"
                className={`text-sm font-medium transition-colors ${
                  isActive('/settings') ? 'text-white' : 'text-primary-200 hover:text-white'
                }`}
              >
                Settings
              </Link>
            </div>
            <ProfileSwitcher />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
