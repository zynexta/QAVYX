/**
 * `/faq` — §60, fourteen questions, verbatim.
 *
 * SOURCE: `docs/CONTENT-HANDOFF.md`, §60.
 * §2 and §64 give it the label "FAQ" and the route `/faq`.
 *
 * Same discipline as the other `content/` modules: this file imports nothing,
 * and every user-facing string on the page comes from here.
 *
 * ## The order is the client's and is not alphabetised or grouped
 *
 * §60 runs from "What does QAVYX do?" to "Why should I choose QAVYX?" — a
 * sequence that opens with the broadest question and closes on the ask, with the
 * pricing and getting-started questions near the end where a reader who has read
 * that far will be looking for them. Sorting or bucketing this list into
 * "Services / Pricing / Getting Started" would be an editorial decision the
 * client did not make.
 *
 * ## `id` is not content
 *
 * It is a stable slug for the DOM id, the `aria` wiring and the `#anchor` a
 * visitor can link to. It is derived by hand rather than generated at render, so
 * that rewording a question does not silently change a URL someone has shared.
 *
 * ## Two answers were checked against the rest of the site and left alone
 *
 * The industries answer names eight sectors and ends "and more", which matches
 * neither §10's seven nor §57's nine. The results answer gives "30 to 90 days",
 * which is the only number anywhere in the document that reads like a
 * performance claim — it is the client's own, about their own delivery, and §66
 * Rule 05 forbids inventing metrics rather than quoting the ones supplied.
 */

export interface FaqEntry {
  /** Stable anchor. Never regenerate from the question text. */
  id: string;
  question: string;
  answer: string;
}

export const FAQ_HEADING = 'FAQ';

/**
 * §60's own opening question doubles as the page's description in `lib/seo.ts` —
 * "What does QAVYX do?" answered in one sentence is exactly what a search result
 * needs, and it is the client's copy rather than a summary written here.
 */
export const FAQS = [
  {
    id: 'what-does-qavyx-do',
    question: 'What does QAVYX do?',
    answer:
      'QAVYX helps businesses grow through branding, digital marketing, social media, websites, AI automation, and business growth strategies — all under one roof.',
  },
  {
    id: 'how-is-qavyx-different',
    question: 'How is QAVYX different from other agencies?',
    answer:
      "We don't just run ads. We first understand your business, create a strategy, and then execute campaigns focused on real business growth.",
  },
  {
    id: 'do-i-need-all-services',
    question: 'Do I need all your services?',
    answer:
      'No. You can choose a single service or let us manage your complete digital growth.',
  },
  {
    id: 'do-you-work-with-startups',
    question: 'Do you work with startups?',
    answer:
      'Yes. We work with startups, small businesses, and established companies looking to grow their brand and customer base.',
  },
  {
    id: 'which-industries',
    question: 'Which industries do you work with?',
    answer:
      'We work with businesses across industries, including healthcare, real estate, education, retail, restaurants, hospitality, professional services, e-commerce, and more.',
  },
  {
    id: 'only-india',
    question: 'Do you only work in India?',
    answer:
      "No. We work with businesses across India and the GCC, and we're happy to support clients in other regions as well.",
  },
  {
    id: 'how-long-for-results',
    question: 'How long does it take to see results?',
    answer:
      'It depends on your business and goals. Many clients begin seeing measurable improvements within the first 30 to 90 days.',
  },
  {
    id: 'manage-everything',
    question: 'Can you manage everything for my business?',
    answer:
      'Yes. From branding and websites to social media, advertising, AI automation, and ongoing growth, our team can manage your complete digital presence.',
  },
  {
    id: 'ai-and-whatsapp',
    question: 'Do you offer AI and WhatsApp automation?',
    answer:
      'Yes. We help businesses automate customer support, lead generation, follow-ups, and marketing using AI, WhatsApp, email, and other business tools.',
  },
  {
    id: 'websites-and-landing-pages',
    question: 'Do you build websites and landing pages?',
    answer:
      'Yes. We design fast, modern, and mobile-friendly websites, landing pages, and e-commerce solutions that help convert visitors into customers.',
  },
  {
    id: 'how-much',
    question: 'How much do your services cost?',
    answer:
      'Our pricing depends on your business goals and the services you need. We offer flexible plans for startups, growing businesses, and established companies.',
  },
  {
    id: 'how-do-i-start',
    question: 'How do I get started?',
    answer:
      "Simply book a Free Strategy Session. We'll understand your business, discuss your goals, and recommend the best growth plan — no obligation.",
  },
  {
    id: 'start-with-one-service',
    question: 'Can I start with one service and expand later?',
    answer:
      'Absolutely. Many clients begin with one service, such as social media management or website development, and add more solutions as their business grows.',
  },
  {
    id: 'why-choose-qavyx',
    question: 'Why should I choose QAVYX?',
    answer:
      'Because you get one dedicated team that handles strategy, branding, marketing, websites, AI automation, and business growth — saving you time while keeping everything aligned toward your business goals.',
  },
  // `satisfies` rather than a type annotation: the annotation would widen this
  // to `readonly FaqEntry[]`, and under `noUncheckedIndexedAccess` the page
  // could then no longer take `FAQS[0]` — the client's first question, which is
  // this page's heading and its meta description — without a null check for an
  // element that is right there in the literal.
] as const satisfies readonly FaqEntry[];
