import { SiteHeader } from '@/components/nav/SiteHeader';

/**
 * The shell every inner route shares: the header, and then the page.
 *
 * A route-group layout rather than a line in the root layout, because the
 * homepage needs the same header in a DIFFERENT PLACE — after the pinned hero
 * rather than above it — and `app/layout.tsx` renders `{children}` as one opaque
 * block with no way to reach inside it. `app/page.tsx` places its own copy; this
 * places the other fifteen.
 *
 * That is the whole file, and it is deliberately the whole file. Everything else
 * an inner route shares — the container, the breadcrumb, the title block — is
 * `components/inner/InnerPage.tsx` and belongs to the page's content rather than
 * to the route group. A layout that started collecting those would be a second
 * shell competing with the first.
 *
 * The group has nested routes (`/who-we-are/contact` and two siblings). A
 * segment layout applies to every descendant, so those get the header from here
 * too and there is nothing to repeat.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
