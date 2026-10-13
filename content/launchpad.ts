/**
 * `/launchpad` — Digital Growth Launchpad, the coming-soon product.
 *
 * SOURCE: `docs/CONTENT-HANDOFF.md` —
 * §41 Coming Soon, §42 What's Coming, §43 Early Access, §44 Waitlist Form.
 * §63 puts Launchpad in the footer navigation, §64 routes it at `/launchpad`,
 * §68 lists what the waitlist collects.
 *
 * Same discipline as the other `content/` modules: this file imports nothing,
 * and every user-facing string on the page comes from here.
 *
 * ## The naming collision, CLOSED — and this page is where the answer landed
 *
 * The document had two nearly-identical names for what turned out to be one
 * thing: "Digital Growth Launchpad" (§3.1), the company's positioning line and
 * the homepage's title card, and "QAVYX Launchpad" (§41), this — an unreleased
 * product with a waitlist. The build could not tell whether they were the same
 * subject and refused to guess.
 *
 * THE CLIENT ANSWERED: they are the same, and the surviving name is DIGITAL
 * GROWTH LAUNCHPAD. So the four strings on this page that carried the full
 * "QAVYX Launchpad" now carry "Digital Growth Launchpad" instead —
 * `productName`, §41's second paragraph, §43's second line and §44's success
 * message.
 *
 * THE BARE "Launchpad" SHORTHAND IS LEFT ALONE, in this file and in the
 * navigation. Three sentences here say just "Launchpad" after the full name has
 * been introduced, which is ordinary English and still correct; and
 * `SITE_INDEX.launchpad.label` stays the one-word "Launchpad" on the client's
 * direction, because "Digital Growth Launchpad" in the footer nav and on the
 * carousel's sixth panel is three times the length of anything beside it.
 * `LaunchpadPanel` has the measurement: at 780px the longer string wrapped.
 *
 * THIS IS THE ONE PLACE ON THE SITE WHERE COPY DEPARTS FROM THE DOCUMENT ON
 * PURPOSE, besides the three §54–§57 strings the DOCX conversion dropped. The
 * document still reads "QAVYX Launchpad" at §41, §42's intro, §43 and §44, so
 * `isVerbatim` is false for all four and `launchpad-content.test.ts` no longer
 * asserts it for them — see the note there. If the client ever reissues the
 * document with the new name, those assertions can come back unchanged.
 *
 * ## §45 is not here
 *
 * §45 "Launch Page Final CTA" sits between the Launchpad block and §46, which
 * makes it look like this page's closing CTA. It is on the Launch PILLAR page —
 * §36 is titled "Launch Page" and every section of this block is titled
 * "Launchpad — …", so the naming decides it. The client has confirmed that
 * reading; see the long note on `ctas` in `content/pillars.ts`.
 *
 * ## The waitlist form does not submit
 *
 * The client owns the backend. §68 asks for server-side validation, spam
 * protection and success/error states, and none of those can be built without
 * knowing where the data goes. `WAITLIST_SUCCESS` is §44's success message, kept
 * here so the string is ready — it is NOT rendered, because a success state on a
 * form that cannot succeed is a lie the visitor has no way to detect.
 * `components/forms/WaitlistForm.tsx` says so on the page.
 *
 * The file's only import is the `FormField` TYPE, erased at build.
 */

import type { FormField } from '@/types/forms';

/** §41 Heading and Description. */
export const LAUNCHPAD = {
  heading: 'Build the next big business with QAVYX.',
  /** §2 and §63 name the product this way; the page's `<title>` uses it. */
  productName: 'Digital Growth Launchpad',
  /** §41's own status, the same string the site index carries. */
  status: 'Coming Soon',
  description: [
    'Have a startup idea?',
    'Join the Digital Growth Launchpad and build your startup.',
    "We're building a platform where entrepreneurs can submit their startup ideas, connect with our team, and receive end-to-end support — from branding and development to marketing and growth.",
    'As Launchpad evolves, selected startups may also gain access to mentorship and funding opportunities through our network.',
  ],
} as const;

/**
 * §42 What's Coming — six features.
 *
 * The asterisk on the last one is the document's, and its footnote is
 * `WHATS_COMING_NOTE`. It is rendered as a real footnote rather than as part of
 * the label: "Investor & Seed Funding Opportunities*" printed with a dangling
 * asterisk and no note is a typo, and the note is a material qualification on
 * the most attractive item in the list.
 */
export const WHATS_COMING = {
  heading: "What's Coming",
  items: [
    { label: 'Submit Your Startup Idea', footnoted: false },
    { label: 'Founder Dashboard', footnoted: false },
    { label: 'Build with the QAVYX Team', footnoted: false },
    { label: 'Branding & Product Development', footnoted: false },
    { label: 'Marketing & Growth Support', footnoted: false },
    { label: 'Investor & Seed Funding Opportunities', footnoted: true },
  ],
  note: 'Available for selected startups.',
} as const;

/** §43 Early Access. The CTA is one of §65's six secondaries. */
export const EARLY_ACCESS = {
  heading: 'Early Access',
  copy: [
    'The first 100 startups will receive priority onboarding and exclusive early support when Launchpad goes live.',
    'Join the waitlist today and be the first to experience Digital Growth Launchpad.',
  ],
  cta: 'Join the Waitlist',
} as const;

/**
 * §44's five fields, in the document's order, cross-checked against §68's
 * collection list — the two agree exactly.
 *
 * Three required and two optional, as §44 marks them. The optional pair is why
 * the form renders an explicit "Optional" marker rather than only starring the
 * required ones: a form where two of five fields are optional needs to say which
 * two, and marking the majority is noisier than marking the minority.
 *
 * Shares `FormField` with the contact form — same shape, one renderer.
 */
export const WAITLIST_FIELDS: readonly FormField[] = [
  { id: 'full-name', label: 'Full Name', kind: 'text', required: true },
  { id: 'email', label: 'Email Address', kind: 'email', required: true },
  { id: 'whatsapp', label: 'WhatsApp Number', kind: 'tel', required: true },
  { id: 'startup-name', label: 'Startup Name', kind: 'text', required: false },
  { id: 'industry', label: 'Industry', kind: 'text', required: false },
] as const;

/** §44's Submit Button. */
export const WAITLIST_SUBMIT = 'Join the First 100 Founders';

/**
 * §44's Success Message. NOT RENDERED — see the module note.
 *
 * It stays here so that wiring the backend is a change in one component and no
 * copy has to be written; `tests/unit/launchpad-content.test.ts` and the e2e
 * spec both assert it never reaches the page while the form is UI-only.
 */
export const WAITLIST_SUCCESS = {
  heading: "🎉 You're on the list!",
  copy: [
    'Thanks for joining the Digital Growth Launchpad waitlist.',
    "We'll notify you as soon as Launchpad opens and share exclusive early-access updates.",
  ],
} as const;
