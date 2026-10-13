import { describe, expect, it } from 'vitest';
import { CAROUSEL_PANELS, LAUNCHPAD_PANEL, PANEL_COUNT } from '../../content/carousel';
import { EARLY_ACCESS, LAUNCHPAD, WHATS_COMING } from '../../content/launchpad';
import { PILLAR_COUNT, SERVICE_AREAS, SERVICES } from '../../content/services';
import { PILLAR_PAGES } from '../../content/pillars';
import { FOOTER_NAV, SITE_INDEX } from '../../content/site';
import { SERVICE_GLYPHS } from '../../components/icons';
import { SERVICE_VISUALS } from '../../components/services/visuals';

/**
 * The slider's panel list, and the seam between it and the pillar set.
 *
 * The client asked for QAVYX Launchpad as the frame slider's sixth panel. The
 * cheap way to do that was a sixth entry in `SERVICES`, and this file exists
 * because that would have been wrong in four places at once — `SITE_INDEX`, the
 * pillar pages, the stacked reduced-motion list and the twenty-four service
 * areas — none of which would have failed loudly. So the two lists are separate
 * and these are the assertions that keep them that way.
 */

describe('the carousel panel list', () => {
  it('is the five pillars, in order, and then Launchpad', () => {
    expect(PANEL_COUNT).toBe(6);
    expect(CAROUSEL_PANELS).toHaveLength(PILLAR_COUNT + 1);

    const pillars = CAROUSEL_PANELS.slice(0, PILLAR_COUNT);
    expect(pillars.map((p) => p.slug)).toEqual(SERVICES.map((s) => s.slug));
    for (const panel of pillars) expect(panel.kind).toBe('pillar');

    const last = CAROUSEL_PANELS[CAROUSEL_PANELS.length - 1]!;
    expect(last.kind).toBe('launchpad');
    expect(last.slug).toBe('launchpad');
  });

  it('gives every panel a unique slug', () => {
    expect(new Set(CAROUSEL_PANELS.map((p) => p.slug)).size).toBe(PANEL_COUNT);
  });

  /**
   * The whole point of the split, asserted from the other side.
   *
   * Each of these four is a surface a `SERVICES` entry would have reached, and
   * each is one `content/site.ts` or `content/pillars.ts` deliberately keeps
   * Launchpad out of: "§2 omits it and §63 lists it in the FOOTER nav only — it
   * is a coming-soon product rather than a section of the site."
   */
  it('does not leak Launchpad into anything that means "pillar"', () => {
    expect(SERVICES.map((s) => s.slug)).not.toContain('launchpad');
    expect(SITE_INDEX.pillars.map((p) => p.href)).not.toContain('/launchpad');
    expect(PILLAR_PAGES.map((p) => p.slug)).not.toContain('launchpad');
    // Its six §42 features are not service areas and must never join the 24.
    for (const feature of LAUNCHPAD_PANEL.features) {
      expect(SERVICE_AREAS).not.toContain(feature.label);
    }
    // Nor a pillar page's mark on a surface that has no page to put it on.
    expect(SERVICE_VISUALS['launchpad']).toBeUndefined();
    expect(SERVICE_GLYPHS['launchpad']).toBeUndefined();
  });

  /**
   * The reduced-motion visitor keeps the ROUTE, not the announcement.
   *
   * THIS TEST USED TO CLAIM BOTH, and it was true when it was written: the sixth
   * panel is carousel-only, and `LaunchpadNote` announced the product under the
   * pin on the static path. That component has since been removed on the client's
   * direction, so the guarantee has shrunk and this says so rather than passing
   * on a sentence that stopped being true.
   *
   * What survives is `FOOTER_NAV`, which carries `/launchpad` and is rendered by
   * `Footer` from the root layout — so it is in the initial HTML of every page
   * for every visitor, motion or not. That is also §63 as written: §2 omits
   * Launchpad from the primary navigation and §63 lists it in the footer only.
   *
   * Asserted here rather than left to the e2e suite because this is the file that
   * makes the carousel-only decision, and the footer entry is the thing that
   * decision now leans on. Delete that entry and the product is reachable from
   * nowhere at all on the static path — `tests/e2e/phase8c-shell.spec.ts` catches
   * it in the rendered page, and this catches it in the content table.
   */
  it('leaves /launchpad routed from the footer on every path', () => {
    expect(SITE_INDEX.launchpad.href).toBe('/launchpad');
    expect(SITE_INDEX.launchpad.status.length).toBeGreaterThan(0);
    expect(FOOTER_NAV.map((item) => item.href)).toContain(SITE_INDEX.launchpad.href);
    // And still NOT in the homepage index — the split this file exists to keep.
    expect(SITE_INDEX.pillars.map((p) => p.href)).not.toContain('/launchpad');
    expect(SITE_INDEX.pages.map((p) => p.href)).not.toContain('/launchpad');
  });
});

describe('the Launchpad panel', () => {
  it('prints the client’s own strings, not composed ones', () => {
    // §63's footer-nav label, which is what the global footer prints — NOT §41's
    // "QAVYX Launchpad". Both are the client's; this is the one they chose for
    // the slide, and holding it to `SITE_INDEX` is what stops the product wearing
    // two names on one journey.
    expect(LAUNCHPAD_PANEL.title).toBe(SITE_INDEX.launchpad.label);
    expect(LAUNCHPAD_PANEL.title).not.toContain('QAVYX');
    expect(LAUNCHPAD.productName).toContain(LAUNCHPAD_PANEL.title);
    expect(LAUNCHPAD_PANEL.status).toBe(LAUNCHPAD.status);
    expect(LAUNCHPAD_PANEL.note).toBe(WHATS_COMING.note);
    expect(LAUNCHPAD_PANEL.cta.label).toBe(EARLY_ACCESS.cta);
    // The description is ONE of §41's four lines, verbatim — never two of them
    // joined into a sentence the client did not write.
    expect(LAUNCHPAD.description).toContain(LAUNCHPAD_PANEL.description);
  });

  it('carries §42’s six features, in the document’s order', () => {
    expect(LAUNCHPAD_PANEL.features.map((f) => f.label)).toEqual(
      WHATS_COMING.items.map((i) => i.label),
    );
    expect(LAUNCHPAD_PANEL.features).toHaveLength(6);
  });

  /**
   * The asterisk and its note travel together or neither is printed.
   *
   * `content/launchpad.ts` is explicit that "Investor & Seed Funding
   * Opportunities*" with a dangling asterisk and no note is a typo, and that the
   * note is a material qualification on the most attractive item in the list.
   * The panel renders both; this is what stops one of them being dropped for
   * space.
   */
  it('keeps the footnote with the item it qualifies', () => {
    const footnoted = LAUNCHPAD_PANEL.features.filter((f) => f.footnoted);
    expect(footnoted).toHaveLength(1);
    expect(footnoted[0]!.label).toContain('Funding');
    expect(LAUNCHPAD_PANEL.note.length).toBeGreaterThan(0);
    // And the asterisk is never baked into the string — it is rendered from the
    // flag, so a label can never carry one without the note being there too.
    for (const f of LAUNCHPAD_PANEL.features) expect(f.label).not.toContain('*');
  });

  it('goes where the rest of the site sends people for Launchpad', () => {
    expect(LAUNCHPAD_PANEL.cta.href).toBe(SITE_INDEX.launchpad.href);
    expect(LAUNCHPAD_PANEL.status).toBe(SITE_INDEX.launchpad.status);
  });

  /**
   * §65 asks that CTA wording not change unnecessarily between sections, and the
   * five pillars share one label for exactly that reason. This one differs
   * NECESSARILY: the destination is a waitlist rather than a pillar page, "Join
   * the Waitlist" is §43's own CTA for it, and a sixth "Explore" would be the
   * panel claiming to be a pillar.
   */
  it('uses §43’s CTA rather than a sixth "Explore"', () => {
    const pillarLabels = new Set(SERVICES.map((s) => s.cta.href));
    expect(pillarLabels.has(LAUNCHPAD_PANEL.cta.href)).toBe(false);
    expect(LAUNCHPAD_PANEL.cta.label).toBe('Join the Waitlist');
  });

  it('keeps the panel body inside the authored measure', () => {
    // Same 100-character cap the pillar bodies are held to: much past it and the
    // description wraps into the diagram's column at tablet width.
    expect(LAUNCHPAD_PANEL.description.length).toBeLessThanOrEqual(100);
  });
});
