import { useEffect, useState } from 'react';
import type { WxtStorageItem } from '#imports';

/** A storage item's value, kept current across every open page of the extension. */
export function useStored<T>(item: WxtStorageItem<T, Record<string, unknown>>) {
  const [value, setValue] = useState<T>(item.fallback);
  useEffect(() => {
    void item.getValue().then(setValue);
    return item.watch((v) => setValue(v ?? item.fallback));
  }, [item]);
  const update = async (patch: Partial<T>) => {
    const next = { ...(await item.getValue()), ...patch } as T;
    setValue(next);
    await item.setValue(next);
  };
  return [value, update, setValue] as const;
}
