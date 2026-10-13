/**
 * The launch film as a frame sequence — the phone's copy of the beat.
 *
 * ## WHY A PHONE GETS STILLS AND A DESKTOP GETS VIDEO
 *
 * The beat was taken off phones on 2026-08-31 because the film was heavy in both
 * of the ways a video can be: 1.57 MiB to arrive, and a 1080p decode on every
 * seek to scrub. The bytes were fixable and were fixed. The decode was not — a
 * seek flushes the decoder, decodes a keyframe and up to two inter-frames, and
 * paints, and on a phone that costs more than a frame interval. `lastFrame` and
 * the seek guard in `rocketVideoTimeline.ts` exist because of it, and they
 * mitigate rather than remove it.
 *
 * A frame sequence has no decoder in the loop at all. `drawImage` from an
 * already-decoded `HTMLImageElement` is a blit: there is nothing to flush, no
 * keyframe to hunt for, and no seek to abort. That is the whole reason this
 * exists, and it is the property the client is paying bytes for.
 *
 * ## IT COSTS MORE BYTES THAN THE VIDEO DID, AND THAT WAS THE TRADE
 *
 * Measured from the client's own PNG extraction, not estimated: 210 WebP stills
 * at q60 in the portrait window are 4.8 MiB against the 1.57 MiB video that was
 * cut for being too heavy. Video stores a keyframe every 3 frames and only
 * differences in between; 210 independent stills cannot. A portrait-native H.264
 * encode was scoped at 0.6-0.9 MiB and is the lighter answer — it was put to the
 * client with that number beside this one, and stills were chosen for the scrub.
 *
 * What makes 4.8 MiB affordable is that it does not have to arrive at once. The
 * video needed `preload="auto"` and the whole file buffered before a seek could
 * land anywhere; frames are independent, so the sequence is usable from the
 * first one and sharpens as the rest arrive. See `PRELOAD_STRIDE`.
 *
 * ## TWO SETS, BECAUSE A PHONE HAS TWO ORIENTATIONS
 *
 * `styles/rocket-film.css` paints portrait with `object-fit: cover` and a
 * sideways phone with `contain` and the FULL frame width — 844x390 is wider than
 * 16:9. One set cannot serve both: a 9:16 crop has no picture to put in the
 * letterbox, and a 16:9 frame small enough to be affordable puts ~250 source
 * pixels across a portrait screen's 1170.
 *
 * So portrait gets the crop at full height and landscape gets the whole frame at
 * half the rate. A device downloads ONE of them.
 *
 * ## THE DESKTOP KEEPS ITS VIDEO, AND THAT WAS ASKED AND ANSWERED
 *
 * Putting frames on desktop too was put to the client on 2026-09-02 with the
 * measurements beside it, and refused. Recording it so the question is not
 * reopened from first principles:
 *
 *   - The bytes go the wrong way. `rocket-scroll.mp4` is 4.75 MiB; the same 210
 *     frames are 5.88 MiB at 1600x900 and 8.08 MiB at the master's own
 *     1920x1080. Inter-frame compression is what a video is FOR, and this film
 *     is 210 frames of a mostly-static tower shot — the format's best case.
 *   - DESKTOP NEVER HAD THE PROBLEM THIS SOLVES. A phone gets stills because a
 *     seek flushes a decoder and costs more than a frame interval there. On a
 *     desktop hardware decoder the seek guard in `rocketVideoTimeline.ts`
 *     already absorbs it, and that path is measured and working.
 *   - It would discard a lot of closed decisions — CRF 23, a keyframe every 3
 *     frames, `-level 4.0`, `-refs 3`, `+faststart`, the `/videos/` cache header
 *     and the redirect for stale HTML — each with a measurement behind it.
 *
 * What the change WOULD have bought is real and was weighed: one path instead of
 * two, and the end of the `suppressHydrationWarning` on the `<video>`, which
 * exists only because the boot script assigns `src` before React hydrates. Two
 * right answers for two devices was judged worth more than one answer for both.
 */

/** The 9:16 window of the 1920x1080 master, at its own native height. */
export const FRAMES_PORTRAIT_DIR = '/launch-frames-v1/portrait';

/** The whole 16:9 frame at 1600x900 — every screen that is not a phone upright. */
export const FRAMES_WIDE_DIR = '/launch-frames-v1/wide';

/** Both sets carry every frame the master has, at the film's own rate. */
export const FRAMES_PORTRAIT_COUNT = 210;
export const FRAMES_WIDE_COUNT = 210;

/** `f001.webp` … `f210.webp`. */
export function framePath(dir: string, index1: number): string {
  return `${dir}/f${String(index1).padStart(3, '0')}.webp`;
}

/**
 * Which set this viewport wants.
 *
 * THE LINE IS 1:1, NOT 16:9, AND THE DIFFERENCE MATTERS. The obvious threshold
 * is the film's own aspect — letterbox above it, crop below — but that is the
 * question the STYLESHEET answers, not this one. A 1440x900 desktop is 1.6,
 * narrower than 16:9, so `object-fit: cover` crops it: 1.6 x 9/16 = 90% of the
 * frame width still on screen. A phone upright is 0.46 and keeps 26%.
 *
 * Those two want completely different assets even though both "crop", so the
 * split is between a screen TALLER than it is wide and everything else. A phone
 * on its side (2.16), a tablet (1.33) and a desktop (1.6) all take the wide set
 * and differ only in how much of it the stylesheet shows.
 */
export function frameSetFor(w: number, h: number): 'portrait' | 'wide' {
  return h > w ? 'portrait' : 'wide';
}

/**
 * How the sequence is fetched: every Nth frame first, then the gaps.
 *
 * A SPARSE PASS BEFORE A DENSE ONE, and the reason is what the visitor sees
 * rather than what the network does. Fetching 001..210 in order means that at
 * the moment the beat starts the scrub can only paint the opening of the film
 * however far the scroll has gone; the last third arrives after it is needed.
 * Every 12th frame is 18 requests and ~410 KiB, and it covers the WHOLE segment
 * — the scrub can land anywhere and paint something within 0.4s of the beat, and
 * the picture then refines under it as the gaps fill in.
 *
 * `nearestLoaded` is what makes that safe: a frame that has not arrived yet
 * paints its closest neighbour rather than nothing, so the film is never blank,
 * only briefly coarse.
 */
export const PRELOAD_STRIDE = 12;
