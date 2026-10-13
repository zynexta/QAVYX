/**
 * The menu's open/closed state, as an inline script rather than a component.
 *
 * The header, the panel, the eleven links and the socials are all
 * server-rendered markup in `components/nav/SiteHeader.tsx`. The only thing that
 * needs a runtime is the word "open", and the whole of that is one attribute on
 * `<html>` — `data-qx-menu` — which `styles/menu.css` reads for every transition
 * in the panel.
 *
 * ## Why not a client component
 *
 * The React Bits original this was modelled on drives every step with GSAP:
 * timelines for the pre-layers, a stagger for the items, a tween per number, a
 * text cycler on the button. Ported as-is that is ~62 KB of GSAP plus a
 * hydration boundary on FIFTEEN routes that currently have neither, to move some
 * panels in from the right — and the stagger is a delay-per-item in either
 * implementation. CSS has `transition-delay`.
 *
 * So this is the same idiom the reveal layer and the anchor scroll already use
 * here: a small script in the document head, no boundary, no framework, and it
 * survives client-side navigation because the listeners are DELEGATED to
 * `document` rather than bound to a button that Next will swap out from under
 * them.
 *
 * ## What it does that CSS alone cannot
 *
 * `:target`, the checkbox hack and `<details>` can all open a panel. None of
 * them can close it on Escape, none can close it when the visitor clicks the
 * page behind it, and `<details>` in particular cannot be a full-height fixed
 * panel without its `<summary>` dragging the layout around. All three are the
 * difference between a menu and a disclosure widget.
 *
 * It also owns the two attributes assistive tech reads — `aria-expanded` on the
 * button and `inert` on the panel — because both are STATE and the server has no
 * business guessing at them. `inert` is what stops a closed panel's links being
 * tabbable, and `visibility: hidden` in the stylesheet does the same job for
 * browsers without it. The `:target` path below relies on the second alone,
 * which is correct: nothing here is running to write the first.
 *
 * ## WHICH PAGE YOU ARE ON IS NOT THIS FILE'S JOB
 *
 * The panel's current-page mark is `aria-current="page"`, and `lib/route-mark.ts`
 * writes it — for the footer's navigation in the same pass, off the same match,
 * on every navigation rather than only when this panel opens.
 *
 * It lived here first, marked at open time, and that is right for a panel that
 * cannot be read without being opened and wrong for a footer that is on screen
 * the whole time. One mechanism that is correct for both beats two that each
 * cover half, so the panel's `<nav>` carries `data-qx-nav-mark` and this file
 * has nothing to say about it.
 *
 * `styles/menu.css` draws the mark and has no `:target` twin for it, unlike
 * every other open rule in that file: the attribute is written by a script, so
 * there is no no-JS state for a second rule to describe. Without scripting the
 * menu still opens on `:target` and simply lights nothing.
 *
 * ## No JavaScript still gets a menu, on `:target`
 *
 * It did not for one round, on the argument that the footer already carries the
 * whole eleven-route navigation so the menu could be a pure enhancement. That is
 * true and it was still the wrong call for a PHONE: the header is the only thing
 * above the fold there, and it was offering a visitor without scripting a button
 * that did nothing at all.
 *
 * So the panel also opens on `#qx-menu-panel:target`, and the header serves two
 * openers — a `<button>` for this script and an `<a href="#qx-menu-panel">` for
 * the browser — with `styles/menu.css` showing exactly one, keyed off the
 * `data-qx-menu-js` attribute set at the top of this file. Two elements rather
 * than one link doing both jobs, because `aria-expanded` describes a button and
 * this script owns it; a link that navigates is not making that claim.
 *
 * ## ONE CONTROL OPENS AND CLOSES IT, and that is a change
 *
 * The button already animates Menu→Close and +→×, and for several phases that
 * was a lie: `styles/menu.css` gave the panel the full viewport height, so it
 * covered the bar and the toggle under it — `elementFromPoint` over the button
 * returned the sheet at 390px and at 1440px alike. A second close control had to
 * be drawn inside the sheet, a few pixels from the X that could not be clicked.
 *
 * The panel now starts at `--qx-nav-h`, below the bar. The toggle is uncovered
 * at every width and does both jobs, which is what the client asked for and what
 * the button was already claiming.
 *
 * `#qx-menu-close` survives in the markup for the `:target` path, which has no
 * other exit — the fallback opener's href IS the panel's fragment, so it cannot
 * un-target what it opened. It carries `qx-menu-nojs`, so it is `display: none`
 * wherever this script has run, and this script no longer addresses it.
 *
 * The footer is still the real navigation and still needs none of this.
 *
 * ## The scroll lock is on `<html>`, and it is HALF the lock
 *
 * `overflow: hidden` on the root element while the panel is open, and this
 * script still needs no reference to Lenis — but not for the reason recorded
 * here before. That read: "Lenis scrolls by writing `window.scrollTo` — that
 * write is what the lock stops, so the two do not need to negotiate." IT DOES
 * NOT STOP IT. Measured on `/growth-marketing` with the panel open, one wheel
 * gesture moved the page from 0 to 796px. `overflow: hidden` stops the USER
 * AGENT scrolling the scrollport; the scrollport is still there while the
 * content overflows and programmatic scrolling into it is still allowed, which
 * is exactly what Lenis does after preventDefaulting the wheel.
 *
 * It went unnoticed because Lenis was the homepage's alone and the panel only
 * exists there after the pin. It is site-wide now, so the other half of the lock
 * lives in `components/motion/SmoothScroll.tsx`, which observes the same
 * `data-qx-menu` attribute this script already publishes and calls
 * `lenis.stop()`. This file is unchanged and still owns the attribute; nothing
 * here has to know Lenis exists.
 *
 * KEEP `overflow: hidden` REGARDLESS. `syncTouch: false` leaves touch scrolling
 * native on purpose, so on a phone this attribute is the entire lock and
 * `stop()` does nothing. One input each.
 *
 * Wrapped in try/catch throughout, like `REVEAL_BOOT` and `ANCHOR_SCROLL_BOOT`:
 * this is an enhancement on markup that already renders, and it must never be
 * the reason a page fails to paint.
 */
export const MENU_BOOT = `(function(){
try{
var d=document,r=d.documentElement,OPEN='data-qx-menu';
// THE FALLBACK'S OFF SWITCH, and it must be the first thing that happens.
// Without scripting the panel opens on :target and the header shows a link
// instead of a button — see styles/menu.css. This attribute is what turns both
// of those off, and it is set here rather than at the end so it lands before the
// header below it has been parsed: there is no frame in which a visitor sees the
// wrong control, and no frame in which both are on screen.
r.setAttribute('data-qx-menu-js','');
function panel(){return d.getElementById('qx-menu-panel')}
function toggle(){return d.getElementById('qx-menu-toggle')}
function sync(open){
var p=panel(),t=toggle();
if(p){open?p.removeAttribute('inert'):p.setAttribute('inert','');p.setAttribute('aria-hidden',open?'false':'true')}
if(t)t.setAttribute('aria-expanded',open?'true':'false');
open?r.setAttribute(OPEN,'open'):r.removeAttribute(OPEN)
}
function close(back){if(!r.hasAttribute(OPEN))return;sync(false);
// FOCUS GOES BACK ON ESCAPE AND NOWHERE ELSE. Escape leaves focus inside a
// panel that is now inert, so it has to be moved or it lands on <body> and the
// next Tab restarts at the top of the document. A click already moved it — and
// pulling it to the toggle mid-click steals it from whatever was clicked,
// which on this header is the WhatsApp link sitting right beside the button.
if(back){var t=toggle();if(t)t.focus()}}
d.addEventListener('click',function(e){
var t=e.target;if(!t||!t.closest)return;
if(t.closest('#qx-menu-toggle')){e.preventDefault();sync(!r.hasAttribute(OPEN));return}
if(!r.hasAttribute(OPEN))return;
// NOTHING HERE INTERCEPTS #qx-menu-close ANY MORE, and that is not an omission.
// It used to: the link was the only way out on a phone, so it had to work in
// both worlds and this branch was the scripted half of it. The panel now hangs
// below the header rather than over it, so the toggle above closes the menu at
// every width, and the link carries qx-menu-nojs - display:none wherever this
// script has run, and therefore unclickable. A branch that cannot fire is worse
// than no branch, because its comment describes a mechanism that has moved.
//
// If the stylesheet ever failed to load, the link would be visible and would
// fall into the rule below: the panel closes, and the browser follows the href
// to the header's own fragment. Focus does not return to the toggle on that
// path, which is the whole of what is lost when CSS is missing.
//
// A link inside the panel navigates; the panel must not still be open on the
// other side of it. A same-page fragment never unmounts the panel at all.
if(t.closest('#qx-menu-panel a')){sync(false);return}
if(!t.closest('#qx-menu-panel'))close(false)
},true);
d.addEventListener('keydown',function(e){if(e.key==='Escape')close(true)});
// Next swaps the whole tree on a client-side navigation. The listeners above
// survive it (they are on \`document\`), but the attribute does not describe the
// new page, and a panel that was open when the visitor clicked a link would
// otherwise stay open over it.
sync(false)
// AND AGAIN ONCE THE PANEL EXISTS, WHICH IT DOES NOT YET.
//
// This script is injected from \`app/layout.tsx\` and runs the instant the parser
// reaches it — deliberately, because \`data-qx-menu-js\` above has to land before
// the header is parsed. The consequence is that \`sync(false)\` a few lines up
// runs when \`#qx-menu-panel\` is still unparsed: \`panel()\` returns null, the
// \`if(p)\` guard skips, and the closed panel never receives \`inert\` or
// \`aria-hidden="true"\` at all. Measured in Chrome, not reasoned about — the
// panel sat at \`aria-hidden=null, inert=false\` for the life of the page.
//
// The visible damage was limited because \`styles/menu.css\` already keeps the
// closed panel \`visibility: hidden\`, which takes its links out of the tab order
// and the accessibility tree on its own. \`inert\` and \`aria-hidden\` are the
// belt-and-braces \`SiteHeader\` documents, and they were simply absent.
//
// Deferred to \`DOMContentLoaded\` rather than moving the whole script: the early
// attribute is load-bearing for the no-JS fallback and must stay where it is.
// The state is re-asserted, never inverted — \`sync\` is idempotent, so if a
// visitor somehow opened the panel before this fires, the guard below leaves it
// open rather than slamming it shut under them.
if(d.readyState==='loading'){d.addEventListener('DOMContentLoaded',function(){
if(!r.hasAttribute(OPEN))sync(false)},{once:true})}
}catch(e){}
})();`;
