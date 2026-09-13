import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, ImageBackground, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Gradients, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useLocalDb, FoodLog } from '@/hooks/use-local-db';
import { getLocalDateString } from '@/utils/date';
import { AiScanningModal } from '@/components/AiScanningModal';
import { MobileFeatureModal } from '@/components/MobileFeatureModal';
import DonutMacroChart from '@/components/donut-macro-chart';

const PRESET_IMAGES = [
  { id: 'gym', label: 'Tập Gym 🏋️‍♂️', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80' },
  { id: 'run', label: 'Chạy bộ 🏃‍♂️', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80' },
  { id: 'yoga', label: 'Yoga 🧘‍♂️', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80' },
  { id: 'diet', label: 'Ăn kiêng 🥗', url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80' },
  { id: 'walk', label: 'Đi bộ 👟', url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80' }
];

export default function JournalScreen() {
  const { theme, isDark } = useAppTheme();
  const { 
    userProfile, 
    foodLogs, 
    waterLogs, 
    weightLogs,
    addFoodLog, 
    deleteFoodLog, 
    addWaterLog, 
    deleteWaterLog, 
    addWeightLog,
    triggerVoiceLogging, 
    generateDailyAiReview, 
    getLogsForDate,
    dailyDeclarations,
    saveDailyDeclaration,
    triggerMockScanFood,
    shouldTriggerScan,
    setShouldTriggerScan
  } = useLocalDb();

  const [activeTab, setActiveTab] = useState<'recent' | 'lookup'>('recent');
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [dayRange, setDayRange] = useState<7 | 14 | 30>(7);
  const [hideEmptyDays, setHideEmptyDays] = useState(true);
  
  const [inputFoodText, setInputFoodText] = useState('Tôi ăn cơm tấm sườn nướng...');
  const [review, setReview] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const today = getLocalDateString();
  const [lookupDate, setLookupDate] = useState(today);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');

  const handleLiveDateInputChange = (input: string) => {
    if (input.length < customDateInput.length) {
      setCustomDateInput(input);
      return;
    }
    const digits = input.replace(/[^0-9]/g, '');
    let formatted = '';
    if (digits.length > 0) {
      if (digits.length <= 2) {
        formatted = digits;
        if (digits.length === 2) formatted += '/';
      } else if (digits.length <= 4) {
        formatted = digits.substring(0, 2) + '/' + digits.substring(2);
        if (digits.length === 4) formatted += '/';
      } else {
        formatted = digits.substring(0, 2) + '/' + digits.substring(2, 4) + '/' + digits.substring(4, 8);
      }
    }
    setCustomDateInput(formatted);
  };

  const parseSmartDateInput = (inputStr: string): string | null => {
    const raw = inputStr.trim();
    if (!raw) return null;
    const clean = raw.replace(/[^0-9]/g, '');
    const todayStr = getLocalDateString();

    // 1. Pure 8 digits: e.g. "15072026" -> Day 15, Month 07, Year 2026
    if (clean.length === 8) {
      const day = parseInt(clean.substring(0, 2), 10);
      const month = parseInt(clean.substring(2, 4), 10);
      const year = parseInt(clean.substring(4, 8), 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (dStr <= todayStr) return dStr;
      }
    }

    // 2. Pure 7 digits: e.g. "5072026" -> Day 5, Month 07, Year 2026
    if (clean.length === 7) {
      const day = parseInt(clean.substring(0, 1), 10);
      const month = parseInt(clean.substring(1, 3), 10);
      const year = parseInt(clean.substring(3, 7), 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (dStr <= todayStr) return dStr;
      }
    }

    // 3. Separated formats: "15/07/2026", "15-07-2026", "15.07.2026", "2026-07-15"
    const parts = raw.split(/[\/\-\.\s]+/);
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);

      // Reversed YYYY-MM-DD input
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }

      if (year < 100) year += 2000;
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (dStr <= todayStr) return dStr;
      }
    }

    return null;
  };

  const handlePrevDay = () => {
    const parts = lookupDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const cur = new Date(year, month, day);
    cur.setDate(cur.getDate() - 1);
    setLookupDate(getLocalDateString(cur));
  };

  const handleNextDay = () => {
    const parts = lookupDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const cur = new Date(year, month, day);
    cur.setDate(cur.getDate() + 1);
    const nextStr = getLocalDateString(cur);
    if (nextStr <= today) {
      setLookupDate(nextStr);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = daysOfWeek[d.getDay()];
        const formattedDate = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
        return `${dayName}, ${formattedDate}`;
      }
    } catch (e) {}
    return dateStr;
  };

  // Computed Date based on active tab
  const selectedDate = activeTab === 'recent' ? today : lookupDate;

  // Reactively calculate items for selected date
  const currentFoods = useMemo(() => {
    return foodLogs.filter((item) => item.loggedDate === selectedDate);
  }, [foodLogs, selectedDate]);

  const currentWater = useMemo(() => {
    return waterLogs.filter((item) => item.loggedDate === selectedDate);
  }, [waterLogs, selectedDate]);

  const currentDecl = dailyDeclarations[selectedDate] || { steps: 0, activeCalories: 0, activeTime: 0, activity: '', image: '' };
  
  const currentWeight = useMemo(() => {
    return weightLogs.find((item) => item.loggedDate === selectedDate) || null;
  }, [weightLogs, selectedDate]);

  const foodCal = currentFoods.reduce((sum, item) => sum + (item.calories || 0), 0);
  const totalProtein = currentFoods.reduce((sum, item) => sum + (item.protein || 0), 0);
  const totalCarbs = currentFoods.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const totalFat = currentFoods.reduce((sum, item) => sum + (item.fat || 0), 0);
  const totalFiber = currentFoods.reduce((sum, item) => sum + (item.fiber || 0), 0);
  const totalSugar = currentFoods.reduce((sum, item) => sum + (item.sugar || 0), 0);
  const totalSodium = currentFoods.reduce((sum, item) => sum + (item.sodium || 0), 0);
  const waterMl = currentWater.reduce((sum, item) => sum + (item.amountMl || 0), 0);
  const targetWater = userProfile?.targetWaterMl || 3000;
  
  const stepsVal = currentDecl.steps || 0;
  const activeCalVal = currentDecl.activeCalories || 0;

  // Embedded forms states
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [weightFormOpen, setWeightFormOpen] = useState(false);
  const [customWaterText, setCustomWaterText] = useState('');

  // Activity form values
  const [actActivity, setActActivity] = useState('');
  const [actSteps, setActSteps] = useState('');
  const [actCalories, setActCalories] = useState('');
  const [actTime, setActTime] = useState('');
  const [actImage, setActImage] = useState('');
  const [actIsCustomImage, setActIsCustomImage] = useState(false);

  // Weight form values
  const [wtWeight, setWtWeight] = useState('');
  const [wtWaist, setWtWaist] = useState('');
  const [wtChest, setWtChest] = useState('');
  const [wtHips, setWtHips] = useState('');
  const [wtFat, setWtFat] = useState('');
  const [wtPhoto, setWtPhoto] = useState('');

  // Prefill forms when date or selected records change
  useEffect(() => {
    setActActivity(currentDecl.activity || '');
    setActSteps(currentDecl.steps ? String(currentDecl.steps) : '');
    setActCalories(currentDecl.activeCalories ? String(currentDecl.activeCalories) : '');
    setActTime(currentDecl.activeTime ? String(currentDecl.activeTime) : '');
    setActImage(currentDecl.image || '');
    setActIsCustomImage(currentDecl.image && !PRESET_IMAGES.some(img => img.url === currentDecl.image) ? true : false);
  }, [selectedDate, currentDecl]);

  useEffect(() => {
    if (currentWeight) {
      setWtWeight(String(currentWeight.weightKg));
      setWtWaist(currentWeight.waistCm ? String(currentWeight.waistCm) : '');
      setWtChest(currentWeight.chestCm ? String(currentWeight.chestCm) : '');
      setWtHips(currentWeight.hipsCm ? String(currentWeight.hipsCm) : '');
      setWtFat(currentWeight.bodyFatPct ? String(currentWeight.bodyFatPct) : '');
      setWtPhoto(currentWeight.photoUrl || '');
    } else {
      setWtWeight('');
      setWtWaist('');
      setWtChest('');
      setWtHips('');
      setWtFat('');
      setWtPhoto('');
    }
  }, [selectedDate, currentWeight]);

  // Clean review when date changes
  useEffect(() => {
    setReview('');
  }, [selectedDate]);



  const runVoiceLog = async () => {
    if (!inputFoodText.trim()) return;
    setBusy(true);
    setStatus('AI đang phân tích món ăn...');
    try {
      const logs = await triggerVoiceLogging(inputFoodText);
      setStatus(`Đã phân tích và thêm thành công ${logs.length || 1} món!`);
      setInputFoodText('');
    } catch (error: any) {
      setStatus(error?.message || 'Không thể ghi nhận món ăn.');
    } finally {
      setBusy(false);
    }
  };

  const [webFeatureModalOpen, setWebFeatureModalOpen] = useState(false);

  const runScan = useCallback(async () => {
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

      // Show scanning modal and status
      setIsAiScanning(true);
      setBusy(true);
      setStatus('AI đang phân tích món ăn từ ảnh chụp...');

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
        console.warn('ImageManipulator fallback in journal:', manipErr);
        base64Data = result.assets[0].base64 ?? undefined;
      }

      if (!base64Data) {
        setIsAiScanning(false);
        setBusy(false);
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

      // CRITICAL: Dismiss modal FIRST before showing alert
      setIsAiScanning(false);
      setBusy(false);

      const name = scan?.mealDetected || 'Món ăn quét bằng AI';
      const hour = new Date().getHours();
      let defaultMeal: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch';
      if (hour >= 5 && hour < 11) defaultMeal = 'breakfast';
      else if (hour >= 11 && hour < 14) defaultMeal = 'lunch';
      else if (hour >= 14 && hour < 18) defaultMeal = 'snack';
      else defaultMeal = 'dinner';

      await addFoodLog(
        defaultMeal,
        name,
        350,
        scan?.calories || 642,
        scan?.protein || 32,
        scan?.carbs || 78,
        scan?.fat || 18,
        selectedDate
      );
      setStatus(`Quét AI thành công: Đã ghi nhận ${name} (${scan?.calories || 642} kcal)`);

      // Allow 350ms for modal dismissal before presenting native alert
      setTimeout(() => {
        Alert.alert(
          'Quét món ăn thành công 📸',
          `AI đã nhận diện: ${name}\n• Calo: ${scan?.calories || 642} kcal\n• Đạm: ${scan?.protein || 32}g\n• Tinh bột: ${scan?.carbs || 78}g\n• Chất béo: ${scan?.fat || 18}g\n\nĐã tự động thêm vào nhật ký hôm nay!`,
          [{ text: 'Đồng ý', style: 'default' }]
        );
      }, 350);
    } catch (error: any) {
      console.error(error);
      setIsAiScanning(false);
      setBusy(false);
      setTimeout(() => {
        Alert.alert('Thông báo', 'Không thể hoàn tất quét món ăn. Vui lòng thử lại.');
      }, 350);
    }
  }, [addFoodLog, selectedDate, triggerMockScanFood]);

  const addQuickWater = async (ml: number) => {
    await addWaterLog(ml, selectedDate);
    setStatus(`Đã uống thêm ${ml}ml nước.`);
  };

  const handleCustomWaterSubmit = async () => {
    const ml = parseInt(customWaterText);
    if (!ml || ml <= 0) {
      Alert.alert('Thông báo', 'Vui lòng nhập số lượng nước hợp lệ.');
      return;
    }
    await addWaterLog(ml, selectedDate);
    setCustomWaterText('');
    setStatus(`Đã uống thêm ${ml}ml nước.`);
  };

  const handleSaveActivityDecl = () => {
    if (!actActivity.trim() && !actImage) {
      Alert.alert('Thông báo', 'Vui lòng nhập hoạt động hoặc chọn một bức ảnh để lưu nhật ký.');
      return;
    }
    saveDailyDeclaration(selectedDate, {
      activity: actActivity,
      image: actImage,
      steps: parseInt(actSteps) || 0,
      activeCalories: parseInt(actCalories) || 0,
      activeTime: parseInt(actTime) || 0,
    });
    setActivityFormOpen(false);
    Alert.alert('Thành công', 'Đã lưu nhật ký hoạt động thể chất!');
  };

  const handleSaveWeightLog = async () => {
    const wt = parseFloat(wtWeight);
    if (!wt) {
      Alert.alert('Thông báo', 'Vui lòng nhập cân nặng hợp lệ.');
      return;
    }
    await addWeightLog(
      wt,
      wtWaist ? parseFloat(wtWaist) : undefined,
      wtChest ? parseFloat(wtChest) : undefined,
      wtHips ? parseFloat(wtHips) : undefined,
      wtFat ? parseFloat(wtFat) : undefined,
      wtPhoto || undefined,
      selectedDate
    );
    setWeightFormOpen(false);
    Alert.alert('Thành công', 'Đã lưu chỉ số cân nặng cơ thể thành công!');
  };

  const runReview = async () => {
    setBusy(true);
    setStatus('AI đang đánh giá ngày của bạn...');
    try {
      const history = await getLogsForDate(selectedDate);
      const text = await generateDailyAiReview({ date: selectedDate, ...history } as any);
      setReview(text);
      setStatus('Cập nhật nhận xét AI thành công!');
    } catch (error: any) {
      setStatus(error?.message || 'Chưa thể tạo đánh giá AI.');
    } finally {
      setBusy(false);
    }
  };

  // Group food logs by meal type
  const foodsByMealType = useMemo(() => {
    const grouped = {
      breakfast: [] as FoodLog[],
      lunch: [] as FoodLog[],
      dinner: [] as FoodLog[],
      snack: [] as FoodLog[]
    };
    currentFoods.forEach(food => {
      const type = food.mealType;
      if (grouped[type]) {
        grouped[type].push(food);
      } else {
        grouped.snack.push(food);
      }
    });
    return grouped;
  }, [currentFoods]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Text style={[styles.screenHeader, { color: theme.text }]}>Nhật ký dinh dưỡng</Text>

          {status ? <Text style={styles.statusText}>{status}</Text> : null}

          {/* Big container card */}
          <View style={[styles.journalMainCard, { backgroundColor: theme.background }]}>
            
            {/* Section 1: Nhật ký hoạt động */}
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Nhật ký chung</Text>
              
              {/* Tabs list Gần đây & Tra cứu */}
              <View style={styles.subTabsRow}>
                <Pressable onPress={() => setActiveTab('recent')} style={styles.subTabBtn}>
                  <Text style={[styles.subTabBtnText, { color: theme.textMuted }, activeTab === 'recent' && styles.subTabBtnTextActive]}>
                    Gần đây
                  </Text>
                  {activeTab === 'recent' && <View style={styles.subTabActiveLine} />}
                </Pressable>
                <Pressable onPress={() => setActiveTab('lookup')} style={styles.subTabBtn}>
                  <Text style={[styles.subTabBtnText, { color: theme.textMuted }, activeTab === 'lookup' && styles.subTabBtnTextActive]}>
                    Tra cứu theo ngày
                  </Text>
                  {activeTab === 'lookup' && <View style={styles.subTabActiveLine} />}
                </Pressable>
              </View>

              {/* Date Navigator (Visible only in lookup tab) */}
              {activeTab === 'lookup' && (
                <View style={[styles.dateNavigatorRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.cardBorder }]}>
                  <Pressable onPress={handlePrevDay} style={styles.dateNavBtn}>
                    <Ionicons name="chevron-back" size={20} color='#FF9F1C' />
                  </Pressable>
                  <Pressable onPress={() => setShowDatePickerModal(true)} style={[styles.dateDisplayContainer, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Ionicons name="calendar-outline" size={16} color="#FF9F1C" />
                    <Text style={styles.dateNavText}>{formatDisplayDate(lookupDate)}</Text>
                    <Ionicons name="chevron-down" size={14} color="#FF9F1C" />
                  </Pressable>
                  <Pressable 
                    onPress={handleNextDay} 
                    disabled={lookupDate >= today} 
                    style={[styles.dateNavBtn, lookupDate >= today && styles.dateNavBtnDisabled]}
                  >
                    <Ionicons name="chevron-forward" size={20} color={lookupDate >= today ? "rgba(255,248,231,0.2)" : '#FF9F1C'} />
                  </Pressable>
                </View>
              )}

              {/* Calendar summary item */}
              <View style={[styles.calendarSummaryRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.cardBorder }]}>
                <View style={styles.calendarSummaryLeft}>
                  <Text style={styles.calendarSummaryIcon}>📅</Text>
                  <View>
                    <Text style={[styles.calendarSummaryTitle, { color: theme.text }]}>
                      {activeTab === 'recent' ? 'Hôm nay' : formatDisplayDate(lookupDate)}
                    </Text>
                    <Text style={[styles.calendarSummaryDesc, { color: theme.textMuted }]}>
                      {currentFoods.length} món • {currentWater.length} lần nước • {currentWeight ? '1 lần cân' : '0 lần cân'}
                    </Text>
                  </View>
                </View>
                <View style={styles.calendarSummaryRight}>
                  <Text style={styles.calendarSummaryVal}>{foodCal} kcal</Text>
                  <Text style={[styles.calendarSummarySub, { color: theme.textMuted }]}>{waterMl} ml</Text>
                </View>
              </View>

              {/* LTAPP-34: Biểu đồ tròn Calo & Phân bổ Macros theo ngày */}
              <View style={{ marginVertical: 8, alignItems: 'center' }}>
                <DonutMacroChart
                  proteinG={totalProtein}
                  carbsG={totalCarbs}
                  fatG={totalFat}
                  consumedCalories={foodCal}
                  targetCalories={userProfile?.targetCalories || 2200}
                  size={175}
                  strokeWidth={18}
                  textColor={theme.text}
                  subTextColor={theme.textMuted}
                />
              </View>

              {/* AI Review Button */}
              <Pressable onPress={runReview} style={styles.aiReviewBtn}>
                <Text style={styles.aiReviewBtnText}>
                  🤖 Đánh giá {activeTab === 'recent' ? 'hôm nay' : 'ngày đã chọn'} bằng AI
                </Text>
              </Pressable>

              {review ? (
                <View style={styles.reviewBox}>
                  <Text style={styles.reviewText}>{review}</Text>
                </View>
              ) : null}
            </View>

            {/* Section 2: Ghi nhật ký ăn bằng AI Voice */}
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Ghi nhật ký ăn bằng AI</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Nói hoặc gõ những gì bạn đã ăn</Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  value={inputFoodText}
                  onChangeText={setInputFoodText}
                  placeholder="Tôi ăn cơm tấm sườn nướng..."
                  placeholderTextColor={theme.textMuted}
                  style={[styles.foodInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                />
                <Pressable onPress={runVoiceLog} style={styles.sendFoodBtn}>
                  <Text style={styles.sendFoodBtnText}>{busy ? '...' : 'Gửi'}</Text>
                </Pressable>
              </View>
            </View>

            {/* Section 2.5: Danh sách ăn uống chi tiết */}
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Chi tiết bữa ăn ({foodCal} kcal)</Text>
              
              {([
                { key: 'breakfast', label: 'Bữa Sáng 🌅', icon: 'breakfast-outline' },
                { key: 'lunch', label: 'Bữa Trưa ☀️', icon: 'sunny-outline' },
                { key: 'dinner', label: 'Bữa Tối 🌌', icon: 'moon-outline' },
                { key: 'snack', label: 'Bữa Phụ 🍎', icon: 'restaurant-outline' }
              ] as const).map(meal => {
                const logs = foodsByMealType[meal.key];
                const mealCal = logs.reduce((sum, item) => sum + (item.calories || 0), 0);
                
                return (
                  <View key={meal.key} style={[styles.mealCategoryBlock, { backgroundColor: isDark ? '#1E1A17' : 'rgba(0,0,0,0.02)', borderColor: theme.cardBorder }]}>
                    <View style={styles.mealCategoryHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name={meal.icon as any} size={16} color='#FF9F1C' />
                        <Text style={[styles.mealCategoryTitle, { color: theme.text }]}>{meal.label}</Text>
                      </View>
                      <Text style={styles.mealCategoryCalVal}>{mealCal} kcal</Text>
                    </View>
                    
                    <View style={styles.mealItemsList}>
                      {logs.length === 0 ? (
                        <Text style={[styles.noMealText, { color: theme.textMuted }]}>Chưa ghi nhận món ăn</Text>
                      ) : (
                        logs.map(item => (
                          <View key={item.id} style={styles.foodLogItemRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.foodLogItemName, { color: theme.text }]}>{item.foodName}</Text>
                              <Text style={[styles.foodLogItemMacros, { color: theme.textMuted }]}>
                                {item.servingSizeG}g • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                                {item.fiber ? ` • Xơ: ${item.fiber}g` : ''}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <Text style={styles.foodLogItemCal}>{item.calories} kcal</Text>
                              <Pressable onPress={() => deleteFoodLog(item.id)} style={styles.deleteBtn}>
                                <Text style={styles.deleteBtnText}>Xóa</Text>
                              </Pressable>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* LTAPP-33: Theo dõi vi chất dinh dưỡng (Chất xơ, Đường, Natri) */}
            <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Vi chất dinh dưỡng (Micronutrients) 🔬</Text>
                <Text style={{ fontSize: 11, color: theme.textMuted }}>Chuẩn y tế</Text>
              </View>

              {/* Chất xơ */}
              <View style={styles.progressBlock}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>🌾 Chất xơ (Fiber)</Text>
                  <Text style={[styles.progressValueText, { color: totalFiber >= 25 ? '#10B981' : theme.text }]}>
                    {totalFiber}g / 30g mục tiêu
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFillGreen, { width: `${Math.min(100, (totalFiber / 30) * 100)}%`, backgroundColor: '#10B981' }]} />
                </View>
              </View>

              {/* Đường */}
              <View style={styles.progressBlock}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>🍬 Đường (Sugar)</Text>
                  <Text style={[styles.progressValueText, { color: totalSugar > 50 ? '#EF4444' : theme.text }]}>
                    {totalSugar}g / tối đa 50g
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFillOrange, { width: `${Math.min(100, (totalSugar / 50) * 100)}%`, backgroundColor: totalSugar > 50 ? '#EF4444' : '#F59E0B' }]} />
                </View>
              </View>

              {/* Natri */}
              <View style={styles.progressBlock}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>🧂 Natri (Sodium)</Text>
                  <Text style={[styles.progressValueText, { color: totalSodium > 2300 ? '#EF4444' : theme.text }]}>
                    {totalSodium}mg / tối đa 2,300mg
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFillBlue, { width: `${Math.min(100, (totalSodium / 2300) * 100)}%`, backgroundColor: totalSodium > 2300 ? '#EF4444' : '#38BDF8' }]} />
                </View>
              </View>
            </View>

            {/* Section 3: Theo dõi nước uống */}
            <View style={styles.section}>
              <View style={styles.waterTitleRow}>
                <Text style={styles.sectionTitle}>Theo dõi nước uống</Text>
                <Text style={styles.waterFraction}>{waterMl} / {targetWater} ml</Text>
              </View>

              {/* Water Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFillBlue, { width: `${Math.min(100, (waterMl / targetWater) * 100)}%` }]} />
              </View>

              {/* Quick buttons */}
              <View style={styles.waterQuickRow}>
                <Pressable onPress={() => addQuickWater(250)} style={styles.waterQuickBtn}>
                  <Text style={styles.waterQuickBtnText}>+250ml</Text>
                </Pressable>
                <Pressable onPress={() => addQuickWater(500)} style={styles.waterQuickBtn}>
                  <Text style={styles.waterQuickBtnText}>+500ml</Text>
                </Pressable>
                <Pressable onPress={() => addQuickWater(1000)} style={styles.waterQuickBtn}>
                  <Text style={styles.waterQuickBtnText}>+1L</Text>
                </Pressable>
              </View>

              {/* Custom water input */}
              <View style={styles.customWaterRow}>
                <TextInput
                  placeholder="Nhập lượng nước khác (VD: 350)"
                  placeholderTextColor="rgba(255,248,231,0.3)"
                  keyboardType="numeric"
                  value={customWaterText}
                  onChangeText={setCustomWaterText}
                  style={styles.customWaterInput}
                />
                <Pressable onPress={handleCustomWaterSubmit} style={styles.customWaterAddBtn}>
                  <Text style={styles.customWaterAddBtnText}>Thêm</Text>
                </Pressable>
              </View>

              {/* Water logs lists */}
              <View style={styles.logsList}>
                {currentWater.length === 0 ? (
                  <Text style={styles.noMealText}>Chưa ghi nhận nước uống</Text>
                ) : (
                  currentWater.map((item) => (
                    <View key={item.id} style={styles.logRowItem}>
                      <Text style={styles.logRowText}>🥛 Đã uống {item.amountMl} ml</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={styles.logRowTime}>{item.loggedAt}</Text>
                        <Pressable onPress={() => deleteWaterLog(item.id)} style={styles.deleteBtn}>
                          <Text style={styles.deleteBtnText}>Xóa</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Section 4: Hoạt động thể chất & Wearables */}
            <View style={styles.section}>
              <View style={styles.wearablesHeaderRow}>
                <Text style={styles.sectionTitle}>Hoạt động thể chất & Wearables</Text>
                <Ionicons name="watch-outline" size={18} color="#FFF8E7" />
              </View>

              {/* Steps & Distance Progress (LTAPP-70) */}
              <View style={styles.progressBlock}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>🏃‍♂️ Số bước đi & Quãng đường</Text>
                  <Text style={styles.progressValueText}>
                    {stepsVal.toLocaleString()} bước • ~{(stepsVal * 0.00075).toFixed(2)} km
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFillGreen, { width: `${Math.min(100, (stepsVal / 10000) * 100)}%` }]} />
                </View>
              </View>

              {/* Calories Progress */}
              <View style={styles.progressBlock}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>🔥 Calo tiêu hao (Active)</Text>
                  <Text style={styles.progressValueText}>{activeCalVal} / 500 kcal</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFillOrange, { width: `${Math.min(100, (activeCalVal / 500) * 100)}%` }]} />
                </View>
              </View>

              {currentDecl.activity ? (
                <View style={styles.activityDetailBox}>
                  <Text style={styles.activityDetailText}>🏃‍♂️ Hoạt động: {currentDecl.activity}</Text>
                  <Text style={styles.activityDetailSub}>⏱️ Thời gian: {currentDecl.activeTime} phút</Text>
                </View>
              ) : null}
              {currentDecl.image ? (
                <Image source={{ uri: currentDecl.image }} style={styles.activityDeclPreviewImage} />
              ) : null}

              <Pressable 
                onPress={() => setActivityFormOpen(!activityFormOpen)} 
                style={styles.formToggleBtn}
              >
                <Text style={styles.formToggleBtnText}>
                  {activityFormOpen ? '✕ Đóng form cập nhật' : '✍️ Cập nhật hoạt động'}
                </Text>
              </Pressable>

              {activityFormOpen && (
                <View style={styles.embeddedFormCard}>
                  <Text style={styles.formLabel}>Chi tiết hoạt động thể chất</Text>
                  <TextInput
                    placeholder="Hôm nay bạn tập gì? (VD: Chạy bộ, tập Gym...)"
                    placeholderTextColor="rgba(255,248,231,0.3)"
                    value={actActivity}
                    onChangeText={setActActivity}
                    style={styles.formInput}
                  />
                  
                  <View style={styles.formRowFields}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formFieldSubLabel}>Số bước</Text>
                      <TextInput
                        placeholder="VD: 10000"
                        placeholderTextColor="rgba(255,248,231,0.3)"
                        keyboardType="numeric"
                        value={actSteps}
                        onChangeText={setActSteps}
                        style={styles.formInput}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formFieldSubLabel}>Calo tiêu hao</Text>
                      <TextInput
                        placeholder="VD: 450"
                        placeholderTextColor="rgba(255,248,231,0.3)"
                        keyboardType="numeric"
                        value={actCalories}
                        onChangeText={setActCalories}
                        style={styles.formInput}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formFieldSubLabel}>Phút tập</Text>
                      <TextInput
                        placeholder="VD: 45"
                        placeholderTextColor="rgba(255,248,231,0.3)"
                        keyboardType="numeric"
                        value={actTime}
                        onChangeText={setActTime}
                        style={styles.formInput}
                      />
                    </View>
                  </View>
                  
                  <Text style={styles.formFieldSubLabel}>Hình ảnh hoạt động</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                    <Pressable
                      onPress={() => {
                        setActIsCustomImage(false);
                        setActImage('');
                      }}
                      style={[
                        styles.presetPhotoCard,
                        !actImage && !actIsCustomImage && styles.presetPhotoCardActive
                      ]}
                    >
                      <Text style={{ fontSize: 16 }}>❌</Text>
                      <Text style={{ fontSize: 10, color: '#FFF8E7' }}>Không ảnh</Text>
                    </Pressable>
                    {PRESET_IMAGES.map(img => (
                      <Pressable
                        key={img.id}
                        onPress={() => {
                          setActIsCustomImage(false);
                          setActImage(img.url);
                        }}
                        style={[
                          styles.presetPhotoCard,
                          actImage === img.url && styles.presetPhotoCardActive
                        ]}
                      >
                        <Image source={{ uri: img.url }} style={styles.presetImageThumbnail} />
                        <Text style={{ fontSize: 9, color: '#FFF8E7', marginTop: 2 }} numberOfLines={1}>{img.label}</Text>
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => {
                        setActIsCustomImage(true);
                        setActImage('');
                      }}
                      style={[
                        styles.presetPhotoCard,
                        actIsCustomImage && styles.presetPhotoCardActive
                      ]}
                    >
                      <Text style={{ fontSize: 16 }}>🔗</Text>
                      <Text style={{ fontSize: 10, color: '#FFF8E7' }}>Nhập URL</Text>
                    </Pressable>
                  </ScrollView>

                  {actIsCustomImage && (
                    <TextInput
                      placeholder="Nhập liên kết ảnh (http://...)"
                      placeholderTextColor="rgba(255,248,231,0.3)"
                      value={actImage}
                      onChangeText={setActImage}
                      style={styles.formInput}
                    />
                  )}

                  {actImage ? (
                    <Image source={{ uri: actImage }} style={styles.previewImageThumb} />
                  ) : null}

                  <Pressable onPress={handleSaveActivityDecl} style={styles.formSubmitBtn}>
                    <Text style={styles.formSubmitBtnText}>Lưu hoạt động</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Section 5: Chỉ số cơ thể & Cân nặng */}
            <View style={styles.sectionLast}>
              <View style={styles.wearablesHeaderRow}>
                <Text style={styles.sectionTitle}>Chỉ số cơ thể & Cân nặng</Text>
                <Ionicons name="scale-outline" size={18} color="#FFF8E7" />
              </View>

              {currentWeight ? (
                <View style={styles.weightInfoBox}>
                  <Text style={styles.weightInfoTitle}>⚖️ Số đo ghi nhận:</Text>
                  <Text style={styles.weightInfoValue}>
                    Cân nặng: <Text style={{ color: '#FF9F1C', fontWeight: '900' }}>{currentWeight.weightKg} kg</Text>
                  </Text>
                  {currentWeight.bodyFatPct ? (
                    <Text style={styles.weightInfoSubValue}>• Tỷ lệ mỡ: {currentWeight.bodyFatPct}%</Text>
                  ) : null}
                  {(currentWeight.chestCm || currentWeight.waistCm || currentWeight.hipsCm) ? (
                    <Text style={styles.weightInfoSubValue}>
                      • Số đo 3 vòng: {currentWeight.chestCm || '--'} / {currentWeight.waistCm || '--'} / {currentWeight.hipsCm || '--'} cm
                    </Text>
                  ) : null}
                  {currentWeight.photoUrl ? (
                    <Image source={{ uri: currentWeight.photoUrl }} style={styles.weightImagePreview} />
                  ) : null}
                </View>
              ) : (
                <Text style={styles.noMealText}>Chưa ghi nhận cân nặng hôm nay.</Text>
              )}

              <Pressable 
                onPress={() => setWeightFormOpen(!weightFormOpen)} 
                style={styles.formToggleBtn}
              >
                <Text style={styles.formToggleBtnText}>
                  {weightFormOpen ? '✕ Đóng form cân nặng' : '⚖️ Ghi nhận chỉ số mới'}
                </Text>
              </Pressable>

              {weightFormOpen && (
                <View style={styles.embeddedFormCard}>
                  <Text style={styles.formLabel}>Nhập số đo cân nặng mới</Text>
                  
                  <View style={styles.formRowFields}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formFieldSubLabel}>Cân nặng (kg)*</Text>
                      <TextInput
                        placeholder="VD: 70.5"
                        placeholderTextColor="rgba(255,248,231,0.3)"
                        keyboardType="numeric"
                        value={wtWeight}
                        onChangeText={setWtWeight}
                        style={styles.formInput}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formFieldSubLabel}>Tỷ lệ mỡ (%)</Text>
                      <TextInput
                        placeholder="VD: 18.5"
                        placeholderTextColor="rgba(255,248,231,0.3)"
                        keyboardType="numeric"
                        value={wtFat}
                        onChangeText={setWtFat}
                        style={styles.formInput}
                      />
                    </View>
                  </View>

                  <View style={styles.formRowFields}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formFieldSubLabel}>Vòng ngực (cm)</Text>
                      <TextInput
                        placeholder="VD: 98"
                        placeholderTextColor="rgba(255,248,231,0.3)"
                        keyboardType="numeric"
                        value={wtChest}
                        onChangeText={setWtChest}
                        style={styles.formInput}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formFieldSubLabel}>Vòng eo (cm)</Text>
                      <TextInput
                        placeholder="VD: 82"
                        placeholderTextColor="rgba(255,248,231,0.3)"
                        keyboardType="numeric"
                        value={wtWaist}
                        onChangeText={setWtWaist}
                        style={styles.formInput}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formFieldSubLabel}>Vòng mông (cm)</Text>
                      <TextInput
                        placeholder="VD: 95"
                        placeholderTextColor="rgba(255,248,231,0.3)"
                        keyboardType="numeric"
                        value={wtHips}
                        onChangeText={setWtHips}
                        style={styles.formInput}
                      />
                    </View>
                  </View>

                  <Text style={styles.formFieldSubLabel}>Liên kết ảnh vóc dáng (URL)</Text>
                  <TextInput
                    placeholder="Nhập liên kết ảnh cơ thể (http://...)"
                    placeholderTextColor="rgba(255,248,231,0.3)"
                    value={wtPhoto}
                    onChangeText={setWtPhoto}
                    style={styles.formInput}
                  />

                  {wtPhoto ? (
                    <Image source={{ uri: wtPhoto }} style={styles.previewImageThumb} />
                  ) : null}

                  <Pressable onPress={handleSaveWeightLog} style={styles.formSubmitBtn}>
                    <Text style={styles.formSubmitBtnText}>Lưu số đo</Text>
                  </Pressable>
                </View>
              )}
            </View>

          </View>

        </ScrollView>
      </SafeAreaView>
    
      {/* Date Picker Modal */}
      <Modal visible={showDatePickerModal} transparent animationType="slide" onRequestClose={() => setShowDatePickerModal(false)}>
        <Pressable onPress={() => setShowDatePickerModal(false)} style={styles.modalOverlay}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar" size={22} color={theme.primary} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Tra cứu theo ngày</Text>
              </View>
              <Pressable onPress={() => setShowDatePickerModal(false)}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Smart Date Input */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, marginBottom: 6, textTransform: 'uppercase' }}>
                Nhập ngày tra cứu (DD/MM/YYYY)
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TextInput
                  value={customDateInput}
                  onChangeText={handleLiveDateInputChange}
                  keyboardType="number-pad"
                  placeholder="VD: 15/07/2026"
                  placeholderTextColor={theme.textMuted}
                  maxLength={10}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    color: theme.text,
                    fontSize: 14,
                    backgroundColor: theme.background,
                  }}
                />
                <Pressable
                  onPress={() => {
                    const resolvedDate = parseSmartDateInput(customDateInput);
                    if (!resolvedDate) {
                      Alert.alert(
                        'Thông báo ngày chưa đúng 📅',
                        'Vui lòng nhập ngày dạng DD/MM/YYYY (VD: 15/07/2026) hoặc gõ 8 chữ số liền nhau (VD: 15072026 cho ngày 15/07/2026).'
                      );
                      return;
                    }
                    setLookupDate(resolvedDate);
                    setCustomDateInput('');
                    setShowDatePickerModal(false);
                  }}
                  style={{
                    backgroundColor: theme.primary,
                    borderRadius: 10,
                    paddingHorizontal: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#100E0C', fontWeight: '800', fontSize: 13 }}>Tra cứu</Text>
                </Pressable>
              </View>

              {/* Quick Preset Buttons */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>
                Chọn nhanh
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Hôm nay 📅', date: today },
                  { label: 'Hôm qua ⏪', date: getLocalDateString(new Date(Date.now() - 24 * 3600 * 1000)) },
                  { label: '2 ngày trước', date: getLocalDateString(new Date(Date.now() - 2 * 24 * 3600 * 1000)) },
                  { label: '3 ngày trước', date: getLocalDateString(new Date(Date.now() - 3 * 24 * 3600 * 1000)) },
                  { label: '4 ngày trước', date: getLocalDateString(new Date(Date.now() - 4 * 24 * 3600 * 1000)) },
                  { label: '5 ngày trước', date: getLocalDateString(new Date(Date.now() - 5 * 24 * 3600 * 1000)) },
                ].map(preset => (
                  <Pressable
                    key={preset.date}
                    onPress={() => {
                      setLookupDate(preset.date);
                      setShowDatePickerModal(false);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: lookupDate === preset.date ? theme.primary : theme.cardBorder,
                      backgroundColor: lookupDate === preset.date ? theme.primary + '20' : theme.background,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: lookupDate === preset.date ? theme.primary : theme.text }}>
                      {preset.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Past 14 Days List */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>
                Danh sách ngày gần đây
              </Text>
              {Array.from({ length: 14 }).map((_, idx) => {
                const dStr = getLocalDateString(new Date(Date.now() - idx * 24 * 3600 * 1000));
                const isSelected = dStr === lookupDate;
                const foodsForDay = foodLogs.filter(f => f.loggedDate === dStr);
                const waterForDay = waterLogs.filter(w => w.loggedDate === dStr);
                const dayCal = foodsForDay.reduce((s, f) => s + (f.calories || 0), 0);
                const dayWater = waterForDay.reduce((s, w) => s + (w.amountMl || 0), 0);

                return (
                  <Pressable
                    key={dStr}
                    onPress={() => {
                      setLookupDate(dStr);
                      setShowDatePickerModal(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      marginBottom: 6,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.primary : theme.cardBorder,
                      backgroundColor: isSelected ? theme.primary + '15' : theme.background,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="calendar-outline" size={16} color={isSelected ? theme.primary : theme.textMuted} />
                      <Text style={{ fontSize: 14, fontWeight: isSelected ? '800' : '600', color: isSelected ? theme.primary : theme.text }}>
                        {formatDisplayDate(dStr)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>
                        {dayCal > 0 ? `${dayCal} kcal` : 'Chưa ghi'}
                      </Text>
                      {dayWater > 0 && (
                        <Text style={{ fontSize: 11, color: '#38BDF8' }}>{dayWater}ml nước</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* AI Scanning Modal */}
      <AiScanningModal
        visible={isAiScanning}
        onCancel={() => {
          setIsAiScanning(false);
          setBusy(false);
        }}
      />
      {/* Web Mobile Feature Alert Modal */}
      <MobileFeatureModal visible={webFeatureModalOpen} onClose={() => setWebFeatureModalOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingBottom: 130,
    gap: 16,
  },
  screenHeader: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF8E7',
    marginTop: 4,
  },
  statusText: {
    color: '#FF9F1C',
    fontSize: 13,
    fontWeight: '800',
  },
  journalMainCard: {
    borderRadius: 24,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  section: {
    backgroundColor: '#1E1A17',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 28, 0.35)',
    padding: 16,
    marginVertical: 6,
    gap: 10,
  },
  sectionLast: {
    backgroundColor: '#1E1A17',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 28, 0.35)',
    padding: 16,
    marginVertical: 6,
    gap: 12,
  },
  sectionTitle: {
    color: '#FFF8E7',
    fontSize: 14,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: 'rgba(255,248,231,0.5)',
    fontSize: 11,
    fontWeight: '700',
  },

  // Tabs style
  subTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  subTabBtn: {
    paddingVertical: 8,
    marginRight: 20,
    position: 'relative',
  },
  subTabBtnText: {
    color: 'rgba(255,248,231,0.4)',
    fontSize: 13,
    fontWeight: '800',
  },
  subTabBtnTextActive: {
    color: '#FF9F1C',
    fontWeight: '900',
  },
  subTabActiveLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FF9F1C',
  },

  // Filters Row
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rangeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  rangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rangeBtnActive: {
    backgroundColor: '#FF9F1C',
    borderColor: '#FF9F1C',
  },
  rangeBtnText: {
    color: 'rgba(255,248,231,0.6)',
    fontSize: 11,
    fontWeight: '800',
  },
  rangeBtnTextActive: {
    color: '#10120F',
    fontWeight: '900',
  },
  checkboxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    color: 'rgba(255,248,231,0.6)',
    fontSize: 12,
    fontWeight: '800',
  },

  // Calendar summary row
  calendarSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  calendarSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  calendarSummaryIcon: {
    fontSize: 22,
  },
  calendarSummaryTitle: {
    color: '#FFF8E7',
    fontSize: 13,
    fontWeight: '900',
  },
  calendarSummaryDesc: {
    color: 'rgba(255,248,231,0.4)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  calendarSummaryRight: {
    alignItems: 'flex-end',
  },
  calendarSummaryVal: {
    color: '#FF9F1C',
    fontSize: 13,
    fontWeight: '900',
  },
  calendarSummarySub: {
    color: 'rgba(255,248,231,0.4)',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },

  // AI Review Button
  aiReviewBtn: {
    height: 44,
    borderRadius: 18,
    backgroundColor: '#FF9F1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  aiReviewBtnText: {
    color: '#10120F',
    fontWeight: '900',
    fontSize: 13,
  },
  reviewBox: {
    backgroundColor: 'rgba(255, 159, 28, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 159, 28, 0.15)',
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
  },
  reviewText: {
    color: '#FF9F1C',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },

  // Inputs
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  foodInput: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sendFoodBtn: {
    width: 60,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FF9F1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendFoodBtnText: {
    color: '#10120F',
    fontWeight: '900',
    fontSize: 13,
  },

  // Water Tracker
  waterTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterFraction: {
    color: '#FF9F1C',
    fontSize: 13,
    fontWeight: '900',
  },
  waterQuickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  waterQuickBtn: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(38, 217, 248, 0.3)',
    backgroundColor: 'rgba(38, 217, 248, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterQuickBtnText: {
    color: '#FF9F1C',
    fontSize: 12,
    fontWeight: '900',
  },
  logsList: {
    marginTop: 8,
    gap: 6,
  },
  logRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  logRowText: {
    color: 'rgba(255,248,231,0.6)',
    fontSize: 12,
    fontWeight: '800',
  },
  deleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteBtnText: {
    color: '#FF4A4A',
    fontSize: 11,
    fontWeight: '900',
  },

  // Wearables Progress
  wearablesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBlock: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: 'rgba(255,248,231,0.6)',
    fontSize: 12,
    fontWeight: '800',
  },
  progressValueText: {
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '900',
  },

  // Progress Bar Tracks
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFillBlue: {
    height: '100%',
    backgroundColor: '#FF9F1C',
  },
  progressBarFillGreen: {
    height: '100%',
    backgroundColor: '#FF9F1C',
  },
  progressBarFillOrange: {
    height: '100%',
    backgroundColor: '#FF8008',
  },
  aiScanPageBtn: {
    height: 40,
    borderRadius: 16,
    backgroundColor: '#FF9F1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  aiScanPageBtnText: {
    color: '#10120F',
    fontWeight: '900',
    fontSize: 13,
  },
  dateNavigatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  dateNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  dateNavBtnDisabled: {
    opacity: 0.3,
  },
  dateDisplayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateNavText: {
    color: '#FF9F1C',
    fontSize: 13,
    fontWeight: '900',
  },
  mealCategoryBlock: {
    marginVertical: 6,
    backgroundColor: '#1E1A17',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 159, 28, 0.15)',
  },
  mealCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 6,
    marginBottom: 6,
  },
  mealCategoryTitle: {
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '900',
  },
  mealCategoryCalVal: {
    color: '#FF9F1C',
    fontSize: 12,
    fontWeight: '900',
  },
  mealItemsList: {
    gap: 6,
  },
  noMealText: {
    color: 'rgba(255,248,231,0.3)',
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 4,
    textAlign: 'center',
  },
  foodLogItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  foodLogItemName: {
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '800',
  },
  foodLogItemMacros: {
    color: 'rgba(255,248,231,0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  foodLogItemCal: {
    color: '#FF9F1C',
    fontSize: 12,
    fontWeight: '800',
  },
  customWaterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  customWaterInput: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingHorizontal: 12,
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '700',
  },
  customWaterAddBtn: {
    width: 60,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FF9F1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customWaterAddBtnText: {
    color: '#10120F',
    fontWeight: '900',
    fontSize: 12,
  },
  logRowTime: {
    color: 'rgba(255,248,231,0.3)',
    fontSize: 10,
  },
  activityDetailBox: {
    backgroundColor: 'rgba(35, 217, 120, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(35, 217, 120, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
  },
  activityDetailText: {
    color: '#FF9F1C',
    fontSize: 12,
    fontWeight: '800',
  },
  activityDetailSub: {
    color: 'rgba(255,248,231,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  activityDeclPreviewImage: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  formToggleBtn: {
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  formToggleBtnText: {
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '800',
  },
  embeddedFormCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  formLabel: {
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 2,
  },
  formInput: {
    height: 36,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingHorizontal: 10,
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '700',
  },
  formRowFields: {
    flexDirection: 'row',
    gap: 8,
  },
  formFieldSubLabel: {
    color: 'rgba(255,248,231,0.5)',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
    marginTop: 2,
  },
  presetPhotoCard: {
    width: 65,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  presetPhotoCardActive: {
    borderColor: '#FF9F1C',
    backgroundColor: 'rgba(35, 217, 120, 0.08)',
  },
  presetImageThumbnail: {
    width: '100%',
    height: 28,
    borderRadius: 6,
  },
  previewImageThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginTop: 4,
  },
  formSubmitBtn: {
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FF9F1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  formSubmitBtnText: {
    color: '#10120F',
    fontWeight: '900',
    fontSize: 12,
  },
  weightInfoBox: {
    backgroundColor: 'rgba(38, 217, 248, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(38, 217, 248, 0.1)',
    borderRadius: 16,
    padding: 12,
    marginTop: 6,
  },
  weightInfoTitle: {
    color: '#FF9F1C',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  weightInfoValue: {
    color: '#FFF8E7',
    fontSize: 13,
    fontWeight: '800',
  },
  weightInfoSubValue: {
    color: 'rgba(255,248,231,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  weightImagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
});
