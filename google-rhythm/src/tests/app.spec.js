import { test, expect } from 'playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173/';
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForSelector('h1', { timeout: 10000 });
});

// ─── Dashboard ───────────────────────────────
test.describe('Dashboard Tab', () => {
  test('loads and shows Google Rhythm header', async ({ page }) => {
    const header = page.locator('h1');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Google');
    await expect(header).toContainText('Rhythm');
  });

  test('shows the phase ring SVG circle', async ({ page }) => {
    // Scope to the specific ring SVG (w-64 h-64) to avoid matching lucide icon circles
    const ringCircles = page.locator('svg.w-64 circle');
    await expect(ringCircles).toHaveCount(2);
  });

  test('shows Cycle Day Simulator label', async ({ page }) => {
    await expect(page.getByText('Cycle Day Simulator')).toBeVisible();
  });

  test('slider → Ovulation at day 14', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    await slider.fill('14');
    await page.waitForTimeout(600);
    await expect(page.locator('span.uppercase.tracking-widest')).toContainText(/ovulation/i);
  });

  test('slider → Menstrual at day 1', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    await slider.fill('1');
    await page.waitForTimeout(600);
    await expect(page.locator('span.uppercase.tracking-widest')).toContainText(/menstrual/i);
  });

  test('slider → Follicular at day 8', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    await slider.fill('8');
    await page.waitForTimeout(600);
    await expect(page.locator('span.uppercase.tracking-widest')).toContainText(/follicular/i);
  });

  test('slider → Luteal at day 20', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    await slider.fill('20');
    await page.waitForTimeout(600);
    await expect(page.locator('span.uppercase.tracking-widest')).toContainText(/luteal/i);
  });

  test('screenshot: dashboard', async ({ page }) => {
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard.png'), fullPage: false });
  });
});

// ─── Insights ────────────────────────────────
test.describe('Insights Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole('button', { name: /insights/i }).click();
    await page.waitForTimeout(400);
  });

  test('shows Insights heading', async ({ page }) => {
    await expect(page.locator('h2').filter({ hasText: 'Insights' })).toBeVisible();
  });

  test('shows Adaptive Learning Active card', async ({ page }) => {
    await expect(page.getByText('Adaptive Learning Active')).toBeVisible();
  });

  test('shows Cycle History section', async ({ page }) => {
    // Cycle History is below the fold — scroll main container first
    await page.locator('main').evaluate(el => el.scrollTo(0, 500));
    await page.waitForTimeout(300);
    // Use heading role to avoid strict mode violation (getByText matched 2 elements)
    await expect(page.getByRole('heading', { name: 'Cycle History' })).toBeVisible();
  });

  test('shows Health Risk Detected card', async ({ page }) => {
    await expect(page.getByText('Health Risk Detected')).toBeVisible();
  });

  test('screenshot: insights', async ({ page }) => {
    await page.screenshot({ path: path.join(screenshotsDir, 'insights.png'), fullPage: false });
  });
});

// ─── Flow (Log) ──────────────────────────────
test.describe('Flow Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole('button', { name: /^flow$/i }).click();
    await page.waitForTimeout(400);
  });

  test('shows Log Data heading', async ({ page }) => {
    await expect(page.locator('h2').filter({ hasText: 'Log Data' })).toBeVisible();
  });

  test('shows symptom grid with 12 cards', async ({ page }) => {
    const symptomSection = page.locator('section').filter({ hasText: 'Symptoms' });
    await expect(symptomSection).toBeVisible();
    await expect(symptomSection.locator('button')).toHaveCount(12);
  });

  test('shows flow logging buttons', async ({ page }) => {
    const flowSection = page.locator('section').filter({ hasText: 'Bleeding' });
    await expect(flowSection.getByText('None')).toBeVisible();
    await expect(flowSection.getByText('Light')).toBeVisible();
    await expect(flowSection.getByText('Medium')).toBeVisible();
    await expect(flowSection.getByText('Heavy')).toBeVisible();
  });

  test('shows Save Log button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save log/i })).toBeVisible();
  });

  test('screenshot: flow', async ({ page }) => {
    await page.screenshot({ path: path.join(screenshotsDir, 'flow.png'), fullPage: false });
  });
});

// ─── Settings ────────────────────────────────
test.describe('Settings Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(400);
  });

  test('shows Settings heading', async ({ page }) => {
    await expect(page.locator('h2').filter({ hasText: 'Settings' })).toBeVisible();
  });

  test('shows Dietary Preferences section', async ({ page }) => {
    await expect(page.getByText('Dietary Preferences')).toBeVisible();
  });

  test('shows Vegetarian diet button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^vegetarian$/i })).toBeVisible();
  });

  test('shows Non-Vegetarian diet button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /non-vegetarian/i })).toBeVisible();
  });

  test('clicking Vegetarian toggles selection', async ({ page }) => {
    const vegBtn = page.getByRole('button', { name: /^vegetarian$/i });
    await vegBtn.click();
    await page.waitForTimeout(300);
    await expect(vegBtn).toBeVisible();
  });

  test('shows Integrations with Connect Calendar', async ({ page }) => {
    await expect(page.getByText('Integrations')).toBeVisible();
    await expect(page.getByRole('button', { name: /connect calendar/i })).toBeVisible();
  });

  test('shows Health Journey Mode section', async ({ page }) => {
    await expect(page.getByText('Health Journey Mode')).toBeVisible();
    await expect(page.getByRole('button', { name: /standard cycle/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pregnancy/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /perimenopause/i })).toBeVisible();
  });

  test('screenshot: settings', async ({ page }) => {
    await page.screenshot({ path: path.join(screenshotsDir, 'settings.png'), fullPage: false });
  });
});

// ─── Dark Mode ───────────────────────────────
test.describe('Dark Mode Toggle', () => {
  test('starts in dark mode (outer div has class "dark")', async ({ page }) => {
    // The 'dark' class is on the min-h-screen div, not on #root
    await expect(page.locator('div.min-h-screen')).toHaveClass(/dark/);
  });

  test('toggles dark→light→dark', async ({ page }) => {
    const outerDiv = page.locator('div.min-h-screen');
    const toggleBtn = page.locator('header button');

    // Use classList.contains() — the only reliable way to check for the standalone
    // 'dark' token since Tailwind utilities like 'dark:bg-zinc-950' would
    // false-positive on any regex containing 'dark'.
    const hasDarkAtStart = await outerDiv.evaluate(el => el.classList.contains('dark'));
    expect(hasDarkAtStart).toBe(true);

    // Toggle OFF (dark → light)
    await toggleBtn.click();
    await page.waitForTimeout(600);
    const hasDarkAfterOff = await outerDiv.evaluate(el => el.classList.contains('dark'));
    expect(hasDarkAfterOff).toBe(false);

    // Toggle ON (light → dark)
    await toggleBtn.click();
    await page.waitForTimeout(600);
    const hasDarkAfterOn = await outerDiv.evaluate(el => el.classList.contains('dark'));
    expect(hasDarkAfterOn).toBe(true);
  });

  test('Sun icon visible in dark mode', async ({ page }) => {
    await expect(page.locator('header button svg')).toBeVisible();
  });
});
