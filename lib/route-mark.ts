/**
 * Which page you are on, marked on every navigation that says so.
 *
 * One attribute — `aria-current="page"` — on the link whose route the visitor is
 * currently reading, in the header's menu panel and in the footer's navigation.
 * `styles/menu.css` and `app/globals.css` draw the rest; the attribute assistive
 * tech already reads for this IS the styling hook, so the answer a screen reader
 * gets and the mark on screen cannot disagree.
 *
 * ## Why a script, and not the server
 *
 * Both navigations are rendered by LAYOUTS — the footer by `app/layout.tsx`, the
 * header by `app/(site)/layout.tsx` — and a layout in the App Router is not told
 * the route beneath it. The two server-side ways to it are both worse than this
 * file:
 *
 *   - `usePathname` is a client hook, so the footer and the menu become client
 *     components: a hydration boundary on all sixteen routes and the whole nav's
 *     copy shipped twice, to draw one line of green. `lib/menu.ts` exists at
 *     length to avoid exactly that.
 *   - Middleware writing the path into a request header opts every one of those
 *     sixteen STATIC pages into dynamic rendering.
 *
 * So it is `location.pathname`, read here.
 *
 * ## The three ways a pathname changes, and all three are hooked
 *
 * A hard load is `DOMContentLoaded` — and it has to be waited for, because this
 * script runs at the top of `<body>` and neither navigation has been parsed yet.
 * Back and forward are `popstate`. A client-side navigation is `pushState`,
 * which fires no event at all, so the two history methods are WRAPPED.
 *
 * That wrapper is the one intrusive thing in this file and it is the only way to
 * see a soft navigation from outside the framework. It calls through to whatever
 * it replaced and returns that result untouched, so Next — which patches these
 * same two methods itself, later, from its own bundle — sits on top and is
 * unaffected. `location` is already updated when the native call returns, which
 * is what makes reading it immediately after correct.
 *
 * The alternative was marking the panel each time it opened, which is true for
 * the menu (it cannot be read without being opened) and false for the footer,
 * which is on screen the whole time. One mechanism that is right for both beats
 * two that each cover half.
 *
 * ## The match is longest-prefix on a segment boundary
 *
 * Both halves are load-bearing. Exact-only would leave `/who-we-are/team` — a
 * real page with no nav entry of its own — with nothing lit at all. A bare
 * `startsWith` would light `Launch` on `/launchpad`, which is a different page
 * and not a child of it. Longest wins, so a route that is both under one entry
 * and is another lights the deeper one.
 *
 * The winner is computed ONCE across both navigations rather than per list,
 * because the best-matching route is a fact about the page and not about the
 * list you happen to be looking at. The footer carries five routes the menu does
 * not; on `/launchpad` the footer lights Launchpad and the menu lights nothing,
 * which is the truth in both.
 *
 * ## `data-qx-nav-mark` is the opt-in, and it is a joint
 *
 * Three files share the string: this one queries it, `components/nav/Footer.tsx`
 * and `components/nav/SiteHeader.tsx` render it. Nothing relates them at compile
 * time, so `tests/unit/nav-current.test.ts` asserts it as text — drop it from
 * either navigation and that list silently stops being marked.
 *
 * Opt-in rather than "every link on the page" because most links here are not
 * navigation: a card linking a pillar, a CTA, the homepage's site index. Marking
 * those would put `aria-current="page"` on a link the visitor has not been
 * offered as a place in the site, and would light the card you just arrived from.
 *
 * Wrapped in try/catch throughout, like `MENU_BOOT` and `REVEAL_BOOT`: it is an
 * enhancement on markup that already renders, and it must never be the reason a
 * page fails to paint.
 */
export const ROUTE_MARK_BOOT = `(function(){
try{
var d=document,SEL='[data-qx-nav-mark] a[href^="/"]';
// A trailing slash is the same page and an empty path is the root. A loop and
// not a regex, deliberately: this script is a template literal, and a backslash
// escape inside one is resolved by the TEMPLATE before the browser sees it — so
// a regex written with an escaped slash ships as a bare slash, which ends the
// literal early and is a syntax error on every page of the site.
function norm(s){while(s.length>1&&s.charAt(s.length-1)==='/')s=s.slice(0,-1);return s||'/'}
function hit(here,h){return here===h||(h!=='/'&&here.slice(0,h.length+1)===h+'/')}
function mark(){
try{
var here=norm(location.pathname),a=d.querySelectorAll(SEL),n=a.length,i,h,best='';
// Two passes, because the winner is the LONGEST match and the first pass is the
// only way to know which that is. One pass marking as it goes would light
// /who-we-are on /who-we-are/contact and then light Contact Us as well.
for(i=0;i<n;i++){h=norm(a[i].getAttribute('href')||'');if(hit(here,h)&&h.length>best.length)best=h}
for(i=0;i<n;i++){h=norm(a[i].getAttribute('href')||'');
if(best&&h===best)a[i].setAttribute('aria-current','page');else a[i].removeAttribute('aria-current')}
}catch(e){}
}
// pushState fires no event, so the method itself is the event. Call through
// first and mark after: the native call is what updates \`location\`, which is
// the only thing read above.
function wrap(k){var f=history[k];if(typeof f!=='function')return;
history[k]=function(){var r=f.apply(this,arguments);mark();return r}}
wrap('pushState');wrap('replaceState');
window.addEventListener('popstate',mark);
// The footer and the menu are both BELOW this script in the document, so there
// is nothing to mark yet on a hard load.
d.readyState==='loading'?d.addEventListener('DOMContentLoaded',mark):mark()
}catch(e){}
})();`;
