import type { Metadata } from 'next';
import { ContactPageContent } from '@/components/contact/ContactPageContent';
import { JsonLd } from '@/components/seo/JsonLd';
import { CONTACT_PAGE } from '@/content/company';
import { contactJsonLd, pageMetadata } from '@/lib/seo';

const PAGE = { href: '/who-we-are/contact', label: 'Contact Us' };

export const metadata: Metadata = pageMetadata({
  path: '/who-we-are/contact',
  title: 'Contact Us',
  description: CONTACT_PAGE.description,
});

export default function ContactRoute() {
  return (
    <>
      <JsonLd data={contactJsonLd(PAGE, CONTACT_PAGE.description)} />
      <main className="bg-black min-h-screen">
        <ContactPageContent />
      </main>
    </>
  );
}
