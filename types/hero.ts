/**
 * Shared hero types.
 *
 * Geometry types (Box, LogoGeometry) live in motion/geometry.ts next to the
 * measurements they describe; this file holds only the runtime contracts that
 * the state layer and the timeline factories agree on. state/ may import from
 * @/types but not from @/motion, so nothing here may re-export geometry.
 */

/**
 * The one-way beat sequence. Engine 1 (boot..ready) is time-based and event
 * gated; everything after it is derived from scroll progress. See TDD s10 and
 * BUILD-PLAN "Revised beat 6" (4 glyphs, not 5).
 *
 * `title` was added in Phase 8E: a card carrying §3.1's "Digital Growth
 * Launchpad" between the fly-through and the climb, naming the story the rocket
 * then tells. Nothing else about the sequence moved.
 */
export type Beat =
  | 'boot'
  | 'dot-in'
  | 'pointer-wake'
  | 'cursor-morph'
  | 'click'
  | 'logo-build'
  | 'ready'
  | 'frame-scale'
  | 'frame-expand'
  | 'services'
  // The frame does not close. It reopens the Q's bottom-right gap and the camera
  // dollies through — so the beat is named for what the frame becomes (an
  // aperture), not for the hero leaving.
  | 'aperture'
  | 'title'
  | 'launch'
  | 'done';

/**
 * The events that drive the Engine-1 state machine (TDD §10 transition table).
 * `WAKE_DONE` models the table's one "auto" edge (pointer-wake → cursor-morph)
 * as an animation-completion event so the whole machine stays a pure reducer.
 * Beats 7+ (frame-scale…) are derived from scroll progress, not these events.
 */
export type BeatEvent =
  | 'ASSETS_READY'
  | 'POINTER_MOVE'
  | 'WAKE_DONE'
  | 'MORPH_DONE'
  | 'CLICK'
  | 'TIMEOUT'
  | 'BUILD_DONE'
  | 'SCROLL_START'
  | 'SKIP'
  | 'PIN_END';

/** The six time-based Engine-1 beats, before scroll takes over at `ready`. */
export const ENGINE_1_BEATS: readonly Beat[] = [
  'boot',
  'dot-in',
  'pointer-wake',
  'cursor-morph',
  'click',
  'logo-build',
];

/**
 * The live DOM nodes the timelines animate, gathered once by id after the stage
 * mounts. Every one of these is a single node that survives the whole hero — it
 * is never unmounted, keyed, or conditionally rendered (the single-node
 * principle). Beat changes toggle their attributes, never their existence.
 */
export interface StageRefs {
  /** #qx-stage — the one fixed <svg>. */
  stage: SVGSVGElement;
  /** #qx-cursor — dot -> mouse icon -> the Q's tail. Shape, scale and fill. */
  cursor: SVGPathElement;
  /**
   * #qx-cursor-node — the group carrying the glyph's POSITION. The follow and the
   * travel arc write x/y here, never to `cursor`, so the body's tip and cord
   * (authored at this group's origin) travel with it as one mouse.
   */
  cursorNode: SVGGElement;
  /**
   * #qx-cursor-press — the group INSIDE the node that carries the glyph's PRESS,
   * and nothing else. The click invite's lift and the press on the real click
   * are scales on this, never on `cursor`: `cursor` is only the body, so scaling
   * it left the tip, the cord and the button — its siblings — behind at their
   * authored size, and the glyph came apart by exactly the scale factor.
   * Everything inside is authored around this group's origin, so it scales about
   * `0 0` (set once at init) and the whole mouse presses as one object.
   */
  cursorPress: SVGGElement;
  /** #qx-frame — the Q bowl -> design frame. A <path>, never a <rect>. */
  frame: SVGPathElement;
  /** #qx-wordmark — the A V Y X group. */
  wordmark: SVGGElement;
  /** #qx-track-viewport — the clipped window the carousel translates inside. */
  trackViewport: HTMLElement;
  /** #qx-track — the translated strip of service panels. */
  track: HTMLElement;
  /**
   * #qx-ink-field — a full-viewport --qx-ink surface BEHIND the stage.
   *
   * Takes over painting the frame's interior once the dolly has grown it past
   * the viewport, so the following segment is not repainting a full-viewport SVG
   * fill for hundreds of vh. Because both surfaces are the same colour the
   * handoff is bit-identical: there is nothing to cross-fade, so there is
   * nothing to get wrong.
   */
  inkField: HTMLElement;
  /**
   * #qx-launch-layer — the trajectory, the vehicle, its waypoints and the
   * fragments it sheds. Hidden by `visibility` until the launch. Carries no
   * text: the stage is aria-hidden, so anything a reader needs is real DOM —
   * `LaunchStatic` above it, and `#qx-launch-title` beside it.
   */
  launchLayer: SVGGElement;
  /**
   * #qx-copy — the intro's scroll cue.
   *
   * A ref rather than the selector string it used to be. A selector that
   * resolves to nothing is not an error in GSAP — it is a silently empty tween,
   * so a cue left painted would have nothing to announce it.
   */
  copy: HTMLElement;
  /**
   * #qx-launch-title — the card carrying §3.1's "Digital Growth Launchpad",
   * revealed and cleared at the head of pin 2.
   *
   * Fixed and full-viewport like every other layer on the stage, so the same
   * rule applies in both directions: it must not paint over §5–§7 above it, and
   * it must be gone before ignition, so that the card and the rocket are never
   * on screen together.
   */
  launchTitle: HTMLElement;
  /**
   * #qx-launch-beats — the labels that say what each burning prop and each
   * waypoint IS, from `content/launch.ts`.
   *
   * Real DOM rather than stage text, because the stage is `aria-hidden`. Fixed
   * and full-viewport like every other layer here, so the same rule binds it:
   * it must be cleared by the end of the pin or it covers §5–§7 below.
   */
  launchBeats: HTMLElement;
  /**
   * #qx-rocket-film — the fixed layer holding the client's rendered launch
   * film, and the <video> inside it. See `components/launch/RocketVideo.tsx`.
   *
   * OPTIONAL, unlike every other ref here, and deliberately so. `gatherRefs`
   * returns null — no hero at all — when a required node is missing, which is
   * right for the stage and its children because the sequence is meaningless
   * without them. It is not right for this: a browser that refuses the element,
   * or a network that never delivers the file, should cost the visitor the
   * launch beat and nothing else. `addRocketVideoSegment` adds nothing when
   * either is null, and the pin runs its remaining 695vh unchanged.
   */
  rocketFilmLayer: HTMLElement | null;
  /** The launch, painted rather than decoded. See `addRocketFramesSegment`. */
  rocketFrames: HTMLCanvasElement | null;
}

/**
 * The mouse-glyph details (tip + cord) that appear once the cursor lands in the
 * Q's gap and clear again as the frame expands. They share the `.qx-mouse-face`
 * class so the timelines fade them as a set rather than by ref.
 */
export const MOUSE_FACE_SELECTOR = '.qx-mouse-face';

/**
 * The per-character spans `components/text/SplitText.tsx` emits, which
 * `motion/timelines/titleTimeline.ts` reveals one at a time.
 *
 * It lives here rather than in the component for the same reason
 * `MOUSE_FACE_SELECTOR` does: a timeline importing a `.tsx` module to read one
 * string would put a dependency from the motion layer onto a React component,
 * and this file is where the two layers already agree on names.
 */
export const SPLIT_CHAR_CLASS = 'qx-split-char';

/**
 * The hero title card's line, and the state in which it carries the green sweep.
 *
 * `styles/title-shine.css` owns what the sweep looks like; the motion layer owns
 * WHEN, because the answer is "at the one point the entrance has stopped writing
 * per-character styles". Both halves are here for the same reason
 * `SPLIT_CHAR_CLASS` is: `components/launch/LaunchTitle.tsx` puts the first on
 * the element and `motion/timelines/titleTimeline.ts` toggles the second, and a
 * timeline should not import a React module to learn a string.
 */
export const TITLE_LINE_CLASS = 'qx-title-line';
export const TITLE_SHINE_CLASS = 'qx-title--shine';
/**
 * The tip + cord that belong to the LIVE glyph — the one under the pointer.
 * Authored at #qx-cursor-node's origin so they ride its transform. Revealed with
 * the morph (the dot must stay a bare dot before it) and hidden again on landing,
 * where the anchored `.qx-mouse-face` pair takes over in the same place.
 */
export const CURSOR_LIVE_SELECTOR = '.qx-cursor-live';

/**
 * The click affordance: the green left button and the two ripple rings that go
 * out from it. Alive ONLY during the `click` beat — it is an instruction, not
 * part of the mark, so the landed glyph in the Q must never carry it. The class
 * exists so one `set` can clear the whole hint the instant the beat ends, from
 * every route out of it (a real click, the timeout, Escape, a scroll gesture);
 * addressing them by id instead left whichever one the killed loop happened to
 * be mid-tween on riding the glyph into the logo.
 */
export const CLICK_HINT_SELECTOR = '.qx-click-hint';

/** The two ripple rings alone — the button holds its fill while these travel. */
export const CLICK_RING_SELECTOR = '.qx-click-ring';

/**
 * The one pinned ScrollTrigger's id.
 *
 * A constant for the same reason `MOUSE_FACE_SELECTOR` is one: it is a string
 * two unrelated modules have to agree on exactly. `useHeroTimeline` creates the
 * trigger with it, and `motion/paging.ts` looks the instance back up by it to
 * turn a panel index into a scroll position. Typed twice, they agree until
 * someone renames one — and the failure is `getById` returning undefined, which
 * reads as "the pin does not exist" rather than as a typo.
 */
export const PIN_ID = 'st-hero-pin';
