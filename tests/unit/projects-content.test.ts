import { describe, expect, it } from 'vitest';
import {
  CASE_STUDIES,
  COMING_SOON,
  INDUSTRIES,
  INDUSTRY_FILTERS,
  NEVER_FABRICATE,
  PROJECTS,
  PROJECTS_CTA,
  SERVICE_FILTERS,
  TESTIMONIALS,
  type CaseStudy,
} from '@/content/projects';
import { INDUSTRY_GLYPHS, TRUST_GLYPHS } from '@/components/icons';
import { facetSlug, filterCaseStudies } from '@/components/projects/ProjectFilters';
import { WHO_WE_SERVE } from '@/content/home';
import { CTA_LABEL } from '@/content/site';
import { HANDOFF, isVerbatim } from './helpers/handoff';

/**
 * `/projects` — the page the client explicitly told us not to fill in.
 *
 * §59 is the strongest instruction in the whole document: no live case studies
 * exist, do not fabricate revenue, leads, ROAS, conversion rates, testimonials
 * or performance claims, and use a Coming Soon state instead. Most of this file
 * asserts absence, which is unusual for a content test and is the point — the
 * failure mode here is someone adding something plausible to fill the space.
 */

describe('§53 the page itself', () => {
  it('is the client’s heading and intro, verbatim', () => {
    expect(isVerbatim(PROJECTS.heading)).toBe(true);
    expect(isVerbatim(PROJECTS.intro)).toBe(true);
    expect(PROJECTS.heading).toBe('Real Businesses. Real Results.');
  });
});

describe('§59 the Coming Soon state', () => {
  it('uses both of §59’s own strings and no substitute for them', () => {
    expect(COMING_SOON.label).toBe('Coming Soon');
    expect(COMING_SOON.line).toBe('See our results in your Strategy Session.');
    expect(isVerbatim(COMING_SOON.label)).toBe(true);
    expect(isVerbatim(COMING_SOON.line)).toBe(true);
  });

  /**
   * The six things §59 forbids. This list is not rendered — it is here so that
   * the next person asked for "just a couple of example numbers to fill the
   * space" has the client's own refusal to point at.
   */
  it('records §59’s six forbidden fabrications', () => {
    expect(NEVER_FABRICATE).toEqual([
      'Revenue numbers',
      'Lead counts',
      'ROAS',
      'Conversion rates',
      'Client testimonials',
      'Performance claims',
    ]);
  });

  /**
   * THE ASSERTION THIS FILE EXISTS FOR. No number that could read as a result
   * may appear in this module — no percentage, no multiplier, no currency, no
   * count of clients. §66 Rule 05 and §59 both.
   *
   * The nine industries are words, the two headings are words: there is nothing
   * legitimately numeric on this page, so any digit at all is the signal.
   */
  it('contains no figure a visitor could read as a result', () => {
    const copy = [
      PROJECTS.heading,
      PROJECTS.intro,
      COMING_SOON.label,
      COMING_SOON.line,
      PROJECTS_CTA.heading,
      PROJECTS_CTA.copy,
      INDUSTRIES.heading,
      INDUSTRIES.lead,
      ...INDUSTRIES.items,
    ].join(' ');
    expect(copy).not.toMatch(/\d/);
    expect(copy).not.toMatch(/[%$₹€]|\bx\b|ROAS/i);
  });
});

/**
 * §54, §55 and §56 are built and switched off — the same pattern
 * `/who-we-are/team` uses for its profile grid. The switch in every case is
 * data: the components return `null` when their list is empty.
 *
 * These are the tests that keep the two halves in step. The transcription is
 * checked so nothing is lost, and the emptiness is checked so nothing broken
 * ships.
 */
describe('§54 and §55, the filters', () => {
  it('transcribes §54’s nine industries, in §54’s order', () => {
    expect(INDUSTRY_FILTERS.items).toEqual([
      'Healthcare',
      'Restaurants & Cafés',
      'Real Estate',
      'Education',
      'Retail',
      'Travel & Tourism',
      'Professional Services',
      'E-commerce',
      'Startups',
    ]);
    for (const item of INDUSTRY_FILTERS.items) expect(isVerbatim(item)).toBe(true);
  });

  /**
   * The same nine as §57 in a DIFFERENT order — §54 puts Professional Services
   * before E-commerce and §57 reverses them. Both are the document's, which is
   * why they are separate constants: an edit to either must not silently
   * reorder the other.
   */
  it('is §57’s nine in §54’s own order, not a copy of §57', () => {
    expect([...INDUSTRY_FILTERS.items].sort()).toEqual([...INDUSTRIES.items].sort());
    expect(INDUSTRY_FILTERS.items).not.toEqual(INDUSTRIES.items);
  });

  it('transcribes §55’s six services, in §55’s order', () => {
    expect(SERVICE_FILTERS.items).toEqual([
      'Growth Marketing',
      'Social Media & Content',
      'AI & Automation',
      'Website Development',
      'Branding',
      'Paid Advertising',
    ]);
    for (const item of SERVICE_FILTERS.items) expect(isVerbatim(item)).toBe(true);
  });

  /**
   * §55 is not the five pillars. It writes "Social Media & Content" where §8
   * writes "Social & Content", and names Website Development, Branding and Paid
   * Advertising — which sit under three different pillars. It is the client's
   * own way of cutting the work for someone browsing projects.
   */
  it('is the client’s own cut of the work, not the five pillars', () => {
    expect(SERVICE_FILTERS.items).not.toContain('Social & Content');
    expect(SERVICE_FILTERS.items).toContain('Social Media & Content');
    expect(SERVICE_FILTERS.items).toContain('Branding');
  });

  /** §59: no case studies. So the rows render nothing — asserted in the e2e. */
  it('has nothing to filter, which is what switches the rows off', () => {
    expect(CASE_STUDIES).toEqual([]);
  });

  /**
   * A case study filed under a category no filter offers is unreachable through
   * the UI. Vacuous today; it is here so the first real case study cannot be
   * added with a category that does not exist.
   */
  it('files every case study under a category the filters offer', () => {
    for (const study of CASE_STUDIES) {
      expect(INDUSTRY_FILTERS.items).toContain(study.industry);
      expect(SERVICE_FILTERS.items).toContain(study.service);
    }
  });

  describe('the matching rules', () => {
    const study = (over: Partial<CaseStudy>): CaseStudy => ({
      slug: 'x',
      client: 'Example',
      headline: 'A headline',
      summary: 'A summary',
      industry: 'Retail',
      service: 'Branding',
      ...over,
    });
    const all = [
      study({ slug: 'a' }),
      study({ slug: 'b', industry: 'Healthcare' }),
      study({ slug: 'c', service: 'Growth Marketing' }),
    ];

    it('returns everything when nothing is selected', () => {
      expect(filterCaseStudies(all)).toEqual(all);
      expect(filterCaseStudies(all, {})).toEqual(all);
    });

    it('narrows on one facet at a time', () => {
      expect(filterCaseStudies(all, { industry: 'Healthcare' }).map((s) => s.slug)).toEqual([
        'b',
      ]);
      expect(filterCaseStudies(all, { service: 'Branding' }).map((s) => s.slug)).toEqual([
        'a',
        'b',
      ]);
    });

    /** The two rows are independent — selecting one must not narrow the other. */
    it('combines the two facets without one implying the other', () => {
      expect(
        filterCaseStudies(all, { industry: 'Retail', service: 'Growth Marketing' }).map(
          (s) => s.slug,
        ),
      ).toEqual(['c']);
      expect(
        filterCaseStudies(all, { industry: 'Healthcare', service: 'Growth Marketing' }),
      ).toEqual([]);
    });
  });

  /**
   * `Restaurants & Cafés` and a hypothetical `Restaurants & Cafes` must not
   * become two URLs for one filter, so the slug strips diacritics.
   */
  it('slugs every facet to a distinct, URL-safe value', () => {
    const slugs = [...INDUSTRY_FILTERS.items, ...SERVICE_FILTERS.items].map(facetSlug);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(facetSlug('Restaurants & Cafés')).toBe('restaurants-cafes');
  });
});

describe('§56, the testimonials', () => {
  /** §69 lists testimonials among the assets still to be supplied. */
  it('has none, which is what switches the section off', () => {
    expect(TESTIMONIALS).toEqual([]);
  });

  /**
   * THE ASSERTION THAT MATTERS. §56's own Development Note: "Do not present it
   * as a verified client testimonial unless a real client has approved it."
   *
   * It is not stored as a row with `approved: false` either — that would leave
   * an unattributed quote one boolean away from being live. `attribution` is a
   * REQUIRED field, so the placeholder cannot be added without inventing a
   * client, which is exactly what §66 Rule 05 forbids.
   */
  it('carries no trace of §56’s placeholder quote in the data', () => {
    const testimonial = 'Working with QAVYX helped us improve our online presence';
    // It really is in the document — this is not a vacuous assertion.
    expect(HANDOFF).toContain(testimonial);
    const data = JSON.stringify({
      COMING_SOON,
      INDUSTRIES,
      INDUSTRY_FILTERS,
      PROJECTS,
      PROJECTS_CTA,
      SERVICE_FILTERS,
      TESTIMONIALS,
    });
    expect(data).not.toContain(testimonial);
    expect(data).not.toContain('⭐');
  });

  /** Every testimonial must name someone. Vacuous today, and the guard. */
  it('requires a real name on anything that is ever added', () => {
    for (const testimonial of TESTIMONIALS) {
      expect(testimonial.attribution.length).toBeGreaterThan(0);
      expect(testimonial.attribution.toLowerCase()).not.toContain('placeholder');
    }
  });
});

describe('§57 Industries We Serve', () => {
  it('is the document’s nine, in its order, verbatim', () => {
    expect(INDUSTRIES.items).toEqual([
      'Healthcare',
      'Restaurants & Cafés',
      'Real Estate',
      'Education',
      'Retail',
      'Travel & Tourism',
      'E-commerce',
      'Professional Services',
      'Startups',
    ]);
    for (const industry of INDUSTRIES.items) expect(isVerbatim(industry)).toBe(true);
  });

  /**
   * §10's seven on the homepage are the client's own shorter list in their own
   * phrasing. Two different sections of the document, both written; neither is
   * merged into the other.
   */
  it('is not the homepage’s seven under another name', () => {
    expect(INDUSTRIES.items).not.toEqual(WHO_WE_SERVE);
    expect(INDUSTRIES.items.length).toBe(9);
    expect(WHO_WE_SERVE.length).toBe(7);
  });

  /**
   * Same contract `SERVE_GLYPHS` has with `WHO_WE_SERVE`, and worth a test for
   * the same reason: the map is keyed by the client's own strings, so an
   * industry renamed in `content/projects.ts` does not fail to compile — it
   * renders one tile with no mark among eight that have one, which is much
   * harder to notice than a blank set.
   *
   * Asserted in BOTH directions. A leftover key is the same bug from the other
   * side: a glyph kept alive for an industry the client has dropped.
   */
  it('has a glyph for every industry, and no glyph without one', () => {
    expect(Object.keys(INDUSTRY_GLYPHS).sort()).toEqual([...INDUSTRIES.items].sort());
    for (const industry of INDUSTRIES.items)
      expect(INDUSTRY_GLYPHS[industry]).toBeTypeOf('function');
  });

  /**
   * Six of the nine are `TRUST_GLYPHS`' own drawings under §57's wording — the
   * third register this site names these sectors in, after §4's band and §10's
   * grid. A shopping bag is drawn once in `components/icons/index.tsx`, and this
   * fails if someone "fixes" the aliasing by drawing duplicates.
   *
   * The three that are not shared: E-commerce and Professional Services are
   * sectors §4 does not name, and Startups borrows §42's seed.
   */
  it('reuses the trust strip’s drawings rather than redrawing them', () => {
    const trust = Object.values(TRUST_GLYPHS);
    const shared = Object.values(INDUSTRY_GLYPHS).filter((glyph) => trust.includes(glyph));
    expect(shared).toHaveLength(6);
  });

  /**
   * The one string on this site restored from the deleted Word draft rather
   * than transcribed from the handoff document. §57 there reads:
   *
   *     Industries We Serve
   *     We work with businesses across a wide range of industries, including:
   *
   * and the conversion dropped the sentence. It is the client's, and without it
   * the heading and the chip row have nothing joining them — so it is restored
   * and the client has confirmed it stays.
   *
   * This test asserts the unusual thing directly: `lead` is deliberately NOT in
   * the current source document, and that is the only string on the site of
   * which that is true. If a future edit adds it to the document, this fails and
   * the flag comes off.
   */
  it('restores the lead-in the DOCX conversion dropped, and flags it as such', () => {
    expect(INDUSTRIES.lead).toBe(
      'We work with businesses across a wide range of industries, including:',
    );
    expect(isVerbatim(INDUSTRIES.lead)).toBe(false);
    expect(isVerbatim(INDUSTRIES.heading)).toBe(true);
  });
});

/**
 * The other two casualties of the same conversion.
 *
 * The Word draft printed "Filter By Industry" and "Filter By Service" as visible
 * headings; restructuring turned each into a §-numbered section TITLE, and §1
 * rules that titles are addressed to the build team and must never be rendered.
 * So the client's own headings survive only in the draft (git history,
 * `0cc4656`), and are restored here.
 *
 * Each assertion has two halves, and the second is the one that matters: the
 * section really is in the current document under a build-team title, so this is
 * a heading that was lost rather than a heading that was invented.
 */
describe('the two filter headings, also restored from the Word draft', () => {
  it('uses the draft’s visible headings, which the current document no longer has', () => {
    expect(INDUSTRY_FILTERS.heading).toBe('Filter By Industry');
    expect(SERVICE_FILTERS.heading).toBe('Filter By Service');
    expect(isVerbatim(INDUSTRY_FILTERS.heading)).toBe(false);
    expect(isVerbatim(SERVICE_FILTERS.heading)).toBe(false);
  });

  it('renders no build-team section title in their place', () => {
    // The sections exist — under titles that must never reach a visitor.
    expect(HANDOFF).toContain('Projects — Industry Filters');
    expect(HANDOFF).toContain('Projects — Service Filters');
    for (const heading of [INDUSTRY_FILTERS.heading, SERVICE_FILTERS.heading]) {
      expect(heading).not.toContain('Projects —');
      expect(heading.toLowerCase()).not.toContain('note');
    }
  });
});

describe('§58 the final CTA', () => {
  it('is the client’s heading and copy, closing on §65’s primary', () => {
    expect(isVerbatim(PROJECTS_CTA.heading)).toBe(true);
    expect(isVerbatim(PROJECTS_CTA.copy)).toBe(true);
    // §58 names the CTA itself, and it is the site-wide primary.
    expect(HANDOFF).toContain(CTA_LABEL);
  });
});
