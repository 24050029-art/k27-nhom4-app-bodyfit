import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput, View, Image, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalDb, WeightLog } from '@/hooks/use-local-db';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';

export default function WeightTrackerScreen() {
  const { 
    userProfile, 
    weightLogs, 
    addWeightLog 
  } = useLocalDb();
  const { theme, isDark } = useAppTheme();
  const router = useRouter();

  const formatLoggedTime = (loggedAt: string) => {
    if (!loggedAt) return '';
    try {
      if (loggedAt.length <= 8 && loggedAt.includes(':')) return loggedAt;
      const date = new Date(loggedAt);
      if (isNaN(date.getTime())) return loggedAt;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return loggedAt;
    }
  };

  // Logger Form States
  const [weightKg, setWeightKg] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [chestCm, setChestCm] = useState('');
  const [hipsCm, setHipsCm] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isAddingLog, setIsAddingLog] = useState(false);

  // Before / After photo comparison selector states
  const [beforeLogId, setBeforeLogId] = useState<string>('');
  const [afterLogId, setAfterLogId] = useState<string>('');

  const handleSubmitLog = async () => {
    const wt = parseFloat(weightKg);
    if (!wt) {
      alert('Vui lòng nhập cân nặng hợp lệ.');
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
    alert('Đã lưu cân nặng & số đo cơ thể thành công! 📊');
  };

  const beforePhoto = weightLogs.find(l => l.id === beforeLogId)?.photoUrl;
  const afterPhoto = weightLogs.find(l => l.id === afterLogId)?.photoUrl;

  const logsWithPhotos = weightLogs.filter(l => l.photoUrl);

  // 1. Calculate weight change vs 7 days ago and 30 days ago (LTAPP-57)
  const sortedLogs = useMemo(() => {
    return [...weightLogs].sort((a, b) => new Date(b.loggedDate).getTime() - new Date(a.loggedDate).getTime());
  }, [weightLogs]);

  const latestLog = sortedLogs[0];

  const changeVs7Days = useMemo(() => {
    if (!latestLog || sortedLogs.length < 2) return null;
    const nowTime = new Date(latestLog.loggedDate).getTime();
    const sevenDaysAgoLog = sortedLogs.find(l => {
      const diffDays = Math.abs((nowTime - new Date(l.loggedDate).getTime()) / (1000 * 3600 * 24));
      return diffDays >= 5 && diffDays <= 12;
    }) || sortedLogs[sortedLogs.length - 1];

    if (sevenDaysAgoLog && sevenDaysAgoLog.id !== latestLog.id) {
      const diff = latestLog.weightKg - sevenDaysAgoLog.weightKg;
      return Math.round(diff * 10) / 10;
    }
    return null;
  }, [latestLog, sortedLogs]);

  const changeVs30Days = useMemo(() => {
    if (!latestLog || sortedLogs.length < 2) return null;
    const nowTime = new Date(latestLog.loggedDate).getTime();
    const thirtyDaysAgoLog = sortedLogs.find(l => {
      const diffDays = Math.abs((nowTime - new Date(l.loggedDate).getTime()) / (1000 * 3600 * 24));
      return diffDays >= 20 && diffDays <= 40;
    }) || sortedLogs[sortedLogs.length - 1];

    if (thirtyDaysAgoLog && thirtyDaysAgoLog.id !== latestLog.id) {
      const diff = latestLog.weightKg - thirtyDaysAgoLog.weightKg;
      return Math.round(diff * 10) / 10;
    }
    return null;
  }, [latestLog, sortedLogs]);

  // 2. Check for abnormal weight spikes/drops (LTAPP-59)
  const abnormalAlert = useMemo(() => {
    if (sortedLogs.length < 2) return null;
    const log1 = sortedLogs[0];
    const log2 = sortedLogs[1];
    const dayDiff = Math.abs(new Date(log1.loggedDate).getTime() - new Date(log2.loggedDate).getTime()) / (1000 * 3600 * 24);
    const weightDiff = Math.abs(log1.weightKg - log2.weightKg);

    if (dayDiff <= 4 && weightDiff >= 1.8) {
      return {
        diffKg: Math.round(weightDiff * 10) / 10,
        isIncrease: log1.weightKg > log2.weightKg,
        days: Math.max(1, Math.round(dayDiff))
      };
    }
    return null;
  }, [sortedLogs]);

  // 3. Estimate goal completion date (LTAPP-60)
  const goalPrediction = useMemo(() => {
    if (!latestLog || !userProfile?.weightKg) return null;
    const currentWeight = latestLog.weightKg;
    const targetWeight = userProfile.weightKg;
    const diffToGoal = targetWeight - currentWeight;

    if (Math.abs(diffToGoal) < 0.3) {
      return { isReached: true, message: '🎉 Chúc mừng! Bạn đã đạt mốc cân nặng mục tiêu!' };
    }

    let weeklyRate = 0.5;
    if (sortedLogs.length >= 2) {
      const oldest = sortedLogs[sortedLogs.length - 1];
      const daysDiff = (new Date(latestLog.loggedDate).getTime() - new Date(oldest.loggedDate).getTime()) / (1000 * 3600 * 24);
      if (daysDiff >= 7) {
        const totalChange = Math.abs(latestLog.weightKg - oldest.weightKg);
        const rate = (totalChange / daysDiff) * 7;
        if (rate > 0.1 && rate < 3.0) {
          weeklyRate = Math.round(rate * 10) / 10;
        }
      }
    }

    const weeksNeeded = Math.abs(diffToGoal) / weeklyRate;
    const daysNeeded = Math.round(weeksNeeded * 7);

    const estDate = new Date();
    estDate.setDate(estDate.getDate() + daysNeeded);
    const dateStr = `${estDate.getDate()}/${estDate.getMonth() + 1}/${estDate.getFullYear()}`;

    return {
      isReached: false,
      targetWeight,
      currentWeight,
      diffToGoal: Math.round(Math.abs(diffToGoal) * 10) / 10,
      isLossGoal: diffToGoal < 0,
      weeklyRate,
      daysNeeded,
      dateStr
    };
  }, [latestLog, userProfile, sortedLogs]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <LinearGradient colors={isDark ? ['#0F0D0B', '#171411', '#0A0907'] : ['#FAF7EF', '#FFFDF9', '#FAF7EF']} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>✕ Quay lại Dashboard</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Nhật Ký Cân Nặng ⚖️</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 1. Comparison & Summary Metrics (LTAPP-57) */}
        <View style={styles.comparisonRow}>
          <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>So với tuần trước</Text>
            <Text style={[styles.metricValue, changeVs7Days !== null && changeVs7Days < 0 ? { color: '#10B981' } : changeVs7Days !== null && changeVs7Days > 0 ? { color: '#EF4444' } : { color: theme.text }]}>
              {changeVs7Days !== null ? (changeVs7Days > 0 ? `+${changeVs7Days} kg` : `${changeVs7Days} kg`) : 'Chưa có data'}
            </Text>
            <Text style={[styles.metricSub, { color: theme.textMuted }]}>Mốc 7 ngày trước</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>So với tháng trước</Text>
            <Text style={[styles.metricValue, changeVs30Days !== null && changeVs30Days < 0 ? { color: '#10B981' } : changeVs30Days !== null && changeVs30Days > 0 ? { color: '#EF4444' } : { color: theme.text }]}>
              {changeVs30Days !== null ? (changeVs30Days > 0 ? `+${changeVs30Days} kg` : `${changeVs30Days} kg`) : 'Chưa có data'}
            </Text>
            <Text style={[styles.metricSub, { color: theme.textMuted }]}>Mốc 30 ngày trước</Text>
          </View>
        </View>

        {/* 2. Abnormal Weight Change Warning Alert (LTAPP-59) */}
        {abnormalAlert && (
          <View style={styles.abnormalBanner}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#EF4444', fontSize: 14 }}>Cảnh báo biến động cân nặng bất thường!</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                Cân nặng của bạn vừa {abnormalAlert.isIncrease ? 'tăng' : 'giảm'} {abnormalAlert.diffKg} kg chỉ trong {abnormalAlert.days} ngày.
                Hãy đảm bảo uống đủ nước và tham khảo ý kiến bác sĩ/Coach nếu triệu chứng kéo dài.
              </Text>
            </View>
          </View>
        )}

        {/* 3. Goal Prediction Banner (LTAPP-60) */}
        {goalPrediction && (
          <View style={[styles.predictionCard, { backgroundColor: theme.card, borderColor: '#38BDF8' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🎯</Text>
              <Text style={{ color: '#38BDF8', fontWeight: '800', fontSize: 14 }}>Dự đoán mốc đạt mục tiêu</Text>
            </View>
            {goalPrediction.isReached ? (
              <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 14 }}>{goalPrediction.message}</Text>
            ) : (
              <View style={{ gap: 4 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
                  Dự kiến đạt mốc <Text style={{ color: '#FF9F1C' }}>{goalPrediction.targetWeight} kg</Text> vào ngày{' '}
                  <Text style={{ color: '#38BDF8', fontWeight: '800' }}>{goalPrediction.dateStr}</Text>
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  Còn {goalPrediction.diffToGoal} kg • Tốc độ trung bình: ~{goalPrediction.weeklyRate} kg/tuần
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Weight Trend visual chart simulation */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>Biểu đồ tiến trình cân nặng</Text>
          <Text style={{ fontSize: 13, color: theme.textMuted }}>
            Theo dõi xu hướng tăng cơ / giảm cân qua các mốc thời gian.
          </Text>
          
          {weightLogs.length === 0 ? (
            <Text style={{ textAlign: 'center', marginVertical: 20, color: theme.textMuted, fontSize: 13 }}>
              Chưa có dữ liệu để vẽ biểu đồ.
            </Text>
          ) : (
            <View style={styles.chartContainer}>
              <View style={[styles.chartBarRow, { borderColor: isDark ? 'rgba(255, 159, 28, 0.25)' : 'rgba(0, 0, 0, 0.1)' }]}>
                {weightLogs.slice(0, 7).reverse().map((log) => {
                  const weights = weightLogs.map(l => l.weightKg);
                  const minWt = Math.min(...weights) - 2;
                  const maxWt = Math.max(...weights) + 2;
                  const range = maxWt - minWt || 1;
                  const barHeightPct = ((log.weightKg - minWt) / range) * 100;
                  
                  return (
                    <View key={log.id} style={styles.chartCol}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: theme.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{log.weightKg}k</Text>
                      <View style={[styles.chartBar, { height: `${Math.max(20, Math.min(100, barHeightPct))}%`, backgroundColor: '#FF9F1C' }]} />
                      <Text style={{ fontSize: 8, marginTop: 4, color: theme.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                        {log.loggedDate.split('-').slice(1).reverse().join('/')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Logger Button */}
        {!isAddingLog ? (
          <Pressable 
            onPress={() => setIsAddingLog(true)} 
            style={[styles.primaryBtn, { backgroundColor: '#FF9F1C' }]}
          >
            <Text style={styles.btnText}>+ Cập nhật cân nặng & số đo cơ thể</Text>
          </Pressable>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.cardHeader}>
              <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>Cập nhật số đo mới</Text>
              <Pressable onPress={() => setIsAddingLog(false)}>
                <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 13 }}>Hủy</Text>
              </Pressable>
            </View>

            <View style={styles.formGrid}>
              <View style={styles.formCol}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Cân nặng (kg) *</Text>
                <TextInput
                  placeholder="VD: 70.5"
                  keyboardType="numeric"
                  value={weightKg}
                  onChangeText={setWeightKg}
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Tỉ lệ mỡ % (Body Fat)</Text>
                <TextInput
                  placeholder="VD: 18.5"
                  keyboardType="numeric"
                  value={bodyFatPct}
                  onChangeText={setBodyFatPct}
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
                />
              </View>
            </View>

            <View style={styles.formGrid}>
              <View style={styles.formCol}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Vòng ngực (cm)</Text>
                <TextInput
                  placeholder="VD: 98"
                  keyboardType="numeric"
                  value={chestCm}
                  onChangeText={setChestCm}
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Vòng eo (cm)</Text>
                <TextInput
                  placeholder="VD: 82"
                  keyboardType="numeric"
                  value={waistCm}
                  onChangeText={setWaistCm}
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Vòng mông (cm)</Text>
                <TextInput
                  placeholder="VD: 95"
                  keyboardType="numeric"
                  value={hipsCm}
                  onChangeText={setHipsCm}
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
                />
              </View>
            </View>

            <Text style={[styles.formLabel, { color: theme.text }]}>Ảnh chụp cơ thể (Dán URL ảnh minh họa)</Text>
            <TextInput
              placeholder="http://..."
              value={photoUrl}
              onChangeText={setPhotoUrl}
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
            />

            <Pressable onPress={handleSubmitLog} style={[styles.primaryBtn, { backgroundColor: '#FF9F1C', marginTop: Spacing.one }]}>
              <Text style={styles.btnText}>Lưu số đo</Text>
            </Pressable>
          </View>
        )}

        {/* Before / After Photo Comparison */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>So sánh ảnh Before / After 📸</Text>
          <Text style={{ fontSize: 13, color: theme.textMuted }}>
            Chọn hai mốc lịch sử có ảnh để thấy sự thay đổi cơ thể rõ nét.
          </Text>

          {logsWithPhotos.length < 1 ? (
            <Text style={{ textAlign: 'center', marginVertical: 12, color: theme.textMuted, fontSize: 13 }}>
              Vui lòng cập nhật số đo kèm ảnh chụp cơ thể để sử dụng tính năng này.
            </Text>
          ) : (
            <View style={{ gap: Spacing.two }}>
              <View style={styles.photoPickerRow}>
                <View style={{ flex: 1, marginRight: Spacing.one }}>
                  <Text style={{ fontSize: 10, marginBottom: 4, color: theme.textMuted, fontWeight: '700' }}>Trước (Before):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {logsWithPhotos.map(l => (
                      <Pressable 
                        key={l.id} 
                        onPress={() => setBeforeLogId(l.id)}
                        style={[styles.miniPhotoSelectTab, { backgroundColor: theme.card, borderColor: theme.cardBorder }, beforeLogId === l.id && { borderColor: '#FF9F1C' }]}
                      >
                        <Text style={{ fontSize: 9, color: theme.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{l.loggedDate.split('-').reverse().slice(0,2).join('/')}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, marginBottom: 4, color: theme.textMuted, fontWeight: '700' }}>Sau (After):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {logsWithPhotos.map(l => (
                      <Pressable 
                        key={l.id} 
                        onPress={() => setAfterLogId(l.id)}
                        style={[styles.miniPhotoSelectTab, { backgroundColor: theme.card, borderColor: theme.cardBorder }, afterLogId === l.id && { borderColor: '#30A0E0' }]}
                      >
                        <Text style={{ fontSize: 9, color: theme.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{l.loggedDate.split('-').reverse().slice(0,2).join('/')}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Before/After side-by-side view */}
              <View style={styles.beforeAfterFrame}>
                <View style={styles.imageHalf}>
                  <Text style={styles.photoLabel}>BEFORE</Text>
                  {beforePhoto ? (
                    <Image source={{ uri: beforePhoto }} style={styles.comparisonImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.emptyPhotoBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' }]}><Text style={{ fontSize: 28 }}>📷</Text></View>
                  )}
                </View>
                <View style={styles.imageHalf}>
                  <Text style={[styles.photoLabel, { color: '#30A0E0' }]}>AFTER</Text>
                  {afterPhoto ? (
                    <Image source={{ uri: afterPhoto }} style={styles.comparisonImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.emptyPhotoBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' }]}><Text style={{ fontSize: 28 }}>📷</Text></View>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* History Measurements Timeline */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={{ color: '#FF9F1C', fontWeight: '800', fontSize: 14 }}>Lịch sử số đo cơ thể</Text>
          {weightLogs.map(log => (
            <View key={log.id} style={[styles.timelineItem, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <View style={styles.timelineLeft}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{log.weightKg} kg</Text>
                <Text style={{ fontSize: 10, color: theme.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  {`${log.loggedDate} ${log.loggedAt ? `lúc ${formatLoggedTime(log.loggedAt)}` : ''}`}
                </Text>
              </View>
              
              <View style={styles.timelineRight}>
                {log.bodyFatPct && <Text style={{ fontSize: 11, color: theme.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>• Mỡ: {log.bodyFatPct}%</Text>}
                {log.waistCm && <Text style={{ fontSize: 11, color: theme.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>• Eo: {log.waistCm}cm</Text>}
                {log.chestCm && <Text style={{ fontSize: 11, color: theme.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>• Ngực: {log.chestCm}cm</Text>}
                {log.hipsCm && <Text style={{ fontSize: 11, color: theme.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>• Mông: {log.hipsCm}cm</Text>}
              </View>
            </View>
          ))}
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
  chartContainer: {
    height: 150,
    marginTop: Spacing.two,
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
    width: 25,
    borderRadius: 4,
    marginVertical: 4,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: Spacing.two,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  timelineLeft: {
    gap: 4,
  },
  timelineRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1E1A17',
    borderRadius: 14,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.2)',
  },
  metricLabel: {
    fontSize: 11,
    color: 'rgba(255, 248, 231, 0.6)',
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 9,
    color: 'rgba(255, 248, 231, 0.4)',
  },
  abnormalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.2,
    borderColor: '#EF4444',
    borderRadius: 14,
    padding: Spacing.two,
  },
  predictionCard: {
    backgroundColor: '#1E1A17',
    borderRadius: 14,
    padding: Spacing.two,
    borderWidth: 1.2,
    borderColor: '#38BDF8',
  },
});
