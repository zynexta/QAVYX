import { describe, expect, it } from 'vitest';
import {
  capsulePath,
  computeFrameGeometry,
  computeFramePath,
  computeLockupGeometry,
  computeLogoGeometry,
  computeNavGeometry,
  computeTravelPath,
  DOT_RADIUS,
  FRAME_OPEN_FRACTION,
  frameOpenFraction,
  glyphAxes,
  LOGO_ASPECT,
  logoWidthFor,
  MOUSE,
  mouseButtonClip,
  mouseTipCut,
  WORDMARK_VIEWBOX,
} from '../../motion/geometry';
import { GLYPHS } from '../../components/hero/Wordmark';

/** Pull every command letter out of a path, e.g. "M L A L A ... Z". */
const commands = (d: string) => d.match(/[MLACQZ]/g) ?? [];

describe('logo geometry', () => {
  it('matches the aspect measured from the source mark', () => {
    expect(LOGO_ASPECT).toBeCloseTo(6.3165, 3);
  });

  it('produces the documented geometry at 1440x900', () => {
    const g = computeLogoGeometry(1440, 900);
    expect(g.logo.w).toBeCloseTo(748.8, 1);
    expect(g.logo.h).toBeCloseTo(118.55, 1);
    // The Q bowl is 1.452:1 — close enough to the 70% frame's ratio that the
    // expansion reads as scale rather than stretch.
    expect(g.frame.w / g.frame.h).toBeCloseTo(424 / 292, 3);
  });

  it('keeps the bowl ratio constant at every viewport width', () => {
    for (const vw of [320, 375, 768, 1024, 1440, 1920]) {
      const g = computeLogoGeometry(vw, 900);
      expect(g.frame.w / g.frame.h).toBeCloseTo(1.4521, 3);
    }
  });

  it('clamps the logo width at both ends', () => {
    expect(logoWidthFor(1440)).toBeCloseTo(748.8, 1);
    expect(logoWidthFor(4000)).toBe(900); // ceiling
  });

  it('never overflows a narrow viewport — the mark keeps a gutter instead of clipping', () => {
    // Below ~470px the 52%/min-360 width would be wider than the screen. The
    // viewport-minus-gutter cap takes over so the mark always fits with margin.
    expect(logoWidthFor(320)).toBeLessThan(320);
    expect(logoWidthFor(375)).toBeLessThan(375);
  });

  /**
   * ...and not overflowing was never enough. The gutter cap alone left the mark
   * at 280/320 and 335/375 — 87-89% of the screen, which is not the 52% poster
   * anyone approved, only a version of it that happened to fit. This is the
   * bound that was missing, asserted as a FRACTION at every phone width rather
   * than as three magic pixel values.
   */
  it('never dominates a phone — the mark stays under 72% of the viewport', () => {
    for (const vw of [320, 360, 375, 390, 414, 430, 480]) {
      // The epsilon is float noise, not slack: 390 * 0.72 / 390 is 0.7200000000000001.
      expect(logoWidthFor(vw), `${vw}px`).toBeLessThanOrEqual(vw * 0.72 + 1e-9);
    }
    expect(logoWidthFor(414)).toBeCloseTo(298.08, 2);
  });

  /**
   * The phone bound is a ceiling on the floor, so it must be INERT wherever the
   * 52% ideal already clears it. Above ~692px this is the untouched desktop
   * poster; the assertion is what stops a future tweak to the fraction from
   * quietly reshaping the hero everyone actually signed off on.
   */
  it('leaves the desktop poster at exactly 52%', () => {
    for (const vw of [768, 1024, 1440, 1728]) {
      expect(logoWidthFor(vw), `${vw}px`).toBeCloseTo(vw * 0.52, 6);
    }
  });

  /** No step at either breakpoint — 480 is where the gutter changes, ~500 and
   *  ~692 are where each small-screen bound hands over. */
  it('is continuous across the widths where a bound hands over', () => {
    for (const vw of [479, 480, 499, 500, 691, 692]) {
      expect(Math.abs(logoWidthFor(vw) - logoWidthFor(vw + 1)), `${vw}px`).toBeLessThan(2);
    }
  });

  it('centres the mark in the viewport', () => {
    const g = computeLogoGeometry(1440, 900);
    expect(g.logo.x + g.logo.w / 2).toBeCloseTo(720, 6);
    expect(g.logo.y + g.logo.h / 2).toBeCloseTo(450, 6);
  });

  it('keeps the Q corner radius tight (regression: was 3x too round)', () => {
    // The real Q has nearly-square corners — outer radius ~= one stroke width.
    // A per-pixel diff against the source caught an earlier 52.9px value that
    // made every corner visibly too round. Centreline radius is ~17px at
    // source scale; as a fraction of logo width that is well under the stroke.
    const g = computeLogoGeometry(1440, 900);
    const rFrac = g.frame.r / g.logo.w;
    expect(rFrac).toBeCloseTo(17 / 2255, 4);
    // The corner must be no rounder than the stroke is wide, or it reads as a
    // pill rather than the Q's square-ish bowl.
    expect(g.frame.r).toBeLessThan(g.strokeWidth);
  });

  it('puts the mouse anchor inside the bowl gap, not outside the mark', () => {
    const g = computeLogoGeometry(1440, 900);
    const { x, y } = g.mouseAnchor;
    expect(x).toBeGreaterThan(g.frame.x);
    expect(x).toBeLessThan(g.frame.x + g.frame.w + g.strokeWidth);
    expect(y).toBeGreaterThan(g.frame.y + g.frame.h * 0.5);
    expect(y).toBeLessThan(g.logo.y + g.logo.h + g.strokeWidth);
  });
});

describe('frame path', () => {
  it('is a single closed path with a constant command structure', () => {
    const a = computeFramePath(computeLogoGeometry(1440, 900).frame);
    const b = computeFramePath(computeFrameGeometry(1440, 900));
    const c = computeFramePath(computeNavGeometry(1440));

    // Identical structure at every size is what lets the expansion interpolate.
    expect(commands(a)).toEqual(commands(b));
    expect(commands(b)).toEqual(commands(c));
    expect(commands(a).at(-1)).toBe('Z');
    expect(commands(a).filter((x) => x === 'M')).toHaveLength(1);
  });

  it('has no NaN at any viewport size', () => {
    for (const [vw, vh] of [
      [320, 480],
      [768, 1024],
      [1440, 900],
      [1920, 1080],
    ] as const) {
      expect(computeFramePath(computeLogoGeometry(vw, vh).frame)).not.toMatch(/NaN/);
      expect(computeFramePath(computeFrameGeometry(vw, vh))).not.toMatch(/NaN/);
    }
  });

  it('clamps the corner radius so small boxes cannot invert', () => {
    const d = computeFramePath({ x: 0, y: 0, w: 10, h: 10, r: 999 });
    expect(d).not.toMatch(/NaN/);
    expect(d).toMatch(/A5,5/);
  });

  it('produces the 70% design frame at the documented size', () => {
    const f = computeFrameGeometry(1440, 900);
    expect(f.w).toBeCloseTo(1008, 6);
    expect(f.h).toBeCloseTo(630, 6);
  });
});

describe('mouse glyph', () => {
  const g = computeLogoGeometry(1440, 900);
  const s = g.mouseAnchor.size;
  const body = capsulePath(
    g.mouseAnchor.x,
    g.mouseAnchor.y,
    MOUSE.bodyAlong * s,
    MOUSE.bodyAcross * s,
    MOUSE.bodyR * s,
    MOUSE.angleDeg,
  );
  /**
   * Every command ENDPOINT in a path, projected onto the glyph's own axes. The
   * `A rx,ry 0 0 1 ` prefix is stripped first — the radius pair matches a
   * coordinate regex just as well as a point does, and counting it as one puts
   * a phantom vertex near the origin that swamps the spans being measured.
   */
  const projected = (d: string) => {
    const t = (MOUSE.angleDeg * Math.PI) / 180;
    const pts = [
      ...d.replace(/A[\d.]+,[\d.]+ 0 0 [01] /g, '').matchAll(/(-?[\d.]+),(-?[\d.]+)/g),
    ].map((m) => [Number(m[1]) - g.mouseAnchor.x, Number(m[2]) - g.mouseAnchor.y]);
    return {
      along: pts.map((p) => p[0]! * Math.cos(t) + p[1]! * Math.sin(t)),
      across: pts.map((p) => -p[0]! * Math.sin(t) + p[1]! * Math.cos(t)),
    };
  };

  /**
   * The regression that made the landed glyph read as a stubby blob:
   * capsulePath's `w` is its extent ALONG `rotationDeg`, not its width, so
   * passing the across-axis size as `w` builds the body square-on to its own
   * long axis. Measuring the emitted path on both axes is the only assertion
   * that actually catches it — the command structure is identical either way.
   */
  it('is longer along its axis than across it', () => {
    const { along, across } = projected(body);
    const spanAlong = Math.max(...along) - Math.min(...along);
    const spanAcross = Math.max(...across) - Math.min(...across);
    expect(spanAlong).toBeGreaterThan(spanAcross);
    // 85.26 x 49.39 source px — the body is 1.73:1.
    expect(spanAlong / spanAcross).toBeCloseTo(85.26 / 49.39, 2);
  });

  it('puts the tip seam past the body centre, and wider than the body', () => {
    const cut = mouseTipCut(g.mouseAnchor);
    const t = (MOUSE.angleDeg * Math.PI) / 180;
    const dt =
      (cut.cx - g.mouseAnchor.x) * Math.cos(t) + (cut.cy - g.mouseAnchor.y) * Math.sin(t);
    // The seam circle is wider than the body, so the arc it cuts spans the full
    // width and bows back toward the cord — that curve is the glyph's tell. A
    // radius under the half-width would cut a straight-looking stripe instead.
    expect(cut.r).toBeGreaterThan((MOUSE.bodyAcross * s) / 2);
    // Its centre sits just behind the body centre, so the green lands on the
    // far end only rather than ringing both ends.
    expect(dt).toBeLessThan(0);
    expect(Math.abs(dt)).toBeLessThan((MOUSE.bodyAlong * s) / 2);
    // Green ends up ~25% of the body, as measured off the source mark (23.2%).
    const reach = dt + cut.r; // seam distance from the centre, along the axis
    const half = (MOUSE.bodyAlong * s) / 2;
    expect((half - reach) / (2 * half)).toBeGreaterThan(0.15);
    expect((half - reach) / (2 * half)).toBeLessThan(0.35);
  });

  it('runs the cord back out of the body, not across it', () => {
    const t = (MOUSE.angleDeg * Math.PI) / 180;
    const alongOf = (p: { x: number; y: number }) => p.x * Math.cos(t) + p.y * Math.sin(t);
    // Both ends sit behind the body centre, and `from` is the further out.
    expect(alongOf(MOUSE.cordFrom)).toBeLessThan(alongOf(MOUSE.cordTo));
    expect(alongOf(MOUSE.cordTo)).toBeLessThan(0);
    // The far end clears the body; the near end stops within half a cord width
    // of the body's back edge, so its round cap overlaps the body and the cord
    // reads as attached rather than as a floating dash beside the glyph.
    expect(Math.abs(alongOf(MOUSE.cordFrom))).toBeGreaterThan(MOUSE.bodyAlong / 2);
    expect(Math.abs(alongOf(MOUSE.cordTo))).toBeLessThan(MOUSE.bodyAlong / 2 + MOUSE.cordW / 2);
    expect(MOUSE.cordW).toBeLessThan(MOUSE.bodyAcross / 2);
  });

  /**
   * The left button is DERIVED rather than measured, so these are the checks
   * that keep it a mouse button: on the mouse's left, at the cord end, clear of
   * the green tip, and trimmed by the body rather than floating beside it.
   */
  describe('the left button', () => {
    const b = MOUSE.button;

    it('sits on the LEFT of the axis, with a seam of body left beside it', () => {
      // Taking the cord end as the mouse's front, +across is its left. Both
      // edges strictly positive is what puts the button on that side; `fromA`
      // above zero is the seam that stops it reading as half a mouse.
      expect(b.fromA).toBeGreaterThan(0);
      expect(b.toA).toBeGreaterThan(b.fromA);
      // Left is down-left on screen, because the glyph lies at 40.5°.
      const { across } = glyphAxes();
      expect(across.x).toBeLessThan(0);
      expect(across.y).toBeGreaterThan(0);
    });

    /** The button as it is actually DRAWN: the clip rectangle ∩ the body. */
    const visible = {
      along: Math.min(b.toT, MOUSE.bodyAlong / 2) - Math.max(b.fromT, -MOUSE.bodyAlong / 2),
      across: Math.min(b.toA, MOUSE.bodyAcross / 2) - b.fromA,
    };

    it('lies at the cord end and never reaches the green tip', () => {
      // Centred on the cord half — the end a real mouse's buttons are on. The
      // button crosses the body centre, as a real one does, but its own midpoint
      // stays behind it.
      expect((b.toT + Math.max(b.fromT, -MOUSE.bodyAlong / 2)) / 2).toBeLessThan(0);
      // The far edge overshoots the body so the end cap trims the button.
      expect(b.fromT).toBeLessThan(-MOUSE.bodyAlong / 2);
      // And it clears the tip's seam with room to spare, so the two greens read
      // as two accents rather than one interrupted blob. The binding number is
      // the seam's reach on the FLANK — its cut circle bows back toward the cord
      // at the body's edge, so the green starts a third as far forward there as
      // it does on the centreline, and sizing the button against the centreline
      // figure leaves them about a pixel apart.
      const cut = mouseTipCut({ x: 0, y: 0, size: 1 });
      const half = MOUSE.bodyAcross / 2;
      const seamOnFlank = MOUSE.tipCutT + Math.sqrt(cut.r ** 2 - half ** 2);
      expect(seamOnFlank).toBeLessThan(MOUSE.tipCutT + cut.r); // it does bow back
      expect(seamOnFlank - b.toT).toBeGreaterThan(0.08);
    });

    it('is about half the body long — the proportion a mouse button has', () => {
      const lengthFraction = visible.along / MOUSE.bodyAlong;
      expect(lengthFraction).toBeGreaterThan(0.4);
      expect(lengthFraction).toBeLessThan(0.62);
      // Across, it is the left half less the seam, and never crosses the axis.
      expect(visible.across).toBeLessThan(MOUSE.bodyAcross / 2);
      // So the drawn button is a fifth or so of the glyph, not most of it.
      const area = (visible.along * visible.across) / (MOUSE.bodyAlong * MOUSE.bodyAcross);
      expect(area).toBeLessThan(0.3);
    });

    it('leaves a seam that survives the smallest glyph the hero ever draws', () => {
      // The seam is what separates left button from right, and it is a fraction
      // of the glyph — so the case that decides it is the narrowest viewport,
      // where the whole mouse is ~15px. Half a pixel still antialiases into a
      // visible line; the 0.02 this started at gives 0.29px, which does not.
      expect(b.fromA * computeLogoGeometry(320, 740).mouseAnchor.size).toBeGreaterThan(0.5);
      // And it must not be a hairline on a wide desktop, where there is room.
      expect(b.fromA * s).toBeGreaterThan(1.5);
    });

    it('clips a closed quadrilateral, in stage pixels, that scales with the glyph', () => {
      expect(commands(mouseButtonClip(g.mouseAnchor))).toEqual(['M', 'L', 'L', 'L', 'Z']);
      // Twice the glyph, twice the offsets from the anchor — the button holds
      // its proportion of the mouse at every viewport width.
      const corner = (size: number) =>
        mouseButtonClip({ x: 0, y: 0, size }).match(/-?[\d.]+/g)!.map(Number);
      const near = corner(s);
      const far = corner(s * 2);
      near.forEach((v, i) => expect(far[i]).toBeCloseTo(v * 2, 1));
    });
  });
});

describe('dot -> mouse morph parity', () => {
  const g = computeLogoGeometry(1440, 900);
  const s = g.mouseAnchor.size;

  const dot = capsulePath(0, 0, DOT_RADIUS * 2, DOT_RADIUS * 2, DOT_RADIUS, 0);
  const mouse = capsulePath(
    g.mouseAnchor.x,
    g.mouseAnchor.y,
    MOUSE.bodyAlong * s,
    MOUSE.bodyAcross * s,
    MOUSE.bodyR * s,
    MOUSE.angleDeg,
  );

  /**
   * This is the highest-risk failure in the project: a segment-count or winding
   * mismatch makes MorphSVG interpolate through a crumpled shape. Both paths
   * come from one generator, and this test is what stops that from silently
   * changing.
   */
  it('has identical command sequences', () => {
    expect(commands(dot)).toEqual(commands(mouse));
  });

  it('uses the expected 4-arc, 4-line structure', () => {
    const cmds = commands(dot);
    expect(cmds.filter((c) => c === 'A')).toHaveLength(4);
    expect(cmds.filter((c) => c === 'L')).toHaveLength(4);
    expect(cmds.filter((c) => c === 'M')).toHaveLength(1);
  });

  it('bakes rotation into coordinates rather than a transform attribute', () => {
    // MorphSVG ignores transform attributes, so a rotated target must not rely
    // on one. A rotated capsule has no axis-aligned coordinates left.
    expect(mouse).not.toMatch(/transform|rotate/);
    const rotated = capsulePath(0, 0, 40, 80, 20, 46);
    const upright = capsulePath(0, 0, 40, 80, 20, 0);
    expect(rotated).not.toEqual(upright);
    expect(commands(rotated)).toEqual(commands(upright));
  });

  it('keeps the same winding at every rotation', () => {
    // All arcs sweep the same direction; a flipped sweep flag turns the shape
    // inside out mid-morph.
    for (const angle of [0, 46, 90, 180, 270]) {
      const sweeps = capsulePath(0, 0, 40, 80, 20, angle).match(/A[\d.,]+ 0 0 (\d)/g) ?? [];
      expect(sweeps).toHaveLength(4);
      expect(new Set(sweeps.map((s) => s.slice(-1))).size).toBe(1);
    }
  });
});

describe('wordmark glyphs', () => {
  it('has four glyphs sharing one baseline and cap line', () => {
    expect(GLYPHS).toHaveLength(4);
    for (const glyph of GLYPHS) {
      const ys = [...glyph.d.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map((m) => Number(m[2]));
      expect(Math.min(...ys)).toBe(11); // cap line, measured from the source
      expect(Math.max(...ys)).toBe(323); // baseline
    }
  });

  it('gives the A a counter and the others none', () => {
    const subpaths = (d: string) => (d.match(/M/g) ?? []).length;
    expect(subpaths(GLYPHS[0]!.d)).toBe(2); // A: outline + counter
    expect(subpaths(GLYPHS[1]!.d)).toBe(1); // V
    expect(subpaths(GLYPHS[2]!.d)).toBe(1); // Y
    expect(subpaths(GLYPHS[3]!.d)).toBe(1); // X
  });

  it('stays lean enough to repaint cheaply', () => {
    const verts = GLYPHS.reduce((n, g) => n + (g.d.match(/[ML]/g) ?? []).length, 0);
    expect(verts).toBeLessThanOrEqual(45);
  });

  it('uses only straight segments — these letterforms have no curves', () => {
    for (const glyph of GLYPHS) expect(glyph.d).not.toMatch(/[ACQST]/);
  });
});

describe('travel path', () => {
  it('arcs rather than running straight to the anchor', () => {
    const g = computeLogoGeometry(1440, 900);
    const d = computeTravelPath({ x: 200, y: 700 }, g.mouseAnchor);
    expect(d).toMatch(/^M/);
    expect(d).toContain('Q'); // quadratic, so it lifts off the chord
    expect(d).not.toMatch(/NaN/);
  });
});

/**
 * The static lockup the navbar and footer render (Phase 8C).
 *
 * `computeLogoGeometry` is now a caller of `computeLockupGeometry`, so these
 * tests are the guard on that refactor: the hero's mark must be exactly what it
 * was, and the nav's mark must be the same mark at a different size rather than
 * a second set of numbers that happen to look similar.
 */
describe('lockup geometry', () => {
  it('is what computeLogoGeometry produces, at the viewport-derived width', () => {
    for (const [vw, vh] of [
      [1440, 900],
      [1024, 768],
      [375, 812],
      [3440, 1440],
    ] as const) {
      const w = logoWidthFor(vw);
      const h = w / LOGO_ASPECT;
      expect(computeLockupGeometry(w, (vw - w) / 2, (vh - h) / 2)).toEqual(
        computeLogoGeometry(vw, vh),
      );
    }
  });

  it('is scale-invariant — every part is the same fraction at any width', () => {
    const small = computeLockupGeometry(100);
    const large = computeLockupGeometry(2255);
    const k = 2255 / 100;
    expect(large.frame.w / small.frame.w).toBeCloseTo(k, 6);
    expect(large.frame.h / small.frame.h).toBeCloseTo(k, 6);
    expect(large.frame.r / small.frame.r).toBeCloseTo(k, 6);
    expect(large.strokeWidth / small.strokeWidth).toBeCloseTo(k, 6);
  });

  /**
   * The nav logo renders in the wordmark's own authoring space, so its origin is
   * 0,0 and its viewBox is the measurement. If this stops holding, the mark
   * clips against its own viewBox in the navbar.
   */
  it('at the wordmark viewBox width, fits inside that viewBox', () => {
    const g = computeLockupGeometry(WORDMARK_VIEWBOX.w);
    expect(g.wordmark.scale).toBe(1);
    expect(g.logo).toEqual({ x: 0, y: 0, w: WORDMARK_VIEWBOX.w, h: WORDMARK_VIEWBOX.h });
    // The bowl plus half a stroke on each side stays within the box.
    expect(g.frame.x - g.strokeWidth / 2).toBeGreaterThanOrEqual(0);
    expect(g.frame.y - g.strokeWidth / 2).toBeGreaterThanOrEqual(0);
    expect(g.frame.y + g.frame.h + g.strokeWidth / 2).toBeLessThanOrEqual(WORDMARK_VIEWBOX.h);
  });

  /**
   * The nav logo derives its dash rather than reusing the 89.4 constant. The two
   * must agree at the bowl — that is the box the constant was measured on — or
   * the navbar would draw a Q with its gap in a different place from the hero's.
   */
  it('draws the same open Q the hero does', () => {
    const g = computeLockupGeometry(WORDMARK_VIEWBOX.w);
    expect(frameOpenFraction(g.frame)).toBeCloseTo(FRAME_OPEN_FRACTION, 4);
  });
});
