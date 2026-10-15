import { Laptop, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { toolaby, type User } from '@/toolaby.js';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Meter } from '@/components/ui/meter';
import { ProBadge } from '@/components/ui/pro-badge';
import { Segmented } from '@/components/ui/segmented';
import { Switch } from '@/components/ui/switch';
import { useStored } from '@/hooks/use-stored';
import { useTheme } from '@/hooks/use-theme';
import { freeLeft, useToolaby } from '@/hooks/use-toolaby';
import { brand } from '@/lib/brand';
import { settingsItem, type Theme } from '@/lib/settings';

export function App() {
  useTheme();
  const [s, update] = useStored(settingsItem);
  const { user } = useToolaby();

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto flex max-w-[640px] flex-col gap-8 px-5 py-12">
        <header className="flex items-center gap-3">
          <Logo className="size-10" />
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-ink">Settings</h1>
            <p className="text-[13px] text-muted">Saved as you change them, on every computer you use Chrome on.</p>
          </div>
        </header>

        <PlanCard user={user} />

        <Section title="Appearance">
          <Row label="Theme" hint="System follows your computer’s light or dark mode.">
            <Segmented<Theme>
              value={s.theme}
              onChange={(theme) => void update({ theme })}
              options={[
                { value: 'system', label: 'System', icon: <Laptop className="size-3.5" /> },
                { value: 'light', label: 'Light', icon: <Sun className="size-3.5" /> },
                { value: 'dark', label: 'Dark', icon: <Moon className="size-3.5" /> },
              ]}
            />
          </Row>
        </Section>

        {brand.copyMarkdown && (
        <Section title="Copy as Markdown">
          <Row label="Images" hint="Keep pictures as ![alt](address).">
            <Switch label="Images" checked={s.markdownImages} onChange={(markdownImages) => void update({ markdownImages })} />
          </Row>
          <Row label="Links" hint="Keep links as [text](address). Off, only their text.">
            <Switch label="Links" checked={s.markdownLinks} onChange={(markdownLinks) => void update({ markdownLinks })} />
          </Row>
        </Section>
        )}

        {brand.focusMode && (
        <Section title={<span className="inline-flex items-center gap-2">Focus mode <ProBadge /></span>}>
          <Row label="Dim the rest of the page" hint={`${s.focusDim}%: how dark everything around the article goes.`}>
            <input
              type="range" min={30} max={95} step={1} value={s.focusDim}
              onChange={(e) => void update({ focusDim: Number(e.target.value) })}
              className="w-40 accent-[var(--ink)] dark:accent-[var(--accent)]"
              aria-label="Dim"
            />
          </Row>
        </Section>
        )}

        <footer className="pt-2 text-center text-[12px] text-muted">
          {brand.name} {browser.runtime.getManifest().version} · Sign-in and payments by <a className="text-ink-2 underline decoration-line-strong underline-offset-[3px]" href="https://toolaby.app" target="_blank" rel="noreferrer">Toolaby</a>
        </footer>
      </div>
    </div>
  );
}

// What the Free plan lacks, by the parts this extension has: "Copy as Markdown and Focus mode come with Pro."
const paid = [brand.copyMarkdown && 'Copy as Markdown', brand.focusMode && 'Focus mode'].filter(Boolean);
const WITH_PRO = `${paid.join(' and ')} ${paid.length > 1 ? 'come' : 'comes'} with Pro.`;

/** The person's plan, from Toolaby: what they hold, what is left, and the one action that fits. */
function PlanCard({ user }: { user: User | null }) {
  const left = freeLeft(user);
  const signedIn = !!user?.account?.linked;
  const sub = user?.subscription;
  const renews = sub?.periodEnd ? new Date(sub.periodEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <Card className="relative overflow-hidden p-5">
        {user?.paid && <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full opacity-60 blur-3xl" style={{ background: 'var(--glow)' }} />}
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Your plan</p>
            <p className="mt-1 flex items-center gap-2 text-[20px] font-semibold tracking-[-0.02em] text-ink">
              {user?.paid ? (user.plan?.name ?? 'Pro') : 'Free'}
              {user?.paid && <ProBadge label={user.via === 'trial' ? 'Trial' : 'Active'} />}
            </p>
            <p className="mt-1 text-[13px] text-muted">
              {user?.paid
                ? sub ? (sub.cancelAtPeriodEnd ? `Ends on ${renews}.` : `Renews on ${renews}.`) : 'Yours for good.'
                : left ? left.text + '.' : WITH_PRO}
            </p>
            {left && <Meter className="mt-3" remaining={left.remaining} limit={left.limit} />}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {user?.paid
              ? <Button variant="secondary" onClick={() => void toolaby.openAccountPage()}>Manage plan</Button>
              : <Button onClick={() => void toolaby.openPaymentPage()}>See plans</Button>}
            {!signedIn && <Button variant="ghost" onClick={() => void toolaby.openLoginPage()}>Sign in</Button>}
          </div>
        </div>
        {signedIn && (
          <div className="relative mt-5 flex items-center justify-between border-t border-line pt-4 text-[13px]">
            <span className="flex min-w-0 items-center gap-2.5">
              {user?.account.image
                ? <img src={user.account.image} alt="" className="size-6 rounded-full" />
                : <span className="grid size-6 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-ink-2">{(user?.account.email ?? '?')[0]!.toUpperCase()}</span>}
              <span className="truncate text-ink-2">{user?.account.email}</span>
            </span>
            <button className="text-muted transition-colors hover:text-ink" onClick={() => void toolaby.signOut()}>Sign out</button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 px-1 text-[13px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      <Card className="divide-y divide-line">{children}</Card>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-[13px] text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
