'use client';

import React from 'react';
import { CTA_LABEL } from '@/content/site';
import { WhatsAppLink } from '@/components/nav/WhatsAppLink';
import { reveal, stagger } from '@/lib/reveal';

/**
 * Act 7 — The homepage's final CTA section ("Let's Build Your Growth Story").
 * Blends seamlessly with QAVYX's dark emerald glass aesthetic.
 */
export function FinalCta() {
  return (
    <section
      id="qx-final-cta"
      aria-labelledby="qx-final-cta-heading"
      className="mx-auto max-w-[var(--qx-shell)] px-3 sm:px-6 pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 lg:pb-20 select-none"
    >
      <div
        {...reveal}
        className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#2ABD00]/30 bg-[#040a05]/95 py-6 sm:py-8 lg:py-10 px-4 sm:px-8 shadow-[0_0_20px_rgba(0,0,0,0.8),0_0_15px_rgba(42,189,0,0.12)] backdrop-blur-xl"
      >
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-[180px] w-[180px] rounded-full bg-[#2ABD00]/10 blur-[60px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[180px] w-[180px] rounded-full bg-[#2ABD00]/5 blur-[60px]" />

        {/* High-Tech Vector Grid Overlay Background */}
        <div className="pointer-events-none absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#2ABD00_1px,transparent_1px),linear-gradient(to_bottom,#2ABD00_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        {/* ================= CENTERED COPY & CTA ================= */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          
          {/* Category Pill Badge */}
          <div
            data-rv
            className="mb-2 sm:mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#2ABD00]/30 bg-[#06180a]/90 px-3 py-0.5 shadow-[0_0_8px_rgba(42,189,0,0.15)] backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#2ABD00] shadow-[0_0_5px_#2ABD00]" />
            <span className="font-mono text-[8px] sm:text-[9px] font-bold tracking-[0.2em] text-[#2ABD00] uppercase">
              LET&apos;S BUILD TOGETHER
            </span>
          </div>

          {/* Main Headline */}
          <h2
            id="qx-final-cta-heading"
            data-rv
            style={stagger(1)}
            className="qx-display text-xl xs:text-2xl sm:text-3xl md:text-[2.2rem] font-bold text-white leading-tight tracking-tight mb-2.5 font-sans"
          >
            Let&apos;s Build Your{' '}
            <span className="text-[#2ABD00]">
              Growth Story
            </span>
          </h2>

          {/* Description Copy */}
          <p
            data-rv
            style={stagger(2)}
            className="text-xs sm:text-sm text-[#919A94] font-sans max-w-lg mb-3 leading-relaxed"
          >
            We believe growth should be strategic, measurable, and scalable. If you&apos;re ready to take your brand to the next level, let&apos;s start with a simple conversation.
          </p>

          {/* Feature Bullets */}
          <div
            data-rv
            style={stagger(3)}
            className="flex flex-wrap items-center justify-center gap-1.5 mb-4 text-[9px] sm:text-[10px] font-medium text-white"
          >
            <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#061509]/80 px-2.5 py-0.5 backdrop-blur-md">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#2ABD00]/15 text-[#2ABD00]">
                <svg className="w-1.5 h-1.5 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Real Strategies</span>
            </div>

            <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#061509]/80 px-2 py-0.5 backdrop-blur-md">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#2ABD00]/15 text-[#2ABD00]">
                <svg className="w-1.5 h-1.5 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Custom Solutions</span>
            </div>

            <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#061509]/80 px-2 py-0.5 backdrop-blur-md">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#2ABD00]/15 text-[#2ABD00]">
                <svg className="w-1.5 h-1.5 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Scalable Growth</span>
            </div>
          </div>

          {/* CTA Button - Exact Footer Chat With Us Styling */}
          <div data-rv style={stagger(4)}>
            <WhatsAppLink
              ariaLabel={CTA_LABEL}
              className="group inline-flex items-center justify-center gap-2.5 rounded-sm border border-[#2ABD00]/60 bg-transparent px-4 sm:px-5 py-1.5 sm:py-2 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#2ABD00] transition-all duration-300 hover:border-[#2ABD00] hover:bg-[#2ABD00]/10 hover:shadow-[0_0_12px_rgba(42,189,0,0.3)] cursor-pointer"
            >
              <span>{CTA_LABEL}</span>
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.2] transition-transform duration-300 group-hover:translate-x-1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </WhatsAppLink>
          </div>

        </div>
      </div>
    </section>
  );
}



