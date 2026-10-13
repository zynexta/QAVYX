import type { Metadata } from 'next';
import { LegalStub } from '@/components/legal/LegalStub';
import { JsonLd } from '@/components/seo/JsonLd';
import { CONTACT } from '@/content/site';
import { legalPageBySlug } from '@/content/legal';
import { pageJsonLd, pageMetadata } from '@/lib/seo';

/**
 * `/privacy-policy` — a stub, deliberately. See `components/legal/LegalStub.tsx`
 * for why no policy text is written here, and `content/legal.ts` for the copy.
 *
 * The `<meta description>` is the page's own sentence with the email substituted
 * in, so a search result says the same thing the page does rather than promising
 * a policy that is not there.
 */
const PAGE = legalPageBySlug('privacy-policy');
const PAGE_NODE = { href: `/${PAGE.slug}`, label: PAGE.title };
const DESCRIPTION = PAGE.body.replace('{email}', CONTACT.email);

export const metadata: Metadata = pageMetadata({
  path: `/${PAGE.slug}`,
  title: PAGE.title,
  description: DESCRIPTION,
});

export default function PrivacyPolicyRoute() {
  return (
    <>
      <JsonLd data={pageJsonLd({ page: PAGE_NODE, description: DESCRIPTION })} />
      <LegalStub page={PAGE} />
    </>
  );
}
