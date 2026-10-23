'use client';

import React from 'react';

/**
 * FaqHeroVisual
 * A high-end, 3D animated dark-emerald glassmorphic visual:
 * - Slanted 3D floating Q & A glass cards with glowing emerald typography and skeletal lines
 * - Sweeping neon orbital ribbon with an intense beam hot-spot flare
 * - Giant subtle "FAQ" watermark typography in the dark background
 * - Staggered smooth floating micro-animations and interactive hover response
 */
export function FaqHeroVisual() {
  return (
    <div className="relative w-full max-w-[420px] sm:max-w-[460px] h-[220px] sm:h-[250px] flex items-center justify-center select-none overflow-visible group">
      {/* 1. Giant Subtle FAQ Typography Watermark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[-5%] -top-3 select-none text-[110px] sm:text-[145px] font-black tracking-tighter text-[#16301c]/20 leading-none font-sans z-0"
      >
        FAQ
      </span>

      {/* 2. Deep Emerald Ambient Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#2abd00]/[0.08] blur-[75px] rounded-full scale-90 z-0"
      />
      {/* Intense Glowing Lens Flare Hotspot under the Answer card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 left-[20%] w-[220px] h-[36px] bg-[#2abd00]/30 blur-[22px] rounded-full z-0 animate-pulse"
      />

      {/* 3. Sweeping Neon Orbital Ribbon (SVG with intense gradient & glow) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
        viewBox="0 0 460 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Main ribbon gradient with super bright neon core */}
          <linearGradient id="neonRibbonMain" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a7a0e" stopOpacity="0" />
            <stop offset="25%" stopColor="#2abd00" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#2abd00" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#86ff66" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#2abd00" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1a7a0e" stopOpacity="0" />
          </linearGradient>

          {/* Intense flare highlight gradient */}
          <linearGradient id="hotspotFlare" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2abd00" stopOpacity="0.1" />
            <stop offset="40%" stopColor="#2abd00" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#d2ffbb" stopOpacity="1" />
            <stop offset="70%" stopColor="#2abd00" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1a7a0e" stopOpacity="0" />
          </linearGradient>

          <filter id="ribbonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="14" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer subtle orbital loop */}
        <path
          d="M 40 160 C 10 90, 80 40, 220 50 C 360 60, 440 100, 430 180 C 420 230, 280 245, 120 220"
          stroke="url(#neonRibbonMain)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity="0.4"
        />

        {/* Primary sweeping neon ribbon */}
        <path
          d="M 30 150 C 20 80, 110 35, 260 55 C 380 70, 440 130, 400 195 C 360 235, 230 240, 90 205"
          stroke="url(#neonRibbonMain)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#ribbonGlow)"
        />

        {/* Intense focused hotspot beam across the bottom curve */}
        <path
          d="M 110 208 C 170 225, 270 238, 370 205"
          stroke="url(#hotspotFlare)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#ribbonGlow)"
          className="animate-pulse"
        />
      </svg>

      {/* 4. 3D Perspectival Stage Container */}
      <div
        className="relative w-full h-full flex items-center justify-center z-10 transition-transform duration-700 group-hover:scale-[1.03]"
        style={{
          perspective: '1000px',
        }}
      >
        {/* Card 1: Question Card ("?") */}
        <div
          className="absolute top-2 sm:top-3 left-4 sm:left-6 w-[205px] xs:w-[220px] sm:w-[235px] h-[92px] sm:h-[100px] rounded-2xl border border-[#2abd00]/40 bg-gradient-to-br from-[#0e2414]/90 via-[#07130a]/92 to-[#030805]/96 backdrop-blur-xl p-3.5 sm:p-4 shadow-[inset_0_1px_1px_rgba(42,189,0,0.45),0_18px_38px_rgba(0,0,0,0.85),0_0_22px_rgba(42,189,0,0.12)] flex items-center gap-3.5 transition-all duration-500 z-10 hover:border-[#2abd00]/70"
          style={{
            transform: 'rotateX(14deg) rotateY(-18deg) rotateZ(2deg)',
            animation: 'faqFloatTop 6s ease-in-out infinite',
          }}
        >
          {/* Subtle top inner rim highlight */}
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#2abd00]/60 to-transparent pointer-events-none" />

          {/* Glowing Green Question Mark */}
          <div className="shrink-0 flex items-center justify-center w-11 h-11">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#2abd00] leading-none drop-shadow-[0_0_12px_rgba(42,189,0,0.85)] font-sans">
              ?
            </span>
          </div>

          {/* Question Skeleton Bars */}
          <div className="flex-1 flex flex-col gap-2 min-w-0 pr-1">
            <div className="h-2 sm:h-2.5 w-[90%] bg-[#1c3a25] rounded-full shadow-[0_0_6px_rgba(42,189,0,0.15)]" />
            <div className="h-2 sm:h-2.5 w-[70%] bg-[#142c1c] rounded-full" />
            <div className="h-2 sm:h-2.5 w-[45%] bg-[#0e2014] rounded-full" />
          </div>
        </div>

        {/* Card 2: Answer Card ("A") - Overlapping in front */}
        <div
          className="absolute bottom-3 sm:bottom-4 right-4 sm:right-8 w-[210px] xs:w-[225px] sm:w-[240px] h-[92px] sm:h-[100px] rounded-2xl border border-[#2abd00]/50 bg-gradient-to-br from-[#122e1a]/92 via-[#09180e]/94 to-[#030906]/98 backdrop-blur-xl p-3.5 sm:p-4 shadow-[inset_0_1px_1px_rgba(42,189,0,0.6),0_22px_45px_rgba(0,0,0,0.92),0_0_28px_rgba(42,189,0,0.18)] flex items-center gap-3.5 transition-all duration-500 z-20 hover:border-[#2abd00]"
          style={{
            transform: 'rotateX(14deg) rotateY(-18deg) rotateZ(2deg)',
            animation: 'faqFloatBottom 6s ease-in-out infinite 1.5s',
          }}
        >
          {/* Subtle top inner rim highlight */}
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#2abd00]/70 to-transparent pointer-events-none" />

          {/* Glowing Green Answer Letter "A" */}
          <div className="shrink-0 flex items-center justify-center w-11 h-11">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#2abd00] leading-none drop-shadow-[0_0_14px_rgba(42,189,0,0.9)] font-sans">
              A
            </span>
          </div>

          {/* Answer Skeleton Bars */}
          <div className="flex-1 flex flex-col gap-2 min-w-0 pr-1">
            <div className="h-2 sm:h-2.5 w-[75%] bg-[#1e4428] rounded-full shadow-[0_0_6px_rgba(42,189,0,0.2)]" />
            <div className="h-2 sm:h-2.5 w-[95%] bg-[#16331e] rounded-full" />
            <div className="h-2 sm:h-2.5 w-[55%] bg-[#0f2415] rounded-full" />
          </div>
        </div>
      </div>

      {/* Embedded CSS Animations for Floating 3D Cards */}
      <style jsx>{`
        @keyframes faqFloatTop {
          0%, 100% {
            transform: rotateX(14deg) rotateY(-18deg) rotateZ(2deg) translateY(0px);
          }
          50% {
            transform: rotateX(12deg) rotateY(-16deg) rotateZ(1deg) translateY(-8px);
          }
        }
        @keyframes faqFloatBottom {
          0%, 100% {
            transform: rotateX(14deg) rotateY(-18deg) rotateZ(2deg) translateY(0px);
          }
          50% {
            transform: rotateX(16deg) rotateY(-20deg) rotateZ(3deg) translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
