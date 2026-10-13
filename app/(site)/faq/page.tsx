import type { Metadata } from 'next';
import { InnerPage } from '@/components/inner/InnerPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { FAQS } from '@/content/faq';
import { reveal, stagger } from '@/lib/reveal';
import { faqJsonLd, pageMetadata } from '@/lib/seo';

/**
 * `/faq` — §60, fourteen questions, verbatim and in the client's order.
 *
 * ## `<details>`, and therefore no client JavaScript
 *
 * An accordion is the one interaction pattern the platform already ships:
 * `<details>` / `<summary>` opens and closes, is keyboard operable, is announced
 * correctly, is `Ctrl+F`-findable in every current browser, and prints. A React
 * accordion would add a hydration boundary, `aria-expanded` wiring and a
 * `useState` per row to reproduce all of that slightly worse. This page is
 * therefore a pure server component, like every other inner route.
 *
 * The marker is replaced with a rule of our own (`::-webkit-details-marker` and
 * `list-style: none`, in the utility classes below) rather than left as the
 * browser's triangle, and the `+ / −` is CSS driven off `[open]` so nothing has
 * to track state.
 *
 * ## It now opens and closes smoothly, and STILL ships no JavaScript
 *
 * The one thing `<details>` could never do was animate: a closed one sets its
 * content to `content-visibility: hidden`, a discrete property with nothing
 * between its two values, and its height has no interpolable endpoint because
 * `auto` is not a length. `::details-content` with `transition-behavior:
 * allow-discrete`, plus `interpolate-size: allow-keywords` to make `auto`
 * interpolable, is the platform answering exactly those two problems — so the
 * panel can ease open to its own height with nothing measuring it.
 *
 * That is the whole reason this route did not become a client component to get a
 * smooth accordion. See `styles/motion.css`; where the pseudo-element is not
 * supported the rows open instantly and everything else is unchanged.
 *
 * ## They are not open by default and not grouped
 *
 * Fourteen open answers is a wall of text, which §66 Rule 02 rules against.
 * Grouping them into "Services / Pricing / Getting Started" would be an
 * editorial decision the client did not make — §60's order runs broadest-first
 * and closes on the ask, which is a sequence someone wrote.
 *
 * ## The `<h1>` is the client's first question
 *
 * "FAQ" is a label, not a headline, and it is already the breadcrumb's
 * `aria-current` item and the `<title>`. §60 supplies no page heading, so rather
 * than invent one the page leads with the question the client put first — which
 * is also the one a visitor arriving here most often has.
 */
const PAGE = { href: '/faq', label: 'FAQ' };

/** §60's first question and answer: what a search result should show. */
const LEAD = FAQS[0];

export const metadata: Metadata = pageMetadata({
  path: '/faq',
  title: 'FAQ',
  description: LEAD.answer,
});

/**
 * Same register as every other mono label on the site. `items-start`, not
 * `items-baseline`: the marker is a drawn cross now rather than a glyph, so it
 * has no baseline of its own to sit on, and `mt-2` drops it onto the question's
 * first line.
 */
const SUMMARY =
  'flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-md ' +
  'text-qx-white transition-colors marker:content-none hover:text-qx-green ' +
  '[&::-webkit-details-marker]:hidden';

export default function FaqRoute() {
  return (
    <>
      <JsonLd data={faqJsonLd(PAGE, LEAD.answer, FAQS)} />
      <InnerPage title={LEAD.question} intro={[LEAD.answer]}>
        {/* The remaining thirteen, inside ONE section frame rather than
            thirteen card frames. An accordion is a single control surface — the
            rows are states of one list, not thirteen things — and thirteen open
            corners stacked down a page would be the wallpaper the frame system
            is built to avoid. The rows keep their hairlines, which is what makes
            the set read as a list.

            `data-reveal` sits on the frame so it draws; the rows stagger inside
            it, but only to the fourth. Thirteen steps at 70ms is nearly a second
            of list assembling itself, and by row five the reader is scanning
            rather than watching. */}
        <div {...reveal} className="qx-frame mt-6 px-4 pb-6 pt-3 sm:px-6 lg:px-7">
          <ul className="flex flex-col">
            {FAQS.slice(1).map((faq, index) => (
              <li
                key={faq.id}
                id={faq.id}
                data-rv
                style={stagger(Math.min(index, 4))}
                // `scroll-mt-5` because every row is an `#anchor` a visitor can
                // be linked to. Without it the row lands flush against the top
                // of the viewport, and now that the list sits inside a frame
                // that means arriving mid-frame with its top edge off screen —
                // the mark cut in half by the fold.
                className="scroll-mt-5 border-b border-qx-line last:border-b-0"
              >
                <details className="qx-disclosure">
                  <summary className={SUMMARY}>
                    <span className="max-w-[46ch]">{faq.question}</span>
                    {/* Decorative, and now genuinely empty — `<details>` already
                        announces its own state, and the two glyphs this used to
                        swap both sat in the summary's text content where a
                        screen reader could reach them. Two bars, one of which
                        collapses; see `.qx-plus` in `styles/motion.css`. */}
                    <span aria-hidden="true" className="qx-plus mt-2" />
                  </summary>
                  <p className="max-w-[62ch] pb-5 text-sm text-qx-grey">{faq.answer}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </InnerPage>
    </>
  );
}
