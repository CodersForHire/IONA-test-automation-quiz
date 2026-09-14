import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'always' }]],
  use: {
    baseURL: 'https://www.demoblaze.com',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 10000,
    trace: "on",
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
