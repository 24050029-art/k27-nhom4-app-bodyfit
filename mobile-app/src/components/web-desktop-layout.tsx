import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Platform, useWindowDimensions, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useLocalDb } from '@/hooks/use-local-db';
import { useAppTheme } from '@/context/ThemeContext';
import { DEFAULT_AVATAR } from '@/constants/theme';

interface WebDesktopLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { route: '/', label: 'Trang chủ', icon: 'home', badge: null },
  { route: '/workout', label: 'Tập luyện', icon: 'barbell', badge: 'New' },
  { route: '/coach', label: 'AI Coach', icon: 'sparkles', badge: 'AI' },
  { route: '/journal', label: 'Nhật ký & Bữa ăn', icon: 'book', badge: null },
  { route: '/explore', label: 'Cộng đồng', icon: 'globe-outline', badge: null },
  { route: '/weight-tracker', label: 'Ghi cân nặng', icon: 'stats-chart', badge: null },
  { route: '/settings', label: 'Hồ sơ & Cài đặt', icon: 'person', badge: null },
] as const;

export default function WebDesktopLayout({ children }: WebDesktopLayoutProps) {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 768;
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const { userProfile, isAdmin } = useLocalDb();
  const [mobileAlertOpen, setMobileAlertOpen] = useState(false);

  const normalizedPath = pathname === '' || pathname === '/index' ? '/' : pathname;

  if (!isWebDesktop) {
    return <View style={{ flex: 1, backgroundColor: theme.background }}>{children}</View>;
  }

  const avatar = userProfile?.avatarUrl || DEFAULT_AVATAR;

  const handleCameraScan = () => {
    setMobileAlertOpen(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#0A0907' : theme.background }]}>
      {/* LEFT SIDEBAR NAVIGATION */}
      <View style={[styles.sidebar, { backgroundColor: isDark ? '#13110E' : 'rgba(255, 252, 244, 0.98)', borderColor: isDark ? 'rgba(255, 159, 28, 0.18)' : 'rgba(0, 0, 0, 0.08)' }]}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="flash" size={20} color="#100E0C" />
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>BODYFIT</Text>
            <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>SỨC MẠNH VIỆT • WEB</Text>
          </View>
        </View>

        {/* AI Quick Camera Button */}
        <Pressable onPress={handleCameraScan} style={styles.scanBtn}>
          <Ionicons name="camera" size={18} color="#100E0C" style={{ marginRight: 8 }} />
          <Text style={styles.scanBtnText}>AI Quét Thực Phẩm</Text>
        </Pressable>

        {/* Navigation Items */}
        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.menuGroupTitle, { color: theme.textMuted }]}>MENU CHÍNH</Text>
          {navItems.map((item) => {
            const active = normalizedPath === item.route;
            return (
              <Pressable
                key={item.route}
                onPress={() => router.replace(item.route as any)}
                style={[
                  styles.navItem,
                  active && [styles.navItemActive, { backgroundColor: isDark ? 'rgba(255, 159, 28, 0.15)' : 'rgba(255, 159, 28, 0.14)', borderColor: '#FF9F1C' }],
                ]}
              >
                <Ionicons
                  name={(active ? item.icon : `${item.icon}-outline`) as any}
                  size={20}
                  color={active ? (isDark ? '#FF9F1C' : '#D97706') : theme.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <Text style={[styles.navItemText, { color: active ? (isDark ? '#FF9F1C' : '#D97706') : theme.textSecondary, fontWeight: active ? '900' : '700' }]}>{item.label}</Text>
                {item.badge ? (
                  <View style={[styles.badge, { backgroundColor: item.badge === 'AI' ? '#FF9F1C' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)' }]}>
                    <Text style={[styles.badgeText, { color: item.badge === 'AI' ? '#100E0C' : theme.text }]}>{item.badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}

          {isAdmin ? (
            <>
              <Text style={[styles.menuGroupTitle, { color: theme.textMuted, marginTop: 20 }]}>QUẢN TRỊ VIÊN</Text>
              <Pressable
                onPress={() => router.replace('/admin')}
                style={[
                  styles.navItem,
                  normalizedPath === '/admin' && [styles.navItemActive, { backgroundColor: 'rgba(255, 159, 28, 0.15)', borderColor: '#FF9F1C' }],
                ]}
              >
                <Ionicons name="key" size={20} color="#FF9F1C" style={{ marginRight: 12 }} />
                <Text style={[styles.navItemText, { color: '#FF9F1C', fontWeight: '800' }]}>Quản Trị Hệ Thống</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>

        {/* Sidebar Footer User Profile */}
        <View style={[styles.userFooter, { borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
          <Pressable onPress={() => router.replace('/settings')} style={styles.userFooterLeft}>
            <Image source={{ uri: avatar }} style={styles.userAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                {userProfile?.firstName || 'gakon'}
              </Text>
              <Text style={[styles.userRole, { color: theme.textMuted }]}>
                {isAdmin ? '🔑 Quản trị viên' : '⚡ Hội viên BodyFit'}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* RIGHT MAIN WORKSPACE */}
      <View style={[styles.mainWorkspace, { backgroundColor: isDark ? '#0A0907' : theme.background }]}>
        {/* Desktop Topbar Header */}
        <View style={[styles.topBar, { backgroundColor: isDark ? '#13110E' : 'rgba(255, 252, 244, 0.98)', borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
          <View style={styles.topBarLeft}>
            <Text style={[styles.topBarGreeting, { color: theme.textMuted }]}>Chào buổi sáng,</Text>
            <Text style={[styles.topBarTitle, { color: theme.text }]}>{userProfile?.firstName || 'Tài (gakon)'} 👋</Text>
          </View>

          <View style={styles.topBarRight}>
            {/* Health Indicators Pills */}
            <View style={[styles.pillStat, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <Ionicons name="flame" size={16} color="#FF9F1C" />
              <Text style={[styles.pillStatText, { color: theme.text }]}>Streak {userProfile?.streakDays || 0} ngày</Text>
            </View>
            <View style={[styles.pillStat, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <Ionicons name="trophy" size={16} color="#FFD700" />
              <Text style={[styles.pillStatText, { color: theme.text }]}>Cấp {userProfile?.level || 1}</Text>
            </View>

            {/* Theme Toggle Button */}
            <Pressable onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color="#FF9F1C" />
            </Pressable>

            {/* Notifications Button */}
            <Pressable onPress={() => router.push('/notifications')} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <Ionicons name="notifications-outline" size={18} color={theme.text} />
              <View style={styles.notifDot} />
            </Pressable>
          </View>
        </View>

        {/* Desktop Content Workspace Container */}
        <View style={styles.contentContainer}>
          <View style={styles.innerWorkspace}>
            {children}
          </View>
        </View>
      </View>

      {/* Custom Web Mobile Feature Alert Popup Modal */}
      <Modal visible={mobileAlertOpen} transparent animationType="fade" onRequestClose={() => setMobileAlertOpen(false)}>
        <View style={webModalStyles.overlay}>
          <View style={webModalStyles.card}>
            <View style={webModalStyles.iconWrap}>
              <Ionicons name="phone-portrait-outline" size={38} color="#FF9F1C" />
            </View>
            <Text style={webModalStyles.title}>Tính Năng Trên Điện Thoại</Text>
            <Text style={webModalStyles.desc}>
              Chức năng AI Quét thực phẩm qua Camera hiện chỉ khả dụng trên ứng dụng di động BodyFit. Vui lòng mở ứng dụng trên điện thoại để trải nghiệm!
            </Text>
            <Pressable onPress={() => setMobileAlertOpen(false)} style={webModalStyles.closeBtn}>
              <Text style={webModalStyles.closeBtnText}>Đã hiểu</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const webModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#181512',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 28, 0.4)',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 159, 28, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFF8E7',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    color: 'rgba(255, 248, 231, 0.7)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  closeBtn: {
    backgroundColor: '#FF9F1C',
    width: '100%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#100E0C',
    fontSize: 14,
    fontWeight: '900',
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  sidebar: {
    width: 265,
    height: '100%',
    borderRightWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FF9F1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#FF9F1C',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  brandTitle: {
    color: '#FFF8E7',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: 'rgba(255, 248, 231, 0.45)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scanBtn: {
    backgroundColor: '#FF9F1C',
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FF9F1C',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  scanBtnText: {
    color: '#100E0C',
    fontSize: 13,
    fontWeight: '900',
  },
  menuScroll: {
    flex: 1,
  },
  menuGroupTitle: {
    color: 'rgba(255, 248, 231, 0.4)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingLeft: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemActive: {
    borderColor: '#FF9F1C',
  },
  navItemText: {
    color: 'rgba(255, 248, 231, 0.7)',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  navItemTextActive: {
    fontWeight: '900',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  userFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  userFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FF9F1C',
  },
  userName: {
    color: '#FFF8E7',
    fontSize: 13,
    fontWeight: '800',
  },
  userRole: {
    color: 'rgba(255, 248, 231, 0.5)',
    fontSize: 11,
    fontWeight: '600',
  },
  mainWorkspace: {
    flex: 1,
    height: '100%',
  },
  topBar: {
    height: 60,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarGreeting: {
    color: 'rgba(255, 248, 231, 0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  topBarTitle: {
    color: '#FFF8E7',
    fontSize: 15,
    fontWeight: '800',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pillStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pillStatText: {
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '800',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF9F1C',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  innerWorkspace: {
    flex: 1,
    width: '100%',
    maxWidth: 1400,
  },
});
