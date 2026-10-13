'use client';

import React from 'react';
import Image from 'next/image';
import { INDUSTRY_GLYPHS } from '@/components/icons';

export interface IndustryItemData {
  id: string;
  name: string;
  bgImage?: string;
}

export const INDUSTRY_LIST_DATA: IndustryItemData[] = [
  { id: 'healthcare', name: 'Healthcare', bgImage: '/industry-bgs/healthcare.webp' },
  { id: 'restaurants', name: 'Restaurants & Cafés', bgImage: '/industry-bgs/restaurants.webp' },
  { id: 'real-estate', name: 'Real Estate', bgImage: '/industry-bgs/realestate.webp' },
  { id: 'education', name: 'Education', bgImage: '/industry-bgs/education.webp' },
  { id: 'retail', name: 'Retail', bgImage: '/industry-bgs/retail.webp' },
  { id: 'travel', name: 'Travel & Tourism', bgImage: '/industry-bgs/travel.webp' },
  { id: 'ecommerce', name: 'E-commerce', bgImage: '/industry-bgs/ecommerce.webp' },
  { id: 'professional', name: 'Professional Services', bgImage: '/industry-bgs/professional.webp' },
  { id: 'startups', name: 'Startups', bgImage: '/industry-bgs/startups.webp' },
];

interface IndustryCardProps {
  name: string;
  bgImage?: string;
}

export function IndustryCard({ name, bgImage }: IndustryCardProps) {
  const Glyph = INDUSTRY_GLYPHS[name];

  return (
    <div className="group relative flex h-[68px] sm:h-[72px] w-full items-center justify-between overflow-hidden rounded-xl border border-[#2ABD00]/30 bg-[#06180a]/90 px-3.5 sm:px-4 shadow-[0_4px_16px_rgba(0,0,0,0.6),0_0_10px_rgba(42,189,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[#2ABD00] hover:bg-[#071f0d] hover:shadow-[0_12px_28px_rgba(0,0,0,0.7),0_0_20px_rgba(42,189,0,0.25)] cursor-pointer">
      {/* Background Image Layer inside Card - Tastefully shaded (dimmed) */}
      {bgImage ? (
        <div className="absolute inset-0 pointer-events-none opacity-35 transition-all duration-500 group-hover:opacity-55 group-hover:scale-105">
          <Image
            src={bgImage}
            alt={`${name} background`}
            fill
            className="object-cover object-center filter contrast-110 brightness-85"
          />
          {/* Shaded gradient overlay for optimal legibility & subtle atmospheric depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#040e06]/92 via-[#040e06]/78 to-[#040e06]/55 group-hover:from-[#040e06]/85 group-hover:via-[#040e06]/68 group-hover:to-[#040e06]/40 transition-colors duration-300" />
        </div>
      ) : null}

      {/* Interactive Spotlight Radial Sheen on Hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_left,rgba(42,189,0,0.15),transparent_70%)]" />

      {/* Content: Left Icon + Name */}
      <div className="relative z-10 flex items-center gap-3 min-w-0 pr-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-qx-green/15 text-qx-green backdrop-blur-sm transition-all duration-300 group-hover:bg-qx-green group-hover:text-black group-hover:shadow-[0_0_14px_rgba(42,189,0,0.55)] group-hover:scale-105">
          {Glyph ? (
            <Glyph className="h-4 w-4" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-qx-green" />
          )}
        </div>
        <span className="truncate text-xs sm:text-sm font-semibold text-qx-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-colors duration-300 group-hover:text-qx-green">
          {name}
        </span>
      </div>

      {/* Right Side Arrow */}
      <div className="relative z-10 shrink-0 text-qx-white/50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-all duration-300 group-hover:text-qx-green group-hover:translate-x-1">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </div>
  );
}
