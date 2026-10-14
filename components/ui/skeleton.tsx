import { cn } from '@/lib/cn';

export const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <span className={cn('block rounded-md bg-surface-2', className)} style={{ animation: 'skeleton 1.6s ease-in-out infinite', ...style }} />
);
