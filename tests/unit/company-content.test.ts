import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ABOUT,
  CONTACT_FORM_FIELDS,
  CONTACT_FORM_SUBMIT,
  CONTACT_PAGE,
  MISSION,
  TEAM,
  TEAM_HEADING,
  TEAM_PROFILE_FIELDS,
  VISION,
  WHO_WE_ARE,
  WHY_CHOOSE,
  WHY_CHOOSE_HEADING,
} from '@/content/company';
import { WHY_QAVYX } from '@/content/home';
import { CONTACT_NAV, CTA_LABEL, SECONDARY_CTAS } from '@/content/site';
import { isVerbatim } from './helpers/handoff';

/**
 * The Who We Are group's content contract — §46–§52, across two routes.
 *
 * Two ideas run through this file.
 *
 * The first is **verbatim**: every sentence on these pages is the client's, and
 * `isVerbatim` checks that against the document on disk rather than against a
 * string retyped into this test. A test that hard-codes the copy is a second
 * source of truth for the copy, and would pass just as happily on a typo copied
 * into both places.
 *
 * The second is **switched off, not missing**: §50 renders real copy with its
 * profile grid commented out. There used to be three separate switches — the
 * grid, the navigation link and the `indexed` flag — held down together because
 * §50 had a route of its own; the client has since folded it into
 * `/who-we-are`, and the other two went with the route. One is left, and the
 * test below is what stops it moving alone.
 */

describe('§46 About', () => {
  it('is the client’s heading and four paragraphs, verbatim', () => {
    expect(isVerbatim(ABOUT.heading)).toBe(true);
    expect(ABOUT.description).toHaveLength(4);
    for (const paragraph of ABOUT.description) expect(isVerbatim(paragraph)).toBe(true);
  });

  /**
   * The section's name is §2/§63/§64's own label, and it is the ONLY thing left
   * in `WHO_WE_ARE` — the hub it used to head is gone, its content replaced by
   * §46–§49 at the same route. `lead` and `indexLabel` went with it: a content
   * file holding strings nothing renders is the second source of truth this file
   * is written to avoid, and `lead` in particular was a copy of
   * `ABOUT.description[0]`, which the page now prints in full.
   */
  it('keeps the client’s label for the section, and nothing the hub left behind', () => {
    expect(WHO_WE_ARE.heading).toBe('Who We Are');
    expect(isVerbatim(WHO_WE_ARE.heading)).toBe(true);
    expect(Object.keys(WHO_WE_ARE)).toEqual(['heading']);
  });
});

describe('§47 Mission and §48 Vision', () => {
  it('are the client’s two headings and two sentences', () => {
    for (const statement of [MISSION, VISION]) {
      expect(isVerbatim(statement.heading)).toBe(true);
      expect(isVerbatim(statement.copy)).toBe(true);
    }
    expect(MISSION.heading).toBe('Our Mission');
    expect(VISION.heading).toBe('Our Vision');
  });
});

describe('§49 Why Businesses Choose QAVYX', () => {
  it('is five reasons, in the document’s order, verbatim', () => {
    expect(isVerbatim(WHY_CHOOSE_HEADING)).toBe(true);
    expect(WHY_CHOOSE).toHaveLength(5);
    for (const reason of WHY_CHOOSE) {
      expect(isVerbatim(reason.label)).toBe(true);
      expect(isVerbatim(reason.body)).toBe(true);
    }
    expect(WHY_CHOOSE[0]?.label).toBe('One Team for Everything');
    expect(WHY_CHOOSE[4]?.label).toBe('Built for Startups & Growing Businesses');
  });

  /**
   * §9's six on the homepage and §49's five here overlap in subject and share
   * not one sentence. The client wrote both, so neither is merged into the
   * other — merging would mean choosing which of two client-written sentences
   * about the same subject to delete.
   */
  it('is not the homepage’s list under another name', () => {
    const here = new Set(WHY_CHOOSE.map((r) => r.body));
    for (const reason of WHY_QAVYX) expect(here).not.toContain(reason.body);
    expect(WHY_CHOOSE.length).not.toBe(WHY_QAVYX.length);
  });
});

describe('§50 the team section, and the grid still switched off', () => {
  it('renders real client copy — it is not a stub', () => {
    expect(isVerbatim(TEAM.heading)).toBe(true);
    expect(isVerbatim(TEAM.description)).toBe(true);
  });

  /**
   * §50's own title heads the SECTION, the way `WHY_CHOOSE_HEADING` heads §49's.
   * It exists because §50 lost the route whose URL used to name it: on a page of
   * its own, `TEAM.heading` was the `<h1>` and "Meet the Team" was implied. Two
   * strings doing two jobs now, and both of them the document's.
   */
  it('names the section from the document, not from the layout', () => {
    expect(TEAM_HEADING).toBe('Meet the Team');
    expect(TEAM_HEADING).not.toBe(TEAM.heading);
  });

  /**
   * THE ASSERTION THIS FILE EXISTS FOR. §66 Rule 05 forbids inventing results
   * and testimonials, and a fabricated team is the placeholder a visitor is
   * least able to detect. If profiles ever appear here, they must be real — and
   * the moment they do, the commented-out grid on `/who-we-are` has to come back
   * with them. This failing is the reminder.
   */
  it('carries no profiles at all while the client has supplied none', () => {
    expect(TEAM.profiles).toEqual([]);
  });

  /**
   * THE ONE SWITCH THAT IS LEFT. There were three — the grid, the navigation
   * link and `indexed: false` — and the other two went with the route when §50
   * became a section of `/who-we-are`. This is the one that always mattered, and
   * it is checked against the page's own source because a commented-out grid is
   * invisible to every other kind of test: filling `TEAM.profiles` without
   * uncommenting it renders nothing at all, silently.
   */
  it('keeps the grid commented out for exactly as long as there are no profiles', () => {
    const page = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../../app/(site)/who-we-are/page.tsx'),
      'utf8',
    );
    const commented = page.includes('TEAM.profiles.map') && page.includes('THE PROFILE GRID');
    expect(commented, 'the grid must stay in the page, commented, as its own switch').toBe(true);
    // The live half: nothing outside the comment may map the profiles.
    const live = page.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    expect(live.includes('TEAM.profiles')).toBe(TEAM.profiles.length > 0);
  });

  /** §50's own suggested fields, so real profiles drop in without a redesign. */
  it('records §50’s six suggested fields for the commented-out grid', () => {
    expect(TEAM_PROFILE_FIELDS).toEqual([
      'Name',
      'Role',
      'Short bio',
      'Profile image',
      'LinkedIn',
      'Relevant social links',
    ]);
    for (const field of TEAM_PROFILE_FIELDS) expect(isVerbatim(field)).toBe(true);
  });

  /** The note is addressed to the build team and must never be rendered. */
  it('keeps its missing-asset note out of anything user-facing', () => {
    expect(TEAM.MISSING).toContain('§69');
    expect(isVerbatim(TEAM.MISSING)).toBe(false);
  });
});

describe('§51 Contact', () => {
  it('is the client’s heading, description and CTA', () => {
    expect(isVerbatim(CONTACT_PAGE.heading)).toBe(true);
    expect(isVerbatim(CONTACT_PAGE.description)).toBe(true);
    expect(CONTACT_PAGE.cta).toBe('Contact Us');
  });

  /** §65 supplies one primary and six secondaries; a seventh would be ours. */
  it('uses only a CTA label §65 supplies', () => {
    expect([CTA_LABEL, ...SECONDARY_CTAS]).toContain(CONTACT_PAGE.cta);
    expect([CTA_LABEL, ...SECONDARY_CTAS]).toContain(CONTACT_FORM_SUBMIT);
  });

  /** The details themselves live in `content/site.ts`, printed by the footer. */
  it('does not keep a second copy of the contact details', () => {
    const strings = JSON.stringify(CONTACT_PAGE);
    expect(strings).not.toContain('info@qavyx.com');
    expect(strings).not.toContain('9188743741');
  });
});

describe('§52 the contact form', () => {
  it('is the document’s six fields, in its order, with its labels', () => {
    expect(CONTACT_FORM_FIELDS.map((f) => f.label)).toEqual([
      'Name',
      'Business Name',
      'Email',
      'WhatsApp Number',
      'What are you looking to grow?',
      'Message',
    ]);
    for (const field of CONTACT_FORM_FIELDS) expect(isVerbatim(field.label)).toBe(true);
  });

  /**
   * §68's "Collect:" list is the same six under slightly different names
   * ("Service Interest" for §52's question). §52's wording wins, because that is
   * the string the client wrote for a visitor to read.
   */
  it('collects what §68 asks for, using §52’s wording', () => {
    expect(CONTACT_FORM_FIELDS).toHaveLength(6);
    const kinds = CONTACT_FORM_FIELDS.map((f) => f.kind);
    expect(kinds).toEqual(['text', 'text', 'email', 'tel', 'select', 'textarea']);
  });

  /**
   * §68 asks for mobile-friendly inputs, which is mostly the input `type` — an
   * email field typed `text` raises the wrong keyboard on every phone.
   */
  it('types the email and phone fields so a phone raises the right keyboard', () => {
    expect(CONTACT_FORM_FIELDS.find((f) => f.label === 'Email')?.kind).toBe('email');
    expect(CONTACT_FORM_FIELDS.find((f) => f.label === 'WhatsApp Number')?.kind).toBe('tel');
  });

  it('offers §52’s six options, in its order, and no seventh', () => {
    const select = CONTACT_FORM_FIELDS.find((f) => f.kind === 'select');
    expect(select?.options).toEqual([
      'Growth Marketing',
      'Social & Content',
      'AI & Automation',
      'Build & Scale',
      'Launch',
      'Not Sure Yet',
    ]);
    for (const option of select?.options ?? []) expect(isVerbatim(option)).toBe(true);
  });

  it('gives every field an id usable as an HTML id and a form name', () => {
    for (const field of CONTACT_FORM_FIELDS) {
      expect(field.id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
    expect(new Set(CONTACT_FORM_FIELDS.map((f) => f.id)).size).toBe(CONTACT_FORM_FIELDS.length);
  });
});

/**
 * The Contact route the navigation addition points at is the one §64 assigns,
 * and the page that answers it is this content module. If the two ever disagree
 * the footer link 404s on every page of the site.
 */
describe('the contact route', () => {
  it('is where the global Contact link goes', () => {
    expect(CONTACT_NAV.href).toBe('/who-we-are/contact');
  });
});
