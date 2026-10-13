/**
 * The homepage header's arrival, which is a different thing from its position.
 *
 * ## What `position: sticky` actually did, and why it was wrong here
 *
 * The header is rendered after `#qx-hero-reserve`, so its normal-flow position
 * is on the far side of the pinned hero — and a sticky element does not stick
 * until that position reaches the top of the viewport. That much was the
 * intended behaviour and it worked.
 *
 * What it also does is SCROLL UP THROUGH THE VIEWPORT ON THE WAY THERE. For the
 * ~800px between the bar entering from the bottom and reaching the top, a
 * full-width bordered row with a logo in it floats in the middle of an otherwise
 * empty black screen, attached to nothing. It reads as a section that failed to
 * lay out. "Show it after the pin" turned out to mean "show it AT the pin's end",
 * and sticky cannot express that on its own: the element has to be in flow to
 * know where it belongs, and being in flow is exactly what drags it through the
 * screen.
 *
 * So on the homepage the bar is taken out of flow, held above the top edge, and
 * slid down at the moment it would have become stuck. Everywhere else it is left
 * alone — the fifteen inner routes have no hero to wait for and their header is
 * the ordinary sticky bar it always was.
 *
 * ## A sentinel, and not the pin's own timeline
 *
 * `#qx-nav-sentinel` is a zero-height element at the point in the document where
 * the header sits. When it passes above the viewport's top edge, the header is
 * exactly where it would have stuck.
 *
 * The alternative was a callback at the end of the pin's ScrollTrigger, and it
 * is worse in three ways: it puts the homepage's motion chunk between a visitor
 * and their navigation, it does not fire for the reduced-motion path where
 * there is no pin at all but there IS still a hero-sized block to scroll past,
 * and it makes the header's arrival depend on a second source of truth about
 * where the hero ends. The sentinel is that one source, and it is the same
 * element the header is positioned relative to in flow.
 *
 * ## REVERSIBLE, unlike the reveal layer
 *
 * `REVEAL_BOOT` sets `data-revealed` once and never takes it back, which is
 * right for copy fading in and wrong here: the pin is scrubbed, visitors scroll
 * back up through it, and a header left painted over the hero is the exact fault
 * `LaunchTitle` documents at length. So this toggles in both directions.
 *
 * ## The gate is set only when the observer is actually installed
 *
 * `data-qx-nav-defer` is what `styles/header.css` keys the whole behaviour off,
 * and it is written INSIDE the branch that finds a sentinel and an
 * `IntersectionObserver`. With no JavaScript, no observer, or no sentinel — which
 * is every inner route — the attribute never appears and the header is the plain
 * sticky bar. A gate set optimistically would hide the header forever on exactly
 * the paths that cannot un-hide it.
 */
export const NAV_REVEAL_BOOT = `(function(){
try{
var d=document,r=d.documentElement,io,seen;
if(!('IntersectionObserver' in window))return;
function sync(on){on?r.setAttribute('data-qx-nav','on'):r.removeAttribute('data-qx-nav')}
function scan(){
var s=d.getElementById('qx-nav-sentinel');
if(s===seen)return;
seen=s;
if(io){io.disconnect();io=null}
if(!s){r.removeAttribute('data-qx-nav-defer');sync(false);return}
r.setAttribute('data-qx-nav-defer','');
io=new IntersectionObserver(function(es){
var e=es[es.length-1];
// ABOVE the viewport, not merely outside it. A sentinel below the fold is also
// unintersecting, and treating that as "past" would reveal the header at the
// top of the page — which is the whole thing this exists to prevent.
sync(!e.isIntersecting&&e.boundingClientRect.top<=0)
},{threshold:0});
io.observe(s)
}
// Next replaces the tree on a client-side navigation, so the sentinel this is
// watching can be detached without this script ever unloading. Same
// MutationObserver pairing as \`REVEAL_BOOT\`, and the \`seen\` check above is what
// keeps a re-scan from tearing down an observer that is still watching the same
// element.
function start(){scan();new MutationObserver(function(){scan()}).observe(d.body,{childList:true,subtree:true})}
d.readyState==='loading'?d.addEventListener('DOMContentLoaded',start):start()
}catch(e){}
})();`;
