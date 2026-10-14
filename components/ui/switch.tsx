import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-[22px] w-[38px] shrink-0 rounded-full border transition-colors duration-200', checked ? 'border-transparent bg-primary' : 'border-line-strong bg-surface-2')}
    >
      <motion.span
        initial={false}
        animate={{ x: checked ? 17 : 1 }}
        transition={{ type: 'spring', stiffness: 700, damping: 35 }}
        className={cn('absolute top-[1px] left-0 size-[18px] rounded-full shadow-[0_1px_2px_oklch(0_0_0/0.25)]', checked ? 'bg-primary-fg' : 'bg-surface')}
      />
    </button>
  );
}
