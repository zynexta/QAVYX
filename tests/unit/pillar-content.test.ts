import { describe, expect, it } from 'vitest';
import {
  PENDING_CALENDLY,
  PILLAR_PAGES,
  pillarBySlug,
  sectionAnchor,
} from '../../content/pillars';
import { SECTION_VISUALS } from '../../components/services/visuals';
import { SERVICES, SERVICE_AREAS } from '../../content/services';
import { CTA_LABEL, SECONDARY_CTAS, SITE_INDEX } from '../../content/site';
import { pillarDescription, pillarJsonLd, pillarMetadata } from '../../lib/seo';

/**
 * The pillar pages' content contract.
 *
 * The carousel panel and the page it links to are two presentations of the same
 * five things, written into two files so each reads as the document does. That
 * duplication is only safe if the relationship is asserted, so these tests are
 * mostly one idea: `content/pillars.ts` and `content/services.ts` may not drift.
 *
 * The second idea is §1's implementation rule — the handoff document is full of
 * instructions to the development team, and none of them may become site copy.
 */

/** Every string on a pillar page that a visitor can read. */
function userFacingStrings(): string[] {
  return PILLAR_PAGES.flatMap((page) => [
    page.label,
    page.pageTitle,
    ...page.intro,
    ...page.ctas.map((cta) => cta.label),
    ...page.sections.flatMap((section) => [
      section.name,
      section.headline ?? '',
      section.description,
      ...section.lists.flatMap((list) => [list.label, ...list.items]),
    ]),
  ]);
}

describe('the five pillar pages', () => {
  it('is the five pillars, in the same order as the carousel', () => {
    expect(PILLAR_PAGES).toHaveLength(5);
    expect(PILLAR_PAGES.map((p) => p.slug)).toEqual(SERVICES.map((s) => s.slug));
    expect(PILLAR_PAGES.map((p) => p.label)).toEqual(SERVICES.map((s) => s.title));
  });

  /**
   * The one that matters. A visitor reads five service names on a carousel
   * panel, clicks through, and must find those five names as the page's
   * sections — in the same order, spelled the same way. Nothing in the type
   * system connects the two files, so this is the connection.
   */
  it('names exactly the sub-services its carousel panel advertises, in order', () => {
    for (const [index, page] of PILLAR_PAGES.entries()) {
      const panel = SERVICES[index];
      expect(panel).toBeDefined();
      expect(page.sections.map((section) => section.name)).toEqual(panel?.services);
    }
  });

  /**
   * The chips on a carousel panel are LINKS now, and this is the half of that
   * link the content owns.
   *
   * `ServicePanel` builds `/{slug}#{sectionAnchor(name)}` from the chip's own
   * name; `PillarPage` puts `sectionAnchor(section.name)` on the section. The
   * test above already locks the two name lists together, so what is left to
   * prove is that the derivation can actually produce a usable id: unique within
   * its page, never empty, and never something a URL would mangle.
   *
   * A collision here does not throw — it silently sends two different chips to
   * the same section, and the second one looks like it "went to the wrong place".
   */
  it('derives a unique, non-empty anchor for every section', () => {
    const all: string[] = [];
    for (const page of PILLAR_PAGES) {
      const anchors = page.sections.map((section) => sectionAnchor(section.name));
      for (const a of anchors) {
        expect(a.length, `empty anchor on ${page.slug}`).toBeGreaterThan(0);
        // URL-safe and readable: lowercase, digits and single hyphens only.
        expect(a).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      }
      // Unique WITHIN the page, which is all a fragment has to be.
      expect(new Set(anchors).size, `collision on ${page.slug}`).toBe(anchors.length);
      all.push(...anchors);
    }
    // And in fact unique across all five, since the 24 areas are.
    expect(new Set(all).size).toBe(24);
  });

  /** The ampersands and hyphens the real names actually contain. */
  it('collapses punctuation the section names really use', () => {
    expect(sectionAnchor('CRM & Automation Systems')).toBe('crm-automation-systems');
    expect(sectionAnchor('Short-Form Video & Reels')).toBe('short-form-video-reels');
    expect(sectionAnchor('WhatsApp & Email Automation')).toBe('whatsapp-email-automation');
  });

  it('covers all twenty-four service areas exactly once, across the five', () => {
    const named = PILLAR_PAGES.flatMap((page) => page.sections.map((section) => section.name));
    expect(named).toHaveLength(24);
    expect(new Set(named)).toEqual(new Set(SERVICE_AREAS));
  });

  it('is reachable from the site index — every pillar route has a page', () => {
    const built = new Set(PILLAR_PAGES.map((page) => `/${page.slug}`));
    for (const item of SITE_INDEX.pillars) expect(built).toContain(item.href);
    // And the carousel's CTAs, which pointed at `/services/<slug>` and 404'd
    // until this phase.
    for (const service of SERVICES) expect(built).toContain(service.cta.href);
  });

  it('gives every page a title, an intro and at least four sections', () => {
    for (const page of PILLAR_PAGES) {
      expect(page.slug).toMatch(/^[a-z0-9-]+$/);
      expect(page.pageTitle.length).toBeGreaterThan(0);
      expect(page.intro.length).toBeGreaterThan(0);
      for (const paragraph of page.intro) expect(paragraph.length).toBeGreaterThan(0);
      expect(page.sections.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('gives every section a description, and every list a label and items', () => {
    for (const page of PILLAR_PAGES) {
      for (const section of page.sections) {
        expect(section.description.length).toBeGreaterThan(0);
        for (const list of section.lists) {
          expect(list.label.length).toBeGreaterThan(0);
          expect(list.items.length).toBeGreaterThan(0);
          expect(new Set(list.items).size).toBe(list.items.length);
        }
      }
    }
  });

  /**
   * §13–§17 are "Step 01".."Step 05" and nothing else in the document is
   * numbered. `ordered` drives an `<ol>` with visible counters, so flipping it
   * on a menu page would assert a sequence the client never wrote.
   */
  it('numbers Growth Marketing alone — it is a process, the rest are menus', () => {
    const ordered = PILLAR_PAGES.filter((page) => page.ordered).map((page) => page.slug);
    expect(ordered).toEqual(['growth-marketing']);
  });

  /**
   * §19–§23 are a name and a paragraph — the "Supporting Line" of §13 and the
   * "Heading" of §25 have no counterpart on that page. Every other pillar page
   * gives all of its sections one. A headline invented for the four that lack it
   * would square the grid with copy the client never wrote, so the component
   * omits the element instead.
   */
  it('leaves Social & Content without supporting lines rather than inventing them', () => {
    const withoutHeadline = PILLAR_PAGES.filter((page) =>
      page.sections.some((section) => !section.headline),
    );
    expect(withoutHeadline.map((page) => page.slug)).toEqual(['social-content']);
    // All five of its sections, not some of them.
    for (const section of pillarBySlug('social-content').sections) {
      expect(section.headline).toBeUndefined();
    }
    // …and every other page gives all of its sections one.
    for (const page of PILLAR_PAGES.filter((p) => p.slug !== 'social-content')) {
      for (const section of page.sections) expect(section.headline).toBeTruthy();
    }
  });

  /** §19 goes further: one sentence, no list. The only section like it. */
  it('leaves §19 as the one section with nothing but a sentence', () => {
    const listless = PILLAR_PAGES.flatMap((page) =>
      page.sections.filter((section) => section.lists.length === 0).map((s) => s.name),
    );
    expect(listless).toEqual(['Social Media Growth & Management']);
  });

  /** §22 carries a Platforms list and a Services list of one. Both are real. */
  it('keeps the two lists §22 gives Performance Marketing', () => {
    const section = pillarBySlug('social-content').sections.find(
      (s) => s.name === 'Performance Marketing Across Social',
    );
    expect(section?.lists.map((list) => list.label)).toEqual(['Platforms', 'Services']);
    expect(section?.lists[1]?.items).toEqual(['Campaign Optimization']);
  });

  it('throws for a slug with no page, rather than rendering an empty one', () => {
    expect(() => pillarBySlug('build-web3')).toThrow(/build-web3/);
  });

  /**
   * §70, "Content Issues to Review Before Production", is the document reviewing
   * itself, and it lists three items on this one page. The line it draws is
   * whether a replacement is supplied:
   *
   *   - "Active & Process" → **consider renaming to Execution & Optimization**.
   *     A replacement. Taken — §70 is the later voice, and both strings are the
   *     client's, so this is still their copy and not ours.
   *   - "Team & Management Behaviour" → *clarify exact intended meaning*.
   *   - "Package Implementation" → *clarify what package implementation means*.
   *     No replacement. Left verbatim. Inventing a rewrite to satisfy a request
   *     for clarification is precisely what the request exists to prevent.
   *
   * §70 passes over "Weak System Found" while correcting three of its
   * neighbours, which is the strongest evidence available that the odd-sounding
   * step two is deliberate.
   */
  it("takes §70's corrections where §70 supplies one, and nowhere else", () => {
    const steps = pillarBySlug('growth-marketing');
    const names = steps.sections.map((section) => section.name);
    expect(names).toContain('Execution & Optimization');
    expect(names).not.toContain('Active & Process');
    expect(names).toContain('Weak System Found');

    // The two "clarify" items keep the client's original wording.
    const listed = steps.sections.flatMap((s) => s.lists.flatMap((l) => l.items));
    expect(listed).toContain('Team & Management Behaviour');
    expect(listed).toContain('Package Implementation');
  });
});

describe('the calls to action', () => {
  const ALLOWED = new Set<string>([CTA_LABEL, ...SECONDARY_CTAS]);

  /**
   * §65: "Avoid unnecessarily changing CTA wording between sections." The
   * document supplies one primary and six secondaries, and a seventh label
   * appearing here would be a CTA invented during implementation.
   */
  it('uses only the seven labels §65 supplies', () => {
    for (const page of PILLAR_PAGES) {
      expect(page.ctas.length).toBeGreaterThan(0);
      for (const cta of page.ctas) expect(ALLOWED).toContain(cta.label);
    }
  });

  it('sends every routed CTA somewhere the document names', () => {
    const routed = PILLAR_PAGES.flatMap((page) => page.ctas).filter(
      (cta) => cta.kind === 'route',
    );
    // §23 is the only one: "Secondary CTA: View Our Work — Destination: Our
    // Projects", which §64 routes at /projects.
    expect(routed).toEqual([{ kind: 'route', label: 'View Our Work', href: '/projects' }]);
  });

  /**
   * The two Calendly bookings. They stay in the data with a reason attached and
   * are filtered out at render — see `PillarCtas` in
   * `components/pillars/PillarPage.tsx`.
   */
  it('marks the two booking CTAs pending, with the missing asset recorded', () => {
    const pending = PILLAR_PAGES.flatMap((page) => page.ctas).filter(
      (cta) => cta.kind === 'pending',
    );
    expect(pending.map((cta) => cta.label)).toEqual([
      'Book a Free Consultation',
      'Book a Fundraising Consultation',
    ]);
    for (const cta of pending) {
      expect(cta.kind === 'pending' && cta.missingAsset).toBe(PENDING_CALENDLY);
    }
  });

  /**
   * Every page keeps a CTA that actually works, and every one of them is the
   * document's.
   *
   * The Launch page is the one to watch. §40 gives it only the fundraising
   * booking, which has no URL — and §45, four sections later and after the whole
   * Launchpad block, gives it "Start With Us". An earlier cut of this file missed
   * §45 and added `CTA_LABEL` instead, which was inventing an answer the document
   * supplies. This is the assertion that keeps it supplied.
   */
  it('gives every page one working conversion path, all of them the document’s', () => {
    for (const page of PILLAR_PAGES) {
      const working = page.ctas.filter((cta) => cta.kind !== 'pending');
      expect(working.length).toBeGreaterThan(0);
    }
    expect(pillarBySlug('launch').ctas.map((cta) => cta.label)).toEqual([
      'Book a Fundraising Consultation',
      'Start With Us',
    ]);
    // The other four close on §65's primary, per §17/§23/§29/§35.
    for (const page of PILLAR_PAGES.filter((p) => p.slug !== 'launch')) {
      expect(page.ctas.map((cta) => cta.label)).toContain(CTA_LABEL);
    }
  });
});

/**
 * §1's Important Implementation Rule, and the cover block above it. The document
 * is addressed to the build team as much as to the reader, and its instructions
 * read exactly like site copy — "Document Purpose: Complete website content
 * structure for design and development handoff" would look at home in a footer.
 */
describe('no document metadata reaches the page', () => {
  const FORBIDDEN = [
    'dev/content note',
    'development note',
    'content note',
    'cta button',
    'document purpose',
    'website content',
    'design handoff',
    'handoff',
    'external link',
    'to be provided',
    'destination:',
    'link:',
    'calendly',
  ];

  it('keeps every instruction to the build team out of the copy', () => {
    for (const text of userFacingStrings()) {
      for (const banned of FORBIDDEN) {
        expect(text.toLowerCase()).not.toContain(banned);
      }
    }
  });

  it('keeps it out of the metadata too', () => {
    for (const page of PILLAR_PAGES) {
      const meta = pillarMetadata(page);
      const strings = [String(meta.title), String(meta.description)];
      for (const text of strings) {
        for (const banned of FORBIDDEN) expect(text.toLowerCase()).not.toContain(banned);
      }
    }
  });

  /** The missing-asset note is for the build team and must never be rendered. */
  it('never puts the missing-asset note in a user-facing string', () => {
    for (const text of userFacingStrings()) expect(text).not.toContain(PENDING_CALENDLY);
  });
});

describe('metadata and structured data', () => {
  it('titles every page with its pillar, not its headline', () => {
    for (const page of PILLAR_PAGES) {
      const meta = pillarMetadata(page);
      // The headline is the <h1>; a tab and a search result need the noun.
      expect(meta.title).toBe(page.label);
      expect(meta.description).toBe(page.intro.join(' '));
      expect(meta.alternates?.canonical).toBe(`/${page.slug}`);
    }
  });

  it("gives every page its own description, from the client's own intro", () => {
    const descriptions = PILLAR_PAGES.map(pillarDescription);
    expect(new Set(descriptions).size).toBe(PILLAR_PAGES.length);
    for (const description of descriptions) expect(description.length).toBeGreaterThan(0);
  });

  it('gives every page an OG card of its own', () => {
    const titles = new Set<string>();
    for (const page of PILLAR_PAGES) {
      const og = pillarMetadata(page).openGraph;
      expect(og).toMatchObject({
        type: 'website',
        siteName: 'QAVYX',
        url: `/${page.slug}`,
        description: pillarDescription(page),
      });
      titles.add(String((og as { title?: unknown } | undefined)?.title));
    }
    expect(titles.size).toBe(PILLAR_PAGES.length);
  });

  it('describes the service and its sub-services, and no trail', () => {
    for (const page of PILLAR_PAGES) {
      const graph = pillarJsonLd(page)['@graph'] as Array<Record<string, unknown>>;
      // Two nodes. The `BreadcrumbList` went with the visible breadcrumb the
      // client removed — see `lib/seo.ts` for why the two had to move together.
      expect(graph.map((node) => node['@type'])).toEqual(['Organization', 'Service']);

      const service = graph[1] as {
        name: string;
        url: string;
        hasOfferCatalog: { itemListElement: Array<{ itemOffered: { name: string } }> };
      };
      expect(service.name).toBe(page.label);
      expect(service.url).toBe(`https://qavyx.com/${page.slug}`);
      // The catalog is the reason to emit this at all: without it the node says
      // nothing a crawler could not read off the <h1>.
      expect(service.hasOfferCatalog.itemListElement.map((o) => o.itemOffered.name)).toEqual(
        page.sections.map((section) => section.name),
      );

      // And nothing at index 2. The old assertion here read the trail's two
      // steps out of a `BreadcrumbList`; that node is gone with the breadcrumb
      // the client removed, so the check is that it has not come back.
      expect(graph[2]).toBeUndefined();
    }
  });

  /**
   * `sameAs` is a durable machine-readable claim that this company IS that
   * account. The two social URLs in `content/site.ts` were inferred from the
   * domain and §69 lists both among the assets still required, so the graph
   * stays silent about them until the client confirms the handles.
   */
  it('makes no identity claim it cannot back — no sameAs while the handles are guesses', () => {
    for (const page of PILLAR_PAGES) {
      const json = JSON.stringify(pillarJsonLd(page));
      expect(json).not.toContain('sameAs');
      expect(json).not.toContain('instagram.com');
      expect(json).not.toContain('linkedin.com');
    }
  });

  /**
   * The section figures are addressed by `"<slug>#<anchor>"`, and neither half of
   * that key is typed anywhere a compiler can check. A section renamed in this
   * file — which happens; §16's "Active & Process" became "Execution &
   * Optimization" on §70's correction — moves its anchor, and the drawing that
   * was keyed to the old one stops rendering. Nothing goes red: the card just
   * quietly loses its picture on a page whose whole problem was not having one.
   *
   * So the key is held to a section that exists. It is deliberately one-way —
   * every key must resolve, but a section is free to have no figure, which is the
   * normal case for twenty of the twenty-four.
   */
  it('keys every section figure to a section that exists', () => {
    const keys = Object.keys(SECTION_VISUALS);
    expect(keys.length).toBeGreaterThan(0);

    const real = new Set(
      PILLAR_PAGES.flatMap((page) =>
        page.sections.map((section) => `${page.slug}#${sectionAnchor(section.name)}`),
      ),
    );
    for (const key of keys) expect(real).toContain(key);
  });

  /**
   * ALL OF THEM, OR NONE OF THEM, PER PAGE — and never on the numbered one.
   *
   * This started as one figure per page, on the single card whose subject most
   * contradicted having no picture, and one was worse than none: four empty rails
   * beside one drawing read as four drawings that failed to load. So the rule is
   * now the whole page, and this test is what keeps a section added later from
   * quietly reintroducing the gap — a new entry in `content/pillars.ts` with no
   * entry here fails.
   *
   * Growth Marketing is excluded because its rail is spoken for: it carries the
   * process spine (`styles/pillar-spine.css`), and a figure in the same 15rem
   * column would be a second thing competing for it.
   */
  it('illustrates every section on the unnumbered pillars, and none on the numbered one', () => {
    for (const page of PILLAR_PAGES) {
      const keys = page.sections.map(
        (section) => `${page.slug}#${sectionAnchor(section.name)}`,
      );
      for (const key of keys) {
        expect(SECTION_VISUALS[key], `${key} has no figure`).toBeTypeOf(
          page.ordered ? 'undefined' : 'function',
        );
      }
    }
  });

  /**
   * Nineteen figures drawn one at a time is how a set becomes wallpaper, so no
   * two cards may share a drawing. A shared component would mean two sections of
   * one pillar making the same claim about themselves — and it is the failure
   * that arrives by convenience, when the next section "is basically the same as"
   * one already drawn.
   */
  it('gives every illustrated card its own drawing', () => {
    const drawings = Object.values(SECTION_VISUALS);
    expect(new Set(drawings).size).toBe(drawings.length);
  });
});
