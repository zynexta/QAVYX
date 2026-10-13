'use client';

import React from 'react';
import Image from 'next/image';
import { IndustryCard, INDUSTRY_LIST_DATA } from './IndustryCard';

export function IndustryGrid() {
  return (
    <section className="relative w-full my-6 md:my-10">
      {/* Main Outer Container */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#2ABD00]/40 bg-[#030d05]/95 p-5 sm:p-6 md:p-8 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(42,189,0,0.18)]">
        {/* Dark Mountain Background Silhouette */}
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay">
          <Image
            src="/mountain-bg.webp"
            alt="Mountain Background Silhouette"
            fill
            className="object-cover object-bottom filter contrast-125"
          />
        </div>

        {/* Ambient Subtle Green Glow */}
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(42,189,0,0.12)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 text-2xs font-mono font-bold uppercase tracking-[0.25em] text-qx-green drop-shadow-[0_0_8px_rgba(42,189,0,0.4)]">
              <span className="h-1.5 w-1.5 rounded-full bg-qx-green" />
              INDUSTRIES WE SERVE
            </div>

            {/* Main Heading (Normal Text Size) */}
            <h2 className="mt-1.5 text-base sm:text-lg md:text-xl font-semibold tracking-normal text-qx-white leading-snug">
              We work with businesses across a{' '}
              <span className="text-qx-green drop-shadow-[0_0_8px_rgba(42,189,0,0.3)]">
                wide range of industries,
              </span>{' '}
              <span className="text-xs sm:text-sm text-qx-grey font-normal">including:</span>
            </h2>
          </div>

          {/* Floating Strategic Message Pill */}
          <div className="sm:self-center shrink-0">
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#2ABD00]/40 bg-[#06180a]/90 px-3.5 py-1.5 text-2xs font-mono font-semibold uppercase tracking-wider text-white backdrop-blur-md shadow-[0_0_12px_rgba(42,189,0,0.15)]">
              <svg
                className="h-3 w-3 text-qx-green"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
              <span>Different Industries · Same Growth Mindset</span>
            </div>
          </div>
        </div>

        {/* 3-Column Balanced Industry Grid (Balanced 3x3 layout for 9 items, identical widths & heights) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {INDUSTRY_LIST_DATA.map((item) => (
            <div key={item.id} className="w-full">
              <IndustryCard name={item.name} bgImage={item.bgImage} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
