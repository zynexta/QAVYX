import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * Lab routes are named `page.lab.tsx` and are only a recognised page
   * extension in development, so they are structurally absent from the
   * production build rather than merely 404-ing at runtime.
   */
  pageExtensions: isDev ? ['tsx', 'ts', 'lab.tsx'] : ['tsx', 'ts'],

  eslint: {
    dirs: ['app', 'components', 'hooks', 'motion', 'state', 'content', 'lib'],
  },

  /**
   * The two Who We Are children the client folded into their parent — §46–§49
   * and §50 are both `/who-we-are` now. See the note at the top of
   * `app/(site)/who-we-are/page.tsx`.
   *
   * `permanent: true` is a 308, which tells a crawler to move its index entry to
   * the new URL rather than keep checking the old one. That is the whole reason
   * neither route was simply deleted:
   *
   *   - `/who-we-are/about` was INDEXED and in the sitemap for several phases,
   *     so search results and bookmarks point at it.
   *   - `/who-we-are/team` never was — `indexed: false`, unlinked, `noindex` in
   *     its own metadata — so nothing should be holding it. It is redirected
   *     anyway, because "should" is doing a lot of work in that sentence and the
   *     line costs nothing: the client has had this URL since Phase 8D and may
   *     well have sent it to someone.
   */
  /**
   * The launch film's own cache policy, because Next serves everything under
   * `public/` with `Cache-Control: public, max-age=0` — measured on this project,
   * not assumed. That is right for the small stuff and badly wrong for a film
   * split across 420 stills: every repeat view would spend a round trip
   * revalidating each one before the scrub could paint.
   *
   * ## TWO RULES, BECAUSE ONLY ONE OF THESE PATHS IS VERSIONED
   *
   * `/launch-frames-v1/` CARRIES ITS VERSION IN THE PATH, so it gets a year and
   * `immutable`. A re-encode lands at `-v2` and is a different URL by
   * construction — there is no way for a returning visitor to be pinned to a
   * stale frame, which is the exact hazard `immutable` is otherwise dangerous
   * for. This is the same bargain `_next/static` makes with its content hashes,
   * bought with a directory name instead.
   *
   * ONE RULE, BECAUSE THERE IS ONE ASSET PATH LEFT. `public/videos/` is gone —
   * the .mp4s were deleted with the video path and the poster moved in beside
   * the frames it stands in for, at `/launch-frames-v1/poster.webp`. A directory
   * named for a format it no longer contains is a question a future reader has
   * to answer twice.
   *
   * IF YOU RE-ENCODE THE FRAMES, RENAME THE DIRECTORY. `immutable` means a
   * browser will not even ask; a new path is the ONLY thing that reaches someone
   * holding the old one.
   *
   * THE .MP4s ARE GONE as of 2026-09-02 — the beat is a frame sequence on every
   * device now (`lib/rocket-frames.ts`). Deleting them was safe only because the
   * site is not yet public: the risk otherwise is edge-cached HTML running the
   * old inline boot script, asking for a file that 404s, and painting 320vh of
   * BLACK rather than showing a missing video. That failure shipped on
   * 2026-08-31 and was reported within minutes.
   */
  async headers() {
    return [
      {
        source: '/launch-frames-v1/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: '/who-we-are/about', destination: '/who-we-are', permanent: true },
      { source: '/who-we-are/team', destination: '/who-we-are', permanent: true },
      { source: '/contact', destination: '/who-we-are/contact', permanent: false },

      /**
       * THE PHONE FILM'S REDIRECT IS GONE, and so is the file it pointed at.
       *
       * It bridged `/videos/rocket-scroll-light.mp4` to the `-v2` rename for
       * stale HTML, after `0467068` renamed and deleted in one deploy and the
       * 404s painted 320vh of black on the live site. Both the bridge and its
       * destination were removed on 2026-09-02 with the .mp4s themselves — the
       * beat is a frame sequence now and the site is not yet public, so there is
       * no cached HTML holding either URL.
       *
       * The lesson it was built from still applies to the frames: a renamed or
       * deleted asset that something still asks for does not read as a missing
       * asset, it reads as a broken page. See the headers block above.
       */
    ];
  },
};

export default nextConfig;
