/**
 * MuscleGroupEditor
 *
 * Main accordion UI for editing muscle groups.
 * Features:
 * - Add/delete/rename custom groups (up to 8)
 * - Drag-and-drop reordering of groups
 * - Drag-and-drop muscles between groups and ungrouped
 * - Hidden section (fixed at bottom)
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
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, RotateCcw, ChevronRight, GripVertical } from 'lucide-react';
import {
  useEffectiveMuscleGroupConfig,
  useMuscleGroupMutations,
} from '@db/hooks/useMuscleGroups';
import { MAX_GROUPS, moveMuscle } from '@core/muscle-groups';
import { SCIENTIFIC_MUSCLES, type ScientificMuscle } from '@core/taxonomy';
import type { MuscleGroupConfig, CustomMuscleGroup } from '@db/schema';
import { SortableGroupRow } from './SortableGroupRow';
import { SortableMuscleItem } from './SortableMuscleItem';
import { ConfirmationDialog } from './ConfirmationDialog';
import { MusclePickerModal } from './MusclePickerModal';

interface MuscleGroupEditorProps {
  profileId: string;
}

// Container IDs for muscle drag-drop
const UNGROUPED_CONTAINER = 'container:ungrouped';

// Prefix muscle IDs to distinguish from group IDs
const muscleId = (muscle: ScientificMuscle): string => `muscle:${muscle}`;
const getMuscleFromId = (id: string): ScientificMuscle | null => {
  if (id.startsWith('muscle:')) {
    return id.slice(7) as ScientificMuscle;
  }
  return null;
};

// Find which container a muscle belongs to
const findMuscleContainer = (
  config: MuscleGroupConfig,
  muscle: ScientificMuscle
): string | null => {
  if (config.ungrouped.includes(muscle)) {
    return UNGROUPED_CONTAINER;
  }
  for (const group of config.groups) {
    if (group.muscles.includes(muscle)) {
      return group.id;
    }
  }
  return null;
};

export function MuscleGroupEditor({
  profileId,
}: MuscleGroupEditorProps): React.ReactElement {
  const { config, isLoading, isUsingDefault } =
    useEffectiveMuscleGroupConfig(profileId);
  const { saveConfig, resetToDefaults, isSaving } =
    useMuscleGroupMutations(profileId);

  // Local state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [ungroupedExpanded, setUngroupedExpanded] = useState(true);
  const [hiddenExpanded, setHiddenExpanded] = useState(false);
  const [ungroupedPickerOpen, setUngroupedPickerOpen] = useState(false);
  const [activeMuscle, setActiveMuscle] = useState<ScientificMuscle | null>(null);
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before drag starts
      },
    }),
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

  // Handle drag start (for overlay and group collapse)
  const handleDragStart = (event: DragStartEvent): void => {
    const { active } = event;
    const muscle = getMuscleFromId(active.id as string);
    setActiveMuscle(muscle);
    // If not a muscle, it's a group - collapse all groups during drag
    setIsDraggingGroup(!muscle);
  };

  // Handle drag end - unified for groups and muscles
  const handleDragEnd = (event: DragEndEvent): void => {
    setActiveMuscle(null);
    setIsDraggingGroup(false);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if this is a muscle drag
    const activeMuscle = getMuscleFromId(activeId);
    if (activeMuscle) {
      handleMuscleDragEnd(activeMuscle, overId);
      return;
    }

    // Otherwise it's a group drag
    if (activeId !== overId) {
      const oldIndex = config.groups.findIndex((g) => g.id === activeId);
      const newIndex = config.groups.findIndex((g) => g.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedGroups = arrayMove(config.groups, oldIndex, newIndex);
        void save({ ...config, groups: reorderedGroups });
      }
    }
  };

  // Handle muscle drag end
  const handleMuscleDragEnd = (muscle: ScientificMuscle, overId: string): void => {
    const sourceContainer = findMuscleContainer(config, muscle);
    if (!sourceContainer) return;

    // Check if dropped on ungrouped container or a muscle in ungrouped
    const overMuscle = getMuscleFromId(overId);
    let targetContainer: string;
    let targetIndex: number | null = null;

    if (overId === UNGROUPED_CONTAINER) {
      targetContainer = UNGROUPED_CONTAINER;
    } else if (overMuscle) {
      // Dropped on another muscle - find its container
      const overContainer = findMuscleContainer(config, overMuscle);
      if (overContainer) {
        targetContainer = overContainer;
        // Find index to insert at
        if (targetContainer === UNGROUPED_CONTAINER) {
          targetIndex = config.ungrouped.indexOf(overMuscle);
        } else {
          const group = config.groups.find((g) => g.id === targetContainer);
          if (group) {
            targetIndex = group.muscles.indexOf(overMuscle);
          }
        }
      } else {
        return;
      }
    } else {
      // Dropped on a group container (group ID)
      targetContainer = overId;
    }

    // Same container - reorder
    if (sourceContainer === targetContainer) {
      if (targetContainer === UNGROUPED_CONTAINER) {
        const oldIndex = config.ungrouped.indexOf(muscle);
        const newIndex = targetIndex ?? config.ungrouped.length - 1;
        if (oldIndex !== newIndex) {
          const reordered = arrayMove(config.ungrouped, oldIndex, newIndex);
          void save({ ...config, ungrouped: reordered });
        }
      } else {
        const group = config.groups.find((g) => g.id === targetContainer);
        if (group) {
          const oldIndex = group.muscles.indexOf(muscle);
          const newIndex = targetIndex ?? group.muscles.length - 1;
          if (oldIndex !== newIndex) {
            const reordered = arrayMove(group.muscles, oldIndex, newIndex);
            const updatedGroups = config.groups.map((g) =>
              g.id === targetContainer ? { ...g, muscles: reordered } : g
            );
            void save({ ...config, groups: updatedGroups });
          }
        }
      }
    } else {
      // Different container - move
      if (targetContainer === UNGROUPED_CONTAINER) {
        const newConfig = moveMuscle(config, muscle, { type: 'ungrouped' });
        // If we have a target index, reorder within ungrouped
        if (targetIndex !== null && targetIndex !== newConfig.ungrouped.length - 1) {
          const currentIndex = newConfig.ungrouped.indexOf(muscle);
          newConfig.ungrouped = arrayMove(newConfig.ungrouped, currentIndex, targetIndex);
        }
        void save(newConfig);
      } else {
        const newConfig = moveMuscle(config, muscle, { type: 'group', groupId: targetContainer });
        // If we have a target index, reorder within the group
        if (targetIndex !== null) {
          const group = newConfig.groups.find((g) => g.id === targetContainer);
          if (group) {
            const currentIndex = group.muscles.indexOf(muscle);
            if (currentIndex !== targetIndex) {
              group.muscles = arrayMove(group.muscles, currentIndex, targetIndex);
            }
          }
        }
        void save(newConfig);
      }
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
    // Add new group at TOP so it's visible immediately
    void save({ ...config, groups: [newGroup, ...config.groups] });
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

  // Handle remove muscle from group (moves to ungrouped)
  const handleRemoveMuscleFromGroup = (muscle: ScientificMuscle): void => {
    const newConfig = moveMuscle(config, muscle, { type: 'ungrouped' });
    void save(newConfig);
  };

  // Handle add muscle to group (moves from any location)
  const handleAddMuscleToGroup = (muscle: ScientificMuscle, groupId: string): void => {
    const newConfig = moveMuscle(config, muscle, { type: 'group', groupId });
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

  // Get available muscles for a specific group (all muscles NOT already in this group)
  const getAvailableMusclesForGroup = (
    groupId: string
  ): ScientificMuscle[] => {
    const currentGroup = config.groups.find((g) => g.id === groupId);
    const currentGroupMuscles = new Set<ScientificMuscle>(currentGroup?.muscles ?? []);
    return SCIENTIFIC_MUSCLES.filter((m) => !currentGroupMuscles.has(m));
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

      {/* Unified DndContext for both groups and muscles */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Ungrouped section (sortable muscles) */}
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
                These muscles appear at the top of your muscle list. Drag muscles here or between groups.
              </p>
              <SortableContext
                items={config.ungrouped.map(muscleId)}
                strategy={verticalListSortingStrategy}
                id={UNGROUPED_CONTAINER}
              >
                <div className="space-y-2 min-h-[40px]">
                  {config.ungrouped.map((muscle) => (
                    <SortableMuscleItem
                      key={muscle}
                      muscle={muscle}
                      id={muscleId(muscle)}
                      onRemove={handleRemoveFromUngrouped}
                    />
                  ))}
                  {config.ungrouped.length === 0 && (
                    <div className="rounded border border-dashed border-primary-600 p-2 text-center text-xs text-primary-500">
                      Drop muscles here
                    </div>
                  )}
                </div>
              </SortableContext>
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

        {/* Custom groups (sortable groups with sortable muscles inside) */}
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
                onRemoveMuscle={handleRemoveMuscleFromGroup}
                onAddMuscle={handleAddMuscleToGroup}
                availableMuscles={getAvailableMusclesForGroup(group.id)}
                groupConfig={config}
                muscleIdFn={muscleId}
                forceCollapsed={isDraggingGroup}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag overlay for visual feedback */}
        <DragOverlay>
          {activeMuscle && (
            <div className="flex items-center gap-2 rounded bg-primary-700 p-2 shadow-lg opacity-90">
              <GripVertical className="h-4 w-4 text-primary-400" />
              <span className="text-sm text-white">{activeMuscle}</span>
            </div>
          )}
        </DragOverlay>
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
        groupConfig={config}
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
