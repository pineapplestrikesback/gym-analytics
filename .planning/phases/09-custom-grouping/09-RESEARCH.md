# Phase 9: Custom Grouping - Research

**Researched:** 2026-01-23
**Domain:** React state management, drag-and-drop reordering, IndexedDB persistence
**Confidence:** HIGH

## Summary

Custom grouping enables users to organize 26 scientific muscles into user-defined groups for display in the mobile muscle list and heatmap. The codebase already has infrastructure for muscle grouping via `UI_MUSCLE_GROUPS` (static) and `Profile.muscleGroupCustomization` (per-profile overrides mapping muscles to FunctionalGroups).

The current implementation maps individual muscles to predefined functional groups. Phase 9 requires a more flexible approach: user-defined custom groups with ordering, plus special "Ungrouped" and "Hidden" sections. This requires a new data structure that stores group definitions, muscle assignments, and ordering.

**Primary recommendation:** Extend the Profile schema with a `customMuscleGroups` field storing ordered groups with ordered muscle lists. Use @dnd-kit/sortable for drag-and-drop reordering. Auto-save on every change using existing `useUpdateProfile` hook.

## Current State Analysis

### Existing Muscle Group System

**Static UI Groups** (`src/core/taxonomy.ts`):
```typescript
export type UIMuscleGroup = 'Back' | 'Chest' | 'Shoulders' | 'Arms' | 'Legs' | 'Core';

export const UI_MUSCLE_GROUPS: readonly { name: UIMuscleGroup; muscles: readonly ScientificMuscle[] }[] = [
  { name: 'Back', muscles: ['Latissimus Dorsi', 'Upper Trapezius', ...] },
  // ... 6 groups total
];
```

**Per-Profile Customization** (`src/db/schema.ts`):
```typescript
muscleGroupCustomization: Partial<Record<ScientificMuscle, FunctionalGroup>>;
```
- Maps individual muscles to existing FunctionalGroups (17 predefined options)
- Used in `useVolumeStats.ts` and `DefaultMappingsEditor.tsx`
- Does NOT support custom group names, ordering, or hiding

### Consumers of Grouping Data

| Component | File | Current Usage |
|-----------|------|---------------|
| MobileMuscleList | `src/ui/components/mobile/MobileMuscleList.tsx` | Iterates `UI_MUSCLE_GROUPS` statically |
| MobileHeatmap | `src/ui/components/mobile/MobileHeatmap.tsx` | Uses `REGION_TO_MUSCLES` (hardcoded) |
| WeeklyGoalEditor | `src/ui/components/WeeklyGoalEditor.tsx` | Iterates `UI_MUSCLE_GROUPS` |
| MuscleValueEditor | `src/ui/components/exercise-mapping/MuscleValueEditor.tsx` | Iterates `UI_MUSCLE_GROUPS` |
| DefaultMappingsEditor | `src/ui/pages/DefaultMappingsEditor.tsx` | Uses `muscleGroupCustomization` |

### Key Insight: Different Concepts

The CONTEXT.md decisions establish a **new grouping system** distinct from existing:
- **FunctionalGroups** (17 predefined): Used for aggregating scientific muscles in reporting
- **UIMuscleGroups** (6 predefined): Used for organizing muscle editors/displays
- **CustomGroups** (Phase 9): User-defined groups for the mobile muscle list view

Phase 9 custom groups are specifically for the **mobile muscle list UI**, not for volume calculation or functional grouping.

## Database Schema Design

### Recommended Schema Extension

Add new field to Profile interface:

```typescript
// src/db/schema.ts

/**
 * User-defined muscle group configuration
 */
export interface CustomMuscleGroup {
  id: string;           // Unique identifier (for drag-drop keys)
  name: string;         // Display name (user-editable)
  muscles: ScientificMuscle[];  // Ordered list of muscles in this group
}

/**
 * Complete muscle grouping configuration
 */
export interface MuscleGroupConfig {
  groups: CustomMuscleGroup[];      // Ordered custom groups (max 8)
  ungrouped: ScientificMuscle[];    // Muscles shown at top (promoted)
  hidden: ScientificMuscle[];       // Muscles excluded from list/heatmap
}

// Profile interface extension
export interface Profile {
  // ... existing fields ...
  customMuscleGroups?: MuscleGroupConfig;  // Optional, defaults to preset
}
```

### Default Configuration

When `customMuscleGroups` is undefined/null, use the default:

```typescript
// src/core/taxonomy.ts or new file

export const DEFAULT_MUSCLE_GROUP_CONFIG: MuscleGroupConfig = {
  groups: [
    {
      id: 'default-push',
      name: 'Push',
      muscles: [
        'Pectoralis Major (Sternal)',
        'Pectoralis Major (Clavicular)',
        'Anterior Deltoid',
        'Lateral Deltoid',
        'Triceps (Lateral/Medial)',
        'Triceps (Long Head)',
      ],
    },
    {
      id: 'default-pull',
      name: 'Pull',
      muscles: [
        'Latissimus Dorsi',
        'Upper Trapezius',
        'Middle Trapezius',
        'Lower Trapezius',
        'Posterior Deltoid',
        'Biceps Brachii',
        'Forearm Flexors',
        'Forearm Extensors',
      ],
    },
    {
      id: 'default-legs',
      name: 'Legs',
      muscles: [
        'Quadriceps (Vasti)',
        'Quadriceps (RF)',
        'Gluteus Maximus',
        'Gluteus Medius',
        'Hamstrings',
        'Adductors',
        'Gastrocnemius',
        'Soleus',
      ],
    },
    {
      id: 'default-arms',
      name: 'Arms',
      muscles: [], // All arm muscles are in Push/Pull
    },
    {
      id: 'default-core',
      name: 'Core',
      muscles: [
        'Rectus Abdominis',
        'Obliques',
        'Hip Flexors',
        'Erector Spinae',
      ],
    },
  ].filter(g => g.muscles.length > 0), // Remove empty groups
  ungrouped: [],
  hidden: [],
};
```

### No Schema Migration Needed

The new field is optional with a default. Existing profiles work unchanged:
- `profile.customMuscleGroups === undefined` => use DEFAULT_MUSCLE_GROUP_CONFIG
- No Dexie version bump required for additive optional fields

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | ^6.x | Drag-drop primitives | Modern, maintained, accessible, 10kb |
| @dnd-kit/sortable | ^8.x | Sortable list preset | Built on core, handles reordering |
| @dnd-kit/utilities | ^3.x | CSS transform utilities | Smooth animations |

### Supporting (Already in Project)

| Library | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-query | ^5.90 | State invalidation on save |
| dexie | ^4.2 | IndexedDB persistence |
| lucide-react | ^0.562 | Icons (GripVertical for drag handles) |

### Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Bundle impact:** ~15kb total (core + sortable + utilities)

## Architecture Patterns

### Recommended File Structure

```
src/
├── core/
│   └── muscle-groups.ts           # DEFAULT config, validation, types
├── db/
│   ├── schema.ts                  # Profile interface update
│   └── hooks/
│       └── useMuscleGroups.ts     # New hook for group operations
├── ui/
│   ├── components/
│   │   └── settings/
│   │       ├── MuscleGroupEditor.tsx    # Main accordion UI
│   │       ├── MuscleGroupRow.tsx       # Single group accordion item
│   │       ├── MuscleItem.tsx           # Single muscle (draggable)
│   │       ├── MusclePickerModal.tsx    # Modal to add muscles
│   │       └── ConfirmationDialog.tsx   # Shared confirmation dialog
│   └── pages/
│       └── Settings.tsx           # Add "Muscle Groups" section
```

### Pattern 1: Computed Effective Config

Always compute effective config from profile + defaults:

```typescript
// src/db/hooks/useMuscleGroups.ts

export function useEffectiveMuscleGroupConfig(
  profileId: string | null
): MuscleGroupConfig {
  const { profile } = useProfile(profileId);

  return useMemo(() => {
    if (!profile?.customMuscleGroups) {
      return DEFAULT_MUSCLE_GROUP_CONFIG;
    }
    return profile.customMuscleGroups;
  }, [profile?.customMuscleGroups]);
}
```

### Pattern 2: Auto-Save Mutations

Auto-save on every change (no explicit save button):

```typescript
// src/db/hooks/useMuscleGroups.ts

export function useMuscleGroupMutations(profileId: string | null) {
  const { updateProfile } = useUpdateProfile();
  const { profile } = useProfile(profileId);
  const queryClient = useQueryClient();

  const saveConfig = useCallback(async (config: MuscleGroupConfig) => {
    if (!profile) return;
    await updateProfile({
      ...profile,
      customMuscleGroups: config,
    });
  }, [profile, updateProfile]);

  // Debounce for rapid reordering
  const debouncedSave = useMemo(
    () => debounce(saveConfig, 300),
    [saveConfig]
  );

  return { saveConfig: debouncedSave };
}
```

### Pattern 3: DnD-Kit Sortable Setup

```typescript
// src/ui/components/settings/MuscleGroupEditor.tsx

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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

function MuscleGroupEditor({ config, onConfigChange }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = config.groups.findIndex(g => g.id === active.id);
      const newIndex = config.groups.findIndex(g => g.id === over.id);
      onConfigChange({
        ...config,
        groups: arrayMove(config.groups, oldIndex, newIndex),
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={config.groups.map(g => g.id)}
        strategy={verticalListSortingStrategy}
      >
        {config.groups.map(group => (
          <SortableGroupRow key={group.id} group={group} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Pattern 4: Nested Sortable (Muscles within Groups)

Each expanded group has its own SortableContext for muscles:

```typescript
// src/ui/components/settings/MuscleGroupRow.tsx

function MuscleGroupRow({ group, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMuscleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = group.muscles.indexOf(active.id as ScientificMuscle);
      const newIndex = group.muscles.indexOf(over.id as ScientificMuscle);
      onUpdate({
        ...group,
        muscles: arrayMove(group.muscles, oldIndex, newIndex),
      });
    }
  };

  return (
    // Group header with drag handle...
    {isExpanded && (
      <DndContext onDragEnd={handleMuscleDragEnd}>
        <SortableContext items={group.muscles}>
          {group.muscles.map(muscle => (
            <SortableMuscleItem key={muscle} muscle={muscle} />
          ))}
        </SortableContext>
      </DndContext>
    )}
  );
}
```

### Anti-Patterns to Avoid

- **Storing muscle order in multiple places:** Single source of truth in `customMuscleGroups`
- **Mutating state directly:** Always create new objects for React state updates
- **Missing keys in sortable lists:** Use stable IDs, not array indices
- **Blocking UI during save:** Optimistic updates with background persistence

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-drop reordering | Custom drag handlers | @dnd-kit/sortable | Accessibility, animations, edge cases |
| Debouncing saves | Custom setTimeout | lodash.debounce or useDebouncedCallback | Memory leaks, stale closures |
| Unique IDs | Math.random() | Existing generateId() from schema.ts | Consistent ID generation |
| Modal state | Custom portal | Existing modal patterns (MuscleDetailModal) | Consistent UI patterns |

**Key insight:** The codebase has established patterns for modals, buttons, and accordion UIs. Reuse these rather than creating new designs.

## Common Pitfalls

### Pitfall 1: Muscle in Multiple Places

**What goes wrong:** User drags muscle to new group but it stays in old group too
**Why it happens:** Forgetting to remove muscle from source when moving
**How to avoid:** Helper function that handles move atomically:

```typescript
function moveMuscle(
  config: MuscleGroupConfig,
  muscle: ScientificMuscle,
  toGroupId: string | 'ungrouped' | 'hidden'
): MuscleGroupConfig {
  // Remove from all groups first
  const cleanedGroups = config.groups.map(g => ({
    ...g,
    muscles: g.muscles.filter(m => m !== muscle),
  }));
  const cleanedUngrouped = config.ungrouped.filter(m => m !== muscle);
  const cleanedHidden = config.hidden.filter(m => m !== muscle);

  // Add to target
  if (toGroupId === 'ungrouped') {
    return { ...config, groups: cleanedGroups, ungrouped: [...cleanedUngrouped, muscle], hidden: cleanedHidden };
  }
  // ... etc
}
```

**Warning signs:** Muscle count > 26, muscle appears twice in list

### Pitfall 2: Empty Groups After Muscle Removal

**What goes wrong:** User removes last muscle, group becomes orphaned
**Why it happens:** CONTEXT.md requires: "Removing last muscle from group prompts 'Delete this group?'"
**How to avoid:** Check muscle count before removal, show confirmation if count === 1

### Pitfall 3: Stale Config on Rapid Changes

**What goes wrong:** User reorders quickly, earlier saves overwrite later ones
**Why it happens:** Multiple async saves racing
**How to avoid:** Debounce saves, use optimistic local state

### Pitfall 4: Missing Muscles After Default Reset

**What goes wrong:** Some muscles missing from UI after "Reset to Defaults"
**Why it happens:** Default config doesn't include all 26 muscles
**How to avoid:** Validation that ensures all SCIENTIFIC_MUSCLES are accounted for:

```typescript
function validateConfig(config: MuscleGroupConfig): boolean {
  const allMuscles = new Set([
    ...config.groups.flatMap(g => g.muscles),
    ...config.ungrouped,
    ...config.hidden,
  ]);
  return allMuscles.size === SCIENTIFIC_MUSCLES.length;
}
```

## Integration Points

### MobileMuscleList Changes

Current:
```typescript
// Iterates static UI_MUSCLE_GROUPS
{UI_MUSCLE_GROUPS.map((group) => ...)}
```

Required:
```typescript
// Use effective config from profile
const { config } = useEffectiveMuscleGroupConfig(profileId);

// Render ungrouped first (promoted)
{config.ungrouped.map(muscle => <MuscleRow key={muscle} ... />)}

// Then custom groups
{config.groups.map(group => (
  <GroupAccordion key={group.id} group={group} />
))}

// Hidden muscles: don't render at all
```

### MobileHeatmap Changes

Hidden muscles should be grayed out or invisible on the body diagram:

```typescript
const { config } = useEffectiveMuscleGroupConfig(profileId);
const hiddenMuscles = new Set(config.hidden);

// In region stats calculation
if (hiddenMuscles.has(muscle)) {
  // Skip or use special "hidden" color
}
```

### Settings Page Addition

Add new section between "Weekly Goals" and "Exercise Mappings":

```tsx
{/* Muscle Groups Section */}
<section className="rounded-lg bg-primary-700 p-6">
  <h3 className="mb-4 text-lg font-semibold text-white">Muscle Groups</h3>
  <p className="mb-4 text-sm text-primary-300">
    Customize how muscles are organized in the muscle list.
  </p>
  <MuscleGroupEditor profileId={currentProfile.id} />
</section>
```

## Code Examples

### Sortable Item with Drag Handle

```typescript
// src/ui/components/settings/SortableMuscleItem.tsx

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

interface Props {
  muscle: ScientificMuscle;
  onRemove: () => void;
}

export function SortableMuscleItem({ muscle, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: muscle });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-primary-800 rounded"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-primary-400 hover:text-white cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Muscle name */}
      <span className="flex-1 text-sm text-white">{muscle}</span>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-1 text-primary-400 hover:text-red-400"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

### Confirmation Dialog

```typescript
// src/ui/components/settings/ConfirmationDialog.tsx

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-primary-800 rounded-lg p-6 max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-primary-300">{message}</p>
        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-primary-300 hover:text-white"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-cyan-500 text-black rounded hover:bg-cyan-400"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2022 (deprecated) | Must use dnd-kit or hello-pangea/dnd |
| Static muscle groups | Profile-stored config | Phase 9 | Enables personalization |
| Manual save buttons | Auto-save with debounce | Modern UX | Reduces user friction |

**Deprecated/outdated:**
- react-beautiful-dnd: Deprecated by Atlassian, use @dnd-kit instead
- react-sortable-hoc: Replaced by @dnd-kit/sortable

## Validation Requirements

### GROUP-02: Each muscle belongs to exactly one group

```typescript
function getMuscleLocation(
  config: MuscleGroupConfig,
  muscle: ScientificMuscle
): string | null {
  if (config.ungrouped.includes(muscle)) return 'ungrouped';
  if (config.hidden.includes(muscle)) return 'hidden';
  const group = config.groups.find(g => g.muscles.includes(muscle));
  return group?.id ?? null;
}

function validateNoOverlap(config: MuscleGroupConfig): boolean {
  const seen = new Set<ScientificMuscle>();
  const all = [
    ...config.groups.flatMap(g => g.muscles),
    ...config.ungrouped,
    ...config.hidden,
  ];
  for (const m of all) {
    if (seen.has(m)) return false;
    seen.add(m);
  }
  return true;
}
```

### GROUP-04: Maximum 8 groups

```typescript
const MAX_GROUPS = 8;

function canAddGroup(config: MuscleGroupConfig): boolean {
  return config.groups.length < MAX_GROUPS;
}
```

### GROUP-05: Persistence per profile

Already handled by storing in `Profile.customMuscleGroups` field.

## Open Questions

1. **Should WeeklyGoalEditor also use custom groups?**
   - Current: Uses static UI_MUSCLE_GROUPS
   - Question: Should it respect user's custom grouping?
   - Recommendation: Keep separate for now (different purpose)

2. **Heatmap hidden muscle appearance**
   - Options: Gray out, fully invisible, or unchanged
   - Recommendation: Gray out (user can still see body shape)

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/core/taxonomy.ts`, `src/db/schema.ts`, `src/ui/components/mobile/MobileMuscleList.tsx`
- @dnd-kit official docs: [docs.dndkit.com/presets/sortable](https://docs.dndkit.com/presets/sortable)

### Secondary (MEDIUM confidence)
- [npm trends comparison](https://npmtrends.com/@dnd-kit/core-vs-react-beautiful-dnd-vs-react-dnd-vs-react-drag-and-drop-vs-react-draggable-vs-react-file-drop)
- [dnd-kit vs react-beautiful-dnd discussion](https://github.com/clauderic/dnd-kit/discussions/481)

### Tertiary (LOW confidence)
- [Top 5 Drag-and-Drop Libraries for React 2025](https://dev.to/puckeditor/top-5-drag-and-drop-libraries-for-react-24lb)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @dnd-kit is well-documented and maintained
- Architecture: HIGH - Follows existing codebase patterns
- Pitfalls: HIGH - Based on direct code analysis
- Database design: HIGH - Additive change, no migration needed

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain)

---

## RESEARCH COMPLETE

**Phase:** 9 - Custom Grouping
**Confidence:** HIGH

### Key Findings

1. **Existing infrastructure exists** for muscle grouping (`UI_MUSCLE_GROUPS`, `muscleGroupCustomization`) but Phase 9 requires a new, more flexible schema for custom groups with ordering
2. **@dnd-kit is the recommended library** for drag-and-drop reordering - modern, maintained, accessible, ~15kb total
3. **No schema migration needed** - new `customMuscleGroups` field is optional with sensible defaults
4. **Three integration points** must be updated: MobileMuscleList, MobileHeatmap (for hidden muscles), Settings page
5. **Critical validation**: Each muscle must belong to exactly one location (group, ungrouped, or hidden)

### File Created

`.planning/phases/09-custom-grouping/09-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | @dnd-kit is industry standard, well-documented |
| Architecture | HIGH | Follows existing TanStack Query + Dexie patterns |
| Database | HIGH | Additive optional field, no migration |
| Pitfalls | HIGH | Based on direct codebase analysis |
| Integration | HIGH | Clear consumer components identified |

### Open Questions

- WeeklyGoalEditor grouping: Keep separate or sync with custom groups?
- Heatmap hidden style: Gray out vs invisible

### Ready for Planning

Research complete. Planner can now create PLAN.md files.
