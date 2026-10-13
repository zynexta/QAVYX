import { Fragment } from 'react';
import { SPLIT_CHAR_CLASS } from '@/types/hero';

/**
 * A line of type, split into per-character spans for something else to animate.
 *
 * It animates nothing itself. It is the DOM half of a reveal whose timing lives
 * wherever the reveal does — for the title card that is
 * `motion/timelines/titleTimeline.ts`, driven off the pin's scrubbed proxy like
 * every other segment.
 *
 * ## The spans are INLINE, and that is the whole trick
 *
 * Every per-character text effect reaches for `display: inline-block` on each
 * span, because that is what `transform` needs. This one animates only `opacity`
 * and `filter`, and both apply to an inline box — so the spans can stay inline
 * and the line lays out byte-identically to the plain string it replaced. No
 * lost kerning between pairs, no re-wrap at a different viewport, no
 * `white-space: nowrap` word wrappers to stop a word breaking mid-way, and no
 * CSS of its own at all.
 *
 * That is also why this does not need the caveat `styles/motion.css` records
 * against SplitText — "it multiplies the DOM, and it has to be reverted on
 * unmount or it leaves a screen reader reading a headline one character at a
 * time". The DOM is multiplied, but see below.
 *
 * ## The accessible copy is the real one
 *
 * The split layer is `aria-hidden` and the string is rendered ONCE more,
 * `sr-only`, as an unbroken text node. A screen reader gets the sentence; the
 * spans are decoration it never sees. Same pattern as the star rating in
 * `components/projects/Testimonials.tsx`, and it is what keeps
 * `phase8e-title-card.spec.ts`'s `toContainText` addressing a real, unsplit
 * copy of the client's line rather than twenty-two characters and a guess about
 * how Playwright normalises whitespace.
 *
 * ## `[...word]`, not `word.split('')`
 *
 * `split('')` cuts on UTF-16 code units, so it halves any character outside the
 * BMP into two orphaned surrogates that render as tofu. Spreading iterates code
 * points. No string in `content/` needs that today; the next one might, and this
 * is the kind of bug that ships because the test data was all ASCII.
 */
export function SplitText({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ');

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className={className}>
        {words.map((word, wordIndex) => (
          <Fragment key={`${wordIndex}-${word}`}>
            {[...word].map((char, charIndex) => (
              <span key={charIndex} className={SPLIT_CHAR_CLASS}>
                {char}
              </span>
            ))}
            {/* A real space between words, so the browser breaks the line
                exactly where it did before. It is outside the char spans on
                purpose: a space carrying its own blur is a space with a visible
                halo. */}
            {wordIndex < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
    </>
  );
}
