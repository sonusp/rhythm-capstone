import { test, expect } from 'playwright/test';

test('minimal - basic navigation', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  const title = await page.title();
  console.log('Page title:', title);
  const body = page.locator('body');
  await expect(body).toBeVisible();
});
