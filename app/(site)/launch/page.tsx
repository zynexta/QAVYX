import type { Metadata } from 'next';
import { PillarPage } from '@/components/pillars/PillarPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { pillarBySlug } from '@/content/pillars';
import { pillarJsonLd, pillarMetadata } from '@/lib/seo';

/**
 * `/launch` — the handoff document's §36–§40.
 *
 * Not to be confused with `/launchpad`. This is the fifth service pillar, which
 * a client can buy today; `/launchpad` is "Digital Growth Launchpad (Coming
 * Soon)", an unreleased product with a waitlist (§41).
 *
 * The document used "launch" for both AND for the homepage's hero concept. The
 * client has since answered that the hero's "Digital Growth Launchpad" and §41's
 * product are one thing, under the former's name — so two of the three names
 * merged and THIS route is the one that stayed separate. It is a service, not
 * the product; the routes have always been distinct and still are.
 */
const PAGE = pillarBySlug('launch');

export const metadata: Metadata = pillarMetadata(PAGE);

export default function LaunchRoute() {
  return (
    <>
      <JsonLd data={pillarJsonLd(PAGE)} />
      <PillarPage page={PAGE} />
    </>
  );
}
