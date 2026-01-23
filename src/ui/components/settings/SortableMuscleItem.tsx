/**
 * SortableMuscleItem
 *
 * Draggable muscle item with drag handle and remove button.
 * Uses @dnd-kit/sortable for reordering within a group.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import type { ScientificMuscle } from '@core/taxonomy';

interface SortableMuscleItemProps {
  muscle: ScientificMuscle;
  id: string;
  onRemove: (muscle: ScientificMuscle) => void;
}

export function SortableMuscleItem({
  muscle,
  id,
  onRemove,
}: SortableMuscleItemProps): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded bg-primary-800 p-2 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-primary-400 hover:text-white active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm text-white">{muscle}</span>
      <button
        type="button"
        onClick={() => onRemove(muscle)}
        className="text-primary-400 transition-colors hover:text-red-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
