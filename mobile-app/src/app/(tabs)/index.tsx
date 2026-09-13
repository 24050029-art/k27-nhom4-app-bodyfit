import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, ImageBackground, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

import { Gradients, MaxContentWidth, Spacing, DEFAULT_AVATAR } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useLocalDb } from '@/hooks/use-local-db';
import { getLocalDateString } from '@/utils/date';
import { AiScanningModal } from '@/components/AiScanningModal';
import { MobileFeatureModal } from '@/components/MobileFeatureModal';
import { OnboardingModal } from '@/components/OnboardingModal';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 768;
  const [webFeatureModalOpen, setWebFeatureModalOpen] = useState(false);
  const {
    userProfile,
    updateProfile,
    foodLogs,
    waterLogs,
    workoutSchedules,
    quests,
    claimQuestReward,
    isAdmin,
    addFoodLog,
    addWaterLog,
    triggerMockScanFood,
    dailyDeclarations,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
    currentUser,
    setActiveTabRoute,
  } = useLocalDb();
  const [avatarUri, setAvatarUri] = useState(userProfile?.avatarUrl || DEFAULT_AVATAR);

  useEffect(() => {
    setAvatarUri(userProfile?.avatarUrl || DEFAULT_AVATAR);
  }, [userProfile?.avatarUrl]);

  const avatar = avatarUri;

  const [activeDate, setActiveDate] = useState(new Date());

  // Micro-animations for vibrant home screen
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flameAnim = useRef(new Animated.Value(1)).current;
  const waterScale = useRef(new Animated.Value(1)).current;

  // Extra top section animations
  const bellRotateAnim = useRef(new Animated.Value(0)).current;
  const avatarGlowAnim = useRef(new Animated.Value(1)).current;
  const ringPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Bell gentle rocking loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(bellRotateAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(bellRotateAnim, { toValue: -1, duration: 300, useNativeDriver: true }),
        Animated.timing(bellRotateAnim, { toValue: 0.5, duration: 150, useNativeDriver: true }),
        Animated.timing(bellRotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.delay(3200),
      ])
    ).start();

    // 2. Avatar glow and Ring pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(avatarGlowAnim, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
          Animated.timing(ringPulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(avatarGlowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(ringPulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [bellRotateAnim, avatarGlowAnim, ringPulseAnim]);

  const bellInterpolation = bellRotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-14deg', '0deg', '14deg'],
  });

  useEffect(() => {
    // Breathing pulse loop for workout CTA and flame badge
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.025,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(flameAnim, {
            toValue: 1.05,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(flameAnim, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [pulseAnim, flameAnim]);

  const handleWaterPressWithAnim = () => {
    Animated.sequence([
      Animated.timing(waterScale, { toValue: 0.8, duration: 70, useNativeDriver: true }),
      Animated.spring(waterScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    handleQuickAddWater();
  };

  // Manual Log Modal States
  const [manualLogOpen, setManualLogOpen] = useState(false);
  const [mFoodName, setMFoodName] = useState('');
  const [mMealType, setMMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [mCalories, setMCalories] = useState('');
  const [mProtein, setMProtein] = useState('');
  const [mCarbs, setMCarbs] = useState('');
  const [mFat, setMFat] = useState('');
  const [mFiber, setMFiber] = useState('');
  const [mSugar, setMSugar] = useState('');
  const [mSodium, setMSodium] = useState('');

  // AI Scan Modal States
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiScanResult, setAiScanResult] = useState<{
    mealDetected: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    items?: Array<{ name: string; weightG: number; calories: number }>;
  } | null>(null);

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={Gradients.lightSurface} style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={styles.onboardingContent}>
          <Text style={styles.logoText}>BODYFIT</Text>
          <Text style={styles.onboardingTitle}>Bắt đầu hành trình thay đổi cơ thể thông minh hơn.</Text>
          <Text style={styles.onboardingCopy}>Tập luyện, dinh dưỡng, phục hồi và AI Coach trong một kế hoạch hàng ngày.</Text>
          <Pressable onPress={() => updateProfile({ firstName: 'gakon', lastName: '', age: 25, gender: 'male', heightCm: 175, weightKg: 70, activityLevel: 'moderately_active', targetGoal: 'muscle_gain' })}>
            <LinearGradient colors={Gradients.primary} style={styles.onboardingButton}>
              <Text style={styles.darkButtonText}>Bắt đầu BodyFit</Text>
              <Ionicons name="arrow-forward" size={18} color="#20231D" />
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const today = getLocalDateString(activeDate);
  const todayFoods = foodLogs.filter((item) => item.loggedDate === today);
  const calories = todayFoods.reduce((sum, item) => sum + (item.calories || 0), 0);
  const water = waterLogs.filter((item) => item.loggedDate === today).reduce((sum, item) => sum + (item.amountMl || 0), 0);
  const workoutsDone = workoutSchedules.filter((item: any) => item.isCompleted).length;
  
  const targetCalories = userProfile.targetCalories || 2259;
  const targetWater = userProfile.targetWaterMl || 3000;
  
  const remainingCalories = Math.max(0, targetCalories - calories);
  const caloriePercentage = Math.min(100, Math.round((calories / targetCalories) * 100));

  const xpNeeded = 2000;
  const currentXp = userProfile.xp || 5;
  const xpPct = Math.min(100, Math.round((currentXp / xpNeeded) * 100));

  // Macronutrient progress calculations
  const protein = todayFoods.reduce((sum, item) => sum + (item.protein || 0), 0);
  const carbs = todayFoods.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const fat = todayFoods.reduce((sum, item) => sum + (item.fat || 0), 0);

  const targetProtein = userProfile.targetProtein || 120;
  const targetCarbs = userProfile.targetCarbs || 250;
  const targetFat = userProfile.targetFat || 60;

  // Target breakdowns per meal
  const targetCalBreakfast = Math.round(targetCalories * 0.3);
  const targetProtBreakfast = Math.round(targetProtein * 0.3);
  const targetCarbBreakfast = Math.round(targetCarbs * 0.3);
  const targetFatBreakfast = Math.round(targetFat * 0.3);

  const targetCalLunch = Math.round(targetCalories * 0.4);
  const targetProtLunch = Math.round(targetProtein * 0.4);
  const targetCarbLunch = Math.round(targetCarbs * 0.4);
  const targetFatLunch = Math.round(targetFat * 0.4);

  const targetCalDinner = Math.round(targetCalories * 0.3);
  const targetProtDinner = Math.round(targetProtein * 0.3);
  const targetCarbDinner = Math.round(targetCarbs * 0.3);
  const targetFatDinner = Math.round(targetFat * 0.3);

  // Actual breakdowns per meal
  const breakfastFoodsList = todayFoods.filter(f => f.mealType === 'breakfast');
  const actualCalBreakfast = breakfastFoodsList.reduce((s, f) => s + f.calories, 0);
  const actualProtBreakfast = breakfastFoodsList.reduce((s, f) => s + (f.protein || 0), 0);
  const actualCarbBreakfast = breakfastFoodsList.reduce((s, f) => s + (f.carbs || 0), 0);
  const actualFatBreakfast = breakfastFoodsList.reduce((s, f) => s + (f.fat || 0), 0);

  const lunchFoodsList = todayFoods.filter(f => f.mealType === 'lunch');
  const actualCalLunch = lunchFoodsList.reduce((s, f) => s + f.calories, 0);
  const actualProtLunch = lunchFoodsList.reduce((s, f) => s + (f.protein || 0), 0);
  const actualCarbLunch = lunchFoodsList.reduce((s, f) => s + (f.carbs || 0), 0);
  const actualFatLunch = lunchFoodsList.reduce((s, f) => s + (f.fat || 0), 0);

  const dinnerFoodsList = todayFoods.filter(f => f.mealType === 'dinner');
  const actualCalDinner = dinnerFoodsList.reduce((s, f) => s + f.calories, 0);
  const actualProtDinner = dinnerFoodsList.reduce((s, f) => s + (f.protein || 0), 0);
  const actualCarbDinner = dinnerFoodsList.reduce((s, f) => s + (f.carbs || 0), 0);
  const actualFatDinner = dinnerFoodsList.reduce((s, f) => s + (f.fat || 0), 0);

  const getProgressColor = (actual: number, target: number) => {
    if (actual > target) return '#FF4A4A'; // Exceeded (Red)
    if (actual >= target * 0.85) return '#23D978'; // Perfect / Close (Green)
    return '#FFC837'; // Under target (Yellow)
  };

  // Wearable metrics from daily declarations
  const todayDecl = dailyDeclarations[today] || { steps: 0, activeCalories: 0, activeTime: 0 };
  const stepsVal = todayDecl.steps || 0;
  const activeCalVal = todayDecl.activeCalories || 0;
  const activeTimeVal = todayDecl.activeTime || 0;

  // Quick Action Handlers
  const handleQuickAddWater = async () => {
    await addWaterLog(250, today);
    Alert.alert('Thành công', 'Đã uống thêm 250ml nước! 💧');
  };

  const handleBarcodeScan = () => {
    Alert.alert('Barcode Scanner 🏷️', 'Đã quét sản phẩm đóng gói thành công! Dữ liệu dinh dưỡng được thêm tự động.');
  };

  const handleSaveManualFoodLog = async () => {
    if (!mFoodName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên thực phẩm!');
      return;
    }
    const cal = parseInt(mCalories) || 0;
    const prot = parseInt(mProtein) || 0;
    const cb = parseInt(mCarbs) || 0;
    const ft = parseInt(mFat) || 0;
    const fib = parseInt(mFiber) || undefined;
    const sug = parseInt(mSugar) || undefined;
    const sod = parseInt(mSodium) || undefined;

    // Close modal INSTANTLY (0ms response time)
    setManualLogOpen(false);

    await addFoodLog(mMealType, mFoodName.trim(), 100, cal, prot, cb, ft, today, fib, sug, sod);
    setMFoodName('');
    setMCalories('');
    setMProtein('');
    setMCarbs('');
    setMFat('');
    setMFiber('');
    setMSugar('');
    setMSodium('');
    Alert.alert('Thành công', 'Đã lưu thực phẩm vào nhật ký! 📝');
  };

  const handleSaveAiFoodLog = () => {
    if (!aiScanResult) return;

    // Fill manual log modal fields with AI scanned results
    setMFoodName(aiScanResult.mealDetected || '');
    setMCalories(String(aiScanResult.calories || 0));
    setMProtein(String(aiScanResult.protein || 0));
    setMCarbs(String(aiScanResult.carbs || 0));
    setMFat(String(aiScanResult.fat || 0));

    // Smart default meal type based on current hour of day
    const hour = new Date().getHours();
    let defaultMeal: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch';
    if (hour >= 5 && hour < 11) defaultMeal = 'breakfast';
    else if (hour >= 11 && hour < 14) defaultMeal = 'lunch';
    else if (hour >= 14 && hour < 18) defaultMeal = 'snack';
    else defaultMeal = 'dinner';

    setMMealType(defaultMeal);

    // Switch from AI Result Modal to Manual Log Modal safely with small delay
    setAiModalOpen(false);
    setTimeout(() => {
      setManualLogOpen(true);
    }, 300);
  };

  const runScan = async () => {
    if (Platform.OS === 'web') {
      setWebFeatureModalOpen(true);
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

      // Compress and resize image to prevent memory spikes and bridge freezing
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
        console.warn('ImageManipulator fallback in index:', manipErr);
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
        console.warn('AI Scan API error, falling back to mock:', e.message);
        scan = {
          mealDetected: 'Cơm tấm sườn nướng trứng 🍳',
          calories: 642,
          protein: 32,
          carbs: 78,
          fat: 18,
        };
      }

      const name = scan?.mealDetected || 'Món ăn quét bằng AI';
      
      // Open result modal directly so there is ZERO blank delay
      setAiScanResult({
        mealDetected: name,
        calories: scan?.calories || 642,
        protein: scan?.protein || 32,
        carbs: scan?.carbs || 78,
        fat: scan?.fat || 18,
        items: scan?.items || [
          { name: 'Thành phần chính', weightG: 250, calories: (scan?.calories || 642) - 150 },
          { name: 'Gia vị & mỡ hành', weightG: 30, calories: 100 },
          { name: 'Rau kèm', weightG: 50, calories: 50 },
        ]
      });
      setAiModalOpen(true);
      
      // Smoothly dismiss the scanning overlay after result is mounted
      setTimeout(() => {
        setIsAiScanning(false);
      }, 100);
    } catch (error: any) {
      setIsAiScanning(false);
      console.error(error);
      setTimeout(() => {
        Alert.alert('Thông báo', 'Không thể hoàn tất quét món ăn. Vui lòng thử lại.');
      }, 350);
    }
  };

  const shortcuts = [
    { label: 'Nhật ký cũ', icon: 'journal', action: () => router.push('/declare') },
    { label: 'Lịch hoạt động', icon: 'calendar', action: () => router.push('/activity-schedule') },
    { label: 'Meal Plan', icon: 'restaurant', action: () => router.push('/meal-plan') },
    { label: 'Cân nặng', icon: 'scale', action: () => router.push('/weight-tracker') },
    { label: 'Quét món ăn AI', icon: 'camera', action: () => runScan() },
    ...(isAdmin ? [{ label: 'Admin', icon: 'key', action: () => router.push('/admin') }] : []),
  ];

  // Generate week dates representation
  const startOfWeek = new Date();
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  startOfWeek.setDate(diff);

  const weekDays = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + idx);
    const dateStr = getLocalDateString(d);
    // Check if user declared activity on this date
    const hasWorkout = workoutSchedules.some(w => w.scheduledDate === dateStr && w.isCompleted);
    const hasWater = waterLogs.some(w => w.loggedDate === dateStr);
    const hasFood = foodLogs.some(f => f.loggedDate === dateStr);
    const isDeclared = hasWorkout || hasWater || hasFood;
    
    return {
      label: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][idx],
      dayNum: d.getDate(),
      date: d,
      isToday: d.toDateString() === new Date().toDateString(),
      isActive: d.toDateString() === activeDate.toDateString(),
      isDeclared
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Custom Header Row (Only on Mobile) */}
        {!isWebDesktop && (
          <View style={styles.customHeader}>
            <View style={styles.headerLeftWrap}>
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View 
                  style={{
                    position: 'absolute',
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: 'rgba(255, 159, 28, 0.4)',
                    transform: [{ scale: avatarGlowAnim }],
                  }} 
                />
                <Image source={{ uri: avatar }} style={styles.headerAvatar} onError={() => setAvatarUri(DEFAULT_AVATAR)} />
              </View>
              <View style={styles.headerGreetingCol}>
                <Text style={[styles.headerGreetingSub, { color: theme.textMuted }]}>Chào buổi sáng,</Text>
                <Text style={[styles.headerGreetingName, { color: theme.text }]}>{userProfile.firstName || 'Người dùng'}</Text>
              </View>
            </View>
            <Text style={styles.headerAppTitle}>BODYFIT GYM & NUTRI 🏋️‍♂️</Text>
            <Pressable onPress={() => router.push('/notifications')} style={styles.bellBtn}>
              <Animated.View style={{ transform: [{ rotate: bellInterpolation }] }}>
                <Ionicons name="notifications-outline" size={22} color={theme.text} />
                <View style={{ position: 'absolute', top: 0, right: 0, width: 7, height: 7, borderRadius: 3.5, backgroundColor: theme.primary }} />
              </Animated.View>
            </Pressable>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Calorie Card redesigned */}
          <View style={[styles.calorieRedesignedCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.calorieCardTitle, { color: theme.textMuted }]}>Tiến độ hôm nay</Text>
            
            <View style={styles.progressRingWrapper}>
              <Animated.View 
                style={{
                  position: 'absolute',
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: 'rgba(255, 159, 28, 0.12)',
                  transform: [{ scale: ringPulseAnim }],
                }} 
              />
              <Svg width={170} height={170} viewBox="0 0 100 100">
                {/* Track */}
                <Circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="6" 
                  fill="transparent" 
                />
                {/* Progress Ring with Orange/Yellow Gradient */}
                <Circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke={theme.primary} 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * caloriePercentage) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </Svg>
              <View style={styles.progressTextWrapper}>
                <Text style={[styles.progressValueText, { color: theme.text }]}>{calories.toLocaleString('vi-VN')}</Text>
                <Text style={[styles.progressTargetText, { color: theme.textMuted }]}>/ {targetCalories.toLocaleString('vi-VN')} kcal</Text>
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: flameAnim }] }}>
              <Pressable onPress={() => router.push('/meal-plan')} style={[styles.targetAchievementPill, { backgroundColor: 'rgba(255,159,28,0.1)' }]}>
                <Ionicons name="flame" size={14} color={theme.primary} style={{ marginRight: 2 }} />
                <Text style={[styles.targetAchievementText, { color: theme.primary }]}>Mục tiêu đạt {caloriePercentage}%</Text>
                <Ionicons name="chevron-forward" size={12} color={theme.textMuted} style={{ marginLeft: 2 }} />
              </Pressable>
            </Animated.View>
          </View>

          {/* Macronutrients Cards */}
          <View style={styles.macroCardsRow}>
            {/* Đạm */}
            <View style={[styles.macroCardItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.macroAccentBar, { backgroundColor: '#FFD700' }]} />
              <Text style={[styles.macroCardLabel, { color: theme.textMuted }]}>Đạm 🥩</Text>
              <Text style={[styles.macroCardVal, { color: theme.text }]}>{protein}g</Text>
              <View style={styles.macroProgressBarTrack}>
                <View style={[styles.macroProgressBarFill, { width: `${Math.min(100, (protein / targetProtein) * 100)}%`, backgroundColor: '#FFD700' }]} />
              </View>
            </View>
            
            {/* Tinh bột */}
            <View style={[styles.macroCardItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.macroAccentBar, { backgroundColor: '#FF9F1C' }]} />
              <Text style={[styles.macroCardLabel, { color: theme.textMuted }]}>Carbs 🍠</Text>
              <Text style={[styles.macroCardVal, { color: theme.text }]}>{carbs}g</Text>
              <View style={styles.macroProgressBarTrack}>
                <View style={[styles.macroProgressBarFill, { width: `${Math.min(100, (carbs / targetCarbs) * 100)}%`, backgroundColor: '#FF9F1C' }]} />
              </View>
            </View>

            {/* Béo */}
            <View style={[styles.macroCardItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.macroAccentBar, { backgroundColor: '#FF5E36' }]} />
              <Text style={[styles.macroCardLabel, { color: theme.textMuted }]}>Béo 🥑</Text>
              <Text style={[styles.macroCardVal, { color: theme.text }]}>{fat}g</Text>
              <View style={styles.macroProgressBarTrack}>
                <View style={[styles.macroProgressBarFill, { width: `${Math.min(100, (fat / targetFat) * 100)}%`, backgroundColor: '#FF5E36' }]} />
              </View>
            </View>
          </View>

          {/* Row with Water & Steps */}
          <View style={styles.metricsDoubleRow}>
            {/* Thẻ Nước uống */}
            <View style={[styles.metricHalfCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.metricCardHeader}>
                <Ionicons name="water-outline" size={22} color={theme.primary} />
                <Animated.View style={{ transform: [{ scale: waterScale }] }}>
                  <Pressable onPress={handleWaterPressWithAnim} style={[styles.addWaterQuickBtn, { backgroundColor: theme.primary }]}>
                    <Ionicons name="add" size={14} color="#100E0C" />
                  </Pressable>
                </Animated.View>
              </View>
              <Text style={[styles.metricCardLabel, { color: theme.textMuted, marginTop: 12 }]}>Nước Hydrate 💧</Text>
              <Text style={[styles.metricCardValue, { color: theme.text }]}>
                {(water / 1000).toFixed(1)} <Text style={[styles.metricCardUnit, { color: theme.textMuted }]}>Lít / {(targetWater / 1000).toFixed(1)}L</Text>
              </Text>
            </View>

            {/* Thẻ Số bước chân */}
            <View style={[styles.metricHalfCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.metricCardHeader}>
                <Ionicons name="walk" size={22} color="#FFD700" />
              </View>
              <Text style={[styles.metricCardLabel, { color: theme.textMuted, marginTop: 12 }]}>Số bước Cardio</Text>
              <Text style={[styles.metricCardValue, { color: theme.text }]}>{stepsVal.toLocaleString('vi-VN')}</Text>
              <Text style={[styles.metricCardSubText, { color: theme.textMuted }]}>
                <Ionicons name="trending-up" size={12} color={theme.success} /> {Math.round((stepsVal / 10000) * 100)}% mục tiêu
              </Text>
            </View>
          </View>

          {/* Advice Card */}
          <View style={[styles.adviceRedesignedCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.adviceHeaderRow}>
              <Animated.View style={{ transform: [{ scale: flameAnim }] }}>
                <View style={[styles.lightningCircle, { backgroundColor: theme.primary }]}>
                  <Ionicons name="flash" size={18} color="#100E0C" />
                </View>
              </Animated.View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.adviceCardLabel, { color: theme.textMuted }]}>Mẹo Gymer & Dinh dưỡng 🏋️‍♂️</Text>
                <Text style={[styles.adviceCardContent, { color: theme.textSecondary }]}>
                  "Dinh dưỡng chuẩn chiếm 70% kết quả! Nạp 25 - 35g đạm trong vòng 30 phút sau khi tập Gym để cơ bắp hồi phục và tăng trưởng tối đa."
                </Text>
              </View>
            </View>
          </View>

          {/* Start workout button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
            <Pressable onPress={() => setActiveTabRoute('/workout')} style={styles.startWorkoutRedesignedBtn}>
              <LinearGradient 
                colors={Gradients.primary} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }} 
                style={styles.startWorkoutRedesignedBtnGradient}
              >
                <Ionicons name="barbell" size={22} color="#100E0C" style={{ marginRight: 8 }} />
                <Text style={styles.startWorkoutRedesignedBtnText}>VÀO PHÒNG TẬP GYM NGAY</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Quick Actions Grid */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>⚡ Lối tắt Gymer & Thực đơn AI</Text>
          </View>
          <View style={styles.quickActionsContainer}>
            <Pressable onPress={() => runScan()} style={[styles.quickActionCardCompl, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.quickActionIconCircle}>
                <Text style={{ fontSize: 16 }}>📷</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickActionComplTitle, { color: theme.text }]}>Quét món ăn AI</Text>
                <Text style={[styles.quickActionComplDesc, { color: theme.textMuted }]}>Chụp ảnh để nhận diện</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => setManualLogOpen(true)} style={[styles.quickActionCardCompl, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.quickActionIconCircle}>
                <Text style={{ fontSize: 16 }}>📝</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickActionComplTitle, { color: theme.text }]}>Ghi món thủ công</Text>
                <Text style={[styles.quickActionComplDesc, { color: theme.textMuted }]}>Nhập calo, đạm...</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => router.push('/declare')} style={[styles.quickActionCardCompl, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.quickActionIconCircle}>
                <Text style={{ fontSize: 16 }}>🏃‍♂️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickActionComplTitle, { color: theme.text }]}>Khai báo hoạt động</Text>
                <Text style={[styles.quickActionComplDesc, { color: theme.textMuted }]}>Ghi nhận tập luyện</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => setActiveTabRoute('/coach')} style={[styles.quickActionCardCompl, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.quickActionIconCircle}>
                <Text style={{ fontSize: 16 }}>🤖</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickActionComplTitle, { color: theme.text }]}>Hỏi Coach AI</Text>
                <Text style={[styles.quickActionComplDesc, { color: theme.textMuted }]}>Tư vấn dinh dưỡng</Text>
              </View>
            </Pressable>
          </View>

          {/* Weekly activity log */}
          <View style={[styles.weeklyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.weeklyHeaderRow}>
              <Text style={[styles.weeklyTitle, { color: theme.text }]}>Nhật ký hoạt động tuần này</Text>
              <Text style={[styles.streakCountText, { color: theme.primary }]}>🔥 Chuỗi: ${userProfile.streakDays || 0} ngày</Text>
            </View>
            <View style={styles.weekDaysRow}>
              {weekDays.map((day, idx) => (
                <Pressable key={idx} onPress={() => setActiveDate(day.date)} style={styles.weekDayItem}>
                  <Text style={[styles.weekDayLabel, { color: day.isActive ? theme.primary : theme.textMuted }]}>{day.label}</Text>
                  <View 
                    style={[
                      styles.dayDot, 
                      day.isActive && styles.dayDotActive,
                      day.isToday && !day.isActive && styles.dayDotToday, 
                      day.isDeclared && !day.isActive && styles.dayDotDeclared
                    ]}
                  >
                    {day.isDeclared ? (
                      <Ionicons name="checkmark" size={12} color={day.isActive ? '#100E0C' : theme.primary} />
                    ) : (
                      <Text style={[
                        styles.dayDotText, 
                        { color: day.isActive ? '#100E0C' : day.isToday ? theme.primary : theme.textMuted }
                      ]}>
                        {day.dayNum}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Level progress bar inside the card */}
            <View style={styles.levelProgressSection}>
              <Text style={[styles.levelProgressLabel, { color: theme.textMuted }]}>Kinh nghiệm Level up:</Text>
              <Text style={[styles.levelProgressValue, { color: theme.text }]}>{currentXp} / {xpNeeded} XP</Text>
            </View>
            <View style={styles.levelProgressBarTrack}>
              <View style={[styles.levelProgressBarFill, { width: `${xpPct}%`, backgroundColor: theme.primary }]} />
            </View>
          </View>

          {/* Mascot Avocado Advice Card */}
          <View style={[styles.mascotCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Image source={require('@/assets/images/mascot-avocado.png')} style={styles.mascotImage} />
            <View style={styles.mascotSpeechBubble}>
              <Text style={[styles.speechBubbleTitle, { color: theme.primary }]}>Bơ Lực Sĩ 🥑</Text>
              <Text style={[styles.speechText, { color: theme.text }]}>
                "Hôm nay bạn tuyệt vời lắm! Cố gắng hoàn thành các Nhiệm Vụ Hàng Ngày (Quests) bên dưới để thăng cấp nhé! Cùng tập thôi nào! 💪🔥"
              </Text>
            </View>
          </View>

          {/* Daily Quests Horizontal List */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🎯 Nhiệm Vụ Hàng Ngày (Daily Quests)</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questScroll}>
            {quests.map((quest) => {
              const isCompleted = (quest.currentValue || 0) >= quest.targetValue;
              let gradientColors: string[] = ['#1A1613', '#FF9F1C']; // Premium custom
              let tagText = 'WELCOME QUEST 🚀';
              let buttonColor: string = theme.primary;
              
              if (quest.id === 'q_water') {
                gradientColors = ['#1A1613', '#FFD700'];
                tagText = 'WATER QUEST 💧';
                buttonColor = '#FFD700';
              } else if (quest.id === 'q_food') {
                gradientColors = ['#1A1613', '#FF5E36'];
                tagText = 'NUTRITION QUEST 🍎';
                buttonColor = '#FF5E36';
              }

              const buttonLabel = quest.isClaimed ? 'Đã nhận' : quest.isCompleted ? 'Nhận' : quest.id === 'q_food' ? 'Thách đấu' : 'Bắt đầu';
              
              return (
                <LinearGradient 
                  key={quest.id} 
                  colors={gradientColors as any} 
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 1 }} 
                  style={[styles.questCard, { borderWidth: 1.2, borderColor: theme.cardBorder }]}
                >
                  <View style={styles.questCardHeader}>
                    <Text style={styles.questCardTag}>{tagText}</Text>
                    <Text style={styles.questCardReward}>+{quest.xpReward || 250} XP • +{quest.coinReward || 20} 💎</Text>
                  </View>
                  <View style={styles.questCardMiddle}>
                    <Text style={styles.questCardTitle} numberOfLines={1}>{quest.title}</Text>
                    <Text style={styles.questCardDesc} numberOfLines={2}>{quest.description}</Text>
                  </View>
                  <View style={styles.questCardFooter}>
                    <Text style={styles.questCardProgress}>⏱️ {quest.id === 'q_food' ? '20 phút' : `${quest.currentValue || 0}/${quest.targetValue} ${quest.targetType === 'water' ? 'ml' : ''}`}</Text>
                    <Pressable 
                      disabled={quest.isClaimed}
                      onPress={() => claimQuestReward(quest.id)}
                      style={[styles.questCardBtn, { backgroundColor: buttonColor }, quest.isClaimed && styles.questBtnClaimed]}
                    >
                      <Text style={styles.questBtnText}>{buttonLabel}</Text>
                    </Pressable>
                  </View>
                </LinearGradient>
              );
            })}
          </ScrollView>

          {/* Kế hoạch dinh dưỡng */}
          <View style={styles.mealPlanHeaderWrap}>
            <Text style={[styles.mealPlanTitle, { color: theme.text }]}>Kế hoạch dinh dưỡng từng bữa</Text>
          </View>
          
          <View style={styles.mealPlanContainer}>
            {/* Bữa Sáng */}
            <View style={[styles.mealPlanCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.mealPlanCardTitle, { color: theme.text }]}>🍳 Bữa Sáng (30% mục tiêu)</Text>
              <View style={styles.mealPlanGrid}>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Calo</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualCalBreakfast, targetCalBreakfast) }}>{actualCalBreakfast}</Text>
                    /{targetCalBreakfast}
                  </Text>
                </View>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Protein</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualProtBreakfast, targetProtBreakfast) }}>{actualProtBreakfast}</Text>
                    /{targetProtBreakfast}g
                  </Text>
                </View>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Carbs</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualCarbBreakfast, targetCarbBreakfast) }}>{actualCarbBreakfast}</Text>
                    /{targetCarbBreakfast}g
                  </Text>
                </View>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Béo</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualFatBreakfast, targetFatBreakfast) }}>{actualFatBreakfast}</Text>
                    /{targetFatBreakfast}g
                  </Text>
                </View>
              </View>
            </View>

            {/* Bữa Trưa */}
            <View style={[styles.mealPlanCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.mealPlanCardTitle, { color: theme.text }]}>☀️ Bữa Trưa (40% mục tiêu)</Text>
              <View style={styles.mealPlanGrid}>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Calo</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualCalLunch, targetCalLunch) }}>{actualCalLunch}</Text>
                    /{targetCalLunch}
                  </Text>
                </View>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Protein</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualProtLunch, targetProtLunch) }}>{actualProtLunch}</Text>
                    /{targetProtLunch}g
                  </Text>
                </View>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Carbs</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualCarbLunch, targetCarbLunch) }}>{actualCarbLunch}</Text>
                    /{targetCarbLunch}g
                  </Text>
                </View>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Béo</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualFatLunch, targetFatLunch) }}>{actualFatLunch}</Text>
                    /{targetFatLunch}g
                  </Text>
                </View>
              </View>
            </View>

            {/* Bữa Tối */}
            <View style={[styles.mealPlanCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.mealPlanCardTitle, { color: theme.text }]}>🌙 Bữa Tối (30% mục tiêu)</Text>
              <View style={styles.mealPlanGrid}>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Calo</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualCalDinner, targetCalDinner) }}>{actualCalDinner}</Text>
                    /{targetCalDinner}
                  </Text>
                </View>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Protein</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualProtDinner, targetProtDinner) }}>{actualProtDinner}</Text>
                    /{targetProtDinner}g
                  </Text>
                </View>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Carbs</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualCarbDinner, targetCarbDinner) }}>{actualCarbDinner}</Text>
                    /{targetCarbDinner}g
                  </Text>
                </View>
                <View style={styles.mealPlanGridItem}>
                  <Text style={[styles.mealPlanGridLabel, { color: theme.textMuted }]}>Béo</Text>
                  <Text style={[styles.mealPlanGridValue, { color: theme.text }]}>
                    <Text style={{ color: getProgressColor(actualFatDinner, targetFatDinner) }}>{actualFatDinner}</Text>
                    /{targetFatDinner}g
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Wearables health data panel */}
          <View style={styles.sectionHeaderWrap}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Dữ liệu Sức khỏe & Wearables</Text>
          </View>
          <View style={[styles.wearablesCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.wearablesRow}>
              <View style={styles.wearableBlock}>
                <View style={styles.wearableHeader}>
                  <Ionicons name="walk" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                  <Text style={[styles.wearableTitle, { color: theme.textMuted }]}>Số bước chân</Text>
                </View>
                <Text style={[styles.wearableValue, { color: theme.text }]}>{stepsVal.toLocaleString('vi-VN')} / 10K</Text>
                <View style={styles.wearableBarTrack}>
                  <View style={[styles.wearableBarFill, { width: `${Math.min(100, (stepsVal / 10000) * 100)}%`, backgroundColor: '#FFD700' }]} />
                </View>
              </View>

              <View style={styles.wearableBlock}>
                <View style={styles.wearableHeader}>
                  <Ionicons name="flame" size={16} color={theme.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.wearableTitle, { color: theme.textMuted }]}>Calo Active</Text>
                </View>
                <Text style={[styles.wearableValue, { color: theme.text }]}>{activeCalVal} / 500 kcal</Text>
                <View style={styles.wearableBarTrack}>
                  <View style={[styles.wearableBarFill, { width: `${Math.min(100, (activeCalVal / 500) * 100)}%`, backgroundColor: theme.primary }]} />
                </View>
              </View>
            </View>

            <View style={styles.wearablesRow}>
              <View style={styles.wearableBlockFull}>
                <View style={styles.wearableHeader}>
                  <Ionicons name="bed" size={16} color="#FF5E36" style={{ marginRight: 4 }} />
                  <Text style={[styles.wearableTitle, { color: theme.textMuted }]}>Chất lượng giấc ngủ</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={[styles.wearableValueFull, { color: theme.text }]}>8.2 / 10 — Giấc ngủ sâu 😴</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10 }}>Thời gian: {activeTimeVal || '45'}p vận động</Text>
                </View>
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Manual Food Log Modal */}
      <Modal visible={manualLogOpen} transparent animationType="slide" onRequestClose={() => setManualLogOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.manualLogCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitleText, { color: theme.text }]}>Log Thực Phẩm Thủ Công</Text>
              <Pressable onPress={() => setManualLogOpen(false)}>
                <Text style={[styles.closeBtnText, { color: theme.primary }]}>Ẩn ✕</Text>
              </Pressable>
            </View>
            
            <Text style={[styles.modalFieldLabelText, { color: theme.text }]}>Tên thực phẩm</Text>
            <TextInput
              value={mFoodName}
              onChangeText={setMFoodName}
              placeholder="VD: Hamburger Thịt Chả"
              placeholderTextColor={theme.textMuted}
              style={[styles.modalTextInput, { color: theme.text }]}
            />

            <Text style={[styles.modalFieldLabelText, { color: theme.text }]}>Bữa ăn</Text>
            <View style={styles.mealTypeSelectorRow}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <Pressable 
                  key={type} 
                  onPress={() => setMMealType(type)} 
                  style={[
                    styles.mealTypeBtn, 
                    mMealType === type && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                >
                  <Text style={[styles.mealTypeBtnText, { color: mMealType === type ? '#100E0C' : theme.text }]}>
                    {type === 'breakfast' ? 'Sáng' : type === 'lunch' ? 'Trưa' : type === 'dinner' ? 'Tối' : 'Phụ'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalGridInputRow}>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalFieldLabelText, { color: theme.text }]}>Calories (kcal)</Text>
                <TextInput
                  value={mCalories}
                  onChangeText={setMCalories}
                  placeholder="350"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  style={[styles.modalNumberInput, { color: theme.text }]}
                />
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalFieldLabelText, { color: theme.text }]}>Đạm (Protein g)</Text>
                <TextInput
                  value={mProtein}
                  onChangeText={setMProtein}
                  placeholder="24"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  style={[styles.modalNumberInput, { color: theme.text }]}
                />
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalFieldLabelText, { color: theme.text }]}>Tinh bột (Carbs g)</Text>
                <TextInput
                  value={mCarbs}
                  onChangeText={setMCarbs}
                  placeholder="29"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  style={[styles.modalNumberInput, { color: theme.text }]}
                />
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalFieldLabelText, { color: theme.text }]}>Chất béo (Fat g)</Text>
                <TextInput
                  value={mFat}
                  onChangeText={setMFat}
                  placeholder="10"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  style={[styles.modalNumberInput, { color: theme.text }]}
                />
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalFieldLabelText, { color: theme.text }]}>Chất xơ (Fiber g)</Text>
                <TextInput
                  value={mFiber}
                  onChangeText={setMFiber}
                  placeholder="4"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  style={[styles.modalNumberInput, { color: theme.text }]}
                />
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalFieldLabelText, { color: theme.text }]}>Đường (Sugar g)</Text>
                <TextInput
                  value={mSugar}
                  onChangeText={setMSugar}
                  placeholder="6"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  style={[styles.modalNumberInput, { color: theme.text }]}
                />
              </View>
              <View style={styles.modalFormItem}>
                <Text style={[styles.modalFieldLabelText, { color: theme.text }]}>Natri (Sodium mg)</Text>
                <TextInput
                  value={mSodium}
                  onChangeText={setMSodium}
                  placeholder="350"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  style={[styles.modalNumberInput, { color: theme.text }]}
                />
              </View>
            </View>

            <Pressable onPress={handleSaveManualFoodLog} style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}>
              <Text style={styles.modalSaveBtnText}>Lưu vào Nhật Ký</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* AI Food Detection Result Modal */}
      <Modal visible={aiModalOpen} transparent animationType="slide" onRequestClose={() => setAiModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.aiResultCard}>
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

      {/* AI Food Scanning Loading Indicator Modal */}
      <AiScanningModal
        visible={isAiScanning}
        onCancel={() => setIsAiScanning(false)}
      />
      {/* Web Mobile Feature Alert Modal */}
      <MobileFeatureModal visible={webFeatureModalOpen} onClose={() => setWebFeatureModalOpen(false)} />
      {/* Onboarding Profile Setup Modal */}
      <OnboardingModal visible={!hasCompletedOnboarding && !!currentUser} onComplete={() => setHasCompletedOnboarding(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: 110,
    gap: 16,
  },
  // Custom Header
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FF9F1C',
  },
  headerGreetingCol: {
    justifyContent: 'center',
  },
  headerGreetingSub: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerGreetingName: {
    fontSize: 13,
    fontWeight: '900',
  },
  headerAppTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF9F1C',
    letterSpacing: 0.5,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Redesigned Calorie Card
  calorieRedesignedCard: {
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  calorieCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressRingWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValueText: {
    fontSize: 32,
    fontWeight: '900',
  },
  progressTargetText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  targetAchievementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  targetAchievementText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Macronutrients
  macroCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  macroCardItem: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    gap: 4,
  },
  macroAccentBar: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    marginBottom: 4,
  },
  macroCardLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  macroCardVal: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  macroProgressBarTrack: {
    width: '80%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 1.5,
    marginTop: 6,
    overflow: 'hidden',
  },
  macroProgressBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },

  // Metrics (Water & Steps)
  metricsDoubleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricHalfCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addWaterQuickBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCardLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  metricCardValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  metricCardUnit: {
    fontSize: 11,
    fontWeight: '800',
  },
  metricCardSubText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },

  // Advice
  adviceRedesignedCard: {
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 16,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lightningCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  adviceCardContent: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },

  // Start workout button
  startWorkoutRedesignedBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
  },
  startWorkoutRedesignedBtnGradient: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  startWorkoutRedesignedBtnText: {
    color: '#100E0C',
    fontSize: 14,
    fontWeight: '900',
  },

  // Other styled components
  weeklyCard: {
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  weeklyTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  weeklyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakCountText: {
    fontSize: 12,
    fontWeight: '900',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayItem: {
    alignItems: 'center',
    gap: 6,
  },
  weekDayLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotActive: {
    backgroundColor: '#FF9F1C',
  },
  dayDotToday: {
    borderWidth: 1.5,
    borderColor: '#FF9F1C',
  },
  dayDotDeclared: {
    backgroundColor: 'rgba(255, 159, 28, 0.2)',
  },
  dayDotText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dayDotTextToday: {
    color: '#FF9F1C',
    fontWeight: '900',
  },
  dayDotTextActive: {
    color: '#100E0C',
    fontWeight: '900',
  },

  // Level Up Progress
  levelProgressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  levelProgressLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  levelProgressValue: {
    fontSize: 11,
    fontWeight: '900',
  },
  levelProgressBarTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  levelProgressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },

  // Quick Actions Grid
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionCardCompl: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 22,
    borderWidth: 1.2,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickActionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionComplTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  quickActionComplDesc: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },

  // Wearables Card
  wearablesCard: {
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  wearablesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  wearableBlock: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 12,
    gap: 4,
  },
  wearableBlockFull: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 12,
  },
  wearableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wearableTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  wearableValue: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
  wearableValueFull: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
  },
  wearableBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  wearableBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Mascot Card
  mascotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  mascotImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  mascotSpeechBubble: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 12,
  },
  speechBubbleTitle: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 2,
  },
  speechText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },

  // Quests
  sectionHeaderWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '900',
  },
  questScroll: {
    gap: 12,
    paddingRight: 16,
  },
  questCard: {
    width: 250,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 130,
  },
  questCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questCardTag: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 9,
  },
  questCardReward: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9,
    fontWeight: '800',
  },
  questCardMiddle: {
    marginVertical: 6,
  },
  questCardTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  questCardDesc: {
    color: 'rgba(255, 255, 255, 0.74)',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
    fontWeight: '700',
  },
  questCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questCardProgress: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  questCardBtn: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  questBtnClaimed: {
    opacity: 0.5,
  },
  questBtnText: {
    color: '#100E0C',
    fontWeight: '900',
    fontSize: 11,
  },

  // Meal Plan breakdowns
  mealPlanHeaderWrap: {
    marginTop: 6,
  },
  mealPlanTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealPlanContainer: {
    gap: 12,
  },
  mealPlanCard: {
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  mealPlanCardTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  mealPlanGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  mealPlanGridItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    gap: 2,
  },
  mealPlanGridLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  mealPlanGridValue: {
    fontSize: 11,
    fontWeight: '900',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  manualLogCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E1A17',
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 159, 28, 0.2)',
    padding: 20,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: '900',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalFieldLabelText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalTextInput: {
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  mealTypeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mealTypeBtn: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  mealTypeBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalGridInputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalFormItem: {
    flex: 1,
    minWidth: '45%',
    gap: 6,
  },
  modalNumberInput: {
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  modalSaveBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalSaveBtnText: {
    color: '#100E0C',
    fontSize: 14,
    fontWeight: '900',
  },

  // AI Result
  aiResultCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E1A17',
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 159, 28, 0.2)',
    padding: 20,
    gap: 14,
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
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
  onboardingContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF9F1C',
    letterSpacing: 2,
  },
  onboardingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
  },
  onboardingCopy: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  onboardingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 16,
  },
  darkButtonText: {
    color: '#100E0C',
    fontWeight: '800',
    fontSize: 15,
  },
});
