#!/usr/bin/env node
// npm run setup: this extension on your own Toolaby tool, on Test, in about a minute.
//
//   1. Sign in to Toolaby: press Enter and the sign-in page opens in your browser. No account yet? The same page
//      makes one, with Google or an email link.
//   2. Pick the workspace the extension sells from, when you have more than one.
//   3. Make the tool (or use the one you made last time) with the Free plan, the Pro plans and the Pro feature in
//      toolaby.setup.json: out of the box, 3 copies a day free, and Pro at $4 a month with a 7-day trial or $29
//      once, both with Focus mode.
//   4. Wire this folder to it: your tool's key, and the files your coding agent reads.
//
// Everything happens on Test: no real card is ever charged. Flags, for scripts and coding agents:
//   --tool <id>    wire to a tool you already have, and skip the rest
//   --name <name>  the extension's name, without asking
//   --yes          take every default without asking (sign-in still needs your approval in a browser)
//   --debug        print Toolaby's raw answers
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import * as p from '@clack/prompts';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const interactive = process.stdin.isTTY && process.stdout.isTTY && !flag('--yes');
const DEBUG = flag('--debug');

const read = (file) => JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
const brand = read('extension.json');
const plan = read('toolaby.setup.json');

// The brand's accent, in a terminal that shows colour.
const [r, g, b] = [1, 3, 5].map((i) => parseInt(brand.accent.slice(i, i + 2), 16));
const lime = (s) => `\x1b[38;2;${r};${g};${b}m${s}\x1b[39m`;
const bold = (s) => `\x1b[1m${s}\x1b[22m`;
const dim = (s) => `\x1b[2m${s}\x1b[22m`;
const DASHBOARD = 'https://toolaby.app/test/dev';

if (Number(process.versions.node.split('.')[0]) < 20) {
  console.error(`${brand.name} needs Node.js 20 or later; this is ${process.versions.node}. https://nodejs.org`);
  process.exit(1);
}

/** Ends the setup with a message a person can act on; nothing is half-made that a second run cannot finish. */
function stop(message, hint) {
  p.cancel(hint ? `${message}\n${dim(hint)}` : message);
  process.exit(1);
}
const cancelled = (value) => { if (p.isCancel(value)) stop('Setup stopped.', 'Run npm run setup again whenever you like.'); return value; };

/** A Toolaby command, answering JSON. Never throws: { ok, json, text }. */
function toolaby(words, { json = true } = {}) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['-y', 'toolaby@latest', ...words, ...(json ? ['--json'] : [])], { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => resolve({ ok: false, json: null, text: String(e) }));
    child.on('close', (code) => {
      if (DEBUG) console.error(dim(`\n$ npx toolaby ${words.join(' ')}\n${out}${err}`));
      let parsed = null;
      try { parsed = JSON.parse(out.slice(out.indexOf('{'))); } catch { /* not JSON: the text is the answer */ }
      const ok = code === 0 && parsed?.ok !== false && parsed?.signedIn !== false;
      resolve({ ok, json: parsed, text: (out || err).trim() });
    });
  });
}

/** What went wrong, in Toolaby's own words, never its raw JSON. */
const why = (r) => r.json?.message ?? r.text.split('\n').find((l) => l.trim()) ?? 'Toolaby did not answer.';

/** Runs a step under a spinner; stops the setup, with Toolaby's reason, if it fails. */
async function step(label, done, run) {
  const s = p.spinner();
  s.start(label);
  const r = await run();
  if (!r.ok) { s.error(`${label}: failed`); stop(why(r), 'Nothing is lost: run npm run setup again, and it picks up from here.'); }
  s.stop(typeof done === 'function' ? done(r) : done);
  return r;
}

function openInBrowser(url) {
  const [cmd, cmdArgs] = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try { spawn(cmd, cmdArgs, { stdio: 'ignore', detached: true }).unref(); return true; } catch { return false; }
}

async function signIn() {
  for (;;) {
    const started = await toolaby(['login', '--no-wait']);
    if (!started.json?.url) stop(`Toolaby could not start a sign-in: ${why(started)}`, 'Check your connection, then run npm run setup again.');
    const { url, code, deviceCode } = started.json;
    p.note(
      `${bold('Code')}  ${lime(code)}\n${url}\n\n${dim('No Toolaby account yet? The same page makes one, with Google or an email link.')}`,
      'Sign in to Toolaby',
    );
    if (interactive) {
      const open = cancelled(await p.confirm({ message: 'Open the sign-in page in your browser?', active: 'Yes, open it', inactive: 'No, I will copy the link', initialValue: true }));
      if (open && !openInBrowser(url)) p.log.warn('Could not open a browser here: copy the link above.');
    } else {
      p.log.info('Open the link above and approve the code.');
    }
    const s = p.spinner();
    s.start(`Waiting for you to approve ${code} in your browser`);
    const polled = await toolaby(['login', '--poll', deviceCode]);
    if (polled.json?.signedIn) { s.stop(`Signed in as ${bold(polled.json.email ?? 'you')}`); return; }
    s.error('The code was not approved in time.');
    if (!interactive) stop('Sign-in timed out.', 'Run npm run setup again for a new code.');
    if (!cancelled(await p.confirm({ message: 'Try again with a new code?', initialValue: true }))) stop('Setup stopped.', 'Run npm run setup again whenever you like.');
  }
}

/** The signed-in account and its workspaces, signing in first when there is no session. */
async function account() {
  let me = await toolaby(['whoami']);
  if (me.ok && me.json?.email && interactive) {
    const choice = cancelled(await p.select({
      message: `You are signed in to Toolaby as ${bold(me.json.email)}.`,
      options: [{ value: 'keep', label: `Continue as ${me.json.email}` }, { value: 'switch', label: 'Sign in with another account' }],
    }));
    if (choice === 'switch') { await toolaby(['logout'], { json: false }); me = { ok: false }; }
  }
  if (!me.ok || !me.json?.email) {
    p.log.step('Sign in to Toolaby, or make an account: it takes a minute.');
    await signIn();
    me = await toolaby(['whoami']);
    if (!me.ok) stop(`Signed in, but Toolaby could not read the account: ${why(me)}`);
  }
  // A new account may have no workspace yet: the dashboard makes one in a step.
  while (!me.json.workspaces?.length) {
    p.note(`Your account has no workspace on Test yet. Make one in the dashboard, one step:\n${DASHBOARD}`, 'One more thing');
    if (!interactive) stop('No workspace on Test.', `Make one at ${DASHBOARD}, then run npm run setup again.`);
    if (cancelled(await p.confirm({ message: 'Open the dashboard?', initialValue: true }))) openInBrowser(DASHBOARD);
    cancelled(await p.confirm({ message: 'Made it? Press Enter to go on.', active: 'Go on', inactive: 'Stop', initialValue: true })) || stop('Setup stopped.');
    me = await toolaby(['whoami']);
  }
  return me.json;
}

const slugOf = (name) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 59) || 'extension';

// ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

console.log();
p.intro(`${lime('●')} ${bold(brand.name)} ${dim('· set up on Toolaby, on Test: no card is ever charged')}`);

let tool = opt('--tool');
if (!tool) {
  const me = await account();

  let workspace = me.workspaces[0];
  if (me.workspaces.length > 1 && interactive) {
    const slug = cancelled(await p.select({ message: 'Which workspace sells this extension?', options: me.workspaces.map((w) => ({ value: w.slug, label: w.name, hint: w.role })) }));
    workspace = me.workspaces.find((w) => w.slug === slug);
  }

  const fallback = opt('--name') ?? brand.name;
  const name = interactive && !opt('--name')
    ? String(cancelled(await p.text({ message: 'What is your extension called?', placeholder: fallback, defaultValue: fallback, validate: (v) => (v && v.trim().length === 1 ? 'Two characters or more.' : undefined) }))).trim()
    : fallback;
  // A new name goes into extension.json too, so the extension and its tool on Toolaby agree.
  if (name !== brand.name) {
    brand.name = name;
    writeFileSync(new URL('../extension.json', import.meta.url), `${JSON.stringify(brand, null, 2)}\n`);
  }

  // A tool from an earlier run: use it, or make another beside it.
  const listed = await toolaby(['tools']);
  const mine = (listed.json?.tools ?? []).filter((t) => t.workspace === workspace.slug);
  const slug = slugOf(name);
  const same = mine.find((t) => t.slug === `${workspace.slug}--${slug}` || t.slug === slug || t.name.toLowerCase() === name.toLowerCase());
  let reuse = false;
  if (same) {
    reuse = !interactive || cancelled(await p.select({
      message: `${bold(same.name)} is already in ${workspace.name}.`,
      options: [{ value: true, label: `Use it (${same.slug})`, hint: 'its plans stay as they are' }, { value: false, label: 'Make a new tool beside it' }],
    }));
    if (reuse) tool = same.slug;
  }

  if (!reuse) {
    const taken = new Set(mine.map((t) => t.slug.replace(`${workspace.slug}--`, '')));
    let id = slug;
    for (let n = 2; taken.has(id); n++) id = `${slug}-${n}`;
    const created = await step('Making your tool', (r) => `Made ${bold(name)} ${dim(r.json.id ?? r.json.tool?.id ?? '')}`,
      () => toolaby(['tool', 'create', '--name', name, '--id', id, '--workspace', workspace.slug, '--tagline', brand.tagline]));
    tool = created.json.id ?? created.json.tool?.id;
    if (!tool) stop('The tool was made, but Toolaby did not say its id.', `Find it at ${DASHBOARD}, then run npm run setup -- --tool <id>.`);

    // What the Free plan holds. A counted action (Copy as Markdown): its free uses, or none before a plan. Without
    // one, everything but the Pro feature is free.
    const uses = brand.copyMarkdown ? plan.freeUses : null;
    const PER = { ever: '', day: ' a day', week: ' a week', month: ' a month' };
    await step('Setting the Free plan', brand.copyMarkdown ? (uses ? `Free plan: ${uses.count} copies${PER[uses.per]}` : 'Free plan: copies come with Pro') : `Free plan: everything but ${plan.feature?.name ?? 'Pro'}`, () =>
      toolaby(['access', tool, '--access', brand.copyMarkdown ? (uses ? 'free_uses' : 'paid') : 'open', ...(uses ? ['--free-uses', String(uses.count), '--free-uses-per', uses.per] : [])]));

    const money = (n) => new Intl.NumberFormat('en', { style: 'currency', currency: plan.currency, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
    let pro;
    for (const pl of plan.plans) {
      const sub = pl.billing === 'subscription';
      const interval = pl.interval ?? 'month';
      const label = sub
        ? `Pro · ${interval === 'year' ? 'Yearly' : 'Monthly'}: ${money(pl.amount)}${pl.trialDays ? `, with a ${pl.trialDays}-day trial` : ''}`
        : `Pro · Lifetime: ${money(pl.amount)} once`;
      const added = await step(`Adding ${label.split(':')[0]}`, label, () =>
        toolaby(['plan', 'add', tool, '--billing', pl.billing, '--amount', String(pl.amount), '--currency', plan.currency, '--name', 'Pro',
          ...(sub ? ['--interval', interval] : []), ...(sub && pl.trialDays ? ['--trial-days', String(pl.trialDays)] : [])]));
      pro ??= added.json.id ?? added.json.plan?.id;
    }

    // Naming one plan of the Pro tier puts the feature in the whole tier: monthly, yearly and lifetime.
    const feature = brand.focusMode ? plan.feature : null;
    if (feature && pro) {
      await step(`Putting ${feature.name} in Pro`, `${feature.name}: in every Pro plan`, () =>
        toolaby(['features', tool, '--features', JSON.stringify([feature]), '--plans', JSON.stringify([{ id: pro, features: [feature.key] }])]));
    }
  }
}

await step('Wiring this folder', 'Wired: your tool key, and TOOLABY.md for your coding agent', () => toolaby(['wire', tool, '--force'], { json: false }));

p.note(
  [
    `${bold('npm run dev')}   Chrome opens on an article with ${brand.name} loaded.`,
    `              Pin it: the puzzle piece in the toolbar, then the pin.`,
    `${bold('Test card')}     4242 4242 4242 4242 · any future date · any CVC`,
    `${bold('Dashboard')}     ${DASHBOARD}  ${dim('prices, the Free plan, buyers')}`,
    `${bold('Your agent')}    npx -y toolaby@latest agents  ${dim('then ask it to change what Pro holds')}`,
  ].join('\n'),
  'Next',
);
p.outro(`${lime('✔')} ${bold(`${brand.name} is yours.`)} ${dim('To sell it for real, see "Ship it" in the README.')}`);
