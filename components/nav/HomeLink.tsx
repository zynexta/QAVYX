'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface HomeLinkProps {
  className?: string;
  children: ReactNode;
  suppressHydrationWarning?: boolean;
}

/**
 * Footer Home link - clears scroll-restore flags then navigates to /.
 * Kept as a minimal client component so Footer itself stays a server component.
 */
export function HomeLink({ className, children, suppressHydrationWarning }: HomeLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    try {
      sessionStorage.setItem('qx_scrolled_to_problem', 'true');
      sessionStorage.setItem('qx_scrolled_past_hero', 'true');
    } catch {}
    if (window.location.pathname === '/' || window.location.pathname === '') {
      e.preventDefault();
      const target = document.getElementById('the-problem') || document.getElementById('qx-launch-static');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <Link
      href="/"
      prefetch={true}
      className={className}
      onClick={handleClick}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      {children}
    </Link>
  );
}