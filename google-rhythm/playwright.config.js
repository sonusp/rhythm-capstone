agy// playwright.config.js  (ESM — package.json has "type": "module")
import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: './src/tests',
  timeout: 30000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'msedge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        headless: true,
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
});
