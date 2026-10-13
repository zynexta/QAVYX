/**
 * Counts how many independent requestAnimationFrame callbacks run per frame.
 *
 * The whole app must show exactly 1: gsap.ticker, which drives Lenis. A reading
 * of 2 means something started its own loop — most often Lenis with autoRaf
 * left at its default true.
 *
 * Dev instrumentation only; never imported by production code. It lives in
 * motion/ because that is the only layer permitted to touch rAF directly
 * (eslint.config.mjs).
 */

export interface RafProbe {
  /** Callbacks invoked during the most recently completed frame. */
  loopsPerFrame: () => number;
  fps: () => number;
  stop: () => void;
}

export function startRafProbe(): RafProbe {
  const native = window.requestAnimationFrame.bind(window);

  let inFlight = 0;
  let lastCount = 0;
  let frames = 0;
  let fps = 0;
  let fpsWindowStart = performance.now();
  let running = true;

  window.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    native((t) => {
      inFlight += 1;
      cb(t);
    })) as typeof window.requestAnimationFrame;

  const sample = () => {
    if (!running) return;
    lastCount = inFlight;
    inFlight = 0;

    frames += 1;
    const now = performance.now();
    if (now - fpsWindowStart >= 500) {
      fps = Math.round((frames * 1000) / (now - fpsWindowStart));
      frames = 0;
      fpsWindowStart = now;
    }
    native(sample);
  };
  native(sample);

  return {
    loopsPerFrame: () => lastCount,
    fps: () => fps,
    stop: () => {
      running = false;
      window.requestAnimationFrame = native;
    },
  };
}
