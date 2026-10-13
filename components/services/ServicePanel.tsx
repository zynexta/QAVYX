import { sectionAnchor } from '@/content/pillars';
import { PILLAR_CTA_LABEL, type ServiceCategory } from '@/content/services';
import { SERVICE_VISUALS } from './visuals';

/**
 * One service panel: exactly the inner width of the frame, two columns.
 *
 * NOTHING HERE ANIMATES PER ELEMENT. The panel's opacity is driven as a whole
 * by the carousel timeline; the title, description, service list and CTA have
 * no entrance of their own. This is the single easiest place in the project to
 * slip into decoration (BUILD-PLAN Phase 7's first common mistake): the
 * horizontal translation already says *navigation*, and a stagger on top of it
 * says nothing new while costing frames during the most expensive segment.
 *
 * The panel is a real DOM article with real text — it is in the document from
 * first paint, for screen readers and for Phase 12's server-rendered copy —
 * not a canvas or an SVG label.
 *
 * ## Two variants, one component (Phase 9)
 *
 * `slide` is the carousel's panel, unchanged. `stacked` is the same content in
 * normal document flow: the reduced-motion path, the no-JS path and the
 * crawler's view, rendered by `ServiceList` inside `HeroStatic`.
 *
 * They share this component because BUILD-PLAN Phase 9's governing rule is "one
 * fallback, not two" — two implementations of a service card diverge the first
 * time the client changes a description, and the one nobody looks at is the one
 * that rots. What they must NOT share is the hooks the motion layer and the e2e
 * suite select on:
 *
 *   `.qx-panel`      -> `expandTimeline` drives its opacity; a stacked panel
 *                       caught by that selector gets dimmed to 0.25 by
 *                       `panelOpacity` for every index past the last step.
 *   `.qx-panel-cta`  -> `phase7-carousel.spec.ts` counts these, and `.qx-panel
 *                       li` and `.qx-panel svg`, against the carousel's own
 *                       content. Those locators are unscoped and count hidden
 *                       nodes too, so a stacked list wearing the same classes
 *                       adds five to each of the three.
 *
 * So the stacked variant carries `.qx-service-row` / `.qx-service-cta` instead.
 *
 * ## THIS IS THE PILLAR PANEL, AND THE SLIDER HAS SIX
 *
 * The sixth is `LaunchpadPanel`, which duplicates this component's slide layout
 * deliberately rather than becoming a third variant of it — see that file's
 * docblock, and `content/carousel.ts` for why Launchpad is not a `SERVICES`
 * entry. What it does NOT duplicate is anything on the stacked path: the
 * reduced-motion list is the five pillars, and this component is still the only
 * thing that renders there.
 *
 * The class swap WAS free while both names were pure selection hooks with no CSS
 * rule anywhere and an identical set of visual utilities. `.qx-service-row` still
 * is. `.qx-service-cta` is NOT: `app/globals.css` gives it a hit-area halo, and
 * this file gives it a wider top margin and a later two-column breakpoint —
 * because the stacked CTA is the only interactive target on a 3000px page that
 * the carousel's CTA never has to be, and a document-width card has no frame to
 * widen when the viewport narrows. The divergence is deliberate; each site of it
 * carries the reason.
 */

interface ServicePanelProps {
  service: ServiceCategory;
  index: number;
  total: number;
  /**
   * Panel width in px: the frame's inner width, so one panel fills the frame.
   * `slide` only — a stacked panel takes its width from the document, which is
   * the whole reason the static path can be a server component with no viewport.
   */
  width?: number;
  variant?: 'slide' | 'stacked';
}

export function ServicePanel({
  service,
  index,
  total,
  width,
  variant = 'slide',
}: ServicePanelProps) {
  const Visual = SERVICE_VISUALS[service.slug];
  const stacked = variant === 'stacked';

  // `01 / 06` is a READ HEAD: it says which of the slider's panels you are
  // currently looking at, which is true inside a snapped carousel and false in a
  // list where all of them are on the page at once. Stacked keeps the index — it
  // is part of the design language and it orders the pillars — and drops the
  // total, which on that path would also be the wrong number: the stacked list is
  // the five pillars and the slider is six panels.
  //
  // Phase 10 briefly shipped the total on the stacked card as well, hidden, for
  // a `scroll-snap` rail that would have made it true again — and removed it
  // with the rail. There is no presentation of this variant in which fewer than
  // five cards are on screen, so there is nothing for a read head to read.
  const counter = stacked
    ? String(index + 1).padStart(2, '0')
    : `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <article
      // `py-5` is 2.5rem — exactly the indicator strip's `h-5`, so the bottom
      // padding already reserves the strip and the list/CTA cannot run under it.
      // That was always true; what broke it was the indicator WRAPPING to three
      // lines on phones (80px tall against this 40px reservation). The strip is
      // now pinned to one line, so this original spacing is again sufficient.
      //
      // A stacked panel is INSIDE the frame rather than beside it: the carousel
      // travels through one big Q, and the list wears the same mark at card
      // scale, one per pillar. That replaces the `border-t border-qx-line` these
      // used to be separated by — a rule and a frame at the same seam is two
      // devices doing one job.
      //
      // The slide variant is untouched. It already sits inside the hero's Q at
      // full size, and a card frame in there would be the mark drawn inside
      // itself.
      className={
        stacked
          ? 'qx-service-row qx-frame qx-frame--card grid grid-cols-1 items-center gap-5 p-5 lg:grid-cols-[55fr_45fr]'
          : 'qx-panel grid shrink-0 grid-cols-1 items-center gap-5 px-4 py-5 sm:px-6 md:grid-cols-[55fr_45fr] xl:px-7'
      }
      // NEITHER VARIANT CARRIES A REVEAL ATTRIBUTE, for two different reasons.
      // A slide's opacity is owned by the carousel timeline and must have no
      // second owner — a CSS rule writing it shows up as a panel that will not
      // dim, three files from its cause. A stacked panel could take one safely,
      // but it would never fire: see the invariant in `ServiceList`.
      //
      // Opacity is therefore never set here at all, and `style` carries only the
      // slide's measured frame width — a resize re-render would otherwise snap
      // every dimmed panel back to full.
      style={stacked ? undefined : { width }}
      // `slide` is a lie in a document: there is nothing to slide between, and
      // announcing five slides in normal flow tells a screen-reader user to look
      // for a control that does not exist. The <h2> is the accessible name here.
      aria-roledescription={stacked ? undefined : 'slide'}
      aria-label={stacked ? undefined : `${counter} — ${service.title}`}
    >
      {/* `qx-panel-copy` / `qx-panel-visual` are SLIDE-ONLY selection hooks, and
          they are slide-only by necessity rather than by preference:
          `tests/unit/hero-static.test.ts` asserts the served static hero
          contains no `qx-panel` SUBSTRING at all, so a stacked card wearing
          either name fails that test by name. They also have no work to do
          there — the rules that use them are about fitting inside a frame, and
          a stacked card has no frame, only the document's own height.

          What they are for is `styles/short-viewport.css`: a panel in a frame
          shorter than its own content has to give something up, and the rules
          that decide what need to address the copy column and the diagram
          separately. Positional selectors (`> div:first-of-type`) would do it
          today and break the first time a third child is added. */}
      <div className={stacked ? 'flex flex-col gap-3' : 'qx-panel-copy flex flex-col gap-3'}>
        <p className="font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey">{counter}</p>
        {/* THE TITLE PROMOTES WITH THE MEASURE, NOT WITH THE VIEWPORT — and for
            the slide those are different numbers.

            Both variants used `md:text-2xl`, and for the slide that is the one
            width where the type scale and the column disagree. At exactly 768
            two things fire together: the panel takes its second column, and the
            title goes 34 -> 48px. So the copy column is at its NARROWEST in the
            entire design at the same moment the title is at its largest:

                390 phone, one column    copy 301px   34px, one line
                768 tablet, two columns  copy 255px   48px, WRAPS TO TWO

            A tablet giving the copy a narrower measure than a phone is the same
            absurdity the design pass fixed for the stacked card ("a TABLET
            SCROLLED FURTHER THAN A PHONE"), and here it cost height in a frame
            that has none to spare: the 48px title wrapped to 110px where one
            line is 55, and that wrap was almost exactly the missing slack. The
            worst panel cleared its frame by 7px at 768 and by 37 at 820.

            `lg` is where the frame stops widening at 0.84vw and the copy column
            has grown past the title's 376px measured width. Measured after:
            the same panels clear by 78px at 768 and 108 at 820.

            THE STACKED CARD KEEPS `md`, so this is the third place the two
            variants deliberately diverge. It is one column until `lg` and 816px
            wide at 768 — a 48px title fits there with room, and demoting it
            would shrink the static hero's type for a problem it does not have.
            The divergence list is in this file's docblock. */}
        <h2
          className={
            stacked ? 'text-xl text-qx-white md:text-2xl' : 'text-xl text-qx-white lg:text-2xl'
          }
        >
          {service.title}
        </h2>
        <p className="max-w-[42ch] font-body text-sm text-qx-grey md:text-md">
          {service.description}
        </p>

        {/* The seventeen real service areas live here — this list is why five
            panels can carry all of them without seventeen steps of scroll.

            The `max-[359px]` chip padding is the ONE typographic concession, and
            it is deliberately quarantined below every common phone width (360
            Android, 375 SE, 390/414 iPhone all keep the authored sizes). At 320px
            each chip still wraps to two lines and the longest panel overruns the
            frame by ~83px; tightening only the chips' own padding recovers that
            without touching a font size or letter-spacing anywhere. */}
        <ul
          className="flex flex-wrap gap-2 max-[359px]:gap-[3px]"
          aria-label={`${service.title} services`}
        >
          {service.services.map((name) => (
            <li
              key={name}
              // ALL THE VISUAL CLASSES STAY ON THE <li>, AND THAT IS A CSS
              // CONTRACT, not a preference. `styles/short-viewport.css` selects
              // `#qx-track .qx-panel-copy li` to tighten the chips' padding and
              // leading on a landscape phone, and the `max-[359px]` concession
              // here does the same on the narrow axis. Moving the box onto the
              // <a> would silently switch both rules off on the two viewports
              // they were measured for.
              //
              // `relative` is the only addition: it makes this the containing
              // block for the link's `::after`, which is what turns the whole
              // chip into the target rather than just the ~11 characters of ink.
              className="qx-service-chip relative rounded-sm border border-qx-line px-2 py-1 font-mono text-2xs text-qx-grey transition-colors hover:border-qx-green-dim hover:text-qx-white max-[359px]:px-1 max-[359px]:py-0 max-[359px]:leading-tight"
            >
              <a
                href={`${service.cta.href}#${sectionAnchor(name)}`}
                // The chip names a sub-service; the pillar page carries it as a
                // section with the same name, spelled the same way, locked by
                // `tests/unit/pillar-content.test.ts`. So the chip can address it
                // directly and the visitor lands ON the thing they tapped rather
                // than at the top of a page that mentions it somewhere.
                //
                // `after:inset-0` is the hit area: the <a> is inline and would
                // otherwise be as tappable as its text is wide, inside a chip
                // that looks like a button. Same technique as `.qx-service-cta`'s
                // halo, for the same reason — the box already exists, only the
                // events were missing.
                //
                // `pointer-events-auto` on the SLIDE only: the track's viewport
                // is `pointer-events: none` so wheel gestures reach window, and
                // every real control inside it opts back in individually. The
                // stacked card sits in ordinary flow with nothing to opt out of.
                className={
                  stacked
                    ? 'after:absolute after:inset-0 hover:text-qx-white focus-visible:text-qx-white'
                    : 'pointer-events-auto after:absolute after:inset-0 hover:text-qx-white focus-visible:text-qx-white'
                }
              >
                {name}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={service.cta.href}
          // One label on all five (§65: CTA wording must not change between
          // sections), so the accessible name has to carry the destination —
          // otherwise a screen reader offers five identical "Explore" links.
          aria-label={`${PILLAR_CTA_LABEL} ${service.title}`}
          // The track's viewport is pointer-events:none so intro clicks and
          // wheel gestures reach window; the CTA opts back in so it stays a
          // real link. (Focus scrolling the translated track into view is a
          // known Phase 11 problem, not this phase's.) Stacked sits in ordinary
          // flow with nothing suppressing its events, so it needs neither.
          //
          // THE STACKED CTA NEEDS MORE CLEARANCE THAN THE SLIDE'S, and a bigger
          // target. It follows a WRAPPED CHIP LIST in its own type register —
          // the chips above and this link are both `font-mono text-2xs uppercase
          // tracking-[0.28em]` at 12px, differing only by colour and a rule — so
          // at `gap-3` plus `mt-1` it read as a sixth chip row. `mt-3` makes the
          // gap 32px against 16px for every other gap in the column. Not `mt-4`:
          // 40px is exactly the card's own `p-5`, and the CTA would then sit as
          // far from the chips as from the card's edge.
          //
          // The HIT AREA is in `app/globals.css`, not here, because the ink
          // cannot move: `border-b` IS the affordance, and padding this box
          // would float the rule off the word it underlines.
          className={
            stacked
              ? 'qx-service-cta mt-3 w-fit border-b border-qx-green-dim pb-1 font-mono text-2xs uppercase tracking-[0.28em] text-qx-green'
              : 'qx-panel-cta pointer-events-auto mt-1 w-fit border-b border-qx-green-dim pb-1 font-mono text-2xs uppercase tracking-[0.28em] text-qx-green'
          }
        >
          {PILLAR_CTA_LABEL}
        </a>
      </div>

      {/* Static diagram. Hidden while the card is one column, where the copy is
          what matters — and the two variants reach that point at different
          widths, so this wrapper has to branch with the grid above it or the
          drawing becomes a full-width second row (its `viewBox="0 0 240 180"`
          has no intrinsic size and would scale to ~560x420).

          A STACKED CARD GOES TWO-COLUMN AT `lg`, NOT `md`, AND THE NUMBER IS
          MEASURED. The copy column is `0.55 x (min(vw,1024) - 128 - 80 - 40)` —
          286px at 768, 427px at 1024 and above. "Growth Marketing" at
          `text-2xl` measures 376px, so a two-column card needs about 932px of
          viewport before its own title fits on one line; `md` fired 164px early.
          At 768 three of five titles wrapped, the chips took a fourth row, and
          the 175px drawing sat in a 452px track with most of the right column
          empty — the rows summed to 2623px against 2434px at 375, so a TABLET
          SCROLLED FURTHER THAN A PHONE through the same five cards at twice the
          width. `md` is the CAROUSEL's boundary (`tailwind.config.ts`: "below
          this the carousel pin is not created") applied verbatim to the path
          that exists because the pin did not run.

          `lg` rather than a measured `min-[932px]` because the column stops
          growing at 1024: the two-column card is then only ever used at the one
          measure it was designed at, never at a squeezed intermediate.

          THAT IS NOW TRUE OF ONE BAND RATHER THAN ALL WIDTHS. `--qx-shell` steps
          to 1280 at `xl`, so this card is used at 1024 from `lg` to `xl` and at
          1280 above it — two measures, neither of them squeezed, because the
          step lands on a breakpoint rather than tracking the viewport. The
          reasoning survives; "the one measure" does not.

          THE SLIDE KEEPS `md` and cannot take the same fix: its width is the
          frame's inner width, and the frame's own answer to a narrow viewport is
          `FRAME_FRACTIONS` widening rather than dropping a column. So 768-1023 is
          the one band where the static path and the carousel lay the same content
          out differently.

          PHASE 10 RE-EXAMINED THIS AND KEPT `lg`. It was flagged as a stake in
          that phase's ground, to be decided rather than inherited. What settles
          it is that NO VISITOR SEES BOTH: at any width in 768-1023 the stacked
          card is reachable only under `prefers-reduced-motion`, where there is
          no carousel to disagree with, and the slide is reachable only without
          it, where the static hero is `display: none`. The two layouts are two
          audiences, not two states of one page. What would make this a real
          problem is a path on which both render, and there is none.

          Losing the drawing below `lg` costs nothing that is not already in the
          prose: it is `aria-hidden`, which is the same argument `LaunchStatic`
          makes for deleting its own diagram outright. */}
      <div
        className={
          stacked
            ? 'hidden text-qx-line lg:block'
            : 'qx-panel-visual hidden text-qx-line md:block'
        }
        aria-hidden="true"
      >
        {Visual ? <Visual /> : null}
      </div>
    </article>
  );
}
