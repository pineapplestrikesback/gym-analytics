/**
 * Weekly Goal Editor Component
 * Grouped number inputs for weekly set goals per muscle
 *
 * Uses custom muscle group configuration from profile.
 * Ungrouped muscles appear at top, hidden muscles excluded.
 */

import { useState, useEffect } from 'react';
import type { ScientificMuscle } from '@core/taxonomy';
import { DEFAULT_MUSCLE_GOAL, DEFAULT_TOTAL_GOAL } from '@db/schema';
import { useEffectiveMuscleGroupConfig } from '@db/hooks/useMuscleGroups';

interface WeeklyGoalEditorProps {
  profileId: string | null;
  goals: Partial<Record<ScientificMuscle, number>>;
  totalGoal: number;
  onSave: (goals: Partial<Record<ScientificMuscle, number>>, totalGoal: number) => Promise<void>;
  isSaving: boolean;
}

export function WeeklyGoalEditor({
  profileId,
  goals,
  totalGoal,
  onSave,
  isSaving,
}: WeeklyGoalEditorProps): React.ReactElement {
  const { config, isLoading: configLoading } = useEffectiveMuscleGroupConfig(profileId);

  const [localGoals, setLocalGoals] = useState(goals);
  const [localTotalGoal, setLocalTotalGoal] = useState(totalGoal);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize expanded groups when config loads (expand first group by default)
  useEffect(() => {
    const firstGroup = config.groups[0];
    if (!configLoading && firstGroup) {
      setExpandedGroups(new Set([firstGroup.id]));
    }
  }, [config.groups, configLoading]);

  const toggleGroup = (groupId: string): void => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleValueChange = (muscle: ScientificMuscle, inputValue: string): void => {
    if (inputValue === '') {
      // Remove muscle goal to fall back to default
      const newGoals = Object.fromEntries(
        Object.entries(localGoals).filter(([key]) => key !== muscle)
      ) as Partial<Record<ScientificMuscle, number>>;
      setLocalGoals(newGoals);
      return;
    }

    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 0) return;

    setLocalGoals({
      ...localGoals,
      [muscle]: numValue,
    });
  };

  const handleTotalGoalChange = (inputValue: string): void => {
    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setLocalTotalGoal(numValue);
    }
  };

  const handleSave = async (): Promise<void> => {
    setSaveSuccess(false);
    await onSave(localGoals, localTotalGoal);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = (): void => {
    setLocalGoals({});
    setLocalTotalGoal(DEFAULT_TOTAL_GOAL);
  };

  const getGroupTotal = (muscles: readonly ScientificMuscle[]): number => {
    return muscles.reduce(
      (sum, muscle) => sum + (localGoals[muscle] ?? DEFAULT_MUSCLE_GOAL),
      0
    );
  };

  // Render a muscle input row
  const renderMuscleInput = (muscle: ScientificMuscle): React.ReactElement => (
    <div key={muscle} className="flex items-center gap-3">
      <label
        className="flex-1 text-sm text-primary-200 truncate"
        title={muscle}
      >
        {muscle}
      </label>
      <input
        type="number"
        min="0"
        value={localGoals[muscle] ?? ''}
        onChange={(e) => handleValueChange(muscle, e.target.value)}
        placeholder={DEFAULT_MUSCLE_GOAL.toString()}
        className="w-20 px-2 py-1.5 bg-primary-800 border border-primary-600 rounded font-mono text-sm text-right text-white placeholder-primary-400 focus:border-cyan-500 focus:outline-none transition-colors"
      />
    </div>
  );

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-300 border-t-white" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Weekly Goal */}
      <div className="border border-cyan-500/50 rounded-lg p-4 bg-primary-800">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Total Weekly Goal
            </label>
            <p className="text-xs text-primary-300">
              Overall target for total sets per week
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={localTotalGoal}
              onChange={(e) => handleTotalGoalChange(e.target.value)}
              className="w-24 px-3 py-2 bg-primary-900 border border-primary-600 rounded font-mono text-lg text-right text-white placeholder-primary-400 focus:border-cyan-500 focus:outline-none transition-colors"
            />
            <span className="text-primary-300 text-sm">sets</span>
          </div>
        </div>
      </div>

      {/* Ungrouped muscles (no accordion, shown at top) */}
      {config.ungrouped.length > 0 && (
        <div className="border border-primary-600 rounded-lg overflow-hidden">
          <div className="p-3 bg-primary-800">
            <span className="text-sm font-medium text-primary-300">Priority Muscles</span>
          </div>
          <div className="p-3 bg-primary-900 space-y-2">
            {config.ungrouped.map(renderMuscleInput)}
          </div>
        </div>
      )}

      {/* Muscle Groups */}
      <div className="space-y-2">
        {config.groups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const groupTotal = getGroupTotal(group.muscles);

          return (
            <div
              key={group.id}
              className="border border-primary-600 rounded-lg overflow-hidden"
            >
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between p-3 bg-primary-800 hover:bg-primary-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-4 h-4 text-primary-400 transition-transform ${
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
                  <span className="font-medium text-white">{group.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400">
                    {groupTotal}
                  </span>
                  <span className="text-primary-300 text-sm">sets</span>
                </div>
              </button>

              {/* Group content */}
              {isExpanded && (
                <div className="p-3 bg-primary-900 space-y-2">
                  {group.muscles.map(renderMuscleInput)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hidden muscles info */}
      {config.hidden.length > 0 && (
        <p className="text-xs text-primary-400 italic">
          {config.hidden.length} hidden muscle(s) not shown. Unhide in Settings to set goals.
        </p>
      )}

      {/* Help text */}
      <p className="text-xs text-primary-300">
        Enter custom goals per muscle (default: {DEFAULT_MUSCLE_GOAL} sets/week). Leave blank to
        use default.
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="rounded bg-cyan-500 px-6 py-2 font-medium text-black transition-colors hover:bg-cyan-400 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Goals'}
        </button>
        <button
          onClick={handleReset}
          disabled={isSaving}
          className="rounded bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
        >
          Reset to Defaults
        </button>
        {saveSuccess && <span className="text-sm text-green-400">Saved!</span>}
      </div>
    </div>
  );
}
