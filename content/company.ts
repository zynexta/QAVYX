/**
 * The Who We Are group — four routes, one content file.
 *
 * SOURCE: `docs/CONTENT-HANDOFF.md` —
 * §46 About, §47 Mission, §48 Vision, §49 Why Businesses Choose QAVYX,
 * §50 Meet the Team, §51 Contact, §52 Contact Form. §64 for the routes,
 * §65 for the CTA labels, §68 for what the form must collect.
 *
 * Same discipline as `content/pillars.ts`, `content/site.ts` and
 * `content/services.ts`: every user-facing string on the four Who We Are routes
 * comes from here, and the file's only import is the `FormField` TYPE — erased
 * at build, carrying no copy of its own.
 *
 * ## Two routes now, and it was four
 *
 * §64's URL structure lists `/who-we-are`, `/who-we-are/about`,
 * `/who-we-are/team` and `/who-we-are/contact`, and the client confirmed all
 * four. It was built that way: §46–§49 at About, §50 at Team, §51–§52 at
 * Contact, and `/who-we-are` as a hub carrying §46's heading and first paragraph
 * over an index of its children.
 *
 * THE CLIENT HAS SINCE COLLAPSED IT TO TWO, in two directions given together:
 * "Who We Are" in the menu should lead straight to the about content, and the
 * team is not a page of its own but part of that content. So §46–§50 are all
 * `/who-we-are` now — the four About paragraphs, Mission and Vision, §49's five
 * reasons, and §50 as the closing section — and `/who-we-are/contact` is the one
 * child that remains. Both old URLs are permanent redirects in `next.config.ts`;
 * see the note at the top of `app/(site)/who-we-are/page.tsx`.
 *
 * That instruction post-dates §64, exactly as the header's return post-dates
 * §62. §46–§52 are untouched by it: this is a routing change, and every string
 * below is still the client's, still in the document's order.
 *
 * ## The team page is written and switched off
 *
 * §50's heading and description are real client copy and render. Its profile
 * grid does not, because §69 lists names, roles, bios, photos and social links
 * among the assets still outstanding. `TEAM.profiles` is therefore an empty list
 * with `TEAM_PROFILE_FIELDS` recording the shape §50 asks for, and
 * `components/company/TeamPage.tsx` carries the commented-out grid.
 *
 * **Never fill it with invented people.** §66 Rule 05 forbids inventing results
 * and testimonials; a fabricated team is the placeholder a visitor is least able
 * to detect and most likely to take as fact.
 */

import type { FormField } from '@/types/forms';

/* -------------------------------------------------------------------------- */
/*  §46 About — and the hub                                                    */
/* -------------------------------------------------------------------------- */

/**
 * §46, verbatim — the whole of it opens `/who-we-are`.
 *
 * "We're Not an Agency. We're Your Growth Team." is the client's positioning for
 * this whole section of the site, and it is the route's `<h1>`. The section's
 * NAME — "Who We Are", below — is what the menu, the footer and the browser tab
 * say; the page says what the client wrote, the same split `/services` makes
 * between its nav entry and its "What's Inside QAVYX" heading.
 */
export const ABOUT = {
  heading: "We're Not an Agency. We're Your Growth Team.",
  description: [
    'QAVYX helps businesses build, market, automate, and grow — all under one roof.',
    'Instead of working with multiple agencies, freelancers, or disconnected tools, you get one dedicated team focused on growing your business.',
    'From strategy and branding to websites, marketing, AI automation, and business growth, we help you move faster with a clear plan and measurable results.',
    "Whether you're launching a new business or scaling an existing one, QAVYX becomes an extension of your team.",
  ],
} as const;

/**
 * The section's NAME — §2, §63 and §64 all call it "Who We Are".
 *
 * One string, and it is not a heading any more. It was the hub's `<h1>`, where
 * an index's heading naming what it indexes was the right call; the route is
 * §46–§49 now and heads itself with the client's own line. What is left is the
 * name the navigations and the `<title>` share, which still has to come from
 * here rather than being typed into `page.tsx` — "Who We Are" appears in
 * `PRIMARY_NAV`, in `FOOTER_NAV`, in `SITE_INDEX` and in the page's metadata,
 * and a route renamed in four places minus one is a route with two names.
 *
 * `lead` and `indexLabel` went with the hub. Both were real client copy in the
 * sense that `lead` was §46's first paragraph — which is still here, as
 * `ABOUT.description[0]`, printed in full on the page. `indexLabel` was written
 * for a layout that no longer exists, and a content file holding a string
 * nothing renders is the second source of truth this file is written to avoid.
 */
export const WHO_WE_ARE = {
  heading: 'Who We Are',
} as const;

/**
 * §47 Mission and §48 Vision — one sentence each, under the client's own
 * headings.
 *
 * They are a pair in the document and a pair on the page. Splitting them into
 * separate sections with the same shape and one line of body each would give two
 * headings more weight than the four-paragraph About above them.
 */
export const MISSION = {
  heading: 'Our Mission',
  copy: 'To help businesses of every size grow with smart strategies, creative marketing, AI-powered solutions, and measurable results.',
} as const;

export const VISION = {
  heading: 'Our Vision',
  copy: 'To become the trusted growth partner for businesses across India, the GCC, and beyond.',
} as const;

export interface Reason {
  label: string;
  body: string;
}

/**
 * §49 Why Businesses Choose QAVYX — five reasons, in the document's order.
 *
 * NOT the same list as §9 Why QAVYX, which is the homepage's six
 * (`WHY_QAVYX` in `content/home.ts`). Three of the five overlap in subject and
 * none of them in wording, and the client wrote both. They are not reconciled
 * here: merging them would mean choosing which of two client-written sentences
 * about the same subject to delete.
 */
export const WHY_CHOOSE_HEADING = 'Why Businesses Choose QAVYX';

export const WHY_CHOOSE: readonly Reason[] = [
  {
    label: 'One Team for Everything',
    body: 'No juggling multiple agencies or freelancers — we handle it all.',
  },
  {
    label: 'Strategy First',
    body: 'Every campaign starts with a clear growth plan.',
  },
  {
    label: 'AI-Powered Efficiency',
    body: 'We combine creativity with AI to save time and improve performance.',
  },
  {
    label: 'Transparent Results',
    body: 'Clear reporting, measurable growth, and complete accountability.',
  },
  {
    label: 'Built for Startups & Growing Businesses',
    body: 'Affordable, scalable solutions designed to grow with your business.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  §50 Meet the Team                                                          */
/* -------------------------------------------------------------------------- */

/**
 * §50's own section title, the way `WHY_CHOOSE_HEADING` is §49's.
 *
 * It heads the team SECTION on `/who-we-are` — §50 has no route of its own any
 * more, on the client's direction — and `TEAM.heading` below is the client's
 * line inside it rather than the label on it. Two strings doing two jobs: on the
 * page this used to be, the line was the `<h1>` and this title was implied by
 * the URL.
 */
export const TEAM_HEADING = 'Meet the Team';

/**
 * The suggested profile fields, §50's own list.
 *
 * Kept as data rather than as a comment because they are the contract the
 * commented-out grid in `app/(site)/who-we-are/page.tsx` is written against:
 * when the client supplies profiles, these are the columns they fill.
 */
export const TEAM_PROFILE_FIELDS: readonly string[] = [
  'Name',
  'Role',
  'Short bio',
  'Profile image',
  'LinkedIn',
  'Relevant social links',
] as const;

export interface TeamProfile {
  name: string;
  role: string;
  bio: string;
  /** Path under `public/`. */
  image: string;
  linkedin?: string;
  links?: readonly { label: string; href: string }[];
}

/**
 * §50, with the grid switched off.
 *
 * `heading` and `description` are the client's copy and DO render, at the foot
 * of `/who-we-are`. `profiles` is empty because §69 lists the data as
 * outstanding, and `MISSING` records what unblocks it.
 *
 * ## IT WAS A PAGE, AND THE SWITCHES WENT FROM THREE TO ONE
 *
 * §50 had its own route at `/who-we-are/team`: unlinked, `indexed: false`, and
 * carrying a commented-out grid — three switches that had to move together, with
 * the tests here holding all three down. The client's direction is that the team
 * belongs on the about page, so the route is gone (a permanent redirect in
 * `next.config.ts`) and §50 is a section of `/who-we-are`.
 *
 * That is a simplification and not a loss. The reason the route was `noindex`
 * was that a whole page whose entire content is a heading and one sentence, ABOUT
 * A TEAM IT DOES NOT NAME, is a page asking to be found in exactly the state it
 * should not be seen in. As the closing section of a page that has already said
 * four paragraphs, a mission, a vision and five reasons, the same two strings are
 * a claim the page has earned — so there is nothing left to hold back, and
 * nothing left to link.
 *
 * ONE SWITCH REMAINS AND IT IS THE ONLY ONE THAT EVER MATTERED: the grid is
 * commented out until `profiles` is non-empty. `tests/unit/company-content.test.ts`
 * fails the moment it is filled while the grid is still commented out.
 */
export const TEAM = {
  heading: 'The people behind your growth.',
  description:
    'Our team brings together expertise in branding, marketing, design, development, automation, and business strategy to help businesses grow with confidence.',
  profiles: [] as readonly TeamProfile[],
  /** For the build team. NEVER rendered — asserted in the content tests. */
  MISSING:
    'Team profiles not supplied — see §69, missing assets. Do not invent names, roles or photos (§66 Rule 05).',
} as const;

/* -------------------------------------------------------------------------- */
/*  §51 Contact · §52 Contact Form                                             */
/* -------------------------------------------------------------------------- */

/**
 * §51, verbatim. The contact details themselves are NOT repeated here — they are
 * `CONTACT` in `content/site.ts`, because the footer prints the same email,
 * number and locations on every page and there is one home for every string.
 */
export const CONTACT_PAGE = {
  heading: "Let's Grow Your Business.",
  description:
    "Whether you're launching something new or scaling an existing business, we're here to help.",
  /** §51's CTA, which is also one of §65's six secondaries. */
  cta: 'Contact Us',
} as const;

/**
 * §52's six fields, in the document's order, with §68's collection list as the
 * cross-check — the two agree exactly.
 *
 * "What are you looking to grow?" is §52's own wording for what §68 calls
 * "Service Interest"; the page uses the question, because that is the string the
 * client wrote for a visitor to read. Its six options are §52's, and the first
 * five are the five pillars in the site's own order.
 */
export const CONTACT_FORM_FIELDS: readonly FormField[] = [
  { id: 'name', label: 'Name', kind: 'text', required: true },
  { id: 'business-name', label: 'Business Name', kind: 'text', required: true },
  { id: 'email', label: 'Email', kind: 'email', required: true },
  { id: 'whatsapp', label: 'WhatsApp Number', kind: 'tel', required: true },
  {
    id: 'interest',
    label: 'What are you looking to grow?',
    kind: 'select',
    // §52 does not mark this one required or optional. It is the only field of
    // the six the document leaves unstated, and the six options include "Not
    // Sure Yet" — an explicit escape hatch, which only makes sense on a field a
    // visitor must answer. Required, with that option as the default-free
    // fallback rather than a pre-selected value.
    required: true,
    options: [
      'Growth Marketing',
      'Social & Content',
      'AI & Automation',
      'Build & Scale',
      'Launch',
      'Not Sure Yet',
    ],
  },
  { id: 'message', label: 'Message', kind: 'textarea', required: true },
] as const;

/** §52's Submit CTA. Also §51's CTA and one of §65's six secondaries. */
export const CONTACT_FORM_SUBMIT = 'Contact Us';
