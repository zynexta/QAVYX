/**
 * The visible intro copy: the scroll cue, and — since Phase 10 — the touch
 * path's tap cue. The accessible <h1> "Qavyx" is server-rendered in app/page.tsx
 * (so it is in the initial HTML and needs no motion layer); these are the two
 * cues the intro reveals, and both clear again as the frame expands.
 *
 * The descriptive subhead that used to sit here ("Software and product
 * engineering…") was wrong for the business and has been removed; when approved
 * marketing copy exists it can return as a second `#qx-copy` child with its own
 * reveal tween (see the removed `#qx-subhead` line in git history for the shape).
 *
 * Opacity is owned by GSAP, never set here — so a resize re-render can't clobber
 * a reveal. Centred with text-align, not a transform. #qx-copy is faded as one
 * unit at frame-scale.
 *
 * ## Both strings are UI, not content, and that distinction is the rule
 *
 * `content/` transcribes the client's document and nothing else may write
 * user-facing copy — `PILLAR_CTA_LABEL` is on the blocked list for exactly that
 * reason. "Scroll to explore" has always been the precedent for the other
 * category: an instruction the interface gives about itself, which the client's
 * document has no opinion about because the client's document is not an
 * interface. "Tap to build" is the same string for the same beat on a device
 * with no cursor, and BUILD-PLAN Phase 10's beat table specifies it verbatim.
 */
export function HeroCopy() {
  return (
    <div id="qx-copy" className="pointer-events-none fixed inset-0 z-copy">
      {/* The tap cue sits ABOVE the mark's centre, where the glyph is: it names
          the thing being pulsed, and a caption at the bottom of the screen
          beside the scroll cue would read as a second scroll instruction.
          `bottom-8`'s counterpart on the other side of the lockup, using the
          same one-line mono register.

          `.qx-click-hint` is the whole of its lifecycle. It is set to
          `autoAlpha: 0` in `useHeroTimeline`'s init block along with the button
          and the rings, revealed by `tlClickInviteTouch`, and cleared by the
          single `set(CLICK_HINT_SELECTOR)` in `buildLogoBuild` that every route
          out of the `click` beat passes through — a tap, the 4s timeout, Escape,
          or a scroll gesture. It is never rendered conditionally: it is one node
          for the life of the hero, like everything else on this stage, and on a
          pointer device it is simply a node that is never revealed. */}
      <p
        id="qx-tap-label"
        className="qx-click-hint absolute inset-x-0 top-8 text-center font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey"
      >
        Tap to build
      </p>
      <p
        id="qx-scroll-label"
        className="absolute inset-x-0 bottom-8 text-center font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey"
      >
        Scroll to explore
      </p>
    </div>
  );
}
