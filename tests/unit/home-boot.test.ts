// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HOME_TOP_BOOT } from '@/lib/home-boot';

/**
 * The homepage's pre-paint boot script.
 *
 * IT IS THE ONE PIECE OF SOURCE IN THIS PROJECT THAT NOTHING ELSE CHECKS. It
 * lives inside a template literal, so TypeScript does not type it, eslint does
 * not lint it and prettier does not format it — and it is injected with
 * `dangerouslySetInnerHTML` into the first element of the homepage, where a
 * syntax error is a `SyntaxError` before a single section has been parsed.
 * Running it is the only way to find that out, so these tests run it.
 *
 * They assert BEHAVIOUR rather than text. A test that string-matched
 * `"scrollRestoration='manual'"` would pass on a script that had been minified
 * differently and fail on one that was merely reformatted, which is the wrong
 * way round.
 */

/** Execute the script the way the browser will: as a program, in global scope. */
const run = () => new Function(HOME_TOP_BOOT)();

const withRestoration = (value: string | undefined) => {
  if (value === undefined) {
    // A browser old enough not to implement it at all — the branch the `in`
    // check exists for.
    Reflect.deleteProperty(window.history, 'scrollRestoration');
    return;
  }
  Object.defineProperty(window.history, 'scrollRestoration', {
    value,
    writable: true,
    configurable: true,
  });
};

const withScrollY = (y: number) =>
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });

afterEach(() => {
  vi.restoreAllMocks();
  withRestoration('auto');
  withScrollY(0);
});

describe('HOME_TOP_BOOT', () => {
  it('is syntactically valid JavaScript', () => {
    // The failure this catches is total: the homepage's first script throwing
    // takes the rest of its parse with it.
    expect(() => new Function(HOME_TOP_BOOT)).not.toThrow();
  });

  it('takes scroll restoration off the browser for this entry', () => {
    withRestoration('auto');
    run();
    expect(window.history.scrollRestoration).toBe('manual');
  });

  it('resets a scroll the browser has ALREADY restored', () => {
    // `manual` only prevents a restoration that has not happened yet. On a slow
    // parse the browser can beat this script to it, which is the whole reason
    // the script does not stop at setting the mode.
    withRestoration('auto');
    withScrollY(5495); // the measured restore on a 13815px homepage
    const scrollTo = vi.fn();
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo);

    run();

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('does not touch the scroll when there is nothing to undo', () => {
    // The ordinary case — a cold load at the top. Calling `scrollTo` anyway
    // would be harmless but it would also be a lie about what this does.
    withRestoration('auto');
    withScrollY(0);
    const scrollTo = vi.fn();
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo);

    run();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('cannot throw, whatever the browser does not implement', () => {
    // Degrading to "the visitor lands where they left off" is acceptable.
    // Degrading to a blank page is not, and an unguarded boot script does the
    // second — same reason `REVEAL_BOOT` is wrapped.
    withRestoration(undefined);
    expect(() => run()).not.toThrow();

    vi.spyOn(window, 'scrollTo').mockImplementation(() => {
      throw new Error('scrollTo is unavailable');
    });
    withScrollY(1200);
    expect(() => run()).not.toThrow();
  });
});
