'use client';

import { useEffect, useLayoutEffect } from 'react';
import { activeLenis, onLenisReady } from '@/motion/lenis';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Ensures `/` opens hero at top (0,0) on hard refresh or first visit, but whenever
 * user performs a normal refresh after scrolling past hero, positions directly at
 * #the-problem ("Why Growth Feels So Hard?") and re-triggers section entrance animations.
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

    const getProblemScrollY = (): number | null => {
      const target =
        document.getElementById('the-problem') ||
        document.getElementById('qx-launch-static') ||
        document.getElementById('qx-trust');
      if (target) {
        const rect = target.getBoundingClientRect();
        return rect.top + window.scrollY;
      }
      return null;
    };

    type ScrollTriggerType = (typeof import('@/motion/gsap'))['ScrollTrigger'];
    let stRef: ScrollTriggerType | null = null;
    let cancelled = false;

    const scrollToProblemStart = () => {
      const targetY = getProblemScrollY();
      if (targetY !== null && targetY > 0) {
        if (Math.abs(window.scrollY - targetY) > 1) {
          window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
        }

        const lenis = activeLenis();
        if (lenis && Math.abs(lenis.scroll - targetY) > 1) {
          lenis.scrollTo(targetY, { immediate: true });
        }

        if (stRef) {
          try {
            stRef.update();
          } catch {}
        }

        ensureVisibleRevealed();
        try {
          document.documentElement.removeAttribute('data-qx-restoring-scroll');
        } catch {}
        return true;
      }
      return false;
    };
    let removeRefreshListener: (() => void) | null = null;
    let removeLenisListener: (() => void) | null = null;
    let userScrolled = false;

    const onUserInteraction = () => {
      userScrolled = true;
    };

    window.addEventListener('wheel', onUserInteraction, { passive: true, once: true });
    window.addEventListener('touchstart', onUserInteraction, { passive: true, once: true });

    if (!isHardRefresh && !isHardRefreshPressed && scrolledToProblem) {
      document.documentElement.setAttribute('data-qx-restore-problem', '');
      document.documentElement.setAttribute('data-qx-restoring-scroll', '');
      document.documentElement.setAttribute('data-qx-nav-defer', '');
      document.documentElement.setAttribute('data-qx-nav', 'on');

      // Run immediate scroll attempt
      scrollToProblemStart();
      setTimeout(() => {
        if (!cancelled && !userScrolled) {
          scrollToProblemStart();
        }
      }, 0);

      import('@/motion/gsap').then(({ ScrollTrigger: st }) => {
        if (cancelled) return;
        stRef = st;
        try {
          st.update();
        } catch {}

        const onRefresh = () => {
          if (!userScrolled) {
            const targetY = getProblemScrollY();
            if (targetY !== null && Math.abs(window.scrollY - targetY) > 1) {
              scrollToProblemStart();
            }
          }
        };

        try {
          st.addEventListener('refresh', onRefresh);
          removeRefreshListener = () => {
            try {
              st.removeEventListener('refresh', onRefresh);
            } catch {}
          };
        } catch {}
      }).catch(() => {});

      try {
        removeLenisListener = onLenisReady((lenis) => {
          if (!userScrolled) {
            const targetY = getProblemScrollY();
            if (targetY !== null && targetY > 0 && Math.abs(lenis.scroll - targetY) > 1) {
              lenis.scrollTo(targetY, { immediate: true });
            }
          }
        });
      } catch {}

      window.addEventListener('load', () => {
        if (!userScrolled) {
          const targetY = getProblemScrollY();
          if (targetY !== null && Math.abs(window.scrollY - targetY) > 1) {
            scrollToProblemStart();
          }
        }
      }, { once: true });
    } else {
      window.scrollTo(0, 0);
      try {
        sessionStorage.removeItem('qx_scrolled_to_problem');
        sessionStorage.removeItem('qx_scrolled_past_hero');
        document.documentElement.removeAttribute('data-qx-restore-problem');
        document.documentElement.removeAttribute('data-qx-restoring-scroll');
      } catch {}
    }

    const handlePopState = () => {
      try {
        const scrolled =
          sessionStorage.getItem('qx_scrolled_to_problem') === 'true' ||
          sessionStorage.getItem('qx_scrolled_past_hero') === 'true';
        if (scrolled) {
          document.documentElement.setAttribute('data-qx-restore-problem', '');
          document.documentElement.setAttribute('data-qx-restoring-scroll', '');
          document.documentElement.setAttribute('data-qx-nav-defer', '');
          document.documentElement.setAttribute('data-qx-nav', 'on');
          scrollToProblemStart();
        }
      } catch {}
    };
    window.addEventListener('popstate', handlePopState, { passive: true });

    const handleScroll = () => {
      const currentY = window.scrollY;
      const target = document.getElementById('the-problem');
      if (target) {
        const rect = target.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.8) {
          try {
            sessionStorage.setItem('qx_scrolled_to_problem', 'true');
            sessionStorage.setItem('qx_scrolled_past_hero', 'true');
          } catch {}
        } else if (currentY < 200 && userScrolled) {
          try {
            sessionStorage.removeItem('qx_scrolled_to_problem');
            sessionStorage.removeItem('qx_scrolled_past_hero');
            document.documentElement.removeAttribute('data-qx-restore-problem');
            document.documentElement.removeAttribute('data-qx-restoring-scroll');
          } catch {}
        }
      } else if (currentY < 200 && userScrolled) {
        try {
          sessionStorage.removeItem('qx_scrolled_to_problem');
          sessionStorage.removeItem('qx_scrolled_past_hero');
          document.documentElement.removeAttribute('data-qx-restore-problem');
          document.documentElement.removeAttribute('data-qx-restoring-scroll');
        } catch {}
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      cancelled = true;
      if (removeRefreshListener) removeRefreshListener();
      if (removeLenisListener) removeLenisListener();
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('wheel', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', handlePopState);
      if (prevScrollRestoration && typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = prevScrollRestoration;
      }
    };
  }, []);

  return null;
}
