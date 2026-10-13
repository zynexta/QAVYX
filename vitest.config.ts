import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

/**
 * Unit + integration tests. GSAP timelines are tested by seeking to a progress
 * value (jsdom), never by waiting on real time — see BUILD-PLAN Phase 13.
 * E2E lives in tests/e2e and runs under Playwright, excluded here.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // Unit tests are pure functions and run in node. Tests that need real
    // elements — anything building a GSAP timeline, since GSAP resolves selector
    // strings through `document` — opt into jsdom per-file with a
    // `// @vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    // Patches jsdom's missing matchMedia before GSAP is imported. No-op in node.
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@/components': resolve(__dirname, 'components'),
      '@/motion': resolve(__dirname, 'motion'),
      '@/hooks': resolve(__dirname, 'hooks'),
      '@/state': resolve(__dirname, 'state'),
      '@/content': resolve(__dirname, 'content'),
      '@/types': resolve(__dirname, 'types'),
      '@/lib': resolve(__dirname, 'lib'),
    },
  },
});
