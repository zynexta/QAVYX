'use client';

import React from 'react';

interface CustomerCardProps {
  className?: string;
}

export function CustomerCard({ className = '' }: CustomerCardProps) {
  const avatars = [
    { name: 'Alex M.', bg: 'bg-qx-green/80 text-qx-black', text: 'AM' },
    { name: 'Sarah K.', bg: 'bg-qx-green text-qx-black', text: 'SK' },
    { name: 'David R.', bg: 'bg-qx-ink-raised text-qx-white', text: 'DR' },
    { name: 'Elena V.', bg: 'bg-qx-line text-qx-white', text: 'EV' },
  ];

  return (
    <div
      className={`relative z-10 w-36 xs:w-40 sm:w-56 md:w-60 rounded-xl border border-[#2ABD00]/40 bg-[#06180a]/90 p-2 sm:p-3.5 backdrop-blur-xl shadow-[0_10px_25px_rgba(0,0,0,0.7),0_0_15px_rgba(42,189,0,0.18)] transition-all duration-300 hover:scale-105 hover:border-[#2ABD00] ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[8px] sm:text-2xs font-mono font-semibold uppercase tracking-wider text-[#919A94]">
          New Customers
        </span>
        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#2ABD00] animate-pulse shadow-[0_0_6px_#2ABD00]" />
      </div>

      <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between">
        <span className="text-base sm:text-2xl font-extrabold tracking-tight text-white">
          12K+
        </span>
      </div>

      {/* User Avatars Row */}
      <div className="mt-1.5 sm:mt-2.5 flex items-center justify-between border-t border-white/10 pt-1.5 sm:pt-2">
        <div className="flex -space-x-1.5 sm:-space-x-2 overflow-hidden">
          {avatars.map((avatar, idx) => (
            <div
              key={idx}
              className={`inline-flex h-4.5 w-4.5 sm:h-6 sm:w-6 items-center justify-center rounded-full border border-black font-mono text-[7px] sm:text-[9px] font-bold ${avatar.bg}`}
              title={avatar.name}
            >
              {avatar.text}
            </div>
          ))}
          <div className="inline-flex h-4.5 w-4.5 sm:h-6 sm:w-6 items-center justify-center rounded-full border border-black bg-[#2ABD00]/20 text-[8px] sm:text-2xs font-bold text-[#2ABD00]">
            +
          </div>
        </div>
        <span className="text-[8px] sm:text-2xs font-mono text-[#919A94]">Active</span>
      </div>
    </div>
  );
}
