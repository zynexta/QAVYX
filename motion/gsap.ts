import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';

/**
 * THE GSAP SINGLETON. Every other module imports gsap from here, never from
 * the package — enforced by eslint.config.mjs.
 *
 * Registration must happen exactly once. Registering twice re-creates the
 * CustomEase definitions in motion/eases.ts, and any timeline that already
 * referenced an ease by string name ('qx.out') can end up pointing at a stale
 * curve. That failure is silent and extremely annoying to track down.
 *
 * Verified against gsap 3.15.0: MorphSVG, DrawSVG, SplitText, MotionPath and
 * CustomEase all ship in the public package. No Club membership is required as
 * of 3.13.
 *
 * Registration is guarded rather than bare because Next's dev server can
 * evaluate a module more than once across HMR boundaries.
 */

const registry = globalThis as unknown as { __qxGsapRegistered?: boolean };

if (typeof window !== 'undefined' && !registry.__qxGsapRegistered) {
  gsap.registerPlugin(
    ScrollTrigger,
    MorphSVGPlugin,
    DrawSVGPlugin,
    MotionPathPlugin,
    CustomEase,
    SplitText,
  );

  /**
   * gsap.ticker is the ONLY animation loop in this application; Lenis is driven
   * from it (see motion/lenis.ts). lagSmoothing must be off: after a long frame
   * GSAP would otherwise jump its internal clock forward, which desynchronises
   * every scrubbed timeline from Lenis's own interpolation and shows up as a
   * visible jump on the first scroll after any hitch.
   */
  gsap.ticker.lagSmoothing(0);

  /**
   * The mobile URL bar must not refresh the pin.
   *
   * BUILD-PLAN Phase 2 asks for this line explicitly and says why it belongs
   * there rather than here: "Set `ScrollTrigger.config({ ignoreMobileResize:
   * true })` now; it prevents the mobile URL-bar refresh storm that Phase 10
   * would otherwise have to solve." It was never set, and Phase 10 is where the
   * bill arrives — so it is set now, with the note it should have shipped with.
   *
   * What it does: ScrollTrigger's own resize handler otherwise fires a full
   * `refresh()` on every `resize` event, and on iOS Safari the URL bar sliding
   * away is a stream of them. A refresh re-measures every trigger and re-lays
   * the pin-spacer, which on a 1015vh pin is exactly the jump BUILD-PLAN names as
   * "the number one cause of mobile pin jumps". With this on, ScrollTrigger
   * ignores resizes that are height-only on touch devices.
   *
   * IT IS NOT A DUPLICATE OF `useViewport`'s 120px FILTER, and the two are not
   * interchangeable. This one governs SCROLLTRIGGER'S OWN refresh, which this
   * code never calls and cannot intercept; the filter in `useViewport` governs
   * REACT'S re-render and the geometry recompute hanging off it. Either one left
   * out is a URL bar that still moves the hero, by a different route.
   */
  ScrollTrigger.config({ ignoreMobileResize: true });

  registry.__qxGsapRegistered = true;
}

export {
  gsap,
  ScrollTrigger,
  MorphSVGPlugin,
  DrawSVGPlugin,
  MotionPathPlugin,
  CustomEase,
  SplitText,
};
