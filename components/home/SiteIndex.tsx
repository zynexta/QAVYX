'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { reveal, stagger } from '@/lib/reveal';

interface PillarItem {
  number: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: string;
  rotation: string;
  translateX: string;
}

const PILLARS: readonly PillarItem[] = [
  {
    number: '01',
    id: 'growth-marketing',
    title: 'Growth Marketing',
    subtitle: 'Strategy, campaigns and performance.',
    href: '/growth-marketing',
    icon: 'barChart',
    rotation: 'lg:rotate-[-2deg]',
    translateX: 'lg:translate-x-[20px]',
  },
  {
    number: '02',
    id: 'social-content',
    title: 'Social & Content',
    subtitle: 'Content that builds attention and trust.',
    href: '/social-content',
    icon: 'fileText',
    rotation: 'lg:rotate-[1.5deg]',
    translateX: 'lg:translate-x-[-6px]',
  },
  {
    number: '03',
    id: 'ai-automation',
    title: 'AI & Automation',
    subtitle: 'Work smarter with AI-powered systems.',
    href: '/ai-automation',
    icon: 'robot',
    rotation: 'lg:rotate-[-1.2deg]',
    translateX: 'lg:translate-x-[14px]',
  },
  {
    number: '04',
    id: 'build-scale',
    title: 'Build & Scale',
    subtitle: 'Turn ideas into real products.',
    href: '/build-scale',
    icon: 'box',
    rotation: 'lg:rotate-[1.2deg]',
    translateX: 'lg:translate-x-[22px]',
  },
  {
    number: '05',
    id: 'launch',
    title: 'Launch',
    subtitle: 'Go live and reach your audience.',
    href: '/launch',
    icon: 'target',
    rotation: 'lg:rotate-[-1.5deg]',
    translateX: 'lg:translate-x-[16px]',
  },
  {
    number: '06',
    id: 'launchpad',
    title: 'Launchpad',
    subtitle: 'Jumpstart your digital product growth.',
    href: '/launchpad',
    icon: 'rocket',
    rotation: 'lg:rotate-[1deg]',
    translateX: 'lg:translate-x-[10px]',
  },
];

function PillarIcon({ icon, active }: { icon: string; active: boolean }) {
  const strokeColor = active ? '#2ABD00' : 'currentColor';
  
  switch (icon) {
    case 'barChart':
      return (
        <svg className="w-[19px] h-[19px] sm:w-[20px] sm:h-[20px]" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
          <polyline points="4 6 10 2 15 7 21 2" />
        </svg>
      );
    case 'fileText':
      return (
        <svg className="w-[19px] h-[19px] sm:w-[20px] sm:h-[20px]" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );
    case 'robot':
      return (
        <svg className="w-[19px] h-[19px] sm:w-[20px] sm:h-[20px]" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="3" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="15" x2="8" y2="17" />
          <line x1="16" y1="15" x2="16" y2="17" />
          <circle cx="9" cy="15" r="1.2" fill={strokeColor} />
          <circle cx="15" cy="15" r="1.2" fill={strokeColor} />
        </svg>
      );
    case 'box':
      return (
        <svg className="w-[19px] h-[19px] sm:w-[20px] sm:h-[20px]" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'target':
      return (
        <svg className="w-[19px] h-[19px] sm:w-[20px] sm:h-[20px]" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case 'rocket':
      return (
        <svg className="w-[19px] h-[19px] sm:w-[20px] sm:h-[20px]" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71.19-1.81-.47-2.47l-1.06-1.06c-.66-.66-1.76-1.18-2.47-.47z" />
          <path d="M12 15l-3-3 7.5-7.5c1.38-1.38 3.55-1.18 4.66.27 1.09 1.43 1.13 3.42-.14 4.86L12 15z" />
          <path d="M9 18l-1.5 1.5" />
          <path d="M15 12l1.5 1.5" />
        </svg>
      );
    default:
      return null;
  }
}

export function SiteIndex() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <nav
      id="qx-index"
      aria-labelledby="qx-index-heading"
      className="relative overflow-hidden bg-[#020502] px-4 sm:px-6 md:px-10 lg:px-12 pt-8 sm:pt-10 lg:pt-12 pb-10 sm:pb-12 lg:pb-14 text-white select-none"
    >
      <div className="relative mx-auto max-w-[1140px]" {...reveal}>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* ================= LEFT COLUMN: COPY CONTENT ================= */}
          <div className="lg:col-span-6 flex flex-col items-start z-10">
            
            {/* Category Plain Text */}
            <div data-rv className="mb-2.5 sm:mb-3.5">
              <span
                id="qx-index-heading"
                className="font-mono text-[11px] sm:text-xs font-bold tracking-[0.28em] text-[#2ABD00] uppercase"
              >
                WHAT&apos;S INSIDE QAVYX
              </span>
            </div>

            {/* Main Headline */}
            <h2
              data-rv
              style={stagger(1)}
              className="qx-display text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-[3.1rem] font-bold text-white leading-[1.12] tracking-tight mb-3.5 sm:mb-4.5 font-sans"
            >
              Six pillars.
              <br />
              One access point.
              <br />
              Everything a
              <br />
              <span className="text-[#2ABD00]">
                growing brand
              </span>
              <br />
              actually needs.
            </h2>

            {/* Description Copy */}
            <p
              data-rv
              style={stagger(2)}
              className="text-xs sm:text-sm md:text-base leading-relaxed text-[#919A94] font-sans max-w-md mb-3.5 sm:mb-5"
            >
              Strategy, content, automation and growth —
              <br className="hidden sm:inline" />
              all connected in one place.
            </p>

            {/* Sub-label: BUILT FOR MODERN BRANDS */}
            <div
              data-rv
              style={stagger(3)}
              className="flex items-center gap-2.5 mb-[22px] sm:mb-[26px]"
            >
              <div className="h-4 w-[2.5px] rounded-full bg-[#2ABD00] shadow-[0_0_8px_#2ABD00]" />
              <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-[#8E9B92] uppercase">
                BUILT FOR MODERN BRANDS
              </span>
            </div>

            {/* CTA Button - Exact Footer "Chat With Us" Button Model & Styling */}
            <div data-rv style={stagger(4)} className="mb-6 lg:mb-0">
              <Link
                href="/services"
                prefetch={true}
                className="group inline-flex items-center gap-2.5 rounded-sm border border-[#2ABD00]/60 bg-transparent px-4 sm:px-5 py-2 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#2ABD00] transition-all duration-300 hover:border-[#2ABD00] hover:bg-[#2ABD00]/10 hover:shadow-[0_0_12px_rgba(42,189,0,0.3)]"
              >
                <span>EXPLORE FEATURES</span>
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.2] transition-transform duration-300 group-hover:translate-x-1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: CARDS (Slimmer height & Small Square Arrow) ================= */}
          <div className="lg:col-span-6 relative z-10 flex justify-end w-full mt-2 lg:mt-0">
            
            <div className="relative w-full max-w-full lg:max-w-[460px]">
              
              {/* Stacked Slimmer Cards */}
              <div
                className="flex flex-col gap-2 sm:gap-2.5 relative z-10"
                onMouseLeave={() => setActiveId(null)}
              >
                {PILLARS.map((item, idx) => {
                  const isActive = item.id === activeId;

                  return (
                    <div
                      key={item.id}
                      data-rv
                      style={stagger(idx + 1)}
                      onMouseEnter={() => setActiveId(item.id)}
                      onMouseLeave={() => setActiveId(null)}
                      className={`transition-all duration-300 ease-out transform ${item.rotation} ${item.translateX} ${
                        isActive ? 'z-20 scale-[1.012]' : 'z-10 hover:scale-[1.006]'
                      }`}
                    >
                      <Link
                        href={item.href}
                        prefetch={true}
                        onFocus={() => setActiveId(item.id)}
                        onBlur={() => setActiveId(null)}
                        className={`group relative flex items-center justify-between overflow-hidden rounded-xl py-2 sm:py-2.5 px-3 sm:px-4 border transition-all duration-300 ${
                          isActive
                            ? 'border-[#2ABD00] bg-[#041909]/90 shadow-[0_0_14px_rgba(42,189,0,0.25)] backdrop-blur-xl'
                            : 'border-white/15 bg-[#041909]/75 backdrop-blur-xl hover:border-[#2ABD00]/80 hover:bg-[#041909]/90 hover:shadow-[0_0_10px_rgba(42,189,0,0.2)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 pr-2">
                          
                          {/* Compact, Snug Icon Box (proportional to icon, not oversized) */}
                          <div
                            className={`flex h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] items-center justify-center rounded-lg border transition-all duration-300 shrink-0 self-center ${
                              isActive
                                ? 'border-[#2ABD00] bg-[#2ABD00]/15 text-[#2ABD00]'
                                : 'border-white/15 bg-white/[0.04] text-white/80 group-hover:border-[#2ABD00]/60 group-hover:text-[#2ABD00]'
                            }`}
                          >
                            <PillarIcon icon={item.icon} active={isActive} />
                          </div>

                          {/* Card Info */}
                          <div className="flex flex-col min-w-0 justify-center">
                            <span
                              className={`font-mono text-[8.5px] sm:text-[9.5px] font-bold tracking-wider mb-0.5 transition-colors ${
                                isActive ? 'text-[#2ABD00]' : 'text-[#8E9B92]'
                              }`}
                            >
                              {item.number}
                            </span>
                            <h3
                              className={`font-display font-bold text-[12.5px] sm:text-[14px] leading-tight truncate transition-colors ${
                                isActive ? 'text-white' : 'text-white group-hover:text-[#2ABD00]'
                              }`}
                            >
                              {item.title}
                            </h3>
                            <p className="text-[10px] sm:text-[11.5px] text-[#919A94] font-sans leading-tight truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Right Arrow Small Container */}
                        <div
                          className={`flex h-[26px] w-[26px] sm:h-[28px] sm:w-[28px] items-center justify-center rounded-md border transition-all duration-300 shrink-0 self-center ml-2 ${
                            isActive
                              ? 'border-[#2ABD00] bg-[#2ABD00]/20 text-[#2ABD00] shadow-[0_0_8px_rgba(42,189,0,0.35)]'
                              : 'border-white/20 bg-white/5 text-white/70 group-hover:border-[#2ABD00] group-hover:bg-[#2ABD00]/20 group-hover:text-[#2ABD00]'
                          }`}
                        >
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-current fill-none stroke-[2.2]" viewBox="0 0 24 24">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </div>

                      </Link>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>

      </div>
    </nav>
  );
}

