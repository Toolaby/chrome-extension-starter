import { storage } from '#imports';

export type Theme = 'system' | 'light' | 'dark';

export type Settings = {
  theme: Theme;
  /** Copy as Markdown: keep images as ![alt](src). */
  markdownImages: boolean;
  /** Copy as Markdown: keep links as [text](href); off, only their text. */
  markdownLinks: boolean;
  /** Focus mode: how dark the rest of the page goes, 0 to 100. */
  focusDim: number;
};

export const defaultSettings: Settings = { theme: 'system', markdownImages: true, markdownLinks: true, focusDim: 72 };

/** Synced: the same settings on every computer the person signs in to Chrome on. */
export const settingsItem = storage.defineItem<Settings>('sync:settings', { fallback: defaultSettings });

export type HistoryEntry = { url: string; title: string; words: number; minutes: number; at: number; favicon?: string };

/** This computer only: the pages read lately, newest first, for the side panel. */
export const historyItem = storage.defineItem<HistoryEntry[]>('local:history', { fallback: [] });

export async function remember(entry: HistoryEntry) {
  const list = await historyItem.getValue();
  await historyItem.setValue([entry, ...list.filter((e) => e.url !== entry.url)].slice(0, 30));
}
