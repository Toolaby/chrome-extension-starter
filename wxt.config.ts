import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import brand from './extension.json';

// Toolaby's part of the manifest (the extension's key, the storage permission, its address) is merged in by
// modules/toolaby.wxt.ts, which `npm run setup` writes. Nothing of Toolaby's belongs in this file. The name and the
// parts come from extension.json; each folder in entrypoints/ is a part of the manifest (the side panel, settings).
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({ plugins: [tailwindcss()] }),
  // `npm run dev` opens Chrome on an article with the extension loaded. Its profile is kept in .wxt/ (git ignores
  // it), so your Toolaby sign-in and test purchases are still there the next time.
  webExt: {
    startUrls: ['https://en.wikipedia.org/wiki/Speed_reading'],
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
  },
  manifest: {
    name: brand.name,
    description: brand.description,
    // activeTab + scripting: the extension reads a page only when you open it there. No host permissions, no warning
    // at install.
    permissions: ['activeTab', 'scripting', 'storage'],
    // Asked for only when the person chooses "Allow on every site" in the side panel: no warning at install.
    ...(brand.sidePanel && { optional_host_permissions: ['<all_urls>'] }),
    action: { default_title: brand.name },
  },
});
