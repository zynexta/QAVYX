/**
 * The global shell's content — navigation, footer, contact and the WhatsApp
 * button.
 *
 * SOURCE: `docs/CONTENT-HANDOFF.md` — the
 * only content source this project reads.
 *
 * It replaced an earlier Word draft (`QAVYX_Website_Content_Draft.docx`), which
 * has been DELETED from the repo; it survives in git history at 0cc4656 if the
 * original transcription is ever needed. The handoff document is the same copy,
 * restructured, with the draft's transcription damage repaired at source — so
 * several fixes this file used to apply by hand are now simply what it says.
 *
 * Relevant sections: §2 Site Map, §61 Global WhatsApp Button, §63 Global Footer,
 * §64 Recommended URL Structure, §65 CTA System.
 *
 * Same discipline as `content/services.ts` and `content/launch.ts`: this file
 * imports nothing, and every user-facing string in the shell comes from here.
 * A component that hard-codes a nav label or a phone number has put a second
 * source of truth in the repo.
 *
 * Two deliberate departures from the document:
 *
 *   1. `© 2026` is rendered from the current year rather than frozen at the
 *      year the document was written.
 *   2. §62 specifies a global HEADER carrying the primary navigation. There is
 *      no header — the client directed that navigation live on the homepage
 *      instead (`components/home/SiteIndex.tsx`), with the footer carrying it
 *      everywhere else. That instruction post-dates the document.
 *
 * Nothing else is changed, added or reworded.
 */

export interface NavItem {
  /** Route. Phase 8D creates every one of these; today only `/` exists. */
  href: string;
  label: string;
}

/**
 * §2 Site Map → Primary Navigation. Ten items, in the document's order.
 *
 * This is the SPINE, not a menu and no longer the whole route table — §64 routes
 * sixteen pages and `ALL_ROUTES` at the bottom of this file is the complete
 * list. The site has no navbar — the header added later carries three controls
 * and no links, and this list reaches it only through the menu that button
 * opens. `SITE_INDEX` below is the homepage's navigation section and
 * `FOOTER_NAV` is the global one, and both are checked against this
 * list so a route cannot exist in one place and not the other. Keeping the
 * draft's own ten here, in the draft's own order, is what gives those checks
 * something true to compare against.
 *
 * `Launchpad` is deliberately absent: §2 omits it and §63 lists it in the FOOTER
 * nav only — it is a coming-soon product rather than a section of the site.
 *
 * NOTE the labels and the routes disagree on purpose. §2 names the pages "Our
 * Projects" and "Our Services"; §64 routes them at `/projects` and `/services`.
 * Both are the document's.
 */
export const PRIMARY_NAV: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/growth-marketing', label: 'Growth Marketing' },
  { href: '/social-content', label: 'Social & Content' },
  { href: '/ai-automation', label: 'AI & Automation' },
  { href: '/build-scale', label: 'Build & Scale' },
  { href: '/launch', label: 'Launch' },
  { href: '/who-we-are', label: 'Who We Are' },
  { href: '/projects', label: 'Our Projects' },
  { href: '/services', label: 'Our Services' },
  { href: '/faq', label: 'FAQ' },
] as const;

/**
 * The homepage's navigation section — the site index.
 *
 * THIS SITE HAS NO NAVBAR. Navigation is a section of the homepage, and the
 * homepage is the hub every other route is reached from; the footer carries the
 * same routes on the inner pages. The header's menu is a SHORTCUT to that and
 * never a replacement for it — it needs JavaScript to open, and the whole point
 * of the footer carrying eleven routes is that the site is navigable without. So this list is not a convenience copy of
 * `PRIMARY_NAV` — it is the primary navigation, and it is ordered and grouped
 * for reading rather than for a menu bar.
 *
 * Two tiers, and the split is real rather than visual: `pillars` are the five
 * things a client can buy, `pages` are the five that describe the company. The
 * draft's own homepage section makes exactly this distinction — "Five pillars.
 * One access point."
 *
 * `Home` is absent on purpose. An index on the homepage does not link to the
 * page it is printed on.
 *
 * Deliberately NO descriptions. The draft supplies a one-line hook per pillar
 * ("What's Inside QAVYX"), and it is tempting to put them here — but the
 * services carousel two screens above has already presented all five in depth,
 * and an index that re-pitches its destinations is a second pitch, not an index.
 * The names are the content.
 */
/**
 * The one navigation entry the document does not supply — added on the client's
 * direction in Phase 8D.
 *
 * §64 routes a contact page at `/who-we-are/contact` and §73 makes "start a
 * conversation" the site's primary conversion, but §2 and §63 both fold contact
 * into "Who We Are" and neither navigation links it directly. A conversion path
 * two clicks deep on every page except the homepage is a conversion path with a
 * step in it, so this earns a link from the footer and the site index.
 *
 * THE LABEL IS THE CLIENT'S, not "Contact". "Contact Us" is §51's own CTA and
 * one of §65's six secondaries, so nothing here is invented wording — and it
 * also keeps the nav item distinct from `FOOTER_COPY.contactHeading`, which
 * heads the footer column printing the email and the number three elements away.
 */
export const CONTACT_NAV: NavItem = {
  href: '/who-we-are/contact',
  label: 'Contact Us',
} as const;

export const SITE_INDEX = {
  /** The five service pillars, in the draft's order. */
  pillars: [
    { href: '/growth-marketing', label: 'Growth Marketing' },
    { href: '/social-content', label: 'Social & Content' },
    { href: '/ai-automation', label: 'AI & Automation' },
    { href: '/build-scale', label: 'Build & Scale' },
    { href: '/launch', label: 'Launch' },
  ],
  /**
   * Everything else, company-side. The document's four, then `CONTACT_NAV`.
   *
   * `/who-we-are/about` and `/who-we-are/team` are deliberately absent. About is
   * reached from the Who We Are hub, which is what a hub is for; Team is
   * unlinked entirely while its profiles are missing — see `TEAM` in
   * `content/company.ts`.
   */
  pages: [
    { href: '/who-we-are', label: 'Who We Are' },
    { href: '/projects', label: 'Our Projects' },
    { href: '/services', label: 'Our Services' },
    { href: '/faq', label: 'FAQ' },
    CONTACT_NAV,
  ],
  /**
   * Launchpad is separated from `pages` because it is not a page about the
   * company — it is an unreleased product. §41 titles its section "QAVYX
   * Launchpad — Coming Soon", and that status is the client's own, not a label
   * invented for the layout.
   *
   * The capital S is the document's. This read `Coming soon` for several
   * phases — a sentence-cased variant of a string the client writes in title
   * case — and `/launchpad` now prints the same status as an eyebrow above its
   * `<h1>`, so the two casings would have been visible on the same journey.
   */
  launchpad: { href: '/launchpad', label: 'Launchpad', status: 'Coming Soon' },
} as const;

/**
 * §63 Global Footer → Navigation. The primary ten plus `Launchpad`, which the
 * document places between `Our Services` and `FAQ` — then `CONTACT_NAV`, the one
 * addition, last so that §63's own order is unchanged above it.
 *
 * Derived from PRIMARY_NAV rather than retyped, so a route renamed in one place
 * cannot survive in the other. `tests/unit/site-content.test.ts` asserts the
 * relationship holds.
 */
export const FOOTER_NAV: readonly NavItem[] = [
  ...PRIMARY_NAV.slice(0, 9),
  { href: '/launchpad', label: 'Launchpad' },
  ...PRIMARY_NAV.slice(9),
  CONTACT_NAV,
] as const;

/**
 * The header menu's list — Home, Who We Are, Our Projects, the five service
 * pillars (Growth Marketing, Social & Content, AI & Automation, Build & Scale, Launch),
 * FAQ, and Contact Us.
 *
 * On the client's direction: "Our Services" single link is removed and replaced
 * with direct access to each of the 5 services.
 */
export const MENU_NAV: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/who-we-are', label: 'Who We Are' },
  { href: '/projects', label: 'Our Projects' },
  ...SITE_INDEX.pillars,
  { href: '/faq', label: 'FAQ' },
  CONTACT_NAV,
] as const;

/**
 * §65 CTA System → Primary CTA. One label, everywhere.
 *
 * §65's rule: "Avoid unnecessarily changing CTA wording between sections. The
 * primary conversion action should remain recognizable throughout the website."
 */
export const CTA_LABEL = 'Chat With Us';

/**
 * §65 CTA System → Secondary CTAs, verbatim. Nothing outside this list and
 * `CTA_LABEL` may be used as a call to action anywhere on the site.
 *
 * None of them is a "go to this pillar's page" link, which is what the five
 * carousel panels need — see the note on `cta` in `content/services.ts`.
 */
export const SECONDARY_CTAS: readonly string[] = [
  'Book a Free Consultation',
  'Book a Fundraising Consultation',
  'View Our Work',
  'Join the Waitlist',
  'Start With Us',
  'Contact Us',
] as const;

/**
 * §51 Contact and §63 Global Footer → Contact.
 *
 * `whatsappNumber` is digits only because that is what wa.me takes; `whatsapp`
 * is the human-readable form the draft prints. Deriving one from the other would
 * make the displayed number a formatting function rather than the client's copy.
 */
export const CONTACT = {
  whatsapp: '+91-9188743741',
  whatsappNumber: '919188743741',
  email: 'info@qavyx.com',
  locations: 'India · GCC (UAE)',
} as const;

/**
 * §61 Global WhatsApp Button.
 *
 * The pre-filled message is the client's, emoji included. It is
 * `encodeURIComponent`-ed at render, never here: a pre-encoded string in a
 * content file cannot be read or edited by the person who owns the copy.
 */
export const WHATSAPP = {
  /** §61 Tooltip is "Chat with Us"; §65 makes the primary CTA "Chat With Us"
   *  and rules against changing its wording between sections, so it is one. */
  label: CTA_LABEL,
  message: 'Hi QAVYX! I want to explore how you can grow my brand 🚀',
} as const;

export interface SocialLink {
  label: string;
  href: string;
}

/**
 * §63 Global Footer → Social. Two networks.
 *
 * §69 listed "Instagram URL" and "LinkedIn URL" among the missing assets
 * required before launch, so both started as the handle inferred from the
 * domain. They were here rather than omitted because a footer with no social
 * links is a content decision and this was a missing-asset problem.
 *
 * INSTAGRAM IS NOW CONFIRMED and it is NOT what was inferred: the account is
 * `qavyx_digital`, not `qavyx`, so the guess was a dead link for as long as it
 * stood. Supplied by the client on 2026-08-31.
 *
 * LINKEDIN IS STILL THE GUESS. It has not been confirmed, and the Instagram
 * correction is the reason to distrust it rather than to relax about it — the
 * same inference was wrong once already. Treat `linkedin.com/company/qavyx` as
 * an open item from §69, not as a working URL.
 */
export const SOCIAL: readonly SocialLink[] = [
  { label: 'Instagram', href: 'https://www.instagram.com/qavyx_digital/' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/qavyx' },
] as const;

/**
 * §63 Global Footer → Legal.
 *
 * These were rendered as plain text while the DOCX was the source: it named both
 * in the footer but contained no privacy or terms content and no route for
 * either, so linking them would have shipped two guaranteed 404s.
 *
 * The handoff document changes that. §2 lists both under Global Elements and §64
 * gives them routes, so they are planned pages like the other nine — unbuilt
 * until Phase 8D, and linked on the same terms as every other unbuilt route
 * rather than singled out. `href` stays nullable so a page can be un-linked
 * again if the client decides not to publish one.
 */
export interface LegalLink {
  label: string;
  href: string | null;
}

export const LEGAL_LINKS: readonly LegalLink[] = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
] as const;

/** Footer headings and the tagline. */
export const FOOTER_COPY = {
  /**
   * §63's footer headline, as §63 itself asks for it to be written.
   *
   * The document prints "Looking Growth. Connect QAVYX." and then, directly
   * underneath, its own note: 'The original copy says "Looking Growth."
   * Consider correcting this to a more natural phrase such as "Looking for
   * Growth? Connect with QAVYX." before final production.' §70 lists it again
   * under "Content Issues to Review Before Production".
   *
   * This shipped verbatim for several phases with a comment reading "its grammar
   * is the client's" — which was true of the sentence and wrong about the
   * document, because the client had already flagged it and supplied the
   * replacement. Taking the correction IS taking the client's copy; the string
   * below is theirs, word for word, from that note.
   */
  tagline: 'Looking for Growth? Connect with QAVYX.',
  navHeading: 'Navigation',
  contactHeading: 'Contact',
  socialHeading: 'Social',
  /** Everything after the year in the draft's legal line. */
  legalEntity: 'QAVYX Digital Marketing Services. All rights reserved.',
} as const;

/**
 * Every route the site has, for `app/sitemap.ts` — §74's "Sitemap added".
 *
 * §64's URL structure, in its order. It is spelled out here rather than derived
 * from `FOOTER_NAV` because the two answer different questions: the footer is
 * what a visitor is offered, and this is what exists. One route is in one and
 * not the other, and the difference is deliberate: `/who-we-are/contact` has an
 * entry of its own in both navigations, which is `CONTACT_NAV`'s whole argument
 * above.
 *
 * TWO OF §64's SIXTEEN ARE NO LONGER PAGES, and both were folded into their
 * parent on the client's direction — "Who We Are" in the menu leads straight to
 * the about content, and the team shows on that page rather than having one of
 * its own. So §46–§50 are all `/who-we-are`, and `/who-we-are/about` and
 * `/who-we-are/team` are permanent redirects in `next.config.ts`.
 *
 * They are absent here rather than flagged `indexed: false`, because that flag
 * means "a page we are choosing not to submit" and neither is a page any more.
 *
 * ## `indexed` IS NOW A MECHANISM WITH NOTHING USING IT, and it stays
 *
 * `/who-we-are/team` was the one route that used it: built, unlinked and missing
 * its profile grid, because submitting a heading and one sentence to a search
 * engine as a page about a team it does not name asks for it to be indexed in
 * exactly the state it should not be seen in. Merging that content into a page
 * that has already earned the claim is what dissolved the problem rather than
 * solving it — there is no page left to hold back.
 *
 * The field is kept because the decision it encodes is one the client can make
 * again about any route, and because `pageMetadata` in `lib/seo.ts` and
 * `app/sitemap.ts` are both written against it. A flag with no current user is
 * cheaper than the day someone needs it and re-derives it in two files.
 */
export interface SiteRoute {
  path: string;
  indexed: boolean;
}

export const ALL_ROUTES: readonly SiteRoute[] = [
  { path: '/', indexed: true },
  { path: '/growth-marketing', indexed: true },
  { path: '/social-content', indexed: true },
  { path: '/ai-automation', indexed: true },
  { path: '/build-scale', indexed: true },
  { path: '/launch', indexed: true },
  { path: '/who-we-are', indexed: true },
  { path: '/who-we-are/contact', indexed: true },
  { path: '/projects', indexed: true },
  { path: '/services', indexed: true },
  { path: '/faq', indexed: true },
  { path: '/launchpad', indexed: true },
  { path: '/privacy-policy', indexed: true },
  { path: '/terms-of-service', indexed: true },
] as const;

/** The organisation, for the footer and for Phase 8D's JSON-LD. */
export const ORGANISATION = {
  name: 'QAVYX',
  /** The draft's cover line: `qavyx.com · India & GCC( UAE) · info@qavyx.com`. */
  regions: 'India & GCC (UAE)',
} as const;
