import { Toaster } from '@/components/ui/toast';
import { Actions } from '@/components/glance/actions';
import { Header } from '@/components/glance/header';
import { InsightsHero, InsightsSkeleton, Outline } from '@/components/glance/insights';
import { PageState } from '@/components/glance/page-state';
import { useInsights } from '@/hooks/use-insights';
import { useTheme } from '@/hooks/use-theme';
import { useToolaby } from '@/hooks/use-toolaby';

// The popup is the extension's front room. Toolaby's popup stands in front of it (the module puts it there) and
// hands over at once while the person may use Glance; Toolaby's account bar sits at its foot.
// Debugging: open chrome-extension://<id>/popup.html?tab=<tab id> in a tab of its own, with DevTools beside it,
// and the popup reads that tab instead of the active one.
const debugTab = Number(new URLSearchParams(location.search).get('tab')) || undefined;

export function App() {
  useTheme();
  const { state } = useInsights(debugTab);
  const { user, hasFocus } = useToolaby();
  const insights = state.status === 'ok' ? state.insights : null;

  async function openPanel() {
    const win = await browser.windows.getCurrent();
    await browser.sidePanel.open({ windowId: win.id! });
    window.close();
  }

  return (
    <Toaster>
      <main className="flex w-[360px] flex-col gap-5 bg-bg p-4 pb-5">
        <Header url={insights?.url} favicon={insights?.favicon} onPanel={openPanel} idle={state.status === 'error'} />
        {state.status === 'loading' && <InsightsSkeleton />}
        {state.status === 'error' && <PageState error={state.error} />}
        {insights && (
          <>
            <InsightsHero insights={insights} compact />
            <section>
              <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Outline</h2>
              <Outline insights={insights} limit={6} />
            </section>
          </>
        )}
        {state.status !== 'error' && <Actions user={user} hasFocus={hasFocus} tabId={debugTab} onFocused={(on) => on && window.close()} />}
      </main>
    </Toaster>
  );
}
