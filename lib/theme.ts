import type { Theme } from './settings';

const dark = () => matchMedia('(prefers-color-scheme: dark)');

/** Puts data-theme on <html>: the person's choice, or the system's, following the system as it changes. */
export function applyTheme(theme: Theme): () => void {
  const set = () => {
    document.documentElement.dataset.theme = theme === 'system' ? (dark().matches ? 'dark' : 'light') : theme;
  };
  set();
  if (theme !== 'system') return () => {};
  const mq = dark();
  mq.addEventListener('change', set);
  return () => mq.removeEventListener('change', set);
}
