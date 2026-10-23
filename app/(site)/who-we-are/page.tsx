import type { Metadata } from 'next';
import { EYEBROW, InnerPage, Section } from '@/components/inner/InnerPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { GrowthTeamVisual } from '@/components/services/visuals';
import { TeamSection } from '@/components/company/TeamSection';
import {
  ABOUT,
  MISSION,
  TEAM,
  TEAM_HEADING,
  VISION,
  WHO_WE_ARE,
} from '@/content/company';
import { reveal, stagger } from '@/lib/reveal';
import { pageJsonLd, pageMetadata } from '@/lib/seo';

/**
 * `/who-we-are` — §46 About, §47 Mission, §48 Vision, §49 Why Businesses Choose
 * QAVYX and §50 Meet the Team, in the document's order.
 *
 * ## THIS WAS A HUB, AND THE CLIENT REMOVED THE HOP
 *
 * §64 routes both `/who-we-are` and `/who-we-are/about`, and `content/company.ts`
 * records that the client confirmed all four routes in this group. So this page
 * was the section's index: §46's heading and first paragraph, then two rows
 * linking About and Contact Us, with the whole of §46–§49 one click further
 * down at `/who-we-are/about`.
 *
 * The client's later direction is that "Who We Are" in the menu should BE the
 * about page. That instruction post-dates §64, the same way the header's return
 * post-dates §62 — and it is right about what the hub had become. Its index held
 * two rows: About, which was the only thing on it a visitor had come for, and
 * Contact Us, which is already in the menu, the footer and the homepage's site
 * index. An index of two, one of them redundant, in front of the content.
 *
 * So §46–§49 moved UP to this route rather than the navigation moving DOWN to
 * theirs. `/who-we-are` is the name the client gave this part of the site in §2,
 * §63 and §64; it is what the menu, the footer and the site index all point at,
 * and it is the parent of the one route that remains. Pointing four navigations
 * at `/who-we-are/about` and leaving a bare redirect at the section root would
 * have been the same page with a worse URL. `/who-we-are/about` now 308s here —
 * see `next.config.ts`, and note that it was an INDEXED route, so the redirect
 * is the part that is not optional.
 *
 * ## AND §50 CAME UP WITH IT, in the same direction
 *
 * "Team not a separate page, it just shows in the about page." So
 * `/who-we-are/team` is gone too, redirected alongside About, and §50 is the
 * closing section below.
 *
 * That page was `indexed: false` and unlinked, and the reasoning for both was
 * that a whole page whose entire content is a heading and one sentence — about a
 * team it does not name — asks a search engine to show it in exactly the state
 * it should not be seen in. As the last section of a page that has already said
 * four paragraphs, a mission, a vision and five reasons, the same two strings
 * are a claim the page has earned. So there is nothing left to hold back and
 * nothing left to link, and the three switches `TEAM` used to describe are one:
 * the profile grid, still commented out until §69's assets arrive.
 *
 * The section renders NOW rather than waiting for profiles. It is real client
 * copy either way, and a section that appears on the day the photographs do is a
 * page that silently changes shape — the visible absence is the honest state and
 * the one that gets the assets sent.
 *
 * ## The `<h1>` is the client's line, not the route's name
 *
 * "We're Not an Agency. We're Your Growth Team." — §46's own heading, the way
 * `/services` is headed "What's Inside QAVYX" rather than "Our Services". The
 * route's name is what the menu says and what the tab says; the page says what
 * the client wrote.
 *
 * ## Mission and Vision share one section
 *
 * They are one sentence each. Given a section apiece they would be two headings
 * with a line of body under each, which puts more weight on the headings than on
 * the four paragraphs of §46 above them. Side by side from `md` they read as
 * what they are: a matched pair, the client's own "where we are going" in two
 * halves. Below `md` they stack, in the document's order.
 *
 * ## §49 is a list of reasons, not a sequence
 *
 * A `<ul>`, unnumbered, for the same reason §5's four failure modes on the
 * homepage are unnumbered: numbering asserts an order the client did not write.
 * The one numbered list on this site is Growth Marketing's five steps, which are
 * explicitly "Step 01".."Step 05".
 *
 * ## The title block takes a figure, and it is the only drawing on the route
 *
 * `InnerPage`'s `aside` slot was built for the five pillar pages, which pass the
 * carousel diagram the visitor just clicked; ten routes pass nothing and this
 * was one of them, so `<main>` here contained no SVG at all — a page of four
 * paragraphs, two statements, five reasons and a closing section, entirely in
 * type. `GrowthTeamVisual` fills it: six equal members inside one set of
 * brackets, one of them green.
 *
 * It illustrates the `<h1>` beside it and nothing below it. The section that
 * looks like it wants a picture is §50 Meet the Team, and that one is spoken
 * for — see the note on it below, and never draw people there.
 *
 * ## It does not carry a CTA
 *
 * §46–§49 specify none, and the page's job is to be read. The conversation is in
 * the menu, in the footer on every page, and in the floating WhatsApp button.
 * Adding §65's primary here because most pages have one would be inventing a
 * beat — and it is the reasoning that retired the hub's Contact row rather than
 * moving it down here as a lone index of one.
 */
const PAGE = { href: '/who-we-are', label: WHO_WE_ARE.heading };

/**
 * §46's four paragraphs, joined — the same treatment `pillarDescription` gives a
 * pillar page's intro, and for the same reason: a description written here would
 * be a second source of truth for the page's pitch that nobody editing
 * `content/company.ts` would think to update.
 *
 * All four rather than the first, which used to be a rule with teeth: the hub
 * led with §46's opening sentence and the About page described itself with the
 * whole of §46, because two routes sharing a description put them into search
 * competing for one result. There is one route now and the competition is gone,
 * but the four paragraphs are still the honest description of what is on it.
 */
const DESCRIPTION = ABOUT.description.join(' ');

export const metadata: Metadata = pageMetadata({
  path: '/who-we-are',
  // The route's name and not the `<h1>`. `title.template` in `app/layout.tsx`
  // makes this "Who We Are — QAVYX", which is what the menu entry, the footer
  // entry and the browser tab should agree on; §46's heading is a sentence in
  // the client's voice and belongs on the page rather than in a tab.
  title: WHO_WE_ARE.heading,
  description: DESCRIPTION,
});

export default function WhoWeAreRoute() {
  return (
    <>
      <JsonLd data={pageJsonLd({ page: PAGE, description: DESCRIPTION, type: 'AboutPage' })} />
      <InnerPage title={ABOUT.heading} intro={ABOUT.description} aside={<GrowthTeamVisual />}>
        {/* Mission and Vision are two claims side by side rather than a section
            with contents, so they are CARD frames and there is no section frame
            around them — a frame holding nothing but two frames is a box drawn
            for its own sake. */}
        <div {...reveal} className="mt-6 grid gap-4 md:grid-cols-2">
          {[MISSION, VISION].map((statement, index) => (
            <section
              key={statement.heading}
              data-rv
              style={stagger(index)}
              className="qx-frame qx-frame--card flex flex-col gap-3 p-5"
            >
              <h2 className={EYEBROW}>{statement.heading}</h2>
              <p className="max-w-[46ch] text-md text-qx-white">{statement.copy}</p>
            </section>
          ))}
        </div>



        {/* §50 MEET THE TEAM — a section here, and a page of its own until the
            client said it belongs on the about page.

            THE HEADING IS THE LABEL AND `TEAM.heading` IS NOT. On the route this
            used to be, "The people behind your growth." was the `<h1>` and the
            section's name was implied by the URL; here the URL says nothing, so
            §50's own title heads the section and the client's line is the first
            thing inside it. It is a `<p>` and not an `<h3>`: a tagline is not a
            heading, and the five `<h3>`s on this page are §49's reasons — which
            `phase8d-routes.spec.ts` counts.

            NO PROFILES, AND NO PLACEHOLDER FOR THEM. §69 lists names, roles,
            bios, photos and social links among the assets still outstanding, so
            the grid below is commented out and the section is two sentences of
            real client copy. That is the whole switch now: it used to be three —
            the grid, the link and `indexed: false` — and the other two went with
            the route.

            **NEVER fill the grid with invented people.** §66 Rule 05 forbids
            inventing results and testimonials; a fabricated team is worse than
            either, because it is the placeholder a visitor is least able to
            detect and most likely to have made a decision on. Names, roles,
            bios, stock photographs and silhouettes are all the same mistake. */}
        <Section id="qx-team" label={TEAM_HEADING}>
          <p className="mt-4 max-w-[46ch] text-md text-qx-white">{TEAM.heading}</p>
          <p className="mt-2 max-w-[52ch] text-sm text-qx-grey">{TEAM.description}</p>
          {/*
            THE PROFILE GRID — commented out because no profiles have been
            supplied. It is written against §50's own suggested fields
            (`TEAM_PROFILE_FIELDS` in `content/company.ts`), so real profiles
            drop into it without a redesign. Uncomment it and fill
            `TEAM.profiles` in the same commit; `tests/unit/company-content.test.ts`
            fails if the second happens without the first.

            <ul className="mt-6 grid gap-6 border-t border-qx-line pt-6 sm:grid-cols-2 lg:grid-cols-3">
              {TEAM.profiles.map((profile) => (
                <li key={profile.name} className="flex flex-col gap-3">
                  <Image
                    src={profile.image}
                    alt=""
                    width={480}
                    height={480}
                    className="aspect-square w-full rounded-sm border border-qx-line object-cover"
                  />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg text-qx-white">{profile.name}</h3>
                    <p className={EYEBROW}>{profile.role}</p>
                  </div>
                  <p className="max-w-[42ch] text-sm text-qx-grey">{profile.bio}</p>
                  {profile.linkedin || profile.links?.length ? (
                    <ul className="flex flex-wrap gap-4">
                      {profile.linkedin ? (
                        <li>
                          <a
                            href={profile.linkedin}
                            target="_blank"
                            rel="noopener"
                            className="font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey transition-colors hover:text-qx-white"
                          >
                            LinkedIn
                          </a>
                        </li>
                      ) : null}
                      {profile.links?.map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener"
                            className="font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey transition-colors hover:text-qx-white"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          */}
        </Section>
      </InnerPage>

      {/* Dynamic 3D Team Member Showcase Carousel */}
      <TeamSection />
    </>
  );
}
