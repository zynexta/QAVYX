import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import BuildScaleProcess from '@/components/build/BuildScaleProcess';
import { pillarBySlug } from '@/content/pillars';
import { pillarJsonLd, pillarMetadata } from '@/lib/seo';
import { ANCHOR_SCROLL_BOOT } from '@/lib/anchor-scroll';

/**
 * `/build-scale` — the handoff document's §30–§35.
 *
 * NOT `/build-web3`. The pillar was `Build & Web3` when it was scraped from the
 * live site; the document contains no Web3 anywhere and calls it Build & Scale.
 * `tests/unit/services.test.ts` fails if it comes back.
 */
const PAGE = pillarBySlug('build-scale');

export const metadata: Metadata = pillarMetadata(PAGE);

export default function BuildScaleRoute() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ANCHOR_SCROLL_BOOT }} />
      <JsonLd data={pillarJsonLd(PAGE)} />
      <BuildScaleProcess />
    </>
  );
}
