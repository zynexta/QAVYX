import { defineConfig, devices } from '@playwright/test';

/**
 * Uses the system Chrome (`channel: 'chrome'`) rather than a downloaded
 * Chromium build, so CI and local runs need no ~150 MB browser download.
 *
 * retries: 0 everywhere, deliberately. A retry on an animation test converts a
 * real race condition into an intermittent pass. If a test needs a retry it is
 * testing the wrong thing — rewrite it to seek a timeline to a fixed progress
 * rather than to wait on wall-clock time.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  // One worker: every spec shares the single `next dev` server, and parallel
  // pages holding Next's HMR connection while one test reloads makes a worker
  // hang on teardown (each spec passes cleanly on its own). Serial is both
  // reliable and, given that hang, faster. Revisit with per-worker servers in
  // Phase 13 if the suite grows.
  workers: 1,
  retries: 0,
  /**
   * 90s, not Playwright's default 30s.
   *
   * Not a retry in disguise — `retries` stays 0. The pin is 1015vh and `scrubTo`
   * lands on a progress by wheeling in three phases, then polls the scrubbed
   * value to stability; Lenis lerps at 0.1 and the tweens are `scrub: 1`, so one
   * landing legitimately takes seconds. "the indicator counts 01..06" does seven
   * landings in sequence and a PASSING run of it measured ~45s at six, so at 30s
   * the suite was partly measuring how loaded the machine was.
   *
   * This removes that failure mode. It does NOT fix the flake, and the comment
   * should not be read as claiming it does: that test still fails roughly one
   * run in four, in the inner `settleValue` poll, which has its own 15s budget.
   * The real fix is rewriting it as a seek-based test, per the house rule.
   * Until then a red run here is this flake, not a regression.
   */
  timeout: 90_000,
  reporter: [['list']],
  /**
   * NOTE FOR PHASE 9 AND AFTER: `reducedMotion` is deliberately NOT set here,
   * and must not be set with `test.use()` in a spec either — in this setup
   * neither takes effect. Measured, not assumed: with `test.use({ reducedMotion:
   * 'reduce' })` at file OR describe scope, the page still reports
   * `matchMedia('(prefers-reduced-motion: reduce)').matches === false`, while
   * `browser.newContext({ reducedMotion })` and `page.emulateMedia({
   * reducedMotion })` both work. Since Phase 9 that preference decides whether
   * the motion layer mounts at all, so a spec that "sets" it the idiomatic way
   * silently tests the opposite path — see `reduced-motion.spec.ts`, which uses
   * `emulateMedia` and anchors every assertion on a discriminator first.
   *
   * Everything else in this directory therefore runs at the platform default,
   * `no-preference`, and is implicitly a motion-path test.
   */
  use: {
    baseURL: 'http://localhost:3111',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'pnpm dev --port 3111',
    url: 'http://localhost:3111',
    reuseExistingServer: true,
    timeout: 90_000,
  },
});
