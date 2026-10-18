'use client';

import React from 'react';
import { reveal } from '@/lib/reveal';

interface PillItem {
  icon: string;
  label: string;
}

interface CardItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  staggerIdx: number;
  pills: readonly PillItem[];
}

const CARDS: readonly [CardItem, CardItem, CardItem, CardItem] = [
  {
    id: '01',
    badge: '01',
    title: 'STRATEGY',
    subtitle: 'Clear direction. Smarter decisions.',
    image: '/strategy-target-prop.webp',
    alt: '01 Strategy Target Bullseye Prop',
    staggerIdx: 1,
    pills: [
      { icon: 'barChart', label: 'Market Insights' },
      { icon: 'users', label: 'Audience Analysis' },
      { icon: 'trendingUp', label: 'Growth Plan' },
    ],
  },
  {
    id: '02',
    badge: '02',
    title: 'EXECUTION',
    subtitle: 'Turn plans into real results.',
    image: '/execution-laptop-prop.webp',
    alt: '02 Execution Laptop Dashboard Prop',
    staggerIdx: 2,
    pills: [
      { icon: 'zap', label: 'Agile Workflow' },
      { icon: 'gauge', label: 'High Performance' },
      { icon: 'checkCircle', label: 'Seamless Delivery' },
    ],
  },
  {
    id: '03',
    badge: '03',
    title: 'AUTOMATION',
    subtitle: 'Work smarter. Scale faster.',
    image: '/automation-robot-prop.webp',
    alt: '03 Automation AI Robot Prop',
    staggerIdx: 3,
    pills: [
      { icon: 'cpu', label: 'AI Workflows' },
      { icon: 'sparkles', label: 'Smart Triggers' },
      { icon: 'clock', label: 'Time Savings' },
    ],
  },
  {
    id: '04',
    badge: '04',
    title: 'GROWTH',
    subtitle: 'Built for long-term impact.',
    image: '/growth-chart-prop.webp',
    alt: '04 Growth 3D Bar Chart Prop',
    staggerIdx: 4,
    pills: [
      { icon: 'dollarSign', label: 'Revenue Scaling' },
      { icon: 'globe', label: 'Brand Expansion' },
      { icon: 'shieldCheck', label: 'Long-term ROI' },
    ],
  },
] as const;

function PillIcon({ name }: { name: string }) {
  switch (name) {
    case 'barChart':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'users':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'trendingUp':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case 'zap':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'gauge':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 14l3-3" />
          <path d="M3.34 19a10 10 0 1 1 17.32 0" />
        </svg>
      );
    case 'checkCircle':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'cpu':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" />
          <line x1="20" y1="15" x2="23" y2="15" />
          <line x1="1" y1="9" x2="4" y2="9" />
          <line x1="1" y1="15" x2="4" y2="15" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      );
    case 'clock':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'dollarSign':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case 'globe':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case 'shieldCheck':
      return (
        <svg className="w-3.5 h-3.5 text-[#2ABD00] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

export function SolutionSection() {
  const card1 = CARDS[0];
  const card2 = CARDS[1];
  const card3 = CARDS[2];
  const card4 = CARDS[3];

  return (
    <section
      id="the-solution"
      aria-labelledby="qx-solution-heading"
      {...reveal}
      className="relative pt-4 pb-2 sm:pt-6 sm:pb-3 lg:pt-8 lg:pb-4 bg-[#020603] overflow-visible md:overflow-hidden"
    >
      {/* Subtle Ambient Radial Glow Centered Behind Character */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(42,189,0,0.08)_0%,rgba(2,6,3,0)_70%)] pointer-events-none blur-3xl" />

      {/* Main Container */}
      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">

        {/* Header Section with Responsive Non-clipping Heading */}
        <div className="qx-solution-header text-center mb-4 lg:mb-6 mt-2 sm:mt-4 lg:mt-6 px-2 max-w-full overflow-hidden">
          <h2
            id="qx-solution-heading"
            className="qx-display text-[19px] xs:text-[25px] sm:text-[31px] lg:text-[2.3rem] font-bold tracking-tight text-white leading-tight break-words max-w-full"
          >
            <span className="inline-block sm:inline">One Partner.&nbsp;</span>
            <span className="inline-block text-[#2ABD00]">
              Complete Growth.
            </span>
          </h2>
          <div className="w-12 sm:w-16 h-[2px] bg-[#2ABD00] rounded-full mx-auto mt-3.5" />
        </div>

        {/* Desktop & Tablet 3-Column Balanced 3D Perspective Composition */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 lg:gap-8 items-center relative -mt-6 sm:-mt-10 lg:-mt-16 xl:-mt-20 md:-mb-[110px] lg:-mb-[160px] xl:-mb-[200px]">

          {/* LEFT COLUMN: Horizontal Cards 01 (Top-Left) & 03 (Bottom-Left) */}
          <div className="md:col-span-5 flex flex-col gap-4 lg:gap-6 z-10 max-w-[440px] lg:max-w-[500px] xl:max-w-[540px] mx-auto w-full -mt-6 lg:-mt-12 xl:-mt-16">
            {/* Card 01: Strategy */}
            <div className="qx-solution-card-wrapper qx-solution-card-left qx-solution-card-1 w-full">
              <div
                className="relative group overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-br from-[#041607] via-[#020b04] to-[#010602] p-4 lg:p-5 backdrop-blur-xl md:[transform:perspective(1000px)_rotateY(10deg)] lg:[transform:perspective(1000px)_rotateY(14deg)] hover:[transform:perspective(1000px)_rotateY(0deg)_scale(1.02)] transition-all duration-500 ease-out hover:border-[#2ABD00] shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.9),0_12px_35px_rgba(0,0,0,0.85)] hover:shadow-[inset_0_1px_3px_rgba(255,255,255,0.2),inset_0_-2px_6px_rgba(0,0,0,0.9),0_14px_35px_rgba(0,0,0,0.9),0_0_15px_rgba(42,189,0,0.2)] cursor-pointer h-[225px] lg:h-[240px] w-full flex flex-row items-center justify-between"
              >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 group-hover:via-[#2ABD00]/60 to-transparent z-10 transition-colors duration-500" />
              <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-36 h-36 bg-[#2ABD00]/10 rounded-full blur-xl group-hover:bg-[#2ABD00]/20 transition-all duration-500" />

              <div className="relative z-10 flex flex-col justify-center h-full max-w-[56%] lg:max-w-[58%] pr-2">

                <h3 className="qx-display font-extrabold text-base lg:text-lg text-white group-hover:text-[#2ABD00] transition-colors leading-tight tracking-tight mb-0.5">
                  STRATEGY
                </h3>

                <p className="text-[11px] lg:text-xs text-qx-grey/85 leading-snug font-sans mb-2">
                  Clear direction. Smarter decisions.
                </p>

                <div className="flex flex-col gap-1 w-full">
                  {card1.pills.map((pill, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#2ABD00]/30 bg-[#06240e]/80 backdrop-blur-md hover:border-[#2ABD00]/70 hover:bg-[#083013] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)] w-fit">
                      <PillIcon name={pill.icon} />
                      <span className="text-[10px] lg:text-[11px] font-medium text-white tracking-wide">{pill.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 h-full w-[44%] lg:w-[42%] flex items-end justify-center p-0 pb-1 overflow-visible">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(42,189,0,0.35)_0%,transparent_75%)] blur-md opacity-90" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card1.image}
                  alt={card1.alt}
                  className="max-h-[250px] md:max-h-[275px] lg:max-h-[300px] max-w-full object-contain scale-[1.95] lg:scale-[2.10] translate-y-3 lg:translate-y-4 mix-blend-screen filter drop-shadow-[0_0_25px_rgba(42,189,0,0.85)] brightness-110 transition-transform duration-500 group-hover:scale-[2.15] group-hover:translate-y-2"
                />
              </div>
            </div>
          </div>

          {/* Card 03: Automation */}
            <div className="qx-solution-card-wrapper qx-solution-card-left qx-solution-card-3 w-full">
              <div
                className="relative group overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-br from-[#041607] via-[#020b04] to-[#010602] p-4 lg:p-5 backdrop-blur-xl md:[transform:perspective(1000px)_rotateY(10deg)] lg:[transform:perspective(1000px)_rotateY(14deg)] hover:[transform:perspective(1000px)_rotateY(0deg)_scale(1.02)] transition-all duration-500 ease-out hover:border-[#2ABD00] shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.9),0_12px_35px_rgba(0,0,0,0.85)] hover:shadow-[inset_0_1px_3px_rgba(255,255,255,0.2),inset_0_-2px_6px_rgba(0,0,0,0.9),0_14px_35px_rgba(0,0,0,0.9),0_0_15px_rgba(42,189,0,0.2)] cursor-pointer h-[225px] lg:h-[240px] w-full flex flex-row items-center justify-between"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 group-hover:via-[#2ABD00]/60 to-transparent z-10 transition-colors duration-500" />
                <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-36 h-36 bg-[#2ABD00]/10 rounded-full blur-xl group-hover:bg-[#2ABD00]/20 transition-all duration-500" />

                <div className="relative z-10 flex flex-col justify-center h-full max-w-[56%] lg:max-w-[58%] pr-2">

                  <h3 className="qx-display font-extrabold text-base lg:text-lg text-white group-hover:text-[#2ABD00] transition-colors leading-tight tracking-tight mb-0.5">
                    AUTOMATION
                  </h3>

                  <p className="text-[11px] lg:text-xs text-qx-grey/85 leading-snug font-sans mb-2">
                    Work smarter. Scale faster.
                  </p>

                  <div className="flex flex-col gap-1 w-full">
                    {card3.pills.map((pill, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#2ABD00]/30 bg-[#06240e]/80 backdrop-blur-md hover:border-[#2ABD00]/70 hover:bg-[#083013] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)] w-fit">
                        <PillIcon name={pill.icon} />
                        <span className="text-[10px] lg:text-[11px] font-medium text-white tracking-wide">{pill.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 h-full w-[44%] lg:w-[42%] flex items-end justify-center p-0 pb-1 overflow-visible">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(42,189,0,0.35)_0%,transparent_75%)] blur-md opacity-90" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card3.image}
                    alt={card3.alt}
                    className="max-h-[250px] md:max-h-[275px] lg:max-h-[300px] max-w-full object-contain scale-[1.95] lg:scale-[2.10] translate-y-3 lg:translate-y-4 mix-blend-screen filter drop-shadow-[0_0_25px_rgba(42,189,0,0.85)] brightness-110 transition-transform duration-500 group-hover:scale-[2.15] group-hover:translate-y-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Prominent Large Central Character Standing in Front */}
          <div
            className="qx-solution-char-wrapper md:col-span-2 flex relative flex-col items-center justify-center z-30 pointer-events-none md:-mx-4 lg:-mx-6"
          >
            <div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-44 h-44 lg:w-64 lg:h-64 bg-[#2ABD00]/60 rounded-full blur-3xl pointer-events-none animate-pulse" />

            <div
              className="relative z-30 w-full flex items-center justify-center pointer-events-auto"
              style={{ transform: 'translateY(230px)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/solution-character-full.webp"
                alt="QAVYX Growth Solution Hero Standing Character"
                className="h-[750px] sm:h-[850px] lg:h-[980px] xl:h-[1100px] scale-[1.50] lg:scale-[1.55] origin-bottom w-auto object-contain filter drop-shadow-[0_0_90px_rgba(42,189,0,0.95)]"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Horizontal Cards 02 (Top-Right) & 04 (Bottom-Right) */}
          <div className="md:col-span-5 flex flex-col gap-4 lg:gap-6 z-10 max-w-[440px] lg:max-w-[500px] xl:max-w-[540px] mx-auto w-full -mt-6 lg:-mt-12 xl:-mt-16">
            {/* Card 02: Execution */}
            <div className="qx-solution-card-wrapper qx-solution-card-right qx-solution-card-2 w-full">
              <div
                className="relative group overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-br from-[#041607] via-[#020b04] to-[#010602] p-4 lg:p-5 backdrop-blur-xl md:[transform:perspective(1000px)_rotateY(-10deg)] lg:[transform:perspective(1000px)_rotateY(-14deg)] hover:[transform:perspective(1000px)_rotateY(0deg)_scale(1.02)] transition-all duration-500 ease-out hover:border-[#2ABD00] shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.9),0_12px_35px_rgba(0,0,0,0.85)] hover:shadow-[inset_0_1px_3px_rgba(255,255,255,0.2),inset_0_-2px_6px_rgba(0,0,0,0.9),0_14px_35px_rgba(0,0,0,0.9),0_0_15px_rgba(42,189,0,0.2)] cursor-pointer h-[225px] lg:h-[240px] w-full flex flex-row items-center justify-between"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 group-hover:via-[#2ABD00]/60 to-transparent z-10 transition-colors duration-500" />
                <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-36 h-36 bg-[#2ABD00]/10 rounded-full blur-xl group-hover:bg-[#2ABD00]/20 transition-all duration-500" />

                <div className="relative z-10 flex flex-col justify-center h-full max-w-[56%] lg:max-w-[58%] pr-2">

                  <h3 className="qx-display font-extrabold text-base lg:text-lg text-white group-hover:text-[#2ABD00] transition-colors leading-tight tracking-tight mb-0.5">
                    EXECUTION
                  </h3>

                  <p className="text-[11px] lg:text-xs text-qx-grey/85 leading-snug font-sans mb-2">
                    Turn plans into real results.
                  </p>

                  <div className="flex flex-col gap-1 w-full">
                    {card2.pills.map((pill, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#2ABD00]/30 bg-[#06240e]/80 backdrop-blur-md hover:border-[#2ABD00]/70 hover:bg-[#083013] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)] w-fit">
                        <PillIcon name={pill.icon} />
                        <span className="text-[10px] lg:text-[11px] font-medium text-white tracking-wide">{pill.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 h-full w-[44%] lg:w-[42%] flex items-end justify-center p-0 pb-1 overflow-visible">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(42,189,0,0.35)_0%,transparent_75%)] blur-md opacity-90" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card2.image}
                    alt={card2.alt}
                    className="max-h-[250px] md:max-h-[275px] lg:max-h-[300px] max-w-full object-contain scale-[1.95] lg:scale-[2.10] translate-y-3 lg:translate-y-4 mix-blend-screen filter drop-shadow-[0_0_25px_rgba(42,189,0,0.85)] brightness-110 transition-transform duration-500 group-hover:scale-[2.15] group-hover:translate-y-2"
                  />
                </div>
              </div>
            </div>

            {/* Card 04: Growth */}
            <div className="qx-solution-card-wrapper qx-solution-card-right qx-solution-card-4 w-full">
              <div
                className="relative group overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-br from-[#041607] via-[#020b04] to-[#010602] p-4 lg:p-5 backdrop-blur-xl md:[transform:perspective(1000px)_rotateY(-10deg)] lg:[transform:perspective(1000px)_rotateY(-14deg)] hover:[transform:perspective(1000px)_rotateY(0deg)_scale(1.02)] transition-all duration-500 ease-out hover:border-[#2ABD00] shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.9),0_12px_35px_rgba(0,0,0,0.85)] hover:shadow-[inset_0_1px_3px_rgba(255,255,255,0.2),inset_0_-2px_6px_rgba(0,0,0,0.9),0_14px_35px_rgba(0,0,0,0.9),0_0_15px_rgba(42,189,0,0.2)] cursor-pointer h-[225px] lg:h-[240px] w-full flex flex-row items-center justify-between"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 group-hover:via-[#2ABD00]/60 to-transparent z-10 transition-colors duration-500" />
                <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-36 h-36 bg-[#2ABD00]/10 rounded-full blur-xl group-hover:bg-[#2ABD00]/20 transition-all duration-500" />

                <div className="relative z-10 flex flex-col justify-center h-full max-w-[56%] lg:max-w-[58%] pr-2">

                  <h3 className="qx-display font-extrabold text-base lg:text-lg text-white group-hover:text-[#2ABD00] transition-colors leading-tight tracking-tight mb-0.5">
                    GROWTH
                  </h3>

                  <p className="text-[11px] lg:text-xs text-qx-grey/85 leading-snug font-sans mb-2">
                    Built for long-term impact.
                  </p>

                  <div className="flex flex-col gap-1 w-full">
                    {card4.pills.map((pill, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#2ABD00]/30 bg-[#06240e]/80 backdrop-blur-md hover:border-[#2ABD00]/70 hover:bg-[#083013] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)] w-fit">
                        <PillIcon name={pill.icon} />
                        <span className="text-[10px] lg:text-[11px] font-medium text-white tracking-wide">{pill.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 h-full w-[44%] lg:w-[42%] flex items-end justify-center p-0 pb-1 overflow-visible">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(42,189,0,0.35)_0%,transparent_75%)] blur-md opacity-90" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card4.image}
                    alt={card4.alt}
                    className="max-h-[250px] md:max-h-[275px] lg:max-h-[300px] max-w-full object-contain scale-[1.95] lg:scale-[2.10] translate-y-3 lg:translate-y-4 mix-blend-screen filter drop-shadow-[0_0_25px_rgba(42,189,0,0.85)] brightness-110 transition-transform duration-500 group-hover:scale-[2.15] group-hover:translate-y-2"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* MOBILE & RESPONSIVE LAYOUT (< md): Sticky Overlay Stacked Deck Cards Animation */}
        <div className="flex md:hidden flex-col w-full relative z-10 max-w-[520px] mx-auto pt-1 pb-8 sm:pb-10">
          {/* Mobile Character Hero Avatar */}
          <div className="qx-solution-mobile-char flex relative flex-col items-center justify-center pt-1 pb-0 z-20 -mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/solution-character-half.webp"
              alt="QAVYX Growth Solution Hero Character"
              className="h-[270px] xs:h-[300px] sm:h-[330px] w-auto object-contain relative z-10"
            />
          </div>

          {/* Sticky Card Overlay Deck */}
          <div className="relative flex flex-col w-full space-y-4">
            {CARDS.map((card, idx) => {
              // Calculate stacked offset for sticky scroll overlay effect
              const stickyTopPx = 64 + idx * 24; // 64px, 88px, 112px, 136px
              const zIndexVal = (idx + 1) * 10;
              const shadowDepths = [
                'shadow-[0_-6px_20px_rgba(0,0,0,0.85),0_12px_30px_rgba(0,0,0,0.9),0_0_25px_rgba(42,189,0,0.35)]',
                'shadow-[0_-8px_25px_rgba(0,0,0,0.9),0_14px_35px_rgba(0,0,0,0.95),0_0_30px_rgba(42,189,0,0.4)]',
                'shadow-[0_-10px_30px_rgba(0,0,0,0.95),0_16px_40px_rgba(0,0,0,0.98),0_0_35px_rgba(42,189,0,0.45)]',
                'shadow-[0_-12px_35px_rgba(0,0,0,1),0_18px_45px_rgba(0,0,0,1),0_0_40px_rgba(82,224,36,0.5)]',
              ];

              return (
                <div
                  key={card.id}
                  style={{
                    top: `${stickyTopPx}px`,
                    zIndex: zIndexVal,
                  }}
                  className={`qx-solution-card-wrapper qx-solution-card-mobile qx-solution-card-${idx + 1} sticky overflow-hidden rounded-[18px] sm:rounded-[22px] border border-white/15 hover:border-[#2ABD00] bg-gradient-to-br from-[#051d09] via-[#020d04] to-[#010602] p-3 sm:p-4 backdrop-blur-2xl transition-all duration-300 h-[160px] xs:h-[175px] sm:h-[200px] w-full flex flex-row items-center justify-between group cursor-pointer ${shadowDepths[idx]} active:scale-[0.99]`}
                >
                  {/* Top Glass Animated Glow Light Line */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/25 group-hover:via-[#2ABD00] to-transparent z-10 transition-colors duration-300 drop-shadow-[0_0_10px_rgba(42,189,0,0.95)]" />

                  {/* Ambient Green Glow Background inside card */}
                  <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-36 h-36 bg-[#2ABD00]/25 rounded-full blur-xl group-hover:bg-[#2ABD00]/40 transition-all duration-300" />

                  {/* Left Text Content & Pills */}
                  <div className="relative z-10 flex flex-col justify-between h-full py-0.5 max-w-[60%] sm:max-w-[62%] pr-1.5 shrink-0">
                    <div>

                      <h3 className="qx-display font-extrabold text-sm xs:text-base sm:text-lg text-white leading-tight tracking-tight group-hover:text-[#2ABD00] transition-colors">
                        {card.title}
                      </h3>

                      <p className="text-[9.5px] xs:text-[10.5px] sm:text-xs text-qx-grey/85 leading-tight font-sans mt-0.5">
                        {card.subtitle}
                      </p>
                    </div>

                    {/* Equal Pill List */}
                    <div className="flex flex-col gap-0.5 xs:gap-1 w-full mt-1">
                      {card.pills.map((pill, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex items-center gap-1 px-1.5 py-0.2 rounded-full border border-[#2ABD00]/35 bg-[#06260f]/90 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.5)] w-fit group-hover:border-[#2ABD00]/75 transition-colors"
                        >
                          <PillIcon name={pill.icon} />
                          <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10.5px] font-medium text-white tracking-wide whitespace-nowrap">
                            {pill.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Prop Image - Properly Scaled for Mobile with Zero Overlap */}
                  <div className="relative z-10 h-full w-[40%] sm:w-[38%] flex items-end justify-center p-0 pb-1 overflow-visible">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(42,189,0,0.30)_0%,transparent_75%)] blur-md opacity-80" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image}
                      alt={card.alt}
                      className="max-h-[110px] xs:max-h-[125px] sm:max-h-[145px] max-w-full object-contain scale-[1.15] sm:scale-[1.25] translate-y-1 mix-blend-screen filter drop-shadow-[0_0_20px_rgba(42,189,0,0.75)] brightness-110 transition-transform duration-300 group-hover:scale-[1.30] group-hover:translate-y-0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
