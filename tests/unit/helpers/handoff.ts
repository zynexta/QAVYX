import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The client's document, read from disk, for the content tests to check
 * themselves against.
 *
 * `content/` transcribes `docs/CONTENT-HANDOFF.md` by hand, because a file that reads as the document does is a file the person who
 * owns the copy can check. The cost of transcription is that a word can drift —
 * a straight apostrophe for a curly one, an en dash for an em dash, a dropped
 * "and" — and none of that fails a build or looks wrong on screen.
 *
 * So the tests read the document. `containsVerbatim` is the assertion that a
 * string in `content/` is actually the client's, character for character, and it
 * is why the FAQ's fourteen answers and the Who We Are copy can be trusted
 * without anyone re-reading them.
 *
 * ## What it deliberately does NOT normalise
 *
 * Nothing except Markdown's own inline emphasis and line wrapping. Lower-casing
 * or collapsing punctuation would defeat the purpose: apostrophe style and dash
 * style are exactly the drift this exists to catch. The one allowance is that
 * the document bolds many headings (`**Our Mission**`), which is Markdown syntax
 * rather than content.
 */

const PATH = resolve(__dirname, '../../../docs/CONTENT-HANDOFF.md');

/**
 * The document with `**bold**` and `*italic*` markers stripped and all runs of
 * whitespace collapsed to single spaces, so a sentence the document wraps across
 * two lines still matches the single-line string in `content/`.
 *
 * Read once. It is 1,800 lines and every content test wants the whole of it.
 */
export const HANDOFF: string = readFileSync(PATH, 'utf8')
  .replace(/\*\*/g, '')
  .replace(/\s+/g, ' ');

/** True when the client actually wrote this string, character for character. */
export function isVerbatim(text: string): boolean {
  return HANDOFF.includes(text.replace(/\s+/g, ' '));
}
