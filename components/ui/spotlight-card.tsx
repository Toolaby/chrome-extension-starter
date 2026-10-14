import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** A card with a soft light that follows the pointer across it, and lights its edge as it passes. */
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty('--x', `${e.clientX - r.left}px`);
    ref.current!.style.setProperty('--y', `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onPointerMove={move} className={cn('group relative overflow-hidden rounded-[18px] border border-line bg-surface p-5 shadow-card', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(320px circle at var(--x) var(--y), var(--glow), transparent 60%)' }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[18px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ padding: 1, background: 'radial-gradient(240px circle at var(--x) var(--y), var(--accent), transparent 60%)', WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
      <div className="relative">{children}</div>
    </div>
  );
}
