'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  /** Target value to count towards. */
  value: number;
  /** Start value (usually the "today" number). Defaults to value (no animation). */
  from?: number;
  /** Formats the displayed number. Defaults to raw rounded value. */
  format?: (n: number) => string;
  /** Animation duration in ms. */
  duration?: number;
  className?: string;
}

/**
 * CountUp — animates a number from `from` → `value` on mount/value change.
 * Purely presentational: engine output stays the single source of truth.
 * Respects prefers-reduced-motion (renders final value instantly).
 */
export default function CountUp({ value, from, format, duration = 900, className }: CountUpProps) {
  const start = from ?? value;
  const prefersReduced = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Reduced-motion users start at the final value — no animation, no effect setState.
  const [display, setDisplay] = useState(() => (prefersReduced() ? value : start));
  const raf = useRef<number>(0);
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString('en-IN'));

  useEffect(() => {
    if (prefersReduced()) return;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      // easeOutCubic — fast start, soft landing on the verdict number.
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (value - start) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{fmt(display)}</span>;
}
