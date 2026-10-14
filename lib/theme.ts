import type { Theme } from './settings';

const dark = () => matchMedia('(prefers-color-scheme: dark)');

/** Puts data-theme on <html>: the person's choice, or the system's, following the system as it changes. */
export function applyTheme(theme: Theme): () => void {
  const set = () => {
    const resolved = theme === 'system' ? (dark().matches ? 'dark' : 'light') : theme;
    document.documentElement.dataset.theme = resolved;
    // Toolaby's account bar, docked at the foot of the popup and the side panel, takes the same mode.
    document.querySelectorAll('toolaby-account').forEach((bar) => bar.setAttribute('scheme', resolved));
  };
  set();
  if (theme !== 'system') return () => {};
  const mq = dark();
  mq.addEventListener('change', set);
  return () => mq.removeEventListener('change', set);
}
