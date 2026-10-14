import { ArrowUpRight, Check, Clipboard, Focus, MousePointerClick, Pin, Puzzle } from 'lucide-react';
import { motion } from 'motion/react';
import { toolaby } from '@/toolaby.js';
import { Aurora } from '@/components/brand/aurora';
import { Logo } from '@/components/brand/logo';
import { BlurText } from '@/components/ui/blur-text';
import { Button } from '@/components/ui/button';
import { ProBadge } from '@/components/ui/pro-badge';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { useTheme } from '@/hooks/use-theme';
import { useToolaby } from '@/hooks/use-toolaby';

// Opened once, when Glance is installed (entrypoints/background.ts). It has one job: get the person to their
// first glance in under a minute. Pin it, open an article, click it.
const SAMPLE = 'https://en.wikipedia.org/wiki/Speed_reading';

const rise = (delay: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } });

export function App() {
  useTheme();
  const { user } = useToolaby();
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg">
      <Aurora />
      <main className="relative mx-auto flex max-w-[1040px] flex-col px-6 pt-20 pb-24">
        <motion.div {...rise(0)} className="flex items-center gap-2.5 self-center rounded-full border border-line bg-surface/70 py-1 pr-3 pl-1 shadow-card backdrop-blur">
          <Logo className="size-6" />
          <span className="text-[13px] font-medium text-ink-2">Installed. You’re ready.</span>
        </motion.div>

        <h1 className="mx-auto mt-8 max-w-[760px] text-center text-[clamp(40px,6.4vw,72px)] font-semibold leading-[1.02] tracking-[-0.045em] text-ink text-balance">
          <BlurText text="Know any page" delay={0.1} />
          <br />
          <BlurText text="at a glance." delay={0.35} className="bg-gradient-to-r from-ink via-ink-2 to-ink bg-clip-text" />
        </h1>
        <motion.p {...rise(0.6)} className="mx-auto mt-5 max-w-[520px] text-center text-[17px] leading-relaxed text-muted text-pretty">
          How long it takes to read, how it’s built, and the whole thing as clean Markdown, one click away.
        </motion.p>
        <motion.div {...rise(0.75)} className="mt-9 flex flex-wrap justify-center gap-3">
          <a href={SAMPLE} target="_blank" rel="noreferrer"><Button size="lg">Try it on an article <ArrowUpRight className="size-4" /></Button></a>
          <Button size="lg" variant="secondary" onClick={() => void browser.runtime.openOptionsPage()}>Settings</Button>
        </motion.div>

        <motion.div {...rise(0.9)}><PinHint /></motion.div>

        <section className="mt-24 grid gap-4 md:grid-cols-3">
          {[
            { icon: MousePointerClick, title: 'Open any article', body: 'Click Glance on a page for its read time, word count and outline. Free, always.' },
            { icon: Clipboard, title: 'Copy it as Markdown', body: 'Headings, links, images, code and tables, ready for your notes. Three a day are free.' },
            { icon: Focus, title: 'Read in Focus mode', body: 'Everything but the article dims and softens until you press Esc.', pro: true },
          ].map((s, i) => (
            <motion.div key={s.title} {...rise(1 + i * 0.08)}>
              <SpotlightCard className="h-full">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-[12px] border border-line bg-surface-2 text-ink"><s.icon className="size-[18px]" /></span>
                  <span className="font-mono text-[12px] text-muted">0{i + 1}</span>
                </div>
                <h3 className="mt-6 flex items-center gap-2 text-[16px] font-semibold tracking-[-0.02em] text-ink">{s.title}{s.pro && <ProBadge />}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{s.body}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </section>

        {!user?.paid && (
          <motion.section {...rise(1.2)} className="relative mt-4 overflow-hidden rounded-[22px] border border-line bg-surface p-8 shadow-card md:p-10">
            <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-32 size-[420px] rounded-full blur-3xl" style={{ background: 'var(--glow)' }} />
            <div className="relative grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
              <div>
                <ProBadge />
                <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-[-0.035em] text-ink text-balance">Read more, carry more. Glance Pro.</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">Unlimited Markdown, Focus mode on every page. Cancel any time.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button size="lg" onClick={() => void toolaby.openPaymentPage()}>See plans</Button>
                  {!user?.account?.linked && <Button size="lg" variant="ghost" onClick={() => void toolaby.openLoginPage()}>I already have Pro</Button>}
                </div>
              </div>
              <ul className="flex flex-col gap-3">
                {['Unlimited copies as Markdown', 'Focus mode on any page', 'On every computer you sign in on', 'Supports an independent developer'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[14px] text-ink-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-ink"><Check className="size-3" strokeWidth={3} /></span>{f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}

/** A small copy of Chrome's toolbar, showing where the pin is. */
function PinHint() {
  return (
    <div className="mx-auto mt-14 flex w-full max-w-[560px] flex-col items-center gap-4">
      <div className="flex w-full items-center gap-2 rounded-[14px] border border-line bg-surface/80 p-2 shadow-card backdrop-blur">
        <div className="flex gap-1.5 px-1">{[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-line-strong" />)}</div>
        <div className="h-7 flex-1 rounded-[8px] bg-surface-2 px-3 text-[12px] leading-7 text-muted">en.wikipedia.org/wiki/Speed_reading</div>
        <span className="relative grid size-7 place-items-center rounded-[8px] text-muted"><Puzzle className="size-4" /></span>
        <span className="relative grid size-7 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-[9px] bg-accent/40" style={{ animationDuration: '2.2s' }} />
          <Logo className="relative size-6" />
        </span>
      </div>
      <p className="flex items-center gap-2 text-[13px] text-muted"><Pin className="size-3.5" /> Pin Glance: click <Puzzle className="inline size-3.5" /> in Chrome’s toolbar, then the pin beside Glance.</p>
    </div>
  );
}
