import { contrastRatio, verdict } from '@/lib/contrast';

/**
 * Phase 1 verification surface. Ratios are computed here at render time from
 * the same hex values the tokens use — a hard-coded table would drift the
 * moment someone changes a token and would then lie about accessibility.
 *
 * Dev only: the `.lab.tsx` extension is only registered as a page in
 * development (see next.config.ts), so this never reaches production.
 */

const BASE = '#000000';

/**
 * `role` decides which threshold applies. A surface is a background and has no
 * contrast requirement against itself — checking it against 3:1 produces a
 * failure that is not real, and a check that cries wolf is one people learn to
 * ignore.
 */
type Role = 'surface' | 'ui' | 'text';

const THRESHOLD: Record<Role, number | null> = {
  surface: null, // nothing to satisfy
  ui: 3, // WCAG 1.4.11 Non-text Contrast
  text: 4.5, // WCAG 1.4.3 Contrast (Minimum)
};

const COLORS: ReadonlyArray<{ token: string; hex: string; use: string; role: Role }> = [
  { token: '--qx-black', hex: '#000000', use: 'Page base', role: 'surface' },
  { token: '--qx-ink', hex: '#0a0c0b', use: 'Frame interior, panels', role: 'surface' },
  {
    token: '--qx-ink-raised',
    hex: '#141816',
    use: 'Cards and inputs on an ink section',
    role: 'surface',
  },
  { token: '--qx-green', hex: '#2abd00', use: 'Dot, cursor, active, focus ring', role: 'text' },
  { token: '--qx-green-dim', hex: '#1a7a0e', use: 'Inactive frame stroke', role: 'ui' },
  { token: '--qx-white', hex: '#f2f5f3', use: 'Wordmark, titles', role: 'text' },
  { token: '--qx-grey', hex: '#919a94', use: 'Body copy, counters', role: 'text' },
  { token: '--qx-line', hex: '#1e2320', use: 'Hairlines (decorative only)', role: 'surface' },
];

const TYPE = [
  { name: '4xl / 112', cls: 'text-4xl', family: 'font-display' },
  { name: '3xl / 72', cls: 'text-3xl', family: 'font-display' },
  { name: '2xl / 48', cls: 'text-2xl', family: 'font-display' },
  { name: 'xl / 34', cls: 'text-xl', family: 'font-display' },
  { name: 'lg / 26', cls: 'text-lg', family: 'font-display' },
  { name: 'md / 20', cls: 'text-md', family: 'font-body' },
  { name: 'sm / 16', cls: 'text-sm', family: 'font-body' },
  { name: 'xs / 14', cls: 'text-xs', family: 'font-mono' },
  { name: '2xs / 12', cls: 'text-2xs', family: 'font-mono' },
] as const;

export default function TokensLab() {
  return (
    <main className="mx-auto max-w-4xl px-3 py-6 font-body text-qx-white">
      <h1 className="text-2xl">Design tokens</h1>
      <p className="mt-2 text-sm text-qx-grey">
        Contrast computed at render time against {BASE}. Sampled from the brand PNGs, not
        invented.
      </p>

      <h2 className="mt-6 text-lg">Colour</h2>
      <table className="mt-3 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-qx-line text-left text-qx-grey">
            <th className="py-2 font-normal">Swatch</th>
            <th className="py-2 font-normal">Token</th>
            <th className="py-2 font-normal">Hex</th>
            <th className="py-2 font-normal">Ratio</th>
            <th className="py-2 font-normal">Verdict</th>
            <th className="py-2 font-normal">Use</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {COLORS.map((c) => {
            const ratio = contrastRatio(c.hex, BASE);
            const threshold = THRESHOLD[c.role];
            const passes = threshold === null || ratio >= threshold;
            const label =
              threshold === null ? 'surface —' : `${verdict(ratio)} ${passes ? '✓' : '✗'}`;
            return (
              <tr key={c.token} className="border-b border-qx-line/60">
                <td className="py-2">
                  <span
                    className="inline-block h-6 w-10 rounded-sm border border-qx-line"
                    style={{ backgroundColor: c.hex }}
                  />
                </td>
                <td className="py-2 text-qx-white">{c.token}</td>
                <td className="py-2 text-qx-grey">{c.hex}</td>
                <td className="py-2 text-qx-grey">{ratio.toFixed(2)}:1</td>
                <td
                  className="py-2"
                  style={{ color: passes ? 'var(--qx-green)' : '#ff5c5c' }}
                >
                  {label}
                </td>
                <td className="py-2 font-body text-qx-grey">{c.use}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-2xs text-qx-grey">
        Text tokens are checked against 4.5:1 (WCAG 1.4.3), UI tokens against 3:1 (1.4.11).
        Surfaces are backgrounds and have no requirement against themselves. --qx-line is
        decorative and is never the sole indicator of anything.
      </p>

      <h2 className="mt-7 text-lg">Type scale</h2>
      <div className="mt-3 space-y-3">
        {TYPE.map((t) => (
          <div key={t.name} className="flex items-baseline gap-4 border-b border-qx-line/60 pb-3">
            <span className="w-24 shrink-0 font-mono text-2xs text-qx-grey">{t.name}</span>
            <span className={`${t.cls} ${t.family} truncate`}>Qavyx builds product</span>
          </div>
        ))}
      </div>

      <h2 className="mt-7 text-lg">Families</h2>
      <div className="mt-3 space-y-3 text-md">
        <p className="font-display">Display — Outfit (stand-in for Satoshi)</p>
        <p className="font-body">Body — Inter</p>
        <p className="font-mono">Mono — JetBrains Mono 01 / 05</p>
      </div>
    </main>
  );
}
