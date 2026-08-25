import { Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getLocalDateString } from '@/utils/date';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';

import HomeScreen from '@/app/(tabs)/index';
import JournalScreen from '@/app/(tabs)/journal';
import CoachScreen from '@/app/(tabs)/coach';
import WorkoutScreen from '@/app/(tabs)/workout';
import SettingsScreen from '@/app/(tabs)/settings';
import ExploreScreen from '@/app/(tabs)/explore';
import { useAppTheme } from '@/context/ThemeContext';
import { useLocalDb } from '@/hooks/use-local-db';

const screens = [
  { route: '/', label: 'Trang chủ', icon: 'home', component: memo(HomeScreen) },
  { route: '/workout', label: 'Tập luyện', icon: 'barbell', component: memo(WorkoutScreen) },
  { route: '/explore', label: 'Cộng đồng', icon: 'globe', component: memo(ExploreScreen) },
  { route: '/coach', label: 'AI Coach', icon: 'sparkles', component: memo(CoachScreen) },
  { route: '/journal', label: 'Nhật ký', icon: 'book', component: memo(JournalScreen) },
  { route: '/settings', label: 'Hồ sơ', icon: 'person', component: memo(SettingsScreen) },
] as const;

export default function AppTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { setShouldTriggerScan } = useLocalDb();
  const { width: screenWidth } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && screenWidth > 768;

  const normalizedPath = pathname === '' || pathname === '/index' ? '/' : pathname;

  const initialIndex = useMemo(() => {
    const index = screens.findIndex((screen) => screen.route === normalizedPath);
    return index >= 0 ? index : 0;
  }, [normalizedPath]);

  const [activeTabIdx, setActiveTabIdx] = useState(initialIndex);
  const scrollViewRef = useRef<ScrollView>(null);

  // Sync initial tab position from URL path on load or desktop resize
  useEffect(() => {
    const foundIdx = screens.findIndex((screen) => screen.route === normalizedPath);
    if (foundIdx >= 0 && foundIdx !== activeTabIdx) {
      setActiveTabIdx(foundIdx);
      if (scrollViewRef.current && !isWebDesktop) {
        scrollViewRef.current.scrollTo({ x: foundIdx * screenWidth, animated: false });
      }
    }
  }, [normalizedPath, screenWidth, isWebDesktop]);

  const openCamera = () => {
    setShouldTriggerScan(true);
    const journalIdx = screens.findIndex(s => s.route === '/journal');
    if (journalIdx >= 0) {
      setActiveTabIdx(journalIdx);
      scrollViewRef.current?.scrollTo({ x: journalIdx * screenWidth, animated: true });
    }
  };

  const handleTabPress = (route: string, index: number) => {
    setActiveTabIdx(index);
    scrollViewRef.current?.scrollTo({ x: index * screenWidth, animated: true });
  };

  const handleScrollEnd = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / screenWidth);
    if (pageIndex >= 0 && pageIndex < screens.length) {
      setActiveTabIdx(pageIndex);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Realtime 1:1 Interactive Paging Container (Facebook Style Horizontal Swipe) */}
      {isWebDesktop ? (
        <View style={styles.screenContainer}>
          {screens.map((screen, index) => {
            const ScreenComponent = screen.component;
            if (index !== activeTabIdx) return null;
            return <ScreenComponent key={screen.route} />;
          })}
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={(e) => {
            if (Platform.OS === 'web') {
              handleScrollEnd(e);
            }
          }}
          style={styles.screenContainer}
          contentContainerStyle={{ width: screenWidth * screens.length }}
        >
          {screens.map((screen) => {
            const ScreenComponent = screen.component;
            return (
              <View key={screen.route} style={{ width: screenWidth, flex: 1 }}>
                <ScreenComponent />
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Floating Bottom Tab Bar (Only rendered on mobile / small screens) */}
      {!isWebDesktop && (
        <View style={styles.navWrap}>
          <View style={[styles.navInner, { backgroundColor: '#1E1A17', borderColor: 'rgba(255, 159, 28, 0.25)' }]}>
            {screens.map((screen, index) => {
              const active = index === activeTabIdx;
              const inactiveIcon = `${screen.icon}-outline`;
              return (
                <Pressable 
                  key={screen.route} 
                  onPress={() => handleTabPress(screen.route, index)} 
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
    maxWidth: 484,
    alignSelf: 'center',
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
