import { test, expect } from '@playwright/test';

test.describe('Simple Exercise Mapping Test', () => {
  test('check basic exercise mapping UI flow', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create profile if needed
    const profileDropdown = page
      .locator('button')
      .filter({ hasText: /Select Profile|Test Profile/i })
      .first();

    const dropdownText = await profileDropdown.textContent();
    if (dropdownText?.includes('Select Profile')) {
      await profileDropdown.click();
      await page.locator('button:has-text("New Profile")').click();
      await page.fill('input[placeholder="Profile name..."]', 'Test Profile');
      await page
        .locator('button')
        .filter({ hasText: /^Create$/ })
        .click();
      await page.waitForTimeout(1000);
    }

    // Go to Settings
    await page.click('a[href="/settings"]');
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();

    // Check Exercise Mappings section exists
    const mappingsSection = page.locator('section').filter({ hasText: 'Exercise Mappings' });
    await expect(mappingsSection).toBeVisible();

    // Click Manage Mappings
    const manageButton = mappingsSection.locator('a:has-text("Manage Mappings")');
    await expect(manageButton).toBeVisible();
    await manageButton.click();

    // Verify navigation to mapping page
    await expect(page).toHaveURL('/settings/exercise-mappings');
    await expect(page.locator('h1').filter({ hasText: 'Exercise Mapping' })).toBeVisible();

    // Check both tabs exist
    const unmappedTab = page.locator('button:has-text("Unmapped")');
    const myMappingsTab = page.locator('button:has-text("My Mappings")');

    await expect(unmappedTab).toBeVisible();
    await expect(myMappingsTab).toBeVisible();

    // Unmapped should be active by default
    await expect(unmappedTab).toHaveClass(/bg-cyan-500/);

    // Switch to My Mappings tab
    await myMappingsTab.click();
    await expect(myMappingsTab).toHaveClass(/bg-cyan-500/);

    // Look for content in My Mappings
    const content = page.locator('main, [role="main"], .container').first();
    const contentText = await content.textContent();

    // Should show either mappings or "no mappings" message
    const hasExpectedContent =
      contentText?.includes('No custom mappings') ||
      contentText?.includes('mapping') ||
      contentText?.includes('Mapping');

    expect(hasExpectedContent).toBeTruthy();

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'tests/e2e/screenshots/exercise-mapping-flow.png',
      fullPage: true,
    });

    console.log('✅ Exercise Mapping UI is working correctly');
  });

  test('verify Settings page unmapped count display', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure profile exists
    const profileDropdown = page
      .locator('button')
      .filter({ hasText: /Select Profile|Test Profile/i })
      .first();
    const dropdownText = await profileDropdown.textContent();

    if (dropdownText?.includes('Select Profile')) {
      await profileDropdown.click();
      await page.locator('button:has-text("New Profile")').click();
      await page.fill('input[placeholder="Profile name..."]', 'Test Profile 2');
      await page
        .locator('button')
        .filter({ hasText: /^Create$/ })
        .click();
      await page.waitForTimeout(1000);
    }

    // Navigate to Settings
    await page.goto('/settings');
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();

    // Find Exercise Mappings section
    const mappingsSection = page.locator('section').filter({ hasText: 'Exercise Mappings' });
    await expect(mappingsSection).toBeVisible();

    // Check the content
    const sectionText = await mappingsSection.textContent();
    console.log('Exercise Mappings section text:', sectionText);

    // Should mention exercise mappings
    expect(sectionText).toContain('Exercise Mappings');

    // Should have Manage Mappings button
    const manageButton = mappingsSection.locator('a:has-text("Manage Mappings")');
    await expect(manageButton).toBeVisible();

    // If there are unmapped exercises, should show count
    const unmappedBadge = mappingsSection.locator('span').filter({ hasText: 'unmapped' });
    const hasBadge = await unmappedBadge.isVisible().catch(() => false);

    if (hasBadge) {
      const badgeText = await unmappedBadge.textContent();
      console.log('Unmapped badge found:', badgeText);
      // Badge should contain a number
      expect(badgeText).toMatch(/\d+\s*unmapped/);
    } else {
      console.log('No unmapped exercises (badge not shown)');
      // Should show "All exercises are mapped correctly"
      expect(sectionText).toContain('All exercises are mapped correctly');
    }
  });
});
