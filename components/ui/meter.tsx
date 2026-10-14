import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

/** The free uses left, as pips: lit for each one left, dim for each one spent. */
export function Meter({ remaining, limit, className, onPrimary }: { remaining: number; limit: number; className?: string; onPrimary?: boolean }) {
  const pips = Math.min(limit, 10);
  const lit = Math.round((remaining / Math.max(1, limit)) * pips);
  return (
    <span className={cn('inline-flex items-center gap-[3px]', className)} aria-label={`${remaining} of ${limit} left`}>
      {Array.from({ length: pips }, (_, i) => (
        <motion.span
          key={i}
          initial={false}
          animate={{ opacity: i < lit ? 1 : 0.28, scale: i < lit ? 1 : 0.8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30, delay: i * 0.03 }}
          className={cn('h-[6px] w-[6px] rounded-full', onPrimary ? 'bg-current' : i < lit ? 'bg-accent shadow-[0_0_8px_var(--glow)]' : 'bg-line-strong', onPrimary && i < lit && 'bg-accent dark:bg-accent-ink')}
        />
      ))}
    </span>
  );
}
