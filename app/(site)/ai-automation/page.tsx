import type { Metadata } from 'next';
import { PillarPage } from '@/components/pillars/PillarPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { pillarBySlug } from '@/content/pillars';
import { pillarJsonLd, pillarMetadata } from '@/lib/seo';

/** `/ai-automation` — the handoff document's §24–§29. */
const PAGE = pillarBySlug('ai-automation');

export const metadata: Metadata = pillarMetadata(PAGE);

export default function AiAutomationRoute() {
  return (
    <>
      <JsonLd data={pillarJsonLd(PAGE)} />
      <PillarPage page={PAGE} />
    </>
  );
}
