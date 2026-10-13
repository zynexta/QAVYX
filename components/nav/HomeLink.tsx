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
  const handleClick = () => {
    try {
      sessionStorage.removeItem('qx_scrolled_to_problem');
      sessionStorage.removeItem('qx_scrolled_past_hero');
      sessionStorage.removeItem('qx-intro-complete');
      document.documentElement.removeAttribute('data-qx-restore-problem');
      document.documentElement.removeAttribute('data-qx-restoring-scroll');
    } catch {}
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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