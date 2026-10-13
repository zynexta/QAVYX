import { PIN_A } from '@/motion/scrollBudget';
import type { gsap } from '@/motion/gsap';
import { SPLIT_CHAR_CLASS, TITLE_SHINE_CLASS, type StageRefs } from '@/types/hero';

/**
 * The title card: §3.1's positioning line, between the fly-through and the
 * launch.
 *
 * The camera has just passed out through the Q's gap and the screen is empty.
 * "Digital Growth Launchpad" names what is about to happen, and then the rocket
 * shows it. Without the card the aperture simply stops and a vehicle appears;
 * with it, the two acts are joined by a sentence.
 *
 * Intent (Global Gate 6): the card is CONFIRMATION — it is the only still frame
 * in the whole pin, and it earns that by being the one moment the piece states
 * plainly what it has been arguing.
 *
 * ## Gone before ignition, not fading under the rocket
 *
 * A title and the thing it titles must not share the screen. The hold is what
 * makes it a card someone reads rather than a caption that flashes past, and the
 * clear finishes inside its own 60vh so that the launch segment opens on nothing.
 *
 * Same discipline as the aperture and the launch — ONE proxy, every output a
 * pure function of its position — for the same reason: `onRefresh` re-emits every
 * segment at the current progress, so two tweens writing one property race there
 * and the winner depends on timeline order rather than on intent.
 */

/**
 * The segment's length, and its sub-beats, in vh.
 *
 * MUST MATCH the `title` row of `PIN_A`. The row is the source of truth for how
 * much scroll the card owns; these three say how it is spent inside that.
 * `title-card.test.ts` asserts they agree, because a `VH` here that is smaller
 * than the row's silently ends the whole card partway through the segment and
 * leaves the rest of it holding nothing.
 */
const VH = 120;

/**
 * In over 40vh, held for 55, out over the last 25.
 *
 * These were 15 / 30 / 15 across a 60vh segment — the same proportions, at half
 * the distance, and the card was gone in about five wheel notches. The entrance
 * took the largest share of the increase because it is the part that carries
 * information: `titleCharProgress` assembles twenty-two characters across it,
 * and at 15vh the stagger was over before the eye had found the line.
 *
 * The clear stays the shortest of the three. It is the one part with nothing to
 * read, and an exit that outlasts its entrance reads as hesitation.
 */
const IN_END = 40;
const HOLD_END = 95;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Where the card is fully up, as a pin progress — for tests that must not
 *  hard-code a decimal. */
export const TITLE_HELD = PIN_A.at('title', IN_END / VH);

/**
 * The same two boundaries as SEGMENT-LOCAL positions, which is what every pure
 * function in this file takes. Exported for the same reason `TITLE_HELD` is: a
 * test that types `0.25` stops addressing the end of the ramp the moment the
 * knob moves, and keeps passing while it does.
 */
export const TITLE_IN_END = IN_END / VH;
export const TITLE_HOLD_END = HOLD_END / VH;

/** What the row in `PIN_A` must say, so the two cannot drift apart. */
export const TITLE_VH = VH;

/** The card's opacity at segment position `t`: in, held, out. */
export function titleOpacity(t: number): number {
  const vh = clamp01(t) * VH;
  if (vh < IN_END) return vh / IN_END;
  if (vh < HOLD_END) return 1;
  return 1 - (vh - HOLD_END) / (VH - HOLD_END);
}

/* ---------------------------------------------------------------------------
   The line assembling, character by character.
   ---------------------------------------------------------------------------
   The card used to fade in as one block. It now resolves out of blur one
   character at a time across the SAME 15vh ramp — nothing was re-timed, and
   `titleOpacity` above is untouched, so every existing assertion about when the
   card is painted still addresses the thing it was written for.

   Intent (Global Gate 6): CONSTRUCTION. The intro already builds the wordmark
   one glyph at a time; this is the same sentence at reading size, and the piece
   has been arguing for 800vh that things get assembled rather than appear. A
   blur-in with no stagger would be an effect; a line that types itself into
   focus is the card being written.

   ## The two ramps multiply, and that is deliberate

   `titleOpacity` still takes the container 0 → 1 over the in-ramp, and each
   character's own progress rides on top of it. The product is what gives the
   early characters a soft presence while the later ones are still absent —
   which reads as the line resolving left to right rather than as twenty-two
   independent fades. Flattening the container to 1 and letting the characters
   carry everything was the other option; it would have meant re-timing a tested
   segment to gain a difference nobody can see.

   ## Why blur is affordable HERE and nowhere else in the pin

   `filter: blur()` costs a layer and a shader pass per element per frame, which
   is why nothing else in this project animates it. The title card is the one
   segment that can pay: it is the only still frame in the pin, the frame is off
   the viewport, the carousel is hidden and the rocket has not started — twenty-
   two inline spans of ~30px is the entire compositing load on screen. It is also
   bounded to the in-ramp: past it the characters are RESET to their served
   state and the hold and the clear cost nothing at all.                       */

/** How much of the in-ramp is spent offsetting one character from the next. */
const CHAR_SPREAD = 0.62;

/** What a character starts blurred by, in px. */
export const CHAR_BLUR = 8;

/**
 * One character's own 0 → 1 reveal inside the card's in-ramp.
 *
 * Pure, and exported, for the same reason every other value in this file is:
 * `onRefresh` re-emits the whole segment at the current progress, so anything
 * derived from the proxy has to give the same answer whichever direction the
 * playhead arrived from.
 */
export function titleCharProgress(t: number, index: number, count: number): number {
  if (count <= 1) return charRampProgress(t) >= 1 ? 1 : charRampProgress(t);
  const p = charRampProgress(t);
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const start = (CHAR_SPREAD * index) / (count - 1);
  return clamp01((p - start) / (1 - CHAR_SPREAD));
}

/** Position within the in-ramp alone: 0 at the segment's start, 1 at `IN_END`. */
export function charRampProgress(t: number): number {
  return clamp01((clamp01(t) * VH) / IN_END);
}

export interface TitleTargets {
  launchTitle: StageRefs['launchTitle'];
}

/** Append the title card to the master timeline at its absolute pin position. */
export function addTitleSegment(tl: gsap.core.Timeline, refs: TitleTargets): void {
  const { launchTitle } = refs;
  const start = PIN_A.startOf('title');
  const proxy = { t: 0 };

  // Resolved once. The card is server-rendered inside `HeroSection`, so the
  // spans exist before the pin is built; an empty list simply means the split
  // was removed, and the segment then behaves exactly as it did before it.
  const chars = Array.from(launchTitle.querySelectorAll<HTMLElement>(`.${SPLIT_CHAR_CLASS}`));

  // Past the ramp the characters are RESET rather than re-written every frame:
  // 45 of the segment's 60vh are the hold and the clear, and there is nothing
  // for a per-character write to say across either of them. The flag is what
  // stops that becoming a stale-state bug — `onRefresh` can seek backwards into
  // the ramp from anywhere, and clearing it there is what lets the ramp take
  // the characters back.
  let atRest = false;

  const restCharacters = () => {
    // THE GREEN SWEEP GOES ON HERE, and it is the same moment for a reason.
    // `styles/title-shine.css` paints the line through `background-clip: text`,
    // which needs `color: transparent` — and a transparent glyph is one whose
    // own opacity and blur have nothing left to fade. Held on across the ramp
    // the twenty-two characters would arrive at once, fully formed, and the
    // assemble would be gone. `atRest` is precisely the point this loop stops
    // writing per-character styles, so the two effects can never own the line
    // at the same frame and neither had to be re-timed to arrange it.
    launchTitle.classList.add(TITLE_SHINE_CLASS);
    for (const char of chars) {
      // Emptied, not set to '1' and 'none': the served state is whatever the
      // stylesheet says, and restoring the rest STRING rather than a
      // hard-coded equivalent is the same discipline `frameOps` follows with
      // the frame's presentation attributes.
      char.style.opacity = '';
      char.style.filter = '';
    }
  };

  tl.fromTo(
    proxy,
    { t: 0 },
    {
      t: 1,
      duration: PIN_A.endOf('title') - start,
      onUpdate: () => {
        const o = titleOpacity(proxy.t);
        // `autoAlpha` by hand, because the value comes from a proxy rather than
        // from a tween on the element. The visibility half is not decoration:
        // this is a full-viewport fixed layer, and an `opacity: 0` element still
        // occupies the accessibility tree and still hit-tests — which is how
        // `#qx-stage` once ate every click meant for the site navigation.
        launchTitle.style.opacity = String(o);
        launchTitle.style.visibility = o <= 0 ? 'hidden' : 'visible';

        if (charRampProgress(proxy.t) >= 1) {
          if (!atRest) {
            restCharacters();
            atRest = true;
          }
          return;
        }

        // Taken off BEFORE the characters are written, not merely on the way
        // out. `onRefresh` re-emits the segment at the current progress and can
        // seek backwards into the ramp from anywhere, so the ramp has to be able
        // to take the line back — the same stale-state hazard `atRest` exists
        // for, and the class is now part of that state.
        launchTitle.classList.remove(TITLE_SHINE_CLASS);
        atRest = false;
        for (let i = 0; i < chars.length; i += 1) {
          const p = titleCharProgress(proxy.t, i, chars.length);
          const char = chars[i]!;
          char.style.opacity = String(p);
          char.style.filter = `blur(${((1 - p) * CHAR_BLUR).toFixed(2)}px)`;
        }
      },
    },
    start,
  );
}
