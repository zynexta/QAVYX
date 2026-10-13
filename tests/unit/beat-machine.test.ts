import { describe, expect, it } from 'vitest';
import { nextBeat, useHeroStore } from '../../state/heroStore';
import type { Beat, BeatEvent } from '../../types/hero';

/**
 * The Engine-1 state machine (TDD §10). Every row of the transition table is
 * asserted here, plus the guards and the no-op edges — the acceptance criterion
 * is that each row "fires and is unit-tested".
 */

/**
 * Every fixture here is `touch: false` — the POINTER path — which is what these
 * tests have always been asserting; the field is new (Phase 10) and the default
 * is the reading the table was written against. The touch branch has its own
 * describe block at the foot of this file, and it is deliberately not folded in
 * as a parameter to these: two of the table's edges lead somewhere ELSE on
 * touch, so a shared assertion would have to be written as a conditional and
 * would then pass whichever way it was wrong.
 */
const motion = { reducedMotion: false, introComplete: false, touch: false };
const reduced = { reducedMotion: true, introComplete: false, touch: false };
const returning = { reducedMotion: false, introComplete: true, touch: false };

describe('nextBeat — the §10 transition table', () => {
  it('boot → dot-in on ASSETS_READY (motion), → ready (reduced or returning)', () => {
    expect(nextBeat('boot', 'ASSETS_READY', motion)).toBe('dot-in');
    expect(nextBeat('boot', 'ASSETS_READY', reduced)).toBe('ready');
    expect(nextBeat('boot', 'ASSETS_READY', returning)).toBe('ready');
  });

  it('dot-in → pointer-wake on POINTER_MOVE, → logo-build on TIMEOUT', () => {
    expect(nextBeat('dot-in', 'POINTER_MOVE', motion)).toBe('pointer-wake');
    expect(nextBeat('dot-in', 'TIMEOUT', motion)).toBe('logo-build');
  });

  it('pointer-wake → cursor-morph on WAKE_DONE (the "auto" edge)', () => {
    expect(nextBeat('pointer-wake', 'WAKE_DONE', motion)).toBe('cursor-morph');
  });

  it('cursor-morph → click on MORPH_DONE, → logo-build on a mid-morph CLICK', () => {
    expect(nextBeat('cursor-morph', 'MORPH_DONE', motion)).toBe('click');
    expect(nextBeat('cursor-morph', 'CLICK', motion)).toBe('logo-build');
  });

  it('click → logo-build on CLICK or TIMEOUT', () => {
    expect(nextBeat('click', 'CLICK', motion)).toBe('logo-build');
    expect(nextBeat('click', 'TIMEOUT', motion)).toBe('logo-build');
  });

  it('logo-build → ready on BUILD_DONE', () => {
    expect(nextBeat('logo-build', 'BUILD_DONE', motion)).toBe('ready');
  });

  it('aperture → done on PIN_END', () => {
    expect(nextBeat('aperture', 'PIN_END', motion)).toBe('done');
  });

  it('SKIP and SCROLL_START collapse every Engine-1 beat to ready', () => {
    const engine1: Beat[] = ['dot-in', 'pointer-wake', 'cursor-morph', 'click', 'logo-build'];
    for (const beat of engine1) {
      expect(nextBeat(beat, 'SKIP', motion)).toBe('ready');
      expect(nextBeat(beat, 'SCROLL_START', motion)).toBe('ready');
    }
    // boot is Engine-1 too, but skipping before assets are ready still lands ready.
    expect(nextBeat('boot', 'SKIP', motion)).toBe('ready');
  });

  it('does not skip once past Engine 1', () => {
    expect(nextBeat('ready', 'SKIP', motion)).toBeNull();
    expect(nextBeat('services', 'SCROLL_START', motion)).toBeNull();
  });

  it('returns null for events that do not apply (no accidental transitions)', () => {
    const nonEvents: [Beat, BeatEvent][] = [
      ['dot-in', 'CLICK'],
      ['dot-in', 'MORPH_DONE'],
      ['pointer-wake', 'POINTER_MOVE'],
      ['click', 'MORPH_DONE'],
      ['ready', 'ASSETS_READY'],
      ['done', 'PIN_END'],
    ];
    for (const [beat, event] of nonEvents) {
      expect(nextBeat(beat, event, motion)).toBeNull();
    }
  });

  it('only the FIRST pointer move wakes — later moves are no-ops', () => {
    expect(nextBeat('dot-in', 'POINTER_MOVE', motion)).toBe('pointer-wake');
    expect(nextBeat('pointer-wake', 'POINTER_MOVE', motion)).toBeNull();
    expect(nextBeat('cursor-morph', 'POINTER_MOVE', motion)).toBeNull();
  });
});

/**
 * Phase 10's touch redesign of Engine 1, as the two edges of the table it
 * actually moves.
 *
 * BUILD-PLAN Phase 10's beat table has four rows, and only two of them are
 * transitions. `cursor-morph` ("morphs in place at viewport center") and
 * `logo-build` ("travel from center") are not: they are what happens when the
 * pointer follow is never enabled, so they are asserted by `HeroExperience`
 * passing `device.fine` and have no reducer to test. What is left here is the
 * pair that genuinely re-routes — and re-routing is exactly the kind of change
 * that a timing test would let through and a table test will not.
 */
describe('nextBeat — the touch branch (Phase 10)', () => {
  const touch = { reducedMotion: false, introComplete: false, touch: true };

  it('skips pointer-wake: TIMEOUT from dot-in goes to cursor-morph, not logo-build', () => {
    // The pointer path's 6s TIMEOUT means "nobody is here" and gives up on the
    // choreography. The same event on touch is the dot deciding for itself
    // after DOT_HOLD_TOUCH, and the sequence carries on into `click`, where a
    // tap can commit it. Same event, same beat, different destination.
    expect(nextBeat('dot-in', 'TIMEOUT', touch)).toBe('cursor-morph');
    expect(nextBeat('dot-in', 'TIMEOUT', motion)).toBe('logo-build');
  });

  it('refuses POINTER_MOVE on touch, so a swipe cannot wake a pointer', () => {
    // A touch device fires `pointermove` on any drag. `useHeroTimeline` does
    // not bind the listener on touch, but this is the lock that survives a
    // future caller that does — and it is why `pointer-wake` is "skipped"
    // rather than merely "unlikely".
    expect(nextBeat('dot-in', 'POINTER_MOVE', touch)).toBeNull();
    expect(nextBeat('dot-in', 'POINTER_MOVE', motion)).toBe('pointer-wake');
  });

  it('leaves every other edge alone — the intro is one sequence, not two', () => {
    expect(nextBeat('boot', 'ASSETS_READY', touch)).toBe('dot-in');
    expect(nextBeat('cursor-morph', 'MORPH_DONE', touch)).toBe('click');
    // "any tap commits", and the 4s fallback if none does.
    expect(nextBeat('click', 'CLICK', touch)).toBe('logo-build');
    expect(nextBeat('click', 'TIMEOUT', touch)).toBe('logo-build');
    expect(nextBeat('logo-build', 'BUILD_DONE', touch)).toBe('ready');
    // The skip and the first scroll gesture still collapse the whole of Engine 1.
    expect(nextBeat('click', 'SKIP', touch)).toBe('ready');
    expect(nextBeat('dot-in', 'SCROLL_START', touch)).toBe('ready');
  });

  it('reaches `ready` from boot with no input at all', () => {
    // The path a phone-less, mouse-less tablet visitor takes if they touch
    // nothing: every step is a timeout or an animation completing, and none of
    // them is a POINTER_MOVE. If any edge in this chain were left pointing at
    // `pointer-wake` the sequence would stall on a beat nothing can leave.
    let beat: Beat = 'boot';
    const drive = (event: BeatEvent) => {
      beat = nextBeat(beat, event, touch) ?? beat;
    };
    drive('ASSETS_READY'); // → dot-in
    drive('TIMEOUT'); // → cursor-morph  (1200ms, the dot morphs on its own)
    drive('MORPH_DONE'); // → click
    drive('TIMEOUT'); // → logo-build    (4000ms, nobody tapped)
    drive('BUILD_DONE'); // → ready
    expect(beat).toBe('ready');
  });
});

describe('store.send', () => {
  it('drives the beat and ignores inapplicable events', () => {
    useHeroStore.setState({
      beat: 'boot',
      reducedMotion: false,
      introComplete: false,
      touch: false,
    });
    const { send } = useHeroStore.getState();

    send('MORPH_DONE'); // not valid from boot
    expect(useHeroStore.getState().beat).toBe('boot');

    send('ASSETS_READY');
    expect(useHeroStore.getState().beat).toBe('dot-in');

    send('POINTER_MOVE');
    send('WAKE_DONE');
    send('MORPH_DONE');
    expect(useHeroStore.getState().beat).toBe('click');
  });

  it('respects the reducedMotion guard at boot', () => {
    useHeroStore.setState({ beat: 'boot', reducedMotion: true, introComplete: false });
    useHeroStore.getState().send('ASSETS_READY');
    expect(useHeroStore.getState().beat).toBe('ready');
  });

  it('skips the intro for a returning visitor', () => {
    useHeroStore.setState({ beat: 'boot', reducedMotion: false, introComplete: true });
    useHeroStore.getState().send('ASSETS_READY');
    expect(useHeroStore.getState().beat).toBe('ready');
  });

  it('reads `touch` from the store, not from a parameter', () => {
    // `send` builds the BeatContext itself, so a field added to the context and
    // not to that object is a branch that silently never fires — every touch
    // visitor would quietly get the pointer table and nothing would fail.
    useHeroStore.setState({
      beat: 'dot-in',
      reducedMotion: false,
      introComplete: false,
      touch: true,
    });
    useHeroStore.getState().send('TIMEOUT');
    expect(useHeroStore.getState().beat).toBe('cursor-morph');
    useHeroStore.setState({ touch: false });
  });
});
