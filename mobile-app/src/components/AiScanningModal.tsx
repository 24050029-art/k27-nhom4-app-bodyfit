import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';

interface AiScanningModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  statusMessage?: string;
  onCancel?: () => void;
}

export const AiScanningModal: React.FC<AiScanningModalProps> = ({
  visible,
  title = 'AI đang phân tích món ăn...',
  subtitle = 'Hệ thống AI thị giác đang quét hình ảnh để nhận diện món ăn & dinh dưỡng',
  statusMessage,
  onCancel,
}) => {
  const { theme, isDark } = useAppTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Real-time progress stages
  const getProgressInfo = (sec: number) => {
    if (sec < 3) {
      return {
        step: 1,
        text: 'Đang tải ảnh và kết nối AI thị giác... 📡',
        sub: 'Khởi tạo luồng xử lý thị giác máy tính',
      };
    } else if (sec < 7) {
      return {
        step: 2,
        text: 'AI đang nhận diện món ăn & nguyên liệu... 🍲',
        sub: 'Trích xuất đặc trưng hình ảnh & phân loại món',
      };
    } else if (sec < 13) {
      return {
        step: 3,
        text: 'Đang tính toán calo, đạm, carb, chất béo... 🥗',
        sub: 'Ước lượng khối lượng (g) & bảng thành phần',
      };
    } else {
      return {
        step: 4,
        text: 'Sắp xong! Đang tổng hợp kết quả chi tiết... ✨',
        sub: 'Hoàn thiện hồ sơ dinh dưỡng cho bạn',
      };
    }
  };

  useEffect(() => {
    if (visible) {
      setElapsedSeconds(0);

      // Fade in smoothly
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Tick seconds timer for progressive updates
      const ticker = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // Safety timeout: only auto-dismiss if stalled after 60s (not 12s)
      const safetyTimer = setTimeout(() => {
        if (onCancel) {
          console.warn('AiScanningModal safety timeout reached after 60s');
          onCancel();
        }
      }, 60000);

      // Pulse animation for outer ring glow
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      // Smooth rotation for AI dashed ring
      const rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      pulseLoop.start();
      rotateLoop.start();

      return () => {
        clearInterval(ticker);
        clearTimeout(safetyTimer);
        pulseLoop.stop();
        rotateLoop.stop();
      };
    } else {
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      setElapsedSeconds(0);
    }
  }, [visible, pulseAnim, rotateAnim, fadeAnim, onCancel]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const currentProgress = getProgressInfo(elapsedSeconds);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Animated AI Scanning Icon */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  backgroundColor: `${theme.primary}25`,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.borderRing,
                {
                  borderColor: theme.primary,
                  transform: [{ rotate: spin }],
                },
              ]}
            />
            <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
              <Ionicons name="sparkles" size={32} color="#100E0C" />
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={[styles.titleText, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.subtitleText, { color: theme.textMuted }]}>
            {currentProgress.sub}
          </Text>

          {/* Progress Steps Dots */}
          <View style={styles.stepsRow}>
            {[1, 2, 3, 4].map((stepIdx) => {
              const isActive = stepIdx <= currentProgress.step;
              const isCurrent = stepIdx === currentProgress.step;
              return (
                <View
                  key={stepIdx}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: isActive ? theme.primary : 'rgba(255, 255, 255, 0.15)',
                      width: isCurrent ? 24 : 8,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Activity / Dynamic Status Box */}
          <View
            style={[
              styles.statusBox,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: `${theme.primary}40`,
              },
            ]}
          >
            <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 10 }} />
            <Text style={[styles.statusText, { color: theme.primary }]}>
              {statusMessage || currentProgress.text}
            </Text>
          </View>

          {/* Elapsed Timer Counter */}
          <Text style={[styles.timerText, { color: theme.textMuted }]}>
            Đang phân tích: {elapsedSeconds}s (AI sẽ tự động hiện kết quả ngay)
          </Text>

          {onCancel && (
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Hủy bỏ</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    zIndex: 99999,
    elevation: 99999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  borderRing: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#FF9F1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    width: '100%',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  timerText: {
    fontSize: 11,
    marginTop: 12,
    fontWeight: '500',
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 12.5,
    textDecorationLine: 'underline',
  },
});
