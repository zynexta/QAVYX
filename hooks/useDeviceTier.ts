'use client';

import { useEffect, useState } from 'react';

/**
 * What kind of machine this is, as far as the hero is concerned: is there a real
 * pointer, and can it afford the expensive layers.
 *
 * ## Two questions, and they are not derivable from each other
 *
 *   fine    is there a real pointer (a touchscreen laptop has BOTH)
 *   tier    can this machine afford the glow and the panel cross-fade
 *
 * A phone is `fine: false, tier` either way. A cheap Android tablet is
 * `fine: false, tier: 'low'`; a flagship one is `fine: false, tier: 'high'`.
 * A touchscreen laptop is `fine: true` and gets the full pointer experience with
 * touch still working, which is one of Phase 10's acceptance criteria. Nothing
 * here is expressible as one boolean, which is the same warning BUILD-PLAN
 * Phase 10 gives about reduced motion and viewport size: "two branches, not one
 * flag".
 *
 * ## What this hook does NOT decide
 *
 * It does not decide whether the motion layer mounts. Phase 10 had a third field
 * here — `pinned`, false below 768 x 620 — and it was reverted on the client's
 * direction: a phone gets the same scrolling experience as a desktop. The one
 * mount gate is `prefers-reduced-motion`, in `HeroMount`, which is also where a
 * size branch would have to go if one is ever wanted again.
 *
 * That is why this hook is called from `HeroSection` and not from `HeroMount`.
 * The distinction matters for one reason: `HeroMount` gates a `React.lazy`
 * boundary, and anything read there delays the chunk request by a commit. Read
 * one level down, this costs nothing — `HeroSection` already returns `null`
 * until `useViewport` resolves in its own effect, so the screen is black for
 * that tick either way.
 *
 * ## It still returns `null` until it has measured
 *
 * Same discipline as `useReducedMotion` and `useViewport`, for a smaller stake:
 * `fine` decides which of two intros a visitor gets, and guessing it would run
 * the wrong one for a commit and then swap mid-beat. `null` renders neither.
 * `tests/unit/device-tier.test.ts` asserts the first emitted value is `null` and
 * not merely falsy, because an object with `fine: false` is truthy in the one
 * way that matters — it would render a branch.
 *
 * ## `fine` LISTENS; `tier` is read once
 *
 * A pointer can be plugged into a tablet with the page open. `tier` cannot
 * change and is computed once, per BUILD-PLAN's performance note.
 */

export type Tier = 'high' | 'low';

export interface DeviceTier {
  /**
   * `any-pointer: fine` — SOME pointing device on this machine is precise.
   *
   * NOT `hover: hover` and not `pointer: fine`. A touchscreen laptop reports
   * `pointer: coarse` when the touchscreen is the primary input while still
   * having a trackpad, and BUILD-PLAN lists "assuming `hover: hover` means
   * desktop" as one of this phase's common mistakes. `any-pointer` asks whether
   * a precise pointer exists at all, which is the question Engine 1 actually has:
   * is there something for the cursor glyph to follow?
   */
  fine: boolean;
  /** Whether this machine gets the expensive layers. See `classifyTier`. */
  tier: Tier;
}

/**
 * Device tier from the two hints that exist, as a pure function so it can be
 * tested without a browser.
 *
 * `deviceMemory` is Chromium-only and undefined everywhere else; BUILD-PLAN's
 * performance note takes that head-on — "the `?? 4` default means Safari reads
 * as high tier, which is acceptable for the target devices". It is the right
 * default in both directions: iOS devices in the support window are fast, and
 * guessing LOW would silently strip the glow from every Mac and iPhone on the
 * strength of a missing API.
 *
 * 4 GB / 4 cores is the Moto G class the plan names as the low-tier test device.
 * Either hint being under the bar is enough — a 2 GB machine with 8 cores cannot
 * hold two WebGL contexts however many cores it has.
 */
export function classifyTier(hints: {
  deviceMemory?: number;
  hardwareConcurrency?: number;
}): Tier {
  const memory = hints.deviceMemory ?? 4;
  const cores = hints.hardwareConcurrency ?? 4;
  return memory < 4 || cores < 4 ? 'low' : 'high';
}

export function useDeviceTier(): DeviceTier | null {
  const [device, setDevice] = useState<DeviceTier | null>(null);

  useEffect(() => {
    // Optional-chained for the reason every matchMedia in this project is:
    // jsdom in the unit suite has no matchMedia unless a test installs one.
    const mq = window.matchMedia?.bind(window);
    const nav = navigator as Navigator & { deviceMemory?: number };
    const tier = classifyTier({
      deviceMemory: nav.deviceMemory,
      hardwareConcurrency: nav.hardwareConcurrency,
    });

    if (!mq) {
      // No matchMedia at all is not a touch device, it is a test environment.
      // Fall to the pointer reading rather than silently running the touch
      // intro for everyone whose browser this code cannot interrogate.
      setDevice({ fine: true, tier });
      return;
    }

    const fine = mq('(any-pointer: fine)');
    const apply = () => setDevice({ fine: fine.matches, tier });
    apply();

    fine.addEventListener('change', apply);
    return () => fine.removeEventListener('change', apply);
  }, []);

  return device;
}
