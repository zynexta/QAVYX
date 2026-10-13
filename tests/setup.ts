/**
 * Test setup, run before any test module is imported.
 *
 * Its only job is to close the one gap between jsdom and what GSAP touches at
 * import time. `motion/gsap.ts` calls `registerPlugin(ScrollTrigger)` at module
 * scope, ScrollTrigger's `register()` reaches straight for `window.matchMedia`,
 * and jsdom does not implement it — so a jsdom test file throws while resolving
 * its own imports, before a single assertion runs.
 *
 * This has to be a setup file rather than a few lines at the top of the test:
 * static imports are hoisted, so anything written inside the test module runs
 * *after* GSAP has already been imported and thrown.
 *
 * Deliberately inert under the node environment (the default for `tests/unit`),
 * where there is no `window` to patch and no DOM test to serve.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  // Always non-matching: reduced motion, hover and pointer capability are
  // decided by explicit test state, never inferred from the environment.
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
