import { describe, expect, it } from 'vitest';
import { ANCHOR_SCROLL_BOOT } from '@/lib/anchor-scroll';
import { PILLAR_PAGES, sectionAnchor } from '@/content/pillars';

/**
 * The pre-paint script that turns a chip's fragment jump into a scroll.
 *
 * It is a STRING, executed by the browser before React exists, so there is no
 * component to render and nothing to mount. What is testable here is the shape
 * of it — that every guard the docblock promises is actually present, and that
 * it is valid JavaScript rather than a template literal that happens to parse as
 * TypeScript. The behaviour itself is browser work and belongs in the e2e suite.
 *
 * These read as crude assertions and they are, deliberately: this file's job is
 * to fail when someone edits the script and silently drops a guard. Every one of
 * the three below is a way a visitor could be stranded.
 */

describe('ANCHOR_SCROLL_BOOT', () => {
  it('is syntactically valid, self-invoking JavaScript', () => {
    // `new Function` compiles without executing. A typo inside a template
    // literal is otherwise invisible until it throws in a real browser, on a
    // page that then renders with no scroll and no error anyone sees.
    expect(() => new Function(ANCHOR_SCROLL_BOOT)).not.toThrow();
    expect(ANCHOR_SCROLL_BOOT.trim().startsWith('(function(){')).toBe(true);
  });

  it('leaves the fragment alone for a visitor who asked for no motion', () => {
    // The FIRST thing it does after finding a hash. If this check is ever
    // reordered below the `replaceState`, a reduced-motion visitor loses the
    // browser's own jump and lands at the top of the page with nothing to tell
    // them why.
    const hashAt = ANCHOR_SCROLL_BOOT.indexOf('location.hash');
    const mqAt = ANCHOR_SCROLL_BOOT.indexOf('prefers-reduced-motion: reduce');
    const stripAt = ANCHOR_SCROLL_BOOT.indexOf("history.replaceState(null,'',base)");
    expect(mqAt).toBeGreaterThan(hashAt);
    expect(stripAt).toBeGreaterThan(mqAt);
  });

  it('always puts the fragment back, including when nothing matches', () => {
    // It strips the hash to stop the native jump, so every exit after that point
    // MUST restore it or the visitor is left holding a URL that no longer points
    // at what they opened — including the stale-fragment path, where the element
    // is missing and there is nothing to scroll to.
    expect(ANCHOR_SCROLL_BOOT).toContain("base+'#'+h");
    expect(ANCHOR_SCROLL_BOOT).toMatch(/if\(!el\)\{restore\(\);return\}/);
  });

  it('waits for fonts and two frames, because DOMContentLoaded is too early', () => {
    // Measured: called at DOMContentLoaded the smooth scroll produced ONE scroll
    // event — a jump — because the document had not reached its final height and
    // the scroll clamped. See the docblock. Drop either the font wait or the
    // double rAF and the animation silently becomes a jump again.
    expect(ANCHOR_SCROLL_BOOT).toContain('document.fonts');
    expect(ANCHOR_SCROLL_BOOT).toMatch(/requestAnimationFrame\(function\(\)\{requestAnimationFrame/);
    expect(ANCHOR_SCROLL_BOOT).toContain("behavior:'smooth'");
  });
});

describe('the anchors it resolves', () => {
  /**
   * The script looks its target up with `getElementById(hash)`. That only works
   * while `PillarPage` writes the same string onto the section, and both sides
   * derive it from `sectionAnchor` — so this asserts the derivation produces an
   * id `getElementById` can actually find, i.e. no leading digit, no spaces, no
   * characters a fragment would percent-encode into something else.
   */
  it('produces ids a fragment can address verbatim', () => {
    for (const page of PILLAR_PAGES) {
      for (const section of page.sections) {
        const id = sectionAnchor(section.name);
        expect(encodeURIComponent(id)).toBe(id);
        expect(id).not.toMatch(/^\d/);
      }
    }
  });
});
