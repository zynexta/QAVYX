import type { Metadata } from 'next';
import { InnerPage, Section } from '@/components/inner/InnerPage';
import { ContactRail } from '@/components/contact/ContactRail';
import { UiOnlyForm } from '@/components/forms/UiOnlyForm';
import { JsonLd } from '@/components/seo/JsonLd';
import { CONTACT_FORM_FIELDS, CONTACT_FORM_SUBMIT, CONTACT_PAGE } from '@/content/company';
import { contactJsonLd, pageMetadata } from '@/lib/seo';

/**
 * `/who-we-are/contact` — §51 Contact and §52 Contact Form.
 *
 * ## ONE SECTION, TWO COLUMNS — and it was two sections with a hole in each
 *
 * This page used to render §51 and §52 as two stacked full-width cards, and both
 * were mostly air. Measured at 1440px, where the section's content box is 960px
 * (`--qx-shell` 80rem, less the article's `md:px-6` and the section's `lg:px-7`
 * a side): the details card held three one-line values across that 960px row and
 * then stopped; the form card held a 672px form (`UiOnlyForm` caps itself at
 * `max-w-[42rem]`, which is a readability rule and correct) in the same 960px,
 * leaving a 288px column empty for the form's whole 939px height.
 *
 * They are now one section: the form in column one, `ContactRail` in column two
 * carrying the three channels and the page's drawing. The empty column is the
 * thing that got fixed; the drawing is what went into it, not the reason for it.
 *
 * ## The details still come first, the form second
 *
 * §73 makes the site's conversion "start a conversation with QAVYX", and the two
 * channels that work today are the WhatsApp number and the email address. The
 * form, per the client's decision, does not submit anywhere yet. Putting the
 * working channels first is not a layout preference: it is the difference
 * between a visitor reaching the company and a visitor filling six fields into a
 * control that was never going to send them.
 *
 * THE GRID IS WHAT KEEPS THAT TRUE. `ContactRail` is FIRST in the source and is
 * moved to column two only at `xl` and up, so reading order — for a screen
 * reader, and for every viewport under 1280px — is still channels, then form.
 * A rail written second and floated right would have inverted the one ordering
 * this page is built around, on exactly the devices where it matters most.
 *
 * ## THE SPLIT IS AT `xl`, NOT `lg`, AND THAT IS A BUG FIX
 *
 * It shipped at `lg` for one revision and deleted the rail outright between
 * 1024px and 1279px. `--qx-shell` is 64rem until `xl` and only then steps to
 * 80rem (`styles/tokens.css`, whose own comment requires that step to stay in
 * lockstep with Tailwind's `xl`). So in that band the section's content box is
 * 704px, not 960px: after the 40px gap, 664px remain, `minmax(0,38rem)` has a
 * definite growth limit and takes all of it, and `minmax(0,1fr)` floors at zero
 * and gets nothing. Measured `grid-template-columns: 664px 0px` at 1024, 1100
 * and 1279 — the diagram, the number, the address and the locations all rendered
 * at zero width while both links stayed in the tab order as invisible targets.
 * On every window narrower than 1280px the page deleted the only channels that
 * work, which is the exact opposite of what the section above argues for.
 *
 * Splitting where the shell actually widens is the fix. Below `xl` this is one
 * column, which the source order already handles — and the hole that motivated
 * the whole change barely exists there anyway: at 1023px the section is 767px
 * against a 672px form, so 95px, not 288px.
 *
 * ## The contact details are not retyped here
 *
 * `CONTACT` in `content/site.ts` owns the number, the email and the locations,
 * because the footer prints the same three on every page. There is exactly one
 * copy of them on this page and it is inside `ContactRail`.
 *
 * ## The form is UI only
 *
 * See `components/forms/UiOnlyForm.tsx`. It carries real labels, real input
 * types, real client-side validation and a visible notice saying it is not
 * connected — and the notice is above the fields, not beside the button.
 */
const PAGE = { href: '/who-we-are/contact', label: 'Contact Us' };

export const metadata: Metadata = pageMetadata({
  path: '/who-we-are/contact',
  title: 'Contact Us',
  description: CONTACT_PAGE.description,
});

export default function ContactRoute() {
  return (
    <>
      <JsonLd data={contactJsonLd(PAGE, CONTACT_PAGE.description)} />
      <InnerPage title={CONTACT_PAGE.heading} intro={[CONTACT_PAGE.description]}>
        <Section id="qx-contact" label={CONTACT_PAGE.cta}>
          {/* The form's column is capped, and the rail takes what is left,
              rather than the form being stretched to fill the section. Below
              `xl` this is one column and the source order stands.

              38rem RATHER THAN THE FORM'S OWN 42rem CAP. The section is 960px at
              every viewport `xl` and above (the shell caps at 80rem), so a 42rem
              track leaves the rail 248px — enough for the values by about 49px,
              and cramped for the drawing. Taking 64px off the form gives the
              rail 312px and costs the form nothing that matters: 608px is still
              well inside the measure `max-w-[42rem]` exists to protect, and form
              fields do not get more readable as they get wider.

              THE CELLS STRETCH, which is the grid default and is load-bearing
              here rather than incidental: `xl:sticky` inside the rail travels
              within its own cell, so the cell has to be as tall as the row. Set
              `items-start` and the cell shrinks to the rail's own height, the
              sticky element has zero distance to travel, and it behaves exactly
              like `static` while looking like it should not.

              The two gaps read off the project's token scale (`gap-x-5` is
              --qx-space-5, 40px) rather than Tailwind's stock one. `gap-y-2` is
              small on purpose: it only applies in the one-column case, where
              `UiOnlyForm`'s own `mt-5` already separates the rail from the form,
              and `gap-y-6` there stacked into a 104px band of nothing. */}
          <div className="grid gap-x-5 gap-y-2 xl:grid-cols-[minmax(0,38rem)_minmax(0,1fr)]">
            {/* FIRST IN SOURCE, SECOND IN THE GRID — see the note above. */}
            <ContactRail className="mt-5 xl:col-start-2 xl:row-start-1" />

            {/* `UiOnlyForm` brings its own `mt-5`, which is what lines its first
                field up with the top of the rail. */}
            <div className="xl:col-start-1 xl:row-start-1">
              <UiOnlyForm
                label={CONTACT_PAGE.cta}
                fields={CONTACT_FORM_FIELDS}
                submitLabel={CONTACT_FORM_SUBMIT}
              />
            </div>
          </div>
        </Section>
      </InnerPage>
    </>
  );
}
