import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { pillarBySlug } from '@/content/pillars';
import { pillarJsonLd, pillarMetadata } from '@/lib/seo';
import { LaunchServiceProcess } from '@/components/launch/LaunchServiceProcess';
import { ANCHOR_SCROLL_BOOT } from '@/lib/anchor-scroll';

const PAGE = pillarBySlug('launch');

export const metadata: Metadata = pillarMetadata(PAGE);

export default function LaunchRoute() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ANCHOR_SCROLL_BOOT }} />
      <JsonLd data={pillarJsonLd(PAGE)} />
      <LaunchServiceProcess />
    </>
  );
}

