import type { Metadata } from 'next';
import { LegalStub } from '@/components/legal/LegalStub';
import { JsonLd } from '@/components/seo/JsonLd';
import { CONTACT } from '@/content/site';
import { legalPageBySlug } from '@/content/legal';
import { pageJsonLd, pageMetadata } from '@/lib/seo';

/**
 * `/terms-of-service` — a stub, deliberately. The twin of `/privacy-policy`:
 * both are routes §64 assigns and §63 links from every page, and the document
 * supplies text for neither. See `components/legal/LegalStub.tsx`.
 */
const PAGE = legalPageBySlug('terms-of-service');
const PAGE_NODE = { href: `/${PAGE.slug}`, label: PAGE.title };
const DESCRIPTION = PAGE.body.replace('{email}', CONTACT.email);

export const metadata: Metadata = pageMetadata({
  path: `/${PAGE.slug}`,
  title: PAGE.title,
  description: DESCRIPTION,
});

export default function TermsOfServiceRoute() {
  return (
    <>
      <JsonLd data={pageJsonLd({ page: PAGE_NODE, description: DESCRIPTION })} />
      <LegalStub page={PAGE} />
    </>
  );
}
