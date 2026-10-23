'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MENU_NAV, ORGANISATION, SOCIAL, WHATSAPP } from '@/content/site';
import { NavLogo } from './NavLogo';
import { WhatsAppGlyph } from './WhatsAppGlyph';
import { WhatsAppLink } from './WhatsAppLink';

/**
 * The header: the mark, a WhatsApp icon, and a button that opens the menu.
 *
 * ## THIS IS NOT THE NAVBAR THAT WAS REMOVED
 *
 * `app/layout.tsx` carried "THERE IS NO NAVBAR ... it was removed on the
 * client's direction" for three phases, `content/site.ts` said the same, and
 * `phase8c-shell.spec.ts` had a test whose entire job was to keep it that way.
 * All three are amended rather than deleted, because the decision they recorded
 * still holds for the thing it was about: a bar of navigation links across the
 * top of every page.
 *
 * There are no navigation links in this header. There are three controls — home,
 * chat, menu — and the routes live behind the third one. The rule the spec now
 * asserts is the narrower true one: no link list above the fold.
 *
 * ## Where it is rendered, and why that is two places
 *
 * `app/(site)/layout.tsx` puts it at the top of all fifteen inner routes.
 * `app/page.tsx` puts it AFTER `#qx-hero-reserve`, and passes `deferred`.
 *
 * Document position alone gets most of the way: a sticky element does not stick
 * until its normal-flow position reaches the top of the viewport, and on the
 * homepage that position is 1015vh down. `deferred` is the rest of it, and it
 * exists because sticky ALSO scrolls the bar up through the viewport on the way
 * — roughly 800px of a full-width bordered row floating in the middle of an
 * empty black screen before it reaches the top. `styles/header.css` and
 * `lib/nav-reveal.ts` replace that journey with the bar arriving at the top edge
 * at the moment it would have stuck. Both are gated so that a visitor without
 * the observer gets the plain sticky bar rather than no header at all.
 *
 * It must stay OUTSIDE `#qx-hero-reserve` for the reason everything fixed on
 * this site does: ScrollTrigger's pin puts a transform on the spacer, a
 * transform is a containing block for `position: fixed`, and the panel this
 * header opens is fixed.
 *
 * ## Sticky at every width
 *
 * It was sticky below `md` and static from it for one round — the client's first
 * wording was "sticky navbar for mobile view", and the reasoning for holding the
 * line there was that a bar following a desktop reader down every page is close
 * to the thing the original no-navbar decision was against. The client asked for
 * it on desktop too, which settles it: with no links in the bar, what follows
 * the reader is three controls and not a navigation bar, and the objection does
 * not really survive that.
 *
 * IT COSTS A LINE IN `globals.css`, and that line is not optional. A bar pinned
 * to the top of the viewport is over the top of every fragment landing on the
 * site — the twenty-four carousel chips among them — so `scroll-padding-top` is
 * set from `--qx-nav-h`, which is why that height is a token rather than a
 * `py-3` on the row below.
 *
 * ## Every route gets the same header, including `/`
 *
 * The logo links to `/` from the homepage too, which normally reads as a dead
 * link. Here it is the way back UP: the header only exists below a 1015vh pinned
 * sequence, and clicking it returns you to the top of it.
 */
/**
 * The two openers are the same control drawn twice, so their appearance is one
 * string and one component. They differ in exactly two things — the element and
 * which of `qx-menu-js` / `qx-menu-nojs` it carries — and a visitor is only ever
 * shown one, so any divergence here would be invisible until the wrong half was
 * the one on screen.
 */
const TOGGLE_CLASS =
  'qx-menu-toggle flex h-[2.25rem] w-[2.25rem] sm:h-[2.5rem] sm:w-[2.5rem] items-center justify-center rounded-sm border border-qx-line bg-qx-ink/60 text-qx-grey no-underline transition-colors hover:border-[#2ABD00] hover:text-qx-white shrink-0';

/**
 * Small square opener control containing a downward chevron arrow icon.
 */
function ToggleFace() {
  return (
    <>
      <span className="qx-menu-toggle__words hidden" aria-hidden="true">
        <span className="qx-menu-toggle__word">Menu</span>
        <span className="qx-menu-toggle__word">Close</span>
      </span>
      <span className="qx-menu-toggle__icon relative flex h-[1.25rem] w-[1.25rem] items-center justify-center" aria-hidden="true">
        <svg
          className="qx-menu-toggle__arrow h-[1.15rem] w-[1.15rem] stroke-current fill-none transition-transform duration-300 ease-out"
          viewBox="0 0 24 24"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
      <span className="sr-only">Menu</span>
    </>
  );
}

/**
 * `deferred` marks the ONE placement that waits: the homepage's, below the pin.
 * No default parameter object — with `= {}` the props type collapses to
 * `Attributes` for `createElement`, so the unit test could not pass the flag and
 * every misspelt prop at a call site would have type-checked.
 */
export function SiteHeader({ deferred = false }: { deferred?: boolean }) {
  const pathname = usePathname();
  const isGcc = pathname === '/gcc';

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      sessionStorage.removeItem('qx_scrolled_to_problem');
      sessionStorage.removeItem('qx_scrolled_past_hero');
      sessionStorage.removeItem('qx-intro-complete');
      sessionStorage.setItem('qx_hard_refresh', 'true');
      document.documentElement.removeAttribute('data-qx-restore-problem');
      document.documentElement.removeAttribute('data-qx-restoring-scroll');
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
    } catch {}

    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.location.reload();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* THE SENTINEL IS THE HEADER'S POSITION IN FLOW. */}
      {deferred ? <div id="qx-nav-sentinel" aria-hidden="true" /> : null}

      <header
        id="qx-nav"
        className={`qx-header sticky top-0 z-nav w-full bg-qx-black/95 backdrop-blur-md border-b border-white/10 h-[var(--qx-nav-h)] transition-all duration-300${
          deferred ? ' qx-header--deferred' : ''
        }`}
      >
        <div className="mx-auto max-w-[var(--qx-shell)] px-4 sm:px-5 md:px-6 h-full">
          <div className="flex h-full items-center justify-between gap-2 sm:gap-4 transition-all">
            {deferred ? (
              <button
                type="button"
                onClick={handleLogoClick}
                aria-label={`${ORGANISATION.name} home - replay hero`}
                className="text-qx-white transition-opacity hover:opacity-80 cursor-pointer bg-transparent border-none p-0 text-left shrink-0"
              >
                <NavLogo instance="header" className="w-[87px] sm:w-[103px] md:w-[118px]" />
              </button>
            ) : (
              <Link
                href="/"
                onClick={handleLogoClick}
                aria-label={`${ORGANISATION.name} home`}
                className="text-qx-white transition-opacity hover:opacity-80 shrink-0 cursor-pointer"
              >
                <NavLogo instance="header" className="w-[87px] sm:w-[103px] md:w-[118px]" />
              </Link>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Region Switcher: INDIA / GCC - Hidden temporarily until GCC website is launched:
              <div
                id="qx-region-switcher"
                aria-label="Region switcher: India or GCC"
                className="flex h-[2.25rem] sm:h-[2.5rem] items-center rounded-sm border border-qx-line bg-qx-ink/60 p-0.5 font-mono text-[10px] sm:text-2xs font-semibold uppercase tracking-wider text-qx-grey shrink-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') window.location.href = '/';
                  }}
                  aria-label="Switch region to India"
                  className={`flex h-full items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 rounded-[3px] transition-all duration-200 cursor-pointer border-none bg-transparent ${
                    !isGcc
                      ? 'bg-qx-green/20 text-qx-green font-bold shadow-[inset_0_0_8px_rgba(42,189,0,0.3)]'
                      : 'text-qx-grey hover:text-qx-white opacity-70'
                  }`}
                >
                  <img
                    src={!isGcc ? '/india-map.png' : '/india-map-grey.png'}
                    alt=""
                    aria-hidden="true"
                    className="w-[12px] h-[14px] sm:w-[13px] sm:h-[15px] object-contain shrink-0"
                  />
                  <span>IND</span>
                </button>
                <span className="text-qx-line select-none px-1 text-[11px] font-normal">/</span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') window.location.href = '/gcc';
                  }}
                  aria-label="Switch region to GCC"
                  className={`flex h-full items-center justify-center px-2 sm:px-2.5 rounded-[3px] transition-all duration-200 cursor-pointer border-none bg-transparent ${
                    isGcc
                      ? 'bg-qx-green/20 text-[#2ABD00] font-bold shadow-[inset_0_0_8px_rgba(42,189,0,0.3)]'
                      : 'text-qx-grey hover:text-qx-white opacity-70'
                  }`}
                >
                  GCC
                </button>
              </div>
              */}

              {/* WhatsApp ICON ONLY Button - Exact matching height & styling (h-[2.25rem] sm:h-[2.5rem]) */}
              <WhatsAppLink
                ariaLabel={WHATSAPP.label}
                className="group flex h-[2.25rem] w-[2.25rem] sm:h-[2.5rem] sm:w-[2.5rem] items-center justify-center rounded-sm border border-qx-line bg-qx-ink/60 text-qx-green transition-all hover:border-[#2ABD00] hover:text-[#2ABD00] hover:bg-qx-ink-raised cursor-pointer shrink-0"
              >
                <WhatsAppGlyph className="h-[1.15rem] w-[1.15rem] sm:h-[1.25rem] sm:w-[1.25rem] transition-transform duration-200 ease-out group-hover:scale-110 shrink-0" />
              </WhatsAppLink>

              {/* Dropdown Menu Toggle Buttons - Exact matching height & styling */}
              <a
                id="qx-menu-open"
                href="#qx-menu-panel"
                className={`qx-menu-nojs ${TOGGLE_CLASS}`}
              >
                <ToggleFace />
              </a>

              <button
                type="button"
                id="qx-menu-toggle"
                aria-expanded="false"
                aria-controls="qx-menu-panel"
                className={`qx-menu-js ${TOGGLE_CLASS}`}
              >
                <ToggleFace />
              </button>
            </div>
          </div>
        </div>
      </header>

      <SiteMenu />
    </>
  );
}

/**
 * The panel. Server-rendered in full, hidden by the stylesheet until the boot
 * script says otherwise — so the markup a crawler reads is the finished menu and
 * there is no state here to hydrate.
 *
 * ## The pre-layers are the effect
 *
 * Two blank panes that arrive before the sheet does, 70ms apart, in
 * `--qx-ink-raised` and `--qx-line`. They carry no content and are
 * `aria-hidden`; what they buy is the sense that the panel has DEPTH rather than
 * being one rectangle sliding in. They are the one part of the React Bits
 * original that is purely visual and the one part worth keeping verbatim.
 *
 * Two, not the original's four-capped-to-three. This site has one accent and a
 * hairline; four coloured panes is a gradient it does not own.
 *
 * ## `MENU_NAV` — six routes, and the socials
 *
 * The shortlist rather than the footer's thirteen, because these are set at
 * display size and a list that scrolls is not a menu. That argument used to
 * justify eleven; on the client's direction the five PILLARS have now come out
 * of it too, leaving the five company pages and Contact Us.
 *
 * The list is `MENU_NAV`, built in `content/site.ts` by subtracting
 * `SITE_INDEX.pillars` from `PRIMARY_NAV` — see the note there for why it is
 * subtracted rather than retyped, and for where the pillars are still reached
 * from. Contact is in it for the reason `content/site.ts` gives for adding it to
 * the footer at all: it is the site's primary conversion and it is otherwise two
 * clicks deep.
 *
 * The socials block is `SOCIAL`, whose two URLs are INFERRED and flagged in §69
 * as missing assets — see `content/site.ts`. Linking them here does not make
 * them any more confirmed than the footer already does.
 */
function SiteMenu() {
  const items = MENU_NAV;

  return (
    <div
      id="qx-menu-panel"
      className="qx-menu"
      // NO `inert` AND NO `aria-hidden` IN THE SERVED MARKUP, and that is the
      // no-JS path's whole correctness.
      //
      // Both were here for one round, on the reasoning that a closed panel
      // should say so. Nothing without JavaScript ever takes them off — so once
      // the fallback link could open the panel on `:target`, it opened an INERT
      // one: visible, and then Playwright reporting the article behind it
      // intercepting every click, with the whole menu also still marked
      // `aria-hidden` to a screen reader.
      //
      // The closed state does not need them. `visibility: hidden` in
      // `styles/menu.css` already removes the subtree from the tab order, from
      // the accessibility tree and from hit-testing, in every browser and with
      // no script involved. `lib/menu.ts` adds both on load as belt and braces
      // for the scripted path, where it is also the thing that takes them off
      // again.
      //
      // `suppressHydrationWarning` IS THE PRICE OF THAT LAST SENTENCE, and it is
      // the same bargain the current-page mark already makes on every marked
      // anchor. `lib/menu.ts` re-syncs on `DOMContentLoaded`, which beats the
      // client bundle, so React hydrates to find `inert` and `aria-hidden="true"`
      // on a div whose server markup deliberately carried neither — and reports
      // an attribute mismatch on every page load while the page works perfectly.
      //
      // It was NOT needed until the script actually started setting them. The
      // boot script runs from `app/layout.tsx`, before this element is parsed, so
      // its closing `sync(false)` found no panel and silently set nothing; the
      // belt and braces this comment describes were absent for the life of every
      // page. Fixing that made the write real, and a real write pre-hydration is
      // a real mismatch.
      //
      // Scoped to this div and one level deep: its own attributes only, nothing
      // nested, so a genuine mismatch inside the sheet is still reported.
      suppressHydrationWarning
    >
      <div className="qx-menu__layers" aria-hidden="true">
        <span className="qx-menu__layer" />
        <span className="qx-menu__layer" />
      </div>

      <div className="qx-menu__sheet">
        {/* THE NO-JS PATH'S EXIT, AND NOTHING ELSE'S — `qx-menu-nojs`, so the
            stylesheet takes it out of the document wherever the boot script has
            run.

            It was the only way out on a phone for several phases, and the
            measurement that put it here was real: with the panel covering the
            full viewport height, `document.elementFromPoint` over the toggle
            returned the sheet at 390px AND at 1440px — the panel is the whole
            screen on one and a right-hand column sitting exactly under the
            toggle on the other. So the button turned into an X that nothing
            could click, and this drew a second X a few pixels from it.

            `styles/menu.css` now starts the panel at `--qx-nav-h`, below the
            bar. The toggle is uncovered at every width, it already animates
            Menu→Close and +→×, and one control does both jobs — which is what
            this second one was standing in for rather than adding to.

            Without scripting it is still the only exit. `:target` opens the
            panel and only a link can un-target it; the fallback opener's href IS
            the panel's fragment, so it cannot close what it opened. This one
            points at the header's own fragment instead — `#qx-nav` and not `#`,
            which `phase8d-pillars.spec.ts` forbids sitewide: an empty fragment
            is the idiom of a link that does nothing, and this one has a real
            destination. */}
        <a id="qx-menu-close" href="#qx-nav" className="qx-menu-nojs qx-menu__close">
          <span className="qx-menu__close-label">Close</span>
          <span className="qx-menu__close-icon" aria-hidden="true">
            <span className="qx-menu-toggle__bar" />
            <span className="qx-menu-toggle__bar" />
          </span>
        </a>

        {/* `data-qx-nav-mark` opts this list into the current-page mark — see
            `lib/route-mark.ts`, which is the only thing that writes
            `aria-current` here and does the same for the footer's navigation off
            one match. Opt-in rather than every link on the page, because most
            links on this site are not navigation. */}
        <nav aria-label="Menu" className="qx-menu__nav" data-qx-nav-mark>
          <ul className="qx-menu__list">
            {items.map((item, index) => (
              <li
                key={item.href}
                className="qx-menu__item"
                // The stagger's index. `--i` drives `transition-delay` in the
                // stylesheet for the label's rise and for the current-page rule
                // beside it, so both arrive on the row's own beat.
                style={{ '--i': index } as React.CSSProperties}
              >
                <Link
                  href={item.href}
                  prefetch={true}
                  className="qx-menu__link"
                  // One of these carries `aria-current` before React hydrates —
                  // `lib/route-mark.ts` writes it at DOMContentLoaded and the
                  // client bundle arrives after that. Same remedy and same
                  // reason as the footer's copy of this list, and as
                  // `data-qx-motion` in `app/layout.tsx`: it suppresses this
                  // element's own attributes only, so the label inside is still
                  // compared.
                  suppressHydrationWarning
                >
                  <span className="qx-menu__label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="qx-menu__socials">
          <p className="qx-menu__socials-title">Socials</p>
          <ul className="qx-menu__socials-list">
            {SOCIAL.map((social) => (
              <li key={social.href}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="qx-menu__social"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
