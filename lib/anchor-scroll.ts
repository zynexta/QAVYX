/**
 * Arriving at a pillar page from a carousel chip, as a SCROLL rather than a jump.
 *
 * A chip links to `/build-scale#crm-automation-systems`. Left alone, the browser
 * lands with that section already at the top of the screen — which is correct,
 * and tells the visitor nothing. They asked for the section and got a page that
 * looks like it starts there, with no sense of where it sits in the whole or
 * that anything moved. What they actually asked for is to be TAKEN to it.
 *
 * So: land at the top, then travel.
 *
 * ## Why a pre-paint script rather than an effect
 *
 * The browser performs the fragment jump as soon as it parses the target
 * element — long before React hydrates. An effect can only rewind that, and the
 * rewind is visible: the section paints at the top, then the page snaps to zero,
 * then it animates back down. Three states where there should be one.
 *
 * This runs BEFORE the sections are parsed and removes the fragment, so the jump
 * never happens at all. Then it puts the fragment back once it has scrolled, so
 * the URL the visitor can copy is the one they arrived on. `replaceState` does
 * not scroll and does not add a history entry, so neither call is observable.
 *
 * Same idiom, and the same reasoning, as `REVEAL_BOOT` in `lib/reveal.ts`: a
 * decision that has to be taken before first paint can only be taken by a script
 * that runs before first paint. Unlike that one this is NOT in the root layout —
 * it renders inside `PillarPage`, so it exists on exactly the routes that have
 * section anchors and cannot strip a fragment from a page that meant to keep it.
 *
 * ## Three ways out, all of them leaving the fragment alone
 *
 *  1. **Reduced motion.** Returns before touching the URL, so the browser's own
 *     instant jump stands. A visitor who asked for no motion gets no animated
 *     travel — and still lands on the right section, which is the part that
 *     matters. `app/globals.css` already forces `scroll-behavior: auto` for
 *     them, but that governs CSS-driven scrolling and not `scrollIntoView`, so
 *     the check has to be here too.
 *  2. **No JavaScript.** The script never runs, the fragment is untouched, the
 *     browser jumps natively. This is why the anchor stays a real `href` and the
 *     scroll is an enhancement over it rather than a replacement for it.
 *  3. **A fragment with no matching section** — a stale or hand-typed URL. The
 *     fragment goes back and nothing scrolls, which is exactly what the browser
 *     would have done.
 *
 * ## THE TIMING IS THE WHOLE TRICK, AND `DOMContentLoaded` IS TOO EARLY
 *
 * The first version of this called `scrollIntoView({behavior:'smooth'})` from
 * `DOMContentLoaded` and it did not animate — measured, by recording every
 * scroll event: ONE event, 0ms apart, i.e. a jump wearing a smooth scroll's
 * name. The browser is perfectly capable of the animation (the same call after
 * load produces 16-33 events), so the fault was when it was asked, not what.
 *
 * At `DOMContentLoaded` the document has not reached its final height — the
 * display and mono faces have not landed, and every section's height depends on
 * them. The scroll is computed against a document too short to hold it, clamps
 * at the bottom, and completes in a single frame. Layout then grows underneath
 * the finished scroll.
 *
 * So it waits for `document.fonts.ready`, then two frames: one for the browser
 * to lay out with the real metrics, one to be sure that layout has been painted
 * before a scroll is measured against it. `load` is the fallback where the Font
 * Loading API is missing. The visible result is the intended one either way —
 * the page appears at the top, holds for a beat, and then travels.
 *
 * Wrapped in try/catch throughout: this is decoration on top of a link that
 * already works, and it must never be the reason a page fails to render.
 */
export const ANCHOR_SCROLL_BOOT = `(function(){
try{
var h=decodeURIComponent(location.hash.slice(1));if(!h)return;
try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(e){return}
var base=location.pathname+location.search;
function restore(){try{history.replaceState(null,'',base+'#'+h)}catch(e){}}
try{history.replaceState(null,'',base)}catch(e){return}
function go(){
var el=null;try{el=document.getElementById(h)}catch(e){}
if(!el){restore();return}
try{el.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){try{el.scrollIntoView()}catch(e2){}}
restore()
}
function run(){requestAnimationFrame(function(){requestAnimationFrame(go)})}
function when(){
var f=null;try{f=document.fonts&&document.fonts.ready}catch(e){}
if(f&&f.then){f.then(run,run);return}
document.readyState==='complete'?run():addEventListener('load',run)
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',when):when()
}catch(e){}
})();`;
