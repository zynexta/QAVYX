import type { Metadata, Viewport } from 'next';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { Footer } from '@/components/nav/Footer';
import { WhatsAppButton } from '@/components/nav/WhatsAppButton';
import { HOME_COPY } from '@/content/home';
import { fontVariables } from '@/lib/fonts';
import { MENU_BOOT } from '@/lib/menu';
import { NAV_REVEAL_BOOT } from '@/lib/nav-reveal';
import { REVEAL_BOOT } from '@/lib/reveal';
import { ROUTE_MARK_BOOT } from '@/lib/route-mark';
import { SITE_URL } from '@/lib/seo';
import '@/styles/tokens.css';
import './globals.css';
// AFTER globals.css, and that order is load-bearing. Tailwind 3's `@layer`
// directives are its own build-time construct, not native cascade layers: they
// resolve to plain rules emitted where `@tailwind utilities` sits inside
// globals.css. So the only thing separating a single-class rule here from a
// Tailwind utility of the same specificity is source order, and these have to
// come second. Imported first, `.qx-frame--card`'s radius would lose to any
// `rounded-*` on the same element.
import '@/styles/frame.css';
import '@/styles/motion.css';
import '@/styles/marquee.css';
// The menu panel. After `motion.css` because both write `transition-delay` from
// an inline `--i` and this one must win on the panel's own items.
import '@/styles/menu.css';
// The homepage header's arrival. After `menu.css` because both position the
// same element and this one has the last word on the homepage.
import '@/styles/header.css';
// The green sweep across the hero's title card. Beside `flame.css` for the same
// reason: its keyframes must be parsed before `HeroMount`'s lazy chunk adds the
// class that starts them.
import '@/styles/title-shine.css';
// The rocket's exhaust. Here rather than beside the layer because every
// stylesheet on this site lives in `styles/`, and because its keyframes have to
// be parsed before `HeroMount`'s lazy chunk inserts the element that uses them.
import '@/styles/flame.css';
// The scrubbed launch film's fixed layer. Beside `flame.css` for the same
// reason: it belongs to the hero's motion layer, and it needs a media query
// (the reduced-motion backstop) that an inline style object cannot express.
import '@/styles/rocket-film.css';
// The process line down /growth-marketing's five numbered sections. Here rather
// than beside `frame.css` because it draws INSIDE the card that file draws: its
// node is filled with `--qx-ink-raised` to punch the line out from behind
// itself, which is only the right colour while `.qx-frame--card` is filled with
// it.
import '@/styles/pillar-spine.css';
// LAST, and the order matters within this group too: it overrides the panel's
// own `md:grid-cols-*` utility, which is a media-query rule of identical
// specificity. Only source order separates them.
import '@/styles/short-viewport.css';

/**
 * The site-wide metadata defaults, and the homepage's own.
 *
 * **This was wrong until Phase 8D.** It read "Qavyx — Software and product
 * engineering" / "Software and product engineering for teams that ship." — TDD
 * §3.9-era copy from when the brief described a software consultancy. QAVYX is a
 * digital marketing and AI automation agency, and that title was the one the
 * homepage actually shipped with. Both strings now come from the client's
 * document: the title is its own cover heading, and the description is §8's
 * supporting copy, already in `content/home.ts` as the site index's lead.
 *
 * `metadataBase` is what turns the relative `openGraph.url` and `canonical`
 * values in `lib/seo.ts` into absolute URLs. Without it Next drops `og:url` and
 * warns at build time, so it is load-bearing for every inner route's share card
 * rather than a nicety.
 *
 * `title.template` supplies the ` — QAVYX` half of every child route's title, so
 * a page sets `title: 'Growth Marketing'` and gets `Growth Marketing — QAVYX`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'QAVYX — Digital Growth Launchpad',
    template: '%s — QAVYX',
  },
  description: HOME_COPY.indexLead,
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
};

/**
 * THERE IS STILL NO NAVBAR, and there is now a header — which is not the
 * contradiction it reads as. The draft listed a navbar, an earlier cut built
 * one, and the client had it removed; what came back on their later direction is
 * a bar of three CONTROLS with no navigation links in it: the mark, WhatsApp,
 * and a button that opens `components/nav/SiteHeader.tsx`'s menu. Navigation is
 * still a section of the homepage (`components/home/SiteIndex.tsx`) and still
 * the full eleven routes in the footer, which is why the footer carries all of
 * them rather than a shortlist.
 *
 * THE HEADER IS NOT RENDERED HERE, and that is deliberate. It sits at the top of
 * the fifteen inner routes (`app/(site)/layout.tsx`) and AFTER the pinned hero
 * on the homepage (`app/page.tsx`) — the client asked for it to appear once the
 * pin is over, and its document position is the whole of how that works. A copy
 * in this file would have to be one place or the other.
 *
 * The two global elements that ARE unconditional are rendered here, as siblings
 * of `{children}`. For the WhatsApp button that placement is load-bearing, not
 * tidiness: the homepage pins a ScrollTrigger, a pin wraps its section in a
 * transformed element, and a transform establishes a containing block for
 * `position: fixed` — so anything fixed that ends up INSIDE the pinned subtree
 * scrolls away with it. It is the same rule the hero already follows for the
 * stage, the ink field and the carousel.
 *
 * Both are server components with no client JavaScript, so they cost the
 * initial-route budget nothing but their HTML.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `suppressHydrationWarning` for ONE attribute: `data-qx-motion`, which the
    // script below writes before React hydrates. It suppresses this element's
    // own attributes and text, nothing inside it — see the note on `reveal` in
    // `lib/reveal.ts`, which does the same for the reveal triggers.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        {/* The reveal layer's decision, taken before the first `[data-reveal]`
            element below it has even been parsed. It must stay the FIRST child
            of <body> — see the long note in `lib/reveal.ts` for why the position
            is the design and not a detail. */}
        <script dangerouslySetInnerHTML={{ __html: REVEAL_BOOT }} />
        {/* The menu's open/closed state — see `lib/menu.ts`. Unlike the reveal
            boot above it has no first-paint deadline to meet, but it lives in
            the same place for the same reason: its listeners are delegated to
            `document`, so one script covers every route and survives every
            client-side navigation, where a component would be re-mounted per
            page. It renders no markup; the header and the panel are ordinary
            server components. */}
        <script dangerouslySetInnerHTML={{ __html: MENU_BOOT }} />
        {/* And when the homepage's header is allowed to appear — see
            `lib/nav-reveal.ts`. Beside the other two because it is the same
            kind of thing: a document-level listener that outlives every
            client-side navigation, rendering no markup of its own. */}
        <script dangerouslySetInnerHTML={{ __html: NAV_REVEAL_BOOT }} />
        {/* Which page you are on, in the footer's navigation and in the menu —
            see `lib/route-mark.ts`. The fourth of the same kind: a delegated,
            markup-free script that outlives client-side navigation, and the one
            place on this site that KNOWS about client-side navigation, because
            neither layout rendering those two lists is told the route below it. */}
        <script dangerouslySetInnerHTML={{ __html: ROUTE_MARK_BOOT }} />
        {/* The site's smooth scroll, and it is ABOVE `{children}` for the same
            reason the four scripts are: everything inside `{children}` is
            re-mounted on every client-side navigation, and rebuilding the scroll
            runtime per route would throw away a mid-flight `lerp` in front of
            the visitor. It renders no markup and is gated on the motion
            preference — see `components/motion/SmoothScroll.tsx`. */}
        <SmoothScroll />
        {children}
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
