import { motion } from 'motion/react';
import { useId } from 'react';
import { cn } from '@/lib/cn';

export function Segmented<T extends string>({ value, options, onChange, className }: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" className={cn('inline-flex rounded-[11px] border border-line bg-surface-2 p-[3px]', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn('relative inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium transition-colors', o.value === value ? 'text-ink' : 'text-muted hover:text-ink-2')}
        >
          {o.value === value && (
            <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-[8px] bg-surface shadow-card" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
          )}
          <span className="relative inline-flex items-center gap-1.5">{o.icon}{o.label}</span>
        </button>
      ))}
    </div>
  );
}
