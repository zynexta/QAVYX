import { reveal, stagger } from '@/lib/reveal';

/**
 * The shell every inner route shares: the breadcrumb, the title block, and the
 * container they sit in.
 *
 * `components/pillars/PillarPage.tsx` built all three inline for the five pillar
 * pages, and Phase 8D's remaining ten would have copied them ten more times.
 * They are lifted here unchanged — the rendered DOM is byte-identical to what
 * the pillar pages shipped in `7136f2e`, which is why the Phase 8D pillar e2e
 * spec still passes against it untouched.
 *
 * ## THE BREADCRUMB IS GONE, on the client's direction
 *
 * It was here, and it was doing two jobs this file argued were both load-bearing:
 *
 *   **The eyebrow.** §66 Rule 01 wants "section label / eyebrow → main heading →
 *   supporting description", and the trail's `aria-current` item was that label.
 *   `PillarPage` had deleted a separate eyebrow because this one filled the slot.
 *   Nothing fills it now — these pages open on the `<h1>`, which is the client's
 *   call and is what the rule's first slot is for when there is no section to
 *   name.
 *
 *   **The way back.** That job moved before the breadcrumb left: the header
 *   `app/(site)/layout.tsx` renders carries the mark, and the mark links home
 *   from every route. What genuinely went with it is the nested Who We Are
 *   pages' only visible statement that About, Team and Contact belong to one
 *   section — the footer and the menu still reach all three, but the
 *   relationship between them is no longer shown anywhere.
 *
 * The `BreadcrumbList` went with it, in the same edit and for the reason this
 * file used to give for keeping the two in step: structured data describing a
 * trail the page does not render is a claim a crawler believes and a visitor
 * never sees. `lib/seo.ts` takes a single `PageNode` now.
 */

/** The one mono-uppercase register: eyebrows, list labels, CTAs. */
export const EYEBROW = 'font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey';

interface InnerPageProps {
  /** The `<h1>` — the client's own headline for the page, not the nav label. */
  title: string;
  /**
   * A STATUS above the title. One page uses it: `/launchpad`, where §41's
   * "Coming Soon" has to reach a visitor arriving from a search result who has
   * never seen the site index's version of it.
   *
   * It is not §66 Rule 01's eyebrow slot — the breadcrumb fills that, and a
   * second one naming the page again is the duplication that got the pillar
   * pages' eyebrow removed. It is the only thing that prints above an `<h1>`
   * on this site now that the trail is gone.
   */
  eyebrow?: string;
  /** The paragraphs under it, in the document's order. May be empty. */
  intro?: readonly string[];
  /**
   * A figure beside the title block. The five pillar pages pass the carousel
   * diagram the visitor just clicked; `/who-we-are` passes one drawn for its own
   * `<h1>`, because that route's `<main>` otherwise held no SVG at all.
   *
   * ## Why it is a slot here rather than a child of the page
   *
   * Because it belongs to the TITLE BLOCK, and this component owns that. A
   * pillar page's `children` begin below the intro, so a diagram rendered there
   * is a figure floating between the copy and the first card with nothing to
   * belong to. Beside the intro it is the page's opening image, and it echoes
   * the 55/45 split of the carousel slide the reader just clicked — which is the
   * whole reason to reuse that artwork rather than draw something new.
   *
   * It is therefore `md` AND UP ONLY. "Beside" is the whole idea, and below `md`
   * there is no beside — see the note on the element itself.
   *
   * ## It is additive, and that is enforced by the shape of the JSX
   *
   * Most of the inner routes pass nothing, and for them `<header>` still
   * renders the eyebrow, the heading and the intro as its direct children with
   * no wrapper — byte-identical to what shipped, which is what keeps the Phase
   * 8D specs valid against it. The two-column wrapper exists only on the branch
   * that has something to put in the second column.
   *
   * Decorative: every service diagram is `aria-hidden` at its own root, and the
   * page says everything it has to say in text.
   */
  aside?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * A server component with no client JavaScript. The inner routes are the site's
 * search-visible surface and none of them needs a hydration boundary — the two
 * that do (the contact and waitlist forms) mount one island of their own inside
 * this shell rather than making the whole page a client component.
 */
export function InnerPage({ title, intro, aside, children }: InnerPageProps) {
  // The eyebrow, the heading and the intro, as one unit — so the two-column
  // branch below can put a wrapper around them without a second copy of the
  // markup, and the no-aside branch can render them exactly as it always did.
  const titleBlock = (
    <>
      <h1
        style={stagger(0)}
        className="qx-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[3.1rem] font-bold tracking-tight text-white leading-tight mb-3 sm:mb-4"
      >
        <span>{title}</span>
      </h1>
      {intro && intro.length > 0 ? (
        <div data-rv style={stagger(1)} className="flex flex-col gap-2">
          {intro.map((paragraph) => (
            <p key={paragraph} className="text-xs sm:text-sm text-[#919A94] max-w-[460px] sm:max-w-[540px] font-medium leading-relaxed font-sans">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
    </>
  );

  return (
    <main className="bg-qx-black">
      <article className="mx-auto max-w-[var(--qx-shell)] px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* One trigger for the whole title block: heading, then intro, a step
            apart. It is above the fold on every inner route, so in practice this
            is a page-load cascade rather than a scroll reveal — which is why the
            heading leads it now that the trail is gone. */}
        <div {...reveal}>
          <header className="flex flex-col gap-4">
            {aside ? (
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
                <div className="flex min-w-0 flex-col gap-4">{titleBlock}</div>
                {/* Step 2: after the copy it illustrates, never before it.
                    Held at the diagram's own 240px so it is never scaled — these
                    are drawn to a fixed node budget and blowing one up turns a
                    2px stroke into a rule. `--qx-line` is the colour the
                    carousel gives them, and the carousel is where the reader has
                    just seen this exact figure.

                    GONE BELOW `md`, WHICH IS THE CAROUSEL'S OWN RULE. There the
                    two columns become one, so the figure stops being *beside*
                    the intro and becomes 240px of diagram wedged between the
                    copy and the first section — a hole in a page a phone reader
                    is scrolling through, illustrating text they have already
                    passed. `ServicePanel` hides the same drawing at the same
                    breakpoint for the same reason: below it, the copy is what
                    matters. */}
                <div
                  data-rv
                  style={stagger(2)}
                  className="hidden w-[15rem] shrink-0 self-center text-qx-line md:block"
                >
                  {aside}
                </div>
              </div>
            ) : (
              titleBlock
            )}
          </header>
        </div>

        {children}
      </article>
    </main>
  );
}

/**
 * A section inside an inner page: a mono label, then its content.
 *
 * It used to open with a `border-t border-qx-line`, matching what the pillar
 * pages put between their own sections. It now wears the mark instead — the
 * section-scale frame, drawn on entry — for the same reason: whatever this does,
 * a pillar page does, and the two have to read as one site. `PillarPage`'s
 * section list changed with it.
 *
 * ## The children are wrapped, and that is a deliberate cost
 *
 * Seven routes call this and none of them knows about the reveal layer. Giving
 * the wrapper the reveal step means every one of them gets the label, then its
 * content, without seven edits and without seven chances to leave one out — and
 * it means a route added later is animated by default rather than by
 * remembering. The div carries no layout of its own, so a child's own
 * `mt-*` collapses through it exactly as it did against the section.
 */
export function Section({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      {...reveal}
      className="qx-frame mt-6 px-4 pb-6 pt-5 sm:px-6 lg:px-7"
    >
      <h2 id={`${id}-heading`} data-rv className={EYEBROW}>
        {label}
      </h2>
      <div data-rv style={stagger(1)}>
        {children}
      </div>
    </section>
  );
}
