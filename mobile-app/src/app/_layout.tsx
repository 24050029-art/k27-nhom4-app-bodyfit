import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { LocalDbProvider, useLocalDb } from '@/hooks/use-local-db';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import AuthScreen from '@/components/auth-screen';
import WebDesktopLayout from '@/components/web-desktop-layout';

function AppContent() {
  const { userToken } = useLocalDb();
  const { isDark } = useAppTheme();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'bf-disable-text-caret-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          *:not(input):not(textarea):not([contenteditable="true"]) {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
          }
          input, textarea, [contenteditable="true"] {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
            cursor: text !important;
          }
          *:not(input):not(textarea):not([contenteditable="true"]):focus {
            outline: none !important;
            box-shadow: none !important;
          }
          button, [role="button"], a, [tabindex], [data-focusable="true"] {
            user-select: none !important;
            -webkit-user-select: none !important;
            cursor: pointer !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  if (!userToken) {
    return (
      <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <AuthScreen />
      </NavThemeProvider>
    );
  }

  return (
    <WebDesktopLayout>
      <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="declare" />
          <Stack.Screen name="admin" />
          <Stack.Screen name="activity-schedule" />
          <Stack.Screen name="explore" />
          <Stack.Screen name="weight-tracker" />
          <Stack.Screen name="meal-plan" />
          <Stack.Screen name={'premium'} />
        </Stack>
      </NavThemeProvider>
    </WebDesktopLayout>
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <LocalDbProvider>
        <AnimatedSplashOverlay />
        <AppContent />
      </LocalDbProvider>
    </ThemeProvider>
  );
}
