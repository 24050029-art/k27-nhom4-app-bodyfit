import Svg, { Path } from 'react-native-svg';
import React, { useRef, useState, useEffect } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Gradients, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useLocalDb } from '@/hooks/use-local-db';

const AnimatedTypingDots = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnim = (anim: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 350, useNativeDriver: true }),
          ])
        )
      ]);
    };

    const a1 = createAnim(dot1, 0);
    const a2 = createAnim(dot2, 180);
    const a3 = createAnim(dot3, 360);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 2 }}>
      <Animated.Text style={{ color: '#FF9F1C', fontSize: 22, fontWeight: '900', opacity: dot1, lineHeight: 22 }}>•</Animated.Text>
      <Animated.Text style={{ color: '#FF9F1C', fontSize: 22, fontWeight: '900', opacity: dot2, lineHeight: 22 }}>•</Animated.Text>
      <Animated.Text style={{ color: '#FF9F1C', fontSize: 22, fontWeight: '900', opacity: dot3, lineHeight: 22 }}>•</Animated.Text>
    </View>
  );
};


const AiModelLogo = ({ provider, size = 15 }: { provider: string; size?: number }) => {
  if (provider === 'gemini') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
          fill="#38BDF8"
        />
      </Svg>
    );
  }
  if (provider === 'openrouter') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M22.28 9.82a5.98 5.98 0 00-.51-4.91 6.05 6.05 0 00-6.51-2.9 6.07 6.07 0 00-4.84-2.01A6.05 6.05 0 004.64 3.63a5.98 5.98 0 00-4 4.39 6.05 6.05 0 00.5 7.13 5.98 5.98 0 00.52 4.91 6.05 6.05 0 006.51 2.9A6.07 6.07 0 0013.58 24a6.05 6.05 0 005.78-3.63 5.98 5.98 0 004.01-4.39 6.05 6.05 0 00-.5-7.13z"
          stroke="#10A37F"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (provider === 'groq') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="#F97316"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6c0-1.657 3.582-3 8-3s8 1.343 8 3v12c0 1.657-3.582 3-8 3s-8-1.343-8-3V6zm0 0c0 1.657 3.582 3 8 3s8-1.343 8-3m-16 6c0 1.657 3.582 3 8 3s8-1.343 8-3"
        stroke="#FF9F1C"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const providers = ['openrouter', 'gemini', 'groq', 'backend'] as const;
const providerLabels: Record<string, string> = {
  openrouter: 'GPT',
  gemini: 'Gemini',
  groq: 'Llama',
  backend: 'Server'
};

const suggestions = [
  'Hôm nay tôi ăn dư calo chưa?',
  'Làm thế nào để tăng cơ bắp?',
  'Đánh giá dinh dưỡng hôm nay',
  'Gợi ý thực đơn tăng cơ'
];

export default function CoachScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const {
    userProfile,
    chatLogs,
    isAiTyping,
    sendChatMessage,
    chatModelProvider,
    setChatModelProvider,
    chatSessions,
    currentSessionId,
    createChatSession,
    selectChatSession,
    deleteChatSession,
  } = useLocalDb();

  const [input, setInput] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  React.useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text: string) => {
    if (!text.trim()) return;
    setInput('');
    await sendChatMessage(text.trim());
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const newSession = () => {
    const id = createChatSession('Coach Fit');
    selectChatSession(id);
    setHistoryOpen(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.safeArea}
          keyboardVerticalOffset={0}
        >
          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: theme.text }]}>AI Coach 🤖</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={[styles.statusText, { color: theme.textMuted }]}>Đang trực tuyến</Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={newSession} style={styles.newChatHeaderBtn}>
                <Ionicons name="add" size={16} color="#100E0C" />
                <Text style={styles.newChatHeaderBtnText}>Chat mới</Text>
              </Pressable>

              <Pressable onPress={() => setHistoryOpen(true)} style={styles.historyBtn}>
                <Ionicons name="hourglass-outline" size={14} color="#FFF8E7" style={{ marginRight: 4 }} />
                <Text style={styles.historyBtnText}>Lịch sử</Text>
              </Pressable>
            </View>
          </View>

          {/* Quick Suggestions Horizontal Rail */}
          <View style={styles.suggestionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
              {suggestions.map((item) => (
                <Pressable 
                  key={item} 
                  onPress={() => send(item)} 
                  style={[styles.suggestionChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                >
                  <Text style={[styles.suggestionChipText, { color: theme.primary }]}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Chat Messages Log */}
          <ScrollView 
            ref={scrollRef} 
            contentContainerStyle={styles.chatScrollContent} 
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {chatLogs.length === 0 && !isAiTyping ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="rgba(255, 248, 231, 0.2)" />
                <Text style={styles.emptyText}>Bắt đầu cuộc trò chuyện với Coach Fit để nhận lời khuyên dinh dưỡng và tập luyện hữu ích!</Text>
              </View>
            ) : (
              <>
                {chatLogs.map((chat) => {
                  const mine = chat.sender === 'user';
                  return (
                    <View 
                      key={chat.id} 
                      style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowCoach]}
                    >
                      {mine ? (
                        <View style={styles.userBubble}>
                          <Text style={styles.userBubbleText}>{chat.message}</Text>
                          <Text style={styles.userTimeText}>{chat.sentAt || '01:49'}</Text>
                        </View>
                      ) : (
                        <View style={[styles.coachBubble, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                          <Text style={[styles.coachBubbleText, { color: theme.text }]}>{chat.message}</Text>
                          <Text style={[styles.coachTimeText, { color: theme.textMuted }]}>{chat.sentAt || '01:49'}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {isAiTyping && (
                  <View style={[styles.messageRow, styles.messageRowCoach]}>
                    <View style={[styles.coachBubbleTyping, { backgroundColor: theme.card, borderColor: theme.primary }]}>
                      <Text style={styles.typingCoachTitle}>Coach Fit 🤖</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Text style={[styles.typingSubtext, { color: theme.textSecondary }]}>Đang suy nghĩ</Text>
                        <AnimatedTypingDots />
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Bottom Dock Input Bar */}
          <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginBottom: isKeyboardVisible ? 8 : (Platform.OS === 'ios' ? 88 : 78) }]}>
            {/* Antigravity Model Selector Pill on Left */}
            <Pressable 
              onPress={() => setProviderOpen(!providerOpen)} 
              style={[styles.inputModelPill, { backgroundColor: 'rgba(255, 159, 28, 0.15)', borderColor: theme.primary + '40' }]}
            >
              <AiModelLogo provider={chatModelProvider} size={14} />
              <Text style={[styles.inputModelPillText, { color: theme.primary }]}>
                {providerLabels[chatModelProvider]}
              </Text>
              <Ionicons 
                name={providerOpen ? "chevron-down" : "chevron-up"} 
                size={11} 
                color={theme.primary} 
                style={{ marginLeft: 3 }} 
              />
            </Pressable>
            
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Nhắn tin cho Coach Fit..."
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text }]}
              onSubmitEditing={() => send(input)}
            />
            
            <Pressable onPress={() => send(input)} style={styles.sendBtn}>
              <Text style={styles.sendBtnText}>Gửi</Text>
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Antigravity Compact Dropdown Menu */}
      <Modal visible={providerOpen} transparent animationType="fade" onRequestClose={() => setProviderOpen(false)}>
        <Pressable onPress={() => setProviderOpen(false)} style={styles.dropdownOverlay}>
          <View style={[styles.antigravityDropdownCard, { backgroundColor: '#1E222D', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <Text style={styles.dropdownHeaderTitle}>Mô hình AI</Text>
            {providers.map((p) => {
              const isSelected = p === chatModelProvider;
              return (
                <Pressable 
                  key={p} 
                  onPress={() => { setChatModelProvider(p); setProviderOpen(false); }} 
                  style={[
                    styles.dropdownRowItem,
                    isSelected && { backgroundColor: 'rgba(255, 159, 28, 0.15)' }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AiModelLogo provider={p} size={15} />
                    <Text style={[styles.dropdownRowText, { color: isSelected ? theme.primary : theme.text }]}>
                      {providerLabels[p]}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color={theme.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* Chat History Sessions Modal */}
      <Modal visible={historyOpen} transparent animationType="slide" onRequestClose={() => setHistoryOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Lịch sử hội thoại</Text>
              <Pressable onPress={newSession} style={styles.newSessionBtn}>
                <Ionicons name="add-circle-outline" size={18} color={theme.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.newSessionText, { color: theme.primary }]}>Tạo mới</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>
              {chatSessions.length ? (
                chatSessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  return (
                    <View 
                      key={session.id} 
                      style={[
                        styles.sessionRow, 
                        { borderColor: isActive ? '#FF9F1C' : theme.divider },
                        isActive && { backgroundColor: 'rgba(255, 159, 28, 0.1)' }
                      ]}
                    >
                      <Pressable onPress={() => { selectChatSession(session.id); setHistoryOpen(false); }} style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.sessionTitle, { color: isActive ? '#FF9F1C' : theme.text, flex: 1 }]} numberOfLines={1}>
                            {session.title}
                          </Text>
                          {isActive ? (
                            <View style={{ backgroundColor: 'rgba(255, 159, 28, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ color: '#FF9F1C', fontSize: 10, fontWeight: '800' }}>Đang mở</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={[styles.sessionMeta, { color: theme.textSecondary }]}>{session.createdAt}</Text>
                      </Pressable>
                      <Pressable onPress={() => deleteChatSession(session.id)}>
                        <Ionicons name="trash-outline" size={19} color={theme.danger} />
                      </Pressable>
                    </View>
                  );
                })
              ) : (
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginVertical: 20 }}>Chưa có phiên hội thoại nào.</Text>
              )}
            </ScrollView>
            <Pressable onPress={() => setHistoryOpen(false)} style={styles.cancel}>
              <Text style={{ color: theme.textSecondary, fontWeight: '900' }}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerLeft: {
    gap: 4,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF9F1C',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF9F1C',
  },
  statusText: {
    color: 'rgba(255, 248, 231, 0.6)',
    fontSize: 11,
    fontWeight: '700',
  },
  newChatHeaderBtn: {
    backgroundColor: '#FF9F1C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  newChatHeaderBtnText: {
    color: '#100E0C',
    fontSize: 11,
    fontWeight: '900',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 28, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.25)',
  },
  historyBtnText: {
    color: '#FF9F1C',
    fontSize: 12,
    fontWeight: '800',
  },

  // Suggestions Rail
  suggestionsContainer: {
    paddingVertical: 4,
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 159, 28, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#1E1A17',
  },
  suggestionChipText: {
    color: '#FF9F1C',
    fontSize: 12,
    fontWeight: '800',
  },

  // Chat scroll list
  chatScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
    marginTop: 40,
  },
  emptyText: {
    color: 'rgba(255, 248, 231, 0.44)',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowCoach: {
    justifyContent: 'flex-start',
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: '#FF9F1C',
    borderRadius: 18,
    borderTopRightRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
    shadowColor: '#FF9F1C',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  userBubbleText: {
    color: '#100E0C',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  userTimeText: {
    alignSelf: 'flex-end',
    color: 'rgba(16, 18, 15, 0.65)',
    fontSize: 9,
    fontWeight: '800',
  },
  coachBubble: {
    maxWidth: '86%',
    backgroundColor: '#1E1A17',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 159, 28, 0.15)',
    borderRadius: 18,
    borderTopLeftRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  coachBubbleText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  coachTimeText: {
    alignSelf: 'flex-end',
    color: 'rgba(255, 248, 231, 0.44)',
    fontSize: 9,
    fontWeight: '700',
  },
  coachBubbleTyping: {
    maxWidth: '86%',
    backgroundColor: '#1E1A17',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 159, 28, 0.35)',
    borderRadius: 18,
    borderTopLeftRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
    shadowColor: '#FF9F1C',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  typingCoachTitle: {
    color: '#FF9F1C',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  typingSubtext: {
    color: 'rgba(255, 248, 231, 0.85)',
    fontSize: 13,
    fontWeight: '700',
  },

  // Input wrapper
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 90,
    marginTop: 10,
    padding: 6,
    borderRadius: 30,
    backgroundColor: '#1E1A17',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 159, 28, 0.25)',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  providerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 159, 28, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.2)',
  },
  providerSelectorText: {
    color: '#FF9F1C',
    fontSize: 11,
    fontWeight: '900',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sendBtn: {
    width: 50,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF9F1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  sendBtnText: {
    color: '#100E0C',
    fontWeight: '900',
    fontSize: 13,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  providerModalCard: {
    borderRadius: 24,
    padding: 20,
    gap: 8,
    width: '100%',
  },
  providerRowItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  providerRowItemActive: {
    backgroundColor: '#FF9F1C',
    borderColor: '#FF9F1C',
  },
  providerRowItemText: {
    fontWeight: '900',
    fontSize: 14,
  },
  modalCard: {
    borderRadius: 28,
    padding: 20,
    gap: 12,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  newSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newSessionText: {
    fontWeight: '900',
    fontSize: 13,
  },
  sessionRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  sessionTitle: {
    fontWeight: '900',
    fontSize: 14,
  },
  sessionMeta: {
    fontSize: 11,
    marginTop: 4,
  },
  cancel: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  antigravityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  antigravityPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingBottom: Platform.OS === 'ios' ? 145 : 135,
    paddingLeft: 16,
  },
  inputModelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    marginLeft: 4,
  },
  inputModelPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  antigravityDropdownCard: {
    width: 200,
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 248, 231, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dropdownRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 1,
  },
  dropdownRowText: {
    fontSize: 13,
    fontWeight: '600',
  },
});