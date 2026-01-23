/**
 * MusclePickerModal
 *
 * Modal to select muscles to add to a group.
 * Groups available muscles by custom muscle groupings for consistency.
 */

import { X } from 'lucide-react';
import type { ScientificMuscle } from '@core/taxonomy';
import type { MuscleGroupConfig } from '@db/schema';

interface MusclePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableMuscles: ScientificMuscle[];
  onSelect: (muscle: ScientificMuscle) => void;
  groupConfig: MuscleGroupConfig;
}

export function MusclePickerModal({
  isOpen,
  onClose,
  availableMuscles,
  onSelect,
  groupConfig,
}: MusclePickerModalProps): React.ReactElement | null {
  if (!isOpen) {
    return null;
  }

  const availableSet = new Set(availableMuscles);

  // Group available muscles by user's custom group configuration
  const groupedMuscles: { name: string; muscles: ScientificMuscle[] }[] = [];

  // First add muscles from custom groups
  for (const group of groupConfig.groups) {
    const musclesInGroup = group.muscles.filter((m) => availableSet.has(m));
    if (musclesInGroup.length > 0) {
      groupedMuscles.push({
        name: group.name,
        muscles: musclesInGroup,
      });
    }
  }

  // Then add ungrouped muscles
  const ungroupedMuscles = groupConfig.ungrouped.filter((m) => availableSet.has(m));
  if (ungroupedMuscles.length > 0) {
    groupedMuscles.push({
      name: 'Ungrouped',
      muscles: ungroupedMuscles,
    });
  }

  // Finally add hidden muscles
  const hiddenMuscles = groupConfig.hidden.filter((m) => availableSet.has(m));
  if (hiddenMuscles.length > 0) {
    groupedMuscles.push({
      name: 'Hidden',
      muscles: hiddenMuscles,
    });
  }

  const handleSelect = (muscle: ScientificMuscle): void => {
    onSelect(muscle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-lg bg-primary-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary-600 p-4">
          <h3 className="text-lg font-semibold text-white">Add Muscle</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-primary-400 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable muscle list */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {groupedMuscles.length === 0 ? (
            <p className="py-8 text-center text-primary-300">
              All muscles are assigned
            </p>
          ) : (
            <div className="space-y-4">
              {groupedMuscles.map((group) => (
                <div key={group.name}>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-primary-400">
                    {group.name}
                  </h4>
                  <div className="space-y-1">
                    {group.muscles.map((muscle) => (
                      <button
                        key={muscle}
                        type="button"
                        onClick={() => handleSelect(muscle)}
                        className="w-full rounded px-3 py-2 text-left text-sm text-white transition-colors hover:bg-primary-700"
                      >
                        {muscle}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
