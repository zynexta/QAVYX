'use client';

import { useLayoutEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/motion/gsap';
import { computeLogoGeometry } from '@/motion/geometry';
import { motionViewport } from '@/motion/viewport';
import { PIN_A, PIN_SCRUB, PIN_SCRUB_TOUCH } from '@/motion/scrollBudget';
import {
  buildLogoBuild,
  CLICK_TIMEOUT,
  CLICK_TIMEOUT_TOUCH,
  DOT_HOLD_TOUCH,
  LOGO_BUILD_TOUCH,
  mouseBodyAtOrigin,
  tlClickInvite,
  tlClickInviteTouch,
  tlCursorMorph,
  tlDotIn,
  tlBreathe,
  tlPointerWake,
  type IntroConfig,
} from '@/motion/timelines/introTimeline';
import { beatForProgress, buildExpandTimeline } from '@/motion/timelines/expandTimeline';
import { reemitAt } from '@/motion/timelines/refresh';
import { snapProgress } from '@/motion/timelines/carouselTimeline';
import { EASE } from '@/motion/eases';
import { setFrameBox, setFrameDraw } from '@/motion/timelines/frameOps';
import { sendHeroEvent, setHeroBeat, useHeroStore } from '@/state/heroStore';
import {
  CLICK_HINT_SELECTOR,
  CURSOR_LIVE_SELECTOR,
  MOUSE_FACE_SELECTOR,
  PIN_ID,
  type Beat,
  type StageRefs,
} from '@/types/hero';
import type { PointerFollow } from './usePointerFollow';

/**
 * The one place GSAP is constructed for the hero, and the runtime half of the
 * Engine-1 state machine. The store owns the PURE transitions (state/heroStore);
 * this hook subscribes to the resulting beat change and runs the SIDE EFFECTS —
 * play a segment, start/kill the breathe loop, arm a timeout, create the pin.
 * Events (move, click, scroll, Escape, timeout, animation-complete) call
 * `send()`; nothing here decides transitions itself.
 *
 * Everything lives in a single useGSAP scope so StrictMode's double-invoke
 * reverts the first context, and every listener/timeline is cleaned up with it.
 */
const INTRO_COMPLETE_KEY = 'qx-intro-complete';

interface UseHeroTimelineOptions {
  scope: React.RefObject<HTMLElement | null>;
  follow: React.RefObject<PointerFollow | null>;
  /** Live viewport; a change re-lays-out the GSAP-owned nodes onto the new size. */
  viewport: { vw: number; vh: number };
  /**
   * No precise pointer on this machine — Engine 1 runs its touch beats.
   *
   * Passed in rather than read from `matchMedia` here, unlike `reducedMotion`
   * below, because the same answer decides three things in three files and they
   * must not be able to disagree: whether `usePointerFollow` is enabled
   * (`HeroExperience`), which beats run (here), and whether the whole motion
   * layer mounts at all (`HeroMount`, via the same `useDeviceTier` call). A
   * second `matchMedia` here would be a fourth reading of a question already
   * answered upstream.
   *
   * It is NOT a dependency of the GSAP scope. `useDeviceTier` re-renders on a
   * change (plugging a mouse into a tablet), but rebuilding the whole hero
   * mid-intro to change which timeout is armed would be worse than finishing the
   * intro the way it started; the beats that follow `ready` are identical either
   * way. The `dependencies: []` below is what makes that true, and it is why
   * this is read through a ref-free closure capture rather than watched.
   */
  touch: boolean;
  /**
   * `device.tier === 'low'`. The only thing it decides here is whether the
   * pinned timeline is built with the panel cross-fade; the other half of the
   * criterion (the glow) is a mount decision and lives in `HeroSection`.
   *
   * Read at pin-creation time, which is after `ready` — so it is settled long
   * before it is needed and does not want a dependency any more than `touch`.
   */
  lowTier: boolean;
}

function gatherRefs(): StageRefs | null {
  const stage = document.getElementById('qx-stage') as SVGSVGElement | null;
  const cursor = document.getElementById('qx-cursor') as SVGPathElement | null;
  const cursorNode = document.getElementById('qx-cursor-node') as SVGGElement | null;
  const cursorPress = document.getElementById('qx-cursor-press') as SVGGElement | null;
  const frame = document.getElementById('qx-frame') as SVGPathElement | null;
  const wordmark = document.getElementById('qx-wordmark') as SVGGElement | null;
  const trackViewport = document.getElementById('qx-track-viewport');
  const track = document.getElementById('qx-track');
  const inkField = document.getElementById('qx-ink-field');
  const launchLayer = document.getElementById('qx-launch-layer') as SVGGElement | null;
  const copy = document.getElementById('qx-copy');
  const launchTitle = document.getElementById('qx-launch-title');
  const launchBeats = document.getElementById('qx-launch-beats');
  // NOT IN THE GUARD BELOW, on purpose — see `StageRefs.rocketFilmLayer`. The
  // launch film is the one layer whose absence must cost its own beat rather
  // than the whole hero.
  const rocketFilmLayer = document.getElementById('qx-rocket-film');
  const rocketFrames = rocketFilmLayer?.querySelector<HTMLCanvasElement>('canvas') ?? null;
  if (
    !launchBeats ||
    !stage ||
    !cursor ||
    !cursorNode ||
    !cursorPress ||
    !frame ||
    !wordmark ||
    !trackViewport ||
    !inkField ||
    !launchLayer ||
    !copy ||
    !launchTitle ||
    !track
  )
    return null;
  return {
    stage,
    cursor,
    cursorNode,
    cursorPress,
    frame,
    wordmark,
    trackViewport,
    track,
    inkField,
    launchLayer,
    copy,
    launchTitle,
    launchBeats,
    rocketFilmLayer,
    rocketFrames,
  };
}

export function useHeroTimeline({
  scope,
  follow,
  viewport,
  touch,
  lowTier,
}: UseHeroTimelineOptions): void {
  // Set inside the GSAP scope; called by the resize effect below. A ref so the
  // effect can reach the latest closure without re-running the whole scope.
  const relayoutRef = useRef<() => void>(() => {});

  useGSAP(
    (_context, contextSafe) => {
      const refs = gatherRefs();
      if (!refs || !contextSafe) return;
      const root = scope.current;

      // `motionViewport()` and never `window.innerHeight` — see the docblock in
      // motion/viewport.ts. The window moves when the mobile URL bar hides; this
      // does not, which is what keeps the intro's geometry agreeing with the
      // React tree that laid the rest of the hero out.
      const configNow = (): IntroConfig => {
        const { vw, vh } = motionViewport();
        return { geometry: computeLogoGeometry(vw, vh), vw, vh };
      };
      const centre = () => {
        const { vw, vh } = motionViewport();
        return { x: vw / 2, y: vh / 2 };
      };

      // --- initial state (pre-paint via useGSAP's layout effect) -----------
      // Frame hidden, not merely un-drawn: a round linecap + "0 …" dash renders a
      // pip at the path start, so logo-build reveals it as the draw begins.
      gsap.set(refs.cursor, { autoAlpha: 0 });
      gsap.set([refs.wordmark, refs.trackViewport, refs.frame], { autoAlpha: 0 });
      // Both tip/cord pairs start hidden: the dot must be a bare dot, and the
      // landed glyph's pair belongs to the mark, not the cursor.
      gsap.set([MOUSE_FACE_SELECTOR, CURSOR_LIVE_SELECTOR], { autoAlpha: 0 });
      // The click affordance belongs to one beat and starts hidden like the rest.
      gsap.set(CLICK_HINT_SELECTOR, { autoAlpha: 0 });
      // The press group scales about the point every glyph part is authored
      // around — the body centre, which is this group's user-space origin — so
      // the whole mouse presses in place.
      //
      // `svgOrigin`, NOT `transformOrigin: '0 0'`. On an SVG element GSAP reads
      // transformOrigin against the element's BOUNDING BOX, so '0px 0px' means
      // the bbox's top-left corner, not the user-space origin: this group's bbox
      // is dominated by whichever ripple ring is currently widest, so the press
      // would have scaled about a corner that MOVES every frame — the glyph
      // shifting and juddering rather than pressing. svgOrigin is the one that
      // takes user-space coordinates, and it is fixed at the body centre.
      gsap.set(refs.cursorPress, { svgOrigin: '0 0', scale: 1 });
      // The scroll cue starts hidden; the logo build reveals it.
      gsap.set('#qx-scroll-label', { autoAlpha: 0 });
      setFrameBox(refs.frame, configNow().geometry.frame);
      setFrameDraw(refs.frame, 0);

      // --- mutable intro state (closure, never React) ----------------------
      let activeTl: gsap.core.Timeline | null = null;
      let breathe: gsap.core.Timeline | null = null;
      let timeout: gsap.core.Tween | null = null; // one Engine-1 timeout at a time
      let pinCreated = false;
      let introDone = false;
      let moved = false;

      const playSegment = (tl: gsap.core.Timeline) => {
        activeTl = tl;
        tl.play();
      };
      const clearTimeoutCall = () => {
        timeout?.kill();
        timeout = null;
      };

      // --- the single pinned trigger (Engines 2–3 and the growth story) ----
      const createPin = contextSafe(() => {
        if (pinCreated) return;
        pinCreated = true;
        const expandTl = buildExpandTimeline(refs, {
          crossFade: !lowTier,
          // THE LAUNCH BEAT IS BACK ON PHONES, on the client's direction, with a
          // frame sequence instead of the film — so the pin is the FULL budget
          // on both devices again and `end` below is `PIN_A.end` for everyone.
          //
          // It was `launch: !touch` with a shortened `end` between 2026-08-31 and
          // 2026-09-02. The two had to move together then and they move together
          // now; `PIN_TOUCH_COVERAGE` documents why, and is left in place because
          // the mechanism is the cheap way to cut a beat again if one is ever cut.
          launch: true,
        });

        /**
         * Budget progress from pin progress.
         *
         * ScrollTrigger's `progress` is 0..1 over whatever THIS pin is, and while
         * touch ran a shortened pin its 1.0 was only `PIN_TOUCH_COVERAGE` of the
         * budget. Everything below — the beat ladder, the carousel snap, the
         * `data-progress` attribute the e2e suite reads — is written against
         * budget progress, so the conversion happened once here rather than at
         * each of them.
         *
         * BOTH DEVICES RUN THE WHOLE BUDGET AGAIN, so `COVER` is 1 and both
         * directions are the identity. The conversion is kept rather than
         * inlined away: it is the seam this pin is cut on if a beat is ever
         * dropped for a device again, and deleting it would put that knowledge
         * back into five timeline files. It costs one multiplication per tick.
         */
        const COVER = 1;
        const toBudget = (p: number): number => p * COVER;
        const toPin = (p: number): number => p / COVER;

        let lastBeat: Beat = 'ready';
        ScrollTrigger.create({
          id: PIN_ID,
          trigger: '#qx-hero',
          start: 'top top',
          end: PIN_A.end,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          // Shorter on touch, because `syncTouch: false` means Lenis is not in
          // front of the scroll position there and this is the only smoothing
          // there is. See `PIN_SCRUB` for the whole argument — it is the same
          // shape as `LOGO_BUILD_TOUCH` below.
          scrub: touch ? PIN_SCRUB_TOUCH : PIN_SCRUB,
          invalidateOnRefresh: true,
          animation: expandTl,
          // Snap the CAROUSEL only. `snapProgress` returns its input untouched
          // outside the carousel segment, so letting go mid-expansion leaves the
          // frame exactly where the user left it — snapping that would jerk it to
          // a size they never asked for. The short duration keeps the settle a
          // confirmation rather than a ride.
          snap: {
            // Through the same conversion in BOTH directions: ScrollTrigger hands
            // this pin progress and expects pin progress back, while
            // `snapProgress` speaks budget progress. Round-tripping is what keeps
            // the carousel's five stops landing on panels rather than 1.46x past
            // them on touch.
            snapTo: touch ? (p: number) => toPin(snapProgress(toBudget(p))) : snapProgress,
            duration: { min: 0.15, max: 0.4 },
            delay: 0.05,
            ease: EASE.inOut,
          },
          onUpdate: (self) => {
            const p = toBudget(self.progress);
            // BUDGET progress on the attribute, not the pin's own, so that
            // `data-progress` means the same thing on a phone as on a desktop —
            // the e2e suite derives its targets from `progressForIndex`, which is
            // budget-space, and would otherwise be reading two different scales.
            root?.setAttribute('data-progress', p.toFixed(4));
            const beat = beatForProgress(p, COVER);
            if (beat !== lastBeat) {
              lastBeat = beat;
              setHeroBeat(beat); // scroll-derived beats bypass the FSM
            }
          },
          // After a resize, invalidateOnRefresh re-reads the function-based values
          // but does NOT re-fire the onUpdate of a segment that is already
          // COMPLETE at the current progress — and the frame box is written only
          // from the frame-expand segment's onUpdate (done by p 0.09). So a
          // resize during `services` left the frame at its pre-resize box: a
          // collapsed bowl floating over the carousel. `reemitAt` forces every
          // segment, complete or not, to re-emit for the new viewport.
          onRefresh: (self) => reemitAt(expandTl, self.progress),
        });
        ScrollTrigger.refresh();
      });

      // Instantly set the finished-logo state (the skip / reduced-motion target)
      // by fast-forwarding a fresh logo-build — reuses the exact end state.
      const finalizeLogo = () => {
        const build = buildLogoBuild(refs, configNow(), {
          from: centre(),
          flash: false,
          morphFirst: true,
          onHoldStart: () => {},
        });
        build.progress(1);
        build.kill();
      };

      // Re-place the cursor glyph onto the current viewport after a resize.
      // Everything else that moves with the viewport is prop-driven and React
      // re-renders it on its own: the frame's `d`, the tip/cord/body `d`, the
      // carousel's fixed box, and — now that the expand timeline fades the
      // wordmark with opacity alone — the wordmark's `translate/scale` too. The
      // cursor is the one node React owns none of (GSAP morphs its shape and
      // drives its x/y), so it must be re-placed here. Only at rest: during the
      // intro a segment is mid-flight, and during the pinned scroll the trigger's
      // invalidateOnRefresh re-reads geometry instead.
      const relayout = contextSafe(() => {
        if (!introDone || useHeroStore.getState().beat !== 'ready') return;
        const cfg = configNow();
        const g = cfg.geometry;
        gsap.set(refs.cursorNode, { x: g.mouseAnchor.x, y: g.mouseAnchor.y, rotation: 0 });
        gsap.set(refs.cursorPress, { scale: 1 });
        gsap.set(refs.cursor, {
          attr: { d: mouseBodyAtOrigin(cfg) },
          rotation: 0,
          scale: 1,
        });
      });
      relayoutRef.current = relayout;

      const killIntro = () => {
        activeTl?.kill();
        activeTl = null;
        breathe?.kill();
        breathe = null;
        clearTimeoutCall();
        follow.current?.stop();
      };

      // --- side effects on entering each beat ------------------------------
      const onEnterBeat = contextSafe((beat: Beat, prev: Beat) => {
        switch (beat) {
          case 'dot-in': {
            const tl = tlDotIn(refs, configNow());
            tl.eventCallback('onComplete', () => {
              breathe = tlBreathe(refs);
              breathe.play();
              // ONE `delayedCall`, TWO MEANINGS, and the reducer is what tells
              // them apart. On a pointer device six seconds of stillness means
              // nobody is here and TIMEOUT goes straight to `logo-build`; on
              // touch, DOT_HOLD_TOUCH is the dot deciding for itself and the
              // same event goes to `cursor-morph`. See `nextBeat`'s `dot-in`
              // case — the branch lives there so it stays unit-testable without
              // GSAP, and this line only chooses how long to wait.
              timeout = gsap.delayedCall(touch ? DOT_HOLD_TOUCH : 6, () =>
                sendHeroEvent('TIMEOUT'),
              );
            });
            playSegment(tl);
            break;
          }
          case 'pointer-wake': {
            // dot-in may still be RUNNING: the pointer can move inside its 600ms,
            // and `playSegment` below only overwrites the reference — it does not
            // stop what is there. Left alive, dot-in's onComplete still fires and
            // does two things that are wrong by definition once a pointer has
            // been seen: it re-arms the 6s no-pointer fallback (which then ends
            // the click beat early, from a clock the visitor never started), and
            // it restarts the breathe loop — the one idle loop, which is supposed
            // to die here, and which scales #qx-cursor ALONE, so the body pulses
            // 12% inside a tip, cord and button that stay put.
            activeTl?.kill();
            breathe?.kill();
            breathe = null;
            clearTimeoutCall();
            const tl = tlPointerWake(refs);
            tl.eventCallback('onComplete', () => sendHeroEvent('WAKE_DONE'));
            playSegment(tl);
            break;
          }
          case 'cursor-morph': {
            const tl = tlCursorMorph(refs, configNow());
            tl.eventCallback('onComplete', () => sendHeroEvent('MORPH_DONE'));
            playSegment(tl);
            break;
          }
          case 'click': {
            // A single 400ms pulse and a word on touch; the looping press
            // demonstration on a pointer device. See `tlClickInviteTouch` for
            // why the loop is not merely re-timed but replaced.
            playSegment(touch ? tlClickInviteTouch(refs) : tlClickInvite(refs, configNow()));
            // No click → the hero presses the button itself and builds. On the
            // pointer path the delay is derived from the invite's cadence rather
            // than set here, so it always lands in the silence BETWEEN
            // demonstrations — see CLICK_TIMEOUT. The touch invite has no
            // cadence to land between, so its 4s is flat.
            timeout = gsap.delayedCall(touch ? CLICK_TIMEOUT_TOUCH : CLICK_TIMEOUT, () =>
              sendHeroEvent('TIMEOUT'),
            );
            break;
          }
          case 'logo-build': {
            clearTimeoutCall();
            breathe?.kill();
            breathe = null;
            if (prev === 'cursor-morph') {
              // A click mid-morph: finish the morph cleanly before travelling.
              activeTl?.eventCallback('onComplete', null);
              activeTl?.progress(1);
            } else {
              activeTl?.kill(); // abandon dot-in / wake / invite
            }
            follow.current?.stop(); // MotionPath owns x/y from here
            // The morph only completed on the click / mid-morph paths; when we
            // arrive from dot-in (6s timeout) or an eager pointer-wake click the
            // dot never became the glyph, so morph it instantly first.
            const morphFirst = prev === 'dot-in' || prev === 'pointer-wake';
            const build = buildLogoBuild(refs, configNow(), {
              // TRAVEL FROM CENTRE ON TOUCH, and it needs no branch: the follow
              // is never enabled without a fine pointer (see `HeroExperience`),
              // so `follow.current` is null and this fallback IS BUILD-PLAN
              // Phase 10's "travel from center". The dot was placed at the
              // viewport's centre by `tlDotIn` and nothing has moved it since.
              from: follow.current?.position() ?? centre(),
              flash: prev !== 'dot-in', // a real press, not the silent timeout
              morphFirst,
              onHoldStart: () => sendHeroEvent('BUILD_DONE'),
            });
            // The whole segment in 2200ms on touch, as a scale on the finished
            // timeline rather than fifteen re-timed tweens — see
            // LOGO_BUILD_TOUCH. `duration()` is read AFTER construction, so the
            // total stays 2.2s if the pointer build is ever retuned.
            if (touch) build.timeScale(build.duration() / LOGO_BUILD_TOUCH);
            playSegment(build);
            break;
          }
          case 'ready': {
            // From a skip (or the reduced-motion / returning-visitor boot→ready),
            // the logo was never built — finalize it instantly with no motion.
            if (prev !== 'logo-build') {
              killIntro();
              finalizeLogo();
            }
            introDone = true;
            // Reduced motion creates no pin. DEFENCE IN DEPTH, not the branch:
            // Phase 9 gates the whole motion layer at `HeroMount`, so under
            // reduce this hook never runs at all and this line is unreachable.
            // It is here because "no pin is created" is an acceptance criterion
            // and this is the one place a future reader will look for it.
            //
            // PHASE 10 DID NOT NEED THE SECOND GUARD THIS COMMENT PREDICTED,
            // and there is no width at which the pin is suppressed at all — the
            // client reversed BUILD-PLAN's "below 768px no pin is created", so a
            // phone gets the same pinned sequence as a desktop.
            //
            // Phase 9 left this line saying the `<768px` path "needs exactly
            // this guard". It did not, and if that branch ever returns it still
            // will not: a width guard HERE produces the very thing the paragraph
            // below warns about — no pin, but `HeroSection` still mounted,
            // `#qx-track-viewport` still at autoAlpha 0 and `#qx-stage` still
            // covering the viewport. A viewport branch is a MOUNT decision for
            // the same reason the motion preference is, and belongs beside it in
            // `HeroMount`. Nothing was added here.
            //
            // BE CLEAR ABOUT WHAT IT IS NOT. Skipping the pin while HeroSection
            // stays mounted is not a fallback: the init block above still leaves
            // #qx-track-viewport at autoAlpha 0 and #qx-stage still covers the
            // viewport, so the result is a fixed logo-sized bowl painted over
            // whatever is beneath it. The mount gate is the path; this is a
            // backstop against a pin being created by a route that bypasses it.
            if (!useHeroStore.getState().reducedMotion) createPin();
            // Scroll is unlocked by HeroSection's beat-reconciling effect, which
            // owns the lock as a pure function of the beat (and handles the case
            // where `ready` is reached before Lenis exists, e.g. a return visit).
            try {
              sessionStorage.setItem(INTRO_COMPLETE_KEY, '1');
            } catch {
              /* private mode — non-fatal */
            }
            useHeroStore.getState().setIntroComplete(true);
            break;
          }
          default:
            break; // scroll-derived beats (frame-scale…) have no Engine-1 effect
        }
      });

      // --- store subscription: beat change → data-beat + side effect -------
      const unsubscribe = useHeroStore.subscribe((state, prevState) => {
        if (state.beat === prevState.beat) return;
        root?.setAttribute('data-beat', state.beat);
        onEnterBeat(state.beat, prevState.beat);
      });

      // --- input → events --------------------------------------------------
      const onMove = contextSafe(() => {
        if (moved) return;
        moved = true;
        window.removeEventListener('pointermove', onMove);
        sendHeroEvent('POINTER_MOVE');
      });
      const onClick = contextSafe(() => sendHeroEvent('CLICK'));
      const onGesture = contextSafe(() => sendHeroEvent('SCROLL_START'));
      const onKey = contextSafe((e: Event) => {
        if ((e as KeyboardEvent).key === 'Escape') sendHeroEvent('SKIP');
      });
      // Tab away mid-intro pauses whatever is running (and its timeout); return
      // resumes from the same position rather than finishing invisibly.
      const onVisibility = () => {
        if (introDone) return;
        const paused = document.hidden;
        [activeTl, breathe, timeout].forEach((t) => t && (paused ? t.pause() : t.resume()));
      };

      // NOT BOUND ON TOUCH. `pointermove` fires on a touch device during any
      // drag — and on the first tap in some browsers — so leaving it bound would
      // have a swipe wake a pointer that is not there. `nextBeat` refuses the
      // event on touch as well; this is the cheaper of the two locks and the
      // reducer is the one that survives a future caller.
      if (!touch) window.addEventListener('pointermove', onMove, { passive: true });
      // `pointerdown` STAYS BOUND on touch, and it is what "any tap commits"
      // means: a tap anywhere fires it, so the visitor does not have to find the
      // 60px glyph the pulse is drawing their eye to.
      window.addEventListener('pointerdown', onClick);
      window.addEventListener('wheel', onGesture, { passive: true });
      window.addEventListener('touchstart', onGesture, { passive: true });
      window.addEventListener('keydown', onKey);
      document.addEventListener('visibilitychange', onVisibility);

      // --- kick off --------------------------------------------------------
      // Reduced motion and the returning-visitor flag are read once, here, so the
      // boot transition can branch synchronously before anything animates.
      const reducedMotion =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      let introComplete = false;
      try {
        const isHard =
          sessionStorage.getItem('qx_hard_refresh') === '1' ||
          sessionStorage.getItem('qx_hard_refresh') === 'true';
        const scrolled =
          sessionStorage.getItem('qx_scrolled_to_problem') === 'true' ||
          sessionStorage.getItem('qx_scrolled_past_hero') === 'true';
        if (!isHard && scrolled) {
          introComplete = true;
        } else if (isHard) {
          introComplete = false;
        } else {
          introComplete = sessionStorage.getItem(INTRO_COMPLETE_KEY) === '1';
        }
      } catch {
        /* private mode */
      }
      // `touch` goes into the store in the same write, and before ASSETS_READY,
      // because the very first transition already depends on it.
      useHeroStore.setState({ reducedMotion, introComplete, touch, beat: 'boot' });
      root?.setAttribute('data-beat', 'boot');
      sendHeroEvent('ASSETS_READY');

      return () => {
        unsubscribe();
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerdown', onClick);
        window.removeEventListener('wheel', onGesture);
        window.removeEventListener('touchstart', onGesture);
        window.removeEventListener('keydown', onKey);
        document.removeEventListener('visibilitychange', onVisibility);
        clearTimeoutCall();
        breathe?.kill();
      };
    },
    { scope, dependencies: [] },
  );

  // A resize (including every frame of a live window drag) re-places the two
  // GSAP-owned nodes onto the new geometry. Driven off the same guarded,
  // frame-coalesced viewport signal React re-renders from, so it never fires on
  // a mobile URL-bar height change and never runs more than once per frame.
  useLayoutEffect(() => {
    relayoutRef.current();
  }, [viewport.vw, viewport.vh]);
}
