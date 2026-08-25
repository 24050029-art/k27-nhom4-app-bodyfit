import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Pressable, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalDb } from '@/hooks/use-local-db';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function AdminDashboardScreen() {
  const { 
    isAdmin, 
    getAdminDashboard,
    backendUrl,
    userToken
  } = useLocalDb();

  const theme = useTheme();
  const router = useRouter();

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdminStats = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminDashboard();
      setDashboardData(data);
    } catch (e) {
      console.error('Failed to load admin stats', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin]);

  const handleUpdateUser = async (userId: string, newRole?: string, newPremium?: boolean) => {
    if (userToken) {
      try {
        const res = await fetch(`${backendUrl}/v1/admin/users/${userId}/role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            ...(newRole && { role: newRole }),
            ...(newPremium !== undefined && { isPremium: newPremium })
          })
        });
        if (res.ok) {
          alert('Cập nhật người dùng thành công!');
          fetchAdminStats();
        }
      } catch (err) {
        console.warn('Failed to update user role on server', err);
      }
    } else {
      // Local State override
      setDashboardData((prev: any) => {
        if (!prev) return null;
        const updatedUsers = prev.users.map((u: any) => {
          if (u.id === userId) {
            return {
              ...u,
              ...(newRole && { role: newRole }),
              ...(newPremium !== undefined && { isPremium: newPremium })
            };
          }
          return u;
        });
        const premiumCount = updatedUsers.filter((u: any) => u.isPremium).length;
        const mockRevenue = premiumCount * 79000;
        
        return {
          ...prev,
          stats: {
            ...prev.stats,
            premiumUsers: premiumCount,
            estimatedMonthlyRevenueVND: mockRevenue,
            totalRevenueUSD: mockRevenue
          },
          users: updatedUsers
        };
      });
      alert('Cập nhật người dùng thành công (Chế độ giả lập)!');
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centerContainer}>
          <ThemedText style={{ fontSize: 40, marginBottom: Spacing.two }}>🔒</ThemedText>
          <ThemedText type="smallBold" themeColor="textSecondary" style={{ textAlign: 'center', marginBottom: Spacing.four }}>
            {"Quyền truy cập bị từ chối. Bạn không có quyền Quản trị viên. Hãy bật \"Admin Account\" ở Cài đặt để kiểm thử."}
          </ThemedText>
          <Pressable onPress={() => router.back()} style={[styles.primaryBtn, { backgroundColor: theme.primary, paddingHorizontal: Spacing.four }]}>
            <ThemedText style={styles.btnText}>Quay lại Dashboard</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>✕ Quay lại Dashboard</ThemedText>
        </Pressable>
        <ThemedText type="subtitle" style={styles.title}>Quản Trị Hệ Thống 🔑</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {isLoading || !dashboardData ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="code" style={{ marginTop: 8 }}>Đang kết nối API Admin...</ThemedText>
          </View>
        ) : (
          <>
            {/* Quick Metrics Dashboard stats cards */}
            <View style={styles.statsGrid}>
              <ThemedView type="backgroundElement" style={styles.statsCard}>
                <ThemedText type="small">Tổng Người Dùng</ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 24, fontWeight: '800', color: theme.primary }}>
                  {dashboardData.stats.totalUsers}
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10 }}>Tài khoản đã đăng ký</ThemedText>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.statsCard}>
                <ThemedText type="small">Tài Khoản Premium</ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 24, fontWeight: '800', color: '#F59E0B' }}>
                  {dashboardData.stats.premiumUsers}
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10 }}>Tỉ lệ Premium: {Math.round((dashboardData.stats.premiumUsers / (dashboardData.stats.totalUsers || 1)) * 100)}%</ThemedText>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.statsCard}>
                <ThemedText type="small">Doanh Thu Hệ Thống</ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 24, fontWeight: '800', color: theme.accent }}>
                  {Number(dashboardData.stats.estimatedMonthlyRevenueVND || 0).toLocaleString('vi-VN')}₫
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10 }}>Tổng doanh thu (Ước tính)</ThemedText>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.statsCard}>
                <ThemedText type="small">Tương Tác Bài Viết</ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 24, fontWeight: '800', color: '#6F8F3A' }}>
                  {dashboardData.stats.totalPosts}
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10 }}>Bài đăng cộng đồng</ThemedText>
              </ThemedView>
            </View>

            {/* Monthly Sales Revenue Chart */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>Phân tích Doanh thu Tháng (VNĐ) 📈</ThemedText>
              <View style={styles.chartContainer}>
                {(() => {
                  const maxRev = Math.max(...(dashboardData.monthlyData || []).map((d: any) => d.revenue || 0), 1);
                  return (dashboardData.monthlyData || []).map((data: any) => {
                    const barHeightPct = data.revenue > 0 ? Math.max(15, Math.round(((data.revenue || 0) / maxRev) * 80)) : 4;
                    const revText = data.revenue > 0 
                      ? `${(data.revenue / 1000).toLocaleString('vi-VN')}k`
                      : '0₫';
                    return (
                      <View key={data.month} style={styles.chartBarCol}>
                        <ThemedText type="code" style={{ fontSize: 9 }}>{revText}</ThemedText>
                        <View style={[styles.chartBar, { height: `${barHeightPct}%`, backgroundColor: '#F59E0B' }]} />
                        <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 10, marginTop: 4 }}>{data.month}</ThemedText>
                      </View>
                    );
                  });
                })()}
              </View>
            </ThemedView>

            {/* Users Administration list */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold" style={{ color: theme.primary, marginBottom: Spacing.one }}>Danh sách Quản lý Người dùng ({dashboardData.users.length})</ThemedText>
              <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
              
              {dashboardData.users.map((user: any) => (
                <View key={user.id} style={styles.userAdminRow}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="smallBold">{user.name} ({user.username})</ThemedText>
                    <ThemedText type="code" themeColor="textSecondary" style={{ fontSize: 11 }}>{user.email}</ThemedText>
                    <View style={styles.row}>
                      <ThemedView type="backgroundSelected" style={styles.roleTag}>
                        <ThemedText type="code" style={{ fontSize: 9 }}>{user.role}</ThemedText>
                      </ThemedView>
                      {user.isPremium ? (
                        <ThemedView type="backgroundSelected" style={[styles.roleTag, { borderColor: '#F59E0B', marginLeft: 6 }]}>
                          <ThemedText type="code" style={{ fontSize: 9, color: '#F59E0B', fontWeight: '700' }}>PREMIUM 👑</ThemedText>
                        </ThemedView>
                      ) : null}
                    </View>
                  </View>

                  {/* Actions buttons */}
                  <View style={styles.actionsBlock}>
                    <Pressable 
                      onPress={() => handleUpdateUser(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                      style={[styles.actionBtn, { backgroundColor: theme.backgroundSelected }]}
                    >
                      <ThemedText type="code" style={{ fontSize: 10 }}>
                        {user.role === 'ADMIN' ? 'Gỡ Admin' : 'Set Admin'}
                      </ThemedText>
                    </Pressable>
                    <Pressable 
                      onPress={() => handleUpdateUser(user.id, undefined, !user.isPremium)}
                      style={[styles.actionBtn, { backgroundColor: '#F59E0B', marginLeft: 6 }]}
                    >
                      <ThemedText type="code" style={{ fontSize: 10, color: '#ffffff' }}>
                        {user.isPremium ? 'Hủy Pre' : 'Set Pre'}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ThemedView>

          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
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
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.three,
  },
  loadingBox: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statsCard: {
    width: '47%',
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.one,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
    paddingBottom: 4,
    marginTop: Spacing.two,
  },
  chartBarCol: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartBar: {
    width: 35,
    borderRadius: 4,
    marginVertical: 4,
  },
  userAdminRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
    marginTop: 2,
  },
  actionsBlock: {
    flexDirection: 'row',
  },
  actionBtn: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
