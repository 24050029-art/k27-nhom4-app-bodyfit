import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, Modal, ActivityIndicator, Alert, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Gradients, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useLocalDb } from '@/hooks/use-local-db';
import { getLocalDateString } from '@/utils/date';

const formatExerciseReps = (ex: any): string => {
  if (!ex) return '12 cái';
  if (ex.reps && typeof ex.reps === 'string' && ex.reps.trim().length > 0) {
    const raw = ex.reps.trim();
    if (/^\d+$/.test(raw)) {
      return `${raw} cái`;
    }
    return raw;
  }
  if (typeof ex.reps === 'number' && ex.reps > 0) {
    return `${ex.reps} cái`;
  }

  const name = (ex.name || '').toLowerCase();
  if (name.includes('plank') || name.includes('giữ') || name.includes('hold') || name.includes('tĩnh')) {
    return '30s - 1 phút';
  }
  if (name.includes('jumping') || name.includes('hiit') || name.includes('chạy') || name.includes('nhảy') || name.includes('cardio') || name.includes('mountain') || name.includes('knees')) {
    return '45 giây';
  }
  if (name.includes('hít đất') || name.includes('pushup') || name.includes('chống đẩy') || name.includes('burpee')) {
    return '12 - 15 cái';
  }
  if (name.includes('squat') || name.includes('gập bụng') || name.includes('crunch') || name.includes('lunge') || name.includes('nâng chân') || name.includes('twist') || name.includes('đẩy ngực') || name.includes('kéo lưng')) {
    return '12 - 15 cái';
  }

  return '12 - 15 cái';
};

export default function WorkoutScreen() {
  const { theme, isDark } = useAppTheme();
  const { 
    userProfile, 
    generateAiWorkout, 
    logCompletedWorkout, 
    workoutSchedules, 
    toggleWorkoutCompleted, 
    workoutPrograms, 
    scheduleWorkout,
    addWorkoutProgram,
    deleteWorkoutProgram
  } = useLocalDb();

  const [activeTab, setActiveTab] = useState<'tracker' | 'plan'>('tracker');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showRoutines, setShowRoutines] = useState(true);

  // Manual Workout Creator States
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualExercises, setManualExercises] = useState([{ name: '', sets: '3', reps: '12' }]);
  // AI Workout Generator Modal States
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiStep, setAiStep] = useState<'input' | 'loading' | 'result'>('input');
  const [aiGoalInput, setAiGoalInput] = useState('');
  const [aiGeneratedPlan, setAiGeneratedPlan] = useState<any>(null);

  // Active Workout Session States
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const timerRef = useRef<any>(null);

  const [manualCategory, setManualCategory] = useState<'ABS' | 'GYM' | 'CARDIO' | 'HOME' | 'YOGA' | 'OTHER'>('HOME');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    abs: true,
    gym: true,
    cardio: true,
    home: true,
    yoga: true,
    other: true,
  });
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);

  useEffect(() => {
    if (activeSession) {
      timerRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeSession]);

  const today = getLocalDateString();
  const todayWorkouts = workoutSchedules.filter((item: any) => item.scheduledDate === today);
  const completedCount = workoutSchedules.filter((item: any) => item.isCompleted).length;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Active Rest Timer State (Thời gian nghỉ giữa các hiệp & đổi bài tập)
  const [restTimer, setRestTimer] = useState<{
    active: boolean;
    seconds: number;
    totalSeconds: number;
    type: 'set' | 'exercise';
    nextExerciseName?: string;
    nextSetNumber?: number;
  }>({ active: false, seconds: 0, totalSeconds: 60, type: 'set' });

  useEffect(() => {
    let interval: any = null;
    if (restTimer.active && restTimer.seconds > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev.seconds <= 1) {
            return { ...prev, active: false, seconds: 0 };
          }
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restTimer.active, restTimer.seconds]);

  const addRestTime = (secs: number) => {
    setRestTimer(prev => ({ ...prev, seconds: prev.seconds + secs }));
  };

  const skipRestTime = () => {
    setRestTimer(prev => ({ ...prev, active: false, seconds: 0 }));
  };

  const handleStartWorkout = (program: any) => {
    setActiveSession(program);
    setSessionDuration(0);
    setCompletedSets({});
    setRestTimer({ active: false, seconds: 0, totalSeconds: 60, type: 'set' });
    setStatus('');
  };

  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    const key = `${exIdx}_${setIdx}`;
    const willBeCompleted = !completedSets[key];

    setCompletedSets(prev => ({
      ...prev,
      [key]: willBeCompleted
    }));

    if (willBeCompleted && activeSession?.exercises) {
      const currentEx = activeSession.exercises[exIdx];
      const totalSetsForEx = currentEx?.sets || 3;

      let allSetsDone = true;
      for (let s = 0; s < totalSetsForEx; s++) {
        if (s === setIdx) continue;
        if (!completedSets[`${exIdx}_${s}`]) {
          allSetsDone = false;
          break;
        }
      }

      if (allSetsDone) {
        const nextEx = activeSession.exercises[exIdx + 1];
        if (nextEx) {
          setRestTimer({
            active: true,
            seconds: 90,
            totalSeconds: 90,
            type: 'exercise',
            nextExerciseName: nextEx.name
          });
        } else {
          setRestTimer({
            active: true,
            seconds: 60,
            totalSeconds: 60,
            type: 'set',
            nextSetNumber: setIdx + 1
          });
        }
      } else {
        setRestTimer({
          active: true,
          seconds: 60,
          totalSeconds: 60,
          type: 'set',
          nextSetNumber: setIdx + 2
        });
      }
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    try {
      setLoading(true);
      await logCompletedWorkout(activeSession.title, activeSession.exercises || []);
      setStatus(`Đã lưu hoàn thành buổi tập: ${activeSession.title} (${formatDuration(sessionDuration)})`);
      setActiveSession(null);
      Alert.alert('Chúc mừng! 🏆', `Bạn đã hoàn thành buổi tập "${activeSession.title}" trong ${formatDuration(sessionDuration)}!`);
    } catch (err) {
      setStatus('Không thể lưu buổi tập.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Bạn có chắc chắn muốn thoát buổi tập hiện tại? Mọi tiến trình tập sẽ không được lưu.');
      if (confirmed) {
        setActiveSession(null);
      }
      return;
    }
    Alert.alert(
      'Hủy buổi tập?',
      'Bạn có chắc chắn muốn thoát buổi tập hiện tại? Mọi tiến trình tập sẽ không được lưu.',
      [
        { text: 'Tiếp tục tập', style: 'cancel' },
        { text: 'Hủy bỏ', style: 'destructive', onPress: () => setActiveSession(null) }
      ]
    );
  };

  const openManualModal = () => {
    setManualTitle('');
    setManualDescription('');
    setManualCategory('HOME');
    setManualExercises([{ name: '', sets: '3', reps: '12' }]);
    setManualModalVisible(true);
  };

  const updateManualExercise = (index: number, field: 'name' | 'sets' | 'reps', value: string) => {
    setManualExercises(prev => prev.map((exercise, exerciseIndex) =>
      exerciseIndex === index ? { ...exercise, [field]: value } : exercise
    ));
  };

  const addManualExercise = () => {
    setManualExercises(prev => [...prev, { name: '', sets: '3', reps: '12' }]);
  };

  const removeManualExercise = (index: number) => {
    setManualExercises(prev => prev.length === 1 ? prev : prev.filter((_, exerciseIndex) => exerciseIndex !== index));
  };

  const handleSaveManualWorkout = () => {
    const title = manualTitle.trim();
    const validExercises = manualExercises.filter(exercise => exercise.name.trim());
    if (!title) {
      Alert.alert('Thiếu tên bài tập', 'Vui lòng nhập tên cho bài tập của bạn.');
      return;
    }
    if (validExercises.length === 0) {
      Alert.alert('Chưa có động tác', 'Vui lòng nhập ít nhất một động tác.');
      return;
    }

    addWorkoutProgram({
      title,
      description: manualDescription.trim() || 'Bài tập do bạn tự tạo.',
      category: manualCategory,
      exercises: validExercises.map(exercise => ({
        name: exercise.name.trim(),
        sets: Math.max(1, Number.parseInt(exercise.sets, 10) || 1),
        reps: exercise.reps.trim() || '1 lần',
      })),
    });
    setManualModalVisible(false);
    setStatus(`Đã thêm "${title}" vào lộ trình.`);
    setActiveTab('plan');
  };
  const openAiModal = () => {
    setAiGoalInput('');
    setAiGeneratedPlan(null);
    setAiStep('input');
    setAiModalVisible(true);
  };

  const handleAiGenerate = async () => {
    if (!aiGoalInput.trim()) {
      Alert.alert('Vui lòng nhập mục tiêu', 'Hãy mô tả mục tiêu cơ thể mà bạn muốn đạt được (ví dụ: "Tôi muốn có cơ bụng 6 múi").');
      return;
    }
    setAiStep('loading');
    try {
      const plan = await generateAiWorkout(aiGoalInput.trim());
      if (plan) {
        setAiGeneratedPlan(plan);
        setAiStep('result');
      } else {
        Alert.alert('Lỗi', 'Không thể tạo bài tập. Vui lòng thử lại.');
        setAiStep('input');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'AI không thể xử lý yêu cầu. Vui lòng thử lại.');
      setAiStep('input');
    }
  };

  const handleDeleteProgram = (program: any) => {
    Alert.alert(
      'Xóa bài tập?',
      `Bạn có chắc muốn xóa "${program.title}" khỏi lộ trình không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteWorkoutProgram(program.id);
            setStatus(`Đã xóa "${program.title}" khỏi lộ trình.`);
            if (selectedGroupKey) {
              const currentGroup = groupedPrograms.find(([key]) => key === selectedGroupKey);
              if (currentGroup && currentGroup[1].items.length <= 1) {
                setSelectedGroupKey(null);
              }
            }
          },
        },
      ]
    );
  };
  const handleAddToPlan = () => {
    if (!aiGeneratedPlan) return;
    addWorkoutProgram({
      title: aiGeneratedPlan.title,
      description: aiGeneratedPlan.description,
      category: aiGeneratedPlan.category || 'HOME',
      exercises: aiGeneratedPlan.exercises
    });
    setAiModalVisible(false);
    setActiveTab('plan');
    setShowRoutines(true);
    setStatus(`Đã thêm "${aiGeneratedPlan.title}" vào lộ trình tập của bạn!`);
    Alert.alert('Thành công! 🎉', `"${aiGeneratedPlan.title}" đã được thêm vào danh sách bài tập của bạn. Bạn có thể bắt đầu tập ngay!`);
  };

  // Group default/sample programs for display in Screenshot 3
  const activePrograms = useMemo(() => workoutPrograms || [], [workoutPrograms]);

  const roadmapSteps = useMemo(() => {
    return activePrograms.map((program, index) => {
      const isCompleted = workoutSchedules.some(s => s.programId === program.id && s.isCompleted);
      return {
        ...program,
        stepNumber: index + 1,
        isCompleted
      };
    });
  }, [activePrograms, workoutSchedules]);

  const nextRecommendedStepId = useMemo(() => {
    const next = roadmapSteps.find(step => !step.isCompleted);
    return next ? next.id : (roadmapSteps[0]?.id || null);
  }, [roadmapSteps]);

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const groupedPrograms = useMemo(() => {
    const groups: Record<string, { label: string, icon: string, items: typeof activePrograms }> = {
      abs: { label: 'Lên cơ bụng 6 múi 🍫', icon: 'fitness-outline', items: [] },
      gym: { label: 'Tập Gym Toàn Thân 🏋️‍♂️', icon: 'barbell-outline', items: [] },
      cardio: { label: 'Cardio & HIIT Đốt Mỡ 🏃‍♂️', icon: 'walk-outline', items: [] },
      home: { label: 'Tập Kháng Lực Tại Nhà 🏠', icon: 'home-outline', items: [] },
      yoga: { label: 'Yoga & Thư Giãn 🧘‍♂️', icon: 'body-outline', items: [] },
      other: { label: 'Bài tập tùy chọn khác 📝', icon: 'document-text-outline', items: [] }
    };

    activePrograms.forEach(program => {
      const titleLower = program.title.toLowerCase();
      const descLower = (program.description || '').toLowerCase();
      const cat = (program.category || '').toUpperCase();

      if (titleLower.includes('bụng') || titleLower.includes('abs') || titleLower.includes('6 múi') || cat === 'ABS') {
        groups.abs.items.push(program);
      } else if (cat === 'GYM' || titleLower.includes('gym') || titleLower.includes('tạ')) {
        groups.gym.items.push(program);
      } else if (cat === 'CARDIO' || titleLower.includes('cardio') || titleLower.includes('hiit') || titleLower.includes('chạy')) {
        groups.cardio.items.push(program);
      } else if (cat === 'YOGA' || titleLower.includes('yoga') || titleLower.includes('stretch') || titleLower.includes('thiền')) {
        groups.yoga.items.push(program);
      } else if (cat === 'HOME' || titleLower.includes('tại nhà') || titleLower.includes('bodyweight')) {
        groups.home.items.push(program);
      } else {
        groups.other.items.push(program);
      }
    });

    return Object.entries(groups).filter(([_, group]) => group.items.length > 0);
  }, [activePrograms]);

  // Auto exit group roadmap view when all items in selected category are deleted
  useEffect(() => {
    if (selectedGroupKey !== null) {
      const currentGroup = groupedPrograms.find(([key]) => key === selectedGroupKey);
      if (!currentGroup || currentGroup[1].items.length === 0) {
        setSelectedGroupKey(null);
      }
    }
  }, [groupedPrograms, selectedGroupKey]);

  const totalSessionSets = activeSession?.exercises?.reduce((acc: number, cur: any) => acc + (cur.sets || 3), 0) || 0;
  const completedSessionSets = Object.values(completedSets).filter(Boolean).length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Custom Header Row matching mockup */}
        <View style={styles.customHeader}>
          <Text style={[styles.headerTitleText, { color: theme.text }]}>Chinh phục mục tiêu</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          


          {/* Segmented Control Selector */}
          <View style={[styles.segmentedContainer, { borderColor: theme.cardBorder, borderWidth: 1.2 }]}>
            <Pressable 
              onPress={() => setActiveTab('tracker')} 
              style={[styles.segmentBtn, activeTab === 'tracker' && { backgroundColor: 'rgba(255, 159, 28, 0.12)' }]}
            >
              <Text style={[styles.segmentBtnText, activeTab === 'tracker' ? { color: theme.primary } : { color: theme.textMuted }]}>
                Nhật ký tập (Tracker)
              </Text>
            </Pressable>
            <Pressable 
              onPress={() => setActiveTab('plan')} 
              style={[styles.segmentBtn, activeTab === 'plan' && { backgroundColor: 'rgba(255, 159, 28, 0.12)' }]}
            >
              <Text style={[styles.segmentBtnText, activeTab === 'plan' ? { color: theme.primary } : { color: theme.textMuted }]}>
                Lộ trình (My Plan)
              </Text>
            </Pressable>
          </View>

          {activeTab === 'tracker' ? (
            <>
              {/* Orange Welcome Workout Card */}
              <LinearGradient colors={Gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.welcomeCard}>
                <View style={styles.welcomeCardLeft}>
                  <Text style={[styles.welcomeCardTitle, { color: '#100E0C' }]}>Tập Gym Toàn Thân</Text>
                  <Text style={[styles.welcomeCardSub, { color: 'rgba(16, 14, 12, 0.8)' }]}>45 phút • Trung bình</Text>
                </View>
                <Ionicons name="barbell-outline" size={40} color="#100E0C" />
              </LinearGradient>

              {status ? <Text style={styles.statusText}>{status}</Text> : null}

              {/* New Workout Buttons Grid */}
              <View style={styles.sectionHeaderWrap}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Bài tập mới</Text>
              </View>
              <View style={styles.newWorkoutGrid}>
                <Pressable onPress={openManualModal} style={[styles.workoutActionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.workoutActionText, { color: theme.text }]}>Tạo bài tập thủ công</Text>
                  <Ionicons name="create-outline" size={23} color={theme.primary} style={{ alignSelf: 'flex-end' }} />
                </Pressable>
                
                <Pressable onPress={openAiModal} style={[styles.workoutActionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.workoutActionText, { color: theme.text }]}>Tạo bài tập tự động (AI)</Text>
                  <Ionicons name="flash-outline" size={23} color="#FFD700" style={{ alignSelf: 'flex-end' }} />
                </Pressable>
              </View>

              {/* Accordion "Bài tập của tôi" */}
              <View style={[styles.accordionContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Pressable 
                  onPress={() => setShowRoutines(!showRoutines)} 
                  style={[styles.accordionHeader, { backgroundColor: 'rgba(255, 255, 255, 0.02)' }]}
                >
                  <View style={styles.accordionHeaderLeft}>
                    <Ionicons name="folder-open-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.accordionTitle, { color: theme.text }]}>Bài tập của tôi ({activePrograms.length})</Text>
                  </View>
                  <Ionicons 
                    name={showRoutines ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color={theme.text} 
                  />
                </Pressable>

                {showRoutines && (
                  <View style={styles.accordionBody}>
                    {activePrograms.map((program) => (
                      <View key={program.id} style={[styles.programItemCard, { backgroundColor: 'rgba(255, 255, 255, 0.01)', borderColor: 'rgba(255, 255, 255, 0.04)' }]}>
                        <View style={styles.programItemHeader}>
                          <Text style={[styles.programItemTitle, { color: theme.text }]}>{program.title}</Text>
                          <Text style={[styles.programItemMeta, { color: theme.textMuted }]}>
                            {(program as any).totalSets || (program.exercises?.reduce((acc: number, cur: any) => acc + (cur.sets || 3), 0)) || 12} hiệp
                          </Text>
                        </View>
                        
                        <View style={styles.exerciseList}>
                          {program.exercises.slice(0, 3).map((ex: any, idx: number) => (
                            <View key={`${ex.name}-${idx}`} style={styles.exerciseRow}>
                              <Text style={styles.exerciseEmoji}>🏋️</Text>
                              <View style={styles.exerciseInfo}>
                                <Text style={[styles.exerciseName, { color: theme.textSecondary, fontWeight: '700' }]} numberOfLines={1}>{ex.name}</Text>
                                <Text style={[styles.exerciseSets, { color: theme.textMuted }]}>
                                  {ex.sets || 3} hiệp × {formatExerciseReps(ex)}
                                </Text>
                              </View>
                            </View>
                          ))}
                          
                          {program.exercises.length > 3 && (
                            <Text style={[styles.moreExercisesText, { color: theme.textMuted }]}>
                              và {program.exercises.length - 3} động tác khác
                            </Text>
                          )}
                        </View>

                        <Pressable 
                          onPress={() => handleStartWorkout(program)} 
                          style={[styles.startWorkoutBtn, { backgroundColor: theme.primary }]}
                        >
                          <Text style={[styles.startWorkoutText, { color: '#100E0C' }]}>BẮT ĐẦU</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Saved History List */}
              <View style={[styles.timelineCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.timelineHeader, { color: theme.text }]}>Lịch sử đã lưu hôm nay</Text>
                {todayWorkouts.length ? todayWorkouts.map((item: any) => (
                  <View key={item.id} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyTitle, { color: theme.text }]}>{item.program?.title || 'Buổi tập'}</Text>
                      <Text style={[styles.historyMeta, { color: theme.textMuted }]}>{item.isCompleted ? 'Đã hoàn thành' : 'Đã lên lịch'} hôm nay</Text>
                    </View>
                    <Pressable onPress={() => toggleWorkoutCompleted(item.id)} style={styles.historyButton}>
                      <Ionicons name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={theme.primary} />
                    </Pressable>
                  </View>
                )) : <Text style={styles.emptyText}>Chưa lưu buổi tập nào trong ngày.</Text>}
              </View>
            </>
          ) : (
            <View style={styles.planContainer}>
              <Ionicons name="map-outline" size={42} color={theme.primary} />
              <Text style={[styles.planTitle, { color: theme.text }]}>Lộ trình luyện tập của bạn</Text>
              <Text style={[styles.planDescription, { color: theme.textSecondary }]}>Các bài tập đã thêm được lưu tại đây. Chọn một bài để bắt đầu tập.</Text>
              <View style={styles.planList}>
                {selectedGroupKey === null ? (
                  // View 1: Main Category Groups List
                  groupedPrograms.map(([groupKey, group]) => (
                    <Pressable 
                      key={groupKey} 
                      onPress={() => setSelectedGroupKey(groupKey)}
                      style={[styles.groupHeader, { backgroundColor: theme.card || 'rgba(255,255,255,0.06)', borderColor: theme.cardBorder || 'rgba(255,255,255,0.08)', marginBottom: 12 }]}
                    >
                      <View style={styles.groupHeaderLeft}>
                        <Ionicons name={group.icon as any} size={18} color={theme.primary} style={{ marginRight: 8 }} />
                        <Text style={[styles.groupHeaderTitle, { color: theme.text }]}>
                          {group.label} ({group.items.length})
                        </Text>
                      </View>
                      <Ionicons 
                        name="chevron-forward" 
                        size={16} 
                        color="#FFF8E7" 
                      />
                    </Pressable>
                  ))
                ) : (
                  // View 2: Nested Roadmap Timeline Detail View for Selected Category
                  (() => {
                    const currentGroup = groupedPrograms.find(([key]) => key === selectedGroupKey);
                    if (!currentGroup) {
                      setTimeout(() => setSelectedGroupKey(null), 0);
                      return null;
                    }
                    const [groupKey, group] = currentGroup;

                    return (
                      <View style={styles.singleGroupContainer}>
                        {/* Go Back button */}
                        <Pressable 
                          onPress={() => setSelectedGroupKey(null)}
                          style={[styles.backToGroupsBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.cardBorder }]}
                        >
                          <Ionicons name="arrow-back" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                          <Text style={[styles.backToGroupsText, { color: theme.text }]}>Quay lại chọn nhóm khác</Text>
                        </Pressable>

                        <Text style={[styles.activeGroupTitle, { color: theme.text }]}>{group.label}</Text>

                        <View style={[styles.groupBody, styles.roadmapListContainer, { marginTop: 16 }]}>
                          {group.items.length > 0 && <View style={styles.timelineLine} />}

                          {group.items.map((program, index) => {
                            const stepNumber = index + 1;
                            const isCompleted = workoutSchedules.some(s => s.programId === program.id && s.isCompleted);
                            
                            const nextInGroup = group.items.find(item => !workoutSchedules.some(s => s.programId === item.id && s.isCompleted));
                            const isRecommended = nextInGroup ? program.id === nextInGroup.id : (index === 0);

                            return (
                              <View key={program.id} style={styles.roadmapStepRow}>
                                {/* Left: Timeline indicator */}
                                <View style={styles.stepIndicatorContainer}>
                                  {isCompleted ? (
                                    <View style={[styles.stepDot, styles.stepDotCompleted]}>
                                      <Ionicons name="checkmark" size={14} color="#10120F" />
                                    </View>
                                  ) : isRecommended ? (
                                    <View style={[styles.stepDot, styles.stepDotActive]}>
                                      <Text style={styles.stepDotActiveText}>{stepNumber}</Text>
                                    </View>
                                  ) : (
                                    <View style={styles.stepDot}>
                                      <Text style={[styles.stepDotText, { color: theme.textMuted }]}>{stepNumber}</Text>
                                    </View>
                                  )}
                                </View>

                                {/* Right: Step card */}
                                <View style={[
                                  styles.stepCard, 
                                  isRecommended && { backgroundColor: 'rgba(255, 159, 28, 0.05)', borderColor: 'rgba(255, 159, 28, 0.28)' },
                                  isCompleted && { borderColor: 'rgba(255, 215, 0, 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.015)' }
                                ]}>
                                  <View style={styles.planProgramHeader}>
                                    <View style={{ flex: 1 }}>
                                      <View style={styles.stepHeaderRow}>
                                        <Text style={[
                                          styles.stepNumberLabel, 
                                          { color: isCompleted ? '#FFD700' : isRecommended ? theme.primary : theme.textMuted }
                                        ]}>
                                          BƯỚC {stepNumber}
                                        </Text>
                                        {isRecommended && (
                                          <View style={[styles.nextUpBadge, { backgroundColor: 'rgba(255, 159, 28, 0.12)', borderColor: 'rgba(255, 159, 28, 0.25)' }]}>
                                            <Text style={styles.nextUpBadgeText}>KHUYÊN TẬP</Text>
                                          </View>
                                        )}
                                        {isCompleted && (
                                          <View style={[styles.completedBadge, { backgroundColor: 'rgba(255, 215, 0, 0.12)', borderColor: 'rgba(255, 215, 0, 0.25)' }]}>
                                            <Text style={styles.completedBadgeText}>ĐÃ XONG</Text>
                                          </View>
                                        )}
                                      </View>
                                      <Text style={[styles.planProgramTitle, { color: theme.text, marginTop: 4 }]}>{program.title}</Text>
                                      {!!(program as any).description && (
                                        <Text style={[styles.planProgramDescription, { color: theme.textMuted }]}>
                                          {(program as any).description}
                                        </Text>
                                      )}
                                    </View>

                                    <View style={styles.planHeaderActions}>
                                      {program.id.startsWith('ai_') && (
                                        <View style={styles.aiBadge}>
                                          <Text style={styles.aiBadgeText}>AI</Text>
                                        </View>
                                      )}
                                      <Pressable
                                        onPress={() => handleDeleteProgram(program)}
                                        hitSlop={8}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Xóa ${program.title} khỏi lộ trình`}
                                        style={styles.planDeleteButton}
                                      >
                                        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                                      </Pressable>
                                    </View>
                                  </View>

                                  <Text style={[styles.planProgramMeta, { color: theme.primary }]}>
                                    {program.exercises.length} động tác · {program.exercises.reduce((sum: number, ex: any) => sum + (ex.sets || 3), 0)} hiệp
                                  </Text>

                                  <Pressable 
                                    onPress={() => handleStartWorkout(program)} 
                                    style={[
                                      styles.planStartButton,
                                      isRecommended ? { backgroundColor: theme.primary } : { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
                                    ]}
                                  >
                                    <Ionicons name="play" size={16} color={isRecommended ? "#100E0C" : theme.text} />
                                    <Text style={[
                                      styles.planStartButtonText,
                                      { color: isRecommended ? "#100E0C" : theme.text }
                                    ]}>
                                      BẮT ĐẦU TẬP
                                    </Text>
                                  </Pressable>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })()
                )}

                {groupedPrograms.length === 0 && (
                  <Text style={styles.emptyText}>Chưa có bài tập nào trong lộ trình.</Text>
                )}
              </View>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* Manual Workout Creator Modal */}
      <Modal visible={manualModalVisible} animationType="slide" transparent onRequestClose={() => setManualModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.manualModalOverlay}>
            <SafeAreaView style={[styles.manualModalContainer, { backgroundColor: '#1E1A17', borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}>
              <View style={styles.manualModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.manualModalTitle, { color: theme.text }]}>Tạo bài tập thủ công</Text>
                  <Text style={[styles.manualModalSubtitle, { color: theme.textMuted }]}>Tự thiết kế bài tập phù hợp với bạn</Text>
                </View>
                <Pressable onPress={() => setManualModalVisible(false)} style={styles.aiModalCloseBtn}>
                  <Ionicons name="close" size={24} color="#FFF8E7" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={[styles.manualLabel, { color: theme.text }]}>Tên bài tập *</Text>
                <TextInput value={manualTitle} onChangeText={setManualTitle} placeholder="Ví dụ: Tập thân trên tại nhà" placeholderTextColor="rgba(255,248,231,0.3)" style={[styles.manualInput, { color: theme.text, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }]} />

                <Text style={styles.manualLabel}>Mô tả</Text>
                <TextInput value={manualDescription} onChangeText={setManualDescription} placeholder="Mục tiêu hoặc ghi chú cho bài tập" placeholderTextColor="rgba(255,248,231,0.3)" multiline style={[styles.manualInput, styles.manualDescriptionInput, { color: theme.text, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }]} />

                <Text style={styles.manualLabel}>Nhóm bài tập (Phân loại)</Text>
                <View style={styles.categorySelectGrid}>
                  {[
                    { id: 'ABS', label: 'Cơ bụng', emoji: '🍫' },
                    { id: 'GYM', label: 'Tập Gym', emoji: '🏋️‍♂️' },
                    { id: 'CARDIO', label: 'Cardio', emoji: '🏃‍♂️' },
                    { id: 'HOME', label: 'Tại nhà', emoji: '🏠' },
                    { id: 'YOGA', label: 'Yoga', emoji: '🧘‍♂️' },
                    { id: 'OTHER', label: 'Khác', emoji: '📝' }
                  ].map(cat => (
                    <Pressable
                      key={cat.id}
                      onPress={() => setManualCategory(cat.id as any)}
                      style={[
                        styles.categorySelectBtn,
                        manualCategory === cat.id && { borderColor: theme.primary, backgroundColor: 'rgba(255, 159, 28, 0.12)' }
                      ]}
                    >
                      <Text style={styles.categorySelectEmoji}>{cat.emoji}</Text>
                      <Text style={[
                        styles.categorySelectText,
                        manualCategory === cat.id && { color: theme.primary }
                      ]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.manualSectionHeader}>
                  <Text style={[styles.manualSectionTitle, { color: theme.text }]}>Danh sách động tác</Text>
                  <Text style={[styles.manualExerciseCount, { color: theme.primary }]}>{manualExercises.length} động tác</Text>
                </View>

                {manualExercises.map((exercise, index) => (
                  <View key={index} style={[styles.manualExerciseCard, { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255, 159, 28, 0.15)' }]}>
                    <View style={styles.manualExerciseHeader}>
                      <Text style={[styles.manualExerciseNumber, { color: theme.primary }]}>Động tác {index + 1}</Text>
                      {manualExercises.length > 1 && (
                        <Pressable onPress={() => removeManualExercise(index)} hitSlop={8}>
                          <Ionicons name="trash-outline" size={19} color="#FF6B6B" />
                        </Pressable>
                      )}
                    </View>
                    <TextInput value={exercise.name} onChangeText={value => updateManualExercise(index, 'name', value)} placeholder="Tên động tác, ví dụ: Chống đẩy" placeholderTextColor="rgba(255,248,231,0.3)" style={styles.manualInput} />
                    <View style={styles.manualExerciseFields}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.manualSmallLabel, { color: theme.textMuted }]}>Số hiệp</Text>
                        <TextInput value={exercise.sets} onChangeText={value => updateManualExercise(index, 'sets', value.replace(/[^0-9]/g, ''))} keyboardType="number-pad" style={styles.manualInput} />
                      </View>
                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.manualSmallLabel}>Số lần / thời gian</Text>
                        <TextInput value={exercise.reps} onChangeText={value => updateManualExercise(index, 'reps', value)} placeholder="12 lần / 30 giây" placeholderTextColor="rgba(255,248,231,0.3)" style={styles.manualInput} />
                      </View>
                    </View>
                  </View>
                ))}

                <Pressable onPress={addManualExercise} style={[styles.manualAddExerciseButton, { borderColor: 'rgba(255, 159, 28, 0.4)' }]}>
                  <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                  <Text style={[styles.manualAddExerciseText, { color: theme.primary }]}>Thêm động tác</Text>
                </Pressable>
                <Pressable onPress={handleSaveManualWorkout} style={[styles.manualSaveButton, { backgroundColor: theme.primary }]}>
                  <Ionicons name="save-outline" size={20} color="#10120F" />
                  <Text style={[styles.manualSaveButtonText, { color: '#100E0C' }]}>LƯU VÀO LỘ TRÌNH</Text>
                </Pressable>
              </ScrollView>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Active Workout Session Modal */}
      <Modal
        visible={activeSession !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelSession}
      >
        <View style={[styles.sessionOverlay, { backgroundColor: theme.background }]}>
          <SafeAreaView style={styles.sessionContainer}>
            {/* Header */}
            <View style={styles.sessionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sessionTitleText, { color: theme.text }]} numberOfLines={1}>{activeSession?.title}</Text>
                <Text style={[styles.sessionSubtitleText, { color: theme.primary }]}>
                  Đã hoàn thành {completedSessionSets}/{totalSessionSets} hiệp
                </Text>
              </View>
              <Pressable 
                onPress={handleCancelSession} 
                hitSlop={14}
                accessibilityRole="button"
                accessibilityLabel="Hủy buổi tập"
                style={({ hovered }: any) => [
                  styles.sessionCloseBtn,
                  hovered && { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  Platform.OS === 'web' && ({ cursor: 'pointer', zIndex: 9999 } as any)
                ]}
              >
                <Ionicons name="close" size={24} color="#FFF8E7" />
              </Pressable>
            </View>

            {/* Timer card */}
            <View style={[styles.sessionTimerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Ionicons name="time-outline" size={24} color={theme.primary} />
              <Text style={[styles.sessionTimerText, { color: theme.primary }]}>{formatDuration(sessionDuration)}</Text>
              <Text style={[styles.sessionTimerLabel, { color: theme.textMuted }]}>Thời gian tập tổng</Text>
            </View>

            {/* Milestone Time Breakdown Legend Bar */}
            <View style={styles.timeBreakdownBar}>
              <View style={styles.timeBadgeItem}>
                <Text style={styles.timeBadgeLabel}>⏱️ Thời gian tập</Text>
                <Text style={styles.timeBadgeVal}>45s - 60s/hiệp</Text>
              </View>
              <View style={styles.timeBadgeDivider} />
              <View style={styles.timeBadgeItem}>
                <Text style={styles.timeBadgeLabel}>⏸️ Nghỉ giữa hiệp</Text>
                <Text style={styles.timeBadgeVal}>60 giây</Text>
              </View>
              <View style={styles.timeBadgeDivider} />
              <View style={styles.timeBadgeItem}>
                <Text style={styles.timeBadgeLabel}>🔄 Nghỉ đổi bài</Text>
                <Text style={styles.timeBadgeVal}>90 giây</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.sessionProgressContainer}>
              <View 
                style={[
                  styles.sessionProgressBar, 
                  { width: `${totalSessionSets > 0 ? (completedSessionSets / totalSessionSets) * 100 : 0}%` }
                ]} 
              />
            </View>

            {/* Active Rest Countdown Timer Banner */}
            {restTimer.active && (
              <View style={[styles.restTimerBanner, restTimer.type === 'exercise' ? styles.restTimerBannerExercise : styles.restTimerBannerSet]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: restTimer.type === 'exercise' ? '#38BDF8' : '#FF9F1C', letterSpacing: 0.5 }}>
                    {restTimer.type === 'exercise' ? '🔄 NGHỈ ĐỔI BÀI TẬP (CHUYỂN ĐỘNG TÁC)' : '⏸️ NGHỈ GIỮA CÁC HIỆP'}
                  </Text>
                  <Text style={styles.restTimerCountdownText}>{formatDuration(restTimer.seconds)}</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255, 248, 231, 0.7)', marginTop: 2 }}>
                    {restTimer.type === 'exercise' 
                      ? `Bài tiếp theo: "${restTimer.nextExerciseName}"`
                      : `Chuẩn bị cho Hiệp tiếp theo. Thả lỏng và hít thở sâu!`
                    }
                  </Text>
                </View>

                <View style={{ gap: 6, justifyContent: 'center' }}>
                  <Pressable onPress={() => addRestTime(15)} style={styles.restAddBtn}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>+15s</Text>
                  </Pressable>
                  <Pressable onPress={skipRestTime} style={styles.restSkipBtn}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>Bỏ qua ➔</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Exercises List */}
            <ScrollView style={styles.sessionExerciseScroll} showsVerticalScrollIndicator={false}>
              {activeSession?.exercises?.map((ex: any, exIdx: number) => {
                const repTarget = formatExerciseReps(ex);
                return (
                  <View key={`${ex.name}-${exIdx}`} style={[styles.sessionExerciseCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.sessionExerciseHeader}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.sessionExerciseName, { color: theme.text }]}>{ex.name}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          <View style={styles.badgeTarget}>
                            <Text style={styles.badgeTargetText}>🎯 {repTarget}</Text>
                          </View>
                          <View style={styles.badgeRestSet}>
                            <Text style={styles.badgeRestSetText}>⏸️ Nghỉ hiệp: 60s</Text>
                          </View>
                          <View style={styles.badgeRestEx}>
                            <Text style={styles.badgeRestExText}>🔄 Nghỉ đổi bài: 90s</Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={[styles.sessionExerciseSetsText, { color: theme.textMuted, fontWeight: '700' }]}>
                          {ex.sets || 3} hiệp tổng
                        </Text>
                      </View>
                    </View>
                  
                  {/* Sets grid */}
                  <View style={styles.sessionSetsGrid}>
                    {Array.from({ length: ex.sets || 3 }).map((_, setIdx) => {
                      const isSetDone = !!completedSets[`${exIdx}_${setIdx}`];
                      return (
                        <Pressable 
                          key={setIdx} 
                          onPress={() => toggleSetComplete(exIdx, setIdx)}
                          style={[
                            styles.sessionSetCircle, 
                            isSetDone && { backgroundColor: theme.primary, borderColor: theme.primary }
                          ]}
                        >
                          {isSetDone ? (
                            <Ionicons name="checkmark" size={14} color="#10120F" />
                          ) : (
                            <Text style={[styles.sessionSetCircleText, { color: theme.textSecondary }]}>{setIdx + 1}</Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            </ScrollView>

            {/* Bottom complete action */}
            <View style={styles.sessionFooter}>
              {loading ? (
                <View style={[styles.sessionCompleteBtn, { opacity: 0.8 }]}>
                  <ActivityIndicator color="#10120F" size="small" />
                </View>
              ) : (
                <Pressable 
                  onPress={handleCompleteSession} 
                  style={[styles.sessionCompleteBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
                >
                  <Text style={[styles.sessionCompleteBtnText, { color: '#100E0C' }]}>HOÀN THÀNH BUỔI TẬP</Text>
                </Pressable>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* AI Workout Generator Modal */}
      <Modal
        visible={aiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAiModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.aiModalOverlay}>
            <SafeAreaView style={[styles.aiModalContainer, { backgroundColor: '#1E1A17', borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}>
              {/* Header */}
              <View style={styles.aiModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.aiModalTitle, { color: theme.text }]}>
                    {aiStep === 'input' ? 'Tạo bài tập AI ⚡' : aiStep === 'loading' ? 'AI đang phân tích...' : 'Bài tập của bạn 🏆'}
                  </Text>
                  <Text style={[styles.aiModalSubtitle, { color: theme.textMuted }]}>
                    {aiStep === 'input' 
                      ? `Chiều cao: ${userProfile?.heightCm || 175}cm · Cân nặng: ${userProfile?.weightKg || 70}kg`
                      : aiStep === 'loading'
                      ? 'Đang thiết kế bài tập phù hợp thể trạng...'
                      : aiGeneratedPlan?.duration + ' · ' + aiGeneratedPlan?.resultTimeframe
                    }
                  </Text>
                </View>
                <Pressable onPress={() => setAiModalVisible(false)} style={styles.aiModalCloseBtn}>
                  <Ionicons name="close" size={24} color="#FFF8E7" />
                </Pressable>
              </View>

              {aiStep === 'input' && (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {/* Goal input */}
                  <Text style={[styles.aiInputLabel, { color: theme.text }]}>Mô tả mục tiêu cơ thể của bạn:</Text>
                  <TextInput
                    placeholder="Ví dụ: Tôi muốn có cơ bụng 6 múi..."
                    placeholderTextColor="rgba(255, 248, 231, 0.3)"
                    value={aiGoalInput}
                    onChangeText={setAiGoalInput}
                    multiline
                    numberOfLines={3}
                    style={[styles.aiGoalTextInput, { color: theme.text, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,159,28,0.3)' }]}
                  />

                  {/* Quick suggestion buttons */}
                  <Text style={[styles.aiSuggestLabel, { color: theme.textMuted }]}>Hoặc chọn nhanh:</Text>
                  <View style={styles.aiSuggestGrid}>
                    {[
                      { emoji: '🧘‍♂️', text: 'Cơ bụng 6 múi' },
                      { emoji: '🦵', text: 'Thon gọn mông đùi' },
                      { emoji: '💪', text: 'Tăng cơ ngực & vai' },
                      { emoji: '🔥', text: 'Giảm mỡ toàn thân' },
                      { emoji: '🏃‍♂️', text: 'Tăng sức bền cardio' },
                      { emoji: '🤸‍♂️', text: 'Dẻo dai & linh hoạt' },
                    ].map((item) => (
                      <Pressable 
                        key={item.text}
                        onPress={() => setAiGoalInput(`Tôi muốn ${item.text.toLowerCase()}`)}
                        style={[
                          styles.aiSuggestBtn,
                          { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.06)' },
                          aiGoalInput.toLowerCase().includes(item.text.toLowerCase()) && { borderColor: theme.primary, backgroundColor: 'rgba(255,159,28,0.1)' }
                        ]}
                      >
                        <Text style={styles.aiSuggestEmoji}>{item.emoji}</Text>
                        <Text style={[
                          styles.aiSuggestText,
                          { color: theme.textMuted },
                          aiGoalInput.toLowerCase().includes(item.text.toLowerCase()) && { color: theme.primary }
                        ]}>{item.text}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* User body info summary */}
                  <View style={[styles.aiBodyInfoCard, { backgroundColor: 'rgba(255,159,28,0.08)' }]}>
                    <Text style={[styles.aiBodyInfoTitle, { color: theme.primary }]}>Thông tin thể trạng của bạn</Text>
                    <View style={styles.aiBodyInfoRow}>
                      <View style={styles.aiBodyInfoItem}>
                        <Text style={[styles.aiBodyInfoValue, { color: theme.text }]}>{userProfile?.heightCm || 175}</Text>
                        <Text style={[styles.aiBodyInfoLabel, { color: theme.textMuted }]}>cm</Text>
                      </View>
                      <View style={styles.aiBodyInfoItem}>
                        <Text style={styles.aiBodyInfoValue}>{userProfile?.weightKg || 70}</Text>
                        <Text style={styles.aiBodyInfoLabel}>kg</Text>
                      </View>
                      <View style={styles.aiBodyInfoItem}>
                        <Text style={styles.aiBodyInfoValue}>{userProfile?.age || 25}</Text>
                        <Text style={styles.aiBodyInfoLabel}>tuổi</Text>
                      </View>
                      <View style={styles.aiBodyInfoItem}>
                        <Text style={styles.aiBodyInfoValue}>{(userProfile?.weightKg && userProfile?.heightCm) ? (userProfile.weightKg / Math.pow(userProfile.heightCm / 100, 2)).toFixed(1) : '22.9'}</Text>
                        <Text style={styles.aiBodyInfoLabel}>BMI</Text>
                      </View>
                    </View>
                  </View>

                  {/* Generate button */}
                  <Pressable onPress={handleAiGenerate} style={[styles.aiGenerateBtn, { backgroundColor: theme.primary }]}>
                    <Ionicons name="flash" size={20} color="#10120F" />
                    <Text style={[styles.aiGenerateBtnText, { color: '#100E0C' }]}>AI TẠO BÀI TẬP CHO TÔI</Text>
                  </Pressable>
                </ScrollView>
              )}

              {aiStep === 'loading' && (
                <View style={styles.aiLoadingContainer}>
                  <ActivityIndicator size="large" color="#FF9F0A" />
                  <Text style={[styles.aiLoadingText, { color: theme.text }]}>Huấn luyện viên AI đang phân tích{'\n'}thể trạng và mục tiêu của bạn...</Text>
                  <Text style={[styles.aiLoadingSubtext, { color: theme.primary }]}>"{aiGoalInput}"</Text>
                </View>
              )}

              {aiStep === 'result' && aiGeneratedPlan && (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {/* Plan title & description */}
                  <LinearGradient colors={['rgba(35, 217, 120, 0.15)', 'rgba(35, 217, 120, 0.05)']} style={styles.aiResultTitleCard}>
                    <Text style={[styles.aiResultTitle, { color: theme.text }]}>{aiGeneratedPlan.title}</Text>
                    <Text style={[styles.aiResultDesc, { color: theme.textSecondary }]}>{aiGeneratedPlan.description}</Text>
                    <View style={styles.aiResultMetaRow}>
                      <View style={styles.aiResultMetaItem}>
                        <Ionicons name="time-outline" size={14} color="#FF9F0A" />
                        <Text style={[styles.aiResultMetaText, { color: theme.text }]}>{aiGeneratedPlan.duration}</Text>
                      </View>
                      <View style={styles.aiResultMetaItem}>
                        <Ionicons name="calendar-outline" size={14} color="#23D978" />
                        <Text style={styles.aiResultMetaText}>{aiGeneratedPlan.resultTimeframe}</Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {/* Exercise list */}
                  <Text style={[styles.aiResultExercisesTitle, { color: theme.text }]}>Các động tác ({aiGeneratedPlan.exercises.length})</Text>
                  {aiGeneratedPlan.exercises.map((ex: any, idx: number) => (
                    <View key={idx} style={[styles.aiResultExerciseRow, { backgroundColor: 'rgba(255,255,255,0.02)' }]}>
                      <Text style={styles.aiResultExerciseEmoji}>{ex.emoji || '🏋️'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.aiResultExerciseName, { color: theme.text }]}>{ex.name}</Text>
                        <Text style={[styles.aiResultExerciseMeta, { color: theme.textMuted }]}>{ex.sets} hiệp × {ex.reps}</Text>
                      </View>
                    </View>
                  ))}

                  {/* Action buttons */}
                  <View style={styles.aiResultActions}>
                    <Pressable onPress={handleAddToPlan} style={[styles.aiAddToPlanBtn, { backgroundColor: theme.primary }]}>
                      <Ionicons name="add-circle" size={20} color="#10120F" />
                      <Text style={[styles.aiAddToPlanBtnText, { color: '#100E0C' }]}>THÊM VÀO LỘ TRÌNH</Text>
                    </Pressable>
                    <Pressable onPress={() => { setAiStep('input'); setAiGeneratedPlan(null); }} style={styles.aiRetryBtn}>
                      <Ionicons name="refresh" size={18} color="#FF9F0A" />
                      <Text style={[styles.aiRetryBtnText, { color: theme.primary }]}>Tạo lại</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              )}
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    gap: 16,
  },
  topStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  levelBadgeText: {
    color: '#FFF8E7',
    fontSize: 13,
    fontWeight: '800',
  },
  statusMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusMetricItem: {
    color: '#FFF8E7',
    fontSize: 14,
    fontWeight: '800',
  },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#26D9F8',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Segmented Control Selector
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(38, 217, 248, 0.15)',
  },
  segmentBtnText: {
    color: 'rgba(255, 248, 231, 0.6)',
    fontSize: 13,
    fontWeight: '800',
  },
  segmentBtnTextActive: {
    color: '#26D9F8',
    fontWeight: '900',
  },

  // Welcome Card
  welcomeCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 108,
  },
  welcomeCardLeft: {
    gap: 6,
  },
  welcomeCardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  welcomeCardSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '800',
  },
  welcomeCardEmoji: {
    fontSize: 38,
  },

  statusText: {
    color: '#23D978',
    fontSize: 13,
    fontWeight: '800',
  },

  // New Workout Buttons
  sectionHeaderWrap: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF8E7',
  },
  newWorkoutGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  workoutActionCard: {
    flex: 1,
    backgroundColor: 'rgba(29, 34, 26, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 28, 0.35)',
    borderRadius: 20,
    padding: 16,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  workoutActionText: {
    color: '#FFF8E7',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  workoutActionEmoji: {
    alignSelf: 'flex-end',
    fontSize: 20,
  },

  // Accordion routines section
  accordionContainer: {
    backgroundColor: 'rgba(29, 34, 26, 0.45)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 28, 0.35)',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionTitle: {
    color: '#FFF8E7',
    fontSize: 14,
    fontWeight: '900',
  },
  accordionBody: {
    padding: 12,
    gap: 10,
  },
  programItemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 159, 28, 0.35)',
  },
  programItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programItemTitle: {
    color: '#FFF8E7',
    fontSize: 16,
    fontWeight: '900',
  },
  programItemMeta: {
    color: 'rgba(255, 248, 231, 0.62)',
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseList: {
    marginTop: 10,
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseEmoji: {
    fontSize: 14,
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseName: {
    color: '#FFF8E7',
    fontSize: 13,
    flex: 0.8,
  },
  exerciseSets: {
    color: 'rgba(255, 248, 231, 0.58)',
    fontSize: 13,
    fontWeight: '700',
  },
  moreExercisesText: {
    color: 'rgba(255, 248, 231, 0.44)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    marginLeft: 24,
  },
  startWorkoutBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E65FF',
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 9,
    marginTop: 12,
  },
  startWorkoutText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },

  // Saved History List
  timelineCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timelineHeader: {
    color: '#FFF8E7',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  historyTitle: {
    color: '#FFF8E7',
    fontWeight: '900',
    fontSize: 14,
  },
  historyMeta: {
    color: 'rgba(255, 248, 231, 0.6)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  historyButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255, 248, 231, 0.44)',
    fontWeight: '700',
    fontSize: 13,
  },
  
  // Plan Container
  planContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  planList: { width: '100%', gap: 12, marginTop: 8 },
  planProgramCard: { width: '100%', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(18, 14, 35, 0.82)', gap: 10 },
  planProgramHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  planProgramTitle: { color: '#FFF8E7', fontSize: 16, fontWeight: '900' },
  planProgramDescription: { color: 'rgba(255, 248, 231, 0.6)', fontSize: 12, lineHeight: 17, marginTop: 5 },
  planProgramMeta: { color: '#23D978', fontSize: 12, fontWeight: '800' },
  planHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planDeleteButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 107, 107, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.24)' },
  aiBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255, 159, 10, 0.18)' },
  aiBadgeText: { color: '#FF9F0A', fontSize: 11, fontWeight: '900' },
  planStartButton: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#23D978' },
  planStartButtonText: { color: '#10120F', fontSize: 12, fontWeight: '900' },
  planTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  manualModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  manualModalContainer: { height: '90%', backgroundColor: '#1E1A17', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18 },
  manualModalHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  manualModalTitle: { color: '#FFF8E7', fontSize: 20, fontWeight: '900' },
  manualModalSubtitle: { color: 'rgba(255,248,231,0.52)', fontSize: 12, marginTop: 4 },
  manualLabel: { color: '#FFF8E7', fontSize: 13, fontWeight: '800', marginTop: 16, marginBottom: 7 },
  manualSmallLabel: { color: 'rgba(255,248,231,0.58)', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  manualInput: { minHeight: 46, color: '#FFF8E7', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10 },
  manualDescriptionInput: { minHeight: 72, textAlignVertical: 'top' },
  manualSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  manualSectionTitle: { color: '#FFF8E7', fontSize: 15, fontWeight: '900' },
  manualExerciseCount: { color: '#23D978', fontSize: 12, fontWeight: '800' },
  manualExerciseCard: { padding: 13, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(35,217,120,0.16)', marginBottom: 10, gap: 10 },
  manualExerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  manualExerciseNumber: { color: '#23D978', fontSize: 12, fontWeight: '900' },
  manualExerciseFields: { flexDirection: 'row', gap: 10 },
  manualAddExerciseButton: { height: 46, borderRadius: 23, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(35,217,120,0.5)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 2 },
  manualAddExerciseText: { color: '#23D978', fontSize: 13, fontWeight: '800' },
  manualSaveButton: { height: 52, borderRadius: 26, backgroundColor: '#23D978', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, marginBottom: 28 },
  manualSaveButtonText: { color: '#10120F', fontSize: 14, fontWeight: '900' },
  aiModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  aiModalContainer: { height: '88%', backgroundColor: '#151126', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18 },
  aiModalHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  aiModalTitle: { color: '#FFF8E7', fontSize: 20, fontWeight: '900' },
  aiModalSubtitle: { color: 'rgba(255,248,231,0.55)', fontSize: 12, marginTop: 5 },
  aiModalCloseBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  aiInputLabel: { color: '#FFF8E7', fontSize: 15, fontWeight: '800', marginTop: 18, marginBottom: 9 },
  aiGoalTextInput: { minHeight: 92, color: '#FFF8E7', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,159,10,0.45)', borderRadius: 16, padding: 14, textAlignVertical: 'top' },
  aiSuggestLabel: { color: 'rgba(255,248,231,0.65)', fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 9 },
  aiSuggestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aiSuggestBtn: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 7, padding: 11, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  aiSuggestBtnActive: { borderColor: '#FF9F0A', backgroundColor: 'rgba(255,159,10,0.13)' },
  aiSuggestEmoji: { fontSize: 17 },
  aiSuggestText: { flex: 1, color: 'rgba(255,248,231,0.7)', fontSize: 12, fontWeight: '700' },
  aiSuggestTextActive: { color: '#FFB340' },
  aiBodyInfoCard: { marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: 'rgba(35,217,120,0.08)' },
  aiBodyInfoTitle: { color: '#23D978', fontSize: 13, fontWeight: '900', marginBottom: 12 },
  aiBodyInfoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  aiBodyInfoItem: { alignItems: 'center' },
  aiBodyInfoValue: { color: '#FFF8E7', fontSize: 17, fontWeight: '900' },
  aiBodyInfoLabel: { color: 'rgba(255,248,231,0.5)', fontSize: 11 },
  aiGenerateBtn: { marginTop: 18, marginBottom: 24, height: 52, borderRadius: 26, backgroundColor: '#FF9F0A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  aiGenerateBtnText: { color: '#10120F', fontSize: 14, fontWeight: '900' },
  aiLoadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  aiLoadingText: { color: '#FFF8E7', fontSize: 16, lineHeight: 23, fontWeight: '800', textAlign: 'center' },
  aiLoadingSubtext: { color: '#FF9F0A', fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  aiResultTitleCard: { borderRadius: 18, padding: 16, marginTop: 16 },
  aiResultTitle: { color: '#FFF8E7', fontSize: 18, fontWeight: '900' },
  aiResultDesc: { color: 'rgba(255,248,231,0.68)', fontSize: 13, lineHeight: 19, marginTop: 8 },
  aiResultMetaRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  aiResultMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  aiResultMetaText: { color: '#FFF8E7', fontSize: 12, fontWeight: '700' },
  aiResultExercisesTitle: { color: '#FFF8E7', fontSize: 15, fontWeight: '900', marginTop: 18, marginBottom: 8 },
  aiResultExerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, marginBottom: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)' },
  aiResultExerciseEmoji: { fontSize: 23 },
  aiResultExerciseName: { color: '#FFF8E7', fontSize: 14, fontWeight: '800' },
  aiResultExerciseMeta: { color: 'rgba(255,248,231,0.52)', fontSize: 12, marginTop: 3 },
  aiResultActions: { gap: 10, marginTop: 16, marginBottom: 24 },
  aiAddToPlanBtn: { height: 52, borderRadius: 26, backgroundColor: '#23D978', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  aiAddToPlanBtnText: { color: '#10120F', fontSize: 14, fontWeight: '900' },
  aiRetryBtn: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  aiRetryBtnText: { color: '#FF9F0A', fontSize: 13, fontWeight: '800' },
  // Active Session styles
  sessionOverlay: {
    flex: 1,
    backgroundColor: '#10120F',
  },
  sessionContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sessionTitleText: {
    color: '#FFF8E7',
    fontSize: 20,
    fontWeight: '900',
  },
  sessionSubtitleText: {
    color: '#23D978',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  sessionCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  sessionTimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  sessionTimerText: {
    color: '#FF9F0A',
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sessionTimerLabel: {
    color: 'rgba(255, 248, 231, 0.4)',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  sessionProgressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sessionProgressBar: {
    height: '100%',
    backgroundColor: '#23D978',
    borderRadius: 3,
  },
  sessionExerciseScroll: {
    flex: 1,
  },
  sessionExerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  sessionExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionExerciseName: {
    color: '#FFF8E7',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  sessionExerciseSetsText: {
    color: 'rgba(255, 248, 231, 0.5)',
    fontSize: 12,
    fontWeight: '700',
  },
  sessionSetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sessionSetCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sessionSetCircleDone: {
    backgroundColor: '#23D978',
    borderColor: '#23D978',
  },
  sessionSetCircleText: {
    color: 'rgba(255, 248, 231, 0.6)',
    fontSize: 12,
    fontWeight: '800',
  },
  sessionFooter: {
    paddingVertical: 12,
  },
  sessionCompleteBtn: {
    height: 50,
    backgroundColor: '#23D978',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#23D978',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionCompleteBtnText: {
    color: '#10120F',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // Grouped accordion styles
  groupWrapper: {
    width: '100%',
    marginBottom: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  groupHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  groupBody: {
    width: '100%',
    marginTop: 8,
    gap: 10,
    paddingLeft: 4,
  },
  // Manual category selector styles
  categorySelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  categorySelectBtn: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categorySelectBtnActive: {
    borderColor: '#23D978',
    backgroundColor: 'rgba(35, 217, 120, 0.12)',
  },
  categorySelectEmoji: {
    fontSize: 14,
  },
  categorySelectText: {
    color: 'rgba(255, 248, 231, 0.65)',
    fontSize: 11,
    fontWeight: '800',
  },
  categorySelectTextActive: {
    color: '#23D978',
  },
  // Roadmap styles
  roadmapListContainer: {
    width: '100%',
    paddingLeft: 4,
    position: 'relative',
    marginTop: 12,
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 24,
    bottom: 24,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  roadmapStepRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepIndicatorContainer: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10120F',
    borderWidth: 2,
    borderColor: 'rgba(255, 248, 231, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#23D978',
    borderColor: '#23D978',
    shadowColor: '#23D978',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  stepDotActiveText: {
    color: '#10120F',
    fontSize: 11,
    fontWeight: '900',
  },
  stepDotCompleted: {
    backgroundColor: '#8CA83F',
    borderColor: '#8CA83F',
  },
  stepDotText: {
    color: 'rgba(255, 248, 231, 0.4)',
    fontSize: 11,
    fontWeight: '800',
  },
  stepCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    marginLeft: 4,
  },
  stepCardActive: {
    backgroundColor: 'rgba(35, 217, 120, 0.05)',
    borderColor: 'rgba(35, 217, 120, 0.28)',
  },
  stepCardCompleted: {
    borderColor: 'rgba(140, 168, 63, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumberLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  nextUpBadge: {
    backgroundColor: 'rgba(35, 217, 120, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(35, 217, 120, 0.3)',
  },
  nextUpBadgeText: {
    color: '#23D978',
    fontSize: 9,
    fontWeight: '900',
  },
  completedBadge: {
    backgroundColor: 'rgba(140, 168, 63, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(140, 168, 63, 0.3)',
  },
  completedBadgeText: {
    color: '#8CA83F',
    fontSize: 9,
    fontWeight: '900',
  },
  planStartButtonActive: {
    backgroundColor: '#23D978',
    borderColor: '#23D978',
  },
  // Selected category roadmap detail styles
  singleGroupContainer: {
    width: '100%',
  },
  backToGroupsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backToGroupsText: {
    fontSize: 12,
    fontWeight: '800',
  },
  activeGroupTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
    paddingLeft: 4,
  },
  // Custom Styles for redesign
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
  headerRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeBreakdownBar: {
    flexDirection: 'row',
    backgroundColor: '#1E1A17',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.2)',
    alignItems: 'center',
  },
  timeBadgeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 248, 231, 0.6)',
  },
  timeBadgeVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF9F1C',
    marginTop: 2,
  },
  timeBadgeDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  restTimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginVertical: 8,
    borderWidth: 1.5,
  },
  restTimerBannerSet: {
    backgroundColor: 'rgba(255, 159, 28, 0.12)',
    borderColor: '#FF9F1C',
  },
  restTimerBannerExercise: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38BDF8',
  },
  restTimerCountdownText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  restAddBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  restSkipBtn: {
    backgroundColor: '#FF9F1C',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  badgeTarget: {
    backgroundColor: 'rgba(255, 159, 28, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTargetText: {
    color: '#FF9F1C',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeRestSet: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeRestSetText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  badgeRestEx: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeRestExText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
});