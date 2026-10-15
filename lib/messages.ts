// What the popup, the side panel and the options page ask the background, and what it answers. One typed
// `send()` instead of loose sendMessage calls: rename an action here and every caller fails to compile.
import type { Permit } from '../toolaby.js';
import type { Insights, Markdown } from './page';

/** Why a page could not be read: a browser page no extension may touch, or one the extension was not given yet. */
export type PageError = 'restricted' | 'no-access' | 'no-tab';

export type Requests = {
  insights: { tabId?: number };
  copyMarkdown: { tabId?: number };
  focus: { tabId?: number };
};

export type Replies = {
  insights: { ok: true; insights: Insights } | { ok: false; error: PageError };
  copyMarkdown: { ok: true; result: Markdown; remaining: number | null } | { ok: false; error: PageError } | { ok: false; permit: Permit };
  focus: { ok: true; on: boolean } | { ok: false; error: PageError } | { ok: false; permit: Permit };
};

export function send<A extends keyof Requests>(action: A, body: Requests[A] = {}): Promise<Replies[A]> {
  return browser.runtime.sendMessage({ action, ...body });
}
