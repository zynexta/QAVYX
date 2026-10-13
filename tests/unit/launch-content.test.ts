import { describe, expect, it } from 'vitest';
import {
  FAILURE_MODES,
  GROWTH_STAGES,
  LAUNCH_COPY,
  LAUNCH_THESIS,
} from '../../content/launch';
import { TRAJECTORY_DEBRIS, TRAJECTORY_WAYPOINTS, computeTrajectoryPath } from '../../motion/geometry';

/**
 * The launch content and the shape that reads it.
 *
 * The point of these is the coupling: the trajectory has to have exactly as many
 * detach points as there are failure modes and exactly as many waypoints as
 * there are stages. Add a fifth failure mode to the content and the animation
 * silently drops it; add a detach point and it throws away a fragment with no
 * label. Neither shows up as a crash.
 */

describe('the growth story content', () => {
  it('carries the draft’s four failure modes and three stages', () => {
    expect(FAILURE_MODES).toHaveLength(4);
    expect(GROWTH_STAGES).toHaveLength(3);
    expect(GROWTH_STAGES.map((s) => s.label)).toEqual(['Strategy', 'Execution', 'Automation']);
  });

  it('has a unique id for every item', () => {
    const ids = [...FAILURE_MODES, ...GROWTH_STAGES].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ships no placeholder or document metadata', () => {
    // "Website Content Draft — for Development & Design Handoff" is a cover-page
    // label, and "Dev/Content note" marks build instructions. Neither is copy.
    const all = [
      LAUNCH_THESIS,
      ...Object.values(LAUNCH_COPY),
      ...FAILURE_MODES.flatMap((m) => [m.label, m.body]),
      ...GROWTH_STAGES.flatMap((s) => [s.label, s.body]),
    ].join(' ');
    for (const forbidden of [
      'Lorem',
      'TODO',
      'Dev/Content note',
      'CTA BUTTON',
      'Website Content Draft',
      'Placeholder',
      '{',
    ]) {
      expect(all).not.toContain(forbidden);
    }
  });

  it('says nothing the draft does not', () => {
    // Guards against a number or a claim drifting in to make the animation more
    // impressive. The draft supplies no statistics for this section.
    const bodies = FAILURE_MODES.map((m) => m.body).join(' ');
    expect(bodies).not.toMatch(/\d+%/);
  });
});

describe('the trajectory', () => {
  it('has one detach point per failure mode and one waypoint per stage', () => {
    expect(TRAJECTORY_DEBRIS).toHaveLength(FAILURE_MODES.length);
    expect(TRAJECTORY_WAYPOINTS).toHaveLength(GROWTH_STAGES.length);
  });

  it('climbs dead straight, bottom centre to the top', () => {
    // This test used to assert the OPPOSITE — a route that dips mid-flight.
    // The client then directed a real launch: bottom centre, straight up, not
    // curved (session of 2026-08-13). The "growth is not a straight line"
    // beat now lives in time and light — the near-stall in `LEGS`, the
    // exhaust dying, the drawn route holding, the props burning away — and
    // the ROUTE is a plumb line, which is what this asserts.
    const ys = TRAJECTORY_WAYPOINTS.map((p) => p.y);
    for (let i = 1; i < ys.length; i++) expect(ys[i]!).toBeLessThan(ys[i - 1]!);

    const path = computeTrajectoryPath(1, 1);
    const coords = [...path.matchAll(/(\d*\.?\d+),(\d*\.?\d+)/g)];
    const xs = coords.map((m) => Number(m[1]));
    const pts = coords.map((m) => Number(m[2]));
    expect(pts[0]!).toBeGreaterThan(0.9); // starts on the pad
    expect(pts.at(-1)!).toBeLessThan(0.1); // leaves the top
    // Every point is on the centre plumb line...
    for (const x of xs) expect(x).toBeCloseTo(0.5, 9);
    // ...and the climb never reverses: monotonic, top to bottom.
    for (let i = 1; i < pts.length; i++) expect(pts[i]!).toBeLessThanOrEqual(pts[i - 1]!);
  });

  it('sheds every fragment before the stall', () => {
    // They are what the climb costs, not what the stall causes.
    for (const d of TRAJECTORY_DEBRIS) expect(d.at).toBeLessThan(0.7);
  });

  it('scales into any box', () => {
    const path = computeTrajectoryPath(240, 180);
    const xs = [...path.matchAll(/(\d*\.?\d+),(\d*\.?\d+)/g)].map((m) => Number(m[1]));
    expect(Math.max(...xs)).toBeLessThanOrEqual(240);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(path.startsWith('M')).toBe(true);
  });
});
