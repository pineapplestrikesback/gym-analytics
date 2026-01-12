import { test, expect } from '@playwright/test';

/**
 * E2E Test: Exercise Mapping Feature
 * Tests the complete user flow for managing exercise mappings
 */

test.describe('Exercise Mapping Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Create a test profile if none exists
    const profileDropdown = page
      .locator('button:has-text("Select Profile"), button:has-text("Test Profile")')
      .first();

    // Check if we need to select/create a profile
    const dropdownText = await profileDropdown.textContent();
    if (dropdownText?.includes('Select Profile')) {
      // Open profile dropdown
      await profileDropdown.click();

      // Click "New Profile" button
      const newProfileButton = page.locator('button:has-text("New Profile")');
      await newProfileButton.click();

      // Enter profile name
      const profileNameInput = page.locator('input[placeholder="Profile name..."]');
      await profileNameInput.fill('Test Profile');

      // Click Create button
      const createButton = page
        .locator('button:has-text("Create")')
        .filter({ hasText: /^Create$/ });
      await createButton.click();

      // Wait for profile to be created and selected
      await page.waitForTimeout(1000);
    }
  });

  test('should show Manage Mappings button in Settings', async ({ page }) => {
    // Navigate to Settings
    await page.click('a[href="/settings"]');

    // Wait for Settings page to load
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();

    // Find Exercise Mappings section
    const mappingsSection = page.locator('section:has-text("Exercise Mappings")');
    await expect(mappingsSection).toBeVisible();

    // Verify "Manage Mappings" button exists
    const manageButton = mappingsSection.locator('a[href="/settings/exercise-mappings"]');
    await expect(manageButton).toBeVisible();
    await expect(manageButton).toHaveText('Manage Mappings');
  });

  test('should navigate to Exercise Mapping page', async ({ page }) => {
    // Navigate to Settings
    await page.click('a[href="/settings"]');

    // Click "Manage Mappings" button
    await page.click('a[href="/settings/exercise-mappings"]');

    // Verify URL changed
    await expect(page).toHaveURL('/settings/exercise-mappings');

    // Verify page header
    await expect(page.locator('h1:has-text("Exercise Mapping")')).toBeVisible();
  });

  test('should display two tabs: Unmapped and My Mappings', async ({ page }) => {
    // Navigate to Exercise Mapping page
    await page.goto('/settings/exercise-mappings');

    // Wait for page to load
    await expect(page.locator('h1:has-text("Exercise Mapping")')).toBeVisible();

    // Verify both tabs exist
    const unmappedTab = page.locator('button:has-text("Unmapped")');
    const myMappingsTab = page.locator('button:has-text("My Mappings")');

    await expect(unmappedTab).toBeVisible();
    await expect(myMappingsTab).toBeVisible();
  });

  test('should switch between tabs correctly', async ({ page }) => {
    // Navigate to Exercise Mapping page
    await page.goto('/settings/exercise-mappings');

    // Wait for page to load
    await expect(page.locator('h1:has-text("Exercise Mapping")')).toBeVisible();

    // Verify Unmapped tab is active by default
    const unmappedTab = page.locator('button:has-text("Unmapped")');
    const myMappingsTab = page.locator('button:has-text("My Mappings")');

    // Check initial active tab (Unmapped should have cyan background)
    await expect(unmappedTab).toHaveClass(/bg-cyan-500/);

    // Click My Mappings tab
    await myMappingsTab.click();

    // Verify tab switched
    await expect(myMappingsTab).toHaveClass(/bg-cyan-500/);
    await expect(unmappedTab).not.toHaveClass(/bg-cyan-500/);

    // Click back to Unmapped
    await unmappedTab.click();

    // Verify tab switched back
    await expect(unmappedTab).toHaveClass(/bg-cyan-500/);
    await expect(myMappingsTab).not.toHaveClass(/bg-cyan-500/);
  });

  test('should be mobile responsive', async ({ page }) => {
    // Navigate to Exercise Mapping page
    await page.goto('/settings/exercise-mappings');

    // Wait for page to load
    await expect(page.locator('h1:has-text("Exercise Mapping")')).toBeVisible();

    // Set mobile viewport (375px width - iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait a bit for layout to adjust
    await page.waitForTimeout(500);

    // Verify page elements are still visible
    await expect(page.locator('h1:has-text("Exercise Mapping")')).toBeVisible();

    // Verify tabs are visible
    await expect(page.locator('button:has-text("Unmapped")')).toBeVisible();
    await expect(page.locator('button:has-text("My Mappings")')).toBeVisible();

    // Take screenshot for manual verification
    await page.screenshot({
      path: 'tests/e2e/screenshots/exercise-mapping-mobile.png',
      fullPage: true,
    });
  });

  test('should handle no profile state gracefully', async ({ page, context }) => {
    // Clear IndexedDB to simulate no profile
    await context.clearCookies();
    await page.evaluate(() => {
      indexedDB.deleteDatabase('gym-analytics-db');
    });

    // Navigate to Exercise Mapping page
    await page.goto('/settings/exercise-mappings');

    // Should show "No Profile Selected" message
    await expect(page.locator('text=No Profile Selected')).toBeVisible();
    await expect(page.locator('text=Create or select a profile')).toBeVisible();
  });

  test('should check for console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate through the flow
    await page.goto('/');
    await page.click('a[href="/settings"]');
    await page.click('a[href="/settings/exercise-mappings"]');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Switch tabs
    await page.click('button:has-text("My Mappings")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Unmapped")');
    await page.waitForTimeout(500);

    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should take full page screenshots for documentation', async ({ page }) => {
    // Create screenshots directory
    await page.goto('/settings/exercise-mappings');
    await expect(page.locator('h1:has-text("Exercise Mapping")')).toBeVisible();

    // Screenshot 1: Unmapped tab (default view)
    await page.screenshot({
      path: 'tests/e2e/screenshots/exercise-mapping-unmapped.png',
      fullPage: true,
    });

    // Screenshot 2: My Mappings tab
    await page.click('button:has-text("My Mappings")');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/e2e/screenshots/exercise-mapping-my-mappings.png',
      fullPage: true,
    });

    // Screenshot 3: Settings page with Exercise Mappings section
    await page.goto('/settings');
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();
    await page.screenshot({
      path: 'tests/e2e/screenshots/settings-with-mappings-section.png',
      fullPage: true,
    });
  });
});
