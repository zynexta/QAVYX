import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ONE COLUMN, and the rules that keep it one.
 *
 * `--qx-shell` is the width every section, the footer and the header row are
 * laid out in. Before it existed the value was written out nine times as
 * `max-w-5xl` and once, in `Footer`, as `max-w-7xl` — so the footer was 256px
 * wider than every section above it on the same page, which reads as a rendering
 * fault rather than as a decision. Nothing pointed that out because nothing
 * could: ten literals in ten files have no relationship a compiler can see.
 *
 * The token also has a STEP — 64rem, then 80rem from 1280px — and that is the
 * part with real consequences elsewhere. Three layout decisions in this project
 * were measured against a 1024px column (`LaunchStatic`'s three-across
 * arithmetic, `ServicePanel`'s `lg` boundary, `HeroStatic`'s poster ceiling), so
 * the step lands on a breakpoint and leaves every one of them untouched below
 * it.
 */

import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Every `.tsx` under `components/` and `app/`, minus the dev-only lab pages. */
function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry === 'node_modules' || entry === '(lab)') continue;
      sources(path, out);
    } else if (entry.endsWith('.tsx')) {
      out.push(path);
    }
  }
  return out;
}

/**
 * COMMENTS ARE NOT CLASSES. Two files name the old literals in prose — the
 * footer's note about having been `max-w-7xl` while every section was 1024, and
 * `HeroStatic`'s derivation of its ceiling from `max-w-5xl` — and both are the
 * record of why the token exists. A tripwire that fired on them would be a
 * tripwire that punished writing the reason down.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

const files = [...sources(join(ROOT, 'components')), ...sources(join(ROOT, 'app'))];
const tokens = readFileSync(join(ROOT, 'styles/tokens.css'), 'utf8');
const config = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf8');

describe('the layout column', () => {
  /**
   * THE TRIPWIRE. A hard-coded Tailwind width on a page container is the thing
   * this token exists to stop, and it is invisible in review — `max-w-5xl` looks
   * exactly like every other utility class on the element.
   *
   * The lab routes are excluded above: they are dev-only pages with no shared
   * shell and no visitor.
   */
  it('is not written out as a literal anywhere', () => {
    const offenders = files
      .filter((path) =>
        /\bmax-w-(?:3|4|5|6|7)xl\b/.test(withoutComments(readFileSync(path, 'utf8'))),
      )
      .map((path) => path.slice(ROOT.length));
    expect(offenders, 'use `max-w-shell`; the width lives in --qx-shell').toEqual([]);
  });

  /**
   * And it is actually USED — the check above passes trivially on a codebase
   * that stopped constraining its containers at all, which would look like the
   * complaint that started this ("too much space down both sides") inverted into
   * full-bleed text.
   */
  it('is applied to the page containers', () => {
    const users = files.filter((path) =>
      readFileSync(path, 'utf8').includes('max-w-[var(--qx-shell)]'),
    );
    expect(users.length).toBeGreaterThanOrEqual(9);
  });

  /**
   * AN ARBITRARY VALUE, NOT A THEME KEY, and that is not a style preference.
   *
   * Registering `maxWidth: { shell: 'var(--qx-shell)' }` is the idiom the rest
   * of this config uses and it was the first attempt. A theme key is compiled
   * only when the config is LOADED, which `next dev` does at startup and not on
   * change — so against a running dev server the class emitted no rule at all,
   * every container computed to `max-width: none`, and the page went full-bleed
   * with nothing in the terminal to explain it. The JIT reads an arbitrary value
   * out of markup it is already watching.
   */
  it('resolves through the token, read straight from the class', () => {
    expect(config).not.toContain('shell:');
    expect(tokens).toMatch(/--qx-shell:\s*64rem/);
    expect(tokens).toMatch(/--qx-shell:\s*80rem/);
    const users = files.filter((path) =>
      readFileSync(path, 'utf8').includes('max-w-[var(--qx-shell)]'),
    );
    expect(users.length).toBeGreaterThanOrEqual(9);
  });

  /**
   * THE ONE VALUE THAT IS WRITTEN TWICE AND HAS TO BE.
   *
   * The step is a media query in `tokens.css`; `xl` is a screen in
   * `tailwind.config.ts`. There is no way to share a single value across the
   * two — a Tailwind screen cannot read a custom property, because the breakpoint
   * has to be known at build time. So they are held together here instead.
   *
   * Out of step, the column would widen at one width while every `xl:` utility
   * in the project switched at another, and the mismatch would show up as a band
   * of viewports where a grid had already gone to its wide layout inside a column
   * that had not yet grown to hold it.
   */
  it('steps at the same width as Tailwind s `xl`', () => {
    const step = tokens.match(/@media \(min-width: (\d+)px\)[\s\S]{0,200}?--qx-shell:\s*80rem/);
    expect(step, 'the 80rem step must sit in a min-width media query').not.toBeNull();
    const screen = config.match(/xl:\s*'(\d+)px'/);
    expect(screen).not.toBeNull();
    expect(step![1]).toBe(screen![1]);
  });

  /**
   * `HeroStatic`'s poster is capped at "the column less its two gutters" so the
   * mark is co-extensive with the card frames below it. That was the literal
   * `56rem` while the column was 1024 at every width, and a literal cannot
   * survive the step — above 1280 it would have left the mark 256px narrower
   * than the cards it is supposed to line up with, on the one path (reduced
   * motion, no JS, crawlers) that has no animation to distract from it.
   */
  it('lets the reduced-motion poster derive its ceiling from the column', () => {
    const hero = readFileSync(join(ROOT, 'components/hero/HeroStatic.tsx'), 'utf8');
    expect(hero).toContain('var(--qx-shell)_-_2_*_var(--qx-space-6)');
    expect(hero).not.toContain('52vw,56rem');
  });
});
