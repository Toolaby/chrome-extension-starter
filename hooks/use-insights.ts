import { useCallback, useEffect, useState } from 'react';
import { send, type PageError } from '@/lib/messages';
import type { Insights } from '@/lib/page';

export type InsightsState = { status: 'loading' } | { status: 'ok'; insights: Insights } | { status: 'error'; error: PageError };

/** The insights of a tab (the active one when no id is given), read again whenever `reload` is called. */
export function useInsights(tabId?: number) {
  const [state, setState] = useState<InsightsState>({ status: 'loading' });
  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const r = await send('insights', { tabId }).catch(() => ({ ok: false as const, error: 'restricted' as const }));
    setState(r.ok ? { status: 'ok', insights: r.insights } : { status: 'error', error: r.error });
  }, [tabId]);
  useEffect(() => { void load(); }, [load]);
  return { state, reload: load };
}
