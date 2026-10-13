/**
 * What travels through the frame — the carousel's panel list.
 *
 * SOURCE: `docs/CONTENT-HANDOFF.md` — §8
 * for the five pillars (via `content/services.ts`), §41–§43 for the sixth panel
 * (via `content/launchpad.ts`). Not one user-facing string is authored here; this
 * file only says which content appears in the slider and in what order.
 *
 * ## Why this is a separate module from `content/services.ts`
 *
 * Because the slider and the pillar set are no longer the same list, and
 * conflating them is what would quietly turn Launchpad into a sixth thing you can
 * buy.
 *
 * The client asked for Launchpad as the frame slider's sixth panel. The obvious
 * implementation — a sixth entry in `SERVICES` — was rejected, because `SERVICES`
 * is load-bearing for four other surfaces that must NOT gain a Launchpad row:
 *
 *   `SITE_INDEX.pillars`   the homepage index, whose `pillars`/`launchpad` split
 *                          `content/site.ts` calls out explicitly: "it is a
 *                          coming-soon product rather than a section of the site"
 *                          (§2 omits it; §63 lists it in the FOOTER nav only).
 *   `ServiceList`          the reduced-motion / no-JS stacked list, which is the
 *                          five pillars and is checked against `PILLAR_PAGES`.
 *   `SERVICE_AREAS`        the twenty-four service areas, covered exactly once
 *                          across the five panels. Launchpad's six §42 features
 *                          are not service areas and must not join that set.
 *   `PILLAR_PAGES`         five pillar pages, one per pillar, at §64's routes.
 *
 * So `SERVICES` stays exactly five pillars and this list is `SERVICES` plus one.
 *
 * ## WHAT THE REDUCED-MOTION PATH GETS, STATED HONESTLY
 *
 * This panel is on the MOTION PATH ONLY. `ServiceTrack` renders it inside
 * `ServicesCarousel`, which `HeroSection` mounts behind `ssr:false`; the
 * reduced-motion, JS-disabled and crawler paths render `HeroStatic` → `ServiceList`
 * → the five pillars, and there is no carousel for a sixth panel to sit in.
 *
 * This note used to claim they lost nothing, because `LaunchpadNote` announced
 * the product under the pin on the static path. THAT COMPONENT HAS SINCE BEEN
 * REMOVED on the client's direction, so the claim is retired rather than left to
 * rot. What is true now:
 *
 *   - Those visitors do NOT get the announcement. Nothing in the homepage body
 *     names Launchpad for them.
 *   - They DO keep the ROUTE. `FOOTER_NAV` carries `/launchpad` and `Footer` is
 *     in the root layout, so it is in the initial HTML of every page for every
 *     visitor. `tests/e2e/phase8c-shell.spec.ts` asserts exactly that, and
 *     asserts the served HTML links it exactly once.
 *   - That is §63 as written: §2 omits Launchpad from the primary navigation and
 *     §63 lists it in the footer only. The homepage-body announcement was the
 *     departure from the document; removing it ended the departure.
 *
 * None of which changes the argument above — it is about which surfaces may gain
 * a Launchpad ROW, and the answer is still none of the four.
 *
 * ## `PANEL_COUNT` lives here now
 *
 * It used to be `SERVICES.length` in `content/services.ts`. Every piece of
 * carousel arithmetic reads it — the pin's `services` segment length, the snap
 * increment, `STEPS`, `trackTravel`, the indicator's `01 / 06` — and all of that
 * is about how many PANELS travel through the frame, which is now a different
 * number from how many pillars there are. Leaving it on the pillar list would
 * have made every one of those call sites silently wrong by one.
 *
 * Imports three leaf content modules and nothing else, so `motion/`'s "content
 * imports nothing" invariant still holds one level up.
 */

import { EARLY_ACCESS, LAUNCHPAD, WHATS_COMING } from '@/content/launchpad';
import { SERVICES, type ServiceCategory } from '@/content/services';
import { SITE_INDEX } from '@/content/site';

/** §42's features as they appear on the slide: the label, and the asterisk. */
export interface LaunchpadFeature {
  label: string;
  /** §42 stars the last item; `note` is its footnote. */
  footnoted: boolean;
}

export interface LaunchpadPanelContent {
  slug: string;
  /** §41's own status, printed on the counter row beside `06 / 06`. */
  status: string;
  /** §63's nav label for the product — see the note on `LAUNCHPAD_PANEL`. */
  title: string;
  /** One of §41's description lines, verbatim — see the note on it below. */
  description: string;
  /** §42's six. */
  features: readonly LaunchpadFeature[];
  /** §42's footnote for the starred one. */
  note: string;
  /** §43's Early Access CTA, pointed at §64's route for the page. */
  cta: { href: string; label: string };
}

/**
 * The sixth panel.
 *
 * THE DESCRIPTION IS ONE OF THE CLIENT'S LINES, NOT A SENTENCE BUILT FROM TWO.
 * §41's description is four paragraphs and a slide has room for one line, so the
 * temptation is to join "Have a startup idea?" to the line below it. This file
 * does not compose new sentences out of client copy, so it prints the second line
 * alone: it is a complete sentence, it names the product, and it is 47 characters
 * against the 100 the panel body is authored to.
 *
 * THE CTA IS §43'S OWN, NOT THE PILLARS' SHARED `Explore`. §65 asks that CTA
 * wording not change *unnecessarily* between sections, and the five pillars share
 * one label precisely for that reason — but they also share one KIND of
 * destination, a pillar page. This panel's destination is a waitlist, "Join the
 * Waitlist" is §43's own CTA for that destination and one of §65's six
 * secondaries, and a sixth "Explore" would be the panel claiming to be a pillar.
 *
 * THE TITLE IS THE SHORT `Launchpad`, NOT THE PRODUCT'S FULL NAME, on the
 * client's direction — twice now, and for the same reason both times.
 *
 * It was a choice between two of the client's own strings: §41 headed the
 * section "QAVYX Launchpad" while §63 listed it in the footer nav as
 * "Launchpad". The full name has since become "Digital Growth Launchpad" — the
 * client's answer to the collision documented in `content/launchpad.ts` — which
 * makes the short label MORE right, not less: at three words it would be the
 * longest string on the strip by a wide margin, and `LaunchpadPanel` has the
 * measurement showing "QAVYX Launchpad", already the shorter of the two, wrapping
 * at 780px.
 *
 * It is `SITE_INDEX.launchpad.label`, so the slide says exactly what the global
 * footer says — one fewer name for one product on one journey.
 *
 * THE FULL NAME SURVIVES WHERE THE PRODUCT IS THE SUBJECT: the `<title>` and the
 * <h1> eyebrow of `/launchpad`, which is where this CTA goes. It also reaches
 * this panel's body copy, because `description` below is §41's second paragraph
 * by reference rather than by retyping — so the rename arrived here on its own,
 * which is exactly why it is a reference.
 *
 * The href and status come from `SITE_INDEX.launchpad` rather than being retyped,
 * so the slide and the footer can never disagree about where the product lives.
 * That shared key is also why `SITE_INDEX.launchpad` is not dead config now that
 * `LaunchpadNote` is gone: this file is its only production consumer.
 */
export const LAUNCHPAD_PANEL: LaunchpadPanelContent = {
  slug: 'launchpad',
  status: SITE_INDEX.launchpad.status,
  title: SITE_INDEX.launchpad.label,
  description: LAUNCHPAD.description[1]!,
  features: WHATS_COMING.items.map((item) => ({ ...item })),
  note: WHATS_COMING.note,
  cta: { href: SITE_INDEX.launchpad.href, label: EARLY_ACCESS.cta },
};

/**
 * One panel of the slider. A discriminated union rather than a widened
 * `ServiceCategory`, because the two panels genuinely differ: a pillar has a
 * shared CTA label, a chip list drawn from `SERVICE_AREAS` and a diagram keyed on
 * its slug; Launchpad has its own CTA, a footnoted feature list and a status.
 * Widening `ServiceCategory` with four optional fields would put `service.status
 * ?? ...` branches inside `ServicePanel`, which is the one component the static
 * path also renders.
 */
export type CarouselPanel =
  | { kind: 'pillar'; slug: string; service: ServiceCategory }
  | { kind: 'launchpad'; slug: string; launchpad: LaunchpadPanelContent };

/** The five pillars in §8's order, then Launchpad. */
export const CAROUSEL_PANELS: readonly CarouselPanel[] = [
  ...SERVICES.map((service): CarouselPanel => ({
    kind: 'pillar',
    slug: service.slug,
    service,
  })),
  { kind: 'launchpad', slug: LAUNCHPAD_PANEL.slug, launchpad: LAUNCHPAD_PANEL },
];

/**
 * Panel count — the carousel's step maths derives from this, never a literal.
 *
 * Six panels is five steps at 75vh, so the `services` segment is 375vh and the
 * pin is 1015vh. The step LENGTH is deliberately untouched: it was tuned down
 * from 90vh once already to buy the aperture its 120vh, and re-tuning it to hold
 * the pin at 940 would have made all five existing transitions 20% faster to pay
 * for a panel that was added after them.
 */
export const PANEL_COUNT = CAROUSEL_PANELS.length;
