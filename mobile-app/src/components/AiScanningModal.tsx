import React, { useEffect, useRef } from 'react';
import {
  Modal,
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
  title = 'AI đang quét món ăn...',
  subtitle = 'Đang phân tích hình ảnh và tính toán lượng calo, chất đạm, carb, chất béo',
  statusMessage,
  onCancel,
}) => {
  const { theme, isDark } = useAppTheme();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      pulseLoop.start();
      rotateLoop.start();

      return () => {
        pulseLoop.stop();
        rotateLoop.stop();
      };
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [visible, pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      hardwareAccelerated
      onRequestClose={onCancel}
    >
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
          <Text style={[styles.subtitleText, { color: theme.textMuted }]}>{subtitle}</Text>

          {/* Activity / Status Box */}
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
              {statusMessage || 'AI đang nhận diện dữ liệu... ⏳'}
            </Text>
          </View>

          {onCancel && (
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Hủy bỏ</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
