import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Toaster, useToast } from '@/components/ui/toast';
import { Actions } from '@/components/glance/actions';
import { Header } from '@/components/glance/header';
import { InsightsHero, InsightsSkeleton, Outline } from '@/components/glance/insights';
import { PageState } from '@/components/glance/page-state';
import { useInsights } from '@/hooks/use-insights';
import { useStored } from '@/hooks/use-stored';
import { useTheme } from '@/hooks/use-theme';
import { useToolaby } from '@/hooks/use-toolaby';
import { ago, number, readTime } from '@/lib/format';
import { historyItem } from '@/lib/settings';

// The side panel stays open beside the page and follows the active tab. Reading a tab needs access to it:
// activeTab covers the tab where the extension's icon was clicked; "Allow on every site" asks for the optional
// <all_urls> permission, at that moment, for the rest.
export function App() {
  useTheme();
  return <Toaster><Panel /></Toaster>;
}

function Panel() {
  const tabId = useActiveTab();
  const { state, reload } = useInsights(tabId);
  const { user, hasFocus } = useToolaby();
  const toast = useToast();
  const insights = state.status === 'ok' ? state.insights : null;

  async function allow() {
    const granted = await browser.permissions.request({ origins: ['<all_urls>'] });
    if (granted) void reload();
  }

  if (tabId === undefined) return null;
  return (
    <main className="flex min-h-screen flex-col gap-6 bg-bg p-5">
      <Header url={insights?.url} favicon={insights?.favicon} idle={state.status === 'error'} />
      <AnimatePresence mode="wait">
        <motion.div key={`${tabId}-${state.status}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-6">
          {state.status === 'loading' && <InsightsSkeleton />}
          {state.status === 'error' && <PageState error={state.error} onAllow={allow} />}
          {insights && (
            <>
              <InsightsHero insights={insights} />
              <Actions user={user} hasFocus={hasFocus} tabId={tabId} onFocused={(on) => toast({ tone: 'success', title: on ? 'Focus mode on' : 'Focus mode off', detail: on ? 'Esc on the page to leave.' : undefined })} />
              <section>
                <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Outline · {insights.headings.length}</h2>
                <Outline insights={insights} />
              </section>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <Recent current={insights?.url} />
    </main>
  );
}

function Recent({ current }: { current?: string }) {
  const [history] = useStored(historyItem);
  const items = history.filter((h) => h.url !== current).slice(0, 8);
  if (!items.length) return null;
  return (
    <section className="mt-auto">
      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Read lately</h2>
      <ul className="-mx-2 flex flex-col">
        {items.map((h) => (
          <li key={h.url}>
            <a href={h.url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-[11px] px-2 py-2 transition-colors hover:bg-surface-2">
              <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-line bg-surface">
                {h.favicon ? <img src={h.favicon} alt="" className="size-4" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{h.title || h.url}</span>
                <span className="block text-[12px] text-muted">{readTime(h.minutes).value} {readTime(h.minutes).unit} · {number(h.words)} words · {ago(h.at)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Debugging: open sidepanel.html?tab=<tab id> in a tab of its own to read that tab.
const debugTab = Number(new URLSearchParams(location.search).get('tab')) || undefined;

/** The active tab of this window, as it changes. */
function useActiveTab() {
  const [tabId, setTabId] = useState<number | undefined>(debugTab);
  useEffect(() => {
    if (debugTab) return;
    let windowId: number | undefined;
    void browser.tabs.query({ active: true, currentWindow: true }).then(([t]) => { windowId = t?.windowId; setTabId(t?.id); });
    const activated = (info: { tabId: number; windowId: number }) => { if (info.windowId === windowId) setTabId(info.tabId); };
    // A navigation in the active tab: read it again once it has loaded.
    const updated = (id: number, change: { status?: string }, tab: { active?: boolean; windowId?: number }) => {
      if (change.status === 'complete' && tab.active && tab.windowId === windowId) { setTabId(undefined); setTimeout(() => setTabId(id)); }
    };
    browser.tabs.onActivated.addListener(activated);
    browser.tabs.onUpdated.addListener(updated);
    return () => { browser.tabs.onActivated.removeListener(activated); browser.tabs.onUpdated.removeListener(updated); };
  }, []);
  return tabId;
}
