import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqExperience } from '@/components/faq/FaqExperience';
import { FAQS } from '@/content/faq';
import { faqJsonLd, pageMetadata } from '@/lib/seo';

const PAGE = { href: '/faq', label: 'FAQ' };
const LEAD = FAQS[0];

export const metadata: Metadata = pageMetadata({
  path: '/faq',
  title: 'FAQ',
  description: LEAD.answer,
});

export default function FaqRoute() {
  return (
    <>
      <JsonLd data={faqJsonLd(PAGE, LEAD.answer, FAQS)} />
      <main className="bg-qx-black min-h-screen text-white">
        <FaqExperience />
      </main>
    </>
  );
}

