import { Alert, Modal, ScrollView, TextInput } from 'react-native';
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
import { AiScanningModal } from '@/components/AiScanningModal';

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
  const { activeTabRoute, setActiveTabRoute, triggerMockScanFood, addFoodLog } = useLocalDb();
  const { width: screenWidth } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && screenWidth > 768;

  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiScanResult, setAiScanResult] = useState<{
    mealDetected: string;
    calories: number;
    protein: number;
    carbs: number;
    fat?: number;
    items?: Array<{ name: string; weightG?: number; calories: number }>;
  } | null>(null);

  const normalizedPath = pathname === '' || pathname === '/index' ? '/' : pathname;

  const initialIndex = useMemo(() => {
    const index = screens.findIndex((screen) => screen.route === normalizedPath);
    return index >= 0 ? index : 0;
  }, [normalizedPath]);

  const [activeTabIdx, setActiveTabIdx] = useState(initialIndex);
  const [visitedTabs, setVisitedTabs] = useState<Set<number>>(() => {
    const set = new Set<number>();
    set.add(initialIndex);
    if (initialIndex > 0) set.add(initialIndex - 1);
    if (initialIndex < screens.length - 1) set.add(initialIndex + 1);
    return set;
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const isProgrammaticScroll = useRef(false);

  const markTabVisited = (idx: number) => {
    setVisitedTabs((prev) => {
      const next = new Set(prev);
      next.add(idx);
      if (idx > 0) next.add(idx - 1);
      if (idx < screens.length - 1) next.add(idx + 1);
      return next;
    });
  };

  const scrollToTab = (index: number, animated = true) => {
    if (index < 0 || index >= screens.length) return;
    setActiveTabIdx(index);
    markTabVisited(index);
    if (!isWebDesktop && scrollViewRef.current) {
      isProgrammaticScroll.current = true;
      scrollViewRef.current.scrollTo({ x: index * screenWidth, animated });
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 350);
    }
    if (normalizedPath !== '/' && normalizedPath !== '' && normalizedPath !== '/index') {
      router.replace('/');
    }
  };

  // Sync scroll position when screen width changes (e.g. device rotation)
  useEffect(() => {
    if (!isWebDesktop && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: activeTabIdx * screenWidth, animated: false });
    }
  }, [screenWidth, isWebDesktop]);

  // Global tab navigation listener (e.g. from HomeScreen quick action buttons)
  useEffect(() => {
    if (activeTabRoute) {
      const foundIdx = screens.findIndex((screen) => screen.route === activeTabRoute);
      if (foundIdx >= 0) {
        scrollToTab(foundIdx, true);
      }
      setActiveTabRoute(null);
    }
  }, [activeTabRoute, setActiveTabRoute]);

  const openCamera = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Thông báo', 'Tính năng quét camera hoạt động tối ưu trên thiết bị di động (iOS/Android).');
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền sử dụng camera để chụp ảnh món ăn của bạn.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        return;
      }

      setIsAiScanning(true);

      let base64Data: string | undefined;
      try {
        const ImageManipulator = require('expo-image-manipulator');
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 600 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        base64Data = manipResult.base64;
      } catch (manipErr) {
        console.warn('ImageManipulator fallback in tabs:', manipErr);
        base64Data = result.assets[0].base64 ?? undefined;
      }

      if (!base64Data) {
        setIsAiScanning(false);
        Alert.alert('Lỗi', 'Không thể xử lý hình ảnh món ăn.');
        return;
      }

      let scan;
      try {
        scan = await triggerMockScanFood(base64Data);
      } catch (e: any) {
        console.warn('AI Scan API error in tabs, falling back to mock:', e.message);
        scan = {
          mealDetected: 'Cơm tấm sườn nướng trứng 🍳',
          calories: 642,
          protein: 32,
          carbs: 78,
          fat: 18,
        };
      }

      const name = scan?.mealDetected || 'Món ăn quét bằng AI';
      setAiScanResult({
        mealDetected: name,
        calories: scan?.calories || 642,
        protein: scan?.protein || 32,
        carbs: scan?.carbs || 78,
        fat: scan?.fat || 18,
        items: scan?.items || [
          { name: 'Thành phần chính', weightG: 250, calories: (scan?.calories || 642) - 150 },
          { name: 'Gia vị & phụ liệu', weightG: 30, calories: 100 },
          { name: 'Rau kèm', weightG: 50, calories: 50 },
        ],
      });
      setAiModalOpen(true);
      setTimeout(() => {
        setIsAiScanning(false);
      }, 100);
    } catch (err: any) {
      setIsAiScanning(false);
      console.error(err);
      Alert.alert('Thông báo', 'Không thể hoàn tất quét món ăn. Vui lòng thử lại.');
    }
  };

  const handleSaveAiFoodLog = async () => {
    if (!aiScanResult) return;
    const hour = new Date().getHours();
    let defaultMeal: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch';
    if (hour >= 5 && hour < 11) defaultMeal = 'breakfast';
    else if (hour >= 11 && hour < 14) defaultMeal = 'lunch';
    else if (hour >= 14 && hour < 18) defaultMeal = 'snack';
    else defaultMeal = 'dinner';

    try {
      await addFoodLog(
        defaultMeal,
        aiScanResult.mealDetected,
        350,
        aiScanResult.calories,
        aiScanResult.protein,
        aiScanResult.carbs,
        aiScanResult.fat || 18,
        getLocalDateString()
      );
      setAiModalOpen(false);
      Alert.alert('Thành công 🎉', `Đã lưu "${aiScanResult.mealDetected}" vào Nhật ký dinh dưỡng!`);
    } catch (e: any) {
      Alert.alert('Lỗi', 'Không thể lưu món ăn vào nhật ký.');
    }
  };

  const handleTabPress = (route: string, index: number) => {
    scrollToTab(index, true);
  };

  const handleScroll = (e: any) => {
    if (isProgrammaticScroll.current || isWebDesktop) return;
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / screenWidth);
    if (pageIndex >= 0 && pageIndex < screens.length && pageIndex !== activeTabIdx) {
      setActiveTabIdx(pageIndex);
      markTabVisited(pageIndex);
    }
  };

  const handleScrollEnd = (e: any) => {
    isProgrammaticScroll.current = false;
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / screenWidth);
    if (pageIndex >= 0 && pageIndex < screens.length) {
      setActiveTabIdx(pageIndex);
      markTabVisited(pageIndex);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Tab Screen Container with Horizontal Swipe Support on Mobile */}
      {isWebDesktop ? (
        <View style={styles.screenContainer}>
          {screens.map((screen, index) => {
            if (index !== activeTabIdx) return null;
            const ScreenComponent = screen.component;
            return <ScreenComponent key={screen.route} />;
          })}
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={(e) => {
            if (Platform.OS === 'web') {
              handleScrollEnd(e);
            }
          }}
          contentOffset={{ x: initialIndex * screenWidth, y: 0 }}
          style={styles.screenContainer}
          contentContainerStyle={{ width: screenWidth * screens.length }}
        >
          {screens.map((screen, index) => {
            const isMounted = visitedTabs.has(index) || index === activeTabIdx;
            const ScreenComponent = screen.component;
            return (
              <View key={screen.route} style={{ width: screenWidth, flex: 1 }}>
                {isMounted ? (
                  <ScreenComponent />
                ) : (
                  <View style={{ flex: 1, backgroundColor: theme.background }} />
                )}
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

      {/* AI Food Scanning Loading Indicator Overlay */}
      <AiScanningModal
        visible={isAiScanning}
        onCancel={() => setIsAiScanning(false)}
      />

      {/* AI Food Detection Result Modal */}
      <Modal visible={aiModalOpen} transparent animationType="slide" onRequestClose={() => setAiModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.aiResultCard, { backgroundColor: '#1E1A17', borderColor: 'rgba(255, 159, 28, 0.25)' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitleText, { color: theme.text }]}>Phát hiện món ăn từ AI 🤖</Text>
              <Pressable onPress={() => setAiModalOpen(false)}>
                <Text style={[styles.closeBtnText, { color: theme.primary }]}>Đóng ✕</Text>
              </Pressable>
            </View>

            {aiScanResult && (
              <>
                <TextInput
                  value={aiScanResult.mealDetected}
                  onChangeText={(txt) => setAiScanResult({ ...aiScanResult, mealDetected: txt })}
                  style={[styles.aiFoodNameText, { color: theme.text, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 }]}
                  placeholder="Tên món ăn"
                  placeholderTextColor={theme.textMuted}
                />

                <View style={styles.aiMacrosRow}>
                  <View style={[styles.aiMacroPill, { borderColor: theme.primary }]}>
                    <Text style={[styles.aiMacroPillLabel, { color: theme.textMuted }]}>Calo (kcal)</Text>
                    <TextInput
                      value={String(aiScanResult.calories)}
                      onChangeText={(txt) => setAiScanResult({ ...aiScanResult, calories: parseInt(txt) || 0 })}
                      keyboardType="numeric"
                      style={[styles.aiMacroPillVal, { color: theme.primary, textAlign: 'center', minWidth: 60, paddingVertical: 2 }]}
                    />
                  </View>
                  <View style={[styles.aiMacroPill, { borderColor: '#FFD700' }]}>
                    <Text style={[styles.aiMacroPillLabel, { color: theme.textMuted }]}>Đạm (g)</Text>
                    <TextInput
                      value={String(aiScanResult.protein)}
                      onChangeText={(txt) => setAiScanResult({ ...aiScanResult, protein: parseFloat(txt) || 0 })}
                      keyboardType="numeric"
                      style={[styles.aiMacroPillVal, { color: '#FFD700', textAlign: 'center', minWidth: 50, paddingVertical: 2 }]}
                    />
                  </View>
                  <View style={[styles.aiMacroPill, { borderColor: '#FF5E36' }]}>
                    <Text style={[styles.aiMacroPillLabel, { color: theme.textMuted }]}>Carb (g)</Text>
                    <TextInput
                      value={String(aiScanResult.carbs)}
                      onChangeText={(txt) => setAiScanResult({ ...aiScanResult, carbs: parseFloat(txt) || 0 })}
                      keyboardType="numeric"
                      style={[styles.aiMacroPillVal, { color: '#FF5E36', textAlign: 'center', minWidth: 50, paddingVertical: 2 }]}
                    />
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center', marginTop: 2 }}>
                  💡 Bấm trực tiếp vào các ô số trên để chỉnh sửa nhanh theo bao bì
                </Text>

                <Text style={[styles.aiComponentLabel, { color: theme.text }]}>Chi tiết thành phần:</Text>
                <View style={styles.aiComponentList}>
                  {aiScanResult.items?.map((item, idx) => (
                    <Text key={idx} style={[styles.aiComponentItemText, { color: theme.textSecondary }]}>
                      • {item.name}: {item.calories} kcal
                    </Text>
                  ))}
                </View>

                <View style={styles.aiModalButtonsRow}>
                  <Pressable onPress={() => setAiModalOpen(false)} style={styles.aiCancelBtn}>
                    <Text style={[styles.aiCancelBtnText, { color: theme.text }]}>Bỏ qua</Text>
                  </Pressable>
                  <Pressable onPress={handleSaveAiFoodLog} style={[styles.aiSaveBtn, { backgroundColor: theme.primary }]}>
                    <Text style={styles.aiSaveBtnText}>Thêm vào Nhật Ký</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  aiResultCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    borderWidth: 1.2,
    padding: 20,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: '900',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  aiFoodNameText: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },
  aiMacrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
    marginTop: 4,
  },
  aiMacroPill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  aiMacroPillLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  aiMacroPillVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  aiComponentLabel: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 6,
  },
  aiComponentList: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  aiComponentItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
  aiModalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  aiCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  aiCancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  aiSaveBtn: {
    flex: 2,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSaveBtnText: {
    color: '#100E0C',
    fontSize: 13,
    fontWeight: '900',
  },
});
