import { Colors, DarkColors, ColorScheme } from '../constants/colors';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Hook that returns the active color scheme based on the dark mode setting.
 * Use this instead of importing Colors directly for theme-aware components.
 */
export const useColors = (): ColorScheme => {
  const darkMode = useSettingsStore((state) => state.darkMode);
  return darkMode ? DarkColors : Colors;
};
