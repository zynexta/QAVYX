import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The pagination bridge's arithmetic.
 *
 * `motion/paging.ts` is the one module that knows both halves of "go to panel
 * N" — the carousel's progress maths and the page's scroll position — so it is
 * also the one place the two can be wired up wrongly without anything else
 * noticing. A pin progress mapped to the wrong pixel does not throw; it scrolls
 * to a plausible-looking place one panel out, which reads as a snapping bug.
 *
 * ScrollTrigger and Lenis are both mocked, because neither is the thing under
 * test: what matters is that the progress→pixel mapping reads the trigger's OWN
 * resolved bounds rather than recomputing them from `PIN_A.totalVh`, and that
 * every path has a defined answer when the pin does not exist.
 */

const getById = vi.fn();
const scrollTo = vi.fn();
let lenis: { scrollTo: typeof scrollTo } | null = null;

vi.mock('@/motion/gsap', () => ({
  ScrollTrigger: { getById: (id: string) => getById(id) },
  gsap: {},
}));
vi.mock('@/motion/lenis', () => ({ activeLenis: () => lenis }));

const { goToPanel, scrollYForProgress } = await import('@/motion/paging');
const { progressForIndex, STEPS } = await import('@/motion/timelines/carouselTimeline');
const { PIN_ID } = await import('@/types/hero');

/** A pin occupying scroll positions 1000..11000 — 10000px of travel. */
const PIN = { start: 1000, end: 11000 };

beforeEach(() => {
  getById.mockReset().mockReturnValue(PIN);
  scrollTo.mockReset();
  lenis = { scrollTo };
  vi.stubGlobal('window', { scrollTo: vi.fn() });
});

describe('scrollYForProgress', () => {
  it('reads the trigger’s own resolved bounds, not the vh table', () => {
    // The whole point: `end: '+=1015%'` is resolved by ScrollTrigger against the
    // trigger's size and pinSpacing at refresh time. Recomputing it here from
    // PIN_A.totalVh would drift, and would drift differently after a resize.
    expect(scrollYForProgress(0)).toBe(1000);
    expect(scrollYForProgress(1)).toBe(11000);
    expect(scrollYForProgress(0.5)).toBe(6000);
    expect(getById).toHaveBeenCalledWith(PIN_ID);
  });

  it('clamps rather than extrapolating past the pin', () => {
    // A caller asking for panel -1 or panel 99 must not be scrolled off the pin
    // into the launch segment or above the document.
    expect(scrollYForProgress(-5)).toBe(1000);
    expect(scrollYForProgress(42)).toBe(11000);
  });

  it('returns null when there is no pin', () => {
    // Reduced motion, or before `ready`. Not an error — the control is not live.
    getById.mockReturnValue(undefined);
    expect(scrollYForProgress(0.5)).toBeNull();
  });
});

describe('goToPanel', () => {
  it('lands each panel on its own snap point', () => {
    // Derived from `progressForIndex`, never typed — the same discipline the e2e
    // suite follows, and for the same reason: a literal stops addressing the
    // panel it was named for the moment the budget or the panel count moves.
    for (let i = 0; i <= STEPS; i++) {
      scrollTo.mockReset();
      expect(goToPanel(i)).toBe(true);
      const [y] = scrollTo.mock.calls[0]!;
      expect(y).toBeCloseTo(1000 + 10000 * progressForIndex(i), 6);
    }
  });

  it('locks the scroll so a stray wheel tick cannot strand it mid-panel', () => {
    goToPanel(2);
    expect(scrollTo.mock.calls[0]![1]).toMatchObject({ lock: true });
    expect(scrollTo.mock.calls[0]![1].duration).toBeGreaterThan(0);
  });

  it('falls back to native smooth scroll when Lenis is absent', () => {
    // The pin reads window.scrollY either way, so the scrub still follows — a
    // no-op here would leave a live-looking control that does nothing.
    lenis = null;
    const native = vi.fn();
    vi.stubGlobal('window', { scrollTo: native });
    expect(goToPanel(3)).toBe(true);
    expect(native).toHaveBeenCalledWith({
      top: 1000 + 10000 * progressForIndex(3),
      behavior: 'smooth',
    });
  });

  it('reports false, and scrolls nothing, when the pin does not exist', () => {
    getById.mockReturnValue(undefined);
    expect(goToPanel(1)).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
