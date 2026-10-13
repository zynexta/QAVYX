'use client';

import { useId, useState } from 'react';
import {
  ERROR_PREFIX,
  FORM_NOTICE,
  OPTIONAL_MARKER,
  REQUIRED_MARKER,
  SELECT_PLACEHOLDER,
} from '@/content/forms';
import { CONTACT, CTA_LABEL } from '@/content/site';
import { AlertIcon } from '@/components/icons';
import { WhatsAppLink } from '@/components/nav/WhatsAppLink';
import { EYEBROW } from '@/components/inner/InnerPage';
import { fieldError } from '@/lib/formValidation';
import type { FormField } from '@/types/forms';

/**
 * Both of the document's forms — §52's contact form and §44's Launchpad
 * waitlist — rendered by one component.
 *
 * They are the same object: a list of labelled fields, three or four of them
 * required, and a submit button. Two hand-built forms would be two places for
 * the label markup, the error wiring and the required marker to drift apart, on
 * exactly the two pages where an accessibility mistake costs a conversion.
 *
 * ## IT DOES NOT SUBMIT, AND THAT IS THE SPECIFICATION
 *
 * The client owns the backend. §68 asks for server-side validation, spam
 * protection and loading / success / error states; none of them can be built
 * without knowing where a submission goes, and inventing an endpoint would ship
 * a form that silently discards what it is given.
 *
 * So: the submit button is `disabled`, `onSubmit` is prevented as a second
 * guard, and a notice ABOVE THE FIELDS says why and offers the two channels that
 * do work. `content/forms.ts` holds those strings and explains the ordering.
 *
 * **To wire it up:** drop the `disabled`, replace `handleSubmit`'s
 * `preventDefault` with the real POST, delete `<FormNotice />`, and render
 * §44's `WAITLIST_SUCCESS` (already in `content/launchpad.ts`) on the response.
 * Nothing else here changes — the fields, the labels and the validation are the
 * client's specification and are already right.
 *
 * ## The client half of §68 is real, not a mock
 *
 * `lib/formValidation.ts` holds the rules as pure functions, so the same
 * rules can be reused on the server rather than re-invented there. They run on
 * BLUR, and again on every change once a field has been blurred — validating on
 * every keystroke tells someone their email is invalid while they are typing the
 * `@`, and validating only on submit is useless on a form that cannot submit.
 *
 * ## Accessibility, the parts that are easy to get wrong
 *
 * - Every input has a real `<label for>`, never a placeholder standing in for
 *   one — a placeholder disappears the moment someone types.
 * - The required marker is a visible word, not a red asterisk, and it is inside
 *   the label so it is announced with the field name rather than skipped.
 *   `aria-required` carries the same fact to assistive tech.
 * - An error message is joined to its input with `aria-describedby` and the
 *   input gets `aria-invalid`, so the message is announced on focus rather than
 *   only being visible. `role="alert"` would announce it the instant it appears,
 *   which on blur means announcing over whatever the user tabbed to.
 * - The disabled button is described by the notice, so a screen-reader user
 *   reaching it hears why it is disabled instead of hitting a dead control.
 */

interface UiOnlyFormProps {
  /** Names the form for assistive tech — the section heading above it. */
  label: string;
  fields: readonly FormField[];
  /** The document's own submit label. Rendered on the disabled button. */
  submitLabel: string;
}

export function UiOnlyForm({ label, fields, submitLabel }: UiOnlyFormProps) {
  // `useId` rather than a prop: it is stable across server and client render,
  // and it means neither page has to invent a prefix that the other must not
  // collide with.
  const prefix = useId();
  const noticeId = `${prefix}-notice`;

  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /** Only shown once the field has been blurred at least once. */
  const errorFor = (field: FormField): string | null =>
    touched[field.id] ? fieldError(field, values[field.id] ?? '') : null;

  return (
    <form
      aria-label={label}
      // The browser's own bubbles would fire on a submit that never happens, and
      // they would say something different from the messages below.
      noValidate
      // Belt and braces. The button is disabled, which already blocks implicit
      // submission — but a form with no action would otherwise GET the current
      // URL, and losing a filled form to a page reload is the worst possible
      // outcome for a control that was never going to submit anyway.
      onSubmit={(event) => event.preventDefault()}
      className="mt-5 flex max-w-[42rem] flex-col gap-5"
    >
      <FormNotice id={noticeId} />

      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <Field
            key={field.id}
            field={field}
            prefix={prefix}
            value={values[field.id] ?? ''}
            error={errorFor(field)}
            onChange={(value) => setValues((v) => ({ ...v, [field.id]: value }))}
            onBlur={() => setTouched((t) => ({ ...t, [field.id]: true }))}
          />
        ))}
      </div>

      <div>
        <button
          type="submit"
          disabled
          aria-describedby={noticeId}
          className="w-fit cursor-not-allowed rounded-sm border border-qx-line px-4 py-2 font-mono text-2xs uppercase tracking-[0.28em] text-qx-grey"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

/**
 * The notice, above the fields.
 *
 * The WhatsApp link inside it is the site's one CTA label (§65) going to the
 * site's one WhatsApp URL (`WhatsAppLink`), so the channel offered here is the
 * same channel offered by the floating button and the footer — not a second
 * contact path invented for this page.
 */
function FormNotice({ id }: { id: string }) {
  const [before, after] = FORM_NOTICE.body.split('{email}');

  return (
    <div id={id} className="flex flex-col gap-2 rounded-sm border border-qx-line bg-qx-ink-raised p-4">
      <p className={EYEBROW}>{FORM_NOTICE.label}</p>
      <p className="text-sm text-qx-grey">
        {before}
        <a
          href={`mailto:${CONTACT.email}`}
          className="text-qx-white underline underline-offset-2"
        >
          {CONTACT.email}
        </a>
        {after}
      </p>
      <WhatsAppLink
        className="w-fit font-mono text-2xs uppercase tracking-[0.28em] text-qx-green transition-colors hover:text-qx-white"
        label={CTA_LABEL}
      />
    </div>
  );
}

interface FieldProps {
  field: FormField;
  prefix: string;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function Field({ field, prefix, value, error, onChange, onBlur }: FieldProps) {
  const inputId = `${prefix}-${field.id}`;
  const errorId = `${inputId}-error`;

  // The same props on all four control types, so a `<textarea>` cannot quietly
  // end up without the wiring an `<input>` has.
  const shared = {
    id: inputId,
    name: field.id,
    value,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    onBlur,
    'aria-required': field.required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    className:
      'w-full rounded-sm border bg-qx-black px-3 py-2 text-sm text-qx-white ' +
      'placeholder:text-qx-grey focus-visible:border-qx-green ' +
      (error ? 'border-qx-green-dim' : 'border-qx-line'),
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm text-qx-white">{field.label}</span>
        {/* Both states are visible, not just the required one. §44 marks two of
            its five optional, and a form that only stars the required fields
            leaves the reader counting. */}
        <span className={EYEBROW}>{field.required ? REQUIRED_MARKER : OPTIONAL_MARKER}</span>
      </label>

      {field.kind === 'textarea' ? (
        <textarea {...shared} rows={5} />
      ) : field.kind === 'select' ? (
        <select {...shared}>
          {/* Empty value, so "unanswered" is a state the control can be in —
              see SELECT_PLACEHOLDER in `content/forms.ts`. */}
          <option value="">{SELECT_PLACEHOLDER}</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...shared}
          type={field.kind}
          // The keyboard a phone raises. §68's "mobile-friendly inputs" is
          // mostly this and the `type` above it.
          inputMode={
            field.kind === 'tel' ? 'tel' : field.kind === 'email' ? 'email' : undefined
          }
          autoComplete={AUTOCOMPLETE[field.kind]}
        />
      )}

      {/* The mark is here because this palette has no red. `--qx-green` is the
          only signal colour the brand owns, so a validation message was being
          distinguished from helper text by its position alone — and green is the
          colour this site uses for success and for focus everywhere else. The
          glyph is the second channel WCAG 1.4.1 asks for. It is `aria-hidden`:
          `ERROR_PREFIX` is already the announced half, and an icon saying the
          same word twice is noise on the control someone is stuck on. */}
      {error ? (
        <p id={errorId} className="flex items-start gap-2 text-xs text-qx-green">
          <AlertIcon className="mt-[0.15rem] h-3 w-3 shrink-0" />
          <span>
            <span className="sr-only">{ERROR_PREFIX} </span>
            {error}
          </span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * `autocomplete` tokens, by field kind.
 *
 * Only the two the browser can actually fill. `text` covers Name, Business Name,
 * Startup Name and Industry — four different things, and guessing `name` for all
 * of them would offer a person's own name where a company's is wanted.
 */
const AUTOCOMPLETE: Partial<Record<FormField['kind'], string>> = {
  email: 'email',
  tel: 'tel',
};
