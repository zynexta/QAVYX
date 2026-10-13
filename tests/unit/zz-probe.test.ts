// @vitest-environment jsdom
import { describe, it } from 'vitest';
import { appendFileSync } from 'node:fs';
import { buildExpandTimeline } from '@/motion/timelines/expandTimeline';
import { PIN_A } from '@/motion/scrollBudget';
import { atReady, mountStage, unmountStage } from './helpers/stage';

function dump(root: Element, label: string) {
  const out: string[] = [`--- ${label} ---`];
  const layer = document.getElementById('qx-launch-layer')!;
  // `getElementById` already returns an HTMLElement, which has `.style` — the
  // `as any` casts that were here were the only two lint errors in the repo, and
  // they were blocking `pnpm verify` on a file that asserts nothing.
  out.push(`layer style: vis=${layer.style.visibility} op=${layer.style.opacity}`);
  for (const el of Array.from(root.querySelectorAll('*'))) {
    const id = (el as Element).id || (el as Element).getAttribute('class') || el.tagName;
    const attrs = ['transform','opacity','r','stroke-dasharray','fill','stroke']
      .map((a) => (el.hasAttribute(a) ? `${a}="${el.getAttribute(a)}"` : ''))
      .filter(Boolean)
      .join(' ');
    out.push(`  ${el.tagName}#${id} ${attrs}`);
  }
  try {
    appendFileSync('/tmp/qxprobe.txt', out.join('\n') + '\n');
  } catch {
    // optional debug probe log, ignore if /tmp doesn't exist
  }
}

describe('probe', () => {
  it('dumps', () => {
    const refs = mountStage();
    atReady(refs);
    const tl = buildExpandTimeline(refs);
    const L = (f: number) => PIN_A.at('launch', f);
    for (const [label, p] of [
      ['title held', PIN_A.at('title', 0.25)],
      ['launch 0', PIN_A.startOf('launch')],
      ['launch 0.001', L(0.001)],
      ['launch 0.02', L(0.02)],
      ['launch 0.075', L(0.075)],
      ['launch 0.2', L(0.2)],
      ['launch 0.45', L(0.45)],
      ['launch 0.6', L(0.6)],
      ['launch 1', 1],
    ] as [string, number][]) {
      tl.progress(0).progress(p);
      dump(refs.launchLayer, `${label} (pin p=${p.toFixed(5)})`);
    }
    // Now the stale-state trace: forward to 0.45, then jump back to exactly t=0.
    tl.progress(0).progress(L(0.45));
    tl.progress(PIN_A.startOf('launch'));
    dump(refs.launchLayer, 'JUMP BACK to launch t=0 after 0.45');
    unmountStage();
  });
});
