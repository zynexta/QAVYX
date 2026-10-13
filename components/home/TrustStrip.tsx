import { TRUST_GLYPHS } from '@/components/icons';
import { TRUST, TRUST_STRIP } from '@/content/home';
import { reveal, stagger } from '@/lib/reveal';

/**
 * §4 Trust Strip — the client's sentence, with its object set in motion.
 *
 * ## The idea
 *
 * §4 is one sentence: "Trusted by ambitious brands across [six sectors], across
 * India & UAE." It is a claim with a subject, a verb and a list for an object,
 * and the section sets it exactly in that order — the claim, then the six as a
 * band that moves, then the regions. The band IS the object of the sentence, so
 * the layout is not decorating the copy; it is reading it out.
 *
 * That is also what makes this different from `WhoWeServe` two screens below,
 * which chips §10's seven industries in a static grid. Same kind of content,
 * deliberately not the same device — a second chip grid on the same page would
 * be the redundancy. The band is horizontal, hairline-bounded and never at rest;
 * the grid is a block you stop at.
 *
 * ## Nothing here is new copy
 *
 * `TRUST.lead`, `TRUST.sectors` and `TRUST.region` are the sentence cut in
 * three, and `tests/unit/trust-strip.test.ts` asserts they recompose into
 * `TRUST_STRIP` character for character. A sector cannot be added to the band
 * without also appearing in the client's sentence, which is §66 Rule 05 enforced
 * by arithmetic instead of by memory.
 *
 * ## One sentence for a screen reader, not thirteen fragments
 *
 * The visual layer is `aria-hidden` and `TRUST_STRIP` is rendered once,
 * `sr-only`, as an unbroken string. Without that, the accessible reading of this
 * section would be the lead, then six sectors, then SIX MORE (the loop's second
 * copy is real DOM), then the region — a sentence interrupted by its own object,
 * listed twice. Same pattern as `SplitText` and the star ratings in
 * `Testimonials`, and for the same reason.
 *
 * ## Why the band is full-bleed and the type is not
 *
 * The strip is the first thing after a 1015vh pin, and its job is to say the page
 * has changed register: the hero was a fixed layer, this is a document. Two
 * hairlines running the full width of the viewport do that in a way a centred
 * card cannot — they are the page's structure, not this section's border. The
 * copy above and below stays in the `max-w-[var(--qx-shell)]` column every other section uses,
 * so the band reads as passing THROUGH the column rather than as a wider box.
 *
 * The motion, the seamless-loop arithmetic and the reduced-motion collapse all
 * live in `styles/marquee.css`, including why this is the project's second idle
 * loop and what keeps it from being a distraction.
 */

/**
 * One sector, twice.
 *
 * `data-clone` is not styling for its own sake: the reduced-motion block uses it
 * to drop the second copy, and `tests/unit/trust-strip.test.ts` counts on it to
 * tell "the loop has two halves" from "the list was rendered twice by mistake".
 */
function Sector({ label, clone }: { label: string; clone: boolean }) {
  const Glyph = TRUST_GLYPHS[label];

  return (
    <li className="qx-marquee__item" data-clone={clone}>
      <span className="qx-marquee__badge">
        {/* h-4 is 1.5rem here, not Tailwind's 1rem — `tailwind.config.ts` maps
            the spacing scale onto the --qx-space-* tokens. See the note in
            `components/icons`. At 1rem inside a 2.5rem box the glyph read as a
            speck in an empty square; 1.5rem fills it the way the badge implies. */}
        {Glyph ? <Glyph className="h-4 w-4" /> : null}
      </span>
      <span className="qx-marquee__label">{label}</span>
    </li>
  );
}

export function TrustStrip() {
  const track = [
    ...TRUST.sectors.map((label) => ({ label, clone: false })),
    ...TRUST.sectors.map((label) => ({ label, clone: true })),
  ];

  return (
    <section id="qx-trust" className="pt-2 sm:pt-3 lg:pt-4 pb-10 sm:pb-12 lg:pb-14 relative z-20">
      <p className="sr-only">{TRUST_STRIP}</p>

      {/* The reveal TRIGGER wraps all three parts, so the lead, the band and the
          region arrive as one event on three steps rather than as three
          sections that happen to be adjacent. */}
      <div {...reveal} aria-hidden="true">
        <p
          data-rv
          className="mx-auto max-w-[var(--qx-shell)] px-4 text-center font-display text-lg tracking-[-0.02em] text-qx-white md:px-6 md:text-xl"
        >
          {TRUST.lead}
        </p>

        <div data-rv style={stagger(1)} className="qx-marquee mt-5">
          <ul className="qx-marquee__track">
            {track.map((item, index) => (
              <Sector key={`${item.label}-${index}`} label={item.label} clone={item.clone} />
            ))}
          </ul>
        </div>

        {/* The sentence finishes here, and the brand's one accent lands on the
            half of it that is the actual differentiator: two markets, named. */}
        <p
          data-rv
          style={stagger(2)}
          className="mx-auto mt-4 max-w-[var(--qx-shell)] px-4 text-center font-mono text-2xs uppercase tracking-[0.28em] text-qx-green md:px-6"
        >
          {TRUST.region}
        </p>
      </div>
    </section>
  );
}
