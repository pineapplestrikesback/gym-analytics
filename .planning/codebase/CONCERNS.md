# Codebase Concerns

**Analysis Date:** 2026-01-18

## Tech Debt

**Debug Page in Production:**

- Issue: Debug route `/debug` is exposed in production bundle
- Files: `src/App.tsx`, `src/ui/pages/Debug.tsx`
- Impact: Exposes internal volume calculation debugging tools to users
- Fix approach: Conditionally import Debug page only in development mode using lazy loading and environment checks

**Type Coercion in BodyHighlighter:**

- Issue: Unsafe type assertion `muscle as any` to bypass TypeScript type checking
- Files: `src/ui/components/anatomy/BodyHighlighter.tsx:146`
- Impact: Loses type safety, may cause runtime errors if library API changes
- Fix approach: Create proper type mapping or extend library types

**Large Monolithic Component:**

- Issue: DefaultMappingsEditor is 1013 lines with 3 embedded tab components
- Files: `src/ui/pages/DefaultMappingsEditor.tsx`
- Impact: Difficult to maintain, test, and reason about; slow hot reload
- Fix approach: Extract `ExerciseMuscleValuesTab`, `ExerciseNameMappingsTab`, and `MuscleGroupMappingsTab` into separate files

**Inline CSS Animations:**

- Issue: CSS keyframes defined in JavaScript strings inside components
- Files: `src/ui/pages/DefaultMappingsEditor.tsx:221-233`, `src/ui/components/MuscleHeatmap.tsx:640-657`
- Impact: Cannot be optimized by build tools, duplicated across renders
- Fix approach: Move animations to `src/index.css` or create dedicated CSS modules

## Known Bugs

**No known critical bugs identified during analysis.**

## Security Considerations

**API Key Storage:**

- Risk: Hevy API keys stored in plain text in IndexedDB
- Files: `src/db/schema.ts:54` (hevyApiKey field), `src/db/hooks/useHevySync.ts`
- Current mitigation: Local-first PWA, data stays on device
- Recommendations: Consider encrypting sensitive fields; add warning in UI about key visibility in browser dev tools

**No Input Sanitization on CSV Import:**

- Risk: CSV parser processes user-uploaded files without validation
- Files: `src/core/parsers/csv-parser.ts`
- Current mitigation: Data stays local, no server-side processing
- Recommendations: Add file size limits; validate expected column structure before processing

**CORS-Dependent External API:**

- Risk: Hevy API calls made directly from browser; API key exposed in network requests
- Files: `src/core/parsers/hevy-api.ts:128-133`
- Current mitigation: API key belongs to user, not shared
- Recommendations: Document that users should treat API key as sensitive; consider proxy option for future

## Performance Bottlenecks

**Unbounded Workout Fetch:**

- Problem: `fetchAllWorkouts` fetches all pages without limit
- Files: `src/core/parsers/hevy-api.ts:178-198`
- Cause: No maximum page limit; users with years of data may trigger hundreds of API calls
- Improvement path: Add pagination limit with UI to load more; cache results in IndexedDB

**Repeated Database Queries in Loop:**

- Problem: `useHevySync` makes individual DB queries per workout in transaction
- Files: `src/db/hooks/useHevySync.ts:116-141`
- Cause: Sequential `db.workouts.get()` calls inside loop
- Improvement path: Bulk fetch existing workouts by IDs, then batch insert/update

**MuscleHeatmap Re-renders:**

- Problem: Complex useMemo calculations on every stats change
- Files: `src/ui/components/MuscleHeatmap.tsx:230-268`
- Cause: Nested loops creating region stats from muscle stats on each render
- Improvement path: Pre-compute region groupings; memoize at hook level

## Fragile Areas

**Exercise Mapping Resolution Chain:**

- Files: `src/db/utils/mapping-resolver.ts`, `src/db/hooks/useVolumeStats.ts`
- Why fragile: Multi-layered fallback logic (user mapping -> default override -> JSON config)
- Safe modification: Add comprehensive unit tests before changing; trace data flow carefully
- Test coverage: Limited - only E2E tests cover this flow

**Hevy API Integration:**

- Files: `src/core/parsers/hevy-api.ts`, `src/db/hooks/useHevySync.ts`
- Why fragile: Depends on undocumented third-party API; no versioning contract
- Safe modification: Test against live API before release; add response validation
- Test coverage: Mocked tests exist in `src/core/__tests__/hevy-api.test.ts` but may not match real API

## Scaling Limits

**IndexedDB Storage:**

- Current capacity: Depends on browser (typically 50MB-unlimited based on disk)
- Limit: No quota management; will fail silently if storage exhausted
- Scaling path: Add storage quota monitoring; implement data pruning for old workouts

**In-Memory Stats Calculation:**

- Current capacity: Works for typical user with <1000 workouts
- Limit: Performance degrades with thousands of workouts due to client-side aggregation
- Scaling path: Pre-aggregate stats in IndexedDB; update incrementally on sync

## Dependencies at Risk

**react-body-highlighter:**

- Risk: External library with limited maintenance; custom fork may be needed
- Impact: MuscleHeatmap and BodyHighlighter depend on specific API shape
- Migration plan: Vendor the SVG assets; create custom highlighting logic if library breaks

**Hevy API Dependency:**

- Risk: Third-party API without SLA; may change or be discontinued
- Impact: Primary data import mechanism would break
- Migration plan: CSV import serves as backup; document API behavior for future compatibility

## Missing Critical Features

**No Data Export:**

- Problem: Users cannot export their workout data
- Blocks: Data portability; backup capabilities

**No Error Boundary:**

- Problem: Unhandled component errors crash entire app
- Blocks: Graceful degradation; error reporting

**No Offline Sync Queue:**

- Problem: Hevy sync fails silently when offline
- Blocks: True offline-first experience with background sync

## Test Coverage Gaps

**Database Hooks Not Unit Tested:**

- What's not tested: All 13 TanStack Query hooks in `src/db/hooks/`
- Files: `src/db/hooks/useWorkouts.ts`, `src/db/hooks/useVolumeStats.ts`, etc.
- Risk: Regression in data fetching/caching logic undetected
- Priority: High

**UI Components Not Unit Tested:**

- What's not tested: All 25 React components in `src/ui/components/`
- Files: `src/ui/components/MuscleHeatmap.tsx`, `src/ui/components/ProfileSwitcher.tsx`, etc.
- Risk: Visual/interaction regressions undetected
- Priority: Medium

**Volume Calculator Edge Cases:**

- What's not tested: Zero values, negative numbers, missing muscle mappings
- Files: `src/core/volume-calculator.ts`, `src/core/__tests__/volume-calculator.test.ts`
- Risk: Incorrect volume calculations for edge cases
- Priority: Medium

**Mapping Resolver Integration:**

- What's not tested: Full resolution chain with all override layers
- Files: `src/db/utils/mapping-resolver.ts`
- Risk: Incorrect muscle attribution when custom mappings conflict
- Priority: High

---

_Concerns audit: 2026-01-18_
