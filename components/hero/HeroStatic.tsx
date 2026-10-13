import { NavLogo } from '@/components/nav/NavLogo';
import { ServiceList } from '@/components/services/ServiceList';
import { HERO_COPY } from '@/content/home';

/**
 * The hero as a document: the finished mark, the positioning line, and the five
 * pillars in normal flow.
 *
 * This is the `prefers-reduced-motion` path, the no-JS path and the crawler's
 * view of the hero — ONE fallback, not three, which is BUILD-PLAN Phase 9's
 * governing rule. It is server-rendered UNCONDITIONALLY and hidden by CSS when
 * the motion layer is going to run (`app/globals.css`), the same relationship
 * `LaunchStatic` already has with the launch sequence: the content is the
 * document, and the animation is an enhancement layered over it.
 *
 * Hiding it in CSS rather than in JS is what stops a full-motion visitor seeing
 * a flash of the static version — the decision is taken before first paint,
 * where a `useState` + effect could only take it after one. That flash is
 * exactly the failure BUILD-PLAN's "SSR default of `true`" mistake note is
 * about, and it is the reason the criterion "no flash" and the criterion "no-JS
 * DOM equals reduced-motion DOM" are compatible at all.
 *
 * ## The mark is at LOGO SIZE, not at the frame's 70%
 *
 * BUILD-PLAN Phase 9 says both — "frame at 70% immediately" in the acceptance
 * list, and "with no pin the Q sits at logo size with its gap open" in the
 * aperture re-pointing above it. The re-point is the newer statement and it is
 * the one that survives contact with the rest of the phase:
 *
 *   - `computeFrameGeometry` needs viewport pixels, so a 70% frame cannot be
 *     server-rendered, and the no-JS criterion dies with it.
 *   - The 70% frame is the WORKSPACE — a container for the carousel travelling
 *     inside it. With no carousel to hold it is an empty rounded rectangle
 *     seven-tenths of the screen, which is within a shade of the "black
 *     rectangle" the same section warns against drawing.
 *   - The expansion is the thing reduced motion is being spared. Rendering its
 *     end state as if it had happened is answering "no motion" with "the motion
 *     already finished", which is a different page, not a calmer one.
 *
 * ## `NavLogo`, not a third drawing of the mark
 *
 * `NavLogo` is already a server component, already viewport-free (authored in
 * the wordmark's own 2255 x 357 space so the `viewBox` IS the measurement), and
 * already derives its dash from `frameOpenFraction` so the Q is open here for
 * the same reason it is open everywhere. `QFrame` cannot be reused: it holds a
 * `useRef` to freeze `d` against the pinned timeline, which makes it a client
 * component. Drawing the mark a third time is how the three drift apart.
 *
 * The glyph in the Q's opening comes with `NavLogo` — bowl, cord, white body,
 * green tip. This file used to argue the gap should stay empty "as it does in
 * the navbar"; `NavLogo` quotes that argument in full and overrules it, because
 * the client's own artwork is two connected components and the bowl alone reads
 * as a rounded rectangle with a corner missing. The reasoning lives there and is
 * not restated here — the last time it was written in two places the two
 * disagreed, and this was the copy that went stale. (There is also no navbar:
 * `NavLogo` renders in exactly two places, `Footer` and this file.)
 * `text-qx-white` below feeds `currentColor`, so it colours the mouse's BODY as
 * well as the frame's stroke, while the tip stays pinned to `--qx-green`.
 *
 * ## LEFT-SET, because this is the document and not the poster
 *
 * `LaunchTitle` centres this same string on the motion path, over a pinned
 * full-bleed stage. Here the mark and the line are the head of a LEFT-SET
 * COLUMN: every frame below them starts at the container's left edge, and a
 * centred masthead put four left edges within 74px of each other — at 1440 the
 * mark began at 346, its line's glyphs at ~304, the card frames at 272 and the
 * card text at 312. Near-misses read as misalignment, not as two registers.
 * `InnerPage`'s <header> is this site's grammar for a title block and it is
 * left-set; centring stays reserved for `TrustStrip`, which is a single
 * announcement line rather than a block. (It used to be reserved for two — the
 * other was `LaunchpadNote`, since removed.)
 *
 * ## The spacing ladder
 *
 * 96 to open the page, 24 between the parts of one object, 40 across the seam
 * inside a block, 64 between blocks — `InnerPage`'s own ladder, and every value
 * is on the 1-7 token scale. Before this the hero spent 96 twice and 64 between
 * the mark and its own line, so its loudest internal seam was louder than the
 * seam to the next section, and the five pillars read as a third unrelated
 * block rather than as the rest of this one.
 */
export function HeroStatic() {
  return (
    // The same container as `LaunchStatic` — this is the section directly above
    // it and the two must share a measure, or the document steps in and out at
    // the seam.
    <div id="qx-hero-static" className="mx-auto max-w-[var(--qx-shell)] px-4 md:px-6">
      {/* `pt-7` is the page-opening measure — `InnerPage` opens every inner
          route with `py-7`, and there is no navbar above this, so the homepage's
          first content must not open tighter than every other page's. `pb-5` is
          the seam to the pillars, and it is deliberately SMALLER than the 64px
          the next boundary brings: a block's loudest internal gap must not exceed
          the gap to the block after it.

          THE 64px STILL ARRIVES, FROM A DIFFERENT COMPONENT. It used to be
          `LaunchpadNote`'s `pt-6`; that section was removed, and `TrustStrip` —
          now the first thing after the pin — carries its own `pt-6` (the same
          `--qx-space-6`, 4rem). So the ladder is unchanged and this `pb-5` needs
          no compensating value. Verify before altering either. */}
      <section className="pb-5 pt-7">
        {/*
          Width tracks `logoWidthFor`'s intent — 52vw, floored so the mark stays
          legible on a phone and capped at the container's own measure — but
          expresses it in CSS rather than importing the function, because there
          is no viewport here to pass it and nothing to hand off to.
          `logoWidthFor`'s exact clamps exist to let the poster's mark meet a
          travelling cursor at a measured point; this one only has to look right.

          THE CEILING IS THE COLUMN, and it is now DERIVED rather than typed. It
          read `56rem` — 896px, which was `max-w-5xl` (1024) less two `md:px-6`
          (--qx-space-6, 4rem each). The old 900px before that was chosen against
          the window rather than against this column: it overshot by 4px and was
          silently caught by `max-w-full`.

          The point of the number is that the mark is exactly co-extensive with
          the card frames below it once 52vw reaches the cap. A literal held that
          for as long as the column was 1024 and stopped the moment `--qx-shell`
          gained a step at `xl`, so the arithmetic itself is in the class now:
          `calc(var(--qx-shell) - 2 * var(--qx-space-6))`, which is 56rem below
          1280px and 72rem above it, and cannot go stale again.

          Nothing moves on any screen narrower than ~1723px, which is where 52vw
          first reaches even the old cap — the clamp resolves to 52vw on every
          laptop either way.

          THE FLOOR IS ITSELF CAPPED AT 72vw, and that is not cosmetic parity: a
          bare `20rem` floor is 320px on a 390px phone, which is the same 87%
          poster the motion path was fixed for. `min(22.5rem, 72vw)` is
          `PHONE_MAX_FRACTION` said in CSS, and 22.5rem is the 360px floor —
          so this now resolves to `logoWidthFor`'s own number at every width
          rather than to something that merely looked similar on a laptop.

          `text-qx-white` feeds `currentColor`: at logo size the frame's stroke
          is `--qx-white` (`FRAME_STROKE_REST`), which is what the mark is before
          the expansion ramps it to `--qx-green-dim`. Green here would be the
          workspace's colour on the brand's shape.
        */}
        <NavLogo
          instance="hero-static"
          className="block w-[clamp(min(22.5rem,72vw),52vw,calc(var(--qx-shell)_-_2_*_var(--qx-space-6)))] max-w-full text-qx-white"
        />

        {/* §3.1's positioning line. It is `LaunchTitle`'s string, and this is
            the only place it is reachable without scrubbing a pin — the one
            piece of real content the pinned sequence held that had no home in
            the document. A <p>, not a heading, for LaunchTitle's own reason: the
            <h1> is server-rendered in app/page.tsx and a title card has no
            section under it.

            `.qx-display` AND NOT `font-display`, and that is the whole point of
            the class: being a <p> is exactly what was costing this string its
            display leading, tracking and weight. See `app/globals.css`.

            `mt-4`, not `mt-6`. At 375 the mark is 43px tall, so 64px below it
            was a canyon with the wordmark stranded above it; 24px puts the line
            inside the mark's own height and the two read as one lockup. */}
        <p className="qx-display mt-4 text-2xl text-qx-white md:text-3xl">
          {HERO_COPY.eyebrow}
        </p>
      </section>

      <ServiceList />
    </div>
  );
}
