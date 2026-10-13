import Link from 'next/link';
import {
  CONTACT,
  CTA_LABEL,
  FOOTER_COPY,
  FOOTER_NAV,
  LEGAL_LINKS,
  ORGANISATION,
  SOCIAL,
} from '@/content/site';
import { InstagramIcon, LinkedInIcon, MailIcon, PhoneIcon, PinIcon } from '@/components/icons';
import { HomeLink } from './HomeLink';
import { NavLogo } from './NavLogo';
import { WhatsAppLink } from './WhatsAppLink';

/**
 * The global footer — the draft's "11 · Footer (Global Element)": tagline, the
 * full navigation, contact, the CTA, social icons and a legal line.
 *
 * A server component, in `app/layout.tsx` after `{children}`, so every route
 * gets it in the initial HTML with no per-page wiring.
 *
 * The bottom padding is `--qx-float-reserve`, not a spacing step. The floating
 * WhatsApp button is fixed in the bottom-right corner and the footer is the one
 * place a visitor scrolls all the way to, so without a reserved strip the button
 * sits on top of the last line of the legal notice — exactly the draft's "should
 * not obstruct ... footer content". The token is computed from the button's own
 * size and inset in `styles/tokens.css`, so the two cannot drift apart. An
 * earlier `pb-7` did drift: it was 6rem against a button whose desktop inset had
 * been set to 4rem, and it overlapped by 16px.
 *
 * The Privacy Policy and Terms of Service are LINKS as of Phase 8D. They were
 * plain text for several phases because the document names both in the legal
 * line and contains no privacy or terms content anywhere, so linking them would
 * have put two guaranteed 404s in the footer of every page. Both routes now
 * exist as honest stubs (`components/legal/LegalStub.tsx`), so `LEGAL_LINKS` in
 * `content/site.ts` carries an href for each — and the `href: null` branch below
 * stays, because un-publishing either page is a decision the client may still
 * make.
 *
 * **`prefetch={false}` came off the navigation in Phase 8D**, together with the
 * site index's and the pillar pages'. It was there because the footer linked ten
 * routes that did not exist and prefetching a 404 wastes a request per hover.
 * All sixteen exist now, and the whole site's was removed in one commit — never
 * one link at a time, which is how you end up with a footer where half the
 * routes prefetch and nobody can remember which half is deliberate.
 */

/** Rendered at build time. Next re-renders these static pages on each deploy. */
const YEAR = new Date().getFullYear();

/**
 * §63's two networks → their marks. Keyed by the label `content/site.ts` owns,
 * so a third network added there without a glyph renders as text rather than as
 * a gap — the footer degrades, it does not break. `site-content.test.ts` already
 * pins the two labels, which is what keeps this map addressing them.
 */
const SOCIAL_ICONS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  Instagram: InstagramIcon,
  LinkedIn: LinkedInIcon,
};

export function Footer() {
  return (
    <footer
      id="qx-footer"
      // FULL-BLEED BOX, PADDED COLUMN — and the split matters. The rule and the
      // background belong to the window, so they stay on this element; the
      // gutters belong to the column and have moved inside `max-w-[var(--qx-shell)]` below.
      //
      // They were both here, which put the padding OUTSIDE the constrained box:
      // at a 1470px viewport the footer's content ran 95→1375 while every
      // section above it ran 159→1311, so the two columns were 64px out of true
      // down each side on the same page. That was invisible while the footer was
      // also 256px wider than the sections and simply read as "the footer is
      // wider"; sharing one width is what exposed it.
      className="border-t border-qx-line bg-qx-black pb-[var(--qx-float-reserve)] pt-6"
    >
      {/* `max-w-[var(--qx-shell)]`, and it used to be `max-w-7xl` — 1280px, while every section
          above it was 1024. The footer was visibly wider than the page it closed,
          on the same screen, which is the kind of thing that reads as a rendering
          fault rather than as a decision. One column now; see `--qx-shell`. */}
      <div className="mx-auto flex max-w-[var(--qx-shell)] flex-col gap-6 px-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
          <div className="flex flex-col items-start gap-4 max-md:rounded-[12px] max-md:border max-md:border-[#2ABD00]/25 max-md:bg-[#050705] max-md:p-5 max-md:shadow-[0_0_20px_rgba(42,189,0,0.06)]">
            <Link href="/" prefetch={true} aria-label={`${ORGANISATION.name} — home`} className="text-qx-white">
              <NavLogo instance="footer" className="w-[132px]" />
            </Link>
            {/* The draft's own footer headline. It is the loudest thing down
                here on purpose — the section exists to ask for the conversation,
                and the nav below it is the consolation prize. */}
            <h2 className="max-w-[18ch] text-lg text-qx-white">{FOOTER_COPY.tagline}</h2>
            <WhatsAppLink
              className="w-fit rounded-sm border border-qx-green-dim px-3 py-1 font-mono text-2xs uppercase tracking-[0.28em] text-qx-green"
              label={CTA_LABEL}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-[3fr_2fr]">
            {/* `data-qx-nav-mark` opts this list into the current-page mark.
                `lib/route-mark.ts` writes `aria-current="page"` on the entry the
                visitor is reading, here and in the header's menu, off one match
                computed across both — so on `/launchpad`, which this list
                carries and the menu's shortlist does not, the footer lights it
                and the menu correctly lights nothing.

                The legal line at the foot is deliberately NOT marked. It is a
                sentence with two links in it rather than a navigation, and
                lighting one of them would be claiming a place in a list that
                does not exist. */}
            <nav
              aria-labelledby="qx-footer-nav-heading"
              data-qx-nav-mark
              className="max-md:rounded-[12px] max-md:border max-md:border-qx-line max-md:bg-[#050705]/80 max-md:p-5"
            >
              <h3
                id="qx-footer-nav-heading"
                className="font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey"
              >
                {FOOTER_COPY.navHeading}
              </h3>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                {FOOTER_NAV.map((item) => (
                  <li key={item.href}>
                    {item.href === '/' ? (
                      // HomeLink clears the scroll-restore sessionStorage flags
                      // so the homepage always opens at the very top, not at
                      // the position the visitor was reading when they left.
                      <HomeLink
                        className="block py-1 text-xs text-qx-grey transition-colors hover:text-qx-white focus-visible:text-qx-white"
                        suppressHydrationWarning
                      >
                        {item.label}
                      </HomeLink>
                    ) : (
                      <Link
                        href={item.href}
                        prefetch={true}
                        className="block py-1 text-xs text-qx-grey transition-colors hover:text-qx-white focus-visible:text-qx-white"
                        // `aria-current` is on one of these by the time React
                        // hydrates — `lib/route-mark.ts` writes it at
                        // DOMContentLoaded, and the client bundle arrives after
                        // that. Without this, hydration reports an attribute the
                        // server did not render on every page load; React's own
                        // remedy for an attribute a pre-paint script owns, and the
                        // same one `app/layout.tsx` uses for `data-qx-motion`.
                        //
                        // It covers this element's own attributes and nothing
                        // inside it, which is exactly the scope wanted: the label
                        // is still compared.
                        suppressHydrationWarning
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-col gap-6 max-md:rounded-[12px] max-md:border max-md:border-qx-line max-md:bg-[#050705]/80 max-md:p-5">
              <div>
                <h3 className="font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey">
                  {FOOTER_COPY.contactHeading}
                </h3>
                {/* The icons are OUTSIDE the anchors, and that is the whole
                    reason they are here. These three lines were an email
                    address, a phone number and a place name in one grey column
                    at the same size — three facts of three different kinds with
                    nothing to tell them apart until you had read each one. The
                    glyph is the row's label, so the link stays exactly the
                    value: `#qx-footer a[href^="tel:"]` is asserted to have the
                    number as its text, and nothing else may get inside it.

                    `--qx-green-dim` is the token's own role — "ui, a graphical
                    object" — rather than a decorative choice. They are
                    `aria-hidden`, so the address and the number are still the
                    only things announced. */}
                <ul className="mt-3 flex flex-col gap-2 text-xs text-qx-grey">
                  <li className="flex items-center gap-2">
                    <MailIcon className="h-3 w-3 shrink-0 text-qx-green-dim" />
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className="transition-colors hover:text-qx-white focus-visible:text-qx-white"
                    >
                      {CONTACT.email}
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <PhoneIcon className="h-3 w-3 shrink-0 text-qx-green-dim" />
                    {/* `tel:` rather than a WhatsApp deep link — the draft
                        prints this as the number to reach, and the chat CTA is
                        already three elements away. */}
                    <a
                      href={`tel:${CONTACT.whatsapp.replace(/-/g, '')}`}
                      className="transition-colors hover:text-qx-white focus-visible:text-qx-white"
                    >
                      {CONTACT.whatsapp}
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <PinIcon className="h-3 w-3 shrink-0 text-qx-green-dim" />
                    <span>{CONTACT.locations}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey">
                  {FOOTER_COPY.socialHeading}
                </h3>
                {/* §63 asks for "social icons" and this rendered two words.

                    ICON AND LABEL, not icon alone. An icon-only link has to
                    carry an `aria-label` doing a job the visible text was
                    already doing for everyone, and these two marks are
                    redrawings rather than the official assets (see
                    `components/icons`) — the name in text is what makes that
                    honest as well as accessible. Both sit inside the anchor so
                    they light up together and the target is the pair.

                    `py-2` is new: these were 14px text with no padding, which is
                    a 20px-tall tap target in the one part of the page a thumb
                    reaches last. */}
                <ul className="mt-2 flex flex-wrap gap-x-5 text-xs text-qx-grey">
                  {SOCIAL.map((s) => {
                    const Glyph = SOCIAL_ICONS[s.label];
                    return (
                      <li key={s.label}>
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener"
                          className="flex items-center gap-2 py-2 transition-colors hover:text-qx-white focus-visible:text-qx-white"
                        >
                          {Glyph ? <Glyph className="h-3 w-3 shrink-0" /> : null}
                          {s.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <p className="flex flex-wrap gap-x-3 gap-y-1 border-t border-qx-line pt-4 text-2xs text-qx-grey">
          <span>
            © {YEAR} {FOOTER_COPY.legalEntity}
          </span>
          {LEGAL_LINKS.map((link) => (
            <span key={link.label}>
              {link.href ? (
                <a
                  href={link.href}
                  className="transition-colors hover:text-qx-white focus-visible:text-qx-white"
                >
                  {link.label}
                </a>
              ) : (
                link.label
              )}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
