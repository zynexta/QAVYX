/**
 * The icon system.
 *
 * All of them live in one file for the same reason the five service diagrams do
 * (`components/services/visuals/index.tsx`): they share a coordinate system, a
 * stroke vocabulary and a colour contract, and splitting them into twelve
 * modules would duplicate that contract twelve times without making any of them
 * clearer.
 *
 * ## Why these exist at all
 *
 * Before this pass the site had SVG in exactly three places — the five service
 * diagrams, `NavLogo`, and the floating chat bubble. The footer's contact block
 * was three indistinguishable grey lines; its social links were the words
 * "Instagram" and "LinkedIn"; a testimonial's rating was five ⭐ emoji; a form
 * error was announced by colour and position alone. Those are the gaps this
 * file closes, and it closes only those: an icon is here because a row could not
 * be read at a glance without it, never because a section looked bare.
 *
 * ## RULES
 *
 *  - **24 x 24, `currentColor`, `stroke-width: 1.5`.** 1.5 is `--qx-stroke`, the
 *    hairline every DOM frame on this site is drawn at. The service diagrams use
 *    2 because they are 240 x 180 figures; at the 16–24px these render at, 2
 *    reads as a heavy blob and loses the interior detail.
 *  - **ONE COLOUR, always inherited.** These are not miniature versions of the
 *    service diagrams, which take exactly one `--qx-green` accent each. At 16px a
 *    single green stroke among grey ones reads as a rendering fault rather than
 *    as an accent. Taking the row's own colour instead means every icon already
 *    participates in the hover vocabulary the links have — grey at rest, white or
 *    green when pointed at — for nothing.
 *  - **Decorative, every one of them.** `aria-hidden`, and every place they are
 *    used keeps its visible text label. An icon is never the only thing naming a
 *    control here.
 *  - **Sized by the caller.** NOTE that `tailwind.config.ts` maps the spacing
 *    scale onto the `--qx-space-*` tokens, so `h-3` is 1rem (16px) and `h-4` is
 *    1.5rem (24px) — NOT Tailwind's stock 0.75rem/1rem. Getting that wrong is
 *    how the chat button ended up with a 4rem glyph inside a 3rem box.
 */

const ICON = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
} as const;

/** Exported so a component holding a glyph in its own props can name the type. */
export interface IconProps {
  /** Defaults to 1rem — see the note about the spacing scale above. */
  className?: string;
}

/** 16px. The register the footer, the ratings and the form errors all use. */
const SIZE = 'h-3 w-3';

/* --- contact ---------------------------------------------------------------
   Three glyphs for the three facts `CONTACT` in `content/site.ts` owns. They are
   drawn conventionally rather than in the brand's open-corner idiom on purpose:
   these appear beside an email address and a phone number, where being read
   instantly is the whole job, and a notched envelope reads as a rendering error
   before it reads as a brand.                                                 */

/** Email. */
export function MailIcon({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <rect x={3} y={5} width={18} height={14} rx={3} />
      <path d="M3.8 7.6 L12 13.4 L20.2 7.6" />
    </svg>
  );
}

/** The WhatsApp number, which the footer and the contact page print as `tel:`. */
export function PhoneIcon({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M8.4 3.5 H5.6 A2.1 2.1 0 0 0 3.5 5.8 A14.7 14.7 0 0 0 18.2 20.5 A2.1 2.1 0 0 0 20.5 18.4 V15.6 L16.4 14.4 L14.6 16.2 A11.6 11.6 0 0 1 7.8 9.4 L9.6 7.6 Z" />
    </svg>
  );
}

/** India · GCC (UAE). */
export function PinIcon({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M12 20.8 C 12 20.8 19 14.6 19 9.8 A7 7 0 1 0 5 9.8 C5 14.6 12 20.8 12 20.8 Z" />
      <circle cx={12} cy={9.8} r={2.5} />
    </svg>
  );
}

/* --- social ----------------------------------------------------------------
   §63 asks for "social icons" and the footer had two words instead.

   SIMPLIFIED LINE MARKS, and the trademark position is the same one
   `WhatsAppButton` already takes for the chat bubble: these are monoline
   redrawings used to point at the client's OWN profiles, not the official
   assets, whose use is governed by each platform's brand guidelines. Every
   place they render keeps the network's name in text beside it, so nothing on
   this site depends on the glyph being the registered mark — dropping in the
   official SVGs is a change to these two functions if the client confirms they
   have the rights.                                                            */

export function InstagramIcon({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <rect x={3} y={3} width={18} height={18} rx={5} />
      <circle cx={12} cy={12} r={4} />
      {/* The lens dot. Filled, and the one place in this file a shape is:
          at 16px a 1.5px ring 1.8px across is a smudge, not a circle. */}
      <circle cx={17.2} cy={6.8} r={1} fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * BOXED AND FILLED, to pair with Instagram above — and the first attempt was
 * neither, which is worth recording because it is the trap in redrawing any
 * social mark as a line icon.
 *
 * LinkedIn's glyph is designed as a SILHOUETTE. Tracing its outline and stroking
 * it renders the edge of a solid shape rather than the shape: at 16px the "n"
 * came out as a hollow double line with a 1px counter, and it read as a smudge
 * next to a perfectly legible Instagram. So the letters keep their fill and only
 * the container is stroked, which is exactly what Instagram already does with
 * its lens dot.
 *
 * The `in` is the published mark, scaled about the box's centre rather than
 * re-typed at new coordinates — a hand-fitted copy of someone else's logo is a
 * copy that is slightly wrong.
 */
export function LinkedInIcon({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <rect x={3} y={3} width={18} height={18} rx={5} />
      <g
        fill="currentColor"
        stroke="none"
        transform="translate(12 12) scale(0.6) translate(-12 -12)"
      >
        <path d="M7.1 20.4 H3.6 V9 h3.5 z" />
        <circle cx={5.35} cy={5.37} r={2.06} />
        <path d="M20.4 20.4 h-3.55 v-5.57 c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94 v5.67 H9.35 V9 h3.41 v1.56 h.05 c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46 z" />
      </g>
    </svg>
  );
}

/* --- state -----------------------------------------------------------------
   Two marks that carry meaning a colour is currently carrying alone.          */

/**
 * One star of a rating. `filled` is the state; five of these render as a scale
 * rather than as `rating` loose glyphs, so "4 out of 5" is visible and not only
 * announced.
 *
 * This replaces the ⭐ emoji §56 writes its rating with. An emoji is a font
 * glyph: it is dropped entirely by some screen readers, it renders in the
 * platform's own colour on every OS regardless of this site's palette, and it is
 * the anti-pattern every icon guideline names first.
 */
export function StarIcon({
  className = SIZE,
  filled = false,
}: IconProps & { filled?: boolean }) {
  return (
    <svg {...ICON} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 3.6 L14.6 9 L20.5 9.8 L16.2 13.9 L17.3 19.8 L12 17 L6.7 19.8 L7.8 13.9 L3.5 9.8 L9.4 9 Z" />
    </svg>
  );
}

/**
 * A field error.
 *
 * The palette has no red — `--qx-green` is the only signal colour this site owns
 * — so a validation message was being carried by colour and position with
 * nothing else to read it by. A circle rather than the conventional warning
 * triangle: there is not one triangle anywhere else on this site, and a foreign
 * shape at 16px reads as a stray asset.
 */
export function AlertIcon({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <circle cx={12} cy={12} r={8.5} />
      <path d="M12 7.6 V12.6" />
      {/* Zero-length, so the round cap IS the dot — one node instead of two. */}
      <path d="M12 16.1 H12.01" />
    </svg>
  );
}

/**
 * The travelling mark on a navigation row.
 *
 * `.qx-index-row` already draws a green rule left-to-right on hover to say "this
 * way out"; this is the same sentence with a subject. It moves toward the
 * corner the rule draws to, which is the corner the mark leaves open.
 *
 * The movement is NAVIGATION, which is one of the five the governing motion rule
 * allows. It is a `transform` on an element that is already composited, and the
 * global reduced-motion block removes it.
 */
export function ArrowIcon({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M3.5 12 H19.5" />
      <path d="M14 6.5 L19.5 12 L14 17.5" />
    </svg>
  );
}

/* --- §42, What's Coming ----------------------------------------------------
   Six marks for `/launchpad`'s six capabilities, and the ONLY place on this site
   where a per-item glyph is invented.

   It is earned there and nowhere else. The chip rows — twenty-four service
   areas, seven industries, nine filter facets — are sets whose argument is the
   set, and a pictogram per member would be inventing a meaning for each that the
   client never wrote. §42's six are different: they are six unlike things a
   product will do, on the one page with no photography, no diagram and no case
   study to look at, and they were six identical rows separated by hairlines.

   THESE WEAR THE OPEN CORNER, unlike everything above. Where one of them
   contains a container — a sheet, a panel, a canvas — that container's
   bottom-right corner is left open, drawn exactly as `computeFramePath` draws the
   Q and as `styles/frame.css` cuts it at section and card scale. This is the
   third and smallest scale of the same mark, and it is on the one page whose
   subject is a thing that is not finished yet.                                */

/** Submit Your Startup Idea — the idea leaving through the opening. */
function IdeaGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M12.5 20.5 H6.5 A2.5 2.5 0 0 1 4 18 V6 A2.5 2.5 0 0 1 6.5 3.5 H14.5 A2.5 2.5 0 0 1 17 6 V11.5" />
      <path d="M7.5 8 H13.5 M7.5 11.5 H11" opacity={0.6} />
      {/* Out through the open corner, with the arrowhead the growth diagram
          uses — two strokes meeting at the corner rather than a chevron. */}
      <path d="M13 20 L20.5 12.5" />
      <path d="M16.5 12.5 H20.5 V16.5" />
    </svg>
  );
}

/** Founder Dashboard — a panel with its own reporting in it. */
function DashboardGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M15.5 19.5 H6 A2.5 2.5 0 0 1 3.5 17 V7 A2.5 2.5 0 0 1 6 4.5 H18 A2.5 2.5 0 0 1 20.5 7 V15" />
      <path d="M3.5 8.5 H20.5" opacity={0.6} />
      <path d="M8 16.5 V12.5 M12 16.5 V11 M16 16.5 V13.5" />
    </svg>
  );
}

/** Build with the QAVYX Team — three parties, joined. */
function TeamGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <circle cx={6.8} cy={7.5} r={2.8} />
      <circle cx={17.2} cy={7.5} r={2.8} />
      <circle cx={12} cy={17} r={2.8} />
      <path d="M9.6 7.5 H14.4" opacity={0.6} />
      <path d="M8.2 9.9 L10.6 14.6 M15.8 9.9 L13.4 14.6" opacity={0.6} />
    </svg>
  );
}

/** Branding & Product Development — the mark, and the hand drawing it. */
function BrandingGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M10.5 14.5 H5 A2.5 2.5 0 0 1 2.5 12 V5 A2.5 2.5 0 0 1 5 2.5 H12 A2.5 2.5 0 0 1 14.5 5 V10" />
      <path d="M13 19 L19 13 L21 15 L15 21 Z" />
      <path d="M13 19 L11.8 22.2 L15 21" />
    </svg>
  );
}

/** Marketing & Growth Support — the trend leaving the chart, at icon scale. */
function GrowthGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M3.5 20.5 H20.5" opacity={0.6} />
      <path d="M5.5 16.5 L10 12 L13.5 14 L19 7.5" />
      <path d="M15 7.5 H19 V11.5" />
    </svg>
  );
}

/** Investor & Seed Funding Opportunities — the seed, not a currency symbol. */
function SeedGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M12 21 V11.5" />
      <path d="M12 14.5 C8 14.5 5.5 12 5.5 8 C9.5 8 12 10.5 12 14.5 Z" />
      <path d="M12 12.5 C15.2 12.5 17.5 10.3 17.5 7 C14.3 7 12 9.2 12 12.5 Z" />
    </svg>
  );
}

/**
 * §42's label → its glyph.
 *
 * A map rather than a switch, and keyed by the client's own label, so an item
 * without a glyph is a MISSING KEY rather than a silent fallback — the same
 * contract `SERVICE_VISUALS` has with `content/services.ts`.
 * `tests/unit/launchpad-content.test.ts` fails if the two ever disagree, which
 * is what makes this safe to key on a string the client may reword.
 */
export const WHATS_COMING_GLYPHS: Record<string, (props: IconProps) => React.JSX.Element> = {
  'Submit Your Startup Idea': IdeaGlyph,
  'Founder Dashboard': DashboardGlyph,
  'Build with the QAVYX Team': TeamGlyph,
  'Branding & Product Development': BrandingGlyph,
  'Marketing & Growth Support': GrowthGlyph,
  'Investor & Seed Funding Opportunities': SeedGlyph,
};

/* --- the five pillars ------------------------------------------------------
   `/services` is an index of five rows, and until now they were five lines of
   type distinguished only by the words on them. These are the mark that says
   which pillar a row is before it has been read.

   EACH ONE IS ITS 240 x 180 DIAGRAM, REDUCED — not a new drawing of the same
   subject. `components/services/visuals/index.tsx` already decided what each
   pillar looks like, that decision was made against the client's own copy, and
   a second unrelated pictogram for the same thing would mean the carousel slide
   and the row it links to argue about what the service is. So the geometry here
   is the diagram's own, scaled by 1/10 on x and 24/180 on y, with everything
   dropped that stops resolving: the growth chart loses its bars, the feed stack
   loses its third frame, the automation graph loses its input node, the build
   diagram loses the browser window above its funnel.

   TWO THINGS THE DIAGRAMS DO THAT THESE MUST NOT. They take exactly one
   `--qx-green` accent — at 16px a single green stroke among grey ones reads as a
   rendering fault, so these inherit one colour like every other icon in this
   file. And they are 2px strokes on a 240-unit box; these are 1.5 on 24.

   THEY DO NOT WEAR THE OPEN CORNER either, unlike §42's six above. That mark is
   on the Launchpad page because its subject is a thing that is not finished yet.
   These five are shipping services.                                           */

/** Social & Content — one story cut for several feeds. */
function SocialGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <rect x={7.5} y={3} width={13.5} height={18} rx={3.5} />
      {/* The rest of the stack, as two spines rather than two more frames: at
          this size overlapping rounded rects cross each other's strokes and the
          result is hatching, not depth. */}
      <path d="M5.5 6 V18" opacity={0.6} />
      <path d="M3 8.5 V15.5" opacity={0.4} />
      <path d="M12.3 8.5 L16.5 12 L12.3 15.5 Z" />
    </svg>
  );
}

/** AI & Automation — one input fanning into work that runs without a hand on it. */
function AutomationGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <rect x={4} y={9.5} width={7.5} height={5} rx={2} />
      <path d="M11.5 12 H15.5" opacity={0.6} />
      <path d="M15.5 5.5 V18.5" opacity={0.6} />
      <circle cx={17.5} cy={5.5} r={2} />
      <circle cx={17.5} cy={12} r={2} />
      <circle cx={17.5} cy={18.5} r={2} />
    </svg>
  );
}

/**
 * Build & Scale — the funnel, which is what its diagram makes the accent.
 *
 * The 240 x 180 version is a browser window ABOVE a funnel, and the window is
 * the half that had to go: at 24px a chrome bar with three dots in it is four
 * strokes inside 8 pixels. What survives is the half the diagram itself puts the
 * green on — "visitors in at the top, one customer out of the bottom" — which is
 * also the half that is not a generic rectangle.
 */
function BuildGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M8 3 V4.5 M12 2.2 V4.5 M16 3 V4.5" opacity={0.6} />
      <path d="M3.5 6 H20.5 L14 13 V19.5 L10 21.5 V13 Z" />
    </svg>
  );
}

/** Launch — the vehicle, straight off `LaunchVisual` at a tenth the size. */
function LaunchGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M12 3.7 C14.2 7.2 15 11.2 15 14.9 H9 C9 11.2 9.8 7.2 12 3.7 Z" />
      <circle cx={12} cy={9.6} r={1.6} />
      <path d="M9 14.9 L6.8 17.9 H9.6" opacity={0.7} />
      <path d="M15 14.9 L17.2 17.9 H14.4" opacity={0.7} />
      <path d="M11.2 16.8 L12 19.2 L12.8 16.8" opacity={0.8} />
    </svg>
  );
}

/**
 * Pillar slug → glyph.
 *
 * Keyed by `slug` and not by title, unlike `WHATS_COMING_GLYPHS` above: a slug
 * is also the route, so it is the one string about a pillar that cannot be
 * reworded without a redirect. A missing key is a missing icon rather than a
 * silent fallback, and `tests/unit/services.test.ts` fails on one — the same
 * contract `SERVICE_VISUALS` has with the same five slugs.
 *
 * GROWTH MARKETING REUSES `GrowthGlyph` rather than getting a sixth drawing.
 * §42's "Marketing & Growth Support" is the same subject and already has the
 * trend-leaving-the-chart mark; a second one differing by a few pixels in the
 * same file is precisely the muddiness this file's rules exist to prevent.
 */
export const SERVICE_GLYPHS: Record<string, (props: IconProps) => React.JSX.Element> = {
  'growth-marketing': GrowthGlyph,
  'social-content': SocialGlyph,
  'ai-automation': AutomationGlyph,
  'build-scale': BuildGlyph,
  launch: LaunchGlyph,
};

/* --- §4's six sectors ------------------------------------------------------
   The trust strip is a band that MOVES, and that is the entire justification for
   putting a glyph on each item. This file's standing rule is that an icon exists
   because a row could not be read at a glance without it, never because a
   section looked bare — and a horizontally scrolling label is the one case on
   this site where "at a glance" is literal: the reader cannot go back and
   re-read a token that has already left the frame. The glyph is what an item is
   recognised by while it is passing.

   DRAWN CONVENTIONALLY, like the three contact icons and unlike §42's six.
   A cloche, a mortarboard, a bag: the open-corner mark is the brand speaking,
   and there is no room for it to speak in a shape a reader has ~1.5 seconds to
   identify while it slides past. §42's glyphs can afford the accent because they
   sit still in a card the reader has stopped at.

   NO GREEN. They inherit the item's colour like everything else here, which is
   what lets the whole item — box, glyph and label — go from grey to white
   together when it is pointed at.                                             */

/** Clinics & Healthcare — the trace, not a cross. A cross is a hospital. */
function ClinicGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M2.5 12 H7 L9.2 7 L12.6 17 L14.8 12 H21.5" />
    </svg>
  );
}

/** Hospitality & Restaurants — the cloche. Legible at 16px, where cutlery is
 *  four strokes that merge into a smudge. */
function HospitalityGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M4 15.5 A8 8 0 0 1 20 15.5" />
      <path d="M2.5 15.5 H21.5" />
      <path d="M12 5.4 V7.6" opacity={0.7} />
    </svg>
  );
}

/** Real Estate — two towers, not a house. The client's word is "Developers". */
function RealEstateGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M4.5 20.5 V6.5 H12.5 V20.5" />
      <path d="M12.5 11.5 H19.5 V20.5" />
      <path d="M2.5 20.5 H21.5" />
      <path d="M7.5 10 V11.5 M7.5 14.5 V16" opacity={0.6} />
    </svg>
  );
}

/** Education — the mortarboard. */
function EducationGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M12 4.5 L21.5 9 L12 13.5 L2.5 9 Z" />
      <path d="M6.8 11.2 V15.6 A5.6 2.9 0 0 0 17.2 15.6 V11.2" opacity={0.8} />
    </svg>
  );
}

/** Retail — the bag. */
function RetailGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M5.5 8.5 H18.5 L19.6 20.5 H4.4 Z" />
      <path d="M9 11 V7 A3 3 0 0 1 15 7 V11" opacity={0.8} />
    </svg>
  );
}

/** Travel — the vehicle leaving, which is also this site's whole argument. */
function TravelGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M21 3.5 L2.8 10.8 L10.2 13.8 L13.2 21.2 Z" />
      <path d="M10.2 13.8 L21 3.5" opacity={0.7} />
    </svg>
  );
}

/**
 * Jewellery — a cut stone: crown, girdle, pavilion.
 *
 * The one sector in §10's seven that §4's six do not cover, so it is the only
 * glyph in this group drawn for `WHO_WE_SERVE` rather than reused from
 * `TRUST_GLYPHS`. Facets rather than a solid rhombus: a plain diamond outline at
 * this size reads as an abstract marker — a rotated square — where the girdle
 * line and the crown's V say "stone" immediately.
 */
function JewelleryGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M8 3.5 H16 L20.5 9.5 L12 20.5 L3.5 9.5 Z" />
      <path d="M3.5 9.5 H20.5" opacity={0.7} />
      <path d="M8 3.5 L12 9.5 L16 3.5" opacity={0.7} />
    </svg>
  );
}

/**
 * E-commerce — the cart, and it has to be a cart precisely because Retail is
 * already a bag.
 *
 * §57 names both, four tiles apart, and they are the same trade split by where
 * it happens: the bag is the shop, the cart is the checkout. Two containers with
 * handles would have been one silhouette twice. The wheels are what settle it at
 * a glance — nothing else in this file has any.
 */
function CartGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M2.5 4.5 H5.5 L8.1 15.5 H18.4 L20.5 8 H6.3" />
      <circle cx={9.2} cy={19} r={1.7} />
      <circle cx={17.2} cy={19} r={1.7} />
    </svg>
  );
}

/**
 * Professional Services — the briefcase.
 *
 * It sits two tiles from `RetailGlyph` and they are the closest pair in this
 * file: both are a container with a handle. What separates them is the shape of
 * both halves — a wide square-shouldered case with a squared handle against a
 * tapering bag with a round one — and the label beside it, which is the same
 * contract every glyph here works under. None of them is the sole indicator of
 * anything.
 *
 * The alternatives were worse. A document is what "content" looks like on this
 * site, and a seal or badge says "accredited" rather than naming a sector.
 */
function BriefcaseGlyph({ className = SIZE }: IconProps) {
  return (
    <svg {...ICON} className={className}>
      <path d="M3.5 7.5 H20.5 V19.5 H3.5 Z" />
      <path d="M9 7.5 V6 A2 2 0 0 1 11 4 H13 A2 2 0 0 1 15 6 V7.5" opacity={0.8} />
      <path d="M3.5 12.5 H20.5" opacity={0.6} />
    </svg>
  );
}

/**
 * §4's sector → its glyph.
 *
 * Keyed by the client's own words, exactly as `WHATS_COMING_GLYPHS` is, so a
 * sector without a glyph is a missing key rather than a silent gap in a moving
 * band — where a gap is much harder to notice than in a static grid.
 * `tests/unit/trust-strip.test.ts` fails if these six and `TRUST.sectors` ever
 * disagree in either direction.
 */
export const TRUST_GLYPHS: Record<string, (props: IconProps) => React.JSX.Element> = {
  'Clinics & Healthcare': ClinicGlyph,
  'Hospitality & Restaurants': HospitalityGlyph,
  'Real Estate': RealEstateGlyph,
  Education: EducationGlyph,
  Retail: RetailGlyph,
  Travel: TravelGlyph,
};

/**
 * §10's seven industries → their glyphs, for `components/home/WhoWeServe.tsx`.
 *
 * SIX OF THE SEVEN ARE `TRUST_GLYPHS`' OWN, and the aliasing is the point rather
 * than a shortcut. §4's marquee and §10's grid name the same sectors in the
 * client's two different registers — "Retail" in the band, "Local Businesses &
 * Retail Brands" in the grid — and a second drawing of a shopping bag for the
 * second wording would be a second opinion about what retail looks like, on the
 * same page, four screens apart. Jewellery is the one sector §4 does not carry.
 *
 * Keyed by the client's own strings, exactly as `TRUST_GLYPHS` is, so a sector
 * without a glyph is a missing key rather than a silently unmarked tile.
 * `tests/unit/home-content.test.ts` fails if these seven and `WHO_WE_SERVE` ever
 * disagree in either direction.
 */
export const SERVE_GLYPHS: Record<string, (props: IconProps) => React.JSX.Element> = {
  'Clinics & Healthcare Brands': ClinicGlyph,
  'Restaurants & Hospitality': HospitalityGlyph,
  'Educational Institutions': EducationGlyph,
  'Real Estate Developers': RealEstateGlyph,
  'Travel Agencies': TravelGlyph,
  'Jewellery Showrooms': JewelleryGlyph,
  'Local Businesses & Retail Brands': RetailGlyph,
};

/**
 * §57's nine industries → their glyphs, for `/projects`.
 *
 * THE THIRD REGISTER OF THE SAME LIST, and the aliasing runs one step further
 * than `SERVE_GLYPHS`' does. §4 says "Retail", §10 says "Local Businesses &
 * Retail Brands", §57 says "Retail" again in a list of nine — three sections,
 * three phrasings, and the reason a shopping bag is drawn once in this file is
 * that a second one would be a second opinion about what retail looks like.
 * Six of the nine are `TRUST_GLYPHS`' own drawings under §57's wording.
 *
 * `SeedGlyph` carries Startups, and that is the one alias worth defending: it
 * was drawn for §42's "Investor & Seed Funding Opportunities" on the Launchpad
 * page, which is a funding stage rather than a sector. A sprout is the mark for
 * an early-stage company in either sentence, and the alternative — a rocket — is
 * `LaunchGlyph`, the fifth PILLAR's mark, which would say "this industry is one
 * of our services".
 *
 * Keyed by the client's own strings, exactly as the two maps above are, so an
 * industry renamed in `content/projects.ts` is a missing key rather than one
 * unmarked tile among eight marked ones. `tests/unit/projects-content.test.ts`
 * fails if these nine and `INDUSTRIES.items` disagree in either direction.
 */
export const INDUSTRY_GLYPHS: Record<string, (props: IconProps) => React.JSX.Element> = {
  Healthcare: ClinicGlyph,
  'Restaurants & Cafés': HospitalityGlyph,
  'Real Estate': RealEstateGlyph,
  Education: EducationGlyph,
  Retail: RetailGlyph,
  'Travel & Tourism': TravelGlyph,
  'E-commerce': CartGlyph,
  'Professional Services': BriefcaseGlyph,
  Startups: SeedGlyph,
};
