// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
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
import {
  nearestLoaded,
  rocketFrameIndex,
  rocketLayerOpacity,
} from '@/motion/timelines/rocketFramesTimeline';

/**
 * THE SCRUB'S CONTRACT, inherited from the video this replaced.
 *
 * `rocket-video.test.ts` made these claims about `video.currentTime`; the film
 * is a frame sequence now and the claims are unchanged, because they were never
 * about the format:
 *
 *   1. scroll position — not a clock, not a play() — decides the frame;
 *   2. scrolling back up runs the film backwards, exactly;
 *   3. the layer is CLEARED, or it covers every section below the pin.
 *
 * The third is the one with a bug behind it: `#qx-rocket-film` is `position:
 * fixed` for the whole document, and a version of this layer once left a green
 * trajectory painted over the site index.
 */

const LAUNCH_VH = PIN_A.spans.find((s) => s.name === 'launch')!.vh;

describe('the frame index', () => {
  it('starts on the first frame and reaches the last', () => {
    expect(rocketFrameIndex(0, 210)).toBe(0);
    // The film is finished at 300 of the segment's 320vh — see HANDOFF_VH.
    expect(rocketFrameIndex(300 / LAUNCH_VH, 210)).toBe(209);
  });

  /**
   * HELD, NOT LOOPED, NOT REWOUND. The last 20vh are the handoff: the vehicle
   * sits on its final frame while the layer fades and the pin releases onto §5.
   */
  it('holds the last frame through the handoff', () => {
    expect(rocketFrameIndex(0.95, 210)).toBe(209);
    expect(rocketFrameIndex(1, 210)).toBe(209);
    expect(rocketFrameIndex(2, 210)).toBe(209);
  });

  it('runs backwards exactly as it ran forwards', () => {
    const down = [0.1, 0.3, 0.5, 0.7].map((t) => rocketFrameIndex(t, 210));
    const up = [0.7, 0.5, 0.3, 0.1].map((t) => rocketFrameIndex(t, 210));
    expect(up).toEqual([...down].reverse());
  });

  it('never indexes past the end of a set, whatever its length', () => {
    for (const count of [1, 2, 105, 210]) {
      for (const t of [-1, 0, 0.25, 0.5, 0.99, 1, 5]) {
        const i = rocketFrameIndex(t, count);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThanOrEqual(count - 1);
      }
    }
  });

  /** Monotonic: scrolling further can never show an EARLIER frame. */
  it('is monotonic across the segment', () => {
    let prev = -1;
    for (let t = 0; t <= 1; t += 0.01) {
      const i = rocketFrameIndex(t, 210);
      expect(i).toBeGreaterThanOrEqual(prev);
      prev = i;
    }
  });
});

describe('the layer opacity', () => {
  /**
   * THE CLEAR IS THE ONE THAT MATTERS. Anything left painted at t=1 sits over §5
   * The Problem and every section below it for the rest of the page.
   */
  it('is zero at both ends and full in the middle', () => {
    expect(rocketLayerOpacity(0)).toBe(0);
    expect(rocketLayerOpacity(1)).toBe(0);
    expect(rocketLayerOpacity(0.5)).toBe(1);
  });

  it('is fully up by the end of its 24vh fade-in', () => {
    expect(rocketLayerOpacity(24 / LAUNCH_VH)).toBeCloseTo(1, 10);
  });

  it('clamps rather than going negative or past one', () => {
    for (const t of [-5, -0.1, 1.1, 9]) {
      const o = rocketLayerOpacity(t);
      expect(o).toBeGreaterThanOrEqual(0);
      expect(o).toBeLessThanOrEqual(1);
    }
  });
});

describe('nearestLoaded', () => {
  const set = (loaded: number[]) => ({
    dir: '',
    count: 20,
    images: Array.from({ length: 20 }, (_, i) =>
      loaded.includes(i) ? ({} as HTMLImageElement) : null,
    ),
    loaded: loaded.length,
  });

  it('prefers the exact frame when it has arrived', () => {
    expect(nearestLoaded(set([0, 5, 10]), 5)).toBe(5);
  });

  /**
   * THE SEQUENCE IS NEVER BLANK. A frame still in flight paints its closest
   * arrived neighbour, so the beat opens coarse and sharpens instead of showing
   * black until the one matching the scroll position happens to land.
   */
  it('falls back to the closest neighbour on either side', () => {
    expect(nearestLoaded(set([0, 12]), 11)).toBe(12);
    expect(nearestLoaded(set([0, 12]), 4)).toBe(0);
  });

  it('reports -1 only when nothing at all has loaded', () => {
    expect(nearestLoaded(set([]), 7)).toBe(-1);
  });

  /**
   * With `PRELOAD_STRIDE` the worst case before the dense pass is half a stride
   * away — the guarantee the sparse-first fetch is chosen for.
   */
  it('is never further than half a stride away after the sparse pass', () => {
    const sparse = Array.from({ length: 210 }, (_, i) => i).filter(
      (i) => i % PRELOAD_STRIDE === 0,
    );
    const s = { dir: '', count: 210, images: Array(210).fill(null), loaded: 0 };
    for (const i of sparse) s.images[i] = {} as HTMLImageElement;
    for (let want = 0; want < 210; want++) {
      const got = nearestLoaded(s, want);
      expect(got).toBeGreaterThanOrEqual(0);
      expect(Math.abs(got - want)).toBeLessThanOrEqual(PRELOAD_STRIDE);
    }
  });
});

describe('which set a viewport gets', () => {
  /**
   * THE LINE IS 1:1, NOT THE FILM'S 16:9, and this test is the guard on that.
   * A 1440x900 desktop is 1.6 — narrower than 16:9, so the stylesheet CROPS it —
   * but it wants the wide set, not the phone's 9:16 window. Only a screen taller
   * than it is wide takes the portrait crop.
   */
  it('gives the portrait crop to upright phones only', () => {
    expect(frameSetFor(390, 844)).toBe('portrait');
    expect(frameSetFor(280, 653)).toBe('portrait');
  });

  it('gives the wide set to everything else, however it is cropped', () => {
    expect(frameSetFor(1440, 900)).toBe('wide'); // desktop, cover-cropped
    expect(frameSetFor(844, 390)).toBe('wide'); // phone on its side, letterboxed
    expect(frameSetFor(1024, 768)).toBe('wide'); // tablet
    expect(frameSetFor(2560, 1080)).toBe('wide'); // ultrawide
  });

  it('treats an exactly square viewport as wide', () => {
    expect(frameSetFor(800, 800)).toBe('wide');
  });
});

describe('the asset paths', () => {
  it('are one-based and zero-padded to three digits', () => {
    expect(framePath(FRAMES_PORTRAIT_DIR, 1)).toBe('/launch-frames-v1/portrait/f001.webp');
    expect(framePath(FRAMES_WIDE_DIR, 210)).toBe('/launch-frames-v1/wide/f210.webp');
  });

  /**
   * VERSIONED IN THE DIRECTORY NAME, and it has to stay that way: these are
   * served out of `public/` with no content hash, so a re-encode at the same
   * path keeps serving the old pictures to anyone holding cached HTML. The
   * video learned this the hard way — see the redirect note in `next.config.ts`.
   */
  it('carry a version in the directory', () => {
    expect(FRAMES_PORTRAIT_DIR).toMatch(/-v\d+\//);
    expect(FRAMES_WIDE_DIR).toMatch(/-v\d+\//);
  });

  it('both sets carry every frame of the film', () => {
    expect(FRAMES_PORTRAIT_COUNT).toBe(210);
    expect(FRAMES_WIDE_COUNT).toBe(210);
  });
});
