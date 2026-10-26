import { describe, expect, it } from 'vitest';
import { fieldError, formErrors } from '@/lib/formValidation';
import { CONTACT_FORM_FIELDS } from '@/content/company';
import { WAITLIST_FIELDS } from '@/content/launchpad';
import type { FormField } from '@/types/forms';

/**
 * The client half of §68.
 *
 * Both forms ship as UI only — the client owns the backend — so this validation
 * is the one part of §68 that is actually running in production, and it is worth
 * testing properly rather than as a formality.
 *
 * The rules are deliberately loose, and most of these tests assert that
 * looseness: a validator that rejects a valid Gulf phone number or a name with
 * an apostrophe is a bug wearing the costume of rigour. The tests for what is
 * ACCEPTED matter more here than the tests for what is rejected.
 */

const field = (over: Partial<FormField> = {}): FormField => ({
  id: 'test',
  label: 'Test',
  kind: 'text',
  required: true,
  ...over,
});

describe('required and optional', () => {
  it('rejects an empty required field, naming it', () => {
    expect(fieldError(field({ label: 'Full Name' }), '')).toBe('Full Name is required.');
  });

  /** Whitespace is not an answer. */
  it('rejects a required field holding only spaces', () => {
    expect(fieldError(field({ label: 'Message' }), '   \n\t ')).toBe('Message is required.');
  });

  it('accepts an empty optional field', () => {
    expect(fieldError(field({ required: false }), '')).toBeNull();
  });

  /**
   * An optional field with something in it is still checked for shape. An
   * optional phone number typed wrong is still typed wrong, and letting it
   * through means the client receives it.
   */
  it('still checks the shape of an optional field that was filled in', () => {
    expect(fieldError(field({ kind: 'email', required: false }), 'not-an-address')).not.toBeNull();
    expect(fieldError(field({ kind: 'email', required: false }), '')).toBeNull();
  });

  /** Leading and trailing spaces are a typing artefact, not a value. */
  it('trims before judging', () => {
    expect(fieldError(field({ kind: 'email' }), '  hi@qavyx.com  ')).toBeNull();
  });
});

describe('email', () => {
  it('accepts ordinary addresses', () => {
    for (const value of [
      'info@qavyx.com',
      'first.last@example.co.uk',
      'user+tag@example.com',
      "o'brien@example.com",
      'user_name@sub.domain.example.org',
    ]) {
      expect(fieldError(field({ kind: 'email' }), value), value).toBeNull();
    }
  });

  it('rejects the shapes that are actually mistakes', () => {
    for (const value of ['qavyx.com', 'info@', '@qavyx.com', 'a@b', 'two @qavyx.com']) {
      expect(fieldError(field({ kind: 'email' }), value), value).not.toBeNull();
    }
  });

  it('names the field in the message', () => {
    expect(fieldError(field({ kind: 'email', label: 'Email' }), 'nope')).toBe(
      'Email does not look like an email address.',
    );
  });
});

describe('phone', () => {
  /**
   * The site serves India and the GCC (§69, §72). A national-format check would
   * reject most of the audience, so the rule is a digit-count range with the
   * punctuation people actually type ignored.
   */
  it('accepts the ways a real number gets typed across India and the Gulf', () => {
    for (const value of [
      '+91-9188743741',
      '+91 91887 43741',
      '9188743741',
      '+971 50 123 4567',
      '(050) 123-4567',
      '+966501234567',
    ]) {
      expect(fieldError(field({ kind: 'tel' }), value), value).toBeNull();
    }
  });

  it('rejects letters and obvious nonsense', () => {
    expect(fieldError(field({ kind: 'tel' }), 'call me')).not.toBeNull();
    expect(fieldError(field({ kind: 'tel' }), '+91-91887-ABCDE')).not.toBeNull();
  });

  it('rejects too few and too many digits, at the E.164 boundaries', () => {
    expect(fieldError(field({ kind: 'tel' }), '123456')).not.toBeNull(); // 6
    expect(fieldError(field({ kind: 'tel' }), '1234567')).toBeNull(); // 7
    expect(fieldError(field({ kind: 'tel' }), '123456789012345')).toBeNull(); // 15
    expect(fieldError(field({ kind: 'tel' }), '1234567890123456')).not.toBeNull(); // 16
  });
});

describe('names and free text', () => {
  /**
   * No character class at all. Rejecting a name for an apostrophe, a hyphen, an
   * accent or a non-Latin script is a bug, and this site's audience spans two
   * regions where all four are ordinary.
   */
  it('accepts any name a person might actually have', () => {
    for (const value of [
      "O'Brien",
      'Anne-Marie',
      'José Ramírez',
      'محمد',
      'ആജ്നാസ്',
      '李雷',
    ]) {
      expect(fieldError(field({ label: 'Name' }), value), value).toBeNull();
    }
  });
});

describe('the select', () => {
  const interest = CONTACT_FORM_FIELDS.find((f) => f.kind === 'select')!;

  it('accepts any option the document lists', () => {
    for (const option of interest.options ?? []) {
      expect(fieldError(interest, option), option).toBeNull();
    }
  });

  /**
   * Only reachable by tampering — a `<select>` cannot produce a value that is
   * not one of its options. It is checked because the same rule has to hold on
   * the server, and this file is where the server's rules should come from.
   */
  it('rejects a value that is not one of them', () => {
    expect(fieldError(interest, 'Web3 Marketing')).not.toBeNull();
  });

  /** The empty placeholder is "unanswered", which on a required field is an error. */
  it('treats the unchosen placeholder as unanswered', () => {
    expect(fieldError(interest, '')).toBe(`${interest.label} is required.`);
  });
});

describe('the whole form', () => {
  it('reports every empty required field of §52’s six at once', () => {
    const errors = formErrors(CONTACT_FORM_FIELDS, {});
    expect(Object.keys(errors)).toEqual(
      CONTACT_FORM_FIELDS.filter((f) => f.required).map((f) => f.id),
    );
  });

  /** §44 has two optional fields, so an empty waitlist has three errors, not five. */
  it('leaves §44’s two optional fields alone when empty', () => {
    const errors = formErrors(WAITLIST_FIELDS, {});
    expect(Object.keys(errors)).toEqual(['full-name', 'email', 'whatsapp']);
  });

  it('is empty — and only empty — for a completely valid form', () => {
    expect(
      formErrors(WAITLIST_FIELDS, {
        'full-name': 'Ada Lovelace',
        email: 'ada@example.com',
        whatsapp: '+91 91887 43741',
      }),
    ).toEqual({});
  });

  /** A missing key and an empty string must mean the same thing. */
  it('treats an absent value exactly as an empty one', () => {
    expect(formErrors(WAITLIST_FIELDS, {})).toEqual(
      formErrors(WAITLIST_FIELDS, { 'full-name': '', email: '', whatsapp: '' }),
    );
  });
});
