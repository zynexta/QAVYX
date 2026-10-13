/**
 * The homepage's closing acts.
 *
 * SOURCE: `docs/CONTENT-HANDOFF.md` —
 * §3.1 Hero, §4 Trust Strip, §8 What's Inside QAVYX, §9 Why QAVYX, §10 Who We
 * Serve, §11 Final CTA. It replaced a Word draft that has since been deleted
 * (git history, 0cc4656).
 *
 * The homepage's earlier acts already live elsewhere and are NOT duplicated
 * here: "What's Inside QAVYX" is `content/services.ts` (the carousel's five
 * pillars) and "The Problem" / "The Solution" are `content/launch.ts`. There is
 * one home for every string.
 *
 * §3.1's `eyebrow` arrives with Phase 8E, as the title card that opens the
 * second pin. Its `headline` and `supporting` are still unrendered, and §4's
 * trust strip with them — all three belong inside a pinned region, and the two
 * pins are fully spoken for. See the note on HERO_COPY below and `TrustStrip`.
 *
 * NO typo fixes are applied here any more. The DOCX needed three (a misplaced
 * em dash, a missing full stop, a singular "Jewellery Showroom"); the handoff
 * document has all three repaired at source, so this file is now a plain
 * transcription. If a string here ever disagrees with the document, the document
 * wins.
 */

/**
 * §3.1 Hero Section — the three copy slots, verbatim.
 *
 * ONE of the three is on the page. `eyebrow` is the title card that opens pin 2
 * (`LaunchTitle`): coming out of §7's Growth Framework it names what the rocket
 * is about to show, which is the job §3.1 gives it — the positioning line.
 *
 * `headline` and `supporting` are NOT rendered, and that is a decision rather
 * than an omission. The hero was rebuilt in Phase 8E and deliberately kept as
 * the logo assembling alone, with `<h1 class="sr-only">Qavyx</h1>` still
 * carrying the accessible name; a headline block over the assembling mark was
 * built, reviewed and cut. They are kept here because the document says them and
 * this file transcribes the document — the day there is a slot for them, the
 * strings are already right.
 *
 * `supporting` also repeats `eyebrow`'s words, in adjacent slots, so rendering
 * the pair verbatim would read as a duplication bug. Asked, and the client's
 * answer is to leave both strings here unrendered rather than reword or delete
 * one: this file transcribes the document, and the day there is a slot for them
 * the strings are already right.
 */
export const HERO_COPY = {
  eyebrow: 'Digital Growth Launchpad',
  headline: 'The Access Point to Growth.',
  supporting: 'Welcome to Digital Growth Launchpad',
} as const;

/**
 * §4 Trust Strip — one sentence, and it belongs directly under the hero.
 *
 * That placement is why it went unbuilt for so long: "under the hero" is inside
 * the pinned region, and there was no beat to reveal it on. Phase 8E gives it
 * one, at the end of pin 1 after the rocket has landed.
 *
 * IT IS NOT A CLAIM ABOUT NAMED CLIENTS. §66 Rule 05 forbids inventing results,
 * and §59 forbids fabricating testimonials — this names sectors, not companies,
 * which is exactly why the client could write it while §53's case studies stayed
 * empty. Do not "strengthen" it with logos that do not exist.
 */
export const TRUST_STRIP =
  'Trusted by ambitious brands across Clinics & Healthcare, Hospitality & Restaurants, Real Estate, Education, Retail, Travel, across India & UAE.';

/**
 * The same sentence, in the three parts the layout sets it in — NOT new copy.
 *
 * §4 is one sentence whose object is a list, so the section reads it out in the
 * order it is written: the claim, then the sectors as a moving band, then the
 * regions. `sectors` is the sentence's object lifted out; `lead` and `region`
 * are the words on either side of it, unedited.
 *
 * THE INVARIANT IS TESTED, and it is the only thing keeping this honest:
 * `${lead} ${sectors.join(', ')}, ${region}.` must equal `TRUST_STRIP` exactly
 * (`tests/unit/trust-strip.test.ts`). Reword any part and the recomposition
 * stops matching, which is the point — the band cannot quietly grow a sector the
 * client never claimed, and §66 Rule 05 stays enforced by arithmetic rather than
 * by everyone remembering it.
 *
 * The full sentence is still what a screen reader gets, once, from `TRUST_STRIP`
 * above; the three parts are the visual layer and are `aria-hidden`. Same
 * arrangement as `SplitText` and the star ratings.
 */
export const TRUST = {
  lead: 'Trusted by ambitious brands across',
  sectors: [
    'Clinics & Healthcare',
    'Hospitality & Restaurants',
    'Real Estate',
    'Education',
    'Retail',
    'Travel',
  ] as readonly string[],
  region: 'across India & UAE',
} as const;

export interface Reason {
  id: string;
  label: string;
  body: string;
}

/** "Why QAVYX" — six reasons, in the draft's order. */
export const WHY_QAVYX: readonly Reason[] = [
  {
    id: 'all-in-one',
    label: 'All-in-One Team',
    body: 'From strategy to execution, we handle everything under one roof.',
  },
  {
    id: 'market-expertise',
    label: 'India & GCC Market Expertise',
    body: 'We understand the audience, culture, and business landscape across India and the Gulf region.',
  },
  {
    id: 'startup-friendly',
    label: 'Startup Friendly',
    body: 'Affordable and flexible solutions built for startups and growing businesses.',
  },
  {
    id: 'growth-that-matters',
    label: 'Growth That Matters',
    body: 'Our focus is on leads, sales, and long-term business growth.',
  },
  {
    id: 'ai-powered',
    label: 'AI-Powered Solutions',
    body: 'We use AI and automation to save time, improve efficiency, and help your business grow faster.',
  },
  {
    id: 'local-to-global',
    label: 'Local to Global',
    body: "Whether you're serving your neighborhood or expanding internationally, we help you build a strong digital presence.",
  },
] as const;

/**
 * "Who We Serve" — the seven industries, verbatim.
 *
 * These are NOT the nine in §57 Industries We Serve (Healthcare, Restaurants &
 * Cafés, Real Estate, Education, Retail, Travel & Tourism, E-commerce,
 * Professional Services, Startups). §10 gives the homepage its own shorter list
 * with its own phrasing, and the two are not reconciled to each other here —
 * Phase 8D owns that page and can decide.
 */
export const WHO_WE_SERVE: readonly string[] = [
  'Clinics & Healthcare Brands',
  'Restaurants & Hospitality',
  'Educational Institutions',
  'Real Estate Developers',
  'Travel Agencies',
  'Jewellery Showrooms',
  'Local Businesses & Retail Brands',
] as const;

/** Section headings and lead copy, verbatim. */
export const HOME_COPY = {
  /**
   * The draft's "What's Inside QAVYX" heading and its lead, used for the site
   * index. `One access point` is not a metaphor the layout invented — it is the
   * client's line, and the index frame's open corner is that access point. The
   * lead is what stops the missing corner reading as a rendering fault.
   */
  indexHeading: "What's Inside QAVYX",
  indexLead: 'Six pillars. One access point. Everything a growing brand actually needs.',
  whyHeading: 'Why QAVYX',
  serveHeading: 'Who We Serve',
  serveLead: 'QAVYX works with ambitious businesses across:',
  /** The draft writes `Final CTA — Let's Build Your Growth Story`; the first
   *  half is a section label for the developer, not the heading. */
  ctaHeading: "Let's Build Your Growth Story",
  ctaLead:
    "We believe growth should be strategic, measurable, and scalable. If you're ready to take your brand to the next level, let's start with a simple conversation.",
} as const;
