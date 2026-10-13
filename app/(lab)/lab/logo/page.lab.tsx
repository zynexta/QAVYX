'use client';

import { useState } from 'react';
import { CursorNode } from '@/components/hero/CursorNode';
import { QFrame } from '@/components/hero/QFrame';
import { Wordmark } from '@/components/hero/Wordmark';
import {
  computeLogoGeometry,
  FRAME_OPEN_FRACTION,
  logoWidthFor,
  WORDMARK_VIEWBOX,
} from '@/motion/geometry';

/**
 * Phase 3 verification surface.
 *
 * The overlay is the acceptance test: public/reference/logo-trace.png is the
 * source mark recoloured red, laid under the authored SVG at the same scale.
 * Anywhere the authored geometry is wrong, red shows through. Anywhere it is
 * right, the white paths cover it completely.
 */
export default function LogoLab() {
  const [vw, setVw] = useState(1440);
  const [showRef, setShowRef] = useState(true);
  const vh = 900;

  const g = computeLogoGeometry(vw, vh);
  const refScale = g.logo.w / WORDMARK_VIEWBOX.w;

  return (
    <main className="min-h-svh p-4 font-mono text-2xs text-qx-grey">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          viewport width
          <input
            type="range"
            min={320}
            max={1920}
            step={1}
            value={vw}
            onChange={(e) => setVw(Number(e.target.value))}
            className="w-96"
          />
          <span className="w-14 text-qx-white">{vw}px</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showRef}
            onChange={(e) => setShowRef(e.target.checked)}
          />
          reference overlay (red = source mark)
        </label>
        {[320, 375, 768, 1024, 1440, 1920].map((w) => (
          <button
            key={w}
            onClick={() => setVw(w)}
            className="rounded-sm border border-qx-line px-2 py-1 hover:border-qx-green"
          >
            {w}
          </button>
        ))}
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
        <Stat k="logo w" v={g.logo.w} />
        <Stat k="logo h" v={g.logo.h} />
        <Stat k="frame w" v={g.frame.w} />
        <Stat k="frame h" v={g.frame.h} />
        <Stat k="frame ratio" v={g.frame.w / g.frame.h} digits={3} />
        <Stat k="stroke" v={g.strokeWidth} />
        <Stat k="corner r" v={g.frame.r} />
        <Stat k="clamped w" v={logoWidthFor(vw)} />
      </dl>

      <div
        className="relative overflow-hidden border border-qx-line"
        style={{ width: vw, height: 420, maxWidth: '100%' }}
      >
        {showRef ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/reference/logo-trace.png"
            alt=""
            style={{
              position: 'absolute',
              left: g.logo.x,
              top: 210 - g.logo.h / 2,
              width: WORDMARK_VIEWBOX.w * refScale,
              height: WORDMARK_VIEWBOX.h * refScale,
              imageRendering: 'pixelated',
            }}
          />
        ) : null}

        <svg
          width={vw}
          height={420}
          viewBox={`0 0 ${vw} 420`}
          style={{ position: 'absolute', inset: 0 }}
          aria-hidden="true"
        >
          <g transform={`translate(0 ${210 - vh / 2})`}>
            <QFrame box={g.frame} strokeWidth={g.strokeWidth} draw={FRAME_OPEN_FRACTION * 100} />
            <Wordmark {...g.wordmark} />
            <CursorNode anchor={g.mouseAnchor} />
          </g>
        </svg>
      </div>

      <p className="mt-3 max-w-2xl leading-relaxed">
        The bowl is the letter Q and is OPEN at the bottom-right; the mouse glyph
        fills that gap. The gap is the last ~10% of the frame path&apos;s length, so one
        DrawSVG value expresses both the open Q and the closed design frame.
      </p>
    </main>
  );
}

function Stat({ k, v, digits = 1 }: { k: string; v: number; digits?: number }) {
  return (
    <div className="flex justify-between border-b border-qx-line/60 py-1">
      <dt>{k}</dt>
      <dd className="text-qx-white">{v.toFixed(digits)}</dd>
    </div>
  );
}
