import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ScrollToTopProps {
  threshold?: number;
  hasBottomBar?: boolean;
}

export default function ScrollToTop({ threshold = 400, hasBottomBar = false }: ScrollToTopProps) {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame: number | null = null;

    const handleScroll = () => {
      if (frame === null) {
        frame = window.requestAnimationFrame(() => {
          setVisible(window.scrollY > threshold);
          frame = null;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  const scrollToTop = () => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      style={
        hasBottomBar
          ? { bottom: 'calc(var(--amnabd-mobile-actions-height, 7rem) + 1rem)' }
          : undefined
      }
      aria-label={lang === 'ar' ? 'العودة إلى أعلى الصفحة' : 'Scroll to top'}
      className={`fixed end-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-300 shadow-xl backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:end-6 ${
        hasBottomBar ? 'sm:!bottom-6' : 'bottom-6'
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
