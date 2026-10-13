import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * §74's "Robots configuration added".
 *
 * Everything is allowed and the sitemap is pointed at. That is the whole of it,
 * and the restraint is deliberate.
 *
 * **NOTHING IS DISALLOWED, and nothing ever was.** `/who-we-are/team` was the
 * one route held back from search and it was held back with `noindex` in its own
 * metadata, never with a `Disallow` here — the stronger and more accurate
 * instruction of the two. `Disallow` tells a crawler not to FETCH the page,
 * which means it never reads the `noindex`, so a `Disallow`ed page linked from
 * anywhere can still appear in results as a bare URL. `noindex` on a fetchable
 * page cannot. The two look interchangeable and are close to opposites.
 *
 * That route is now a section of `/who-we-are` and a permanent redirect, so
 * there is no page held back at all — and this file is unchanged by that, which
 * is the point of having kept it out of here in the first place.
 *
 * No `crawlDelay`, and no AI-crawler block list. Both are policy decisions for
 * the client to make about their own site rather than defaults to inherit; §69's
 * missing-assets list does not raise either, so nothing is assumed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
