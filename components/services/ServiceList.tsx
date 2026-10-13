import { HOME_COPY } from '@/content/home';
import { SERVICES } from '@/content/services';
import { ServicePanel } from './ServicePanel';

/**
 * The five pillars as a vertical list in normal document flow — Engine 3's
 * content without Engine 3.
 *
 * A SERVER component, and that is the point of it rather than an optimisation.
 * `ServicesCarousel` cannot be given a "vertical list mode" (which is what
 * BUILD-PLAN Phase 9's file list asks for) because it is `'use client'` and its
 * `frame` / `strokeWidth` props come from `computeFrameGeometry(vw, vh)` — real
 * viewport pixels, measured in an effect. Putting the static list behind that
 * boundary would mean it is absent from the served HTML, and the phase's
 * headline criterion is that the JS-disabled DOM equals the reduced-motion DOM.
 * A client-rendered fallback cannot satisfy it at all.
 *
 * So the split is by RENDER MODEL, not by mode flag, and the single source of
 * truth sits one level down where it matters: both this and the carousel render
 * the same `ServicePanel` from the same `SERVICES`. There is no second copy of a
 * title, a description, one of the seventeen service areas, or a CTA href.
 *
 * NO `#qx-track` OR `#qx-track-viewport` HERE, deliberately. `gatherRefs()` in
 * `useHeroTimeline` resolves both by `getElementById`, and this list renders
 * BEFORE `HeroMount` in the document — so a duplicate id would hand the motion
 * layer this element instead of the carousel's, silently, on the path where
 * everything still appears to work.
 *
 * ## Phase 10 built a third presentation here and then removed it
 *
 * BUILD-PLAN Phase 10 asks for a native `scroll-snap` rail below 768px — five
 * cards side by side, swiped. It was built (`styles/rail.css`, now deleted) and
 * reverted with the rest of the small-viewport branch on the client's
 * direction: a phone gets the pinned carousel, so the rail had no visitor left.
 * Its only remaining audience would have been a phone under
 * `prefers-reduced-motion`, and that is precisely the visitor the plan says
 * keeps the vertical list.
 *
 * So this stays what it was — one list, in flow, for the one path that has no
 * carousel. See `components/hero/HeroMount.tsx` for the full reasoning.
 */
export function ServiceList() {
  return (
    // Named like the carousel's own wrapper (`ServicesCarousel`), because the
    // two are one section as far as a screen reader is concerned: whichever is
    // on the page, it is "Services".
    //
    // The gap replaces the `border-t border-qx-line` each panel used to carry:
    // the panels are card frames now, and stacked frames need space between them
    // rather than a shared edge.
    //
    // NO `data-reveal`, and the reason is an invariant worth stating. This list
    // renders only inside `HeroStatic`, which `app/globals.css` hides under
    // `(prefers-reduced-motion: no-preference)` — and that is exactly the
    // condition under which `lib/reveal.ts` sets `data-qx-motion`. The two are
    // complementary: whenever the reveal layer is armed, this subtree is
    // `display: none`, and whenever this subtree is visible the reveal layer has
    // declined. A reveal here could not fire, so it is not written.
    //
    // PHASE 10 BRIEFLY BROKE THIS AND PUT IT BACK. Adding a size clause to the
    // hide rule would have left a phone with `data-qx-motion` set AND this
    // subtree visible — the reveal layer armed over content it can see, for the
    // first time. The clause was reverted, so the invariant holds exactly as
    // written above; anything that narrows that media query breaks it again.
    <section aria-label="Services" className="flex flex-col gap-4">
      {/* §8's own name for these five pillars — `content/services.ts` names §8 as
          their source — set in the page's standard section label.
          `WhyQavyx`'s six cards, `WhoWeServe`'s chips, `SiteIndex`'s rows and
          `LaunchStatic`'s three growth stages are every one of them introduced
          by this exact class list. These five were the only list on the homepage
          that arrived unnamed, opening on `01` — an ordinal for a set nothing
          had named. On the motion path the carousel is framed before it is read:
          the aperture opens a workspace, the panels travel through one
          container, and the `01 / 05` read head names the set and its size.
          Losing all of that and replacing none of it is what left this list
          reading as a third, unrelated block.

          A <p>, not a heading, and NOT a second landmark. `LaunchStatic`'s
          `LAUNCH_THESIS` is the precedent for the first: the five pillar titles
          are already <h2> and `ServicePanel` is shared with the carousel, so a
          sibling <h2> above them would label nothing in the outline and demoting
          them would rewrite the carousel's. `aria-label="Services"` stays for
          the second — see `SiteIndex`, which refuses two landmarks with one
          name. This is a caption on the list, not a region around it.

          THE STRING NOW APPEARS TWICE on this path, here and on `SiteIndex`'s
          heading. That is §8's heading sitting on the NAVIGATION rather than on
          §8's own content, and this is the half of it that is in the right
          place. Resolving the other half is a `SiteIndex` change — its heading
          is both reveal trigger and reveal item, and `#qx-index-heading` is its
          own `aria-labelledby` target — and it needs a name for the index that
          only the client can supply. Flagged, not done. */}
      <p className="font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey">
        {HOME_COPY.indexHeading}
      </p>

      {SERVICES.map((service, i) => (
        <ServicePanel
          key={service.slug}
          service={service}
          index={i}
          total={SERVICES.length}
          variant="stacked"
        />
      ))}
    </section>
  );
}
