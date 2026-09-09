import { defineConfig, devices } from '@playwright/test';

import { ENV, envConfig, resolveWorkers } from './playwright/ronelgeronimo/src/utils/env';

/**
 * One config for every environment and every browser.
 *
 * The environment is selected at run time with TEST_ENV (dev | test | staging)
 * and resolved in playwright/ronelgeronimo/src/utils/env.ts, which also layers
 * .env.<TEST_ENV> and .env for credentials. See playwright/ronelgeronimo/README.md.
 */
export default defineConfig({
  testDir: './playwright',

  // Files run in parallel; tests WITHIN a file run in order. The authenticated
  // suite shares one DemoBlaze account, and keeping its tests serial within
  // their file is what stops two of them fighting over the same cart.
  fullyParallel: false,

  forbidOnly: !!process.env.CI,
  retries: envConfig.retries,

  // Capped deliberately. The system under test is a shared public demo, and
  // running three browser projects at full default concurrency saturates it —
  // logins and category filters start timing out for reasons that have nothing
  // to do with the tests. Concurrency is matched to what the target can serve.
  //
  // Override per machine with PW_WORKERS in .env; see resolveWorkers().
  workers: resolveWorkers(),

  timeout: 60_000,
  expect: { timeout: envConfig.expectTimeout },

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: envConfig.baseURL,
    actionTimeout: envConfig.actionTimeout,
    navigationTimeout: envConfig.navigationTimeout,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  metadata: { environment: ENV, baseURL: envConfig.baseURL },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
