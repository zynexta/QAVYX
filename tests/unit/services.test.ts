import { describe, expect, it } from 'vitest';
import { PILLAR_COUNT, PILLAR_CTA_LABEL, SERVICE_AREAS, SERVICES } from '../../content/services';
import { SERVICE_VISUALS } from '../../components/services/visuals';
import { SERVICE_GLYPHS } from '../../components/icons';
import { CTA_LABEL, SECONDARY_CTAS, SITE_INDEX } from '../../content/site';

/**
 * The content contract. The five PILLARS are a presentation of the twenty-four
 * service areas the client's draft names across its five service pages, so the
 * one thing that must never silently break is the mapping between them: every
 * area appears in exactly one pillar, and no pillar invents an area the draft
 * does not contain.
 *
 * The slider that presents them has SIX panels — the five pillars and QAVYX
 * Launchpad. That list, and everything that counts it, is
 * `tests/unit/carousel-panels.test.ts`. Nothing about the sixth panel belongs in
 * this file: it is not a pillar, it has no pillar page, and its six §42 features
 * are not service areas.
 *
 * The count was seventeen until the draft replaced the live site as the source —
 * see the header of `content/services.ts`.
 */

describe('service areas', () => {
  it('lists the twenty-four the draft names, with no duplicates', () => {
    expect(SERVICE_AREAS).toHaveLength(24);
    expect(new Set(SERVICE_AREAS).size).toBe(24);
  });

  it('covers every area exactly once across the five pillars', () => {
    const grouped = SERVICES.flatMap((c) => c.services);
    expect(grouped).toHaveLength(24);
    expect(new Set(grouped)).toEqual(new Set(SERVICE_AREAS));
    // Verbatim: a reworded title here would no longer match the draft.
    for (const area of grouped) expect(SERVICE_AREAS).toContain(area);
  });

  /**
   * The draft contains no Web3 anywhere. Pillar four was `Build & Web3` with an
   * area called "Web3 Marketing & Community Growth", both scraped from the live
   * site before the draft existed. If either comes back, the carousel is
   * advertising something the client's own content does not.
   */
  it('carries nothing the draft dropped', () => {
    const all = [
      ...SERVICE_AREAS,
      ...SERVICES.map((c) => c.title),
      ...SERVICES.map((c) => c.slug),
    ];
    for (const text of all) expect(text.toLowerCase()).not.toContain('web3');
  });
});

describe('the five pillars', () => {
  /**
   * THIS IS NOT THE CAROUSEL'S PANEL COUNT ANY MORE — see
   * `tests/unit/carousel-panels.test.ts`, which owns that number.
   *
   * It used to be. The test that stood here read "keeps five panels — the
   * carousel step maths depends on it", and when the client asked for a
   * Launchpad panel it was the tripwire that caught the change. What it was
   * actually guarding turned out to be two separate things: the step maths,
   * which is fully derived from `PANEL_COUNT` and does not care, and the pillar
   * set, which four other surfaces depend on being exactly these five.
   *
   * That second thing is what this test is now, stated in its own terms.
   */
  it('keeps five pillars — the site index, the pillar pages and the static list depend on it', () => {
    expect(PILLAR_COUNT).toBe(5);
    expect(SERVICES).toHaveLength(5);
  });

  it('gives every pillar a unique slug, a title, a description and a CTA', () => {
    expect(new Set(SERVICES.map((c) => c.slug)).size).toBe(PILLAR_COUNT);
    for (const c of SERVICES) {
      expect(c.slug).toMatch(/^[a-z0-9-]+$/);
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.cta.href).toMatch(/^\//);
      // The panel body is authored at max 42ch (TDD §3.9). Much past ~100
      // characters it wraps into the visual's column at tablet width.
      expect(c.description.length).toBeLessThanOrEqual(100);
      expect(c.services.length).toBeGreaterThan(0);
    }
  });

  /**
   * §65: "Avoid unnecessarily changing CTA wording between sections." This file
   * used to carry five different labels — "See growth work", "See social work"
   * and so on — invented before the handoff document existed. There is one now,
   * and a `label` field on a panel would be how five come back.
   */
  it('uses one CTA label across all five, not five', () => {
    for (const c of SERVICES) expect(Object.keys(c.cta)).toEqual(['href']);
    expect(PILLAR_CTA_LABEL.length).toBeGreaterThan(0);
  });

  /**
   * The pillar-card label is the one user-facing string the document does not
   * supply, so it must not collide with a CTA the document DOES define — a
   * second "Chat With Us" that navigates instead of opening WhatsApp would be
   * the worst possible outcome of §65.
   */
  it('does not reuse a CTA the document has already assigned a meaning', () => {
    expect(PILLAR_CTA_LABEL).not.toBe(CTA_LABEL);
    expect(SECONDARY_CTAS).not.toContain(PILLAR_CTA_LABEL);
  });

  it('has a diagram for every pillar', () => {
    for (const c of SERVICES) expect(SERVICE_VISUALS[c.slug]).toBeTypeOf('function');
  });

  /**
   * The same drawing at two scales, and both are keyed off the slug.
   *
   * `SERVICE_VISUALS` is the 240 x 180 figure — the carousel slide, and now the
   * pillar page it links to. `SERVICE_GLYPHS` is that figure reduced to 24px for
   * the `/services` index row. A pillar missing either one loses its mark on a
   * surface silently, so both maps are held to the content rather than to each
   * other: adding a sixth pillar has to fail here twice, not once.
   *
   * THE TRIPWIRE HELD, and the sixth SLIDER PANEL went round it rather than
   * through it. `LaunchpadVisual` is exported from the same file and rendered
   * directly by `LaunchpadPanel`; it is deliberately absent from both maps,
   * because a `launchpad` key in either would mean a pillar page and a
   * `/services` row that do not exist.
   */
  it('has an icon-scale glyph for every pillar too', () => {
    for (const c of SERVICES) expect(SERVICE_GLYPHS[c.slug]).toBeTypeOf('function');
  });

  it('keys both maps on the pillar slug and nothing else', () => {
    const slugs = SERVICES.map((c) => c.slug).sort();
    expect(Object.keys(SERVICE_VISUALS).sort()).toEqual(slugs);
    expect(Object.keys(SERVICE_GLYPHS).sort()).toEqual(slugs);
  });

  /**
   * The carousel CTA and the homepage site index are two routes to the same five
   * pages, on the same screen. They used to disagree: the CTAs pointed at
   * `/services/<slug>` while the index pointed at `/<slug>`, so the panel and
   * the nav offered different URLs for one destination and both 404'd
   * separately. One set of routes now, checked here.
   */
  it('sends its CTAs where the site index sends its links', () => {
    expect(SERVICES.map((c) => c.cta.href)).toEqual(SITE_INDEX.pillars.map((p) => p.href));
    expect(SERVICES.map((c) => c.title)).toEqual(SITE_INDEX.pillars.map((p) => p.label));
  });
});
