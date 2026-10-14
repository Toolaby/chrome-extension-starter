const nf = new Intl.NumberFormat();

export const number = (n: number) => nf.format(n);

/** "a few seconds", "1 min", "12 min", "1 h 05". */
export function readTime(minutes: number): { value: string; unit: string } {
  if (minutes < 1) return { value: '<1', unit: 'min' };
  if (minutes < 60) return { value: String(Math.round(minutes)), unit: 'min' };
  const h = Math.floor(minutes / 60);
  return { value: `${h}:${String(Math.round(minutes % 60)).padStart(2, '0')}`, unit: 'h' };
}

export function host(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

export function ago(at: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
