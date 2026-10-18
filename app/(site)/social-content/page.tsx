import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import SocialContentProcess from '@/components/social/SocialContentProcess';
import { pillarBySlug } from '@/content/pillars';
import { pillarJsonLd, pillarMetadata } from '@/lib/seo';
import { ANCHOR_SCROLL_BOOT } from '@/lib/anchor-scroll';

/** `/social-content` — the handoff document's §18–§23. */
const PAGE = pillarBySlug('social-content');

export const metadata: Metadata = pillarMetadata(PAGE);

export default function SocialContentRoute() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ANCHOR_SCROLL_BOOT }} />
      <JsonLd data={pillarJsonLd(PAGE)} />
      <SocialContentProcess />
    </>
  );
}
