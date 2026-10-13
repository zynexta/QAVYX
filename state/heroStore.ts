import { create } from 'zustand';
import { ENGINE_1_BEATS, type Beat, type BeatEvent } from '@/types/hero';

/**
 * The reactive store and the Engine-1 state machine.
 *
 * The reactive/transient split (TDD §10) keeps this at 60fps: only the fields
 * here — beat, reducedMotion, introComplete — live in the store, and they change
 * ~10 times across the whole experience. Anything per-frame (pointer position,
 * scroll/morph progress) is a ref written by GSAP and MUST NOT come here.
 *
 * `nextBeat` is a PURE reducer over the §10 transition table, exported so the
 * whole machine is unit-testable without React, GSAP or a DOM. The store's
 * `send` applies it; the timeline hook subscribes to the resulting beat change
 * and runs the side effects (play a segment, kill the breathe loop, create the
 * pin). Side effects never live in the store — state/ may import only @/types.
 */

const isEngine1 = (beat: Beat) => ENGINE_1_BEATS.includes(beat);

export interface BeatContext {
  reducedMotion: boolean;
  /** Set from sessionStorage — a return visit within the session skips the intro. */
  introComplete: boolean;
  /**
   * No precise pointer exists on this machine — `any-pointer: fine` is false.
   * See `hooks/useDeviceTier.ts` for why that query and not `hover: hover`.
   *
   * BUILD-PLAN Phase 10 redesigns two of Engine 1's edges for touch, and both
   * are here rather than in the timelines because both are about WHICH BEAT
   * COMES NEXT rather than about how one looks. A touchscreen laptop reports a
   * fine pointer and is therefore not `touch`: it keeps the full pointer
   * experience, which is one of the phase's acceptance criteria.
   */
  touch: boolean;
}

/**
 * The transition table. Returns the next beat, or null when the event does not
 * apply to the current beat (a no-op). Beats 7+ are scroll-derived and are not
 * reachable through here.
 */
export function nextBeat(beat: Beat, event: BeatEvent, ctx: BeatContext): Beat | null {
  // Skip / first scroll gesture collapses any Engine-1 beat to the finished logo.
  if ((event === 'SKIP' || event === 'SCROLL_START') && isEngine1(beat)) {
    return beat === 'ready' ? null : 'ready';
  }

  switch (beat) {
    case 'boot':
      // Reduced motion OR a returning visitor lands on the finished logo directly.
      if (event === 'ASSETS_READY') {
        return ctx.reducedMotion || ctx.introComplete ? 'ready' : 'dot-in';
      }
      return null;
    case 'dot-in':
      // THE TOUCH BRANCH, AND IT IS TWO EDGES REDIRECTED RATHER THAN ONE.
      //
      // `pointer-wake` is SKIPPED on touch (BUILD-PLAN Phase 10's beat table):
      // there is no pointer to be woken by, and the beat's whole content is the
      // dot acknowledging that it has been noticed. A touch device still fires
      // `pointermove` — during a drag, and on some browsers on the first tap —
      // so refusing the event here is what makes "skipped" structural rather
      // than dependent on `useHeroTimeline` remembering not to bind a listener.
      // Two locks on one door, the same arrangement `createPin`'s reduced-motion
      // guard has with `HeroMount`.
      //
      // And the timeout leads somewhere else. On a pointer device six seconds
      // of stillness means "nobody is here" and the hero finishes itself; on
      // touch, stillness is the NORMAL state of the device and 1200ms of it is
      // simply the visitor reading. So the dot morphs on its own and the
      // sequence continues into `click`, which is where a tap can commit it.
      // The two timeouts are DOT_HOLD_TOUCH and 6s in `useHeroTimeline`.
      if (event === 'POINTER_MOVE') return ctx.touch ? null : 'pointer-wake';
      if (event === 'TIMEOUT') return ctx.touch ? 'cursor-morph' : 'logo-build';
      return null;
    case 'pointer-wake':
      if (event === 'WAKE_DONE') return 'cursor-morph';
      // An eager click during the 120ms snap is honoured, not dropped.
      if (event === 'CLICK') return 'logo-build';
      return null;
    case 'cursor-morph':
      if (event === 'MORPH_DONE') return 'click';
      // A click mid-morph must be honoured, not swallowed: fast-forward and build.
      if (event === 'CLICK') return 'logo-build';
      return null;
    case 'click':
      if (event === 'CLICK' || event === 'TIMEOUT') return 'logo-build';
      return null;
    case 'logo-build':
      if (event === 'BUILD_DONE') return 'ready';
      return null;
    // Whichever segment is last on the pin ends the experience. Accepted from
    // both so the table stays correct while the launch segment is being built:
    // at 500vh the aperture is terminal, at 820vh the launch is.
    case 'aperture':
    case 'launch':
      if (event === 'PIN_END') return 'done';
      return null;
    default:
      return null;
  }
}

interface HeroState {
  beat: Beat;
  reducedMotion: boolean;
  introComplete: boolean;
  /** See `BeatContext.touch`. Written once, at boot, by `useHeroTimeline`. */
  touch: boolean;
  /** Index of the service panel currently under the carousel's read head, 0-4. */
  activeService: number;
  setBeat: (beat: Beat) => void;
  send: (event: BeatEvent) => void;
  setReducedMotion: (v: boolean) => void;
  setIntroComplete: (v: boolean) => void;
  setActiveService: (i: number) => void;
}

export const useHeroStore = create<HeroState>((set, get) => ({
  beat: 'boot',
  reducedMotion: false,
  introComplete: false,
  // Defaults to the POINTER reading, matching `reducedMotion: false` beside it:
  // the store is constructed before anything has measured, and the desktop path
  // is the one that is safe to be wrong about for a tick. `useHeroTimeline`
  // overwrites it synchronously at boot, before `ASSETS_READY` is sent.
  touch: false,
  activeService: 0,
  // Direct beat write, used by the scroll onUpdate (beats 7+). No-op on the same
  // value so a per-frame call re-renders at most once per genuine change.
  setBeat: (beat) => set((s) => (s.beat === beat ? s : { beat })),
  send: (event) => {
    const { beat, reducedMotion, introComplete, touch } = get();
    const next = nextBeat(beat, event, { reducedMotion, introComplete, touch });
    if (next && next !== beat) set({ beat: next });
  },
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setIntroComplete: (introComplete) => set({ introComplete }),
  // Called from the carousel's scroll onUpdate — i.e. up to 60x a second. The
  // same-value guard is what keeps the indicator at 4 renders across the whole
  // segment instead of ~240: without it every frame is a store write, and every
  // store write re-renders every subscriber.
  setActiveService: (i) => set((s) => (s.activeService === i ? s : { activeService: i })),
}));

/** Imperative helpers for GSAP callbacks (outside React's render cycle). */
export const setHeroBeat = (beat: Beat) => useHeroStore.getState().setBeat(beat);
export const sendHeroEvent = (event: BeatEvent) => useHeroStore.getState().send(event);
export const setActiveService = (i: number) => useHeroStore.getState().setActiveService(i);
