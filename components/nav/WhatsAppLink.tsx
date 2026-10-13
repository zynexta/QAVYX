import { CONTACT, WHATSAPP } from '@/content/site';

/**
 * The one place a WhatsApp URL is built.
 *
 * Four things link to WhatsApp — the navbar CTA, the footer CTA, the homepage's
 * final CTA and the floating button — and the draft is explicit that all four go
 * to the same number with the same pre-filled message. Four hand-written `wa.me`
 * hrefs would be four chances to typo a phone number into a stranger's inbox.
 *
 * `wa.me` is the documented cross-platform entry point and needs no runtime
 * branch: it opens WhatsApp Web on desktop and the native app on mobile, which
 * is exactly the draft's behaviour note.
 *
 * The message is encoded HERE, not in `content/site.ts` — a pre-encoded string
 * in a content file is unreadable to whoever owns the copy, and the emoji makes
 * that especially true.
 */

/**
 * The one `wa.me` URL. Exported since `ContactRail` links a row at it directly
 * rather than through the component — the row's shell is its own markup, but the
 * destination must stay the single one this file owns.
 */
export const WHATSAPP_HREF = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(WHATSAPP.message)}`;

interface WhatsAppLinkProps {
  className?: string;
  /** Visible label. Omit for an icon-only link and pass `ariaLabel` instead. */
  label?: string;
  ariaLabel?: string;
  children?: React.ReactNode;
}

export function WhatsAppLink({ className, label, ariaLabel, children }: WhatsAppLinkProps) {
  return (
    <a
      href={WHATSAPP_HREF}
      // Opening a chat is leaving the site. `noopener` is the safety half of the
      // pair; `noreferrer` is not set, because wa.me seeing the referrer is
      // harmless and the client may want it in their analytics.
      target="_blank"
      rel="noopener"
      aria-label={ariaLabel}
      className={className}
    >
      {children ?? label}
    </a>
  );
}
