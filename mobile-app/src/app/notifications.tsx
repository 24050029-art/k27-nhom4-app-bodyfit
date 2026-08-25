import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, Pressable, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocalDb, ActivityScheduleItem } from '@/hooks/use-local-db';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { getLocalDateString } from '@/utils/date';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'workout' | 'water' | 'achievement' | 'coach' | 'system';
  isRead: boolean;
  route?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { userProfile, foodLogs, waterLogs, quests, activitySchedule } = useLocalDb();

  const todayStr = getLocalDateString();

  // Generate full notification history aggregating all activity schedule items & system alerts
  const generatedNotifications = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Convert all activity schedule items into notifications (matching native push format)
    (activitySchedule || []).forEach((item: ActivityScheduleItem, idx: number) => {
      let bodyText = `Đã đến giờ ${item.title.toLowerCase()} rồi! Hãy thực hiện ngay nhé 💪`;
      let typeCategory: NotificationItem['type'] = 'system';
      let navRoute = '/(tabs)';

      if (['breakfast', 'lunch', 'dinner'].includes(item.type)) {
        typeCategory = item.type as any;
        navRoute = '/(tabs)/journal';
        if (item.nutritionInfo) {
          const n = item.nutritionInfo;
          bodyText = `Đã đến giờ ${item.title.toLowerCase()}! Bạn cần nạp: ${n.protein} đạm, ${n.carbs} tinh bột, ${n.fat} béo (~${n.calories}).`;
          if (item.suggestedMeals && item.suggestedMeals.length > 0) {
            bodyText += `\nGợi ý: ${item.suggestedMeals.join(', ')}.`;
          }
        }
      } else if (item.type === 'workout') {
        typeCategory = 'workout';
        navRoute = '/(tabs)/workout';
        bodyText = `Đã đến giờ ${item.title.toLowerCase()}! Hoàn thành bài tập để duy trì chuỗi Streak rực rỡ 🔥`;
      } else if (item.type === 'custom' || item.title.includes('nước')) {
        typeCategory = 'water';
        navRoute = '/(tabs)/journal';
        bodyText = `Đã đến giờ uống nước nhắc nhở 💧 rồi! Hãy bổ sung 250ml nước ngay nhé 💪`;
      }

      list.push({
        id: `act_notif_${item.id}_${idx}`,
        title: `🔔 Nhắc nhở hoạt động: ${item.title}`,
        body: bodyText,
        timestamp: `${item.time}`,
        type: typeCategory,
        isRead: idx > 1, // Mark top 2 as unread
        route: navRoute,
      });
    });

    // 2. Dynamic Plan Metric Alerts (LTAPP-61)
    const todayFoodLogs = (foodLogs || []).filter(f => f.loggedDate === todayStr);
    const todayCal = todayFoodLogs.reduce((sum, f) => sum + (f.calories || 0), 0);
    const targetCal = userProfile?.targetCalories || 2000;

    if (todayCal > targetCal) {
      list.unshift({
        id: 'sys_cal_overload',
        title: '⚠️ Cảnh báo: Vượt chỉ số Calo kế hoạch!',
        body: `Hôm nay bạn đã nạp ${todayCal} / ${targetCal} kcal (Vượt ${todayCal - targetCal} kcal). Hãy đi bộ nhẹ nhàng hoặc tập thêm 15p Cardio để giữ năng lượng thâm hụt!`,
        timestamp: 'Vừa xong',
        type: 'breakfast',
        isRead: false,
        route: '/(tabs)/journal',
      });
    } else if (todayCal > 0 && todayCal < targetCal - 400) {
      list.unshift({
        id: 'sys_cal_deficit',
        title: '📉 Nhắc nhở: Chưa đạt mốc Calo tối thiểu',
        body: `Bạn mới nạp ${todayCal} / ${targetCal} kcal hôm nay. Hãy bổ sung thêm bữa phụ giàu đạm để cơ thể hồi phục tốt nhất!`,
        timestamp: '19:30',
        type: 'breakfast',
        isRead: true,
        route: '/(tabs)/journal',
      });
    }

    // 3. Add System Goal & Achievement alerts
    list.push({
      id: 'sys_cal_goal',
      title: '🎯 Mục tiêu Calo hôm nay',
      body: `Mục tiêu dinh dưỡng của bạn là ${userProfile?.targetCalories || 2000} kcal (${userProfile?.targetProtein || 120}g đạm, ${userProfile?.targetCarbs || 250}g tinh bột, ${userProfile?.targetFat || 60}g chất béo).`,
      timestamp: '07:00',
      type: 'breakfast',
      isRead: true,
      route: '/(tabs)/journal',
    });

    list.push({
      id: 'sys_water_goal',
      title: '💧 Mục tiêu nước uống',
      body: `Hôm nay bạn cần nạp ${(userProfile?.targetWaterMl || 2000) / 1000}L nước. Hãy nhớ uống đủ nước trong ngày nhé!`,
      timestamp: '07:30',
      type: 'water',
      isRead: true,
      route: '/(tabs)/journal',
    });

    list.push({
      id: 'sys_coach_advice',
      title: '✨ Lời khuyên từ AI Coach',
      body: '"Kỷ luật là cầu nối giữa mục tiêu và thành tựu." Đừng quên ghi lại đầy đủ các bữa ăn và bài tập hôm nay!',
      timestamp: 'Hôm qua, 20:00',
      type: 'coach',
      isRead: true,
      route: '/(tabs)/coach',
    });

    return list;
  }, [activitySchedule, userProfile, foodLogs, todayStr]);

  const [notifications, setNotifications] = useState<NotificationItem[]>(generatedNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'food' | 'workout' | 'water'>('all');

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'food') return ['breakfast', 'lunch', 'dinner'].includes(n.type);
    if (filter === 'workout') return n.type === 'workout';
    if (filter === 'water') return n.type === 'water';
    return true;
  });

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'breakfast':
      case 'lunch':
      case 'dinner':
        return { name: 'restaurant-outline', color: '#FF9F1C' };
      case 'water':
        return { name: 'water-outline', color: '#38BDF8' };
      case 'workout':
        return { name: 'barbell-outline', color: '#10B981' };
      case 'achievement':
        return { name: 'trophy-outline', color: '#F59E0B' };
      case 'coach':
        return { name: 'sparkles-outline', color: '#A855F7' };
      default:
        return { name: 'notifications-outline', color: theme.primary };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Trung tâm thông báo</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Pressable onPress={() => router.push('/activity-schedule')} style={styles.scheduleLinkBtn}>
          <Ionicons name="settings-outline" size={18} color={theme.primary} />
          <Text style={[styles.scheduleLinkText, { color: theme.primary }]}>Cài đặt</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner to manage Activity Schedule */}
        <Pressable 
          onPress={() => router.push('/activity-schedule')}
          style={[styles.scheduleBanner, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        >
          <View style={[styles.scheduleBannerIcon, { backgroundColor: theme.primary + '18' }]}>
            <Ionicons name="alarm-outline" size={24} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.scheduleBannerTitle, { color: theme.text }]}>⏰ Quản lý Lịch Nhắc Nhở Tự Động</Text>
            <Text style={[styles.scheduleBannerSub, { color: theme.textMuted }]}>
              Cài đặt giờ ăn sáng, trưa, tối, tập luyện & uống nước
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </Pressable>

        {/* Filter Pills & Actions */}
        <View style={styles.actionRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'unread', label: 'Chưa đọc' },
              { id: 'food', label: 'Bữa ăn 🍳' },
              { id: 'water', label: 'Uống nước 💧' },
              { id: 'workout', label: 'Tập luyện 🏋️‍♂️' },
            ].map(tab => (
              <Pressable
                key={tab.id}
                onPress={() => setFilter(tab.id as any)}
                style={[
                  styles.filterPill,
                  { backgroundColor: filter === tab.id ? theme.primary : theme.card, borderColor: theme.cardBorder }
                ]}
              >
                <Text style={[styles.filterPillText, { color: filter === tab.id ? '#100E0C' : theme.text }]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {notifications.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <Pressable onPress={markAllAsRead}>
                  <Text style={[styles.actionText, { color: theme.primary }]}>Đã đọc hết</Text>
                </Pressable>
              )}
              <Pressable onPress={clearAllNotifications}>
                <Text style={[styles.actionText, { color: theme.danger }]}>Xóa tất cả</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(item => {
            const iconConfig = getNotificationIcon(item.type);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (item.route) router.push(item.route as any);
                }}
                style={[
                  styles.notifCard,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  !item.isRead && { borderWidth: 1.5, borderColor: theme.primary + '60' }
                ]}
              >
                <View style={[styles.notifIconWrap, { backgroundColor: iconConfig.color + '15' }]}>
                  <Ionicons name={iconConfig.name as any} size={22} color={iconConfig.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.notifHeaderRow}>
                    <Text style={[styles.notifTitle, { color: theme.text }, !item.isRead && { fontWeight: '800' }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.notifTime, { color: theme.textMuted }]}>{item.timestamp}</Text>
                  </View>
                  <Text style={[styles.notifBody, { color: theme.textMuted }]}>{item.body}</Text>
                </View>
                <Pressable onPress={() => deleteNotification(item.id)} style={styles.deleteNotifBtn}>
                  <Ionicons name="close" size={16} color={theme.textMuted} />
                </Pressable>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có thông báo nào</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              Tất cả các thông báo đã gửi về máy đều được tổng hợp ở đây!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  unreadBadge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#100E0C',
    fontSize: 11,
    fontWeight: '800',
  },
  scheduleLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  scheduleLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  scheduleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  scheduleBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  scheduleBannerSub: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 10,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  notifTime: {
    fontSize: 11,
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  deleteNotifBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
});
