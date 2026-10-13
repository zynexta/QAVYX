'use client';

import React, { useState, useRef } from 'react';
import { reveal, stagger } from '@/lib/reveal';
import {
  WHATS_COMING,
  EARLY_ACCESS,
  WAITLIST_FIELDS,
  WAITLIST_SUBMIT,
} from '@/content/launchpad';
import { NavLogo } from '@/components/nav/NavLogo';

/**
 * `/launchpad` Page — Exact 1:1 UI matched to official reference screenshot.
 */

export default function LaunchpadPage() {
  const [formData, setFormData] = useState<Record<string, string>>({
    'full-name': '',
    email: '',
    whatsapp: '',
    'startup-name': '',
    industry: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setActiveSlide(scrollLeft / maxScroll > 0.4 ? 1 : 0);
      }
    }
  };

  const scrollToPage = (pageIndex: number) => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const targetLeft = pageIndex === 0 ? 0 : maxScroll;
      scrollContainerRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
      setActiveSlide(pageIndex);
    }
  };

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  };

  return (
    <article className="bg-black text-white min-h-screen pt-0 pb-16 overflow-x-clip">
      {/* ================================================================
          SECTION 1: HERO SECTION — COMPACT TOP SPACING
          ================================================================ */}
      {/* ================================================================
          SECTION 1: HERO SECTION — PREMIER GLOBAL PARTNERSHIP & LAUNCHPAD
          ================================================================ */}
      <section aria-labelledby="launchpad-hero-title" className="relative pt-4 xs:pt-6 sm:pt-10 lg:pt-14 pb-12 sm:pb-16 lg:pb-20 bg-black">
        <div className="relative mx-auto max-w-[var(--qx-shell)] px-3 sm:px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 lg:gap-10 items-center pt-0">
            
            {/* Left Column: Content & CTAs */}
            <div {...reveal} className="lg:col-span-6 flex flex-col items-start z-10 pt-0 text-left">

              {/* Headline */}
              <h1
                id="launchpad-hero-title"
                className="qx-display text-[2.1rem] xs:text-[2.5rem] sm:text-4xl md:text-5xl lg:text-[3.2rem] font-bold tracking-tight text-white leading-[1.12] sm:leading-[1.18] mb-3 sm:mb-4 text-left"
              >
                Build the next big
                <br />
                business with
                <span className="block text-[#2ABD00] mt-1 xs:mt-1.5 sm:mt-2.5">
                  <NavLogo
                    instance="launchpad-hero-title"
                    className="inline-block h-[0.72em] xs:h-[0.76em] sm:h-[0.8em] w-auto text-[#2ABD00] align-middle translate-y-[-0.04em] mr-0.5"
                  />
                  <span className="text-[#2ABD00]">.</span>
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-[13px] xs:text-sm sm:text-sm md:text-base text-[#919A94] font-sans leading-relaxed max-w-[480px] mb-4 sm:mb-8 font-medium text-left">
                From bold ideas to global opportunities, build, partner, and grow with QAVYX.
              </p>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto mb-4 sm:mb-10">
                <a
                  href="#qx-waitlist-form"
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#2ABD00] px-5 sm:px-6 py-2.5 sm:py-3 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-black shadow-[0_0_20px_rgba(42,189,0,0.35)] hover:shadow-[0_0_30px_rgba(42,189,0,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full sm:w-auto cursor-pointer"
                >
                  <span>{EARLY_ACCESS.cta}</span>
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>

                <a
                  href="#qx-whats-coming"
                  className="inline-flex items-center justify-center rounded-sm border border-[#2ABD00]/70 bg-black/60 px-5 sm:px-6 py-2.5 sm:py-3 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white hover:border-[#2ABD00] hover:bg-[#2ABD00]/10 transition-all duration-300 w-full sm:w-auto text-center cursor-pointer"
                >
                  <span>KNOW MORE</span>
                </a>
              </div>
            </div>

            {/* Right Column: Blended Executive Visual & 4 Independent Floating Feature Cards */}
            <div {...reveal} style={stagger(2)} className="lg:col-span-6 relative flex items-center justify-center lg:justify-end pt-0 sm:pt-4 lg:pt-0 w-full">
              
              {/* Snug Visual Wrapper: Image & Floating Cards share the exact same bounding box */}
              <div className="relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[560px] mx-auto lg:mr-0 flex items-center justify-center lg:justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/launchpad-portal-hero.webp"
                  alt="QAVYX Global Business Ecosystem & Executive Visual"
                  className="w-full h-auto object-contain relative z-10 [mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)]"
                />

                {/* Floating Motion Keyframes */}
                <style jsx>{`
                  @keyframes qxSubtleFloat {
                    0%, 100% {
                      transform: translateY(0px);
                    }
                    50% {
                      transform: translateY(-5px);
                    }
                  }
                  .animate-subtle-float {
                    animation: qxSubtleFloat var(--float-dur, 5s) ease-in-out infinite var(--float-del, 0s);
                  }
                  @media (prefers-reduced-motion: reduce) {
                    .animate-subtle-float {
                      animation: none !important;
                    }
                  }
                `}</style>

                {/* 4 Independent Floating Feature Cards - Snugly Framed Around Portal Scene */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  
                  {/* Card 1: IDEA (Top Left of Portal) */}
                  <div
                    className="absolute top-[36%] sm:top-[24%] left-1.5 sm:left-[6%] lg:left-[4%] z-20 pointer-events-auto flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl border border-[#2ABD00]/70 bg-[#020d04]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.85),0_0_12px_rgba(42,189,0,0.2)] hover:border-[#2ABD00] hover:-translate-y-1 transition-all duration-300 animate-subtle-float"
                    style={{ '--float-dur': '5.2s', '--float-del': '0s' } as React.CSSProperties}
                  >
                    <div className="w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] rounded-full border border-[#2ABD00]/60 bg-[#2ABD00]/15 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(42,189,0,0.3)]">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2ABD00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="font-mono text-[9px] sm:text-[10px] font-bold text-white block tracking-wider uppercase leading-tight">IDEA</span>
                      <span className="font-sans text-[7px] sm:text-[8.5px] text-[#919A94] block font-medium leading-tight whitespace-nowrap">New Opportunities</span>
                    </div>
                  </div>

                  {/* Card 2: BUILD (Top Right of Portal) */}
                  <div
                    className="absolute top-[32%] sm:top-[20%] right-1.5 sm:right-[6%] lg:right-[4%] z-20 pointer-events-auto flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl border border-[#2ABD00]/70 bg-[#020d04]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.85),0_0_12px_rgba(42,189,0,0.2)] hover:border-[#2ABD00] hover:-translate-y-1 transition-all duration-300 animate-subtle-float"
                    style={{ '--float-dur': '5.8s', '--float-del': '0.4s' } as React.CSSProperties}
                  >
                    <div className="w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] rounded-full border border-[#2ABD00]/60 bg-[#2ABD00]/15 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(42,189,0,0.3)]">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2ABD00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="font-mono text-[9px] sm:text-[10px] font-bold text-white block tracking-wider uppercase leading-tight">BUILD</span>
                      <span className="font-sans text-[7px] sm:text-[8.5px] text-[#919A94] block font-medium leading-tight whitespace-nowrap">Strategic Partnerships</span>
                    </div>
                  </div>

                  {/* Card 3: GROW (Bottom Left of Portal) */}
                  <div
                    className="absolute bottom-[24%] sm:bottom-[22%] left-1.5 sm:left-[6%] lg:left-[4%] z-20 pointer-events-auto flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl border border-[#2ABD00]/70 bg-[#020d04]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.85),0_0_12px_rgba(42,189,0,0.2)] hover:border-[#2ABD00] hover:-translate-y-1 transition-all duration-300 animate-subtle-float"
                    style={{ '--float-dur': '5.0s', '--float-del': '1.2s' } as React.CSSProperties}
                  >
                    <div className="w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] rounded-full border border-[#2ABD00]/60 bg-[#2ABD00]/15 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(42,189,0,0.3)]">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2ABD00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="font-mono text-[9px] sm:text-[10px] font-bold text-white block tracking-wider uppercase leading-tight">GROW</span>
                      <span className="font-sans text-[7px] sm:text-[8.5px] text-[#919A94] block font-medium leading-tight whitespace-nowrap">Global Markets</span>
                    </div>
                  </div>

                  {/* Card 4: LAUNCH (Bottom Right of Portal) */}
                  <div
                    className="absolute bottom-[18%] sm:bottom-[20%] right-1.5 sm:right-[6%] lg:right-[4%] z-20 pointer-events-auto flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl border border-[#2ABD00]/70 bg-[#020d04]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.85),0_0_12px_rgba(42,189,0,0.2)] hover:border-[#2ABD00] hover:-translate-y-1 transition-all duration-300 animate-subtle-float"
                    style={{ '--float-dur': '5.5s', '--float-del': '0.8s' } as React.CSSProperties}
                  >
                    <div className="w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] rounded-full border border-[#2ABD00]/60 bg-[#2ABD00]/15 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(42,189,0,0.3)]">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2ABD00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71.79-1.81.79-1.81l-1.98-1.98s-1.1.08-1.81.79z" />
                        <path d="M15 8s-4 1.5-6 3.5l3.5 3.5c2-2 3.5-6 3.5-6s-1-1.5-1-1.5z" />
                        <path d="M12 15l-3-3" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="font-mono text-[9px] sm:text-[10px] font-bold text-white block tracking-wider uppercase leading-tight">LAUNCH</span>
                      <span className="font-sans text-[7px] sm:text-[8.5px] text-[#919A94] block font-medium leading-tight whitespace-nowrap">Bigger Possibilities</span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 2: FEATURE CARDS ("WHAT'S COMING") — SLEEK COMPACT CARDS
          ================================================================ */}
      <section id="qx-whats-coming" aria-labelledby="whats-coming-heading" className="relative py-10 sm:py-14 lg:py-16 overflow-hidden">
        {/* Soft Ambient Background Wave Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(42,189,0,0.15)_0%,transparent_70%)] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(42,189,0,0.15)_0%,transparent_70%)] blur-3xl pointer-events-none" />
          
          {/* Ambient Curved Wave Lines */}
          <svg className="absolute inset-0 w-full h-full stroke-[#2ABD00]/15 fill-none stroke-[1]" viewBox="0 0 1440 600" preserveAspectRatio="none">
            <path d="M-100 100 Q 400 400 900 100 T 1600 300" />
            <path d="M-100 500 Q 500 200 1100 500 T 1600 200" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-[var(--qx-shell)] px-3 sm:px-4 md:px-6">
          
          {/* Section Header */}
          <div {...reveal} className="text-center max-w-[48rem] mx-auto mb-8 sm:mb-10">
            <p className="font-mono text-[10px] sm:text-xs font-semibold tracking-[0.25em] text-[#2ABD00] uppercase mb-2">
              FUTURE ECOSYSTEM
            </p>

            <h2 id="whats-coming-heading" className="qx-display text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2 sm:mb-3 leading-tight">
              Everything You Need to <span className="text-[#2ABD00]">Launch &amp; Scale</span>
            </h2>

            <p className="font-mono text-[10px] sm:text-xs text-qx-grey/80 uppercase tracking-[0.2em]">
              A COMPLETE SUITE FOR MODERN ENTREPRENEURS &amp; STARTUPS
            </p>
          </div>

          {/* Card Floating / Swaying Motion Keyframes */}
          <style jsx>{`
            @keyframes qxCardSway {
              0%, 100% {
                transform: translate3d(0, 0, 0) rotate(0deg);
              }
              25% {
                transform: translate3d(4px, -6px, 0) rotate(0.35deg);
              }
              50% {
                transform: translate3d(-3px, -9px, 0) rotate(-0.35deg);
              }
              75% {
                transform: translate3d(-5px, -3px, 0) rotate(0.25deg);
              }
            }
            .animate-card-sway {
              animation: qxCardSway var(--sway-dur, 6s) ease-in-out infinite var(--sway-del, 0s);
            }
            .animate-card-sway:hover {
              animation-play-state: paused;
            }
          `}</style>

          {/* Slider Container with Side Navigation Arrows & Manual Side Scroll */}
          <div className="relative flex items-center justify-center">
            
            {/* Left Nav Arrow Button */}
            <button
              type="button"
              onClick={handleScrollLeft}
              aria-label="Previous Slide"
              className="flex absolute -left-2 sm:-left-4 lg:-left-6 z-20 w-8 h-8 rounded-full border border-[#2ABD00]/40 bg-[#031306]/90 backdrop-blur-md text-[#2ABD00] items-center justify-center hover:border-[#2ABD00] hover:bg-[#2ABD00] hover:text-black transition-all shadow-[0_0_15px_rgba(0,0,0,0.8)] cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>

            {/* Horizontal Scroll Track (Scrollable via Swipe/Trackpad & Arrow Buttons) */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="overflow-x-auto scroll-smooth flex gap-3.5 sm:gap-4 lg:gap-5 w-full py-2 px-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {WHATS_COMING.items.map((item, idx) => {
                const numbers = ['01', '02', '03', '04', '05', '06'];
                const categories = ['IDEA', 'DASHBOARD', 'TEAM', 'PRODUCT', 'GROWTH', 'CAPITAL'];
                const desc = [
                  'Share your vision with us and receive expert feedback, strategic direction, and architectural validation.',
                  'Track your progress, core metrics, key milestones, and real-time revenue analytics from one dashboard.',
                  'Get hands-on support from seasoned engineering leads, senior strategists, and world-class designers.',
                  'Turn concepts into market-ready products with cutting-edge UI/UX design and scalable tech stack.',
                  'Reach your target audience with high-converting strategies, automated growth funnels and performance channels.',
                  'Connect directly with angel networks, venture funds, and early-stage capital for selected startups.',
                ];

                return (
                  <div
                    key={item.label}
                    {...reveal}
                    className="group relative overflow-hidden rounded-sm p-3.5 sm:p-4 lg:p-4.5 flex flex-col justify-between h-[225px] sm:h-[235px] w-[280px] xs:w-[320px] md:w-[calc(33.333%-14px)] shrink-0 snap-start transition-all duration-500 border border-[#2ABD00]/40 bg-gradient-to-br from-[#061d0c]/90 via-[#031106]/95 to-[#010602]/98 backdrop-blur-xl text-white shadow-[0_6px_20px_rgba(0,0,0,0.85)] hover:border-[#2ABD00] hover:shadow-[0_0_25px_rgba(42,189,0,0.4)]"
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,rgba(42,189,0,0.3),transparent_60%)]" />

                    <div className="relative z-10 grid grid-cols-12 gap-2.5 h-full items-between w-full">
                      <div className="col-span-7 sm:col-span-8 flex flex-col justify-between h-full pr-1 text-left">
                        <div>
                          <div className="mb-1 text-left">
                            <span className="font-mono text-xs sm:text-sm font-bold text-[#2ABD00]">
                              {numbers[idx]}
                            </span>
                            <div className="w-4 h-[1.5px] mt-0.5 bg-[#2ABD00]" />
                          </div>

                          <p className="font-mono text-[8px] sm:text-[9px] font-bold tracking-[0.16em] uppercase mb-1 text-qx-grey/70 text-left">
                            {categories[idx]}
                          </p>

                          <h3 className="qx-display text-xs sm:text-sm font-extrabold mb-1 leading-snug tracking-tight text-white group-hover:text-[#2ABD00] transition-colors text-left h-[36px] flex items-center">
                            {item.label}
                            {item.footnoted && <span className="text-[#2ABD00] ml-1">*</span>}
                          </h3>

                          <p className="text-[10px] sm:text-[11px] font-sans leading-relaxed text-qx-grey/85 text-left h-[54px] overflow-hidden">
                            {desc[idx]}
                          </p>
                        </div>

                        <div className="pt-2.5 mt-auto text-left">
                          <a
                            href="#qx-waitlist-form"
                            className="inline-flex items-center gap-1 font-mono text-[10px] font-bold tracking-wider text-white group-hover:text-[#2ABD00] transition-all group-hover:translate-x-1"
                          >
                            <span>Explore</span>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </a>
                        </div>
                      </div>

                      <div className="col-span-5 sm:col-span-4 flex items-center justify-center relative my-auto">
                        {idx === 0 && (
                          <div className="relative w-12 h-12 sm:w-15 sm:h-15 rounded-lg border border-[#2ABD00]/70 bg-gradient-to-br from-[#2ABD00]/30 via-[#06290e] to-[#010a04] shadow-[0_0_15px_rgba(42,189,0,0.4)] flex items-center justify-center transform rotate-6 group-hover:rotate-0 transition-transform duration-500 shrink-0">
                            <svg className="w-5 h-5 text-[#2ABD00] filter drop-shadow-[0_0_6px_rgba(42,189,0,0.9)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 18h6" />
                              <path d="M10 22h4" />
                              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                            </svg>
                          </div>
                        )}

                        {idx === 1 && (
                          <div className="relative w-12 h-12 sm:w-15 sm:h-15 rounded-lg border border-[#2ABD00]/70 bg-gradient-to-br from-[#2ABD00]/30 via-[#06290e] to-[#010a04] shadow-[0_0_15px_rgba(42,189,0,0.4)] flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 shrink-0">
                            <svg className="w-5 h-5 text-[#2ABD00] filter drop-shadow-[0_0_6px_rgba(42,189,0,0.9)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 20V10M12 20V4M6 20v-6" />
                            </svg>
                          </div>
                        )}

                        {idx === 2 && (
                          <div className="relative w-12 h-12 sm:w-15 sm:h-15 rounded-lg border border-[#2ABD00]/70 bg-gradient-to-br from-[#2ABD00]/30 via-[#06290e] to-[#010a04] shadow-[0_0_15px_rgba(42,189,0,0.4)] flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 shrink-0">
                            <svg className="w-5 h-5 text-[#2ABD00] filter drop-shadow-[0_0_6px_rgba(42,189,0,0.9)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 1 0 7.75" />
                            </svg>
                          </div>
                        )}

                        {idx === 3 && (
                          <div className="relative w-12 h-12 sm:w-15 sm:h-15 rounded-lg border border-[#2ABD00]/70 bg-gradient-to-br from-[#2ABD00]/30 via-[#06290e] to-[#010a04] shadow-[0_0_15px_rgba(42,189,0,0.4)] flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500 shrink-0">
                            <svg className="w-5 h-5 text-[#2ABD00] filter drop-shadow-[0_0_6px_rgba(42,189,0,0.9)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
                            </svg>
                          </div>
                        )}

                        {idx === 4 && (
                          <div className="relative w-12 h-12 sm:w-15 sm:h-15 rounded-lg border border-[#2ABD00]/70 bg-gradient-to-br from-[#2ABD00]/30 via-[#06290e] to-[#010a04] shadow-[0_0_15px_rgba(42,189,0,0.4)] flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 shrink-0">
                            <svg className="w-5 h-5 text-[#2ABD00] filter drop-shadow-[0_0_6px_rgba(42,189,0,0.9)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="12" width="4" height="8" rx="1" />
                              <rect x="10" y="8" width="4" height="12" rx="1" />
                              <rect x="17" y="4" width="4" height="16" rx="1" />
                              <path d="M 3 10 Q 10 6 19 2" stroke="currentColor" strokeWidth="1.75" fill="none" />
                              <polyline points="15 2 19 2 19 6" />
                            </svg>
                          </div>
                        )}

                        {idx === 5 && (
                          <div className="relative w-12 h-12 sm:w-15 sm:h-15 rounded-lg border border-[#2ABD00]/70 bg-gradient-to-br from-[#2ABD00]/30 via-[#06290e] to-[#010a04] shadow-[0_0_15px_rgba(42,189,0,0.4)] flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 shrink-0">
                            <svg className="w-5 h-5 text-[#2ABD00] filter drop-shadow-[0_0_6px_rgba(42,189,0,0.9)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Nav Arrow Button */}
            <button
              type="button"
              onClick={handleScrollRight}
              aria-label="Next Slide"
              className="flex absolute -right-2 sm:-right-4 lg:-right-6 z-20 w-8 h-8 rounded-full border border-[#2ABD00]/40 bg-[#031306]/90 backdrop-blur-md text-[#2ABD00] items-center justify-center hover:border-[#2ABD00] hover:bg-[#2ABD00] hover:text-black transition-all shadow-[0_0_15px_rgba(0,0,0,0.8)] cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

          </div>

          {/* Quick Scroll Indicator Buttons */}
          <div className="flex items-center justify-center gap-2.5 mt-6">
            <button
              type="button"
              onClick={() => scrollToPage(0)}
              aria-label="Scroll to Page 1"
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === 0
                  ? 'w-10 bg-[#2ABD00] shadow-[0_0_12px_rgba(42,189,0,0.8)]'
                  : 'w-6 bg-[#2ABD00]/30 hover:bg-[#2ABD00]/70'
              }`}
            />
            <button
              type="button"
              onClick={() => scrollToPage(1)}
              aria-label="Scroll to Page 2"
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === 1
                  ? 'w-10 bg-[#2ABD00] shadow-[0_0_12px_rgba(42,189,0,0.8)]'
                  : 'w-6 bg-[#2ABD00]/30 hover:bg-[#2ABD00]/70'
              }`}
            />
          </div>


        </div>
      </section>

      {/* ================================================================
          SECTION 3: EARLY ACCESS BANNER ("EARLY ACCESS") — 1:1 MATCH TO IMAGE 1
          ================================================================ */}
      <section aria-labelledby="early-access-title" className="relative py-8 sm:py-16 lg:py-20">
        <div className="relative mx-auto max-w-[var(--qx-shell)] px-3 sm:px-4 md:px-6">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#2ABD00]/40 bg-gradient-to-br from-[#061d0c]/90 via-[#031106]/95 to-[#010602]/98 px-3.5 py-5 sm:p-10 lg:p-12 shadow-[0_15px_50px_rgba(0,0,0,0.9)]">
            
            {/* Ambient Liquid Wave & Circular Glow Background */}
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_top_right,rgba(42,189,0,0.35),transparent_65%)]" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
              
              {/* Left Column: Heading, Copy & Action Buttons */}
              <div {...reveal} className="lg:col-span-7 flex flex-col items-start">
                
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-[2px] w-6 bg-[#2ABD00]" />
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#2ABD00] font-bold">
                    {EARLY_ACCESS.heading}
                  </span>
                </div>

                {/* Main Headline */}
                <h2 id="early-access-title" className="qx-display text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-3 sm:mb-5">
                  Be Among the{' '}
                  <span className="text-[#2ABD00] block xs:inline sm:block">First 100 Startups</span>
                </h2>

                {/* Description Copy */}
                <div className="space-y-3 text-xs sm:text-sm md:text-base text-qx-grey/90 font-sans leading-relaxed mb-6 sm:mb-8 max-w-[480px]">
                  {EARLY_ACCESS.copy.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>

                {/* MOBILE FEATURE CARDS (< lg View: 3 Vertical Feature Card Rows matching image) */}
                <div className="flex lg:hidden flex-col gap-3 w-full mb-6">
                  {/* Pod 1: Priority Onboarding */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-sm border border-[#2ABD00]/35 bg-[#041909]/95">
                    <div className="w-8 h-8 rounded-full bg-[#2ABD00]/20 text-[#2ABD00] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(42,189,0,0.3)]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                      </svg>
                    </div>
                    <span className="font-mono text-xs font-bold text-white tracking-wide">
                      Priority Onboarding
                    </span>
                  </div>

                  {/* Pod 2: Early Access */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-sm border border-[#2ABD00]/35 bg-[#041909]/95">
                    <div className="w-8 h-8 rounded-full bg-[#2ABD00]/20 text-[#2ABD00] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(42,189,0,0.3)]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </div>
                    <span className="font-mono text-xs font-bold text-white tracking-wide">
                      Early Access
                    </span>
                  </div>

                  {/* Pod 3: Support & Perks */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-sm border border-[#2ABD00]/35 bg-[#041909]/95">
                    <div className="w-8 h-8 rounded-full bg-[#2ABD00]/20 text-[#2ABD00] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(42,189,0,0.3)]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <span className="font-mono text-xs font-bold text-white tracking-wide">
                      Support &amp; Perks
                    </span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <a
                    href="#qx-waitlist-form"
                    className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#2ABD00] px-5 sm:px-6 py-2.5 sm:py-3 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-black shadow-[0_0_20px_rgba(42,189,0,0.35)] hover:shadow-[0_0_30px_rgba(42,189,0,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-full sm:w-auto"
                  >
                    <span>{EARLY_ACCESS.cta}</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>

                  <a
                    href="#qx-whats-coming"
                    className="inline-flex items-center justify-center rounded-sm border border-white/20 bg-white/5 px-5 sm:px-6 py-2.5 sm:py-3 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white hover:border-[#2ABD00]/60 hover:bg-[#2ABD00]/10 transition-all duration-300 w-full sm:w-auto text-center"
                  >
                    Learn More
                  </a>
                </div>

              </div>

              {/* DESKTOP RIGHT COLUMN: 3 Square Feature Pods matching reference design */}
              <div {...reveal} style={stagger(2)} className="hidden lg:col-span-5 lg:flex items-center justify-end relative">
                
                {/* Background Ambient Glow Arc */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[320px] h-[320px] rounded-full border border-[#2ABD00]/25 bg-[radial-gradient(circle_at_center,rgba(42,189,0,0.18)_0%,transparent_70%)] blur-2xl" />
                </div>

                {/* 3 Square Feature Cards in a row */}
                <div className="grid grid-cols-3 gap-3.5 w-full max-w-[420px] relative z-10">
                  
                  {/* Pod 1: Priority Onboarding */}
                  <div className="flex flex-col items-center justify-center text-center p-4 rounded-sm bg-[#041909]/95 border border-[#2ABD00]/40 hover:border-[#2ABD00] transition-all min-h-[140px]">
                    <div className="w-10 h-10 rounded-full bg-[#2ABD00]/20 text-[#2ABD00] flex items-center justify-center mb-3 shadow-[0_0_12px_rgba(42,189,0,0.3)] shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                      </svg>
                    </div>
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-white tracking-wider uppercase leading-tight">
                      Priority<br />Onboarding
                    </span>
                  </div>

                  {/* Pod 2: Early Access */}
                  <div className="flex flex-col items-center justify-center text-center p-4 rounded-sm bg-[#041909]/95 border border-[#2ABD00]/40 hover:border-[#2ABD00] transition-all min-h-[140px]">
                    <div className="w-10 h-10 rounded-full bg-[#2ABD00]/20 text-[#2ABD00] flex items-center justify-center mb-3 shadow-[0_0_12px_rgba(42,189,0,0.3)] shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </div>
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-white tracking-wider uppercase leading-tight">
                      Early<br />Access
                    </span>
                  </div>

                  {/* Pod 3: Support & Perks */}
                  <div className="flex flex-col items-center justify-center text-center p-4 rounded-sm bg-[#041909]/95 border border-[#2ABD00]/40 hover:border-[#2ABD00] transition-all min-h-[140px]">
                    <div className="w-10 h-10 rounded-full bg-[#2ABD00]/20 text-[#2ABD00] flex items-center justify-center mb-3 shadow-[0_0_12px_rgba(42,189,0,0.3)] shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-white tracking-wider uppercase leading-tight">
                      Support<br />&amp; Perks
                    </span>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ================================================================
          SECTION 4: WAITLIST FORM ("JOIN THE WAITLIST") — 1:1 MATCH TO SCREENSHOT
          ================================================================ */}
      <section id="qx-waitlist-form" aria-labelledby="waitlist-form-title" className="relative py-8 sm:py-14 lg:py-18">
        <div className="relative mx-auto max-w-[var(--qx-shell)] px-3 sm:px-4 md:px-6">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#2ABD00]/30 bg-gradient-to-br from-[#061c0b]/80 via-[#031106]/95 to-[#010602]/98 p-4 sm:p-8 lg:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            
            {/* Soft Ambient Background Wave Glow */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,rgba(42,189,0,0.25),transparent_70%)]" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center relative z-10">
              
              {/* Left Column: Headline, Description & 3 Feature Pods */}
              <div {...reveal} className="lg:col-span-5 flex flex-col items-start z-10">
                
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="h-[2px] w-5 sm:w-6 bg-[#2ABD00]" />
                  <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#2ABD00] font-bold">
                    JOIN THE WAITLIST
                  </span>
                </div>

                {/* Main Display Headline */}
                <h2 id="waitlist-form-title" className="qx-display text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-3 sm:mb-4">
                  Get <span className="text-[#2ABD00]">Early Access</span>
                </h2>

                {/* Description Paragraph */}
                <p className="text-[11px] sm:text-xs md:text-sm text-qx-grey/85 font-sans leading-relaxed max-w-[380px] sm:max-w-[420px] mb-5 sm:mb-7">
                  Be among the first 100 startups to experience Digital Growth Launchpad. Fill out the form and we&apos;ll reach out on WhatsApp or email.
                </p>

                {/* 3 Vertical Feature Pods matching reference design */}
                <div className="flex flex-col gap-3 sm:gap-3.5 w-full max-w-[420px] pt-4 border-t border-[#2ABD00]/20">
                  
                  {/* Pod 1: Priority Onboarding */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm bg-[#082b10] border border-[#2ABD00]/40 flex items-center justify-center text-[#2ABD00] shrink-0 shadow-[0_0_10px_rgba(42,189,0,0.25)]">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-mono text-[11px] sm:text-xs font-bold text-white tracking-wide">
                        Priority Onboarding
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-qx-grey/75 font-sans leading-tight">
                        Be part of the first 100 startups.
                      </span>
                    </div>
                  </div>

                  {/* Pod 2: Early Access */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm bg-[#082b10] border border-[#2ABD00]/40 flex items-center justify-center text-[#2ABD00] shrink-0 shadow-[0_0_10px_rgba(42,189,0,0.25)]">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-mono text-[11px] sm:text-xs font-bold text-white tracking-wide">
                        Early Access
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-qx-grey/75 font-sans leading-tight">
                        Get early access when we go live.
                      </span>
                    </div>
                  </div>

                  {/* Pod 3: Support & Perks */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm bg-[#082b10] border border-[#2ABD00]/40 flex items-center justify-center text-[#2ABD00] shrink-0 shadow-[0_0_10px_rgba(42,189,0,0.25)]">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-mono text-[11px] sm:text-xs font-bold text-white tracking-wide">
                        Support &amp; Perks
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-qx-grey/75 font-sans leading-tight">
                        Exclusive support and opportunities.
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Right Column: Waitlist Form Card with Input Icons */}
              <div {...reveal} style={stagger(2)} className="lg:col-span-7 w-full z-10">
                <div className="rounded-xl border border-[#2ABD00]/30 bg-[#041508]/90 p-4 sm:p-6 lg:p-7 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.85)]">
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {WAITLIST_FIELDS.map((field) => {
                      const isDropdown = field.id === 'industry';

                      return (
                        <div key={field.id}>
                          <label htmlFor={field.id} className="block font-mono text-[9px] sm:text-[10px] font-semibold text-white uppercase tracking-wider mb-1">
                            {field.label}{' '}
                            {field.required ? (
                              <span className="text-[#2ABD00]">*</span>
                            ) : (
                              <span className="text-qx-grey/70 text-[8px]">(OPTIONAL)</span>
                            )}
                          </label>

                          <div className="relative flex items-center">
                            {/* Left Input Icon */}
                            <div className="absolute left-3 text-qx-grey/70 pointer-events-none">
                              {field.id === 'full-name' && (
                                <svg className="w-3.5 h-3.5 text-qx-grey/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              )}
                              {field.id === 'email' && (
                                <svg className="w-3.5 h-3.5 text-qx-grey/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                  <polyline points="22,6 12,13 2,6" />
                                </svg>
                              )}
                              {field.id === 'whatsapp' && (
                                <svg className="w-3.5 h-3.5 text-qx-grey/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                              )}
                              {field.id === 'startup-name' && (
                                <svg className="w-3.5 h-3.5 text-qx-grey/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                                  <line x1="9" y1="6" x2="9" y2="6.01" />
                                  <line x1="15" y1="6" x2="15" y2="6.01" />
                                  <line x1="9" y1="10" x2="9" y2="10.01" />
                                  <line x1="15" y1="10" x2="15" y2="10.01" />
                                  <line x1="9" y1="14" x2="9" y2="14.01" />
                                  <line x1="15" y1="14" x2="15" y2="14.01" />
                                  <line x1="9" y1="18" x2="15" y2="18" />
                                </svg>
                              )}
                              {field.id === 'industry' && (
                                <svg className="w-3.5 h-3.5 text-qx-grey/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                              )}
                            </div>

                            {isDropdown ? (
                              <select
                                id={field.id}
                                required={field.required}
                                value={formData[field.id] || ''}
                                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                className="w-full pl-9 pr-9 py-2.5 sm:py-3 rounded-sm bg-[#020b04] border border-[#2ABD00]/35 text-xs text-white focus:outline-none focus:border-[#2ABD00] focus:ring-1 focus:ring-[#2ABD00] transition-all appearance-none cursor-pointer"
                              >
                                <option value="" disabled className="bg-[#020b04] text-qx-grey">
                                  Select your industry
                                </option>
                                <option value="Saas & Tech" className="bg-[#020b04]">SaaS &amp; Tech</option>
                                <option value="E-Commerce & Retail" className="bg-[#020b04]">E-Commerce &amp; Retail</option>
                                <option value="Fintech & Banking" className="bg-[#020b04]">Fintech &amp; Banking</option>
                                <option value="Healthcare & BioTech" className="bg-[#020b04]">Healthcare &amp; BioTech</option>
                                <option value="AI & Machine Learning" className="bg-[#020b04]">AI &amp; Machine Learning</option>
                                <option value="Agency & Services" className="bg-[#020b04]">Agency &amp; Services</option>
                                <option value="Other" className="bg-[#020b04]">Other</option>
                              </select>
                            ) : (
                              <input
                                type={field.kind}
                                id={field.id}
                                required={field.required}
                                placeholder={field.id === 'whatsapp' ? '+91 98765 43210' : `Enter your ${field.label.toLowerCase()}`}
                                value={formData[field.id] || ''}
                                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                className="w-full pl-9 pr-3.5 py-2.5 sm:py-3 rounded-sm bg-[#020b04] border border-[#2ABD00]/35 text-xs text-white placeholder:text-qx-grey/50 focus:outline-none focus:border-[#2ABD00] focus:ring-1 focus:ring-[#2ABD00] transition-all"
                              />
                            )}

                            {/* Dropdown Chevron for Industry */}
                            {isDropdown && (
                              <div className="absolute right-3 pointer-events-none text-qx-grey/70">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Neon Green Submit Button matching reference design */}
                    <button
                      type="submit"
                      className="w-full py-2.5 sm:py-3 rounded-sm bg-[#2ABD00] font-mono text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-black hover:shadow-[0_0_25px_rgba(42,189,0,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(42,189,0,0.35)] mt-2.5"
                    >
                      <span>{WAITLIST_SUBMIT}</span>
                      <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>

                    {/* Submission Toast Feedback */}
                    {isSubmitted && (
                      <div className="p-3 rounded-lg border border-[#2ABD00] bg-[#06260f] text-[#2ABD00] text-xs font-mono text-center animate-fade-in">
                        ✓ Thank you! You&apos;ve been added to the QAVYX Launchpad waitlist queue.
                      </div>
                    )}
                  </form>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
