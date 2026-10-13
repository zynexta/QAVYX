import { EYEBROW } from '@/components/inner/InnerPage';
import type { CaseStudy } from '@/content/projects';
import { reveal, stagger } from '@/lib/reveal';

/**
 * The case studies — built, and rendering nothing.
 *
 * §59: "No live case studies were provided in this draft." `CASE_STUDIES` is
 * empty, so this returns `null` and `/projects` shows the Coming Soon state
 * instead. One real case study and the page changes shape.
 *
 * ## What a card may and may not say
 *
 * `results` is optional and every entry in it is a claim about a real business.
 * §59 forbids fabricating revenue numbers, lead counts, ROAS, conversion rates
 * and performance claims; §69 makes naming a client conditional on permission.
 * So a card with no `results` is a perfectly good card — §59 itself says "a
 * detailed real case study is more valuable than multiple generic project
 * cards" — and the layout is built so that one without them does not look
 * broken. **Nothing may be added to `results` that the client has not supplied
 * and cleared for publication.**
 *
 * ## No images
 *
 * §69 lists project images among the missing assets. A card with a placeholder
 * image is a card that looks like a real one, which is the failure mode the
 * whole Coming Soon decision exists to avoid. The layout leads on the headline;
 * an image slot goes in with the images.
 */
export function CaseStudyGrid({ caseStudies }: { caseStudies: readonly CaseStudy[] }) {
  if (caseStudies.length === 0) return null;

  return (
    <ul {...reveal} className="mt-6 flex flex-col gap-4">
      {caseStudies.map((study, index) => (
        <li
          key={study.slug}
          data-rv
          style={stagger(index)}
          // The same card frame and the same two-column split as a pillar
          // page's section list — a case study and a service section are the
          // same shape of thing, and one idiom for both is what keeps the site
          // from having a second design on its projects route.
          className="qx-frame qx-frame--card grid gap-x-6 gap-y-3 p-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]"
        >
          <div className="flex flex-col gap-2">
            <p className={EYEBROW}>{study.client}</p>
            <p className="font-mono text-2xs text-qx-grey">
              {study.industry} · {study.service}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="max-w-[46ch] text-lg text-qx-white md:text-xl">{study.headline}</h3>
            <p className="max-w-[52ch] text-sm text-qx-grey">{study.summary}</p>

            {study.results?.length ? (
              // A <dl>, because each result is a labelled value rather than a
              // list item — and the label has to be readable next to the number
              // or the number is a claim with no subject.
              <dl className="mt-1 flex flex-wrap gap-x-6 gap-y-3">
                {study.results.map((result) => (
                  <div key={result.label} className="flex flex-col gap-1">
                    <dt className={EYEBROW}>{result.label}</dt>
                    <dd className="text-lg text-qx-green">{result.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
