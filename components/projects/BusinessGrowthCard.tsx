'use client';

import React from 'react';

interface BusinessGrowthCardProps {
  className?: string;
}

export function BusinessGrowthCard({ className = '' }: BusinessGrowthCardProps) {
  return (
    <div
      className={`relative z-10 w-56 sm:w-64 rounded-xl border border-qx-green/30 bg-qx-ink/90 p-4 backdrop-blur-xl shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(42,189,0,0.15)] transition-all duration-300 hover:scale-105 hover:border-qx-green/50 hover:shadow-[0_12px_30px_rgba(0,0,0,0.7),0_0_25px_rgba(42,189,0,0.25)] ${className}`}
    >
      {/* Top row: Label & Upward Badge */}
      <div className="flex items-center justify-between">
        <span className="text-2xs font-mono font-semibold uppercase tracking-wider text-qx-grey">
          Business Growth
        </span>
        <div className="flex items-center gap-1 rounded-full border border-qx-green/40 bg-qx-green/15 px-2 py-0.5 text-2xs font-bold text-qx-green">
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span>+230%</span>
        </div>
      </div>

      {/* Main Metric */}
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-qx-green drop-shadow-[0_0_10px_rgba(42,189,0,0.35)]">
          +230%
        </span>
      </div>

      {/* Ascending Bar Chart */}
      <div className="mt-3 flex h-10 items-end justify-between gap-1.5 border-t border-qx-line pt-2">
        {[
          { height: '35%', opacity: '0.4' },
          { height: '50%', opacity: '0.55' },
          { height: '65%', opacity: '0.7' },
          { height: '80%', opacity: '0.85' },
          { height: '100%', opacity: '1.0' },
        ].map((bar, i) => (
          <div
            key={i}
            className="w-full rounded-t-sm bg-qx-green transition-all duration-300 hover:brightness-125"
            style={{
              height: bar.height,
              opacity: bar.opacity,
              boxShadow: '0 0 6px rgba(42, 189, 0, 0.4)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
