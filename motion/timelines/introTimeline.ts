import { gsap } from '@/motion/gsap';
import { EASE } from '@/motion/eases';
import {
  capsulePath,
  computeTravelPath,
  DOT_RADIUS,
  FRAME_OPEN_FRACTION,
  MOUSE,
  type LogoGeometry,
} from '@/motion/geometry';
import { setFrameDraw } from './frameOps';
import {
  CLICK_HINT_SELECTOR,
  CURSOR_LIVE_SELECTOR,
  MOUSE_FACE_SELECTOR,
  type StageRefs,
} from '@/types/hero';

/**
 * Engine 1 — the full intro choreography (TDD §7). Every factory takes only refs
 * + config and returns a timeline; composition, event gating and the state
 * machine all live in useHeroTimeline, never here.
 *
 * The morph target and the travel path are BOTH generated at the cursor's live
 * position rather than referencing the authored `#qx-mouse-body` (which sits in
 * the Q's gap). The cursor is authored at the origin and positioned by an x/y
 * transform, so morphing to an origin-centred capsule keeps the shape change in
 * place under the pointer; travelling then carries it to the gap.
 */

export interface IntroConfig {
  geometry: LogoGeometry;
  vw: number;
  vh: number;
}

const dotPath = () => capsulePath(0, 0, DOT_RADIUS * 2, DOT_RADIUS * 2, DOT_RADIUS, 0);

export function mouseBodyAtOrigin(cfg: IntroConfig): string {
  const s = cfg.geometry.mouseAnchor.size;
  return capsulePath(
    0,
    0,
    MOUSE.bodyAlong * s,
    MOUSE.bodyAcross * s,
    MOUSE.bodyR * s,
    MOUSE.angleDeg,
  );
}

/** dot-in: the dot scales up from nothing at viewport centre. Discovery. */
export function tlDotIn(refs: StageRefs, cfg: IntroConfig): gsap.core.Timeline {
  const tl = gsap.timeline();
  // Position on the NODE, shape/scale on the cursor — see CursorNode's header.
  tl.set(refs.cursorNode, { x: cfg.vw / 2, y: cfg.vh / 2 });
  tl.set(refs.cursor, {
    attr: { d: dotPath() },
    scale: 0,
    autoAlpha: 0,
    transformOrigin: '50% 50%',
  });
  tl.to(refs.cursor, { autoAlpha: 1, duration: 0.3, ease: EASE.out }, 0);
  tl.to(refs.cursor, { scale: 1, duration: 0.6, ease: EASE.out }, 0);
  return tl;
}

/**
 * The breathing loop — the ONE idle loop in the whole hero. A single scale tween
 * on one small element; killed (never paused) on the first pointer move so it
 * stops consuming ticker time. Returns the timeline so the caller owns its life.
 */
export function tlBreathe(refs: StageRefs): gsap.core.Timeline {
  return gsap.timeline({ repeat: -1, yoyo: true }).to(refs.cursor, {
    scale: 1.12,
    duration: 1.2,
    ease: 'sine.inOut',
    transformOrigin: '50% 50%',
  });
}

/**
 * How long the dot breathes on its own before it morphs, on a touch device.
 *
 * BUILD-PLAN Phase 10's beat table: `pointer-wake` is skipped and "the dot
 * morphs on its own after 1200 ms". It is a different quantity from the pointer
 * path's 6-second fallback and must not be confused with it — six seconds there
 * means "nobody is at this machine", and the hero gives up on the choreography
 * and finishes itself. 1200ms here means nothing of the kind: the sequence
 * continues into `cursor-morph` and then `click`, exactly as if a pointer had
 * arrived, because on a touch device stillness IS the resting state and waiting
 * for movement would wait forever.
 *
 * Long enough to read as the dot deciding rather than as a stutter after the
 * 600ms `dot-in`, and short enough that it lands inside the first breath of
 * `tlBreathe` (1.2s each way) rather than mid-exhale.
 */
export const DOT_HOLD_TOUCH = 1.2;

/** pointer-wake: the dot snaps back to scale 1 the instant it's noticed. */
export function tlPointerWake(refs: StageRefs): gsap.core.Timeline {
  return gsap.timeline().to(refs.cursor, {
    scale: 1,
    duration: 0.12,
    ease: EASE.snap,
    transformOrigin: '50% 50%',
  });
}

/**
 * Read a colour token. The end value of a colour tween must be a literal —
 * GSAP cannot interpolate toward `var(--x)` (the START value is fine: it reads
 * the computed style, which is already resolved). Reading the token here keeps
 * styles/tokens.css the single source of truth instead of pasting a hex.
 */
function cssToken(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** cursor-morph: the dot becomes the mouse icon in place. Transition. */
export function tlCursorMorph(refs: StageRefs, cfg: IntroConfig): gsap.core.Timeline {
  return (
    gsap
      .timeline()
      .to(
        refs.cursor,
        {
          // shapeIndex 0: both shapes come from capsulePath(), so they already share a
          // start vertex and winding — no offset is needed to keep the morph un-rotated.
          morphSVG: { shape: mouseBodyAtOrigin(cfg), type: 'rotational', shapeIndex: 0 },
          duration: 0.52,
          ease: EASE.inOut,
        },
        0,
      )
      // The accent MOVES rather than multiplies: the dot is green because it is
      // the brand's point of light, but the mouse's body is the mark's white ink
      // and only its tip is green. Leaving the body green (the placeholder did)
      // reads as two unrelated green blobs once the tip appears.
      .to(
        refs.cursor,
        { fill: cssToken('--qx-white', '#f2f5f3'), duration: 0.52, ease: EASE.inOut },
        0,
      )
      // The tip and cord arrive as the body takes shape, so what follows the
      // pointer from here is the COMPLETE mouse rather than a bare white capsule
      // that only becomes a mouse after the click. They fade in over the back
      // half of the morph — earlier and they precede the shape that carries them.
      .to(
        CURSOR_LIVE_SELECTOR,
        { autoAlpha: 1, duration: 0.26, ease: EASE.out },
        0.26,
      )
  );
}

/** The button's resting fill once the affordance has arrived, and at full press. */
const BTN_REST = 0.68;
/** The glyph's lift while it waits to be clicked, and its depth at the bottom. */
const LIFT = 1.06;
const PRESS = 0.97;
/** Silence between demonstrations. Long enough that the cue never nags. */
const INVITE_GAP = 1.1;
/** When the loop starts, i.e. under the tail of the one-shot lift-in. */
const INVITE_LEAD = 0.5;
/** The press itself: down at confirmation speed, up slower — as a press feels. */
const PRESS_DOWN = 0.1;
const PRESS_UP = 0.44;
/** The ripple. The first ring leaves as the press bottoms out, the second after. */
const RING_ECHO = 0.28;
const RING_TRAVEL = 0.95;
/** One demonstration, end to end — the press plus the slower of its two rings. */
const DEMO = RING_ECHO + RING_TRAVEL;

/**
 * How long the `click` beat waits for a press before building the logo itself.
 *
 * DERIVED from the invite's own rhythm, not a round number, because the two have
 * to agree: the fallback fires the same press the cue has been demonstrating, so
 * landing it ON a demonstration means the glyph is already mid-press when the
 * "real" one starts, and the confirmation is lost inside the loop it is meant to
 * answer. This puts it in the SILENCE after the third demonstration, and it
 * stays there if the loop is ever retuned (unit-tested).
 *
 * The TDD (§10) has a flat 5s here, which was written for a cue that did not
 * move. 5s against this loop cuts the visitor off 1.1s before the third
 * demonstration would finish — two, then silence, then the page decides. Three
 * is the point where a visitor who is reading rather than acting has had a fair
 * look, and it is still well inside the "is this broken?" threshold.
 */
const DEMOS_BEFORE_FALLBACK = 3;
export const CLICK_TIMEOUT =
  INVITE_LEAD + (DEMOS_BEFORE_FALLBACK - 1) * (DEMO + INVITE_GAP) + DEMO + INVITE_GAP / 2;

/** The invite's cadence, exported so the fallback's placement can be asserted. */
export const INVITE_RHYTHM = {
  lead: INVITE_LEAD,
  demo: DEMO,
  gap: INVITE_GAP,
  cycle: DEMO + INVITE_GAP,
} as const;

/**
 * The touch invite's two numbers, from BUILD-PLAN Phase 10's beat table:
 * "Single 400 ms pulse to 1.08 + 'Tap to build' label; any tap commits;
 * 4000 ms timeout".
 *
 * FLAT, NOT DERIVED, and that is the difference from `CLICK_TIMEOUT` above.
 * The pointer path's fallback is derived from the invite's own rhythm because
 * there IS a rhythm to land between — three demonstrations and the silences
 * around them. The touch invite is a single pulse that is over in 400ms, so
 * there is nothing to land between and 4000ms is simply the plan's number: long
 * enough that a visitor who is reading has finished, short enough to be well
 * inside "is this broken?".
 *
 * The pulse is ONE SHOT rather than the pointer path's loop, and that is the
 * real redesign rather than a re-timing. The looping press exists to say *press
 * the left button* to someone holding the thing that has a left button; on a
 * touch device it would be a mouse miming a click at a visitor who has no mouse,
 * which is decoration under the governing motion rule. What replaces it is a
 * word — the label — and one pulse to say the glyph is the thing to tap.
 */
export const CLICK_TIMEOUT_TOUCH = 4;
const TOUCH_PULSE_TO = 1.08;
const TOUCH_PULSE_UP = 0.16;
const TOUCH_PULSE_DOWN = 0.24;

/**
 * The whole of `logo-build`, in seconds, on touch. BUILD-PLAN Phase 10: "Travel
 * from center; total 2200 ms."
 *
 * Applied as a `timeScale` on the finished timeline rather than by re-timing its
 * fifteen tweens, so the segment keeps its internal proportions — the draw still
 * overlaps the travel by 180ms of its own length, the letters still stagger at
 * a ninth of their duration — and a later retune of the pointer build carries
 * across for free instead of silently desynchronising the two.
 *
 * "Travel from center" needs no code at all and that is worth saying once: the
 * travel starts from `follow.current?.position() ?? centre()`, and on touch
 * `usePointerFollow` is never enabled, so the handle is null and the fallback IS
 * the specification. See `HeroExperience`.
 */
export const LOGO_BUILD_TOUCH = 2.2;

/**
 * click-invite: the beat has one thing to say — *click the left button and the
 * logo builds* — and it has to say it without words.
 *
 * Three layers, in the order the eye picks them up:
 *   1. The left button FILLS green and holds. Static, so the affordance is
 *      readable at a glance and stays readable between demonstrations.
 *   2. The glyph rides at LIFT and then PRESSES — the whole mouse, via
 *      #qx-cursor-press, so tip, cord and button go down with the body. The
 *      button hits full green on the way down. That is the demonstration.
 *   3. Two ripple rings open out of the glyph as the press bottoms out,
 *      staggered, and fade. That is what makes it read as a CLICK, not a wobble.
 *
 * This LOOPS, and the TDD (§3.5) explicitly rules a loop out — "one fade is
 * enough to say clickable; a repeating pulse would be decoration". It is not
 * decoration here: a fill that arrives once and holds says "this is a button",
 * not "press it to continue", and continuing is the only thing this beat is
 * waiting for. It is still the only loop running — the breathe loop is killed
 * back at pointer-wake — so the one-idle-loop rule holds. It is also the shortest
 * loop in the hero: it ends the moment the visitor does what it is asking for.
 */
export function tlClickInvite(refs: StageRefs, cfg: IntroConfig): gsap.core.Timeline {
  const s = cfg.geometry.mouseAnchor.size;
  const tl = gsap.timeline();

  // The affordance arrives with the same 400ms fade the TDD specifies, under the
  // one-shot lift that was already here.
  tl.fromTo(
    '#qx-click-btn',
    { autoAlpha: 0 },
    { autoAlpha: BTN_REST, duration: 0.4, ease: EASE.out },
    0,
  );
  tl.to(refs.cursorPress, { scale: LIFT, duration: 0.4, ease: EASE.out }, 0);

  // The demonstration. Nested rather than authored on `tl` directly so the
  // caller can kill the whole beat with one handle, and so the repeat can't
  // drag the lift-in back to the start with it.
  const press = gsap.timeline({ repeat: -1, repeatDelay: INVITE_GAP });
  // Down: confirmation timing (<=120ms), the button to full green with it.
  press.to(refs.cursorPress, { scale: PRESS, duration: PRESS_DOWN, ease: EASE.snap }, 0);
  press.to('#qx-click-btn', { autoAlpha: 1, duration: PRESS_DOWN, ease: EASE.snap }, 0);
  // Up: slower than the way down, which is what a press feels like.
  press.to(refs.cursorPress, { scale: LIFT, duration: PRESS_UP, ease: EASE.out }, PRESS_DOWN);
  press.to(
    '#qx-click-btn',
    { autoAlpha: BTN_REST, duration: PRESS_UP, ease: EASE.out },
    PRESS_DOWN,
  );
  // The rings leave AT the bottom of the press, not before it — a ripple that
  // starts on the way down reads as the mouse shedding rings rather than the
  // press causing them. The second is a quieter echo of the first.
  [PRESS_DOWN, RING_ECHO].forEach((at, i) => {
    press.fromTo(
      `#qx-click-ring-${i + 1}`,
      { attr: { r: MOUSE.ringFrom * s }, autoAlpha: i === 0 ? 0.9 : 0.5 },
      {
        attr: { r: MOUSE.ringTo * s },
        autoAlpha: 0,
        duration: RING_TRAVEL,
        ease: EASE.out,
      },
      at,
    );
  });

  tl.add(press, INVITE_LEAD);
  return tl;
}

/**
 * click-invite, TOUCH. The same beat, saying the same one thing — *do this and
 * the logo builds* — to someone with no pointer.
 *
 * Three layers again, and each is the touch answer to the pointer version's:
 *
 *   1. The left button still FILLS green over the same 400ms. The glyph is the
 *      brand's mouse and it keeps its affordance; what changes is that the
 *      button is no longer being demonstrated, only shown.
 *   2. ONE pulse to 1.08 and back, 400ms end to end. Up fast, down slower, the
 *      same asymmetry the press has, because a thing that swells and settles
 *      reads as inviting where a thing that swells and snaps reads as a twitch.
 *      It does not loop: see CLICK_TIMEOUT_TOUCH.
 *   3. The LABEL, which is the layer the pointer path does not have and does not
 *      need. A mouse pressing its own button is a complete instruction to
 *      someone holding a mouse; to a thumb it is a picture of an unrelated
 *      object. The word is what carries the beat here, so it arrives with the
 *      button rather than after it.
 *
 * NO RIPPLE RINGS. They are the press's consequence and there is no press to
 * have one — and `#qx-click-ring-*` would be two more nodes animating on the
 * device class this phase is trying to take work away from. They stay hidden by
 * the init block's `CLICK_HINT_SELECTOR` set and are cleared again on the way
 * out with everything else.
 */
export function tlClickInviteTouch(refs: StageRefs): gsap.core.Timeline {
  const tl = gsap.timeline();

  tl.fromTo(
    '#qx-click-btn',
    { autoAlpha: 0 },
    { autoAlpha: BTN_REST, duration: 0.4, ease: EASE.out },
    0,
  );
  // The label is in the same fade and the same beat as the button, because they
  // are one instruction. `#qx-tap-label` wears `.qx-click-hint` (see HeroCopy),
  // so every route out of this beat clears it via the single `set` in
  // `buildLogoBuild` — including Escape and a scroll gesture, which kill this
  // timeline mid-tween.
  tl.fromTo('#qx-tap-label', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: EASE.out }, 0);

  // The pulse. On the PRESS GROUP, like every other scale in this file, so the
  // tip, the cord and the button swell with the body instead of being left
  // behind at their authored size.
  tl.to(
    refs.cursorPress,
    { scale: TOUCH_PULSE_TO, duration: TOUCH_PULSE_UP, ease: EASE.out },
    0,
  );
  tl.to(
    refs.cursorPress,
    { scale: 1, duration: TOUCH_PULSE_DOWN, ease: EASE.out },
    TOUCH_PULSE_UP,
  );

  return tl;
}

export interface LogoBuildOptions {
  /** Cursor position the travel arc starts from. */
  from: { x: number; y: number };
  /** Play the click-confirmation flash first (true from a real click). */
  flash: boolean;
  /** Instant-morph the dot into the glyph before travelling (dot-in timeout). */
  morphFirst: boolean;
  /** Fired at the START of the 600ms hold — where scroll unlocks (TDD §7). */
  onHoldStart: () => void;
}

/**
 * logo-build: click flash → the glyph arcs to the Q's gap while the Q draws
 * itself shut from the tail → A V Y X reveal left-to-right → hold. Construction.
 *
 * `onHoldStart` fires when the letters finish, at the top of the 600ms hold —
 * scroll must unlock there, 600ms before the timeline completes, or holding the
 * user feels broken.
 */
export function buildLogoBuild(
  refs: StageRefs,
  cfg: IntroConfig,
  opts: LogoBuildOptions,
): gsap.core.Timeline {
  const anchor = cfg.geometry.mouseAnchor;
  const travelPath = computeTravelPath(opts.from, { x: anchor.x, y: anchor.y });
  const draw = { v: 0 };
  const tl = gsap.timeline({ paused: true });

  // Whatever interrupted whatever came before, the build starts from a whole
  // cursor: fully opaque, at its authored size. Every route into logo-build can
  // arrive mid-`dot-in` — a click, a scroll, or Escape 200ms in kills that
  // timeline partway through its 300ms fade AND its 600ms scale-up — and
  // nothing downstream sets either property, so whatever it left behind sticks
  // for the rest of the session. That produced two real bugs: a glyph frozen at
  // opacity 0.888 (which the scroll expansion then captured as the start of its
  // own fade, so scrolling back up restored 0.888 rather than 1), and a landed
  // mouse rendered at scale 0.67 while the tip and cord — plain React nodes at
  // full size — sat around it, which is what made the glyph look like loose
  // green crescents instead of one mouse.
  tl.set(refs.cursor, { autoAlpha: 1, scale: 1 }, 0);
  // The press group has the same problem and worse consequences: every route in
  // can arrive with the invite's LIFT still on it (a click lands mid-loop by
  // definition), and nothing downstream writes scale — so a 6%-oversized mouse
  // would land in the Q and stay there for the session. Reset before the flash,
  // which then plays from a known 1.
  tl.set(refs.cursorPress, { scale: 1 }, 0);

  // The auto-build path never morphed the dot; do it instantly so the glyph, not
  // a bare dot, is what completes the Q. The fill goes with the shape — a green
  // body would leave the landed glyph reading as a blob rather than a mouse.
  if (opts.morphFirst) {
    tl.set(refs.cursor, {
      morphSVG: { shape: mouseBodyAtOrigin(cfg), shapeIndex: 0 },
      fill: cssToken('--qx-white', '#f2f5f3'),
    });
    // The shape arrives instantly here, so its tip and cord must too — otherwise
    // a bare capsule flies to the Q on the timeout / eager-click paths.
    tl.set(CURSOR_LIVE_SELECTOR, { autoAlpha: 1 });
  }

  // Click confirmation — the invite's press, played for real and harder, then
  // released into the travel. It is the same gesture the cue has been
  // demonstrating, which is what makes the click feel like it landed on the
  // thing that was asking for it.
  //
  // This scales the PRESS GROUP, not #qx-cursor: the old flash scaled the body
  // alone to 1.14, leaving the tip and cord — its siblings, at their authored
  // size — a visible step away from it for the 180ms it lasted.
  if (opts.flash) {
    tl.to(refs.cursorPress, { scale: 0.93, duration: 0.07, ease: EASE.snap }, 0);
    tl.to(refs.cursorPress, { scale: 1, duration: 0.2, ease: EASE.out }, 0.07);
    tl.to('#qx-click-btn', { autoAlpha: 1, duration: 0.07, ease: EASE.snap }, 0);
    // One ring, further and FASTER than the invite's: the answer to the cue, not
    // another instance of it. Short on purpose — the travel starts at 0.12 on an
    // ease-out, so a long ring would be dragged across the screen behind a mouse
    // already most of the way to the Q.
    tl.fromTo(
      '#qx-click-ring-1',
      { attr: { r: MOUSE.ringFrom * anchor.size }, autoAlpha: 1 },
      {
        attr: { r: MOUSE.ringToFast * anchor.size },
        autoAlpha: 0,
        duration: 0.34,
        ease: EASE.out,
      },
      0.04,
    );
    // The affordance has been answered, so the button goes with the departure.
    // The ring is left to finish on its own — fading it as a set would cut the
    // confirmation short at exactly the moment it is meant to land.
    tl.to('#qx-click-btn', { autoAlpha: 0, duration: 0.18, ease: EASE.out }, 0.16);
  }

  // Nothing green rides into the Q. This catches the rings, the button, and
  // whatever the killed invite loop left mid-tween on any of them — every route
  // out of the `click` beat (a press, the timeout, Escape, a scroll gesture)
  // comes through here, so this one line is what guarantees the hint is gone.
  tl.set(CLICK_HINT_SELECTOR, { autoAlpha: 0 }, opts.flash ? 0.4 : 0);

  // Travel: one arc to the gap, moving the NODE so the tip and cord travel with
  // the body as one mouse.
  //
  // NO alignOrigin here, deliberately. It aligns a point of the element's BBOX to
  // the path, and the node's bbox includes the cord sticking up-left of the body
  // — so [0.5,0.5] would land the bbox centre on the anchor and put the BODY down
  // -right of the gap. Without it the element's own origin traces the path, and
  // everything inside the node is authored around that origin with the body
  // centred on it, so the body centre lands exactly on the anchor.
  tl.to(
    refs.cursorNode,
    {
      duration: 0.72,
      ease: EASE.out,
      motionPath: { path: travelPath, autoRotate: false },
    },
    0.12,
  );

  // Hand off: the anchored tip and cord come up in the gap exactly where the
  // live pair already is, and the live pair goes out with them. Same shapes, same
  // place, so the swap is invisible — but from here the glyph is part of the MARK
  // (what the frame expansion fades) rather than the cursor.
  tl.to(MOUSE_FACE_SELECTOR, { autoAlpha: 1, duration: 0.3, ease: EASE.out }, '>-0.2');
  tl.set(CURSOR_LIVE_SELECTOR, { autoAlpha: 0 }, '>');

  // Reveal the frame and draw the open Q (0 → 89.4%) from the tail, overlapping
  // the travel by 180ms. Hidden until now so the round linecap can't leave a pip.
  tl.set(refs.frame, { autoAlpha: 1 }, '-=0.18');
  tl.to(
    draw,
    {
      v: FRAME_OPEN_FRACTION * 100,
      duration: 0.9,
      ease: EASE.out,
      onUpdate: () => setFrameDraw(refs.frame, draw.v),
    },
    '<',
  );

  // A V Y X reveal — left to right, 4 glyphs, 90ms stagger (beat 6 is 4, not 5).
  // The mark reads left-to-right, so the stagger does too; no grid, no random.
  tl.set(refs.wordmark, { autoAlpha: 1 }, '>-0.3');
  tl.fromTo(
    '#qx-wordmark .qx-glyph',
    { autoAlpha: 0, yPercent: 45 },
    {
      autoAlpha: 1,
      yPercent: 0,
      duration: 0.3,
      ease: EASE.out,
      stagger: 0.09,
      transformOrigin: '50% 50%',
    },
    '<',
  );

  // The scroll cue fades in just after the letters finish, before the hold.
  tl.to('#qx-scroll-label', { autoAlpha: 1, duration: 0.5, ease: EASE.out }, '>+0.05');

  // Hold. Scroll unlocks at the TOP of the hold, not its end.
  tl.addLabel('hold');
  tl.call(opts.onHoldStart, [], 'hold');
  tl.to({}, { duration: 0.6 }, 'hold');

  return tl;
}
