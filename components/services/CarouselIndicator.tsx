'use client';

import { PANEL_COUNT } from '@/content/carousel';
import { goToPanel } from '@/motion/paging';
import { useHeroStore } from '@/state/heroStore';

/**
 * `03 / 06` bottom-left of the frame, a six-segment rule bottom-right — and
 * since the client asked for it, the slider's PAGINATION rather than only its
 * read-out. Tapping a segment scrolls the page to that panel.
 *
 * This is the ONLY component that re-renders during the carousel, and it must
 * do so exactly five times across the whole 375vh segment — once per step, not
 * once per frame. Two things make that true:
 *
 *  1. it selects ONLY `activeService`, so nothing else in the store wakes it;
 *  2. `setActiveService` is a no-op on an unchanged value (state/heroStore), so
 *     the 60-per-second writes from the scroll onUpdate collapse to 5.
 *
 * Drop either and this becomes ~300 renders and the profiler shows it.
 *
 * THE HANDLERS DO NOT COST A RENDER. They are inline arrows, so each render
 * makes six new closures — which would matter if the children were memoised and
 * are free here, because they are host elements React diffs by props anyway.
 * What would break the budget is state: a `useState` for hover or pressed, or a
 * second store selector. There is neither. `goToPanel` reads the live scroll
 * position through ScrollTrigger rather than anything in this component, so the
 * click needs nothing from the render.
 *
 * ## Why buttons and not a `<nav>`
 *
 * This is not navigation, it is a control for one section, and this site holds
 * itself to one navigation landmark above the footer (`SiteIndex` refuses a
 * second one for the same reason; `phase8c-shell.spec.ts` asserts there is no
 * header and no `#qx-nav`). It is not a tablist either — the panels are not
 * tabpanels and never receive focus as such; they are `aria-roledescription`
 * slides. So: a labelled `group` of buttons, which claims exactly what it is.
 *
 * ## THE FLOATING WHATSAPP BUTTON SITS ON TOP OF THIS, ON SMALL PHONES
 *
 * `.qx-whatsapp` is `position: fixed` bottom-right at `z-float`, 48px plus a
 * 24px inset. On a narrow, short viewport the design frame nearly fills the
 * screen, so the frame's bottom-right corner — which is where this strip lives —
 * lands underneath it. Measured, by hit-testing every segment's centre:
 *
 *     320x568   segments 5 and 6 unreachable
 *     340x600   segment 6 unreachable
 *     360x640   segment 6 unreachable
 *     375x667   segment 6 unreachable
 *     390x844   and everything wider: clear
 *
 * That overlap has always existed and never mattered, because until now these
 * were decoration. The moment they became controls it meant two of six panels
 * could not be reached by tap on the smallest phones, which is the kind of bug
 * that never shows up in a screenshot.
 *
 * The fix is to get out of the button's way rather than to sit on top of it: the
 * WhatsApp CTA is §61 and the site's primary conversion, so raising this above
 * it would trade a broken control for a broken CTA. Below 390px the strip keeps
 * the float's whole footprint clear on its trailing edge and DROPS THE COUNTER,
 * because at 320px the strip is already over-full — 254px of content in 238px of
 * content box — and there is no arrangement that fits a 77px read head and six
 * 24px segments outside the float's 72px. The counter is the right thing to give
 * up: it is `aria-hidden` decoration, and the same `01 / 06` is printed in the
 * panel's own copy column directly above it, so nothing is actually lost.
 *
 * ## What stays `aria-hidden`, and why it is not all of it
 *
 * The strip used to be `aria-hidden` whole. It cannot be now — a focusable
 * control inside an aria-hidden subtree is the classic broken combination, and
 * the buttons ARE focusable. So the hiding moved down to the one part that is
 * genuinely redundant: the `01 / 06` counter, which repeats what every panel
 * already carries in its own `aria-label`. The buttons name the panels instead.
 */
export function CarouselIndicator() {
  const active = useHeroStore((s) => s.activeService);

  return (
    <div
      // h-5 (2.5rem) is the strip's contract with ServicePanel's `pb-5`: the panel
      // reserves exactly this much so the two can never overlap. Both are on the
      // --qx-space scale; a raw Tailwind number here would silently drift from it.
      //
      // `pointer-events: none` STAYS ON THE STRIP. The buttons opt back in
      // individually, exactly as `.qx-panel-cta` does — so the dead space between
      // and around the segments still passes wheel gestures and intro clicks
      // through to window, and only the controls themselves take a tap.
      className="qx-indicator pointer-events-none absolute inset-x-0 bottom-0 flex h-5 items-center justify-between gap-3 px-4 pb-2 max-[389px]:justify-end max-[389px]:pe-[calc(var(--qx-float-size)+var(--qx-float-inset))] sm:px-6 xl:px-7"
    >
      {/* nowrap + shrink-0: at the mobile frame's width `justify-between` used to
          squeeze this counter until its 0.28em tracking broke "02 / 06" across
          THREE lines, which is what made the strip 80px tall and drove it up
          through the panel's list and CTA.

          `aria-hidden` here rather than on the strip: it is a read-out of state
          the buttons beside it already announce, and every panel's own
          `aria-label` opens with the same "03 / 06". Three readings of one fact
          is noise. `phase7-carousel.spec.ts` reads this <p>'s text, so it stays a
          <p> inside `.qx-indicator`. */}
      <p
        className="shrink-0 whitespace-nowrap font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey max-[389px]:hidden"
        aria-hidden="true"
      >
        <span className="text-qx-white">{String(active + 1).padStart(2, '0')}</span>
        {` / ${String(PANEL_COUNT).padStart(2, '0')}`}
      </p>
      <div className="flex shrink gap-1" role="group" aria-label="Services carousel">
        {Array.from({ length: PANEL_COUNT }, (_, i) => (
          <button
            key={i}
            type="button"
            data-active={i === active ? 'true' : 'false'}
            // `aria-current` and not `aria-pressed`: these are not six toggles,
            // they are six positions of which one is where you are. That is what
            // `current` means, and it is what a screen reader will read as
            // "current item" rather than "pressed".
            aria-current={i === active ? 'true' : undefined}
            aria-label={`Panel ${i + 1} of ${PANEL_COUNT}`}
            onClick={() => goToPanel(i)}
            // THE BUTTON'S LAYOUT BOX IS THE 2px INK, and the tap target is an
            // absolutely-positioned `::after` in `app/globals.css`. Same technique
            // and same reason as `.qx-service-cta`: the ink cannot move. Padding
            // this box would grow the strip past `h-5` and break its contract with
            // the panel's `pb-5` — the exact overlap that contract exists to
            // prevent. The hit area grows; the drawing does not.
            className="qx-indicator-seg pointer-events-auto relative h-[2px] w-4 bg-qx-line transition-colors data-[active=true]:bg-qx-green hover:bg-qx-grey data-[active=true]:hover:bg-qx-green md:w-6"
          />
        ))}
      </div>
    </div>
  );
}
