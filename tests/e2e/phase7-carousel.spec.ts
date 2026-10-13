import { test, expect, type Page } from '@playwright/test';
import { ready, scrubTo } from './helpers/scrub';
import { progressForIndex, STEPS } from '../../motion/timelines/carouselTimeline';
import { P } from '../../motion/timelines/expandTimeline';
import { SERVICE_AREAS, SERVICES } from '../../content/services';
import { LAUNCHPAD_PANEL, PANEL_COUNT } from '../../content/carousel';
import { sectionAnchor } from '../../content/pillars';
/**
 * Phase 7 acceptance: the services as a horizontal carousel driven by vertical
 * scroll, snapped, with an indicator that agrees with the screen.
 *
 * SIX PANELS SINCE THE LAUNCHPAD SLIDE — five pillars and the product. Every
 * count here derives from `PANEL_COUNT` / `STEPS` rather than being typed, for
 * the same reason the progress targets do: a literal `5` does not fail when a
 * panel is added, it quietly stops covering the last one.
 *
 * Viewport is 1440x900. Panels are the frame's INNER width: 70vw − 2×stroke
 * ≈ 1008 − 25.9 ≈ 982px.
 *
 * Panel targets come from `progressForIndex`, never from typed decimals. The
 * literals this spec used to carry ([0.17, 0.35, 0.53, 0.71, 0.87]) silently
 * stopped addressing the panels they were named for the moment the carousel's
 * step changed length — 0.71 started resolving to panel 5, and the failure read
 * as an indicator regression rather than as a stale test.
 *
 * As everywhere in this suite: drive the input, poll the DOM. `settle` waits for
 * the scrubbed track to stop moving so scrub:1's lag is the thing under test
 * rather than a source of flake.
 */

/**
 * Pin progress at which panel `i` is centred, nudged off the segment's outer
 * edges. Panel 0 sits exactly on CAROUSEL_START and panel 4 exactly on
 * CAROUSEL_END, where the strip is mid-reveal on one side and mid-clear on the
 * other; a few thousandths inward reads the settled state on both.
 */
const EDGE = 0.005;
const atPanel = (i: number) => progressForIndex(i) + (i === 0 ? EDGE : i === STEPS ? -EDGE : 0);

/** Every panel index, derived — never a typed `[0, 1, 2, 3, 4]`. */
const PANELS = Array.from({ length: PANEL_COUNT }, (_, i) => i);
const pad = (n: number) => String(n).padStart(2, '0');
/** The indicator's read head at panel `i`, e.g. `03 / 06`. */
const counterAt = (i: number) => `${pad(i + 1)} / ${pad(PANEL_COUNT)}`;

/** Exactly between two snap points — where the snap has the most work to do. */
const betweenPanels = (i: number) => (progressForIndex(i) + progressForIndex(i + 1)) / 2;

const trackX = (page: Page) =>
  page.evaluate(() => {
    const t = document.getElementById('qx-track');
    return t ? new DOMMatrixReadOnly(getComputedStyle(t).transform).m41 : 0;
  });

const progress = async (page: Page) =>
  Number((await page.locator('#qx-hero-root').getAttribute('data-progress')) ?? 0);

/** Poll until `read` stops changing (two samples within `tol`). */
async function settleOn(page: Page, read: () => Promise<number>, tol = 0.5) {
  let last = Number.NaN;
  await expect
    .poll(
      async () => {
        const v = await read();
        const stable = Math.abs(v - last) < tol;
        last = v;
        return stable;
      },
      { timeout: 12_000, intervals: [150] },
    )
    .toBe(true);
}

/**
 * Settle on the track. NOTE this is useless during the frame expansion — the
 * track does not move there, so it reports "stable" immediately while the frame
 * is still growing. Use settleOn(frameWidth) for anything before p 0.16.
 */
const settle = (page: Page) => settleOn(page, () => trackX(page));

const frameWidth = async (page: Page) =>
  (await page.locator('#qx-frame').boundingBox())?.width ?? 0;

/**
 * textContent, not innerText: the whole carousel sits inside a container GSAP
 * hides with `visibility: hidden` before p 0.14, and innerText returns "" for
 * anything not rendered — which reads as a broken indicator rather than a
 * hidden one.
 */
const indicator = async (page: Page) =>
  ((await page.locator('.qx-indicator p').textContent()) ?? '').replace(/\s+/g, ' ').trim();

test.describe('engine 3: services carousel', () => {
  test('renders every panel with copy, CTA and visual', async ({ page }) => {
    await ready(page);
    const panels = page.locator('.qx-panel');
    await expect(panels).toHaveCount(PANEL_COUNT);

    // Scroll the carousel into view before asking for roles: until p 0.14 the
    // whole strip is `visibility: hidden`, so its headings are correctly absent
    // from the accessibility tree and a role query finds nothing.
    await scrubTo(page, atPanel(0));

    // Derived from the content, never typed here. The titles were a literal
    // list until the draft replaced the live site as the source and pillar four
    // stopped being "Build & Web3" — at which point a hard-coded list is just a
    // second place the content lives.
    // `exact: true` ON EVERY HEADING QUERY HERE, and it is not stylistic.
    // Playwright's `name` matches a SUBSTRING by default, and this carousel
    // contains both the "Launch" pillar and the "Launchpad" panel — so the
    // fifth pillar's own title resolved to two <h2>s and failed strict mode.
    // The panels are both correct and both stay; it is the locator that could
    // not tell them apart. Any title that is a prefix of another reintroduces
    // this the moment the client adds one.
    for (const service of SERVICES) {
      await expect(
        page.getByRole('heading', { name: service.title, exact: true, level: 2 }),
      ).toBeAttached();
    }
    // The sixth panel is Launchpad, which is not a pillar and so has no <h2> in
    // `SERVICES` to find above. Its heading and its §43 CTA are checked by name.
    await expect(
      page.getByRole('heading', { name: LAUNCHPAD_PANEL.title, exact: true, level: 2 }),
    ).toBeAttached();
    await expect(page.getByRole('link', { name: LAUNCHPAD_PANEL.cta.label })).toBeAttached();

    // Every panel carries a CTA, and every one of the draft's service areas is
    // in the DOM — the whole reason five panels can stand in for all of them.
    // The chips are the twenty-four PLUS §42's six features on the Launchpad
    // panel; both halves are derived, so neither can drift into a literal.
    await expect(page.locator('.qx-panel-cta')).toHaveCount(PANEL_COUNT);
    await expect(page.locator('.qx-panel li')).toHaveCount(
      SERVICE_AREAS.length + LAUNCHPAD_PANEL.features.length,
    );
    // All of them are present from first paint (accessibility + Phase 12 SSR),
    // not mounted as they scroll into view.
    await expect(page.locator('.qx-panel svg')).toHaveCount(PANEL_COUNT);
  });

  /**
   * THE INDICATOR IS A CONTROL NOW, not only a read head — the client asked for
   * it: "looks like a button but can't click".
   *
   * Driven exactly like every other test here: real input, then poll the DOM.
   * The click has to move the PAGE, because the carousel is a segment of a
   * scrubbed pin rather than a slider with its own transform — so the assertion
   * that matters is that `data-progress` lands on the panel's own snap point,
   * not merely that the strip lit a different segment.
   *
   * Targets come from `progressForIndex`, never typed, for the reason this
   * file's header gives.
   */
  test('clicking a segment scrolls the page to that panel', async ({ page }) => {
    await ready(page);
    await scrubTo(page, atPanel(0));
    expect(await indicator(page)).toContain(counterAt(0));

    // Forwards across several panels, then BACKWARDS — a pagination control that
    // only works in the scroll direction you are already travelling is the
    // failure mode worth catching, and the snap is the thing most likely to
    // cause it.
    for (const target of [3, 1, STEPS, 2]) {
      await page.locator('.qx-indicator-seg').nth(target).click();
      await expect
        .poll(() => indicator(page), { timeout: 15_000 })
        .toContain(counterAt(target));
      await settle(page);
      // It landed on the panel's own snap point, not just nearby.
      expect(await progress(page)).toBeCloseTo(progressForIndex(target), 2);
      // ...and the lit segment agrees with the counter.
      const lit = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.qx-indicator-seg')).findIndex(
          (el) => el.getAttribute('data-active') === 'true',
        ),
      );
      expect(lit).toBe(target);
    }
  });

  /**
   * THE CHIPS ARE LINKS NOW, and the journey they make is the point: a visitor
   * reads a sub-service on a panel, taps it, and arrives AT that section of the
   * pillar page rather than at the top of a page that mentions it somewhere.
   *
   * Driven through the carousel rather than the static list on purpose. This is
   * the path where the link can silently not work: the chips sit inside
   * `#qx-track-viewport`, which is `pointer-events: none` so wheel gestures reach
   * window, and every control in there has to opt back in. A chip that renders as
   * an <a> but never receives a click looks identical in the DOM.
   *
   * The destination is derived — `sectionAnchor` from the chip's own name — for
   * the same reason every target in this file is derived: a typed `#crm-...`
   * stops addressing the section it was named for the moment the client rewords
   * one, and the failure reads as a broken link rather than a stale test.
   */
  test('a chip opens its own section of the pillar page', async ({ page }) => {
    await ready(page);
    // Scrub the carousel on screen BEFORE reaching for the pagination. The
    // indicator lives inside the strip, which is `visibility: hidden` until
    // p 0.14, and a hidden button is one Playwright waits on until the test
    // times out rather than one it reports as missing — 90s of "element is not
    // visible" that reads as a broken control and is not one. Every sibling
    // test that touches a segment does this first; only this one did not.
    await scrubTo(page, atPanel(0));
    // Panel 4, Build & Scale — reached with the pagination, which also exercises
    // the two features together.
    await page.locator('.qx-indicator-seg').nth(3).click();
    await expect.poll(() => indicator(page), { timeout: 15_000 }).toContain(counterAt(3));

    const pillar = SERVICES[3]!;
    const area = pillar.services[2]!;
    const chip = page.locator('#qx-track .qx-panel').nth(3).locator('li a', { hasText: area });

    await expect(chip).toHaveAttribute('href', `${pillar.cta.href}#${sectionAnchor(area)}`);
    await chip.click();
    await page.waitForURL(`**${pillar.cta.href}#${sectionAnchor(area)}`);

    // The section exists, is the one named, and is actually on screen — an
    // anchor that resolves to nothing still "navigates" and still looks fine.
    const target = page.locator(`#${sectionAnchor(area)}`);
    await expect(target).toBeVisible();
    await expect(target.locator('h2')).toHaveText(area);
    const box = await target.boundingBox();
    expect(box, 'the section must be in the viewport after the jump').not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeLessThan(page.viewportSize()!.height);
  });

  /**
   * The control must be operable, and reachable by something other than a mouse.
   *
   * `aria-hidden` on the strip would make the buttons focusable-but-hidden, the
   * classic broken pairing. The counter keeps it (it is a read-out the panels
   * already carry); the buttons must not inherit it.
   */
  test('the segments are real, named, focusable controls', async ({ page }) => {
    await ready(page);
    await scrubTo(page, atPanel(0));

    const segs = page.locator('.qx-indicator-seg');
    await expect(segs).toHaveCount(PANEL_COUNT);
    for (let i = 0; i < PANEL_COUNT; i++) {
      const seg = segs.nth(i);
      await expect(seg).toHaveRole('button');
      await expect(seg).toHaveAccessibleName(`Panel ${i + 1} of ${PANEL_COUNT}`);
    }
    // Exactly one is current, and it is the one on screen.
    await expect(page.locator('.qx-indicator-seg[aria-current="true"]')).toHaveCount(1);
    // Focusable — the strip is inside a `pointer-events: none` viewport, so this
    // is also what proves the buttons opted back in rather than being inert.
    await segs.nth(2).focus();
    await expect(segs.nth(2)).toBeFocused();
  });

  test('vertical scroll moves the track horizontally, one panel per step', async ({ page }) => {
    await ready(page);
    const panelWidth = await page.evaluate(
      () => document.querySelector('.qx-panel')!.getBoundingClientRect().width,
    );
    expect(panelWidth).toBeGreaterThan(900); // ~982 = 70vw - 2 x stroke

    await scrubTo(page, atPanel(0));
    expect(Math.abs(await trackX(page))).toBeLessThan(12); // panel 1 flush

    await scrubTo(page, atPanel(1)); // one step on
    expect(await trackX(page)).toBeLessThan(-panelWidth * 0.8);

    await scrubTo(page, atPanel(STEPS)); // the far end
    const end = await trackX(page);
    expect(end).toBeLessThan(-panelWidth * (STEPS - 0.1));
    expect(end).toBeGreaterThan(-panelWidth * (STEPS + 0.1)); // exact steps, no over-run
  });

  test(`the indicator counts 01..${pad(PANEL_COUNT)} and matches the panel on screen`, async ({
    page,
  }) => {
    await ready(page);
    await scrubTo(page, atPanel(0));
    expect(await indicator(page)).toContain(counterAt(0));

    const seen: string[] = [];
    for (const target of PANELS.map(atPanel)) {
      await scrubTo(page, target);
      const text = (await indicator(page)).replace(/\s+/g, ' ').trim();
      seen.push(text);
      // The lit segment must agree with the counter.
      const activeIdx = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.qx-indicator-seg')).findIndex(
          (el) => el.getAttribute('data-active') === 'true',
        ),
      );
      expect(text).toContain(counterAt(activeIdx));
    }
    expect(seen).toEqual(PANELS.map(counterAt));
  });

  test('the active panel is lit and the others are dimmed', async ({ page }) => {
    await ready(page);
    await scrubTo(page, atPanel(0));
    const opacities = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>('.qx-panel')).map((el) =>
          Number(getComputedStyle(el).opacity),
        ),
      );
    const first = await opacities();
    expect(first[0]).toBeCloseTo(1, 1);
    for (const o of first.slice(1)) expect(o).toBeCloseTo(0.25, 1);

    await scrubTo(page, atPanel(1));
    const second = await opacities();
    expect(second[1]).toBeCloseTo(1, 1);
    expect(second[0]).toBeCloseTo(0.25, 1);
  });

  test('snapping lands on a panel, and never grabs the frame expansion', async ({ page }) => {
    await ready(page);

    // Stop mid-expansion. The frame must stay exactly where it was left — the
    // snap is scoped to the carousel and must pass this range through.
    // Fine steps: a 120px tick is ~0.027 of the pin and would sail past the
    // expansion entirely, leaving the frame already at its full 70vw.
    await scrubTo(page, (P.scaleEnd + P.expandEnd) / 2);
    // Settle on the FRAME, not the track: the track is stationary here, so the
    // track-based settle returns immediately and samples a still-growing frame.
    await settleOn(page, () => frameWidth(page));
    const before = await frameWidth(page);
    expect(before).toBeGreaterThan(300);
    expect(before).toBeLessThan(1000); // genuinely mid-expansion, not finished
    await page.waitForTimeout(900); // longer than the snap's delay + duration
    expect(Math.abs((await frameWidth(page)) - before)).toBeLessThan(4);

    // Stop mid-step in the carousel: it must resolve onto a panel.
    await scrubTo(page, betweenPanels(1));
    await settle(page);
    await expect
      .poll(
        async () => {
          const x = Math.abs(await trackX(page));
          const panel = await page.evaluate(
            () => document.querySelector('.qx-panel')!.getBoundingClientRect().width,
          );
          const steps = x / panel;
          return Math.abs(steps - Math.round(steps));
        },
        { timeout: 12_000, intervals: [200] },
      )
      .toBeLessThan(0.06);
  });

  test('will-change is on the track only during the carousel', async ({ page }) => {
    await ready(page);
    const willChange = () =>
      page.locator('#qx-track').evaluate((el) => getComputedStyle(el).willChange);
    // A permanently promoted five-viewport-wide strip holds a large GPU texture
    // for the whole session.
    expect(await willChange()).toBe('auto');

    await scrubTo(page, atPanel(1));
    await expect.poll(willChange, { timeout: 8000 }).toBe('transform');

    await scrubTo(page, 0.95);
    await expect.poll(willChange, { timeout: 8000 }).toBe('auto');
  });

  test('scrolling back up steps through the panels in reverse', async ({ page }) => {
    await ready(page);
    await scrubTo(page, atPanel(STEPS));
    expect(await indicator(page)).toContain(counterAt(STEPS));

    // Back to the first panel in small steps — a coarse wheel up would overshoot
    // past the segment's start, where the strip is hidden again and there is
    // nothing to read.
    //
    // THE TARGET IS DERIVED, and it used to be `0.18`. That literal was written
    // when the carousel segment started around 0.14; the budget has since been
    // retuned twice — once for the title card, and again when the Launchpad panel
    // took the pin to 1015vh — so "wheel up until p <= 0.18" stopped one panel
    // short and the run reported panel 2, which is the carousel being right and
    // the test being stale. Exactly the failure this file's own header describes,
    // in the one place a decimal survived.
    //
    // Halfway between panels 0 and 1, pulled a nudge toward panel 0: inside the
    // segment (so the strip is up and readable), unambiguously in panel 0's half
    // (so the snap has one answer), and expressed in the same terms as every
    // other target here.
    const backInsidePanelZero = betweenPanels(0) - EDGE;
    await expect
      .poll(
        async () => {
          const p = await progress(page);
          if (p > backInsidePanelZero) await page.mouse.wheel(0, -140);
          return p;
        },
        { timeout: 25_000, intervals: [40] },
      )
      .toBeLessThanOrEqual(backInsidePanelZero);
    await settle(page);

    await expect.poll(() => indicator(page), { timeout: 8000 }).toContain(counterAt(0));
    expect(Math.abs(await trackX(page))).toBeLessThan(12); // back to flush
  });

  test('no panel overlaps the indicator, at any viewport', async ({ page }) => {
    // The panel and the indicator are siblings in the same clipped box, so the
    // panel must RESERVE the strip's height. It did not, and on phones the
    // service list and CTA ran underneath it — worse because the indicator's
    // read head wrapped to three lines there, doubling its height.
    const SIZES = [
      { width: 320, height: 568 }, // narrowest AND shortest supported
      { width: 375, height: 667 },
      { width: 414, height: 896 },
      // Short desktops, both of which clipped BEFORE any of the mobile work:
      // 1024 is the worst case, where the frame narrows to the 70% tier while
      // the viewport is still only 768 tall.
      { width: 1024, height: 768 },
      { width: 1280, height: 720 },
      { width: 1440, height: 900 }, // the canonical frame, which must not regress
    ];

    for (const size of SIZES) {
      await page.setViewportSize(size);
      // `ready` drives a FRESH intro, but the previous iteration left
      // `qx-intro-complete` in sessionStorage, which boots a return visitor
      // straight to `ready` and never through `dot-in`. Clear it per size.
      await page.goto('/');
      await page.evaluate(() => sessionStorage.clear());
      await ready(page);
      await scrubTo(page, 0.5);

      const worst = await page.evaluate(() => {
        const ind = document.querySelector('.qx-indicator')!.getBoundingClientRect();
        let intoIndicator = -Infinity;
        let columnOverflow = -Infinity;
        // EVERY panel, not just the visible one — they differ in length, and the
        // longest is the one that breaks.
        document.querySelectorAll('.qx-panel').forEach((panel) => {
          const cs = getComputedStyle(panel);
          const box =
            panel.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
          const col = panel.firstElementChild!.getBoundingClientRect().height;
          columnOverflow = Math.max(columnOverflow, col - box);
          const cta = panel.querySelector('.qx-panel-cta')!.getBoundingClientRect();
          intoIndicator = Math.max(intoIndicator, cta.bottom - ind.top);
        });
        return { intoIndicator, columnOverflow };
      });

      const where = `${size.width}x${size.height}`;
      expect(worst.intoIndicator, `CTA crosses the indicator at ${where}`).toBeLessThanOrEqual(
        0,
      );
      // `items-center` means a too-tall column spills BOTH ways, so scrollHeight
      // alone would miss it — compare the column against the content box.
      expect(worst.columnOverflow, `panel content overflows at ${where}`).toBeLessThanOrEqual(
        0,
      );
    }
  });

  test('a resize mid-carousel keeps the expanded frame, not a collapsed bowl', async ({
    page,
  }) => {
    await ready(page);
    await scrubTo(page, 0.5); // deep in `services`: the expand segment is complete
    expect(await frameWidth(page)).toBeGreaterThan(900); // ~70vw of 1440

    // Resize while parked in the carousel. The frame-expand segment finished at
    // p 0.16 and never re-fires on its own, so without the pin's onRefresh
    // re-emitting it the frame was left as the ~98px Q bowl floating over the
    // panels. It must re-fit to the expanded design frame for the new viewport.
    await page.setViewportSize({ width: 1000, height: 1100 });
    await expect.poll(() => frameWidth(page), { timeout: 8000 }).toBeGreaterThan(600); // 84vw of 1000 = 840, nowhere near the 98px bowl

    // And back up.
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect.poll(() => frameWidth(page), { timeout: 8000 }).toBeGreaterThan(900);
  });
});
