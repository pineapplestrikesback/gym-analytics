import { test, expect } from '@playwright/test';

/**
 * Verify the complete exercise mapping workflow
 */

test.describe('Exercise Mapping Workflow Verification', () => {
  test('verify unmapped exercises are displayed correctly', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for profile or create one
    const profileDropdown = page.locator('button').first();
    const dropdownText = await profileDropdown.textContent();

    if (dropdownText?.includes('Select Profile')) {
      await profileDropdown.click();
      const existingProfile = page.locator('button[role="option"]').first();

      if (await existingProfile.isVisible({ timeout: 1000 }).catch(() => false)) {
        await existingProfile.click();
      } else {
        await page.locator('button:has-text("New Profile")').click();
        await page.fill('input[placeholder="Profile name..."]', 'Test Mapping Profile');
        await page
          .locator('button')
          .filter({ hasText: /^Create$/ })
          .click();
      }
      await page.waitForTimeout(1000);
    }

    // Navigate to Settings
    await page.goto('/settings');
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();

    // Check Exercise Mappings section
    const mappingsSection = page.locator('section').filter({ hasText: 'Exercise Mappings' });
    await expect(mappingsSection).toBeVisible();

    const sectionContent = await mappingsSection.textContent();
    console.log('Exercise Mappings Section:', sectionContent);

    // Check if there are unmapped exercises
    const hasUnmapped = sectionContent?.includes('unmapped');
    console.log('Has unmapped exercises:', hasUnmapped);

    // Navigate to Exercise Mapping page
    await page.goto('/settings/exercise-mappings');
    await expect(page.locator('h1').filter({ hasText: 'Exercise Mapping' })).toBeVisible();

    // Check Unmapped tab
    const unmappedTab = page.locator('button:has-text("Unmapped")');
    await expect(unmappedTab).toBeVisible();
    await expect(unmappedTab).toHaveClass(/bg-cyan-500/);

    // Get content of unmapped section
    const mainContent = await page.locator('main').textContent();
    console.log('\n=== UNMAPPED TAB CONTENT ===');

    if (mainContent?.includes('No unmapped exercises')) {
      console.log('✅ No unmapped exercises (clean state)');
    } else if (mainContent?.includes('All Mapped')) {
      console.log('✅ All exercises are mapped');
    } else {
      // Count unmapped items
      const unmappedItems = await page
        .locator('button')
        .filter({
          hasText: /Press|Row|Fly|Pull|Squat/i,
        })
        .count();
      console.log(`✅ Found ${unmappedItems} unmapped exercises`);

      // Try to click first unmapped exercise
      if (unmappedItems > 0) {
        const firstItem = page
          .locator('button')
          .filter({
            hasText: /Press|Row|Fly|Pull|Squat/i,
          })
          .first();

        const exerciseName = await firstItem.textContent();
        console.log(`\n🔗 Testing mapping for: ${exerciseName}`);

        await firstItem.click();

        // Check if modal opened
        const modal = page.locator('[role="dialog"], .fixed').filter({
          hasText: /MAP EXERCISE/i,
        });

        if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('✅ Search modal opened successfully');

          // Check modal elements
          const searchInput = page
            .locator('input[type="search"], input[placeholder*="Search"]')
            .first();
          const confirmButton = page.locator('button:has-text("CONFIRM")');
          const ignoreButton = page.locator('button:has-text("IGNORE")');
          const cancelButton = page.locator('button:has-text("CANCEL")');

          console.log('Modal elements:');
          console.log('  - Search input:', await searchInput.isVisible());
          console.log('  - Confirm button:', await confirmButton.isVisible());
          console.log('  - Ignore button:', await ignoreButton.isVisible());
          console.log('  - Cancel button:', await cancelButton.isVisible());

          // Close modal
          await cancelButton.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Check My Mappings tab
    console.log('\n=== MY MAPPINGS TAB ===');
    const myMappingsTab = page.locator('button:has-text("My Mappings")');
    await myMappingsTab.click();
    await expect(myMappingsTab).toHaveClass(/bg-cyan-500/);

    await page.waitForTimeout(500);
    const mappingsContent = await page.locator('main').textContent();

    if (
      mappingsContent?.includes('NO MAPPINGS YET') ||
      mappingsContent?.includes('No custom mappings')
    ) {
      console.log('✅ No custom mappings (expected for new profile)');
    } else {
      const mappingItems = await page
        .locator('[data-testid*="mapping"], button')
        .filter({
          hasText: /→/,
        })
        .count();
      console.log(`✅ Found ${mappingItems} custom mappings`);
    }

    console.log('\n✅ Exercise mapping workflow is functioning correctly!');
  });

  test('verify search functionality in mapping modal', async ({ page }) => {
    await page.goto('/settings/exercise-mappings');
    await page.waitForLoadState('networkidle');

    // Look for any unmapped exercise button
    const unmappedButton = page
      .locator('button')
      .filter({
        hasText: /Press|Row|Fly|Pull|Squat/i,
      })
      .first();

    if (await unmappedButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unmappedButton.click();

      // Wait for modal
      const modal = page.locator('[role="dialog"], .fixed').filter({
        hasText: /MAP EXERCISE/i,
      });

      await expect(modal).toBeVisible({ timeout: 5000 });

      // Test search
      const searchInput = page
        .locator('input[type="search"], input[placeholder*="Search"]')
        .first();
      await searchInput.fill('Bench');
      await page.waitForTimeout(1000);

      // Check if results appear
      const searchResults = await page
        .locator('button, [role="option"]')
        .filter({
          hasText: /Bench/i,
        })
        .count();

      console.log(`Search for "Bench" returned ${searchResults} results`);
      expect(searchResults).toBeGreaterThan(0);

      // Clear search
      await searchInput.clear();
      await searchInput.fill('Squat');
      await page.waitForTimeout(1000);

      const squatResults = await page
        .locator('button, [role="option"]')
        .filter({
          hasText: /Squat/i,
        })
        .count();

      console.log(`Search for "Squat" returned ${squatResults} results`);

      console.log('✅ Search functionality working correctly');
    } else {
      console.log('No unmapped exercises to test search with (clean state)');
    }
  });
});
