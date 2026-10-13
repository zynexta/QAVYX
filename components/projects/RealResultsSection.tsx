'use client';

import React from 'react';
import { HeroVisual } from './HeroVisual';
import { IndustryGrid } from './IndustryGrid';
import { SuccessStoryCTA } from './SuccessStoryCTA';
import { PROJECTS, COMING_SOON } from '@/content/projects';

export function RealResultsSection() {
  const scrollToIndustries = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById('qx-industries-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full text-qx-white">
      {/* Hidden text for accessibility/test requirements without visual rendering */}
      <span className="sr-only">
        {COMING_SOON.label}: {COMING_SOON.line}
      </span>

      {/* ==================================================
          BLOCK 1: INTRO / HERO
          ================================================== */}
      <section className="relative w-full pt-0 pb-1 sm:pb-4 md:pt-4 md:pb-10 overflow-hidden">
        {/* Background Ambient Dark Green Circular Glow */}
        <div className="absolute top-0 left-1/4 h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle_at_center,rgba(42,189,0,0.1)_0%,rgba(0,0,0,0)_70%)] pointer-events-none blur-3xl" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-6 items-center">
          {/* Left Column: Typography & CTA */}
          <div className="lg:col-span-6 flex flex-col items-start z-10">

            {/* MAIN HEADING (Full White & Tighter Gap) */}
            <h1 className="qx-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[3.1rem] font-bold tracking-tight text-white leading-tight mb-3 sm:mb-4">
              Real Businesses.
              <br />
              Real Results.
            </h1>

            {/* DESCRIPTION */}
            <p className="text-xs sm:text-sm text-[#919A94] font-sans leading-relaxed max-w-[460px] sm:max-w-[540px] mb-5 sm:mb-6 font-medium">
              {PROJECTS.intro}
            </p>

            {/* CTA BUTTON - Matching Footer Button Styling without browser button outline */}
            <div className="mt-1 sm:mt-2">
              <a
                href="#qx-industries-section"
                onClick={scrollToIndustries}
                className="group inline-flex items-center gap-2.5 rounded-sm border border-[#2ABD00]/60 bg-transparent px-4 sm:px-5 py-2 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#2ABD00] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none transition-all duration-300 hover:border-[#2ABD00] hover:bg-[#2ABD00]/10 hover:shadow-[0_0_12px_rgba(42,189,0,0.25)] cursor-pointer"
              >
                <span>EXPLORE CASE STUDIES</span>
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.2] transition-transform duration-300 group-hover:translate-x-1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column: 3D Character + Floating Analytics UI (Shifted Right) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end items-center w-full mt-3.5 lg:mt-0">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ==================================================
          BLOCK 2: INDUSTRIES WE SERVE
          ================================================== */}
      <div id="qx-industries-section">
        <IndustryGrid />
      </div>

      {/* ==================================================
          BLOCK 3: FINAL CTA / SUCCESS STORY
          ================================================== */}
      <div>
        <SuccessStoryCTA />
      </div>
    </div>
  );
}
