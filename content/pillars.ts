/**
 * The five pillar pages.
 *
 * SOURCE: `docs/CONTENT-HANDOFF.md` —
 * §12–§17 Growth Marketing, §18–§23 Social & Content, §24–§29 AI & Automation,
 * §30–§35 Build & Scale, §36–§40 Launch, §45 the Launch page's final CTA. §64
 * for the routes, §65 for the CTAs, §66 for the section hierarchy every page
 * below follows — and §70, which is the document reviewing itself and wins
 * wherever it supplies a replacement (one string: Growth Marketing's step four).
 *
 * Same discipline as `content/services.ts`, `content/site.ts` and
 * `content/launch.ts`: this file imports nothing, and every user-facing string on
 * the five pillar pages comes from here. It is written out rather than derived so
 * that it reads as the document does; the relationships that matter are locked by
 * `tests/unit/pillar-content.test.ts` instead:
 *
 *   - every `slug` is a `SERVICES` slug, and the two lists are in the same order;
 *   - every section `name` is that pillar's sub-service in `SERVICES`, in order,
 *     so the carousel and the page it links to can never name different things;
 *   - every CTA label is `CTA_LABEL` or one of `SECONDARY_CTAS` from
 *     `content/site.ts` — §65 forbids inventing a sixth.
 *
 * THE DOCUMENT'S OWN SHAPE, KEPT RATHER THAN NORMALISED. Three irregularities
 * below look like transcription damage and are not:
 *
 * 1. **Growth Marketing is a process, the other four are menus.** §13–§17 are
 *    "Step 01".."Step 05" — a diagnosis that runs in order. Nothing else in the
 *    document is numbered, so `ordered` is true for that page alone and the
 *    component renders it as an `<ol>`. Re-ordering those five would be a content
 *    change, not a layout one.
 *
 * 2. **The list labels vary and carry meaning.** "Deliverables" is what a client
 *    receives, "Analysis Areas" is what gets examined, "Services" is what we do,
 *    "Platforms" is where the money goes. Flattening all four to "Services" —
 *    which the shape of the data invites — would lose the distinction the client
 *    drew. §22 is the proof it is deliberate: it carries BOTH a Platforms list
 *    and a Services list, and the Services list has exactly one item.
 *
 * 3. **Social & Content has no supporting lines anywhere.** §19–§23 are a name
 *    and a paragraph; the "Supporting Line" of §13 and the "Heading" of §25 have
 *    no counterpart on that page. It is the only one of the five written that
 *    way, and §19 goes further still — it is the only section in the document
 *    with neither a supporting line nor a list, just one sentence. Left as it is:
 *    a headline invented to square the grid is invented copy.
 *
 * ONE THING IS NOT THE DOCUMENT'S, and it is flagged rather than hidden — see
 * `PENDING_CALENDLY` and the `cta` note below.
 */

/**
 * A labelled list inside a section.
 *
 * `label` is the document's own subheading and is rendered. It is content, not a
 * schema key: see irregularity 2 above.
 */
export interface PillarList {
  label: string;
  items: readonly string[];
}

/**
 * The reason a CTA the document specifies cannot be rendered as a link.
 *
 * §17 and §40 both end "**External Link:** Calendly link to be provided." No URL
 * was ever supplied — §69 lists it among the assets still required before launch.
 *
 * A `pending` CTA is NOT RENDERED. The alternatives were a dead `href="#"`, which
 * is a broken link, and a disabled button, which reads to a visitor as a bug
 * rather than as an unfinished handover. It stays in the data so the slot exists,
 * the component already handles it, and supplying the URL is a one-line change
 * from `kind: 'pending'` to `kind: 'external'`.
 */
export const PENDING_CALENDLY = 'Calendly URL not supplied — see §69, missing assets.';

/**
 * Where a call to action goes.
 *
 * `chat` is §65's primary conversion action and resolves to the same WhatsApp
 * deep link as every other "Chat With Us" on the site — the button is never given
 * an href here, because `content/` does not know how `WhatsAppLink` builds one.
 */
export type PillarCta =
  | { kind: 'chat'; label: string }
  | { kind: 'route'; label: string; href: string }
  | { kind: 'pending'; label: string; missingAsset: string };

/**
 * A section's URL fragment, derived from its own name.
 *
 * THE CAROUSEL'S CHIPS LINK HERE. Every chip on a pillar's carousel panel is one
 * of that pillar page's section names — `tests/unit/pillar-content.test.ts` locks
 * the two lists to be identical, in order, spelled the same — so a chip can
 * address its section without either file learning about the other's shape. It
 * needs one shared function, and this is it.
 *
 * Derived from the NAME rather than the index on purpose. `#website-development`
 * survives a section being reordered and is legible in a shared URL; `#s3` is
 * neither. The 24 service areas are unique across all five pages (asserted), so
 * a name can never collide with another on its own page.
 *
 * `[^a-z0-9]+` collapses spaces, ampersands and hyphens alike, so
 * "CRM & Automation Systems" and "Short-Form Video & Reels" both come out clean.
 * `tests/unit/pillar-content.test.ts` asserts the whole set is unique and
 * non-empty, which is what stops a future section name reducing to "".
 */
export function sectionAnchor(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface PillarSection {
  /** The sub-service, verbatim. Locked against `SERVICES[].services` by test. */
  name: string;
  /**
   * §13's "Supporting Line" and §25's "Heading" are the same slot under two
   * names — a short line in the client's voice above the explanation. Absent on
   * §19 alone.
   */
  headline?: string;
  description: string;
  lists: readonly PillarList[];
}

export interface PillarPage {
  /** Matches the `SERVICES` slug and therefore the route. */
  slug: string;
  /** The pillar, as §2 and §8 name it. Used as the eyebrow and in `<title>`. */
  label: string;
  /** §12's "Page Title" — the client's headline for the page, rendered as `<h1>`. */
  pageTitle: string;
  /** The paragraphs under the title, in order. */
  intro: readonly string[];
  /** True only for Growth Marketing — see irregularity 1 above. */
  ordered: boolean;
  sections: readonly PillarSection[];
  /**
   * The page's calls to action, in the document's order.
   *
   * §17 and §23 give a CTA and a Secondary CTA; §29 and §35 give a CTA alone;
   * §40 gives the fundraising booking, and §45 — "Launch Page Final CTA" — gives
   * that page a second one, `Start With Us`.
   *
   * NOTHING HERE IS ADDED. An earlier cut of this file put `Chat With Us` on the
   * Launch page, reasoning that §40's booking has no URL and §65 makes the
   * primary action site-wide, so the page would otherwise have no working way to
   * make contact. That was inventing an answer the document already gives four
   * sections later. §45 is easy to miss because it sits AFTER the four Launchpad
   * sections rather than after §40 — but it is titled "Launch Page Final CTA" and
   * §36 is titled "Launch Page", while every Launchpad section is titled
   * "Launchpad — …". The naming decides it.
   *
   * CONFIRMED BY THE CLIENT: §45 belongs here, on the Launch pillar page. The
   * alternative was `/launchpad` (Phase 8D's later chunk), which would have left
   * this page with no working CTA until the Calendly URL lands. The reading the
   * paragraph above describes was the right one.
   */
  ctas: readonly PillarCta[];
}

const CHAT: PillarCta = { kind: 'chat', label: 'Chat With Us' };

export const PILLAR_PAGES: readonly PillarPage[] = [
  /* ------------------------------------------------------------------ §12–§17 */
  {
    slug: 'growth-marketing',
    label: 'Growth Marketing',
    pageTitle: 'The Engine Room of Every QAVYX Campaign.',
    intro: [
      'Every successful campaign starts with the right strategy.',
      "At QAVYX, we don't jump straight into ads. We first understand your business, identify opportunities, and build a clear growth plan before execution.",
    ],
    ordered: true,
    sections: [
      {
        name: 'Brand Analysis',
        headline: 'Understand where your business stands.',
        description:
          'We analyze your brand, competitors, target audience, and online presence to identify opportunities for growth.',
        lists: [
          {
            label: 'Deliverables',
            items: [
              'Brand Audit',
              'Competitor Analysis',
              'Target Audience Research',
              'Digital Presence Review',
            ],
          },
        ],
      },
      {
        name: 'Weak System Found',
        headline: 'Every brand is leaking growth somewhere. We find exactly where.',
        description:
          'We identify weak areas in your marketing, customer journey, and messaging that may be limiting your results.',
        lists: [
          {
            label: 'Analysis Areas',
            items: [
              'Marketing Funnel Review',
              'Website & Conversion Analysis',
              'Messaging Review',
              'Performance Audit',
              'Team & Management Behaviour',
              'Customer Feedback',
              'Brand Identity',
              'Financial Management & Expenses',
              'Founder Thought Process & Analysis',
            ],
          },
        ],
      },
      {
        name: 'Planning & Execution',
        headline: 'A strategy is only as good as the plan behind it.',
        description:
          'We translate the diagnosis into a working roadmap — channels, budgets, timelines, and creative direction — mapped to the way your business actually makes money.',
        lists: [
          {
            label: 'Deliverables',
            items: [
              'Marketing Strategy',
              'Budget Planning',
              'Content Plan',
              'Campaign Roadmap',
            ],
          },
        ],
      },
      {
        // §16 heads this step "Active & Process"; §70 asks for "Execution &
        // Optimization" and the site takes the correction. See the long note in
        // `content/services.ts`, which owns the same five names.
        name: 'Execution & Optimization',
        headline: 'Strategy on paper is worthless. We put it to work, every single day.',
        description:
          'Our team launches, manages, and continuously improves your campaigns for better performance.',
        lists: [
          {
            label: 'Services',
            items: [
              'Campaign Management',
              'Social Media Marketing',
              'Paid Advertising',
              'Continuous Optimization',
              'Package Implementation',
            ],
          },
        ],
      },
      {
        name: 'Growth & Success',
        headline: "If it can't be measured, it isn't marketing.",
        description:
          "We close the loop with transparent reporting and a growth trajectory you can actually see — then we scale what's working and cut what isn't.",
        lists: [
          {
            label: 'Deliverables',
            items: [
              'Performance Reports',
              'ROI Tracking',
              'Growth Insights',
              'Scaling Strategy',
            ],
          },
        ],
      },
    ],
    ctas: [
      CHAT,
      {
        kind: 'pending',
        label: 'Book a Free Consultation',
        missingAsset: PENDING_CALENDLY,
      },
    ],
  },

  /* ------------------------------------------------------------------ §18–§23 */
  {
    slug: 'social-content',
    label: 'Social & Content',
    pageTitle: 'Where Scrolling Stops.',
    intro: [
      'Attention is the most expensive currency online.',
      'We make sure yours gets spent on you.',
      'We help your brand stand out with engaging content, consistent posting, and campaigns that turn attention into customers.',
    ],
    ordered: false,
    sections: [
      {
        // No section on this page has a supporting line, and this one has no
        // list either — one sentence is all §19 is. See irregularity 3 above.
        name: 'Social Media Growth & Management',
        description:
          'We manage your social media with strategic content, regular posting, and audience engagement.',
        lists: [],
      },
      {
        name: 'Short-Form Video & Reels',
        description:
          'From ideas to editing, we produce engaging short-form videos designed for Instagram, Facebook, and YouTube.',
        lists: [
          {
            label: 'Services',
            items: ['Reel Strategy', 'Script Writing', 'Video Editing', 'Trend-Based Content'],
          },
        ],
      },
      {
        name: 'Content Production',
        description:
          'We create high-quality visuals that showcase your products, services, and story.',
        lists: [
          {
            label: 'Services',
            items: [
              'Product Photography',
              'Brand Videos',
              'Creative Designs',
              'Promotional Content',
            ],
          },
        ],
      },
      {
        name: 'Performance Marketing Across Social',
        description:
          'We create and manage advertising campaigns that focus on real business growth.',
        // Two lists, and the second has one item. Both are the document's.
        lists: [
          {
            label: 'Platforms',
            items: [
              'Meta Ads (Facebook & Instagram)',
              'Google Ads',
              'LinkedIn Ads',
              'X Ads',
              'Telegram Ads',
            ],
          },
          { label: 'Services', items: ['Campaign Optimization'] },
        ],
      },
      {
        name: 'Retargeting Systems',
        description:
          'Bring back visitors who showed interest and encourage them to take action.',
        lists: [
          {
            label: 'Services',
            items: [
              'Website Retargeting',
              'Lead Nurturing',
              'Audience Segmentation',
              'Conversion Optimization',
            ],
          },
        ],
      },
    ],
    // §23's secondary names its destination outright: "Destination: Our Projects".
    ctas: [CHAT, { kind: 'route', label: 'View Our Work', href: '/projects' }],
  },

  /* ------------------------------------------------------------------ §24–§29 */
  {
    slug: 'ai-automation',
    label: 'AI & Automation',
    pageTitle: 'Smarter marketing. Less manual work.',
    intro: [
      'Use AI and automation to save time, improve customer experience, and help your business grow faster.',
    ],
    ordered: false,
    sections: [
      {
        name: 'AI Content Creation',
        headline: 'Create more content in less time.',
        description:
          'We use AI to help produce high-quality social media posts, marketing copy, blogs, and creative content while keeping your brand voice consistent.',
        lists: [
          {
            label: 'Services',
            items: [
              'Social Media Content',
              'Marketing Copy',
              'Blog Writing',
              'Creative Content',
            ],
          },
        ],
      },
      {
        name: 'AI Videos & Avatars',
        headline: 'Professional videos without the traditional production costs.',
        description:
          'Create engaging videos using AI presenters, voiceovers, and branded avatars for marketing and education.',
        lists: [
          {
            label: 'Services',
            items: ['AI Avatars', 'AI Voiceovers', 'Promotional Videos', 'Product Explainers'],
          },
        ],
      },
      {
        name: 'WhatsApp & Email Automation',
        headline: 'Stay connected with customers automatically.',
        description:
          'Automate replies, follow-ups, lead nurturing, and customer support while maintaining a personal experience.',
        lists: [
          {
            label: 'Services',
            items: [
              'WhatsApp Automation',
              'Email Automation',
              'Lead Follow-ups',
              'Customer Support',
            ],
          },
        ],
      },
      {
        name: 'AI-Powered Marketing',
        headline: 'Make smarter marketing decisions.',
        description:
          'Use AI to improve campaign performance, analyze customer behavior, and optimize your marketing efforts.',
        lists: [
          {
            label: 'Services',
            items: [
              'Campaign Optimization',
              'Audience Insights',
              'Performance Analysis',
              'AI Recommendations',
            ],
          },
        ],
      },
      {
        name: 'AI Tools & Business Automation',
        headline: 'Work smarter every day.',
        description:
          'We integrate AI tools into your daily workflow to improve productivity and reduce repetitive tasks.',
        lists: [
          {
            label: 'Services',
            items: [
              'Workflow Automation',
              'CRM Integration',
              'Business Process Automation',
              'AI Tool Setup',
            ],
          },
        ],
      },
    ],
    ctas: [CHAT],
  },

  /* ------------------------------------------------------------------ §30–§35 */
  {
    slug: 'build-scale',
    label: 'Build & Scale',
    // §30's Page Title is the pillar's own name. The component drops the eyebrow
    // when the two match rather than printing "Build & Scale" twice.
    pageTitle: 'Build & Scale',
    intro: [
      'We create the digital systems and tools that help your business attract customers, improve conversions, and scale efficiently.',
    ],
    ordered: false,
    sections: [
      {
        name: 'Website Development',
        headline: 'Your website is your digital storefront.',
        description:
          'We design fast, modern, and mobile-friendly websites that build trust and generate leads.',
        lists: [
          {
            label: 'Services',
            items: [
              'Business Websites',
              'Landing Pages',
              'E-commerce Stores',
              'Website Maintenance',
            ],
          },
        ],
      },
      {
        name: 'Conversion Optimization',
        headline: 'Turn more visitors into customers.',
        description:
          'We improve your website and sales funnel to increase leads, enquiries, and conversions.',
        lists: [
          {
            label: 'Services',
            items: [
              'Landing Page Optimization',
              'User Experience Improvements',
              'Conversion Tracking',
              'Performance Testing',
            ],
          },
        ],
      },
      {
        name: 'CRM & Automation Systems',
        headline: 'Manage leads more efficiently.',
        description:
          'Organize customer data, automate follow-ups, and never miss a potential customer.',
        lists: [
          {
            label: 'Services',
            items: [
              'CRM Setup',
              'Lead Management',
              'Sales Automation',
              'Customer Journey Tracking',
            ],
          },
        ],
      },
      {
        name: 'Sales Funnels & Retargeting',
        headline: 'Guide customers from interest to purchase.',
        description:
          "Create marketing funnels that nurture leads and bring back visitors who didn't convert the first time.",
        lists: [
          {
            label: 'Services',
            items: [
              'Sales Funnels',
              'WhatsApp & Email Funnels',
              'Retargeting Campaigns',
              'Customer Journey Optimization',
            ],
          },
        ],
      },
      {
        name: 'Business Growth Systems',
        headline: 'Build systems that grow with your business.',
        description:
          'We create scalable digital processes that improve efficiency and support long-term business growth.',
        lists: [
          {
            label: 'Services',
            items: [
              'Workflow Automation',
              'Performance Dashboards',
              'Process Optimization',
              'Growth Strategy',
            ],
          },
        ],
      },
    ],
    ctas: [CHAT],
  },

  /* ------------------------------------------------------------------ §36–§40 */
  {
    slug: 'launch',
    label: 'Launch',
    pageTitle: 'Turn your business idea into a successful brand.',
    intro: [
      'Starting a business is easier with the right partner.',
      'We help you build your brand, launch online, and reach your first customers.',
    ],
    ordered: false,
    sections: [
      {
        name: 'Startup Launch',
        headline: 'Everything you need to get started.',
        description:
          'From branding to your online presence, we help you launch your business with confidence.',
        lists: [
          {
            label: 'Services',
            items: [
              'Business Setup Guidance',
              'Registration & Legal',
              'Grant & Fundraising Support',
              'Brand Strategy',
              'Website Launch',
              'Marketing Plan',
            ],
          },
        ],
      },
      {
        name: 'Personal Branding',
        headline: 'Build trust through your personal brand.',
        description:
          'Grow your presence as a founder, entrepreneur, or industry expert with professional content and positioning.',
        lists: [
          {
            label: 'Services',
            items: [
              'LinkedIn Branding',
              'Social Media Presence',
              'Content Strategy',
              'Personal Website',
            ],
          },
        ],
      },
      {
        name: 'Brand Identity',
        headline: 'Create a brand people remember.',
        description:
          'Build a professional identity that reflects your business and connects with your audience.',
        lists: [
          {
            label: 'Services',
            items: [
              'Logo Design',
              'Brand Guidelines',
              'Brand Messaging',
              'Marketing Materials',
            ],
          },
        ],
      },
      {
        name: 'Go-to-Market Strategy',
        headline: 'Launch with a clear plan.',
        description:
          'We create a launch roadmap that helps you attract customers and grow from day one.',
        lists: [
          {
            label: 'Services',
            items: [
              'Launch Planning',
              'Marketing Campaigns',
              'Customer Acquisition',
              'First 90-Day Growth Plan',
            ],
          },
        ],
      },
    ],
    /**
     * §40's CTA, then §45's. `Start With Us` is one of §65's six secondaries and
     * §45 gives it no destination — the document names one when it has one
     * ("Destination: Our Projects" on §23, "External Link: Calendly" here and on
     * §17). §73 settles it: the site's conversion is "Start a conversation with
     * QAVYX", and WhatsApp is that conversation. It joins the footer, the
     * homepage's closing ask and the floating button in going to the same chat.
     */
    ctas: [
      {
        kind: 'pending',
        label: 'Book a Fundraising Consultation',
        missingAsset: PENDING_CALENDLY,
      },
      { kind: 'chat', label: 'Start With Us' },
    ],
  },
] as const;

/**
 * Lookup by slug, for the five route files.
 *
 * It throws rather than returning `undefined`. The only caller is a route file
 * naming its own slug as a literal, so a miss means a route and its content have
 * been renamed apart — and failing the build with the bad slug in the message is
 * strictly better than rendering a page with no content in it.
 */
export function pillarBySlug(slug: string): PillarPage {
  const page = PILLAR_PAGES.find((candidate) => candidate.slug === slug);
  if (!page) throw new Error(`No pillar page for slug "${slug}"`);
  return page;
}
