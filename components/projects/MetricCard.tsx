'use client';

import React from 'react';

interface MetricCardProps {
  value: string;
  label: string;
  sublabel?: string;
  className?: string;
}

export function MetricCard({ value, label, sublabel, className = '' }: MetricCardProps) {
  return (
    <div
      className={`relative z-10 min-w-[95px] sm:min-w-[110px] rounded-lg border border-qx-green/25 bg-qx-ink/90 px-2 py-1.5 backdrop-blur-xl shadow-[0_4px_15px_rgba(0,0,0,0.6),0_0_10px_rgba(42,189,0,0.12)] transition-all duration-300 hover:scale-105 hover:border-qx-green/45 ${className}`}
    >
      <div className="text-xs sm:text-sm font-bold tracking-tight text-qx-green drop-shadow-[0_0_6px_rgba(42,189,0,0.35)]">
        {value}
      </div>
      <div className="mt-0.5 text-[9px] sm:text-[10px] font-medium text-qx-white leading-tight">
        {label}
      </div>
      {sublabel && (
        <div className="text-[8px] text-qx-grey font-mono mt-0.5">{sublabel}</div>
      )}
    </div>
  );
}
