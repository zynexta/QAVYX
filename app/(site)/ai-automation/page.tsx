import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import AiAutomationProcess from '@/components/ai/AiAutomationProcess';
import { pillarBySlug } from '@/content/pillars';
import { pillarJsonLd, pillarMetadata } from '@/lib/seo';
import { ANCHOR_SCROLL_BOOT } from '@/lib/anchor-scroll';

/** `/ai-automation` — the handoff document's §24–§29. */
const PAGE = pillarBySlug('ai-automation');

export const metadata: Metadata = pillarMetadata(PAGE);

export default function AiAutomationRoute() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ANCHOR_SCROLL_BOOT }} />
      <JsonLd data={pillarJsonLd(PAGE)} />
      <AiAutomationProcess />
    </>
  );
}
