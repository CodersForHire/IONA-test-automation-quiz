import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './playwright',
  // Every jericMarkCalamba test generates and owns its own account and
  // checkout data (see playwright/jericMarkCalamba/data/testData.ts), so
  // nothing in that suite depends on execution order or another test's
  // state - full parallelism is safe per the team's conventions doc (§14).
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Capped locally after adding the firefox/webkit projects below: running
  // all three engines meant Playwright's default worker count (CPU-based,
  // 6 on this machine) launched up to 6 browser processes across 3
  // different engines at once. That wasn't just slow - it was severe
  // enough contention to intermittently lose real input (a checkout test
  // failed with its Name/Credit card fields reading as blank at submit,
  // despite `fill()` having been awaited) and to blow past a 15s
  // action timeout that was already 50% more generous than before this
  // project list grew. Raising per-action timeouts further couldn't fix
  // that - a second run with the higher timeout in place produced MORE
  // failures, not fewer, which is the signature of the browsers
  // themselves being starved rather than the app just being slow to
  // respond. Fewer simultaneous browser processes is the actual fix.
  // In CI, the equivalent (and better) fix is one job per project instead
  // of cramming three engines' worth of parallelism onto one runner.
  workers: process.env.CI ? undefined : 3,
  reporter: [
    // Live console feedback while a run is in progress.
    ['list'],
    // Interactive, trace-linked report for local debugging (unchanged).
    ['html', { open: 'never' }],
    // Machine-readable output so CI platforms (GitHub Actions, GitLab, ...)
    // can render a native pass/fail summary and history without anyone
    // having to open the HTML report - closes the "poor reporting" gap
    // from the architecture review without needing a hosted dashboard.
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    // Overridable via a local .env (see .env.example) rather than hardcoded,
    // per the team's conventions doc (§13).
    baseURL: process.env.BASE_URL || 'https://www.demoblaze.com',
    screenshot: 'only-on-failure',
    // On by default per §14: cheap when nothing retries, and turns a CI
    // failure into a fully-inspectable trace instead of a guessing game.
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    // Bumped from 10000ms after adding the firefox/webkit projects below -
    // reasonable general headroom for a shared public demo backend, kept
    // even though it turned out NOT to be the real fix for the contention
    // failures seen locally (see `workers` above for what actually was).
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Cross-browser coverage: previously Chromium-only. Firefox and WebKit
    // are cheap to add via `projects` and catch engine-specific rendering
    // differences - relevant here because this suite already documents a
    // Bootstrap 4.0.0-alpha.6 modal-transition quirk (see
    // pages/home.page.ts#openModal) that is exactly the kind of thing that
    // can behave differently by engine.
    //
    // Run `npm run pw:install` again after pulling this change - it
    // downloads all three browser binaries by default, but only Chromium
    // was ever exercised locally before this project list grew.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
