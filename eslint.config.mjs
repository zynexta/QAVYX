import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

/**
 * Architecture boundaries (BUILD-PLAN Phase 0).
 *
 * The point of configuring these on day one is that they are close to impossible
 * to retrofit once forty files exist. Each rule below prevents a specific class
 * of bug that the TDD depends on not happening:
 *
 *   motion/gsap.ts is a singleton   -> registering plugins twice re-creates the
 *                                      CustomEase definitions and can leave
 *                                      timelines referencing a stale curve.
 *   one rAF loop                    -> gsap.ticker drives Lenis; a second loop
 *                                      desyncs every scrubbed timeline.
 *   motion never imports UI         -> keeps timelines testable without React.
 *   content/state import only types -> keeps them free of runtime deps.
 */
const GSAP_SINGLETON =
  "Import gsap from '@/motion/gsap' (the registration singleton), never from the package. " +
  'Registering plugins more than once re-creates the CustomEase definitions.';

const MOTION_IS_LEAFWARD =
  'motion/ must not import UI. Timelines take refs as arguments so they stay testable without React.';

const DATA_IS_PURE = 'This layer may only import from @/types.';

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'assets/**'],
  },

  // --- Nothing outside motion/ may touch gsap or open its own rAF loop -------
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}'],
    rules: {
      // `paths` for the bare specifier, not `patterns`. ESLint 9 matches
      // `patterns` with gitignore semantics, where a slash-less pattern matches
      // at any depth — so group:['gsap'] also flagged '@/motion/gsap', the very
      // module this rule exists to funnel people towards. `paths` is exact.
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'gsap', message: GSAP_SINGLETON }],
          patterns: [{ group: ['gsap/*'], message: GSAP_SINGLETON }],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'requestAnimationFrame',
          message:
            'gsap.ticker is the only animation loop in this app. Add your callback there instead.',
        },
        {
          name: 'cancelAnimationFrame',
          message: 'gsap.ticker is the only animation loop in this app.',
        },
      ],
    },
  },

  // --- motion/ is leafward: it may use gsap, but never UI -------------------
  {
    files: ['motion/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/components/*', '@/hooks/*'], message: MOTION_IS_LEAFWARD },
            { group: ['../components/*', '../hooks/*'], message: MOTION_IS_LEAFWARD },
          ],
        },
      ],
    },
  },

  // --- content/ and state/ are pure data ------------------------------------
  // Listed explicitly rather than as ['@/*', '!@/types/*']: ESLint 9's pattern
  // matcher does not apply the negation the way minimatch would, so the
  // exception silently failed to exempt @/types.
  {
    files: ['content/**/*.ts', 'state/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'gsap',
                'gsap/*',
                'lenis',
                '@/motion/*',
                '@/components/*',
                '@/hooks/*',
                '@/lib/*',
              ],
              message: DATA_IS_PURE,
            },
          ],
        },
      ],
    },
  },

  // --- motion/gsap.ts is the one place the package may be imported ----------
  {
    files: ['motion/gsap.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
];

export default config;
