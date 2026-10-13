'use client';

import React from 'react';

interface GrowthCurveProps {
  className?: string;
}

export function GrowthCurve({ className = '' }: GrowthCurveProps) {
  return (
    <div className={`relative w-full h-full pointer-events-none ${className}`}>
      <svg
        className="w-full h-full overflow-visible"
        viewBox="0 0 400 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a7a0e" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#2ABD00" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2ABD00" stopOpacity="1" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="6"
            refY="5"
            orient="auto"
          >
            <polygon points="0 0, 10 5, 0 10" fill="#2ABD00" />
          </marker>
        </defs>

        {/* Shadow / Area fill below curve */}
        <path
          d="M 20 170 Q 120 160 200 110 T 370 20 L 370 190 L 20 190 Z"
          fill="url(#curveGradient)"
          fillOpacity="0.12"
        />

        {/* Main Growth Curve Line */}
        <path
          d="M 20 170 Q 120 160 200 110 T 370 20"
          stroke="url(#curveGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#glow)"
          markerEnd="url(#arrowhead)"
        />

        {/* Pulsing Dots along the curve */}
        <circle cx="20" cy="170" r="4" fill="#1a7a0e" />
        <circle cx="200" cy="110" r="5" fill="#2ABD00" className="animate-ping" />
        <circle cx="200" cy="110" r="5" fill="#2ABD00" />
        <circle cx="370" cy="20" r="6" fill="#2ABD00" className="animate-pulse" />
      </svg>
    </div>
  );
}
