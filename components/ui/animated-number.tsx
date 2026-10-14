import { animate, useMotionValue, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

/** A number that counts up to its value, in tabular figures. */
export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString(), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) { mv.set(value); if (ref.current) ref.current.textContent = format(value); return; }
    const controls = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = format(v); } });
    return () => controls.stop();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps -- format is a pure display function
  return <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>{format(0)}</span>;
}
