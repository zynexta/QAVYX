'use client';

import { useState, useRef } from 'react';
import { reveal, stagger } from '@/lib/reveal';

export function ProblemGrid() {
  const [activeMobileIndex, setActiveMobileIndex] = useState<0 | 1>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const leftCards = [
    {
      title: 'Wasted Ad Spend',
      desc: 'High spending, low returns.',
      image: '/problem-cards/card-01.webp',
      alt: 'Money burning in bin with stock market decline line',
    },
    {
      title: 'No Clear Brand Identity',
      desc: 'Your brand gets lost in the crowd.',
      image: '/problem-cards/card-03.webp',
      alt: 'Shadowy crowd with glowing green question mark figure',
    },
    {
      title: 'Hard to Reach the Right Audience',
      desc: 'Great products, wrong audience.',
      image: '/problem-cards/card-05.webp',
      alt: '3D target dartboard with glowing green bullseye',
    },
  ];

  const rightCards = [
    {
      title: 'No Proper Strategy',
      desc: 'Ideas without direction.',
      image: '/problem-cards/card-02.webp',
      alt: 'Tactical strategy map with compass and flags',
    },
    {
      title: "Tools Don't Work Together",
      desc: 'Disconnected tools slow you down.',
      image: '/problem-cards/card-04.webp',
      alt: 'Disconnected 3D puzzle pieces with broken chain',
    },
    {
      title: 'Low Results, High Effort',
      desc: 'Too much work, too little growth.',
      image: '/problem-cards/card-06.webp',
      alt: 'Silhouette pushing boulder up a mountain peak',
    },
  ];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const page = Math.round(scrollLeft / clientWidth);
      if (page === 0 || page === 1) {
        setActiveMobileIndex(page);
      }
    }
  };

  const scrollToPage = (page: 0 | 1) => {
    if (!scrollRef.current) return;
    const targetX = page * scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({ left: targetX, behavior: 'smooth' });
    setActiveMobileIndex(page);
  };

  const handleArrowClick = () => {
    const nextPage = activeMobileIndex === 0 ? 1 : 0;
    scrollToPage(nextPage);
  };

  const renderCard = (card: typeof leftCards[0], idx: number, position: 'left' | 'right') => {
    let curveClass = '';
    if (position === 'left') {
      if (idx === 0) {
        curveClass = 'lg:[transform:perspective(1100px)_rotateY(16deg)_rotate(-4deg)] lg:-translate-x-5 lg:-translate-y-4';
      } else if (idx === 1) {
        curveClass = 'lg:[transform:perspective(1100px)_rotateY(22deg)] lg:translate-x-7 z-10';
      } else {
        curveClass = 'lg:[transform:perspective(1100px)_rotateY(16deg)_rotate(4deg)] lg:translate-x-3 lg:-translate-y-3.5';
      }
    } else {
      if (idx === 0) {
        curveClass = 'lg:[transform:perspective(1100px)_rotateY(-16deg)_rotate(4deg)] lg:translate-x-5 lg:-translate-y-4';
      } else if (idx === 1) {
        curveClass = 'lg:[transform:perspective(1100px)_rotateY(-22deg)] lg:-translate-x-7 z-10';
      } else {
        curveClass = 'lg:[transform:perspective(1100px)_rotateY(-16deg)_rotate(-4deg)] lg:-translate-x-3 lg:-translate-y-3.5';
      }
    }

    const staggerIndex = position === 'left' ? idx * 2 + 2 : idx * 2 + 3;

    return (
      <div
        key={card.title}
        data-rv
        style={stagger(staggerIndex)}
        className={`group relative overflow-hidden rounded-2xl border border-white/15 bg-[#06180b]/60 px-3 py-2.5 sm:px-5 sm:py-4 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_24px_rgba(42,189,0,0.18)] backdrop-blur-xl transition-all duration-500 ease-out hover:border-qx-green/70 hover:shadow-[0_8px_36px_rgba(0,0,0,0.7),0_0_36px_rgba(42,189,0,0.4)] hover:lg:[transform:perspective(1100px)_rotateY(0deg)_scale(1.04)] hover:z-30 hover:-translate-y-0.5 flex flex-row items-center justify-between gap-2.5 h-[92px] xs:h-[102px] sm:h-[120px] lg:h-[136px] w-full ${curveClass}`}
      >
        {/* Glassmorphism Frosted Inward Highlight & Top Sheen */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-qx-green/10 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-white/20 via-qx-green/80 to-white/20 group-hover:via-qx-green transition-opacity duration-300" />

        {/* Green ambient radial glow behind artwork */}
        <div className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 w-40 h-40 bg-qx-green/25 rounded-full blur-xl transition-opacity duration-300 group-hover:bg-qx-green/45" />

        {/* Left Card Info */}
        <div className="flex flex-col justify-center h-full z-10 w-[58%] shrink-0 pr-1">
          <h3 className="qx-display font-bold text-xs xs:text-sm sm:text-base lg:text-[1.05rem] text-qx-white group-hover:text-qx-green transition-colors leading-tight tracking-tight">
            {card.title}
          </h3>
          <p className="mt-1 text-[10px] xs:text-xs text-[#a3b1a7] leading-tight line-clamp-2">
            {card.desc}
          </p>
        </div>

        {/* Right Card Graphic */}
        <div className="absolute top-0 right-0 bottom-0 w-[44%] sm:w-[45%] overflow-hidden z-0 flex items-center justify-end">
          <img
            src={card.image}
            alt={card.alt}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06180b]/90 via-[#06180b]/40 to-transparent pointer-events-none" />
        </div>
      </div>
    );
  };

  return (
    <section id="the-problem" aria-labelledby="problem-section-title" className="pt-8 sm:pt-12 lg:pt-6 pb-6 sm:pb-8 lg:pb-10 relative overflow-hidden bg-gradient-to-b from-black via-[#040e06] to-black">
      <script dangerouslySetInnerHTML={{ __html: `(function(){try{var hard=sessionStorage.getItem('qx_hard_refresh')==='true';var scrolled=sessionStorage.getItem('qx_scrolled_to_problem')==='true'||sessionStorage.getItem('qx_scrolled_past_hero')==='true';if(!hard&&scrolled){var el=document.getElementById('the-problem');if(el){var y=el.getBoundingClientRect().top+window.scrollY;if(y>0&&Math.abs(window.scrollY-y)>1){window.scrollTo(0,y);}document.documentElement.removeAttribute('data-qx-restoring-scroll');}}}catch(e){}})();` }} />
      <div {...reveal} className="relative px-4 pt-4 pb-2 sm:px-6 md:pt-6 md:pb-2 lg:px-8 max-w-[var(--qx-shell)] mx-auto">
        
        {/* Deep atmospheric green background glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-qx-green/14 rounded-full blur-[160px]" />

        {/* Section Header */}
        <div className="text-center max-w-[56rem] mx-auto mb-6 sm:mb-10 lg:mb-14 relative z-30">
          <h2 id="problem-section-title" className="qx-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-bold text-qx-white tracking-tight sm:whitespace-nowrap">
            Why Growth Feels <span className="text-qx-green drop-shadow-[0_0_18px_rgba(42,189,0,0.6)]">So Hard?</span>
          </h2>
          <div className="w-12 sm:w-16 h-[2px] bg-[#2ABD00] rounded-full mx-auto mt-3.5" />
        </div>

        {/* ================================================================
            CINEMATIC GLASSMORPHISM 3D DEPTH COMPOSITION
            BACKGROUND (z-0): Orbital rings & curved neon flow arrows
            MIDDLEGROUND (z-10): 6 Glassmorphism Cards (Side-scrolling horizontal carousel on mobile)
            FOREGROUND (z-20): Responsive Character (Half-body on mobile, full-body chair on desktop)
            ================================================================ */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-3 lg:gap-2 lg:min-h-[620px] [perspective:1200px]">
          
          {/* BACKGROUND: Concentric Neon-Green Orbital Rings & Flow Arrows */}
          <div className="pointer-events-none absolute inset-0 hidden lg:flex items-center justify-center z-0 overflow-hidden">
            <svg className="w-[1080px] h-[620px] text-qx-green" viewBox="0 0 1080 620" fill="none">
              {/* Outer Horseshoe Arc Ring */}
              <ellipse cx="540" cy="310" rx="470" ry="250" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 8" className="opacity-25" />
              {/* Inner Horseshoe Arc Ring */}
              <ellipse cx="540" cy="310" rx="360" ry="190" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 6" className="opacity-35" />

              {/* Curved Flow Arrows from Cards toward Center Character */}
              <path d="M 190 140 Q 350 200 450 240" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#qx-arrowhead)" className="opacity-50" />
              <path d="M 890 140 Q 730 200 630 240" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#qx-arrowhead)" className="opacity-50" />
              <path d="M 230 480 Q 370 400 450 350" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#qx-arrowhead)" className="opacity-50" />
              <path d="M 850 480 Q 710 400 630 350" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#qx-arrowhead)" className="opacity-50" />

              <defs>
                <marker id="qx-arrowhead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* DESKTOP LEFT WING (hidden on mobile) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-6 order-1 relative z-10">
            {leftCards.map((card, idx) => renderCard(card, idx, 'left'))}
          </div>

          {/* CENTER COLUMN (FOREGROUND z-20): RESPONSIVE CHARACTER HERO WITH ACCURATE QUESTION MARKS */}
          <div
            data-rv-character
            style={stagger(1)}
            className="lg:col-span-4 flex relative flex-col items-center justify-center pt-4 sm:pt-6 lg:py-2 order-1 lg:order-2 z-20 pointer-events-none lg:-mx-12 mb-0.5 sm:mb-1 lg:mb-0 transform translate-y-[5px]"
          >
            {/* Soft Neon Green Glow Orb Behind Character */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 lg:w-[480px] lg:h-[480px] bg-qx-green/30 rounded-full blur-3xl pointer-events-none" />

            {/* Character Image Container with Neon Green Rim Light */}
            <div className="relative z-20 w-full max-w-[280px] sm:max-w-[350px] lg:max-w-[640px] xl:max-w-[720px] flex items-center justify-center pt-0 lg:pt-12 pointer-events-auto -mb-3 lg:mb-0">
              
              {/* Glowing Question Marks floating in a half-circle halo arc around character's head */}
              <div className="absolute top-2 sm:top-3 lg:-top-16 left-[20%] sm:left-[24%] lg:left-[28%] text-qx-green font-mono text-xl sm:text-2xl lg:text-3xl font-bold select-none pointer-events-none drop-shadow-[0_0_14px_rgba(42,189,0,1)] transform -rotate-12 z-30">
                ?
              </div>
              <div className="absolute -top-4 sm:-top-5 lg:-top-24 left-1/2 -translate-x-1/2 text-qx-green font-mono text-2xl sm:text-3xl lg:text-4xl font-extrabold select-none pointer-events-none drop-shadow-[0_0_22px_rgba(42,189,0,1)] transform rotate-6 z-30">
                ?
              </div>
              <div className="absolute top-2 sm:top-3 lg:-top-14 right-[20%] sm:right-[24%] lg:right-[28%] text-qx-green font-mono text-lg sm:text-xl lg:text-2xl font-bold select-none pointer-events-none drop-shadow-[0_0_12px_rgba(42,189,0,0.9)] transform rotate-12 z-30">
                ?
              </div>

              {/* Mobile/Tablet Half-Body Character Image */}
              <img
                src="/problem-character-half.webp"
                alt="Thinking character close-up"
                className="block lg:hidden h-auto w-full object-contain transform translate-y-2 hover:scale-[1.03] transition-transform duration-500"
              />

              {/* Desktop Full-Body Sitting Chair Character Image */}
              <img
                src="/problem-character.webp"
                alt="Thinking character sitting in green chair"
                className="hidden lg:block h-auto w-full object-contain drop-shadow-[0_0_65px_rgba(42,189,0,0.65)] transform hover:scale-[1.03] transition-transform duration-500"
              />
            </div>
          </div>

          {/* DESKTOP RIGHT WING (hidden on mobile) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-6 order-3 relative z-10">
            {rightCards.map((card, idx) => renderCard(card, idx, 'right'))}
          </div>

          {/* MOBILE ONLY: SIDE-SCROLLING HORIZONTAL TOUCH CAROUSEL WITH FLOATING GLOWING RECTANGULAR ARROW */}
          <div className="flex lg:hidden flex-col w-full order-2 relative z-10">
            
            {/* Animated Floating Glassmorphism Side Scroll Rectangular Arrow Button (Centered vertically relative to 3 cards) */}
            <button
              type="button"
              onClick={handleArrowClick}
              aria-label="Scroll cards"
              className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-14 h-9 rounded-none border border-qx-green/60 bg-[#06180b]/90 text-qx-green shadow-[0_0_24px_rgba(42,189,0,0.6),0_0_12px_rgba(42,189,0,0.8)] backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer animate-pulse"
            >
              <span className="text-lg font-bold transform transition-transform duration-300">
                {activeMobileIndex === 0 ? '→' : '←'}
              </span>
            </button>

            {/* Horizontal Scroll Touch Container */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Slide 1: Cards 01, 03, 05 */}
              <div className="w-full shrink-0 snap-start snap-always flex flex-col gap-3.5 pr-2">
                {leftCards.map((card, idx) => renderCard(card, idx, 'left'))}
              </div>

              {/* Slide 2: Cards 02, 04, 06 */}
              <div className="w-full shrink-0 snap-start snap-always flex flex-col gap-3.5 pl-2">
                {rightCards.map((card, idx) => renderCard(card, idx, 'right'))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

