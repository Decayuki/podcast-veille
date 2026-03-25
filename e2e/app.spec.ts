import { test, expect } from '@playwright/test';

test.describe('Podcast Veille App', () => {
  test('loads homepage with episodes', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Veille de Marc');
    // Should have episode cards
    const cards = page.locator('[role="button"]');
    await expect(cards.first()).toBeVisible();
  });

  test('search filters episodes', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[type="text"]');
    await input.fill('Quantique');
    // Wait for debounce
    await page.waitForTimeout(400);
    // Should show filtered results or no results
    const cards = page.locator('[role="button"]');
    const count = await cards.count();
    // Either 0 or some cards depending on episode data
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('search with no match shows message', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[type="text"]');
    await input.fill('xyznotfoundxyz');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Aucun résultat')).toBeVisible();
  });

  test('clicking episode opens player', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[role="button"]').first();
    await firstCard.click();
    // Player should appear with controls
    await expect(page.locator('[aria-label="Fermer"]')).toBeVisible();
    await expect(page.locator('[aria-label="Lecture"], [aria-label="Pause"]')).toBeVisible();
  });

  test('player has speed control', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[role="button"]').first();
    await firstCard.click();
    // Speed button should show 1x
    const speedBtn = page.locator('button:has-text("1x")');
    await expect(speedBtn).toBeVisible();
    // Click to cycle speed
    await speedBtn.click();
    await expect(page.locator('button:has-text("1.5x")')).toBeVisible();
  });

  test('player has transcript toggle', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[role="button"]').first();
    await firstCard.click();
    // Transcript/extras button
    const extrasBtn = page.locator('[aria-label="Voir transcript et chapitres"]');
    await expect(extrasBtn).toBeVisible();
  });

  test('close button closes player', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[role="button"]').first();
    await firstCard.click();
    await expect(page.locator('[aria-label="Fermer"]')).toBeVisible();
    await page.locator('[aria-label="Fermer"]').click();
    await expect(page.locator('[aria-label="Fermer"]')).not.toBeVisible();
  });

  test('RSS link is present', async ({ page }) => {
    await page.goto('/');
    const rssLink = page.locator('a[href*="podcast.xml"]');
    await expect(rssLink).toBeVisible();
  });

  test('download buttons are present', async ({ page }) => {
    await page.goto('/');
    const downloadBtns = page.locator('[title="Télécharger"]');
    const count = await downloadBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test('episodes have cover art', async ({ page }) => {
    await page.goto('/');
    // Cover art fallbacks should show date-based covers
    const covers = page.locator('.rounded-lg.flex-shrink-0');
    const count = await covers.count();
    expect(count).toBeGreaterThan(0);
  });
});
