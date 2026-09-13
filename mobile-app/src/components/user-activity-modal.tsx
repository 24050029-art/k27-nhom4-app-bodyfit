import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalDb, FoodLog, WaterLog, WeightLog, UserWorkoutSchedule } from '@/hooks/use-local-db';
import { getLocalDateString } from '@/utils/date';
import { useAppTheme } from '@/context/ThemeContext';

interface UserActivityModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function UserActivityModal({ visible, onClose }: UserActivityModalProps) {
  const { theme, isDark } = useAppTheme();
  const { 
    foodLogs, 
    waterLogs, 
    weightLogs, 
    workoutSchedules, 
    dailyDeclarations 
  } = useLocalDb();

  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Generate recent 7 dates for quick tabs
  const recentDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayLabel = i === 0 ? 'Hôm nay' : i === 1 ? 'Hôm qua' : `${d.getDate()}/${d.getMonth() + 1}`;
      days.push({ dateStr, dayLabel });
    }
    return days;
  }, []);

  // Filter activities for selected date
  const activities = useMemo(() => {
    const items: Array<{
      id: string;
      time: string;
      title: string;
      category: 'food' | 'water' | 'workout' | 'weight' | 'activity';
      icon: any;
      color: string;
      details: string;
      subDetails?: string;
    }> = [];

    // 1. Food logs
    const dayFoods = foodLogs.filter(f => (f.loggedDate || todayStr) === selectedDate);
    dayFoods.forEach(f => {
      const mealNames: Record<string, string> = {
        breakfast: 'Bữa Sáng 🌅',
        lunch: 'Bữa Trưa ☀️',
        dinner: 'Bữa Tối 🌌',
        snack: 'Bữa Phụ 🍎'
      };
      items.push({
        id: `food-${f.id}`,
        time: f.loggedAt || 'Trong ngày',
        title: `${mealNames[f.mealType] || 'Ăn uống'}: ${f.foodName}`,
        category: 'food',
        icon: 'restaurant',
        color: '#FF9F1C',
        details: `${f.calories} kcal • P: ${f.protein}g • C: ${f.carbs}g • F: ${f.fat}g`,
        subDetails: f.fiber ? `Xơ: ${f.fiber}g • Đường: ${f.sugar || 0}g • Natri: ${f.sodium || 0}mg` : undefined
      });
    });

    // 2. Water logs
    const dayWaters = waterLogs.filter(w => (w.loggedDate || todayStr) === selectedDate);
    dayWaters.forEach(w => {
      items.push({
        id: `water-${w.id}`,
        time: w.loggedAt || 'Trong ngày',
        title: `Uống nước 💧`,
        category: 'water',
        icon: 'water',
        color: '#38BDF8',
        details: `+${w.amountMl} ml nước lọc`,
      });
    });

    // 3. Weight logs
    const dayWeights = weightLogs.filter(w => w.loggedDate === selectedDate);
    dayWeights.forEach(w => {
      items.push({
        id: `weight-${w.id}`,
        time: w.loggedAt || 'Sáng',
        title: `Cập nhật cân nặng & số đo ⚖️`,
        category: 'weight',
        icon: 'scale',
        color: '#10B981',
        details: `Cân nặng: ${w.weightKg} kg${w.bodyFatPct ? ` • Mỡ: ${w.bodyFatPct}%` : ''}`,
        subDetails: w.waistCm ? `Eo: ${w.waistCm}cm • Ngực: ${w.chestCm || '--'}cm • Mông: ${w.hipsCm || '--'}cm` : undefined
      });
    });

    // 4. Workout schedules / completed workouts
    const dayWorkouts = workoutSchedules.filter(w => w.scheduledDate === selectedDate);
    dayWorkouts.forEach(w => {
      const title = w.program?.title || (w as any).routineTitle || 'Bài tập thể hình';
      const duration = (w.program as any)?.durationMins || (w as any).durationMins || 30;
      const calBurned = (w.program as any)?.caloriesBurned || (w as any).caloriesBurned || 250;
      items.push({
        id: `workout-${w.id}`,
        time: w.isCompleted ? 'Đã hoàn thành' : 'Đã lên lịch',
        title: `Tập luyện: ${title} 🏋️‍♂️`,
        category: 'workout',
        icon: 'barbell',
        color: '#A855F7',
        details: `${duration} phút • Tiêu hao: ~${calBurned} kcal`,
        subDetails: w.isCompleted ? 'Trạng thái: Đã hoàn tất buổi tập ✅' : 'Chưa hoàn thành'
      });
    });

    // 5. Daily declaration (Steps / Cardio)
    const dayDecl = dailyDeclarations[selectedDate];
    if (dayDecl) {
      const steps = dayDecl.steps || 0;
      const km = (steps * 0.00075).toFixed(2);
      items.push({
        id: `decl-${selectedDate}`,
        time: 'Cả ngày',
        title: `Vận động: ${dayDecl.activity || 'Hoạt động thể chất'} 🏃‍♂️`,
        category: 'activity',
        icon: 'walk',
        color: '#EC4899',
        details: `${steps.toLocaleString()} bước (~${km} km) • ${dayDecl.activeCalories || 0} kcal`,
        subDetails: dayDecl.activeTime ? `Thời lượng: ${dayDecl.activeTime} phút` : undefined
      });
    }

    return items;
  }, [selectedDate, foodLogs, waterLogs, weightLogs, workoutSchedules, dailyDeclarations, todayStr]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#191613' : '#FFFFFF', borderColor: isDark ? 'rgba(255, 159, 28, 0.3)' : 'rgba(0,0,0,0.1)' }]}>
          
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(255, 159, 28, 0.15)' }]}>
                <Ionicons name="time" size={18} color="#FF9F1C" />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Lịch Sử Người Dùng 📜</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>Dòng thời gian hoạt động chi tiết</Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          {/* Date tabs */}
          <View style={styles.dateTabsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {recentDays.map((d) => {
                const isSelected = d.dateStr === selectedDate;
                return (
                  <Pressable
                    key={d.dateStr}
                    onPress={() => setSelectedDate(d.dateStr)}
                    style={[
                      styles.datePill,
                      { backgroundColor: isSelected ? '#FF9F1C' : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }
                    ]}
                  >
                    <Text style={[styles.datePillText, { color: isSelected ? '#100E0C' : theme.text, fontWeight: isSelected ? '900' : '600' }]}>
                      {d.dayLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Timeline List */}
          <ScrollView style={styles.timelineScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {activities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={40} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  Chưa có hoạt động nào được ghi nhận vào ngày {selectedDate}.
                </Text>
              </View>
            ) : (
              <View style={styles.timelineList}>
                {activities.map((item, idx) => (
                  <View key={item.id} style={styles.timelineRow}>
                    {/* Left node and connector line */}
                    <View style={styles.leftCol}>
                      <View style={[styles.nodeDot, { backgroundColor: item.color }]}>
                        <Ionicons name={item.icon} size={12} color="#FFFFFF" />
                      </View>
                      {idx < activities.length - 1 && (
                        <View style={[styles.nodeLine, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]} />
                      )}
                    </View>

                    {/* Content item box */}
                    <View style={[styles.itemCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                        <Text style={[styles.itemTime, { color: theme.textMuted }]}>{item.time}</Text>
                      </View>
                      <Text style={[styles.itemDetails, { color: item.color }]}>{item.details}</Text>
                      {item.subDetails ? (
                        <Text style={[styles.itemSubDetails, { color: theme.textMuted }]}>{item.subDetails}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer button */}
          <Pressable onPress={onClose} style={[styles.doneBtn, { backgroundColor: '#FF9F1C' }]}>
            <Text style={styles.doneBtnText}>Đóng</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 20,
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  dateTabsWrap: {
    marginBottom: 14,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  datePillText: {
    fontSize: 12,
  },
  timelineScroll: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  timelineList: {
    paddingTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  leftCol: {
    width: 28,
    alignItems: 'center',
  },
  nodeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  itemCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginLeft: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  itemTime: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemDetails: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemSubDetails: {
    fontSize: 11,
    marginTop: 3,
  },
  doneBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  doneBtnText: {
    color: '#100E0C',
    fontSize: 14,
    fontWeight: '800',
  },
});
