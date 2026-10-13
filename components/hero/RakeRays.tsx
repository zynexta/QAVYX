'use client';

import { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { gsap } from '@/motion/gsap';

/**
 * A rake of straight, discrete light rays, white at the core and green as they
 * thin.
 *
 * ## Why this is not the two shaders before it
 *
 * The FIRST drew a SMOOTH cone: its strength was a product of an angular falloff
 * and two `sin`/`cos` terms, so what it made was one broad shaft with a gentle
 * striation in it. Nothing in it had an edge, which is why it read as atmosphere
 * rather than as rays, and why it was rejected.
 *
 * `Lightfall` drew streaks with HEADS AND TAILS — a bright core at `Pp = 0` with
 * an `exp(tail * Pp.y)` trail behind it — inside a ray-marched tunnel whose fan
 * curves up to 49 degrees off axis across a gutter bank. A bright head, a
 * tapering tail, and a curve is a tadpole, and that is exactly what it looked
 * like. That shape is structural to the shader, not a setting.
 *
 * This one is neither. A ray here is a straight line from the source, of uniform
 * width along its whole length, with no head and no tail — it simply runs out.
 * The field is built by QUANTISING THE ANGLE: the angle off the axis is divided
 * into slots, each slot is hashed for its own width, length and brightness, and
 * a fragment is lit by how close it sits to its slot's centre line. That is what
 * makes the rays discrete and resolvable instead of a continuous wash, and it is
 * the property both previous shaders were missing.
 *
 * Three octaves of slots at different pitches are summed, so the spacing does
 * not read as a comb. A single pitch is visibly regular and looks mechanical.
 *
 * ## The colour split
 *
 * This DID disperse: three angular samples, one per channel, diverging toward
 * the rim exactly as a lens does. That gave the reference image's rainbow
 * flanks, and it also put every hue on a page whose rule is one accent colour.
 *
 * It is now a two-colour ramp on the brand's own axis — white cores falling to
 * green through the flanks and the far end. The character is the same (colour
 * separating across the body of a ray) on the only axis this page owns, and it
 * costs a third as much, because dispersion needed `field` evaluated three
 * times per fragment and this needs it once.
 *
 * The file was called `PrismRays` for exactly as long as that was true. It is
 * `RakeRays` now, which is what it has actually been since the ramp landed —
 * the name is worth keeping honest because the next person tuning this will
 * reach for the wrong mental model otherwise.
 *
 * ## The source is off-screen, and that is the geometry
 *
 * `anchor` sits outside the bank by `outside` times its width, on the bank's
 * mid-height, firing inward. Nothing of the origin is ever on canvas — what
 * crosses the gutter is the straight middle of the fan, which is the "direct,
 * not curved" reading. Pushing `outside` up makes the rays more parallel and
 * more raking; pulling it in makes the burst more radial.
 */

export type RakeOrigin = 'left' | 'right';

export interface RakeRaysProps {
  origin: RakeOrigin;
  /** `#rrggbb`. The colour of a ray's hot core. */
  core?: string;
  /** `#rrggbb`. The colour a ray falls to through its flanks and far end. */
  edge?: string;
  /** How readily a ray reaches its core colour. Higher keeps more edge colour. */
  coreBias?: number;
  speed?: number;
  /**
   * Rays you can count ACROSS THE CONE at the coarsest octave.
   *
   * Note this and `width` are coupled: width is a fraction of the SLOT PITCH, so
   * halving the density doubles every ray's thickness in pixels unless width is
   * scaled by the same ratio. Changing one alone changes both the count and the
   * weight of the rake.
   */
  density?: number;
  /** Ray thickness, as a fraction of the slot pitch. */
  width?: number;
  /** Reach, as a multiple of the container's WIDTH — see `rakeConeFor`. */
  reach?: number;
  /** Cone half-angle in radians — see `rakeConeFor`. */
  spread?: number;

  /** How much each ray breathes IN PLACE. Not motion — see `flow`. */
  twinkle?: number;
  /** How fast brightness travels outward along each ray. 0 stops the motion. */
  flow?: number;
  /**
   * How many travelling bumps fit along a ray, measured over the FULL reach —
   * so the number actually visible is this times the fraction of the reach the
   * container occupies. At 1.15 a gutter bank showed 0.45 of a bump, which is
   * not travel at all: the whole bank brightened and dimmed together, and a
   * cross-correlation of successive frames put the best match at a lag of one
   * pixel. Around 6 puts a bit over two bumps across the bank, which is what
   * makes the light read as moving THROUGH it rather than blinking in it.
   */
  stretch?: number;
  /** How much of the ray's brightness the travel owns. 0 is a static ray. */
  flowDepth?: number;
  /** Overall brightness, applied before the soft shoulder. */
  gain?: number;
  /** How far outside the bank the source sits, in bank widths. */
  outside?: number;
  dpr?: number;
  className?: string;
  style?: React.CSSProperties;
}

type Uniforms = Record<string, { value: number | number[] }>;

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [parseInt(m[1]!, 16) / 255, parseInt(m[2]!, 16) / 255, parseInt(m[3]!, 16) / 255]
    : [1, 1, 1];
};

const VERT = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  uAnchor;
uniform vec2  uAxis;
uniform vec3  uCore;
uniform vec3  uEdge;
uniform float uCoreBias;
uniform float uSpeed;
uniform float uDensity;
uniform float uWidth;
uniform float uReach;
uniform float uSpread;
uniform float uTwinkle;
uniform float uGain;
uniform float uFlow;
uniform float uStretch;
uniform float uFlowDepth;

varying vec2 vUv;

const float TAU = 6.28318530718;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

/* ONE OCTAVE OF RAYS.

   The angle is divided into slots of width delta. A fragment's slot is the
   nearest one; its distance from that slot's centre line, normalised to the
   pitch, is what decides whether it is lit. So a ray is a straight line of
   CONSTANT width running out from the source — no head, no tail, nothing that
   tapers along its length. Only the radial term ends it, and it ends by simply
   running out of reach rather than by trailing off behind a bright point. */
float octave(float theta, float radial, float pitch, float seed, float t) {
  /* THE PITCH IS MEASURED ACROSS THE CONE, NOT AROUND THE CIRCLE. Dividing TAU
     by it was the first cut and it put six rays on screen: the cone here is
     about 1.0 rad wide, so a pitch of 34 over 6.28 rad landed only ~5 slots
     inside it and the rest of the field was aimed at parts of the plane no
     fragment occupies. Measured against the render, that is exactly the six
     faint rays that came back. Dividing the CONE gives pitch its obvious
     meaning — the number of rays you can count across the rake. */
  float delta = (2.0 * uSpread) / max(pitch, 1.0);
  float slot = floor(theta / delta + 0.5);
  float centre = slot * delta;
  float off = (theta - centre) / delta;

  float h = hash(slot + seed);
  float h2 = hash(slot * 1.7 + seed + 11.0);

  // Width and length are per-ray, or every ray is the same ray.
  /* THICKNESS. The range used to be 0.045-0.20 of the slot pitch, which at a
     44-slot cone is a ray one or two pixels across — hairlines, and on a dark
     page hairlines read as scratches rather than as light. 0.10-0.34 gives a
     ray with a body to it, and the per-ray spread is kept because rays of one
     uniform thickness read as a printed rule. */
  float w = mix(0.10, 0.34, h) * uWidth;
  float profile = exp(-(off * off) / max(w * w, 1e-6));

  /* The floor is 0.62, not 0.30. At 0.30 the median ray gave out around
     two-thirds of the way across the gutter, so almost nothing actually
     ARRIVED at the frame — which is the one thing this layer has to do. */
  float len = mix(0.62, 1.0, h2);
  float reach = clamp((len - radial) / max(len, 1e-4), 0.0, 1.0);
  reach = pow(reach, 1.5);

  float breathe = mix(1.0, 0.55 + 0.45 * sin(t * 0.8 + h * 37.0), uTwinkle);

  /* STREAMING — THE RAYS TRAVEL, THEY DO NOT JUST PULSE.

     What was here before was uTwinkle alone: a brightness wave in place, which
     is a ray sitting still and breathing. Nothing on screen moved outward, and
     that is the whole character of the reference — light rushing away from a
     point.

     So each ray carries a bump of brightness that travels ALONG ITS OWN LENGTH,
     outward, at a per-ray speed. Being straight and radial, that reads as speed.
     It is worth being explicit about why this is not the shape that was rejected
     before: the previous shader's streaks had a compact bright head with a long
     exponential tail, on a fan that curved up to 49 degrees — a head, a tail and
     a curve is a tadpole. This bump is symmetric, soft, and runs down a straight
     line, so it reads as flow rather than as something swimming.

     fract makes the travel seamless; the per-ray hash offset stops the whole
     rake pulsing in lockstep, which would read as a strobe. */
  /* FLOW RUNS OFF iTime DIRECTLY, not off 't'. 't' is already scaled by uSpeed
     (0.35 here, which governs the twinkle), and folding that into the travel
     made the segments crawl at about a third of the intended rate — measured,
     the pattern moved so little between frames that a cross-correlation of
     successive screenshots still peaked at zero lag. The two are separate
     clocks because they are separate effects. */
  float ph = fract(radial * uStretch - iTime * uFlow * (0.85 + 0.3 * h) + h * 3.7);
  // Sharper than a symmetric blob: a soft leading edge with a longer draw-out
  // behind it, which is what makes a straight radial segment read as speed.
  /* A LONGER, SOFTER SEGMENT. The previous exponents (0.5 / 2.0) gave a short
     bright slug with a fast decay, and at six segments per ray that read as a
     dashed line rather than as a ray with light running down it. Broadening the
     profile and cutting the segment count lets neighbouring segments overlap,
     so what travels is a swell in a continuous ray. 2.3 normalises the peak to
     one: the maximum of ph^0.35 * (1-ph)^1.3 falls at ph = 0.212. */
  float bump = 2.3 * pow(ph, 0.35) * pow(1.0 - ph, 1.3);
  float stream = mix(1.0, bump, clamp(uFlowDepth, 0.0, 1.0));

  return profile * reach * breathe * stream * mix(0.5, 1.0, hash(slot * 3.1 + seed));
}

/* Three pitches summed. One pitch alone is a comb — visibly regular, and it
   reads as a printed pattern rather than as light.

   THE UPPER TWO ARE TEXTURE, NOT RAYS, and their weights are what decides which.
   At 0.7 and 0.45 they were loud enough to read as rays in their own right, and
   since they sit at 1.73x and 2.91x the base pitch that put 293 ray positions
   across the cone at density 52 — a solid wall of light with no dark between it,
   which is not a rake, it is a fill. Damped to 0.38 and 0.15 they break up the
   base spacing without adding countable rays of their own, which is the whole
   job they were added to do. */
float field(float theta, float radial, float t) {
  float a = octave(theta, radial, uDensity, 0.0, t);
  float b = octave(theta, radial, uDensity * 1.73, 19.0, t) * 0.38;
  float c = octave(theta, radial, uDensity * 2.91, 43.0, t) * 0.15;
  return a + b + c;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 v = fragCoord - uAnchor;

  float along = dot(v, uAxis);
  vec2 perpAxis = vec2(-uAxis.y, uAxis.x);
  float perp = dot(v, perpAxis);

  // Behind the source there is no light at all.
  if (along <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  float theta = atan(perp, along);
  float radial = length(v) / max(iResolution.x * uReach, 1.0);
  float t = iTime * uSpeed;

  // The cone. Outside it the field is not merely dim, it is absent — a ray that
  // faded out over the whole canvas would be the soft wash this replaces.
  float cone = 1.0 - smoothstep(uSpread * 0.72, uSpread, abs(theta));
  if (cone <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  /* ONE SAMPLE, AND THE COLOUR COMES OFF THE INTENSITY.

     This used to take three angular samples, one per channel, and let them
     diverge — real lens dispersion, and it gave the rainbow flanks the reference
     image has. The brand has one accent colour, so that is now a two-colour ramp
     instead: WHITE where a ray is hot, GREEN as it thins into its flanks and its
     far end. Same idea — colour separating across the body of a ray — resolved
     on the axis the page actually owns.

     It is also three times cheaper. 'field' is the whole cost of this shader
     (three octaves, each an exp and two pow), and dispersion needed it evaluated
     at three angles per fragment. One sample is one evaluation.

     Worth naming: an older note in 'FrameRays' records that tinting this light
     green was tried and cut, on the grounds that it turns the accent into
     atmosphere. That was the right call when the light was a soft ambient wash.
     It is being overridden deliberately, on request, now that the light is a
     legible rake with white cores — the green lives in the falloff, not in the
     body, so the accent still reads as an accent rather than as air.  */
  float amp = field(theta, radial, t) * cone * uGain;

  /* Soft shoulder, so bright cores roll off instead of clipping to a flat slab. */
  float shaped = amp / (1.0 + amp);

  vec3 rgb = mix(uEdge, uCore, clamp(pow(shaped, uCoreBias), 0.0, 1.0)) * shaped;

  // ALPHA IS THE LIGHT, so the layer composites onto the page instead of
  // painting a rectangle over it. Same contract the shader this replaced had.
  fragColor = vec4(rgb, clamp(shaped, 0.0, 1.0));
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}`;

export function RakeRays({
  origin,
  core = '#f2f5f3',
  edge = '#2abd00',
  coreBias = 1.6,
  speed = 0.35,
  density = 34,
  width = 0.42,
  reach = 3,
  spread = 0.9,
  twinkle = 0.2,
  flow = 1.05,
  stretch = 4.5,
  flowDepth = 0.7,
  gain = 4.5,
  outside = 0.6,
  dpr = 1,
  className = '',
  style,
}: RakeRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef<Uniforms | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setIsVisible(entries[0]?.isIntersecting ?? false),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // STRUCTURE ONLY — everything tunable is written live by the effects below, so
  // changing a setting costs a float rather than a context rebuild.
  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    cleanupRef.current?.();
    cleanupRef.current = null;

    const container = containerRef.current;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio, dpr),
        alpha: true,
        antialias: false,
      });
    } catch {
      // No WebGL context to be had. The page is complete without this layer.
      return;
    }
    rendererRef.current = renderer;

    const gl = renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';
    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(gl.canvas);

    const uniforms: Uniforms = {
      iResolution: { value: [1, 1] },
      iTime: { value: 0 },
      uAnchor: { value: [0, 0] },
      uAxis: { value: [1, 0] },
      uCore: { value: hexToRgb(core) },
      uEdge: { value: hexToRgb(edge) },
      uCoreBias: { value: coreBias },
      uSpeed: { value: speed },
      uDensity: { value: density },
      uWidth: { value: width },
      uReach: { value: reach },
      uSpread: { value: spread },
      uTwinkle: { value: twinkle },
      uGain: { value: gain },
      uFlow: { value: flow },
      uStretch: { value: stretch },
      uFlowDepth: { value: flowDepth },
    };
    uniformsRef.current = uniforms;

    const geometry = new Triangle(gl);
    const program = new Program(gl, { vertex: VERT, fragment: FRAG, uniforms });
    const mesh = new Mesh(gl, { geometry, program });
    meshRef.current = mesh;

    // Sized off the container on a window resize, NOT a ResizeObserver — the
    // observer fires on the mobile URL bar, which motion/viewport.ts exists to
    // filter out.
    const updatePlacement = () => {
      if (!containerRef.current) return;
      renderer.dpr = Math.min(window.devicePixelRatio, dpr);
      const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
      renderer.setSize(wCSS, hCSS);
      const w = wCSS * renderer.dpr;
      const h = hCSS * renderer.dpr;
      uniforms.iResolution!.value = [w, h];
      // The source sits outside the canvas, on its mid-height, firing inward.
      uniforms.uAnchor!.value =
        origin === 'left' ? [-outside * w, 0.5 * h] : [(1 + outside) * w, 0.5 * h];
      uniforms.uAxis!.value = origin === 'left' ? [1, 0] : [-1, 0];
    };

    const loop = (time: number) => {
      if (!rendererRef.current || !uniformsRef.current || !meshRef.current) return;
      uniforms.iTime!.value = time;
      try {
        renderer.render({ scene: mesh });
      } catch {
        // A lost context. Leave the loop rather than throw once a frame for the
        // rest of the session — gsap.ticker has no error handling of its own.
        gsap.ticker.remove(loop);
      }
    };

    window.addEventListener('resize', updatePlacement);
    updatePlacement();
    gsap.ticker.add(loop);

    cleanupRef.current = () => {
      gsap.ticker.remove(loop);
      window.removeEventListener('resize', updatePlacement);
      try {
        const canvas = gl.canvas;
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        canvas.parentNode?.removeChild(canvas);
      } catch {
        // Already gone. Nothing here is worth a console warning.
      }
      rendererRef.current = null;
      uniformsRef.current = null;
      meshRef.current = null;
    };

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
    // Tunables are deliberately absent — see the note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, origin, outside, dpr]);

  useEffect(() => {
    const u = uniformsRef.current;
    if (!u) return;
    u.uCore!.value = hexToRgb(core);
    u.uEdge!.value = hexToRgb(edge);
    u.uCoreBias!.value = coreBias;
    u.uSpeed!.value = speed;
    u.uDensity!.value = density;
    u.uWidth!.value = width;
    u.uReach!.value = reach;
    u.uSpread!.value = spread;
    u.uTwinkle!.value = twinkle;
    u.uGain!.value = gain;
    u.uFlow!.value = flow;
    u.uStretch!.value = stretch;
    u.uFlowDepth!.value = flowDepth;
  }, [core, edge, coreBias, speed, density, width, reach, spread, twinkle, gain, flow, stretch, flowDepth]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        pointerEvents: 'none',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}

export default RakeRays;
