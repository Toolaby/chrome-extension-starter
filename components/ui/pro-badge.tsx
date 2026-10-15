import { cn } from '@/lib/cn';

/** "PRO", with a light that runs along its edge. On a primary button, in the button's own colours, so it never melts into an accent fill. */
export function ProBadge({ className, label = 'Pro', onPrimary }: { className?: string; label?: string; onPrimary?: boolean }) {
  return (
    <span
      className={cn(
        'relative inline-flex h-[18px] items-center rounded-full px-[7px] text-[10px] font-semibold uppercase tracking-[0.08em]',
        onPrimary ? 'bg-primary-fg text-primary' : 'text-accent-ink',
        className,
      )}
      style={onPrimary ? undefined : {
        background: 'linear-gradient(90deg, var(--accent) 0%, color-mix(in oklab, var(--accent) 45%, white) 45%, var(--accent) 55%, var(--accent) 100%) 0 0 / 200% 100%',
        animation: 'shimmer 3.2s linear infinite',
      }}
    >
      {label}
    </span>
  );
}
