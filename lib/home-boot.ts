/**
 * The homepage's pre-paint boot script.
 *
 * A sibling of `REVEAL_BOOT` in `lib/reveal.ts` and built the same way — a
 * string of source, inlined by the page, run before React hydrates — but scoped
 * to one route, because what it decides is only true of one route.
 *
 * ## The homepage is a 1015vh scripted sequence, so a restored scroll is not a
 * ## position — it is a frame number
 *
 * Every other route on this site is a document. Coming back to a document
 * halfway down is exactly right, and the browser doing it unasked is the correct
 * default. `/` is not a document: the whole of `PIN_A` is one pinned timeline —
 * the mark assembling, the frame expanding, the carousel, the fly-through, the
 * title card, the launch — and a scroll offset into it is a seek into an
 * animation, not a reading position.
 *
 * MEASURED, on a reload from the bottom of the page: the browser restores 5495px
 * of a 13815px document and the visitor lands on `beat: 'launch'` — a rocket
 * already in flight, with the frame it flew out of hundreds of vh behind them.
 * The same value comes back on a Back navigation. Nothing about that state is
 * recoverable by scrolling a little; the beat is a function of scroll and the
 * intro that explains the mark has already been skipped.
 *
 * So the homepage opens at the top. That is a real trade — a visitor who was
 * reading the site index at the bottom, followed a pillar link and came back has
 * to travel the pin again — and it is the right one, because the alternative is
 * arriving mid-launch with no idea what the frame is.
 *
 * ## `manual` is per-entry, and IT DOES LEAK ACROSS A SOFT NAVIGATION
 *
 * `history.scrollRestoration` is a property of the current session history
 * ENTRY, not of the browser or the tab, so the obvious reading is that inner
 * routes are untouched. That reading is right for a fresh document load and
 * WRONG for `pushState`, which is how the App Router navigates: the new entry is
 * in the same document and inherits the current value. Measured — after a click
 * through to `/growth-marketing` the property still read `'manual'`, which would
 * have quietly cost every pillar page its scroll restoration.
 *
 * `components/home/OpenAtTop.tsx` is what hands it back, on unmount, once the
 * router has pushed the entry being navigated to. This script and that component
 * are one mechanism in two halves — this one owns the reload, because it is the
 * only half that can run before first paint.
 *
 * The `scrollTo` here is the belt to that braces: on a very slow parse a browser
 * can have restored before this line is reached, and `manual` only prevents a
 * restoration that has not happened yet.
 *
 * ## IT ALSO RECORDS WHETHER THE VISITOR SCROLLED FIRST, and that is new
 *
 * `OpenAtTop`'s effect repeats the `scrollTo(0, 0)` on mount, which is right for
 * the arrival it describes and wrong for one case this script can see and that
 * component cannot: a visitor who scrolled THEMSELVES before the page hydrated.
 *
 * That case used to be unreachable in practice, because the top of the document
 * was a screen of nothing until the motion layer arrived — there was nothing to
 * scroll for. `#qx-hero-static` now stands in that space until the hero paints
 * (see `app/globals.css`), so on a slow phone there is a real hero to read for
 * several seconds, and hydration was yanking a reading visitor back to the top.
 * Measured on a 4x-CPU profile: scrolled to 1200px at 1.6s, hydration at 12.1s,
 * scroll snapped to 0.
 *
 * A gesture flag rather than a scroll-position check, and the difference is the
 * whole point: `scrollY !== 0` cannot tell a visitor's own swipe from the stale
 * restoration this file exists to undo, and those two want opposite treatment.
 * `wheel`, `touchstart` and `keydown` are all user intent by definition.
 *
 * IT IS SCOPED TO THE PRE-HYDRATION WINDOW BY `__qxHomeArrived`, AND THAT GUARD
 * IS NOT OPTIONAL. Without it the flag survived the whole session — the App
 * Router keeps ONE document across navigations, so a single swipe anywhere set
 * it for good and every later Back to `/` stopped opening at the top, which is
 * the exact guarantee `OpenAtTop` exists to make. Caught by going `/` -> pillar
 * -> Back and landing at 1395px. `OpenAtTop` sets `__qxHomeArrived` on its first
 * mount and clears the flag as it reads it, so this can only ever describe
 * gestures made while the page was still waiting for its JavaScript.
 *
 * `once` and `passive` on all three so this can never cost a frame of scrolling,
 * and the listeners are on `window` so nothing in the page can stop them by
 * swallowing the event.
 *
 * ## IT ALSO RUNS THE FALLBACK HERO'S DELAY, and 2000 is measured
 *
 * `data-qx-hero-boot` goes on immediately and `data-qx-hero-slow` two seconds
 * later; `app/globals.css` reads both, and the long note there has the full
 * argument. The short version is that the window before the motion layer paints
 * wants opposite treatment at opposite ends of the connection range — a black
 * screen reads as loading at 1.2s and as broken at 6.3s, and the static hero
 * reads as a considerate fallback at 6.3s and as a flash of the wrong page at
 * 1.2s. Both were shipped and both were reported. A timer is the only thing that
 * tells those two apart.
 *
 * 2000ms against production measurements at 390x844: the motion layer first
 * paints at 1.2s on fast wifi, 3.1s at 4x CPU / 1.6 Mbps, 6.3s at 6x CPU / 0.7
 * Mbps. It clears the fast case with enough margin that a healthy reload never
 * reveals the fallback at all, and still shows a hero for most of a slow phone's
 * wait.
 *
 * IT IS HERE RATHER THAN IN A COMPONENT because it has to start at PARSE time.
 * An effect starts the clock at hydration, which on the slow connections this
 * exists for is most of the wait already gone — the timer would fire seconds
 * after the moment it is timing. This script is also homepage-only, which is
 * right: `HeroStatic` is rendered by `app/page.tsx` and nowhere else.
 *
 * ## It cannot throw
 *
 * Wrapped, like `REVEAL_BOOT`, because a boot script that throws takes the rest
 * of the document's parsing with it. There is nothing in here worth a blank page
 * — the failure mode without it is a visitor landing where they left off, which
 * is merely the behaviour this exists to improve on. If the flag half fails the
 * worst case is the old behaviour: the arrival scroll runs unconditionally.
 */
export const HOME_TOP_BOOT = `(function(){try{
var r=document.documentElement;
if('scrollRestoration' in history)history.scrollRestoration='manual';

var isHardRefresh = false;
var scrolledToProblem = false;
try {
  if (sessionStorage.getItem('qx_hard_refresh') === 'true') {
    isHardRefresh = true;
    sessionStorage.removeItem('qx_hard_refresh');
  }
  if (sessionStorage.getItem('qx_scrolled_to_problem') === 'true' || sessionStorage.getItem('qx_scrolled_past_hero') === 'true') {
    scrolledToProblem = true;
  }
} catch(e){}

if (!isHardRefresh && scrolledToProblem) {
  r.setAttribute('data-qx-restore-problem', '');
  r.setAttribute('data-qx-restoring-scroll', '');
  r.setAttribute('data-qx-nav-defer', '');
  r.setAttribute('data-qx-nav', 'on');

  var checkAndScroll = function() {
    try {
      var el = document.getElementById('the-problem') || document.getElementById('qx-launch-static');
      if (el) {
        var y = el.getBoundingClientRect().top + window.scrollY;
        if (y > 0 && Math.abs(window.scrollY - y) > 1) {
          window.scrollTo(0, y);
        }
        r.removeAttribute('data-qx-restoring-scroll');
        return true;
      }
    } catch(e){}
    return false;
  };

  if (!checkAndScroll()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndScroll, { once: true });
    }
  }
} else {
  if (window.scrollY !== 0) window.scrollTo(0, 0);
}

r.setAttribute('data-qx-hero-boot','');
setTimeout(function(){try{r.setAttribute('data-qx-hero-slow','');}catch(e){}},2000);
var mark=function(){try{if(!window.__qxHomeArrived)window.__qxUserScrolled=1;}catch(e){}};
['wheel','touchstart','keydown'].forEach(function(t){
window.addEventListener(t,mark,{once:true,passive:true});
});
}catch(e){}})();`;
