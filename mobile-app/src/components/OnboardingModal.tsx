import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalDb, UserProfile } from '@/hooks/use-local-db';
import { useTheme } from '@/hooks/use-theme';
import { Gradients, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onComplete?: () => void;
}

export const OnboardingModal: React.FC<Props> = ({ visible, onComplete }) => {
  const theme = useTheme();
  const { updateProfile, currentUser, userProfile } = useLocalDb();

  const [step, setStep] = useState(1);

  // Step 1: Personal Info
  const [firstName, setFirstName] = useState(userProfile?.firstName || currentUser?.username || 'Hội viên');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [age, setAge] = useState(userProfile?.age ? String(userProfile.age) : '24');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(userProfile?.gender || 'male');

  // Step 2: Metrics
  const [heightCm, setHeightCm] = useState(userProfile?.heightCm ? String(userProfile.heightCm) : '170');
  const [weightKg, setWeightKg] = useState(userProfile?.weightKg ? String(userProfile.weightKg) : '65');

  // Step 3: Goals & Activity
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(
    userProfile?.activityLevel || 'moderately_active'
  );
  const [targetGoal, setTargetGoal] = useState<UserProfile['targetGoal']>(
    userProfile?.targetGoal || 'muscle_gain'
  );

  // Computed previews
  const heightVal = parseFloat(heightCm) || 170;
  const weightVal = parseFloat(weightKg) || 65;
  const ageVal = parseInt(age, 10) || 24;

  // BMI preview
  const heightM = heightVal / 100;
  const bmiPreview = heightM > 0 ? (weightVal / (heightM * heightM)).toFixed(1) : '22.0';
  const bmiNum = parseFloat(bmiPreview);
  const bmiCategory =
    bmiNum < 18.5 ? 'Gầy / Thiếu cân' : bmiNum < 24.9 ? 'Bình thường / Cân đối' : bmiNum < 29.9 ? 'Thừa cân' : 'Béo phì';

  // BMR & TDEE preview
  const bmrBase =
    gender === 'male'
      ? 10 * weightVal + 6.25 * heightVal - 5 * ageVal + 5
      : 10 * weightVal + 6.25 * heightVal - 5 * ageVal - 161;
  const bmrPreview = Math.round(bmrBase);

  const actMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    athlete: 1.9,
  };
  const tdeePreview = Math.round(bmrBase * actMultipliers[activityLevel]);

  // Target Calorie adjustment based on Goal
  let calTarget = tdeePreview;
  if (targetGoal === 'weight_loss') calTarget -= 400;
  else if (targetGoal === 'weight_gain' || targetGoal === 'muscle_gain') calTarget += 300;
  calTarget = Math.max(1200, Math.round(calTarget));

  // Target Water preview
  const waterTargetL = ((weightVal * 35) / 1000).toFixed(1);

  const handleNextStep = () => {
    if (step === 1) {
      if (!firstName.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập tên của bạn.');
        return;
      }
      if (!ageVal || ageVal < 10 || ageVal > 100) {
        Alert.alert('Thông báo', 'Vui lòng nhập độ tuổi hợp lệ (10 - 100 tuổi).');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!heightVal || heightVal < 100 || heightVal > 250) {
        Alert.alert('Thông báo', 'Vui lòng nhập chiều cao hợp lệ (100cm - 250cm).');
        return;
      }
      if (!weightVal || weightVal < 30 || weightVal > 250) {
        Alert.alert('Thông báo', 'Vui lòng nhập cân nặng hợp lệ (30kg - 250kg).');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleFinish = () => {
    updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: ageVal,
      gender,
      heightCm: heightVal,
      weightKg: weightVal,
      activityLevel,
      targetGoal,
    });

    if (onComplete) {
      onComplete();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {step > 1 && (
              <Pressable onPress={() => setStep(step - 1)} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color={theme.text} />
              </Pressable>
            )}
            <Text style={[styles.headerTitle, { color: theme.text }]}>Thiết lập hồ sơ BodyFit AI</Text>
          </View>
          <Text style={[styles.stepText, { color: theme.primary }]}>Bước {step}/4</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 4) * 100}%`, backgroundColor: theme.primary }]} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* STEP 1: PERSONAL INFO */}
          {step === 1 && (
            <View style={styles.stepBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Chào bạn! Hãy cho AI biết bạn là ai</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Tên của bạn *</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Nhập tên (ví dụ: An, Hùng)"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Họ & Tên đệm (Tùy chọn)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Nhập họ & tên đệm (ví dụ: Nguyễn Văn)"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Tuổi *</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Giới tính *</Text>
                  <View style={styles.genderRow}>
                    <Pressable
                      onPress={() => setGender('male')}
                      style={[
                        styles.genderBtn,
                        gender === 'male' && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                    >
                      <Text style={[styles.genderText, gender === 'male' ? { color: '#000' } : { color: theme.text }]}>
                        ♂ Nam
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setGender('female')}
                      style={[
                        styles.genderBtn,
                        gender === 'female' && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                    >
                      <Text style={[styles.genderText, gender === 'female' ? { color: '#000' } : { color: theme.text }]}>
                        ♀ Nữ
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: BODY METRICS */}
          {step === 2 && (
            <View style={styles.stepBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="body" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Chỉ số cơ thể của bạn</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Dữ liệu này giúp AI tính chính xác lượng Kcal và dinh dưỡng cần thiết hàng ngày.
              </Text>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Chiều cao (cm) *</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                    value={heightCm}
                    onChangeText={setHeightCm}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Cân nặng (kg) *</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                    value={weightKg}
                    onChangeText={setWeightKg}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>

              {/* Live Preview Card */}
              <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>Chỉ số BMI dự kiến:</Text>
                  <Text style={[styles.previewVal, { color: theme.primary }]}>{bmiPreview}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>Trạng thái cơ thể:</Text>
                  <Text style={[styles.previewVal, { color: theme.text }]}>{bmiCategory}</Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: LIFESTYLE & GOAL */}
          {step === 3 && (
            <View style={styles.stepBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="barbell" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Mục tiêu & Lối sống</Text>

              <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Mức độ vận động hàng ngày</Text>
              {[
                { key: 'sedentary', label: 'Ít vận động', sub: 'Làm việc văn phòng, ít đi lại' },
                { key: 'lightly_active', label: 'Vận động nhẹ', sub: 'Tập thể dục 1-3 buổi/tuần' },
                { key: 'moderately_active', label: 'Vận động vừa', sub: 'Tập thể dục 3-5 buổi/tuần' },
                { key: 'very_active', label: 'Vận động nhiều', sub: 'Tập 6-7 buổi/tuần, lao động chân tay' },
                { key: 'athlete', label: 'Vận động viên / Cường độ cao', sub: 'Tập 2 lần/ngày' },
              ].map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => setActivityLevel(item.key as any)}
                  style={[
                    styles.optionCard,
                    { backgroundColor: theme.card, borderColor: activityLevel === item.key ? theme.primary : theme.cardBorder }
                  ]}
                >
                  <Text style={[styles.optionTitle, { color: activityLevel === item.key ? theme.primary : theme.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.optionSub, { color: theme.textSecondary }]}>{item.sub}</Text>
                </Pressable>
              ))}

              <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>2. Mục tiêu chính của bạn</Text>
              {[
                { key: 'muscle_gain', label: '💪 Tăng cơ bắp & Sức mạnh', sub: 'Tăng khối lượng cơ, thừa hụt calo nhẹ' },
                { key: 'weight_loss', label: '🔥 Giảm cân / Giảm mỡ', sub: 'Giảm mỡ thừa, thâm hụt calo an toàn' },
                { key: 'maintain_weight', label: '⚖️ Giữ cân nặng hiện tại', sub: 'Duy trì vóc dáng & sức khỏe' },
                { key: 'healthy_lifestyle', label: '🌿 Sống khỏe & Phục hồi', sub: 'Tăng sức bền, cải thiện năng lượng' },
              ].map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => setTargetGoal(item.key as any)}
                  style={[
                    styles.optionCard,
                    { backgroundColor: theme.card, borderColor: targetGoal === item.key ? theme.primary : theme.cardBorder }
                  ]}
                >
                  <Text style={[styles.optionTitle, { color: targetGoal === item.key ? theme.primary : theme.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.optionSub, { color: theme.textSecondary }]}>{item.sub}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* STEP 4: SUMMARY & AI PLAN */}
          {step === 4 && (
            <View style={styles.stepBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="sparkles" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Kế hoạch AI đề xuất cho bạn</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Dựa trên thể trạng {heightCm}cm, {weightKg}kg và mục tiêu của bạn.
              </Text>

              <LinearGradient colors={Gradients.primary} style={styles.summaryGradientCard}>
                <Text style={styles.summaryHeader}>CALO MỤC TIÊU HÀNG NGÀY</Text>
                <Text style={styles.summaryCaloVal}>{calTarget.toLocaleString()} <Text style={styles.unitText}>kcal/ngày</Text></Text>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <View style={styles.summaryCol}>
                    <Text style={styles.summaryColLabel}>Đạm (Protein)</Text>
                    <Text style={styles.summaryColVal}>{Math.round((calTarget * 0.3) / 4)}g</Text>
                  </View>
                  <View style={styles.summaryCol}>
                    <Text style={styles.summaryColLabel}>Tinh bột (Carbs)</Text>
                    <Text style={styles.summaryColVal}>{Math.round((calTarget * 0.45) / 4)}g</Text>
                  </View>
                  <View style={styles.summaryCol}>
                    <Text style={styles.summaryColLabel}>Chất béo (Fat)</Text>
                    <Text style={styles.summaryColVal}>{Math.round((calTarget * 0.25) / 9)}g</Text>
                  </View>
                </View>
              </LinearGradient>

              <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginTop: 15 }]}>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>💧 Nước uống tối thiểu:</Text>
                  <Text style={[styles.previewVal, { color: theme.primary }]}>{waterTargetL} Lít / ngày</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>⚡ TDEE (Năng lượng tiêu hao):</Text>
                  <Text style={[styles.previewVal, { color: theme.text }]}>{tdeePreview} kcal</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation Buttons */}
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
          {step < 4 ? (
            <Pressable onPress={handleNextStep} style={[styles.nextBtn, { backgroundColor: theme.primary }]}>
              <Text style={styles.nextBtnText}>Tiếp tục</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </Pressable>
          ) : (
            <Pressable onPress={handleFinish} style={[styles.finishBtn, { backgroundColor: theme.primary }]}>
              <Ionicons name="checkmark-circle" size={22} color="#000" style={{ marginRight: 6 }} />
              <Text style={styles.nextBtnText}>Hoàn tất & Bắt đầu hành trình</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#333',
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  stepBox: {
    flex: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,165,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    gap: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
  },
  previewVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  optionCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionSub: {
    fontSize: 13,
  },
  summaryGradientCard: {
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  summaryHeader: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summaryCaloVal: {
    color: '#000',
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 6,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    width: '100%',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  summaryCol: {
    alignItems: 'center',
  },
  summaryColLabel: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryColVal: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  nextBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  finishBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
});
