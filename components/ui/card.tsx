import { cn } from '@/lib/cn';

export const Card = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-[16px] border border-line bg-surface shadow-card', className)} {...rest} />
);
