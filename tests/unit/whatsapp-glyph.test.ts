import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WhatsAppGlyph } from '../../components/nav/WhatsAppGlyph';

/**
 * The WhatsApp mark, and the two callers that paint it.
 *
 * It was a stroked bubble drawn in the house style, and both callers reached
 * into it from outside: they set `stroke-width` in a class and thickened it on
 * hover. That coupling is invisible to the type-checker — a caller can pass any
 * class string it likes, and a glyph that no longer has a stroke will simply
 * ignore it. Which is exactly what happened when the official mark went in: a
 * filled path, and two hover effects silently doing nothing.
 *
 * So the joint is asserted here in both directions. The glyph must stay filled,
 * and no caller may style it as though it were not.
 */

const html = renderToStaticMarkup(createElement(WhatsAppGlyph, { className: 'x' }));

const CALLERS = ['WhatsAppButton.tsx', 'SiteHeader.tsx'].map((file) => ({
  file,
  source: readFileSync(new URL(`../../components/nav/${file}`, import.meta.url), 'utf8'),
}));

describe('the WhatsApp mark', () => {
  /**
   * ONE PATH. The mark is a tail, a ring and a handset, and drawing it as three
   * shapes is how the old bubble got its detached tail: separate sub-shapes meet
   * at a seam, and a seam is a place for one of them to be a pixel out. The ring
   * is hollow because the two contours wind opposite ways under the default
   * non-zero fill rule, not because anything was subtracted.
   */
  it('is a single filled path with no stroke', () => {
    expect([...html.matchAll(/<path/g)]).toHaveLength(1);
    expect(html).toContain('fill="currentColor"');
    expect(html).not.toContain('stroke');
  });

  /** It inherits its colour, like every other icon on the site. */
  it('takes its colour from the caller and nothing else', () => {
    expect(html).not.toMatch(/fill="#|fill="rgb|fill="[a-z]+"/);
    expect(html).toContain('class="x"');
  });

  /**
   * The hole in the bubble is load-bearing: without it the mark is a green
   * lozenge. `d` therefore has to carry more than one subpath — a second `M`
   * after the opening one — and a "simplification" that merges them would pass
   * every other assertion here.
   */
  it('keeps the contours that punch the ring open', () => {
    const d = /<path d="([^"]+)"/.exec(html)?.[1] ?? '';
    expect(d.match(/[Mm]/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(html).not.toContain('fill-rule');
  });

  /** It stays inside its box at any size — the callers set the box in rem. */
  it('is drawn on the 24-unit grid the callers size against', () => {
    expect(html).toContain('viewBox="0 0 24 24"');
  });

  /** Decorative: the link around it carries the accessible name. */
  it('is hidden from assistive technology', () => {
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
  });
});

describe('the callers', () => {
  /**
   * THE JOINT THAT BROKE ONCE. A filled path has no stroke to thicken, so a
   * `stroke-width` hover on this glyph is a hover effect that does nothing —
   * and it looks completely correct in the source.
   */
  it.each(CALLERS)('$file styles the glyph without stroke-width', ({ source }) => {
    const line = source.split('\n').find((l) => l.includes('<WhatsAppGlyph')) ?? '';
    expect(line).not.toBe('');
    expect(line).not.toContain('stroke-width');
    expect(line).toContain('group-hover:scale-110');
  });

  /**
   * The mark fills its viewBox edge to edge, which the stroked bubble did not —
   * so the box each caller gives it IS the drawn size now, and the two sizes are
   * the ones chosen against that. `--qx-float-size` is 48px and the header's
   * target is 44px; a glyph as large as its target has no clearance at all.
   */
  it.each(CALLERS)('$file gives it a box smaller than its target', ({ source }) => {
    const line = source.split('\n').find((l) => l.includes('<WhatsAppGlyph')) ?? '';
    const rem = Number(/h-\[([0-9.]+)rem\]/.exec(line)?.[1] ?? NaN);
    expect(rem).toBeGreaterThan(0);
    // 2.75rem is the header control; --qx-float-size is 3rem. Either way the
    // mark has to leave room around itself inside the thing it is centred in.
    expect(rem).toBeLessThanOrEqual(2.25);
  });
});
