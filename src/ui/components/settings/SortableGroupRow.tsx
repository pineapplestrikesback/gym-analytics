/**
 * SortableGroupRow
 *
 * Draggable group row with expand/collapse, inline rename, and nested sortable for muscles.
 * Uses @dnd-kit/sortable for group reordering and muscle reordering within.
 */

import { useState, type KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { GripVertical, ChevronRight, Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import type { CustomMuscleGroup } from '@db/schema';
import type { ScientificMuscle } from '@core/taxonomy';
import { SortableMuscleItem } from './SortableMuscleItem';
import { MusclePickerModal } from './MusclePickerModal';
import { ConfirmationDialog } from './ConfirmationDialog';

interface SortableGroupRowProps {
  group: CustomMuscleGroup;
  onUpdate: (group: CustomMuscleGroup) => void;
  onDelete: (groupId: string) => void;
  onRemoveMuscle: (muscle: ScientificMuscle) => void;
  onAddMuscle: (muscle: ScientificMuscle, groupId: string) => void;
  availableMuscles: ScientificMuscle[];
}

export function SortableGroupRow({
  group,
  onUpdate,
  onDelete,
  onRemoveMuscle,
  onAddMuscle,
  availableMuscles,
}: SortableGroupRowProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Sensors for muscle drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSaveName = (): void => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== group.name) {
      onUpdate({ ...group, name: trimmedName });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (): void => {
    setEditName(group.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteClick = (): void => {
    if (group.muscles.length > 0) {
      setConfirmDelete(true);
    } else {
      onDelete(group.id);
    }
  };

  const handleRemoveMuscle = (muscle: ScientificMuscle): void => {
    // Move muscle to ungrouped section via parent callback
    onRemoveMuscle(muscle);
  };

  const handleAddMuscle = (muscle: ScientificMuscle): void => {
    // Use parent callback which handles moving from other locations via moveMuscle
    onAddMuscle(muscle, group.id);
  };

  const handleMuscleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = group.muscles.indexOf(active.id as ScientificMuscle);
      const newIndex = group.muscles.indexOf(over.id as ScientificMuscle);
      const reordered = arrayMove(group.muscles, oldIndex, newIndex);
      onUpdate({ ...group, muscles: reordered });
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`rounded-lg bg-primary-700 ${isDragging ? 'opacity-50' : ''}`}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 p-3">
          {/* Drag handle */}
          <button
            type="button"
            className="cursor-grab touch-none text-primary-400 hover:text-white active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Expand/collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary-400 transition-transform hover:text-white"
          >
            <ChevronRight
              className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>

          {/* Group name (editable) */}
          {isEditing ? (
            <div className="flex flex-1 items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveName}
                autoFocus
                className="flex-1 rounded border border-primary-500 bg-primary-800 px-2 py-1 text-white focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="text-green-400 hover:text-green-300"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-primary-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                onDoubleClick={() => setIsEditing(true)}
                className="flex-1 text-left"
              >
                <span className="font-medium text-white">{group.name}</span>
              </button>
              {/* Muscle count badge */}
              <span className="rounded-full bg-primary-600 px-2 py-0.5 text-xs text-primary-300">
                {group.muscles.length}
              </span>
              {/* Edit button */}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-primary-400 transition-colors hover:text-white"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {/* Delete button */}
              <button
                type="button"
                onClick={handleDeleteClick}
                className="text-primary-400 transition-colors hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-primary-600 p-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleMuscleDragEnd}
            >
              <SortableContext
                items={group.muscles}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {group.muscles.map((muscle) => (
                    <SortableMuscleItem
                      key={muscle}
                      muscle={muscle}
                      onRemove={handleRemoveMuscle}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add muscle button */}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-dashed border-primary-500 p-2 text-sm text-primary-300 transition-colors hover:border-cyan-400 hover:text-cyan-400"
            >
              <Plus className="h-4 w-4" />
              Add Muscle
            </button>
          </div>
        )}
      </div>

      {/* Muscle picker modal */}
      <MusclePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        availableMuscles={availableMuscles}
        onSelect={handleAddMuscle}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        isOpen={confirmDelete}
        title="Delete Group?"
        message={`"${group.name}" contains ${group.muscles.length} muscle(s). They will be moved to Ungrouped.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete(group.id);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
