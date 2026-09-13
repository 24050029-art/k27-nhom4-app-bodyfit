import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput, View, Image, ActivityIndicator, Platform, Text, useWindowDimensions, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalDb, CommunityPost, Challenge, LiftingRecords, Quest, LiftingHistoryLog } from '@/hooks/use-local-db';
import { Spacing, MaxContentWidth, DEFAULT_AVATAR } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import Svg, { Line, Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

function StrengthChart({ history }: { history: LiftingHistoryLog[] }) {
  const sorted = [...history].sort((a, b) => a.loggedDate.localeCompare(b.loggedDate));
  
  if (sorted.length < 2) {
    return (
      <View style={{ height: 160, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 159, 28, 0.25)' }}>
        <Text style={{ color: 'rgba(255, 248, 231, 0.6)', fontSize: 13 }}>Cần ít nhất 2 bản ghi lịch sử để vẽ biểu đồ.</Text>
      </View>
    );
  }

  // Dimensions
  const width = 320;
  const height = 180;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 25;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const allWeights = sorted.flatMap(h => [h.squat, h.bench, h.deadlift]);
  const minWeight = Math.max(0, Math.min(...allWeights) - 10);
  const maxWeight = Math.max(...allWeights) + 10;
  const weightRange = maxWeight - minWeight || 1;

  // Calculate coordinates
  const getCoords = (val: number, index: number) => {
    const x = paddingLeft + (index / (sorted.length - 1)) * chartWidth;
    const y = height - paddingBottom - ((val - minWeight) / weightRange) * chartHeight;
    return { x, y };
  };

  const squatPoints = sorted.map((h, i) => getCoords(h.squat, i));
  const benchPoints = sorted.map((h, i) => getCoords(h.bench, i));
  const deadliftPoints = sorted.map((h, i) => getCoords(h.deadlift, i));

  const makePath = (points: { x: number, y: number }[]) => {
    return points.reduce((path, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`, '');
  };

  const squatPath = makePath(squatPoints);
  const benchPath = makePath(benchPoints);
  const deadliftPath = makePath(deadliftPoints);

  // Y-axis grid lines
  const gridLinesCount = 4;
  const gridLines = Array.from({ length: gridLinesCount }, (_, idx) => {
    const w = minWeight + (idx / (gridLinesCount - 1)) * weightRange;
    const y = height - paddingBottom - (idx / (gridLinesCount - 1)) * chartHeight;
    return { w: Math.round(w), y };
  });

  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Svg width={width} height={height}>
        {/* Grid lines & Y labels */}
        {gridLines.map((line, idx) => (
          <G key={idx}>
            <Line 
              x1={paddingLeft} 
              y1={line.y} 
              x2={width - paddingRight} 
              y2={line.y} 
              stroke="rgba(255,255,255,0.1)" 
              strokeWidth="1" 
              strokeDasharray="4 4"
            />
            <SvgText 
              x={paddingLeft - 8} 
              y={line.y + 4} 
              fill="#94A3B8" 
              fontSize="9" 
              textAnchor="end"
            >
              {line.w}kg
            </SvgText>
          </G>
        ))}

        {/* X labels (Dates) */}
        {sorted.map((h, idx) => {
          const x = paddingLeft + (idx / (sorted.length - 1)) * chartWidth;
          const dateStr = h.loggedDate.substring(5); // MM-DD
          return (
            <SvgText
              key={idx}
              x={x}
              y={height - 8}
              fill="#94A3B8"
              fontSize="8"
              textAnchor="middle"
            >
              {dateStr}
            </SvgText>
          );
        })}

        {/* Lines */}
        <Path d={squatPath} fill="none" stroke="#FF9F1C" strokeWidth="3" />
        <Path d={benchPath} fill="none" stroke="#30A0E0" strokeWidth="3" />
        <Path d={deadliftPath} fill="none" stroke="#F59E0B" strokeWidth="3" />

        {/* Squat Dots */}
        {squatPoints.map((p, idx) => (
          <Circle key={`s-${idx}`} cx={p.x} cy={p.y} r="4" fill="#FF9F1C" stroke="#ffffff" strokeWidth="1.5" />
        ))}
        {/* Bench Dots */}
        {benchPoints.map((p, idx) => (
          <Circle key={`b-${idx}`} cx={p.x} cy={p.y} r="4" fill="#30A0E0" stroke="#ffffff" strokeWidth="1.5" />
        ))}
        {/* Deadlift Dots */}
        {deadliftPoints.map((p, idx) => (
          <Circle key={`d-${idx}`} cx={p.x} cy={p.y} r="4" fill="#F59E0B" stroke="#ffffff" strokeWidth="1.5" />
        ))}
      </Svg>

      {/* Chart Legend */}
      <View style={{ flexDirection: 'row', gap: 15, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF9F1C' }} />
          <Text style={{ fontSize: 11, color: '#FFF8E7', fontWeight: '700' }}>Squat</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#30A0E0' }} />
          <Text style={{ fontSize: 11, color: '#FFF8E7', fontWeight: '700' }}>Bench Press</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F59E0B' }} />
          <Text style={{ fontSize: 11, color: '#FFF8E7', fontWeight: '700' }}>Deadlift</Text>
        </View>
      </View>
    </View>
  );
}

export default function ExploreScreen() {
  const { theme, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 900;

  const { 
    userProfile, 
    currentUser,
    isAdmin,
    backendUrl,
    communityPosts, 
    addCommunityPost, 
    deleteCommunityPost,
    toggleLikePost, 
    addCommentToPost,
    challenges,
    userChallenges,
    joinChallenge,
    completeChallenge,
    userBadges,
    getLeaderboard,
    liftingRecords,
    saveLiftingRecords,
    addXp,
    quests,
    liftingHistory,
    claimQuestReward,
    buyBadge
  } = useLocalDb();

  const formatMediaUrl = (url?: string | null) => {
    if (!url || typeof url !== 'string' || !url.trim()) return null;
    let clean = url.trim();
    if (clean.startsWith('data:') || clean.startsWith('file:')) return clean;

    if (clean.startsWith('http://localhost:3000') || clean.startsWith('http://127.0.0.1:3000')) {
      clean = clean.replace('http://localhost:3000', backendUrl).replace('http://127.0.0.1:3000', backendUrl);
    }

    if (!clean.startsWith('http')) {
      const filename = clean.includes('/') ? clean.split('/').pop() : clean;
      return `${backendUrl}/v1/users/avatars/${filename}`;
    }

    return clean;
  };

  const formatAvatar = (url?: string | null) => {
    if (!url || !url.trim()) return DEFAULT_AVATAR;
    let clean = url.trim();
    if (clean.startsWith('data:') || clean.startsWith('file:')) return clean;

    if (clean.startsWith('http://localhost:3000') || clean.startsWith('http://127.0.0.1:3000')) {
      clean = clean.replace('http://localhost:3000', backendUrl).replace('http://127.0.0.1:3000', backendUrl);
    }

    if (clean.startsWith('http')) {
      if (clean.includes('/v1/users/avatars/')) {
        const filename = clean.split('/v1/users/avatars/').pop();
        return `${backendUrl}/v1/users/avatars/${filename}`;
      }
      return clean;
    }
    const filename = clean.includes('/') ? clean.split('/').pop() : clean;
    return `${backendUrl}/v1/users/avatars/${filename}`;
  };

  // Navigation segment: 'feed' | 'challenges' | 'leaderboard' | 'strength'
  const [activeSegment, setActiveSegment] = useState<'feed' | 'challenges' | 'leaderboard' | 'strength'>('feed');
  const [feedFilter, setFeedFilter] = useState<'all' | 'mine' | 'popular'>('all');
  const [isBadgeStoreOpen, setIsBadgeStoreOpen] = useState(false);

  const storeItems = [
    { name: "Chiến thần Đẩy Ngực 🦍", cost: 30, icon: "bench_badge" },
    { name: "Huyền thoại Squat 🦵", cost: 40, icon: "squat_badge" },
    { name: "Kẻ Hủy Diệt Mỡ ⚔️", cost: 20, icon: "fat_destroyer" },
    { name: "Thần Hộ Mệnh Nước 💧", cost: 15, icon: "water_guardian" },
    { name: "Vua Dinh Dưỡng 🥗", cost: 25, icon: "nutrition_king" }
  ];

  // 1RM Form state
  const [squatVal, setSquatVal] = useState('');
  const [benchVal, setBenchVal] = useState('');
  const [deadliftVal, setDeadliftVal] = useState('');

  useEffect(() => {
    if (liftingRecords) {
      setSquatVal(liftingRecords.squat.toString());
      setBenchVal(liftingRecords.bench.toString());
      setDeadliftVal(liftingRecords.deadlift.toString());
    }
  }, [liftingRecords]);

  const handleSaveStrength = async () => {
    const s = parseFloat(squatVal) || 0;
    const b = parseFloat(benchVal) || 0;
    const d = parseFloat(deadliftVal) || 0;

    if (s <= 0 || b <= 0 || d <= 0) {
      alert('Vui lòng nhập chỉ số tạ 1RM lớn hơn 0.');
      return;
    }

    try {
      await saveLiftingRecords({ squat: s, bench: b, deadlift: d });
      alert('Đã cập nhật chỉ số tạ tối đa 1RM thành công! +30 XP 💪');
      addXp(30);
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi lưu chỉ số.');
    }
  };

  // Community Feed Input State
  const [newPostText, setNewPostText] = useState('');
  const [newPostPhoto, setNewPostPhoto] = useState('');
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [commentTexts, setCommentTexts] = useState<{ [postId: string]: string }>({});

  const handlePickPostPhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const rawDataUrl = event.target?.result as string;
              if (rawDataUrl) {
                // Compress via Canvas on Web to max 800px & 0.6 JPEG quality for instant payload
                const img = new (window as any).Image();
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_SIZE = 800;
                  let width = img.width;
                  let height = img.height;
                  if (width > height) {
                    if (width > MAX_SIZE) {
                      height = Math.round((height * MAX_SIZE) / width);
                      width = MAX_SIZE;
                    }
                  } else {
                    if (height > MAX_SIZE) {
                      width = Math.round((width * MAX_SIZE) / height);
                      height = MAX_SIZE;
                    }
                  }
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressed = canvas.toDataURL('image/jpeg', 0.6);
                    setNewPostPhoto(compressed);
                  } else {
                    setNewPostPhoto(rawDataUrl);
                  }
                  setShowPhotoInput(true);
                };
                img.onerror = () => {
                  setNewPostPhoto(rawDataUrl);
                  setShowPhotoInput(true);
                };
                img.src = rawDataUrl;
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để đính kèm tập tin.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        let imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;

        try {
          const ImageManipulator = require('expo-image-manipulator');
          const saved = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 800 } }],
            { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          if (saved.base64) {
            imageUri = `data:image/jpeg;base64,${saved.base64}`;
          }
        } catch (manipErr) {
          console.warn('ImageManipulator fallback to base64 asset:', manipErr);
        }

        setNewPostPhoto(imageUri);
        setShowPhotoInput(true);
      }
    } catch (error) {
      console.error('Pick post image error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thiết bị.');
    }
  };

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<any>({ topActive: [], topWeightLoss: [] });
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (activeSegment === 'leaderboard' || isWebDesktop) {
      const fetchLeaderboard = async () => {
        setIsLoadingLeaderboard(true);
        try {
          const data = await getLeaderboard();
          setLeaderboard(data);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingLeaderboard(false);
        }
      };
      fetchLeaderboard();
    }
  }, [activeSegment, communityPosts, isWebDesktop]);

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    setIsSubmittingPost(true);
    try {
      await addCommunityPost(newPostText, newPostPhoto || undefined);
      setNewPostText('');
      setNewPostPhoto('');
      setShowPhotoInput(false);
      alert('Đã chia sẻ bài viết lên cộng đồng thành công! +20 XP 🌟');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    try {
      await addCommentToPost(postId, text);
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
    } catch (e) {
      console.error(e);
    }
  };

  const isChallengeJoined = (chalId: string) => {
    return userChallenges.some(uc => uc.challengeId === chalId);
  };

  const isChallengeCompleted = (chalId: string) => {
    return userChallenges.some(uc => uc.challengeId === chalId && uc.status === 'COMPLETED');
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return 'Mới xong';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch (e) {
      return dateStr;
    }
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#0F0D0B', '#171411', '#0A0907']} style={StyleSheet.absoluteFill} />
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255, 248, 231, 0.6)', textAlign: 'center' }}>
            Vui lòng hoàn thành Onboarding ở tab Home để tham gia cộng đồng.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const myUid = currentUser?.uid || 'mock-uid';
  const myAvatar = userProfile?.avatarUrl || DEFAULT_AVATAR;
  const myName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || currentUser?.username || 'Bạn';

  // Filter community posts
  const filteredPosts = communityPosts.filter(p => {
    if (feedFilter === 'mine') return p.userId === myUid || p.username === currentUser?.username;
    if (feedFilter === 'popular') return p.likes && p.likes.length > 0;
    return true;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <LinearGradient 
        colors={isDark ? ['#0F0D0B', '#171411', '#0A0907'] : [theme.background, theme.backgroundSecondary, theme.background]} 
        style={StyleSheet.absoluteFill} 
      />

      {/* Top Header Navigation Segment Tabs */}
      <View style={styles.segmentContainer}>
        {([
          { key: 'feed', label: 'Bảng tin 👥' },
          { key: 'challenges', label: 'Thử thách 🏆' },
          { key: 'leaderboard', label: 'Bảng hạng 👑' },
          { key: 'strength', label: 'Sức mạnh 1RM 🏋️‍♂️' }
        ] as const).map(segment => {
          const isActive = activeSegment === segment.key;
          return (
            <Pressable 
              key={segment.key}
              onPress={() => setActiveSegment(segment.key)}
              style={[
                styles.segmentBtn, 
                isActive 
                  ? { backgroundColor: '#FF9F1C', borderWidth: 1, borderColor: '#FF9F1C' } 
                  : { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)', borderWidth: 1, borderColor: theme.cardBorder }
              ]}
            >
              <Text style={[styles.segmentText, { color: isActive ? '#100E0C' : theme.textSecondary, fontWeight: isActive ? '900' : '700' }]}>
                {segment.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* RESPONSIVE DUAL-COLUMN CONTAINER ON WEB DESKTOP */}
        <View style={isWebDesktop ? styles.desktopLayoutRow : styles.mobileLayoutCol}>
          
          {/* LEFT / MAIN COLUMN (SOCIAL FEED) */}
          <View style={isWebDesktop ? styles.mainFeedCol : { width: '100%', gap: Spacing.three }}>
            
            {activeSegment === 'feed' && (
              <>
                {/* SOCIAL NETWORK POST COMPOSER BOX */}
                <View style={[styles.socialComposerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={styles.composerHeaderRow}>
                    <View style={styles.avatarWrap}>
                      <Image source={{ uri: myAvatar }} style={styles.composerAvatar} />
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>Lv.{userProfile.level || 1}</Text>
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.composerTitle, { color: theme.text }]}>{myName}</Text>
                      <Text style={[styles.composerSubtitle, { color: theme.textMuted }]}>Chia sẻ khoảnh khắc thể thao & dinh dưỡng...</Text>
                    </View>
                  </View>

                  <TextInput
                    placeholder={`${myName} ơi, hôm nay bạn đã tập luyện ra sao? Ăn những gì? Chia sẻ ngay với cộng đồng BodyFit...`}
                    value={newPostText}
                    onChangeText={setNewPostText}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={theme.textMuted}
                    style={[styles.composerInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                  />

                  {/* Photo File Attachment Container & Live Preview */}
                  {(showPhotoInput || !!newPostPhoto) && (
                    <View style={styles.photoInputContainer}>
                      {newPostPhoto.trim() ? (
                        <View style={styles.photoPreviewWrap}>
                          <Image source={{ uri: newPostPhoto }} style={styles.photoPreviewImg} resizeMode="cover" />
                          <View style={styles.photoAttachedBadge}>
                            <Text style={styles.photoAttachedBadgeText}>📁 Tập tin ảnh đã đính kèm</Text>
                          </View>
                          <View style={styles.photoActionGroup}>
                            <Pressable onPress={handlePickPostPhoto} style={styles.changePhotoBtn}>
                              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>🔄 Chọn ảnh khác</Text>
                            </Pressable>
                            <Pressable onPress={() => { setNewPostPhoto(''); setShowPhotoInput(false); }} style={styles.removePhotoBtn}>
                              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>✕ Xóa</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.photoPickerDropzone}>
                          <Pressable onPress={handlePickPostPhoto} style={styles.pickFileBtn}>
                            <Text style={styles.pickFileBtnText}>📁 Nhấp để chọn tập tin ảnh từ thiết bị (Điện thoại / Máy tính)</Text>
                            <Text style={styles.pickFileSubText}>Hỗ trợ PNG, JPG, JPEG, WEBP</Text>
                          </Pressable>
                          <Pressable onPress={() => setShowUrlInput(!showUrlInput)} style={styles.toggleUrlBtn}>
                            <Text style={styles.toggleUrlText}>{showUrlInput ? 'Ẩn dán URL' : '🔗 Hoặc dán liên kết URL ảnh'}</Text>
                          </Pressable>
                          {showUrlInput && (
                            <TextInput
                              placeholder="Dán liên kết ảnh minh họa (http://...)"
                              value={newPostPhoto}
                              onChangeText={setNewPostPhoto}
                              placeholderTextColor="rgba(255, 248, 231, 0.45)"
                              style={styles.photoUrlInput}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Quick Tagging Buttons & Submit Action Bar */}
                  <View style={styles.composerActionBar}>
                    <View style={styles.quickTagsRow}>
                      <Pressable 
                        onPress={() => {
                          if (!newPostPhoto) {
                            handlePickPostPhoto();
                          } else {
                            setShowPhotoInput(!showPhotoInput);
                          }
                        }} 
                        style={[styles.quickTagBtn, (showPhotoInput || !!newPostPhoto) && { backgroundColor: 'rgba(255, 159, 28, 0.25)', borderColor: '#FF9F1C' }]}
                      >
                        <Text style={styles.quickTagText}>{newPostPhoto ? '🖼️ Đã đính kèm ảnh' : '📷 Gắn file ảnh'}</Text>
                      </Pressable>

                      <Pressable 
                        onPress={() => setNewPostText(prev => `${prev} #TậpLuyện #Gym #Squat `)} 
                        style={[styles.quickTagBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)', borderColor: theme.cardBorder }]}
                      >
                        <Text style={[styles.quickTagText, { color: theme.textSecondary }]}>🏋️ #TậpLuyện</Text>
                      </Pressable>

                      <Pressable 
                        onPress={() => setNewPostText(prev => `${prev} #DinhDưỡng #EatClean #Calo `)} 
                        style={[styles.quickTagBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)', borderColor: theme.cardBorder }]}
                      >
                        <Text style={[styles.quickTagText, { color: theme.textSecondary }]}>🥗 #DinhDưỡng</Text>
                      </Pressable>
                    </View>

                    <Pressable 
                      onPress={handleCreatePost}
                      disabled={isSubmittingPost || !newPostText.trim()}
                      style={[styles.publishPostBtn, (!newPostText.trim() || isSubmittingPost) && { opacity: 0.6 }]}
                    >
                      {isSubmittingPost ? (
                        <ActivityIndicator size="small" color="#100E0C" />
                      ) : (
                        <Text style={styles.publishPostBtnText}>Đăng Bài Viết ✨</Text>
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* FEED FILTERS BAR */}
                <View style={styles.feedFiltersBar}>
                  <Text style={[styles.feedFiltersTitle, { color: theme.textMuted }]}>BẢNG TIN CỘNG ĐỒNG</Text>
                  <View style={styles.feedFilterPills}>
                    <Pressable 
                      onPress={() => setFeedFilter('all')}
                      style={[styles.filterPill, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' }, feedFilter === 'all' && styles.filterPillActive]}
                    >
                      <Text style={[styles.filterPillText, { color: theme.textMuted }, feedFilter === 'all' && styles.filterPillTextActive]}>🔥 Tất cả ({communityPosts.length})</Text>
                    </Pressable>

                    <Pressable 
                      onPress={() => setFeedFilter('popular')}
                      style={[styles.filterPill, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' }, feedFilter === 'popular' && styles.filterPillActive]}
                    >
                      <Text style={[styles.filterPillText, { color: theme.textMuted }, feedFilter === 'popular' && styles.filterPillTextActive]}>❤️ Yêu thích</Text>
                    </Pressable>

                    <Pressable 
                      onPress={() => setFeedFilter('mine')}
                      style={[styles.filterPill, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' }, feedFilter === 'mine' && styles.filterPillActive]}
                    >
                      <Text style={[styles.filterPillText, { color: theme.textMuted }, feedFilter === 'mine' && styles.filterPillTextActive]}>✨ Của tôi</Text>
                    </Pressable>
                  </View>
                </View>

                {/* SOCIAL POSTS FEED LIST */}
                {filteredPosts.length === 0 ? (
                  <View style={styles.emptyPostsBox}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
                    <Text style={styles.emptyPostsTitle}>Chưa có bài viết nào ở mục này</Text>
                    <Text style={styles.emptyPostsDesc}>Hãy là người đầu tiên chia sẻ thành tích tập luyện & thực đơn hôm nay!</Text>
                  </View>
                ) : (
                  filteredPosts.map(post => {
                    const isLikedByMe = post.likes.some(l => l.userId === myUid);
                    const isMyPost = post.userId === myUid || post.username === currentUser?.username;
                    const canDelete = isMyPost || isAdmin || currentUser?.role === 'ADMIN';
                    const rawAvatar = isMyPost 
                      ? myAvatar 
                      : ((post as any).userProfile?.avatarUrl || (post as any).avatarUrl || DEFAULT_AVATAR);
                    const authorAvatar = formatAvatar(rawAvatar);

                    return (
                      <View key={post.id} style={[styles.socialPostCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        {/* Post Header */}
                        <View style={styles.postCardHeader}>
                          <View style={styles.postAuthorInfo}>
                            <View style={styles.avatarWrap}>
                              <Image 
                                source={{ uri: authorAvatar }} 
                                style={styles.postAvatar} 
                              />
                              <View style={[styles.levelBadge, { backgroundColor: '#FF9F1C' }]}>
                                <Text style={styles.levelBadgeText}>Lv.1</Text>
                              </View>
                            </View>

                            <View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.postAuthorName, { color: theme.text }]}>{post.username}</Text>
                                {isMyPost ? (
                                  <View style={styles.authorBadgeTag}>
                                    <Text style={styles.authorBadgeTagText}>TÔI</Text>
                                  </View>
                                ) : null}
                              </View>
                              <Text style={[styles.postTimeText, { color: theme.textMuted }]}>
                                {formatRelativeTime(post.createdAt)} • 🌍 Công khai
                              </Text>
                            </View>
                          </View>

                          {canDelete ? (
                            <Pressable 
                              onPress={() => {
                                const confirmMsg = isAdmin && !isMyPost 
                                  ? `[ADMIN] Bạn có chắc chắn muốn xóa bài viết này của "${post.username}" không?` 
                                  : 'Bạn có chắc chắn muốn xóa bài viết này không?';

                                if (Platform.OS === 'web') {
                                  if (confirm(confirmMsg)) {
                                    deleteCommunityPost(post.id);
                                  }
                                } else {
                                  Alert.alert(
                                    'Xóa bài viết',
                                    confirmMsg,
                                    [
                                      { text: 'Hủy', style: 'cancel' },
                                      { text: 'Xóa bài', style: 'destructive', onPress: () => deleteCommunityPost(post.id) }
                                    ]
                                  );
                                }
                              }}
                              style={styles.deletePostBtn}
                            >
                              <Text style={styles.deletePostBtnText}>🗑️ Xóa</Text>
                            </Pressable>
                          ) : (
                            <Text style={{ fontSize: 16, color: theme.textMuted }}>•••</Text>
                          )}
                        </View>

                        {/* Post Body Content */}
                        <Text style={[styles.postContentText, { color: theme.text }]}>{post.content}</Text>
                        
                        {/* Post Image Attachment */}
                        {post.photoUrl ? (
                          <View style={styles.postImageContainer}>
                            <Image 
                              source={{ uri: formatMediaUrl(post.photoUrl) || DEFAULT_AVATAR }} 
                              style={styles.postMediaImg} 
                              resizeMode="cover"
                            />
                          </View>
                        ) : null}

                        {/* Post Counters Stats */}
                        <View style={styles.postStatsRow}>
                          <Text style={[styles.postStatText, { color: theme.textMuted }]}>
                            ❤️ {post.likes.length} người thích
                          </Text>
                          <Text style={[styles.postStatText, { color: theme.textMuted }]}>
                            💬 {post.comments.length} bình luận
                          </Text>
                        </View>

                        <View style={[styles.postDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />

                        {/* Social Interaction Bar */}
                        <View style={styles.socialActionBar}>
                          <Pressable 
                            onPress={() => toggleLikePost(post.id)} 
                            style={[styles.socialActionBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }, isLikedByMe && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
                          >
                            <Text style={styles.socialActionIcon}>{isLikedByMe ? '❤️' : '🤍'}</Text>
                            <Text style={[styles.socialActionText, { color: theme.textSecondary }, isLikedByMe && { color: '#EF4444', fontWeight: '800' }]}>
                              {isLikedByMe ? 'Đã Thích' : 'Thích'}
                            </Text>
                          </Pressable>

                          <Pressable style={[styles.socialActionBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}>
                            <Text style={styles.socialActionIcon}>💬</Text>
                            <Text style={[styles.socialActionText, { color: theme.textSecondary }]}>Bình luận</Text>
                          </Pressable>

                          <Pressable 
                            onPress={() => alert('Đã sao chép liên kết bài viết!')} 
                            style={[styles.socialActionBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}
                          >
                            <Text style={styles.socialActionIcon}>🔄</Text>
                            <Text style={[styles.socialActionText, { color: theme.textSecondary }]}>Chia sẻ</Text>
                          </Pressable>
                        </View>

                        {/* Comments Section */}
                        {post.comments.length > 0 && (
                          <View style={[styles.commentsBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }]}>
                            {post.comments.map(comment => (
                              <View key={comment.id} style={styles.commentRowItem}>
                                <View style={styles.commentAvatarMini}>
                                  <Text style={{ fontSize: 10 }}>👤</Text>
                                </View>
                                <View style={[styles.commentBubble, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' }]}>
                                  <Text style={styles.commentAuthorName}>{comment.username}</Text>
                                  <Text style={[styles.commentContentText, { color: theme.text }]}>{comment.content}</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Comment Input */}
                        <View style={styles.commentInputRow}>
                          <Image source={{ uri: myAvatar }} style={styles.miniInputAvatar} />
                          <TextInput
                            placeholder="Viết bình luận công khai..."
                            value={commentTexts[post.id] || ''}
                            onChangeText={val => setCommentTexts(prev => ({ ...prev, [post.id]: val }))}
                            placeholderTextColor={theme.textMuted}
                            onSubmitEditing={() => handleCommentSubmit(post.id)}
                            style={[styles.commentTextInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                          />
                          <Pressable 
                            onPress={() => handleCommentSubmit(post.id)} 
                            disabled={!commentTexts[post.id]?.trim()}
                            style={[styles.sendCommentBtn, !commentTexts[post.id]?.trim() && { opacity: 0.5 }]}
                          >
                            <Text style={styles.sendCommentBtnText}>Gửi</Text>
                          </Pressable>
                        </View>

                      </View>
                    );
                  })
                )}
              </>
            )}

            {/* SEGMENT 2: CHALLENGES */}
            {activeSegment === 'challenges' && (
              <>
                <View style={styles.introCard}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#FF9F1C' }}>Thách Thức Bản Thân 💪</Text>
                  <Text style={{ fontSize: 13, color: 'rgba(255, 248, 231, 0.6)', marginTop: 4 }}>
                    Tham gia các thử thách nâng cao sức khỏe để tích lũy điểm kinh nghiệm XP, nâng cấp level và nhận huy hiệu danh giá.
                  </Text>
                </View>

                {challenges.map(chal => {
                  const joined = isChallengeJoined(chal.id);
                  const completed = isChallengeCompleted(chal.id);
                  
                  return (
                    <View key={chal.id} style={[styles.challengeCard, completed && { borderColor: '#FF9F1C', borderWidth: 1.5 }]}>
                      <View style={styles.challengeHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF8E7' }}>{chal.title}</Text>
                          <Text style={{ marginTop: 2, fontSize: 12, color: '#FF9F1C', fontWeight: '800' }}>Phần thưởng: 🌟 {chal.xpReward} XP</Text>
                        </View>
                        {completed ? (
                          <View style={[styles.statusBadge, { borderColor: '#FF9F1C', backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                            <Text style={{ color: '#4ADE80', fontSize: 10, fontWeight: '800' }}>HOÀN THÀNH ✓</Text>
                          </View>
                        ) : joined ? (
                          <View style={[styles.statusBadge, { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                            <Text style={{ color: '#FBBF24', fontSize: 10, fontWeight: '800' }}>ĐANG THAM GIA</Text>
                          </View>
                        ) : null}
                      </View>
                      
                      <Text style={{ fontSize: 13, color: 'rgba(255, 248, 231, 0.6)', marginTop: Spacing.one }}>
                        {chal.description}
                      </Text>
                      
                      <View style={styles.postDivider} />
                      
                      {!joined ? (
                        <Pressable 
                          onPress={() => joinChallenge(chal.id)} 
                          style={[styles.challengeActionBtn, { backgroundColor: '#FF9F1C' }]}
                        >
                          <Text style={styles.btnTextDark}>Tham gia thử thách</Text>
                        </Pressable>
                      ) : !completed ? (
                        <Pressable 
                          onPress={() => completeChallenge(chal.id)} 
                          style={[styles.challengeActionBtn, { backgroundColor: '#F59E0B' }]}
                        >
                          <Text style={styles.btnTextDark}>Đóng dấu Hoàn thành</Text>
                        </Pressable>
                      ) : (
                        <Pressable disabled style={[styles.challengeActionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.08)', opacity: 0.8 }]}>
                          <Text style={{ color: 'rgba(255, 248, 231, 0.5)', fontSize: 13, fontWeight: '600' }}>Bạn đã hoàn thành thử thách này</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </>
            )}

            {/* SEGMENT 3: LEADERBOARD */}
            {activeSegment === 'leaderboard' && (
              <>
                <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#FF9F1C' }}>Bảng Xếp Hạng BodyFit 👑</Text>
                  <Text style={[styles.emptyPostsDesc, { color: theme.textMuted, marginTop: 4 }]}>
                    Bảng vinh danh những thành viên tích cực nhất hệ thống và đạt kết quả giảm cân ấn tượng.
                  </Text>
                </View>

                {isLoadingLeaderboard ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#FF9F1C" />
                    <Text style={{ marginTop: 8, fontSize: 12, color: theme.textMuted }}>Đang tổng hợp dữ liệu...</Text>
                  </View>
                ) : (
                  <View style={[styles.boardCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={{ color: '#FF9F1C', fontSize: 16, fontWeight: '800', marginBottom: Spacing.two }}>
                      Top Huấn Luyện Tích Cực 🔥
                    </Text>
                    <View style={styles.postDivider} />
                    
                    {leaderboard.topActive.map((user: any, index: number) => (
                      <View key={index} style={styles.leaderboardRow}>
                        <Text style={[styles.rankText, index === 0 && { color: '#F59E0B' }]}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                        </Text>
                        <Text style={{ flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '800', color: theme.text }}>{user.name}</Text>
                        <View style={styles.rankDetailBadge}>
                          <Text style={{ fontSize: 11, color: '#FF9F1C', fontWeight: '700' }}>Cấp {user.level} ({user.xp} XP)</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* SEGMENT 4: STRENGTH 1RM */}
            {activeSegment === 'strength' && (
              <>
                <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#FF9F1C' }}>Đo Lường Sức Mạnh 1RM 🏋️‍♂️</Text>
                  <Text style={[styles.emptyPostsDesc, { color: theme.textMuted, marginTop: 4 }]}>
                    Theo dõi sức mạnh tối đa 1RM (Squat, Bench Press, Deadlift) để đánh giá cấp độ thể lực theo chuẩn quốc tế.
                  </Text>
                </View>

                {/* Strength Record Input Form Card */}
                <View style={[styles.strengthFormCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text, marginBottom: 4 }}>
                    Chỉ số 1RM Tải Trọng Tối Đa
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12 }}>
                    Nhập mức tạ lớn nhất (kg) bạn có thể đẩy 1 lần duy nhất chuẩn form.
                  </Text>

                  <View style={styles.strengthInputsRow}>
                    <View style={styles.strengthInputCol}>
                      <Text style={[styles.strengthInputLabel, { color: theme.textSecondary }]}>Squat 🦵</Text>
                      <TextInput
                        placeholder="kg"
                        keyboardType="numeric"
                        value={squatVal}
                        onChangeText={setSquatVal}
                        placeholderTextColor={theme.textMuted}
                        style={[styles.strengthValInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                      />
                    </View>

                    <View style={styles.strengthInputCol}>
                      <Text style={[styles.strengthInputLabel, { color: theme.textSecondary }]}>Bench Press 🦍</Text>
                      <TextInput
                        placeholder="kg"
                        keyboardType="numeric"
                        value={benchVal}
                        onChangeText={setBenchVal}
                        placeholderTextColor={theme.textMuted}
                        style={[styles.strengthValInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                      />
                    </View>

                    <View style={styles.strengthInputCol}>
                      <Text style={[styles.strengthInputLabel, { color: theme.textSecondary }]}>Deadlift ⚡</Text>
                      <TextInput
                        placeholder="kg"
                        keyboardType="numeric"
                        value={deadliftVal}
                        onChangeText={setDeadliftVal}
                        placeholderTextColor={theme.textMuted}
                        style={[styles.strengthValInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                      />
                    </View>
                  </View>

                  <Pressable onPress={handleSaveStrength} style={styles.saveStrengthBtn}>
                    <Text style={styles.saveStrengthBtnText}>Cập Nhật Chỉ Số 1RM (+30 XP)</Text>
                  </Pressable>

                  {/* Chart History */}
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#FF9F1C', marginBottom: 8 }}>
                      Biểu Đồ Tiến Trình Sức Mạnh
                    </Text>
                    <StrengthChart history={liftingHistory} />
                  </View>
                </View>
              </>
            )}

          </View>

          {/* RIGHT SIDEBAR WIDGETS COLUMN (VISIBILITY ON DESKTOP & MOBILE INTEGRATION) */}
          <View style={isWebDesktop ? styles.sidebarCol : { width: '100%', gap: Spacing.three, marginTop: Spacing.two }}>
            
            {/* WIDGET 1: DAILY QUESTS & REWARDS */}
            <View style={[styles.widgetCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.widgetHeader}>
                <Text style={styles.widgetTitle}>Nhiệm Vụ Hàng Ngày 🎯</Text>
                <Pressable onPress={() => setIsBadgeStoreOpen(true)} style={styles.badgeStoreBtn}>
                  <Text style={styles.badgeStoreBtnText}>🛒 Cửa Hàng ({userProfile.coins ?? 0} 🪙)</Text>
                </Pressable>
              </View>

              <View style={[styles.postDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

              {quests.length === 0 ? (
                <Text style={{ textAlign: 'center', paddingVertical: 12, color: theme.textMuted, fontSize: 12 }}>
                  Đang khởi tạo nhiệm vụ...
                </Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {quests.map(q => {
                    const progressPct = Math.min(100, (q.currentValue / q.targetValue) * 100);
                    return (
                      <View key={q.id} style={styles.widgetQuestItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.questTitle, { color: theme.text }]}>{q.title}</Text>
                          <View style={[styles.progressContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                            <View style={[styles.progressBar, { width: `${progressPct}%`, backgroundColor: q.isCompleted ? '#FF9F1C' : '#94A3B8' }]} />
                          </View>
                          <Text style={[styles.questProgressText, { color: theme.textMuted }]}>{q.currentValue}/{q.targetValue} ({progressPct.toFixed(0)}%)</Text>
                        </View>

                        {q.isClaimed ? (
                          <View style={[styles.claimedBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }]}>
                            <Text style={[styles.claimedBadgeText, { color: theme.textMuted }]}>ĐÃ NHẬN</Text>
                          </View>
                        ) : q.isCompleted ? (
                          <Pressable onPress={() => claimQuestReward(q.id)} style={styles.claimBtn}>
                            <Text style={styles.claimBtnText}>NHẬN (+{q.coinReward}🪙)</Text>
                          </Pressable>
                        ) : (
                          <View style={styles.rewardPreviewBadge}>
                            <Text style={styles.rewardPreviewText}>+{q.xpReward} XP</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* WIDGET 2: TOP FITNESS LEADERS */}
            {leaderboard.topActive && leaderboard.topActive.length > 0 ? (
              <View style={[styles.widgetCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={styles.widgetTitle}>Bảng Xếp Hạng Vô Địch 👑</Text>
                <View style={[styles.postDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                {leaderboard.topActive.slice(0, 4).map((leader: any, idx: number) => (
                  <View key={idx} style={styles.sidebarLeaderRow}>
                    <Text style={{ fontSize: 14 }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️'}</Text>
                    <Text style={[styles.sidebarLeaderName, { color: theme.text }]} numberOfLines={1}>{leader.name}</Text>
                    <Text style={styles.sidebarLeaderLevel}>Lv.{leader.level}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* WIDGET 3: MY BADGES SHELF */}
            <View style={[styles.widgetCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={styles.widgetTitle}>Huy Hiệu Cá Nhân ({userBadges.length}) 🏅</Text>
              <View style={[styles.postDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

              {userBadges.length === 0 ? (
                <Text style={{ fontSize: 12, color: theme.textMuted, fontStyle: 'italic' }}>
                  Chưa có huy hiệu. Hãy hoàn thành nhiệm vụ để đổi huy hiệu!
                </Text>
              ) : (
                <View style={styles.badgesWrapGrid}>
                  {userBadges.map(badge => (
                    <View key={badge.id} style={[styles.badgeMiniPill, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)', borderColor: theme.cardBorder }]}>
                      <Text style={{ fontSize: 14 }}>
                        {badge.icon === 'droplet' ? '💧' : 
                         badge.icon === 'star' ? '⭐' : 
                         badge.icon === 'bench_badge' ? '🦍' :
                         badge.icon === 'squat_badge' ? '🦵' :
                         badge.icon === 'fat_destroyer' ? '⚔️' : '🏅'}
                      </Text>
                      <Text style={[styles.badgeMiniText, { color: theme.text }]} numberOfLines={1}>{badge.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

          </View>

        </View>

      </ScrollView>

      {/* BADGE STORE MODAL */}
      {isBadgeStoreOpen && (
        <View style={styles.modalOverlay}>
          <View style={[styles.storeContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.storeHeader}>
              <Text style={{ color: '#FF9F1C', fontSize: 18, fontWeight: '800' }}>Cửa Hàng Huy Hiệu 🛒</Text>
              <Pressable onPress={() => setIsBadgeStoreOpen(false)} style={styles.closeBtn}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>✕</Text>
              </Pressable>
            </View>

            <Text style={{ fontSize: 12, color: theme.textMuted }}>
              Sử dụng Coin tích lũy từ nhiệm vụ ({userProfile.coins ?? 0} 🪙) để đổi huy hiệu độc quyền!
            </Text>

            <ScrollView contentContainerStyle={styles.storeItemsRow} showsVerticalScrollIndicator={false}>
              {storeItems.map(item => {
                const isOwned = userBadges.some(b => b.name === item.name);
                return (
                  <View key={item.name} style={[styles.storeItemCard, { backgroundColor: isDark ? '#1E1A17' : 'rgba(0,0,0,0.03)', borderColor: theme.cardBorder }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontWeight: '800', color: theme.text, fontSize: 14 }}>{item.name}</Text>
                      <Text style={{ fontSize: 11, color: '#FF9F1C', fontWeight: '700' }}>Giá: {item.cost} 🪙</Text>
                    </View>

                    {isOwned ? (
                      <View style={[styles.ownedBadgeBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.06)' }]}>
                        <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>ĐÃ SỞ HỮU</Text>
                      </View>
                    ) : (
                      <Pressable 
                        onPress={() => buyBadge(item.name, item.cost, item.icon)} 
                        style={[styles.buyBtn, { backgroundColor: '#FF9F1C' }]}
                      >
                        <Text style={{ color: '#100E0C', fontSize: 11, fontWeight: '900' }}>MUA (🪙)</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

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
  segmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    gap: Spacing.two,
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
  segmentBtn: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },
  desktopLayoutRow: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
    alignItems: 'flex-start',
  },
  mobileLayoutCol: {
    flexDirection: 'column',
    gap: 16,
    width: '100%',
  },
  mainFeedCol: {
    flex: 1,
    gap: Spacing.three,
    maxWidth: 860,
  },
  sidebarCol: {
    width: 360,
    gap: Spacing.three,
  },

  /* SOCIAL COMPOSER */
  socialComposerCard: {
    backgroundColor: '#141210',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.2)',
    gap: 12,
  },
  composerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  composerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#FF9F1C',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FF9F1C',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  levelBadgeText: {
    color: '#100E0C',
    fontSize: 9,
    fontWeight: '900',
  },
  composerTitle: {
    color: '#FFF8E7',
    fontSize: 15,
    fontWeight: '800',
  },
  composerSubtitle: {
    color: 'rgba(255, 248, 231, 0.5)',
    fontSize: 11,
  },
  composerInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.15)',
    borderRadius: 12,
    padding: 12,
    color: '#FFF8E7',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  photoInputContainer: {
    gap: 8,
  },
  photoUrlInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF8E7',
    fontSize: 13,
  },
  photoPreviewWrap: {
    position: 'relative',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.4)',
  },
  photoPreviewImg: {
    width: '100%',
    height: '100%',
  },
  photoAttachedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.3)',
  },
  photoAttachedBadgeText: {
    color: '#FF9F1C',
    fontSize: 11,
    fontWeight: '700',
  },
  photoActionGroup: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  changePhotoBtn: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  removePhotoBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  photoPickerDropzone: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 28, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  pickFileBtn: {
    width: '100%',
    backgroundColor: 'rgba(255, 159, 28, 0.15)',
    borderWidth: 1,
    borderColor: '#FF9F1C',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pickFileBtnText: {
    color: '#FFF8E7',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  pickFileSubText: {
    color: 'rgba(255, 248, 231, 0.5)',
    fontSize: 11,
    marginTop: 4,
  },
  toggleUrlBtn: {
    paddingVertical: 4,
  },
  toggleUrlText: {
    color: 'rgba(255, 159, 28, 0.8)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  composerActionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 4,
  },
  quickTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  quickTagBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickTagText: {
    color: 'rgba(255, 248, 231, 0.75)',
    fontSize: 12,
    fontWeight: '700',
  },
  publishPostBtn: {
    backgroundColor: '#FF9F1C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  publishPostBtnText: {
    color: '#100E0C',
    fontSize: 13,
    fontWeight: '900',
  },

  /* FEED FILTERS BAR */
  feedFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  feedFiltersTitle: {
    color: 'rgba(255, 248, 231, 0.45)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  feedFilterPills: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(255, 159, 28, 0.2)',
    borderWidth: 1,
    borderColor: '#FF9F1C',
  },
  filterPillText: {
    color: 'rgba(255, 248, 231, 0.6)',
    fontSize: 11,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FF9F1C',
    fontWeight: '900',
  },

  /* SOCIAL POST CARD */
  socialPostCard: {
    backgroundColor: '#141210',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  postCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF9F1C',
  },
  postAuthorName: {
    color: '#FFF8E7',
    fontSize: 14,
    fontWeight: '800',
  },
  authorBadgeTag: {
    backgroundColor: 'rgba(255, 159, 28, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FF9F1C',
  },
  authorBadgeTagText: {
    color: '#FF9F1C',
    fontSize: 9,
    fontWeight: '900',
  },
  postTimeText: {
    color: 'rgba(255, 248, 231, 0.45)',
    fontSize: 11,
    marginTop: 2,
  },
  postContentText: {
    color: '#FFF8E7',
    fontSize: 14,
    lineHeight: 22,
  },
  postImageContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 6,
  },
  deletePostBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deletePostBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  postMediaImg: {
    width: '100%',
    height: 380,
    maxHeight: 460,
  },
  postStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  postStatText: {
    color: 'rgba(255, 248, 231, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  postDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  socialActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  socialActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  socialActionIcon: {
    fontSize: 14,
  },
  socialActionText: {
    color: 'rgba(255, 248, 231, 0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  commentsBox: {
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 10,
  },
  commentRowItem: {
    flexDirection: 'row',
    gap: 8,
  },
  commentAvatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 159, 28, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  commentAuthorName: {
    color: '#FF9F1C',
    fontSize: 11,
    fontWeight: '800',
  },
  commentContentText: {
    color: '#FFF8E7',
    fontSize: 12,
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniInputAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    color: '#FFF8E7',
    fontSize: 12,
  },
  sendCommentBtn: {
    backgroundColor: '#FF9F1C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  sendCommentBtnText: {
    color: '#100E0C',
    fontSize: 11,
    fontWeight: '900',
  },
  emptyPostsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#141210',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyPostsTitle: {
    color: '#FFF8E7',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyPostsDesc: {
    color: 'rgba(255, 248, 231, 0.5)',
    fontSize: 12,
    marginTop: 4,
  },

  /* SIDEBAR WIDGETS */
  widgetCard: {
    backgroundColor: '#141210',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetTitle: {
    color: '#FF9F1C',
    fontSize: 14,
    fontWeight: '800',
  },
  badgeStoreBtn: {
    backgroundColor: 'rgba(255, 159, 28, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeStoreBtnText: {
    color: '#FF9F1C',
    fontSize: 11,
    fontWeight: '800',
  },
  widgetQuestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  questTitle: {
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginVertical: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  questProgressText: {
    color: 'rgba(255, 248, 231, 0.45)',
    fontSize: 10,
  },
  claimedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  claimedBadgeText: {
    color: 'rgba(255, 248, 231, 0.5)',
    fontSize: 10,
    fontWeight: '700',
  },
  claimBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  claimBtnText: {
    color: '#100E0C',
    fontSize: 10,
    fontWeight: '900',
  },
  rewardPreviewBadge: {
    backgroundColor: 'rgba(255, 159, 28, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardPreviewText: {
    color: '#FF9F1C',
    fontSize: 10,
    fontWeight: '800',
  },
  sidebarLeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarLeaderName: {
    color: '#FFF8E7',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  sidebarLeaderLevel: {
    color: '#FF9F1C',
    fontSize: 11,
    fontWeight: '800',
  },
  badgesWrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeMiniText: {
    color: '#FFF8E7',
    fontSize: 11,
    fontWeight: '700',
  },

  /* OTHER SEGMENTS CARDS */
  introCard: {
    backgroundColor: '#141210',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.2)',
  },
  challengeCard: {
    backgroundColor: '#141210',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  challengeActionBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextDark: {
    color: '#100E0C',
    fontWeight: '900',
    fontSize: 13,
  },
  boardCard: {
    backgroundColor: '#141210',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rankText: {
    fontSize: 16,
    width: 28,
  },
  rankDetailBadge: {
    backgroundColor: 'rgba(255, 159, 28, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  /* STRENGTH FORM */
  strengthFormCard: {
    backgroundColor: '#141210',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  strengthInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  strengthInputCol: {
    flex: 1,
  },
  strengthInputLabel: {
    color: '#FFF8E7',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  strengthValInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#FFF8E7',
    fontSize: 14,
  },
  saveStrengthBtn: {
    backgroundColor: '#FF9F1C',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveStrengthBtnText: {
    color: '#100E0C',
    fontSize: 13,
    fontWeight: '900',
  },

  /* STORE MODAL */
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  storeContainer: {
    width: '90%',
    maxWidth: 480,
    maxHeight: '80%',
    backgroundColor: '#141210',
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 28, 0.4)',
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  storeItemsRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  storeItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
  },
  ownedBadgeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
});
