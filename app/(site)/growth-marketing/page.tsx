import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import CampaignProcess from '@/components/growth/CampaignProcess';
import { pillarBySlug } from '@/content/pillars';
import { pillarJsonLd, pillarMetadata } from '@/lib/seo';
import { ANCHOR_SCROLL_BOOT } from '@/lib/anchor-scroll';

const PAGE = pillarBySlug('growth-marketing');

export const metadata: Metadata = pillarMetadata(PAGE);

export default function GrowthMarketingRoute() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ANCHOR_SCROLL_BOOT }} />
      <JsonLd data={pillarJsonLd(PAGE)} />
      <CampaignProcess />
    </>
  );
}
