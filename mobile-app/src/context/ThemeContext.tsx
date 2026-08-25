import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ColorScheme, ThemeColors } from '@/constants/theme';

const THEME_STORAGE_KEY = '@bodyfit_theme';

interface ThemeContextType {
  colorScheme: ColorScheme;
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'dark',
  theme: Colors.dark,
  isDark: true,
  toggleTheme: () => {},
  setColorScheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('dark');

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setColorSchemeState(saved);
      }
    });
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setColorSchemeState((prev) => {
      const next: ColorScheme = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <ThemeContext.Provider value={{ colorScheme, theme, isDark, toggleTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
