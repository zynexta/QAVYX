import { EYEBROW } from '@/components/inner/InnerPage';
import {
  CASE_STUDIES,
  INDUSTRY_FILTERS,
  SERVICE_FILTERS,
  type CaseStudy,
} from '@/content/projects';
import { reveal } from '@/lib/reveal';

/**
 * §54 Industry Filters and §55 Service Filters — built, and rendering nothing.
 *
 * ## The switch is the data, not a flag
 *
 * `CASE_STUDIES` is empty (§59: "No live case studies were provided in this
 * draft"), so this returns `null` and the page shows §59's Coming Soon state
 * instead. Add one real case study and the filters appear.
 *
 * That is the whole design. A filter row over an empty set is a broken control —
 * every option returns nothing, and a visitor reads that as a fault rather than
 * as an unfinished page. The alternative that keeps getting proposed is to
 * render them disabled, which is the same problem with an extra step: a disabled
 * control still says "there is something here you cannot have".
 *
 * ## Links, not buttons — so this page needs no client JavaScript
 *
 * Each option is an `<a>` to `?industry=…` / `?service=…`, which means filtering
 * is a navigation and the state lives in the URL. A visitor can share a filtered
 * view, the back button works, and nothing hydrates. The React alternative is a
 * `useState` per row and a page that ships a bundle to do what an href does.
 *
 * **The last wire is deliberately not connected.** Reading those params requires
 * `searchParams` on the route, which makes `/projects` dynamic rather than
 * statically prerendered. That is correct once there is something to filter and
 * pure cost today, so it goes in with the first case study — see the note in
 * `app/(site)/projects/page.tsx`. Until then `selected` is always undefined and
 * this component never renders anyway.
 */

export interface Selection {
  industry?: string;
  service?: string;
}

/**
 * The filtered set. A pure function, so `tests/unit/projects-content.test.ts`
 * can cover the matching rules directly rather than by rendering a page that
 * currently renders nothing.
 *
 * An absent facet matches everything — the two rows are independent, and
 * selecting an industry must not silently narrow the services as well.
 */
export function filterCaseStudies(
  caseStudies: readonly CaseStudy[],
  selection: Selection = {},
): readonly CaseStudy[] {
  return caseStudies.filter(
    (study) =>
      (!selection.industry || study.industry === selection.industry) &&
      (!selection.service || study.service === selection.service),
  );
}

/** `Retail` → `retail`, `Restaurants & Cafés` → `restaurants-cafes`. */
export function facetSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    // Strip combining marks so `Cafés` and `Cafes` cannot become two URLs for
    // one filter. `\p{M}` needs the `u` flag; the range is every diacritic.
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function ProjectFilters({ selected = {} }: { selected?: Selection }) {
  // §59. Nothing to filter, so no filters — see the docblock.
  if (CASE_STUDIES.length === 0) return null;

  return (
    <div
      {...reveal}
      data-rv
      className="qx-frame mt-6 flex flex-col gap-5 px-4 pb-6 pt-5 sm:px-6 lg:px-7"
    >
      <FilterRow
        heading={INDUSTRY_FILTERS.heading}
        param="industry"
        items={INDUSTRY_FILTERS.items}
        selected={selected.industry}
      />
      <FilterRow
        heading={SERVICE_FILTERS.heading}
        param="service"
        items={SERVICE_FILTERS.items}
        selected={selected.service}
      />
    </div>
  );
}

function FilterRow({
  heading,
  param,
  items,
  selected,
}: {
  heading: string;
  param: 'industry' | 'service';
  items: readonly string[];
  selected?: string;
}) {
  const headingId = `qx-filter-${param}`;

  return (
    <nav aria-labelledby={headingId}>
      <h3 id={headingId} className={EYEBROW}>
        {heading}
      </h3>
      {/* Same chip idiom as §57's industries directly below, because they are
          the same kind of thing — a scannable set of short nouns. The only
          visual difference is that these are links and carry a selected state. */}
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected === item;
          return (
            <li key={item}>
              <a
                // Selecting the active option clears it, so a filter row needs
                // no separate "All" chip to escape from.
                href={isSelected ? '?' : `?${param}=${facetSlug(item)}`}
                // The selected state is announced, not only coloured. A green
                // border alone is invisible to a screen reader and to anyone who
                // cannot distinguish it from the resting one.
                aria-current={isSelected ? 'true' : undefined}
                className={`block rounded-sm border px-3 py-1 font-mono text-2xs transition-colors ${
                  isSelected
                    ? 'border-qx-green-dim text-qx-green'
                    : 'border-qx-line text-qx-grey hover:border-qx-white hover:text-qx-white'
                }`}
              >
                {item}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
