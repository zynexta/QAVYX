'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { DevOverlay } from '@/components/dev/DevOverlay';
import { CursorNode } from '@/components/hero/CursorNode';
import { FrameRays } from '@/components/hero/FrameRays';
import { LaunchLayer } from '@/components/hero/LaunchLayer';
import { HeroCopy } from '@/components/hero/HeroCopy';
import { HeroStage, useViewport, type Viewport } from '@/components/hero/HeroStage';
import { QFrame } from '@/components/hero/QFrame';
import { SkipIntroButton } from '@/components/hero/SkipIntroButton';
import { ServicesCarousel } from '@/components/services/ServicesCarousel';
import { LaunchBeats } from '@/components/launch/LaunchBeats';
import { LaunchTitle } from '@/components/launch/LaunchTitle';
import { Wordmark } from '@/components/hero/Wordmark';
import { useHeroTimeline } from '@/hooks/useHeroTimeline';
import { useGsapLenisDriver } from '@/hooks/useGsapLenisDriver';
import { usePointerFollow } from '@/hooks/usePointerFollow';
import { computeFrameGeometry, computeLogoGeometry } from '@/motion/geometry';
import { ScrollTrigger } from '@/motion/gsap';
import { activeLenis, onLenisReady } from '@/motion/lenis';
import { useHeroStore } from '@/state/heroStore';
import { ENGINE_1_BEATS, type Beat } from '@/types/hero';
import { useDeviceTier, type DeviceTier } from '@/hooks/useDeviceTier';

// Once scroll takes over, the pinned timeline owns the frame's `d` for the WHOLE
// of the pin and React must not write it — see QFrame `frozen`.
//
// It is tempting to let React re-assert the expanded box during `services` (the
// expand tween is complete there, so nothing else is writing it). That is a bug:
// the beat comes from the trigger's INSTANT progress while the frame follows the
// SCRUBBED animation, and `scrub: 1` puts up to a second between them. On a fast
// flick the beat reaches `services` while the expansion is still visibly growing,
// so React would paint the full-size frame, GSAP's next update would overwrite it
// with the mid-expansion size, and the frame would appear to zoom, snap back, and
// zoom again. Resizing during `services` is handled instead by the pin's
// onRefresh, which re-emits the completed segment (see useHeroTimeline).
const SCROLL_BEATS: readonly Beat[] = [
  'frame-scale',
  'frame-expand',
  'services',
  'aperture',
  'title',
  'launch',
  'done',
];

const isDev = process.env.NODE_ENV !== 'production';

/**
 * The hero orchestrator. It renders the single-node stage, owns the one GSAP
 * scope, and wires the pointer follow to the timeline.
 *
 * It no longer OWNS Lenis — `SmoothScroll` in the root layout does, so the
 * smooth scroll is the whole site's rather than this page's. What happens here
 * is a driver handover, and the note at the effect says why that is not the same
 * as leaving two loops running. It never re-renders on pointer move or scroll — those are refs and
 * GSAP transforms. It re-renders only when the viewport changes.
 *
 * Engines 1-3 are all present: the intro, the frame expansion, and the services
 * carousel. Type/grain/colour polish is Phase 12.
 *
 * SINCE PHASE 9, NOTHING IN THIS FILE RUNS UNDER REDUCED MOTION. `HeroMount`
 * decides whether this component mounts at all, so the reduced-motion path is
 * not a branch inside here — it is this whole subtree's absence, and
 * `HeroStatic` (server-rendered, always in the HTML) in its place. That is what
 * makes "lenis.stop() is never called", "CursorNode is not rendered" and "no pin
 * is created" structural rather than guarded, and it is what keeps the ~62 KB
 * GSAP chunk from being downloaded by a visitor who asked for no motion.
 * `SmoothScroll` carries the identical `!== false` gate for Lenis itself, which
 * is what keeps that promise whole now that the two are owned in two places.
 * If you are adding a reduced-motion check here, check `HeroMount` first: it has
 * almost certainly already been made for you.
 */

export function HeroSection() {
  const viewport = useViewport();
  // Read HERE and not in `HeroMount`, deliberately. `HeroMount` gates a
  // `React.lazy` boundary, so anything it waits on delays the chunk request by a
  // commit; this component is already past that and already returns `null` until
  // `useViewport` resolves, so the wait costs nothing. `device` decides which
  // intro runs and which layers mount — never whether the hero exists.
  const device = useDeviceTier();

  // The stage is client-only: it needs real viewport pixels for the 1-unit =
  // 1-pixel coordinate contract. Server and first client render both see a null
  // viewport and return the same fallback, so there is no hydration mismatch;
  // the single-node elements then mount once, in HeroExperience, and the follow
  // never has to reconcile a resize back to null.
  // Until the viewport is known there is nothing to place; the server page has
  // already rendered the <h1>, so a null here is just a black frame or two.
  if (!viewport || !device) return null;
  return <HeroExperience viewport={viewport} device={device} />;
}

function HeroExperience({ viewport, device }: { viewport: Viewport; device: DeviceTier }) {
  const rootRef = useRef<HTMLDivElement>(null);

  // THE HERO NO LONGER OWNS LENIS — IT TAKES THE DRIVER OVER.
  //
  // `useLenis(true)` used to construct the instance here, which is why smooth
  // scroll existed on `/` and on no other route. The client asked for it
  // site-wide, so `SmoothScroll` in the root layout constructs it and this
  // adopts it for the duration of the hero.
  //
  // The adoption itself lives in `useGsapLenisDriver` rather than inline, and
  // that move is a bug fix rather than tidying: the rule is "wherever GSAP is
  // already loaded, its ticker drives Lenis", and written inline it was a fact
  // about this component instead. `app/(lab)/lab/scroll` also loads GSAP, ran
  // Lenis's internal loop beside the ticker, and `phase2-motion-runtime.spec.ts`
  // failed on two rAF loops per frame. One hook, both callers.
  useGsapLenisDriver();

  // THE FOLLOW IS THE POINTER PATH, AND ITS ABSENCE IS THE TOUCH PATH.
  //
  // Not disabled as a tidiness measure: `buildLogoBuild` reads
  // `follow.current?.position() ?? centre()`, so a null handle is exactly
  // BUILD-PLAN Phase 10's "logo-build — Touch: travel from center", and
  // `tlCursorMorph` morphs the glyph wherever the node currently is, which with
  // no follow is where `tlDotIn` put it: "cursor-morph — Touch: morphs in place
  // at viewport center". Two of the four redesigned beats are this one boolean.
  //
  // `any-pointer: fine`, so a touchscreen laptop keeps the follow AND keeps
  // working under a finger — the phase's last acceptance criterion.
  const follow = usePointerFollow(rootRef, device.fine);

  // THE HANDOFF FLAG, AND IT IS THE ONLY THING THAT HIDES THE STATIC HERO.
  //
  // `app/globals.css` used to hide `#qx-hero-static` from a media query alone,
  // which asks "will this visitor get the motion layer?" — a question CSS can
  // answer at parse time. The question that actually matters is "has this
  // visitor GOT it yet?", and between those two the page had nothing to show:
  // the fallback was already hidden and this component had not mounted. The
  // reservation next to that rule held a screen open so the page did not start
  // at §5, which turned the gap into a screen of black rather than removing it.
  //
  // Measured against production on a 390x844 mobile profile: the motion layer
  // first paints at 1.2s on fast wifi, 3.1s at 4x CPU / 1.6 Mbps, and 6.3s at
  // 6x CPU / 0.7 Mbps. The last of those is six seconds of black, and a visitor
  // who swipes during it scrolls straight past into §5 — the intro's own
  // `SCROLL_START` skip cannot help, because the listener that sends it is
  // inside the chunk that has not arrived.
  //
  // SET HERE AND NOT IN `HeroMount`, because the chunk arriving is not the hero
  // appearing: `HeroSection` returns null until `useViewport` and
  // `useDeviceTier` have both resolved, and `HeroExperience` is the first render
  // that paints. Flagging on import would swap the static hero out for another
  // blank.
  //
  // `useLayoutEffect` so the attribute lands in the same commit as this tree's
  // first paint — an effect would leave one frame with both heroes on screen.
  // Safe here where it would not be at the top of the app: this file is only
  // ever reached through a `ssr: false` dynamic import, so it never runs during
  // server rendering.
  //
  // Cleared on unmount so the fallback comes back if this tree ever goes away,
  // and so a failed chunk leaves the static hero standing rather than a blank
  // screen — the graceful end of this, instead of black forever.
  useLayoutEffect(() => {
    document.documentElement.dataset.qxHero = 'live';
    return () => {
      delete document.documentElement.dataset.qxHero;
    };
  }, []);

  useHeroTimeline({
    scope: rootRef,
    follow,
    viewport,
    touch: !device.fine,
    lowTier: device.tier === 'low',
  });

  // Scroll is locked during the intro and released at `ready`. This is a pure
  // function of the beat, reconciled whenever the beat OR Lenis appears — not an
  // imperative stop()/start() at two moments. That ordering matters: on a return
  // visit the intro is skipped to `ready` synchronously in useHeroTimeline's
  // LAYOUT effect, before Lenis exists (a passive effect). Reconciling here (a
  // passive effect that runs after Lenis is created) reads the already-`ready`
  // beat and leaves scroll unlocked, instead of locking it and never releasing.
  useEffect(() => {
    const applyLock = (beat: Beat) => {
      const l = activeLenis();
      if (!l) return;
      if (ENGINE_1_BEATS.includes(beat)) l.stop();
      else l.start();
    };
    // Reconciled on BOTH edges, which is what "whenever the beat OR Lenis
    // appears" now costs: the instance is built by the layout rather than by
    // this component, so it can arrive after the beat it should have applied to.
    // `onLenisReady` fires immediately if it is already there, so the common
    // case is still one call.
    const stop = onLenisReady(() => applyLock(useHeroStore.getState().beat));
    applyLock(useHeroStore.getState().beat);
    const unsubscribe = useHeroStore.subscribe((s, prev) => {
      if (s.beat !== prev.beat) applyLock(s.beat);
    });
    return () => {
      stop();
      unsubscribe();
    };
  }, []);

  // A genuine resize refreshes the one pinned trigger so its function-based
  // values re-read the viewport (invalidateOnRefresh) — no rebuild, no pin jump.
  // Harmless before the pin exists. DEBOUNCED to the end of a drag: refresh is
  // expensive and now that the viewport tracks live, it would run every frame of
  // a window drag. The live geometry keeps the frame and carousel right
  // frame-to-frame; only the pin's scroll math needs the settled size.
  //
  // 150ms is BUILD-PLAN Phase 10's number ("width changes and larger height
  // changes refresh, debounced 150 ms"); it was 160 for no stated reason.
  //
  // THE OTHER HALF OF THAT CRITERION — "height changes <= 120 px are ignored" —
  // IS NOT HERE, and looking for it in this file is the mistake worth heading
  // off. It lives in `useViewport`, one level earlier, because this effect keys
  // off `viewport.vw/vh` and can only debounce changes that have already been
  // let through. A URL-bar height change filtered there never becomes a render,
  // never becomes a geometry recompute, and never reaches this timer.
  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 150);
    return () => clearTimeout(t);
  }, [viewport.vw, viewport.vh]);

  const geo = computeLogoGeometry(viewport.vw, viewport.vh);
  const frameBox = computeFrameGeometry(viewport.vw, viewport.vh);

  // Whether the pinned timeline owns the frame. Subscribing re-renders this
  // component on beat changes only (a handful across the whole experience), not
  // per frame — the scrubbed motion stays on GSAP.
  const beat = useHeroStore((s) => s.beat);
  const frameFrozen = SCROLL_BEATS.includes(beat);

  return (
    <div ref={rootRef} id="qx-hero-root" className="bg-qx-black">
      {/* Two banks of light outside the design frame, up for the carousel beat
          only. First in the DOM because it is lowest in the stack: everything
          below paints over it, which is what keeps it out of the workspace and
          out of the launch. It mounts nothing at all below ~1024px, where the
          frame is wide enough that there is no gutter to light.

          NOT MOUNTED AT ALL ON A LOW-TIER DEVICE. BUILD-PLAN Phase 10: "Low tier
          loses the glow, the grain, and the panel cross-fade — but keeps every
          beat", and "the low tier target is 45 fps, reached by REMOVING WORK,
          not by capping the frame rate". This is the largest single piece of
          work in the hero that is not a beat: two WebGL contexts, two shader
          programs and two ticker callbacks. Removing it is a real unmount, so it
          is the contexts released rather than a shader still running behind a
          transparent div — the same argument the layer already makes for
          unmounting outside its own beats.

          Nothing about the sequence changes: the rays are ambient by their own
          docblock's account, "if it is ever the thing you notice, it is turned
          up too far". Every beat still runs, which is the half of the criterion
          that constrains what may be dropped.

          THE GRAIN IS THE THIRD ITEM AND IT DOES NOT EXIST YET. `--qx-z-grain`
          is reserved in `styles/tokens.css` and nothing renders into it; the
          type/grain/colour pass is Phase 12. Whatever lands there has to read
          `device.tier` on the way in, or this criterion silently regresses. */}
      {device.tier === 'high' && <FrameRays vw={viewport.vw} vh={viewport.vh} beat={beat} />}

      {/* The surface the aperture hands its fill off to, once the frame has
          grown past the viewport. Behind the stage, so the frame's stroke keeps
          flying outward on top of it; `pointer-events: none` so it never
          swallows a click meant for the page it sits over. Opacity is owned
          entirely by the aperture proxy. */}
      <div
        id="qx-ink-field"
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0,
          pointerEvents: 'none',
          background: 'var(--qx-ink)',
          zIndex: 'var(--qx-z-ink)' as unknown as number,
        }}
      />

      {/* The one fixed <svg>. GSAP owns everything inside it; QFrame is left
          without a `draw` prop so the timeline owns the dash. */}
      <HeroStage>
        <QFrame box={geo.frame} strokeWidth={geo.strokeWidth} frozen={frameFrozen} />
        <Wordmark {...geo.wordmark} />
        <CursorNode anchor={geo.mouseAnchor} />{' '}
        <LaunchLayer vw={viewport.vw} vh={viewport.vh} />
      </HeroStage>

      {/* Intro copy (the scroll cue), the keyboard skip, and the dev HUD. */}
      <HeroCopy />
      <SkipIntroButton />
      {isDev && <DevOverlay />}

      {/* The title card: §3.1's "Digital Growth Launchpad", revealed after the
          camera flies through the Q's gap and gone before ignition. A fixed
          sibling like everything else on the stage — see `LaunchTitle`. */}
      <LaunchTitle />

      {/* The launch's labels — what each burning prop IS, from the client's
          §5. Real DOM, because the stage is aria-hidden and cannot carry text.
          See `LaunchBeats`.

          INERT SINCE THE FILM TOOK THE LAUNCH BEAT OVER. `addLaunchSegment` was
          the only thing that ever positioned or revealed these four labels, and
          it is commented out in `expandTimeline.ts`; the layer keeps its
          `invisible` class for the whole pin. It stays mounted because the
          revert is one line there, and because the film says the same four words
          itself — they are rendered into the artwork. */}
      <LaunchBeats />

      {/* THE LAUNCH FILM IS NOT RENDERED HERE ANY MORE, AND ITS ABSENCE IS THE
          FIX RATHER THAN AN OVERSIGHT. `<RocketVideo />` used to sit on this
          line; it is now server-rendered by `app/page.tsx`, because inside this
          `ssr: false` subtree the <video> was missing from the served HTML and
          its download could not start until the motion chunk had arrived. See
          `lib/rocket-video-boot.ts` for the measurement.

          Nothing about the pin changed with it: `addRocketVideoSegment` still
          scrubs `#qx-rocket-film` over the same 320vh, and `useHeroTimeline`
          still finds the layer by `getElementById` exactly as it did when the
          element was a sibling of this comment. */}

      {/* Engine 3: the services carousel, clipped to the 70% frame box. Fixed
          (a sibling of the pinned section, so the pin's transform can't move
          it) and positioned from the same geometry the SVG frame expands to. */}
      <ServicesCarousel frame={frameBox} strokeWidth={geo.strokeWidth} />

      {/* The pin trigger: 100svh, empty. All visuals above are fixed siblings.
          What the page scrolls on to is `LaunchStatic`, rendered on the server
          in app/page.tsx — the Phase-4 placeholder that used to sit here has
          been replaced by real content. */}
      <section id="qx-hero" aria-hidden="true" className="h-svh pointer-events-none" />
    </div>
  );
}
