import { FinalCta } from '@/components/home/FinalCta';
import { OpenAtTop } from '@/components/home/OpenAtTop';
import { SiteIndex } from '@/components/home/SiteIndex';
import { TrustStrip } from '@/components/home/TrustStrip';
import { WhoWeServe } from '@/components/home/WhoWeServe';
import { WhyQavyx } from '@/components/home/WhyQavyx';
import { HeroMount } from '@/components/hero/HeroMount';
import { HeroStatic } from '@/components/hero/HeroStatic';
import { LaunchStatic } from '@/components/launch/LaunchStatic';
import { RocketFilm } from '@/components/launch/RocketFilm';
import { SiteHeader } from '@/components/nav/SiteHeader';
import { HOME_TOP_BOOT } from '@/lib/home-boot';

/**
 * The page is a server component. It renders the accessible <h1> into the
 * initial HTML directly, then mounts the client hero (dynamically imported,
 * ssr:false) which owns the motion layer. That split is what keeps GSAP + Lenis
 * out of the initial route bundle and under the 165 KB budget.
 *
 * `LaunchStatic` is server-rendered on purpose: it is the growth story as a
 * document, and the launch animation is an enhancement layered over it. That
 * makes it the reduced-motion path, the small-viewport path, the no-JS path and
 * the crawler's view of this section, with no second implementation to keep in
 * sync. Server-rendering the full service copy is Phase 12.
 *
 * ## The order
 *
 *   PIN   the hero: logo → frame expands → carousel → aperture →
 *         "Digital Growth Launchpad" → the rocket launch         1015vh
 *   ---
 *         §4 Trust Strip                                          [TrustStrip]
 *         §5 The Problem · §6 The Solution · §7 Growth Framework  [LaunchStatic]
 *         §9 Why QAVYX · §10 Who We Serve · site index · §11 Final CTA
 *
 * §4 is in normal flow, first thing after the pin releases. The draft puts it
 * "directly below the hero", which inside a 1015vh pin is a beat rather than a
 * position — and neither pin has one left to give. Flow puts it where a reader
 * meets it in the same order the document writes it, in the served HTML, on all
 * four paths at once. See the note on `TrustStrip` for the version this replaced.
 *
 * One pinned section, `#qx-hero` inside `HeroMount`, empty by design: it is a
 * 100svh spacer that exists to give the trigger its scroll distance, and every
 * visual it drives is a `position: fixed` sibling. Phase 8E added the title card
 * to that sequence — between the fly-through and the climb, naming the story the
 * rocket then tells — and changed nothing else about the order.
 *
 * `SiteIndex` is the ONE addition to the document's order, and it is this
 * site's PRIMARY NAVIGATION rather than another content section — there is no
 * navbar. It sits second-to-last on purpose: everything above it is the
 * argument, so the index is where a convinced reader goes next, and the final
 * CTA is for one who would rather just talk to someone.
 *
 * ## `HeroStatic` (Phase 9) — the same deal, one section earlier
 *
 * `HeroStatic` is to the hero what `LaunchStatic` is to the launch: the content
 * as a document, always in the served HTML, with the animation as the
 * enhancement over it. It carries the finished mark, §3.1's positioning line and
 * the five pillars in normal flow, so a `prefers-reduced-motion` visitor, a
 * JS-disabled visitor and a crawler all get one and the same page.
 *
 * It sits BEFORE `HeroMount` so that reading order is the document's order —
 * hero, then the services, then §5's problem. In motion mode it is
 * `display: none` (`app/globals.css`) and occupies no space, so the pinned
 * sequence below is untouched by it.
 */
export default function Home() {
  return (
    <main className="bg-qx-black">
      {/* This route opens at the top, always. It is the only one that does, and
          the only one for which a restored scroll offset is a seek into an
          animation rather than a reading position — see `lib/home-boot.ts`.

          Two halves, because one mechanism cannot cover both arrivals. The
          script runs before first paint and owns the RELOAD; `OpenAtTop` runs on
          mount and owns the client-side navigation, including handing scroll
          restoration back to every other route on the way out. Neither is
          redundant and the note on each says why. */}
      <script dangerouslySetInnerHTML={{ __html: HOME_TOP_BOOT }} />
      <OpenAtTop />

      {/* THE LAUNCH FILM'S ELEMENT, THIS HIGH IN THE DOCUMENT ON PURPOSE.

          It is 700vh of scroll away from the beat that uses it and it is the
          third thing in the page, because what is being started here is a 1.57
          MiB download and the only cost that is under our control is when it
          begins. It used to live inside `HeroSection`, behind
          `next/dynamic(..., { ssr: false })`, so it began after the route bundle
          had loaded and React had hydrated and the lazy motion chunk had landed.
          `lib/rocket-video-boot.ts` has the measurement and the reason a
          `<link rel="preload">` cannot do this instead.

          It costs the layout nothing to sit here: `#qx-rocket-film` is
          `position: fixed` and `aria-hidden`, so it reserves no space, takes no
          focus, and is not in the reading order it appears to precede. It paints
          nothing until the launch segment drives its opacity — see
          `addRocketFramesSegment`, which owns every pixel of it. */}
      <RocketFilm />

      <h1 className="sr-only">Qavyx</h1>

      {/* THE `<noscript>` OVERRIDE THAT WAS HERE IS GONE, AND NOTHING REPLACED
          IT, because the rule it existed to take back no longer fires.

          It was a `<style>` block sending `#qx-hero-static{display:block}` and
          `#qx-hero-reserve{min-height:0}`, and it was correct for the rule as it
          then stood: `globals.css` hid the static hero for anyone whose motion
          preference was `no-preference`, which includes a visitor with scripting
          disabled and ordinary motion settings — for whom the motion layer is
          never coming and the fallback was the whole page.

          That rule is now `html[data-qx-hero='live'] #qx-hero-static`, and the
          attribute is written by `HeroExperience` on its first paint. With no
          scripting nothing ever writes it, so the fallback is simply never
          hidden and there is nothing to take back. The reservation it also
          cancelled has been removed outright; see the note in `globals.css`.

          Left in place this would have been a stylesheet overriding rules that
          no longer match — the state this file's own notes call worse than
          nothing. The no-JS path is unchanged and is now the DEFAULT rather than
          an exception carved back out: "one fallback, not two" holds by
          construction instead of by a second stylesheet. */}
      <HeroStatic />

      {/* THE HERO'S HEIGHT, HELD OPEN BEFORE THE HERO EXISTS.

          `HeroMount` renders nothing on the server, nothing during hydration and
          nothing until its `ssr: false` chunk has arrived — three renders, all
          of them zero pixels tall — while `HeroStatic` above is `display: none`
          for exactly the visitors who are going to get the motion layer. So the
          served page began at §5 The Problem, and a reload painted "The Problem"
          as its first frame before the hero dropped in above it and pushed it
          down a screen. Measured at 0-150ms on every load, not only on a
          restored scroll.

          A wrapper rather than a placeholder INSIDE `HeroMount`, because the gap
          starts before that component's first render, and `next/dynamic`'s own
          `loading` fallback cannot cover a period when the loader has not been
          called yet.

          It collapses on its own. Once `HeroSection` mounts, this holds
          `#qx-hero` — 100svh by `h-svh` — so the content already meets the
          minimum and nothing is double-counted; once ScrollTrigger pins that
          section, the pin-spacer inside is 1015vh and the minimum is irrelevant.
          No effect has to remove it, so there is no frame in which it is wrong. */}
      <div id="qx-hero-reserve">
        <HeroMount />
      </div>

      {/* THE HEADER, AND ITS POSITION IS THE FEATURE.

          The client asked for it to appear after the pin. It does, with no
          JavaScript and no beat to hook: `position: sticky` does not stick until
          the element's normal-flow position reaches the top of the viewport, and
          here that position is on the far side of `#qx-hero-reserve` — 1015vh
          down once ScrollTrigger has spaced the pin. Scroll the hero out and the
          header rises with the content below it and stays there. Listening for
          the pin's own end would have bought the same behaviour, a client
          boundary and a second source of truth about when the hero is over.

          OUTSIDE the reserve, never inside it. The pin puts a transform on its
          spacer, a transform is a containing block for `position: fixed`, and
          the panel this header opens is fixed — the same rule the stage, the ink
          field, the carousel and the WhatsApp button all already follow.

          `deferred` is what stops it SCROLLING UP THROUGH THE SCREEN to get
          there. Document position decides when it arrives; `styles/header.css`
          decides that it arrives at the top edge rather than travelling to it.

          The other fifteen routes get theirs from `app/(site)/layout.tsx`, at
          the top of the page where there is no hero to wait for and no
          `deferred`. */}
      <SiteHeader deferred />

      <LaunchStatic />
      <TrustStrip />
      <WhyQavyx />
      <WhoWeServe />
      <SiteIndex />
      <FinalCta />
    </main>
  );
}
