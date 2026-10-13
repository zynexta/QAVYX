/**
 * `/privacy-policy` and `/terms-of-service` — two real pages with no content.
 *
 * SOURCE: `docs/CONTENT-HANDOFF.md`.
 * §2 lists both under Global Elements, §63 links both from the footer of every
 * page, §64 routes them — and **the document contains no privacy or terms text
 * anywhere.** §69 lists both among the assets the client must still supply, and
 * §74's QA checklist leaves both unticked.
 *
 * ## These are stubs, and drafting them would be worse than shipping nothing
 *
 * A privacy policy is a legal undertaking about what a business does with
 * personal data. Nobody building this site knows what QAVYX's analytics stack
 * collects, which processors it uses, where the two forms will post once the
 * client wires them, or which jurisdictions (India, UAE) the policy has to
 * satisfy. Generated boilerplate would read as authoritative while being
 * unenforceable and probably wrong, and it is the one kind of invented content
 * on this site that could expose the client rather than merely embarrass them.
 *
 * So each page renders its heading, one sentence saying the document is being
 * prepared, and the email to write to in the meantime. That resolves the two
 * footer links §63 requires — they 404'd before this — without asserting terms
 * nobody has agreed.
 *
 * The email is NOT repeated here: it is `CONTACT.email` in `content/site.ts`,
 * the same address the footer prints on every page.
 */

export interface LegalPage {
  /** Route, matching `LEGAL_LINKS` in `content/site.ts`. */
  slug: string;
  /** §63's own label for the link, which is also the page's `<h1>`. */
  title: string;
  /**
   * What the page says instead of the document. One sentence, in the site's
   * voice rather than in legal register — it is a status, not a policy.
   *
   * `{email}` is substituted at render with `CONTACT.email` so the address has
   * one owner. It is a placeholder rather than a concatenation so the sentence
   * stays readable to whoever owns the copy.
   */
  body: string;
}

export const LEGAL_PAGES: readonly LegalPage[] = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    body: 'Our privacy policy is being prepared. Until it is published, write to {email} with any question about how we handle your information and we will answer it directly.',
  },
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    body: 'Our terms of service are being prepared. Until they are published, write to {email} with any question about how we work and we will answer it directly.',
  },
] as const;

/**
 * Lookup by slug, for the two route files.
 *
 * Throws rather than returning `undefined`, for the same reason
 * `pillarBySlug` does: the only caller is a route file naming its own slug as a
 * literal, so a miss means a route and its content have been renamed apart.
 */
export function legalPageBySlug(slug: string): LegalPage {
  const page = LEGAL_PAGES.find((candidate) => candidate.slug === slug);
  if (!page) throw new Error(`No legal page for slug "${slug}"`);
  return page;
}
