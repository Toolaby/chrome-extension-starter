// toolaby.manifest.js — what your manifest needs, read from toolaby.config.js
// so nothing is typed twice: the extension's id (its `key`), the storage
// permission, and Toolaby's address for externally_connectable, taken from
// inside the tool key — and, for a security policy of your own,
// cspWithToolaby(), which adds that address to what it may connect to.
// No host permission: Toolaby needs none, and Chrome
// switches off an update that adds one until each user approves it. A framework that
// generates its manifest (WXT, CRXJS) spreads `manifest` into its config
// and never carries an address of its own; swap the key for the live one
// and the manifest follows. Build-time only: it runs in Node, not in the
// extension. Written by `npx -y toolaby@latest wire`; nothing here is yours to edit.
import { config } from './toolaby.config.js';

const encoded = String(config.key ?? '').split('_')[2];
let facts = null;
try { facts = encoded ? JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) : null; } catch { facts = null; }
if (!facts || typeof facts.s !== 'string') {
  throw new Error('toolaby.config.js has no tool key yet — run `npx -y toolaby@latest wire <tool-id>` in this folder, or paste the key from the tool\'s Set up page.');
}

/** Toolaby's address for this tool: where its pages live, and the only origin allowed to talk to the extension. */
export const site = facts.s.replace(/\/$/, '');
/** Its origin: the manifest names Toolaby by it, as wire does, so Test's address (…/test) and Live's match alike. */
const origin = (() => { try { return new URL(site).origin; } catch { return site; } })();

/** The manifest fragment. `key` is present once the wiring has given the extension its identity. */
export const manifest = {
  ...(config.manifestKey ? { key: config.manifestKey } : {}),
  permissions: ['storage'],
  externally_connectable: { matches: [`${origin}/*`] },
};

/** The host permission a wiring from before 2 Oct 2026 gave Toolaby's address: taken out of a generated manifest. */
export const unneededHost = `${site}/*`;

/**
 * A content security policy with Toolaby's address in what the extension's pages may connect to: every call of
 * Toolaby's is a fetch, which connect-src governs (default-src where there is none). A policy that already allows it,
 * or limits no connection, comes back as it is; otherwise only that directive gains what it lacks — 'self' and
 * Toolaby's origin. WXT's module (toolaby.wxt.ts) applies it to the built manifest by itself; in a CRXJS config, wrap
 * yours: content_security_policy: { extension_pages: cspWithToolaby("script-src 'self'; connect-src 'self' https://api.example.com") }.
 */
export function cspWithToolaby(policy) {
  if (typeof policy !== 'string') return policy;
  let url;
  try { url = new URL(origin); } catch { return policy; }
  const parts = policy.split(';');
  const name = (part) => part.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  const at = parts.findIndex((p) => name(p) === 'connect-src');
  const base = at >= 0 ? at : parts.findIndex((p) => name(p) === 'default-src');
  if (base < 0) return policy;
  // 'none' beside other sources means nothing, and default-src's script keywords mean nothing to connect-src.
  const sources = parts[base].trim().split(/\s+/).slice(1).filter((s) => !s.startsWith("'") || s.toLowerCase() === "'self'");
  const allows = (want) => sources.some((raw) => {
    const s = raw.toLowerCase().replace(/\/+$/, '');
    if (s === '*') return true;
    if (want === "'self'") return s === "'self'";
    if (s === url.protocol || (s === 'http:' && url.protocol === 'https:')) return true;
    if (s === url.origin || s.startsWith(`${url.origin}/`)) return true;
    const wild = s.match(/^(https?):\/\/\*\.([^/]+)/);
    return !!wild && `${wild[1]}:` === url.protocol && url.host.endsWith(`.${wild[2]}`);
  });
  const missing = ["'self'", url.origin].filter((s) => !allows(s));
  if (!missing.length) return policy;
  const directive = `connect-src ${[...sources, ...missing].join(' ')}`;
  if (at >= 0) {
    const lead = parts[at].match(/^\s*/)?.[0] ?? '';
    const tail = parts[at].match(/\s*$/)?.[0] ?? '';
    parts[at] = `${lead}${directive}${tail}`;
    return parts.join(';');
  }
  const end = policy.trimEnd();
  return `${end}${end.endsWith(';') || !end ? '' : ';'} ${directive}`.trimStart();
}
