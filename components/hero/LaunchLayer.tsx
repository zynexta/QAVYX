import {
  computeTrajectoryPath,
  trajectoryBox,
  TRAJECTORY_DEBRIS,
} from '@/motion/geometry';
import {
  BILLOW_COUNT,
  DEBRIS_FILL_REST,
  DEBRIS_STROKE_REST,
  ROCKET_SCALE,
  SMOKE_COUNT,
  tableauScaleFor,
} from '@/motion/timelines/launchTimeline';

/**
 * The launch sequence's SVG, inside the one stage.
 *
 * Reuses `#qx-stage` rather than standing up a second fixed SVG: the stage owns
 * the 1-user-unit = 1-CSS-pixel contract, and a second full-viewport SVG would
 * duplicate that viewBox, its resize wiring, and a z-order to reconcile — two
 * places to get the coordinate system wrong instead of one.
 *
 * `visibility: hidden` on the group rather than conditional rendering, so the
 * subtree genuinely does not paint for the ~500vh before it is needed while the
 * refs GSAP holds can never go stale (single-node principle).
 *
 * NO TEXT LIVES HERE. `#qx-stage` is `aria-hidden`, so a label in this subtree
 * would be a decorative duplicate of copy that has to exist in the document
 * anyway — see `LaunchCopy`, which is real DOM.
 *
 * THE VEHICLE IS THE CLIENT'S OWN ARTWORK. `assets/Rocket.json` is a
 * Lottie whose runtime would cost ~70 kB gzip plus ~50 kB of JSON against a
 * 60 kB bundle headroom, and whose cel-animated flames emit hundreds of nodes
 * against a 60-node stage. So its PATHS were extracted once — the hull, the
 * green nose cone and fins, the exhaust tongue, the pad splash — and live here
 * as static SVG in the artwork's own flat-fill style, every colour a token
 * (`--qx-hull` is measured from this artwork), scrubbed by the same proxy as
 * everything else. The ignition column and billow are that artwork's "SLed"
 * ground splash, rebuilt as scrub-pure elements.
 *
 * Node budget, as `phase8-aperture.spec.ts` counts (every element, hidden or
 * not): layer g + [gradient + 3 stops] + [inner g: trajectory + 6 trail +
 * column + 4 props] + [rocket g: scale g, exhaust g of 2, side fins, body,
 * centre fin, nose] + [billow g of 4] = 32. The stage carries 58 of its 60
 * with the other layers' 26.
 *
 * The three waypoint dots came out this session (client's direction, see the
 * note at their old site) and the plume spent TWO of their three nodes: a sixth
 * trail station — the escape contrail, the only legal mark above arc 0.506 —
 * and the smoke gradient's third stop, which is what removes the flat core and
 * with it the hard-edged discs two flat-core attempts put in the ground cloud.
 * TWO of headroom left. A prop's burn is paint on its own node
 * (`setDebrisBurn`) rather than an ember overlay for exactly this reason, and
 * the last three sessions all shipped only because there were nodes to buy
 * with. Everything ELSE in the plume rebuild cost nothing: the ellipses ride
 * the transform string the timeline already writes, and the seat cache took
 * seven `getPositionOnPath` calls out of the frame to pay for the sixth
 * station's three `setAttribute`s.
 */

/** The vehicle, nose along -y, traced from `assets/Rocket.json` at 40 units tall. */
const ROCKET_BODY =
  'M0,-19.4 C0,-19.4 4.4,-17.3 7.9,-8.4 C11.4,0.6 8.3,14.8 5.3,18.2 ' +
  'C3.6,17.6 1.9,17.35 0,17.35 C-1.9,17.35 -3.6,17.6 -5.3,18.16 ' +
  'C-8.3,14.8 -11.4,0.6 -7.9,-8.4 C-4.4,-17.35 0,-19.4 0,-19.4 Z';
const ROCKET_NOSE =
  'M0,-19.9 C-2.1,-18.8 -4.6,-15.5 -5.8,-11.9 C-2,-11.1 2,-11.1 5.8,-11.9 ' +
  'C4.6,-15.5 2.1,-18.8 0,-19.9 Z';
/** The two swept fins, BEHIND the hull; the centre fin rides in front of it. */
const ROCKET_FINS_BACK =
  'M5.8,3.5 C9.6,6.6 11.7,11.6 11.4,17.6 C11.3,19.4 10.4,20.1 9.3,19 C7.6,17.3 6.1,16.3 4.5,15.9 C5.4,11.7 5.8,7.6 5.8,3.5 Z ' +
  'M-5.8,3.5 C-9.6,6.6 -11.7,11.6 -11.4,17.6 C-11.3,19.4 -10.4,20.1 -9.3,19 C-7.6,17.3 -6.1,16.3 -4.5,15.9 C-5.4,11.7 -5.8,7.6 -5.8,3.5 Z';
const ROCKET_FIN_FRONT =
  'M-2,8.5 C-2,14.5 -1.7,18.6 0,21.6 C1.7,18.6 2,14.5 2,8.5 C0.7,8.8 -0.7,8.8 -2,8.5 Z';
/** The exhaust tongue from the source, and the same shape grown into a plume. */
const FLAME_CORE =
  'M-3.2,18 C-6.4,24.5 1.3,38.5 1.3,38.5 C1.3,38.5 6.3,25.5 4.7,19.2 C3.6,15.4 -1.7,15.9 -3.2,18 Z';
const FLAME_PLUME =
  'M-5,18.6 C-10,27.5 2,48 2,48 C2,48 9.7,30.5 7.2,20.4 C5.6,14.2 -2.8,15.2 -5,18.6 Z';
/**
 * The ignition column: the source's exhaust wake, in ARTWORK units with its
 * base at the ORIGIN, so the timeline can seat it on the pad and grow it with
 * `scale(ROCKET_SCALE, sy · ROCKET_SCALE)` alone.
 */
const IGNITION_COLUMN =
  'M-3.2,1 C-3.2,-6.4 -1.6,-15.5 0,-23.6 C1.6,-15.5 3.2,-6.4 3.2,1 C1.8,1.6 -1.8,1.6 -3.2,1 Z';

/**
 * A shed prop: a broken panel, thrown, tumbled and burnt by the timeline.
 *
 * Sized against the VEHICLE, which is 120px tall on screen. These four objects
 * are the client's headline beat for the section — the failures that burn away
 * on the way up — so a fragment reads at about a third of the rocket rather
 * than as a speck near it. `launchDebris`'s `scale` then consumes it from
 * there.
 */
const DEBRIS_FRAGMENT = 'M-29,-20 L29,-20 L29,5 L4,20 L-13,20 L-29,4 Z';

interface LaunchLayerProps {
  vw: number;
  vh: number;
}

export function LaunchLayer({ vw, vh }: LaunchLayerProps) {
  // Shared with `LaunchBeats`, which hangs the burning props' labels in the
  // same box — see `trajectoryBox`. When each computed its own inset the labels
  // sat a few pixels off the thing they name, and only at some viewport sizes.
  const { pad, ...box } = trajectoryBox(vw, vh);

  return (
    <g id="qx-launch-layer" style={{ visibility: 'hidden' }} aria-hidden="true">
      {/* ONE paint server for every piece of smoke on the stage — the pad
          billow and the climb's trail both fill with it.

          This is what makes the smoke read as smoke. A flat `fill` gives a
          hard-edged disc, and a handful of hard discs read as coins no matter
          how they are sized or faded; a radial fade to transparent gives each
          puff a soft body and lets neighbours MERGE where they overlap, which
          is the whole difference between "circles" and "a cloud". It is also
          the cheapest way to buy that: a paint server is one pass in the
          rasteriser, where an SVG blur filter would cost a full offscreen
          render every scrub frame against an 8 ms budget (TDD §12).

          Default `gradientUnits` is objectBoundingBox, so this maps to each
          circle's own box with no per-element setup — one gradient, nine
          users, and it re-themes with the token like everything else. */}
      <radialGradient id="qx-smoke-fill">
        {/* THREE STOPS, AND EVERY ONE OF THEM IS A MEASUREMENT.

            WHAT WAS WRONG. Two stops ramping alpha 0% -> 100% give an AREA-MEAN
            of exactly one third of the element's opacity, with the peak at a
            single point. So correctly-sized, correctly-faded puffs still painted
            as smudges: at the old ceiling the brightest pixel a puff could ever
            paint was 145 (--qx-grey) x 0.95 x 0.72 = 99/255 and its MEAN was
            33/255 — on pure black, beside a 95%-white wordmark, below the level
            at which the eye segments a thing as an object. Worse, two such cones
            do not join: sampled midway between neighbours 61px apart the union
            alpha was 0.147 against peaks of 0.38 and 0.23, a 60% saddle. That is
            beading, and "a few grey smudges" is an accurate description of it.

            WHAT WAS TRIED AND FAILED, because it is the obvious fix and the next
            person will reach for it. Moving the FIRST stop off 0% gives every
            element a FLAT core for no extra node, and on paper it is excellent:
            the area-mean goes 0.333 -> 0.508 of peak and two overlapping cores
            merge with no saddle at all. Shipped at 38% and again at 30%, it put
            a visible hard-edged grey DISC in the ground cloud both times — the
            billow's two wings roll far enough out to clear the body's glow, and
            a flat core with nothing brighter over it is not a soft puff, it is
            a coin. That is the exact failure this file has been fighting since
            the billow had six mounds. A flat region in a radial alpha is a
            first-derivative cliff, and no amount of narrowing removes it;
            narrowing only trades the artefact against the brightness it bought.

            WHAT IS HERE. A third stop instead — one of the three nodes the
            waypoint dots returned — so the profile is TWO GENTLE SEGMENTS with
            no flat region anywhere: 0.92 at the centre, 0.50 at 55% of the
            radius, 0 at the edge. Slopes -0.76 then -1.11, a ratio of 1.46,
            which is a change of gradient rather than a cliff and is invisible on
            every element size this server paints. Area-mean 0.351.

            THE BRIGHTNESS DID NOT COME FROM THE FLAT CORE, WHICH IS WHY GIVING
            IT UP IS AFFORDABLE. It came from the colour: --qx-grey is sRGB 145
            and --qx-white is 242. Painted mean, end to end —

                before   145 x 0.95 x 0.333 x 0.72 = 33/255
                now      242 x 0.351 x 0.80        = 68/255

            — a little over twice the density, with no artefact to tune.

            WHITE IN, GREY OUT. A plume is a bright core that COOLS downstream,
            and the paint server can say that on its own: the colour ramps
            --qx-white -> --qx-grey across the same span the alpha falls to zero,
            so a parcel is lit at its heart and ashen at its fringe.
            `styles/flame.css` already makes the flame's own core --qx-white, so
            the fire and the smoke it makes share one hot colour. No filter, no
            new token, and it re-themes with the tokens like everything else. */}
        <stop offset="0%" stopColor="var(--qx-white)" stopOpacity={0.92} />
        <stop offset="55%" stopColor="var(--qx-white)" stopOpacity={0.5} />
        {/* Still exactly zero at the edge, and still --qx-grey. That property is
            what lets soft circles be a cloud instead of coins, and it is the one
            thing about this server that has never changed. */}
        <stop offset="100%" stopColor="var(--qx-grey)" stopOpacity={0} />
      </radialGradient>

      {/* The billow: the pad splash from the source artwork, as mounds that
          swell with ignition, roll outward, and dissolve as the vehicle
          climbs.

          FIRST in paint order, behind every other thing in this layer, and
          that position is load-bearing rather than arbitrary. The pad cloud is
          at full strength until arc 0.46, and the first two props tear off at
          0.10 and 0.20 — painted after the cloud, they burnt away INSIDE it
          and the client's headline beat was invisible. It also has to stay
          behind the vehicle, which is the protagonist and must never be behind
          its own smoke. Being first satisfies both at once.

          Opacity lives on the GROUP, which is what flattens the overlapping
          circles into one splash silhouette rather than four coins. */}
      <g id="qx-billow" opacity={0}>
        {Array.from({ length: BILLOW_COUNT }, (_, i) => (
          <circle key={i} className="qx-launch-billow" r={2} fill="url(#qx-smoke-fill)" />
        ))}
      </g>

      <g transform={`translate(${pad} ${pad})`}>
        {/* The route — AS DATA, NOT AS INK. Nothing here paints.

            THE LINE IS GONE ON THE CLIENT'S DIRECTION: "i dont want the line in
            rocket launching it look bad". It had already been cut back once —
            from the whole route to a 38-unit tail — for the reason that survives
            this: on the plumb line they asked for, a stroke down the middle of
            the viewport reads as a rule splitting the composition, not as a
            flight path. Cutting it to a tail made it shorter; it did not stop it
            being a line down the middle of the screen.

            WHAT CARRIED THE BEAT STILL CARRIES IT. The drawn route holding while
            the vehicle climbed away was one of four tellings of "growth is not a
            straight line", and the other three are untouched: the near-stall in
            `LEGS`, the exhaust going dark and relighting (`launchExhaust`), and
            the props burning off. The smoke column is what the eye follows up
            the screen now, which is what a real launch leaves behind anyway.

            THE ELEMENT STAYS AND MUST. `addLaunchSegment` reads this `d` into
            `MotionPathPlugin.getRawPath` — it is what the vehicle, the pad
            tableau and every smoke spawn are positioned against, and the cache
            that survives a resize keys on this attribute changing. Deleting the
            node would cost a `ResizeObserver` and a second copy of the route to
            save one of sixty. `pathLength` is kept with it so the arc-length
            parameterisation the spawn tables are written in stays true. */}
        <path
          id="qx-traj"
          d={computeTrajectoryPath(box.w, box.h)}
          pathLength={100}
          fill="none"
          stroke="none"
        />

        {/* The trail: six STATIONS of one exhaust column, each anchored to the
            route at its fixed spawn fraction and drifting off it as the vehicle
            pulls away. Pure functions of the proxy — the whole column reverses
            on scroll-up and no idle loop exists.

            STILL `<circle>`, NOT `<ellipse>`, and that is deliberate. The
            timeline already writes a `transform` on every one of these every
            frame, so appending ` scale(1 sy)` turns a circle of r = rx into an
            ellipse rx x ry about the same centre for ZERO nodes, zero extra
            `setAttribute` calls, and no change to the `SVGCircleElement`
            queries in `addLaunchSegment`. `gradientUnits` defaults to
            objectBoundingBox, so the gradient stretches with the ellipse and
            the soft falloff follows the elongation for free.

            SIX, NOT FIVE, and the sixth is one of the three nodes the waypoint
            dots returned. It buys an emission interval that is constant in
            SCROLL — which is how an engine actually emits, and it makes the arc
            spacing non-uniform for free, bunched at the pad where the vehicle
            is slow and stretched where it is fast.

            TWO OF THE SIX SPAWN AFTER THE STALL, which is the correction that
            stopped the column being left behind. The engine goes out at arc
            0.500 and RELIGHTS at 0.591; the old rule read that as a ceiling and
            barred smoke from the whole second half of the climb, so at the
            arrival the topmost parcel sat 366px below the rocket with black
            between them and read as stuck. The bar is the stall WINDOW. See the
            note on `SMOKE` in `launchTimeline.ts`. */}
        {Array.from({ length: SMOKE_COUNT }, (_, i) => (
          <circle key={i} className="qx-launch-smoke" r={2} fill="url(#qx-smoke-fill)" opacity={0} />
        ))}

        {/* The ignition column — the thick exhaust wake between nozzle and pad
            while the vehicle is on it. Seated and grown by the timeline.

            AFTER THE TRAIL, which is a move from where it used to be. The
            column exists only over arc 0.01-0.09, and the first smoke station
            is now born at arc 0.010 with a `--qx-white` core; painted
            underneath, the one green thing in the ignition was washed out for
            the whole of its life. The luminous jet belongs in FRONT of the
            cloud it is making, which is also what a real ignition looks like.
            It is still above the billow and still below the props (the first
            tears off at 0.18, by which point this is long gone).

            There is no drawn pad under it. A hairline rule there is a DIAGRAM
            of a launchpad, and once the ground cloud below became real smoke
            the line read as an artefact laid over it — so the cloud is the
            ground now, and the node it cost bought the smoke's gradient. */}
        <path
          id="qx-launch-column"
          d={IGNITION_COLUMN}
          fill="var(--qx-green)"
          opacity={0}
        />

        {/* The failure props leaving the vehicle. The client's note is the
            whole beat: "some of the props look like failure, losses,
            unprofessional — like props BURN while launching the rocket; it's
            identify the Growth if you work with Qavyx." So each one ignites as
            it detaches, shrinks as it is consumed, and is gone — the panel
            plus an ember the timeline lights over it.

            Each prop rides the vehicle to its detach point and is then thrown
            in LOCAL coordinates — the two motions compose into the one
            transform the timeline writes, which is what survives a resize with
            no recomputation and reverses cleanly on scroll-up. */}
        {TRAJECTORY_DEBRIS.map((d) => (
          <path
            key={d.at}
            className="qx-launch-debris"
            d={DEBRIS_FRAGMENT}
            fill={DEBRIS_FILL_REST}
            stroke={DEBRIS_STROKE_REST}
            strokeWidth={1.5}
            strokeLinejoin="round"
            opacity={0}
          />
        ))}
      </g>

      <g id="qx-rocket" opacity={0}>
        {/* A scale on its own group: the timeline owns the outer group's
            transform (place + rotate) and overwrites it every frame, so a scale
            written there would last one frame. The artwork is traced at 40
            units tall; the scale makes it the protagonist.

            NOT STATIC ANY MORE — `tableauScaleFor` shrinks it on a short
            viewport, and it is the ONLY place the vehicle's size is decided, so
            the timeline's `k` (which scales the plume, the billow, the column
            and the props by the same fraction) cannot disagree with it. On a
            landscape phone the whole tableau was running off the bottom of the
            screen; the note on that function has the measurements. It is
            exactly 1 at 900px and above, so the desktop poster is untouched. */}
        <g transform={`scale(${ROCKET_SCALE * tableauScaleFor(vw, vh)})`}>
          {/* Flame first, so its root tucks under the tail. The group is
              scaled about the nozzle (y=17) by the timeline: length is
              thrust. */}
          {/* NEITHER FILL NOR OPACITY IS SET HERE ANY MORE — `styles/flame.css`
              owns both, because both are keyframed. A presentation attribute
              loses to a CSS animation, so leaving `fill`/`opacity` on these
              paths would have been two values that look authoritative in the
              component and are overridden three files away.

              The GROUP keeps its `opacity={0}`: that one IS the timeline's,
              written every frame from `launchExhaust`, and it is what makes the
              engine die and relight through the stall. */}
          <g id="qx-rocket-exhaust" opacity={0}>
            <path className="qx-flame qx-flame--plume" d={FLAME_PLUME} />
            <path className="qx-flame qx-flame--core" d={FLAME_CORE} />
          </g>
          <path d={ROCKET_FINS_BACK} fill="var(--qx-green-dim)" />
          <path d={ROCKET_BODY} fill="var(--qx-hull)" />
          <path d={ROCKET_FIN_FRONT} fill="var(--qx-green-dim)" />
          <path d={ROCKET_NOSE} fill="var(--qx-green)" />
        </g>
      </g>
    </g>
  );
}
