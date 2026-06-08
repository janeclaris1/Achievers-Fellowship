import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

interface TypingWelcomeProps {
  text: string;
  className?: string;
  speedMs?: number;
}

const TypingWelcome: React.FC<TypingWelcomeProps> = ({ text, className, speedMs = 38 }) => {
  const [visibleLength, setVisibleLength] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setPrefersReducedMotion(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleLength(text.length);
      return;
    }

    setVisibleLength(0);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleLength(index);
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [text, speedMs, prefersReducedMotion]);

  const visible = text.slice(0, visibleLength);
  const isComplete = visibleLength >= text.length;

  return (
    <h1
      className={cn(
        'text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 min-h-[2rem] leading-relaxed',
        className
      )}
      aria-label={text}
    >
      {visible}
      <span
        className={cn(
          'inline-block w-[2px] h-[1.05em] bg-slate-900 dark:bg-slate-100 ml-0.5 align-[-0.15em]',
          isComplete && 'animate-typing-cursor'
        )}
        aria-hidden
      />
    </h1>
  );
};

export default TypingWelcome;
