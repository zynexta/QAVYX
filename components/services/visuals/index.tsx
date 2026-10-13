/**
 * Every 240 x 180 line drawing on the site: the carousel's six, Who We Are's,
 * and the nineteen that illustrate the section cards on the four unnumbered
 * pillar pages. §6 The Solution had one too and no longer does — the note where
 * it stood says why, and it is a decision rather than a gap.
 *
 * They all live in one file on purpose: they share a coordinate system, a stroke
 * vocabulary and a node budget, and splitting them into a module each would
 * duplicate that contract a dozen times without making any of them clearer.
 *
 * RULES (BUILD-PLAN Phase 7 performance notes):
 *  - STATIC. Nothing here animates, ever. The carousel's translation is the
 *    motion; a diagram that also moves is decoration competing with it.
 *  - ≤ 40 nodes each. All six are in the DOM for the whole session so the
 *    panels stay accessible and server-renderable (Phase 12), which means their
 *    cost is paid once, on every repaint of the expanding frame.
 *  - Base strokes are `currentColor` so a panel's dimmed state carries into its
 *    diagram; exactly ONE element per visual takes the green, and it is always
 *    the thing the service is actually about.
 *
 * `LaunchpadVisual` is exported on its own and is deliberately NOT in
 * `SERVICE_VISUALS`: that map is keyed on pillar slug and
 * `tests/unit/services.test.ts` asserts its keys are exactly the five pillars,
 * which is the tripwire that makes a real sixth pillar fail loudly. Launchpad is
 * a panel, not a pillar, so it takes the diagram without tripping the wire.
 */

const BOX = { viewBox: '0 0 240 180', fill: 'none' } as const;
const LINE = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;
const ACCENT = { ...LINE, stroke: 'var(--qx-green)' } as const;

/** Growth Marketing — spend compounding into a trend that leaves the chart. */
function GrowthVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path {...LINE} d="M24,156 H216" opacity={0.5} />
      <path {...LINE} d="M24,156 V28" opacity={0.5} />
      {[
        [56, 118],
        [96, 96],
        [136, 70],
        [176, 44],
      ].map(([x, y]) => (
        <rect
          key={x}
          {...LINE}
          x={x}
          y={y}
          width={22}
          height={156 - y!}
          rx={3}
          opacity={0.55}
        />
      ))}
      <path {...ACCENT} d="M40,132 L88,104 L128,78 L188,34" />
      <path {...ACCENT} d="M168,34 H188 V54" />
    </svg>
  );
}

/** Social & Content — the same story cut for three different feeds. */
function SocialVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <rect {...LINE} x={28} y={44} width={78} height={104} rx={8} opacity={0.4} />
      <rect {...LINE} x={52} y={32} width={78} height={116} rx={8} opacity={0.65} />
      <rect {...LINE} x={84} y={20} width={92} height={128} rx={10} />
      <path {...ACCENT} d="M120,60 L152,80 L120,100 Z" />
      <path {...LINE} d="M104,122 H156" opacity={0.6} />
      <path {...LINE} d="M104,134 H136" opacity={0.4} />
      <circle {...ACCENT} cx={196} cy={52} r={8} />
      <path {...LINE} d="M196,68 V96" opacity={0.5} />
    </svg>
  );
}

/** AI & Automation — one input fanning into work that runs without a hand on it. */
function AutomationVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <circle {...ACCENT} cx={36} cy={90} r={11} />
      <path {...LINE} d="M47,90 H84" opacity={0.6} />
      <rect {...LINE} x={84} y={68} width={44} height={44} rx={8} />
      <path {...LINE} d="M128,90 H164" opacity={0.6} />
      <path {...LINE} d="M106,68 V40 H176" opacity={0.6} />
      <path {...LINE} d="M106,112 V140 H176" opacity={0.6} />
      <circle {...LINE} cx={188} cy={40} r={11} opacity={0.75} />
      <circle {...LINE} cx={188} cy={90} r={11} opacity={0.75} />
      <circle {...LINE} cx={188} cy={140} r={11} opacity={0.75} />
      <path {...LINE} d="M96,84 H116 M96,96 H108" opacity={0.5} />
    </svg>
  );
}

/** Build & Scale — the site the campaigns point at, and what it converts. */
function BuildVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <rect {...LINE} x={28} y={26} width={184} height={92} rx={8} />
      <path {...LINE} d="M28,52 H212" opacity={0.6} />
      <circle {...LINE} cx={44} cy={39} r={3.5} opacity={0.6} />
      <circle {...LINE} cx={58} cy={39} r={3.5} opacity={0.6} />
      <circle {...ACCENT} cx={72} cy={39} r={3.5} />
      <path {...LINE} d="M48,72 H120 M48,90 H96" opacity={0.55} />
      <rect {...LINE} x={144} y={66} width={48} height={36} rx={5} opacity={0.55} />
      {/* The funnel, not a blockchain cube. The pillar used to be Build & Web3
          and this was an isometric block; the draft has no Web3 in it and calls
          pillar four Build & Scale — website, conversion optimization, CRM,
          funnels, growth systems. So the accent is the conversion: visitors in
          at the top, one customer out of the bottom. */}
      <path {...LINE} d="M72,130 H168" opacity={0.5} />
      <path {...ACCENT} d="M84,138 H156 L128,166 H112 Z" />
      <path {...LINE} d="M96,120 V128 M120,116 V128 M144,120 V128" opacity={0.6} />
    </svg>
  );
}

/** Launch — nothing to something: incorporated, positioned, live. */
function LaunchVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path {...LINE} d="M40,150 H200" opacity={0.5} />
      <path {...ACCENT} d="M120,28 C142,54 150,84 150,112 H90 C90,84 98,54 120,28 Z" />
      <circle {...LINE} cx={120} cy={72} r={12} />
      <path {...LINE} d="M90,112 L68,134 H96" opacity={0.7} />
      <path {...LINE} d="M150,112 L172,134 H144" opacity={0.7} />
      <path {...ACCENT} d="M112,124 L120,142 L128,124" opacity={0.8} />
      <path {...LINE} d="M56,60 V78 M64,69 H48" opacity={0.45} />
      <path {...LINE} d="M188,92 V106 M195,99 H181" opacity={0.45} />
    </svg>
  );
}

/**
 * Launchpad — the pad is built, the startup is not on it yet.
 *
 * The one visual here that has to say a DATE as well as a subject, because the
 * panel's own eyebrow says "Coming Soon" and a finished-looking drawing would
 * contradict it. So: a real gantry in solid stroke, and the thing it is waiting
 * for as a dashed outline. The green goes on the dashed silhouette, which is the
 * rule holding — the accent is what the panel is actually about, and what this
 * panel is about is the startup that has not arrived.
 *
 * NOT A SECOND ROCKET. `LaunchVisual` (pillar five, "from idea to launch") is a
 * rocket standing on the ground, and the two panels are now adjacent in the
 * slider: 05 Launch, 06 Launchpad. Drawing a rocket here would put near-identical
 * marks on consecutive slides. The pad is the half of the image the Launch pillar
 * does not use, and the queue of founders on the right is §43's "first 100",
 * which nothing else in the drawing could carry.
 */
function LaunchpadVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path {...LINE} d="M28,156 H212" opacity={0.5} />
      {/* The pad, and its two legs down to the ground line. */}
      <rect {...LINE} x={74} y={140} width={92} height={12} rx={3} opacity={0.7} />
      <path {...LINE} d="M86,152 V156 M154,152 V156" opacity={0.5} />
      {/* The gantry: built, staffed, waiting. */}
      <path {...LINE} d="M62,140 V44 H98" opacity={0.65} />
      <path {...LINE} d="M62,114 H92 M62,86 H92 M62,58 H92" opacity={0.4} />
      {/* The startup that is not here yet. */}
      <path
        {...ACCENT}
        strokeDasharray="6 5"
        d="M120,54 C138,78 146,106 146,132 H94 C94,106 102,78 120,54 Z"
      />
      <path {...LINE} strokeDasharray="6 5" d="M94,132 H78 M146,132 H162" opacity={0.45} />
      {/* §43's queue — the first hundred, waiting for the pad. */}
      <circle {...LINE} cx={190} cy={96} r={5} opacity={0.6} />
      <circle {...LINE} cx={190} cy={116} r={5} opacity={0.45} />
      <circle {...LINE} cx={190} cy={136} r={5} opacity={0.3} />
    </svg>
  );
}

export { LaunchpadVisual };

/**
 * §6 The Solution HAS NO FIGURE, and this note is here so nobody draws it twice.
 *
 * A `ConvergenceVisual` lived here for two rounds — five scattered blocks at
 * unequal sizes gathering along five hairlines into one green capsule, which is
 * §6's own sentence ("instead of juggling multiple agencies and platforms, you
 * work with one strategic partner") drawn rather than written. It was removed on
 * the client's direction on 2026-08-30, and what it learned on the way out is
 * worth keeping even though the code is not.
 *
 * ## Two defects that were real, measured, and fixed
 *
 * IT WAS NOT VISIBLE. It was `text-qx-line` on the reasoning that hairline
 * colour suits a drawing on `--qx-black` — but `.qx-frame` fills its interior
 * with `--qx-ink` (#0a0c0b), where `--qx-line` is 1.23:1 at FULL strength, and
 * every element multiplied that by an opacity fraction on top. The brightest
 * grey in the figure composited to 1.12:1 and the connectors to 1.03:1. Any
 * framed figure is `text-qx-grey`, the same as the nineteen section-card
 * drawings; `--qx-line` is for hairlines, not for pictures.
 *
 * THE GREEN WAS A WIDGET. A 124x40 rounded rect with two full-height walls
 * through it is a segmented control — three compartments offered as the answer
 * to a section about not having five things. A green rounded rect with dividers
 * in it will read as a control whatever the dividers are supposed to mean; if
 * the claim is "one", draw one undivided object and let the prose carry the
 * subdivisions.
 *
 * ## And one that could not be fixed by redrawing
 *
 * Wiring only three of the five blocks read as broken rather than as selective,
 * and wiring all five to a single point drew a symmetric `>` — a stock funnel
 * arrow. Uneven offsets, uneven gaps and a landing seam instead of a point fixed
 * that (three layouts were rendered at size and compared; a full-width bar with
 * everything dropping onto it read as a bar-chart axis, so do not reach for it).
 *
 * What survived all of that was a legible abstract diagram whose meaning the
 * client still had to ask for. FIVE BLANK ROUNDED RECTANGLES CANNOT SAY
 * "agencies and platforms" — they can only say "five of something", and a figure
 * that needs its caption explained is doing less work than the white space it
 * replaced.
 *
 * ## If this is reopened
 *
 * The gap is real: §6 sits in the 2,453px run (§5, §6, Why QAVYX) with no marks
 * in it that the client has twice called "graphics missing", so cutting this put
 * that run back. What it wants is a figure with real SUBJECTS in it — a chart, a
 * browser window, a cog, the tools being juggled — the way `SocialVisual` draws
 * phones and `BuildVisual` draws a browser. Not another arrangement of blank
 * rectangles. Ask the client before drawing it; see `LaunchStatic`'s note at the
 * section itself.
 */
/**
 * Who We Are — one team with a boundary round it, and we are inside it.
 *
 * §46's heading is "We're Not an Agency. We're Your Growth Team." and its last
 * paragraph is "QAVYX becomes an extension of your team". So: enclosure
 * brackets — set notation, and the one piece of vocabulary nothing else here
 * uses — round six members of equal size, connected to each other, with the
 * green on one of them. The green member is neither the top of the ring nor its
 * centre, because both of those draw an agency sitting above or in the middle of
 * the client rather than a colleague in the same set.
 *
 * THE FIVE ARE ALL AT ONE OPACITY, which is a departure worth stating. Every
 * other figure in this file varies opacity to build depth; here uniformity IS
 * the claim — the moment one member is dimmer than the others the picture says
 * the team has a hierarchy, and the sentence it illustrates says the opposite.
 *
 * IT IS NOT `ConvergenceVisual` AGAIN. §46's second paragraph ("instead of
 * working with multiple agencies, freelancers, or disconnected tools") is the
 * same argument the homepage's §6 makes. That section used to own the drawing of
 * it — five scattered blocks becoming one bar — and although the figure has since
 * been cut, the reasoning here is unchanged and if anything stronger: the cut
 * happened partly because blank rectangles could not say "agencies". Redrawing it here
 * would put two versions of one idea on two routes. This takes the half §6 does
 * not: not the consolidation, the membership.
 */
function GrowthTeamVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      {/* The set's brackets, and they are open at top and bottom: a closed box
          would be a container the members are held in, which is the agency
          reading. A bracket is a boundary you can be counted inside. */}
      <path {...LINE} d="M74,26 H50 V154 H74 M166,26 H190 V154 H166" opacity={0.55} />
      {/* Drawn between the circles rather than through them, so the ring reads
          as six things that are connected and never as one hexagon with dots
          stuck on its corners. */}
      <path
        {...LINE}
        d="M130,52 L148,62 M158,80 V100 M148,118 L130,128 M110,128 L92,118 M82,100 V80 M92,62 L110,52"
        opacity={0.28}
      />
      <circle {...LINE} cx={120} cy={46} r={12} opacity={0.6} />
      <circle {...ACCENT} cx={158} cy={68} r={12} />
      <circle {...LINE} cx={158} cy={112} r={12} opacity={0.6} />
      <circle {...LINE} cx={120} cy={134} r={12} opacity={0.6} />
      <circle {...LINE} cx={82} cy={112} r={12} opacity={0.6} />
      <circle {...LINE} cx={82} cy={68} r={12} opacity={0.6} />
    </svg>
  );
}

export { GrowthTeamVisual };

/**
 * ---------------------------------------------------------------------------
 * The section figures — every card on the four unnumbered pillar pages.
 * ---------------------------------------------------------------------------
 *
 * A pillar page's section card is a two-column grid: a 15rem rail holding the
 * section's name, and the copy beside it. The rail runs the full height of the
 * row, so on every card it is a name and then a quarter of a metre of nothing —
 * which is most of what the client means when they say a page looks like the
 * graphics are missing.
 *
 * ## It was ONE card per page, and one was worse than none
 *
 * The first cut drew only the card on each page whose subject most contradicted
 * having no picture, on the reasoning that four figures make an emphasis where
 * nineteen make a pattern. In the browser it did the opposite: a single figure
 * with four empty rails beside it reads as four drawings that failed to load,
 * not as one that was chosen. Consistency inside a page beats variety across the
 * set, and the client's question was "why only one".
 *
 * They are cheaper than they look, because the space was already empty. The copy
 * column is the taller of the two on almost every card, so a 180px figure lands
 * in rail that was reserved and unused: eleven of the fifteen grew their card by
 * 48px or less and one grew it by nothing at all.
 *
 * ## A form language per PAGE, not nineteen unrelated genera
 *
 * Nineteen figures picked one at a time is how this becomes wallpaper — the path
 * of least resistance in this vocabulary is a rounded rectangle with something in
 * it, and left alone every drawing converges on one. So each page is a family,
 * and the families differ:
 *
 *   - **Social & Content** — the TOOLS OF THE TRADE. A calendar, an edit
 *     timeline, a camera set, a channel mixer, a return path. Five instruments,
 *     one per card, none of them a phone (the aside is already three of those).
 *   - **AI & Automation** — SOMETHING BEING PRODUCED, and the production shown.
 *     A page being written, a presenter being synthesised, a thread answering
 *     itself, behaviour being read, a loop running unattended.
 *   - **Build & Scale** — THINGS YOU BUILD AND READ. A layout, a dial, a record
 *     system, a staged funnel, a rack with room in it.
 *   - **Launch** — PLANS AND GUIDES. A checklist, a profile, a construction
 *     sheet, a roadmap. Measured geometry, because everything on that page is
 *     something that has not happened yet.
 *
 * Each page's aside is the fifth thing on it and is excluded from its family by
 * being a different KIND of drawing — the pillar's own emblem rather than one of
 * its parts. What the families are for is stopping two figures on one page
 * having the same silhouette.
 *
 * ## They are `--qx-grey`, and the asides are `--qx-line`
 *
 * The two ink choices are not an inconsistency, they are the same decision
 * against two surfaces. A title-block aside sits on `--qx-black`; a section
 * figure sits inside a card, on `--qx-ink-raised`, where `--qx-line` measures
 * 1.14:1 and is not a quiet drawing but an absent one. `--qx-grey` on that
 * surface is 6.2:1 at full strength, so these carry their quiet in the per-element
 * opacities the contract already asks for (0.2–0.75) and leave the accent at 1.0,
 * where it reads about twice as strongly as the base — the same relationship the
 * asides have on black. See `styles/tokens.css` for the measured ratios.
 */

/* --- Social & Content: the tools of the trade ------------------------------ */

/**
 * "Social Media Growth & Management" — the posting calendar.
 *
 * §19 is one sentence and no list: "strategic content, REGULAR POSTING, and
 * audience engagement". Regular is the word the drawing has to carry, and a
 * calendar with the slots filled is what regular looks like. The green is the
 * next post rather than a past one — this is a service that is running, not a
 * record of one that ran.
 *
 * Not a rising line. The trend leaving the chart belongs to `GrowthVisual` and is
 * the most reused mark on this site; borrowing it here would say this section is
 * about growth in the abstract rather than about someone doing the posting.
 */
function CalendarVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path {...LINE} d="M64,22 V38 M160,22 V38" opacity={0.5} />
      <rect {...LINE} x={28} y={34} width={168} height={120} rx={5} opacity={0.55} />
      <path {...LINE} d="M28,58 H196" opacity={0.4} />
      <path
        {...LINE}
        d="M70,58 V154 M112,58 V154 M154,58 V154 M28,90 H196 M28,122 H196"
        opacity={0.18}
      />
      <rect {...LINE} x={38} y={68} width={22} height={12} rx={3} opacity={0.5} />
      <rect {...LINE} x={122} y={68} width={22} height={12} rx={3} opacity={0.45} />
      <rect {...LINE} x={80} y={100} width={22} height={12} rx={3} opacity={0.5} />
      <rect {...LINE} x={164} y={100} width={22} height={12} rx={3} opacity={0.4} />
      <rect {...LINE} x={38} y={132} width={22} height={12} rx={3} opacity={0.45} />
      <rect {...ACCENT} x={122} y={132} width={22} height={12} rx={3} />
    </svg>
  );
}

/**
 * "Short-Form Video & Reels" — the edit, not the reel.
 *
 * §20 is "from ideas to EDITING", and the four services are strategy, script,
 * editing and trends. The finished vertical video is what `SocialVisual` already
 * draws at the top of this page, three frames deep with a play triangle on it; a
 * fourth phone here would be the same picture twice on one screen. The timeline
 * is the half that page does not have — the work rather than the output.
 *
 * The green is the clip under the playhead: the cut being made.
 */
function TimelineVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path {...LINE} d="M20,32 H220" opacity={0.35} />
      <path
        {...LINE}
        d="M44,26 V32 M84,26 V32 M124,26 V32 M164,26 V32 M204,26 V32"
        opacity={0.3}
      />
      <rect {...LINE} x={20} y={44} width={58} height={36} rx={4} opacity={0.5} />
      <rect {...ACCENT} x={84} y={44} width={52} height={36} rx={4} />
      <rect {...LINE} x={142} y={44} width={78} height={36} rx={4} opacity={0.38} />
      <rect {...LINE} x={20} y={90} width={200} height={36} rx={4} opacity={0.22} />
      <path
        {...LINE}
        d="M28,116 V100 M44,122 V94 M60,112 V104 M76,120 V96 M92,116 V100 M108,122 V94 M124,110 V106 M140,118 V98 M156,120 V96 M172,114 V102 M188,122 V94 M204,116 V100"
        opacity={0.28}
      />
      <path {...LINE} d="M110,20 V134 M104,20 H116" opacity={0.55} />
    </svg>
  );
}

/**
 * Social & Content, "Content Production" — the shot, not the feed.
 *
 * §21 is product photography, brand videos, creative designs and promotional
 * content: the section is about the day the asset is MADE. `SocialVisual` — the
 * aside at the top of this very page — is already the finished post in three
 * feeds, so a second stack of phones here would illustrate the same page twice.
 *
 * The green is the frame of the shot, because the frame is what the section
 * produces. Everything else is the apparatus that produces it, and the light is
 * deliberately outside the green rectangle: what is in frame is the deliverable,
 * and the kit never is.
 */
function ProductionVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path {...LINE} d="M16,158 H224" opacity={0.4} />
      {/* The camera, on its legs. */}
      <rect {...LINE} x={22} y={70} width={50} height={36} rx={6} opacity={0.75} />
      <rect {...LINE} x={32} y={61} width={18} height={9} rx={2} opacity={0.5} />
      <circle {...LINE} cx={82} cy={88} r={13} opacity={0.75} />
      <circle {...LINE} cx={82} cy={88} r={5.5} opacity={0.45} />
      <path {...LINE} d="M46,106 V134 M46,134 L28,158 M46,134 L64,158" opacity={0.5} />
      {/* The line of sight, at the lowest opacity in the figure: it is the one
          mark here that is not a thing, and drawing it at the weight of the
          apparatus would make the camera look wired to the subject. */}
      <path {...LINE} d="M95,88 H136" opacity={0.22} />
      <path {...ACCENT} d="M136,54 H216 V154 H136 Z" />
      {/* The subject on its plinth, inside the frame. */}
      <rect {...LINE} x={158} y={90} width={36} height={52} rx={7} opacity={0.7} />
      <rect {...LINE} x={169} y={78} width={14} height={12} rx={3} opacity={0.7} />
      <rect {...LINE} x={140} y={142} width={72} height={12} rx={2} opacity={0.5} />
      {/* The softbox, and it sits above the frame's top edge rather than inside
          it — the kit is out of shot. */}
      <rect {...LINE} x={150} y={18} width={52} height={14} rx={3} opacity={0.45} />
      {/* A SPREADING BEAM AND NOT RAYS. Anything drawn straight down from a box
          suspended above something else is read as legs — two strokes made the
          softbox stand on the frame, three made it a tripod. Two lines that
          widen do not: nothing stands on a splay. They stop short of the frame's
          top corners so they stay light rather than becoming its perspective. */}
      <path {...LINE} d="M156,32 L143,50 M196,32 L209,50" opacity={0.22} />
    </svg>
  );
}

/**
 * "Performance Marketing Across Social" — the mix, not the chart.
 *
 * §22 names FIVE platforms — Meta, Google, LinkedIn, X, Telegram — and one
 * service, "Campaign Optimization". Five channels with one budget between them
 * and a hand on each is a mixer, and a mixer is the one instrument that shows
 * both at once: how much each channel is getting, and that somebody is moving it.
 *
 * The green fader is the channel that is working — the one optimization has
 * pushed up. Five equal bars in a chart would have said the opposite, and the bar
 * chart belongs to `GrowthVisual` anyway.
 */
function MixVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path {...LINE} d="M24,50 H32 M24,74 H32 M24,98 H32 M24,122 H32" opacity={0.25} />
      <path
        {...LINE}
        d="M52,34 V140 M90,34 V140 M128,34 V140 M166,34 V140 M204,34 V140"
        opacity={0.3}
      />
      <rect {...LINE} x={39} y={90} width={26} height={12} rx={3} opacity={0.5} />
      <rect {...LINE} x={77} y={66} width={26} height={12} rx={3} opacity={0.42} />
      <rect {...LINE} x={115} y={104} width={26} height={12} rx={3} opacity={0.38} />
      <rect {...ACCENT} x={153} y={52} width={26} height={12} rx={3} />
      <rect {...LINE} x={191} y={80} width={26} height={12} rx={3} opacity={0.45} />
      <path {...LINE} d="M28,152 H216" opacity={0.35} />
    </svg>
  );
}

/**
 * "Retargeting Systems" — the visitors who left, and the one path back.
 *
 * §23's sentence is the whole drawing: "bring back visitors who showed interest".
 * So the page is on the left with the action they did not take marked on it, the
 * interest is three nodes drifting off it at falling opacity, and the green is
 * the return — one curve, with a head on it, landing on the thing they did not
 * press.
 *
 * The head matters. Every other line in this set is undirected, and this is the
 * one figure whose entire claim is a DIRECTION: they went that way, we bring them
 * back this way.
 */
function ReturnVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <rect {...LINE} x={20} y={48} width={92} height={84} rx={6} opacity={0.5} />
      <path {...LINE} d="M20,68 H112" opacity={0.35} />
      <path {...LINE} d="M32,84 H96 M32,96 H76" opacity={0.25} />
      <rect {...LINE} x={32} y={108} width={44} height={14} rx={3} opacity={0.55} />
      {/* Interest, leaving. Falling opacity is elapsed time, not depth. */}
      <circle {...LINE} cx={150} cy={40} r={9} opacity={0.5} />
      <circle {...LINE} cx={186} cy={66} r={9} opacity={0.35} />
      <circle {...LINE} cx={206} cy={104} r={9} opacity={0.22} />
      <path {...ACCENT} d="M198,118 C182,150 116,152 80,130 M92,122 L80,130 L92,140" />
    </svg>
  );
}

/* --- AI & Automation: something being produced ----------------------------- */

/**
 * "AI Content Creation" — the page mid-sentence.
 *
 * §24's claim is volume WITHOUT losing the voice: posts, copy, blogs and creative
 * "while keeping your brand voice consistent". The block at the top of the sheet
 * is that voice — everything below is written under it — and the green is the
 * line being written right now, with its caret. Two lines below it are drawn at
 * 0.12 and are the ones not written yet.
 *
 * NOT ANOTHER FAN. `AutomationVisual`, the aside at the top of this page, is one
 * input branching into three outputs, and "AI makes many things from one brief"
 * is the same sentence. This draws the writing instead of the branching.
 */
function DraftVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <rect {...LINE} x={56} y={10} width={152} height={146} rx={6} opacity={0.15} />
      <rect {...LINE} x={44} y={18} width={152} height={146} rx={6} opacity={0.55} />
      <rect {...LINE} x={60} y={34} width={56} height={12} rx={3} opacity={0.5} />
      <path {...LINE} d="M60,62 H180 M60,78 H164 M60,94 H180 M60,110 H148" opacity={0.3} />
      <path {...ACCENT} d="M60,126 H132 M140,118 V136" />
      <path {...LINE} d="M60,142 H172" opacity={0.12} />
    </svg>
  );
}

/**
 * "AI Videos & Avatars" — a presenter being synthesised, and a voice.
 *
 * §25 is AI presenters, voiceovers and branded avatars. The figure has to say
 * SYNTHETIC, because a drawing of a person in a video frame is a drawing of a
 * film shoot — which is `ProductionVisual` on the next pillar, and the exact cost
 * §25 says this avoids ("without the traditional production costs"). So the
 * presenter is drawn the way a machine holds one: an oval, a tracking box, and
 * landmark points. The green is that box — the avatar is what the section makes.
 *
 * The voice is three nested arcs and deliberately NOT a waveform:
 * `TimelineVisual` on the Social pillar owns the waveform, and a mark that
 * distinctive appearing on two pillars would read as one component reused rather
 * than as two drawings.
 */
function AvatarVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <rect {...LINE} x={28} y={30} width={184} height={106} rx={6} opacity={0.5} />
      <path
        {...LINE}
        d="M96,58 C110,58 118,70 118,84 C118,100 108,110 96,110 C84,110 74,100 74,84 C74,70 82,58 96,58 Z"
        opacity={0.55}
      />
      {/* A MESH, NOT FEATURES. Two eye dashes and a mouth line is a smiley — it
          was, on the first pass — and a smiley is a cartoon of a person where
          this has to be the CONSTRUCTION of one. Three curves following the
          oval's own surface say rendered; nothing says happy. */}
      <path
        {...LINE}
        d="M96,58 V110 M76,78 C86,84 106,84 116,78 M79,94 C87,99 105,99 113,94"
        opacity={0.26}
      />
      <path {...ACCENT} d="M66,50 H126 V120 H66 Z" />
      {/* The voice. Nested arcs, opening away from the frame's subject. */}
      <path
        {...LINE}
        d="M158,74 A12,12 0 0 1 158,98 M170,66 A22,22 0 0 1 170,106 M182,58 A32,32 0 0 1 182,114"
        opacity={0.3}
      />
      <path {...LINE} d="M28,156 H212" opacity={0.28} />
      <circle {...LINE} cx={92} cy={156} r={4} opacity={0.45} />
    </svg>
  );
}

/**
 * "AI-Powered Marketing" — the cloud of behaviour, and the thing found in it.
 *
 * §27 is "analyze customer behaviour" and "AI Recommendations": the section is
 * not about running the campaign, it is about SEEING something in the data that a
 * person scanning a report would not. A scatter is the only honest picture of
 * that, and the green ring is the recommendation — the cluster the analysis
 * returns, drawn round points that are already there rather than replacing them.
 *
 * Unlabelled axes on purpose. Naming them would be inventing a metric §27 does
 * not name, which is the same rule that keeps numbers off `/projects`.
 */
function InsightVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path {...LINE} d="M28,28 V150 H214" opacity={0.4} />
      <circle {...LINE} cx={136} cy={60} r={3.5} opacity={0.45} />
      <circle {...LINE} cx={152} cy={56} r={3.5} opacity={0.4} />
      <circle {...LINE} cx={162} cy={72} r={3.5} opacity={0.45} />
      <circle {...LINE} cx={144} cy={78} r={3.5} opacity={0.4} />
      <circle {...LINE} cx={158} cy={86} r={3.5} opacity={0.45} />
      <circle {...LINE} cx={132} cy={76} r={3.5} opacity={0.35} />
      <circle {...LINE} cx={58} cy={120} r={3.5} opacity={0.3} />
      <circle {...LINE} cx={76} cy={102} r={3.5} opacity={0.35} />
      <circle {...LINE} cx={96} cy={132} r={3.5} opacity={0.3} />
      <circle {...LINE} cx={112} cy={92} r={3.5} opacity={0.35} />
      <circle {...LINE} cx={190} cy={118} r={3.5} opacity={0.3} />
      <circle {...LINE} cx={70} cy={66} r={3.5} opacity={0.3} />
      <circle {...ACCENT} cx={148} cy={70} r={32} />
    </svg>
  );
}

/**
 * "AI Tools & Business Automation" — the loop that runs without a hand on it.
 *
 * §28 is workflow automation, business process automation and "reduce repetitive
 * tasks". Repetition with nobody driving it is a closed cycle, and the arrowhead
 * is what separates a cycle from a ring: this one has a direction and keeps
 * going. The green stage is the one the tools took over.
 *
 * THE ONE FIGURE ON THIS PAGE THAT IS NOT A PANEL. The other four are a sheet, a
 * video frame, three message forms and a plot — all of them rectangles with
 * something inside. A page of five is where a family becomes a pattern, so this
 * one is a circle on purpose.
 */
function LoopVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      {/* A CLOSED RING WITH A MARKER ON IT, not an arc with a gap. The first cut
          left the circle open and put the head in the gap, and a broken circle
          with a chevron floating over the break reads as a rendering fault. The
          direction belongs ON the line. */}
      <circle {...LINE} cx={120} cy={90} r={54} opacity={0.45} />
      <path {...LINE} d="M110,28 L120,36 L110,44" opacity={0.45} />
      {/* Stations at the cardinal points, where the ring crosses them square. At
          45° the same rects are cut corner to corner and read as slashed. */}
      <rect {...ACCENT} x={163} y={82} width={22} height={16} rx={4} />
      <rect {...LINE} x={109} y={136} width={22} height={16} rx={4} opacity={0.4} />
      <rect {...LINE} x={55} y={82} width={22} height={16} rx={4} opacity={0.32} />
    </svg>
  );
}

/**
 * AI & Automation, "WhatsApp & Email Automation" — one enquiry, two channels,
 * nobody at the keyboard.
 *
 * §27's own promise is "automate replies, follow-ups, lead nurturing and customer
 * support WHILE MAINTAINING A PERSONAL EXPERIENCE", so the drawing has to be a
 * conversation rather than a machine. That is also what keeps it off
 * `AutomationVisual`'s territory: the aside at the top of this page is a node
 * graph — one input fanning into three outputs — and it is the diagram of the
 * automation. This is the diagram of what the customer sees, which is a thread.
 *
 * Both named channels are drawn, because the section names both: a bubble for
 * WhatsApp and an envelope for email. The clock between them is the whole point
 * of the word "automation" — the second message goes out later, and no one sent
 * it. The green is the reply that answers without a hand on it.
 */
function ThreadVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      {/* Them. Tail bottom-left, the way an inbound message is drawn everywhere
          a visitor has ever seen one. */}
      <path
        {...LINE}
        d="M24,10 H112 A10,10 0 0 1 122,20 V40 A10,10 0 0 1 112,50 H42 L26,62 L34,50 H24 A10,10 0 0 1 14,40 V20 A10,10 0 0 1 24,10 Z"
        opacity={0.7}
      />
      <path {...LINE} d="M30,24 H104 M30,36 H80" opacity={0.3} />
      {/* Us, automatically. The tail hangs off the corner and drops the same
          12px the inbound one does — taken off the side edge instead it draws a
          long diagonal spike, which reads as a pointer at whatever is below it
          rather than as the same object mirrored. */}
      <path
        {...ACCENT}
        d="M114,66 H202 A10,10 0 0 1 212,76 V96 A10,10 0 0 1 202,106 L214,118 L190,106 H114 A10,10 0 0 1 104,96 V76 A10,10 0 0 1 114,66 Z"
      />
      {/* The reply's own content stays `currentColor`, so the accent remains ONE
          object rather than becoming a second palette inside itself. */}
      <path {...LINE} d="M118,80 H186 M118,92 H160" opacity={0.35} />
      {/* The delay, and then the follow-up on the other channel. */}
      <circle {...LINE} cx={44} cy={142} r={15} opacity={0.35} />
      <path {...LINE} d="M44,132 V142 H52" opacity={0.35} />
      <path {...LINE} d="M59,142 H104" opacity={0.2} />
      <rect {...LINE} x={104} y={122} width={108} height={40} rx={4} opacity={0.5} />
      <path {...LINE} d="M106,126 L158,144 L210,126" opacity={0.32} />
    </svg>
  );
}

/* --- Build & Scale: things you build and read ------------------------------ */

/**
 * "Website Development" — the layout, blocked out.
 *
 * §31's four services are business sites, landing pages, stores and maintenance,
 * and its headline is "your website is your digital storefront". What every one
 * of those has in common is a LAYOUT, and the green is the block §31 says the
 * layout exists to reach: "generate leads". A page whose accent is its call to
 * action is the page this pillar sells.
 *
 * It is a wireframe rather than a browser: `BuildVisual` at the top of this page
 * is already a chrome bar with three dots in it, and drawing a second window
 * would put the same object twice on one screen.
 */
function LayoutVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <rect {...LINE} x={44} y={16} width={152} height={148} rx={6} opacity={0.55} />
      <rect {...LINE} x={56} y={28} width={128} height={14} rx={3} opacity={0.4} />
      <rect {...LINE} x={56} y={50} width={128} height={40} rx={3} opacity={0.3} />
      <rect {...LINE} x={56} y={98} width={60} height={30} rx={3} opacity={0.25} />
      <rect {...LINE} x={124} y={98} width={60} height={30} rx={3} opacity={0.25} />
      <rect {...ACCENT} x={56} y={136} width={56} height={16} rx={3} />
    </svg>
  );
}

/**
 * "CRM & Automation Systems" — the records, and the one being worked.
 *
 * §33 is "organize customer data ... and NEVER MISS a potential customer". A CRM
 * drawn as a machine says the first half and misses the second; drawn as a stack
 * of identical records with one of them lit, it says both — these are all the
 * same shape, and this one is being handled.
 *
 * The lit record's own contents stay `currentColor`, so the accent is one object
 * rather than a green row with green things in it.
 */
function RecordsVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <rect {...LINE} x={28} y={22} width={184} height={28} rx={4} opacity={0.4} />
      <rect {...LINE} x={28} y={58} width={184} height={28} rx={4} opacity={0.34} />
      <rect {...ACCENT} x={28} y={94} width={184} height={28} rx={4} />
      <rect {...LINE} x={28} y={130} width={184} height={28} rx={4} opacity={0.24} />
      <circle {...LINE} cx={50} cy={36} r={7} opacity={0.45} />
      <circle {...LINE} cx={50} cy={72} r={7} opacity={0.4} />
      <circle {...LINE} cx={50} cy={108} r={7} opacity={0.5} />
      <circle {...LINE} cx={50} cy={144} r={7} opacity={0.3} />
      <path
        {...LINE}
        d="M70,32 H172 M70,42 H140 M70,68 H164 M70,78 H132 M70,104 H172 M70,114 H146 M70,140 H156 M70,150 H126"
        opacity={0.28}
      />
    </svg>
  );
}

/**
 * "Sales Funnels & Retargeting" — the stages, and the way back into them.
 *
 * §34 IS a funnel and pretending otherwise would be dishonest, so this one is
 * drawn in the shadow of `BuildVisual` rather than around it. That figure's
 * accent is the funnel itself — "visitors in at the top, one customer out of the
 * bottom" — and it says nothing about the half of §34 that comes after the comma.
 * So the funnel here is `currentColor` and stepped rather than solid, and the
 * GREEN is the return: the curve from the bottom stage back up into the second,
 * which is "bring back visitors who didn't convert the first time".
 *
 * Opacity falls with each stage because the number of people does. That is the
 * only thing in this figure doing the work a percentage would do, and it is the
 * honest version of it — a shape, not a claim. §59's rule about never inventing
 * conversion rates is a content rule, and a drawing can break it just as easily.
 */
function FunnelStepVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <circle {...LINE} cx={80} cy={14} r={5} opacity={0.4} />
      <circle {...LINE} cx={110} cy={14} r={5} opacity={0.4} />
      <circle {...LINE} cx={140} cy={14} r={5} opacity={0.4} />
      <rect {...LINE} x={25} y={26} width={170} height={24} rx={4} opacity={0.5} />
      <rect {...LINE} x={40} y={58} width={140} height={24} rx={4} opacity={0.42} />
      <rect {...LINE} x={55} y={90} width={110} height={24} rx={4} opacity={0.34} />
      <rect {...LINE} x={72} y={122} width={76} height={24} rx={4} opacity={0.28} />
      <path {...ACCENT} d="M146,134 C198,130 206,86 180,70 M190,62 L180,70 L190,78" />
    </svg>
  );
}

/**
 * "Business Growth Systems" — the rack, with room left in it.
 *
 * §35's headline is "build systems that GROW WITH your business", and the word
 * doing the work is "with". A finished diagram cannot say it: whatever you draw,
 * if it is complete then the system is finished and the sentence is wrong. A rack
 * can — identical bays, most of them filled, the green one going in now, and a
 * whole empty shelf underneath that nothing is drawn on.
 *
 * The uprights are open at top and bottom rather than closed into a box. A frame
 * would make this a container with a fixed capacity, which is the opposite claim.
 */
function RackVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path {...LINE} d="M40,18 V162 M200,18 V162" opacity={0.4} />
      <path {...LINE} d="M40,60 H200 M40,100 H200 M40,140 H200" opacity={0.3} />
      <rect {...LINE} x={52} y={26} width={60} height={28} rx={4} opacity={0.5} />
      <rect {...LINE} x={128} y={26} width={60} height={28} rx={4} opacity={0.45} />
      <rect {...LINE} x={52} y={66} width={60} height={28} rx={4} opacity={0.4} />
      <rect {...LINE} x={128} y={66} width={60} height={28} rx={4} opacity={0.34} />
      <rect {...LINE} x={52} y={106} width={60} height={28} rx={4} opacity={0.28} />
      <rect {...ACCENT} x={128} y={106} width={60} height={28} rx={4} />
    </svg>
  );
}

/**
 * Build & Scale, "Conversion Optimization" — the needle moved.
 *
 * §32 is landing page optimization, UX improvements, conversion tracking and
 * performance testing. The obvious drawing is a funnel, AND THE FUNNEL IS TAKEN:
 * `BuildVisual` — the aside at the top of this page — puts its accent on exactly
 * that, "visitors in at the top, one customer out of the bottom". Drawing a
 * second funnel two hundred pixels below the first is the wallpaper this set is
 * written to avoid.
 *
 * So this takes the half the funnel cannot show. A funnel is a state; the section
 * sells a CHANGE — "turn MORE visitors into customers" — and a change needs a
 * before. Two needles of identical length from one hub: the faint one is the rate
 * the page came in at, the green one is where the work put it. Equal lengths
 * matter; a longer accent needle would be arguing by drawing rather than by
 * angle.
 */
function ConversionVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path {...LINE} d="M40,132 A80,80 0 0 1 200,132" opacity={0.5} />
      <path {...LINE} d="M62,132 A58,58 0 0 1 178,132" opacity={0.18} />
      <path
        {...LINE}
        d="M40,132 H28 M63,75 L55,67 M120,52 V40 M177,75 L185,67 M200,132 H212"
        opacity={0.35}
      />
      {/* The stem is not decoration: a base rule floating ten pixels under an
          unattached hub reads as a stray rule rather than as a stand. */}
      <path {...LINE} d="M120,138 V148 M96,148 H144" opacity={0.35} />
      <circle {...LINE} cx={120} cy={132} r={6} opacity={0.7} />
      {/* Where it read before. The tip is marked so the old value is a POSITION
          and not just a fainter needle. */}
      <path {...LINE} d="M120,132 L60,104" opacity={0.3} />
      <circle {...LINE} cx={60} cy={104} r={4} opacity={0.3} />
      <path {...ACCENT} d="M120,132 L161,80" />
    </svg>
  );
}

/* --- Launch: plans and guides ---------------------------------------------- */

/**
 * "Startup Launch" — the manifest, six items long.
 *
 * §37's list is the only six-item list on any pillar page — setup, registration,
 * fundraising, brand, website, marketing plan — and its headline is "everything
 * you need to get started". Six is the number; a checklist is the one form where
 * the count is part of the meaning, and the green tick is the last of them
 * landing.
 *
 * It is a document rather than a rocket. `LaunchVisual` at the top of this page
 * is the vehicle, and the page's whole argument is that the launch is the
 * paperwork underneath it.
 */
function ChecklistVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <rect {...LINE} x={98} y={8} width={44} height={16} rx={4} opacity={0.55} />
      <rect {...LINE} x={44} y={16} width={152} height={148} rx={6} opacity={0.5} />
      <rect {...LINE} x={62} y={38} width={13} height={13} rx={2} opacity={0.45} />
      <rect {...LINE} x={62} y={58} width={13} height={13} rx={2} opacity={0.45} />
      <rect {...LINE} x={62} y={78} width={13} height={13} rx={2} opacity={0.45} />
      <rect {...LINE} x={62} y={98} width={13} height={13} rx={2} opacity={0.45} />
      <rect {...LINE} x={62} y={118} width={13} height={13} rx={2} opacity={0.45} />
      <rect {...LINE} x={62} y={138} width={13} height={13} rx={2} opacity={0.45} />
      <path
        {...LINE}
        d="M85,44 H176 M85,64 H158 M85,84 H176 M85,104 H148 M85,124 H168 M85,144 H140"
        opacity={0.25}
      />
      <path
        {...LINE}
        d="M65,45 L68,48 L73,41 M65,65 L68,68 L73,61 M65,85 L68,88 L73,81 M65,105 L68,108 L73,101 M65,125 L68,128 L73,121"
        opacity={0.5}
      />
      <path {...ACCENT} d="M63,144 L68,150 L77,137" />
    </svg>
  );
}

/**
 * "Personal Branding" — the founder as the asset.
 *
 * §38 is LinkedIn, social presence, content strategy and a personal website: four
 * surfaces, one person on all of them. So the person is the green — this is the
 * one section on the site whose subject is a human being — and the surfaces are
 * three unmarked squares underneath, because naming the platforms in a drawing
 * would date it the first time the client drops one.
 *
 * The bars on the right lengthen downward. That is the presence growing, drawn
 * without a chart: three rules at rising width say it in a profile card, where an
 * axis and a trend line would turn a person into a metric.
 */
function ProfileVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <rect {...LINE} x={28} y={24} width={184} height={132} rx={8} opacity={0.5} />
      <path
        {...ACCENT}
        d="M78,62 a18,18 0 1 1 36,0 a18,18 0 1 1 -36,0 M70,114 C70,93 81,82 96,82 C111,82 122,93 122,114"
      />
      <path {...LINE} d="M142,58 H196 M142,74 H176" opacity={0.35} />
      <path {...LINE} d="M142,100 H166 M142,112 H180 M142,124 H196" opacity={0.25} />
      <rect {...LINE} x={68} y={126} width={18} height={18} rx={4} opacity={0.4} />
      <rect {...LINE} x={94} y={126} width={18} height={18} rx={4} opacity={0.32} />
      <rect {...LINE} x={120} y={126} width={18} height={18} rx={4} opacity={0.24} />
    </svg>
  );
}

/**
 * "Go-to-Market Strategy" — the roadmap, and the day it starts.
 *
 * §40 is launch planning, campaigns, acquisition and a "First 90-Day Growth
 * Plan", so the drawing is a plan against time: four workstreams starting on
 * different days and running different lengths, over an axis whose three ticks
 * are the thirty-day marks the client's own list implies.
 *
 * The green is day zero — a milestone marker and a line dropped through every
 * stream. §36's promise is "grow from day one", and putting the accent on the
 * launch rather than on the ninetieth day is the difference between a plan you
 * are about to start and a report about one that finished.
 *
 * IT RUNS ACROSS AND `/growth-marketing`'s SPINE RUNS DOWN. The two are the only
 * time axes on the site and they must not be read as the same device: that one is
 * a process with five named steps in a rail, this is four unnamed streams over
 * ninety days.
 */
function RoadmapVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path {...LINE} d="M36,36 H216" opacity={0.35} />
      <path {...LINE} d="M96,30 V42 M156,30 V42 M216,30 V42" opacity={0.3} />
      <rect {...LINE} x={36} y={54} width={96} height={18} rx={4} opacity={0.5} />
      <rect {...LINE} x={76} y={80} width={104} height={18} rx={4} opacity={0.4} />
      <rect {...LINE} x={118} y={106} width={88} height={18} rx={4} opacity={0.32} />
      <rect {...LINE} x={150} y={132} width={66} height={18} rx={4} opacity={0.26} />
      <path {...ACCENT} d="M36,28 L44,38 L36,48 L28,38 Z M36,48 V158" />
    </svg>
  );
}

/**
 * Launch, "Brand Identity" — a mark on the grid it was built on.
 *
 * §38 is logo design, brand guidelines, brand messaging and marketing materials:
 * an identity is a system, not a picture, and the one drawing that says system is
 * the construction sheet. Every terminal and every tangent of the mark lands on a
 * grid line — the legs on the second and fourth verticals, the arc's crown on the
 * second horizontal, the guide circle on all four edges. That is the difference
 * between a logo and a shape, and it is the difference the section is selling.
 *
 * The right-hand column is the rest of the system: two swatches, three lines of a
 * specimen, one piece of collateral. They are unlabelled, for the reason
 * `LaunchBeats` gives — words parked on a drawing compete with the sentence
 * beside it.
 *
 * IT IS NOT THE QAVYX MARK, and it must never become it. The Q belongs to the
 * page's furniture (`styles/frame.css` draws it round every section and card on
 * this very page); an identity drawn for the CLIENT's brand is the subject here,
 * and putting our own mark under the microscope would make the section about us.
 */
function IdentityVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      <path
        {...LINE}
        d="M28,34 V146 M56,34 V146 M84,34 V146 M112,34 V146 M140,34 V146 M28,34 H140 M28,62 H140 M28,90 H140 M28,118 H140 M28,146 H140"
        opacity={0.16}
      />
      <circle {...LINE} cx={84} cy={90} r={56} opacity={0.26} />
      <path {...ACCENT} d="M56,146 V90 A28,28 0 0 1 112,90 V146" />
      <rect {...LINE} x={164} y={34} width={26} height={26} rx={3} opacity={0.5} />
      <rect {...LINE} x={196} y={34} width={26} height={26} rx={3} opacity={0.3} />
      <path {...LINE} d="M164,80 H222 M164,94 H208 M164,108 H218" opacity={0.32} />
      <rect {...LINE} x={164} y={122} width={58} height={24} rx={3} opacity={0.26} />
    </svg>
  );
}

/**
 * `"<pillar slug>#<section anchor>"` → the figure for that one card.
 *
 * A SECOND MAP, and deliberately not four more entries in `SERVICE_VISUALS`.
 * That map is keyed on pillar slug and `tests/unit/services.test.ts` asserts its
 * keys are exactly the five pillars — the tripwire that makes a sixth pillar fail
 * loudly — so a section-scoped figure cannot live in it without disarming that.
 * It is the same reasoning that keeps `LaunchpadVisual` out.
 *
 * The key is built by the caller from `page.slug` and `sectionAnchor(name)`,
 * which is the id the card already carries and the fragment the carousel's chips
 * already link to. Deriving it rather than hand-writing the section name means a
 * renamed section changes the key in one place; `tests/unit/pillar-content.test.ts`
 * holds every key here to a section that actually exists, so a rename that
 * orphans a drawing fails a test instead of silently rendering nothing.
 *
 * GROWTH MARKETING IS NOT IN HERE, and that is the content talking. Its five
 * sections are a numbered process and the rail carries the spine that draws it
 * (`styles/pillar-spine.css`); a figure in the same 15rem column would be a
 * second thing competing for the rail on the one page whose rail is already
 * spoken for.
 */
export const SECTION_VISUALS: Record<string, () => React.JSX.Element> = {
  'social-content#social-media-growth-management': CalendarVisual,
  'social-content#short-form-video-reels': TimelineVisual,
  'social-content#content-production': ProductionVisual,
  'social-content#performance-marketing-across-social': MixVisual,
  'social-content#retargeting-systems': ReturnVisual,

  'ai-automation#ai-content-creation': DraftVisual,
  'ai-automation#ai-videos-avatars': AvatarVisual,
  'ai-automation#whatsapp-email-automation': ThreadVisual,
  'ai-automation#ai-powered-marketing': InsightVisual,
  'ai-automation#ai-tools-business-automation': LoopVisual,

  'build-scale#website-development': LayoutVisual,
  'build-scale#conversion-optimization': ConversionVisual,
  'build-scale#crm-automation-systems': RecordsVisual,
  'build-scale#sales-funnels-retargeting': FunnelStepVisual,
  'build-scale#business-growth-systems': RackVisual,

  'launch#startup-launch': ChecklistVisual,
  'launch#personal-branding': ProfileVisual,
  'launch#brand-identity': IdentityVisual,
  'launch#go-to-market-strategy': RoadmapVisual,
};

/**
 * Slug → visual. A map rather than a switch so a service without a diagram is a
 * missing key (caught by the content test) instead of a silent default.
 *
 * THE FIVE PILLARS ONLY. See the note on `LaunchpadVisual` above for why the
 * sixth panel's diagram is not in here.
 */
export const SERVICE_VISUALS: Record<string, () => React.JSX.Element> = {
  'growth-marketing': GrowthVisual,
  'social-content': SocialVisual,
  'ai-automation': AutomationVisual,
  'build-scale': BuildVisual,
  launch: LaunchVisual,
};

/**
 * The waitlist roster — `/launchpad`'s form section, beside the form itself.
 *
 * ## Why a second drawing on a page that already has one
 *
 * `LaunchpadVisual` is the page's hero aside: the pad, built and waiting. This
 * is 700px further down, in the `.qx-frame` that holds §44's form, and it exists
 * for the reason the contact page grew `ConversationVisual` — `UiOnlyForm` caps
 * itself at `max-w-[42rem]`, which is a readability rule and correct, so on a
 * full-width card everything right of the form is air. Measured the same way as
 * `/who-we-are/contact`: at 1440px the section's content box is 960px against a
 * 672px form, leaving a 288px column empty for the form's whole height.
 *
 * The same drawing twice on one page reads as a mistake rather than as a motif,
 * which is why this is its own figure and not `LaunchpadVisual` again.
 *
 * ## Why THIS drawing
 *
 * §43 sells one thing — "the first 100 startups will receive priority
 * onboarding" — so the picture is the roster you are joining and the fact that a
 * place on it is already yours. A sheet on a clip, three entries, and the top
 * one ticked in the accent.
 *
 * IT HAS REAL SUBJECTS ON PURPOSE. §6's `ConvergenceVisual` was built, fixed
 * twice and then cut because five blank rounded rectangles can only say "five of
 * something" — the client had to ask what it meant, which is the point at which
 * a figure is worth less than the white space. A clipboard with a tick is not
 * clever, and that is the property being bought.
 *
 * The entry rows are strokes, not text. A drawing of a list should not be
 * legible; making it legible means writing names into an `aria-hidden` graphic.
 *
 * ONE GREEN ELEMENT, and it is the tick — "the thing the service is actually
 * about", per this file's rules. The box around it stays hairline so the tick is
 * the only thing the eye is sent to.
 *
 * Rendered `text-qx-grey`, NOT `text-qx-line`, and the caller must keep it that
 * way: this sits inside `.qx-frame`, whose `--qx-frame-fill` is `--qx-ink`, and
 * `--qx-line` measures 1.23:1 against that before any opacity is applied. That
 * is not quiet, it is absent — the exact way §6's figure failed.
 */
export function WaitlistVisual() {
  return (
    <svg {...BOX} aria-hidden="true" focusable="false">
      {/* The clip, then the sheet hanging off it. */}
      <rect {...LINE} x={104} y={18} width={32} height={16} rx={5} opacity={0.55} />
      <rect {...LINE} x={44} y={28} width={152} height={126} rx={7} opacity={0.7} />

      {/* Three entries. The rule beside each is the entry, not lorem. */}
      {[
        { y: 68, w: 84, o: 0.5 },
        { y: 98, w: 72, o: 0.4 },
        { y: 128, w: 78, o: 0.3 },
      ].map(({ y, w, o }) => (
        <g key={y}>
          <rect {...LINE} x={64} y={y - 9} width={18} height={18} rx={4} opacity={o + 0.15} />
          <path {...LINE} d={`M94,${y} H${94 + w}`} opacity={o} />
        </g>
      ))}

      {/* Yours, already on it. Drawn over the first entry's own box. */}
      <path {...ACCENT} d="M68,68 L72,73 L79,63" />
    </svg>
  );
}
