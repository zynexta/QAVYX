// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { buildExpandTimeline, P } from '@/motion/timelines/expandTimeline';
import { reemitAt } from '@/motion/timelines/refresh';
import { PIN_A } from '@/motion/scrollBudget';
import { atReady, mountStage, unmountStage, type MountedStage } from './helpers/stage';

/**
 * WHAT THE PIN LEAVES PAINTED.
 *
 * `#qx-stage` and every layer beside it are `position: fixed` and cover the
 * viewport for the WHOLE document, not just for the pin. So anything still
 * painted when the pin releases sits on top of §5 The Problem and everything
 * below it, for the rest of the page. That is not hypothetical: the launch's
 * finished trajectory used to stay held on screen after the pin ended, and a
 * green curve ran straight through the site index.
 *
 * A RESIZE is what turns a near-miss into a bug. `onRefresh` re-emits every
 * segment of the timeline at the current progress (see `reemitAt` for why it
 * must), and a seek backwards past a tween renders it at its START state —
 * which for a `.to()` is whatever the element was showing WHEN THE TIMELINE WAS
 * BUILT. The pin is built at `ready`, with the assembled logo on screen, so:
 *
 *   - `frameScale`'s fades may be plain `.to()`s. They sit at position 0, and
 *     `ready` IS progress 0, so the captured value is the truth.
 *   - Every segment that runs LATER may not. A build-time capture there is a
 *     snapshot of a screen the visitor left hundreds of vh ago, and the aperture,
 *     the title card and the launch all drive their layers from proxies and pure
 *     functions instead.
 *
 * These tests hold that line at the two ends where it matters, plus the one
 * ordering claim the new title card adds.
 */

const EPS = 1e-3;

interface PaintState {
  painted: boolean;
  why: string;
}

/** What an element is doing, from the properties the timelines actually write. */
function paintState(el: Element): PaintState {
  const style = (el as SVGElement | HTMLElement).style;
  if (style.display === 'none') return { painted: false, why: 'display: none' };
  if (style.visibility === 'hidden') return { painted: false, why: 'visibility: hidden' };

  const inline = style.opacity;
  if (inline !== '' && Number(inline) <= EPS) return { painted: false, why: `opacity: ${inline}` };

  // GSAP writes opacity as an inline style; the launch segment writes it as a
  // presentation attribute, for the same reason the frame does — a reverse
  // restores the authored string with no residual inline style. Both count.
  const attr = el.getAttribute('opacity');
  if (attr !== null && Number(attr) <= EPS) return { painted: false, why: `opacity="${attr}"` };

  if (inline !== '') return { painted: true, why: `opacity: ${inline}` };
  if (attr !== null) return { painted: true, why: `opacity="${attr}"` };
  return { painted: true, why: 'nothing hides it — no opacity, no visibility' };
}

function expectClear(el: Element, label: string): void {
  const state = paintState(el);
  expect(state.painted, `${label} is painting over the page (${state.why})`).toBe(false);
}

/**
 * The frame is the one layer never asserted "clear", because the aperture does
 * not fade it — it grows the box ~30x and flies the camera through the Q's gap.
 * At the end of the pin the path is still at opacity 1 and always will be; what
 * makes it harmless is that every edge of it is far outside the viewport.
 *
 * So the honest claim about the frame is geometric: the widest coordinate in the
 * emitted `d`, against jsdom's 1024x768. A frame that stopped flying out would
 * fail here while passing any opacity test you could write.
 */
function expectFrameFlownOut(frame: Element): void {
  const d = frame.getAttribute('d') ?? '';
  const extent = Math.max(...(d.match(/-?\d+(?:\.\d+)?/g) ?? ['0']).map(Number));
  expect(extent, `#qx-frame is still inside the viewport (widest coord ${extent})`).toBeGreaterThan(
    1024,
  );
}

let refs: MountedStage;

afterEach(() => {
  unmountStage();
});

/**
 * The guard against the rest of this file passing vacuously.
 *
 * Almost every assertion here is "after a refresh, X is not painted" — which is
 * also what you get if the refresh does nothing at all and X was never painted
 * in the first place. `reemitAt` reaches progress 0 through
 * `render(0, false, true)` precisely because a plain `progress(0)` on a timeline
 * already parked at 0 is skipped as redundant, so it is worth proving the force
 * actually forces.
 */
describe('a refresh at progress 0', () => {
  it('genuinely re-emits, rather than being skipped as redundant', () => {
    refs = mountStage();
    atReady(refs);
    const tl = buildExpandTimeline(refs);
    reemitAt(tl, 0);

    // Something else trashes the values this timeline owns — which is what a
    // resize amounts to, from the timeline's point of view.
    refs.wordmark.style.opacity = '0.33';
    refs.copy.style.opacity = '0.33';

    reemitAt(tl, 0);

    expect(refs.wordmark.style.opacity, 'the wordmark did not re-emit').toBe('1');
    expect(refs.copy.style.opacity, 'the intro copy did not re-emit').toBe('1');
  });

  it('does not run the pin to its far end on the way', () => {
    // The nudge used to be `tl.progress(p > 0 ? 0 : 1).progress(p)` — at
    // progress 0, seek to the END and come back. That was harmless arithmetic
    // when the last segment was the carousel; with the launch on the end it
    // meant every resize at the top of the pin ran the entire growth story to
    // its final frame first. Segments that correctly decline to write at their
    // own t=0 then leave that far-end state standing rather than their own.
    refs = mountStage();
    atReady(refs);
    const tl = buildExpandTimeline(refs);
    reemitAt(tl, 0);

    // The rocket has never been anywhere near the screen.
    expectClear(refs.launchLayer, '#qx-launch-layer');
    expectClear(refs.launchBeats, '#qx-launch-beats');
    expectClear(refs.launchTitle, '#qx-launch-title');
    expectClear(refs.rocketFilmLayer, '#qx-rocket-film');
    // ...and the frame is still the bowl, not the flown-out box.
    const d = refs.frame.getAttribute('d') ?? '';
    const extent = Math.max(...(d.match(/-?\d+(?:\.\d+)?/g) ?? ['0']).map(Number));
    expect(extent, 'the frame was left at its aperture size').toBeLessThan(1024);
  });
});

describe('the pin at rest', () => {
  it('opens on the assembled logo, because that is its own progress 0', () => {
    refs = mountStage();
    atReady(refs);
    const tl = buildExpandTimeline(refs);
    reemitAt(tl, 0);
    // The one progress that legitimately HAS paint in it: the intro has just
    // finished and the mark is standing. This is why `frameScale` may use plain
    // `.to()` fades where every later segment may not.
    expect(paintState(refs.wordmark).painted, 'the wordmark vanished at rest').toBe(true);
    expect(paintState(refs.frame).painted, 'the Q vanished at rest').toBe(true);
  });

  it('leaves nothing painted at progress 1, because §5 is directly below', () => {
    refs = mountStage();
    atReady(refs);
    const tl = buildExpandTimeline(refs);
    reemitAt(tl, 0); // built and refreshed at `ready`, as `createPin` does
    reemitAt(tl, 1);

    expectClear(refs.launchLayer, '#qx-launch-layer (the rocket and its trajectory)');
    // The film is a THIRD fixed full-viewport layer, and the one that now
    // carries the launch. Left painted it is a 1080p still sitting on §5 for the
    // rest of the page — the same failure, with more of the screen covered.
    expectClear(refs.rocketFilmLayer, '#qx-rocket-film (the launch film)');
    expectClear(refs.launchTitle, '#qx-launch-title (the title card)');
    // The labels are a second fixed full-viewport layer over §5. Left painted,
    // they sit on the growth story they are naming, for the rest of the page.
    expectClear(refs.launchBeats, '#qx-launch-beats (the prop and stage labels)');
    expectClear(refs.inkField, '#qx-ink-field');
    expectClear(refs.trackViewport, '#qx-track-viewport (the services carousel)');
    expectClear(refs.wordmark, '#qx-wordmark');
    expectClear(refs.cursor, '#qx-cursor');
    expectClear(refs.copy, '#qx-copy');
    // The frame is not cleared, it is flown out — see `expectFrameFlownOut`.
    expectFrameFlownOut(refs.frame);
  });
});

/**
 * The one ordering claim the title card adds, and the reason it has a hold and a
 * clear rather than simply fading out under the rocket: a title and the thing it
 * titles must not share the screen.
 */
describe('the title card and the rocket', () => {
  it('are never on screen together', () => {
    refs = mountStage();
    atReady(refs);
    const tl = buildExpandTimeline(refs);
    reemitAt(tl, 0);

    // Mid-card: the card is up and nothing has ignited.
    tl.progress(PIN_A.at('title', 0.4));
    expect(paintState(refs.launchTitle).painted, 'the card never appeared').toBe(true);
    expectClear(refs.rocketFilmLayer, '#qx-rocket-film (ignited under the title card)');

    // Mid-climb: the card is gone.
    //
    // THE ROCKET IS THE FILM NOW, so this is the layer the claim is made
    // against — `addLaunchSegment` is commented out in `expandTimeline.ts` and
    // `#qx-launch-layer` stays hidden for the whole pin (asserted below).
    tl.progress(PIN_A.at('launch', 0.4));
    expect(paintState(refs.rocketFilmLayer).painted, 'the film never appeared').toBe(true);
    expectClear(refs.launchTitle, '#qx-launch-title (still up during the climb)');
    expectClear(refs.launchLayer, '#qx-launch-layer (the commented-out SVG rocket)');
    expectClear(refs.launchBeats, '#qx-launch-beats (the commented-out prop labels)');
  });

  it('clears the card inside its own segment, before ignition', () => {
    // Asserted on the pure function rather than through the timeline, because
    // the claim is about the SEGMENT's shape: whatever the pin's length becomes,
    // the card must be gone by the time its own span ends.
    refs = mountStage();
    atReady(refs);
    const tl = buildExpandTimeline(refs);
    reemitAt(tl, 0);
    tl.progress(P.titleEnd);
    expectClear(refs.launchTitle, '#qx-launch-title at the end of its own segment');
  });
});

/**
 * A resize mid-carousel. The cross-paint has two directions and only one of them
 * is about text being covered: a re-emission must not TAKE AWAY what is
 * correctly on screen either.
 */
describe('a resize while the visitor is in the carousel', () => {
  it('leaves the frame and the panels standing', () => {
    refs = mountStage();
    atReady(refs);
    const tl = buildExpandTimeline(refs);
    reemitAt(tl, 0);

    const mid = (P.expandEnd + P.servicesEnd) / 2;
    tl.progress(mid);
    reemitAt(tl, mid);

    expect(paintState(refs.frame).painted, 'the frame vanished on resize').toBe(true);
    expect(paintState(refs.trackViewport).painted, 'the carousel vanished on resize').toBe(true);
    expectClear(refs.launchTitle, '#qx-launch-title (the card, 400vh early)');
    expectClear(refs.rocketFilmLayer, '#qx-rocket-film (the film, 460vh early)');
  });
});
