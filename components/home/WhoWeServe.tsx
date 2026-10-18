'use client';

import React, { useState } from 'react';
import { HOME_COPY, WHO_WE_SERVE } from '@/content/home';
import { reveal } from '@/lib/reveal';
import { NavLogo } from '@/components/nav/NavLogo';
interface IndustryCardData {
  number: string;
  industry: string;
  image: string;
  delayDesktop: string;
}

export function WhoWeServe() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Exact 7 industries matching reference design:
  const cardItems: IndustryCardData[] = [
    {
      number: '01',
      industry: WHO_WE_SERVE[0] || 'Clinics & Healthcare Brands',
      image: '/who-we-serve-cards/serve-01.webp',
      delayDesktop: '0s',
    },
    {
      number: '02',
      industry: WHO_WE_SERVE[1] || 'Restaurants & Hospitality',
      image: '/who-we-serve-cards/serve-02.webp',
      delayDesktop: '-10.00s',
    },
    {
      number: '03',
      industry: WHO_WE_SERVE[2] || 'Educational Institutions',
      image: '/who-we-serve-cards/serve-03.webp',
      delayDesktop: '-20.00s',
    },
    {
      number: '04',
      industry: WHO_WE_SERVE[3] || 'Real Estate Developers',
      image: '/who-we-serve-cards/serve-04.webp',
      delayDesktop: '-30.00s',
    },
    {
      number: '05',
      industry: WHO_WE_SERVE[4] || 'Travel Agencies',
      image: '/who-we-serve-cards/serve-05.webp',
      delayDesktop: '-40.00s',
    },
    {
      number: '06',
      industry: WHO_WE_SERVE[5] || 'Jewellery Showrooms',
      image: '/who-we-serve-cards/serve-06.webp',
      delayDesktop: '-50.00s',
    },
    {
      number: '07',
      industry: WHO_WE_SERVE[6] || 'Local Businesses & Retail Brands',
      image: '/who-we-serve-cards/serve-07.webp',
      delayDesktop: '-60.00s',
    },
  ];

  return (
    <section
      id="qx-serve"
      aria-labelledby="qx-serve-heading"
      onClick={() => setActiveIndex(null)}
      className="mx-auto max-w-[var(--qx-shell)] w-full overflow-hidden px-3 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-16 lg:pb-24 relative select-none scroll-mt-24 sm:scroll-mt-28"
    >
      {/* =========================================================================
          KEYFRAME STYLES: 3D CELESTIAL ORBIT WITH NATURAL MULTI-PLANE Z-ORDER
          ========================================================================= */}
      <style>{`
        /* DESKTOP 3D ELLIPTICAL ORBIT AROUND CENTRAL EARTH:
           - Earth Hub sits at z-index: 20.
           - Front Equatorial Ring sits at z-index: 28 (passes OVER / ACROSS FRONT OF Earth).
           - Back Arc (Y < 0): z-index: 12 (passes BEHIND Earth), scale: 0.88, translateZ: -45px.
           - Front Arc (Y > 0): z-index: 50 (passes OVER / IN FRONT OF Earth & Ring), scale: 1.05, translateZ: +45px.
           - Display: contents on container & list guarantees cards participate directly in stage z-index.
        */
        @keyframes qx-orbit-lg {
          0% {
            transform: translate3d(440px, 0px, 0px) scale(0.97);
            z-index: 12;
            opacity: 0.94;
            filter: brightness(0.98);
          }
          12.5% {
            transform: translate3d(311px, -113px, -30px) scale(0.91);
            z-index: 12;
            opacity: 0.88;
            filter: brightness(0.88);
          }
          25.0% {
            transform: translate3d(0px, -160px, -45px) scale(0.88);
            z-index: 12;
            opacity: 0.84;
            filter: brightness(0.84);
          }
          37.5% {
            transform: translate3d(-311px, -113px, -30px) scale(0.91);
            z-index: 12;
            opacity: 0.88;
            filter: brightness(0.88);
          }
          49.9% {
            transform: translate3d(-440px, -1px, 0px) scale(0.97);
            z-index: 12;
            opacity: 0.95;
            filter: brightness(0.97);
          }
          50.0% {
            transform: translate3d(-440px, 0px, 0px) scale(0.97);
            z-index: 50;
            opacity: 0.96;
            filter: brightness(0.98);
          }
          62.5% {
            transform: translate3d(-311px, 113px, 30px) scale(1.02);
            z-index: 50;
            opacity: 1.0;
            filter: brightness(1.06);
          }
          75.0% {
            transform: translate3d(0px, 160px, 45px) scale(1.05);
            z-index: 50;
            opacity: 1.0;
            filter: brightness(1.10);
          }
          87.5% {
            transform: translate3d(311px, 113px, 30px) scale(1.02);
            z-index: 50;
            opacity: 1.0;
            filter: brightness(1.06);
          }
          99.9% {
            transform: translate3d(440px, 1px, 0px) scale(0.97);
            z-index: 50;
            opacity: 0.95;
            filter: brightness(0.99);
          }
          100% {
            transform: translate3d(440px, 0px, 0px) scale(0.97);
            z-index: 12;
            opacity: 0.94;
            filter: brightness(0.98);
          }
        }

        /* TABLET 3D ELLIPTICAL ORBIT AROUND EARTH */
        @keyframes qx-orbit-md {
          0.0% {
            transform: translate3d(330px, 0px, 0px) scale(0.95);
            z-index: 12;
            opacity: 0.94;
            filter: brightness(0.98);
          }
          12.5% {
            transform: translate3d(233px, -90px, -25px) scale(0.90);
            z-index: 12;
            opacity: 0.88;
            filter: brightness(0.88);
          }
          25.0% {
            transform: translate3d(0px, -125px, -35px) scale(0.86);
            z-index: 12;
            opacity: 0.84;
            filter: brightness(0.84);
          }
          37.5% {
            transform: translate3d(-233px, -90px, -25px) scale(0.90);
            z-index: 12;
            opacity: 0.88;
            filter: brightness(0.88);
          }
          49.9% {
            transform: translate3d(-330px, -1px, 0px) scale(0.95);
            z-index: 12;
            opacity: 0.95;
          }
          50.0% {
            transform: translate3d(-330px, 0px, 0px) scale(0.95);
            z-index: 50;
            opacity: 0.96;
            filter: brightness(0.98);
          }
          62.5% {
            transform: translate3d(-233px, 90px, 25px) scale(1.01);
            z-index: 50;
            opacity: 1.0;
            filter: brightness(1.06);
          }
          75.0% {
            transform: translate3d(0px, 125px, 35px) scale(1.04);
            z-index: 50;
            opacity: 1.0;
            filter: brightness(1.10);
          }
          87.5% {
            transform: translate3d(233px, 90px, 25px) scale(1.01);
            z-index: 50;
            opacity: 1.0;
            filter: brightness(1.06);
          }
          99.9% {
            transform: translate3d(330px, 1px, 0px) scale(0.95);
            z-index: 50;
            opacity: 0.95;
          }
          100.0% {
            transform: translate3d(330px, 0px, 0px) scale(0.95);
            z-index: 12;
            opacity: 0.94;
          }
        }

        /* EARTH CONTINUOUS GLOW BREATHING */
        @keyframes qx-earth-pulse {
          0%, 100% { transform: scale(1); opacity: 0.88; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        /* MOBILE GRID ISOLATION (< 768px):
           Clean 2-column grid matching user reference design. */
        @media (max-width: 767px) {
          .qx-orbital-card {
            animation: none !important;
            position: relative !important;
            top: auto !important;
            left: auto !important;
            transform: none !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            opacity: 1 !important;
            filter: none !important;
          }
        }

        /* DESKTOP 3D ENVIRONMENT (>= 768px):
           display: contents allows the <li> cards to participate directly in #qx-serve-stage
           so z-index: 50 passes OVER the Earth (z-20) and z-index: 12 passes BEHIND the Earth (z-20)
           with zero container clipping or stacking context traps. */
        @media (min-width: 768px) {
          #qx-serve-stage {
            position: relative !important;
          }
          #qx-serve-container {
            display: contents !important;
          }
          #qx-serve-list {
            display: contents !important;
          }
          .qx-orbital-card {
            clip-path: none !important;
          }
        }

        /* REDUCED MOTION OVERRIDE */
        @media (prefers-reduced-motion: reduce) {
          .qx-orbital-anim { animation: none !important; }
        }
      `}</style>

      <div {...reveal} className="relative w-full">
        {/* Soft Ambient Green Background Lighting */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[850px] h-[650px] sm:h-[850px] bg-[#2ABD00]/8 rounded-full blur-[140px]" />

        {/* =========================================================================
            SECTION HEADER
            ========================================================================= */}
        <div className="text-center max-w-[54rem] mx-auto mb-2 md:mb-4 relative z-20 px-4">
          <h2 id="qx-serve-heading" className="qx-display text-[clamp(1.85rem,5.5vw,2.75rem)] font-bold text-white tracking-tight leading-[1.18]">
            We work with
            <br className="block md:hidden" />{' '}
            <span className="text-[#2ABD00] drop-shadow-[0_0_24px_rgba(42,189,0,0.7)]">
              ambitious businesses
            </span>
            <br className="block md:hidden" />{' '}
            across<span className="text-[#2ABD00] drop-shadow-[0_0_10px_#2ABD00]">.</span>
          </h2>
          <div className="w-12 sm:w-16 h-[2px] bg-[#2ABD00] rounded-full mx-auto mt-3.5" />
          <p className="mt-7 md:mt-10 text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] sm:tracking-[0.22em] text-[#919A94]">
            DIFFERENT INDUSTRIES. A COMMON GOAL — GROWTH.
          </p>
        </div>

        {/* =========================================================================
            STAGE: 3D PLANETARY ORBITAL ECOSYSTEM (DESKTOP) & 3D CURVED CAROUSEL (MOBILE)
            ========================================================================= */}
        <div
          id="qx-serve-stage"
          className="relative w-full max-w-full min-w-0 flex flex-col items-center justify-start md:justify-center md:min-h-[660px] lg:min-h-[720px] xl:min-h-[760px] md:-mt-8 lg:-mt-14 z-10 overflow-hidden"
        >
          


          {/* =========================================================================
              DESKTOP LAYER 1 (z-5): BACKGROUND SVG TRACKS & BACK ARC OF INNER RING
              - Passes strictly BEHIND the Earth Globe (z-20)
              ========================================================================= */}
          <div className="pointer-events-none absolute inset-0 hidden md:flex items-center justify-center z-[5]">
            <svg
              className="w-full max-w-[1150px] h-full max-h-[820px]"
              viewBox="0 0 1000 640"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="qx-orbit-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="qx-node-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4.5" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <radialGradient id="qx-bead-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="45%" stopColor="#2ABD00" />
                  <stop offset="100%" stopColor="#1a7a0e" />
                </radialGradient>
              </defs>

              {/* RADIAL CONSTELLATION CONNECTOR BEAMS */}
              <g stroke="#2ABD00" strokeWidth="0.8" opacity="0.30" strokeDasharray="3 6">
                <line x1="500" y1="320" x2="250" y2="165" />
                <line x1="500" y1="320" x2="500" y2="160" />
                <line x1="500" y1="320" x2="750" y2="165" />
                <line x1="500" y1="320" x2="140" y2="433" />
                <line x1="500" y1="320" x2="370" y2="480" />
                <line x1="500" y1="320" x2="630" y2="480" />
                <line x1="500" y1="320" x2="860" y2="433" />
              </g>

              {/* INNER LEVEL EQUATORIAL RING: BACK ARC (passes BEHIND Earth) */}
              <path
                d="M 335 320 A 165 65 0 0 1 665 320"
                fill="none"
                stroke="#2ABD00"
                strokeWidth="1.6"
                opacity="0.75"
                filter="url(#qx-orbit-glow)"
              />
              <path
                d="M 315 320 A 185 75 0 0 1 685 320"
                fill="none"
                stroke="#1a7a0e"
                strokeWidth="1"
                strokeDasharray="4 8"
                opacity="0.45"
              />

              {/* OUTER SECONDARY SUPPORTING DOTTED GUIDE RING */}
              <ellipse
                cx="500"
                cy="320"
                rx="465"
                ry="175"
                fill="none"
                stroke="#1a7a0e"
                strokeWidth="1.2"
                strokeDasharray="5 9"
                opacity="0.38"
              />

              {/* PRIMARY OUTER GLOWING ORBIT TRACK */}
              <ellipse
                id="qx-main-orbit-path"
                cx="500"
                cy="320"
                rx="440"
                ry="160"
                fill="none"
                stroke="#2ABD00"
                strokeWidth="1.8"
                opacity="0.75"
                filter="url(#qx-orbit-glow)"
              />

              {/* LUMINOUS NODES ALONG THE ORBIT PATH */}
              <g filter="url(#qx-node-glow)">
                <circle cx="940" cy="320" r="5" fill="url(#qx-bead-grad)" />
                <circle cx="940" cy="320" r="2" fill="#FFFFFF" />

                <circle cx="811" cy="433" r="5" fill="url(#qx-bead-grad)" />
                <circle cx="811" cy="433" r="2" fill="#FFFFFF" />

                <circle cx="500" cy="480" r="5.5" fill="url(#qx-bead-grad)" />
                <circle cx="500" cy="480" r="2.2" fill="#FFFFFF" />

                <circle cx="189" cy="433" r="5" fill="url(#qx-bead-grad)" />
                <circle cx="189" cy="433" r="2" fill="#FFFFFF" />

                <circle cx="60" cy="320" r="5" fill="url(#qx-bead-grad)" />
                <circle cx="60" cy="320" r="2" fill="#FFFFFF" />

                <circle cx="189" cy="207" r="5" fill="url(#qx-bead-grad)" />
                <circle cx="189" cy="207" r="2" fill="#FFFFFF" />

                <circle cx="500" cy="160" r="5" fill="url(#qx-bead-grad)" />
                <circle cx="500" cy="160" r="2" fill="#FFFFFF" />

                <circle cx="811" cy="207" r="5" fill="url(#qx-bead-grad)" />
                <circle cx="811" cy="207" r="2" fill="#FFFFFF" />
              </g>

              {/* Moving Orbital Light Particle 1 along main outer orbit */}
              <circle r="4" fill="#FFFFFF" filter="url(#qx-node-glow)">
                <animateMotion
                  path="M 940 320 A 440 160 0 1 1 60 320 A 440 160 0 1 1 940 320"
                  dur="45s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Moving Orbital Light Particle 2 with offset */}
              <circle r="3.5" fill="#2ABD00" filter="url(#qx-node-glow)">
                <animateMotion
                  path="M 940 320 A 440 160 0 1 1 60 320 A 440 160 0 1 1 940 320"
                  dur="45s"
                  begin="-22.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>

          {/* =========================================================================
              DESKTOP LAYER 2 (z-20): CENTRAL 3D GLOWING EARTH & HUB
              - Proportional jewel core (~198px - 210px diameter, reduced slightly).
              - Sits at z-index: 20 so:
                  - Back cards (z-12) pass strictly BEHIND the Earth.
                  - Front cards (z-50) pass strictly OVER / IN FRONT OF the Earth!
              ========================================================================= */}
          <div className="hidden md:flex absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[20] items-center justify-center pointer-events-auto">
            <div className="relative w-56 h-56 md:w-[225px] md:h-[225px] lg:w-[245px] lg:h-[245px] xl:w-[265px] xl:h-[265px] flex items-center justify-center">
              
              {/* Fiery Green Energy Glow Background Halo */}
              <div
                className="absolute -inset-6 rounded-full bg-[radial-gradient(circle_at_center,rgba(42,189,0,0.32)_0%,rgba(26,122,14,0.1)_55%,transparent_75%)] blur-2xl pointer-events-none"
                style={{ animation: 'qx-earth-pulse 7s ease-in-out infinite' }}
              />

              {/* High-Resolution Glowing 3D Earth Globe Asset */}
              <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/who-we-serve-hub/globe-network.webp"
                  alt="QAVYX Planetary Orbital Core"
                  className="w-full h-full object-contain select-none pointer-events-none filter brightness-105 contrast-110 drop-shadow-[0_0_35px_rgba(42,189,0,0.9)]"
                />
              </div>

              {/* Central Floating Brandplate with Crisp QAVYX Logo */}
              <div className="absolute z-20 flex items-center justify-center pointer-events-none">
                <NavLogo
                  instance="serve-hub-v5"
                  className="w-[88px] md:w-[98px] lg:w-[108px] xl:w-[118px] h-auto text-white drop-shadow-[0_0_16px_rgba(42,189,0,0.95)] filter contrast-125"
                />
              </div>

            </div>
          </div>

          {/* =========================================================================
              DESKTOP LAYER 3 (z-28): FRONT ARC OF INNER EQUATORIAL RING
              - Passes OVER / ACROSS FRONT OF the Earth Globe (z-20)
              - Sits under front cards (z-50) so cards float over the ring!
              ========================================================================= */}
          <div className="pointer-events-none absolute inset-0 hidden md:flex items-center justify-center z-[28]">
            <svg
              className="w-full max-w-[1150px] h-full max-h-[820px]"
              viewBox="0 0 1000 640"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="qx-ring-front-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* INNER EQUATORIAL RING: FRONT ARC (passes OVER / ACROSS FRONT OF Earth) */}
              <path
                d="M 335 320 A 165 65 0 0 0 665 320"
                fill="none"
                stroke="#2ABD00"
                strokeWidth="2.2"
                opacity="0.95"
                filter="url(#qx-ring-front-glow)"
              />
              <path
                d="M 315 320 A 185 75 0 0 0 685 320"
                fill="none"
                stroke="#1a7a0e"
                strokeWidth="1.2"
                strokeDasharray="4 8"
                opacity="0.55"
              />
            </svg>
          </div>

          {/* =========================================================================
              DESKTOP LAYER 4: THE 7 INDUSTRY CARDS
              - On Desktop: Participates directly in stage stacking order:
                  - Back Arc (Y < 0): z-index: 12 (passes BEHIND Earth).
                  - Front Arc (Y > 0): z-index: 50 (passes OVER Earth and Equatorial Ring).
                  - Hover: z-index: 75.
              - On Mobile: 3D Coverflow carousel with touch swipe and auto-advance.
              ========================================================================= */}
          <div
            id="qx-serve-container"
            className="w-full max-w-[430px] xs:max-w-[460px] sm:max-w-[520px] mx-auto md:max-w-none md:w-full md:h-full relative my-2 md:my-0 px-2.5 xs:px-3 sm:px-4 md:px-0"
          >
            <ul
              id="qx-serve-list"
              className="grid grid-cols-2 gap-2.5 xs:gap-3 sm:gap-3.5 w-full m-0 p-0 list-none md:block md:w-full md:h-full md:relative"
            >
              {cardItems.map((item, idx) => {
                const isDesktopActive = activeIndex === idx;
                const isRetailCard = idx === 6;

                return (
                  <li
                    key={item.industry}
                    data-rv
                    className={`qx-orbital-card ${
                      isRetailCard ? 'col-span-2' : 'col-span-1'
                    } md:col-auto md:shrink md:absolute md:top-1/2 md:left-1/2 md:-ml-[100px] md:-mt-[68px] lg:-ml-[112px] lg:-mt-[76px] xl:-ml-[120px] xl:-mt-[80px] md:animate-[qx-orbit-md_70s_linear_infinite] lg:animate-[qx-orbit-lg_70s_linear_infinite] pointer-events-auto cursor-pointer`}
                    style={{
                      animationDelay: item.delayDesktop,
                      animationPlayState: activeIndex !== null ? 'paused' : 'running',
                      zIndex: isDesktopActive ? 75 : undefined,
                      transformStyle: 'preserve-3d',
                    }}
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'touch') return;
                      setActiveIndex(idx);
                    }}
                    onPointerLeave={(e) => {
                      if (e.pointerType === 'touch') return;
                      setActiveIndex(null);
                    }}
                    onClick={() => {
                      setActiveIndex(isDesktopActive ? null : idx);
                    }}
                  >
                    {/* =================================================================
                        PRESENTATION A: MOBILE 2-COLUMN GRID CARD (MATCHING MOCKUP)
                        - Cards 0-5: Portrait cards with top-right arrow badge & centered 3D art
                        - Card 6 (Retail): Full-width horizontal card spanning both columns
                        - Silver glass border + emerald glow accent matching site style
                        ================================================================= */}
                    <div className="md:hidden w-full">
                      {isRetailCard ? (
                        /* Card 7: Local Businesses & Retail Brands (Horizontal Full-Width) */
                        <div className="group relative flex items-center justify-between overflow-hidden rounded-[14px] xs:rounded-[16px] border border-white/20 hover:border-[#2ABD00]/70 bg-[#051108]/95 px-3.5 py-2.5 xs:px-4 xs:py-3 backdrop-blur-xl h-[78px] xs:h-[84px] shadow-[0_6px_20px_rgba(0,0,0,0.85),0_0_12px_rgba(42,189,0,0.12)] hover:shadow-[0_10px_26px_rgba(0,0,0,0.95),0_0_20px_rgba(42,189,0,0.35)] transition-all duration-300">
                          {/* Specular Top Edge Silver Glass Rim Highlight */}
                          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-20" />

                          {/* Full Background Image Layer */}
                          <div className="absolute inset-0 rounded-[14px] xs:rounded-[16px] overflow-hidden z-0 pointer-events-none">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image}
                              alt={item.industry}
                              className="w-full h-full object-cover object-center filter contrast-105 brightness-100 group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                            {/* Horizontal Gradient Overlay: dark on the left for title text */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/45" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent opacity-50" />
                          </div>

                          {/* Middle: Industry Title */}
                          <div className="relative z-10 flex-1 pr-3">
                            <h3 className="text-[13px] xs:text-[14px] font-bold text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] tracking-tight">
                              {item.industry}
                            </h3>
                          </div>

                          {/* Right: Circular Arrow Badge */}
                          <div className="relative z-10 flex shrink-0 items-center justify-center">
                            <div className="flex h-[26px] w-[26px] xs:h-[28px] xs:w-[28px] shrink-0 items-center justify-center rounded-full border border-[#2ABD00]/70 bg-black/70 text-[#2ABD00] shadow-[0_0_8px_rgba(42,189,0,0.4)] group-hover:scale-105 group-hover:border-[#2ABD00] group-hover:shadow-[0_0_12px_rgba(42,189,0,0.7)] transition-all backdrop-blur-md">
                              <svg
                                className="h-[12px] w-[12px] xs:h-[13px] xs:w-[13px]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M7 17L17 7M17 7H7M17 7V17" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Cards 1-6: Portrait Cards in 2-Column Grid */
                        <div className="group relative flex flex-col justify-between overflow-hidden rounded-[14px] xs:rounded-[16px] border border-white/20 hover:border-[#2ABD00]/70 bg-[#051108]/95 p-3 xs:p-3.5 backdrop-blur-xl h-[165px] xs:h-[180px] shadow-[0_6px_20px_rgba(0,0,0,0.85),0_0_12px_rgba(42,189,0,0.12)] hover:shadow-[0_10px_26px_rgba(0,0,0,0.95),0_0_20px_rgba(42,189,0,0.35)] transition-all duration-300">
                          {/* Specular Top Edge Silver Glass Rim Highlight */}
                          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-20" />

                          {/* Full Background Image Layer */}
                          <div className="absolute inset-0 rounded-[14px] xs:rounded-[16px] overflow-hidden z-0 pointer-events-none">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image}
                              alt={item.industry}
                              className="w-full h-full object-cover object-center filter contrast-105 brightness-100 group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                            {/* Dual Gradients: dark at bottom for title legibility, dark at top for arrow */}
                            <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
                            <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-black/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent opacity-50" />
                          </div>

                          {/* Top Row: Circular Arrow Badge (Top-Right) */}
                          <div className="relative z-10 flex items-center justify-end w-full">
                            <div className="flex h-[24px] w-[24px] xs:h-[26px] xs:w-[26px] shrink-0 items-center justify-center rounded-full border border-[#2ABD00]/70 bg-black/70 text-[#2ABD00] shadow-[0_0_8px_rgba(42,189,0,0.4)] group-hover:scale-105 group-hover:border-[#2ABD00] group-hover:shadow-[0_0_12px_rgba(42,189,0,0.7)] transition-all backdrop-blur-md">
                              <svg
                                className="h-[11px] w-[11px] xs:h-[12px] xs:w-[12px]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M7 17L17 7M17 7H7M17 7V17" />
                              </svg>
                            </div>
                          </div>

                          {/* Bottom Row: Industry Title */}
                          <div className="relative z-10 mt-auto pt-2">
                            <h3 className="text-[12px] xs:text-[13px] font-bold text-white leading-[1.25] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] tracking-tight">
                              {item.industry}
                            </h3>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* =================================================================
                        PRESENTATION B: DESKTOP CLEAN UPRIGHT 3D ORBITAL CARD
                        - True 3D Depth & Elevation
                        - Crystal-clear image clarity (no heavy dimming overlay)
                        - Snug, small circular arrow badge (↗) fitting arrow cleanly
                        - Number '01'..'07' at top left
                        ================================================================= */}
                    <div className="hidden md:block">
                      <div
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-[18px] border-[1.5px] bg-[#030e05]/94 p-3 sm:p-3.5 backdrop-blur-2xl transition-all duration-300 ease-out md:w-[195px] lg:w-[220px] xl:w-[235px] md:h-[135px] lg:h-[150px] xl:h-[158px] cursor-pointer ${
                          isDesktopActive
                            ? 'border-[#2ABD00] shadow-[0_24px_50px_rgba(0,0,0,0.98),0_0_38px_rgba(42,189,0,0.85),inset_0_1.5px_2px_rgba(255,255,255,0.6)] brightness-110 scale-[1.07]'
                            : 'border-[#2ABD00]/45 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.95),0_0_24px_rgba(42,189,0,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.35)] hover:border-[#2ABD00] hover:shadow-[0_22px_45px_rgba(0,0,0,0.98),0_0_32px_rgba(42,189,0,0.8)] hover:scale-[1.06]'
                        }`}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {/* Top-Edge Specular Glass Rim Highlight */}
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#86b881]/90 to-transparent pointer-events-none z-20" />

                        {/* Background Industry Photography - Crystal Clear & High Contrast */}
                        <div className="absolute inset-0 rounded-[18px] overflow-hidden z-0 pointer-events-none">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.industry}
                            className="w-full h-full object-cover object-center filter contrast-110 brightness-105 group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          {/* Bottom-only Vignette to guarantee text legibility without muddying the main subject */}
                          <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/92 via-black/40 to-transparent" />
                          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-transparent to-transparent opacity-60" />
                        </div>

                        {/* Top Row: Snug Arrow Badge (Right) */}
                        <div
                          className="relative z-10 flex items-center justify-end w-full"
                          style={{ transform: 'translateZ(14px)' }}
                        >
                          {/* Snug 20px Circular Arrow Badge */}
                          <div className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white/90 group-hover:border-[#2ABD00] group-hover:text-[#2ABD00] group-hover:shadow-[0_0_8px_#2ABD00] transition-all">
                            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 17L17 7M17 7H7M17 7V17" />
                            </svg>
                          </div>
                        </div>

                        {/* Bottom Row: Bold White Industry Name with 3D Depth */}
                        <div
                          className="relative z-10 mt-auto pt-2"
                          style={{ transform: 'translateZ(18px)' }}
                        >
                          <h3 className="text-[12px] lg:text-[13px] xl:text-[13.5px] font-bold text-white leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.98)] tracking-tight">
                            {item.industry}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>


        </div>

      </div>
    </section>
  );
}
