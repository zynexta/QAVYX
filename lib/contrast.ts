/**
 * WCAG 2.2 relative luminance and contrast ratio.
 *
 * Used by the token lab route to print ratios that are computed, not copied
 * from the spec — a hard-coded table drifts the moment a token changes.
 * Also used by the Phase 11 axe assertions.
 */

type Rgb = readonly [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ] as const;
}

/** WCAG 2.x relative luminance. */
export function luminance(hex: string): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two hex colours, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastVerdict = 'AAA' | 'AA' | 'AA-large' | 'non-text' | 'fail';

/**
 * WCAG 2.2 thresholds:
 *   1.4.3 Contrast (Minimum)   — 4.5:1 normal text, 3:1 large text
 *   1.4.6 Contrast (Enhanced)  — 7:1 normal text
 *   1.4.11 Non-text Contrast   — 3:1 UI components and graphical objects
 */
export function verdict(ratio: number): ContrastVerdict {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'fail';
}
