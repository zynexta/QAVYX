import { CustomEase, gsap } from './gsap';

/**
 * Three eases, no more. Each maps to a kind of statement the motion is making;
 * if a new movement does not fit one of them, that is a signal the movement
 * itself needs rethinking rather than that a fourth curve is needed.
 *
 * No elastic, no back, no bounce anywhere in this project. Overshoot reads as
 * personality-for-its-own-sake and fights the precision the mark implies.
 *
 * Timing doctrine:
 *   confirmation  <= 120ms   must feel instant
 *   transition    300-600ms
 *   construction  600-1000ms the user should watch it happen
 */

export const EASE = {
  /** Fast departure, long settle. Entrances, the travel path, the expansion. */
  out: 'qx.out',
  /** Symmetric, mechanical. Morph, frame exit, carousel steps. */
  inOut: 'qx.inOut',
  /** Immediate, no overshoot. Click confirmation, button flash. */
  snap: 'qx.snap',
} as const;

export type EaseName = (typeof EASE)[keyof typeof EASE];

const DEFINITIONS: ReadonlyArray<readonly [string, string]> = [
  [EASE.out, 'M0,0 C0.16,1 0.3,1 1,1'],
  [EASE.inOut, 'M0,0 C0.65,0 0.35,1 1,1'],
  [EASE.snap, 'M0,0 C0.3,0 0.1,1 1,1'],
];

let created = false;

/**
 * Idempotent. Safe to call from more than one entry point; the guard exists
 * because re-creating a CustomEase invalidates timelines already referencing
 * it by name.
 */
export function registerEases(): void {
  if (created) return;
  for (const [name, path] of DEFINITIONS) {
    if (!gsap.parseEase(name)) CustomEase.create(name, path);
  }
  created = true;
}

// Client only: CustomEase is registered in motion/gsap.ts behind the same window
// guard, so calling this during SSR would warn "registerPlugin(CustomEase)" and
// create nothing useful — the eases are only ever parsed at animation time.
if (typeof window !== 'undefined') registerEases();
