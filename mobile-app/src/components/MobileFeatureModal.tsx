import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MobileFeatureModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function MobileFeatureModal({
  visible,
  onClose,
  title = 'Tính Năng Trên Điện Thoại',
  description = 'Chức năng AI Quét thực phẩm qua Camera hiện chỉ khả dụng trên ứng dụng di động BodyFit. Vui lòng mở ứng dụng trên điện thoại để trải nghiệm!',
}: MobileFeatureModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="phone-portrait-outline" size={38} color="#FF9F1C" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Đã hiểu</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 9999,
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
    shadowColor: '#FF9F1C',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
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
