/**
 * The services content contract for Engine 3.
 *
 * SOURCE: `docs/CONTENT-HANDOFF.md` —
 * §8 What's Inside QAVYX for the pillars, §12–§40 for their sub-services,
 * §64 for the routes, §65 for the CTA system.
 *
 * THIS REPLACES THREE EARLIER SOURCES.
 *
 * 1. TDD §3.9's five services (Product Engineering, Platform & Cloud, Product
 *    Design, AI Integration, Team Augmentation) described a software
 *    consultancy. Qavyx is a digital marketing and AI automation agency.
 * 2. The "17 Specialized Service Areas" scraped from the live site.
 * 3. An earlier Word draft, now deleted from the repo (git history, 0cc4656).
 *
 * The handoff document names its own sub-services page by page, calls pillar
 * four **Build & Scale**, and contains no Web3 anywhere — so `Build & Web3` and
 * the area "Web3 Marketing & Community Growth" are both gone.
 *
 * Every string below is the document's. The panel DESCRIPTIONS are §8, which
 * exists precisely for this job — its Development Note reads: "Each pillar card
 * should link to its dedicated page. Keep homepage pillar copy short and
 * curiosity-driven. Detailed service information belongs on the individual
 * pages." The panel AREAS are the named sub-services of each pillar's own page.
 *
 * The FIVE pillars remain five, and that is load-bearing rather than
 * presentational. Twenty-four panels would need either a pin twenty screens long
 * or steps too fast to read; five themed panels carry every one of the
 * twenty-four as real, readable content in the space of four steps.
 *
 * `tests/unit/services.test.ts` asserts all twenty-four are present exactly
 * once, so a future edit cannot quietly drop one.
 *
 * ## THIS IS NOT THE CAROUSEL'S PANEL LIST — see `content/carousel.ts`
 *
 * It was, and `PANEL_COUNT` used to live at the bottom of this file. The slider
 * now carries a sixth panel for Digital Growth Launchpad (§41–§43, the product
 * the document calls "QAVYX Launchpad" — renamed on the client's direction, see
 * `content/launchpad.ts`), and Launchpad is deliberately NOT a pillar:
 * `content/site.ts` keeps
 * it out of `SITE_INDEX.pillars` because "§2 omits it and §63 lists it in the
 * FOOTER nav only — it is a coming-soon product rather than a section of the
 * site".
 *
 * So this file is the five things a client can buy, and it feeds four surfaces
 * that must never gain a Launchpad row: `SITE_INDEX.pillars`, `ServiceList`'s
 * stacked reduced-motion list, `PILLAR_PAGES`, and `SERVICE_AREAS`'s
 * exactly-once cover of the twenty-four. `content/carousel.ts` is this list plus
 * one, and it is what the motion layer counts.
 */

export interface ServiceCategory {
  /** Stable id — used for the CTA href and as the React key. */
  slug: string;
  /** Panel title, 48px display. */
  title: string;
  /** Panel body, 20px, max 42ch. */
  description: string;
  /** What this pillar's own page covers, in the document's order. */
  services: readonly string[];
  /**
   * Where the card goes. NO per-panel label: §65 rules that CTA wording must not
   * change between sections, and this file used to carry five variants ("See
   * growth work", "See social work", …) invented before that rule existed.
   *
   * The document does not name a label for this link. Its primary CTA is "Chat
   * With Us" (a conversion action, not navigation) and none of its six secondary
   * CTAs is a "go to this pillar's page" link. So one shared label lives in
   * `PILLAR_CTA_LABEL` below, and it is the one string here still awaiting the
   * client's word.
   */
  cta: { href: string };
}

/**
 * The label on all five pillar cards.
 *
 * NOT from the document — see the note on `cta` above. It is deliberately one
 * string rather than five so §65's consistency rule holds, and deliberately
 * neutral so it reads as navigation rather than as a second conversion ask
 * competing with "Chat With Us". Each link's accessible name appends the pillar,
 * so a screen reader hears "Explore Growth Marketing", not five bare "Explore"s.
 *
 * FLAGGED FOR THE CLIENT: this is the only user-facing string in `content/` that
 * the handoff document does not supply.
 */
export const PILLAR_CTA_LABEL = 'Explore';

export const SERVICES: readonly ServiceCategory[] = [
  {
    slug: 'growth-marketing',
    title: 'Growth Marketing',
    description:
      'We create the right strategy to help your business grow and reach more customers.',
    /**
     * The draft's Growth Marketing page is the only one of the five that is a
     * PROCESS rather than a menu: five numbered steps, diagnosis through to
     * measurement. These are those steps, in order, which is why "Weak System
     * Found" reads as it does — it is step two of an audit, and the page's own
     * line for it is "Every brand is leaking growth somewhere. We find exactly
     * where." Left verbatim; it is the client's phrasing, not a typo, and §70's
     * review of this very page passes over it while correcting three of its
     * neighbours.
     *
     * STEP FOUR IS §70's NAME FOR IT, NOT §16's. §16 heads the step "Active &
     * Process"; §70 — "Content Issues to Review Before Production" — asks for
     * **Execution & Optimization**. Both are the client's, and §70 is the later,
     * reviewing voice, so the site takes the correction. §16's own heading is
     * therefore the one string in the document that `content/` deliberately does
     * not match, and this is the note saying so.
     *
     * Two of §70's other items on this page ask to "clarify exact intended
     * meaning" ("Team & Management Behaviour") and "clarify what package
     * implementation means" ("Package Implementation") without supplying a
     * replacement. Those stay verbatim — a rewrite invented to satisfy a request
     * for clarification is exactly the invention the request exists to prevent.
     */
    services: [
      'Brand Analysis',
      'Weak System Found',
      'Planning & Execution',
      'Execution & Optimization',
      'Growth & Success',
    ],
    cta: { href: '/growth-marketing' },
  },
  {
    slug: 'social-content',
    title: 'Social & Content',
    description: 'Creative posts, reels, and content that grab attention and build your brand.',
    services: [
      'Social Media Growth & Management',
      'Short-Form Video & Reels',
      'Content Production',
      'Performance Marketing Across Social',
      'Retargeting Systems',
    ],
    cta: { href: '/social-content' },
  },
  {
    slug: 'ai-automation',
    title: 'AI & Automation',
    description: 'Automate customer replies, lead follow-ups, and daily tasks to save time.',
    services: [
      'AI Content Creation',
      'AI Videos & Avatars',
      'WhatsApp & Email Automation',
      'AI-Powered Marketing',
      'AI Tools & Business Automation',
    ],
    cta: { href: '/ai-automation' },
  },
  {
    slug: 'build-scale',
    title: 'Build & Scale',
    description:
      'Websites, landing pages, and systems that turn visitors into paying customers.',
    services: [
      'Website Development',
      'Conversion Optimization',
      'CRM & Automation Systems',
      'Sales Funnels & Retargeting',
      'Business Growth Systems',
    ],
    cta: { href: '/build-scale' },
  },
  {
    slug: 'launch',
    title: 'Launch',
    description:
      'From idea to launch — we help startups and businesses go live with confidence.',
    services: [
      'Startup Launch',
      'Personal Branding',
      'Brand Identity',
      'Go-to-Market Strategy',
    ],
    cta: { href: '/launch' },
  },
] as const;

/**
 * The twenty-four, flat and verbatim, exactly as the draft's five service pages
 * name them. This is the source of truth the grouping above is checked against —
 * not a derived convenience export.
 */
export const SERVICE_AREAS: readonly string[] = [
  // 02 · Growth Marketing — the five steps. Step four is §70's name, not §16's.
  'Brand Analysis',
  'Weak System Found',
  'Planning & Execution',
  'Execution & Optimization',
  'Growth & Success',
  // 03 · Social & Content
  'Social Media Growth & Management',
  'Short-Form Video & Reels',
  'Content Production',
  'Performance Marketing Across Social',
  'Retargeting Systems',
  // 04 · AI & Automation
  'AI Content Creation',
  'AI Videos & Avatars',
  'WhatsApp & Email Automation',
  'AI-Powered Marketing',
  'AI Tools & Business Automation',
  // 05 · Build & Scale
  'Website Development',
  'Conversion Optimization',
  'CRM & Automation Systems',
  'Sales Funnels & Retargeting',
  'Business Growth Systems',
  // 06 · Launch
  'Startup Launch',
  'Personal Branding',
  'Brand Identity',
  'Go-to-Market Strategy',
] as const;

/**
 * Pillar count — the five things a client can buy.
 *
 * NOT the carousel's panel count. That is `PANEL_COUNT` in `content/carousel.ts`
 * and it is six; every piece of step arithmetic reads it rather than this. The
 * two were the same export until the Launchpad panel was added, which is exactly
 * why the carousel's number moved out — see this file's header.
 */
export const PILLAR_COUNT = SERVICES.length;
