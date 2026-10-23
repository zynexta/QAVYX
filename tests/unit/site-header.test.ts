import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SiteHeader } from '../../components/nav/SiteHeader';
import { MENU_BOOT } from '../../lib/menu';
import { NAV_REVEAL_BOOT } from '../../lib/nav-reveal';
import { CONTACT_NAV, MENU_NAV, SITE_INDEX, SOCIAL } from '../../content/site';

/**
 * The header and the menu it opens.
 *
 * All of it is server-rendered markup plus a stylesheet plus one inline script,
 * so the whole feature is checkable without a browser — and the two joints that
 * a type-checker cannot see are exactly where it would break.
 *
 * ## The two joints
 *
 * `lib/menu.ts` addresses the DOM by three strings — `#qx-menu-toggle`,
 * `#qx-menu-panel` and the `data-qx-menu` attribute — and `styles/menu.css`
 * reads the third. Rename any of them in one file and the other two compile
 * perfectly and do nothing: the button becomes inert, the panel never opens, and
 * nothing anywhere reports a fault. Both are asserted below as text.
 *
 * ## What is NOT asserted here
 *
 * The animation. It is `transition-delay` on a class and there is no layout in
 * jsdom to measure it against; `tests/e2e/phase8c-shell.spec.ts` owns the parts
 * that need a real viewport (that the header sits below the pinned hero at load,
 * and that the served panel computes to `visibility: hidden`).
 */

const html = renderToStaticMarkup(createElement(SiteHeader));
const css = readFileSync(new URL('../../styles/menu.css', import.meta.url), 'utf8');

describe('the header bar', () => {
  /**
   * THE ONE RULE THE OLD `THERE IS NO NAVBAR` DECISION LEAVES STANDING. The bar
   * carries controls: the mark (home), WhatsApp, and the button. Three links
   * here is a navigation bar, which is the thing the client removed.
   */
  it('carries no navigation links and no nav landmark', () => {
    const bar = html.slice(0, html.indexOf('</header>'));
    const hrefs = [...bar.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]!);
    // Three anchors, and exactly one of them goes anywhere on this site: the
    // mark. The second leaves for WhatsApp and the third is the no-JS opener,
    // whose destination is the panel sitting a few nodes away. A fourth, or any
    // href that is a route, is the navigation bar coming back.
    expect(hrefs).toHaveLength(3);
    expect(hrefs.filter((h) => h.startsWith('/'))).toEqual(['/']);
    expect(hrefs.filter((h) => h.startsWith('https://wa.me/'))).toHaveLength(1);
    expect(hrefs).toContain('#qx-menu-panel');
    expect(bar).not.toContain('<nav');
  });

  /**
   * The two openers are one control drawn twice and the stylesheet shows one.
   * They must therefore be indistinguishable, which is why the classes and the
   * inner markup come from a shared constant and a shared component rather than
   * being written out twice — a divergence here is invisible right up until the
   * moment the other half is the one on screen.
   */
  it('serves a scripted opener and a no-JS opener that look the same', () => {
    const bar = html.slice(0, html.indexOf('</header>'));
    expect(bar).toContain('id="qx-menu-open"');
    expect(bar).toContain('id="qx-menu-toggle"');
    expect(bar).toContain('qx-menu-nojs');
    expect(bar).toContain('qx-menu-js');
    // The face, twice: two Menu/Close pairs and two icons.
    expect(bar.match(/qx-menu-toggle__words/g) ?? []).toHaveLength(2);
    expect(bar.match(/qx-menu-toggle__icon/g) ?? []).toHaveLength(2);
    // aria-expanded belongs to the button alone. A link that navigates to a
    // fragment is not claiming to expand anything.
    expect(bar.match(/aria-expanded/g) ?? []).toHaveLength(1);
  });

  /**
   * The panel is a SIBLING of the bar, and it has to stay one. Nested inside,
   * the bar's `backdrop-filter` becomes a containing block for `position: fixed`
   * and the full-height panel renders as a 77px sliver under the logo — measured,
   * in a browser, because nothing about it is visible from the markup.
   */
  it('keeps the panel outside the header element', () => {
    expect(html.indexOf('id="qx-menu-panel"')).toBeGreaterThan(html.indexOf('</header>'));
  });

  it('serves the toggle wired to the panel and announcing itself closed', () => {
    expect(html).toContain('id="qx-menu-toggle"');
    expect(html).toContain('aria-controls="qx-menu-panel"');
    expect(html).toContain('aria-expanded="false"');
  });
});

describe('the menu panel', () => {
  const items = MENU_NAV;

  /**
   * THE FIVE PILLARS ARE NOT IN THE MENU, on the client's direction, and this is
   * the assertion that keeps them out. `MENU_NAV` subtracts them from
   * `PRIMARY_NAV`; if that subtraction is ever undone the menu silently grows
   * back to eleven and nothing else here would notice, because every other test
   * in this block is derived from `MENU_NAV` itself.
   *
   * The other half — that they are still REACHABLE — is `site-content.test.ts`'s
   * job: `FOOTER_NAV` carries all eleven on every page.
   */
  it('carries the five pillars and Contact Us, while omitting Our Services', () => {
    for (const pillar of SITE_INDEX.pillars) {
      expect(items.map((i) => i.href)).toContain(pillar.href);
    }
    expect(items.map((i) => i.href)).not.toContain('/services');
    expect(items.map((i) => i.href)).toContain('/launchpad');
    expect(items).toHaveLength(11);
  });

  /**
   * SERVED WITH NEITHER `inert` NOR `aria-hidden`, and this test is the scar.
   *
   * Both were served for one round. Nothing without JavaScript ever removes
   * them, so the moment the fallback link could open the panel on `:target` it
   * opened an inert one — visible, unclickable, and still `aria-hidden` to a
   * screen reader. `visibility: hidden` alone is what closes it for that
   * visitor, and it is sufficient: tab order, accessibility tree and hit-testing
   * all go with it.
   *
   * `lib/menu.ts` adds both on load for the scripted path, which is also the
   * only thing that will ever take them off again.
   */
  it('serves the panel without inert or aria-hidden', () => {
    const panel = html.slice(html.indexOf('id="qx-menu-panel"'));
    const tag = panel.slice(0, panel.indexOf('>'));
    expect(tag).not.toContain('inert');
    expect(tag).not.toContain('aria-hidden');
    // The script owns both, and must set them.
    expect(MENU_BOOT).toContain('inert');
    expect(MENU_BOOT).toContain('aria-hidden');
  });

  it('carries the shortlist plus Contact Us, in order', () => {
    const panel = html.slice(html.indexOf('id="qx-menu-panel"'));
    const hrefs = [...panel.matchAll(/class="qx-menu__link"[^>]*>/g)];
    expect(hrefs).toHaveLength(items.length);
    for (const item of items) {
      // `&` is escaped in the served HTML, so three of the eleven labels do not
      // appear verbatim. Escaping here rather than loosening the match keeps
      // this asserting the whole label — "Social & Content" and not "Social".
      expect(panel).toContain(`>${item.label.replace(/&/g, '&amp;')}<`);
      expect(panel).toContain(`href="${item.href}"`);
    }
    // Order, not just membership — the numbers are a CSS counter off the list's
    // own order, so an item rendered fourth IS "04" whatever the data says.
    const order = items.map((i) => panel.indexOf(`href="${i.href}"`));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  /**
   * `--i` is the stagger's index and it is set inline from the same loop that
   * renders the item, so an item cannot animate third and be numbered fourth.
   * Zero-based, because `calc(200ms + var(--i) * 40ms)` wants the first item at
   * no delay beyond the panel's own.
   */
  it('numbers the stagger from zero, one per item', () => {
    const indices = [...html.matchAll(/--i:\s*(\d+)/g)].map((m) => Number(m[1]));
    expect(indices).toEqual(items.map((_, i) => i));
  });

  it('carries the socials block', () => {
    for (const social of SOCIAL) {
      expect(html).toContain(`href="${social.href}"`);
      expect(html).toContain(`>${social.label}<`);
    }
    // Leaving the site, so both halves of the safety pairing are required.
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

/**
 * THE JOINTS. Three strings shared across a `.ts`, a `.tsx` and a `.css`, none
 * of which the compiler relates to each other.
 */
describe('the script, the markup and the stylesheet agree', () => {
  /**
   * THE SCRIPT IS A TEMPLATE LITERAL, so a backtick anywhere inside it — in the
   * code or, as happened here, in one of its own comments citing `:target` —
   * ends the string early. TypeScript then reports errors on the JavaScript that
   * spilled out, which is a confusing way to be told about a stray character,
   * and a version that ends early in a way that still parses would ship a script
   * missing half its listeners with nothing to say so.
   *
   * `new Function` parses without executing, which is all this needs: there is
   * no DOM here and running it would only prove that `document` is undefined.
   */
  it('is syntactically valid JavaScript', () => {
    expect(() => new Function(MENU_BOOT)).not.toThrow();
    expect(MENU_BOOT.startsWith('(function(){')).toBe(true);
    expect(MENU_BOOT.trimEnd().endsWith('})();')).toBe(true);
  });

  it('addresses the ids the header actually renders', () => {
    for (const id of ['qx-menu-toggle', 'qx-menu-panel']) {
      expect(MENU_BOOT, `${id} is not addressed by the boot script`).toContain(id);
      expect(html, `${id} is not rendered`).toContain(`id="${id}"`);
    }
  });

  /**
   * ONE CONTROL OPENS AND CLOSES THE MENU, and this is the pair of assertions
   * that keeps the second one from coming back.
   *
   * `#qx-menu-close` was rendered for everyone and intercepted by the script,
   * because the panel covered the whole viewport height — including the toggle,
   * measured with `elementFromPoint` at 390px AND at 1440px. So the button
   * animated into an X that nothing could click and the sheet drew a second X
   * beside it. The panel starting at `--qx-nav-h` is what retired that: the bar
   * is uncovered at every width and the toggle does both jobs.
   *
   * The link stays in the markup for the `:target` path, which has no other way
   * out — but it is `qx-menu-nojs`, so it is `display: none` wherever the script
   * has run, and the script must therefore not address it at all. A branch that
   * cannot fire is worse than no branch: its comment describes a mechanism that
   * has moved.
   */
  it('leaves the panel clear of the header, so one control does both jobs', () => {
    const start = css.indexOf('.qx-menu {');
    const block = css.slice(start, css.indexOf('\n}', start));
    expect(block).toContain('inset: var(--qx-nav-h) 0 0 auto');
  });

  it('serves the in-panel close control to the no-JS path alone', () => {
    expect(html).toContain('id="qx-menu-close"');
    expect(html).toMatch(/id="qx-menu-close"[^>]*class="qx-menu-nojs /);
    expect(css).toContain('html[data-qx-menu-js] .qx-menu-nojs');
    // And the script must not reach for an element it can never be shown.
    expect(MENU_BOOT).not.toContain("closest('#qx-menu-close')");
  });

  it('opens on the one attribute the stylesheet reads', () => {
    expect(MENU_BOOT).toContain("'data-qx-menu'");
    expect(css).toContain('[data-qx-menu]');
  });

  /**
   * THE FOURTH SHARED STRING, and the one this file does not own.
   *
   * Which page you are on is state, like `aria-expanded` and `inert`, and this
   * one the server does not even know: the header is rendered by a route-group
   * LAYOUT, and a layout in the App Router is not told the route beneath it. So
   * the served markup carries no mark, the panel's `<nav>` opts in with
   * `data-qx-nav-mark`, and `lib/route-mark.ts` writes `aria-current` there and
   * in the footer off one match — see `nav-current.test.ts` for the rule.
   *
   * `MENU_BOOT` must NOT write it. It did for one round, at open time, which is
   * right for a panel nobody can read without opening and wrong for a footer
   * that is on screen the whole time; two mechanisms marking one attribute is
   * the state this asserts against coming back.
   */
  it('leaves the current-page mark to the route marker', () => {
    expect(html).toContain('data-qx-nav-mark');
    expect(css).toContain("[aria-current='page']");
    expect(html).not.toContain('aria-current');
    expect(MENU_BOOT).not.toContain('aria-current');
  });

  /**
   * COLOUR IS NOT THE MARK. Hover is already `--qx-green`, so a green label on
   * its own draws "the pointer is here" and "this is where you are" identically
   * — and on a phone there is no hover state to read it against at all. The rule
   * in the link's left padding is what carries it, and a change that reduced
   * this to a colour swap would look correct in a screenshot of a page nobody
   * was hovering.
   */
  it('marks the current page with more than a colour', () => {
    const start = css.indexOf(".qx-menu__link[aria-current='page']::before");
    expect(start).toBeGreaterThan(-1);
    const rule = css.slice(start, css.indexOf('\n}', start));
    expect(rule).toContain('height: var(--qx-stroke)');
    const mark = css.indexOf(".qx-menu__link[aria-current='page'] {");
    expect(css.slice(mark, css.indexOf('\n}', mark))).toContain('--qx-menu-mark:');
  });

  /**
   * THE INDENT COMES OUT OF THE GUTTER. Measured: added to `padding-left` on top
   * of the existing `padding-right`, the marked row is 0.7em narrower than the
   * same row unmarked — and at seven widths between 320 and 1920 that was the
   * difference between one line and two. "Contact Us" over two lines at 820px,
   * on `/who-we-are/contact` and nowhere else.
   *
   * The two paddings summing to a constant is what makes the label's available
   * width independent of the mark, and it is a property of the pair rather than
   * of either value — so it is asserted as the pair. Split them and the wrap
   * comes back at some width nobody is testing at.
   */
  it('spends the mark out of the link gutter rather than adding to it', () => {
    const base = css.indexOf('.qx-menu__link {');
    const block = css.slice(base, css.indexOf('\n}', base));
    expect(block).toContain('padding-left: var(--qx-menu-mark)');
    expect(block).toContain('padding-right: calc(0.7em - var(--qx-menu-mark))');
    expect(block).toContain('--qx-menu-mark: 0em');
  });

  /**
   * A closed panel must not be reachable, and `visibility` is the property that
   * takes it out of the tab order, the accessibility tree and hit-testing at
   * once. `opacity: 0` or a bare transform would leave a full-height invisible
   * panel eating clicks down the side of every page — the fault `#qx-stage` once
   * had against the site navigation.
   */
  it('hides the closed panel with visibility rather than opacity', () => {
    // The `.qx-menu { ... }` block alone. Slicing to the next open rule broke the
    // moment that rule gained a second selector and grew a comma — so this ends
    // at the block's own closing brace instead, which cannot drift.
    const start = css.indexOf('.qx-menu {');
    const closed = css.slice(start, css.indexOf('\n}', start));
    expect(closed).toContain('visibility: hidden');
    expect(closed).not.toContain('opacity: 0');
  });

  /**
   * The scroll lock. On `<html>` and not `<body>` because the homepage's Lenis
   * scrolls by writing `window.scrollTo`, and locking the root is what makes
   * that write a no-op without the script needing a reference to a Lenis
   * instance living in a lazy chunk it cannot see.
   */
  it('locks the root element while the panel is open', () => {
    expect(css).toMatch(/html\[data-qx-menu\],/);
    expect(css).toMatch(/overflow: hidden;/);
  });

  /**
   * THE NO-JS PATH, and the gate that switches it off.
   *
   * Every open rule is written twice — once for the scripted attribute, once for
   * `:target` — and the second is gated on the script NOT having run. Without
   * that gate a hand-typed `/faq#qx-menu-panel` opens a panel whose button still
   * reads "Menu", whose `aria-expanded` still reads false, and which Escape
   * cannot close, because one mechanism has it open and the other believes it
   * shut. So: no `:target` rule may appear without the gate on it.
   */
  it('gates every :target rule on the script not having run', () => {
    const targetRules = css
      .split('\n')
      .filter((line) => line.includes('.qx-menu:target'))
      .filter((line) => !line.trimStart().startsWith('*'));
    expect(targetRules.length).toBeGreaterThan(5);
    for (const rule of targetRules) {
      expect(rule, `ungated :target rule: ${rule.trim()}`).toContain(
        'html:not([data-qx-menu-js])',
      );
    }
  });

  /**
   * THE STICKY BAR AND THE FRAGMENT LANDINGS, which are two files agreeing on a
   * token. `--qx-nav-h` is the bar's height; `scroll-padding-top` in
   * `app/globals.css` is what keeps an anchored section from arriving behind it.
   *
   * A number typed into either file instead would be right until someone changed
   * the control's target size, at which point sections would land a few pixels
   * under the bar on every route with an anchor — which reads as a rendering
   * quirk rather than as a broken measurement.
   */
  it('derives the anchor-landing offset from the header height', () => {
    const globals = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8');
    const tokens = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8');
    expect(tokens).toContain('--qx-nav-h:');
    expect(globals).toMatch(/scroll-padding-top:\s*calc\(var\(--qx-nav-h\)/);
    // And the bar itself must be sized from it, or the two drift silently.
    expect(html).toContain('h-[var(--qx-nav-h)]');
  });

  /** And the script must actually set the attribute that gate reads. */
  it('marks the document as scripted before anything can be clicked', () => {
    expect(MENU_BOOT).toContain("setAttribute('data-qx-menu-js'");
    expect(css).toContain('html:not([data-qx-menu-js]) .qx-menu-js');
    expect(css).toContain('html[data-qx-menu-js] .qx-menu-nojs');
  });
});

/**
 * THE HOMEPAGE HEADER'S ARRIVAL, which is a separate thing from its position.
 *
 * Document position already decides WHEN — the bar is rendered after
 * `#qx-hero-reserve`, so its normal-flow position is on the far side of the pin.
 * What `deferred` adds is that it arrives AT the top edge instead of travelling
 * to it: a sticky element scrolls up through the viewport before it sticks, and
 * for ~800px of that journey a full-width bordered row floats in the middle of
 * an otherwise empty black screen.
 *
 * The behavioural half is measured in a browser (0 frames with the bar visible
 * away from the top edge, revealed at pin progress 1.0000, hidden again on the
 * way back up). What is checkable here is the shape of the thing: which routes
 * opt in, and that every rule is gated so the paths that cannot un-hide the
 * header never hide it.
 */
describe('the deferred header', () => {
  const headerCss = readFileSync(new URL('../../styles/header.css', import.meta.url), 'utf8');
  const deferred = renderToStaticMarkup(createElement(SiteHeader, { deferred: true }));

  it('is opt-in, and the inner routes do not opt in', () => {
    expect(html).not.toContain('qx-header--deferred');
    expect(html).not.toContain('qx-nav-sentinel');
    expect(deferred).toContain('qx-header--deferred');
    expect(deferred).toContain('id="qx-nav-sentinel"');
  });

  /**
   * The sentinel marks where the bar sits in flow, and the observer watches it
   * cross the top edge. Rendered after the header it would mark the wrong point
   * by the bar's own height; rendered inside it, it would be a child of an
   * element that is `position: fixed` by then and would stop describing the
   * document at all.
   */
  it('puts the sentinel before the header it stands in for', () => {
    expect(deferred.indexOf('id="qx-nav-sentinel"')).toBeLessThan(
      deferred.indexOf('id="qx-nav"'),
    );
  });

  /**
   * THE GATE, and the reason it is written where it is.
   *
   * Every rule in `header.css` hides or moves the site's navigation, and the
   * only thing that brings it back is an `IntersectionObserver`. So the
   * attribute those rules key off is set INSIDE the branch that has found both a
   * sentinel and an observer — never optimistically. Ungated, a visitor with no
   * JavaScript would get a header translated off the top of the screen by a
   * stylesheet with nothing left running to return it.
   */
  it('gates every rule on the observer actually being installed', () => {
    const rules = headerCss
      .split('\n')
      .filter((line) => line.trimEnd().endsWith('{'))
      .filter((line) => !line.trimStart().startsWith('@') && !line.trimStart().startsWith('*'))
      .map((line) => line.trim());
    expect(rules.length).toBeGreaterThan(1);
    for (const rule of rules) {
      // The sentinel's own zero height is the one rule that is not a gate: it
      // hides nothing and must apply wherever the element is rendered.
      if (rule.startsWith('#qx-nav-sentinel')) continue;
      expect(rule, `ungated rule in header.css: ${rule}`).toContain('[data-qx-nav-defer]');
    }
    expect(NAV_REVEAL_BOOT).toContain("setAttribute('data-qx-nav-defer'");
    expect(NAV_REVEAL_BOOT).toContain("if(!s){r.removeAttribute('data-qx-nav-defer')");
  });

  /**
   * REVERSIBLE, unlike `REVEAL_BOOT`, which sets `data-revealed` once and never
   * takes it back. The pin is scrubbed and visitors scroll back up through it; a
   * header left painted over the hero is the fault `LaunchTitle` documents at
   * length about anything the pin leaves on screen.
   */
  it('takes the header back when the sentinel returns', () => {
    expect(NAV_REVEAL_BOOT).toContain("removeAttribute('data-qx-nav')");
    // ABOVE the viewport, not merely outside it — a sentinel below the fold is
    // also unintersecting, and treating that as "past" reveals the header at the
    // top of the page, which is the whole thing this prevents.
    expect(NAV_REVEAL_BOOT).toContain('boundingClientRect.top<=0');
  });

  it('is syntactically valid JavaScript', () => {
    expect(() => new Function(NAV_REVEAL_BOOT)).not.toThrow();
  });

  /** Off-screen is not hidden: a fixed bar above the top edge is still focusable. */
  it('takes the hidden bar out of the tab order', () => {
    expect(headerCss).toContain('visibility: hidden');
  });
});
