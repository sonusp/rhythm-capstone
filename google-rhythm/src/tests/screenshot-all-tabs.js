/**
 * screenshot-all-tabs.js
 * Opens Google Rhythm in Edge (msedge channel), visits all 4 tabs,
 * and saves screenshots to src/tests/screenshots/
 *
 * Run: node src/tests/screenshot-all-tabs.js
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173/';
const screenshotsDir = path.join(__dirname, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

(async () => {
  console.log('Launching Microsoft Edge (msedge channel)...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: false,
    slowMo: 400,
  });

  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
  });

  const page = await context.newPage();
  await page.goto(BASE_URL);
  await page.waitForSelector('h1', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // ── 1. Dashboard (default tab) ───────────────
  console.log('📸 Capturing Dashboard...');
  await page.screenshot({ path: path.join(screenshotsDir, 'dashboard.png'), fullPage: false });
  console.log('   Saved → dashboard.png');

  // ── 2. Insights tab ─────────────────────────
  console.log('📸 Navigating to Insights...');
  await page.getByRole('button', { name: /insights/i }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(screenshotsDir, 'insights.png'), fullPage: false });
  console.log('   Saved → insights.png');

  // ── 3. Flow tab (Log) ───────────────────────
  console.log('📸 Navigating to Flow...');
  await page.getByRole('button', { name: /^flow$/i }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(screenshotsDir, 'flow.png'), fullPage: false });
  console.log('   Saved → flow.png');

  // ── 4. Settings tab ─────────────────────────
  console.log('📸 Navigating to Settings...');
  await page.getByRole('button', { name: /settings/i }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(screenshotsDir, 'settings.png'), fullPage: false });
  console.log('   Saved → settings.png');

  await browser.close();
  console.log('\n✅ All screenshots saved to:', screenshotsDir);
})();
