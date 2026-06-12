import { useState, useEffect, useRef } from 'react';

// Animate a number from 0 → target with an ease-out curve. Honors reduced-motion.
export default function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef();

  useEffect(() => {
    const safeTarget = Number(target) || 0;
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setVal(safeTarget); return; }

    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(safeTarget * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return val;
}
