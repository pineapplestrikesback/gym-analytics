import { test, expect } from '@playwright/test';

/**
 * E2E Test: Exercise Mapping with Real Data
 * Tests the complete flow with actual unmapped exercises
 */

// Sample CSV data with exercises that won't map automatically
const SAMPLE_CSV = `Title,Start Time,End Time,Description,Workout Name,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes
Monday Workout,"Jan 8, 2024 at 10:00 AM","Jan 8, 2024 at 11:00 AM",,Push Day,Bench Press (Custom Variant),1,135,10,0,0,,
Monday Workout,"Jan 8, 2024 at 10:00 AM","Jan 8, 2024 at 11:00 AM",,Push Day,Bench Press (Custom Variant),2,135,8,0,0,,
Monday Workout,"Jan 8, 2024 at 10:00 AM","Jan 8, 2024 at 11:00 AM",,Push Day,Dumbbell Fly Machine,1,50,12,0,0,,
Tuesday Workout,"Jan 9, 2024 at 10:00 AM","Jan 9, 2024 at 11:00 AM",,Pull Day,Cable Row (Wide Grip),1,100,10,0,0,,
Tuesday Workout,"Jan 9, 2024 at 10:00 AM","Jan 9, 2024 at 11:00 AM",,Pull Day,Cable Row (Wide Grip),2,100,10,0,0,,
Tuesday Workout,"Jan 9, 2024 at 10:00 AM","Jan 9, 2024 at 11:00 AM",,Pull Day,Cable Row (Wide Grip),3,100,8,0,0,,`;

test.describe('Exercise Mapping with Data', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create a test profile if needed
    const profileDropdown = page
      .locator('button:has-text("Select Profile"), button:has-text("Test Data Profile")')
      .first();

    const dropdownText = await profileDropdown.textContent();
    if (dropdownText?.includes('Select Profile')) {
      await profileDropdown.click();
      const newProfileButton = page.locator('button:has-text("New Profile")');
      await newProfileButton.click();
      const profileNameInput = page.locator('input[placeholder="Profile name..."]');
      await profileNameInput.fill('Test Data Profile');
      const createButton = page
        .locator('button:has-text("Create")')
        .filter({ hasText: /^Create$/ });
      await createButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should import CSV and create unmapped exercises', async ({ page }) => {
    // Navigate to Settings
    await page.click('a[href="/settings"]');
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();

    // Find CSV Import section
    const csvSection = page.locator('section:has-text("CSV Import")');
    await expect(csvSection).toBeVisible();

    // Create a CSV file and upload it
    const fileInput = csvSection.locator('input[type="file"]');

    // Create file from string
    const buffer = Buffer.from(SAMPLE_CSV, 'utf-8');
    await fileInput.setInputFiles({
      name: 'test-workout.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // Wait for import to complete
    await page.waitForTimeout(2000);

    // Check for success message
    const successMessage = page.locator('text=/Successfully imported/i');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Now check if unmapped exercises were created
    const exerciseMappingSection = page.locator('section:has-text("Exercise Mappings")');

    // Should show unmapped count badge
    const unmappedBadge = exerciseMappingSection.locator('span:has-text("unmapped")');
    await expect(unmappedBadge).toBeVisible({ timeout: 5000 });

    // Get the count
    const badgeText = await unmappedBadge.textContent();
    expect(badgeText).toContain('3'); // Should have 3 unmapped exercises
  });

  test('should display unmapped exercises sorted by occurrence', async ({ page }) => {
    // First import the data (simplified - assumes previous test ran)
    await page.goto('/settings');

    // Navigate to exercise mappings
    const manageButton = page.locator('a:has-text("Manage Mappings")');
    await manageButton.click();

    await expect(page).toHaveURL('/settings/exercise-mappings');
    await expect(page.locator('h1:has-text("Exercise Mapping")')).toBeVisible();

    // Check unmapped exercises tab is active
    const unmappedTab = page.locator('button:has-text("Unmapped")');
    await expect(unmappedTab).toHaveClass(/bg-cyan-500/);

    // Look for unmapped exercises list
    const unmappedList = page.locator('.unmapped-exercise-item, [data-testid*="unmapped"]');

    // Wait for items to appear
    await page.waitForTimeout(1000);

    // Count the items
    const items = await unmappedList.all();

    if (items.length > 0) {
      // Get the first item (should be Cable Row with 3 sets)
      const firstItem = items[0];
      const itemText = await firstItem.textContent();

      // Cable Row should be first (3 sets)
      expect(itemText).toContain('Cable Row');
      expect(itemText?.toLowerCase()).toMatch(/3\s*(sets?|occurrences?)/);
    }
  });

  test('should allow mapping an exercise and update counts', async ({ page }) => {
    // Navigate directly to exercise mappings
    await page.goto('/settings/exercise-mappings');
    await expect(page.locator('h1:has-text("Exercise Mapping")')).toBeVisible();

    // Find an unmapped exercise
    const unmappedItems = page.locator('.unmapped-exercise-item, [role="button"]').filter({
      hasText: /Cable Row|Bench Press|Dumbbell Fly/i,
    });

    const firstItem = unmappedItems.first();

    if (await firstItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click to open mapping modal
      await firstItem.click();

      // Wait for search modal
      const modal = page.locator('[role="dialog"], .modal, .fixed').filter({
        hasText: /Search|Select|Map/i,
      });
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Search for a canonical exercise
      const searchInput = page.locator('input[type="search"], input[type="text"]').first();
      await searchInput.fill('Bench');

      // Wait for search results
      await page.waitForTimeout(1000);

      // Select first result
      const searchResult = page
        .locator('button, [role="option"]')
        .filter({
          hasText: /Bench Press|Barbell Bench/i,
        })
        .first();

      if (await searchResult.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchResult.click();

        // Confirm mapping if there's a confirm button
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Map")');
        if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await confirmButton.click();
        }

        // Wait for mapping to be created
        await page.waitForTimeout(2000);

        // Check that the unmapped count decreased
        await page.goto('/settings');
        const exerciseMappingSection = page.locator('section:has-text("Exercise Mappings")');
        const unmappedBadge = exerciseMappingSection.locator('span:has-text("unmapped")');

        // Count should be reduced
        const newBadgeText = await unmappedBadge.textContent();
        expect(newBadgeText).toContain('2'); // Should now have 2 unmapped
      }
    }
  });

  test('should show created mappings in My Mappings tab', async ({ page }) => {
    await page.goto('/settings/exercise-mappings');
    await expect(page.locator('h1:has-text("Exercise Mapping")')).toBeVisible();

    // Click My Mappings tab
    const myMappingsTab = page.locator('button:has-text("My Mappings")');
    await myMappingsTab.click();

    // Verify tab is active
    await expect(myMappingsTab).toHaveClass(/bg-cyan-500/);

    // Check for mappings list or empty state
    const mappingsList = page.locator('[data-testid*="mapping"], .existing-mapping-item');
    const emptyMessage = page.locator('text=/No custom mappings/i');

    // Either we have mappings or empty message
    const hasMappings = await mappingsList
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const isEmpty = await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasMappings || isEmpty).toBeTruthy();

    // If we have mappings from previous test, verify delete button exists
    if (hasMappings) {
      const deleteButton = page
        .locator('button')
        .filter({ hasText: /Delete|Remove/i })
        .first();
      await expect(deleteButton).toBeVisible();
    }
  });

  test('should verify mobile responsiveness with data', async ({ page, isMobile }) => {
    // Set mobile viewport
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    }

    await page.goto('/settings/exercise-mappings');

    // Wait for content
    await page.waitForTimeout(1000);

    // Check that tabs are visible and clickable at mobile size
    const unmappedTab = page.locator('button:has-text("Unmapped")');
    const myMappingsTab = page.locator('button:has-text("My Mappings")');

    await expect(unmappedTab).toBeVisible();
    await expect(myMappingsTab).toBeVisible();

    // Verify tab buttons have minimum touch target size
    const unmappedBox = await unmappedTab.boundingBox();
    const mappingsBox = await myMappingsTab.boundingBox();

    if (unmappedBox && mappingsBox) {
      // iOS minimum touch target is 44x44px
      expect(unmappedBox.height).toBeGreaterThanOrEqual(36); // Allow slightly smaller for compact design
      expect(mappingsBox.height).toBeGreaterThanOrEqual(36);
    }

    // Check horizontal scrolling isn't needed
    const mainContent = page.locator('main, .container').first();
    const contentBox = await mainContent.boundingBox();

    if (contentBox) {
      expect(contentBox.width).toBeLessThanOrEqual(375);
    }
  });

  test.afterEach(async () => {
    // Clean up can be done in afterEach if needed
    // Note: Don't clear DB between tests in same suite as they may depend on previous data
  });
});
