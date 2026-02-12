import { test, expect } from '@playwright/test';

test('homepage loads and has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/LaneIQ/);
  await expect(page.getByRole('heading', { name: 'LaneIQ' })).toBeVisible();
});

test('search input exists', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder(/Game Name/i)).toBeVisible();
});
