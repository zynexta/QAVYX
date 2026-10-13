/**
 * A `application/ld+json` block.
 *
 * The `<` escape is not decoration. `JSON.stringify` will happily emit the
 * characters `</script>` if a content string ever contains them, which ends the
 * block early and drops the rest of the JSON into the document as markup. Every
 * string in this graph comes from `content/`, so the risk today is nil — but the
 * whole point of `content/` is that a non-engineer edits it, and this is the one
 * place where a stray angle bracket in the copy would break the page rather than
 * just look wrong. A `<` escaped to `<` is still the same string to any
 * JSON parser, so nothing downstream notices.
 *
 * A server component with no client JavaScript: it costs the route budget only
 * the bytes of the JSON itself.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
