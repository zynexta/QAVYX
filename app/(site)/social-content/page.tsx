import type { Metadata } from 'next';
import { PillarPage } from '@/components/pillars/PillarPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { pillarBySlug } from '@/content/pillars';
import { pillarJsonLd, pillarMetadata } from '@/lib/seo';

/** `/social-content` — the handoff document's §18–§23. */
const PAGE = pillarBySlug('social-content');

export const metadata: Metadata = pillarMetadata(PAGE);

export default function SocialContentRoute() {
  return (
    <>
      <JsonLd data={pillarJsonLd(PAGE)} />
      <PillarPage page={PAGE} />
    </>
  );
}
