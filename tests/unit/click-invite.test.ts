import { describe, expect, it } from 'vitest';
import { CLICK_TIMEOUT, INVITE_RHYTHM } from '../../motion/timelines/introTimeline';

/**
 * The `click` beat's fallback timing.
 *
 * The fallback fires the SAME press the invite has been demonstrating, so where
 * it lands in the loop is not cosmetic: on top of a demonstration, the glyph is
 * already mid-press when the real one starts and the confirmation is swallowed
 * by the cue it is meant to answer. These assertions are what let the loop be
 * retuned — a slower ripple, a longer gap — without that silently regressing.
 */
describe('the click-beat fallback', () => {
  const { lead, demo, cycle } = INVITE_RHYTHM;
  /** How far into the current demonstration cycle the fallback fires. */
  const into = (CLICK_TIMEOUT - lead) % cycle;

  it('fires in the silence between demonstrations, never over one', () => {
    expect(into).toBeGreaterThan(demo);
    expect(into).toBeLessThan(cycle);
  });

  it('leaves room on both sides, so the press is not crowded either way', () => {
    // Not a hair after the ripple has faded, and not a hair before the next
    // press starts — both read as a collision at 60fps.
    expect(into - demo).toBeGreaterThan(0.3);
    expect(cycle - into).toBeGreaterThan(0.3);
  });

  it('lets three full demonstrations play first', () => {
    const completed = Math.floor((CLICK_TIMEOUT - lead) / cycle) + (into >= demo ? 1 : 0);
    expect(completed).toBe(3);
  });

  it('still resolves the intro well inside the "is this broken?" threshold', () => {
    // Longer than the TDD's flat 5s, because that was written for a cue that
    // did not move — but a visitor must never be left wondering.
    expect(CLICK_TIMEOUT).toBeGreaterThan(5);
    expect(CLICK_TIMEOUT).toBeLessThan(8);
  });
});
