// Written by `npx -y toolaby@latest wire <tool-id>` — the tool key from the tool's Set up
// page, the popup of your own Toolaby's popup sends people on to, and the
// extension's identity. The starter ships a placeholder key that the client
// refuses at startup, saying so: `npm run setup` puts your own here.
export const config = {
  key: 'tk_test_eyJzIjoiaHR0cHM6Ly95b3VyLXdvcmtzcGFjZS50b29sYWJ5LmFwcC90ZXN0IiwidCI6ImdsYW5jZSIsIm4iOiJHbGFuY2UiLCJmIjowLCJiIjoib25lX3RpbWUifQ',
  appPopup: 'popup.html',
  // Your own side panel, the same way: Toolaby's side panel opens on to it when the device may; '' when there is none.
  appSidePanel: 'sidepanel.html',
  // Opening the Toolaby popup spends no free use: entrypoints/background.ts counts its own with toolaby.gate() (`wire`
  // writes this from your code).
  countOpens: false,
  // The page Chrome opens once someone removes the extension: Toolaby's, which asks why and shows a buyer still paying
  // how to stop. `wire` writes false where your code calls chrome.runtime.setUninstallURL() itself.
  uninstallPage: true,
  manifestKey: '',
};
