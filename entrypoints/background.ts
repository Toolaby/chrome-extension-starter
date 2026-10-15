import { toolaby } from '../toolaby.js';
import { extractMarkdown, readInsights } from '../lib/page';
import type { PageError } from '../lib/messages';
import { remember, settingsItem } from '../lib/settings';
import { brand } from '../lib/brand';

export default defineBackground(() => {
  toolaby.startBackground({
    handlers: {
      // Free, always: what the page is. No gate, so it never spends a free use.
      async insights({ tabId }: { tabId?: number }) {
        const tab = await target(tabId);
        if (!tab?.id) return fail('no-tab');
        try {
          const insights = await run(tab.id, readInsights);
          if (insights.words > 0) await remember({ url: insights.url, title: insights.title, words: insights.words, minutes: insights.minutes, at: Date.now(), favicon: insights.favicon });
          return { ok: true, insights };
        } catch (e) { return fail(classify(e)); }
      },
      ...(brand.copyMarkdown && { copyMarkdown }),
      ...(brand.focusMode && { focus }),
    },
  });

  // Toolaby tells the background the moment a purchase lands, wherever it was made.
  toolaby.onPaid.addListener((user) => console.info(`[${brand.name}] unlocked`, user.plan?.name ?? ''));

  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install' && brand.welcome) void browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
  });
});

// Metered: each copy spends one of the Free plan's uses (Access → Free uses in the dashboard). A paid plan copies
// without counting. Refused, the permit goes back to the page, which shows the paywall with it.
async function copyMarkdown({ tabId }: { tabId?: number }) {
  const tab = await target(tabId);
  if (!tab?.id) return fail('no-tab');
  const { markdownImages, markdownLinks } = await settingsItem.getValue();
  try {
    // Read first, gate second: a page the extension cannot read must not spend a use.
    const result = await run(tab.id, extractMarkdown, [{ images: markdownImages, links: markdownLinks }]);
    const permit = await toolaby.gate();
    if (!permit.allowed) return { ok: false, permit };
    return { ok: true, result, remaining: permit.remaining ?? null };
  } catch (e) { return fail(classify(e)); }
}

// A Pro feature: only plans that hold `focus` may (Pricing → Features in the dashboard).
async function focus({ tabId }: { tabId?: number }) {
  const permit = await toolaby.gate({ feature: 'focus' });
  if (!permit.allowed) return { ok: false, permit };
  const tab = await target(tabId);
  if (!tab?.id) return fail('no-tab');
  try {
    await browser.scripting.executeScript({ target: { tabId: tab.id }, files: ['/content-scripts/focus.js'] });
    const on = await run(tab.id, () => document.documentElement.hasAttribute('data-glance-focus'));
    return { ok: true, on };
  } catch (e) { return fail(classify(e)); }
}

const fail = (error: PageError) => ({ ok: false as const, error });

async function target(tabId?: number) {
  if (tabId) return browser.tabs.get(tabId).catch(() => undefined);
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

async function run<A extends unknown[], R>(tabId: number, func: (...args: A) => R, args?: A): Promise<R> {
  const [frame] = await browser.scripting.executeScript({ target: { tabId }, func, args: args ?? ([] as unknown as A) });
  return frame?.result as R;
}

/** Chrome's refusals, by what the person can do about them. */
function classify(e: unknown): PageError {
  const m = String((e as Error)?.message ?? e);
  if (/permission|activeTab|Cannot access contents/i.test(m)) return 'no-access';
  return 'restricted'; // chrome://, the Web Store, the PDF viewer, other extensions' pages
}
