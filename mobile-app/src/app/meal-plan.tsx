import React, { useState } from 'react';
import { StyleSheet, ScrollView, Pressable, View, ActivityIndicator, Text, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalDb, MealPlanDay, MealPlanItem } from '@/hooks/use-local-db';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const SWAP_OPTIONS: Record<string, Array<{ foodName: string; servingSizeG: number; caloriesRatio: number; pPct: number; cPct: number; fPct: number }>> = {
  breakfast: [
    { foodName: 'Cháo yến mạch chuối & hạt chia', servingSizeG: 200, caloriesRatio: 1, pPct: 0.25, cPct: 0.55, fPct: 0.2 },
    { foodName: 'Bánh mì ngũ cốc kẹp trứng ốp & bơ', servingSizeG: 180, caloriesRatio: 1, pPct: 0.3, cPct: 0.45, fPct: 0.25 },
    { foodName: 'Sữa chua Hy Lạp hạt granola & dâu', servingSizeG: 220, caloriesRatio: 1, pPct: 0.35, cPct: 0.45, fPct: 0.2 },
    { foodName: 'Sinh tố đạm mâm xôi & chuối', servingSizeG: 300, caloriesRatio: 1, pPct: 0.45, cPct: 0.45, fPct: 0.1 }
  ],
  lunch: [
    { foodName: 'Ức gà áp chảo sốt chanh leo & cơm lứt', servingSizeG: 300, caloriesRatio: 1, pPct: 0.45, cPct: 0.35, fPct: 0.2 },
    { foodName: 'Thịt bò xào ớt chuông & khoai lang', servingSizeG: 320, caloriesRatio: 1, pPct: 0.4, cPct: 0.4, fPct: 0.2 },
    { foodName: 'Cá hồi nướng măng tây & cơm lứt', servingSizeG: 280, caloriesRatio: 1, pPct: 0.35, cPct: 0.3, fPct: 0.35 },
    { foodName: 'Đậu hũ kho nấm & canh cải bó xôi', servingSizeG: 350, caloriesRatio: 1, pPct: 0.3, cPct: 0.5, fPct: 0.2 }
  ],
  dinner: [
    { foodName: 'Salad cá ngừ ngô ngọt dầu giấm', servingSizeG: 250, caloriesRatio: 1, pPct: 0.4, cPct: 0.2, fPct: 0.4 },
    { foodName: 'Tôm hấp sả kèm bí ngòi xào tỏi', servingSizeG: 260, caloriesRatio: 1, pPct: 0.5, cPct: 0.2, fPct: 0.3 },
    { foodName: 'Thịt heo nạc rim dầu hào & canh bí đỏ', servingSizeG: 280, caloriesRatio: 1, pPct: 0.35, cPct: 0.4, fPct: 0.25 },
    { foodName: 'Súp gà ngô non nấm hương', servingSizeG: 300, caloriesRatio: 1, pPct: 0.4, cPct: 0.3, fPct: 0.3 }
  ],
  snack: [
    { foodName: 'Hạt hạnh nhân & óc chó sấy khô', servingSizeG: 40, caloriesRatio: 1, pPct: 0.15, cPct: 0.15, fPct: 0.7 },
    { foodName: 'Whey Protein pha nước & 1 quả táo', servingSizeG: 250, caloriesRatio: 1, pPct: 0.85, cPct: 0.1, fPct: 0.05 },
    { foodName: 'Táo tây đỏ ăn kèm 1 thìa bơ đậu phộng', servingSizeG: 180, caloriesRatio: 1, pPct: 0.15, cPct: 0.45, fPct: 0.4 }
  ]
};

export default function MealPlanScreen() {
  const { 
    userProfile, 
    activeMealPlan, 
    favoriteMealPlans,
    generateMealPlan, 
    swapMealItem,
    toggleFavoriteMealPlan,
    applyFavoriteMealPlan,
    readjustMealPlan,
    addShoppingItem 
  } = useLocalDb();

  const router = useRouter();

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReadjusting, setIsReadjusting] = useState(false);
  const [selectedDayNum, setSelectedDayNum] = useState(1);
  const [activeTabSection, setActiveTabSection] = useState<'current' | 'favorites'>('current');

  // Swap dish modal states
  const [swapTargetItem, setSwapTargetItem] = useState<MealPlanItem | null>(null);

  // Diet types list
  const diets = [
    { id: 'eat_clean', name: 'Eat Clean 🥗', desc: 'Thực phẩm nguyên bản, thanh lọc vóc dáng' },
    { id: 'keto', name: 'Keto Diet 🔥', desc: 'Cơ chế đốt mỡ tự nhiên (High Fat, Low Carb)' },
    { id: 'low_carb', name: 'Low Carb 🥩', desc: 'Hạn chế tinh bột, tối ưu đạm nạc' },
    { id: 'high_protein', name: 'Tăng cơ (High Protein) 🍗', desc: 'Xây dựng cơ bắp săn chắc vượt trội' },
    { id: 'weight_loss', name: 'Giảm cân (Deficit) 📉', desc: 'Thâm hụt calo khoa học, lành mạnh' },
    { id: 'weight_gain', name: 'Tăng cân (Surplus) 📈', desc: 'Thặng dư năng lượng tích cực' }
  ];

  const handleGenerate = async (dietType: string) => {
    setIsGenerating(true);
    try {
      await generateMealPlan(dietType);
      setSelectedDayNum(1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportShopping = (day: MealPlanDay) => {
    if (!day || !day.items) return;
    for (const item of day.items) {
      addShoppingItem(item.foodName, `${item.servingSizeG}g`);
    }
    alert('Đã xuất toàn bộ nguyên liệu của ngày này sang Bảng Mua Sắm! 🛒');
  };

  const handleToggleFavorite = async () => {
    if (!activeMealPlan) return;
    await toggleFavoriteMealPlan(activeMealPlan.id);
    alert(activeMealPlan.isFavorite ? 'Đã bỏ lưu khỏi danh sách Yêu thích' : '⭐ Đã lưu thực đơn này vào Kế hoạch Yêu thích!');
  };

  const handleApplyFavorite = async (planId: string) => {
    await applyFavoriteMealPlan(planId);
    setActiveTabSection('current');
    alert('✨ Đã tái sử dụng thực đơn này làm kế hoạch đang kích hoạt!');
  };

  const handleReadjust = async () => {
    setIsReadjusting(true);
    try {
      await readjustMealPlan();
      alert('🔄 Đã tự động phân bổ lại lượng Calo & Macro theo cân nặng mục tiêu mới thành công!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsReadjusting(false);
    }
  };

  const handleSelectSwapDish = async (option: typeof SWAP_OPTIONS['breakfast'][0]) => {
    if (!swapTargetItem) return;
    const itemCal = swapTargetItem.calories;
    const p = Math.round((itemCal * option.pPct) / 4);
    const c = Math.round((itemCal * option.cPct) / 4);
    const f = Math.round((itemCal * option.fPct) / 9);

    await swapMealItem(swapTargetItem.id, option.foodName, itemCal, p, c, f, option.servingSizeG);
    setSwapTargetItem(null);
    alert(`🔄 Đã đổi thành công món "${option.foodName}"!`);
  };

  const activeDay = activeMealPlan?.days.find(d => d.dayNumber === selectedDayNum);

  // Check if calorie target has changed from day target
  const needsReadjustment = activeDay && userProfile?.targetCalories && Math.abs(activeDay.calories - userProfile.targetCalories) > 50;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0F0D0B', '#171411', '#0A0907']} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>✕ Quay lại Dashboard</Text>
        </Pressable>
        <Text style={styles.title}>Lập Thực Đơn Thông Minh 📅</Text>
      </View>

      {/* Main Mode Tabs */}
      <View style={styles.mainTabsRow}>
        <Pressable 
          onPress={() => setActiveTabSection('current')}
          style={[styles.mainTabBtn, activeTabSection === 'current' && styles.mainTabBtnActive]}
        >
          <Text style={[styles.mainTabText, activeTabSection === 'current' && styles.mainTabTextActive]}>
            Thực đơn hiện tại 🍽️
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => setActiveTabSection('favorites')}
          style={[styles.mainTabBtn, activeTabSection === 'favorites' && styles.mainTabBtnActive]}
        >
          <Text style={[styles.mainTabText, activeTabSection === 'favorites' && styles.mainTabTextActive]}>
            Yêu thích ({favoriteMealPlans.length}) ⭐
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Readjustment Alert Banner (LTAPP-53) */}
        {needsReadjustment && activeTabSection === 'current' && (
          <View style={styles.alertBanner}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#F59E0B', fontSize: 13 }}>Cân nặng/Mục tiêu Calo của bạn vừa thay đổi!</Text>
              <Text style={{ color: 'rgba(255, 248, 231, 0.7)', fontSize: 11, marginTop: 2 }}>
                Mục tiêu hiện tại là {userProfile?.targetCalories} kcal, nhưng thực đơn cũ tính theo {activeDay.calories} kcal.
              </Text>
            </View>
            <Pressable onPress={handleReadjust} style={styles.readjustBtn} disabled={isReadjusting}>
              {isReadjusting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>🔄 Điều chỉnh lại</Text>}
            </Pressable>
          </View>
        )}
        
        {activeTabSection === 'current' ? (
          <>
            {/* Diet Selection Carousel */}
            <View style={styles.card}>
              <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>Bước 1: Chọn chế độ ăn dinh dưỡng của bạn</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255, 248, 231, 0.5)' }}>
                Hệ thống AI sẽ tự động phân bổ calo nạp ({userProfile?.targetCalories} kcal) khớp với mục tiêu thể chất.
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dietScroll}>
                {diets.map(diet => {
                  const isActivePlan = activeMealPlan?.dietType === diet.id.toUpperCase();
                  return (
                    <Pressable
                      key={diet.id}
                      onPress={() => handleGenerate(diet.id)}
                      style={[
                        styles.dietCard,
                        { backgroundColor: '#1E1A17', borderColor: 'rgba(255, 159, 28, 0.25)' },
                        isActivePlan && { borderColor: '#F59E0B', borderWidth: 2 }
                      ]}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>{diet.name}</Text>
                      <Text style={[styles.dietDesc, { color: 'rgba(255, 248, 231, 0.5)' }]}>
                        {diet.desc}
                      </Text>
                      <Text style={{ color: '#F59E0B', fontSize: 10, marginTop: 4, fontWeight: '800' }}>
                        {isActivePlan ? 'ĐANG KÍCH HOẠT ✨' : 'Click để tạo thực đơn'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {isGenerating && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF9F1C" />
                <Text style={{ marginTop: 8, fontSize: 12, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>AI Coach đang tính toán hàm lượng calo và chia bữa ăn...</Text>
              </View>
            )}

            {/* Generated Meal Plan Display */}
            {activeMealPlan && !isGenerating && (
              <>
                {/* Days Selector & Favorites Action */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>{activeMealPlan.title}</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(255, 248, 231, 0.5)', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>Bắt đầu: {activeMealPlan.startDate}</Text>
                    </View>
                    
                    {/* Favorite toggle button (LTAPP-52) */}
                    <Pressable onPress={handleToggleFavorite} style={[styles.favToggleBtn, activeMealPlan.isFavorite && styles.favToggleBtnActive]}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: activeMealPlan.isFavorite ? '#F59E0B' : 'rgba(255, 248, 231, 0.7)' }}>
                        {activeMealPlan.isFavorite ? '⭐ Đã lưu Yêu thích' : '☆ Lưu Yêu thích'}
                      </Text>
                    </Pressable>
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

                {/* Daily Menu details */}
                {activeDay && (
                  <View style={styles.card}>
                    <View style={styles.menuHeader}>
                      <View>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>Chi tiết thực đơn ngày {activeDay.dayNumber}</Text>
                        <Text style={{ marginTop: 2, fontSize: 11, color: '#FF9F1C', fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                          Mục tiêu: {activeDay.calories} kcal | Đạm: {activeDay.protein}g Carb: {activeDay.carbs}g Béo: {activeDay.fat}g
                        </Text>
                      </View>
                      <Pressable 
                        onPress={() => handleExportShopping(activeDay)} 
                        style={[styles.shoppingBtn, { backgroundColor: '#FF9F1C' }]}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>🛒 Xuất mua sắm</Text>
                      </Pressable>
                    </View>
                    
                    <View style={styles.divider} />

                    {/* Items with Swap feature (LTAPP-51) */}
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
                            {item.servingSizeG}g • Đạm:{item.protein}g Carb:{item.carbs}g Béo:{item.fat}g
                          </Text>
                        </View>
                        
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{item.calories} kcal</Text>
                          {/* Swap Dish button */}
                          <Pressable 
                            onPress={() => setSwapTargetItem(item)}
                            style={styles.swapBtn}
                          >
                            <Text style={{ color: '#38BDF8', fontSize: 10, fontWeight: '800' }}>🔄 Đổi món</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        ) : (
          /* Favorites section (LTAPP-52) */
          <View style={{ gap: Spacing.two }}>
            <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>Thực đơn yêu thích đã lưu ⭐</Text>
            {favoriteMealPlans.length === 0 ? (
              <View style={styles.card}>
                <Text style={{ textAlign: 'center', color: 'rgba(255, 248, 231, 0.5)', fontSize: 13, marginVertical: 20 }}>
                  Bạn chưa lưu thực đơn yêu thích nào. Hãy nhấn nút "☆ Lưu Yêu thích" ở màn hình thực đơn hiện tại!
                </Text>
              </View>
            ) : (
              favoriteMealPlans.map(plan => (
                <View key={plan.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>{plan.title}</Text>
                      <Text style={{ fontSize: 11, color: '#FF9F1C', marginTop: 2 }}>{plan.dietType} • 7 ngày</Text>
                    </View>
                    <Pressable onPress={() => handleApplyFavorite(plan.id)} style={[styles.shoppingBtn, { backgroundColor: '#10B981' }]}>
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>🔄 Áp dụng lại</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* Swap Dish Modal (LTAPP-51) */}
      <Modal
        visible={!!swapTargetItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSwapTargetItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#FF9F1C' }}>🔄 Chọn món thay thế</Text>
              <Pressable onPress={() => setSwapTargetItem(null)}>
                <Text style={{ fontSize: 14, color: '#EF4444', fontWeight: '800' }}>✕ Đóng</Text>
              </Pressable>
            </View>

            {swapTargetItem && (
              <View style={{ marginVertical: Spacing.two }}>
                <Text style={{ fontSize: 12, color: 'rgba(255, 248, 231, 0.6)' }}>Món gốc:</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginTop: 2 }}>
                  {swapTargetItem.foodName} ({swapTargetItem.calories} kcal)
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF', marginBottom: Spacing.one }}>Gợi ý món có tương đương dinh dưỡng:</Text>
            
            <ScrollView style={{ maxHeight: 250 }}>
              {(SWAP_OPTIONS[swapTargetItem?.mealType || 'lunch'] || SWAP_OPTIONS.lunch).map((opt, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleSelectSwapDish(opt)}
                  style={styles.swapOptionItem}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>{opt.foodName}</Text>
                    <Text style={{ fontSize: 10, color: 'rgba(255, 248, 231, 0.5)', marginTop: 2 }}>{opt.servingSizeG}g</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#FF9F1C' }}>Chọn ➔</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  mainTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  mainTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E1A17',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.2)',
    alignItems: 'center',
  },
  mainTabBtnActive: {
    borderColor: '#FF9F1C',
    backgroundColor: 'rgba(255, 159, 28, 0.15)',
  },
  mainTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 248, 231, 0.6)',
  },
  mainTabTextActive: {
    color: '#FF9F1C',
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: Spacing.two,
  },
  readjustBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#1E1A17',
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dietScroll: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  dietCard: {
    width: 200,
    borderRadius: 10,
    borderWidth: 1,
    padding: Spacing.three,
    marginRight: Spacing.two,
    gap: 4,
  },
  dietDesc: {
    fontSize: 10,
    lineHeight: 14,
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
  favToggleBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.4)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  favToggleBtnActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: Spacing.two,
  },
  mealItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  mealTypeBadge: {
    width: 65,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 159, 28, 0.12)',
    alignItems: 'center',
  },
  swapBtn: {
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E1A17',
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#FF9F1C',
  },
  swapOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
});
