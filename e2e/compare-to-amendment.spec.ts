import { test, expect } from '@playwright/test';

/**
 * E2E Test: Compare to Amendment Generation Journey
 *
 * Tests the critical user journey:
 * 1. Navigate to document compare page
 * 2. Select two documents for comparison (doc1 and doc2)
 * 3. Click Compare to run the comparison
 * 4. Verify comparison results are displayed
 * 5. Click Generate Amendment button
 * 6. Verify AmendmentDraftModal opens and shows content
 *
 * This tests the integration between:
 * - DocumentComparePage (document selection, comparison trigger)
 * - /api/documents/amendment endpoint
 * - AmendmentDraftModal display
 */

test.describe('Compare to Amendment Generation Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the compare page
    await page.goto('/documents/compare', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for the page to load - document selection card should be visible
    await expect(page.getByTestId('document-selection-card')).toBeVisible({ timeout: 30000 });
  });

  test('should complete full journey from document selection to amendment generation', async ({ page }) => {
    // Step 1: Select Document 1 (Original)
    // Click on doc1 selector trigger to open dropdown
    const doc1Trigger = page.getByTestId('doc1-select-trigger');
    await expect(doc1Trigger).toBeVisible();
    await doc1Trigger.click();

    // Wait for dropdown to be visible and select first completed document
    // Based on mock data, documents with id '1' and '2' have completed/review_required status
    const doc1Option = page.getByTestId('doc1-select-option-1');
    await expect(doc1Option).toBeVisible({ timeout: 5000 });
    await doc1Option.click();

    // Step 2: Select Document 2 (Amendment)
    const doc2Trigger = page.getByTestId('doc2-select-trigger');
    await expect(doc2Trigger).toBeVisible();
    await doc2Trigger.click();

    // Select the second document (id '2')
    const doc2Option = page.getByTestId('doc2-select-option-2');
    await expect(doc2Option).toBeVisible({ timeout: 5000 });
    await doc2Option.click();

    // Step 3: Click the Compare button
    const compareBtn = page.getByTestId('compare-documents-btn');
    await expect(compareBtn).toBeEnabled();
    await compareBtn.click();

    // Step 4: Wait for comparison to complete
    // The comparison includes both the comparison itself and risk analysis
    // This can take some time due to the mock delays
    await expect(page.getByTestId('impact-analysis-card')).toBeVisible({ timeout: 30000 });

    // Verify comparison stats are shown
    await expect(page.locator('text=Detailed Changes')).toBeVisible();

    // Step 5: Click Generate Amendment button
    const generateAmendmentBtn = page.getByTestId('generate-amendment-btn');
    await expect(generateAmendmentBtn).toBeVisible();
    await generateAmendmentBtn.click();

    // Step 6: Verify the Amendment Draft Modal opens
    const amendmentModal = page.getByTestId('amendment-draft-modal');
    await expect(amendmentModal).toBeVisible({ timeout: 10000 });

    // Initially should show loading state
    // Note: This might be quick, so we check if either loading or content is shown
    const loadingOrContent = page.locator('[data-testid="amendment-loading"], [data-testid="amendment-tab-preview"]');
    await expect(loadingOrContent.first()).toBeVisible({ timeout: 5000 });

    // Wait for the draft to be generated (loading to complete)
    // The modal should eventually show the preview tab
    await expect(page.getByTestId('amendment-tab-preview')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('amendment-tab-clauses')).toBeVisible();

    // Verify modal contains expected content structure
    // Check for the title mentioning "Amendment"
    await expect(amendmentModal.locator('text=Amendment Draft Generator')).toBeVisible();

    // Verify export buttons are present
    await expect(page.getByTestId('amendment-close-btn')).toBeVisible();
    await expect(page.getByTestId('amendment-export-md-btn')).toBeVisible();

    // Step 7: Close the modal
    await page.getByTestId('amendment-close-btn').click();
    await expect(amendmentModal).not.toBeVisible({ timeout: 5000 });
  });

  test('should not allow comparing document with itself', async ({ page }) => {
    // Select the same document for both selectors
    const doc1Trigger = page.getByTestId('doc1-select-trigger');
    await doc1Trigger.click();
    const doc1Option = page.getByTestId('doc1-select-option-1');
    await doc1Option.click();

    // The same document should be disabled in the second selector
    const doc2Trigger = page.getByTestId('doc2-select-trigger');
    await doc2Trigger.click();

    // Document 1 should be disabled in doc2 dropdown
    const doc2Option1 = page.getByTestId('doc2-select-option-1');
    await expect(doc2Option1).toHaveAttribute('data-disabled', 'true');

    // Close dropdown by pressing Escape
    await page.keyboard.press('Escape');
  });

  test('should show loading state during comparison', async ({ page }) => {
    // Select documents
    await page.getByTestId('doc1-select-trigger').click();
    await page.getByTestId('doc1-select-option-1').click();

    await page.getByTestId('doc2-select-trigger').click();
    await page.getByTestId('doc2-select-option-2').click();

    // Click compare
    const compareBtn = page.getByTestId('compare-documents-btn');
    await compareBtn.click();

    // Verify button shows loading state (contains "Comparing...")
    await expect(compareBtn).toContainText('Comparing');

    // Wait for comparison to complete
    await expect(page.getByTestId('impact-analysis-card')).toBeVisible({ timeout: 30000 });
  });

  test('should display comparison stats after comparison', async ({ page }) => {
    // Select documents
    await page.getByTestId('doc1-select-trigger').click();
    await page.getByTestId('doc1-select-option-1').click();

    await page.getByTestId('doc2-select-trigger').click();
    await page.getByTestId('doc2-select-option-2').click();

    // Click compare
    await page.getByTestId('compare-documents-btn').click();

    // Wait for results
    await expect(page.getByTestId('impact-analysis-card')).toBeVisible({ timeout: 30000 });

    // Verify impact analysis contains content about the amendment
    const impactCard = page.getByTestId('impact-analysis-card');
    await expect(impactCard).toContainText('Impact Analysis');
  });

  test('should show amendment modal loading state when generating', async ({ page }) => {
    // Complete comparison first
    await page.getByTestId('doc1-select-trigger').click();
    await page.getByTestId('doc1-select-option-1').click();

    await page.getByTestId('doc2-select-trigger').click();
    await page.getByTestId('doc2-select-option-2').click();

    await page.getByTestId('compare-documents-btn').click();
    await expect(page.getByTestId('impact-analysis-card')).toBeVisible({ timeout: 30000 });

    // Click generate amendment
    await page.getByTestId('generate-amendment-btn').click();

    // Modal should open
    const amendmentModal = page.getByTestId('amendment-draft-modal');
    await expect(amendmentModal).toBeVisible({ timeout: 10000 });

    // Should show loading indicator initially (may be very quick)
    // We check that either loading is shown or content is already ready
    const loadingState = page.getByTestId('amendment-loading');
    const contentState = page.getByTestId('amendment-tab-preview');

    // At least one should be visible
    await expect(loadingState.or(contentState)).toBeVisible({ timeout: 5000 });

    // Eventually content should be shown
    await expect(page.getByTestId('amendment-tab-preview')).toBeVisible({ timeout: 30000 });
  });

  test('should allow switching tabs in amendment modal', async ({ page }) => {
    // Complete the full journey to amendment modal
    await page.getByTestId('doc1-select-trigger').click();
    await page.getByTestId('doc1-select-option-1').click();

    await page.getByTestId('doc2-select-trigger').click();
    await page.getByTestId('doc2-select-option-2').click();

    await page.getByTestId('compare-documents-btn').click();
    await expect(page.getByTestId('impact-analysis-card')).toBeVisible({ timeout: 30000 });

    await page.getByTestId('generate-amendment-btn').click();
    await expect(page.getByTestId('amendment-draft-modal')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('amendment-tab-preview')).toBeVisible({ timeout: 30000 });

    // Click on the clauses tab
    await page.getByTestId('amendment-tab-clauses').click();

    // Verify we're on the clauses tab - should show clause cards
    // The clauses tab content should be visible
    await expect(page.locator('[data-testid^="amendment-clause-"]').first()).toBeVisible({ timeout: 5000 });
  });
});
