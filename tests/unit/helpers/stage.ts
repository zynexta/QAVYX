import { computeTrajectoryPath, TRAJECTORY_DEBRIS } from '@/motion/geometry';
import { BILLOW_COUNT, SMOKE_COUNT } from '@/motion/timelines/launchTimeline';
import { PANEL_COUNT } from '@/content/carousel';
import { FAILURE_MODES } from '@/content/launch';
import type { StageRefs } from '@/types/hero';

/**
 * A jsdom stand-in for the mounted hero, faithful enough that the real timeline
 * factories can be built against it and seeked.
 *
 * "Faithful enough" is doing real work here, and it is worth naming what it
 * covers. GSAP resolves selector strings through `document`, so a target that is
 * absent is not an error — it is a silently empty tween, which means the
 * position it was written at stops being covered by the test that was supposed
 * to cover it. Every selector-addressed target the timelines touch is therefore
 * present below (`#qx-copy`, `.qx-mouse-face`, `.qx-panel`), not just the nodes
 * that arrive through `StageRefs`.
 *
 * The launch subtree mirrors `LaunchLayer` structurally rather than
 * approximately: the counts come from the same two tables the component maps
 * over, and the route is the real `computeTrajectoryPath` output inside a real
 * `translate(pad pad)` group — `launchTimeline` parses that transform off
 * `traj.parentElement` to place the vehicle, so a flat mount would exercise a
 * different code path than the one that ships.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

/** jsdom reports 1024x768; `LaunchLayer` pads the trajectory box by 10% of the
 *  short side, and the timeline reads that offset back out of the transform. */
const VW = 1024;
const VH = 768;

/**
 * `mouseFace` is not in `StageRefs` — it is a CLASS (`.qx-mouse-face`), a pair
 * of nodes the timelines fade as a set rather than by ref. It is handed back
 * anyway because a test that asserts "nothing is painted between the pins" has
 * to be able to name every fixed layer, including the ones GSAP finds for
 * itself.
 */
export type MountedStage = StageRefs & {
  mouseFace: SVGGElement;
  /**
   * Narrowed from `StageRefs`, where both are nullable so that a browser which
   * refuses the element costs the visitor the launch beat rather than the whole
   * hero. A mounted stage always has them, so the tests need no `!`.
   */
  rocketFilmLayer: HTMLElement;
  rocketFrames: HTMLCanvasElement;
};

export function mountStage(): MountedStage {
  const stage = svg('svg');
  stage.id = 'qx-stage';
  const frame = svg('path');
  frame.id = 'qx-frame';
  const wordmark = svg('g');
  wordmark.id = 'qx-wordmark';
  const cursor = svg('path');
  cursor.id = 'qx-cursor';
  const cursorNode = svg('g');
  cursorNode.id = 'qx-cursor-node';
  const cursorPress = svg('g');
  cursorPress.id = 'qx-cursor-press';
  stage.append(frame, wordmark, cursorNode);
  cursorNode.append(cursorPress);
  cursorPress.append(cursor);

  const mouseFace = svg('g');
  mouseFace.setAttribute('class', 'qx-mouse-face');
  stage.append(mouseFace);

  // --- the launch subtree, mirroring LaunchLayer -------------------------
  const pad = Math.min(VW, VH) * 0.1;
  const box = { w: VW - pad * 2, h: VH - pad * 2 };

  const launchLayer = svg('g');
  launchLayer.id = 'qx-launch-layer';
  launchLayer.style.visibility = 'hidden';

  const inner = svg('g');
  inner.setAttribute('transform', `translate(${pad} ${pad})`);
  const traj = svg('path');
  traj.id = 'qx-traj';
  traj.setAttribute('d', computeTrajectoryPath(box.w, box.h));
  traj.setAttribute('pathLength', '100');
  traj.setAttribute('stroke-dasharray', '0 100');
  inner.append(traj);

  const column = svg('path');
  column.id = 'qx-launch-column';
  column.setAttribute('opacity', '0');
  inner.append(column);

  // One puff per table entry, exactly as the component renders them.
  for (let i = 0; i < SMOKE_COUNT; i++) {
    const puff = svg('circle');
    puff.setAttribute('class', 'qx-launch-smoke');
    puff.setAttribute('opacity', '0');
    inner.append(puff);
  }

  // One prop per entry, so the mount has exactly as many as the component.
  // A single path each: ride, throw and tumble compose into the one transform
  // the timeline writes, and the burn is paint on the same node.
  for (let i = 0; i < TRAJECTORY_DEBRIS.length; i++) {
    const frag = svg('path');
    frag.setAttribute('class', 'qx-launch-debris');
    frag.setAttribute('opacity', '0');
    inner.append(frag);
  }

  const rocket = svg('g');
  rocket.id = 'qx-rocket';
  rocket.setAttribute('opacity', '0');
  // A GROUP, as in the component: the timeline scales it about the nozzle.
  const exhaust = svg('g');
  exhaust.id = 'qx-rocket-exhaust';
  exhaust.setAttribute('opacity', '0');
  rocket.append(exhaust);

  // The billow sits FIRST, behind everything — a group whose OPACITY the timeline
  // writes, holding the mounds, in the same order the component renders it.
  const billowGroup = svg('g');
  billowGroup.id = 'qx-billow';
  billowGroup.setAttribute('opacity', '0');
  for (let i = 0; i < BILLOW_COUNT; i++) {
    const mound = svg('circle');
    mound.setAttribute('class', 'qx-launch-billow');
    billowGroup.append(mound);
  }
  launchLayer.append(billowGroup, inner, rocket);
  stage.append(launchLayer);

  // --- the DOM siblings of the stage -------------------------------------
  const copy = document.createElement('div');
  copy.id = 'qx-copy';

  const trackViewport = document.createElement('div');
  trackViewport.id = 'qx-track-viewport';
  const track = document.createElement('div');
  track.id = 'qx-track';
  for (let i = 0; i < PANEL_COUNT; i++) {
    const panel = document.createElement('div');
    panel.className = 'qx-panel';
    track.append(panel);
  }
  trackViewport.append(track);

  const inkField = document.createElement('div');
  inkField.id = 'qx-ink-field';

  const launchTitle = document.createElement('div');
  launchTitle.id = 'qx-launch-title';

  // The label layer, mirroring `LaunchBeats`: one node per failure mode,
  // addressed by class. The count comes from the same content the component
  // maps over — a mount with the wrong number of labels would leave the
  // timeline writing to fewer elements than ship, silently. The waypoints are
  // uncaptioned by design, so there is nothing here for them.
  const launchBeats = document.createElement('div');
  launchBeats.id = 'qx-launch-beats';
  launchBeats.style.visibility = 'hidden';
  for (const m of FAILURE_MODES) {
    const label = document.createElement('p');
    label.className = 'qx-beat-prop';
    label.textContent = m.label;
    launchBeats.append(label);
  }

  // The launch film's layer, mirroring `RocketVideo`. `visibility: hidden` at
  // rest is the stylesheet's job in the browser and this element's own here, so
  // that `paintState` reads the same at-rest answer either way.
  //
  // The <video> stays at jsdom's `readyState` 0, which is deliberate: it is what
  // a real element reports before its metadata lands, and it is the branch
  // `addRocketVideoSegment` takes when there is nothing to seek. So these tests
  // exercise the layer's paint contract — the half that must hold whether or not
  // the film ever loads — and `rocket-video.test.ts` covers the seek.
  const rocketFilmLayer = document.createElement('div');
  rocketFilmLayer.id = 'qx-rocket-film';
  rocketFilmLayer.style.visibility = 'hidden';
  const rocketFrames = document.createElement('canvas');
  rocketFilmLayer.append(rocketFrames);

  document.body.append(
    stage,
    copy,
    trackViewport,
    inkField,
    launchTitle,
    launchBeats,
    rocketFilmLayer,
  );

  return {
    stage,
    frame,
    wordmark,
    cursor,
    cursorNode,
    cursorPress,
    track,
    trackViewport,
    inkField,
    launchLayer,
    copy,
    launchTitle,
    launchBeats,
    rocketFilmLayer,
    rocketFrames,
    mouseFace,
  };
}

export function unmountStage(): void {
  document.body.innerHTML = '';
}

function paint(el: SVGElement | HTMLElement, on: boolean): void {
  el.style.visibility = on ? 'visible' : 'hidden';
  el.style.opacity = on ? '1' : '0';
}

/**
 * The state Engine 1 leaves behind at `ready` — the assembled logo, the intro
 * copy, and every scroll-driven layer still down.
 *
 * The pin's timeline is constructed here, in `createPin`, and that timing is
 * load-bearing rather than incidental: GSAP captures a `.to()`'s start value
 * from the element's state at build time. For the segments at position 0 that
 * is harmless, because this IS progress 0. For every later segment a captured
 * value would be a snapshot of a screen the visitor left hundreds of vh ago,
 * which is why they all drive their layers from proxies instead.
 */
export function atReady(r: MountedStage): void {
  paint(r.frame, true);
  paint(r.wordmark, true);
  paint(r.cursor, true);
  paint(r.mouseFace, true);
  paint(r.copy, true);
  paint(r.trackViewport, false);
  paint(r.launchLayer, false);
  paint(r.launchTitle, false);
  paint(r.launchBeats, false);
  paint(r.rocketFilmLayer, false);
  r.inkField.style.opacity = '0';
}
