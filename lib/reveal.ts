import type { CSSProperties } from 'react';

/**
 * The scroll-reveal layer's two halves: the inline boot script, and the one
 * helper components use to stagger a list.
 *
 * The CSS is `styles/motion.css` and `styles/frame.css`; read the note at the
 * top of the first for the contract this file implements. In short: the served
 * HTML is visible, and nothing is hidden until this script has decided that this
 * visitor is going to get the animation instead.
 */

/**
 * Runs as the FIRST child of `<body>`, blocking, before any `[data-reveal]`
 * element has been parsed. That placement is the whole design:
 *
 *   - it is before first paint, so no visitor sees the content and then sees it
 *     hidden — the flash that `useState` + an effect could not avoid, and the
 *     same reason `#qx-hero-static` is hidden by a media query rather than by
 *     JavaScript;
 *   - it is not a React component, so the eleven server-rendered inner routes
 *     stay free of any hydration boundary;
 *   - it is ~1 KB of inline HTML rather than a route chunk, so the initial-route
 *     budget (`scripts/check-bundle.mjs`, 165 KB) is untouched.
 *
 * ## What it refuses to do
 *
 * It does not set `data-qx-motion` at all when the visitor prefers reduced
 * motion, or when `IntersectionObserver` is missing. Every hiding rule in
 * `styles/motion.css` is nested under that attribute, so "declined" means the
 * page is exactly the document it already was.
 *
 * ## Three things that look like belt-and-braces and are not
 *
 * **The `change` listener.** Toggling the OS setting with the page open has to
 * take effect, the same requirement `hooks/useReducedMotion.ts` meets for the
 * hero. It matters more here than it looks: `#qx-hero-static` is `display: none`
 * while the motion layer runs, so nothing inside it can ever intersect and its
 * items would still be hidden at the moment the media query reveals them.
 * Removing the attribute is what makes that content appear.
 *
 * **The MutationObserver.** This site navigates client-side through `<Link>`, so
 * most `[data-reveal]` elements a visitor ever sees are inserted into a document
 * that has already fired `DOMContentLoaded`. Without it, every route after the
 * first would render its content hidden and never reveal it — an invisible page,
 * reachable only by clicking a link.
 *
 * **`requestAnimationFrame` coalescing.** The homepage's pinned ScrollTrigger
 * inserts and removes pin-spacers, and `useGSAP` mounts and reverts subtrees;
 * each is a `childList` record. Coalescing to one scan per frame keeps a full
 * `querySelectorAll` off the critical path during the 880vh pin.
 *
 * `unobserve` on reveal, so an element is entered once and then costs nothing —
 * this is an entrance, not a scrubbed effect, and re-hiding content that has
 * scrolled back off screen would mean a reader who scrolls up finds an empty
 * page.
 *
 * ## The asymmetric `rootMargin` is a bug fix, not a tuning knob
 *
 * `-12%` at the bottom is the tuning: a section reveals once its top has reached
 * 88% of the viewport height, so the movement is finishing as it comes into
 * reading position rather than starting there.
 *
 * `200000px` at the TOP is not tuning at all — it is the difference between this
 * working and this losing content. An IntersectionObserver reports the state
 * after a scroll, not the path taken to get there, so anything that JUMPS the
 * viewport past a section never fires for it and that section stays at
 * `opacity: 0` for the rest of the visit. That is not a hypothetical: the FAQ
 * gives every row an `#anchor`, the browser restores scroll position on reload,
 * and a fast flick on a phone covers several screens between two frames. It was
 * reproducible by scrolling a pillar page to the bottom in one call — the CTA
 * row never appeared, and nothing further would ever make it appear.
 *
 * Expanding the root upward instead makes the condition "has this element's top
 * ever reached 88% of the viewport", which is what the effect actually means and
 * is true regardless of how the viewport got there. The number is a stand-in for
 * infinity, chosen to exceed any real document height with room to spare.
 *
 * `threshold: 0` rather than `0.01` for the same reason: with the root expanded,
 * an element far above the viewport is fully inside it, but a zero-height
 * element — a section whose content has not laid out yet — has an intersection
 * RATIO of 0 and would never cross a positive threshold.
 */
export const REVEAL_BOOT = `(function(){
var d=document,r=d.documentElement,mq;
try{if(!('IntersectionObserver' in window))return;mq=window.matchMedia('(prefers-reduced-motion: reduce)')}catch(e){return}
function sync(){mq.matches?r.removeAttribute('data-qx-motion'):r.setAttribute('data-qx-motion','on')}
sync();
var io=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++){var e=es[i];if(!e.isIntersecting)continue;e.target.setAttribute('data-revealed','');io.unobserve(e.target)}},{rootMargin:'200000px 0px -12% 0px',threshold:0});
var q=0;
function scan(){q=0;var n=d.querySelectorAll('[data-reveal]:not([data-revealed])');for(var i=0;i<n.length;i++)io.observe(n[i])}
function later(){if(q)return;q=1;requestAnimationFrame(scan)}
function start(){scan();new MutationObserver(later).observe(d.body,{childList:true,subtree:true});if(mq.addEventListener)mq.addEventListener('change',function(){sync();later()})}
d.readyState==='loading'?d.addEventListener('DOMContentLoaded',start):start()
})();`;

/**
 * What marks an element as a reveal TRIGGER. Spread it: `<section {...reveal}>`.
 *
 * ## `suppressHydrationWarning` is the load-bearing half
 *
 * The boot script above runs before React hydrates and writes two attributes the
 * server never rendered: `data-qx-motion` on `<html>`, and `data-revealed` on
 * every trigger that is already in the viewport. React 19 compares the served
 * DOM against its own render and logs a mismatch for both — a console error on
 * every page load, on every route, for a page that is working exactly as
 * designed.
 *
 * `suppressHydrationWarning` is React's sanctioned answer to precisely this
 * ("this element's attributes are managed outside React on purpose"), and it is
 * what `next-themes` and every other pre-paint theme script uses for the same
 * reason. The alternatives were all worse: deferring the first scan until after
 * hydration is a race with no reliable signal, and deferring it to `load` would
 * hold above-the-fold sections blank until the last font arrived.
 *
 * IT SUPPRESSES THIS ELEMENT ONLY — its own attributes and its own text, not its
 * children. Every trigger here is a container whose children are ordinary
 * server-rendered markup, so a real mismatch inside one is still reported.
 *
 * Spreading a shared object rather than writing the pair by hand at nineteen
 * call sites is what keeps them from drifting: a trigger that gets `data-reveal`
 * without the suppression is a console error that only appears above the fold.
 */
export const reveal = {
  'data-reveal': '',
  suppressHydrationWarning: true,
} as const;

/**
 * The stagger position of one item in its section, as an inline custom property.
 *
 * `styles/motion.css` turns it into `transition-delay: lead + i * step`, so the
 * cadence is a token and the position is data. Components pass the index they
 * already have from `.map()`; nothing measures the DOM and nothing counts
 * children in JavaScript.
 *
 * The cast is unavoidable: React's `CSSProperties` has no index signature for
 * custom properties, though it renders them correctly.
 */
export function stagger(index: number): CSSProperties {
  return { '--i': index } as CSSProperties;
}
