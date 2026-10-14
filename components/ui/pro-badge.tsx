import { cn } from '@/lib/cn';

/** "PRO", with a light that runs along its edge. */
export function ProBadge({ className, label = 'Pro' }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex h-[18px] items-center rounded-full px-[7px] text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-ink',
        className,
      )}
      style={{
        background: 'linear-gradient(90deg, var(--accent) 0%, oklch(0.97 0.12 121) 45%, var(--accent) 55%, var(--accent) 100%) 0 0 / 200% 100%',
        animation: 'shimmer 3.2s linear infinite',
      }}
    >
      {label}
    </span>
  );
}
