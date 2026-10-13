import type { Metadata } from 'next';
import { RealResultsSection } from '@/components/projects/RealResultsSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { PROJECTS } from '@/content/projects';
import { pageJsonLd, pageMetadata } from '@/lib/seo';

const PAGE = { href: '/projects', label: 'Our Projects' };

export const metadata: Metadata = pageMetadata({
  path: '/projects',
  title: 'Our Projects',
  description: PROJECTS.intro,
});

export default function ProjectsRoute() {
  return (
    <>
      <JsonLd data={pageJsonLd({ page: PAGE, description: PROJECTS.intro })} />
      <main className="bg-[#030504] min-h-screen text-[#F5F7F4] selection:bg-[#2ABD00] selection:text-[#030504]">
        <article className="mx-auto max-w-[var(--qx-shell)] px-3 sm:px-6 py-3 sm:py-6 md:py-10">
          <RealResultsSection />
        </article>
      </main>
    </>
  );
}
