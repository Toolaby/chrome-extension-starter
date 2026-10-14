// The welcome page's backdrop: slow lights drifting behind a fine grain, fading into the page. CSS only, so it
// costs nothing when the tab is in the background and stops for people who ask for less motion.
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes drift-a { 0%,100% { transform: translate(-10%, -6%) scale(1) } 50% { transform: translate(8%, 6%) scale(1.15) } }
        @keyframes drift-b { 0%,100% { transform: translate(12%, 4%) scale(1.1) } 50% { transform: translate(-6%, -8%) scale(.95) } }
        @keyframes drift-c { 0%,100% { transform: translate(0, 10%) scale(.9) } 50% { transform: translate(4%, -4%) scale(1.1) } }
        @media (prefers-reduced-motion: reduce) { .aurora-blob { animation: none !important } }
      `}</style>
      <div className="absolute left-1/2 top-[-260px] h-[640px] w-[1100px] -translate-x-1/2">
        <div className="aurora-blob absolute left-[18%] top-[20%] size-[460px] rounded-full opacity-70 blur-[90px] dark:opacity-25" style={{ background: 'oklch(0.92 0.2 121 / .55)', animation: 'drift-a 18s ease-in-out infinite' }} />
        <div className="aurora-blob absolute right-[16%] top-[14%] size-[420px] rounded-full opacity-60 blur-[100px] dark:opacity-40" style={{ background: 'oklch(0.85 0.12 195 / .45)', animation: 'drift-b 22s ease-in-out infinite' }} />
        <div className="aurora-blob absolute left-[42%] top-[38%] size-[360px] rounded-full opacity-50 blur-[90px] dark:opacity-15" style={{ background: 'oklch(0.9 0.15 95 / .4)', animation: 'drift-c 26s ease-in-out infinite' }} />
      </div>
      {/* A dotted field under the light, fading out toward the content. */}
      <div className="absolute inset-0 opacity-[.35] dark:opacity-[.18]"
        style={{ backgroundImage: 'radial-gradient(var(--line-strong) 1px, transparent 1px)', backgroundSize: '22px 22px', maskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, #000 30%, transparent 75%)' }} />
      <div className="absolute inset-0 opacity-[.06] mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-bg" />
    </div>
  );
}
