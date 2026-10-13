import { SplitText } from '@/components/text/SplitText';
import { HERO_COPY } from '@/content/home';
import { TITLE_LINE_CLASS } from '@/types/hero';

/**
 * The title card: §3.1's positioning line, "Digital Growth Launchpad".
 *
 * The camera has just passed out through the Q's gap and the screen is empty.
 * This names what is about to happen, and then the rocket shows it. Without it
 * the aperture simply stops and a vehicle appears.
 *
 * ## A FIXED LAYER, not a section in normal flow
 *
 * `#qx-hero` is an empty pinned section and every visual the pin drives is a
 * `position: fixed` sibling of it. A card in normal flow would scroll away in
 * the first 100vh while the pin held everything else still for 940 — and
 * anything placed INSIDE a pinned subtree stops being fixed at all, because the
 * pin's transform becomes its containing block.
 *
 * Three rules it shares with `HeroCopy`, and all three are load-bearing:
 *
 * 1. **`pointer-events: none`.** This is a full-viewport fixed element. Without
 *    it, it sits on top of every section below the pin and eats their clicks —
 *    which is exactly what `#qx-stage` once did to the entire site navigation,
 *    and what `phase8c-shell.spec.ts` now guards. There is nothing interactive
 *    in here, so nothing opts back in.
 *
 * 2. **Opacity is GSAP's, never set here.** The reveal and the clear are two
 *    points on the pin's scrubbed timeline. A `style={{opacity}}` here would be
 *    re-asserted by every resize re-render and fight the scrub.
 *
 * 3. **It must be CLEARED, not merely faded past.** Anything the pin leaves
 *    painted covers every section below it for the rest of the page — the same
 *    root cause as the green trajectory that once ran through the site index.
 *
 * ## Not an `<h1>`, and not an `<h2>`
 *
 * The document's `<h1>` is server-rendered in `app/page.tsx`. This is a card
 * that exists for ~45vh of one scrubbed segment, so promoting it to a heading
 * would insert a section into the outline that has no section under it. A `<p>`
 * with display type says what it is: a title card.
 *
 * `visibility: hidden` at rest keeps it out of the accessibility tree until it
 * is on screen — a state, not a permanent exclusion. Making it reachable without
 * scrolling the pin is the reduced-motion path's problem, which Phase 9 owns for
 * every pinned beat at once.
 *
 * ## `h-svh`, NOT `inset-0`, AND THAT IS THE FOURTH SHARED RULE
 *
 * This card is the only thing on screen at its beat, and it is CENTRED in its
 * container — so the container's height is the card's position. `inset-0` makes
 * that height the live viewport, which on a phone grows the moment the URL bar
 * hides: measured at 390x750 -> 390x840, the line jumped 45px, exactly half the
 * bar. Everything else in the hero is frozen against that move — the SVG stage
 * has no viewBox and the timelines read `motionViewport()` — and a title card
 * re-centring on its own is the same two-viewports inconsistency in CSS.
 *
 * `100svh` is the height with the bars SHOWING, which is the project's answer
 * everywhere the URL bar must not move something: `body`, `#qx-hero-reserve` and
 * `#qx-hero` itself all carry it. So the card sits where it sat, and with the
 * bar hidden it is 45px above true centre — which is exactly where the frozen
 * frame is, and agreeing with the rest of the hero is the point.
 *
 * `HeroCopy` deliberately keeps `inset-0`: its two labels are edge-anchored
 * (`top-8` / `bottom-8`), and a scroll cue is SUPPOSED to hug the bottom of the
 * visible area rather than a remembered one. Centred content and anchored
 * content want opposite things here.
 */
export function LaunchTitle() {
  return (
    <div
      id="qx-launch-title"
      className="pointer-events-none invisible fixed inset-x-0 top-0 h-svh z-copy opacity-0"
    >
      <div className="absolute inset-0 flex items-center justify-center px-6">
        {/* Split per character so the line can ASSEMBLE as the card comes up
            rather than simply fade — the timing is `titleCharProgress` in
            `motion/timelines/titleTimeline.ts`, off the same scrubbed proxy that
            owns the card's own opacity.

            The spans are inline and carry no styles of their own, so this line
            wraps and kerns exactly as the plain string did; `SplitText` explains
            why that matters and how the sentence stays readable to a screen
            reader. Nothing here needs the card to be animated: with no pin, the
            characters are simply the line. */}
        {/* `TITLE_LINE_CLASS` is the hook the green sweep hangs off — see
            `styles/title-shine.css`. It carries no styles at rest, so the
            served line is exactly the white type it always was; the gradient
            only exists while the pin has added `TITLE_SHINE_CLASS` to the
            container above, which is the beat where the characters have
            finished assembling. */}
        <p
          className={`${TITLE_LINE_CLASS} max-w-[18ch] text-center font-display text-2xl text-qx-white md:text-3xl`}
        >
          <SplitText text={HERO_COPY.eyebrow} />
        </p>
      </div>
    </div>
  );
}
