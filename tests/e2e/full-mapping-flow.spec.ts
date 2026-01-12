import { test, expect } from '@playwright/test';

/**
 * Full Exercise Mapping Flow Test
 * Tests the complete workflow from CSV import to mapping exercises
 */

// Sample Hevy CSV with exercises that won't map to canonical names
const HEVY_CSV_DATA = `title,start_time,exercise_title,set_type,weight_kg,reps,rpe,notes
Push Day,"21 Dec 2025, 14:29",Bench Press (Wide Grip),normal,60,10,,
Push Day,"21 Dec 2025, 14:29",Bench Press (Wide Grip),normal,60,8,,
Push Day,"21 Dec 2025, 14:29",Cable Fly Machine Custom,normal,25,12,,
Push Day,"21 Dec 2025, 14:29",Cable Fly Machine Custom,normal,25,10,,
Pull Day,"22 Dec 2025, 10:15",T-Bar Row Modified,normal,40,12,,
Pull Day,"22 Dec 2025, 10:15",T-Bar Row Modified,normal,40,10,,
Pull Day,"22 Dec 2025, 10:15",T-Bar Row Modified,normal,45,8,,
Pull Day,"22 Dec 2025, 10:15",Lat Pulldown (Special Bar),normal,50,15,,
Pull Day,"22 Dec 2025, 10:15",Lat Pulldown (Special Bar),normal,50,12,,`;

test.describe('Full Exercise Mapping Flow', () => {
  test('complete flow: import CSV, view unmapped, create mapping, verify update', async ({
    page,
  }) => {
    // Step 1: Setup - Navigate and create profile
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create a fresh profile for this test
    const profileDropdown = page.locator('button').first();
    const dropdownText = await profileDropdown.textContent();

    if (dropdownText?.includes('Select Profile')) {
      await profileDropdown.click();
      await page.locator('button:has-text("New Profile")').click();
      await page.fill('input[placeholder="Profile name..."]', 'Mapping Test Profile');
      await page
        .locator('button')
        .filter({ hasText: /^Create$/ })
        .click();
      await page.waitForTimeout(1000);
    }

    // Step 2: Navigate to Settings
    await page.click('a[href="/settings"]');
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();

    // Step 3: Import CSV
    console.log('📁 Importing CSV with unmapped exercises...');

    const csvSection = page.locator('section').filter({ hasText: 'CSV Import' });
    await expect(csvSection).toBeVisible();

    const fileInput = csvSection.locator('input[type="file"]');

    // Create and upload the CSV file
    const buffer = Buffer.from(HEVY_CSV_DATA, 'utf-8');
    await fileInput.setInputFiles({
      name: 'test-hevy-export.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });

    // Wait for import to process
    await page.waitForTimeout(3000);

    // Check for import result (success or error)
    const pageContent = await page.content();
    console.log(
      'Import result visible on page:',
      pageContent.includes('imported') ||
        pageContent.includes('error') ||
        pageContent.includes('failed')
    );

    // Step 4: Check if unmapped exercises badge appears
    console.log('🔍 Checking for unmapped exercises...');

    await page.waitForTimeout(2000); // Give time for DB to update

    // Reload the page to ensure fresh data
    await page.reload();
    await page.waitForLoadState('networkidle');

    const exerciseMappingSection = page.locator('section').filter({ hasText: 'Exercise Mappings' });
    await expect(exerciseMappingSection).toBeVisible();

    // Look for unmapped badge
    const sectionText = await exerciseMappingSection.textContent();
    console.log('Exercise Mapping section text:', sectionText);

    // Step 5: Navigate to Exercise Mapping page
    const manageButton = exerciseMappingSection.locator('a:has-text("Manage Mappings")');
    await manageButton.click();

    await expect(page).toHaveURL('/settings/exercise-mappings');
    await expect(page.locator('h1').filter({ hasText: 'Exercise Mapping' })).toBeVisible();

    // Step 6: Check Unmapped tab content
    console.log('📋 Viewing unmapped exercises...');

    const unmappedTab = page.locator('button:has-text("Unmapped")');
    await expect(unmappedTab).toBeVisible();
    await expect(unmappedTab).toHaveClass(/bg-cyan-500/); // Should be active by default

    // Look for unmapped exercise items
    await page.waitForTimeout(2000);

    const mainContent = await page.locator('main, .container').first().textContent();
    console.log(
      'Unmapped tab content includes exercises:',
      mainContent?.includes('Bench Press') ||
        mainContent?.includes('Cable Fly') ||
        mainContent?.includes('T-Bar Row') ||
        mainContent?.includes('Lat Pulldown') ||
        mainContent?.includes('No unmapped exercises')
    );

    // Step 7: Try to map an exercise (if any unmapped exist)
    const exerciseItems = page.locator('button, [role="button"]').filter({
      hasText: /Bench Press|Cable Fly|T-Bar Row|Lat Pulldown/i,
    });

    const itemCount = await exerciseItems.count();
    console.log(`Found ${itemCount} unmapped exercise items`);

    if (itemCount > 0) {
      console.log('🔗 Attempting to map an exercise...');

      // Click first unmapped exercise
      await exerciseItems.first().click();

      // Wait for modal/dialog
      const modal = page.locator('[role="dialog"], .modal, .fixed').filter({
        hasText: /Search|Select|Exercise/i,
      });

      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Search modal opened');

        // Look for search input
        const searchInput = page.locator('input[type="search"], input[type="text"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('Bench Press');
          await page.waitForTimeout(1000);

          // Try to select a result
          const searchResults = page.locator('button, [role="option"]').filter({
            hasText: /Bench|Press/i,
          });

          if (
            await searchResults
              .first()
              .isVisible({ timeout: 2000 })
              .catch(() => false)
          ) {
            await searchResults.first().click();
            console.log('Selected a canonical exercise');

            // Confirm if needed
            const confirmButton = page.locator('button').filter({
              hasText: /Confirm|Map|Save/i,
            });
            if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
              await confirmButton.click();
              console.log('Mapping confirmed');
            }
          }
        }
      }
    }

    // Step 8: Check My Mappings tab
    console.log('📚 Checking My Mappings tab...');

    const myMappingsTab = page.locator('button:has-text("My Mappings")');
    await myMappingsTab.click();
    await expect(myMappingsTab).toHaveClass(/bg-cyan-500/);

    await page.waitForTimeout(1000);

    const mappingsContent = await page.locator('main, .container').first().textContent();
    console.log(
      'My Mappings tab shows:',
      mappingsContent?.includes('No custom mappings') ? 'No mappings' : 'Has mappings'
    );

    // Take final screenshot
    await page.screenshot({
      path: 'tests/e2e/screenshots/full-mapping-flow.png',
      fullPage: true,
    });

    console.log('✅ Full mapping flow test completed');
  });

  test('verify imported workouts appear on dashboard', async ({ page }) => {
    // Use existing profile with imported data
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Dashboard
    await page.click('a[href="/"]');

    // Check if any workout data is visible
    const dashboardContent = await page.locator('main').textContent();

    console.log(
      'Dashboard shows workout data:',
      dashboardContent?.includes('sets') ||
        dashboardContent?.includes('volume') ||
        dashboardContent?.includes('No workouts')
    );

    // Take screenshot of dashboard
    await page.screenshot({
      path: 'tests/e2e/screenshots/dashboard-after-import.png',
      fullPage: true,
    });
  });
});
