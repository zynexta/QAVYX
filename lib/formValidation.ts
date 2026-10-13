import type { FormField } from '@/types/forms';

/**
 * Client-side validation for the two forms §52 and §44 specify.
 *
 * §68 asks for client-side validation, server-side validation, spam protection
 * and loading / success / error states. **Only the first is buildable here.**
 * The client owns the backend, so the other four depend on decisions nobody on
 * this side has made — where the data goes, which provider signs it, what a
 * failure looks like. See `components/forms/UiOnlyForm.tsx`.
 *
 * Everything in this file is a PURE FUNCTION of (field, value). No React, no
 * DOM, no imports beyond a type — which is what lets
 * `tests/unit/form-validation.test.ts` cover the rules directly rather than by
 * driving a form, and what will let the client's server-side validation reuse
 * the same rules rather than write a second, subtly different set.
 *
 * ## The rules are deliberately loose
 *
 * A validator's job here is to catch a mistake, not to prove an address exists.
 * The strict-looking alternatives all fail on real input:
 *
 *   - **Email.** No RFC 5322 regex. The check is "one @, something either side,
 *     a dot in the domain, no spaces" — every stricter pattern in common use
 *     rejects valid addresses, and none of them can tell whether the mailbox is
 *     real. Only a confirmation email can, and that is the backend's job.
 *   - **Phone.** The site serves India and the GCC (§69, §72), so a national
 *     format check would reject most of the audience. The rule is a length
 *     range over the DIGITS, with `+`, spaces, hyphens, dots and parentheses
 *     allowed and ignored — 7 digits is the shortest national number in use,
 *     15 is the E.164 maximum.
 *   - **Names.** No character class at all. Rejecting a name for containing an
 *     apostrophe, a hyphen or a non-Latin script is a bug, not validation.
 *
 * ## Messages name the field, and are built rather than written
 *
 * "Email is required." is derived from the field's own label, so a label that
 * changes in `content/` cannot leave a stale message behind — and no message
 * text is a second copy of the client's wording.
 */

/** The digits E.164 allows: 7 is the shortest national number, 15 the maximum. */
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

/** Characters a person may reasonably type between the digits of a number. */
const PHONE_PUNCTUATION = /[\s().+-]/g;

/** One @, something either side, a dot in the domain, no whitespace anywhere. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The error for one field, or `null` when it is acceptable.
 *
 * An OPTIONAL field that is empty is acceptable and returns `null` — but an
 * optional field with something in it is still validated for shape. An optional
 * phone number typed wrong is still typed wrong.
 */
export function fieldError(field: FormField, value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return field.required ? `${field.label} is required.` : null;
  }

  if (field.kind === 'email' && !EMAIL_SHAPE.test(trimmed)) {
    return `${field.label} does not look like an email address.`;
  }

  if (field.kind === 'tel') {
    const digits = trimmed.replace(PHONE_PUNCTUATION, '');
    if (!/^\d+$/.test(digits)) {
      return `${field.label} should contain only digits, spaces and + ( ) -`;
    }
    if (digits.length < MIN_PHONE_DIGITS || digits.length > MAX_PHONE_DIGITS) {
      return `${field.label} should be between ${MIN_PHONE_DIGITS} and ${MAX_PHONE_DIGITS} digits.`;
    }
  }

  if (field.kind === 'select' && field.options && !field.options.includes(trimmed)) {
    // Only reachable by tampering — a `<select>` cannot produce a value that is
    // not one of its options. It is here because the same rule has to hold on
    // the server, and this is the file the server's rules should come from.
    return `Choose one of the listed options for ${field.label}.`;
  }

  return null;
}

/**
 * Every field's error, keyed by field id. An empty object means the form is
 * valid — `Object.keys(errors).length === 0` rather than a second boolean that
 * could disagree with it.
 */
export function formErrors(
  fields: readonly FormField[],
  values: Readonly<Record<string, string>>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const error = fieldError(field, values[field.id] ?? '');
    if (error) errors[field.id] = error;
  }
  return errors;
}
