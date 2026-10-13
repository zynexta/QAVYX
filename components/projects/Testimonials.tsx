import { StarIcon } from '@/components/icons';
import { EYEBROW } from '@/components/inner/InnerPage';
import { TESTIMONIALS, TESTIMONIALS_HEADING, type Testimonial } from '@/content/projects';
import { reveal, stagger } from '@/lib/reveal';

/**
 * §56 Client Testimonials — built, and rendering nothing.
 *
 * `TESTIMONIALS` is empty, so this returns `null`. §69 lists testimonials among
 * the assets the client must still supply.
 *
 * ## §56's placeholder is not in the data, and that is deliberate
 *
 * §56 supplies a quote — "Working with QAVYX helped us improve our online
 * presence and generate quality leads." — with its own note attached: "Do not
 * present it as a verified client testimonial unless a real client has approved
 * it."
 *
 * It is not stored as a row with `approved: false`, because that leaves an
 * unattributed quote one boolean away from being live. Instead
 * `Testimonial.attribution` is REQUIRED: the placeholder cannot be added without
 * inventing a client, which is the moment §66 Rule 05 says to stop. And when a
 * real client does approve a quote it arrives with their name on it, so the
 * approved version is a different string rather than this one with a flag
 * flipped. The placeholder is transcribed as a comment in `content/projects.ts`
 * for the record.
 *
 * ## The rating is drawn, and it is a scale rather than a count
 *
 * §56 writes it as ⭐⭐⭐⭐⭐. That shipped as `'⭐'.repeat(rating)` and it was
 * wrong three ways over: an emoji is a font glyph, so it is announced five times
 * by one screen reader and dropped entirely by another; it renders in the
 * platform's own orange on every OS, which is the one colour outside this
 * site's palette; and `repeat` draws only the stars that were earned, so a 4/5
 * looks exactly like a 4/4 with nothing to measure it against.
 *
 * `StarIcon` fixes all three. Five are always drawn — `rating` of them filled,
 * the rest as hairline outlines — so the denominator is visible, they are
 * `currentColor` like every other mark on the site, and the whole row is
 * `aria-hidden` behind one `sr-only` sentence.
 */
export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section
      aria-labelledby="qx-testimonials"
      {...reveal}
      className="qx-frame mt-6 px-4 pb-6 pt-5 sm:px-6 lg:px-7"
    >
      <h2 id="qx-testimonials" data-rv className={EYEBROW}>
        {TESTIMONIALS_HEADING}
      </h2>

      <ul className="mt-4 flex flex-col gap-4">
        {TESTIMONIALS.map((testimonial, index) => (
          <li key={testimonial.attribution} data-rv style={stagger(index + 1)}>
            <TestimonialCard testimonial={testimonial} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    // A card frame, like every other repeated unit on the site. A quote is
    // exactly the kind of thing that needs a surface to sit on — without one it
    // reads as the page's own voice rather than as someone else's.
    <figure className="qx-frame qx-frame--card flex flex-col gap-3 p-5">
      <blockquote className="max-w-[52ch] text-md text-qx-white">
        {testimonial.quote}
      </blockquote>

      <figcaption className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <cite className="font-mono text-2xs uppercase not-italic tracking-[0.28em] text-qx-grey">
          {testimonial.attribution}
        </cite>
        {testimonial.context ? (
          <span className="text-xs text-qx-grey">{testimonial.context}</span>
        ) : null}
        {testimonial.rating ? (
          <span className="flex items-center gap-1 text-qx-green">
            <span aria-hidden="true" className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, index) => (
                <StarIcon key={index} filled={index < testimonial.rating!} />
              ))}
            </span>
            <span className="sr-only">{testimonial.rating} out of 5</span>
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
