import { gsap } from '@/motion/gsap';
import { PIN_A } from '@/motion/scrollBudget';
import {
  FRAMES_PORTRAIT_COUNT,
  FRAMES_PORTRAIT_DIR,
  FRAMES_WIDE_COUNT,
  FRAMES_WIDE_DIR,
  PRELOAD_STRIDE,
  frameSetFor,
  framePath,
} from '@/lib/rocket-frames';

/**
 * The launch beat: 320vh of the pin, painted from stills on every device.
 *
 * ## THIS REPLACED A VIDEO, AND THE SEEK GUARD WENT WITH IT
 *
 * `rocketVideoTimeline` carried `lastFrame`, `pendingFrame`, a `seeked` listener
 * and a long note about never stacking seeks — because a video seek is
 * asynchronous work that a second seek ABORTS, so a fast scroll could spend its
 * whole time cancelling decodes while the picture trailed the finger. Measured
 * at 390x844 on 6x CPU, 10% of seeks were issued while one was still running.
 *
 * `drawImage` from an arrived bitmap is synchronous and cannot be aborted, so
 * that entire mechanism has nothing left to guard. A scrub that crosses three
 * frames in one tick simply paints the last one. Its absence is the feature.
 *
 * ## WHAT IS STILL GUARDED
 *
 * `lastPainted`, for the reason the video had `lastFrame`: `onUpdate` fires on
 * every tick the timeline moves and most ticks do not cross a frame boundary.
 * Repainting the same bitmap is wasted raster.
 */

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/** The launch segment's length in vh, from the budget rather than typed again. */
const LAUNCH_VH = PIN_A.spans.find((s) => s.name === 'launch')!.vh;

/**
 * How far into the segment the film is FINISHED, in vh.
 *
 * The last 20vh are the handoff: the film holds on its final frame — the vehicle
 * climbing away from the planet — while the layer fades and the pin releases
 * onto §5. Running the film through the fade instead would spend its best frame
 * at 40% opacity.
 */
const HANDOFF_VH = 300;

/** Segment progress at which the film reaches its last frame. */
const FILM_END = HANDOFF_VH / LAUNCH_VH;

/** The film's fade-in, in vh. Up from the ink field's flat black onto the tower. */
const FADE_IN_VH = 24;

/**
 * The layer's opacity across its own segment: up from black, held, handed back.
 *
 * MOVED HERE FROM `rocketVideoTimeline`, which no longer exists — this is now
 * the only painter, so the contract lives with it. Everything the old docblock
 * said still holds and is the reason this is a pure function of the scrubbed
 * proxy rather than a `.set()` at the end:
 *
 * `#qx-rocket-film` is `position: fixed` and covers the viewport for the WHOLE
 * document, not just the pin. Anything left painted here sits on top of §5 The
 * Problem and everything below it for the rest of the page — the bug that once
 * ran a green trajectory through the site index. Being scrubbed rather than set,
 * it also reverses correctly on the way back up.
 */
export function rocketLayerOpacity(t: number): number {
  const vh = clamp01(t) * LAUNCH_VH;
  const rise = clamp01(vh / FADE_IN_VH);
  const fall = 1 - clamp01((vh - HANDOFF_VH) / (LAUNCH_VH - HANDOFF_VH));
  return Math.min(rise, fall);
}

/**
 * The frame index for segment progress `t`, over a set of `count` frames.
 *
 * Held at the last frame through the handoff; `count - 1` because a 210-frame
 * film's last index is 209. It takes the count rather than closing over it so
 * that a set of a different length cannot be scrubbed with another set's total.
 */
export function rocketFrameIndex(t: number, count: number): number {
  const p = clamp01(clamp01(t) / FILM_END);
  return Math.round(p * (Math.max(1, count) - 1));
}

/** One loaded set: the images, and which of them have actually arrived. */
interface FrameSet {
  readonly dir: string;
  readonly count: number;
  readonly images: (HTMLImageElement | null)[];
  loaded: number;
}

function makeSet(dir: string, count: number): FrameSet {
  return { dir, count, images: new Array(count).fill(null), loaded: 0 };
}

/**
 * The nearest frame that has actually decoded, searching outwards.
 *
 * THE SEQUENCE IS NEVER BLANK, WHICH IS THE WHOLE JOB. A frame still in flight
 * paints its closest arrived neighbour instead of nothing — so the beat opens
 * coarse and sharpens, rather than showing black until the fetch that happens to
 * match the scroll position lands. With `PRELOAD_STRIDE` at 12 the worst case
 * before the dense pass is six frames away, which at this film's pace is a
 * picture that is slightly stale, not a different shot.
 *
 * Returns -1 only when NOTHING has loaded, which is the one case the caller must
 * treat as "paint nothing yet" — the poster is still behind the canvas there.
 */
export function nearestLoaded(set: FrameSet, want: number): number {
  if (set.images[want]) return want;
  for (let d = 1; d < set.count; d++) {
    if (want - d >= 0 && set.images[want - d]) return want - d;
    if (want + d < set.count && set.images[want + d]) return want + d;
  }
  return -1;
}

/**
 * Fetch a set: the sparse pass first, then everything else.
 *
 * Both passes are plain `Image` loads, so they go through the HTTP cache and the
 * browser's own connection scheduling. No `fetch`, no blobs, no decode()
 * orchestration: an `<img>` that has fired `load` is decodable by `drawImage`
 * synchronously, which is the only property this needs.
 */
function loadSet(set: FrameSet, onFirst: () => void): void {
  let announced = false;
  const load = (i: number): void => {
    if (set.images[i]) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      set.images[i] = img;
      set.loaded++;
      if (!announced) {
        announced = true;
        onFirst();
      }
    };
    img.src = framePath(set.dir, i + 1);
  };

  for (let i = 0; i < set.count; i += PRELOAD_STRIDE) load(i);
  // The gaps, queued behind the sparse pass rather than racing it. A timeout of
  // 0 is enough: it puts the 190-odd remaining requests on the next task, after
  // the 18 that make the beat usable have been issued.
  setTimeout(() => {
    for (let i = 0; i < set.count; i++) load(i);
  }, 0);
}

/**
 * Add the frame-scrubbed launch to the pin's timeline.
 *
 * `layer` is `#qx-rocket-film` — the fixed, full-viewport surface the launch
 * paints on and must clear. It was `#qx-rocket-video` until the video path was
 * deleted on 2026-09-02; see `RocketFilm` for why the name followed the element
 * rather than outliving it.
 */
export function addRocketFramesSegment(
  tl: gsap.core.Timeline,
  layer: HTMLElement | null,
  canvas: HTMLCanvasElement | null,
): void {
  if (!layer || !canvas) return;

  /**
   * A MISSING 2D CONTEXT COSTS THE PICTURE, NOT THE BEAT.
   *
   * This used to `return` here, which is the wrong failure: with no segment on
   * the timeline the layer never fades in and never fades out, so a browser that
   * refused a context would lose 320vh of the pin rather than 320vh of film. The
   * layer already has the poster as its background (`styles/rocket-film.css`),
   * so the honest degradation is the beat running over a still.
   *
   * It is also what makes this testable at all: jsdom has no canvas backend, so
   * `getContext` returns null there and `cross-paint.test.ts` asserts the layer
   * IS painted during the launch — a claim that could not be made if the absence
   * of a context took the segment with it.
   */
  const ctx = canvas.getContext('2d', { alpha: false });

  const sets: Record<'portrait' | 'wide', FrameSet> = {
    portrait: makeSet(FRAMES_PORTRAIT_DIR, FRAMES_PORTRAIT_COUNT),
    wide: makeSet(FRAMES_WIDE_DIR, FRAMES_WIDE_COUNT),
  };

  let current = frameSetFor(window.innerWidth, window.innerHeight);
  let lastPainted = -1;

  const paint = (index: number): void => {
    if (!ctx) return;
    const set = sets[current];
    const use = nearestLoaded(set, index);
    if (use < 0) return;
    const img = set.images[use]!;
    // The canvas is sized to the SOURCE, once per set, and CSS scales it. Sizing
    // it to the viewport instead would re-raster the backing store on every
    // resize and put the scaling in JS, where `object-fit` already does it in
    // the compositor for the video.
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      lastPainted = -1;
    }
    if (use === lastPainted) return;
    lastPainted = use;
    ctx?.drawImage(img, 0, 0);
  };

  const repaint = (): void => {
    if (lastPainted >= 0) {
      const at = lastPainted;
      lastPainted = -1;
      paint(at);
    }
  };

  loadSet(sets[current], repaint);

  /**
   * ROTATION MID-BEAT SWITCHES SETS AND MUST NOT FLASH.
   *
   * The two sets are different crops of the same film, so a phone turned
   * sideways needs the other one — and it will not have started loading. The
   * canvas keeps whatever it last painted while the new set arrives (nothing
   * clears it, and `lastPainted` is reset so the first arrival repaints), which
   * is a briefly wrong aspect rather than a black screen.
   *
   * The old set is NOT discarded. A phone rotated once is usually rotated back,
   * and 4.8 MiB of decoded bitmaps is the cost of not fetching it twice.
   */
  const onResize = (): void => {
    const next = frameSetFor(window.innerWidth, window.innerHeight);
    if (next === current) return;
    current = next;
    lastPainted = -1;
    if (sets[next].loaded === 0) loadSet(sets[next], repaint);
    else repaint();
  };
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });

  const start = PIN_A.startOf('launch');
  const proxy = { t: 0 };

  tl.to(
    proxy,
    {
      t: 1,
      ease: 'none',
      duration: LAUNCH_VH / PIN_A.totalVh,
      onUpdate: () => {
        const t = proxy.t;
        layer.style.opacity = String(rocketLayerOpacity(t));
        layer.style.visibility = t > 0 ? 'visible' : 'hidden';
        paint(rocketFrameIndex(t, sets[current].count));
      },
    },
    start,
  );
}
