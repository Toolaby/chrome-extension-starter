import { useEffect, useState } from 'react';
import { toolaby, type User } from '@/toolaby.js';

/**
 * Who is using the extension, from Toolaby: their plan, the free uses left, and whether they hold Focus mode.
 * Drawn from the device's record at once (no request), then refreshed once, then kept current: a purchase made
 * in another window shows here without reopening.
 */
export function useToolaby() {
  const [user, setUser] = useState<User | null>(null);
  const [hasFocus, setHasFocus] = useState(false);
  useEffect(() => {
    let live = true;
    const load = async (next?: User) => {
      const u = next ?? (await toolaby.getUser());
      const focus = await toolaby.has('focus');
      if (live) { setUser(u); setHasFocus(focus); }
    };
    void load();
    toolaby.refresh().then((u) => load(u), () => {});
    const onChange = (u: User) => void load(u);
    toolaby.onChange.addListener(onChange);
    return () => { live = false; toolaby.onChange.removeListener(onChange); };
  }, []);
  return { user, hasFocus };
}

/** "3 free left today", "1 free left this week", or null on a plan that does not count. */
export function freeLeft(user: User | null): { remaining: number; limit: number; text: string } | null {
  const u = user?.usage;
  if (!user || user.paid || !u || u.unlimited || u.remaining == null) return null;
  const when = { ever: '', day: ' today', week: ' this week', month: ' this month' }[u.per];
  return { remaining: u.remaining, limit: u.limit, text: `${u.remaining} free left${when}` };
}
