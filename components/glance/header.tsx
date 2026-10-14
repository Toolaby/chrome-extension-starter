import { PanelRight, Settings } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { host } from '@/lib/format';

export function Header({ url, favicon, onPanel, idle }: { url?: string; favicon?: string; onPanel?: () => void; idle?: boolean }) {
  return (
    <header className="flex items-center gap-2.5">
      <Logo className="size-7" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold leading-tight tracking-[-0.02em] text-ink">Glance</p>
        <p className="flex min-w-0 items-center gap-1.5 text-[12px] leading-tight text-muted">
          {favicon && <img src={favicon} alt="" className="size-3 rounded-[3px]" onError={(e) => (e.currentTarget.style.display = 'none')} />}
          <span className="truncate">{url ? host(url) : idle ? 'Page insights' : 'Reading the page…'}</span>
        </p>
      </div>
      {onPanel && (
        <button onClick={onPanel} title="Open in the side panel" className="grid size-8 place-items-center rounded-[9px] text-muted transition-colors hover:bg-surface-2 hover:text-ink"><PanelRight className="size-4" /></button>
      )}
      <button onClick={() => void browser.runtime.openOptionsPage()} title="Settings" className="grid size-8 place-items-center rounded-[9px] text-muted transition-colors hover:bg-surface-2 hover:text-ink"><Settings className="size-4" /></button>
    </header>
  );
}
