/**
 * MuscleGroupEditor
 *
 * Main accordion UI for editing muscle groups.
 * Features:
 * - Add/delete/rename custom groups (up to 8)
 * - Drag-and-drop reordering of groups
 * - Ungrouped section (fixed at top, not sortable)
 * - Hidden section (fixed at bottom, not sortable)
 * - Reset to defaults with confirmation
 * - Auto-save on every change
 */

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, RotateCcw, ChevronRight, X } from 'lucide-react';
import {
  useEffectiveMuscleGroupConfig,
  useMuscleGroupMutations,
} from '@db/hooks/useMuscleGroups';
import { MAX_GROUPS, moveMuscle } from '@core/muscle-groups';
import { SCIENTIFIC_MUSCLES, type ScientificMuscle } from '@core/taxonomy';
import type { MuscleGroupConfig, CustomMuscleGroup } from '@db/schema';
import { SortableGroupRow } from './SortableGroupRow';
import { ConfirmationDialog } from './ConfirmationDialog';
import { MusclePickerModal } from './MusclePickerModal';

interface MuscleGroupEditorProps {
  profileId: string;
}

export function MuscleGroupEditor({
  profileId,
}: MuscleGroupEditorProps): React.ReactElement {
  const { config, isLoading, isUsingDefault } =
    useEffectiveMuscleGroupConfig(profileId);
  const { saveConfig, resetToDefaults, isSaving } =
    useMuscleGroupMutations(profileId);

  // Local state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [ungroupedExpanded, setUngroupedExpanded] = useState(false);
  const [hiddenExpanded, setHiddenExpanded] = useState(false);
  const [ungroupedPickerOpen, setUngroupedPickerOpen] = useState(false);

  // Sensors for group drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate available muscles for each context
  const allAssignedMuscles = useMemo(() => {
    const assigned = new Set<ScientificMuscle>();
    config.groups.forEach((g) => g.muscles.forEach((m) => assigned.add(m)));
    config.ungrouped.forEach((m) => assigned.add(m));
    config.hidden.forEach((m) => assigned.add(m));
    return assigned;
  }, [config]);

  // Muscles available for ungrouped section (in hidden or unassigned)
  const musclesAvailableForUngrouped = useMemo(() => {
    return SCIENTIFIC_MUSCLES.filter(
      (m) => config.hidden.includes(m) || !allAssignedMuscles.has(m)
    );
  }, [config, allAssignedMuscles]);

  // Save wrapper that handles errors
  const save = useCallback(
    async (newConfig: MuscleGroupConfig): Promise<void> => {
      try {
        await saveConfig(newConfig);
      } catch (err) {
        console.error('Failed to save muscle group config:', err);
      }
    },
    [saveConfig]
  );

  // Handle group drag end
  const handleGroupDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = config.groups.findIndex((g) => g.id === active.id);
      const newIndex = config.groups.findIndex((g) => g.id === over.id);
      const reorderedGroups = arrayMove(config.groups, oldIndex, newIndex);
      void save({ ...config, groups: reorderedGroups });
    }
  };

  // Handle add new group
  const handleAddGroup = (): void => {
    if (config.groups.length >= MAX_GROUPS) return;

    const newGroup: CustomMuscleGroup = {
      id: crypto.randomUUID(),
      name: 'New Group',
      muscles: [],
    };
    void save({ ...config, groups: [...config.groups, newGroup] });
  };

  // Handle update group
  const handleUpdateGroup = (updatedGroup: CustomMuscleGroup): void => {
    const updatedGroups = config.groups.map((g) =>
      g.id === updatedGroup.id ? updatedGroup : g
    );
    void save({ ...config, groups: updatedGroups });
  };

  // Handle delete group
  const handleDeleteGroup = (groupId: string): void => {
    const groupToDelete = config.groups.find((g) => g.id === groupId);
    if (!groupToDelete) return;

    // Move muscles to ungrouped
    const updatedUngrouped = [...config.ungrouped, ...groupToDelete.muscles];
    const updatedGroups = config.groups.filter((g) => g.id !== groupId);
    void save({ ...config, groups: updatedGroups, ungrouped: updatedUngrouped });
  };

  // Handle remove from ungrouped
  const handleRemoveFromUngrouped = (muscle: ScientificMuscle): void => {
    const newConfig = moveMuscle(config, muscle, { type: 'hidden' });
    void save(newConfig);
  };

  // Handle add to ungrouped
  const handleAddToUngrouped = (muscle: ScientificMuscle): void => {
    const newConfig = moveMuscle(config, muscle, { type: 'ungrouped' });
    void save(newConfig);
  };

  // Handle remove from hidden (restore to ungrouped)
  const handleRestoreFromHidden = (muscle: ScientificMuscle): void => {
    const newConfig = moveMuscle(config, muscle, { type: 'ungrouped' });
    void save(newConfig);
  };

  // Handle reset to defaults
  const handleReset = async (): Promise<void> => {
    try {
      await resetToDefaults();
      setShowResetConfirm(false);
    } catch (err) {
      console.error('Failed to reset to defaults:', err);
    }
  };

  // Get available muscles for a specific group (excludes muscles in other groups)
  const getAvailableMusclesForGroup = (
    groupId: string
  ): ScientificMuscle[] => {
    const otherGroupMuscles = new Set<ScientificMuscle>();
    config.groups
      .filter((g) => g.id !== groupId)
      .forEach((g) => g.muscles.forEach((m) => otherGroupMuscles.add(m)));

    return SCIENTIFIC_MUSCLES.filter(
      (m) =>
        !otherGroupMuscles.has(m) &&
        (config.ungrouped.includes(m) ||
          config.hidden.includes(m) ||
          !allAssignedMuscles.has(m))
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-300 border-t-white" />
      </div>
    );
  }

  const atMaxGroups = config.groups.length >= MAX_GROUPS;

  return (
    <div className="space-y-4">
      {/* Header with Add Group button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-primary-300">
          {config.groups.length} of {MAX_GROUPS} groups
        </div>
        <button
          type="button"
          onClick={handleAddGroup}
          disabled={atMaxGroups || isSaving}
          title={atMaxGroups ? 'Max 8 groups' : 'Add a new group'}
          className="flex items-center gap-1 rounded bg-cyan-500 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Group
        </button>
      </div>

      {/* Ungrouped section (fixed, not sortable) */}
      {config.ungrouped.length > 0 && (
        <div className="rounded-lg border border-primary-600 bg-primary-800">
          <button
            type="button"
            onClick={() => setUngroupedExpanded(!ungroupedExpanded)}
            className="flex w-full items-center gap-2 p-3"
          >
            <ChevronRight
              className={`h-5 w-5 text-primary-400 transition-transform ${
                ungroupedExpanded ? 'rotate-90' : ''
              }`}
            />
            <span className="font-medium text-amber-400">Ungrouped</span>
            <span className="ml-auto rounded-full bg-primary-600 px-2 py-0.5 text-xs text-primary-300">
              {config.ungrouped.length}
            </span>
          </button>
          {ungroupedExpanded && (
            <div className="border-t border-primary-600 p-3">
              <p className="mb-3 text-xs text-primary-400">
                These muscles appear at the top of your muscle list.
              </p>
              <div className="space-y-2">
                {config.ungrouped.map((muscle) => (
                  <div
                    key={muscle}
                    className="flex items-center gap-2 rounded bg-primary-700 p-2"
                  >
                    <span className="flex-1 text-sm text-white">{muscle}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromUngrouped(muscle)}
                      title="Move to Hidden"
                      className="text-primary-400 transition-colors hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {musclesAvailableForUngrouped.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUngroupedPickerOpen(true)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-dashed border-primary-500 p-2 text-sm text-primary-300 transition-colors hover:border-cyan-400 hover:text-cyan-400"
                >
                  <Plus className="h-4 w-4" />
                  Add Muscle
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Custom groups (sortable) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleGroupDragEnd}
      >
        <SortableContext
          items={config.groups.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {config.groups.map((group) => (
              <SortableGroupRow
                key={group.id}
                group={group}
                onUpdate={handleUpdateGroup}
                onDelete={handleDeleteGroup}
                availableMuscles={getAvailableMusclesForGroup(group.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {config.groups.length === 0 && (
        <div className="rounded-lg border border-dashed border-primary-600 p-8 text-center text-primary-400">
          No groups yet. Click &quot;Add Group&quot; to create one.
        </div>
      )}

      {/* Hidden section (fixed, not sortable) */}
      {config.hidden.length > 0 && (
        <div className="rounded-lg border border-primary-600 bg-primary-800">
          <button
            type="button"
            onClick={() => setHiddenExpanded(!hiddenExpanded)}
            className="flex w-full items-center gap-2 p-3"
          >
            <ChevronRight
              className={`h-5 w-5 text-primary-400 transition-transform ${
                hiddenExpanded ? 'rotate-90' : ''
              }`}
            />
            <span className="font-medium text-primary-400">Hidden</span>
            <span className="ml-auto rounded-full bg-primary-600 px-2 py-0.5 text-xs text-primary-300">
              {config.hidden.length}
            </span>
          </button>
          {hiddenExpanded && (
            <div className="border-t border-primary-600 p-3">
              <p className="mb-3 text-xs text-primary-400">
                These muscles are hidden from the muscle list and heatmap.
              </p>
              <div className="space-y-2">
                {config.hidden.map((muscle) => (
                  <div
                    key={muscle}
                    className="flex items-center gap-2 rounded bg-primary-700 p-2"
                  >
                    <span className="flex-1 text-sm text-white">{muscle}</span>
                    <button
                      type="button"
                      onClick={() => handleRestoreFromHidden(muscle)}
                      title="Restore to Ungrouped"
                      className="text-primary-400 transition-colors hover:text-green-400"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reset to defaults */}
      {!isUsingDefault && (
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isSaving}
            className="flex items-center gap-2 text-sm text-primary-400 transition-colors hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
        </div>
      )}

      {/* Picker for ungrouped section */}
      <MusclePickerModal
        isOpen={ungroupedPickerOpen}
        onClose={() => setUngroupedPickerOpen(false)}
        availableMuscles={musclesAvailableForUngrouped}
        onSelect={handleAddToUngrouped}
      />

      {/* Reset confirmation dialog */}
      <ConfirmationDialog
        isOpen={showResetConfirm}
        title="Reset to Defaults?"
        message="This will replace your custom groups with the default Push/Pull/Legs/Core configuration. This action cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={() => void handleReset()}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
