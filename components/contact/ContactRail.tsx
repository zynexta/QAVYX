import { MailIcon, PhoneIcon, PinIcon } from '@/components/icons';
import { EYEBROW } from '@/components/inner/InnerPage';
import { stagger } from '@/lib/reveal';
import { WHATSAPP_HREF } from '@/components/nav/WhatsAppLink';
import { CONTACT } from '@/content/site';

/**
 * The contact page's right-hand rail: the three channels that actually work,
 * and the drawing that says what they are for.
 *
 * ## WHY THIS EXISTS AT ALL — it is a layout fix before it is a decoration
 *
 * `UiOnlyForm` caps itself at `max-w-[42rem]`, which is a READABILITY constraint
 * and correct: a 1200px-wide text input is worse than a 670px one, and the same
 * component renders §44's waitlist, so the cap is not this page's to change.
 *
 * The consequence was that the contact section rendered a 672px form inside
 * 960px of section (measured at 1440px, where `--qx-shell` caps at 80rem) and
 * left a 288px column empty for the form's whole 939px height. That is what this
 * rail fills, and filling it with something the visitor needs is the only
 * version worth shipping — a graphic dropped into the same hole would have been
 * a decorated hole.
 *
 * ## THE CHANNELS MOVED HERE, THEY WERE NOT COPIED HERE
 *
 * They used to be a section of their own directly above the form, with the same
 * problem in miniature: three one-line values in a full-width card, and air
 * underneath. That section is gone and this is where its content went. There is
 * exactly one copy of the WhatsApp number and the email on this page, which is
 * the state the page's docblock has always argued for.
 *
 * ## ...AND THE ORDER THE PAGE ARGUED FOR IS PRESERVED, WHICH IS WHY THIS IS
 * ## FIRST IN THE SOURCE
 *
 * The page's own note: the working channels must come before the form, because
 * the form does not submit, and a visitor who fills six fields before learning
 * that has been wasted. A rail placed second in the DOM and floated right would
 * have inverted exactly that on every phone.
 *
 * So this renders FIRST and the grid moves it to column two at `xl` and up
 * (`xl:col-start-2 xl:row-start-1` on the page). Reading order — for a screen
 * reader, and for anyone below 1280px — is still channels, then form. The
 * desktop composition is the only thing the grid changes.
 *
 * `xl` and not `lg`: the shell only widens at `xl`, and splitting a column
 * earlier than that collapsed this rail to zero width. The page's docblock has
 * the measurements.
 *
 * ## Sticky, because the thing beside it is three times its height
 *
 * The form is ~940px and this is ~450px. Left static it would sit at the top and
 * hand back a shorter version of the same hole. `xl:sticky` keeps the channels
 * beside whichever field the visitor is on, which is the moment they are most
 * likely to give up on the form and message instead. Measured: the gap under the
 * rail starts at ~489px and closes to the grid gap itself as the sticky engages.
 *
 * ## No client JavaScript, no new dependency
 *
 * Every inner route is a server component and the reveal layer is CSS plus one
 * inline boot script (`lib/reveal.ts`). This is a server component too: the
 * stagger is an inline custom property, the sticky is CSS, and the drawing is
 * static SVG. Nothing here adds a hydration boundary to a search-visible page.
 */

/**
 * §51's three lines. The values come from `CONTACT` in `content/site.ts`, which
 * the footer also prints on every page — the one place the number and the
 * address are allowed to live.
 *
 * The glyphs are the footer's, deliberately: a visitor arriving here from the
 * footer of any other route should recognise these as the same three facts
 * rather than read them as new ones. They are `aria-hidden`; the text beside
 * each one is the real label.
 */
const CHANNELS: readonly {
  label: string;
  value: string;
  href?: string;
  /** Leaves the site, so it opens in a new tab with `rel="noopener"`. */
  external?: boolean;
  Icon: (props: { className?: string }) => React.JSX.Element;
}[] = [
  {
    label: 'WhatsApp',
    value: CONTACT.whatsapp,
    // THE ROW SAYS WHATSAPP, SO IT GOES TO WHATSAPP. It was `tel:` — inherited
    // from the markup this replaced, where the word "WhatsApp" sat in a `<dt>`
    // OUTSIDE the link and only the bare number was the link. Moving the label
    // inside the anchor changed the accessible name to "WhatsApp,
    // +91-9188743741" pointing at the dialler, which is a promise the href does
    // not keep — and on a desktop `tel:` does nothing at all.
    //
    // `WHATSAPP_HREF` is the same `wa.me` URL the floating button and the
    // footer use, exported from `WhatsAppLink` rather than rebuilt here: four
    // hand-written wa.me hrefs would be four chances to typo a phone number
    // into a stranger's inbox, which is that file's own argument.
    href: WHATSAPP_HREF,
    external: true,
    Icon: PhoneIcon,
  },
  { label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}`, Icon: MailIcon },
  { label: 'Locations', value: CONTACT.locations, Icon: PinIcon },
];

export function ContactRail({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <div className="xl:sticky xl:top-7 flex flex-col gap-5">
        <ConversationVisual />

        {/* A LIST, NOT A `<dl>`, and the first draft was a `<dl>` — worth
            recording because the description list is the obvious reach here and
            it is the wrong one once the whole row is a link.

            `<dl>` wants the label in `<dt>` and the value in `<dd>`, which puts
            a boundary exactly where the link has to span. The draft worked
            around it with a `sr-only` `<dt>` plus the same label rendered again
            inside the `<dd>` — so every row announced its own name twice.
            `<ul>` has no such boundary: one `<a>` per item, and its accessible
            name is the label and the value read together ("WhatsApp,
            +91-9188743741"), which is what a person actually wants to hear.

            `Locations` is a plain item in the same list because it is a fact
            rather than a channel. That is also why it is the one row with no
            hover state: nothing happens if you click it. */}
        <ul className="flex flex-col gap-2">
          {CHANNELS.map((channel, i) => (
            <ChannelRow key={channel.label} {...channel} index={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * One channel: the glyph in its own bordered square, the label, the value.
 *
 * A row rather than the bare `<dt>/<dd>` pair this replaced, because at rail
 * width the three values are the page's primary action and a 10px mono label
 * over a line of grey text does not read as one. The square is the same
 * `rounded-sm / border-qx-line / bg-qx-ink-raised` the form notice already uses
 * — one card language on the page, not a second one invented here.
 *
 * The WHOLE ROW is the link where there is one, so the hit target is the row and
 * not the 14 characters of an email address. Measured at 70px tall — 264px wide
 * in the rail, 310px on a 390px phone — against the 24 x 24 minimum.
 */
function ChannelRow({
  label,
  value,
  href,
  external,
  Icon,
  index,
}: {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  Icon: (props: { className?: string }) => React.JSX.Element;
  index: number;
}) {
  const body = (
    <>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-qx-line bg-qx-ink-raised text-qx-green-dim transition-colors group-hover:border-qx-green-dim group-hover:text-qx-green"
      >
        <Icon className="h-4 w-4" />
      </span>
      {/* `min-w-0` so a long value wraps inside the rail instead of widening
          the grid column it sits in.

          WRAPPING, NOT `truncate`, and that was a real bug. An ellipsised phone
          number is not a phone number — the one string on this page a visitor
          has to read character by character was the one being cut off. It also
          made the zero-width column failure silent rather than visible.

          `translate="no"` on the value: an auto-translated page must not garble
          a dialable number or a valid address. */}
      <span className="flex min-w-0 flex-col gap-1">
        <span className={EYEBROW}>{label}</span>
        <span
          translate="no"
          className={`text-md text-qx-white [overflow-wrap:anywhere] ${
            // THE AFFORDANCE IS BACK. The markup this replaced underlined these
            // two values; the first draft dropped it for a hover background,
            // which a touch visitor never sees and nobody sees at rest — so a
            // tappable number looked exactly like the un-tappable `Locations`
            // beside it. Same `underline-offset-4` the old `<dd>` used, and only
            // on the rows that actually go somewhere.
            href ? 'underline underline-offset-4 decoration-qx-line group-hover:decoration-qx-green' : ''
          }`}
        >
          {value}
        </span>
      </span>
    </>
  );

  const shell = 'group flex items-center gap-3 rounded-sm px-2 py-2';

  return (
    <li data-rv style={stagger(index)}>
      {href ? (
        <a
          href={href}
          // Leaving the site opens a tab; `noopener` is the safety half of the
          // pair, and `noreferrer` is deliberately not set for the same reason
          // `WhatsAppLink` gives.
          {...(external ? { target: '_blank', rel: 'noopener' } : {})}
          // NO `focus-visible:outline-*` HERE. `app/globals.css` already draws
          // the site's one focus ring — 2px --qx-green at 2px offset — for every
          // focusable element. The first draft restated it at `outline-1` and
          // made these three rows the only 1px indicators on the site, which is
          // both an inconsistency and under WCAG 2.2's minimum indicator area.
          // The background tint is the part that adds something, so it stays.
          //
          // `touch-action: manipulation` is likewise already applied to every
          // `a` in globals.css; restating it here was dead code.
          className={`${shell} -mx-2 transition-colors hover:bg-qx-ink-raised focus-visible:bg-qx-ink-raised`}
        >
          {body}
        </a>
      ) : (
        <div className={`${shell} -mx-2`}>{body}</div>
      )}
    </li>
  );
}

/**
 * The drawing: a message sent, and a message back.
 *
 * ## Why a drawing and not a photograph
 *
 * Because this site does not have photographs in it, and one contact page is not
 * the place to introduce them. The visual language across all five pillar pages
 * and the services carousel is a 240x180 line diagram in `currentColor` with a
 * single `--qx-green` accent (`components/services/visuals/index.tsx`), and this
 * is drawn to that spec exactly: same viewBox, same 2px round-capped stroke,
 * same trick of carrying de-emphasis in `opacity` rather than in a second
 * colour. It should look like the sixth member of that set, because that is what
 * it is.
 *
 * ## Why THIS drawing
 *
 * §73 makes the site's conversion "start a conversation with QAVYX", and on this
 * page the form cannot do it — the two channels beside this drawing are what
 * does. So the picture is the conversation itself: one message out in the
 * accent, one back in the hairline, offset the way a thread is offset. It states
 * the page's actual proposition rather than ornamenting it.
 *
 * The lines inside each bubble are strokes, not lorem text. A drawing of a
 * message should not be legible; making it legible would mean writing a sentence
 * into an `aria-hidden` graphic and hoping nobody reads it.
 *
 * Decorative, so `aria-hidden` — the three channels below it are the content,
 * and they are real DOM with real labels.
 */
function ConversationVisual() {
  const LINE = {
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  const ACCENT = { ...LINE, stroke: 'var(--qx-green)' } as const;

  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      aria-hidden="true"
      focusable="false"
      // `w-[15rem]`, NOT `w-full max-w-[…]`, and this is the family's own rule
      // rather than a preference: `InnerPage` renders the five service diagrams
      // at exactly this width with the note "held at the diagram's own 240px so
      // it is never scaled — these are drawn to a fixed node budget and blowing
      // one up turns a 2px stroke into a rule". The first draft let this one
      // scale to 320px, which put its stroke at 2.67px — heaviest exactly where
      // the rest of the set is thinnest.
      className="w-[15rem] max-w-full text-qx-line"
    >
      {/* Outbound: the visitor's message. Accent, upper-left, tail on the left
          so it reads as leaving that side.

          THE TAIL IS AN OPEN POLYLINE, NOT A CLOSED TRIANGLE, and the first
          draft got this wrong in a way worth recording. `L…L…Z` strokes the
          triangle's TOP edge as well, laying a second line along the bubble's
          own bottom border and closing the shape — so it rendered as a separate
          spike hanging under the bubble rather than as a tail growing out of it.
          Dropping the `Z` leaves two strokes that start and end ON the border
          and meet at the point, which is the shape a tail actually is. */}
      <rect {...ACCENT} x={14} y={16} width={116} height={56} rx={10} />
      <path {...ACCENT} d="M36,72 L26,92 L58,72" />
      <path {...LINE} d="M32,36 H110 M32,52 H84" opacity={0.5} />

      {/* Inbound: the reply. Hairline body, lower-right, tail on the right, and
          it clears the outbound bubble's tail rather than overlapping it — the
          offset IS the thread, so the explicit connector that used to run
          between them came out. It read as a stray L-shaped line emerging from
          behind the second bubble, which is an artefact, not a connection. */}
      <rect {...LINE} x={110} y={94} width={116} height={56} rx={10} opacity={0.7} />
      <path {...LINE} d="M204,150 L214,170 L182,150" opacity={0.7} />
      <path {...LINE} d="M126,114 H188 M126,130 H166" opacity={0.4} />
      {/* The one accent mark on the reply: the smallest possible way to say
          which of the two is the answer. */}
      <circle {...ACCENT} cx={204} cy={114} r={4.5} />
    </svg>
  );
}
