import React, { useState } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput, View, Text, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalDb, ActivityScheduleItem } from '@/hooks/use-local-db';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';

export default function ActivityScheduleScreen() {
  const { 
    activitySchedule,
    addActivityScheduleItem,
    deleteActivityScheduleItem,
    toggleActivityScheduleItem,
    generateAiActivitySchedule
  } = useLocalDb();
  const { theme, isDark } = useAppTheme();

  const router = useRouter();

  // State controls
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGoalInput, setAiGoalInput] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);
  
  // Manual form inputs
  const [manualTitle, setManualTitle] = useState('');
  const [manualTime, setManualTime] = useState('08:00');
  const [manualType, setManualType] = useState<ActivityScheduleItem['type']>('custom');

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      await generateAiActivitySchedule(aiGoalInput.trim() || undefined);
      setAiGoalInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddManual = async () => {
    if (!manualTitle.trim()) {
      alert('Vui lòng nhập tên hoạt động.');
      return;
    }
    // Simple HH:MM regex check
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(manualTime.trim())) {
      alert('Vui lòng nhập thời gian hợp lệ dạng HH:MM (VD: 07:30 hoặc 18:00).');
      return;
    }

    await addActivityScheduleItem(manualTitle.trim(), manualTime.trim(), manualType);
    setManualTitle('');
    setManualTime('08:00');
    setManualType('custom');
    setIsAddingManual(false);
    alert('Đã thêm hoạt động mới và đăng ký nhắc nhở thành công! ⏰');
  };

  const getTypeEmoji = (type: ActivityScheduleItem['type']) => {
    switch (type) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥩';
      case 'dinner': return '🥗';
      case 'workout': return '🏋️‍♂️';
      default: return '🔔';
    }
  };

  const getTypeName = (type: ActivityScheduleItem['type']) => {
    switch (type) {
      case 'breakfast': return 'Ăn sáng';
      case 'lunch': return 'Ăn trưa';
      case 'dinner': return 'Ăn tối';
      case 'workout': return 'Tập luyện';
      default: return 'Khác';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <LinearGradient colors={isDark ? ['#0F0D0B', '#171411', '#0A0907'] : ['#FAF7EF', '#FFFDF9', '#FAF7EF']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>✕ Quay lại Dashboard</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Lịch Hoạt Động Hôm Nay 📅</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Intro Notification Banner */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderWidth: 1.5, borderColor: theme.cardBorder, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: '#FF9F1C', fontSize: 14 }}>Quyền nhắc nhở thông báo</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2, lineHeight: 17 }}>
              Hệ thống sẽ gửi thông báo trực tiếp tới điện thoại của bạn ngay khi đến giờ hoạt động tương ứng.
            </Text>
          </View>
        </View>

        {/* AI Generator Section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1.5 }]}>
          <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>Tự động lập lịch sinh hoạt bằng AI 🤖</Text>
          <Text style={{ fontSize: 13, color: theme.textMuted }}>
            AI Coach sẽ phân tích cân nặng, mục tiêu để soạn các bữa ăn và thời gian tập luyện tối ưu nhất cho bạn.
          </Text>

          <TextInput
            placeholder="VD: Cần tập nặng lúc chiều muộn, ăn kiêng low-carb..."
            placeholderTextColor={theme.textMuted}
            value={aiGoalInput}
            onChangeText={setAiGoalInput}
            style={[styles.input, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBg, marginBottom: Spacing.two }]}
          />

          {isGenerating ? (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#FF9F1C" />
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 6 }}>AI đang phân bổ giờ giấc khoa học...</Text>
            </View>
          ) : (
            <Pressable onPress={handleGenerateAI} style={[styles.primaryBtn, { backgroundColor: '#FF9F1C' }]}>
              <Text style={styles.btnText}>Lập lịch thông minh bằng AI ✨</Text>
            </Pressable>
          )}
        </View>

        {/* Manual Add Button & Modal Block */}
        {!isAddingManual ? (
          <Pressable 
            onPress={() => setIsAddingManual(true)} 
            style={[styles.outlineBtn, { borderColor: '#FF9F1C', backgroundColor: isDark ? 'rgba(255, 159, 28, 0.1)' : 'rgba(255, 159, 28, 0.08)' }]}
          >
            <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>+ Thêm hoạt động thủ công</Text>
          </Pressable>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1.5 }]}>
            <View style={styles.cardHeader}>
              <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>Thêm hoạt động mới</Text>
              <Pressable onPress={() => setIsAddingManual(false)}>
                <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 13 }}>Hủy</Text>
              </Pressable>
            </View>

            <Text style={[styles.formLabel, { color: theme.text }]}>Tên hoạt động *</Text>
            <TextInput
              placeholder="VD: Chạy bộ 5km hoặc Ăn trưa"
              placeholderTextColor={theme.textMuted}
              value={manualTitle}
              onChangeText={setManualTitle}
              style={[styles.input, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
            />

            <Text style={[styles.formLabel, { color: theme.text }]}>Giờ nhắc nhở (HH:MM) *</Text>
            <TextInput
              placeholder="VD: 17:30 hoặc 08:00"
              placeholderTextColor={theme.textMuted}
              value={manualTime}
              onChangeText={setManualTime}
              style={[styles.input, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
            />

            <Text style={[styles.formLabel, { color: theme.text }]}>Loại hoạt động</Text>
            <View style={styles.typeSelectorRow}>
              {(['breakfast', 'lunch', 'dinner', 'workout', 'custom'] as const).map(type => (
                <Pressable
                  key={type}
                  onPress={() => setManualType(type)}
                  style={[
                    styles.typeSelectorBtn,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: theme.cardBorder },
                    manualType === type && { backgroundColor: 'rgba(255, 159, 28, 0.2)', borderColor: '#FF9F1C' }
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>{getTypeEmoji(type)}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: theme.text, marginTop: 2 }}>{getTypeName(type)}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={handleAddManual} style={[styles.primaryBtn, { backgroundColor: '#FF9F1C', marginTop: Spacing.two }]}>
              <Text style={styles.btnText}>Lưu hoạt động & Đăng ký báo thức</Text>
            </Pressable>
          </View>
        )}

        {/* Schedule List */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1.5 }]}>
          <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14, marginBottom: Spacing.one }}>Danh sách hoạt động</Text>
          
          {activitySchedule.length === 0 ? (
            <Text style={{ textAlign: 'center', color: theme.textMuted, fontSize: 13, marginVertical: 20 }}>
              Hôm nay chưa có lịch hoạt động nào được tạo.
            </Text>
          ) : (
            activitySchedule
              .sort((a, b) => a.time.localeCompare(b.time))
              .map(item => (
                <View key={item.id} style={[styles.activityRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <View style={styles.activityTopRow}>
                    <View style={styles.activityLeft}>
                      <View style={[styles.emojiBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
                        <Text style={{ fontSize: 16 }}>{getTypeEmoji(item.type)}</Text>
                      </View>
                      <View style={{ marginLeft: Spacing.two, flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{item.title}</Text>
                        <Text style={{ fontSize: 11, color: theme.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>
                          ⌚ {item.time} ({getTypeName(item.type)})
                        </Text>
                      </View>
                    </View>

                  <View style={styles.activityRight}>
                    <Pressable
                      onPress={() => toggleActivityScheduleItem(item.id)}
                      style={[
                        styles.toggleBadge,
                        item.isEnabled ? { backgroundColor: '#DCFCE7', borderColor: '#FF9F1C' } : { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)', borderColor: theme.cardBorder }
                      ]}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: item.isEnabled ? '#15803D' : theme.textMuted }}>
                        {item.isEnabled ? '🔔 BẬT NHẮC' : '🔕 TẮT'}
                      </Text>
                    </Pressable>

                    <Pressable onPress={() => deleteActivityScheduleItem(item.id)} style={styles.deleteBtn}>
                      <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '800' }}>Xóa</Text>
                    </Pressable>
                  </View>
                  </View>

                  {/* Nutrition Info for meal types */}
                  {['breakfast', 'lunch', 'dinner'].includes(item.type) && item.nutritionInfo && (
                    <View style={[styles.nutritionBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', borderColor: theme.cardBorder, borderWidth: 1.2 }]}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text, marginBottom: 4 }}>📊 Chỉ số dinh dưỡng cần nạp:</Text>
                      <View style={styles.nutritionRow}>
                        <View style={[styles.nutriBadge, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>  
                          <Text style={{ fontSize: 10, color: '#B91C1C', fontWeight: '700' }}>🥩 Đạm: {item.nutritionInfo.protein}</Text>
                        </View>
                        <View style={[styles.nutriBadge, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>  
                          <Text style={{ fontSize: 10, color: '#92400E', fontWeight: '700' }}>🍚 Tinh bột: {item.nutritionInfo.carbs}</Text>
                        </View>
                        <View style={[styles.nutriBadge, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>  
                          <Text style={{ fontSize: 10, color: '#9A3412', fontWeight: '700' }}>🧈 Béo: {item.nutritionInfo.fat}</Text>
                        </View>
                        <View style={[styles.nutriBadge, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>  
                          <Text style={{ fontSize: 10, color: '#15803D', fontWeight: '700' }}>🔥 {item.nutritionInfo.calories}</Text>
                        </View>
                      </View>
                      {item.suggestedMeals && item.suggestedMeals.length > 0 && (
                        <View style={{ marginTop: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: theme.text, marginBottom: 2 }}>🍽️ Món ăn gợi ý:</Text>
                          {item.suggestedMeals.map((meal, mealIdx) => (
                            <Text key={mealIdx} style={{ fontSize: 11, color: theme.textSecondary, marginLeft: 8 }}>
                              • {meal}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))
          )}
        </View>

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
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.three,
  },
  infoCard: {
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.two,
    // Soft shadow
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  primaryBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  typeSelectorBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.25)',
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: '#1E1A17',
  },
  activityRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  toggleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  nutritionBlock: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.25)',
  },
  nutritionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  nutriBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
});
