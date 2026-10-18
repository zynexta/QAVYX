'use client';

import { useState } from 'react';
import { WHY_QAVYX } from '@/content/home';
import { reveal, stagger } from '@/lib/reveal';

/**
 * Act 6a — "Why QAVYX". Six reasons.
 *
 * Responsive 2-column mobile grid with interactive expandable card details on hover/tap.
 */
export function WhyQavyx() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleCard = (index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  return (
    <section
      id="qx-why"
      aria-labelledby="qx-why-heading"
      className="mx-auto max-w-[var(--qx-shell)] px-3 xs:px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-10 sm:pb-12 lg:pb-14 relative overflow-hidden"
    >
      <div {...reveal} className="relative w-full py-2">
        {/* Section Header styled identically to Problem & Solution sections */}
        <div className="text-center max-w-[56rem] mx-auto mb-4 sm:mb-6 lg:mb-8 relative z-30">
          <h2
            id="qx-why-heading"
            className="qx-display text-[19px] xs:text-[25px] sm:text-[31px] lg:text-[2.3rem] font-bold tracking-tight text-white leading-tight break-words max-w-full"
          >
            <span>Why Partner With </span>
            <span className="text-[#2ABD00]">
              Us ?
            </span>
          </h2>
          <div className="w-12 sm:w-16 h-[2px] bg-[#2ABD00] rounded-full mx-auto mt-3.5" />
        </div>

        {/* 2-Column Composition: Left Character Hero + Right Reasons List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center mt-4 sm:mt-6">
          {/* Left Column: Character Hero */}
          <div
            data-rv-character
            style={stagger(1)}
            className="lg:col-span-4 flex relative flex-col items-center justify-center pt-1 sm:pt-2 lg:py-2 z-20 pointer-events-none -mb-12 xs:-mb-14 sm:-mb-16 lg:mb-0"
          >
            {/* Soft Ambient Glow Orb Behind Character (Desktop Only) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block w-[460px] h-[460px] bg-[#2ABD00]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Character Image Container */}
            <div className="relative z-20 w-full max-w-[270px] xs:max-w-[300px] sm:max-w-[360px] lg:max-w-[520px] xl:max-w-[580px] flex items-center justify-center pointer-events-auto">
              {/* Mobile Half-Body Character Image pointing down to cards */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/why-qavyx-character-pointing-down.webp"
                alt="Why QAVYX - Character pointing to features"
                className="block lg:hidden h-auto w-full object-contain transform translate-y-3 hover:scale-[1.03] transition-transform duration-500"
              />

              {/* Desktop Full-Body Standing Character Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/why-qavyx-character.webp"
                alt="Why QAVYX - Professional character pointing to features"
                className="hidden lg:block h-auto w-full object-contain drop-shadow-[0_0_55px_rgba(42,189,0,0.6)] transform hover:scale-[1.04] transition-transform duration-500"
              />
            </div>
          </div>

          {/* Right Column: 2-Column Grid of 6 Cards (Responsive 2-cols on mobile, click/hover reveals details) */}
          <div className="lg:col-span-8">
            <dl className="grid gap-2.5 xs:gap-3 sm:gap-4.5 grid-cols-2 sm:grid-cols-2">
              {WHY_QAVYX.map((reason, index) => {
                const bgMap: Record<number, string> = {
                  0: '/why-qavyx-cards/card-bg-01.webp',
                  1: '/why-qavyx-cards/card-bg-02.webp',
                  2: '/why-qavyx-cards/card-bg-03.webp',
                  3: '/why-qavyx-cards/card-bg-04.webp',
                  4: '/why-qavyx-cards/card-bg-05.webp',
                  5: '/why-qavyx-cards/card-bg-06.webp',
                };
                const bgImage = bgMap[index];

                const shortSummaries: Record<number, string> = {
                  0: 'Strategy, design & execution under one roof.',
                  1: 'Deep market expertise across India & GCC.',
                  2: 'Affordable & scalable solutions for startups.',
                  3: 'Focused on leads, sales & long-term growth.',
                  4: 'AI & automation to scale your business faster.',
                  5: 'Build & expand your presence globally.',
                };
                const displayBody = shortSummaries[index] || reason.body;
                const isExpanded = expandedIndex === index;

                return (
                  <div
                    key={reason.id}
                    data-rv
                    style={stagger(index + 2)}
                    onClick={() => toggleCard(index)}
                    className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/15 bg-gradient-to-br from-[#041909]/70 via-[#020b04]/80 to-[#010602]/90 p-2.5 xs:p-3 sm:px-4.5 sm:py-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.18),inset_0_-2px_6px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition-all duration-500 ease-out hover:border-[#2ABD00] hover:shadow-[inset_0_1px_3px_rgba(255,255,255,0.25),inset_0_-2px_6px_rgba(0,0,0,0.9),0_14px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(42,189,0,0.25)] cursor-pointer flex flex-col justify-center min-h-[78px] xs:min-h-[88px] sm:min-h-[135px] lg:min-h-[150px] h-full w-full select-none"
                  >
                    {/* Glassmorphism Frosted Highlight & Top Specular Line */}
                    <div className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-[#2ABD00]/10 opacity-70 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 group-hover:via-[#2ABD00] to-transparent transition-colors duration-500 z-20" />

                    {/* Soft Ambient Green Glow behind Text */}
                    <div className="pointer-events-none absolute -left-4 top-1/2 -translate-y-1/2 w-32 sm:w-40 h-32 sm:h-40 bg-[#2ABD00]/15 rounded-full blur-2xl z-0 transition-opacity duration-300 group-hover:bg-[#2ABD00]/25" />

                    {/* Card Heading Content (Always visible) */}
                    <div className="relative z-20 flex flex-col justify-center h-full w-full pr-1">
                      <div className="flex items-center justify-between w-full">
                        <dt className="qx-display font-bold text-[11px] xs:text-xs sm:text-base lg:text-[1.05rem] text-white group-hover:text-[#2ABD00] transition-colors leading-tight tracking-tight">
                          {reason.label}
                        </dt>
                        {/* Mobile Expand Indicator Icon */}
                        <span className="sm:hidden font-mono text-[9px] text-[#2ABD00] transition-transform duration-300 shrink-0 ml-1">
                          {isExpanded ? '−' : '+'}
                        </span>
                      </div>

                      {/* Card Content Details - Smooth Animated reveal on hover & tap for mobile */}
                      <div
                        className={`transition-all duration-500 ease-in-out overflow-hidden ${
                          isExpanded
                            ? 'max-h-36 opacity-100 mt-1'
                            : 'max-h-0 opacity-0 sm:max-h-36 sm:opacity-100 group-hover:max-h-36 group-hover:opacity-100 group-hover:mt-1'
                        }`}
                      >
                        <dd className="text-[9.5px] xs:text-[10.5px] sm:text-[0.82rem] text-[#c4dbc8] leading-tight sm:leading-snug font-sans">
                          {displayBody}
                        </dd>
                      </div>
                      <span className="sr-only">{reason.body}</span>
                    </div>

                    {/* Right Background Graphic Image - Blended Seamlessly with Glass Gradient */}
                    {bgImage && (
                      <div className="absolute top-0 right-0 bottom-0 w-[52%] sm:w-[56%] overflow-hidden z-0 flex items-center justify-end rounded-r-xl sm:rounded-r-2xl pointer-events-none opacity-70 sm:opacity-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={bgImage}
                          alt=""
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-110 contrast-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#031307] via-[#031307]/60 to-transparent pointer-events-none z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020b04]/70 via-transparent to-[#020b04]/30 pointer-events-none z-10" />
                      </div>
                    )}
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
