# Phase 9: Custom Grouping - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can customize how muscles are grouped in Settings. They can create, edit, and delete custom groups, reorder muscles within groups, and reorder groups themselves. Two special sections exist: "Ungrouped" (muscles shown at top of list) and "Hidden" (muscles excluded from list and heatmap). Maximum 8 custom groups allowed. Groupings are saved per-profile and persist across sessions.

</domain>

<decisions>
## Implementation Decisions

### Settings UI Layout
- Dedicated "Muscle Groups" section in Settings (not collapsed or separate page)
- Expandable accordion list — group name row, expand to see/edit muscles
- "+ Add Group" button at top of the section
- Inline editing when expanded — rename and manage muscles directly in place

### Muscle Assignment UX
- Picker modal for adding muscles — "+ Add Muscle" button opens modal showing available muscles
- Moving muscles: if muscle is already in another group, show confirmation "This muscle is in [Group]. Move it here?"
- X button on each muscle to remove from group
- Drag handles on muscles for reordering within group
- Drag handles on groups for reordering groups (custom groups only)

### Special Sections
- **Ungrouped section** at top (fixed position, not reorderable)
  - Muscles here appear at top of Muscle List view on main page (promoted/priority)
  - Shown in Settings so user knows what's unassigned
- **Hidden section** at bottom (fixed position, not reorderable)
  - Muscles here are excluded from Muscle List view AND heatmap body diagram
  - Shown in Settings for management

### Validation & Edge Cases
- Max 8 groups — "+ Add Group" button disabled when limit reached, shows "Max 8 groups" hint
- Groups require at least 1 muscle — can't save empty group
- Duplicate group names auto-suffixed with (2), (3), etc.
- "Reset to Defaults" button available, with confirmation dialog
- Removing last muscle from group prompts "Delete this group?"
- Deleted group's muscles move to Ungrouped
- Changes auto-save immediately (no explicit save button)
- Allow hiding/ungrouping ALL muscles (empty state is valid)

### Default Groups
- Bodybuilding split: Push, Pull, Legs, Arms, Core (5 groups)
- All 26 muscles assigned to one of these groups by default
- Every new profile gets same default configuration
- Preset options (Bodybuilder, Powerlifter, PPL) deferred to future phase

### Claude's Discretion
- Exact visual styling of drag handles
- Confirmation dialog design
- Disabled button styling for group limit
- Specific assignment of 26 muscles to 5 default groups

</decisions>

<specifics>
## Specific Ideas

- Ungrouped muscles are "promoted" — showing at top of list signals they're important enough to see immediately without expanding a group
- Hidden muscles affect the heatmap too — they're grayed out/invisible on the body diagram, not just hidden from list
- Auto-save for frictionless editing — user doesn't have to remember to save

</specifics>

<deferred>
## Deferred Ideas

- Preset group configurations (Bodybuilder, Powerlifter, PPL splits) — future enhancement
- Copy groups from another profile — not in scope

</deferred>

---

*Phase: 09-custom-grouping*
*Context gathered: 2026-01-23*
