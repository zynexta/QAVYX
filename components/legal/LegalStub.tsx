import type { LegalPage } from '@/content/legal';
import { InnerPage } from '@/components/inner/InnerPage';
import { CONTACT } from '@/content/site';

/**
 * `/privacy-policy` and `/terms-of-service` — a real page each, with no policy
 * in it.
 *
 * §63 links both from the footer of every page and §64 routes both; the document
 * contains neither text, and §69 lists both among the assets the client must
 * supply. Before this phase the two links 404'd.
 *
 * ## Why this is a heading and one sentence
 *
 * Drafting the text is the one piece of invented content on this site that could
 * expose the client rather than merely embarrass them. A privacy policy is a
 * legal undertaking about what a business does with personal data, and nobody
 * here knows what QAVYX's analytics collect, which processors they use, where
 * the two forms will post once wired, or what India's DPDP Act and the UAE's
 * PDPL each require of them. Generated boilerplate would read as authoritative
 * while being unenforceable and probably wrong. See `content/legal.ts`.
 *
 * So the page states the status and gives the address to write to — which is a
 * real answer to the question a visitor came with, unlike a policy that does not
 * describe this company.
 *
 * ## No `noindex`
 *
 * These are honest pages saying a true thing, so they are indexed like any
 * other. The one route on this site that is `noindex` is `/who-we-are/team`,
 * which is switched off rather than merely brief.
 */
export function LegalStub({ page }: { page: LegalPage }) {
  // `{email}` rather than concatenation, so the sentence stays readable to
  // whoever owns the copy — and the address keeps its single owner in
  // `content/site.ts`.
  const [before, after] = page.body.split('{email}');

  return (
    <InnerPage title={page.title}>
      <p className="mt-5 max-w-[56ch] text-md text-qx-grey">
        {before}
        <a
          href={`mailto:${CONTACT.email}`}
          className="text-qx-white underline underline-offset-4 transition-colors hover:text-qx-green focus-visible:text-qx-green"
        >
          {CONTACT.email}
        </a>
        {after}
      </p>
    </InnerPage>
  );
}
