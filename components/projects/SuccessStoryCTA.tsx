'use client';

import React from 'react';
import Image from 'next/image';
import { WhatsAppLink } from '@/components/nav/WhatsAppLink';
import { CTA_LABEL } from '@/content/site';
import { PROJECTS_CTA } from '@/content/projects';

export function SuccessStoryCTA() {
  return (
    <section className="relative w-full my-6 sm:my-10 select-none">
      {/* Outer Rounded Glass Container */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#2ABD00]/30 bg-[#040a05]/95 py-8 sm:py-10 md:py-12 px-4 sm:px-8 shadow-[0_10px_30px_rgba(0,0,0,0.7),0_0_20px_rgba(42,189,0,0.12)] backdrop-blur-xl">
        {/* Dark Mountain Landscape Background Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay">
          <Image
            src="/mountain-bg.webp"
            alt="Mountain Silhouette"
            fill
            className="object-cover object-bottom filter contrast-125"
          />
        </div>

        {/* Ambient Radial Green Atmospheric Glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[#2ABD00]/10 blur-[60px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[#2ABD00]/8 blur-[60px]" />

        {/* High-Tech Vector Grid Overlay Background */}
        <div className="pointer-events-none absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#2ABD00_1px,transparent_1px),linear-gradient(to_bottom,#2ABD00_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        {/* Centered Clean Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* Eyebrow Pill Badge */}
          <div className="mb-2 sm:mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#2ABD00]/30 bg-[#06180a]/90 px-3 py-0.5 shadow-[0_0_8px_rgba(42,189,0,0.15)] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2ABD00] shadow-[0_0_5px_#2ABD00]" />
            <span className="font-mono text-[8px] sm:text-[9px] font-bold tracking-[0.2em] text-[#2ABD00] uppercase">
              LET&apos;S WORK TOGETHER
            </span>
          </div>

          {/* Heading */}
          <h2 className="qx-display text-xl xs:text-2xl sm:text-3xl md:text-[2.2rem] font-bold text-white leading-tight tracking-tight mb-2.5">
            Ready to Be Our{' '}
            <span className="text-[#2ABD00] drop-shadow-[0_0_10px_rgba(42,189,0,0.3)]">
              Next Success Story?
            </span>
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#919A94] font-sans max-w-lg mb-4 leading-relaxed font-medium">
            {PROJECTS_CTA.copy}
          </p>

          {/* Feature Bullets / Strategy Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5 text-[9px] sm:text-[10px] font-medium text-white">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#061509]/80 px-2.5 py-1 backdrop-blur-md">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#2ABD00]/20 text-[#2ABD00]">
                <svg className="w-2 h-2 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Real Strategies</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#061509]/80 px-2.5 py-1 backdrop-blur-md">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#2ABD00]/20 text-[#2ABD00]">
                <svg className="w-2 h-2 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Custom Solutions</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#061509]/80 px-2.5 py-1 backdrop-blur-md">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#2ABD00]/20 text-[#2ABD00]">
                <svg className="w-2 h-2 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Scalable Growth</span>
            </div>
          </div>

          {/* Clean CTA Button - Matching Footer and Home Style */}
          <WhatsAppLink
            ariaLabel={CTA_LABEL}
            className="group inline-flex items-center justify-center gap-2.5 rounded-sm border border-[#2ABD00]/60 bg-transparent px-5 sm:px-6 py-2 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#2ABD00] transition-all duration-300 hover:border-[#2ABD00] hover:bg-[#2ABD00]/10 hover:shadow-[0_0_14px_rgba(42,189,0,0.3)] cursor-pointer"
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
    </section>
  );
}
