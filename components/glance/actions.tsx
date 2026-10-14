import { Clipboard, Focus, Lock } from 'lucide-react';
import { useState } from 'react';
import { toolaby, type User } from '@/toolaby.js';
import { Button } from '@/components/ui/button';
import { Meter } from '@/components/ui/meter';
import { ProBadge } from '@/components/ui/pro-badge';
import { useToast } from '@/components/ui/toast';
import { freeLeft } from '@/hooks/use-toolaby';
import { number } from '@/lib/format';
import { send } from '@/lib/messages';

/**
 * The two things Glance sells, side by side:
 *   · Copy as Markdown, metered. The Free plan's uses count down on the button; past them, the paywall.
 *   · Focus mode, a Pro feature. Locked until a plan that holds `focus` is bought; the lock opens the plans.
 * Whatever the button shows, the background decides: toolaby.gate() runs there, at the action.
 */
export function Actions({ user, hasFocus, tabId, onFocused }: { user: User | null; hasFocus: boolean; tabId?: number; onFocused?: (on: boolean) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState<'copy' | 'focus' | null>(null);
  const left = freeLeft(user);

  async function copy() {
    setBusy('copy');
    try {
      const r = await send('copyMarkdown', { tabId });
      if (!r.ok) {
        if ('permit' in r) return void toolaby.showPaywall(r.permit);
        return toast({ tone: 'info', title: 'Glance can’t read this page', detail: 'Try it on an article or a doc.' });
      }
      await navigator.clipboard.writeText(r.result.markdown);
      const rest = r.remaining == null ? '' : ` · ${r.remaining} free left`;
      toast({ tone: 'success', title: 'Copied as Markdown', detail: `${number(r.result.words)} words${rest}` });
    } finally { setBusy(null); }
  }

  async function focus() {
    if (!hasFocus) return void toolaby.showPaywall({ feature: 'focus' });
    setBusy('focus');
    try {
      const r = await send('focus', { tabId });
      if (!r.ok) {
        if ('permit' in r) return void toolaby.showPaywall(r.permit);
        return toast({ tone: 'info', title: 'Focus mode can’t run here', detail: 'Browser pages are off limits to extensions.' });
      }
      onFocused?.(r.on);
    } finally { setBusy(null); }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full justify-between pr-3.5" onClick={copy} loading={busy === 'copy'}>
        <span className="inline-flex items-center gap-2.5"><Clipboard className="size-[17px]" />Copy as Markdown</span>
        {left ? (
          <span className="inline-flex items-center gap-2 text-[12px] font-normal opacity-80"><Meter onPrimary remaining={left.remaining} limit={left.limit} />{left.remaining} left</span>
        ) : (
          user?.paid && <span className="text-[12px] font-normal opacity-70">Unlimited</span>
        )}
      </Button>
      <Button variant="secondary" size="lg" className="w-full justify-between pr-3" onClick={focus} loading={busy === 'focus'}>
        <span className="inline-flex items-center gap-2.5"><Focus className="size-[17px]" />Focus mode</span>
        {hasFocus ? <span className="text-[12px] font-normal text-muted">Esc to leave</span> : <span className="inline-flex items-center gap-1.5"><Lock className="size-3.5 text-muted" /><ProBadge /></span>}
      </Button>
      {left && <p className="px-1 text-center text-[12px] text-muted">{left.text}. <button className="font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink" onClick={() => void toolaby.openPaymentPage()}>Go unlimited</button></p>}
    </div>
  );
}
