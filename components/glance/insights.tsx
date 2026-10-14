import { motion } from 'motion/react';
import { Image, Link2, ListTree, Type } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { readTime } from '@/lib/format';
import type { Insights } from '@/lib/page';

/** The read time, large, and the four counts under it. */
export function InsightsHero({ insights, compact }: { insights: Insights; compact?: boolean }) {
  const t = readTime(insights.minutes);
  const stats = [
    { icon: Type, label: 'Words', value: insights.words },
    { icon: ListTree, label: 'Headings', value: insights.headings.length },
    { icon: Link2, label: 'Links', value: insights.links },
    { icon: Image, label: 'Images', value: insights.images },
  ];
  return (
    <div className="relative">
      <div className="flex items-end gap-2">
        <span className={cn('font-semibold leading-[0.85] tracking-[-0.05em] text-ink', compact ? 'text-[56px]' : 'text-[72px]')}>
          {t.value === '<1' || t.value.includes(':') ? t.value : <AnimatedNumber value={Number(t.value)} />}
        </span>
        <span className={cn('flex flex-col leading-tight', compact ? 'mb-1.5' : 'mb-3')}>
          <span className="text-[13px] font-medium text-ink">{t.unit} read</span>
          <span className="text-[12px] text-muted">at 238 words a minute</span>
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-4 overflow-hidden rounded-[14px] border border-line bg-surface">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05, type: 'spring', stiffness: 400, damping: 32 }}
            className={cn('flex flex-col gap-1 px-3 py-2.5', i > 0 && 'border-l border-line')}
          >
            <dt className="flex items-center gap-1 text-[11px] text-muted"><s.icon className="size-3 shrink-0" />{s.label}</dt>
            <dd className="text-[15px] font-semibold tracking-[-0.02em] text-ink"><AnimatedNumber value={s.value} /></dd>
          </motion.div>
        ))}
      </dl>
    </div>
  );
}

/** The page's headings, indented by level. Long outlines fade out at `limit` with a count of the rest. */
export function Outline({ insights, limit }: { insights: Insights; limit?: number }) {
  const all = insights.headings;
  const shown = limit ? all.slice(0, limit) : all;
  if (!all.length) return <p className="text-[13px] text-muted">This page has no headings.</p>;
  return (
    <div>
      <ol className="flex flex-col border-l border-line">
        {shown.map((h, i) => (
          <motion.li
            key={`${i}-${h.text}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 + Math.min(i, 12) * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="-ml-px border-l border-transparent py-[5px] transition-colors hover:border-accent"
            style={{ paddingLeft: 12 + (h.level - 1) * 12 }}
          >
            <span className={cn('line-clamp-1 text-[13px] leading-snug', h.level === 1 ? 'font-medium text-ink' : h.level === 2 ? 'text-ink-2' : 'text-muted')}>{h.text}</span>
          </motion.li>
        ))}
      </ol>
      {limit && all.length > limit && (
        <p className="mt-1.5 pl-3 text-[12px] text-muted">+ {all.length - limit} more in the side panel</p>
      )}
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-5">
      <div className="flex items-end gap-2"><Skeleton className="h-[52px] w-16" /><Skeleton className="mb-1.5 h-8 w-24" /></div>
      <Skeleton className="h-[58px] w-full rounded-[14px]" />
      <div className="flex flex-col gap-2.5">{[80, 64, 72, 52].map((w) => <Skeleton key={w} className="h-3.5" style={{ width: `${w}%` }} />)}</div>
    </div>
  );
}
