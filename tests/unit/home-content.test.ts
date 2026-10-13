import { describe, expect, it } from 'vitest';
import { SERVE_GLYPHS, TRUST_GLYPHS } from '@/components/icons';
import { HERO_COPY, HOME_COPY, TRUST_STRIP, WHO_WE_SERVE, WHY_QAVYX } from '@/content/home';
import { SITE_INDEX } from '@/content/site';
import { FAILURE_MODES, GROWTH_STAGES } from '@/content/launch';
import { SERVICES } from '@/content/services';

/**
 * The homepage's closing acts, locked against the draft.
 *
 * The count assertions are the point: "Why QAVYX" is six reasons and "Who We
 * Serve" is seven industries, and a grid that happens to look better with a
 * multiple of four is not a reason to drop one.
 */

describe('Why QAVYX', () => {
  it('is \u00a79\u2019s six, in its order', () => {
    expect(WHY_QAVYX.map((r) => r.label)).toEqual([
      'All-in-One Team',
      'India & GCC Market Expertise',
      'Startup Friendly',
      'Growth That Matters',
      'AI-Powered Solutions',
      'Local to Global',
    ]);
  });

  it('gives every reason a body, and every body a full stop', () => {
    for (const reason of WHY_QAVYX) {
      expect(reason.body.length).toBeGreaterThan(0);
      // The DOCX dropped the stop on "AI-Powered Solutions" and we added it by
      // hand; §9 of the handoff document has it. Still asserted — the fix now
      // comes from the source rather than from us, which is the better place
      // for it, but it is exactly as easy to lose.
      expect(reason.body.endsWith('.')).toBe(true);
    }
  });

  it('carries no id twice', () => {
    expect(new Set(WHY_QAVYX.map((r) => r.id)).size).toBe(WHY_QAVYX.length);
  });
});

describe('Who We Serve', () => {
  it('is \u00a710\u2019s seven, in its order', () => {
    expect(WHO_WE_SERVE).toEqual([
      'Clinics & Healthcare Brands',
      'Restaurants & Hospitality',
      'Educational Institutions',
      'Real Estate Developers',
      'Travel Agencies',
      'Jewellery Showrooms',
      'Local Businesses & Retail Brands',
    ]);
  });
});

describe('the final CTA', () => {
  /**
   * `Final CTA — Let's Build Your Growth Story` in the draft. The first half is
   * a section label for the developer, and BUILD-PLAN Phase 8D is explicit that
   * document metadata must not reach the page.
   */
  it('drops the draft section label from the heading', () => {
    expect(HOME_COPY.ctaHeading).toBe("Let's Build Your Growth Story");
    expect(HOME_COPY.ctaHeading).not.toContain('CTA');
  });
});

describe('the homepage has one home for every string', () => {
  /**
   * The draft's homepage runs HERO → TRUST STRIP → The Problem → The Solution →
   * What's Inside QAVYX → Why QAVYX → Who We Serve → Final CTA, and three
   * different content files carry pieces of it. This asserts they do not
   * overlap: the moment a heading appears in two of them, one copy starts
   * rotting and nobody finds out which.
   */
  it('does not restate the launch or services copy', () => {
    const homeText = [
      ...WHY_QAVYX.flatMap((r) => [r.label, r.body]),
      ...WHO_WE_SERVE,
      ...Object.values(HOME_COPY),
    ];
    const elsewhere = [
      ...FAILURE_MODES.map((m) => m.label),
      ...GROWTH_STAGES.map((s) => s.label),
      ...SERVICES.map((s) => s.title),
    ];
    for (const claim of elsewhere) expect(homeText).not.toContain(claim);
  });

  /**
   * The site index is the exception, and a deliberate one: it NAMES the five
   * pillars, because it is the navigation to their pages and a link has to say
   * where it goes. What it must not do is describe them a second time — the
   * carousel two screens up already carries the descriptions and the twenty-four
   * service areas. This asserts the exception stays exactly that wide.
   */
  it('lets the index name the pillars but never re-pitch them', () => {
    // The index and the carousel agree on the names — the Build & Web3 ->
    // Build & Scale divergence this file used to lock is resolved, now that
    // content/services.ts comes from the draft. `services.test.ts` asserts it.
    expect(SITE_INDEX.pillars.map((p) => p.label)).toEqual(SERVICES.map((s) => s.title));

    const descriptions = SERVICES.map((s) => s.description);
    for (const item of SITE_INDEX.pillars) {
      // Two keys, and no third. A `body` here would be the second pitch.
      expect(Object.keys(item)).toEqual(['href', 'label']);
      expect(descriptions).not.toContain((item as { body?: string }).body);
    }
  });
});

/**
 * Phase 8E — §3.1 and §4, the two homepage blocks that were absent for eight
 * phases because both belong inside the pinned region.
 */
describe('the hero and the trust strip', () => {
  it('carries §3.1’s three slots verbatim', () => {
    expect(HERO_COPY.eyebrow).toBe('Digital Growth Launchpad');
    expect(HERO_COPY.headline).toBe('The Access Point to Growth.');
    expect(HERO_COPY.supporting).toBe('Welcome to Digital Growth Launchpad');
  });

  /**
   * The eyebrow and the supporting headline say the same three words, in
   * adjacent slots, and both are the document's. Keeping them as two fields
   * rather than silently dropping one is what lets the layout decide — see the
   * note in `content/home.ts`.
   */
  it('keeps the eyebrow and the supporting headline as two fields, not one', () => {
    expect(HERO_COPY.supporting).toContain(HERO_COPY.eyebrow);
    expect(HERO_COPY.supporting).not.toBe(HERO_COPY.eyebrow);
  });

  /**
   * §66 Rule 05 and §59: never invent results, testimonials or named clients.
   * §4 names SECTORS, which is why the client could write it while §53's case
   * studies stayed empty. A company name appearing here would be fabrication.
   */
  it('names sectors and regions, never a client', () => {
    expect(TRUST_STRIP).toBe(
      'Trusted by ambitious brands across Clinics & Healthcare, Hospitality & Restaurants, Real Estate, Education, Retail, Travel, across India & UAE.',
    );
    // No numeric claim: no counts, no percentages, no currency.
    expect(TRUST_STRIP).not.toMatch(/\d/);
    expect(TRUST_STRIP).not.toMatch(/[%$₹]/);
  });
});

/**
 * The seven sectors and their glyphs.
 *
 * Same contract `TRUST_GLYPHS` has with `TRUST.sectors`, and for the same reason
 * it is worth a test at all: the map is keyed by the client's own strings, so a
 * sector renamed in `content/home.ts` does not fail to compile — it renders a
 * tile with no mark among six that have one, which is much harder to notice than
 * a blank grid.
 *
 * Asserted in BOTH directions. A leftover key is the same bug arriving from the
 * other side: a glyph drawn for a sector the client has dropped, kept alive by
 * nothing.
 */
describe('who we serve', () => {
  it('has a glyph for every sector, and no glyph without one', () => {
    expect(Object.keys(SERVE_GLYPHS).sort()).toEqual([...WHO_WE_SERVE].sort());
    for (const sector of WHO_WE_SERVE) expect(SERVE_GLYPHS[sector]).toBeTypeOf('function');
  });

  /**
   * Six of the seven are `TRUST_GLYPHS`' own drawings under §10's longer
   * wording. That reuse is deliberate — §4's band and §10's grid name the same
   * sectors in the client's two registers, and a second shopping bag for the
   * second wording would be a second opinion about what retail looks like. This
   * fails if someone "fixes" the aliasing by drawing duplicates.
   */
  it('reuses the trust strip s drawings rather than redrawing them', () => {
    const trust = Object.values(TRUST_GLYPHS);
    const shared = Object.values(SERVE_GLYPHS).filter((glyph) => trust.includes(glyph));
    // Six shared, one drawn here: Jewellery is the sector §4's band does not name.
    expect(shared).toHaveLength(6);
    expect(SERVE_GLYPHS['Jewellery Showrooms']).toBeTypeOf('function');
    expect(trust).not.toContain(SERVE_GLYPHS['Jewellery Showrooms']);
  });
});
