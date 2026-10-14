import { useEffect } from 'react';
import { applyTheme } from '@/lib/theme';
import { settingsItem } from '@/lib/settings';
import { useStored } from './use-stored';

/** Keeps <html data-theme> on the person's choice, on every page that calls it. */
export function useTheme() {
  const [settings] = useStored(settingsItem);
  useEffect(() => applyTheme(settings.theme), [settings.theme]);
}
