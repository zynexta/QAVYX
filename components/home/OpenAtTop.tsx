'use client';

import { useEffect, useLayoutEffect } from 'react';
import { activeLenis, onLenisReady } from '@/motion/lenis';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Ensures `/` opens hero at top (0,0) on hard refresh or first visit, but once
 * the user has scrolled to or past #the-problem ("Why Growth Feels So Hard?"),
 * the hero animation layer is collapsed permanently for that session:
 * - User cannot scroll back up into the hero / rocket animations.
 * - Normal refresh (F5) opens directly at #the-problem with hero hidden.
 * - Navigating to other pages (footer links, etc.) and pressing Back returns
 *   directly to #the-problem without replaying hero animations.
 * - Only a hard refresh (Ctrl+Shift+R, Ctrl+F5) resets to the hero animations.
 */
export function OpenAtTop() {
  useIsomorphicLayoutEffect(() => {
    const prevScrollRestoration =
      typeof window !== 'undefined' && 'scrollRestoration' in window.history
        ? window.history.scrollRestoration
        : null;
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    let isHardRefreshPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.shiftKey && (e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) ||
        (e.shiftKey && e.key === 'F5') ||
        (e.ctrlKey && e.key === 'F5')
      ) {
        isHardRefreshPressed = true;
        try {
          sessionStorage.removeItem('qx_scrolled_to_problem');
          sessionStorage.removeItem('qx_scrolled_past_hero');
          sessionStorage.removeItem('qx-intro-complete');
          sessionStorage.setItem('qx_hard_refresh', 'true');
        } catch {}
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: true });

    let scrolledToProblem = false;
    let isHardRefresh = false;

    try {
      if (sessionStorage.getItem('qx_hard_refresh') === 'true') {
        isHardRefresh = true;
        sessionStorage.removeItem('qx_hard_refresh');
      }
      if (
        sessionStorage.getItem('qx_scrolled_to_problem') === 'true' ||
        sessionStorage.getItem('qx_scrolled_past_hero') === 'true'
      ) {
        scrolledToProblem = true;
      }
    } catch {}

    const ensureVisibleRevealed = () => {
      try {
        const unrevealed = document.querySelectorAll('[data-reveal]:not([data-revealed])');
        unrevealed.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 1.2) {
            el.setAttribute('data-revealed', '');
          }
        });
      } catch {}
    };

    const collapseHero = (offset: number = 0) => {
      try {
        document.documentElement.setAttribute('data-qx-restore-problem', '');
        document.documentElement.setAttribute('data-qx-nav-defer', '');
        document.documentElement.setAttribute('data-qx-nav', 'on');
        document.documentElement.removeAttribute('data-qx-restoring-scroll');

        const hero = document.getElementById('qx-hero-reserve');
        if (hero) hero.style.display = 'none';
        const film = document.getElementById('qx-rocket-film');
        if (film) film.style.display = 'none';
        const staticHero = document.getElementById('qx-hero-static');
        if (staticHero) staticHero.style.display = 'none';
        const root = document.getElementById('qx-hero-root');
        if (root) root.style.display = 'none';

        import('@/motion/gsap').then(({ ScrollTrigger }) => {
          try {
            ScrollTrigger.getById('qx-pin')?.kill();
            ScrollTrigger.refresh();
          } catch {}
        }).catch(() => {});

        window.scrollTo({ top: offset, behavior: 'instant' as ScrollBehavior });
        const lenis = activeLenis();
        if (lenis) {
          lenis.scrollTo(offset, { immediate: true });
        }
        ensureVisibleRevealed();
      } catch {}
    };

    if (!isHardRefresh && !isHardRefreshPressed && scrolledToProblem) {
      collapseHero(0);
      setTimeout(() => collapseHero(0), 0);
      setTimeout(() => collapseHero(0), 50);

      window.addEventListener('load', () => collapseHero(0), { once: true });
    } else {
      window.scrollTo(0, 0);
      try {
        document.documentElement.removeAttribute('data-qx-restore-problem');
        document.documentElement.removeAttribute('data-qx-restoring-scroll');
      } catch {}
    }

    const handlePopState = () => {
      try {
        const isHard = sessionStorage.getItem('qx_hard_refresh') === 'true';
        const scrolled =
          sessionStorage.getItem('qx_scrolled_to_problem') === 'true' ||
          sessionStorage.getItem('qx_scrolled_past_hero') === 'true';
        if (!isHard && scrolled) {
          collapseHero(0);
        }
      } catch {}
    };
    window.addEventListener('popstate', handlePopState, { passive: true });

    let isHeroCollapsed = !isHardRefresh && !isHardRefreshPressed && scrolledToProblem;

    const handleScroll = () => {
      const target = document.getElementById('the-problem') || document.getElementById('qx-launch-static');
      if (!target) return;

      const rect = target.getBoundingClientRect();

      // Once #the-problem comes within view, save to sessionStorage permanently for this session
      if (rect.top <= window.innerHeight * 0.75) {
        try {
          sessionStorage.setItem('qx_scrolled_to_problem', 'true');
          sessionStorage.setItem('qx_scrolled_past_hero', 'true');
        } catch {}
      }

      // When #the-problem reaches the top of the viewport during first visit:
      if (!isHeroCollapsed) {
        if (rect.top <= 10) {
          isHeroCollapsed = true;
          const currentY = window.scrollY;
          const problemTop = rect.top + currentY;
          const offsetIntoProblem = Math.max(0, currentY - problemTop);
          collapseHero(offsetIntoProblem);
        } else {
          // If user already entered problem section but tries to scroll up into the rocket/hero:
          const isMarked =
            sessionStorage.getItem('qx_scrolled_to_problem') === 'true' ||
            sessionStorage.getItem('qx_scrolled_past_hero') === 'true';
          if (isMarked) {
            const currentY = window.scrollY;
            const problemTop = rect.top + currentY;
            // Prevent scrolling back up into the hero animations:
            if (currentY < problemTop - 100) {
              window.scrollTo({ top: problemTop, behavior: 'instant' as ScrollBehavior });
              const lenis = activeLenis();
              if (lenis) lenis.scrollTo(problemTop, { immediate: true });
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', handlePopState);
      if (prevScrollRestoration && typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = prevScrollRestoration;
      }
    };
  }, []);

  return null;
}
