/**
 * Hook to access the current app theme (light/dark).
 * Uses ThemeContext for user-controlled toggling via Settings.
 */
import { useAppTheme } from '@/context/ThemeContext';

export function useTheme() {
  return useAppTheme().theme;
}

export { useAppTheme };
