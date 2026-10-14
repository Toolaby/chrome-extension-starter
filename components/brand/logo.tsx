import { cn } from '@/lib/cn';

/** Glance's mark: a lens on ink, with a spark where the light catches it. Replace it with yours. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden>
      <defs>
        <radialGradient id="glance-lens" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="oklch(0.97 0.13 121)" />
          <stop offset="1" stopColor="oklch(0.86 0.21 128)" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="oklch(0.18 0.006 270)" />
      <rect x=".5" y=".5" width="31" height="31" rx="8.5" fill="none" stroke="oklch(1 0 0 / .08)" />
      <circle cx="16" cy="16.5" r="7.25" fill="none" stroke="url(#glance-lens)" strokeWidth="3" />
      <circle cx="22.6" cy="9.4" r="2.1" fill="oklch(0.95 0.17 121)" />
    </svg>
  );
}
