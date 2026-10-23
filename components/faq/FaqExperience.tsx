'use client';

import React, { useId, useMemo, useState } from 'react';
import { FAQS } from '@/content/faq';
import { FinalCta } from '@/components/home/FinalCta';
import { FaqHeroVisual } from './FaqHeroVisual';

export type FaqCategory =
  | 'all'
  | 'services'
  | 'process'
  | 'pricing'
  | 'industries'
  | 'support'
  | 'general';

interface CategoryConfig {
  id: FaqCategory;
  label: string;
  icon: (props: { className?: string }) => React.JSX.Element;
}

// Category mappings for the 13 accordion questions (FAQS[1..13])
const CATEGORY_MAP: Record<string, FaqCategory[]> = {
  'how-is-qavyx-different': ['process', 'general', 'services'],
  'do-i-need-all-services': ['services', 'pricing'],
  'do-you-work-with-startups': ['industries', 'general'],
  'which-industries': ['industries', 'services'],
  'only-india': ['general', 'support'],
  'how-long-for-results': ['process', 'services'],
  'manage-everything': ['services', 'support'],
  'ai-and-whatsapp': ['services', 'support'],
  'websites-and-landing-pages': ['services'],
  'how-much': ['pricing'],
  'how-do-i-start': ['process', 'general'],
  'start-with-one-service': ['pricing', 'services'],
  'why-choose-qavyx': ['general', 'services'],
};

// SVG Icons for Category Pills
function AllIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ServicesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3H4V6z" />
      <path d="M4 11h7v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7z" />
      <path d="M13 11h7v7a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-7z" />
    </svg>
  );
}

function ProcessIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.12 6.4-6.05-3.5a2 2 0 0 0-2.14 0L6.88 6.4a2 2 0 0 0-1 1.73v7a2 2 0 0 0 1 1.73l6.05 3.5a2 2 0 0 0 2.14 0l6.05-3.5a2 2 0 0 0 1-1.73v-7a2 2 0 0 0-1-1.73z" />
      <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
      <polyline points="7.5 19.79 7.5 14.6 3 12" />
      <polyline points="21 12 16.5 14.6 16.5 19.79" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function PricingIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function IndustriesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <path d="M9 9h1" />
      <path d="M9 13h1" />
      <path d="M9 17h1" />
      <path d="M14 9h1" />
      <path d="M14 13h1" />
      <path d="M14 17h1" />
    </svg>
  );
}

function SupportIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function GeneralIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
      <polyline points="11 12 12 12 12 16 13 16" />
    </svg>
  );
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'all', label: 'All', icon: AllIcon },
  { id: 'services', label: 'Services', icon: ServicesIcon },
  { id: 'process', label: 'Process', icon: ProcessIcon },
  { id: 'pricing', label: 'Pricing', icon: PricingIcon },
  { id: 'industries', label: 'Industries', icon: IndustriesIcon },
  { id: 'support', label: 'Support', icon: SupportIcon },
  { id: 'general', label: 'General', icon: GeneralIcon },
];

export function FaqExperience() {
  const searchInputId = useId();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('all');
  // Card 01 open by default as shown in the reference design
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // The 13 FAQ questions from the reference design & specification (indices 1 to 13 of FAQS)
  const baseFaqs = useMemo(() => {
    return FAQS.slice(1).map((item, idx) => ({
      ...item,
      number: String(idx + 1).padStart(2, '0'),
      index: idx,
      categories: CATEGORY_MAP[item.id] || ['general', 'services'],
    }));
  }, []);

  // Filtered FAQs based on category AND search query
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return baseFaqs.filter((item) => {
      // Category match
      const matchesCategory =
        activeCategory === 'all' || item.categories.includes(activeCategory);
      if (!matchesCategory) return false;

      // Search query match
      if (!q) return true;
      const matchQuestion = item.question.toLowerCase().includes(q);
      const matchAnswer = item.answer.toLowerCase().includes(q);
      return matchQuestion || matchAnswer;
    });
  }, [baseFaqs, activeCategory, searchQuery]);

  const toggleAccordion = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
  };

  return (
    <div className="relative w-full overflow-x-clip text-white">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#2abd00]/[0.04] blur-[140px] rounded-full"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-[#1a7a0e]/[0.03] blur-[150px] rounded-full"
        aria-hidden="true"
      />

      {/* Main Container Shell */}
      <div className="relative mx-auto max-w-[var(--qx-shell)] px-3 sm:px-4 md:px-6 py-6 sm:py-10 md:py-14">
        {/* =========================================================================
            1. HERO SECTION
           ========================================================================= */}
        {/* =========================================================================
            1. HERO SECTION (Compact, elegant, matching reference)
           ========================================================================= */}
        <section className="relative mb-4 sm:mb-6 lg:mb-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 flex flex-col items-start">
              {/* Main Heading */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-white leading-[1.14] mb-3">
                Got Questions?
                <br />
                We’ve Got <span className="text-[#2abd00]">Answers.</span>
              </h1>

              {/* Supporting Description */}
              <p className="text-xs sm:text-sm md:text-[15px] text-[#919a94] max-w-[520px] leading-relaxed font-sans font-normal">
                Find everything you need to know about working with QAVYX, our services, process, pricing and more.
              </p>
            </div>

            {/* Right Abstract 3D Glassmorphic Visual (Animated Q&A Cards with Neon Spline matching reference) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative select-none">
              <FaqHeroVisual />
            </div>
          </div>
        </section>

        {/* =========================================================================
            2 & 3. STICKY CONTROLS: SEARCH BAR + CATEGORY FILTERS
            Stays pinned below the header as the questions scroll
           ========================================================================= */}
        <div className="sticky top-[var(--qx-nav-h,64px)] z-30 bg-black/95 backdrop-blur-md pt-2 pb-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 border-b border-white/[0.08] mb-5 sm:mb-6 transition-all">
          {/* Functional Search Bar with squarish radius */}
          <div className="relative flex items-center w-full bg-[#0a0c0b]/90 border border-[#1e2320] focus-within:border-[#2abd00] focus-within:shadow-[0_0_20px_rgba(42,189,0,0.18)] rounded-xl px-3.5 py-2 sm:py-2.5 transition-all duration-300 mb-2">
            {/* Search Icon */}
            <label htmlFor={searchInputId} className="cursor-pointer text-[#919a94] mr-2.5 shrink-0">
              <svg
                className="w-4 h-4 text-[#919a94]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="sr-only">Search</span>
            </label>

            {/* Input field */}
            <input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your question..."
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-[#616864] focus:outline-none"
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search query"
                className="p-1 mr-2 text-[#919a94] hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}

            {/* Green Action Button */}
            <button
              type="button"
              aria-label="Submit search"
              className="w-[28px] h-[28px] min-w-[28px] min-h-[28px] rounded-lg bg-[#2abd00] text-black hover:bg-[#239f00] flex items-center justify-center font-bold transition-all duration-200 hover:scale-105 shrink-0 shadow-[0_0_12px_rgba(42,189,0,0.35)]"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          {/* Category Filters: Square buttons, centered and responsive wrap without scrolling */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 pb-1">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border border-[#2abd00] bg-[#2abd00]/15 text-white shadow-[0_0_12px_rgba(42,189,0,0.2)]'
                      : 'border border-[#1e2320] bg-[#0a0c0b]/90 text-[#919a94] hover:text-white hover:border-[#1a7a0e]/60 hover:bg-[#0e1410]'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2abd00]' : 'text-[#86b881]'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            4. MAIN FAQ ACCORDION LIST & BOTTOM CONTACT CTA
           ========================================================================= */}
        <section className="relative w-full max-w-[880px] mx-auto flex flex-col gap-2.5">
          {filteredFaqs.length === 0 ? (
            /* Clean Empty State */
            <div className="rounded-xl sm:rounded-2xl border border-[#1e2320] bg-[#0a0c0b]/80 p-8 sm:p-12 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-lg border border-[#1a7a0e]/40 bg-[#071306] flex items-center justify-center text-[#2abd00] mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                No questions found
              </h3>
              <p className="text-xs sm:text-sm text-[#919a94] max-w-sm mb-5">
                We couldn’t find any questions matching &ldquo;{searchQuery}&rdquo;. Try another term or reset the filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg sm:rounded-xl border border-[#2abd00] bg-[#2abd00]/10 hover:bg-[#2abd00] text-[#2abd00] hover:text-black text-xs font-mono tracking-wider transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openIndex === faq.index;
              const panelId = `faq-panel-${faq.id}`;
              const triggerId = `faq-trigger-${faq.id}`;

              return (
                <div
                  key={faq.id}
                  id={faq.id}
                  className={`rounded-xl sm:rounded-2xl transition-all duration-200 border ${
                    isOpen
                      ? 'border-[#2abd00] bg-[#0c130f] shadow-[0_0_16px_rgba(42,189,0,0.08)]'
                      : 'border-[#1e2320] bg-[#0a0c0b]/90 hover:border-[#1a7a0e]/60 hover:bg-[#0c100e]'
                  } px-3.5 py-2.5 sm:px-4 sm:py-3`}
                >
                  <button
                    id={triggerId}
                    type="button"
                    onClick={() => toggleAccordion(faq.index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between gap-3 text-left cursor-pointer group py-0"
                  >
                    {/* Left: Number Badge + Question */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span
                        className={`shrink-0 font-mono text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md transition-colors ${
                          isOpen
                            ? 'text-[#2abd00] bg-[#2abd00]/15 border border-[#2abd00]/40 font-semibold'
                            : 'text-[#919a94] bg-white/[0.04] border border-white/10 group-hover:text-white group-hover:border-white/20'
                        }`}
                      >
                        {faq.number}
                      </span>
                      <span
                        className={`text-[13px] sm:text-[14px] md:text-[15px] font-medium tracking-tight transition-colors leading-snug ${
                          isOpen ? 'text-white font-semibold' : 'text-white/90 group-hover:text-white'
                        }`}
                      >
                        {faq.question}
                      </span>
                    </div>

                    {/* Right: Small sleek toggle button (Strict 24px, subtle circle, small 10px icon) */}
                    <span
                      className={`w-[24px] h-[24px] min-w-[24px] min-h-[24px] max-w-[24px] max-h-[24px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                        isOpen
                          ? 'border border-[#2abd00] bg-[#2abd00]/20 text-[#2abd00]'
                          : 'border border-white/20 text-white/70 group-hover:border-[#2abd00] group-hover:text-[#2abd00]'
                      }`}
                      aria-hidden="true"
                    >
                      {isOpen ? (
                        <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      ) : (
                        <svg className="w-[10px] h-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </span>
                  </button>

                  {/* Expandable Answer with smooth grid transition */}
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    className={`grid transition-all duration-300 ease-out overflow-hidden ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pt-2 sm:pt-2.5 mt-2 border-t border-white/5 pl-8 sm:pl-9 pr-2 sm:pr-4 pb-1">
                        <p className="text-xs sm:text-[13px] text-[#a0a0a0] leading-relaxed font-sans">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

        </section>
      </div>

      {/* 3. Final Growth CTA Container (Same as Homepage) */}
      <FinalCta />
    </div>
  );
}
