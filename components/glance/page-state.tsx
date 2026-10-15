import { Ban, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { brand } from '@/lib/brand';
import type { PageError } from '@/lib/messages';

/** A page the extension cannot read, and what the person can do about it. */
export function PageState({ error, onAllow }: { error: PageError; onAllow?: () => void }) {
  const access = error === 'no-access';
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center px-4 py-8 text-center">
      <span className="grid size-11 place-items-center rounded-[13px] border border-line bg-surface-2 text-muted">
        {access ? <ShieldCheck className="size-5" /> : <Ban className="size-5" />}
      </span>
      <h2 className="mt-4 text-[15px] font-semibold tracking-[-0.01em] text-ink">{access ? `Let ${brand.name} read this page` : 'Nothing to read here'}</h2>
      <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-muted">
        {access
          ? `${brand.name} reads a page when you click its icon there. To follow you from tab to tab in the side panel, allow it on every site.`
          : 'Browser pages, the Chrome Web Store and other extensions are closed to every extension. Open an article or a doc.'}
      </p>
      {access && onAllow && <Button className="mt-5" onClick={onAllow}>Allow on every site</Button>}
    </motion.div>
  );
}
