import { describe, expect, it } from 'vitest';
import {
  EARLY_ACCESS,
  LAUNCHPAD,
  WAITLIST_FIELDS,
  WAITLIST_SUBMIT,
  WAITLIST_SUCCESS,
  WHATS_COMING,
} from '@/content/launchpad';
import { WHATS_COMING_GLYPHS } from '@/components/icons';
import { PILLAR_PAGES } from '@/content/pillars';
import { CTA_LABEL, SECONDARY_CTAS, SITE_INDEX } from '@/content/site';
import { isVerbatim } from './helpers/handoff';

/**
 * `/launchpad` — §41–§44, the coming-soon product.
 *
 * Three things here are worth more than the transcription checks: the asterisk
 * on §42's last item is a real footnote rather than a dangling glyph, §44's
 * success message is present in the data and absent from the page, and §45 is
 * NOT here — it belongs to the Launch pillar page.
 */

/**
 * THE FOUR STRINGS THE CLIENT RENAMED, EXEMPT FROM `isVerbatim` AND FROM
 * NOTHING ELSE.
 *
 * The document had two names for one subject — "Digital Growth Launchpad"
 * (§3.1) and "QAVYX Launchpad" (§41) — and the client answered that they are
 * the same thing and the first one survives. These four carried the full
 * "QAVYX Launchpad" and now carry "Digital Growth Launchpad", so they can no
 * longer match a document that still says the old name.
 *
 * LISTED RATHER THAN SKIPPING THE WHOLE CHECK. Every other string on this route
 * is still asserted verbatim, which is the point: §41's heading, §42's six
 * items and its note, §44's five field labels, the submit label, and the three
 * paragraphs on this page that were never renamed. Dropping the loops entirely
 * would have taken the protection off ~20 strings to accommodate 4.
 *
 * A string leaving this set must either match the document again or be a
 * deliberate decision like this one. If the client reissues the document with
 * the new name, delete this set and restore the plain `isVerbatim` loops — the
 * assertions come back unchanged.
 */
const RENAMED: ReadonlySet<string> = new Set([
  'Digital Growth Launchpad',
  'Join the Digital Growth Launchpad and build your startup.',
  'Join the waitlist today and be the first to experience Digital Growth Launchpad.',
  'Thanks for joining the Digital Growth Launchpad waitlist.',
]);

describe('§41 the product', () => {
  it('is the client’s heading, status and four paragraphs, verbatim', () => {
    expect(isVerbatim(LAUNCHPAD.heading)).toBe(true);
    expect(LAUNCHPAD.description).toHaveLength(4);
    for (const paragraph of LAUNCHPAD.description) {
      if (RENAMED.has(paragraph)) continue;
      expect(isVerbatim(paragraph)).toBe(true);
    }
  });

  /**
   * §41 titles the section "QAVYX Launchpad — Coming Soon", and the site index
   * carries the same status under its link. Both now print it, so both must
   * print it the same way — this read `Coming soon` in one place until 8D.
   */
  it('shares one casing of the status with the site index', () => {
    expect(LAUNCHPAD.status).toBe('Coming Soon');
    expect(SITE_INDEX.launchpad.status).toBe(LAUNCHPAD.status);
    expect(isVerbatim(LAUNCHPAD.status)).toBe(true);
  });

  it('names the product Digital Growth Launchpad, on the client’s direction', () => {
    expect(LAUNCHPAD.productName).toBe('Digital Growth Launchpad');
    // NOT `isVerbatim`. The document still says "QAVYX Launchpad" at §41; see
    // `RENAMED` above and the docblock in `content/launchpad.ts`.
    expect(RENAMED.has(LAUNCHPAD.productName)).toBe(true);
  });
});

describe('§42 What’s Coming', () => {
  it('is the document’s six items, in its order, verbatim', () => {
    expect(WHATS_COMING.items.map((i) => i.label)).toEqual([
      'Submit Your Startup Idea',
      'Founder Dashboard',
      'Build with the QAVYX Team',
      'Branding & Product Development',
      'Marketing & Growth Support',
      'Investor & Seed Funding Opportunities',
    ]);
    for (const item of WHATS_COMING.items) expect(isVerbatim(item.label)).toBe(true);
  });

  /**
   * The document writes "Investor & Seed Funding Opportunities*" with the note
   * "*Available for selected startups." underneath. The asterisk must not live
   * inside the label — rendering it there without the note leaves a typo on the
   * most attractive item in the list, and folding the note into the label
   * rewrites the client's copy. So it is a flag plus a footnote.
   */
  it('keeps §42’s asterisk as a footnote, not as part of a label', () => {
    const footnoted = WHATS_COMING.items.filter((i) => i.footnoted);
    expect(footnoted.map((i) => i.label)).toEqual(['Investor & Seed Funding Opportunities']);
    for (const item of WHATS_COMING.items) expect(item.label).not.toContain('*');
    expect(WHATS_COMING.note).toBe('Available for selected startups.');
    expect(WHATS_COMING.note).not.toContain('*');
    expect(isVerbatim(WHATS_COMING.note)).toBe(true);
  });

  /**
   * The six glyphs are keyed by the client's own label, which is a string the
   * client may still reword — §70 asks them to review copy before production.
   * A reworded label would silently drop its mark and leave one card in a grid
   * of six with a hole where a 40px figure should be, which is the kind of
   * regression nobody notices from a diff.
   *
   * Same contract `services.test.ts` holds `SERVICE_VISUALS` to: a missing
   * diagram is a failing test, never a silent default.
   */
  it('has a glyph for every item, so a reworded label fails here first', () => {
    for (const item of WHATS_COMING.items) {
      expect(WHATS_COMING_GLYPHS[item.label], `${item.label} has no glyph`).toBeTypeOf(
        'function',
      );
    }
    // And nothing left behind: a glyph whose label has already been reworded is
    // dead code that still looks maintained.
    expect(Object.keys(WHATS_COMING_GLYPHS).sort()).toEqual(
      WHATS_COMING.items.map((i) => i.label).sort(),
    );
  });
});

describe('§43 Early Access', () => {
  it('is the client’s heading and two paragraphs', () => {
    expect(isVerbatim(EARLY_ACCESS.heading)).toBe(true);
    for (const paragraph of EARLY_ACCESS.copy) {
      if (RENAMED.has(paragraph)) continue;
      expect(isVerbatim(paragraph)).toBe(true);
    }
  });

  it('uses a CTA label §65 supplies', () => {
    expect(EARLY_ACCESS.cta).toBe('Join the Waitlist');
    expect([CTA_LABEL, ...SECONDARY_CTAS]).toContain(EARLY_ACCESS.cta);
  });
});

describe('§44 the waitlist form', () => {
  it('is the document’s five fields, in its order, with its labels', () => {
    expect(WAITLIST_FIELDS.map((f) => f.label)).toEqual([
      'Full Name',
      'Email Address',
      'WhatsApp Number',
      'Startup Name',
      'Industry',
    ]);
    for (const field of WAITLIST_FIELDS) expect(isVerbatim(field.label)).toBe(true);
  });

  /**
   * Three required, two optional, exactly as §44 marks them. This is why the
   * form renders BOTH markers rather than starring the required ones: with two
   * of five optional, marking only the majority leaves the reader counting.
   */
  it('marks three required and two optional, as §44 does', () => {
    expect(WAITLIST_FIELDS.filter((f) => f.required).map((f) => f.label)).toEqual([
      'Full Name',
      'Email Address',
      'WhatsApp Number',
    ]);
    expect(WAITLIST_FIELDS.filter((f) => !f.required).map((f) => f.label)).toEqual([
      'Startup Name',
      'Industry',
    ]);
  });

  it('types the email and phone fields for a phone keyboard', () => {
    expect(WAITLIST_FIELDS.find((f) => f.label === 'Email Address')?.kind).toBe('email');
    expect(WAITLIST_FIELDS.find((f) => f.label === 'WhatsApp Number')?.kind).toBe('tel');
  });

  it('uses §44’s own submit label', () => {
    expect(WAITLIST_SUBMIT).toBe('Join the First 100 Founders');
    expect(isVerbatim(WAITLIST_SUBMIT)).toBe(true);
  });

  /**
   * §44's success message is transcribed so that wiring the backend needs no
   * copy written — and it is NOT rendered while the form cannot submit. A
   * success state on a form that cannot succeed is the one lie a visitor has no
   * way to detect. The e2e spec asserts the other half: that it never reaches
   * the page.
   */
  it('keeps §44’s success message ready and unrendered', () => {
    expect(WAITLIST_SUCCESS.heading).toBe("🎉 You're on the list!");
    for (const paragraph of WAITLIST_SUCCESS.copy) {
      if (RENAMED.has(paragraph)) continue;
      expect(isVerbatim(paragraph)).toBe(true);
    }
  });
});

/**
 * §45 "Launch Page Final CTA" sits between the Launchpad block and §46, which
 * makes it look like this page's closing CTA. It is on the Launch PILLAR page:
 * §36 is titled "Launch Page" and every Launchpad section is titled
 * "Launchpad — …", so the naming decides it.
 *
 * It is flagged for the client either way, and this test is what makes the
 * decision visible rather than implicit — if §45 moves, it fails here first.
 */
describe('§45, which is not on this page', () => {
  it('leaves "Start With Us" on the Launch pillar page', () => {
    const launchpadCopy = JSON.stringify({ EARLY_ACCESS, LAUNCHPAD, WHATS_COMING });
    expect(launchpadCopy).not.toContain('Start With Us');

    const launch = PILLAR_PAGES.find((page) => page.slug === 'launch');
    expect(launch?.ctas.map((cta) => cta.label)).toContain('Start With Us');
  });
});
