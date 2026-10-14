#!/usr/bin/env node
// npm run setup: Glance on your own Toolaby tool, on Test, in about a minute:
//
//   1. signs you in to Toolaby (a link opens; approve it), or uses the session you have;
//   2. makes the tool your extension is sold as;
//   3. gives the Free plan 3 copies a day, and adds Pro: monthly and lifetime, with Focus mode;
//   4. wires this folder to it: Toolaby's files, your tool's key, the agent files.
//
// Everything happens on Test: no real card is ever charged. Change the prices and the Free plan later in the
// dashboard, or ask your coding agent. Run it again with --tool <id> to wire this folder to a tool you already have.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

const CLI = ['-y', 'toolaby@latest'];
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

const bold = (s) => `\x1b[1m${s}\x1b[22m`;
const dim = (s) => `\x1b[2m${s}\x1b[22m`;
const lime = (s) => `\x1b[38;2;210;248;66m${s}\x1b[39m`;
const step = (n, s) => console.log(`\n${lime(`${n}`)} ${bold(s)}`);
const fail = (s) => { console.error(`\n\x1b[31m✖\x1b[39m ${s}`); process.exit(1); };

if (Number(process.versions.node.split('.')[0]) < 20) fail(`Node.js 20 or later is needed; this is ${process.versions.node}.`);

/** A Toolaby command, its JSON answer parsed. A command that needs a session signs you in first, in this terminal. */
function toolaby(words, { json = true } = {}) {
  const r = spawnSync('npx', [...CLI, ...words, ...(json ? ['--json'] : [])], { stdio: json ? ['inherit', 'pipe', 'inherit'] : 'inherit', encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status !== 0) fail(`npx toolaby ${words.join(' ')} failed${r.stdout ? `:\n${r.stdout}` : '.'}`);
  if (!json) return null;
  try { return JSON.parse(r.stdout); } catch { fail(`npx toolaby ${words.join(' ')} answered something other than JSON:\n${r.stdout}`); }
}

console.log(`\n${bold('Glance')} ${dim('· set up on Toolaby (Test)')}`);

let tool = flag('--tool');
if (!tool) {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const fallback = pkg.name === 'glance' ? 'Glance' : pkg.name;
  const name = (await rl.question(`\nWhat is your extension called? ${dim(`(${fallback})`)} `)).trim() || fallback;
  rl.close();

  step(1, 'Signing in and making your tool');
  const created = toolaby(['tool', 'create', '--name', name, '--tagline', 'Know any page at a glance.']);
  tool = created.id ?? created.tool?.id;
  if (!tool) fail(`The tool was made, but its id was not in the answer:\n${JSON.stringify(created, null, 2)}`);
  console.log(`  ${dim('tool')} ${tool}`);

  step(2, 'The Free plan: 3 copies a day');
  toolaby(['access', tool, '--access', 'free_uses', '--free-uses', '3', '--free-uses-per', 'day']);

  step(3, 'Pro: $4 a month, or $29 for good, with Focus mode');
  const monthly = toolaby(['plan', 'add', tool, '--billing', 'subscription', '--amount', '4', '--currency', 'usd', '--interval', 'month', '--name', 'Pro', '--trial-days', '7']);
  toolaby(['plan', 'add', tool, '--billing', 'one_time', '--amount', '29', '--currency', 'usd', '--name', 'Pro']);
  const pro = monthly.id ?? monthly.plan?.id ?? 'default';
  // Naming one plan of the Pro tier unlocks the feature for the whole tier: monthly and lifetime.
  toolaby(['features', tool,
    '--features', JSON.stringify([{ key: 'focus', name: 'Focus mode', blurb: 'Everything but the article dims until you press Esc.' }]),
    '--plans', JSON.stringify([{ id: pro, features: ['focus'] }])]);
}

step(4, 'Wiring this folder to it');
toolaby(['wire', tool, '--force'], { json: false });

console.log(`
${lime('✔')} ${bold('Glance is yours.')}

  ${bold('npm run dev')}        Chrome opens with Glance loaded. Click its icon on any article.
  ${dim('Buy Pro on Test with the card 4242 4242 4242 4242, any future date, any code.')}

  ${bold('Your dashboard')}     ${dim('prices, the Free plan, buyers (Test):')} https://toolaby.app/test/dev
  ${bold('Your agent')}         ${dim('npx -y toolaby@latest agents, then ask:')} "make the side panel a Pro feature"
  ${bold('Ship it')}            ${dim('see "Ship it" in the README: the Live key, then npm run zip')}
`);
