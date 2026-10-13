import { describe, expect, it } from 'vitest';
import { FAQS } from '@/content/faq';
import { faqJsonLd, pageMetadata } from '@/lib/seo';
import { HANDOFF, isVerbatim } from './helpers/handoff';

/**
 * §60 — fourteen questions, and this page is almost nothing but transcription.
 *
 * Which makes the verbatim check the whole test. Twenty-eight strings copied by
 * hand from a Markdown document is twenty-eight chances to straighten a curly
 * apostrophe, drop a serial comma or lose the spaces around an em dash — none of
 * which fails a build, looks wrong on screen, or would ever be noticed by
 * re-reading. `isVerbatim` reads the document on disk and compares.
 */

const PAGE = { href: '/faq', label: 'FAQ' };

describe('§60 the fourteen questions', () => {
  it('is fourteen, each with a question and an answer', () => {
    expect(FAQS).toHaveLength(14);
    for (const faq of FAQS) {
      expect(faq.question.length).toBeGreaterThan(0);
      expect(faq.answer.length).toBeGreaterThan(0);
      expect(faq.question.endsWith('?')).toBe(true);
    }
  });

  /** The one that matters: every string is the client's, character for character. */
  it('is the client’s copy verbatim, all twenty-eight strings', () => {
    for (const faq of FAQS) {
      expect(isVerbatim(faq.question), `question: ${faq.question}`).toBe(true);
      expect(isVerbatim(faq.answer), `answer to: ${faq.question}`).toBe(true);
    }
  });

  /**
   * §60 opens with the broadest question and closes on the ask, with pricing and
   * getting-started near the end. That is a sequence someone wrote; sorting or
   * bucketing it would be an editorial decision the client did not make.
   */
  it('keeps the document’s order, unsorted and ungrouped', () => {
    expect(FAQS[0]?.question).toBe('What does QAVYX do?');
    expect(FAQS[13]?.question).toBe('Why should I choose QAVYX?');

    // The document's own order, read off the document rather than retyped.
    const positions = FAQS.map((faq) => HANDOFF.indexOf(faq.question));
    expect(positions).not.toContain(-1);
    expect([...positions]).toEqual([...positions].sort((a, b) => a - b));
  });

  it('gives every entry a stable, unique anchor', () => {
    const ids = FAQS.map((faq) => faq.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  /**
   * The anchors are hand-written, NOT generated from the question text, so that
   * rewording a question does not silently change a URL someone has shared.
   *
   * A few of the shorter questions do happen to slugify to their own id — that
   * is a coincidence, not a scheme. What proves they are chosen is that most do
   * not: "How is QAVYX different from other agencies?" is `how-is-qavyx-
   * different`, and no generator produces that.
   */
  it('does not generate its anchors from the question text', () => {
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const derived = FAQS.filter((faq) => faq.id === slugify(faq.question));
    expect(derived.length).toBeLessThan(FAQS.length / 2);

    const example = FAQS.find((faq) => faq.question.startsWith('How is QAVYX different'));
    expect(example?.id).toBe('how-is-qavyx-different');
    expect(example?.id).not.toBe(slugify(example?.question ?? ''));
  });
});

describe('the page’s metadata and structured data', () => {
  /**
   * §60 supplies no page heading, so the page leads with the client's first
   * question and its answer is the meta description — rather than a summary
   * written here, which would be the one sentence on the page that nobody
   * approved.
   */
  it('describes itself with the client’s own first answer', () => {
    const meta = pageMetadata({ path: '/faq', title: 'FAQ', description: FAQS[0].answer });
    expect(meta.title).toBe('FAQ');
    expect(meta.description).toBe(FAQS[0].answer);
    expect(meta.alternates?.canonical).toBe('/faq');
  });

  /**
   * This is the one page whose structured data can carry the whole content
   * rather than a summary of it, which is the reason to emit a graph at all.
   */
  it('emits all fourteen as a FAQPage, with the answers the page renders', () => {
    const graph = faqJsonLd(PAGE, FAQS[0].answer, FAQS)['@graph'] as Array<
      Record<string, unknown>
    >;
    expect(graph.map((node) => node['@type'])).toEqual(['Organization', 'FAQPage']);

    const page = graph[1] as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    expect(page.mainEntity).toHaveLength(14);
    expect(page.mainEntity.map((q) => q.name)).toEqual(FAQS.map((f) => f.question));
    expect(page.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(
      FAQS.map((f) => f.answer),
    );
  });

  /**
   * NO `BreadcrumbList`, and this test used to assert its contents.
   *
   * It was headed "Home → FAQ, the same two steps the page's breadcrumb
   * renders", which is exactly why it is now the opposite assertion: the client
   * removed the visible breadcrumb, and `lib/seo.ts` kept the rule the old test
   * encoded rather than the node — structured data must not describe a trail the
   * page does not show. The graph is two nodes now, and a third creeping back is
   * a regression whichever direction it comes from.
   */
  it('emits no trail, because the page no longer renders one', () => {
    const graph = faqJsonLd(PAGE, FAQS[0].answer, FAQS)['@graph'] as Array<
      Record<string, unknown>
    >;
    expect(graph.map((node) => node['@type'])).not.toContain('BreadcrumbList');
    expect(graph).toHaveLength(2);
  });
});
