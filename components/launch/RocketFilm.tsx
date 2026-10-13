/**
 * The launch film's layer — a fixed, full-viewport canvas the pin paints on.
 *
 * ## IT WAS A `<video>` UNTIL 2026-09-02, AND EVERYTHING IT TAUGHT IS IN GIT
 *
 * The beat used to be `rocket-scroll.mp4` scrubbed by `video.currentTime`, with
 * an inline boot script that assigned the `src` at parse time, a poster, a seek
 * guard against stacked decodes, and an encode tuned around a keyframe every
 * three frames. All of it worked, and all of it is gone: the client asked for
 * the frame sequence on every device, so there is one painter now.
 * `motion/timelines/rocketFramesTimeline.ts` is it, and `lib/rocket-frames.ts`
 * carries the measurements. Recover the video path from the commit before this
 * one if the trade is ever revisited.
 *
 * THREE THINGS WENT WITH THE VIDEO, and their absence is worth stating because
 * each was load-bearing while it existed:
 *
 *   - `lib/rocket-video-boot.ts`, the parse-time `src` assignment. Frames are
 *     fetched by the timeline as `Image` objects, so nothing has to run before
 *     hydration to start the download.
 *   - `suppressHydrationWarning` on the element. It existed ONLY because that
 *     boot script wrote `src` and `poster` before React hydrated, which React
 *     correctly reported as an attribute mismatch on every page load. No script,
 *     no mismatch, no suppression.
 *   - `muted` / `playsInline`, which stopped iOS taking the film fullscreen.
 *
 * ## THE ID IS `qx-rocket-film`, AND IT WAS `qx-rocket-video` UNTIL 2026-09-02
 *
 * Renamed with the element it names, once nothing on the site was a video any
 * more. It was kept for a while on the reasoning that the id is only a handle
 * and changing it touches the stylesheet, `useHeroTimeline` and the e2e suite to
 * say the same thing about the same box — true, but the cost of a name that
 * lies is paid by every reader after it, and `grep video` returning a canvas
 * layer is exactly the kind of thing a handover leaves behind.
 *
 * What the layer IS has not changed: the fixed surface the launch paints on,
 * above the ink field and below the stage.
 *
 * ## A FIXED LAYER, not a section in normal flow
 *
 * The rule `LaunchTitle` and `LaunchBeats` are built on. `#qx-hero` is an empty
 * 100svh pinned section and every visual the pin drives is a `position: fixed`
 * element OUTSIDE it — anything INSIDE a pinned subtree stops being fixed at
 * all, because the pin's transform becomes its containing block. Being out of
 * flow is also why this can never shift the layout as frames arrive: it occupies
 * no space at any point.
 *
 * Three shared rules apply unchanged:
 *
 * 1. **`pointer-events: none`** (in `styles/rocket-film.css`) — a full-viewport
 *    fixed element eats clicks on every section below the pin otherwise. That is
 *    what `#qx-stage` once did to the entire site navigation.
 * 2. **Opacity and visibility are the timeline's, never set here** — a `style`
 *    written by React would be re-asserted by every resize re-render and fight
 *    the scrub. The stylesheet's `visibility: hidden` is the at-rest state only,
 *    and `addRocketFramesSegment` owns it from the segment's first frame.
 * 3. **It must be CLEARED** — see `rocketLayerOpacity`. Anything the pin leaves
 *    painted covers the whole site below it.
 *
 * ## Reduced motion
 *
 * `styles/rocket-film.css` keeps the layer `display: none` under reduce, and
 * the timeline that would fetch the frames is never built — `HeroMount` gates
 * the whole motion layer. Nothing is downloaded.
 *
 * ## The poster is the layer's background, not an attribute
 *
 * A `<video>` had `poster` for the gap before the first frame decoded, and it
 * doubled as the failure state when the file 404'd. A canvas has no equivalent,
 * so the same image is the LAYER's `background-image` in the stylesheet: it sits
 * behind the canvas, shows through until the first frame is painted over it, and
 * is what remains if the frames never arrive at all.
 */
export function RocketFilm() {
  return (
    <>
      <div id="qx-rocket-film" aria-hidden="true">
        {/* THE ONE PAINTER. `addRocketFramesSegment` sizes it to whichever set
            the viewport wants and blits into it; nothing else writes to it, and
            no attribute here is load-bearing. `aria-hidden` because the film is
            a picture of §5's argument and §5 itself is real text directly below
            in `LaunchStatic`. */}
        <canvas aria-hidden="true" />
      </div>
    </>
  );
}
