import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import React, { useRef, useState, useEffect } from 'react';
import { Alert, Animated, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ImageBackground } from 'react-native';
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


const AiModelLogo = ({ provider, size = 16 }: { provider: string; size?: number }) => {
  if (provider === 'gemini') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <SvgLinearGradient id="geminiSparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4E75F8" />
            <Stop offset="50%" stopColor="#8AB4F8" />
            <Stop offset="100%" stopColor="#C58AF9" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"
          fill="url(#geminiSparkGrad)"
        />
      </Svg>
    );
  }
  if (provider === 'openrouter') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
          fill="#10A37F"
        />
      </Svg>
    );
  }
  if (provider === 'groq') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.036 2c-3.853-.035-7 3-7.036 6.781-.035 3.782 3.055 6.872 6.908 6.907h2.42v-2.566h-2.292c-2.407.028-4.38-1.866-4.408-4.23-.029-2.362 1.901-4.298 4.308-4.326h.1c2.407 0 4.358 1.915 4.365 4.278v6.305c0 2.342-1.944 4.25-4.323 4.279a4.375 4.375 0 01-3.033-1.252l-1.851 1.818A7 7 0 0012.029 22h.092c3.803-.056 6.858-3.083 6.879-6.816v-6.5C18.907 4.963 15.817 2 12.036 2z"
          fill="#F55036"
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
  groq: 'Groq',
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
    const id = createChatSession('Cuộc trò chuyện mới 💬');
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
                  const messageCount = session.messages?.length || 0;
                  return (
                    <View 
                      key={session.id} 
                      style={[
                        styles.sessionRow, 
                        { borderColor: isActive ? '#FF9F1C' : theme.divider },
                        isActive && { backgroundColor: 'rgba(255, 159, 28, 0.12)' }
                      ]}
                    >
                      <Pressable 
                        onPress={() => { selectChatSession(session.id); setHistoryOpen(false); }} 
                        style={{ flex: 1, paddingVertical: 4 }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons 
                            name="chatbubble-ellipses-outline" 
                            size={16} 
                            color={isActive ? '#FF9F1C' : theme.textSecondary} 
                          />
                          <Text 
                            style={[styles.sessionTitle, { color: isActive ? '#FF9F1C' : theme.text, flex: 1 }]} 
                            numberOfLines={1}
                          >
                            {session.title}
                          </Text>
                          {isActive ? (
                            <View style={{ backgroundColor: 'rgba(255, 159, 28, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ color: '#FF9F1C', fontSize: 10, fontWeight: '800' }}>Đang mở</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginLeft: 24 }}>
                          <Text style={[styles.sessionMeta, { color: theme.textSecondary, marginTop: 0 }]}>{session.createdAt}</Text>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>•</Text>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }}>{messageCount} tin nhắn</Text>
                        </View>
                      </Pressable>
                      <Pressable 
                        onPress={() => {
                          const doDelete = () => deleteChatSession(session.id);
                          if (Platform.OS === 'web') {
                            if (window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này không?')) {
                              doDelete();
                            }
                          } else {
                            Alert.alert(
                              'Xóa cuộc trò chuyện',
                              'Bạn có chắc muốn xóa cuộc trò chuyện này không?',
                              [
                                { text: 'Hủy', style: 'cancel' },
                                { text: 'Xóa', style: 'destructive', onPress: doDelete }
                              ]
                            );
                          }
                        }}
                        style={{ padding: 8 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
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
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
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