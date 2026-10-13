import { Inter, JetBrains_Mono, Outfit } from 'next/font/google';

/**
 * Typeface roles.
 *
 * NOTE — the display face is a stand-in. The TDD specifies Satoshi (Fontshare),
 * which is not on Google Fonts and needs to be self-hosted from a licensed
 * download. Outfit is used until that asset lands: it is a geometric sans with
 * the sharp apexes and wide proportions of the QAVYX letterforms, so the type
 * colour of the page is representative rather than arbitrary.
 *
 * Swapping is a one-file change — nothing imports a typeface directly, only
 * `display` / `body` / `mono` from here.
 *
 * This does NOT affect the logo. Per BUILD-PLAN correction #4 the AVYX
 * letterforms are custom SVG paths, so the logo geometry has no font
 * dependency and needs no document.fonts.ready gate.
 */

/**
 * All three are variable fonts. Do NOT pass `weight` — next/font emits a full
 * copy of the variable file per weight listed, so `weight: ['400','500']`
 * shipped two byte-identical 47 kB Inter files. Omitting it ships one file
 * covering the whole axis, which is both smaller and more flexible.
 */

export const display = Outfit({
  subsets: ['latin'],
  variable: '--qx-font-display',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const body = Inter({
  subsets: ['latin'],
  variable: '--qx-font-body',
  display: 'swap',
  // Only the display face is preloaded — preloading all three competes for
  // bandwidth against the LCP element.
  preload: false,
  adjustFontFallback: true,
});

// Mono is used only for the carousel counter and the dev overlay, neither of
// which exists at first paint, so it stays off the critical path entirely.
// Here `weight` IS specified: only one weight is ever used, and a single static
// instance (20.7 kB) is smaller than the variable file (39.5 kB). The rule above
// only wins when more than one weight is needed.
export const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--qx-font-mono',
  display: 'swap',
  preload: false,
  adjustFontFallback: true,
});

export const fontVariables = [display.variable, body.variable, mono.variable].join(' ');
