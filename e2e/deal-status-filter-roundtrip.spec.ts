import { test, expect } from '@playwright/test';

/**
 * E2E Test: Deal Status Filter Roundtrip
 *
 * Tests the critical user journey:
 * 1. DealsListPage loads with stats bar
 * 2. Click a status stat card (e.g., 'Active') to filter
 * 3. Verify only deals with that status are displayed
 * 4. Change a deal's status via the dropdown menu
 * 5. Verify the stats bar updates with new counts (optimistic update)
 *
 * This tests the integration between:
 * - Filter state management
 * - View rendering with filtered data
 * - Status change via dropdown
 * - Optimistic updates in useDealStatusUpdate hook
 * - Stats recomputation in useStatusCounts
 */

test.describe('Deal Status Filter Roundtrip', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the deals page with a longer timeout for initial load
    await page.goto('/deals', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for the page to load - the stats bar should be visible
    // Use a longer timeout since this is the initial page load
    await expect(page.getByTestId('deal-stats-total')).toBeVisible({ timeout: 30000 });
  });

  test('should filter deals by clicking status stat card', async ({ page }) => {
    // Get initial counts from the stats bar
    const totalCountText = await page.getByTestId('deal-stats-total').textContent();
    const activeCountText = await page.getByTestId('deal-stats-active').textContent();

    // Extract numeric count (the first number in the text)
    const activeCount = parseInt(activeCountText?.match(/\d+/)?.[0] || '0', 10);

    // Click on the 'Active' stat card to filter
    await page.getByTestId('deal-stats-active').click();

    // Verify the 'Active' stat card is now selected (has aria-pressed=true)
    await expect(page.getByTestId('deal-stats-active')).toHaveAttribute('aria-pressed', 'true');

    // Wait for the filtered view to render
    await page.waitForTimeout(300); // Allow for animation

    // Count visible deals in the table/grid
    const dealRows = page.locator('[data-testid^="deal-list-row-"]');
    const dealCards = page.locator('[data-testid^="deal-list-item-"]');

    // Check if we're in table view or grid view
    const isTableView = await page.getByTestId('deal-list-table').isVisible().catch(() => false);

    if (isTableView) {
      // In table view, verify all visible deals have 'Active' status
      const rowCount = await dealRows.count();

      // Should have active deals matching the count (if count > 0)
      if (activeCount > 0) {
        expect(rowCount).toBeGreaterThan(0);
        expect(rowCount).toBeLessThanOrEqual(activeCount);

        // Verify each visible deal has Active status badge
        for (let i = 0; i < rowCount; i++) {
          const row = dealRows.nth(i);
          const statusBadge = row.locator('[data-testid$="-status"]').first();
          // The badge should contain 'Active' text
          await expect(statusBadge).toContainText(/Active/i);
        }
      }
    } else {
      // In grid view
      const cardCount = await dealCards.count();
      if (activeCount > 0) {
        expect(cardCount).toBeGreaterThan(0);
      }
    }
  });

  test('should show all deals when clicking Total stat card', async ({ page }) => {
    // First filter by Active
    await page.getByTestId('deal-stats-active').click();
    await expect(page.getByTestId('deal-stats-active')).toHaveAttribute('aria-pressed', 'true');

    // Then click Total to show all
    await page.getByTestId('deal-stats-total').click();
    await expect(page.getByTestId('deal-stats-total')).toHaveAttribute('aria-pressed', 'true');

    // Active should no longer be pressed
    await expect(page.getByTestId('deal-stats-active')).toHaveAttribute('aria-pressed', 'false');
  });

  test('should update stats when deal status is changed', async ({ page }) => {
    // Get initial active count
    const activeStatCard = page.getByTestId('deal-stats-active');
    const initialActiveText = await activeStatCard.textContent();
    const initialActiveCount = parseInt(initialActiveText?.match(/\d+/)?.[0] || '0', 10);

    // Skip if no active deals
    if (initialActiveCount === 0) {
      test.skip();
      return;
    }

    // Get initial paused count
    const pausedStatCard = page.getByTestId('deal-stats-paused');
    const initialPausedText = await pausedStatCard.textContent();
    const initialPausedCount = parseInt(initialPausedText?.match(/\d+/)?.[0] || '0', 10);

    // First, make sure we can see all deals (click Total if not already)
    await page.getByTestId('deal-stats-total').click();
    await page.waitForTimeout(300);

    // Find an active deal in the table
    // Look for a row that has an Active status badge
    const isTableView = await page.getByTestId('deal-list-table').isVisible().catch(() => false);

    if (isTableView) {
      // Find the first deal row with Active status
      const activeRows = page.locator('[data-testid^="deal-list-row-"]').filter({
        has: page.locator('[data-testid$="-status"]:has-text("Active")'),
      });

      const activeRowCount = await activeRows.count();
      if (activeRowCount === 0) {
        test.skip();
        return;
      }

      // Get the first active deal's ID from the row testid
      const firstActiveRow = activeRows.first();
      const rowTestId = await firstActiveRow.getAttribute('data-testid');
      const dealId = rowTestId?.replace('deal-list-row-', '');

      if (!dealId) {
        test.skip();
        return;
      }

      // Click the actions menu for this deal
      const actionsButton = page.getByTestId(`deal-list-actions-${dealId}`);
      await actionsButton.click();

      // Wait for dropdown to appear
      const dropdownMenu = page.getByTestId(`deal-list-menu-${dealId}`);
      await expect(dropdownMenu).toBeVisible();

      // Click "Pause Deal" option
      const pauseOption = page.getByTestId(`deal-list-pause-${dealId}`);
      await pauseOption.click();

      // Wait for optimistic update (the status should change immediately)
      await page.waitForTimeout(500);

      // Verify the deal's status badge now shows "Paused"
      const statusBadge = page.getByTestId(`deal-list-status-${dealId}`);
      await expect(statusBadge).toContainText(/Paused/i);

      // Verify the stats bar has updated (optimistic update)
      // Active count should decrease by 1
      const newActiveText = await activeStatCard.textContent();
      const newActiveCount = parseInt(newActiveText?.match(/\d+/)?.[0] || '0', 10);
      expect(newActiveCount).toBe(initialActiveCount - 1);

      // Paused count should increase by 1
      const newPausedText = await pausedStatCard.textContent();
      const newPausedCount = parseInt(newPausedText?.match(/\d+/)?.[0] || '0', 10);
      expect(newPausedCount).toBe(initialPausedCount + 1);
    } else {
      // Grid view - use DealCard testids
      const activeCards = page.locator('[data-testid^="deal-card-"]').filter({
        has: page.locator('[data-testid$="-status"]:has-text("Active")'),
      });

      const activeCardCount = await activeCards.count();
      if (activeCardCount === 0) {
        test.skip();
        return;
      }

      // Get first active card
      const firstActiveCard = activeCards.first();
      const cardTestId = await firstActiveCard.getAttribute('data-testid');
      const dealId = cardTestId?.replace('deal-card-', '');

      if (!dealId) {
        test.skip();
        return;
      }

      // Open dropdown menu
      await page.getByTestId(`deal-card-${dealId}-menu`).click();
      await expect(page.getByTestId(`deal-card-${dealId}-menu-content`)).toBeVisible();

      // Click pause
      await page.getByTestId(`deal-card-${dealId}-pause`).click();

      // Wait for optimistic update
      await page.waitForTimeout(500);

      // Verify status changed
      await expect(page.getByTestId(`deal-card-${dealId}-status`)).toContainText(/Paused/i);

      // Verify stats updated
      const newActiveText = await activeStatCard.textContent();
      const newActiveCount = parseInt(newActiveText?.match(/\d+/)?.[0] || '0', 10);
      expect(newActiveCount).toBe(initialActiveCount - 1);

      const newPausedText = await pausedStatCard.textContent();
      const newPausedCount = parseInt(newPausedText?.match(/\d+/)?.[0] || '0', 10);
      expect(newPausedCount).toBe(initialPausedCount + 1);
    }
  });

  test('should maintain filter after status change', async ({ page }) => {
    // Get paused count
    const pausedStatCard = page.getByTestId('deal-stats-paused');
    const initialPausedText = await pausedStatCard.textContent();
    const initialPausedCount = parseInt(initialPausedText?.match(/\d+/)?.[0] || '0', 10);

    // Skip if no paused deals
    if (initialPausedCount === 0) {
      test.skip();
      return;
    }

    // Filter by paused
    await pausedStatCard.click();
    await expect(pausedStatCard).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(300);

    // Find a paused deal and resume it
    const isTableView = await page.getByTestId('deal-list-table').isVisible().catch(() => false);

    if (isTableView) {
      const pausedRows = page.locator('[data-testid^="deal-list-row-"]');
      const rowCount = await pausedRows.count();

      if (rowCount === 0) {
        test.skip();
        return;
      }

      // Get first paused deal
      const firstRow = pausedRows.first();
      const rowTestId = await firstRow.getAttribute('data-testid');
      const dealId = rowTestId?.replace('deal-list-row-', '');

      if (!dealId) {
        test.skip();
        return;
      }

      // Resume the deal
      await page.getByTestId(`deal-list-actions-${dealId}`).click();
      await page.getByTestId(`deal-list-resume-${dealId}`).click();

      // Wait for update
      await page.waitForTimeout(500);

      // The deal should disappear from the filtered view (since it's no longer paused)
      // But filter should still be on 'paused'
      await expect(pausedStatCard).toHaveAttribute('aria-pressed', 'true');

      // The count should have decreased
      const newPausedText = await pausedStatCard.textContent();
      const newPausedCount = parseInt(newPausedText?.match(/\d+/)?.[0] || '0', 10);
      expect(newPausedCount).toBe(initialPausedCount - 1);

      // The resumed deal should no longer be visible in the filtered view
      await expect(page.getByTestId(`deal-list-row-${dealId}`)).not.toBeVisible();
    }
  });

  test('stats cards should be keyboard accessible', async ({ page }) => {
    // Focus on the stats bar area
    const activeStatCard = page.getByTestId('deal-stats-active');

    // Tab to focus on the first stat card and then navigate
    await activeStatCard.focus();
    await expect(activeStatCard).toBeFocused();

    // Press Enter to activate filter
    await activeStatCard.press('Enter');
    await expect(activeStatCard).toHaveAttribute('aria-pressed', 'true');

    // Navigate with arrow keys
    await activeStatCard.press('ArrowRight');

    // Paused should now be focused
    const pausedStatCard = page.getByTestId('deal-stats-paused');
    await expect(pausedStatCard).toBeFocused();

    // Press Space to activate
    await pausedStatCard.press('Space');
    await expect(pausedStatCard).toHaveAttribute('aria-pressed', 'true');
    await expect(activeStatCard).toHaveAttribute('aria-pressed', 'false');
  });
});
