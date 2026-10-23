'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { WhatsAppLink } from '@/components/nav/WhatsAppLink';
import { sectionAnchor } from '@/content/pillars';

type ProcessItem = {
  number: string;
  label: string;
  title: string;
  description: string;
  items: string[];
  sideTitle: string;
  image: string;
  visualSide: 'left' | 'right';
};

const processData: ProcessItem[] = [
  {
    number: '01',
    label: 'STRATEGY & GROWTH',
    title: 'Social Media Growth & Management',
    description:
      'We manage your social media with strategic content, regular posting, and audience engagement.',
    sideTitle: 'SERVICES',
    items: [
      'Strategic Content Planning',
      'Consistent Posting Schedule',
      'Active Audience Engagement',
      'Brand Presence & Growth',
    ],
    image: '/social-images/01-growth.webp',
    visualSide: 'right',
  },
  {
    number: '02',
    label: 'VIDEO & REELS',
    title: 'Short-Form Video & Reels',
    description:
      'From ideas to editing, we produce engaging short-form videos designed for Instagram, Facebook, and YouTube.',
    sideTitle: 'SERVICES',
    items: [
      'Reel Strategy',
      'Script Writing',
      'Video Editing',
      'Trend-Based Content',
    ],
    image: '/social-images/02-reels.webp',
    visualSide: 'left',
  },
  {
    number: '03',
    label: 'CREATIVE PRODUCTION',
    title: 'Content Production',
    description:
      'We create high-quality visuals that showcase your products, services, and story.',
    sideTitle: 'SERVICES',
    items: [
      'Product Photography',
      'Brand Videos',
      'Creative Designs',
      'Promotional Content',
    ],
    image: '/social-images/03-production.webp',
    visualSide: 'right',
  },
  {
    number: '04',
    label: 'PAID SOCIAL ADS',
    title: 'Performance Marketing Across Social',
    description:
      'We create and manage advertising campaigns that focus on real business growth.',
    sideTitle: 'PLATFORMS & SERVICES',
    items: [
      'Meta Ads (Facebook & Instagram)',
      'Google Ads',
      'LinkedIn Ads',
      'X Ads',
      'Telegram Ads',
      'Campaign Optimization',
    ],
    image: '/social-images/04-performance.webp',
    visualSide: 'left',
  },
  {
    number: '05',
    label: 'CONVERSION & RETARGETING',
    title: 'Retargeting Systems',
    description:
      'Bring back visitors who showed interest and encourage them to take action.',
    sideTitle: 'SERVICES',
    items: [
      'Website Retargeting',
      'Lead Nurturing',
      'Audience Segmentation',
      'Conversion Optimization',
    ],
    image: '/social-images/05-retargeting.webp',
    visualSide: 'right',
  },
];

export default function SocialContentProcess() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const badgeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [svgPath, setSvgPath] = useState<string>('');

  const updateTimelinePath = useCallback(() => {
    if (!containerRef.current) return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSvgPath('');
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    const badgeCenters: { x: number; y: number }[] = [];
    const cardBounds: { left: number; right: number; top: number; bottom: number }[] = [];

    for (let i = 0; i < processData.length; i++) {
      const badge = badgeRefs.current[i];
      const card = cardRefs.current[i];
      if (!badge || !card) return;

      const bRect = badge.getBoundingClientRect();
      const cRect = card.getBoundingClientRect();

      badgeCenters.push({
        x: bRect.left + bRect.width / 2 - containerRect.left,
        y: bRect.top + bRect.height / 2 - containerRect.top,
      });

      cardBounds.push({
        left: cRect.left - containerRect.left,
        right: cRect.right - containerRect.left,
        top: cRect.top - containerRect.top,
        bottom: cRect.bottom - containerRect.top,
      });
    }

    let path = '';
    const r = 12;
    const offset = 12;

    for (let i = 0; i < processData.length; i++) {
      const badge = badgeCenters[i];
      const card = cardBounds[i];
      if (!badge || !card) continue;

      const cx = badge.x;
      const cy = badge.y;
      const cLeft = card.left;
      const cRight = card.right;
      const cTop = card.top;
      const cBottom = card.bottom;
      const isBadgeRight = i % 2 !== 0;

      if (i === 0) {
        path += `M ${cx} ${cy}`;
      }

      if (!isBadgeRight) {
        // Card 01, 03, 05 (Badge on LEFT):
        path += ` L ${cx} ${cTop + r}`;
        path += ` Q ${cx} ${cTop}, ${cx + r} ${cTop}`;
        path += ` L ${cRight - r} ${cTop}`;
        path += ` Q ${cRight + offset} ${cTop}, ${cRight + offset} ${cTop + r}`;

        if (i < processData.length - 1) {
          const nextBadge = badgeCenters[i + 1];
          const nextCard = cardBounds[i + 1];
          if (nextBadge && nextCard) {
            const midY = (cBottom + nextCard.top) / 2;
            path += ` L ${cRight + offset} ${midY - 10}`;
            path += ` C ${cRight + offset} ${midY + 10}, ${nextBadge.x + offset} ${nextBadge.y - 10}, ${nextBadge.x} ${nextBadge.y}`;
          }
        }
      } else {
        // Card 02, 04 (Badge on RIGHT):
        path += ` L ${cx} ${cTop + r}`;
        path += ` Q ${cx} ${cTop}, ${cx - r} ${cTop}`;
        path += ` L ${cLeft + r} ${cTop}`;
        path += ` Q ${cLeft - offset} ${cTop}, ${cLeft - offset} ${cTop + r}`;

        if (i < processData.length - 1) {
          const nextBadge = badgeCenters[i + 1];
          const nextCard = cardBounds[i + 1];
          if (nextBadge && nextCard) {
            const midY = (cBottom + nextCard.top) / 2;
            path += ` L ${cLeft - offset} ${midY - 10}`;
            path += ` C ${cLeft - offset} ${midY + 10}, ${nextBadge.x - offset} ${nextBadge.y - 10}, ${nextBadge.x} ${nextBadge.y}`;
          }
        }
      }
    }

    setSvgPath(path);
  }, []);

  useEffect(() => {
    updateTimelinePath();
    const handleResize = () => updateTimelinePath();
    window.addEventListener('resize', handleResize);

    const observer = new ResizeObserver(() => {
      updateTimelinePath();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [updateTimelinePath]);

  return (
    <article className="relative overflow-hidden bg-[#030503] py-10 sm:py-14 text-white min-h-screen">
      {/* Soft Ambient Background Glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[#2ABD00]/[0.06] blur-[160px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-[#2ABD00]/[0.03] blur-[150px]" />

      <div className="relative mx-auto max-w-[var(--qx-shell)] px-3 sm:px-4 md:px-6">
        
        {/* ================= HERO SECTION ================= */}
        <div className="w-full grid items-center gap-6 lg:gap-10 lg:grid-cols-12 mb-12 md:mb-16 pt-2">
          
          {/* Left Header Copy */}
          <div className="lg:col-span-6 flex flex-col items-start">

            {/* Main Headline */}
            <h1 className="qx-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[3.1rem] font-bold tracking-tight text-white leading-tight mb-3 sm:mb-4">
              Where Scrolling{' '}
              <span className="text-[#2ABD00]">Stops.</span>
            </h1>

            {/* Description Copy */}
            <div className="text-xs sm:text-sm text-[#919A94] font-sans leading-relaxed max-w-[460px] sm:max-w-[540px] mb-5 sm:mb-6 font-medium space-y-2">
              <p>Attention is the most expensive currency online.</p>
              <p>We make sure yours gets spent on you.</p>
              <p>
                We help your brand stand out with engaging content, consistent posting, and campaigns that turn attention into customers.
              </p>
            </div>
          </div>

          {/* Right Header Visual: Hero Social Media Graphics */}
          <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end pt-2 lg:pt-0">
            <div className="relative w-full max-w-[540px] aspect-[16/9] overflow-hidden rounded-[18px] border border-[#2ABD00]/30 bg-[#050705] shadow-[0_0_35px_rgba(42,189,0,0.15)]">
              {/* Green Atmospheric Glow */}
              <div className="absolute inset-0 z-0 bg-[#2ABD00]/20 blur-3xl pointer-events-none" />
              
              {/* Soft Edge Blending Gradients */}
              <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#030503] via-transparent to-[#030503]/50 pointer-events-none" />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#030503] via-transparent to-[#030503]/30 pointer-events-none" />

              <Image
                src="/social-images/hero-social.webp"
                alt="QAVYX Social & Content Studio"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 500px"
                className="object-cover object-center opacity-95 transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>

        </div>

        {/* ================= PROCESS TIMELINE WRAPPING ROUTE ================= */}
        <div ref={containerRef} className="relative mx-auto w-full overflow-visible z-10">
          
          {/* Top-Level Continuous Neon Green Dynamic SVG Overlay */}
          <svg className="absolute inset-0 pointer-events-none z-10 w-full h-full overflow-visible hidden md:block">
            <defs>
              <filter id="subtle-green-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {svgPath && (
              <path
                d={svgPath}
                stroke="#2ABD00"
                strokeWidth="1.2"
                strokeOpacity="0.85"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                filter="url(#subtle-green-glow)"
              />
            )}
          </svg>

          <div className="space-y-12 md:space-y-16 relative z-20">
            {processData.map((process, index) => {
              const isVisualLeft = process.visualSide === 'left';
              const isBadgeRight = index % 2 !== 0; // Card 02 and 04 have badge on right
              const anchor = sectionAnchor(process.title);

              return (
                <section
                  key={process.number}
                  id={anchor}
                  aria-labelledby={`${anchor}-heading`}
                  className={`group relative scroll-mt-24 w-full md:w-[84%] ${
                    isBadgeRight ? 'md:mr-auto md:ml-0' : 'md:ml-auto md:mr-0'
                  }`}
                >
                  {/* Square Number Indicator Badge (Desktop) */}
                  <div
                    ref={(el) => { badgeRefs.current[index] = el; }}
                    className={`absolute z-30 hidden h-8 w-8 items-center justify-center rounded-[6px] border border-[#2ABD00] bg-[#020b04] text-[11px] font-mono font-extrabold text-white shadow-[0_0_15px_rgba(42,189,0,0.6)] md:flex ${
                      isBadgeRight
                        ? 'right-[-16px] top-[80px] -translate-y-1/2'
                        : 'left-[-16px] top-[80px] -translate-y-1/2'
                    }`}
                  >
                    {process.number}
                  </div>

                  {/* Process Card Container - Uniform Height on Desktop */}
                  <div
                    ref={(el) => { cardRefs.current[index] = el; }}
                    className="relative z-20 w-full lg:h-[270px] overflow-hidden rounded-[16px] border border-[#2ABD00]/35 bg-[#050705]/95 backdrop-blur-xl transition-all duration-500 hover:border-[#2ABD00] hover:shadow-[0_0_30px_rgba(42,189,0,0.2)]"
                  >
                    
                    {/* Mobile Header Badge */}
                    <div className="flex md:hidden items-center justify-between px-4 pt-3.5 pb-2 border-b border-[#2ABD00]/15">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2ABD00] shadow-[0_0_8px_#2ABD00]" />
                        <span className="text-[10px] font-mono font-bold tracking-[0.35em] text-[#2ABD00] uppercase">
                          {process.label}
                        </span>
                      </div>
                      <span className="w-5.5 h-5.5 px-1.5 py-0.5 rounded-[4px] border border-[#2ABD00] bg-[#020b04] flex items-center justify-center text-[9px] font-mono font-extrabold text-white shadow-[0_0_8px_rgba(42,189,0,0.4)]">
                        {process.number}
                      </span>
                    </div>

                    {/* Card Interior Layout */}
                    {!isVisualLeft ? (
                      /* Card with Image on RIGHT (01, 03, 05) */
                      <div className="relative grid min-h-[165px] lg:h-full lg:grid-cols-[1.15fr_0.85fr_225px]">
                        
                        {/* AREA 1: Main Copy */}
                        <div className="p-4 sm:p-5 lg:py-4.5 lg:px-5 flex flex-col justify-between">
                          <div>
                            <div className="hidden md:flex items-center gap-1.5 mb-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#2ABD00] shadow-[0_0_8px_#2ABD00]" />
                              <span className="text-[9px] font-mono font-bold tracking-[0.3em] text-[#2ABD00] uppercase">
                                {process.label}
                              </span>
                            </div>

                            <h2
                              id={`${anchor}-heading`}
                              className="text-xl sm:text-2xl lg:text-[1.65rem] font-extrabold tracking-tight text-white leading-tight font-sans"
                            >
                              {process.title}
                            </h2>

                            <p className="mt-1.5 max-w-xl text-xs sm:text-[13px] leading-relaxed text-[#9A9F9B] font-sans">
                              {process.description}
                            </p>
                          </div>

                          <WhatsAppLink
                            ariaLabel={`Explore ${process.title}`}
                            className="mt-2.5 inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-[0.25em] text-[#2ABD00] transition-all hover:gap-3 hover:text-white"
                          >
                            <span>EXPLORE MORE</span>
                            <svg className="w-3 h-3 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </WhatsAppLink>
                        </div>

                        {/* AREA 2: Deliverables / Checklist */}
                        <div className="border-t border-[#2ABD00]/15 p-4 sm:p-5 lg:py-4.5 lg:px-5 lg:border-l lg:border-t-0 flex flex-col justify-center bg-black/20">
                          <p className="mb-2 text-[9px] font-mono font-bold tracking-[0.3em] text-[#9A9F9B]/80 uppercase">
                            {process.sideTitle}
                          </p>

                          <ul className="space-y-1.5">
                            {process.items.map((item) => (
                              <li
                                key={item}
                                className="flex items-center gap-2 text-xs leading-tight text-[#FFFFFF]/90 font-mono"
                              >
                                <span className="h-3.5 w-3.5 shrink-0 rounded-[3px] border border-[#2ABD00] bg-[#2ABD00]/15 shadow-[0_0_6px_rgba(42,189,0,0.4)] flex items-center justify-center text-[8px] font-bold text-[#2ABD00]">
                                  ✓
                                </span>
                                <span className="truncate">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* AREA 3: Right Visual Image */}
                        <div className="relative overflow-hidden aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-full w-full border-t border-[#2ABD00]/15 lg:border-l lg:border-t-0 bg-[#020502]">
                          <div className="absolute inset-0 z-0 bg-[#2ABD00]/10 blur-lg pointer-events-none" />
                          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#050705] via-transparent to-[#050705]/60 pointer-events-none hidden lg:block" />
                          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050705]/60 via-transparent to-transparent pointer-events-none hidden lg:block" />
                          <Image
                            src={process.image}
                            alt={process.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 225px"
                            className="object-cover object-center opacity-95 transition-transform duration-700 hover:scale-105"
                          />
                        </div>

                      </div>
                    ) : (
                      /* Card with Image on LEFT (02, 04) */
                      <div className="relative grid min-h-[165px] lg:h-full lg:grid-cols-[225px_1.15fr_0.85fr]">
                        
                        {/* AREA 1: Left Visual Image */}
                        <div className="relative overflow-hidden aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-full w-full border-t border-[#2ABD00]/15 lg:border-r lg:border-t-0 order-3 lg:order-1 bg-[#020502]">
                          <div className="absolute inset-0 z-0 bg-[#2ABD00]/10 blur-lg pointer-events-none" />
                          <div className="absolute inset-0 z-10 bg-gradient-to-l from-[#050705] via-transparent to-[#050705]/60 pointer-events-none hidden lg:block" />
                          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050705]/60 via-transparent to-transparent pointer-events-none hidden lg:block" />
                          <Image
                            src={process.image}
                            alt={process.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 225px"
                            className="object-cover object-center opacity-95 transition-transform duration-700 hover:scale-105"
                          />
                        </div>

                        {/* AREA 2: Main Copy */}
                        <div className="p-4 sm:p-5 lg:py-4.5 lg:px-5 flex flex-col justify-between order-1 lg:order-2">
                          <div>
                            <div className="hidden md:flex items-center gap-1.5 mb-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#2ABD00] shadow-[0_0_8px_#2ABD00]" />
                              <span className="text-[9px] font-mono font-bold tracking-[0.3em] text-[#2ABD00] uppercase">
                                {process.label}
                              </span>
                            </div>

                            <h2
                              id={`${anchor}-heading`}
                              className="text-xl sm:text-2xl lg:text-[1.65rem] font-extrabold tracking-tight text-white leading-tight font-sans"
                            >
                              {process.title}
                            </h2>

                            <p className="mt-1.5 max-w-xl text-xs sm:text-[13px] leading-relaxed text-[#9A9F9B] font-sans">
                              {process.description}
                            </p>
                          </div>

                          <WhatsAppLink
                            ariaLabel={`Explore ${process.title}`}
                            className="mt-2.5 inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-[0.25em] text-[#2ABD00] transition-all hover:gap-3 hover:text-white"
                          >
                            <span>EXPLORE MORE</span>
                            <svg className="w-3 h-3 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </WhatsAppLink>
                        </div>

                        {/* AREA 3: Deliverables / Checklist */}
                        <div className="border-t border-[#2ABD00]/15 p-4 sm:p-5 lg:py-4.5 lg:px-5 lg:border-l lg:border-t-0 flex flex-col justify-center order-2 lg:order-3 bg-black/20">
                          <p className="mb-2 text-[9px] font-mono font-bold tracking-[0.3em] text-[#9A9F9B]/80 uppercase">
                            {process.sideTitle}
                          </p>

                          <ul className="space-y-1.5">
                            {process.items.map((item) => (
                              <li
                                key={item}
                                className="flex items-center gap-2 text-xs leading-tight text-[#FFFFFF]/90 font-mono"
                              >
                                <span className="h-3.5 w-3.5 shrink-0 rounded-[3px] border border-[#2ABD00] bg-[#2ABD00]/15 shadow-[0_0_6px_rgba(42,189,0,0.4)] flex items-center justify-center text-[8px] font-bold text-[#2ABD00]">
                                  ✓
                                </span>
                                <span className="truncate">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                      </div>
                    )}

                  </div>
                </section>
              );
            })}
          </div>

        </div>

        {/* ================= BOTTOM CTA ================= */}
        <div className="mt-14 flex items-center justify-center text-center py-6 border-t border-white/10">
          <WhatsAppLink
            ariaLabel="Chat With Us"
            className="group inline-flex items-center justify-center gap-2.5 rounded-sm border border-[#2ABD00]/60 bg-transparent px-5 sm:px-6 py-2 sm:py-2.5 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#2ABD00] transition-all duration-300 hover:border-[#2ABD00] hover:bg-[#2ABD00]/10 hover:shadow-[0_0_16px_rgba(42,189,0,0.35)] cursor-pointer"
          >
            <span>CHAT WITH US</span>
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
    </article>
  );
}
