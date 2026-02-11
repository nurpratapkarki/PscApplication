import { useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Hook that returns a function to pick the localized field from API data.
 * API data uses `_en` / `_np` suffix pattern for bilingual content.
 *
 * Usage:
 *   const t = useLocalizedField();
 *   t(item.name_en, item.name_np)  // returns the right one based on language
 */
export const useLocalizedField = () => {
  const language = useSettingsStore((state) => state.language);

  return useCallback(
    (enValue: string | undefined | null, npValue: string | undefined | null): string => {
      if (language === 'NP' && npValue) return npValue;
      return enValue || '';
    },
    [language],
  );
};
