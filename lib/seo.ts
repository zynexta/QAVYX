import type { Metadata } from 'next';
import { CONTACT, ORGANISATION } from '@/content/site';
import type { PillarPage } from '@/content/pillars';

/**
 * A page's own address: where it lives and what it is called.
 *
 * It was `Crumb`, and it lived in `components/inner/InnerPage.tsx` because that
 * component rendered a breadcrumb out of an array of them. The breadcrumb is
 * gone on the client's direction, and with it the array — every caller now
 * passes ONE of these, describing the page itself. The name changed with the
 * job: a "crumb" is a step in a trail and there is no trail any more.
 */
export interface PageNode {
  href: string;
  label: string;
}

/**
 * Metadata and structured data.
 *
 * Phase 8D's acceptance criteria: every route has its OWN metadata, OG and
 * JSON-LD, and no document metadata reaches the page. That last one is a real
 * hazard rather than a formality — `docs/CONTENT-HANDOFF.md`
 * opens with a cover block ("Website Content & Development Handoff", "Document
 * Purpose: Complete website content structure for design and development
 * handoff") which describes the DOCUMENT, not the company, and reads exactly like
 * boilerplate site copy. §1 makes the same rule for `Dev/Content Note`,
 * `Development Note`, `CTA BUTTON` and `Content Note`.
 * `tests/unit/pillar-content.test.ts` fails if any of it appears in a title,
 * a description or on a page.
 *
 * Every value here is derived from `content/`, so the copy has one owner.
 */

/**
 * The document's cover line is `**Website:** qavyx.com`. That is the only origin
 * the client has given; the scheme is the only part not written down.
 *
 * `metadataBase` in `app/layout.tsx` reads this, which is what makes the relative
 * `openGraph.url` values below resolve to absolute URLs in the rendered tags.
 */
export const SITE_URL = 'https://qavyx.com';

/** Stable JSON-LD node ids, so the graph can reference rather than repeat. */
const ORG_ID = `${SITE_URL}/#organization`;

/**
 * The company, once. Every page's graph points at this `@id` instead of
 * restating the organisation.
 *
 * **No `sameAs`.** It is tempting — the footer already renders two social links —
 * but those URLs were inferred from the domain and are listed in §69 among the
 * assets still required before launch. A visible link that guesses wrong is a
 * link a human corrects; `sameAs` is a durable machine-readable assertion that
 * this company IS that account, and search engines cache it. It goes in when the
 * client confirms the handles, and `SOCIAL` in `content/site.ts` is where they
 * land.
 */
function organisationNode() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: ORGANISATION.name,
    url: SITE_URL,
    email: CONTACT.email,
    telephone: `+${CONTACT.whatsappNumber}`,
    areaServed: ORGANISATION.regions,
  };
}

/* THE BREADCRUMB NODE IS GONE, and it was deleted rather than left emitting.

   It built a `BreadcrumbList` from the same `Crumb[]` the page rendered, and
   carried a rule: "structured data describing a trail the page does not show is
   a claim about the site's shape that a crawler will believe and a visitor will
   never see". The client removed the visible breadcrumb, which turned that rule
   from a note into an instruction — a `BreadcrumbList` on a page with no
   breadcrumb is exactly the thing it forbade.

   The cost is real and was accepted: search results lose the breadcrumb line
   under the URL for these fifteen routes. What replaced the breadcrumb's
   navigational job is the header's mark, which links home from every page.

   The page's own `@id`, `url` and `name` never came from the trail's shape —
   only from its last entry — so they are unaffected. See `PageNode`.          */

/**
 * The page description, from the client's own intro.
 *
 * Joining the intro paragraphs rather than writing a summary keeps this file free
 * of copy: a description written here would be a second source of truth for the
 * page's pitch, and nobody editing `content/pillars.ts` would think to update it.
 * Longer than the ~155 characters a search result shows is fine — engines
 * truncate, and the alternative is inventing a shorter sentence.
 */
export function pillarDescription(page: PillarPage): string {
  return page.intro.join(' ');
}

/**
 * `<title>` is the PILLAR, not the page headline.
 *
 * `pageTitle` is the client's positioning line ("The Engine Room of Every QAVYX
 * Campaign.") and it is the `<h1>`, where it belongs. A tab and a search result
 * need the searchable noun instead, and `Growth Marketing — QAVYX` is also what
 * makes the five read as one set. The root layout supplies the ` — QAVYX` half
 * through `title.template`.
 */
export function pillarMetadata(page: PillarPage): Metadata {
  return pageMetadata({
    path: `/${page.slug}`,
    title: page.label,
    description: pillarDescription(page),
  });
}

/**
 * The metadata every route gets — the five pillars and the ten Phase 8D routes
 * alike.
 *
 * `title` is the SEARCHABLE NOUN, not the page's headline. The `<h1>` is the
 * client's own line ("We're Not an Agency. We're Your Growth Team."), which is
 * where it belongs; a tab and a search result need "Who We Are — QAVYX", and
 * that consistency is also what makes the sixteen read as one site. The root
 * layout's `title.template` supplies the ` — QAVYX` half.
 *
 * `description` is always the client's own copy — a page's intro, or its first
 * answer. Nothing in this file writes a sentence.
 *
 * `indexed: false` emits `noindex, nofollow`. No route passes it at present —
 * `/who-we-are/team` was the one, and its content is a section of `/who-we-are`
 * now. The parameter stays for the same reason the flag on `ALL_ROUTES` does:
 * holding a route back from search is a decision the client can make again, and
 * it is one line here against re-deriving it. See `ALL_ROUTES` in
 * `content/site.ts`.
 */
export function pageMetadata({
  path,
  title,
  description,
  indexed = true,
}: {
  path: string;
  title: string;
  description: string;
  indexed?: boolean;
}): Metadata {
  const fullTitle = `${title} — ${ORGANISATION.name}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(indexed ? {} : { robots: { index: false, follow: false } }),
    openGraph: {
      type: 'website',
      siteName: ORGANISATION.name,
      url: path,
      // OG has no template, so the full title is written out here.
      title: fullTitle,
      description,
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description,
    },
  };
}

/**
 * The page's structured data: the service and its sub-services.
 *
 * `hasOfferCatalog` is what carries the sub-services into the graph — each
 * section of the page is a `Service` the client can actually buy, with the
 * client's own description. It is the reason this is worth emitting at all; a
 * bare `Service` node with a name and a URL says nothing a crawler could not read
 * off the `<h1>`.
 */
export function pillarJsonLd(page: PillarPage) {
  const path = `/${page.slug}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organisationNode(),
      {
        '@type': 'Service',
        '@id': `${SITE_URL}${path}#service`,
        name: page.label,
        serviceType: page.label,
        url: `${SITE_URL}${path}`,
        description: pillarDescription(page),
        provider: { '@id': ORG_ID },
        areaServed: ORGANISATION.regions,
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: page.label,
          itemListElement: page.sections.map((section) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: section.name,
              description: section.description,
            },
          })),
        },
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/*  Phase 8D — the ten remaining routes                                        */
/* -------------------------------------------------------------------------- */

/**
 * The default graph: the organisation and the page.
 *
 * `type` is the schema.org type of the page's `mainEntity` slot — `WebPage`
 * unless there is something truer to say. Four of the ten routes have something
 * truer: `AboutPage`, `ContactPage`, `FAQPage` and `CollectionPage`, and each is
 * a real statement about what the page is rather than decoration. The two legal
 * stubs are plain `WebPage`s on purpose: there is no schema type for "this
 * document is being written", and claiming one would describe a policy that does
 * not exist.
 */
export function pageJsonLd({
  page,
  description,
  type = 'WebPage',
  extra,
}: {
  page: PageNode;
  description: string;
  type?: string;
  extra?: Record<string, unknown>;
}) {
  const path = page.href;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organisationNode(),
      {
        '@type': type,
        '@id': `${SITE_URL}${path}#page`,
        name: page.label,
        url: `${SITE_URL}${path}`,
        description,
        isPartOf: { '@id': ORG_ID },
        ...extra,
      },
    ],
  };
}

/**
 * §60's fourteen questions as a `FAQPage`.
 *
 * This is the one page on the site where structured data can carry the whole
 * content rather than a summary of it, and it is the reason `/faq` is worth
 * emitting a graph for at all. The answers are the client's, verbatim — the same
 * strings the page renders, from the same module.
 */
export function faqJsonLd(
  page: PageNode,
  description: string,
  faqs: readonly { question: string; answer: string }[],
) {
  return pageJsonLd({
    page,
    description,
    type: 'FAQPage',
    extra: {
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  });
}

/**
 * `/services` as a `CollectionPage` over the five pillars.
 *
 * Each item points at the `Service` node its own page already emits, by `@id`,
 * rather than restating the service here. Two nodes describing one service with
 * two descriptions is how a graph starts disagreeing with itself.
 */
export function servicesIndexJsonLd(
  page: PageNode,
  description: string,
  services: readonly { slug: string; title: string }[],
) {
  return pageJsonLd({
    page,
    description,
    type: 'CollectionPage',
    extra: {
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: services.map((service, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: service.title,
          item: `${SITE_URL}/${service.slug}#service`,
        })),
      },
    },
  });
}

/**
 * `/who-we-are/contact` as a `ContactPage`.
 *
 * `contactPoint` repeats the email and the number that are already on the
 * organisation node — deliberately, because `contactType` is the part that
 * carries meaning here ("customer support" on a page whose whole job is to be
 * contacted), and it comes from the same `CONTACT` constant, so the two cannot
 * drift.
 *
 * There is no `potentialAction`. The form does not submit anywhere yet, and
 * `ContactPoint` + a form the client has not wired would advertise a contact
 * channel that silently drops what it is given.
 */
export function contactJsonLd(page: PageNode, description: string) {
  return pageJsonLd({
    page,
    description,
    type: 'ContactPage',
    extra: {
      mainEntity: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: CONTACT.email,
        telephone: `+${CONTACT.whatsappNumber}`,
        areaServed: ORGANISATION.regions,
      },
    },
  });
}
