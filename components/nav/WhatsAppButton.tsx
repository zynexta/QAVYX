import { WHATSAPP } from '@/content/site';
import { WhatsAppGlyph } from './WhatsAppGlyph';
import { WhatsAppLink } from './WhatsAppLink';

/**
 * The floating chat button — the draft's "10 · WhatsApp Button (Global
 * Element)": fixed bottom-right, on every page, desktop and mobile.
 *
 * Three of the draft's four behaviour notes are met by `WhatsAppLink` (one
 * number, one pre-filled message, WhatsApp Web on desktop / the app on mobile).
 * This component owns the fourth: "slight bounce/pulse animation on first page
 * load to draw attention, then settles to static".
 *
 * That animation is a finite CSS keyframe — three iterations, then done — and
 * NOT an idle loop. The distinction is the project's governing motion rule:
 * there is exactly one idle loop in the whole piece (the breathing dot in the
 * intro) and a second one pulsing forever in the corner of every page would
 * both break that and be the kind of decoration the rule exists to stop. Three
 * pulses is *discovery*, which is a named category; a permanent pulse is not.
 * `prefers-reduced-motion` removes it entirely via the global rule in
 * `app/globals.css`.
 *
 * "Should not obstruct the mobile CTA button or footer content" is handled by
 * the `--qx-float-*` tokens: this button's size and inset are declared there,
 * and `Footer` reserves `--qx-float-reserve` as bottom padding from the same
 * three values. Change the size or the inset here in classes rather than in the
 * tokens and the footer stops knowing how much room to leave — see the note in
 * `styles/tokens.css`.
 *
 * The mark is the official WhatsApp glyph — see `WhatsAppGlyph` for the
 * trademark note and for why it is a filled path rather than a stroked one.
 *
 * ## No container — the glyph floats on its own
 *
 * It sat in a 3rem circle: `rounded-full`, a `--qx-green-dim` ring and a
 * `--qx-black` fill. The ring was the problem. A hairline circle around a
 * hairline bubble is two concentric outlines a few pixels apart, and at 48px
 * they read as one muddy shape rather than as an icon in a button — the site's
 * one round element on a page built entirely from 20px-radius rectangles and
 * straight rules.
 *
 * THE BUTTON DID NOT GET SMALLER. Its box is still `--qx-float-size`, so the
 * 48px target and the footer's `--qx-float-reserve` clearance are untouched; only
 * the paint is gone. The fill went with the ring rather than being kept as an
 * invisible black square: everything this floats over is `--qx-black` already,
 * and the one thing it could occlude is a section frame's stroke.
 *
 * It DOES cross that stroke now, which the bubble did not — an outline whose gap
 * fell across the frame's edge has been replaced by a solid mark that covers a
 * few pixels of it on a wide viewport. Left alone rather than nudged inward: the
 * frame's right edge is drawn in green and so is the mark, so what meets there is
 * one colour, and moving the button would move `--qx-float-right`, which the
 * footer's reserve is derived from.
 *
 * With no background to darken, hover has to be carried by the mark itself. It
 * was the STROKE — this site's own vocabulary, the thing `.qx-index-row` and the
 * severed rule are made of — and the official glyph is a filled shape with no
 * stroke to thicken, so it is a small scale now. Same reading either way: the
 * target is 48px whatever the paint does, and nothing reflows, because a
 * `transform` on the glyph is out of flow by definition.
 */

export function WhatsAppButton() {
  return (
    <WhatsAppLink
      ariaLabel={WHATSAPP.label}
      className="qx-whatsapp group fixed bottom-[var(--qx-float-bottom)] right-[var(--qx-float-right)] z-float flex h-[var(--qx-float-size)] w-[var(--qx-float-size)] items-center justify-center text-qx-green"
    >
      {/* SIZE THIS AGAINST THE TOKEN SCALE, NOT AGAINST TAILWIND'S.
          `tailwind.config.ts` remaps `spacing` 1-7 onto `--qx-space-*`, so the
          numbers here are not the ones the class names usually mean:

              h-4 -> --qx-space-4 -> 1.5rem -> 24px
              h-5 -> --qx-space-5 -> 2.5rem -> 40px
              h-6 -> --qx-space-6 -> 4rem   -> 64px

          `h-6` was a real bug: a 64px glyph inside a 48px button, overflowing
          `--qx-float-size` by 8px on every side and putting its stroke outside
          the strip the footer reserves with `--qx-float-reserve`. But `h-4`
          overcorrected. 24-in-48 is the proportion for an icon sitting INSIDE a
          filled button, and the ring and fill came off in the same edit — so the
          mark went from 64px to 24px with nothing left around it, and read as a
          stray hairline rather than as a control.

          A bare glyph has to BE the button, which means most of the target
          rather than half of it. `h-5` — 40px — was that, back when the bubble
          was stroked: its path stopped short of the viewBox on every side, so a
          40px box drew a ~31px mark with ~8px of air inside it.

          THE OFFICIAL MARK RUNS EDGE TO EDGE. Same 40px box, and the drawn shape
          is 40px rather than 31 — a third bigger overnight, hard against the
          corner it floats in. 34px is the box that puts the mark back at the
          size the eye had already settled on, with the 7px of clearance the old
          one had. The target and the footer's `--qx-float-reserve` clearance are
          `--qx-float-size` either way and are untouched by this.

          THE HEADER'S COPY IS SMALLER AND THAT IS CORRECT — see
          `components/nav/SiteHeader.tsx`. This one is a bare glyph that has to
          read as a control on its own; that one sits in a row of controls with a
          frame around it, which is the case the smaller proportion was right for
          all along. */}
      <WhatsAppGlyph className="h-[2.125rem] w-[2.125rem] transition-transform duration-200 ease-out group-hover:scale-110" />
    </WhatsAppLink>
  );
}
