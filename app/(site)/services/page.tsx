import type { Metadata } from 'next';
import { InnerPage } from '@/components/inner/InnerPage';
import { SectionIndex } from '@/components/company/SectionIndex';
import { SERVICE_GLYPHS } from '@/components/icons';
import { JsonLd } from '@/components/seo/JsonLd';
import { HOME_COPY } from '@/content/home';
import { SERVICES } from '@/content/services';
import { pageMetadata, servicesIndexJsonLd } from '@/lib/seo';

/**
 * `/services` — an index of the five pillars.
 *
 * ## The document has no content section for this page
 *
 * "Our Services" appears in §2's site map, §62's header, §63's footer and §64's
 * URL structure, and nowhere else. There is no §-numbered section of copy for
 * it. So every string here is one the client already wrote for the same five
 * things: §8's heading and supporting copy at the top, and §8's own one-line
 * pitch per pillar on each row. Nothing is invented, and nothing is written here
 * that would need approving separately from the homepage it is shared with.
 *
 * ## It is NOT a flat list of the twenty-four service areas
 *
 * §72 is explicit: "The website should not feel like a list of unrelated agency
 * services. The services should feel like parts of one larger growth system."
 * Twenty-four names on one page is precisely the first thing. Five pillars, each
 * linking to the page that names its own sub-services, is the second.
 *
 * ## The heading and lead are §8's, shared with the homepage
 *
 * `HOME_COPY.indexHeading` and `.indexLead` also head the homepage's site index,
 * two screens below the carousel. That repetition is deliberate: they are two
 * presentations of §8, and §8 has one heading. Writing a second one for this
 * page would be inventing copy to avoid a duplication that is actually correct.
 *
 * The `<title>` is "Our Services" — the searchable noun from §2 and §63 — while
 * the `<h1>` is the client's own heading. Same split as every pillar page.
 */
const PAGE = { href: '/services', label: 'Our Services' };

export const metadata: Metadata = pageMetadata({
  path: '/services',
  title: 'Our Services',
  description: HOME_COPY.indexLead,
});

/**
 * §8's five pillars, each with its own one-line pitch as the row's hook.
 *
 * The glyph is the pillar's homepage diagram at icon scale — see
 * `SERVICE_GLYPHS`. It is the one thing that makes this page look like an index
 * of five DIFFERENT things rather than five lines of type, and it is keyed off
 * the same slug the route is, so a row can never carry another pillar's mark.
 */
const ROWS = SERVICES.map((service) => ({
  href: service.cta.href,
  label: service.title,
  hook: service.description,
  icon: SERVICE_GLYPHS[service.slug],
}));

export default function ServicesRoute() {
  return (
    <>
      <JsonLd data={servicesIndexJsonLd(PAGE, HOME_COPY.indexLead, SERVICES)} />
      <InnerPage title={HOME_COPY.indexHeading} intro={[HOME_COPY.indexLead]}>
        {/* "Five pillars" is the client's own phrase, the first two words of
            the lead directly above — not a section name invented here. */}
        <SectionIndex label="Five pillars" rows={ROWS} />
      </InnerPage>
    </>
  );
}
