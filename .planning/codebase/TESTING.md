# Testing Patterns

**Analysis Date:** 2026-01-18

## Test Framework

**Unit Testing:**

- Runner: Vitest 4
- Config: `vitest.config.ts`
- Environment: jsdom
- Assertion Library: Vitest built-in (`expect`)
- DOM Testing: `@testing-library/react`, `@testing-library/jest-dom`

**E2E Testing:**

- Runner: Playwright 1.57
- Config: `playwright.config.ts`
- Browsers: Chromium (Desktop Chrome), Mobile (iPhone 12)

**Run Commands:**

```bash
npm run test              # Run all unit tests (watch mode)
npm run test:e2e          # Run all E2E tests
npx vitest run            # Run unit tests once (no watch)
npx playwright test       # Run E2E tests
npx playwright test --ui  # Run E2E with interactive UI
```

## Test File Organization

**Unit Tests:**

- Location: Co-located in `src/core/__tests__/` directory
- Naming: `*.test.ts` pattern
- Structure:

```
src/core/
├── __tests__/
│   ├── csv-parser.test.ts
│   ├── exercise-auto-match.test.ts
│   ├── exercise-search.test.ts
│   ├── hevy-api.test.ts
│   ├── normalization.test.ts
│   ├── taxonomy.test.ts
│   └── volume-calculator.test.ts
├── taxonomy.ts
├── volume-calculator.ts
└── ...
```

**E2E Tests:**

- Location: `tests/e2e/` directory (separate from source)
- Naming: `*.spec.ts` pattern
- Structure:

```
tests/e2e/
├── exercise-mapping.spec.ts
├── exercise-mapping-data.spec.ts
├── full-mapping-flow.spec.ts
├── simple-mapping-test.spec.ts
└── verify-mapping-workflow.spec.ts
```

## Test Structure

**Unit Test Organization:**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateMuscleVolume, aggregateToFunctionalGroups } from '../volume-calculator';

describe('volume-calculator', () => {
  describe('calculateMuscleVolume', () => {
    // Setup shared test data
    const benchPressMapping: ExerciseMapping = {
      'Pectoralis Major (Sternal)': 1.0,
      'Anterior Deltoid': 0.8,
    };

    const exerciseMappings = new Map<string, ExerciseMapping>([['bench-press', benchPressMapping]]);

    it('should calculate volume for a single set', () => {
      const sets: WorkoutSet[] = [
        { exerciseId: 'bench-press', setType: 'normal', weight: 100, reps: 10 },
      ];

      const result = calculateMuscleVolume(sets, exerciseMappings);

      expect(result['Pectoralis Major (Sternal)']).toBe(1.0);
    });

    it('should exclude warmup sets', () => {
      // ...
    });
  });

  describe('aggregateToFunctionalGroups', () => {
    // Separate describe block for each function
  });
});
```

**E2E Test Organization:**

```typescript
import { test, expect } from '@playwright/test';

/**
 * E2E Test: Exercise Mapping Feature
 * Tests the complete user flow for managing exercise mappings
 */

test.describe('Exercise Mapping Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and setup
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create test profile if needed
    // ...
  });

  test('should show Manage Mappings button in Settings', async ({ page }) => {
    await page.click('a[href="/settings"]');
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();
    // ...
  });
});
```

**Patterns:**

- Use `describe` blocks to group related tests
- Nested `describe` for sub-features
- Shared test data defined at `describe` scope
- Each `it`/`test` focuses on one behavior
- Descriptive test names starting with "should"

## Mocking

**Framework:** Vitest built-in mocking (not used extensively in current tests)

**Pattern for Pure Functions:**
The codebase favors testing pure functions without mocks. Test data is created inline:

```typescript
// Create test data directly
const sets: WorkoutSet[] = [
  { exerciseId: 'bench-press', setType: 'normal', weight: 100, reps: 10 },
  { exerciseId: 'bench-press', setType: 'warmup', weight: 50, reps: 10 },
];

const exerciseMappings = new Map<string, ExerciseMapping>([
  ['bench-press', benchPressMapping],
  ['pull-up', pullUpMapping],
]);

// Test the function directly
const result = calculateMuscleVolume(sets, exerciseMappings);
```

**What to Mock:**

- External API calls (if any)
- Database operations (in integration tests)
- Browser APIs (handled by jsdom environment)

**What NOT to Mock:**

- Pure functions in `src/core/`
- Type definitions and constants
- Data transformations

**E2E Mocking (File Upload):**

```typescript
// Create and upload file in E2E test
const buffer = Buffer.from(HEVY_CSV_DATA, 'utf-8');
await fileInput.setInputFiles({
  name: 'test-hevy-export.csv',
  mimeType: 'text/csv',
  buffer: buffer,
});
```

## Fixtures and Factories

**Test Data:**
Inline data creation is preferred. No dedicated fixtures directory.

```typescript
// Inline test data at describe scope
const hevyCsv = `"title","start_time","end_time","description","exercise_title",...
"Morning workout","31 Dec 2025, 13:18","31 Dec 2025, 15:11","","Bench Press (Barbell)",...`;

// Inline object creation
const unmappedExercises: UnmappedExercise[] = [
  {
    id: '1',
    profileId: 'profile1',
    originalName: 'Reverse fly squeeze Domar',
    normalizedName: 'reverse-fly-squeeze-domar',
    firstSeenAt: new Date(),
    occurrenceCount: 5,
  },
];
```

**E2E Test Data:**

```typescript
// Sample CSV data as constant
const HEVY_CSV_DATA = `title,start_time,exercise_title,set_type,weight_kg,reps,rpe,notes
Push Day,"21 Dec 2025, 14:29",Bench Press (Wide Grip),normal,60,10,,
Push Day,"21 Dec 2025, 14:29",Bench Press (Wide Grip),normal,60,8,,`;
```

**Location:**

- Test data defined inline within test files
- No separate fixtures directory
- Constants at top of test file for reuse

## Coverage

**Requirements:** No enforced coverage threshold

**View Coverage:**

```bash
npx vitest run --coverage    # Generate coverage report
```

**Current Test Coverage Areas:**

- `src/core/` - Well tested (7 test files)
  - `volume-calculator.ts`
  - `csv-parser.ts`
  - `taxonomy.ts`
  - `normalization.ts`
  - `exercise-search.ts`
  - `exercise-auto-match.ts`
  - `hevy-api.ts`

**Not Tested (Unit):**

- `src/db/` - Database hooks (integration tests needed)
- `src/ui/` - React components (E2E covers user flows)

## Test Types

**Unit Tests:**

- Scope: Pure functions in `src/core/`
- Approach: Test inputs and outputs directly
- No React component testing
- No database operations

**Integration Tests:**

- Not formally separated
- E2E tests serve as integration tests

**E2E Tests:**

- Scope: Complete user flows
- Approach: Browser automation with Playwright
- Tests actual database (IndexedDB)
- Covers mobile responsiveness

## Common Patterns

**Async Testing:**

```typescript
// Vitest - async/await
it('should parse Hevy CSV and return correct format', () => {
  const result = parseCsv(hevyCsv);
  expect(result.format).toBe('hevy');
});

// Playwright - async by default
test('should navigate to Exercise Mapping page', async ({ page }) => {
  await page.goto('/settings/exercise-mappings');
  await expect(page).toHaveURL('/settings/exercise-mappings');
});
```

**Error Testing:**

```typescript
// Test empty/edge cases
it('should return empty array for empty CSV', () => {
  const result = parseCsv('');
  expect(result.workouts).toHaveLength(0);
  expect(result.format).toBe('unknown');
});

// Test boundary conditions
it('should handle missing weight values', () => {
  const csvWithMissingWeight = `...`;
  const result = parseCsv(csvWithMissingWeight);
  expect(result.workouts[0]?.sets[0]?.weight).toBe(0);
});
```

**Assertion Patterns:**

```typescript
// Exact equality
expect(result['Pectoralis Major (Sternal)']).toBe(1.0);

// Floating point comparison
expect(result['Anterior Deltoid']).toBeCloseTo(2.4);

// Array length
expect(result.workouts).toHaveLength(1);

// Contains
expect(SCIENTIFIC_MUSCLES).toContain('Latissimus Dorsi');

// Greater than
expect(suggestion?.confidence).toBeGreaterThanOrEqual(0.7);

// Object property
expect(suggestion).toHaveProperty('unmappedExerciseName');

// Type checking
expect(typeof suggestion?.confidence).toBe('number');
```

**Playwright Assertions:**

```typescript
// Visibility
await expect(page.locator('h1:has-text("Exercise Mapping")')).toBeVisible();

// URL
await expect(page).toHaveURL('/settings/exercise-mappings');

// CSS class
await expect(unmappedTab).toHaveClass(/bg-cyan-500/);

// Text content
await expect(manageButton).toHaveText('Manage Mappings');

// Element count
const itemCount = await exerciseItems.count();
expect(itemCount).toBeGreaterThan(0);
```

**Playwright Selectors:**

```typescript
// Text-based
page.locator('button:has-text("Unmapped")');
page.locator('h2:has-text("Settings")');

// Attribute-based
page.locator('a[href="/settings/exercise-mappings"]');
page.locator('input[type="file"]');

// Chained filters
page.locator('section').filter({ hasText: 'Exercise Mappings' });

// First match
page.locator('button').first();
```

**Screenshots for Debugging:**

```typescript
await page.screenshot({
  path: 'tests/e2e/screenshots/exercise-mapping-mobile.png',
  fullPage: true,
});
```

## Test Setup

**Vitest Setup File:** `src/test-setup.ts`

```typescript
import '@testing-library/jest-dom';
```

**Playwright Configuration:**

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**E2E Test Setup Pattern:**

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Create profile if needed
  const profileDropdown = page.locator('button').first();
  const dropdownText = await profileDropdown.textContent();

  if (dropdownText?.includes('Select Profile')) {
    // Profile creation logic
  }
});
```

## TDD Workflow

Per `CLAUDE.md`, TDD is recommended for core logic:

1. Write `.test.ts` asserting desired behavior
2. Run test (MUST fail)
3. Write minimum implementation to pass
4. Refactor

**Example TDD Flow:**

```bash
# 1. Create test file
# src/core/__tests__/new-feature.test.ts

# 2. Run tests (should fail)
npm run test

# 3. Implement feature
# src/core/new-feature.ts

# 4. Run tests (should pass)
npm run test

# 5. Refactor if needed
```

---

_Testing analysis: 2026-01-18_
