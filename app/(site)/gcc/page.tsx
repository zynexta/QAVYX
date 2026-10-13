'use client';

import React from 'react';

// Deterministic star generator for identical server and client rendering
interface StarData {
  id: number;
  left: string;
  top: string;
  size: number;
  color: string;
  glow: string;
  duration: string;
  delay: string;
  minOpacity: string;
  maxOpacity: string;
}

const generateStars = (count: number, seedOffset: number): StarData[] => {
  return Array.from({ length: count }, (_, i) => {
    const pseudo = (offset: number) => {
      const val = Math.sin((i + seedOffset) * 997.13 + offset) * 10000;
      return val - Math.floor(val);
    };

    const isGreen = pseudo(1) > 0.82;
    const isBright = pseudo(2) > 0.72;
    const size = isBright ? (isGreen ? 2.2 : 2.0) : pseudo(3) > 0.45 ? 1.5 : 1.0;

    return {
      id: i + seedOffset,
      left: `${(pseudo(4) * 100).toFixed(2)}%`,
      top: `${(pseudo(5) * 100).toFixed(2)}%`,
      size,
      color: isGreen ? '#2ABD00' : isBright ? '#FFFFFF' : '#CBD5E1',
      glow: isGreen
        ? '0 0 6px rgba(42, 189, 0, 0.9)'
        : isBright
        ? '0 0 4px rgba(255, 255, 255, 0.8)'
        : 'none',
      duration: `${(2.2 + pseudo(6) * 3.8).toFixed(1)}s`,
      delay: `${(pseudo(7) * 4).toFixed(1)}s`,
      minOpacity: (0.15 + pseudo(8) * 0.25).toFixed(2),
      maxOpacity: (0.75 + pseudo(9) * 0.25).toFixed(2),
    };
  });
};

const LAYER_SLOW = generateStars(40, 100);
const LAYER_MID = generateStars(35, 200);
const LAYER_NEAR = generateStars(25, 300);

/**
 * GCC — "COMING SOON" Page.
 * Celestial starfield atmosphere with gentle cosmic drift and clean centered typography.
 */
export default function GccPage() {
  return (
    <div className="min-h-[calc(100vh-var(--qx-nav-h,5rem))] relative flex items-center justify-center px-4 overflow-hidden bg-black select-none">
      {/* Deep Celestial Atmosphere / Ambient Space Gradient */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(8,26,12,0.4)_0%,rgba(0,0,0,0.98)_75%)]"
        aria-hidden="true"
      />

      {/* Layer 1: Distant Slow Starfield */}
      <div
        className="absolute inset-0 pointer-events-none animate-cosmic-slow"
        aria-hidden="true"
      >
        {LAYER_SLOW.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full animate-star-twinkle"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: star.glow,
              animationDuration: star.duration,
              animationDelay: star.delay,
              // Custom CSS properties for min/max opacity
              ['--min-op' as string]: star.minOpacity,
              ['--max-op' as string]: star.maxOpacity,
            }}
          />
        ))}
      </div>

      {/* Layer 2: Mid-distance Starfield */}
      <div
        className="absolute inset-0 pointer-events-none animate-cosmic-mid"
        aria-hidden="true"
      >
        {LAYER_MID.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full animate-star-twinkle"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: star.glow,
              animationDuration: star.duration,
              animationDelay: star.delay,
              ['--min-op' as string]: star.minOpacity,
              ['--max-op' as string]: star.maxOpacity,
            }}
          />
        ))}
      </div>

      {/* Layer 3: Foreground Shimmering Stars */}
      <div
        className="absolute inset-0 pointer-events-none animate-cosmic-near"
        aria-hidden="true"
      >
        {LAYER_NEAR.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full animate-star-twinkle"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: star.glow,
              animationDuration: star.duration,
              animationDelay: star.delay,
              ['--min-op' as string]: star.minOpacity,
              ['--max-op' as string]: star.maxOpacity,
            }}
          />
        ))}
      </div>

      {/* Subtle Shooting Star Streak in Deep Space */}
      <div
        className="absolute top-1/4 left-1/3 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#2ABD00]/80 to-transparent pointer-events-none animate-shooting-star"
        aria-hidden="true"
      />

      {/* Space Animation Keyframes */}
      <style jsx>{`
        @keyframes starTwinkle {
          0%,
          100% {
            opacity: var(--min-op, 0.2);
            transform: scale(0.9);
          }
          50% {
            opacity: var(--max-op, 0.95);
            transform: scale(1.15);
          }
        }
        @keyframes cosmicDriftSlow {
          0% {
            transform: translate(0px, 0px);
          }
          50% {
            transform: translate(14px, -18px);
          }
          100% {
            transform: translate(0px, 0px);
          }
        }
        @keyframes cosmicDriftMid {
          0% {
            transform: translate(0px, 0px);
          }
          50% {
            transform: translate(-18px, -26px);
          }
          100% {
            transform: translate(0px, 0px);
          }
        }
        @keyframes cosmicDriftNear {
          0% {
            transform: translate(0px, 0px);
          }
          50% {
            transform: translate(22px, -34px);
          }
          100% {
            transform: translate(0px, 0px);
          }
        }
        @keyframes shootingStarAnim {
          0%,
          82% {
            opacity: 0;
            transform: translate(-60px, -40px) rotate(-35deg) scaleX(0);
          }
          85% {
            opacity: 0.8;
            transform: translate(60px, 40px) rotate(-35deg) scaleX(1);
          }
          90% {
            opacity: 0;
            transform: translate(180px, 120px) rotate(-35deg) scaleX(1);
          }
          100% {
            opacity: 0;
            transform: translate(180px, 120px) rotate(-35deg) scaleX(0);
          }
        }
        @keyframes gccDotPulse {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
            box-shadow: 0 0 8px #2abd00;
          }
        }

        .animate-star-twinkle {
          animation: starTwinkle infinite ease-in-out;
        }
        .animate-cosmic-slow {
          animation: cosmicDriftSlow 48s ease-in-out infinite;
        }
        .animate-cosmic-mid {
          animation: cosmicDriftMid 34s ease-in-out infinite;
        }
        .animate-cosmic-near {
          animation: cosmicDriftNear 24s ease-in-out infinite;
        }
        .animate-shooting-star {
          animation: shootingStarAnim 11s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .animate-gcc-dot {
          animation: gccDotPulse 1.4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-star-twinkle,
          .animate-cosmic-slow,
          .animate-cosmic-mid,
          .animate-cosmic-near,
          .animate-shooting-star,
          .animate-gcc-dot {
            animation: none !important;
          }
        }
      `}</style>

      {/* Center Screen: Small Clean Uppercase Typography with Loading Dots */}
      <main className="relative z-10 text-center flex items-center justify-center">
        <h1
          id="gcc-hero-heading"
          className="flex items-center text-xs sm:text-sm font-sans font-medium tracking-[0.25em] uppercase text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
        >
          <span>COMING SOON</span>
          <span className="inline-flex items-center gap-1.5 ml-2.5" aria-hidden="true">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#2ABD00] animate-gcc-dot"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#2ABD00] animate-gcc-dot"
              style={{ animationDelay: '200ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#2ABD00] animate-gcc-dot"
              style={{ animationDelay: '400ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#2ABD00] animate-gcc-dot"
              style={{ animationDelay: '600ms' }}
            />
          </span>
        </h1>
      </main>
    </div>
  );
}


