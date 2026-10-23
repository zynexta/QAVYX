// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { Footer } from '../../components/nav/Footer';
import { SiteHeader } from '../../components/nav/SiteHeader';
import { ROUTE_MARK_BOOT } from '../../lib/route-mark';

/**
 * WHICH NAV ITEM IS LIT, and the three ways of getting it wrong.
 *
 * The rest of the shell is asserted as text in `site-header.test.ts`, which is
 * the right shape for markup and for a script whose guards are the thing under
 * test. This one is different: the mark is a RULE — longest match, on a segment
 * boundary, across both navigations at once — and a rule is only worth asserting
 * by running it. None of its failure modes is visible in the source:
 *
 *   - `startsWith` lights `Launch` on `/launchpad`, a different page that merely
 *     begins with the same eight characters.
 *   - first-match-wins lights the `Who We Are` section on `/who-we-are/contact`,
 *     where `Contact Us` is sitting in the same list.
 *   - a winner picked PER LIST would light the footer's nearest entry and the
 *     menu's nearest entry separately, and the two lists do not carry the same
 *     routes — `/launchpad` is in one and not the other.
 *
 * So the boot script is executed here rather than grepped, against both
 * navigations' own rendered markup and against a real `location`. It is also the
 * only test that would catch the template-literal trap the script's own comment
 * describes: a regex escape written with a backslash is resolved by the template
 * before the browser sees it, and ships a syntax error to every page on the site.
 */

beforeAll(() => {
  // The two lists as the layouts render them, in document order.
  document.body.innerHTML =
    renderToStaticMarkup(createElement(SiteHeader)) +
    renderToStaticMarkup(createElement(Footer));
  // Once. The script hooks `history` and `popstate` and outlives every
  // navigation, which is the whole reason it is a script and not a component —
  // booting it per case would stack wrappers and prove nothing.
  new Function(ROUTE_MARK_BOOT)();
});

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const lit = (scope: string) =>
  [...document.querySelectorAll(`${scope} [aria-current="page"]`)].map(
    (el) => el.getAttribute('href') ?? '',
  );

/** A client-side navigation, which is what Next does and what the script hooks. */
function go(path: string) {
  history.pushState({}, '', path);
  return { menu: lit('#qx-menu-panel'), footer: lit('#qx-footer') };
}

describe('the current page in both navigations', () => {
  it.each([
    ['/', '/'],
    ['/growth-marketing', '/growth-marketing'],
    ['/social-content', '/social-content'],
    ['/ai-automation', '/ai-automation'],
    ['/build-scale', '/build-scale'],
    ['/launch', '/launch'],
    ['/faq', '/faq'],
    ['/who-we-are', '/who-we-are'],
    ['/who-we-are/contact', '/who-we-are/contact'],
  ])('lights the entry whose route is exactly the page: %s', (path, href) => {
    expect(go(path)).toEqual({ menu: [href], footer: [href] });
  });

  it('lights nothing on /services since it is removed from both navigations', () => {
    expect(go('/services')).toEqual({ menu: [], footer: [] });
  });

  /**
   * The section's own child. `/who-we-are/team` is a real page with no entry of
   * its own — built, unlinked and switched off until its profiles arrive. Exact
   * matching would light nothing on it, which tells a visitor they are nowhere.
   */
  it('lights the section a child route belongs to', () => {
    expect(go('/who-we-are/team')).toEqual({ menu: ['/who-we-are'], footer: ['/who-we-are'] });
  });

  /**
   * THE TRAP. `/launchpad` starts with `/launch` and is not inside it — a
   * coming-soon product, not a section of the Launch page. A prefix test without
   * a segment boundary lights the wrong row here and nowhere else, which is why
   * it would survive a manual check of the menu.
   *
   * It is also the case that proves the winner is computed across BOTH lists:
   * only the footer carries `/launchpad`, and the menu must light nothing rather
   * than fall back to its own nearest entry.
   */
  it('does not light Launch on /launchpad, and lights launchpad in both navigations', () => {
    expect(go('/launchpad')).toEqual({ menu: ['/launchpad'], footer: ['/launchpad'] });
  });

  /**
   * The legal pages are links in a sentence at the foot of the page, not entries
   * in a navigation — so neither list carries them and neither lights anything.
   * Lighting the nearest thing would be inventing an answer.
   */
  it.each(['/privacy-policy', '/terms-of-service'])('lights nothing on %s', (path) => {
    expect(go(path)).toEqual({ menu: [], footer: [] });
  });

  /** A trailing slash is the same page, and `/` itself must survive the trim. */
  it('ignores a trailing slash', () => {
    expect(go('/growth-marketing/').menu).toEqual(['/growth-marketing']);
    expect(go('/').menu).toEqual(['/']);
  });

  /**
   * ONE WINNER, AND THE OLD ONE GOES. The footer is on screen the whole time, so
   * a mark that is only ever added is a footer that accumulates green rows as
   * the visitor moves around the site.
   */
  it('clears the previous mark on every navigation', () => {
    go('/faq');
    go('/projects');
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(2);
    expect(go('/projects')).toEqual({ menu: ['/projects'], footer: ['/projects'] });
  });

  /**
   * BACK AND FORWARD. `pushState` fires no event and is hooked by wrapping the
   * method; the browser's own history moves fire `popstate` and are hooked the
   * ordinary way. Asserted by clearing the marks by hand and letting the
   * listener put them back, because jsdom's `history.back()` is asynchronous and
   * would make this a timing test rather than a wiring one.
   */
  it('re-marks on popstate', () => {
    go('/faq');
    for (const el of document.querySelectorAll('[aria-current]'))
      el.removeAttribute('aria-current');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(lit('#qx-footer')).toEqual(['/faq']);
    expect(lit('#qx-menu-panel')).toEqual(['/faq']);
  });

  /**
   * `replaceState` too. Next uses it as well as `pushState`, and a wrapper on
   * one of the two leaves half of client-side navigation unobserved.
   */
  it('re-marks on replaceState', () => {
    go('/faq');
    history.replaceState({}, '', '/growth-marketing');
    expect(lit('#qx-menu-panel')).toEqual(['/growth-marketing']);
  });

  /**
   * IT CALLS THROUGH. The wrapper replaces two methods every framework on the
   * page also uses — Next patches the same two from its own bundle — so it must
   * return what it replaced returned and must actually move the URL. A wrapper
   * that swallowed the call would break routing site-wide and light the right
   * link while doing it.
   */
  it('leaves history itself working', () => {
    go('/projects');
    expect(location.pathname).toBe('/projects');
  });
});

/**
 * The one path jsdom cannot stage: a hard load, where the script runs at the top
 * of `<body>` and both navigations are still unparsed. `document.readyState` is
 * already `complete` here, so the guard is asserted as text — drop it and every
 * full page load ships with nothing marked until the visitor navigates.
 */
describe('the hard-load path', () => {
  it('waits for the document when it runs before the markup', () => {
    expect(ROUTE_MARK_BOOT).toContain("d.readyState==='loading'");
    expect(ROUTE_MARK_BOOT).toContain("d.addEventListener('DOMContentLoaded',mark)");
  });

  it('is syntactically valid, self-invoking JavaScript', () => {
    expect(() => new Function(ROUTE_MARK_BOOT)).not.toThrow();
    expect(ROUTE_MARK_BOOT.startsWith('(function(){')).toBe(true);
    expect(ROUTE_MARK_BOOT.trimEnd().endsWith('})();')).toBe(true);
  });

  /**
   * THE JOINT. One string in three files, related by nothing the compiler can
   * see: this script queries it, and both navigations render it. Drop it from
   * either list and that list silently stops being marked.
   */
  it('queries the attribute both navigations render', () => {
    expect(ROUTE_MARK_BOOT).toContain('[data-qx-nav-mark]');
    const header = renderToStaticMarkup(createElement(SiteHeader));
    const footer = renderToStaticMarkup(createElement(Footer));
    expect(header).toContain('data-qx-nav-mark');
    expect(footer).toContain('data-qx-nav-mark');
    // Served without a mark, because the server does not know the route: both
    // lists are rendered by layouts, and a layout is not told the page below it.
    expect(header).not.toContain('aria-current');
    expect(footer).not.toContain('aria-current');
  });

  /**
   * AND THE MARK BEATS REACT TO THE ANCHOR, which is a real cost of the line
   * above. `DOMContentLoaded` fires before the client bundle, so by the time
   * React hydrates one of these links carries an attribute the server did not
   * render — and React reports that on every page load. It is a warning and not
   * a broken page, which is exactly why nothing else notices.
   *
   * `suppressHydrationWarning` is React's own remedy for an attribute a pre-paint
   * script owns, and `app/layout.tsx` already uses it for `data-qx-motion`. It is
   * a PROP and never reaches the markup, so it is asserted against the source —
   * crude, and the alternative is asserting nothing.
   */
  for (const [file, near] of [
    ['components/nav/SiteHeader.tsx', 'qx-menu__link'],
    ['components/nav/Footer.tsx', 'FOOTER_NAV.map'],
  ] as const) {
    it(`suppresses the hydration warning the mark causes in ${file}`, () => {
      // `resolve` off `import.meta.url` rather than a `new URL(...)` handed
      // straight to `readFileSync`: this file runs in jsdom, whose `URL` is not
      // the one Node's fs recognises, and the mismatch reads as ENOENT on a
      // path ending in "undefined".
      const src = readFileSync(resolve(ROOT, file), 'utf8');
      const at = src.indexOf(near);
      expect(at, `${near} not found in ${file}`).toBeGreaterThan(-1);
      // Within the list's own JSX, not merely somewhere in the file.
      expect(src.slice(at, at + 1600)).toContain('suppressHydrationWarning');
    });
  }
});
