import { renderToStaticMarkup } from 'react-dom/server';
import { createElement, useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { classifyTier, useDeviceTier, type DeviceTier } from '@/hooks/useDeviceTier';

/**
 * `useDeviceTier` — which intro a visitor gets, and which layers they pay for.
 *
 * Two jobs:
 *
 *  1. `classifyTier` is a pure function of two navigator hints, so the whole of
 *     the tier policy is testable with no DOM at all.
 *  2. The first value it ever emits is `null`, and NOT MERELY FALSY. An object
 *     with `fine: false` is truthy in the one way that matters — it would render
 *     a branch — so a guessed default runs the wrong intro for a commit and then
 *     swaps mid-beat. Same discipline as `useReducedMotion`, which documents the
 *     more expensive version of this trap at length.
 *
 * IT DOES NOT DECIDE WHETHER THE HERO MOUNTS. Phase 10 briefly had a `pinned`
 * field here that suppressed the motion layer below 768 x 620; it was reverted
 * on the client's direction, so there is nothing about viewport size to test and
 * `HeroMount`'s one gate is still the motion preference.
 */

describe('classifyTier — the tier policy, as arithmetic', () => {
  it('is high when both hints clear the bar', () => {
    expect(classifyTier({ deviceMemory: 8, hardwareConcurrency: 8 })).toBe('high');
    expect(classifyTier({ deviceMemory: 4, hardwareConcurrency: 4 })).toBe('high');
  });

  it('is low when EITHER hint is under it', () => {
    // Not an `&&`: a 2 GB machine cannot hold two WebGL contexts however many
    // cores it has, and a 2-core one cannot run their ticker callbacks however
    // much memory it has.
    expect(classifyTier({ deviceMemory: 2, hardwareConcurrency: 8 })).toBe('low');
    expect(classifyTier({ deviceMemory: 8, hardwareConcurrency: 2 })).toBe('low');
    expect(classifyTier({ deviceMemory: 2, hardwareConcurrency: 2 })).toBe('low');
  });

  it('defaults a MISSING hint to high, deliberately', () => {
    // `deviceMemory` is Chromium-only. BUILD-PLAN Phase 10 takes this head-on:
    // "the `?? 4` default means Safari reads as high tier, which is acceptable
    // for the target devices". Guessing LOW would strip the glow from every Mac
    // and iPhone on the strength of a missing API.
    expect(classifyTier({})).toBe('high');
    expect(classifyTier({ hardwareConcurrency: 8 })).toBe('high');
    // ...but a present-and-under hint still wins over the other's default.
    expect(classifyTier({ hardwareConcurrency: 2 })).toBe('low');
    expect(classifyTier({ deviceMemory: 1 })).toBe('low');
  });
});

/**
 * A one-render probe, the same shape `reduced-motion.test.ts` uses: render the
 * hook on the server, where no effect can run, and record what it returned.
 *
 * `renderToStaticMarkup` never commits, so `useEffect` never fires — which is
 * exactly the render React.lazy would have run its loader in.
 */
describe('useDeviceTier — the pending state', () => {
  it('returns null on the first render, not a guessed device', () => {
    const seen: (DeviceTier | null)[] = [];
    function Probe() {
      seen.push(useDeviceTier());
      // Present only to make the point explicit: nothing here has run yet.
      useEffect(() => {}, []);
      return null;
    }
    renderToStaticMarkup(createElement(Probe));

    expect(seen).toHaveLength(1);
    // `toBeNull`, not `toBeFalsy`. An object with `fine: false` is falsy in none
    // of the ways that matter and truthy in the one that does — it renders a
    // branch, which here means running the touch intro on a desktop.
    expect(seen[0]).toBeNull();
  });

  it('never touches matchMedia during render', () => {
    // The measurement must be in the effect. Reading matchMedia in the render
    // body would work in a browser and throw on the server, and the server is
    // where this component's first render happens.
    const spy = vi.fn();
    const original = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = { matchMedia: spy };
    try {
      function Probe() {
        useDeviceTier();
        return null;
      }
      renderToStaticMarkup(createElement(Probe));
      expect(spy).not.toHaveBeenCalled();
    } finally {
      (globalThis as { window?: unknown }).window = original;
    }
  });
});
