import { describe, expect, it } from 'vitest';
import {
  CAROUSEL_END,
  CAROUSEL_START,
  localProgress,
  PANEL_DIM,
  panelOpacity,
  progressForIndex,
  scrollIndex,
  snapProgress,
  STEPS,
} from '../../motion/timelines/carouselTimeline';
import { PANEL_COUNT } from '../../content/carousel';
import { trackTravel } from '../../motion/timelines/expandTimeline';
import { computeFrameGeometry, frameInnerWidth } from '../../motion/geometry';

/**
 * The carousel's arithmetic. All of it is pure, so all of it is testable without
 * a browser — which matters because the failure modes here (an index that lags
 * the eye, a snap that grabs the frame expansion) are the kind that look like
 * "the animation feels wrong" rather than like a bug.
 */

describe('scroll index', () => {
  it('has five steps between six panels', () => {
    // Six since the Launchpad panel: five pillars and then the product. The
    // count lives in `content/carousel.ts`, not on `SERVICES` — the pillar list
    // is still five and must stay that way.
    expect(STEPS).toBe(5);
    expect(PANEL_COUNT).toBe(6);
  });

  it('maps the segment to 0..1 and clamps outside it', () => {
    expect(localProgress(CAROUSEL_START)).toBeCloseTo(0, 6);
    expect(localProgress(CAROUSEL_END)).toBeCloseTo(1, 6);
    expect(localProgress((CAROUSEL_START + CAROUSEL_END) / 2)).toBeCloseTo(0.5, 6);
    expect(localProgress(0)).toBe(0); // during the frame expansion
    expect(localProgress(1)).toBe(1); // during the exit
  });

  it('lands on each panel in turn', () => {
    for (let i = 0; i <= STEPS; i++) expect(scrollIndex(i / STEPS)).toBe(i);
  });

  it('flips to the NEAREST panel, at the halfway point of each step', () => {
    // Math.round, not floor: the index must change when the incoming panel
    // becomes the more visible of the two, which is mid-step. Floor would hold
    // the old number for a whole step and visibly disagree with the screen.
    //
    // DERIVED FROM `STEPS`, not typed. This test used to read `scrollIndex(0.124)
    // -> 0`, which was the halfway point of step 1 while there were four steps
    // and is a fifth of the way into step 1 now that there are five. A literal
    // here does not fail when the panel count changes — it quietly starts
    // asserting something else that happens to be true.
    const eps = 1e-4;
    for (let i = 0; i < STEPS; i++) {
      const halfway = (i + 0.5) / STEPS;
      expect(scrollIndex(halfway - eps)).toBe(i);
      expect(scrollIndex(halfway + eps)).toBe(i + 1);
    }
  });

  it('changes exactly once per step across the whole segment', () => {
    let changes = 0;
    let prev = scrollIndex(0);
    for (let i = 1; i <= 5000; i++) {
      const next = scrollIndex(i / 5000);
      if (next !== prev) changes++;
      prev = next;
    }
    expect(changes).toBe(STEPS);
    expect(prev).toBe(STEPS); // and ends on the last panel
  });

  it('never returns an index without a panel', () => {
    for (const local of [-5, -0.001, 0, 0.5, 1, 1.001, 42]) {
      const i = scrollIndex(local);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(PANEL_COUNT);
      expect(Number.isInteger(i)).toBe(true);
    }
  });
});

describe('snapping', () => {
  it('passes values through UNCHANGED outside the carousel', () => {
    // Snapping the expansion would drag the frame to a size the user never
    // asked for — the single most jarring thing this component could do.
    //
    // Expressed in the carousel's OWN terms rather than as decimals. The
    // literals this used to carry (0.1, 0.16, 0.88) stopped being outside the
    // carousel the moment the segment map moved, and the failure read as a
    // broken snap guard rather than as a stale test.
    const outside = [
      0,
      CAROUSEL_START / 2,
      CAROUSEL_START,
      CAROUSEL_END,
      CAROUSEL_END + (1 - CAROUSEL_END) / 2,
      1,
    ];
    for (const p of outside) {
      expect(snapProgress(p)).toBe(p);
    }
  });

  it('snaps to one position per panel inside the carousel', () => {
    const landed = new Set<number>();
    for (let i = 1; i < 1000; i++) {
      const p = CAROUSEL_START + (i / 1000) * (CAROUSEL_END - CAROUSEL_START);
      const snapped = snapProgress(p);
      expect(snapped).toBeGreaterThanOrEqual(CAROUSEL_START - 1e-9);
      expect(snapped).toBeLessThanOrEqual(CAROUSEL_END + 1e-9);
      landed.add(Number(snapped.toFixed(6)));
    }
    expect(landed.size).toBe(PANEL_COUNT);
  });

  it('is idempotent — snapping a snapped value does not drift', () => {
    for (let i = 0; i <= STEPS; i++) {
      const p = progressForIndex(i);
      expect(snapProgress(snapProgress(p))).toBeCloseTo(snapProgress(p), 9);
      expect(scrollIndex(localProgress(p))).toBe(i);
    }
  });

  it('resolves a fast flick to the nearest panel, not the next one', () => {
    // A flick that crosses three and a bit panels must land on the fourth.
    const flick = progressForIndex(3) + (CAROUSEL_END - CAROUSEL_START) * 0.02;
    expect(scrollIndex(localProgress(snapProgress(flick)))).toBe(3);
  });
});

describe('panel cross-fade', () => {
  it('gives the active panel full opacity and the rest the dim value', () => {
    for (let i = 0; i <= STEPS; i++) {
      const local = i / STEPS;
      expect(panelOpacity(i, local)).toBeCloseTo(1, 6);
      for (let j = 0; j <= STEPS; j++) {
        if (j !== i) expect(panelOpacity(j, local)).toBeCloseTo(PANEL_DIM, 6);
      }
    }
  });

  it('holds steady either side of the fade band', () => {
    // The flat 30% either side is what makes a panel look settled when the
    // scroll stops near a snap point rather than perpetually mid-fade.
    expect(panelOpacity(0, 0.29 / STEPS)).toBeCloseTo(1, 6);
    expect(panelOpacity(0, 0.71 / STEPS)).toBeCloseTo(PANEL_DIM, 6);
  });

  it('cross-fades symmetrically — the pair always sums the same mid-step', () => {
    const mid = 0.5 / STEPS;
    expect(panelOpacity(0, mid)).toBeCloseTo(panelOpacity(1, mid), 6);
  });

  it('never leaves a panel invisible or over-bright', () => {
    for (let i = 0; i <= STEPS; i++) {
      for (let k = 0; k <= 200; k++) {
        const o = panelOpacity(i, k / 200);
        expect(o).toBeGreaterThanOrEqual(PANEL_DIM - 1e-9);
        expect(o).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });
});

describe('track travel', () => {
  it('moves exactly one panel width per step, so the last lands flush', () => {
    for (const [vw, vh] of [
      [1440, 900],
      [1920, 1080],
      [1024, 768],
      [375, 667],
    ] as const) {
      const panel = frameInnerWidth(vw, vh);
      expect(trackTravel(vw, vh)).toBeCloseTo(panel * STEPS, 6);
      // The panel is the frame minus its stroke on both sides. Laying panels
      // out at frame.w while travelling by the inner width (or the reverse)
      // drifts by two stroke widths per step — visible by the fifth panel.
      expect(panel).toBeLessThan(computeFrameGeometry(vw, vh).w);
    }
  });

  it('re-reads the viewport rather than caching a distance', () => {
    expect(trackTravel(1920, 1080)).not.toBeCloseTo(trackTravel(1440, 900), 1);
  });
});
