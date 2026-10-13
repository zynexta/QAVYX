/**
 * `/projects` — the Our Projects page.
 *
 * SOURCE: `docs/CONTENT-HANDOFF.md` —
 * §53 Our Projects, §57 Industries We Serve, §58 Projects Final CTA, §59
 * Projects Critical Development Note. §64 routes it at `/projects` while §2
 * labels it "Our Projects"; both are the document's, and `content/site.ts` owns
 * that pair.
 *
 * Same discipline as the other `content/` modules: this file imports nothing,
 * and every user-facing string on the page comes from here.
 *
 * ## Three sections of the document are BUILT AND SWITCHED OFF
 *
 * §54's industry filters, §55's service filters and §56's testimonials are all
 * here, and none of them renders. The switch in every case is data: the
 * components return `null` when their list is empty, exactly as
 * `/who-we-are/team` handles its profile grid. Nothing is lost, nothing broken
 * ships, and turning them on is a data change rather than a build.
 *
 * **§54 and §55 filter case studies, and §59 says there are none.** A filter row
 * over an empty set is a broken control: every option returns nothing, and a
 * visitor reads that as a fault rather than as an unfinished page. So
 * `INDUSTRY_FILTERS` and `SERVICE_FILTERS` are transcribed and
 * `components/projects/ProjectFilters.tsx` renders them only once
 * `CASE_STUDIES` has something in it.
 *
 * **§56's placeholder testimonial is transcribed as a COMMENT, not as data**,
 * and that is the one place this file departs from the switched-off pattern. Two
 * reasons, and the second is the real one:
 *
 *   1. §56's own note — "Do not present it as a verified client testimonial
 *      unless a real client has approved it" — and §66 Rule 05.
 *   2. **The placeholder has no future.** The moment a real client approves a
 *      quote, it arrives with their name on it and §69 lists "Testimonials"
 *      among the assets still to be supplied. So the approved version is a
 *      different string, not this one with a flag flipped — and storing this one
 *      in `TESTIMONIALS` would leave an unattributed quote a `true` away from
 *      being live. `Testimonial.attribution` is REQUIRED for the same reason:
 *      you cannot add the placeholder without inventing a client, which is
 *      precisely what Rule 05 forbids.
 *
 * §56's placeholder, for the record and not for rendering:
 *
 *     "Working with QAVYX helped us improve our online presence and generate
 *      quality leads."  ⭐⭐⭐⭐⭐
 *
 * ## THREE strings are restored from the deleted Word draft
 *
 * The handoff document is a restructuring of an earlier Word draft (deleted;
 * git history at `0cc4656`), and the restructuring turned some of the draft's
 * visible headings into §-numbered section TITLES — which are labels addressed
 * to the build team and must never be rendered (§1). Where that happened, the
 * client's own heading is gone from the current source and survives only in the
 * draft.
 *
 *   - `INDUSTRIES.lead` — "We work with businesses across a wide range of
 *     industries, including:". §57 is now a bare list of nine with no lead-in;
 *     without the sentence the section is a heading and a chip row with nothing
 *     joining them.
 *   - `INDUSTRY_FILTERS.heading` — "Filter By Industry", now the section title
 *     "54. Projects — Industry Filters".
 *   - `SERVICE_FILTERS.heading` — "Filter By Service", now "55. Projects —
 *     Service Filters".
 *
 * All three are the client's words, lost in conversion rather than cut. The
 * client has confirmed all three stay, and
 * `tests/unit/projects-content.test.ts` asserts each is deliberately NOT in the
 * current document — so if a future edit restores any of them at source, the
 * test fails and the flag comes off.
 */

/** §53 Page Heading and Intro. */
export const PROJECTS = {
  heading: 'Real Businesses. Real Results.',
  intro:
    "Explore how we've helped businesses build their brand, attract more customers, and grow with smart digital solutions.",
} as const;

/**
 * §59's lightweight state, both strings verbatim.
 *
 * §59 gives them as a suggestion ("Use a lightweight state such as"), and this
 * page takes it: the alternative it lists is 4–6 real client results, which do
 * not exist. The `label` is a status, and the `line` is what the page offers
 * instead of the results — a strategy session, which is the same conversation
 * §73 makes the site's primary conversion.
 *
 * The line is NOT a link. Booking runs through a Calendly URL the client has not
 * supplied (§69), and the page's working CTA is §58's "Chat With Us" below it.
 */
export const COMING_SOON = {
  label: 'Coming Soon',
  line: 'See our results in your Strategy Session.',
} as const;

/**
 * The list of things §59 forbids inventing. For the build team, never rendered —
 * `tests/unit/projects-content.test.ts` asserts it stays out of the page.
 *
 * It is here rather than in a comment so that the next person to be asked for
 * "just a couple of example numbers to fill the space" has the client's own
 * refusal to point at.
 */
export const NEVER_FABRICATE: readonly string[] = [
  'Revenue numbers',
  'Lead counts',
  'ROAS',
  'Conversion rates',
  'Client testimonials',
  'Performance claims',
] as const;

/**
 * §57 Industries We Serve — nine, in the document's order.
 *
 * NOT the seven on the homepage (`WHO_WE_SERVE` in `content/home.ts`), which are
 * the client's own shorter list in their own phrasing. The two are not merged:
 * §10 and §57 are different sections of the document and both were written.
 *
 * `lead` is the sentence restored from the Word draft — see the module note.
 */
export const INDUSTRIES = {
  heading: 'Industries We Serve',
  lead: 'We work with businesses across a wide range of industries, including:',
  items: [
    'Healthcare',
    'Restaurants & Cafés',
    'Real Estate',
    'Education',
    'Retail',
    'Travel & Tourism',
    'E-commerce',
    'Professional Services',
    'Startups',
  ] as readonly string[],
} as const;

/** §58 Projects Final CTA. The label is §65's primary, which §58 also names. */
export const PROJECTS_CTA = {
  heading: 'Ready to Be Our Next Success Story?',
  copy: "Let's build a growth strategy that delivers real business results.",
} as const;

/* -------------------------------------------------------------------------- */
/*  §54, §55, §56 — built and switched off                                     */
/* -------------------------------------------------------------------------- */

/**
 * §54 Projects — Industry Filters. Nine, in §54's own order.
 *
 * The same nine industries as §57, in a DIFFERENT order — §54 puts Professional
 * Services before E-commerce and §57 reverses them. Both are the document's, and
 * they are separate constants rather than one shared list precisely because a
 * future edit to either must not silently reorder the other. `INDUSTRIES.items`
 * is content a visitor reads; this is a taxonomy a filter indexes.
 *
 * **`heading` is restored from the deleted Word draft**, like `INDUSTRIES.lead`
 * above and for the same reason. The draft (git history, `0cc4656`) prints
 * "Filter By Industry" as a visible heading; the handoff conversion turned it
 * into the section TITLE "54. Projects — Industry Filters", which is a label
 * addressed to the build team and must never be rendered (§1). The client's own
 * heading would otherwise have been lost with it. Confirmed by the client,
 * alongside the §57 lead-in.
 */
export const INDUSTRY_FILTERS = {
  heading: 'Filter By Industry',
  items: [
    'Healthcare',
    'Restaurants & Cafés',
    'Real Estate',
    'Education',
    'Retail',
    'Travel & Tourism',
    'Professional Services',
    'E-commerce',
    'Startups',
  ] as readonly string[],
} as const;

/**
 * §55 Projects — Service Filters. Six, in §55's order.
 *
 * NOT the five pillars, and not their sub-services either. §55 writes "Social
 * Media & Content" where §8 writes "Social & Content", and it names Website
 * Development, Branding and Paid Advertising — which sit under three different
 * pillars. It is the client's own way of cutting the work for someone browsing
 * projects, and it is left exactly as they cut it.
 *
 * `heading` is restored from the Word draft, exactly as `INDUSTRY_FILTERS`'s is.
 */
export const SERVICE_FILTERS = {
  heading: 'Filter By Service',
  items: [
    'Growth Marketing',
    'Social Media & Content',
    'AI & Automation',
    'Website Development',
    'Branding',
    'Paid Advertising',
  ] as readonly string[],
} as const;

/**
 * One case study. §59 asks for "4–6 real client results, or at minimum, 1 strong
 * detailed case study", and says a detailed real one beats several generic
 * cards.
 *
 * `industry` and `service` are what the two filter rows index, so both must be
 * values from `INDUSTRY_FILTERS.items` / `SERVICE_FILTERS.items` — asserted in
 * `tests/unit/projects-content.test.ts`, which is how a case study cannot be
 * filed under a category no filter offers.
 *
 * **`results` is optional and every entry in it is a claim.** §59 forbids
 * fabricating revenue, leads, ROAS, conversion rates and performance claims, so
 * anything that goes in here comes from the client with the client's permission
 * to publish it. See `NEVER_FABRICATE` above.
 */
export interface CaseStudy {
  slug: string;
  /** The client, named only where permitted — §69 makes that a condition. */
  client: string;
  headline: string;
  summary: string;
  industry: string;
  service: string;
  results?: readonly { label: string; value: string }[];
}

/**
 * **EMPTY, AND THAT IS THE CONTENT.** §59: "No live case studies were provided
 * in this draft."
 *
 * Everything downstream keys off this list being empty:
 * `components/projects/ProjectFilters.tsx` and `CaseStudyGrid.tsx` both return
 * `null`, and the page shows §59's Coming Soon state instead. Add one real case
 * study and all three change at once.
 *
 * The last wire is deliberately not connected: the filter rows will need the
 * page to read `searchParams`, which makes `/projects` a dynamic route. That is
 * correct once there is something to filter and wrong today, so it goes in with
 * the first case study — see the note in `app/(site)/projects/page.tsx`.
 */
export const CASE_STUDIES: readonly CaseStudy[] = [];

/**
 * A client testimonial. §56.
 *
 * **`attribution` is required, and that is the guard.** §56 forbids presenting
 * an unapproved quote as verified and §66 Rule 05 forbids inventing one, so a
 * testimonial with nobody's name on it must not be representable. Adding §56's
 * placeholder here would mean inventing a client to satisfy the type — which is
 * exactly the moment someone should stop.
 *
 * `rating` is §56's five stars, kept optional: a written testimonial without a
 * star rating is still a testimonial, and a rating is a number that has to come
 * from somewhere real.
 */
export interface Testimonial {
  quote: string;
  /** Who said it. A real, approved person or company. Never a placeholder. */
  attribution: string;
  /** Their role or company, where supplied. */
  context?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
}

/**
 * **EMPTY.** §69 lists testimonials among the assets still to be supplied, and
 * §56's placeholder is not one — see the module note for why it is a comment
 * rather than a row with `approved: false`.
 *
 * `components/projects/Testimonials.tsx` returns `null` while this is empty.
 */
export const TESTIMONIALS: readonly Testimonial[] = [];

/** §56's own heading, ready for the day the list is not empty. */
export const TESTIMONIALS_HEADING = 'Client Testimonials';
