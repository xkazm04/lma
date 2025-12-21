import { test, expect } from '@playwright/test';

/**
 * E2E Test: ESG Dashboard to Action Critical Path
 *
 * Tests the most important user journey:
 * 1. Load the ESG dashboard
 * 2. Verify Facilities At Risk section renders with test data
 * 3. Click a facility link in the At Risk section
 * 4. Navigate to facility detail page
 * 5. Find the KPIs tab
 * 6. Locate at-risk KPIs
 *
 * This ensures the critical alert-to-action flow works end-to-end.
 * A regression in navigation, data loading, or routing would be caught by this test.
 */

test.describe('ESG Dashboard to Action Critical Path', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the ESG dashboard with a longer timeout for initial load
    await page.goto('/esg', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for the page to fully load
    await expect(page.getByRole('heading', { name: 'ESG Dashboard' })).toBeVisible({
      timeout: 30000,
    });
  });

  test('should display ESG dashboard with key sections', async ({ page }) => {
    // Verify the main dashboard page loaded
    await expect(page.getByRole('heading', { name: 'ESG Dashboard' })).toBeVisible();

    // Verify the subtitle is present
    await expect(page.getByText('Monitor sustainability performance across your portfolio')).toBeVisible();

    // Verify key action buttons are present
    await expect(page.getByTestId('view-facilities-btn')).toBeVisible();
    await expect(page.getByTestId('new-facility-btn')).toBeVisible();
  });

  test('should display Facilities At Risk section with test data', async ({ page }) => {
    // Verify the Facilities At Risk section is visible
    const facilitiesAtRiskSection = page.getByTestId('facilities-at-risk-section');
    await expect(facilitiesAtRiskSection).toBeVisible({ timeout: 10000 });

    // Verify the section header
    await expect(facilitiesAtRiskSection.getByText('Facilities At Risk')).toBeVisible();
    await expect(facilitiesAtRiskSection.getByText('These facilities have KPIs at risk of missing targets')).toBeVisible();

    // Verify at least one facility is listed in the at-risk section
    const facilitiesAtRiskList = page.getByTestId('facilities-at-risk-list');
    await expect(facilitiesAtRiskList).toBeVisible();

    // Check for the first at-risk facility (id='1' from mock data)
    const firstFacilityLink = page.getByTestId('facility-at-risk-link-1');
    await expect(firstFacilityLink).toBeVisible();

    // Verify facility name is displayed
    const facilityName = page.getByTestId('facility-at-risk-name-1');
    await expect(facilityName).toHaveText('ABC Corp SLL');

    // Verify the at-risk KPIs count is displayed
    const kpisAtRisk = page.getByTestId('facility-at-risk-kpis-1');
    await expect(kpisAtRisk).toContainText('KPI');
    await expect(kpisAtRisk).toContainText('at risk');
  });

  test('should navigate from dashboard to facility detail when clicking at-risk facility', async ({ page }) => {
    // Wait for the Facilities At Risk section to be visible
    await expect(page.getByTestId('facilities-at-risk-section')).toBeVisible({ timeout: 10000 });

    // Click on the first at-risk facility link
    const facilityLink = page.getByTestId('facility-at-risk-link-1');
    await expect(facilityLink).toBeVisible();
    await facilityLink.click();

    // Wait for navigation to facility detail page
    await page.waitForURL(/\/esg\/facilities\/1/, { timeout: 30000 });

    // Verify we're on the facility detail page
    await expect(page.getByTestId('facility-detail-page')).toBeVisible({ timeout: 15000 });

    // Verify facility name is displayed on detail page
    // Note: The mock data shows facility name as "ABC Corp Sustainability-Linked Loan"
    const facilityName = page.getByTestId('facility-name');
    await expect(facilityName).toBeVisible();
    await expect(facilityName).toContainText('ABC Corp');
  });

  test('should find KPIs tab on facility detail page', async ({ page }) => {
    // Navigate directly to facility detail page
    await page.goto('/esg/facilities/1', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for the facility detail page to load
    await expect(page.getByTestId('facility-detail-page')).toBeVisible({ timeout: 15000 });

    // Verify the tabs are present
    const overviewTab = page.getByTestId('tab-overview');
    const kpisTab = page.getByTestId('tab-kpis');
    const reportsTab = page.getByTestId('tab-reports');
    const ratingsTab = page.getByTestId('tab-ratings');

    await expect(overviewTab).toBeVisible();
    await expect(kpisTab).toBeVisible();
    await expect(reportsTab).toBeVisible();
    await expect(ratingsTab).toBeVisible();

    // Verify KPIs tab can be clicked
    await kpisTab.click();

    // Wait for KPIs section to be visible
    await expect(page.getByTestId('kpis-section')).toBeVisible({ timeout: 10000 });
  });

  test('should locate at-risk KPIs in KPIs tab', async ({ page }) => {
    // Navigate directly to facility detail page
    await page.goto('/esg/facilities/1', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for the facility detail page to load
    await expect(page.getByTestId('facility-detail-page')).toBeVisible({ timeout: 15000 });

    // Click on the KPIs tab
    const kpisTab = page.getByTestId('tab-kpis');
    await kpisTab.click();

    // Wait for KPIs section to be visible
    const kpisSection = page.getByTestId('kpis-section');
    await expect(kpisSection).toBeVisible({ timeout: 10000 });

    // Verify KPIs list is present
    const kpisList = page.getByTestId('kpis-list');
    await expect(kpisList).toBeVisible();

    // Find KPI cards with at-risk status
    // The mock data has KPI id='2' (Renewable Energy Share) with an at_risk target for 2025
    const atRiskKpiCard = page.locator('[data-testid^="kpi-card-"][data-at-risk="true"]').first();
    await expect(atRiskKpiCard).toBeVisible({ timeout: 10000 });

    // Verify at-risk target is highlighted
    // Looking for any target with data-status="at_risk"
    const atRiskTarget = page.locator('[data-testid^="kpi-target-"][data-status="at_risk"]').first();
    await expect(atRiskTarget).toBeVisible();

    // Verify the at-risk target has the amber styling (checking for border-amber class via CSS)
    await expect(atRiskTarget).toHaveClass(/border-amber/);
  });

  test('complete critical path: dashboard -> click at-risk facility -> view KPIs -> see at-risk targets', async ({ page }) => {
    // STEP 1: Verify dashboard loads with Facilities At Risk
    await expect(page.getByTestId('facilities-at-risk-section')).toBeVisible({ timeout: 10000 });

    // STEP 2: Verify at-risk facilities are listed
    const facilityLink = page.getByTestId('facility-at-risk-link-1');
    await expect(facilityLink).toBeVisible();

    // Capture facility name before clicking
    const facilityNameOnDashboard = await page.getByTestId('facility-at-risk-name-1').textContent();
    expect(facilityNameOnDashboard).toBeTruthy();

    // STEP 3: Click on the facility to navigate
    await facilityLink.click();

    // STEP 4: Wait for facility detail page
    await page.waitForURL(/\/esg\/facilities\/1/, { timeout: 30000 });
    await expect(page.getByTestId('facility-detail-page')).toBeVisible({ timeout: 15000 });

    // STEP 5: Click on KPIs tab
    const kpisTab = page.getByTestId('tab-kpis');
    await expect(kpisTab).toBeVisible();
    await kpisTab.click();

    // STEP 6: Verify KPIs section loads
    await expect(page.getByTestId('kpis-section')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('kpis-list')).toBeVisible();

    // STEP 7: Find at-risk KPIs
    const atRiskKpiCards = page.locator('[data-testid^="kpi-card-"][data-at-risk="true"]');
    const atRiskCount = await atRiskKpiCards.count();
    expect(atRiskCount).toBeGreaterThan(0);

    // STEP 8: Find at-risk targets within the KPIs
    const atRiskTargets = page.locator('[data-testid^="kpi-target-"][data-status="at_risk"]');
    const atRiskTargetsCount = await atRiskTargets.count();
    expect(atRiskTargetsCount).toBeGreaterThan(0);

    // STEP 9: Verify at-risk targets have proper visual styling
    const firstAtRiskTarget = atRiskTargets.first();
    await expect(firstAtRiskTarget).toHaveClass(/bg-amber/);
  });

  test('should be able to navigate back from facility detail to dashboard', async ({ page }) => {
    // Navigate to facility detail page
    await page.goto('/esg/facilities/1', { waitUntil: 'networkidle', timeout: 60000 });
    await expect(page.getByTestId('facility-detail-page')).toBeVisible({ timeout: 15000 });

    // Click back button
    const backButton = page.getByTestId('back-btn');
    await expect(backButton).toBeVisible();
    await backButton.click();

    // Verify navigation to facilities list page
    await page.waitForURL(/\/esg\/facilities$/, { timeout: 30000 });
  });

  test('AI Predictions section should be visible on dashboard', async ({ page }) => {
    // Verify AI Predictions section is visible
    await expect(page.getByText('AI Performance Predictions')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('90-day forecast based on AI analysis of KPI trajectories')).toBeVisible();

    // Verify View Full Predictions button is present
    await expect(page.getByTestId('view-predictions-btn')).toBeVisible();
  });

  test('quick actions should be accessible from dashboard', async ({ page }) => {
    // Verify quick action links are present
    await expect(page.getByTestId('quick-action-facilities-link')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('quick-action-allocations-link')).toBeVisible();
    await expect(page.getByTestId('quick-action-predictions-link')).toBeVisible();
    await expect(page.getByTestId('quick-action-compare-link')).toBeVisible();
  });
});

test.describe('ESG Dashboard Keyboard Accessibility', () => {
  test('should support keyboard navigation to at-risk facilities', async ({ page }) => {
    await page.goto('/esg', { waitUntil: 'networkidle', timeout: 60000 });
    await expect(page.getByTestId('facilities-at-risk-section')).toBeVisible({ timeout: 30000 });

    // Focus on the first at-risk facility link
    const facilityLink = page.getByTestId('facility-at-risk-link-1');
    await facilityLink.focus();
    await expect(facilityLink).toBeFocused();

    // Press Enter to navigate
    await facilityLink.press('Enter');

    // Verify navigation occurred
    await page.waitForURL(/\/esg\/facilities\/1/, { timeout: 30000 });
    await expect(page.getByTestId('facility-detail-page')).toBeVisible({ timeout: 15000 });
  });

  test('tabs on facility detail should be keyboard navigable', async ({ page }) => {
    await page.goto('/esg/facilities/1', { waitUntil: 'networkidle', timeout: 60000 });
    await expect(page.getByTestId('facility-detail-page')).toBeVisible({ timeout: 15000 });

    // Focus on Overview tab first
    const overviewTab = page.getByTestId('tab-overview');
    await overviewTab.focus();
    await expect(overviewTab).toBeFocused();

    // Tab to KPIs tab
    await page.keyboard.press('Tab');
    const kpisTab = page.getByTestId('tab-kpis');
    await expect(kpisTab).toBeFocused();

    // Press Enter to activate
    await kpisTab.press('Enter');

    // Verify KPIs section is now visible
    await expect(page.getByTestId('kpis-section')).toBeVisible({ timeout: 10000 });
  });
});
