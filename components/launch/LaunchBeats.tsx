import { FAILURE_MODES } from '@/content/launch';

/**
 * The launch's labels: what each burning prop IS.
 *
 * ## Why this exists
 *
 * Without it the pin spends 320vh — three screens — showing four anonymous
 * panels tearing off a rocket, and the strings that say what they mean
 * (`LaunchStatic`, §5) are a screen further down, read after the animation is
 * gone. The client's direction for this section is that the props "represent
 * failed ideas, wasted money, poor campaigns, unprofessional execution", and
 * representing something requires the viewer to be told what it is. This is
 * what turns the sequence from an illustration into the argument being made.
 *
 * ## The waypoints are deliberately UNLABELLED
 *
 * They carry §7's Strategy / Execution / Automation, and they were captioned
 * here at first. The captions came out: three words parked up the middle of
 * the climb competed with the four that are actually moving, and the growth
 * framework is a thing to READ — three names with a sentence each — not three
 * words to glimpse. It has that, in full, in `LaunchStatic` directly below.
 * The dots still light in order, which is the beat; naming them is the
 * document's job.
 *
 * ## It invents nothing
 *
 * Every string is `content/launch.ts`, which is the client's own §5. That
 * file's contract is that the animation may not add a claim — if a fifth
 * failure mode ever appears on screen it appears there first, and the list
 * below is mapped, never typed out.
 *
 * ## DOM, not SVG
 *
 * `#qx-stage` is `aria-hidden`, so text inside it would be invisible to a
 * reader. This is a fixed sibling of the pin exactly as `LaunchTitle` is, and
 * it inherits all three of that file's load-bearing rules:
 *
 * 1. **`pointer-events: none`** — a full-viewport fixed element that eats
 *    clicks on every section below the pin otherwise.
 * 2. **Opacity is GSAP's, never set here** — a `style` opacity would be
 *    re-asserted by every resize re-render and fight the scrub.
 * 3. **It must be CLEARED** — `addLaunchSegment` fades this layer on the same
 *    `launchLayerOpacity` curve as the rocket, so the pin releases onto a clean
 *    page. Anything left painted covers the whole site below it.
 *
 * ## `aria-hidden`, deliberately
 *
 * These same four strings are already in the document below, in full sentences
 * with their bodies, server-rendered by `LaunchStatic`. Exposing them here too
 * would make a screen reader announce every failure mode twice, the second time
 * as a bare fragment with no context. The document is the accessible version;
 * this is the picture of it.
 *
 * ## Class names
 *
 * `qx-beat-*`, which nothing else uses. `LaunchStatic` ships the same content
 * on every response, so a class shared with it would be double-counted by the
 * unscoped e2e locators — the trap that already caught `.qx-panel` when the
 * static service list started shipping beside the carousel.
 */

export function LaunchBeats() {
  return (
    <div
      id="qx-launch-beats"
      aria-hidden="true"
      className="pointer-events-none invisible fixed inset-0 z-copy"
    >
      {/*
        The four failures, each riding the prop it names.

        Positioned by the timeline, not here: a prop is thrown on a ballistic
        arc and its label goes with it, so both are written from the same
        `launchDebris` call in the same frame. Left at the origin until then.
      */}
      {FAILURE_MODES.map((m) => (
        <p
          key={m.id}
          className="qx-beat-prop absolute left-0 top-0 whitespace-nowrap font-mono text-2xs uppercase tracking-mono text-qx-grey opacity-0"
        >
          {m.label}
        </p>
      ))}
    </div>
  );
}
