import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getLocalDateString } from '@/utils/date';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, PanResponder, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';

import HomeScreen from '@/app/(tabs)/index';
import JournalScreen from '@/app/(tabs)/journal';
import CoachScreen from '@/app/(tabs)/coach';
import WorkoutScreen from '@/app/(tabs)/workout';
import SettingsScreen from '@/app/(tabs)/settings';
import { useAppTheme } from '@/context/ThemeContext';
import { useLocalDb } from '@/hooks/use-local-db';

const screens = [
  { route: '/', label: 'Trang chủ', icon: 'home', component: memo(HomeScreen) },
  { route: '/workout', label: 'Tập luyện', icon: 'barbell', component: memo(WorkoutScreen) },
  { route: '/coach', label: 'AI Coach', icon: 'sparkles', component: memo(CoachScreen) },
  { route: '/journal', label: 'Nhật ký', icon: 'book', component: memo(JournalScreen) },
  { route: '/settings', label: 'Hồ sơ', icon: 'person', component: memo(SettingsScreen) },
] as const;

const { width: windowWidth } = Dimensions.get('window');

export default function AppTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { triggerMockScanFood, addFoodLog, setShouldTriggerScan } = useLocalDb();

  const normalizedPath = pathname === '' || pathname === '/index' ? '/' : pathname;

  const currentIndex = useMemo(() => {
    const index = screens.findIndex((screen) => screen.route === normalizedPath);
    return index >= 0 ? index : 0;
  }, [normalizedPath]);

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const prevIndexRef = useRef(currentIndex);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const prevIndex = prevIndexRef.current;
    if (prevIndex !== currentIndex) {
      // Dynamic directional slide logic:
      // If target index > previous index (moving right), slide in from right (+windowWidth -> 0)
      // If target index < previous index (moving left), slide in from left (-windowWidth -> 0)
      const initialOffset = currentIndex > prevIndex ? windowWidth : -windowWidth;

      slideAnim.setValue(initialOffset);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 26,
        stiffness: 220,
        mass: 0.7,
      }).start();

      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex, slideAnim]);

  const openCamera = () => {
    setShouldTriggerScan(true);
    router.replace('/journal');
  };

  const handleTabPress = (route: string) => {
    if (route !== normalizedPath) {
      router.replace(route as any);
    }
  };

  // PanResponder to handle horizontal swipe gestures across tabs
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger on clear horizontal swipes (> 28px) where horizontal delta is significantly larger than vertical
        return Math.abs(gestureState.dx) > 28 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.6;
      },
      onPanResponderRelease: (_, gestureState) => {
        const curIndex = currentIndexRef.current;
        if (gestureState.dx < -45) {
          // Swipe Left -> Navigate to Next Tab
          if (curIndex < screens.length - 1) {
            handleTabPress(screens[curIndex + 1].route);
          }
        } else if (gestureState.dx > 45) {
          // Swipe Right -> Navigate to Previous Tab
          if (curIndex > 0) {
            handleTabPress(screens[curIndex - 1].route);
          }
        }
      },
    })
  ).current;

  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 768;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* High Performance Screen Container with PanResponder Swipe Gestures */}
      <View style={styles.screenContainer} {...panResponder.panHandlers}>
        {screens.map((screen, index) => {
          const Screen = screen.component;
          const active = index === currentIndex;

          if (!active) {
            return (
              <View
                key={screen.route}
                style={[
                  StyleSheet.absoluteFillObject,
                  { display: 'none' },
                ]}
              >
                <Screen />
              </View>
            );
          }

          return (
            <Animated.View
              key={screen.route}
              style={[
                StyleSheet.absoluteFillObject,
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              <Screen />
            </Animated.View>
          );
        })}
      </View>

      {/* Floating Bottom Tab Bar (Only rendered on mobile screens) */}
      {!isWebDesktop && (
        <View style={styles.navWrap}>
          <View style={[styles.navInner, { backgroundColor: '#1E1A17', borderColor: 'rgba(255, 159, 28, 0.25)' }]}>
            {screens.map((screen, index) => {
              const active = index === currentIndex;
              const inactiveIcon = `${screen.icon}-outline`;
              return (
                <Pressable 
                  key={screen.route} 
                  onPress={() => handleTabPress(screen.route)} 
                  style={active ? styles.navButtonActive : styles.navButton}
                >
                  {active ? (
                    <View style={[styles.navActive, { backgroundColor: theme.primary }]}>
                      <Ionicons name={screen.icon as any} size={15} color="#100E0C" />
                      <Text style={styles.navActiveText} numberOfLines={1}>{screen.label}</Text>
                    </View>
                  ) : (
                    <View style={styles.navInactive}>
                      <Ionicons name={inactiveIcon as any} size={17} color={theme.tabBarInactive} />
                      <Text style={[styles.navInactiveText, { color: theme.tabBarInactive }]}>{screen.label}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Floating Camera Button */}
          <Pressable onPress={openCamera} style={[styles.cameraButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="camera" size={22} color="#100E0C" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  screenContainer: { flex: 1, position: 'relative' },
  navWrap: { 
    position: 'absolute', 
    left: 8, 
    right: 8, 
    bottom: Platform.OS === 'ios' ? 24 : 14, 
    zIndex: 40, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
  },
  navInner: { 
    flex: 1, 
    height: 54, 
    borderRadius: 999, 
    borderWidth: 1.2, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 4, 
    justifyContent: 'space-around',
  },
  navButton: { 
    flex: 1, 
    height: 42, 
    borderRadius: 999, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  navButtonActive: { 
    flex: 1.4, 
    height: 42, 
    borderRadius: 999, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  navActive: { 
    width: '100%', 
    height: 38, 
    borderRadius: 999, 
    paddingHorizontal: 6, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row', 
    gap: 3,
  },
  navActiveText: { 
    color: '#100E0C', 
    fontSize: 11, 
    fontWeight: '900',
  },
  navInactive: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navInactiveText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cameraButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FF9F1C',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
