import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput, View, Image, ActivityIndicator, Platform, Alert, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalDb, UserProfile, WaterLog, WeightLog, MealPlanDay } from '@/hooks/use-local-db';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getLocalDateString } from '@/utils/date';
import { LinearGradient } from 'expo-linear-gradient';

export default function DeclareScreen() {
  const { 
    userProfile, 
    waterLogs, 
    addWaterLog, 
    deleteWaterLog,
    dailyDeclarations,
    saveDailyDeclaration,
    activeMealPlan,
    generateMealPlan,
    addShoppingItem,
    weightLogs,
    addWeightLog
  } = useLocalDb();

  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab: string }>();

  // Tab State: 'activity' | 'water' | 'meal' | 'weight'
  const [activeTab, setActiveTab] = useState<'activity' | 'water' | 'meal' | 'weight'>('activity');

  useEffect(() => {
    if (tab === 'activity' || tab === 'water' || tab === 'meal' || tab === 'weight') {
      setActiveTab(tab);
    }
  }, [tab]);

  const todayStr = getLocalDateString();

  // ==================== TAB 1: ACTIVITY LOG STATE ====================
  const [selectedDeclDate, setSelectedDeclDate] = useState(todayStr);
  const [declActivity, setDeclActivity] = useState('');
  const [declSteps, setDeclSteps] = useState('');
  const [declCalories, setDeclCalories] = useState('');
  const [declTime, setDeclTime] = useState('');
  const [declImage, setDeclImage] = useState('');
  const [isCustomImage, setIsCustomImage] = useState(false);

  const presetImages = [
    { id: 'gym', label: 'Tập Gym 🏋️‍♂️', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80' },
    { id: 'run', label: 'Chạy bộ 🏃‍♂️', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80' },
    { id: 'yoga', label: 'Yoga 🧘‍♂️', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80' },
    { id: 'diet', label: 'Ăn kiêng 🥗', url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80' },
    { id: 'walk', label: 'Đi bộ 👟', url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80' }
  ];

  useEffect(() => {
    const existing = dailyDeclarations[selectedDeclDate];
    if (existing) {
      setDeclActivity(existing.activity || '');
      setDeclSteps(existing.steps ? String(existing.steps) : '');
      setDeclCalories(existing.activeCalories ? String(existing.activeCalories) : '');
      setDeclTime(existing.activeTime ? String(existing.activeTime) : '');
      setDeclImage(existing.image || '');
      setIsCustomImage(existing.image && !presetImages.some(img => img.url === existing.image) ? true : false);
    } else {
      setDeclActivity('');
      setDeclSteps('');
      setDeclCalories('');
      setDeclTime('');
      setDeclImage('');
      setIsCustomImage(false);
    }
  }, [selectedDeclDate, dailyDeclarations]);

  const handleSaveDeclaration = () => {
    if (!declActivity.trim() && !declImage) {
      Alert.alert('Thông báo', 'Vui lòng nhập hoạt động hoặc chọn một bức ảnh để lưu nhật ký.');
      return;
    }
    saveDailyDeclaration(selectedDeclDate, {
      activity: declActivity,
      image: declImage,
      steps: parseInt(declSteps) || 0,
      activeCalories: parseInt(declCalories) || 0,
      activeTime: parseInt(declTime) || 0,
    });
    const dateLabel = selectedDeclDate === todayStr ? 'hôm nay' : selectedDeclDate.split('-').reverse().join('/');
    Alert.alert('Thành công', `Đã lưu nhật ký hoạt động cho ${dateLabel}! +15 XP 🌟`);
  };

  // ==================== TAB 2: WATER LOG STATE ====================
  const [customWater, setCustomWater] = useState('');
  const handleQuickWater = async (ml: number) => {
    await addWaterLog(ml, todayStr);
    Alert.alert('Ghi nhận', `Đã ghi nhận uống ${ml}ml nước! 💧`);
  };
  const handleCustomWaterSubmit = async () => {
    const ml = parseInt(customWater);
    if (!ml || ml <= 0) {
      Alert.alert('Thông báo', 'Vui lòng nhập số lượng nước hợp lệ.');
      return;
    }
    await addWaterLog(ml, todayStr);
    setCustomWater('');
    Alert.alert('Ghi nhận', `Đã ghi nhận uống ${ml}ml nước! 💧`);
  };

  const totalWater = waterLogs.reduce((sum, item) => sum + item.amountMl, 0);
  const wGoal = userProfile?.targetWaterMl ?? 2000;

  // ==================== TAB 3: MEAL PLAN STATE ====================
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [selectedDayNum, setSelectedDayNum] = useState(1);
  const diets = [
    { id: 'eat_clean', name: 'Eat Clean 🥗', desc: 'Thực phẩm nguyên bản, thanh lọc vóc dáng' },
    { id: 'keto', name: 'Keto Diet 🔥', desc: 'Cơ chế đốt mỡ tự nhiên (High Fat, Low Carb)' },
    { id: 'low_carb', name: 'Low Carb 🥩', desc: 'Hạn chế tinh bột, tối ưu đạm nạc' },
    { id: 'high_protein', name: 'Tăng cơ (High Protein) 🍗', desc: 'Xây dựng cơ bắp săn chắc vượt trội' },
    { id: 'weight_loss', name: 'Giảm cân (Deficit) 📉', desc: 'Thâm hụt calo khoa học, lành mạnh' },
    { id: 'weight_gain', name: 'Tăng cân (Surplus) 📈', desc: 'Thặng dư năng lượng tích cực' }
  ];

  const handleGenerateMealPlan = async (dietType: string) => {
    setIsGeneratingPlan(true);
    try {
      await generateMealPlan(dietType);
      setSelectedDayNum(1);
      Alert.alert('Thành công', 'Đã tạo thực đơn gợi ý bằng AI thành công! 📅');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleExportShopping = (day: MealPlanDay) => {
    if (!day || !day.items) return;
    for (const item of day.items) {
      addShoppingItem(item.foodName, `${item.servingSizeG}g`);
    }
    Alert.alert('Thành công', 'Đã xuất toàn bộ nguyên liệu ngày này sang Danh sách mua sắm! 🛒');
  };
  const activeDay = activeMealPlan?.days.find(d => d.dayNumber === selectedDayNum);

  // ==================== TAB 4: WEIGHT TRACKER STATE ====================
  const [weightKg, setWeightKg] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [chestCm, setChestCm] = useState('');
  const [hipsCm, setHipsCm] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isAddingLog, setIsAddingLog] = useState(false);

  const [beforeLogId, setBeforeLogId] = useState<string>('');
  const [afterLogId, setAfterLogId] = useState<string>('');

  const handleSubmitWeightLog = async () => {
    const wt = parseFloat(weightKg);
    if (!wt) {
      Alert.alert('Thông báo', 'Vui lòng nhập cân nặng hợp lệ.');
      return;
    }
    await addWeightLog(
      wt,
      waistCm ? parseFloat(waistCm) : undefined,
      chestCm ? parseFloat(chestCm) : undefined,
      hipsCm ? parseFloat(hipsCm) : undefined,
      bodyFatPct ? parseFloat(bodyFatPct) : undefined,
      photoUrl || undefined
    );
    setWeightKg('');
    setWaistCm('');
    setChestCm('');
    setHipsCm('');
    setBodyFatPct('');
    setPhotoUrl('');
    setIsAddingLog(false);
    Alert.alert('Thành công', 'Đã lưu số đo cân nặng cơ thể thành công! 📊');
  };

  const beforePhoto = weightLogs.find(l => l.id === beforeLogId)?.photoUrl;
  const afterPhoto = weightLogs.find(l => l.id === afterLogId)?.photoUrl;
  const logsWithPhotos = weightLogs.filter(l => l.photoUrl);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0F0D0B', '#171411', '#0A0907']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>✕ Quay lại Dashboard</Text>
        </Pressable>
        <Text style={styles.title}>Khai Báo & Theo Dõi Sức Khỏe</Text>
      </View>

      {/* Tabs Switcher */}
      <View style={styles.tabsRow}>
        {([
          { key: 'activity', label: '🏃‍♂️ Hoạt động' },
          { key: 'water', label: '💧 Nước uống' },
          { key: 'meal', label: '📅 Thực đơn' },
          { key: 'weight', label: '⚖️ Cân nặng' }
        ] as const).map(tabItem => {
          const isActive = activeTab === tabItem.key;
          return (
            <Pressable 
              key={tabItem.key}
              onPress={() => setActiveTab(tabItem.key)}
              style={[
                styles.tabButton, 
                isActive 
                  ? { backgroundColor: '#FF9F1C', borderWidth: 1, borderColor: '#FF9F1C' } 
                  : { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }
              ]}
            >
              <Text style={{ color: isActive ? '#100E0C' : 'rgba(255, 248, 231, 0.75)', fontWeight: isActive ? '900' : '700', fontSize: 12 }}>
                {tabItem.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* ==================== CONTENT 1: ACTIVITY LOG ==================== */}
        {activeTab === 'activity' && (
          <View style={styles.tabContentContainer}>
            {/* Wearable display summary */}
            <View style={styles.card}>
              <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14, marginBottom: Spacing.one }}>
                {selectedDeclDate === todayStr ? 'Số liệu vận động hôm nay ⌚' : `Số liệu vận động ngày ${selectedDeclDate.split('-').reverse().join('/')} ⌚`}
              </Text>
              <View style={styles.wearableGrid}>
                <View style={styles.wearableCol}>
                  <Text style={{ fontSize: 20 }}>🏃‍♂️</Text>
                  <Text style={{ marginTop: 2, fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>{dailyDeclarations[selectedDeclDate]?.steps ?? 0} / 10K</Text>
                  <Text style={{ fontSize: 9, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>bước chân</Text>
                </View>
                <View style={styles.wearableCol}>
                  <Text style={{ fontSize: 20 }}>🔥</Text>
                  <Text style={{ marginTop: 2, fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>{dailyDeclarations[selectedDeclDate]?.activeCalories ?? 0} / 500</Text>
                  <Text style={{ fontSize: 9, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>kcal tiêu hao</Text>
                </View>
                <View style={styles.wearableCol}>
                  <Text style={{ fontSize: 20 }}>⏱️</Text>
                  <Text style={{ marginTop: 2, fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>{dailyDeclarations[selectedDeclDate]?.activeTime ?? 0} / 60</Text>
                  <Text style={{ fontSize: 9, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>phút vận động</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              {selectedDeclDate !== todayStr && (
                <View style={styles.editingInfoBar}>
                  <Text style={{ color: '#166534', fontSize: 13, fontWeight: '800' }}>
                    📅 Đang xem/sửa ngày: {selectedDeclDate.split('-').reverse().join('/')}
                  </Text>
                  <Pressable 
                    onPress={() => setSelectedDeclDate(todayStr)} 
                    style={styles.backToTodayBtn}
                  >
                    <Text style={{ color: '#166534', fontSize: 12, fontWeight: '800' }}>Quay lại hôm nay ↩</Text>
                  </Pressable>
                </View>
              )}

              <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14, marginBottom: Spacing.one }}>Khai báo hoạt động thể chất 📝</Text>
              
              <TextInput
                placeholder="Hôm nay bạn đã làm những gì? (Ví dụ: Chạy bộ 5km, đẩy ngực...)"
                value={declActivity}
                onChangeText={setDeclActivity}
                placeholderTextColor="#94A3B8"
                style={[styles.input, { color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
              />

              <View style={styles.formGrid}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Số bước chân</Text>
                  <TextInput
                    placeholder="Ví dụ: 10000"
                    keyboardType="numeric"
                    value={declSteps}
                    onChangeText={setDeclSteps}
                    placeholderTextColor="#94A3B8"
                    style={[styles.input, { color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Calo tiêu hao</Text>
                  <TextInput
                    placeholder="Ví dụ: 500"
                    keyboardType="numeric"
                    value={declCalories}
                    onChangeText={setDeclCalories}
                    placeholderTextColor="#94A3B8"
                    style={[styles.input, { color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Thời gian (phút)</Text>
                  <TextInput
                    placeholder="Ví dụ: 60"
                    keyboardType="numeric"
                    value={declTime}
                    onChangeText={setDeclTime}
                    placeholderTextColor="#94A3B8"
                    style={[styles.input, { color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Hình ảnh tập luyện / Kỷ niệm</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                <Pressable
                  onPress={() => {
                    setIsCustomImage(false);
                    setDeclImage('');
                  }}
                  style={[
                    styles.presetPhotoCard,
                    { backgroundColor: '#1E1A17', borderColor: 'rgba(255, 159, 28, 0.25)' },
                    !declImage && !isCustomImage && { borderColor: '#FF9F1C', backgroundColor: '#DCFCE7' }
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>❌</Text>
                  <Text style={{ fontSize: 10, marginTop: 4, color: 'rgba(255, 248, 231, 0.5)', fontWeight: '700' }}>Không ảnh</Text>
                </Pressable>
                
                {presetImages.map(img => (
                  <Pressable
                    key={img.id}
                    onPress={() => {
                      setIsCustomImage(false);
                      setDeclImage(img.url);
                    }}
                    style={[
                      styles.presetPhotoCard,
                      { backgroundColor: '#1E1A17', borderColor: 'rgba(255, 159, 28, 0.25)' },
                      declImage === img.url && { borderColor: '#FF9F1C', backgroundColor: '#DCFCE7' }
                    ]}
                  >
                    <Image source={{ uri: img.url }} style={styles.presetImageThumbnail} />
                    <Text style={{ fontSize: 10, marginTop: 4, fontWeight: '800', color: '#FFFFFF' }}>{img.label}</Text>
                  </Pressable>
                ))}

                <Pressable
                  onPress={() => {
                    setIsCustomImage(true);
                    setDeclImage('');
                  }}
                  style={[
                    styles.presetPhotoCard,
                    { backgroundColor: '#1E1A17', borderColor: 'rgba(255, 159, 28, 0.25)' },
                    isCustomImage && { borderColor: '#FF9F1C', backgroundColor: '#DCFCE7' }
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>🔗</Text>
                  <Text style={{ fontSize: 10, marginTop: 4, color: 'rgba(255, 248, 231, 0.5)', fontWeight: '700' }}>Nhập URL</Text>
                </Pressable>
              </ScrollView>

              {isCustomImage && (
                <TextInput
                  placeholder="Nhập liên kết ảnh (http://...)"
                  value={declImage}
                  onChangeText={setDeclImage}
                  placeholderTextColor="#94A3B8"
                  style={[styles.input, { color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)', fontSize: 12 }]}
                />
              )}

              {declImage ? (
                <View style={styles.previewImageContainer}>
                  <Text style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255, 248, 231, 0.5)' }}>Xem trước ảnh:</Text>
                  <Image source={{ uri: declImage }} style={styles.previewImage} resizeMode="cover" />
                </View>
              ) : null}

              <Pressable onPress={handleSaveDeclaration} style={[styles.primaryBtn, { backgroundColor: '#FF9F1C', marginTop: Spacing.one }]}>
                <Text style={styles.btnText}>
                  {selectedDeclDate === todayStr ? 'Lưu Nhật Ký Hoạt Động' : 'Cập Nhật Nhật Ký Hoạt Động'}
                </Text>
              </Pressable>
            </View>

            {/* Saved Declarations History */}
            <View style={styles.card}>
              <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14, marginBottom: Spacing.one }}>
                Lịch sử khai báo hoạt động ⏳
              </Text>

              {Object.keys(dailyDeclarations).length === 0 ? (
                <Text style={{ textAlign: 'center', marginVertical: 12, color: 'rgba(255, 248, 231, 0.5)', fontSize: 13 }}>
                  Chưa có lịch sử hoạt động nào được lưu.
                </Text>
              ) : (
                Object.entries(dailyDeclarations)
                  .sort((a, b) => b[0].localeCompare(a[0])) // Sort newest date first
                  .map(([date, decl]) => {
                    const isSelected = date === selectedDeclDate;
                    const dateDisplay = date === todayStr ? 'Hôm nay' : date.split('-').reverse().join('/');
                    
                    return (
                      <Pressable
                        key={date}
                        onPress={() => setSelectedDeclDate(date)}
                        style={[
                          styles.historyItemRow,
                          { borderColor: '#F1F5F9', backgroundColor: '#1E1A17' },
                          isSelected && { backgroundColor: '#F1F5F9', borderRadius: 8 }
                        ]}
                      >
                        <View style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6 }}>
                          <View style={styles.historyHeader}>
                            <Text style={[{ fontSize: 13, fontWeight: '800' }, isSelected ? { color: '#FF9F1C' } : { color: '#FFFFFF' }]}>
                              {dateDisplay}
                            </Text>
                            {isSelected && (
                              <View style={[styles.activeIndicator, { backgroundColor: '#FF9F1C' }]}>
                                <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '800' }}>Đang xem</Text>
                              </View>
                            )}
                          </View>
                          
                          <Text style={{ marginTop: 2, fontSize: 13, color: 'rgba(255, 248, 231, 0.5)' }} numberOfLines={1}>
                            🏃‍♂️ {decl.activity || 'Không có mô tả chi tiết'}
                          </Text>
                          
                          <Text style={{ fontSize: 10, marginTop: 4, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                            {decl.steps} bước • {decl.activeCalories} kcal • {decl.activeTime} phút
                          </Text>
                        </View>
                        
                        {decl.image ? (
                          <Image source={{ uri: decl.image }} style={styles.historyThumb} />
                        ) : null}
                      </Pressable>
                    );
                  })
              )}
            </View>
          </View>
        )}

        {/* ==================== CONTENT 2: WATER TRACKING ==================== */}
        {activeTab === 'water' && (
          <View style={styles.tabContentContainer}>
            {/* Water Stats Card */}
            <View style={styles.card}>
              <View style={styles.waterTitleRow}>
                <Text style={{ color: '#0284C7', fontSize: 16, fontWeight: '800' }}>Lượng nước hôm nay 💧</Text>
                <Text style={{ color: '#0284C7', fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{totalWater} / {wGoal} ml</Text>
              </View>
              <View style={[styles.progressBarBg, { height: 8, marginVertical: Spacing.one, backgroundColor: '#F1F5F9' }]}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, (totalWater / wGoal) * 100)}%`, backgroundColor: '#0284C7' }]} />
              </View>
              <Text style={{ fontSize: 13, color: 'rgba(255, 248, 231, 0.5)' }}>
                Hãy duy trì uống nước đều đặn để tăng trao đổi chất và thanh lọc cơ thể.
              </Text>
            </View>

            {/* Log inputs */}
            <View style={styles.card}>
              <Text style={{ color: '#0284C7', fontWeight: '800', fontSize: 14 }}>Bổ sung nước nhanh</Text>
              <View style={styles.row}>
                <Pressable onPress={() => handleQuickWater(250)} style={[styles.quickWaterBtn, { borderColor: '#0284C7', flex: 1, marginRight: 8 }]}>
                  <Text style={{ color: '#0284C7', fontWeight: '800', fontSize: 13 }}>+ 250ml 🥛</Text>
                </Pressable>
                <Pressable onPress={() => handleQuickWater(500)} style={[styles.quickWaterBtn, { borderColor: '#0284C7', flex: 1, marginRight: 8 }]}>
                  <Text style={{ color: '#0284C7', fontWeight: '800', fontSize: 13 }}>+ 500ml 🥤</Text>
                </Pressable>
                <Pressable onPress={() => handleQuickWater(1000)} style={[styles.quickWaterBtn, { borderColor: '#0284C7', flex: 1 }]}>
                  <Text style={{ color: '#0284C7', fontWeight: '800', fontSize: 13 }}>+ 1000ml 💧</Text>
                </Pressable>
              </View>

              <Text style={{ color: '#0284C7', fontWeight: '800', fontSize: 14, marginTop: Spacing.one }}>Nhập lượng nước tùy chọn</Text>
              <View style={styles.rowCentered}>
                <TextInput
                  placeholder="Nhập ml (VD: 350)"
                  keyboardType="numeric"
                  value={customWater}
                  onChangeText={setCustomWater}
                  placeholderTextColor="#94A3B8"
                  style={[styles.input, { flex: 1, color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 0, marginRight: 10 }]}
                />
                <Pressable onPress={handleCustomWaterSubmit} style={[styles.primaryBtn, { backgroundColor: '#0284C7', paddingHorizontal: 20 }]}>
                  <Text style={styles.btnText}>Thêm</Text>
                </Pressable>
              </View>
            </View>

            {/* Water History */}
            <View style={styles.card}>
              <Text style={{ color: '#0284C7', fontWeight: '800', fontSize: 14 }}>Lịch sử uống nước hôm nay</Text>
              {waterLogs.length === 0 ? (
                <Text style={{ textAlign: 'center', marginVertical: 12, color: 'rgba(255, 248, 231, 0.5)', fontSize: 13 }}>
                  Hôm nay bạn chưa uống nước. Hãy bổ sung ngay!
                </Text>
              ) : (
                waterLogs.map(log => (
                  <View key={log.id} style={styles.waterRow}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>🥛 Đã uống {log.amountMl} ml</Text>
                    <View style={styles.rowCentered}>
                      <Text style={{ opacity: 0.6, marginRight: Spacing.two, fontSize: 11, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{log.loggedAt}</Text>
                      <Pressable onPress={() => deleteWaterLog(log.id)} style={styles.deleteBtn}>
                        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>Xóa</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ==================== CONTENT 3: MEAL PLAN ==================== */}
        {activeTab === 'meal' && (
          <View style={styles.tabContentContainer}>
            {/* Selection */}
            <View style={styles.card}>
              <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>Lên thực đơn ăn kiêng thông minh bằng AI 📅</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255, 248, 231, 0.5)' }}>
                Chọn chế độ ăn dinh dưỡng. AI Coach sẽ tự động thiết lập và chia nhỏ calo nạp ({userProfile?.targetCalories} kcal) hàng ngày.
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dietScroll}>
                {diets.map(diet => {
                  const isActivePlan = activeMealPlan?.dietType === diet.id.toUpperCase();
                  return (
                    <Pressable
                      key={diet.id}
                      onPress={() => handleGenerateMealPlan(diet.id)}
                      style={[
                        styles.dietCard,
                        { backgroundColor: '#1E1A17', borderColor: 'rgba(255, 159, 28, 0.25)' },
                        isActivePlan && { borderColor: '#F59E0B', borderWidth: 2 }
                      ]}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>{diet.name}</Text>
                      <Text style={[styles.dietDesc, { color: 'rgba(255, 248, 231, 0.5)' }]}>
                        {diet.desc}
                      </Text>
                      <Text style={{ color: '#F59E0B', fontSize: 9, marginTop: 4, fontWeight: '800' }}>
                        {isActivePlan ? 'ĐANG DÙNG ✨' : 'Click tạo mới'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {isGeneratingPlan && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF9F1C" />
                <Text style={{ marginTop: 8, fontSize: 12, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>AI Coach đang phân bổ calo nạp và chia thực đơn...</Text>
              </View>
            )}

            {activeMealPlan && !isGeneratingPlan && (
              <>
                {/* Days list */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>{activeMealPlan.title}</Text>
                    <Text style={{ fontSize: 11, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>Loại: {activeMealPlan.dietType}</Text>
                  </View>
                  <View style={styles.daysRow}>
                    {activeMealPlan.days.map(day => {
                      const isSelected = selectedDayNum === day.dayNumber;
                      return (
                        <Pressable
                          key={day.dayNumber}
                          onPress={() => setSelectedDayNum(day.dayNumber)}
                          style={[
                            styles.dayCircle,
                            { backgroundColor: '#1E1A17', borderColor: 'rgba(255, 159, 28, 0.25)' },
                            isSelected && { borderColor: '#FF9F1C', borderWidth: 2, backgroundColor: '#F1F5F9' }
                          ]}
                        >
                          <Text style={[{ fontSize: 13, fontWeight: '800' }, isSelected ? { color: '#FF9F1C' } : { color: 'rgba(255, 248, 231, 0.5)' }]}>
                            N{day.dayNumber}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Day Details */}
                {activeDay && (
                  <View style={styles.card}>
                    <View style={styles.menuHeader}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>Thực đơn Ngày {activeDay.dayNumber}</Text>
                        <Text style={{ fontSize: 11, marginTop: 2, color: '#FF9F1C', fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                          Mục tiêu: {activeDay.calories} kcal | Đạm: {activeDay.protein}g Carbs: {activeDay.carbs}g Béo: {activeDay.fat}g
                        </Text>
                      </View>
                      <Pressable 
                        onPress={() => handleExportShopping(activeDay)} 
                        style={[styles.shoppingBtn, { backgroundColor: '#FF9F1C' }]}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>🛒 Xuất mua sắm</Text>
                      </Pressable>
                    </View>
                    <View style={styles.divider} />
                    {activeDay.items.map(item => (
                      <View key={item.id} style={styles.mealItemRow}>
                        <View style={styles.mealTypeBadge}>
                          <Text style={{ textTransform: 'uppercase', fontSize: 9, fontWeight: '800', color: '#FF9F1C' }}>
                            {item.mealType === 'breakfast' ? 'Sáng 🌅' : item.mealType === 'lunch' ? 'Trưa ☀️' : item.mealType === 'dinner' ? 'Tối 🌌' : 'Phụ 🍎'}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: Spacing.two }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>{item.foodName}</Text>
                          <Text style={{ opacity: 0.6, fontSize: 10, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                            {item.servingSizeG}g • P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{item.calories} kcal</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ==================== CONTENT 4: WEIGHT TRACKER ==================== */}
        {activeTab === 'weight' && (
          <View style={styles.tabContentContainer}>
            {/* Weight Chart */}
            <View style={styles.card}>
              <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>Tiến trình cân nặng 📊</Text>
              {weightLogs.length === 0 ? (
                <Text style={{ textAlign: 'center', marginVertical: 20, color: 'rgba(255, 248, 231, 0.5)', fontSize: 13 }}>
                  Chưa có dữ liệu để vẽ biểu đồ tiến trình.
                </Text>
              ) : (
                <View style={styles.chartContainer}>
                  <View style={[styles.chartBarRow, { borderColor: 'rgba(255, 159, 28, 0.25)' }]}>
                    {weightLogs.slice(0, 7).reverse().map((log) => {
                      const weights = weightLogs.map(l => l.weightKg);
                      const minWt = Math.min(...weights) - 2;
                      const maxWt = Math.max(...weights) + 2;
                      const range = maxWt - minWt || 1;
                      const barHeightPct = ((log.weightKg - minWt) / range) * 100;
                      
                      return (
                        <View key={log.id} style={styles.chartCol}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{log.weightKg}k</Text>
                          <View style={[styles.chartBar, { height: `${Math.max(20, Math.min(100, barHeightPct))}%`, backgroundColor: '#FF9F1C' }]} />
                          <Text style={{ fontSize: 8, marginTop: 4, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                            {log.loggedDate.split('-').slice(1).reverse().join('/')}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Input logs */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>Ghi nhận chỉ số mới</Text>
                {!isAddingLog ? (
                  <Pressable onPress={() => setIsAddingLog(true)} style={[styles.primaryBtn, { backgroundColor: '#FF9F1C', paddingVertical: 6, paddingHorizontal: 12 }]}>
                    <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>+ Nhập số đo</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setIsAddingLog(false)}>
                    <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '800' }}>Hủy</Text>
                  </Pressable>
                )}
              </View>

              {isAddingLog && (
                <View style={{ gap: Spacing.two, marginTop: Spacing.one }}>
                  <View style={styles.formGrid}>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>Cân nặng (kg) *</Text>
                      <TextInput
                        placeholder="VD: 70.5"
                        keyboardType="numeric"
                        value={weightKg}
                        onChangeText={setWeightKg}
                        placeholderTextColor="#94A3B8"
                        style={[styles.input, { color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>Tỉ lệ mỡ % (Body Fat)</Text>
                      <TextInput
                        placeholder="VD: 18.5"
                        keyboardType="numeric"
                        value={bodyFatPct}
                        onChangeText={setBodyFatPct}
                        placeholderTextColor="#94A3B8"
                        style={[styles.input, { color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                      />
                    </View>
                  </View>

                  <View style={styles.formGrid}>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>Vòng ngực (cm)</Text>
                      <TextInput
                        placeholder="VD: 98"
                        keyboardType="numeric"
                        value={chestCm}
                        onChangeText={setChestCm}
                        placeholderTextColor="#94A3B8"
                        style={[styles.input, { color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>Vòng eo (cm)</Text>
                      <TextInput
                        placeholder="VD: 82"
                        keyboardType="numeric"
                        value={waistCm}
                        onChangeText={setWaistCm}
                        placeholderTextColor="#94A3B8"
                        style={[styles.input, { color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>Vòng mông (cm)</Text>
                      <TextInput
                        placeholder="VD: 95"
                        keyboardType="numeric"
                        value={hipsCm}
                        onChangeText={setHipsCm}
                        placeholderTextColor="#94A3B8"
                        style={[styles.input, { color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                      />
                    </View>
                  </View>

                  <Text style={styles.formLabel}>Ảnh chụp cơ thể (Dán URL ảnh minh họa)</Text>
                  <TextInput
                    placeholder="http://..."
                    value={photoUrl}
                    onChangeText={setPhotoUrl}
                    placeholderTextColor="#94A3B8"
                    style={[styles.input, { color: '#FFFFFF', borderColor: 'rgba(255, 159, 28, 0.25)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                  />

                  <Pressable onPress={handleSubmitWeightLog} style={[styles.primaryBtn, { backgroundColor: '#FF9F1C' }]}>
                    <Text style={styles.btnText}>Lưu số đo</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Before / After Photo Comparison */}
            <View style={styles.card}>
              <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>So sánh Before / After 📸</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255, 248, 231, 0.5)' }}>
                Chọn hai mốc lịch sử để so sánh vóc dáng cơ thể.
              </Text>

              {logsWithPhotos.length < 1 ? (
                <Text style={{ textAlign: 'center', marginVertical: 12, color: 'rgba(255, 248, 231, 0.5)', fontSize: 13 }}>
                  Vui lòng thêm cân nặng kèm link ảnh cơ thể để sử dụng.
                </Text>
              ) : (
                <View style={{ gap: Spacing.two }}>
                  <View style={styles.photoPickerRow}>
                    <View style={{ flex: 1, marginRight: Spacing.one }}>
                      <Text style={{ fontSize: 10, marginBottom: 4, color: 'rgba(255, 248, 231, 0.5)', fontWeight: '700' }}>Trước (Before):</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {logsWithPhotos.map(l => (
                          <Pressable 
                            key={l.id} 
                            onPress={() => setBeforeLogId(l.id)}
                            style={[styles.miniPhotoSelectTab, { backgroundColor: '#1E1A17', borderColor: 'rgba(255, 159, 28, 0.25)' }, beforeLogId === l.id && { borderColor: '#FF9F1C' }]}
                          >
                            <Text style={{ fontSize: 9, color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{l.loggedDate.split('-').reverse().slice(0,2).join('/')}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, marginBottom: 4, color: 'rgba(255, 248, 231, 0.5)', fontWeight: '700' }}>Sau (After):</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {logsWithPhotos.map(l => (
                          <Pressable 
                            key={l.id} 
                            onPress={() => setAfterLogId(l.id)}
                            style={[styles.miniPhotoSelectTab, { backgroundColor: '#1E1A17', borderColor: 'rgba(255, 159, 28, 0.25)' }, afterLogId === l.id && { borderColor: '#30A0E0' }]}
                          >
                            <Text style={{ fontSize: 9, color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{l.loggedDate.split('-').reverse().slice(0,2).join('/')}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.beforeAfterFrame}>
                    <View style={styles.imageHalf}>
                      <Text style={styles.photoLabel}>BEFORE</Text>
                      {beforePhoto ? (
                        <Image source={{ uri: beforePhoto }} style={styles.comparisonImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.emptyPhotoBox}><Text style={{ fontSize: 24 }}>📷</Text></View>
                      )}
                    </View>
                    <View style={styles.imageHalf}>
                      <Text style={[styles.photoLabel, { color: '#30A0E0' }]}>AFTER</Text>
                      {afterPhoto ? (
                        <Image source={{ uri: afterPhoto }} style={styles.comparisonImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.emptyPhotoBox}><Text style={{ fontSize: 24 }}>📷</Text></View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Timelines */}
            <View style={styles.card}>
              <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>Lịch sử số đo cơ thể</Text>
              {weightLogs.length === 0 ? (
                <Text style={{ textAlign: 'center', marginVertical: 12, color: 'rgba(255, 248, 231, 0.5)', fontSize: 13 }}>
                  Chưa có lịch sử đo nào được lưu.
                </Text>
              ) : (
                weightLogs.map(log => (
                  <View key={log.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>{log.weightKg} kg</Text>
                      <Text style={{ fontSize: 10, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{log.loggedDate}</Text>
                    </View>
                    <View style={styles.timelineRight}>
                      {log.bodyFatPct && <Text style={{ fontSize: 11, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>• Mỡ: {log.bodyFatPct}%</Text>}
                      {log.waistCm && <Text style={{ fontSize: 11, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>• Eo: {log.waistCm}cm</Text>}
                      {log.chestCm && <Text style={{ fontSize: 11, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>• Ngực: {log.chestCm}cm</Text>}
                      {log.hipsCm && <Text style={{ fontSize: 11, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>• Mông: {log.hipsCm}cm</Text>}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  backBtn: {
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 6,
    justifyContent: 'center',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.three,
  },
  tabContentContainer: {
    gap: Spacing.three,
    width: '100%',
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#1E1A17',
    padding: Spacing.three,
    gap: Spacing.two,
    // Soft shadow
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  wearableGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  wearableCol: {
    alignItems: 'center',
    flex: 1,
  },
  formGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  formCol: {
    flex: 1,
  },
  formLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  presetPhotoCard: {
    width: 80,
    height: 70,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    overflow: 'hidden',
  },
  presetImageThumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.6,
  },
  previewImageContainer: {
    marginTop: Spacing.one,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  primaryBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  waterTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  quickWaterBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  dietScroll: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  dietCard: {
    width: 180,
    borderRadius: 10,
    borderWidth: 1,
    padding: Spacing.three,
    marginRight: Spacing.two,
    gap: 4,
  },
  dietDesc: {
    fontSize: 9,
    lineHeight: 13,
  },
  loadingContainer: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shoppingBtn: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: Spacing.two,
  },
  mealItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mealTypeBadge: {
    width: 60,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(34,197,94,0.1)',
    alignItems: 'center',
  },
  chartContainer: {
    height: 120,
    marginTop: Spacing.one,
  },
  chartBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 20,
    borderRadius: 4,
    marginVertical: 4,
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  miniPhotoSelectTab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    marginRight: 4,
  },
  beforeAfterFrame: {
    flexDirection: 'row',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  imageHalf: {
    flex: 1,
    position: 'relative',
  },
  photoLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#FF9F1C',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '700',
  },
  comparisonImage: {
    width: '100%',
    height: '100%',
  },
  emptyPhotoBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timelineLeft: {
    gap: 4,
  },
  timelineRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: Spacing.one,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  activeIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: Spacing.two,
  },
  editingInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    marginBottom: Spacing.two,
  },
  backToTodayBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E1A17',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
});
