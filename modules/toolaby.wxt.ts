// toolaby.wxt.ts — Toolaby in a WXT project, as a WXT module. WXT loads
// every module in modules/ by itself, so nothing in wxt.config.ts changes
// and nothing is pasted. What it does at build time, from toolaby.config.js:
//   · the manifest: the extension's identity (its `key`), the storage
//     permission, Toolaby's address for externally_connectable — merged
//     into yours, never replacing it — and no host permission for it (one
//     there is taken out: Toolaby needs none); Toolaby's address in your
//     content security policy's connect-src, when you set one that
//     leaves it out (every call of Toolaby's is a fetch) — and,
//     when you have a popup, Toolaby's popup in front of it; when you have
//     a side panel, Toolaby's side panel in front of that, the same way;
//   · the background: yours, with the platform started in it after your own
//     code has run (a startBackground({ handlers }) of yours wins); or, when
//     the project has no background, the platform's own (toolaby.background.js);
//   · your popup and your side panel: the account bar (<toolaby-account>)
//     at the foot — who is signed in, their plan, their account, sign out —
//     unless toolaby.config.js says `accountBar: false` or the tag is there;
//   · the output: Toolaby's shells, the bundle and the config copied in as
//     they are, so a shell finds toolaby.js beside it.
// Written by `npx -y toolaby@latest wire`; replaced by `npx -y toolaby@latest upgrade`; nothing
// here is yours to edit. Build-time only: it runs in Node, not in the extension.
import { defineWxtModule, addEntrypoint, addViteConfig } from 'wxt/modules';
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { manifest as toolaby, unneededHost, cspWithToolaby } from '../toolaby.manifest.js';
import { config } from '../toolaby.config.js';

// What is beside the key, as an older toolaby.config.js may not carry all of it.
const cfg = config as { appPopup?: string; appSidePanel?: string; accountBar?: boolean };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const client = resolve(root, 'toolaby.js');
const ownBackground = resolve(root, 'toolaby.background.js');
const posix = (p: string) => p.split('\\').join('/');
const uniq = <T>(...lists: (T[] | undefined)[]) => [...new Set(lists.flatMap((l) => l ?? []))];

export default defineWxtModule({
  name: 'toolaby',
  setup(wxt) {
    wxt.hooks.hook('build:manifestGenerated', (_, manifest) => {
      const m = manifest as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- the manifest's own shape, widened to merge into
      if ('key' in toolaby && toolaby.key && !m.key) m.key = toolaby.key;
      m.permissions = uniq<string>(m.permissions, toolaby.permissions);
      // Toolaby's address as a host permission, from an older wiring or the old docs: never needed, and shown to everyone installing.
      if (Array.isArray(m.host_permissions)) { m.host_permissions = m.host_permissions.filter((p: unknown) => p !== unneededHost); if (!m.host_permissions.length) delete m.host_permissions; }
      m.externally_connectable = { ...(m.externally_connectable ?? {}), matches: uniq<string>(m.externally_connectable?.matches, toolaby.externally_connectable.matches) };
      // A security policy of yours that limits connections: Toolaby's address added to connect-src, the rest as you wrote it.
      const csp = m.content_security_policy;
      if (csp && typeof csp === 'object' && typeof csp.extension_pages === 'string') m.content_security_policy = { ...csp, extension_pages: cspWithToolaby(csp.extension_pages) };
      if (cfg.appPopup) m.action = { ...(m.action ?? {}), default_popup: 'toolaby-popup.html' };
      if (cfg.appSidePanel) {
        // Toolaby's side panel in front of yours. Firefox spells it sidebar_action and has no sidePanel permission.
        if (m.sidebar_action) m.sidebar_action = { ...m.sidebar_action, default_panel: 'toolaby-sidepanel.html' };
        else { m.permissions = uniq<string>(m.permissions, ['sidePanel']); m.side_panel = { ...(m.side_panel ?? {}), default_path: 'toolaby-sidepanel.html' }; }
      }
    });

    // Your background, or — with none — the platform's own.
    let background: string | null = null;
    wxt.hooks.hook('entrypoints:found', (_, infos) => {
      if (!infos.some((i) => i.type === 'background')) addEntrypoint(wxt, { type: 'background', name: 'background', inputPath: ownBackground, outputDir: wxt.config.outDir, options: {} });
    });
    wxt.hooks.hook('entrypoints:resolved', (_, entrypoints) => {
      background = entrypoints.find((e) => e.type === 'background')?.inputPath ?? null;
    });
    // Toolaby's shells need the bundle and the config beside them in the output, as they are.
    wxt.hooks.hook('build:done', () => {
      for (const f of ['toolaby-popup.html', 'toolaby-popup.js', 'toolaby-sidepanel.html', 'toolaby-sidepanel.js', 'toolaby.js', 'toolaby.config.js']) { const from = resolve(root, f); if (existsSync(from)) copyFileSync(from, resolve(wxt.config.outDir, f)); }
    });
    // Your popup's and your side panel's pages, when you have them and want the bar: the account bar at their foot.
    let ownPages: string[] = [];
    wxt.hooks.hook('entrypoints:resolved', (_, entrypoints) => {
      ownPages = entrypoints.filter((e) => e.type === 'popup' || e.type === 'sidepanel').map((e) => resolve(e.inputPath));
    });
    // Two lines at the top of your background: the platform started once your main has run.
    addViteConfig(wxt, () => ({
      plugins: [{
        name: 'toolaby:background',
        enforce: 'pre',
        transformIndexHtml: {
          order: 'pre',
          handler(html: string, ctx: { filename: string }) {
            if (cfg.accountBar === false || !ownPages.includes(resolve(ctx.filename)) || html.includes('toolaby-account')) return html;
            // Pinned to the foot of the page, whatever its layout; the page keeps room for it. Place the tag yourself to put it elsewhere.
            const bar = '<script type="module" src="/toolaby.js"></script>\n<style>body{padding-bottom:44px}</style>\n<toolaby-account data-dock style="position:fixed;left:0;right:0;bottom:0;z-index:2147483647"></toolaby-account>\n';
            return html.includes('</body>') ? html.replace('</body>', `${bar}</body>`) : html + bar;
          },
        },
        transform(code: string, id: string) {
          const file = id.split('?')[0]!;
          if (!background || resolve(file) !== resolve(background) || resolve(file) === ownBackground) return null;
          const from = posix(relative(dirname(file), client));
          return { code: `import { toolaby as __toolaby } from '${from.startsWith('.') ? from : `./${from}`}';\nqueueMicrotask(() => __toolaby.ensureBackground());\n${code}`, map: null };
        },
      }],
    }));
  },
});
