// toolaby.background.js — the platform's background, for a WXT project
// that has none of its own: the module (modules/toolaby.wxt.ts) names it
// as the background entrypoint until you add entrypoints/background.ts,
// from which moment yours is used and the platform is started in it.
import { defineBackground } from 'wxt/utils/define-background';
import { toolaby } from './toolaby.js';

export default defineBackground(() => {
  toolaby.startBackground();
});
