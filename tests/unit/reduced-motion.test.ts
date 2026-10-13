// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * `useReducedMotion` is three-state, and the third state is the entire point of
 * it. These tests exist to stop someone "simplifying" it back to a boolean.
 *
 * The behaviour worth protecting is not "it reports the media query" — that part
 * is obvious and would survive any rewrite. It is that the FIRST render returns
 * `null` rather than `false`. `HeroMount` gates a `next/dynamic(ssr:false)`
 * component, which is `React.lazy`, whose loader runs in the RENDER phase and
 * fires the webpack chunk request. A hook that returns `false` first therefore
 * downloads ~62 KB of GSAP + Lenis for a visitor who asked for no motion, one
 * commit before the effect can unmount it — and unmounting does not cancel an
 * in-flight request. `seen[0]` below is that guarantee, and nothing in the e2e
 * suite can express it as cheaply.
 *
 * No @testing-library: React 19 exports `act`, and the hook only needs a probe
 * component that records what it was returned. Rendered through
 * `React.createElement` so this file stays `.ts` and inside the unit suite's
 * `tests/unit/**\/*.test.ts` include pattern.
 */

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

interface MediaStub {
  /** Flip the query and notify every registered `change` listener, as the OS does. */
  set(matches: boolean): void;
  /** How many listeners are still attached — the cleanup assertion. */
  listenerCount(): number;
}

function installMatchMedia(matches: boolean): MediaStub {
  const listeners = new Set<() => void>();
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_type: string, listener: () => void) => void listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => void listeners.delete(listener),
    dispatchEvent: () => false,
  };
  // `as unknown as MediaQueryList`, the same double cast tests/setup.ts uses:
  // the real interface's addEventListener is an overloaded generic over
  // MediaQueryListEventMap, and a stub narrow enough to be readable can never
  // be structurally comparable to it.
  window.matchMedia = ((query: string) => {
    mql.media = query;
    return mql as unknown as MediaQueryList;
  }) as typeof window.matchMedia;

  return {
    set(next) {
      mql.matches = next;
      listeners.forEach((l) => l());
    },
    listenerCount: () => listeners.size,
  };
}

/** Every value the hook has returned, in render order. */
let seen: (boolean | null)[] = [];
let container: HTMLDivElement;
let root: Root;

function Probe() {
  seen.push(useReducedMotion());
  return null;
}

const render = () => act(() => void root.render(createElement(Probe)));
const last = () => seen[seen.length - 1];

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  seen = [];
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});

describe('useReducedMotion', () => {
  it('returns null on the first render, before any effect has run', () => {
    installMatchMedia(true);
    render();

    // THE ASSERTION THIS FILE EXISTS FOR. Not `toBeFalsy()` — `false` is falsy
    // and `false` is the bug: it renders the motion branch, which fires
    // React.lazy's loader and downloads the chunk this path must never fetch.
    expect(seen[0]).toBeNull();
  });

  it('resolves to true when the query matches', () => {
    installMatchMedia(true);
    render();
    expect(last()).toBe(true);
  });

  it('resolves to false when the query does not match', () => {
    installMatchMedia(false);
    render();
    expect(last()).toBe(false);
  });

  it('updates when the OS setting is toggled with the page open', () => {
    const mq = installMatchMedia(false);
    render();
    expect(last()).toBe(false);

    act(() => mq.set(true));
    expect(last()).toBe(true);

    act(() => mq.set(false));
    expect(last()).toBe(false);
  });

  it('removes its change listener on unmount', () => {
    const mq = installMatchMedia(false);
    render();
    expect(mq.listenerCount()).toBe(1);

    act(() => root.unmount());
    expect(mq.listenerCount()).toBe(0);

    // afterEach unmounts again; React tolerates it, and re-rooting here would
    // hide a real double-unmount bug rather than expose one.
    root = createRoot(document.createElement('div'));
  });

  it('settles to false rather than staying null when matchMedia is missing', () => {
    // A browser too old for matchMedia (or jsdom without the setup shim) must
    // get the motion path, not a permanently pending hero: `null` renders
    // NEITHER branch, so stranding there would mean no hero at all.
    // @ts-expect-error — deliberately removing a required global for this case.
    delete window.matchMedia;
    render();
    expect(seen[0]).toBeNull();
    expect(last()).toBe(false);
  });
});
