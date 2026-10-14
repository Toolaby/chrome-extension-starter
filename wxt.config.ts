import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// Toolaby's part of the manifest (the extension's key, the storage permission, its address) is merged in by
// modules/toolaby.wxt.ts, which `npm run setup` writes. Nothing of Toolaby's belongs in this file.
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: 'Glance',
    description: 'Know any page at a glance: read time, words and the outline. Copy it as Markdown, or read it in Focus mode.',
    // activeTab + scripting: Glance reads a page only when you open it there. No host permissions, no warning at install.
    permissions: ['activeTab', 'scripting', 'storage'],
    // Asked for only when the person chooses "Allow on every site" in the side panel: no warning at install.
    optional_host_permissions: ['<all_urls>'],
    action: { default_title: 'Glance' },
  },
});
