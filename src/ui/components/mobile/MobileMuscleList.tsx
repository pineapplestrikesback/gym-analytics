/**
 * Mobile Muscle List Component
 *
 * Collapsible muscle group list for mobile viewing.
 * Displays 26 muscles organized into 7 anatomical groups.
 *
 * Pattern: useState<Set<string>> for expanded state (from WeeklyGoalEditor)
 * Touch: :active pseudo-class for feedback (MOBILE-02)
 */

import { useState } from 'react';
import { UI_MUSCLE_GROUPS } from '@core/taxonomy';

interface MobileMuscleListProps {
  profileId: string | null;
  daysBack?: number;
}

/**
 * Mobile muscle list with collapsible groups.
 * First group starts expanded for mobile-optimized viewing.
 */
export function MobileMuscleList({
  profileId: _profileId,
  daysBack: _daysBack = 7,
}: MobileMuscleListProps): React.ReactElement {
  // Start with first group expanded (mobile-optimized: less initial scrolling)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const firstGroup = UI_MUSCLE_GROUPS[0];
    return firstGroup ? new Set([firstGroup.name]) : new Set();
  });

  const toggleGroup = (groupName: string): void => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="space-y-2">
      {UI_MUSCLE_GROUPS.map((group) => {
        const isExpanded = expandedGroups.has(group.name);

        return (
          <div
            key={group.name}
            className="rounded-lg overflow-hidden border border-primary-700"
          >
            {/* Group header - tap to toggle */}
            <button
              onClick={() => toggleGroup(group.name)}
              className="w-full flex items-center gap-3 p-3 bg-primary-800 transition-colors active:bg-primary-700"
            >
              {/* Chevron icon - rotates when expanded */}
              <svg
                className={`w-4 h-4 text-primary-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>

              {/* Group name */}
              <span className="font-medium text-white">{group.name}</span>

              {/* Muscle count badge */}
              <span className="ml-auto text-xs text-primary-400">
                {group.muscles.length} muscles
              </span>
            </button>

            {/* Group content - conditionally rendered */}
            {isExpanded && (
              <div className="bg-primary-900 p-3 space-y-2">
                {group.muscles.map((muscle) => (
                  <div
                    key={muscle}
                    className="flex items-center justify-between py-2 px-3 rounded bg-primary-800/50"
                  >
                    {/* Muscle name */}
                    <span className="text-sm text-primary-200">{muscle}</span>

                    {/* Placeholder for progress bar (Plan 02) */}
                    <span className="text-xs text-primary-500">--</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
