import { describe, expect, it } from 'vitest';
import {
  buildBudget,
  PIN_A,
  PIN_TOUCH_COVERAGE,
  PIN_TOUCH_END,
  PIN_TOUCH_VH,
} from '@/motion/scrollBudget';
import { P } from '@/motion/timelines/expandTimeline';
import { CAROUSEL_END, CAROUSEL_START } from '@/motion/timelines/carouselTimeline';
import { PANEL_COUNT } from '@/content/carousel';

/**
 * `toBe` on a number is `Object.is`, so everything here asserts bit equality
 * rather than approximate equality. That is deliberate: a boundary landing
 * within 1e-9 of its intended value would still move a snap point, and the
 * failure would show up as a carousel that stops half a panel short rather than
 * as anything resembling a numeric error.
 */

describe('PIN_A', () => {
  it('totals 1015vh, and names what lengthened it', () => {
    // The carousel's step went 90vh -> 75vh, so the aperture's 120vh was bought
    // rather than added: everything up to the fly-through fitted in the original
    // 500. "500vh feels too long" is a logged standing risk, so for a long time
    // the only segments allowed to lengthen the pin were new acts — the launch,
    // and the title card that introduces it.
    //
    // THE SIXTH PANEL IS THE FIRST EXCEPTION, on the client's direction. A sixth
    // panel is a fifth step, so `services` is 375 and the pin is 1015. The
    // alternative — a 60vh step, holding the total at exactly 940 — was put to
    // the client and declined, because it pays for the new panel by making all
    // five existing transitions 20% faster.
    expect(PIN_A.totalVh).toBe(1015);
    expect(PIN_A.end).toBe('+=1015%');
    expect(PIN_A.endOf('aperture')).toBe(575 / 1015);
  });

  it('derives the whole segment map from the vh table', () => {
    // Written as vh/total rather than as decimals so a change to the table
    // shows up here as one number moving, not as eight opaque literals.
    expect(P).toEqual({
      cursorOut: 20 / 1015,
      strokeStart: 10 / 1015,
      scaleEnd: 30 / 1015,
      fillStart: 50 / 1015,
      fillEnd: 70 / 1015,
      expandEnd: 80 / 1015,
      servicesEnd: 455 / 1015,
      apertureEnd: 575 / 1015,
      titleEnd: 695 / 1015,
    });
  });

  it('derives the carousel bounds', () => {
    expect(CAROUSEL_START).toBe(80 / 1015);
    expect(CAROUSEL_END).toBe(455 / 1015);
  });

  it('lays the aperture, the card and the launch out after the carousel', () => {
    expect(PIN_A.startOf('aperture')).toBe(455 / 1015);
    expect(PIN_A.spans.find((s) => s.name === 'aperture')?.vh).toBe(120);
    expect(PIN_A.startOf('title')).toBe(575 / 1015);
    expect(PIN_A.spans.find((s) => s.name === 'title')?.vh).toBe(120);
    expect(PIN_A.startOf('launch')).toBe(695 / 1015);
    expect(PIN_A.endOf('launch')).toBe(1);
    expect(PIN_A.spans.find((s) => s.name === 'launch')?.vh).toBe(320);
  });

  /**
   * The knob the client chose, asserted as a knob.
   *
   * The step LENGTH is the tuned number and the total is the derived one. If a
   * future change ever holds the total steady by shortening the step, this is
   * the line that says so out loud rather than letting it pass as arithmetic.
   */
  it('keeps the step at 75vh — the panel count moved, the pace did not', () => {
    const services = PIN_A.spans.find((s) => s.name === 'services');
    expect(services!.vh / (PANEL_COUNT - 1)).toBe(75);
  });

  it('keeps the snap guard and the carousel tween on the same boundaries', () => {
    // The desync this derivation exists to make impossible: snapProgress guards
    // on CAROUSEL_END while the tween it guards ends at P.servicesEnd.
    expect(CAROUSEL_START).toBe(P.expandEnd);
    expect(CAROUSEL_END).toBe(P.servicesEnd);
  });

  it('scales the carousel with the panel count', () => {
    const services = PIN_A.spans.find((s) => s.name === 'services');
    expect(services?.vh).toBe((PANEL_COUNT - 1) * 75);
  });
});

describe('buildBudget', () => {
  const b = buildBudget([
    ['a', 25],
    ['b', 75],
  ] as const);

  it('lays segments end to end across 0..1', () => {
    expect(b.totalVh).toBe(100);
    expect(b.startOf('a')).toBe(0);
    expect(b.endOf('a')).toBe(0.25);
    expect(b.startOf('b')).toBe(0.25);
    expect(b.endOf('b')).toBe(1);
  });

  it('has no gaps or overlaps between consecutive spans', () => {
    for (let i = 1; i < b.spans.length; i++) {
      expect(b.spans[i]!.start).toBe(b.spans[i - 1]!.end);
    }
    expect(b.spans[0]!.start).toBe(0);
    expect(b.spans[b.spans.length - 1]!.end).toBe(1);
  });

  it('agrees between at() and mark() at the same absolute position', () => {
    // These must be bit-identical or a sub-beat expressed one way drifts from a
    // boundary expressed the other.
    expect(b.at('b', 0)).toBe(b.mark(25));
    expect(b.at('b', 0.5)).toBe(b.mark(62.5));
    expect(b.at('b', 1)).toBe(b.mark(100));
    expect(b.at('a', 1)).toBe(b.startOf('b'));
  });

  it('treats span() as a length, not a position', () => {
    expect(b.span(25)).toBe(0.25);
  });

  it('rejects nonsense tables', () => {
    expect(() => buildBudget([['a', 0]] as const)).toThrow(/> 0vh/);
    expect(() => buildBudget([['a', -5]] as const)).toThrow(/> 0vh/);
    expect(() => buildBudget([])).toThrow(/> 0/);
  });

  it('names the segment it cannot find', () => {
    // @ts-expect-error — the name is not in the table, which is the point
    expect(() => b.startOf('nope')).toThrow(/no segment named "nope"/);
  });
});

/**
 * The table as it stood before Phase 8E, frozen here as data.
 *
 * The point is conservation. The title card was INSERTED into the sequence, not
 * swapped for anything: `LEGS` in `launchTimeline` maps vh to path fraction, and
 * the carousel's snap increment and every e2e target derive from the services
 * span. If a segment's vh changed while the card was added, the two changes
 * would be indistinguishable in the diff and the motion regression would look
 * like a consequence of the insertion.
 */
const BEFORE_8E: readonly (readonly [string, number])[] = [
  ['frameScale', 30],
  ['frameExpand', 50],
  // 300, and a LITERAL rather than `(PANEL_COUNT - 1) * 75`. It was derived
  // until the Launchpad panel went in, at which point a derived entry would have
  // silently rewritten this frozen table to match the present and the
  // conservation check below would have passed by construction. The whole point
  // of the table is that it does not move.
  ['services', 300],
  ['aperture', 120],
  ['launch', 320],
];

/** The one segment that HAS changed length since, and by how much. */
const STEP_VH = 75;

describe('the Phase 8E title card', () => {
  it('leaves every pre-existing segment at exactly its old length', () => {
    const now = new Map(PIN_A.spans.map((s) => [s.name as string, s.vh]));
    for (const [name, vh] of BEFORE_8E) {
      if (name === 'services') continue; // see the next test
      expect(now.get(name), `${name} changed length when the card went in`).toBe(vh);
    }
  });

  /**
   * `services` is the exception, and it is one CHANGE rather than a drift.
   *
   * The carousel grew by exactly one step when the Launchpad panel was added on
   * the client's direction. Asserted as `old + n × step` rather than as 375 so
   * that the two things that could go wrong stay distinguishable: a change to
   * the panel count is legitimate and shows up as `n`, while a change to the
   * step is the tuning this project has said twice it does not want to touch and
   * would fail here with a non-integer.
   */
  it('grew the carousel by whole steps only, never by re-timing one', () => {
    const before = BEFORE_8E.find(([n]) => n === 'services')![1];
    const now = PIN_A.spans.find((s) => s.name === 'services')!.vh;
    expect(now).toBe(before + STEP_VH);
    expect(now / (PANEL_COUNT - 1)).toBe(STEP_VH);
    expect(before / STEP_VH).toBe(PANEL_COUNT - 2); // one panel fewer, back then
  });

  it('inserts itself between the aperture and the launch, and nowhere else', () => {
    const order = PIN_A.spans.map((s) => s.name as string);
    expect(order).toEqual([
      'frameScale',
      'frameExpand',
      'services',
      'aperture',
      'title',
      'launch',
    ]);
    // Strip the card and the sequence is exactly what it was.
    expect(order.filter((n) => n !== 'title')).toEqual(BEFORE_8E.map(([n]) => n));
    // The card ends where the climb begins: they are never on screen together.
    expect(PIN_A.endOf('title')).toBe(PIN_A.startOf('launch'));
  });

  it('adds 120vh and nothing else to the pin', () => {
    const before = BEFORE_8E.reduce((sum, [, vh]) => sum + vh, 0);
    expect(before).toBe(820);
    // The card's own contribution, isolated from the carousel step added after
    // it: total, minus the frozen table, minus the steps the carousel has gained
    // since, is exactly the card.
    const stepsSince = PIN_A.spans.find((s) => s.name === 'services')!.vh - 300;
    expect(PIN_A.totalVh - before - stepsSince).toBe(120);
    expect(PIN_A.totalVh).toBe(940 + stepsSince);
    expect(PIN_A.end).toBe(`+=${940 + stepsSince}%`);
  });

  it('gives the rocket the same 320vh it has always had', () => {
    // `LEGS` maps vh to path fraction, so a change here would silently re-time
    // the whole climb — including the near-stall through the break the piece is
    // built around.
    expect(PIN_A.spans.find((s) => s.name === 'launch')!.vh).toBe(320);
    expect(PIN_A.endOf('launch')).toBe(1);
  });
});

/**
 * THE TOUCH PIN, which is the same pin with its last beat cut off.
 *
 * On the client's direction the launch film is not on a phone. The cut is
 * expressed as two derived numbers rather than a second table — the budget's own
 * note says to change the table and never a decimal, and a parallel table would
 * be exactly that decimal one indirection further out.
 *
 * The invariant these lock is the one the whole approach rests on: because the
 * timeline is anchored at `PIN_TOUCH_COVERAGE` and the trigger runs
 * `PIN_TOUCH_END`, both are short by the SAME factor, so a tween placed at
 * budget progress `p` still lands at the same absolute vh of scroll on both
 * devices. Verified in a browser at 390x844 and 1440x900 — services starts at
 * 80vh and aperture at 455vh on both — and pinned here so it cannot drift.
 */
describe('the touch pin', () => {
  it('is the budget minus the launch row, derived rather than retyped', () => {
    expect(PIN_TOUCH_VH).toBe(1015 - 320);
    expect(PIN_TOUCH_VH).toBe(695);
    expect(PIN_TOUCH_END).toBe('+=695%');
  });

  it('covers the budget exactly as far as the title card', () => {
    // Identical to `endOf('title')` by construction — the launch row starts
    // where the title row ends — and stated as `startOf('launch')` because the
    // cut is what this number is about.
    expect(PIN_TOUCH_COVERAGE).toBe(PIN_A.startOf('launch'));
    expect(PIN_TOUCH_COVERAGE).toBe(PIN_A.endOf('title'));
    expect(PIN_TOUCH_COVERAGE).toBe(695 / 1015);
  });

  it('puts every kept beat at the same absolute vh as the full pin', () => {
    // THE WHOLE POINT. Pin progress p_touch maps to budget progress
    // p_touch * COVERAGE; multiply by the SHORT pin's 695vh to get scroll
    // distance, and it must equal the same beat's distance on the 1015vh pin.
    for (const name of ['frameScale', 'frameExpand', 'services', 'aperture', 'title'] as const) {
      const budget = PIN_A.endOf(name);
      const onFullPin = budget * PIN_A.totalVh;
      const asPinProgress = budget / PIN_TOUCH_COVERAGE;
      const onTouchPin = asPinProgress * PIN_TOUCH_VH;
      expect(onTouchPin).toBeCloseTo(onFullPin, 9);
    }
    // And the cut itself is the end of the short pin, not a position inside it.
    expect(PIN_A.startOf('launch') / PIN_TOUCH_COVERAGE).toBe(1);
  });
});
