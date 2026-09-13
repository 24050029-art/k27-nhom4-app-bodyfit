import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Line, Circle, Text as SvgText, G, Rect } from 'react-native-svg';

import { Gradients, MaxContentWidth, Spacing, DEFAULT_AVATAR } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useLocalDb } from '@/hooks/use-local-db';
import { getLocalDateString } from '@/utils/date';

const goalLabels: Record<string, string> = { 
  weight_loss: 'Giảm cân', 
  weight_gain: 'Tăng cân', 
  maintain_weight: 'Giữ cân', 
  muscle_gain: 'Tăng cơ bắp', 
  healthy_lifestyle: 'Sống khỏe' 
};

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const { 
    userProfile, 
    updateProfile, 
    addWeightLog, 
    weightLogs, 
    isPremium, 
    clearAllData, 
    logout,
    isAdmin,
    currentUser,
    userToken,
    backendUrl,
    getAdminDashboard,
    communityPosts,
    deleteCommunityPost
  } = useLocalDb();

  const [profileOpen, setProfileOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTab, setAdminTab] = useState<'stats' | 'users' | 'posts'>('stats');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [revenueFilter, setRevenueFilter] = useState<'week' | 'month' | 'year'>('month');
  const [selectedWeek, setSelectedWeek] = useState<number>(3); // 1 to 5
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // 1 to 12
  const [selectedYear, setSelectedYear] = useState<number>(2026); // 2024 to 2026

  const premiumCount = adminData?.stats?.premiumUsers || 0;

  // Revenue dynamic data by filter
  const getDynamicRevenueData = () => {
    const monthWeights = [0.05, 0.08, 0.12, 0.18, 0.25, 0.45, 1.0, 0.85, 0.60, 0.40, 0.20, 0.10];
    
    const activeYearCount = selectedYear === 2026 
      ? premiumCount 
      : selectedYear === 2025 
        ? Math.round(premiumCount * 0.60) 
        : Math.round(premiumCount * 0.25);

    const activeMonthCount = Math.round(activeYearCount * monthWeights[selectedMonth - 1]);
    const weekWeights = [0.15, 0.20, 0.30, 0.25, 0.10];
    const weekPremiumCount = Math.round(activeMonthCount * weekWeights[selectedWeek - 1]);

    // 1. Week distribution: distribute weekPremiumCount across 7 days (T2 -> CN)
    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const weekList = weekDays.map((label, idx) => {
      const dist = [0.1, 0.15, 0.05, 0.2, 0.1, 0.25, 0.15];
      const sales = Math.round(weekPremiumCount * dist[idx]);
      return {
        label,
        sales,
        revenue: sales * 79000
      };
    });

    const sumWeekSales = weekList.reduce((sum, item) => sum + item.sales, 0);
    if (sumWeekSales !== weekPremiumCount && weekList.length > 0) {
      const diff = weekPremiumCount - sumWeekSales;
      weekList[6].sales = Math.max(0, weekList[6].sales + diff);
      weekList[6].revenue = weekList[6].sales * 79000;
    }

    // 2. Month distribution: distribute activeMonthCount across 30 days (1 -> 30)
    const monthDays = Array.from({ length: 30 }, (_, idx) => String(idx + 1));
    const monthList = monthDays.map((label, idx) => {
      const factor = 0.02 + 0.03 * Math.sin((idx + 1) / 2.0) + 0.02 * Math.cos((idx + 1) / 5.0);
      const sales = Math.round(activeMonthCount * Math.max(0, factor));
      return {
        label,
        sales,
        revenue: sales * 79000
      };
    });

    const sumMonthSales = monthList.reduce((sum, item) => sum + item.sales, 0);
    if (sumMonthSales !== activeMonthCount && monthList.length > 0) {
      const diff = activeMonthCount - sumMonthSales;
      monthList[14].sales = Math.max(0, monthList[14].sales + diff);
      monthList[14].revenue = monthList[14].sales * 79000;
    }

    // 3. Year distribution: distribute activeYearCount across 12 months (T1 -> T12)
    const yearMonths = Array.from({ length: 12 }, (_, idx) => `T${idx + 1}`);
    const yearList = yearMonths.map((label, idx) => {
      const weight = monthWeights[idx];
      const sumWeights = monthWeights.reduce((s, w) => s + w, 0);
      const sales = Math.round(activeYearCount * (weight / sumWeights));
      return {
        label,
        sales,
        revenue: sales * 79000
      };
    });

    const sumYearSales = yearList.reduce((sum, item) => sum + item.sales, 0);
    if (sumYearSales !== activeYearCount && yearList.length > 0) {
      const diff = activeYearCount - sumYearSales;
      yearList[11].sales = Math.max(0, yearList[11].sales + diff);
      yearList[11].revenue = yearList[11].sales * 79000;
    }

    return {
      week: weekList,
      month: monthList,
      year: yearList
    };
  };

  const dynamicRevenue = getDynamicRevenueData();
  const currentRevenueList = dynamicRevenue[revenueFilter];
  const maxRevenue = Math.max(...currentRevenueList.map((item: any) => item.revenue), 10);
  const activeTransactions = currentRevenueList.filter((item: any) => item.sales > 0);

  const getDisplayLabel = (label: string) => {
    if (revenueFilter === 'week') {
      return label === 'CN' ? 'Chủ Nhật' : `Thứ ${label.substring(1)}`;
    }
    if (revenueFilter === 'month') {
      return `Tháng ${label.substring(1)}`;
    }
    return `Năm ${label}`;
  };

  const getLineChartData = () => {
    const list = currentRevenueList;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const chartHeight = 120;
    const svgWidth = 330;
    const chartWidth = svgWidth - paddingLeft - paddingRight;

    const numPoints = list.length;
    const maxVal = Math.max(...list.map((item: any) => item.revenue), 10);

    const points = list.map((item: any, idx: number) => {
      const val = item.revenue;
      const x = paddingLeft + (idx * (chartWidth / Math.max(numPoints - 1, 1)));
      const y = paddingTop + chartHeight - (maxVal > 0 ? (val / maxVal) : 0) * chartHeight;
      return { x, y, val };
    });

    const generatePath = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return '';
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    };

    return {
      points,
      path: generatePath(points),
      color: '#FF9F1C',
      maxVal,
      chartHeight,
      chartWidth,
      paddingLeft,
      paddingRight,
      paddingTop,
      svgWidth,
    };
  };

  const lineChart = getLineChartData();
  
  const [firstName, setFirstName] = useState(userProfile?.firstName || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [age, setAge] = useState(String(userProfile?.age || 25));
  const [height, setHeight] = useState(String(userProfile?.heightCm || 175));
  const [weight, setWeight] = useState(String(userProfile?.weightKg || 70));
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(userProfile?.gender || 'male');
  const [activityLevel, setActivityLevel] = useState<any>(userProfile?.activityLevel || 'moderately_active');
  const [targetGoal, setTargetGoal] = useState<any>(userProfile?.targetGoal || 'muscle_gain');
  const [waist, setWaist] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (userProfile && profileOpen) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setAge(String(userProfile.age || 25));
      setHeight(String(userProfile.heightCm || 175));
      setWeight(String(userProfile.weightKg || 70));
      setGender(userProfile.gender || 'male');
      setActivityLevel(userProfile.activityLevel || 'moderately_active');
      setTargetGoal(userProfile.targetGoal || 'muscle_gain');
    }
  }, [profileOpen, userProfile]);

  const loadDashboardData = async () => {
    setAdminLoading(true);
    try {
      const data = await getAdminDashboard();
      if (data) {
        setAdminData(data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (adminOpen) {
      loadDashboardData();
    }
  }, [adminOpen]);

  const updateUserByAdmin = async (userId: string, updateData: { role?: string; isPremium?: boolean }) => {
    if (userToken && backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/v1/admin/users/${userId}/role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify(updateData)
        });
        if (res.ok) {
          Alert.alert('Thành công', 'Đã cập nhật thông tin người dùng thành công.');
          loadDashboardData();
        } else {
          Alert.alert('Lỗi', `Cập nhật thất bại (HTTP ${res.status})`);
        }
      } catch (err) {
        console.warn(err);
        Alert.alert('Lỗi', 'Không thể kết nối với server.');
      }
    } else {
      // Mock update local list
      setAdminData((prev: any) => {
        if (!prev) return null;
        const updatedUsers = prev.users.map((u: any) => 
          u.id === userId ? { ...u, ...updateData } : u
        );
        return { ...prev, users: updatedUsers };
      });
      Alert.alert('Thành công', 'Đã cập nhật thông tin người dùng (Mock).');
    }
  };

  const [avatarUri, setAvatarUri] = useState(userProfile?.avatarUrl || DEFAULT_AVATAR);

  useEffect(() => {
    setAvatarUri(userProfile?.avatarUrl || DEFAULT_AVATAR);
  }, [userProfile?.avatarUrl]);

  const avatar = avatarUri;
  const goalLabel = goalLabels[userProfile?.targetGoal || 'muscle_gain'] || 'Tăng cơ bắp';

  // Computed values mapping
  const bmiVal = userProfile?.bmi || 22.9;
  const bmiNote = bmiVal < 18.5 ? 'Thiếu cân' : bmiVal < 25 ? 'Bình thường' : 'Thừa cân';
  const bmrVal = userProfile?.bmr || 1674;
  const tdeeVal = userProfile?.tdee || 2009;
  const targetCal = userProfile?.targetCalories || 2259;
  const bodyFatVal = userProfile?.bodyFatEstimate || 11.6;
  const leanMassVal = userProfile?.leanBodyMass || 61.9;

  const pickAndUploadAvatar = async () => {
    try {
      const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để đổi ảnh đại diện.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const localUri = result.assets[0].uri;

      // Show local image IMMEDIATELY — no waiting
      const profilePayload = {
        firstName: userProfile?.firstName || 'gakon',
        lastName: userProfile?.lastName || '',
        age: userProfile?.age || 25,
        gender: userProfile?.gender || 'male',
        heightCm: userProfile?.heightCm || 175,
        weightKg: userProfile?.weightKg || 70,
        activityLevel: userProfile?.activityLevel || 'moderately_active',
        targetGoal: userProfile?.targetGoal || 'muscle_gain',
        avatarUrl: localUri,
      } as any;
      updateProfile(profilePayload);
      setStatus('Đã cập nhật ảnh đại diện.');

      // Silent background upload — no loading indicators
      if (userToken && backendUrl) {
        (async () => {
          try {
            const ImageManipulator = require('expo-image-manipulator');
            const saved = await ImageManipulator.manipulateAsync(
              localUri,
              [{ resize: { width: 300, height: 300 } }],
              { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            const res = await fetch(`${backendUrl}/v1/users/profile/avatar`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
              },
              body: JSON.stringify({ base64: `data:image/jpeg;base64,${saved.base64}` }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data.success && data.url) {
                updateProfile({ ...profilePayload, avatarUrl: data.url });
              }
            }
          } catch (err) {
            console.warn('Background avatar upload failed, keeping local image', err);
          }
        })();
      }
    } catch (err) {
      console.error('Avatar pick error', err);
      Alert.alert('Lỗi', 'Không thể đổi ảnh đại diện. Vui lòng thử lại.');
    }
  };

  const saveProfile = () => {
    updateProfile({ 
      firstName: firstName.trim() || userProfile?.firstName || 'Người dùng', 
      lastName: lastName.trim(), 
      age: Number(age) || userProfile?.age || 25, 
      gender: gender || userProfile?.gender || 'male', 
      heightCm: Number(height) || userProfile?.heightCm || 175, 
      weightKg: Number(weight) || userProfile?.weightKg || 70, 
      activityLevel: activityLevel || userProfile?.activityLevel || 'moderately_active', 
      targetGoal: targetGoal || userProfile?.targetGoal || 'muscle_gain', 
      avatarUrl: userProfile?.avatarUrl 
    } as any);
    setStatus('Đã cập nhật hồ sơ.');
    setProfileOpen(false);
  };

  const saveWeight = async () => {
    try {
      const weightStr = (weight || '').toString().trim().replace(',', '.');
      const parsedWeight = parseFloat(weightStr);
      
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        Alert.alert('Thông báo', 'Vui lòng nhập số cân nặng hợp lệ (Ví dụ: 70.5)!');
        return;
      }

      const waistStr = (waist || '').toString().trim().replace(',', '.');
      const parsedWaist = waistStr ? parseFloat(waistStr) : undefined;

      // Close modal INSTANTLY (0ms response) so user cannot click multiple times
      setWeightOpen(false);

      await addWeightLog(
        parsedWeight,
        parsedWaist && !isNaN(parsedWaist) ? parsedWaist : undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        getLocalDateString()
      );

      setStatus('Đã lưu cân nặng.');
      Alert.alert('Thành công', 'Đã lưu chỉ số cân nặng thành công! 📊');
    } catch (err: any) {
      console.error('Error saving weight log:', err);
      Alert.alert('Lỗi', 'Không thể lưu cân nặng. Vui lòng thử lại.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Custom Header Row matching mockup */}
        <View style={styles.customHeader}>
          <Text style={[styles.headerTitleText, { color: theme.text }]}>Tiến độ & Hồ sơ</Text>
        </View>
        {adminOpen ? (
          <View style={styles.adminFullScreenContainer}>
            {/* Admin Header with Back Button */}
            <View style={styles.adminHeader}>
              <Pressable onPress={() => setAdminOpen(false)} style={styles.adminBackBtn}>
                <Ionicons name="arrow-back" size={22} color='#FF9F1C' style={{ marginRight: 6 }} />
                <Text style={[styles.adminBackText, { color: theme.text }]}>Quay lại</Text>
              </Pressable>
              <Text style={[styles.adminHeaderTitle, { color: theme.text }]}>Quản Trị Hệ Thống 🔑</Text>
              <Pressable onPress={loadDashboardData} style={styles.adminRefreshBtn}>
                <Ionicons name="refresh" size={20} color='#FF9F1C' />
              </Pressable>
            </View>

            {/* Admin Navigation Tabs */}
            <View style={styles.adminTabs}>
              <Pressable 
                onPress={() => setAdminTab('stats')} 
                style={[styles.adminTab, adminTab === 'stats' && styles.adminTabActive]}
              >
                <Ionicons name="stats-chart" size={16} color={adminTab === 'stats' ? '#10120F' : '#FF9F1C'} style={{ marginRight: 6 }} />
                <Text style={[styles.adminTabText, adminTab === 'stats' && styles.adminTabTextActive]}>Tổng quan</Text>
              </Pressable>
              <Pressable 
                onPress={() => setAdminTab('users')} 
                style={[styles.adminTab, adminTab === 'users' && styles.adminTabActive]}
              >
                <Ionicons name="people" size={16} color={adminTab === 'users' ? '#10120F' : '#FF9F1C'} style={{ marginRight: 6 }} />
                <Text style={[styles.adminTabText, adminTab === 'users' && styles.adminTabTextActive]}>Thành viên</Text>
              </Pressable>
              <Pressable 
                onPress={() => setAdminTab('posts')} 
                style={[styles.adminTab, adminTab === 'posts' && styles.adminTabActive]}
              >
                <Ionicons name="chatbubbles" size={16} color={adminTab === 'posts' ? '#10120F' : '#FF9F1C'} style={{ marginRight: 6 }} />
                <Text style={[styles.adminTabText, adminTab === 'posts' && styles.adminTabTextActive]}>Bài viết</Text>
              </Pressable>
            </View>

            {/* Tab content */}
            {adminLoading && !adminData ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color='#FF9F1C' />
                <Text style={{ color: 'rgba(255, 248, 231, 0.6)', marginTop: 12 }}>Đang tải dữ liệu quản trị...</Text>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                {adminTab === 'stats' && (
                  <View style={styles.adminTabContent}>
                    {/* Stats Grid */}
                    <Text style={[styles.adminSectionTitle, { color: theme.text }]}>Số Liệu Hệ Thống</Text>
                    <View style={styles.adminStatsGrid}>
                      <View style={[styles.adminStatCard, { backgroundColor: theme.card || 'rgba(255,255,255,0.04)', borderColor: theme.cardBorder }]}>
                        <Ionicons name="people-outline" size={24} color='#FF9F1C' />
                        <Text style={[styles.adminStatValue, { color: theme.text }]}>{adminData?.stats?.totalUsers || 0}</Text>
                        <Text style={styles.adminStatLabel}>Tổng Người Dùng</Text>
                      </View>
                      <View style={[styles.adminStatCard, { backgroundColor: theme.card || 'rgba(255,255,255,0.04)', borderColor: theme.cardBorder }]}>
                        <Ionicons name="ribbon-outline" size={24} color="#FFD700" />
                        <Text style={[styles.adminStatValue, { color: theme.text }]}>{adminData?.stats?.premiumUsers || 0}</Text>
                        <Text style={styles.adminStatLabel}>Premium Users</Text>
                      </View>
                      <View style={[styles.adminStatCard, { backgroundColor: theme.card || 'rgba(255,255,255,0.04)', borderColor: theme.cardBorder }]}>
                        <Ionicons name="cash-outline" size={24} color="#FF5B5B" />
                        <Text style={[styles.adminStatValue, { color: '#FF9F1C' }]}>
                          {Number(adminData?.stats?.estimatedMonthlyRevenueVND || 0).toLocaleString('vi-VN')}₫
                        </Text>
                        <Text style={styles.adminStatLabel}>Doanh Thu</Text>
                      </View>
                      <View style={[styles.adminStatCard, { backgroundColor: theme.card || 'rgba(255,255,255,0.04)', borderColor: theme.cardBorder }]}>
                        <Ionicons name="documents-outline" size={24} color='#FF9F1C' />
                        <Text style={[styles.adminStatValue, { color: theme.text }]}>{adminData?.stats?.totalPosts || 0}</Text>
                        <Text style={styles.adminStatLabel}>Tổng Bài Đăng</Text>
                      </View>
                    </View>

                    {/* Sơ đồ doanh thu */}
                    <Text style={[styles.adminSectionTitle, { color: theme.text, marginTop: 24 }]}>Sơ Đồ Doanh Thu</Text>
                    <View style={styles.chartContainer}>
                      {/* Filter Buttons */}
                      <View style={styles.chartFilters}>
                        {(['week', 'month', 'year'] as const).map((filter) => {
                          const labels = { week: 'Tuần', month: 'Tháng', year: 'Năm' };
                          const isActive = revenueFilter === filter;
                          return (
                            <Pressable
                              key={filter}
                              onPress={() => setRevenueFilter(filter)}
                              style={[styles.chartFilterBtn, isActive && styles.chartFilterBtnActive]}
                            >
                              <Text style={[styles.chartFilterBtnText, isActive && styles.chartFilterBtnTextActive]}>
                                {labels[filter]}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Sub-Filters Selector */}
                      <View style={styles.subFiltersRow}>
                        {revenueFilter === 'week' && (
                          <View style={styles.subFiltersList}>
                            {[1, 2, 3, 4, 5].map((wk) => (
                              <Pressable
                                key={wk}
                                onPress={() => setSelectedWeek(wk)}
                                style={[styles.subFilterBtn, selectedWeek === wk && styles.subFilterBtnActive]}
                              >
                                <Text style={[styles.subFilterBtnText, selectedWeek === wk && styles.subFilterBtnTextActive]}>
                                  Tuần {wk}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        )}
                        {revenueFilter === 'month' && (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFiltersScroll}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((mth) => (
                              <Pressable
                                key={mth}
                                onPress={() => setSelectedMonth(mth)}
                                style={[styles.subFilterBtn, selectedMonth === mth && styles.subFilterBtnActive]}
                              >
                                <Text style={[styles.subFilterBtnText, selectedMonth === mth && styles.subFilterBtnTextActive]}>
                                  T{mth}
                                </Text>
                              </Pressable>
                            ))}
                          </ScrollView>
                        )}
                        {revenueFilter === 'year' && (
                          <View style={styles.subFiltersList}>
                            {[2024, 2025, 2026].map((yr) => (
                              <Pressable
                                key={yr}
                                onPress={() => setSelectedYear(yr)}
                                style={[styles.subFilterBtn, selectedYear === yr && styles.subFilterBtnActive]}
                              >
                                <Text style={[styles.subFilterBtnText, selectedYear === yr && styles.subFilterBtnTextActive]}>
                                  Năm {yr}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Visual Line Chart */}
                      <View style={[styles.chartVisualizer, { backgroundColor: theme.card || 'rgba(255,255,255,0.03)', borderColor: theme.cardBorder }]}>
                        <Svg height="155" width="320">
                          {/* Y-axis grid lines and labels */}
                          {[0, 1, 2, 3].map((i) => {
                            const y = lineChart.paddingTop + i * (lineChart.chartHeight / 3);
                            const val = lineChart.maxVal - i * (lineChart.maxVal / 3);
                            return (
                              <G key={i}>
                                <Line
                                  x1={lineChart.paddingLeft}
                                  y1={y}
                                  x2={lineChart.svgWidth - 10}
                                  y2={y}
                                  stroke="rgba(255, 255, 255, 0.08)"
                                  strokeWidth="1"
                                />
                                <SvgText
                                  x={lineChart.paddingLeft - 8}
                                  y={y + 3}
                                  fill="rgba(255, 248, 231, 0.4)"
                                  fontSize="9"
                                  fontWeight="700"
                                  textAnchor="end"
                                >
                                  ${Math.round(val)}
                                </SvgText>
                              </G>
                            );
                          })}

                          {/* Line for Total Revenue */}
                          {lineChart.path ? (
                            <Path
                              d={lineChart.path}
                              fill="none"
                              stroke={lineChart.color}
                              strokeWidth="3"
                            />
                          ) : null}

                          {/* Vertices/Circles for Path */}
                          {lineChart.points.map((p: any, idx: number) => {
                            // For monthly view, only render circles for key days to avoid visual clutter
                            const isKeyMonthDay = revenueFilter === 'month' && 
                              (idx === 0 || idx === 4 || idx === 9 || idx === 14 || idx === 19 || idx === 24 || idx === 29);
                            
                            if (revenueFilter === 'month' && !isKeyMonthDay) return null;

                            return (
                              <Circle
                                key={`pt-${idx}`}
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill='#FF9F1C'
                                stroke="#161922"
                                strokeWidth="1.5"
                              />
                            );
                          })}

                          {/* X-axis labels */}
                          {currentRevenueList.map((item: any, idx: number) => {
                            const x = lineChart.paddingLeft + (idx * (lineChart.chartWidth / Math.max(currentRevenueList.length - 1, 1)));
                            
                            // Determine label showing rules based on index or date string
                            const shouldShow = revenueFilter === 'week' || 
                                               revenueFilter === 'year' || 
                                               (parseInt(item.label, 10) === 1 || parseInt(item.label, 10) === 5 || parseInt(item.label, 10) === 10 || parseInt(item.label, 10) === 15 || parseInt(item.label, 10) === 20 || parseInt(item.label, 10) === 25 || parseInt(item.label, 10) === 30);
                            
                            if (!shouldShow) return null;

                            return (
                              <SvgText
                                key={idx}
                                x={x}
                                y={lineChart.paddingTop + lineChart.chartHeight + 14}
                                fill="rgba(255, 248, 231, 0.4)"
                                fontSize="9"
                                fontWeight="800"
                                textAnchor="middle"
                              >
                                {revenueFilter === 'month' ? `${item.label}` : item.label}
                              </SvgText>
                            );
                          })}
                        </Svg>
                      </View>
                    </View>

                    {/* Breakdown Table */}
                    <Text style={[styles.adminSectionTitle, { color: theme.text, marginTop: 24 }]}>Chi Tiết Biến Động Doanh Thu</Text>
                    <View style={[styles.tableCard, { borderColor: theme.cardBorder, marginTop: 12 }]}>
                      <View style={[styles.tableRow, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
                        <Text style={[styles.tableLabel, { fontWeight: '900', color: theme.textSecondary }]}>Thời gian</Text>
                        <Text style={[styles.tableLabel, { fontWeight: '900', color: theme.textSecondary }]}>Lượt mua</Text>
                        <Text style={[styles.tableValue, { fontWeight: '900', color: theme.text }]}>Doanh Thu</Text>
                      </View>
                      {activeTransactions.length > 0 ? (
                        activeTransactions.map((m: any, idx: number) => (
                          <View key={idx} style={[styles.tableRow, idx === activeTransactions.length - 1 && styles.tableRowLast, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
                            <Text style={styles.tableLabel}>{getDisplayLabel(m.label)}</Text>
                            <Text style={styles.tableLabel}>{m.sales} giao dịch</Text>
                            <Text style={[styles.tableValue, { color: '#FF9F1C' }]}>{Number(m.revenue).toLocaleString('vi-VN')}₫</Text>
                          </View>
                        ))
                      ) : (
                        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                          <Text style={{ color: 'rgba(255, 248, 231, 0.35)', fontSize: 11, fontWeight: '700' }}>
                            Không có giao dịch phát sinh trong thời gian này
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {adminTab === 'users' && (
                  <View style={styles.adminTabContent}>
                    {/* Search Bar */}
                    <View style={[styles.adminSearchContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                      <Ionicons name="search" size={16} color="rgba(255,248,231,0.4)" style={{ marginRight: 8 }} />
                      <TextInput 
                        value={userSearchQuery}
                        onChangeText={setUserSearchQuery}
                        style={[styles.adminSearchInput, { color: theme.text }]}
                        placeholder="Tìm người dùng theo tên hoặc email..."
                        placeholderTextColor="rgba(255,248,231,0.4)"
                      />
                      {userSearchQuery ? (
                        <Pressable onPress={() => setUserSearchQuery('')}>
                          <Ionicons name="close-circle" size={16} color="rgba(255,248,231,0.4)" />
                        </Pressable>
                      ) : null}
                    </View>

                    {/* Users List */}
                    {adminData?.users ? (
                      adminData.users
                        .filter((u: any) => {
                          const query = userSearchQuery.toLowerCase();
                          return (u.name || '').toLowerCase().includes(query) || 
                                 (u.username || '').toLowerCase().includes(query) || 
                                 (u.email || '').toLowerCase().includes(query);
                        })
                        .map((user: any) => {
                          const isUserPremium = user.isPremium || user.role === 'PREMIUM';
                          const isUserAdmin = user.role === 'ADMIN';

                          return (
                            <View key={user.id} style={[styles.adminUserCard, { backgroundColor: theme.card || 'rgba(255,255,255,0.03)', borderColor: theme.cardBorder }]}>
                              <View style={{ flex: 1, paddingRight: 8 }}>
                                <Text style={[styles.adminUserTextName, { color: theme.text }]}>
                                  {user.name || user.username || 'Chưa đặt tên'}
                                </Text>
                                <Text style={styles.adminUserTextEmail}>{user.email}</Text>
                                <View style={styles.adminRoleBadges}>
                                  <View style={[styles.roleBadge, isUserAdmin ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
                                    <Text style={styles.roleBadgeText}>{user.role || 'USER'}</Text>
                                  </View>
                                  {isUserPremium && (
                                    <View style={[styles.roleBadge, styles.roleBadgePremium]}>
                                      <Text style={styles.roleBadgeText}>PREMIUM</Text>
                                    </View>
                                  )}
                                </View>
                              </View>

                              <View style={styles.adminUserActions}>
                                <Pressable 
                                  onPress={() => updateUserByAdmin(user.id, { role: isUserAdmin ? 'USER' : 'ADMIN' })}
                                  style={[styles.adminActionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}
                                >
                                  <Text style={[styles.adminActionBtnText, { color: theme.primary || '#FF9F1C' }]}>Đổi Quyền</Text>
                                </Pressable>
                                <Pressable 
                                  onPress={() => updateUserByAdmin(user.id, { isPremium: !isUserPremium })}
                                  style={[styles.adminActionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.05)', marginTop: 8 }]}
                                >
                                  <Text style={[styles.adminActionBtnText, { color: '#FFD700' }]}>Premium</Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })
                    ) : (
                      <Text style={styles.emptyText}>Chưa có thành viên nào.</Text>
                    )}
                  </View>
                )}

                {adminTab === 'posts' && (
                  <View style={styles.adminTabContent}>
                    {/* Search Bar */}
                    <View style={[styles.adminSearchContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                      <Ionicons name="search" size={16} color="rgba(255,248,231,0.4)" style={{ marginRight: 8 }} />
                      <TextInput 
                        value={postSearchQuery}
                        onChangeText={setPostSearchQuery}
                        style={[styles.adminSearchInput, { color: theme.text }]}
                        placeholder="Tìm bài viết theo nội dung hoặc tác giả..."
                        placeholderTextColor="rgba(255,248,231,0.4)"
                      />
                      {postSearchQuery ? (
                        <Pressable onPress={() => setPostSearchQuery('')}>
                          <Ionicons name="close-circle" size={16} color="rgba(255,248,231,0.4)" />
                        </Pressable>
                      ) : null}
                    </View>

                    {/* Posts List */}
                    {communityPosts && communityPosts.length > 0 ? (
                      communityPosts
                        .filter((p: any) => {
                          const query = postSearchQuery.toLowerCase();
                          return (p.content || '').toLowerCase().includes(query) || 
                                 (p.username || '').toLowerCase().includes(query);
                        })
                        .map((post: any) => (
                          <View key={post.id} style={[styles.adminPostCard, { backgroundColor: theme.card || 'rgba(255,255,255,0.03)', borderColor: theme.cardBorder }]}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                <Ionicons name="person-circle" size={18} color='#FF9F1C' style={{ marginRight: 4 }} />
                                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                                  {post.username}
                                </Text>
                                <Text style={{ color: 'rgba(255,248,231,0.3)', fontSize: 10, marginLeft: 8 }}>
                                  {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                </Text>
                              </View>
                              <Text style={[styles.adminPostContent, { color: theme.text }]} numberOfLines={3}>
                                {post.content}
                              </Text>
                              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                                <Text style={{ color: 'rgba(255,248,231,0.4)', fontSize: 11 }}>
                                  ❤️ {post.likes?.length || 0} thích
                                </Text>
                                <Text style={{ color: 'rgba(255,248,231,0.4)', fontSize: 11 }}>
                                  💬 {post.comments?.length || 0} bình luận
                                </Text>
                              </View>
                            </View>

                            <Pressable 
                              onPress={() => {
                                Alert.alert(
                                  'Xác nhận xóa',
                                  'Bạn có chắc chắn muốn xóa bài viết này khỏi bảng tin cộng đồng không?',
                                  [
                                    { text: 'Hủy', style: 'cancel' },
                                    { text: 'Xóa bài', style: 'destructive', onPress: () => deleteCommunityPost(post.id) }
                                  ]
                                );
                              }}
                              style={styles.adminPostDeleteBtn}
                            >
                              <Ionicons name="trash-outline" size={20} color="#FF5B5B" />
                            </Pressable>
                          </View>
                        ))
                    ) : (
                      <Text style={styles.emptyText}>Chưa có bài đăng nào trên cộng đồng.</Text>
                    )}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profileHeaderLeft}>
              <Pressable onPress={pickAndUploadAvatar} style={styles.avatarContainer}>
                <Image source={{ uri: avatar }} style={styles.avatar} onError={() => setAvatarUri(DEFAULT_AVATAR)} />
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={12} color="#FFF" />
                </View>
              </Pressable>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {userProfile?.firstName || 'gakon'} ({currentUser?.username || '0933763682'})
                </Text>
                
                {/* Admin Role Badge */}
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>🔑 Quản trị viên</Text>
                </View>
                
                <Text style={[styles.profileGoal, { color: theme.textSecondary }]}>Mục tiêu: {goalLabel}</Text>
              </View>
            </View>
            <Pressable 
              onPress={() => setShowSettings(!showSettings)} 
              style={[styles.gearButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)', borderColor: theme.cardBorder }]}
            >
              <Ionicons name="settings-outline" size={24} color={theme.text} />
            </Pressable>
          </View>

          {status ? <Text style={styles.statusText}>{status}</Text> : null}

          {/* Toggleable Settings Panel */}
          {showSettings && (
            <View style={[styles.settingsPanel, { borderColor: theme.cardBorder, backgroundColor: theme.card }]}>
              <Text style={[styles.settingsTitle, { color: theme.textMuted }]}>CÀI ĐẶT HỆ THỐNG</Text>
              <Pressable onPress={toggleTheme} style={styles.settingRow}>
                <Text style={[styles.settingText, { color: theme.text }]}>Giao diện</Text>
                <Text style={[styles.settingValue, { color: theme.primary }]}>{isDark ? 'Tối' : 'Sáng'}</Text>
              </Pressable>
              <Pressable onPress={pickAndUploadAvatar} style={styles.settingRow}>
                <Text style={[styles.settingText, { color: theme.text }]}>Đổi ảnh đại diện</Text>
                <Text style={[styles.settingValue, { color: theme.primary }]}>Đổi</Text>
              </Pressable>
              <Pressable onPress={() => setProfileOpen(true)} style={styles.settingRow}>
                <Text style={[styles.settingText, { color: theme.text }]}>Sửa thông tin hồ sơ</Text>
                <Text style={[styles.settingValue, { color: theme.primary }]}>Sửa</Text>
              </Pressable>
              <Pressable onPress={() => setWeightOpen(true)} style={styles.settingRow}>
                <Text style={[styles.settingText, { color: theme.text }]}>Ghi chỉ số cân nặng</Text>
                <Text style={[styles.settingValue, { color: theme.primary }]}>Ghi</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/activity-schedule')} style={styles.settingRow}>
                <Text style={[styles.settingText, { color: theme.text }]}>Lịch hoạt động & Nhắc nhở ⏰</Text>
                <Text style={[styles.settingValue, { color: theme.primary }]}>Cài đặt</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/premium')} style={styles.settingRow}>
                <Text style={[styles.settingText, { color: theme.text }]}>Gói Premium</Text>
                <Text style={[styles.settingValue, { color: isPremium ? '#FFD54A' : theme.primary }]}>{isPremium ? 'Đang sử dụng 👑' : 'Xem quyền lợi'}</Text>
              </Pressable>
              {isAdmin && (
                <Pressable onPress={() => setAdminOpen(true)} style={styles.settingRow}>
                  <Text style={[styles.settingText, { color: theme.text, fontWeight: '700' }]}>Trang quản trị (Admin) 🔑</Text>
                  <Text style={[styles.settingValue, { color: theme.primary }]}>Quản lý</Text>
                </Pressable>
              )}
              <Pressable onPress={() => { clearAllData(); setStatus('Đã xóa dữ liệu cục bộ.'); }} style={styles.settingRow}>
                <Text style={[styles.settingText, { color: theme.text }]}>Dữ liệu ứng dụng</Text>
                <Text style={[styles.settingValue, { color: theme.danger }]}>Xóa dữ liệu</Text>
              </Pressable>
              <Pressable onPress={logout} style={styles.settingRow}>
                <Text style={[styles.settingText, { color: theme.text }]}>Đăng xuất</Text>
                <Text style={[styles.settingValue, { color: theme.danger }]}>Đăng xuất</Text>
              </Pressable>
            </View>
          )}

          {/* Custom BMI Slider Card */}
          <View style={[styles.bmiSliderCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.bmiHeaderRow}>
              <Text style={[styles.bmiLabel, { color: theme.textMuted }]}>Chỉ số BMI hiện tại</Text>
              <Text style={[styles.bmiValueText, { color: theme.primary }]}>{bmiVal} ({bmiNote})</Text>
            </View>
            
            <View style={styles.bmiSliderTrackWrapper}>
              {/* Colored Track Segments */}
              <View style={styles.bmiSliderTrack}>
                <View style={[styles.bmiSegment, { backgroundColor: '#3498db', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }]} />
                <View style={[styles.bmiSegment, { backgroundColor: '#2ecc71' }]} />
                <View style={[styles.bmiSegment, { backgroundColor: '#f39c12' }]} />
                <View style={[styles.bmiSegment, { backgroundColor: '#e74c3c', borderTopRightRadius: 3, borderBottomRightRadius: 3 }]} />
              </View>
              {/* Pointer Marker */}
              <View style={[styles.bmiMarker, { left: `${Math.min(96, Math.max(2, (bmiVal - 15) / (35 - 15) * 100))}%` }]} />
            </View>

            <View style={styles.bmiScaleLabelsRow}>
              <Text style={[styles.scaleLabel, { color: theme.textMuted }]}>15.0</Text>
              <Text style={[styles.scaleLabel, { color: theme.textMuted }]}>18.5</Text>
              <Text style={[styles.scaleLabel, { color: theme.textMuted }]}>25.0</Text>
              <Text style={[styles.scaleLabel, { color: theme.textMuted }]}>30.0</Text>
              <Text style={[styles.scaleLabel, { color: theme.textMuted }]}>35.0</Text>
            </View>
          </View>

          {/* Custom Weight Trend Chart Card */}
          <View style={[styles.weightChartCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.chartHeaderRow}>
              <Text style={[styles.chartTitleText, { color: theme.text }]}>Biến động cân nặng</Text>
              <Pressable onPress={() => setWeightOpen(true)} style={[styles.logWeightSmallBtn, { backgroundColor: theme.primary }]}>
                <Ionicons name="add" size={14} color="#100E0C" />
                <Text style={styles.logWeightSmallBtnText}>Ghi chỉ số</Text>
              </Pressable>
            </View>

            <View style={{ height: 160, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
              {!weightLogs || weightLogs.length === 0 ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
                  <Ionicons name="analytics-outline" size={36} color={theme.textMuted} style={{ marginBottom: 8, opacity: 0.6 }} />
                  <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', fontWeight: '500' }}>
                    Chưa có dữ liệu biến động cân nặng.{'\n'}Nhấn "Ghi chỉ số" để bắt đầu theo dõi!
                  </Text>
                </View>
              ) : (
                <Svg height="140" width="300">
                  {/* Grid Lines */}
                  {[0, 1, 2, 3].map((val, idx) => {
                    const y = 20 + idx * 30;
                    return (
                      <Line key={idx} x1="30" y1={y} x2="290" y2={y} stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                    );
                  })}
                  
                  {/* Bars & Labels */}
                  {(() => {
                    const dateMap = new Map<string, any>();
                    weightLogs.forEach(l => {
                      if (!dateMap.has(l.loggedDate)) {
                        dateMap.set(l.loggedDate, l);
                      }
                    });
                    const list = Array.from(dateMap.values());
                    list.sort((a, b) => a.loggedDate.localeCompare(b.loggedDate));
                    const displayLogs = list.slice(-6);
                    
                    const minW = Math.min(...displayLogs.map(l => l.weightKg)) - 2;
                    const maxW = Math.max(...displayLogs.map(l => l.weightKg)) + 2;
                    const range = maxW - minW || 10;
                    
                    return displayLogs.map((item, idx) => {
                      const x = 50 + idx * 40;
                      const h = ((item.weightKg - minW) / range) * 70 + 20; // height from baseline
                      const y = 110 - h;
                      
                      return (
                        <G key={idx}>
                          {/* Column Bar */}
                          <Rect 
                            x={x - 10} 
                            y={y} 
                            width="20" 
                            height={h} 
                            fill={idx === displayLogs.length - 1 ? theme.primary : 'rgba(255, 159, 28, 0.3)'} 
                            rx="5"
                          />
                          {/* Value above bar */}
                          <SvgText 
                            x={x} 
                            y={y - 6} 
                            fill={theme.text} 
                            fontSize="10" 
                            fontWeight="800" 
                            textAnchor="middle"
                          >
                            {item.weightKg}
                          </SvgText>
                          {/* Date below bar */}
                          <SvgText 
                            x={x} 
                            y="125" 
                            fill={theme.textMuted} 
                            fontSize="9" 
                            fontWeight="600" 
                            textAnchor="middle"
                          >
                            {item.loggedDate.includes('-') ? item.loggedDate.substring(5) : item.loggedDate}
                          </SvgText>
                        </G>
                      );
                    });
                  })()}
                </Svg>
              )}
            </View>
          </View>

          {/* Biology indicators grid (AI Computed) */}
          <View style={styles.indicatorsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Chỉ số sinh học (AI Computed)</Text>
            <View style={styles.grid}>
              <View style={[styles.gridCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.gridCardLabel, { color: theme.textSecondary }]}>BMI (Thể trạng)</Text>
                <Text style={[styles.gridCardValue, { color: '#FF9F1C' }]}>{bmiVal}</Text>
                <Text style={[styles.gridCardSub, { color: theme.textMuted }]}>{bmiNote}</Text>
              </View>
              <View style={[styles.gridCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.gridCardLabel, { color: theme.textSecondary }]}>BMR (Năng lượng nền)</Text>
                <Text style={[styles.gridCardValue, { color: '#FF8008' }]}>{bmrVal} kcal</Text>
                <Text style={[styles.gridCardSub, { color: theme.textMuted }]}>Yêu cầu tối thiểu</Text>
              </View>
              <View style={[styles.gridCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.gridCardLabel, { color: theme.textSecondary }]}>TDEE (Vận động)</Text>
                <Text style={[styles.gridCardValue, { color: '#EE0979' }]}>{tdeeVal} kcal</Text>
                <Text style={[styles.gridCardSub, { color: theme.textMuted }]}>Năng lượng tiêu thụ</Text>
              </View>
              <View style={[styles.gridCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.gridCardLabel, { color: theme.textSecondary }]}>Mục tiêu (Calo nạp vào)</Text>
                <Text style={[styles.gridCardValue, { color: '#FF9F1C' }]}>{targetCal} kcal</Text>
                <Text style={[styles.gridCardSub, { color: theme.textMuted }]}>Hạn ngạch ngày</Text>
              </View>
              <View style={[styles.gridCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.gridCardLabel, { color: theme.textSecondary }]}>Tỉ lệ mỡ (Est)</Text>
                <Text style={[styles.gridCardValue, { color: '#A044FF' }]}>{bodyFatVal}%</Text>
                <Text style={[styles.gridCardSub, { color: theme.textMuted }]}>Body Fat Estimate</Text>
              </View>
              <View style={[styles.gridCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.gridCardLabel, { color: theme.textSecondary }]}>Khối lượng nạc</Text>
                <Text style={[styles.gridCardValue, { color: '#FF9F1C' }]}>{leanMassVal} kg</Text>
                <Text style={[styles.gridCardSub, { color: theme.textMuted }]}>Lean Body Mass</Text>
              </View>
            </View>
          </View>

          {/* Macros Targets section */}
          <View style={styles.macrosSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Mục tiêu đa lượng (Macros)</Text>
            <View style={[styles.tableCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, { color: theme.textSecondary }]}>Đạm (Protein)</Text>
                <Text style={[styles.tableValue, { color: theme.text }]}>{userProfile?.targetProtein || 198}g / ngày</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, { color: theme.textSecondary }]}>Tinh bột (Carb)</Text>
                <Text style={[styles.tableValue, { color: theme.text }]}>{userProfile?.targetCarbs || 254}g / ngày</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, { color: theme.textSecondary }]}>Béo (Fat)</Text>
                <Text style={[styles.tableValue, { color: theme.text }]}>{userProfile?.targetFat || 50}g / ngày</Text>
              </View>
              <View style={styles.tableRowLast}>
                <Text style={[styles.tableLabel, { color: theme.textSecondary }]}>Nước</Text>
                <Text style={[styles.tableValue, { color: theme.text }]}>{userProfile?.targetWaterMl || 3000}ml / ngày</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      )}

        {/* Modals for profile and weight editing */}
        <Modal visible={profileOpen} transparent animationType="fade" onRequestClose={() => setProfileOpen(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          >
            <Pressable onPress={() => setProfileOpen(false)} style={StyleSheet.absoluteFill} />
            <View 
              style={{
                width: '100%',
                maxWidth: 440,
                backgroundColor: '#1E1A17',
                borderRadius: 24,
                borderWidth: 1.2,
                borderColor: 'rgba(255, 159, 28, 0.3)',
                padding: 20,
                maxHeight: '90%',
              }}
            >
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ gap: 14, paddingBottom: 10 }}>
                {/* Modal Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={[styles.modalTitle, { color: '#FFF8E7' }]}>Sửa hồ sơ cá nhân 👤</Text>
                  <Pressable onPress={() => setProfileOpen(false)} hitSlop={10}>
                    <Ionicons name="close-circle" size={24} color="rgba(255, 248, 231, 0.4)" />
                  </Pressable>
                </View>

                {/* Section 1: Name */}
                <View style={{ gap: 6 }}>
                  <Text style={{ color: 'rgba(255, 248, 231, 0.7)', fontSize: 12, fontWeight: '700' }}>Họ và tên</Text>
                  <View style={styles.doubleInput}>
                    <View style={styles.halfInput}>
                      <Text style={{ color: 'rgba(255, 248, 231, 0.5)', fontSize: 11, marginBottom: 4 }}>Tên *</Text>
                      <TextInput
                        value={firstName}
                        onChangeText={setFirstName}
                        style={[styles.input, { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 159, 28, 0.25)' }]}
                        placeholder="Tên"
                        placeholderTextColor="rgba(255, 248, 231, 0.35)"
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={{ color: 'rgba(255, 248, 231, 0.5)', fontSize: 11, marginBottom: 4 }}>Họ</Text>
                      <TextInput
                        value={lastName}
                        onChangeText={setLastName}
                        style={[styles.input, { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 159, 28, 0.25)' }]}
                        placeholder="Họ"
                        placeholderTextColor="rgba(255, 248, 231, 0.35)"
                      />
                    </View>
                  </View>
                </View>

                {/* Section 2: Metrics */}
                <View style={{ gap: 6 }}>
                  <Text style={{ color: 'rgba(255, 248, 231, 0.7)', fontSize: 12, fontWeight: '700' }}>Chỉ số cơ thể</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'rgba(255, 248, 231, 0.5)', fontSize: 11, marginBottom: 4 }}>Tuổi</Text>
                      <TextInput
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        style={[styles.input, { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 159, 28, 0.25)' }]}
                        placeholder="25"
                        placeholderTextColor="rgba(255, 248, 231, 0.35)"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'rgba(255, 248, 231, 0.5)', fontSize: 11, marginBottom: 4 }}>Cao (cm)</Text>
                      <TextInput
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        style={[styles.input, { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 159, 28, 0.25)' }]}
                        placeholder="175"
                        placeholderTextColor="rgba(255, 248, 231, 0.35)"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'rgba(255, 248, 231, 0.5)', fontSize: 11, marginBottom: 4 }}>Nặng (kg)</Text>
                      <TextInput
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        style={[styles.input, { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 159, 28, 0.25)' }]}
                        placeholder="70"
                        placeholderTextColor="rgba(255, 248, 231, 0.35)"
                      />
                    </View>
                  </View>
                </View>

                {/* Section 3: Gender */}
                <View style={{ gap: 6 }}>
                  <Text style={{ color: 'rgba(255, 248, 231, 0.7)', fontSize: 12, fontWeight: '700' }}>Giới tính</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[
                      { id: 'male', label: '♂ Nam' },
                      { id: 'female', label: '♀ Nữ' },
                      { id: 'other', label: '⚥ Khác' },
                    ].map(item => (
                      <Pressable
                        key={item.id}
                        onPress={() => setGender(item.id as any)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 12,
                          borderWidth: 1.2,
                          borderColor: gender === item.id ? '#FF9F1C' : 'rgba(255, 255, 255, 0.1)',
                          backgroundColor: gender === item.id ? 'rgba(255, 159, 28, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: gender === item.id ? '#FF9F1C' : 'rgba(255, 248, 231, 0.7)', fontWeight: '800', fontSize: 13 }}>
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Section 4: Activity Level */}
                <View style={{ gap: 6 }}>
                  <Text style={{ color: 'rgba(255, 248, 231, 0.7)', fontSize: 12, fontWeight: '700' }}>Mức độ vận động</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { id: 'sedentary', label: 'Ít vận động' },
                      { id: 'lightly_active', label: 'Vận động nhẹ' },
                      { id: 'moderately_active', label: 'Vận động vừa' },
                      { id: 'very_active', label: 'Vận động nhiều' },
                      { id: 'athlete', label: 'Vận động viên' },
                    ].map(item => (
                      <Pressable
                        key={item.id}
                        onPress={() => setActivityLevel(item.id as any)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: activityLevel === item.id ? '#FF9F1C' : 'rgba(255, 255, 255, 0.1)',
                          backgroundColor: activityLevel === item.id ? 'rgba(255, 159, 28, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        <Text style={{ color: activityLevel === item.id ? '#FF9F1C' : 'rgba(255, 248, 231, 0.7)', fontWeight: '700', fontSize: 12 }}>
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Section 5: Target Goal */}
                <View style={{ gap: 6 }}>
                  <Text style={{ color: 'rgba(255, 248, 231, 0.7)', fontSize: 12, fontWeight: '700' }}>Mục tiêu sức khỏe</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { id: 'weight_loss', label: '📉 Giảm cân' },
                      { id: 'weight_gain', label: '📈 Tăng cân' },
                      { id: 'maintain_weight', label: '⚖️ Giữ cân' },
                      { id: 'muscle_gain', label: '🏋️‍♂️ Tăng cơ' },
                      { id: 'healthy_lifestyle', label: '🥗 Sống khỏe' },
                    ].map(item => (
                      <Pressable
                        key={item.id}
                        onPress={() => setTargetGoal(item.id as any)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: targetGoal === item.id ? '#FF9F1C' : 'rgba(255, 255, 255, 0.1)',
                          backgroundColor: targetGoal === item.id ? 'rgba(255, 159, 28, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        <Text style={{ color: targetGoal === item.id ? '#FF9F1C' : 'rgba(255, 248, 231, 0.7)', fontWeight: '700', fontSize: 12 }}>
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Action Buttons */}
                <Pressable onPress={saveProfile} style={{ marginTop: 8 }}>
                  <View style={[styles.saveButton, { backgroundColor: '#FF9F1C' }]}>
                    <Text style={[styles.saveText, { color: '#100E0C', fontWeight: '900', fontSize: 15 }]}>Lưu thay đổi</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => setProfileOpen(false)} style={styles.cancel}>
                  <Text style={{ color: 'rgba(255, 248, 231, 0.5)', fontWeight: '800' }}>Hủy bỏ</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={weightOpen} transparent animationType="fade" onRequestClose={() => setWeightOpen(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          >
            <Pressable onPress={() => setWeightOpen(false)} style={StyleSheet.absoluteFill} />
            <View 
              style={{
                width: '100%',
                maxWidth: 400,
                backgroundColor: '#1E1A17',
                borderRadius: 24,
                borderWidth: 1.2,
                borderColor: 'rgba(255, 159, 28, 0.25)',
                padding: 20,
                gap: 10,
                maxHeight: '85%',
              }}
            >
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
                <Text style={[styles.modalTitle, { color: '#FFFFFF', marginBottom: 6 }]}>Ghi chỉ số cơ thể ⚖️</Text>
                
                <Text style={{ color: 'rgba(255, 248, 231, 0.6)', fontSize: 12, fontWeight: '700', marginTop: 4 }}>Cân nặng (kg)</Text>
                <TextInput 
                  value={weight} 
                  onChangeText={setWeight} 
                  keyboardType="numeric" 
                  style={[styles.input, { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 159, 28, 0.25)', marginTop: 4 }]} 
                  placeholder="VD: 70.5" 
                  placeholderTextColor="rgba(255, 248, 231, 0.4)" 
                />
                
                <Text style={{ color: 'rgba(255, 248, 231, 0.6)', fontSize: 12, fontWeight: '700', marginTop: 8 }}>Vòng eo (cm - tùy chọn)</Text>
                <TextInput 
                  value={waist} 
                  onChangeText={setWaist} 
                  keyboardType="numeric" 
                  style={[styles.input, { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 159, 28, 0.25)', marginTop: 4 }]} 
                  placeholder="VD: 78" 
                  placeholderTextColor="rgba(255, 248, 231, 0.4)" 
                />

                <Pressable onPress={saveWeight} style={{ marginTop: 14 }}>
                  <View style={[styles.saveButton, { backgroundColor: '#FF9F1C' }]}>
                    <Text style={[styles.saveText, { color: '#100E0C', fontWeight: '900' }]}>Lưu cân nặng</Text>
                  </View>
                </Pressable>
                
                <Pressable onPress={() => setWeightOpen(false)} style={styles.cancel}>
                  <Text style={{ color: 'rgba(255, 248, 231, 0.5)', fontWeight: '800' }}>Hủy</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>


      </SafeAreaView>
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
    gap: 18,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  profileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#FF9F1C',
    padding: 2,
    position: 'relative' as const,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarEditBadge: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9F1C',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#10120F',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: '#FF9F1C',
    fontSize: 18,
    fontWeight: '900',
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF9F0A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  adminBadgeText: {
    color: '#10120F',
    fontWeight: '900',
    fontSize: 10,
  },
  profileGoal: {
    color: '#FFF8E7',
    fontSize: 13,
    fontWeight: '700',
  },
  gearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusText: {
    color: '#FF9F1C',
    fontSize: 13,
    fontWeight: '800',
  },
  
  // Settings Panel
  settingsPanel: {
    backgroundColor: '#1E1A17',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 159, 28, 0.15)',
    padding: 12,
    gap: 2,
    marginTop: 4,
  },
  settingsTitle: {
    color: 'rgba(255, 248, 231, 0.45)',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.2,
    marginLeft: 14,
    marginVertical: 6,
  },
  settingRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingText: {
    fontSize: 14,
    fontWeight: '800',
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '900',
  },

  // Biology Indicators Section
  indicatorsSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF8E7',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#1E1A17',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 28, 0.35)',
    borderRadius: 20,
    padding: 14,
    gap: 4,
  },
  gridCardLabel: {
    color: 'rgba(255, 248, 231, 0.54)',
    fontSize: 11,
    fontWeight: '800',
  },
  gridCardValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  gridCardSub: {
    color: 'rgba(255, 248, 231, 0.44)',
    fontSize: 10,
    fontWeight: '700',
  },

  // Macros Targets section
  macrosSection: {
    gap: 10,
  },
  tableCard: {
    backgroundColor: '#1E1A17',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 28, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tableRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  tableLabel: {
    color: 'rgba(255, 248, 231, 0.74)',
    fontSize: 14,
    fontWeight: '800',
  },
  tableValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  // Modals styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: {
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  input: {
    borderWidth: 1.2,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  doubleInput: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  saveButton: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveText: {
    color: '#20231D',
    fontWeight: '900',
  },
  cancel: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Admin Dashboard Modal Styles
  adminModalCard: {
    maxHeight: 560,
  },
  adminStatsSection: {
    marginBottom: 16,
  },
  adminSubTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingLeft: 4,
  },
  adminStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  adminStatCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  adminStatValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF9F1C',
  },
  adminStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 248, 231, 0.4)',
    marginTop: 2,
  },
  adminUsersSection: {
    width: '100%',
  },
  adminUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginTop: 8,
  },
  adminUserTextName: {
    fontSize: 13,
    fontWeight: '900',
  },
  adminUserTextEmail: {
    fontSize: 11,
    color: 'rgba(255, 248, 231, 0.4)',
    marginTop: 2,
  },
  adminRoleBadges: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeUser: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(255, 159, 10, 0.16)',
  },
  roleBadgePremium: {
    backgroundColor: 'rgba(255, 215, 0, 0.16)',
  },
  roleBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  adminUserActions: {
    alignItems: 'flex-end',
  },
  adminActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  adminActionBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  // Full-screen Admin Panel Styles
  adminFullScreenContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  adminBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBackText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 2,
  },
  adminHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  adminRefreshBtn: {
    padding: 6,
  },
  adminTabs: {
    flexDirection: 'row',
    marginVertical: 14,
    gap: 8,
  },
  adminTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  adminTabActive: {
    backgroundColor: '#FF9F1C',
    borderColor: '#FF9F1C',
  },
  adminTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF9F1C',
  },
  adminTabTextActive: {
    color: '#10120F',
  },
  adminTabContent: {
    flex: 1,
  },
  adminSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  adminSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  adminSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  adminUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    marginBottom: 10,
  },
  adminPostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    marginBottom: 10,
  },
  adminPostContent: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  adminPostDeleteBtn: {
    padding: 10,
    backgroundColor: 'rgba(255, 91, 91, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 91, 91, 0.2)',
  },
  emptyText: {
    color: 'rgba(255, 248, 231, 0.4)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 30,
  },
  // Chart styles
  chartContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  chartFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  chartFilterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chartFilterBtnActive: {
    backgroundColor: '#FF9F1C',
    borderColor: '#FF9F1C',
  },
  chartFilterBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF9F1C',
  },
  chartFilterBtnTextActive: {
    color: '#10120F',
  },
  chartVisualizer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.2,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 14,
    height: 200,
    alignItems: 'center',
  },
  subFiltersRow: {
    width: '100%',
    marginVertical: 4,
    alignItems: 'center',
  },
  subFiltersList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  subFiltersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  subFilterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 42,
    alignItems: 'center',
  },
  subFilterBtnActive: {
    backgroundColor: 'rgba(35, 217, 120, 0.15)',
    borderColor: '#FF9F1C',
  },
  subFilterBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 248, 231, 0.6)',
  },
  subFilterBtnTextActive: {
    color: '#FF9F1C',
  },
  // Redesign styles
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // BMI Slider Card
  bmiSliderCard: {
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 18,
    gap: 12,
  },
  bmiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bmiLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  bmiValueText: {
    fontSize: 15,
    fontWeight: '900',
  },
  bmiSliderTrackWrapper: {
    height: 18,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  bmiSliderTrack: {
    height: 6,
    flexDirection: 'row',
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bmiSegment: {
    flex: 1,
    height: '100%',
  },
  bmiMarker: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF9F1C',
    top: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  bmiScaleLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  scaleLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 248, 231, 0.4)',
  },

  // Weight Chart Card
  weightChartCard: {
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 18,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartTitleText: {
    fontSize: 14,
    fontWeight: '900',
  },
  logWeightSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  logWeightSmallBtnText: {
    color: '#100E0C',
    fontSize: 11,
    fontWeight: '900',
  },
});
