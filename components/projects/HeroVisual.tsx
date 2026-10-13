'use client';

import React from 'react';
import Image from 'next/image';
import { CustomerCard } from './CustomerCard';

export function HeroVisual() {
  return (
    <div className="relative flex w-full items-center justify-center lg:justify-end min-h-[220px] xs:min-h-[240px] sm:min-h-[340px] md:min-h-[380px] overflow-visible select-none py-0 my-0 mx-auto">
      {/* Background Radial Green Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center lg:justify-end">
        <div className="h-[200px] w-[200px] sm:h-[340px] sm:w-[340px] rounded-full bg-[radial-gradient(circle_at_center,rgba(42,189,0,0.18)_0%,rgba(26,122,14,0.06)_50%,rgba(0,0,0,0)_75%)] blur-2xl" />
      </div>

      {/* Orbit Graphic Lines */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center lg:justify-end">
        <svg
          className="h-[220px] w-[220px] sm:h-[360px] sm:w-[360px] opacity-25"
          viewBox="0 0 500 500"
          fill="none"
        >
          <circle
            cx="250"
            cy="250"
            r="210"
            stroke="#2ABD00"
            strokeWidth="1"
            strokeDasharray="6 8"
            className="animate-[spin_60s_linear_infinite]"
          />
          <circle
            cx="250"
            cy="250"
            r="150"
            stroke="#1a7a0e"
            strokeWidth="1"
            strokeDasharray="4 6"
            className="animate-[spin_40s_linear_infinite_reverse]"
          />
        </svg>
      </div>

      {/* Floating Card: New Customers (12K+) */}
      <div className="absolute bottom-0 left-2 xs:left-3 sm:bottom-[6%] sm:left-[2%] md:left-[4%] lg:left-[0%] z-20 transform -rotate-2 hover:rotate-0 transition-all duration-300">
        <CustomerCard />
      </div>

      {/* 3D Character Container - Shifted Right to align with Nav Controls without overflowing shell */}
      <div
        className="relative z-10 w-[250px] xs:w-[280px] sm:w-[350px] md:w-[380px] lg:w-[400px] mx-auto lg:mx-0 lg:ml-auto flex items-center justify-center pt-2 sm:pt-0 transform translate-y-1 sm:translate-y-0 transition-transform duration-500 hover:scale-[1.02]"
        style={{
          WebkitMaskImage:
            'radial-gradient(ellipse 75% 85% at 50% 50%, black 40%, rgba(0,0,0,0.85) 70%, transparent 95%)',
          maskImage:
            'radial-gradient(ellipse 75% 85% at 50% 50%, black 40%, rgba(0,0,0,0.85) 70%, transparent 95%)',
        }}
      >
        <Image
          src="/hero-3d-character.webp"
          alt="QAVYX 3D Mascot Character"
          width={440}
          height={520}
          priority
          className="w-full h-auto object-contain mx-auto filter contrast-[1.03] drop-shadow-[0_0_35px_rgba(50,255,90,0.25)]"
        />
        {/* Dark Vignette Overlay to blend any edge highlights */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,#030504_90%)]" />
      </div>
    </div>
  );
}
