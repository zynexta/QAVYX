import { describe, expect, it } from 'vitest';
import {
  ALL_ROUTES,
  CONTACT,
  CONTACT_NAV,
  CTA_LABEL,
  FOOTER_COPY,
  FOOTER_NAV,
  LEGAL_LINKS,
  PRIMARY_NAV,
  SECONDARY_CTAS,
  SITE_INDEX,
  SOCIAL,
  WHATSAPP,
} from '@/content/site';

/**
 * The global shell's content contract, locked the same way
 * `services.test.ts` locks the seventeen service areas.
 *
 * The draft's navigation IS the site's information architecture. A label
 * quietly reworded or an item dropped in a layout tweak is a content change made
 * by a developer, which is the thing this whole content/ discipline exists to
 * prevent.
 */

describe('primary navigation', () => {
  it('is the document\u2019s ten, in its order', () => {
    expect(PRIMARY_NAV.map((i) => i.label)).toEqual([
      'Home',
      'Growth Marketing',
      'Social & Content',
      'AI & Automation',
      'Build & Scale',
      'Launch',
      'Who We Are',
      'Our Projects',
      'Our Services',
      'FAQ',
    ]);
  });

  it('carries no route twice', () => {
    expect(new Set(PRIMARY_NAV.map((i) => i.href)).size).toBe(PRIMARY_NAV.length);
  });

  /**
   * §64 routes `Our Projects` at `/projects` and `Our Services` at `/services` —
   * the label and the slug disagree on purpose, and both are the document's.
   * This is the assertion that stops someone "fixing" one to match the other.
   */
  it('routes the two Our- pages where the document routes them, not at their labels', () => {
    const byLabel = new Map(PRIMARY_NAV.map((i) => [i.label, i.href]));
    expect(byLabel.get('Our Projects')).toBe('/projects');
    expect(byLabel.get('Our Services')).toBe('/services');
  });

  it('routes are absolute, lower-case and un-trailing-slashed', () => {
    for (const { href } of PRIMARY_NAV) {
      expect(href).toMatch(/^\/([a-z0-9]+(-[a-z0-9]+)*)?$/);
    }
  });

  /**
   * The five pillar routes, from §64 Recommended URL Structure. The carousel's
   * CTAs point at these same paths (asserted in `services.test.ts`), so this is
   * the one place a pillar's route is spelled.
   */
  it('has a route for each of the five pillars', () => {
    const hrefs = PRIMARY_NAV.map((i) => i.href);
    for (const slug of [
      '/growth-marketing',
      '/social-content',
      '/ai-automation',
      '/build-scale',
      '/launch',
    ]) {
      expect(hrefs).toContain(slug);
    }
  });
});

describe('footer navigation', () => {
  it('is the primary ten plus Launchpad plus Contact Us', () => {
    expect(FOOTER_NAV).toHaveLength(PRIMARY_NAV.length + 2);
    for (const item of PRIMARY_NAV) expect(FOOTER_NAV).toContainEqual(item);
    expect(FOOTER_NAV).toContainEqual(CONTACT_NAV);
  });

  it('places Launchpad between Our Services and FAQ, as the draft does', () => {
    const labels = FOOTER_NAV.map((i) => i.label);
    expect(labels.indexOf('Launchpad')).toBe(labels.indexOf('Our Services') + 1);
    expect(labels.indexOf('FAQ')).toBe(labels.indexOf('Launchpad') + 1);
  });

  /**
   * The one navigation entry the document does not supply, added in Phase 8D on
   * the client's direction. It goes LAST so §63's own eleven keep their order
   * above it — an addition that reorders the client's list is two changes.
   */
  it('appends Contact Us after §63’s own list rather than inside it', () => {
    expect(FOOTER_NAV[FOOTER_NAV.length - 1]).toEqual(CONTACT_NAV);
  });
});

/**
 * §64 routes a contact page and §73 makes "start a conversation" the site's
 * conversion, but §2 and §63 both fold contact into "Who We Are" and neither
 * links it directly. This is the one addition, and its label is not invented:
 * "Contact Us" is §51's own CTA and one of §65's six secondaries.
 */
describe('the Contact addition', () => {
  it('goes to the route §64 assigns, under a label §51 and §65 supply', () => {
    expect(CONTACT_NAV.href).toBe('/who-we-are/contact');
    expect(SECONDARY_CTAS).toContain(CONTACT_NAV.label);
  });

  /**
   * `FOOTER_COPY.contactHeading` heads the footer column printing the email and
   * the number, three elements from the nav link. Two items reading "Contact" in
   * one footer is a footer that looks like it has a duplicate.
   */
  it('does not collide with the footer’s own Contact heading', () => {
    expect(CONTACT_NAV.label).not.toBe(FOOTER_COPY.contactHeading);
  });
});

describe('the CTA label', () => {
  /**
   * The draft writes this four ways — `"Chat with Us"`, `"Chat With Us"`,
   * `"Chat With Us?"` and `"Chat with Us’`. They are one button. This test is
   * what stops a future edit "restoring" one of the other three from the DOCX.
   */
  it('is one string, used everywhere', () => {
    expect(CTA_LABEL).toBe('Chat With Us');
    expect(WHATSAPP.label).toBe(CTA_LABEL);
  });

  it('carries no stray punctuation from the source', () => {
    expect(CTA_LABEL).not.toMatch(/[?"'’]/);
  });
});

describe('contact details', () => {
  it('the wa.me number is the printed number, digits only', () => {
    expect(CONTACT.whatsappNumber).toBe(CONTACT.whatsapp.replace(/\D/g, ''));
  });

  it('the wa.me number carries no leading + or zeros', () => {
    expect(CONTACT.whatsappNumber).toMatch(/^[1-9]\d{7,14}$/);
  });

  it('the email is the one the draft prints', () => {
    expect(CONTACT.email).toBe('info@qavyx.com');
  });
});

describe('the pre-filled WhatsApp message', () => {
  it('is the client\'s own, emoji included', () => {
    expect(WHATSAPP.message).toBe(
      'Hi QAVYX! I want to explore how you can grow my brand 🚀',
    );
  });

  /**
   * Storing it pre-encoded would make the content file unreadable to whoever
   * owns the copy, and double-encoding it at render is then invisible until
   * someone opens WhatsApp and reads `%F0%9F%9A%80`.
   */
  it('is stored raw, not URL-encoded', () => {
    expect(WHATSAPP.message).not.toContain('%');
    expect(decodeURIComponent(encodeURIComponent(WHATSAPP.message))).toBe(WHATSAPP.message);
  });
});

describe('the footer', () => {
  /**
   * §63 prints "Looking Growth. Connect QAVYX." and then, in a note directly
   * under it, supplies the phrasing it would rather have. §70 lists it again.
   * Both strings are the client's; this is the one they asked for.
   */
  it('takes the tagline §63 asks for, not the one it prints', () => {
    expect(FOOTER_COPY.tagline).toBe('Looking for Growth? Connect with QAVYX.');
  });

  it('names two social networks and no third', () => {
    expect(SOCIAL.map((s) => s.label)).toEqual(['Instagram', 'LinkedIn']);
  });

  /**
   * §2 lists both under Global Elements and §64 routes them, so they are planned
   * pages like the other nine and are linked on the same terms. They were plain
   * text while the DOCX was the source, which named them but gave them neither
   * content nor a route.
   */
  it('links the legal pages at the routes the document assigns them', () => {
    expect(LEGAL_LINKS.map((l) => l.label)).toEqual(['Privacy Policy', 'Terms of Service']);
    expect(LEGAL_LINKS.map((l) => l.href)).toEqual(['/privacy-policy', '/terms-of-service']);
  });
});

describe('the site index', () => {
  /**
   * The homepage's navigation section IS the site's primary navigation — there
   * is no navbar. So the guarantee that matters is coverage: every route the
   * footer offers is also spelled once in `SITE_INDEX`, so no destination exists
   * in one table and not the other.
   *
   * THIS IS A CONTENT-TABLE CHECK, NOT A RENDERED-REACHABILITY ONE, and the
   * distinction became load-bearing when `LaunchpadNote` was removed. `indexed`
   * folds in `SITE_INDEX.launchpad`, but `SiteIndex` does not RENDER that key —
   * it maps `pillars` and `pages` only — so /launchpad passes here while being
   * absent from the homepage body entirely. That is intended (§2 omits it from
   * the primary nav, §63 lists it in the footer only), and it is exactly the
   * shape of claim this docblock used to overstate.
   *
   * Whether a route is actually reachable from a rendered page is asserted in
   * `tests/e2e/phase8c-shell.spec.ts`, which reads the served HTML. Do not
   * re-word this into a reachability guarantee; it cannot keep one.
   */
  it('spells every footer route once in the index tables', () => {
    const indexed = [
      ...SITE_INDEX.pillars,
      ...SITE_INDEX.pages,
      SITE_INDEX.launchpad,
    ].map((i) => i.href);

    expect(indexed).not.toContain('/');
    for (const item of FOOTER_NAV) {
      if (item.href === '/') continue;
      expect(indexed).toContain(item.href);
    }
    expect(new Set(indexed).size).toBe(indexed.length);
  });

  it('splits the five things you can buy from the pages about the company', () => {
    expect(SITE_INDEX.pillars.map((p) => p.label)).toEqual([
      'Growth Marketing',
      'Social & Content',
      'AI & Automation',
      'Build & Scale',
      'Launch',
    ]);
    expect(SITE_INDEX.pages.map((p) => p.label)).toEqual([
      'Who We Are',
      'Our Projects',
      'Our Services',
      'FAQ',
      'Contact Us',
    ]);
  });

  /**
   * NEITHER OF THE TWO OLD CHILD ROUTES MAY APPEAR HERE, and they are gone for
   * the same reason: the client folded both into their parent. §46–§49 and §50
   * are `/who-we-are` itself, and these two URLs are permanent redirects — so an
   * entry here would point the homepage's own navigation through a 308 on every
   * click, at a page it already links directly.
   *
   * Asserted by name rather than by "every href is in ALL_ROUTES", which the
   * test below already does: these are the two specific strings a "while we're
   * at it" edit would reach for, and they are the two that look like routes and
   * are not.
   */
  it('leaves the two merged Who We Are children out of the index', () => {
    const hrefs = SITE_INDEX.pages.map((p) => p.href);
    expect(hrefs).not.toContain('/who-we-are/about');
    expect(hrefs).not.toContain('/who-we-are/team');
  });

  /**
   * Its labels must be the draft's, not a shortened variant that fits the
   * layout. `Build & Scale` in the index and `Build and Scale` in the footer is
   * the same page under two names.
   */
  it('names every destination exactly as the nav does', () => {
    const byHref = new Map(FOOTER_NAV.map((i) => [i.href, i.label]));
    for (const item of [...SITE_INDEX.pillars, ...SITE_INDEX.pages, SITE_INDEX.launchpad]) {
      expect(item.label).toBe(byHref.get(item.href));
    }
  });

  /**
   * §41's own status, from "QAVYX Launchpad — Coming Soon". The capital S is
   * the document's: this read `Coming soon` for several phases, and `/launchpad`
   * now prints the same status as an eyebrow above its `<h1>`, so the two
   * casings would have been visible on one journey.
   */
  it('carries Launchpad as unreleased, in the document’s own casing', () => {
    expect(SITE_INDEX.launchpad.status).toBe('Coming Soon');
  });
});

/**
 * §64's URL structure, written out once for `app/sitemap.ts`.
 *
 * `PRIMARY_NAV` used to be the whole route table. It is not any more — four of
 * the fourteen routes are not in it — so this is the list a crawler is handed
 * and the one that has to be complete.
 *
 * FOURTEEN, AND §64 LISTS SIXTEEN. The two missing are `/who-we-are/about` and
 * `/who-we-are/team`, which the client folded into their parent: §46–§49 and
 * §50 are `/who-we-are` itself, and both old URLs are permanent redirects in
 * `next.config.ts`. They are absent here rather than `indexed: false`, because
 * that flag means "a page we are choosing not to submit" and neither is a page
 * any more.
 */
describe('the route table', () => {
  it('is §64’s sixteen less the two merged children, each spelled once', () => {
    expect(ALL_ROUTES).toHaveLength(14);
    const merged = ALL_ROUTES.map((r) => r.path);
    expect(merged).not.toContain('/who-we-are/about');
    expect(merged).not.toContain('/who-we-are/team');
    const paths = ALL_ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) expect(path).toMatch(/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/);
  });

  /** Nothing may be linked from the footer or the index and not exist. */
  it('contains every route either navigation offers', () => {
    const paths = new Set(ALL_ROUTES.map((r) => r.path));
    for (const item of FOOTER_NAV) expect(paths).toContain(item.href);
    for (const item of [...SITE_INDEX.pillars, ...SITE_INDEX.pages, SITE_INDEX.launchpad]) {
      expect(paths).toContain(item.href);
    }
    for (const link of LEGAL_LINKS) if (link.href) expect(paths).toContain(link.href);
  });

  /**
   * NOTHING IS HELD BACK FROM SEARCH ANY MORE. `/who-we-are/team` was the one,
   * and it was held back because a whole page of a heading and one sentence,
   * about a team it did not name, should not be found in that state. The client
   * moved §50 onto `/who-we-are`, where the same two strings close a page that
   * has earned them, so the page that needed holding back no longer exists.
   *
   * The assertion is kept and inverted rather than deleted, because it is still
   * the thing worth failing over: a route appearing here is either a new
   * decision that needs recording or a mistake, and an empty list is a claim
   * that has to be re-made every time the table changes.
   */
  it('holds no route back from search', () => {
    const held = ALL_ROUTES.filter((r) => !r.indexed).map((r) => r.path);
    expect(held).toEqual([]);
  });

  /** A route nothing links to must also be a route nothing indexes. */
  it('never offers a link to a route it keeps out of search', () => {
    const linked = new Set([
      ...FOOTER_NAV.map((i) => i.href),
      ...SITE_INDEX.pillars.map((i) => i.href),
      ...SITE_INDEX.pages.map((i) => i.href),
      SITE_INDEX.launchpad.href,
    ]);
    for (const route of ALL_ROUTES) {
      if (!route.indexed) expect(linked).not.toContain(route.path);
    }
  });
});
