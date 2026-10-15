// Focus mode: everything but the article dims and softens, until Esc or a click on the pill.
//
// Registered at runtime, so it is not in the manifest's content_scripts and asks for no host permission: the
// background injects it into the one tab, with activeTab, after toolaby.gate({ feature: 'focus' }) allowed it.
// Injected again, it switches off. Its UI lives in a closed shadow root, so the page's CSS cannot reach it.
import { brand } from '../lib/brand';
import { settingsItem } from '../lib/settings';

type Toggle = { off(): void };
const KEY = '__glanceFocus';

export default defineContentScript({
  registration: 'runtime',
  async main() {
    const w = window as unknown as Record<string, Toggle | undefined>;
    if (w[KEY]) return w[KEY]!.off();
    const { focusDim } = await settingsItem.getValue();
    w[KEY] = start(findMain(), focusDim / 100);
  },
});

function findMain(): Element {
  const candidates = [...document.querySelectorAll('article, main, [role="main"], #content, .post, .entry-content')];
  const best = candidates.map((el) => ({ el, n: (el.textContent ?? '').length })).sort((a, b) => b.n - a.n)[0];
  let el: Element = best && best.n > 400 ? best.el : document.body;
  // Step in while one child holds nearly all of the text: from a page's <main> to its article column.
  for (;;) {
    const total = (el.textContent ?? '').length;
    const child = [...el.children].find((c) => (c.textContent ?? '').length > total * 0.8 && c.getBoundingClientRect().width > 280);
    if (!child) return el;
    el = child;
  }
}

function start(main: Element, dim: number): Toggle {
  const host = document.createElement('glance-focus');
  host.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483646; pointer-events: none;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
    <style>
      :host { --dim: ${dim}; --accent: ${brand.accent}; }
      .veil { position: fixed; background: rgb(9 9 11 / var(--dim)); backdrop-filter: blur(3px) saturate(0.5); -webkit-backdrop-filter: blur(3px) saturate(0.5);
              opacity: 0; transition: opacity .45s cubic-bezier(.2,.7,.2,1); pointer-events: auto; }
      .ring { position: fixed; border-radius: 14px; box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent), 0 0 48px 4px color-mix(in srgb, var(--accent) 12%, transparent);
              opacity: 0; transition: opacity .6s .1s; }
      .on .veil, .on .ring { opacity: 1; }
      .pill { position: fixed; left: 50%; bottom: 24px; transform: translate(-50%, 12px); opacity: 0; pointer-events: auto; cursor: pointer;
              display: flex; align-items: center; gap: 10px; padding: 9px 12px 9px 14px; border-radius: 999px;
              font: 500 13px/1 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; letter-spacing: -.01em; color: #f4f4f5;
              background: rgb(24 24 27 / .82); border: 1px solid rgb(255 255 255 / .1); box-shadow: 0 12px 32px -8px rgb(0 0 0 / .5);
              backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); transition: transform .45s cubic-bezier(.2,.9,.3,1.2), opacity .3s; }
      .on .pill { transform: translate(-50%, 0); opacity: 1; }
      .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 10px var(--accent); animation: pulse 2s infinite; }
      kbd { font: 500 11px/1 ui-monospace, monospace; padding: 4px 6px; border-radius: 6px; color: #a1a1aa; background: rgb(255 255 255 / .08); }
      @keyframes pulse { 50% { opacity: .45; } }
      @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
    </style>
    <div class="wrap">
      <div class="veil" data-side="top"></div><div class="veil" data-side="bottom"></div>
      <div class="veil" data-side="left"></div><div class="veil" data-side="right"></div>
      <div class="ring"></div>
      <div class="pill" role="button" aria-label="Leave Focus mode"><span class="dot"></span>Focus mode<kbd>Esc</kbd></div>
    </div>`;
  document.documentElement.append(host);
  document.documentElement.setAttribute('data-glance-focus', '');

  const wrap = root.querySelector<HTMLElement>('.wrap')!;
  const veil = (side: string) => root.querySelector<HTMLElement>(`[data-side="${side}"]`)!;
  const ring = root.querySelector<HTMLElement>('.ring')!;
  const PAD = 20;

  let frame = 0;
  const layout = () => {
    frame = 0;
    const r = main.getBoundingClientRect();
    const vw = innerWidth, vh = innerHeight;
    const top = Math.max(0, r.top - PAD), bottom = Math.min(vh, r.bottom + PAD);
    const left = Math.max(0, r.left - PAD), right = Math.min(vw, r.right + PAD);
    Object.assign(veil('top').style, { left: '0', top: '0', width: `${vw}px`, height: `${top}px` });
    Object.assign(veil('bottom').style, { left: '0', top: `${bottom}px`, width: `${vw}px`, height: `${Math.max(0, vh - bottom)}px` });
    Object.assign(veil('left').style, { left: '0', top: `${top}px`, width: `${left}px`, height: `${Math.max(0, bottom - top)}px` });
    Object.assign(veil('right').style, { left: `${right}px`, top: `${top}px`, width: `${Math.max(0, vw - right)}px`, height: `${Math.max(0, bottom - top)}px` });
    Object.assign(ring.style, { left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${bottom - top}px` });
  };
  const schedule = () => { frame ||= requestAnimationFrame(layout); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') off(); };

  layout();
  requestAnimationFrame(() => wrap.classList.add('on'));
  addEventListener('scroll', schedule, { passive: true, capture: true });
  addEventListener('resize', schedule);
  addEventListener('keydown', onKey, true);
  root.querySelector('.pill')!.addEventListener('click', () => off());
  root.querySelectorAll('.veil').forEach((v) => v.addEventListener('click', () => off()));

  function off() {
    wrap.classList.remove('on');
    removeEventListener('scroll', schedule, { capture: true });
    removeEventListener('resize', schedule);
    removeEventListener('keydown', onKey, true);
    document.documentElement.removeAttribute('data-glance-focus');
    delete (window as unknown as Record<string, Toggle | undefined>)[KEY];
    setTimeout(() => host.remove(), 450);
  }
  return { off };
}
