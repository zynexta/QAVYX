/**
 * Bundle budget gate (TDD §12: initial route JS <= 165 KB gzip).
 *
 * Deliberately not size-limit with a glob. Globbing .next/static/chunks/ sums
 * every chunk of every route (240 kB here) rather than what the browser
 * actually downloads for "/" (103 kB) — a gate that false-alarms on day one is
 * one people learn to ignore. This reads Next's own build manifest, so the
 * number matches the "First Load JS" column printed by `next build`.
 */
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BUDGET_KB = 165;
const ROUTE = '/page';
const DIST = '.next';

const manifest = JSON.parse(readFileSync(join(DIST, 'app-build-manifest.json'), 'utf8'));
const files = (manifest.pages[ROUTE] ?? []).filter((f) => f.endsWith('.js'));

if (files.length === 0) {
  console.error(`✗ No JS chunks found for route "${ROUTE}". Did you run \`pnpm build\`?`);
  process.exit(1);
}

let total = 0;
const rows = files.map((file) => {
  const bytes = gzipSync(readFileSync(join(DIST, file))).length;
  total += bytes;
  return { file: file.replace('static/chunks/', ''), kb: bytes / 1024 };
});

rows.sort((a, b) => b.kb - a.kb);
for (const { file, kb } of rows) {
  console.log(`  ${kb.toFixed(1).padStart(7)} kB  ${file}`);
}

const totalKb = total / 1024;
const pct = Math.round((totalKb / BUDGET_KB) * 100);
console.log(`  ${'—'.repeat(9)}`);
console.log(`  ${totalKb.toFixed(1).padStart(7)} kB  first load, route "/"  (${pct}% of ${BUDGET_KB} kB)`);

if (totalKb > BUDGET_KB) {
  console.error(`\n✗ Over budget by ${(totalKb - BUDGET_KB).toFixed(1)} kB.`);
  process.exit(1);
}
console.log(`\n✓ Within budget. ${(BUDGET_KB - totalKb).toFixed(1)} kB of headroom.`);
