import Link from 'next/link';
import { ArrowIcon, type IconProps } from '@/components/icons';
import { EYEBROW } from '@/components/inner/InnerPage';
import { reveal, stagger } from '@/lib/reveal';

/**
 * A short index of child routes, used by `/who-we-are` and `/services`.
 *
 * It is the homepage's `SiteIndex` row idiom — a label at reading size with a
 * hairline under it that draws green on hover — reduced to what an inner page
 * needs. Reusing the idiom is what makes a hub page read as the same site as the
 * homepage's index rather than as a list of links that happens to be here.
 *
 * `hook` is the destination's OWN heading, never a description written for this
 * row. On `/who-we-are` that is "We're Not an Agency. We're Your Growth Team."
 * and "Let's Grow Your Business."; on `/services` it is the pillar's one-line
 * pitch from §8. Both are the client's copy, and using the destination's own
 * words means the row cannot promise something the page does not say.
 */

export interface IndexRow {
  href: string;
  label: string;
  hook: string;
  /**
   * The destination's own mark, before the label.
   *
   * OPTIONAL, AND `/who-we-are` DELIBERATELY PASSES NONE. Its two rows are About
   * and Contact — a page about people and a page with a form — and there is no
   * pictogram for either that is not a stock icon standing in for a word that is
   * already right there. `/services` is the opposite case: five rows that are
   * five different things, each of which already HAS a drawing on the homepage
   * carousel, so the glyph is carrying a meaning the row would otherwise have to
   * be read to get.
   *
   * Decorative either way — the label is the accessible name, and
   * `components/icons` marks every glyph `aria-hidden`.
   */
  icon?: (props: IconProps) => React.JSX.Element;
}

export function SectionIndex({ label, rows }: { label: string; rows: readonly IndexRow[] }) {
  const headingId = `qx-index-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    // A <nav>, because it is navigation — and labelled, because this site has
    // more than one navigation landmark on an inner page (this and the footer's)
    // and an unlabelled one is announced as just "navigation".
    //
    // Framed like `SiteIndex`, which is the section this is the inner-page
    // reduction of, and with the same `pb-7`: the rows carry full-width
    // hairlines, and a hairline running into the open corner is the one thing
    // that makes the missing border read as damage rather than as the mark.
    <nav
      aria-labelledby={headingId}
      {...reveal}
      className="qx-frame mt-6 px-4 pb-7 pt-5 sm:px-6 lg:px-7"
    >
      <h2 id={headingId} data-rv className={EYEBROW}>
        {label}
      </h2>

      <ul className="mt-4 flex flex-col">
        {rows.map((row, index) => {
          const Glyph = row.icon;
          return (
            <li key={row.href} data-rv style={stagger(index + 1)}>
              <Link
                href={row.href}
                className="qx-index-row group flex w-full flex-col gap-2 py-3 text-qx-white hover:text-qx-green focus-visible:text-qx-green"
              >
                {/* Same pairing as `SiteIndex`: the label, and the mark that says
                    it is a destination. This is that section's reduction and the
                    two have to keep reading as one site.
                    A row's own glyph goes on the LEFT, where the eye starts, so
                    the pair reads "what this is ... where it goes".

                    It is GREY at rest and green when pointed at — the arrow's
                    behaviour exactly (`.qx-index-arrow` in globals.css), because
                    they are the two marks bracketing the same label and a row
                    that lights one end and not the other reads as half-hovered.
                    Grey rather than inherited white so it never competes with
                    the label it is labelling. */}
                <span className="flex items-center justify-between gap-4">
                  <span className="flex min-w-0 items-center gap-3">
                    {Glyph ? (
                      <Glyph className="h-4 w-4 shrink-0 text-qx-grey transition-colors duration-200 group-hover:text-qx-green group-focus-visible:text-qx-green" />
                    ) : null}
                    <span className="text-lg sm:text-xl">{row.label}</span>
                  </span>
                  <ArrowIcon className="qx-index-arrow h-4 w-4 shrink-0" />
                </span>
                <span className="max-w-[52ch] text-sm text-qx-grey">{row.hook}</span>
                {/* Two rules, stacked: a static hairline separating the rows and
                    a green one that draws over it on hover. Same as SiteIndex. */}
                <span className="relative mt-1 block h-px w-full bg-qx-line">
                  <span className="qx-index-rule absolute inset-0 block bg-qx-green" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
