import type { Config } from 'tailwindcss';

/**
 * Every value here points at a --qx-* custom property declared in
 * styles/tokens.css. Nothing is duplicated as a literal, so the token file
 * stays the single source of truth and runtime re-theming (frame stroke during
 * Engine 2, navbar handoff, reduced-motion path) works by changing variables.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './content/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'qx-black': 'var(--qx-black)',
        'qx-ink': 'var(--qx-ink)',
        // `bg-qx-ink-raised` was already written in four components before this
        // line existed, so all four resolved to no background at all — three CTA
        // hovers with no hover state and `UiOnlyForm`'s panel with no panel.
        'qx-ink-raised': 'var(--qx-ink-raised)',
        'qx-green': 'var(--qx-green)',
        'qx-green-dim': 'var(--qx-green-dim)',
        'qx-white': 'var(--qx-white)',
        'qx-grey': 'var(--qx-grey)',
        'qx-line': 'var(--qx-line)',
        'qx-hull': 'var(--qx-hull)',
      },
      fontFamily: {
        display: ['var(--qx-font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--qx-font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--qx-font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': 'var(--qx-text-2xs)',
        xs: 'var(--qx-text-xs)',
        sm: 'var(--qx-text-sm)',
        md: 'var(--qx-text-md)',
        lg: 'var(--qx-text-lg)',
        xl: 'var(--qx-text-xl)',
        '2xl': 'var(--qx-text-2xl)',
        '3xl': 'var(--qx-text-3xl)',
        '4xl': 'var(--qx-text-4xl)',
      },
      spacing: {
        1: 'var(--qx-space-1)',
        2: 'var(--qx-space-2)',
        3: 'var(--qx-space-3)',
        4: 'var(--qx-space-4)',
        5: 'var(--qx-space-5)',
        6: 'var(--qx-space-6)',
        7: 'var(--qx-space-7)',
      },
      borderRadius: {
        sm: 'var(--qx-radius-sm)',
        md: 'var(--qx-radius-md)',
        lg: 'var(--qx-radius-lg)',
      },
      zIndex: {
        grain: 'var(--qx-z-grain)',
        stage: 'var(--qx-z-stage)',
        copy: 'var(--qx-z-copy)',
        nav: 'var(--qx-z-nav)',
        float: 'var(--qx-z-float)',
        // Parity only, today: the panel sets `z-index: var(--qx-z-menu)` in
        // `styles/menu.css` rather than through a class. It is here so this map
        // stays a complete mirror of the `--qx-z-*` tokens — a gap in it reads
        // as "there is no such layer" to whoever needs the class next.
        menu: 'var(--qx-z-menu)',
        cursor: 'var(--qx-z-cursor)',
        skip: 'var(--qx-z-skip)',
      },
      screens: {
        // THE REAL SWITCH IS POINTER CAPABILITY, NOT WIDTH — BUILD-PLAN Phase
        // 10, and Phase 10 is where that stopped being an aspiration.
        // `hooks/useDeviceTier.ts` reads `any-pointer: fine` and it is what
        // decides which intro a visitor gets. These four are for LAYOUT ONLY,
        // with no exceptions.
        sm: '640px',
        // `md` USED TO CLAIM "below this the carousel pin is not created", for
        // two phases, while nothing enforced it. Phase 10 enforced it and the
        // client reverted it — a phone gets the same scrolling experience as a
        // desktop — so the claim is gone rather than re-asserted. There is no
        // width at which the pin is suppressed; the one gate is the motion
        // preference, in `components/hero/HeroMount.tsx`.
        //
        // It is still the width at which a service panel takes its second
        // column (`ServicePanel`'s slide variant), which is all it ever was.
        md: '768px',
        lg: '1024px', // the stacked card's second column; the rays' gutter
        xl: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
