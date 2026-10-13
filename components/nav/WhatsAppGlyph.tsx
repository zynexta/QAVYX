/**
 * The WhatsApp mark, drawn once.
 *
 * It lived inline in `WhatsAppButton` while the floating button was the only
 * thing that drew it. The header now draws it too, at a different size, and two
 * copies of an eleven-attribute `<svg>` is two places for the geometry to drift
 * — on the same page, a few hundred pixels apart, where the drift is visible.
 *
 * ## THIS IS THE OFFICIAL MARK NOW, on the client's direction
 *
 * It was a generic chat bubble in the house's diagram style, and this file used
 * to carry the reason: the WhatsApp glyph is a registered trademark whose use is
 * governed by Meta's brand guidelines, so the substitute was here until the
 * client confirmed the rights. The client has now asked for the real one, twice
 * over — an outline reference and a solid one — so the note becomes a record
 * rather than a caveat. Meta's guidelines permit the mark as a link to a chat
 * and forbid recolouring it in a lockup that implies endorsement; it is used
 * here as a channel button, which is the permitted case. If that ever needs
 * undoing, `git show 9ca3ce3:components/nav/WhatsAppGlyph.tsx` is the bubble.
 *
 * ## Why the geometry is FILLED and the old one was stroked
 *
 * Because the mark is not an outline drawing — it is a solid shape with a hole
 * in it. The bubble is a ring: an outer contour and an inner contour wound the
 * other way, so the non-zero fill rule punches the middle out. The handset
 * inside it is solid. Drawing that with `stroke` and `fill: none` is not the
 * WhatsApp mark, it is a tracing of its silhouette, and at 24px the difference
 * is a handset that reads as a comma.
 *
 * The ring's thickness is ~1.6px at this viewBox, which is why the swap does not
 * fight the rest of the site: it lands between the 1.5px hairlines the frames
 * are drawn at and the 1.75px the bubble used, so the bar still reads as one
 * weight of line.
 *
 * ## What that costs, and what replaces it
 *
 * Both callers used to thicken `stroke-width` on hover — the site's own
 * vocabulary, the thing `.qx-index-row` and the severed rule are made of. A
 * filled path has no stroke to thicken, so there is nothing left for that idiom
 * to act on. Hover is a small scale instead, on the glyph rather than on the
 * link, so the header's `hover:bg-qx-ink-raised` still fills the whole 44px
 * target while the mark inside it moves.
 *
 * ONE SHAPE, NOT THREE. The whole mark — tail, ring and handset — is a single
 * `<path>`, so there is no seam where two sub-shapes meet and no chance of one
 * scaling differently from another.
 */
export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
