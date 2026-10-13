/**
 * The strings on the two form pages that the client's document does not supply.
 *
 * SOURCE: NOT `docs/CONTENT-HANDOFF.md`. Every other
 * module in `content/` transcribes the document; this one is the exception, and
 * it is a separate file so that the exception is visible rather than buried in a
 * component. There are four strings here and a fifth that is the document's.
 *
 * ## Why they exist
 *
 * §52's contact form and §44's Launchpad waitlist are fully specified as fields
 * and labels — and the client owns the backend. §68 asks for server-side
 * validation, spam protection and success / error states, none of which can be
 * built without knowing where a submission goes. So both forms ship as UI: real
 * labels, real input types, real client-side validation, visible required and
 * optional state, and **no submission**.
 *
 * A form that looks finished and silently discards what it is given is worse
 * than no form. A disabled submit button with nothing explaining it reads as a
 * bug. So the page says so, in its own voice, and offers the two channels that
 * do work — the same WhatsApp and email the footer prints on every page.
 *
 * **These four strings come out when the backend goes in**, along with
 * `disabled` on the submit button. Nothing else about either form changes.
 *
 * ## `REQUIRED` and `OPTIONAL` are the document's
 *
 * §52 marks its fields "Required"; §44 marks its five "required" and "optional".
 * Those are the client's words for the markers, so they are used as written.
 */

/**
 * The standing notice, shown ABOVE the fields on both forms.
 *
 * Above, not beside the button. A visitor who reads it after filling six fields
 * has been wasted; a visitor who reads it first can go straight to WhatsApp.
 * That ordering is the whole reason this notice is worth shipping.
 *
 * `{whatsapp}` and `{email}` are substituted at render from `CONTACT` in
 * `content/site.ts`, so the address and the number keep their single owner. They
 * are placeholders rather than string concatenation so the sentence stays
 * readable to whoever owns the copy.
 */
export const FORM_NOTICE = {
  /** Deliberately a status, not an apology. */
  label: 'Not connected yet',
  body: 'This form is built but not yet wired up — nothing you type here is sent or stored. To reach us today, message us on WhatsApp or email {email}.',
} as const;

/** §52's and §44's own markers for the two states. */
export const REQUIRED_MARKER = 'Required';
export const OPTIONAL_MARKER = 'Optional';

/**
 * The `<select>`'s empty first option.
 *
 * §52 lists six options for "What are you looking to grow?" and no default. A
 * `<select>` with no empty option pre-selects its first, which would submit
 * "Growth Marketing" for every visitor who never opened it — the field would
 * look answered while carrying an answer nobody gave. This is the placeholder
 * that makes "unanswered" a state the control can be in.
 */
export const SELECT_PLACEHOLDER = 'Select an option';

/**
 * The accessible name of the error summary a field's message belongs to. Screen
 * readers announce the message on focus via `aria-describedby`; this is the
 * prefix that says the announcement is a problem rather than a hint.
 */
export const ERROR_PREFIX = 'Error:';
