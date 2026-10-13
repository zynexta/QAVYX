import type { MetadataRoute } from 'next';
import { ALL_ROUTES } from '@/content/site';
import { SITE_URL } from '@/lib/seo';

/**
 * §74's "Sitemap added", now that every route it would list exists.
 *
 * It is generated from `ALL_ROUTES` in `content/site.ts`, which is §64's URL
 * structure written out once. A hand-maintained sitemap is a list that goes
 * stale silently — the failure mode is a page that exists and is never crawled,
 * which nothing on the site would show.
 *
 * **`indexed: false` routes are excluded**, and there are none at present. The
 * one that used it was `/who-we-are/team`, whose content is now a section of
 * `/who-we-are` — see `ALL_ROUTES` for why the flag stays anyway. The filter is
 * what stops a sitemap entry contradicting a `noindex` page: an entry asks a
 * crawler to fetch a page in order to be told not to index it.
 *
 * ## No `lastModified`
 *
 * Next would happily take `new Date()`, and it would be a lie: it is the time of
 * the BUILD, not of any change to the page, so every route would claim to have
 * changed on every deploy. Crawlers learn to distrust a `lastModified` that
 * moves for pages that did not, and an absent field is treated better than a
 * wrong one. It goes in when the content has real timestamps behind it.
 *
 * ## No `priority` or `changeFrequency`
 *
 * Both are hints Google has stated it ignores. Emitting them adds bytes and a
 * second, unenforceable statement about the site's shape.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return ALL_ROUTES.filter((route) => route.indexed).map((route) => ({
    url: `${SITE_URL}${route.path}`,
  }));
}
