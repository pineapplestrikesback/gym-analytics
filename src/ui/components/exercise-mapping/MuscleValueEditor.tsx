/**
 * Muscle Value Editor Component
 * Grouped number inputs for custom muscle value entry
 */

import { useState } from 'react';
import { UI_MUSCLE_GROUPS, type ScientificMuscle } from '@core/taxonomy';

interface MuscleValueEditorProps {
  values: Partial<Record<ScientificMuscle, number>>;
  onChange: (values: Partial<Record<ScientificMuscle, number>>) => void;
}

export function MuscleValueEditor({
  values,
  onChange,
}: MuscleValueEditorProps): React.ReactElement {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(UI_MUSCLE_GROUPS.map((g) => g.name))
  );

  const toggleGroup = (groupName: string): void => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const handleValueChange = (muscle: ScientificMuscle, inputValue: string): void => {
    const numValue = parseFloat(inputValue);

    // Remove muscle if value is 0 or empty
    if (inputValue === '' || numValue === 0) {
      const newValues = Object.fromEntries(
        Object.entries(values).filter(([key]) => key !== muscle)
      ) as Partial<Record<ScientificMuscle, number>>;
      onChange(newValues);
      return;
    }

    // Clamp between 0 and 1
    const clampedValue = Math.max(0, Math.min(1, numValue));
    onChange({
      ...values,
      [muscle]: clampedValue,
    });
  };

  const getGroupTotal = (muscles: readonly ScientificMuscle[]): number => {
    return muscles.reduce((sum, muscle) => sum + (values[muscle] ?? 0), 0);
  };

  const totalValue = Object.values(values).reduce((sum, val) => sum + (val ?? 0), 0);

  return (
    <div className="space-y-2">
      {/* Overall total */}
      <div className="flex items-center justify-between border-b border-zinc-700 pb-2 mb-3">
        <span className="text-sm text-zinc-400">Total muscle activation:</span>
        <span className="font-mono text-cyan-400 font-semibold">{totalValue.toFixed(2)}</span>
      </div>

      {UI_MUSCLE_GROUPS.map((group) => {
        const isExpanded = expandedGroups.has(group.name);
        const groupTotal = getGroupTotal(group.muscles);
        const hasValues = groupTotal > 0;

        return (
          <div
            key={group.name}
            className={`border rounded-lg overflow-hidden transition-colors ${
              hasValues ? 'border-cyan-500/50' : 'border-zinc-700'
            }`}
          >
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.name)}
              className="w-full flex items-center justify-between p-3 bg-zinc-800 hover:bg-zinc-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-4 h-4 text-zinc-500 transition-transform ${
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
                <span className="font-medium text-zinc-200">{group.name}</span>
              </div>
              <span
                className={`font-mono text-sm ${hasValues ? 'text-cyan-400' : 'text-zinc-600'}`}
              >
                {groupTotal.toFixed(2)}
              </span>
            </button>

            {/* Group content */}
            {isExpanded && (
              <div className="p-3 bg-zinc-850 space-y-2">
                {group.muscles.map((muscle) => (
                  <div key={muscle} className="flex items-center gap-3">
                    <label className="flex-1 text-sm text-zinc-400 truncate" title={muscle}>
                      {muscle}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={values[muscle] ?? ''}
                      onChange={(e) => handleValueChange(muscle, e.target.value)}
                      placeholder="0.00"
                      className="w-20 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-sm text-right text-zinc-100 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Help text */}
      <p className="text-xs text-zinc-500 pt-2">
        Enter values from 0.00 (no involvement) to 1.00 (primary target). Only non-zero values are
        saved.
      </p>
    </div>
  );
}
