import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Check, Info } from 'lucide-react';

type Toast = { id: number; title: string; detail?: string; tone: 'success' | 'info' };
const Ctx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {});

/** One toast at a time, at the top of the surface: the latest replaces the one before. */
export function Toaster({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((t: Omit<Toast, 'id'>) => {
    clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3">
        <AnimatePresence mode="popLayout">
          {toast && (
            <motion.div
              key={toast.id}
              role="status"
              initial={{ opacity: 0, y: -14, scale: 0.96, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 520, damping: 34 }}
              className="pointer-events-auto flex max-w-full items-center gap-2.5 rounded-[13px] border border-line bg-surface/90 py-2 pr-3.5 pl-2.5 shadow-card backdrop-blur-xl"
            >
              <span className={toast.tone === 'success' ? 'grid size-6 place-items-center rounded-full bg-accent text-accent-ink' : 'grid size-6 place-items-center rounded-full bg-surface-2 text-ink-2'}>
                {toast.tone === 'success' ? <Check className="size-3.5" strokeWidth={3} /> : <Info className="size-3.5" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-ink">{toast.title}</span>
                {toast.detail && <span className="block truncate text-[12px] text-muted">{toast.detail}</span>}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
