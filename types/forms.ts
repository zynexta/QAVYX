/**
 * The shape of a form field, shared by the two forms the document specifies.
 *
 * §52's contact form and §44's Launchpad waitlist are eleven fields between them
 * and one renderer (`components/forms/Field.tsx`), so the contract lives here
 * rather than in either content module — a type in `content/company.ts` that
 * `content/launchpad.ts` imported would make one content file depend on another,
 * which is the thing the `content/` discipline exists to prevent.
 *
 * This file is types only. It is erased at build and carries no strings.
 */

/**
 * `kind` picks the input type. §68 asks for "mobile-friendly inputs", and the
 * difference between `type="email"` / `type="tel"` and a bare text box is which
 * keyboard a phone raises — so this is a content decision the document made,
 * not a rendering detail.
 */
export type FieldKind = 'text' | 'email' | 'tel' | 'select' | 'textarea';

export interface FormField {
  /** Stable id, used for `name`, the input's `id` and the label's `for`. */
  id: string;
  /** The label, exactly as the document writes it. */
  label: string;
  kind: FieldKind;
  /** §44 and §52 mark these. Both required AND optional state are visible. */
  required: boolean;
  /** Present only on `select`. The document's own options, in its order. */
  options?: readonly string[];
}
