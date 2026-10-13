import type { LaunchpadPanelContent } from '@/content/carousel';
import { LaunchpadVisual } from './visuals';

/**
 * The slider's sixth panel: Launchpad, §41–§43.
 *
 * MOTION PATH ONLY, and since `LaunchpadNote` was removed this is the only place
 * on the homepage that announces the product at all. A reduced-motion, JS-disabled
 * or crawling visitor sees `ServiceList`'s five pillars and reaches `/launchpad`
 * from the global footer instead — which is §63 as written. See `content/carousel.ts`.
 *
 * ## Why this is not a `ServicePanel` variant
 *
 * `ServicePanel` already has two variants and its docblock lists three places
 * they deliberately diverge. A third variant would have to branch on the counter
 * row (this one carries a status), the chip list (this one has a footnote), the
 * CTA label (this one is not the pillars' shared `Explore`) and the diagram
 * lookup (this one is not in `SERVICE_VISUALS`) — four branches in the one
 * component the reduced-motion path also renders, all of them dead on that path.
 *
 * ## What it MUST share, exactly
 *
 * Everything the motion layer and the CSS select on. This panel is a sibling of
 * five others inside a clipped, translated strip, so the hooks are a contract,
 * not a convention:
 *
 *   `.qx-panel`        `expandTimeline` drives its opacity (`#qx-track
 *                      .qx-panel`) and `panelOpacity` dims it by index. A panel
 *                      without this class travels at full strength while the
 *                      other five cross-fade.
 *   `.qx-panel-copy`   `styles/short-viewport.css` widens the copy column and
 *                      takes the compact type scale below 705px of height. See
 *                      the note on `<small>` below — that file selects the
 *                      description STRUCTURALLY, as "the <p> that is not the
 *                      first child", and this panel has to keep that true.
 *   `.qx-panel-visual` the same file `display: none`s the diagram so it leaves
 *                      the grid rather than holding its track open.
 *   `.qx-panel-cta`    `phase7-carousel.spec.ts` measures `.qx-panel-cta` on
 *                      EVERY `.qx-panel` against the indicator strip; a panel
 *                      without one crashes that test rather than failing it.
 *
 * The grid, the padding and the breakpoints are `ServicePanel`'s slide variant
 * verbatim, including `py-5` — 2.5rem, exactly `CarouselIndicator`'s `h-5`, which
 * is what reserves the strip so the CTA cannot run under it.
 */

interface LaunchpadPanelProps {
  content: LaunchpadPanelContent;
  index: number;
  total: number;
  /** Panel width in px: the frame's inner width, so one panel fills the frame. */
  width?: number;
}

export function LaunchpadPanel({ content, index, total, width }: LaunchpadPanelProps) {
  const counter = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <article
      // `ServicePanel`'s SLIDE VARIANT VERBATIM — the same grid, the same
      // breakpoint, the same padding. `py-5` is 2.5rem, exactly
      // `CarouselIndicator`'s `h-5`, and it is what reserves the strip so the CTA
      // cannot run under it.
      //
      // IT DIVERGED AT `lg` FOR ONE ROUND AND DOES NOT NEED TO. This is the
      // tallest panel of the six — chips for §42's six features against a
      // pillar's five, plus a footnote — and the track viewport's `overflow:
      // hidden` turns any overrun into a silently clipped CTA rather than visible
      // mess. Titled "QAVYX Launchpad" it went 0.5px over at 780 x anything, which
      // is the narrowest two-column layout there is (`md` fires at 768, so the
      // copy column is at its minimum on the panel with the most chips), and the
      // fix was one column through 768-1023 as the STACKED card does.
      //
      // Shortening the title to "Launchpad" removed the cause instead, so the
      // divergence was reverted. Re-swept 768-1120 wide across four heights, this
      // panel's worst clearance is 19.3px at 778 x 720 — and the tightest PILLAR
      // in the same band is 15.7px, so the sixth panel is no longer the binding
      // constraint in the design. Matching the five is worth more than the 14px
      // the `lg` version bought.
      //
      // ONE BAND IS LEFT AND IT IS NOT THIS PANEL'S TO FIX. Swept 320-1920 wide
      // across twelve heights, everything still over budget is at a viewport
      // height of 380-420px, where the PILLARS are over too (Growth Marketing by
      // 14.1px at 320x420). That regime predates this panel and is outside the set
      // the design is held to: `short-viewport.css` was measured against heights
      // 600-800 plus the 844x390 landscape phone, and the e2e sweep's shortest
      // portrait size is 320x568.
      //
      // The one band where this panel is alone is 340-520 wide by 380-420 tall,
      // where it runs 0.1-61.5px over while the pillars fit. Nothing is that
      // shape: a 380px-tall viewport at 360 wide is a hand-resized desktop window,
      // and every real landscape phone is at least 568 wide. Closing it means
      // taking a chip row off a list of six strings the client wrote. Recorded
      // rather than chased.
      className="qx-panel grid shrink-0 grid-cols-1 items-center gap-5 px-4 py-5 sm:px-6 md:grid-cols-[55fr_45fr] xl:px-7"
      style={{ width }}
      aria-roledescription="slide"
      // The status is in the accessible name because it is the panel's most
      // material fact: a screen-reader user should not have to reach the CTA to
      // learn that this one destination has not shipped.
      aria-label={`${counter} — ${content.title}, ${content.status}`}
    >
      <div className="qx-panel-copy flex flex-col gap-3">
        {/* THE STATUS RIDES THE COUNTER ROW rather than taking a line of its own,
            and that is a `short-viewport.css` constraint as much as a design one.
            That file styles the description as `.qx-panel-copy > p:not(:first-child)`
            — structural, because "the copy column's children are always [counter,
            title, prose, chips, cta]". A separate eyebrow <p> would be caught by
            that selector and blown up from 12px to 16px on a landscape phone.

            The treatment — label, dim em dash, status in `--qx-green-dim` — is
            inherited from `LaunchpadNote`, the homepage line that used to announce
            this product and has since been removed. The casing came from there
            too: the status is NOT uppercased or tracked, which is why it undoes
            both from the parent. With that line gone this panel is the only place
            on the site that says "Coming Soon" out loud, so the treatment is now
            its own rather than half of a pair. */}
        <p className="font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey">
          {counter}
          <span aria-hidden="true" className="px-2 text-qx-line">
            —
          </span>
          <span className="normal-case tracking-normal text-qx-green-dim">
            {content.status}
          </span>
        </p>
        {/* `lg:text-2xl` — `ServicePanel`'s slide title verbatim, and it can be
            because the title is one short word.

            THIS BRIEFLY NEEDED `xl` AND NO LONGER DOES, which is worth recording
            because it is the same measurement read twice. `ServicePanel`'s rule is
            "the title promotes with the MEASURE, not with the viewport", and while
            this panel was titled "QAVYX Launchpad" that string wrapped to two
            lines through 1024-1279 (110.4px against 55.2) on the one panel with no
            height to spare — 5.5px of clearance at 1100 x 768, under one chip row.
            Demoting it to `xl` bought the 55.2px back.

            Dropping "QAVYX" bought the same pixels at the source: "Launchpad" fits
            the ~380px copy column on one line at every width where a pillar's
            title does. So the panel keeps the pillars' own breakpoint and there is
            no width at which its title is a different size from its neighbours'. */}
        <h2 className="text-xl text-qx-white lg:text-2xl">{content.title}</h2>
        <p className="max-w-[42ch] font-body text-sm text-qx-grey md:text-md">
          {content.description}
        </p>

        {/* THE LIST AND ITS FOOTNOTE ARE ONE CHILD OF THE COLUMN, NOT TWO, and
            that is a measurement as much as a typographic preference.

            This panel is the tallest of the six by some distance: six chips
            against the longest pillar's five, plus a footnote. Measured at 1024 x
            768 — the tightest viewport in the design, where the frame has hit its
            620px cap while the copy column is at its narrowest two-column
            width — the column came to 525.1px against a 522px content box. It
            OVERFLOWED BY 3.1px, which `overflow: hidden` on the track viewport
            would have turned into a silently clipped CTA rather than visible
            mess. That is the exact failure `styles/short-viewport.css` exists to
            fix, at a height its 705px query does not cover.

            Wrapping the pair recovers 12 of those pixels: as two children of a
            `gap-3` column the footnote cost a full 16px gap, and as a `gap-1`
            pair it costs 4. It is also simply where a footnote belongs — closer
            to the list it qualifies than that list is to the CTA — so the
            hierarchy this fixes was wrong before it was too tall.

            The copy column's top-level children are therefore still five,
            [counter, title, prose, chips, cta], which is the structure
            `short-viewport.css` selects the description by (`> p:not(:first-child)`).
            Its `li` rule is a descendant selector and reaches the chips through
            this wrapper unchanged. */}
        <div className="flex flex-col gap-1">
          {/* §42's six, in the chip vocabulary the other five panels use. Same
              classes, including the `max-[359px]` padding concession.

              THESE ARE THE ONE SET OF CHIPS THAT ARE NOT LINKS, and the
              difference is deliberate rather than an omission. A pillar's chips
              address a section of that pillar's page by name —
              `tests/unit/pillar-content.test.ts` locks the two lists together, so
              the destination provably exists. These are §42's features of a
              product that has not shipped: `/launchpad` has no section per
              feature to land on, and pointing all six at the page itself would be
              six links to where the CTA below already goes.

              So they carry no `hover:` treatment either. The pillars' chips
              brighten their border on hover and these do not, which is the honest
              signal that one set is a control and the other is a list. */}
          <ul className="flex flex-wrap gap-2 max-[359px]:gap-[3px]" aria-label="What's coming">
            {content.features.map((feature) => (
              <li
                key={feature.label}
                className="rounded-sm border border-qx-line px-2 py-1 font-mono text-2xs text-qx-grey max-[359px]:px-1 max-[359px]:py-0 max-[359px]:leading-tight"
              >
                {feature.label}
                {/* Decorative: the footnote below is read in order anyway, and a
                    screen reader announcing "asterisk" mid-label is noise. */}
                {feature.footnoted ? <span aria-hidden="true">*</span> : null}
              </li>
            ))}
          </ul>

          {/* A <small>, and NOT a <p>, for the structural reason in the note on
              the counter row: `short-viewport.css` sizes every non-first <p> in
              this column as the description. It is also what the element is
              for — a material qualification on the most attractive item in the
              list, which `content/launchpad.ts` insists must never be printed as
              a bare dangling asterisk. */}
          <small className="font-mono text-2xs leading-tight text-qx-grey">
            <span aria-hidden="true">*</span>
            {content.note}
          </small>
        </div>

        <a
          href={content.cta.href}
          // `pointer-events-auto` for the same reason as the pillars': the track's
          // viewport suppresses events so intro clicks and wheel gestures reach
          // window, and a CTA has to opt back in to stay a real link.
          //
          // No `aria-label` override. The pillars need one because five identical
          // "Explore"s tell a screen reader nothing; this label is unique on the
          // page and names its own destination.
          //
          // AND NO `mt-1`. A pillar's slide CTA carries one because it follows a
          // wrapped chip list in its own type register — same 12px mono, same
          // 0.28em tracking, differing only by colour — so without the extra 4px
          // it reads as one more chip row. This CTA follows the FOOTNOTE, which
          // is neither boxed nor tracked and already separates the two registers;
          // the 4px would be spacing with no job, on the one panel measured 3.1px
          // over its frame. See the note on the list wrapper above.
          className="qx-panel-cta pointer-events-auto w-fit border-b border-qx-green-dim pb-1 font-mono text-2xs uppercase tracking-[0.28em] text-qx-green"
        >
          {content.cta.label}
        </a>
      </div>

      {/* `md:block`, matching the grid above it. It has to branch with the grid
          or the drawing becomes a full-width second row: its `viewBox="0 0 240
          180"` has no intrinsic size and would scale to ~560x420. */}
      <div className="qx-panel-visual hidden text-qx-line md:block" aria-hidden="true">
        <LaunchpadVisual />
      </div>
    </article>
  );
}
