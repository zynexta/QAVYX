'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { gsap } from '@/motion/gsap';
import { computeRayLayout, rakeConeFor, type RayBox } from '@/motion/geometry';
import { RAY_FADE_T } from '@/motion/timelines/apertureTimeline';
import type { Beat } from '@/types/hero';

/**
 * Two banks of raking light, outside the design frame.
 *
 * ## What it is for
 *
 * By the time the carousel is running, the frame has stopped being a logo and
 * become a workspace — but it was a workspace with nothing around it. The gutter
 * either side was bare page, and the frame read as an outline drawn ON the black
 * rather than as an object standing IN it. Two lamps, one per side, aimed
 * inward, give it a room; the highlight where each shaft reaches the vertical
 * rule is what makes the frame a surface the light lands on rather than a hole
 * the light passes through.
 *
 * It is ambient and it is meant to stay ambient. The signature of this page is
 * the mark being drawn and the camera flying through its gap; this is the air
 * around that, at `RAY_OPACITY`, moving at a third of real time. If it is ever
 * the thing you notice, it is turned up too far.
 *
 * ## The four rules it obeys, and how each is enforced structurally
 *
 * **The light is never inside the frame.** Not by clipping and not by timing —
 * by paint order. The layer sits at `--qx-z-rays` (7), the frame's opaque `ink`
 * interior is painted by `#qx-stage` at 10, and `#qx-ink-field` covers
 * everything at 8 from the fly-through onward. The canvases deliberately run
 * PAST the frame's edge (`RAY_OVERLAP` in `computeRayLayout`) so their own hard
 * edge is terminated under that interior; a canvas clipped level with the frame
 * ends on a visible seam of half-bright light.
 *
 * **It only exists where there is an outside.** `computeRayLayout` returns null
 * below `RAY_MIN_GUTTER`, which is where `FRAME_FRACTIONS` widens the frame to
 * 84% for a cramped panel layout. Two lamps in a 40px margin is a green edge
 * glow, not light — and it would be paid for by the devices least able to.
 *
 * **It costs nothing outside its own beats.** Mounted across `frame-expand` and
 * `services` only, so the two WebGL contexts and their ticker callbacks do not
 * exist for the intro, the fly-through, the title card or the 320vh launch.
 * Being a real unmount rather than an opacity of 0, that is the contexts
 * released, not a shader still running behind a transparent div.
 *
 * **It does not exist at all under reduced motion.** `HeroMount` decides whether
 * the whole motion layer mounts, so there is no branch here — this file is one
 * of the things that is simply absent, along with GSAP, Lenis and the pin.
 *
 * ## Why the fade is asymmetric
 *
 * In over 560ms, out over 320. Entering, the light is arriving and has the whole
 * of the expansion to do it in; leaving, the beat has flipped because the visitor is
 * already scrolling into the aperture, and `scrub: 1` means the frame itself may
 * not have started moving yet. A slow fade-out would be a visible dimming of a
 * frame that is still sitting still. A fast one is over before it can be read as
 * anything but the camera taking the light with it.
 */

const RakeRays = dynamic(() => import('./RakeRays').then((m) => m.RakeRays), { ssr: false });

/**
 * The layer's ceiling.
 *
 * 0.48 WAS THE AMBIENT CEILING, AND IT IS DELIBERATELY NO LONGER THAT. The note
 * above says that if this layer is ever the thing you notice it is turned up too
 * far — which was the right rule for a soft shaft of atmosphere, and is the wrong
 * one for what has since been asked for. The client picked a reference image
 * whose whole subject IS the light, then said twice that what was on screen was
 * not enough. At 0.48 over a black page the rays measured a mean of 8 out of 255;
 * they were not being read as understated, they were being read as broken.
 *
 * So this is a decision that overrides an older decision, rather than a tuning
 * drift, and it is written down here as one.
 */
const RAY_OPACITY = 0.85;
const RAY_FADE_IN = 560;
const RAY_FADE_OUT = 320;

/**
 * WARMING UP AND LIGHTING UP ARE TWO DIFFERENT BEATS, and separating them is
 * what stopped the light arriving a whole panel late.
 *
 * NOTHING IS VISIBLE UNTIL THE FRAME IS FINISHED. The light belongs to the
 * completed workspace, and every part of it is pinned to the frame AT REST;
 * through `frame-expand` the frame is anywhere between the bowl and that box, so
 * a shaft aimed at where the frame is going to be — and a reflection hanging in
 * mid-air beside it — are both light with nothing under them.
 *
 * But the layer is MOUNTED for that segment, at opacity 0, and that is not a
 * distinction without a difference. Three costs land on the `services` boundary
 * and all three used to be paid inside the first slide: the `next/dynamic` chunk
 * holding the shader has to arrive, `ogl` has to build a context and compile a
 * program, and only then can a fade start. One carousel step is 75vh — about a
 * second of ordinary scrolling — so the light was still climbing as panel 01
 * left. Mounting a segment early spends the expansion's 50vh on all three,
 * invisibly, and the fade then starts on the first frame of the carousel rather
 * than some way into it.
 *
 * So `RAY_WARM_BEATS` is where the contexts exist and `RAY_LIGHT_BEAT` is where
 * they are turned up. Scrolling back up reverses both: the light is out by the
 * top of the carousel, and the contexts survive until the frame is a bowl again,
 * ready for the next pass down.
 */
const RAY_WARM_BEATS: readonly Beat[] = ['frame-expand', 'services', 'aperture'];
const RAY_LIGHT_BEAT: Beat = 'services';

/**
 * Light is colourless; the frame is what has colour.
 *
 * THAT RULE IS NOW DELIBERATELY RELAXED, and the paragraph below is kept because
 * the reasoning in it is still why the relaxation is narrow. The rays are WHITE
 * where they are hot and fall to `--qx-green` only through their flanks and
 * their far end, so the accent lives in the falloff rather than in the body of
 * the light. What was rejected before — and would still be wrong — is a green
 * SHAFT, which is what turns the accent into atmosphere.
 *
 * The shafts are the brand WHITE (which is itself faintly green — #f2f5f3) and
 * the highlight they leave on the rule is `--qx-green`. Tinting the light green
 * instead was the first cut and it was the wrong instrument: it turned the
 * accent into atmosphere, and on a black page with one accent colour that is how
 * the accent stops meaning anything. Green on this site says "you are pointing
 * at this"; it should not also say "there is air here".
 *
 * Read off the token rather than typed, because the shader needs `#rrggbb` and a
 * second copy of a colour in a component is exactly what `styles/tokens.css`
 * exists to prevent. The literal is a fallback for a context with no computed
 * style, never the source of truth.
 */
function readTokenHex(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

/**
 * Shared shader settings for both banks.
 *
 * THE RAYS ARE STRAIGHT, DISCRETE AND TWO-TONE, and each of those three words
 * is a rejection of something that was tried here.
 *
 * STRAIGHT, because the streak field that preceded this curved: its fan measured
 * up to 49 degrees off axis across a gutter bank, and a curved line with a bright
 * head and a tapering tail is a tadpole. The client's word for it was "sperm",
 * and they were describing the shader's actual construction, not a setting in it.
 *
 * DISCRETE, because the shaft field BEFORE that one was smooth: its strength was
 * an angular falloff times two sine terms, so it had no edges anywhere and read
 * as atmosphere. `RakeRays` quantises the angle into slots and hashes each one,
 * which is what makes a ray a thing you can count. (That shader is deleted; it
 * is described rather than cited because the contrast is the design rationale.)
 *
 * TWO-TONE, because the reference image's rays are white through the middle and
 * coloured along their flanks — and because on this page the only colour that
 * may do that is the accent. It was true angular dispersion for one round, which
 * gave real rainbow fringes and put every hue on a one-accent page; it is now a
 * ramp from `--qx-white` at the core to `--qx-green` through the falloff, which
 * keeps the character and costs a third as much. `coreBias` is the balance: lower
 * is whiter, higher holds more green.
 *
 * `reach` and `spread` are NOT constants — see `rakeConeFor` in motion/geometry,
 * and note that it takes `RAY_OUTSIDE` as an argument. The source position is
 * what both are measured from, so passing one value and tuning against another
 * is precisely how the two silently disagree.
 *
 * `dpr: 1` is the performance decision, and it is a cheaper shader than either of
 * its predecessors — no ray march, no per-fragment scene trace, just an angle, a
 * hash and three exponentials per octave. That matters on the pin's tightest
 * frame (§12, 8ms).
 */

/**
 * How far outside its own bank each source sits, in bank widths.
 *
 * This is the dial between "a burst" and "a rake". At 0 the source is on the
 * bank's edge and the rays fan out radially from a visible point; pushed out,
 * the fan narrows and what crosses the gutter is the straight middle of it. 0.6
 * keeps the origin comfortably off-canvas while leaving enough divergence that
 * the rays still read as light from somewhere rather than as printed hatching.
 */
const RAY_OUTSIDE = 0.6;

const RAKE_SHADER = {
  speed: 0.35,
  density: 24,
  width: 0.42,
  coreBias: 1.6,
  twinkle: 0.2,
  flow: 1.05,
  stretch: 4.5,
  flowDepth: 0.7,
  gain: 4.5,
  outside: RAY_OUTSIDE,
  dpr: 1,
} as const;

/**
 * Both ends of a shaft fade out, or the band terminates on a horizontal line and
 * reads as a rectangle of fog rather than as light.
 */
const BANK_MASK =
  'linear-gradient(to bottom, transparent 0%, #000 24%, #000 76%, transparent 100%)';

/**
 * The specular highlight, authored for the frame's LEFT rule: transparent at the
 * outer end, brightest against the stroke. The right-hand one is the same
 * element flipped, which is the only way the two stay in agreement when the
 * falloff is retuned.
 */
const GLINT_GRADIENT = [
  'linear-gradient(to right,',
  'transparent 0%,',
  'color-mix(in srgb, var(--qx-green) 10%, transparent) 34%,',
  'color-mix(in srgb, var(--qx-green) 34%, transparent) 62%,',
  'color-mix(in srgb, var(--qx-green) 70%, transparent) 84%,',
  // The last stop is the CONTACT itself, and it is not green — it is very nearly
  // white. A specular highlight takes the colour of the light, not of the
  // surface; a hot point that stayed green read as the rule being thicker there
  // rather than as light landing on it. Green survives in the bleed either side,
  // which is where the surface tint belongs.
  'color-mix(in srgb, var(--qx-white) 82%, var(--qx-green)) 100%)',
].join(' ');

/**
 * The vertical falloff, built around where the light actually arrives rather
 * than around the element's own middle — `hot` is a fraction of the bloom's
 * height, and on the right rule it is not 0.5. See `RayGlint`: that bloom stops
 * at the Q's stub terminal, because past it there is no stroke for the light to
 * land on and a highlight there would be filling in the mark's opening.
 *
 * At `hot = 0.5` this emits the symmetric gradient it started as.
 */
const glintMask = (hot: number): string => {
  const at = (f: number) => `${(f * 100).toFixed(2)}%`;
  return [
    'linear-gradient(to bottom,',
    'transparent 0%,',
    `rgba(0, 0, 0, 0.28) ${at(hot * 0.33)},`,
    `rgba(0, 0, 0, 0.92) ${at(hot - 0.04)},`,
    `rgba(0, 0, 0, 0.92) ${at(hot + 0.04)},`,
    `rgba(0, 0, 0, 0.28) ${at(hot + (1 - hot) * 0.67)},`,
    'transparent 100%)',
  ].join(' ');
};

const box = (b: RayBox): React.CSSProperties => ({
  position: 'absolute',
  left: b.x,
  top: b.y,
  width: b.w,
  height: b.h,
});

interface FrameRaysProps {
  vw: number;
  vh: number;
  beat: Beat;
}

export function FrameRays({ vw, vh, beat }: FrameRaysProps) {
  const layout = computeRayLayout(vw, vh);
  const lightable = layout !== null;
  const warm = lightable && RAY_WARM_BEATS.includes(beat);
  const shine = lightable && beat === RAY_LIGHT_BEAT;

  // `mounted` is existence, `lit` is opacity, and they are separate states for
  // two reasons: the layer spends the whole expansion mounted at 0 (see
  // RAY_WARM_BEATS), and even at the moment it lights it has to be in the
  // document at 0 for one frame first — a transition to a value an element
  // mounted with never runs.
  const [mounted, setMounted] = useState(false);
  const [lit, setLit] = useState(false);
  // BOTH READ OFF TOKENS, never typed twice — the whole reason
  // `styles/tokens.css` exists. The literals are the no-computed-style fallback.
  const [coreHex] = useState(() => readTokenHex('--qx-white', '#f2f5f3'));
  const [edgeHex] = useState(() => readTokenHex('--qx-green', '#2abd00'));

  // Fetch the shader's chunk as soon as the hero exists, rather than at the
  // beat that needs it. `next/dynamic` would otherwise start the download at
  // `frame-expand` — and in development that is a compile, not a cached file, so
  // the first visit to the carousel pays hundreds of milliseconds for it while
  // the fade is supposed to be running. Webpack caches the module, so the
  // component's own loader then resolves from memory.
  //
  // Gated on the layout: a viewport with no gutter never lights, and must not
  // download a WebGL library to prove it.
  useEffect(() => {
    if (lightable) void import('./RakeRays');
  }, [lightable]);

  // Existence. The unmount waits out the fade so the layer is never yanked
  // mid-transition.
  //
  // KEYED ON `beat`, NOT ON `warm`, and that is not a redundant dependency.
  // `warm` is true for BOTH `services` and `aperture`, so it does not change on
  // the boundary between them — and the scrub below unmounts the layer while
  // `warm` is still true. Depending on `warm` alone, this effect never re-ran on
  // the way back up, so scrolling out of the aperture returned to a carousel
  // with no light in it and nothing that could restore it.
  useEffect(() => {
    if (warm) {
      setMounted(true);
      return;
    }
    const id = window.setTimeout(() => setMounted(false), RAY_FADE_OUT);
    return () => window.clearTimeout(id);
  }, [warm, beat]);

  // THE APERTURE'S FADE IS SCRUBBED, so its existence has to be too — a timer
  // here would either cut the light off early on a slow scroll or leave two
  // WebGL contexts running through the fly-through on a fast one.
  //
  // It reads BOTH WAYS. Scrubbing is reversible and this is the only thing
  // watching the scrub, so a one-way `if (past) unmount` leaves the layer gone
  // for the rest of the aperture no matter which direction the visitor takes
  // through it. Deriving existence from the value each frame is what makes
  // scrolling back up symmetric with scrolling down.
  //
  // The guard is on the beat alone for the same reason: gated on `mounted` too,
  // the callback removed itself the moment it fired and could never observe the
  // value coming back down.
  //
  // The read is off the root's INLINE style, which is a string lookup on an
  // object GSAP has already written this frame — not `getComputedStyle`, which
  // would force a style recalculation once per frame for a decoration.
  useEffect(() => {
    if (beat !== 'aperture') return;
    const check = () => {
      const raw = document.documentElement.style.getPropertyValue('--qx-aperture-t');
      const t = raw === '' ? 0 : parseFloat(raw);
      setMounted(Number.isFinite(t) ? t < RAY_FADE_T : true);
    };
    gsap.ticker.add(check);
    return () => gsap.ticker.remove(check);
  }, [beat]);

  // Opacity. Keyed on `mounted` as well, so raising it happens in the commit
  // AFTER the layer is on screen at 0 rather than in the same batch as its
  // mount. A zero-delay `delayedCall` and not `requestAnimationFrame`:
  // gsap.ticker is this application's only animation loop (see `motion/gsap.ts`)
  // and it fires on the next tick, which is the frame this needs.
  useEffect(() => {
    if (!mounted) return;
    if (!shine) {
      setLit(false);
      return;
    }
    const raise = gsap.delayedCall(0, () => setLit(true));
    return () => void raise.kill();
  }, [mounted, shine]);

  // Once the aperture owns the fade, React must stop writing a competing value.
  const closing = beat === 'aperture';

  if (!mounted || !layout) return null;

  const cone = rakeConeFor(layout.left, RAY_OUTSIDE);

  return (
    <div
      id="qx-frame-rays"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        // THROUGH THE APERTURE THE SCRUB OWNS THIS, and the transition comes off
        // with it — a CSS transition on top of a scrubbed value lags the scroll
        // by its own duration and re-introduces exactly the lateness being
        // fixed. `--qx-aperture-t` is written by `addApertureSegment`; the clamp
        // holds the ends so a value outside 0..RAY_FADE_T cannot push opacity
        // past the layer's ceiling or below zero.
        opacity: closing
          ? `calc(${RAY_OPACITY} * clamp(0, 1 - var(--qx-aperture-t, 0) / ${RAY_FADE_T}, 1))`
          : lit
            ? RAY_OPACITY
            : 0,
        transition: closing
          ? 'none'
          : `opacity ${lit ? RAY_FADE_IN : RAY_FADE_OUT}ms var(--qx-ease-out)`,
        zIndex: 'var(--qx-z-rays)' as unknown as number,
      }}
    >
      {/* One cone for both banks: `computeRayLayout` gives them identical
          dimensions by construction (same gutter, same height), so deriving it
          twice would be two chances for them to disagree. */}
      <div style={{ ...box(layout.left), maskImage: BANK_MASK, WebkitMaskImage: BANK_MASK }}>
        <RakeRays origin="left" core={coreHex} edge={edgeHex} {...RAKE_SHADER} {...cone} />
      </div>
      <div style={{ ...box(layout.right), maskImage: BANK_MASK, WebkitMaskImage: BANK_MASK }}>
        <RakeRays origin="right" core={coreHex} edge={edgeHex} {...RAKE_SHADER} {...cone} />
      </div>

      {/* The reflection. Painted after the banks so it sits on top of the strip
          of canvas that runs under the frame, and under `#qx-stage`'s own stroke
          — so what a reader sees is the frame's green rule with a halo bleeding
          out of its outer face, rather than a bar drawn beside it.

          It shares the layer's one opacity rather than carrying its own. It had
          its own for as long as the banks came up during the expansion and the
          reflection had to wait for a rule to land under it; now that nothing
          lights until the frame is finished, there is one event here, and a
          second fade on it would be two owners of the same moment.

          The right one is shorter than the left, and that asymmetry is the mark:
          it ends where the Q's stroke ends. See `RayGlint` in motion/geometry. */}
      <span
        style={{
          ...box(layout.glintLeft),
          backgroundImage: GLINT_GRADIENT,
          maskImage: glintMask(layout.glintLeft.hot),
          WebkitMaskImage: glintMask(layout.glintLeft.hot),
        }}
      />
      <span
        style={{
          ...box(layout.glintRight),
          backgroundImage: GLINT_GRADIENT,
          maskImage: glintMask(layout.glintRight.hot),
          WebkitMaskImage: glintMask(layout.glintRight.hot),
          transform: 'scaleX(-1)',
        }}
      />
    </div>
  );
}
