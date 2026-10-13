import Link from 'next/link';
import { sectionAnchor, type PillarPage as PillarPageData } from '@/content/pillars';
import { EYEBROW, InnerPage } from '@/components/inner/InnerPage';
import { WhatsAppLink } from '@/components/nav/WhatsAppLink';
import { SECTION_VISUALS, SERVICE_VISUALS } from '@/components/services/visuals';
import { ANCHOR_SCROLL_BOOT } from '@/lib/anchor-scroll';
import { reveal, stagger } from '@/lib/reveal';

/**
 * One pillar page, rendered from `content/pillars.ts`.
 *
 * All five routes are this component and a data lookup, because all five are the
 * same document structure: a title, an intro, N named sections and a CTA row.
 * Five hand-built pages would be five places for the spacing to drift and five
 * chances to leave a heading level out.
 *
 * A server component, no client JavaScript. The pillar pages are the site's
 * search-visible surface, and there is nothing here that needs a hydration
 * boundary — the one interactive element is a link to WhatsApp.
 *
 * ## The section hierarchy is §66 Rule 01, not a layout preference
 *
 * "Section label / eyebrow → main heading → supporting description → cards →
 * CTA where required." The eyebrow is the pillar, the heading is the client's own
 * page title, the description is the intro, the cards are the sections and the
 * CTA row closes. Rule 02 ("avoid large text walls") is why every section's list
 * is a bulleted set of short nouns rather than prose.
 *
 * ## THERE IS NO EYEBROW, AND THAT IS THE SECOND TIME IT HAS GONE
 *
 * A separate one was built first and cut: it printed the pillar's name in mono
 * uppercase two lines under a breadcrumb ending in the pillar's name in mono
 * uppercase, and on Build & Scale — whose §30 page title is the pillar's own
 * name — the same words appeared three times in a row. Rule 01's "section label
 * / eyebrow" slot was then filled by the breadcrumb's `aria-current` item, which
 * earned its place twice by also being the way back to the hub.
 *
 * The client has since removed the breadcrumb, so the slot is empty rather than
 * doubly filled. Reinstating the separate eyebrow would bring the first problem
 * back — the pillar's name twice, once as a label and once as the heading — so
 * these pages open on the `<h1>`. The way back is the header's mark.
 *
 * ## The shell is shared, and this page no longer owns it
 *
 * The container and the title block moved to
 * `components/inner/InnerPage.tsx` in Phase 8D, unchanged, because the ten
 * remaining routes need all three. What is left here is the part that is
 * genuinely a pillar page: the section list and the CTA row.
 *
 * ## One thing that looks like a bug and is the content
 *
 * **Growth Marketing numbers its sections and the others do not.** §13–§17 are
 * "Step 01".."Step 05" — a process that runs in order — so that page renders an
 * `<ol>` with visible counters. The other four are menus, where a number would
 * imply a sequence the client did not write.
 *
 * That one flag now decides two things rather than one. The numbered page also
 * gets the SPINE — a line down the rail joining the five counters, continuing
 * across the gaps between the cards so the five boxes read as one process —
 * because a line saying "these run in order" is the same claim the numbers make
 * and would be a lie on a menu. The geometry and the argument for it are in
 * `styles/pillar-spine.css`. The other four pages have no spine and every one of
 * their cards carries a figure instead — see `SECTION_VISUALS`, and note that
 * those figures are NOT in the rail: they sit at the right-hand end of the copy
 * row, which is the only place they do not make the card taller. The comment on
 * the element itself has the measurements.
 */

export function PillarPage({ page }: { page: PillarPageData }) {
  const SectionList = page.ordered ? 'ol' : 'ul';
  // The homepage carousel's diagram for this pillar, beside the intro.
  //
  // THE SAME FIGURE THE READER JUST CLICKED. Every route into this page is a
  // slide or a row that carried this drawing, and until now it stopped at the
  // link: five text pages, none of which looked like the thing that sent you
  // there. Reusing the artwork rather than commissioning a page-specific one is
  // the point — a second drawing of Growth Marketing would be a second opinion
  // about what Growth Marketing is.
  //
  // Keyed off `page.slug`, which is also the route and also `SERVICES[n].slug`;
  // `tests/unit/services.test.ts` holds the three to one value. A pillar with no
  // diagram renders no aside rather than a fallback, which is the same contract
  // `ServicePanel` has.
  const Visual = SERVICE_VISUALS[page.slug];

  return (
    <>
      {/* MUST STAY ABOVE THE SECTIONS. It removes the fragment before the
          browser has parsed the element that fragment names, which is the whole
          reason the jump never happens — see `lib/anchor-scroll.ts`. Moved below
          `SectionList` it would run too late and do nothing but flicker. */}
      <script dangerouslySetInnerHTML={{ __html: ANCHOR_SCROLL_BOOT }} />
      <InnerPage
        title={page.pageTitle}
        intro={page.intro}
        aside={Visual ? <Visual /> : undefined}
      >
        {/* The sections. Two columns from `md`: the name holds the left rail so
          the page can be scanned by name alone, the explanation runs on the
          right. Below `md` it stacks in the same order it reads.

          Each is a card frame now, in step with `InnerPage`'s `Section` — this
          list and that component were the two places the same `border-t
          border-qx-line` idiom lived, and they move together or a visitor going
          from Growth Marketing to Who We Are reads two designs. */}
        <SectionList
          {...reveal}
          // ONE CARD PER ROW. Two-up was tried and reverted on the client's
          // direction: the cards are the page's structure and a section is a
          // thing you land on from a carousel chip, so they stay full width and
          // the column that was empty is filled by the service lists inside them
          // going to two columns instead — see the `<ul>` below.
          //
          // `qx-spine` is what the stylesheet's `:first-child` / `:last-child`
          // rules hang off, so the ends of the line are decided by the list
          // rather than by an index passed down to each card. Only the numbered
          // page carries it — see the docblock above.
          className={`mt-6 flex flex-col gap-4${page.ordered ? ' qx-spine' : ''}`}
        >
          {page.sections.map((section, index) => {
            // Computed once and used twice: it is the card's own `id`, and it is
            // half the key the section figure is looked up under. Deriving the
            // key from the same call the anchor comes from is what stops a
            // renamed section keeping its drawing while losing its fragment, or
            // the other way round.
            const anchor = sectionAnchor(section.name);
            const SectionVisual = SECTION_VISUALS[`${page.slug}#${anchor}`];

            return (
              <li
                key={section.name}
                // THE CAROUSEL'S CHIPS LAND HERE. Each chip on this pillar's panel
                // links to `/{slug}#{sectionAnchor(name)}`, so every section needs
                // the matching id. Derived from the name by the shared helper in
                // `content/pillars.ts` — never typed here, or the two halves of one
                // link would be two places to keep in step.
                id={anchor}
                data-rv
                style={stagger(index)}
                // `scroll-mt-6` is what makes the landing readable rather than
                // technically correct. Without it the browser puts the section's top
                // edge flush against the viewport's, so the card frame's own border
                // is the first pixel row on screen and the heading reads as clipped.
                // 4rem is `--qx-space-6`, the same step `InnerPage` opens the page
                // with, so an anchored arrival is spaced like the top of the page.
                className="qx-frame qx-frame--card grid scroll-mt-6 gap-x-6 gap-y-3 p-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]"
              >
                <div className={`flex flex-col gap-2${page.ordered ? ' qx-spine-rail' : ''}`}>
                  {page.ordered ? (
                    <>
                      {/* The node and its run, drawn entirely in CSS from this one
                        empty box — it is absolutely positioned, so where it sits
                        in the rail's flow costs nothing and it leads for
                        readability. Decorative: the order is already in the
                        counter beside it and in the `<ol>` itself. */}
                      <span aria-hidden="true" className="qx-spine-mark" />
                      <p className={EYEBROW}>{String(index + 1).padStart(2, '0')}</p>
                    </>
                  ) : null}
                  <h2 className="text-lg text-qx-white md:text-xl">{section.name}</h2>
                </div>

                {/* THE FIGURE IS IN HERE AND NOT IN THE RAIL, and the move is
                    the fix for the hole the client spotted rather than a tidy-up.

                    In the rail it was stacked UNDER the section's name, so it
                    drove the card's height: a rail of 282–321px against a copy
                    column of 133–217px left a mean of 118px of empty card under
                    the copy and 271px on the worst one. Meanwhile the copy
                    column is 768px wide and the copy is capped at 52ch, so 350px
                    of that row was empty to the RIGHT of the text at the same
                    time. One hole above the other, on every card.

                    Beside the copy it fills the second hole with the first: the
                    row is now as tall as the taller of the copy and the drawing
                    instead of their sum, which takes ~100px off nearly every
                    card and ~270px off §19.

                    `xl` AND NOT `md`, because `--qx-shell` steps at 1280 and the
                    body column steps with it — 256px at `md`, 512px at `lg`,
                    768px at `xl`. Only the last of those can hold a 240px
                    drawing and a readable measure side by side; at `lg` the copy
                    would be left 248px, which is 31ch. Below `xl` the card is
                    the text card it shipped as, which is the same call
                    `InnerPage` makes for its aside: at the widths where the
                    drawing would have to cost the copy something, the copy
                    wins. */}
                <div className="flex flex-col gap-5 md:col-start-2 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 flex-col gap-3">
                    {section.headline ? (
                      <p className="max-w-[46ch] text-md text-qx-white">{section.headline}</p>
                    ) : null}
                    <p className="max-w-[52ch] text-sm text-qx-grey">{section.description}</p>

                    {section.lists.map((list) => {
                      // The visible label names the list for a screen reader too, so
                      // the label is not read twice and no extra heading level is
                      // spent on the word "Services" five times a page.
                      const labelId = `${page.slug}-${index}-${list.label.toLowerCase().replace(/\s+/g, '-')}`;
                      return (
                        <div key={list.label} className="flex flex-col gap-2">
                          <p id={labelId} className={EYEBROW}>
                            {list.label}
                          </p>
                          {/* BULLETS HERE, CHIPS ON THE CAROUSEL. The panels' chips
                          are controls — each one links into this page — and a
                          bordered box is the right affordance for something you
                          click. These are the destination: plain text the reader
                          has finished travelling to, so a border here promises a
                          press that never happens. The marker carries the green,
                          which is the one thing the chip form was buying. */}
                          {/* TWO COLUMNS, WHICH IS WHERE THE EMPTY HALF OF THIS PAGE
                          WENT. A card is 1,152px wide and this list was a single
                          stack of 12px mono against its left edge — four items
                          at ~250px inside a 768px column, so more than half of
                          every card was blank to the right of it. Nothing else in
                          the card can spread: the headline and the description
                          are held to a measure because they are prose.

                          A GRID AND NOT `columns-2`. CSS columns fill the first
                          column to its bottom and then start the second, so the
                          reading order down-then-across disagrees with the DOM
                          order a screen reader follows. A grid flows row-major,
                          which is the order the items are written in — the two
                          readings stay the same list.

                          ON AT `sm`, OFF AGAIN AT `md`, ON AT `lg` — and the
                          middle one is not a typo. Three widths are three
                          different amounts of room, because the CARD's own
                          layout changes underneath this one:

                            <  sm  card stacked, ~310px. One column — two would
                                   wrap every item onto two lines, which is
                                   longer than the stack it replaced.
                            sm–md  still stacked, ~512px. Two columns of 244px.
                            md–lg  the rail takes 240px and the gutter 64 more,
                                   leaving this list 336px. One column: at 768px
                                   two of them measured 96px each and every item
                                   in every list wrapped.
                            ≥  lg  the rail is paid for out of the extra width;
                                   the list gets 592px and two columns of 284px.

                          The cap is the MEASURE, not the container. The longest
                          item on the site is §14's "Founder Thought Process &
                          Analysis", which sets to ~271px in this face once the
                          marker and its gap are counted, so two of those plus the
                          gutter come to 38rem — the value was measured up from
                          that string rather than picked, and at 36rem it was the
                          one item that still wrapped. Left uncapped to fill the
                          body's full 768px the columns would sit 350px apart and
                          the pairs would stop reading as pairs.

                          Swept 390–1440: one item of twenty-six wraps, at 640,
                          768 and 1024, and it is that string. It wraps into the
                          hanging indent the marker below is built for, which is
                          the case that rule was written for. */}
                          <ul
                            aria-labelledby={labelId}
                            className="grid max-w-[38rem] gap-x-4 gap-y-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2"
                          >
                            {list.items.map((item) => (
                              <li
                                key={item}
                                // A HYPHEN, NOT A DISC. The round bullet was the one
                                // shape on this page that belonged to a word processor
                                // rather than to the rest of the site — everything
                                // around it is mono, square and drawn from `qx-line`.
                                // An em dash in the mono face fills its cell exactly,
                                // so the markers stack into a straight rule down the
                                // left edge instead of a column of dots.
                                //
                                // The dash is a flex item and not `list-style`, which
                                // is what buys the hanging indent: an item that wraps
                                // aligns its second line with its first, not under the
                                // marker.
                                className="flex gap-2 font-mono text-2xs text-qx-grey before:text-qx-green-dim before:content-['—']"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  {/* Held at the diagram's own 240px and never sized by the
                      column it is in — `SERVICE_VISUALS`' figures are drawn to a
                      fixed node budget and `/services` proves they become
                      smudges when scaled. `shrink-0` is what enforces that
                      against a flex row that would otherwise squeeze it. */}
                  {SectionVisual ? (
                    <div className="hidden w-[15rem] shrink-0 text-qx-grey xl:block">
                      <SectionVisual />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </SectionList>

        <PillarCtas page={page} />
      </InnerPage>
    </>
  );
}

/**
 * The CTA row.
 *
 * A `pending` CTA renders NOTHING — see `PENDING_CALENDLY` in
 * `content/pillars.ts`. Both of them are booking links waiting on a Calendly URL
 * the client has not supplied, and the two ways to ship them anyway are a dead
 * `href="#"` and a disabled button; the first is a broken link and the second
 * reads to a visitor as a fault rather than as an unfinished handover. The entry
 * stays in the data, so supplying the URL is a one-line change and nothing here
 * needs redesigning to hold it.
 */
function PillarCtas({ page }: { page: PillarPageData }) {
  const visible = page.ctas.filter((cta) => cta.kind !== 'pending');
  if (visible.length === 0) return null;

  return (
    // A rule and not a frame. Everything above it is framed, and this is a row
    // of two links closing the page rather than another section — a sixth box
    // would say it is one. It is its own reveal trigger because it sits at the
    // bottom of a long page, well past whatever revealed last.
    <div
      {...reveal}
      data-rv
      className="mt-6 flex flex-wrap items-center gap-4 border-t border-qx-line pt-6"
    >
      {visible.map((cta) =>
        cta.kind === 'chat' ? (
          <WhatsAppLink
            key={cta.label}
            className="w-fit rounded-sm border border-qx-green-dim px-4 py-2 font-mono text-2xs uppercase tracking-[0.28em] text-qx-green transition-colors hover:bg-qx-ink-raised"
            label={cta.label}
          />
        ) : (
          <Link
            key={cta.label}
            href={cta.href}
            className="w-fit border-b border-qx-line pb-1 font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey transition-colors hover:border-qx-white hover:text-qx-white focus-visible:text-qx-white"
          >
            {cta.label}
          </Link>
        ),
      )}
    </div>
  );
}
