import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Platform, Alert, AppState } from 'react-native';
import Constants from 'expo-constants';

// Safe Notifications getter for Expo Go SDK 53 Android compatibility
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

const getNotifications = () => {
  if (Platform.OS === 'web') return null;
  try {
    if (Platform.OS === 'android' && isExpoGo) {
      return null;
    }
    return require('expo-notifications');
  } catch (e) {
    return null;
  }
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from '@/utils/date';
import { DEFAULT_AVATAR } from '@/constants/theme';
// expo-notifications imported dynamically to support Expo Go SDK 53 on Android


export interface UserProfile {
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'athlete';
  targetGoal: 'weight_loss' | 'weight_gain' | 'maintain_weight' | 'muscle_gain' | 'healthy_lifestyle';

  // Calculated
  bmi: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWaterMl: number;
  bodyFatEstimate: number;
  leanBodyMass: number;

  xp: number;
  level: number;
  streakDays: number;
  avatarUrl?: string;
  coins?: number;
}

export interface FoodLog {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  servingSizeG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedDate?: string;
  loggedAt: string;
}

export interface WaterLog {
  id: string;
  amountMl: number;
  loggedDate?: string;
  loggedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  message: string;
  sentAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  prepTime: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  isAiGenerated?: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
}

export interface WeightLog {
  id: string;
  weightKg: number;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  bodyFatPct?: number;
  photoUrl?: string;
  loggedDate: string;
  loggedAt: string;
}

export interface PlanAlert {
  type: 'over' | 'under';
  metric: string;
  actual: number;
  target: number;
  message: string;
}

export interface UserHistoryDay {
  date: string;
  totals: { calories: number; protein: number; carbs: number; fat: number; waterMl: number };
  targets?: { calories: number; protein: number; carbs: number; fat: number; waterMl: number } | null;
  alerts: PlanAlert[];
  foodLogs: FoodLog[];
  waterLogs: WaterLog[];
  weightLogs: WeightLog[];
  workoutSchedules?: UserWorkoutSchedule[];
  declaration?: { activity: string; image: string; steps: number; activeCalories: number; activeTime: number } | null;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  imageUrl?: string;
  sets: number;
  reps: string;
}

export interface WorkoutProgram {
  id: string;
  title: string;
  description: string;
  category: 'GYM' | 'CARDIO' | 'HOME' | 'YOGA' | 'STRETCHING' | 'ABS' | 'OTHER';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  exercises: WorkoutExercise[];
}

export interface UserWorkoutSchedule {
  id: string;
  programId: string;
  program: WorkoutProgram;
  scheduledDate: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface MealPlanItem {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  servingSizeG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanDay {
  id: string;
  dayNumber: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: MealPlanItem[];
}

export interface MealPlan {
  id: string;
  title: string;
  dietType: string;
  startDate: string;
  isActive: boolean;
  isFavorite?: boolean;
  days: MealPlanDay[];
}

export interface PostComment {
  id: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  content: string;
  photoUrl?: string;
  createdAt: string;
  likes: { id: string; userId: string }[];
  comments: PostComment[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  durationDays: number;
}

export interface UserChallenge {
  id: string;
  challengeId: string;
  startDate: string;
  status: 'ONGOING' | 'COMPLETED';
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface LiftingRecords {
  squat: number;    // Gánh đùi (kg)
  bench: number;    // Đẩy ngực (kg)
  deadlift: number; // Kéo lưng (kg)
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  targetType: 'water' | 'food' | 'workout' | 'weight';
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface LiftingHistoryLog {
  id: string;
  squat: number;
  bench: number;
  deadlift: number;
  loggedDate: string; // YYYY-MM-DD
}

export interface ActivityScheduleNutrition {
  protein: string;  // e.g. "30g"
  carbs: string;    // e.g. "50g"
  fat: string;      // e.g. "15g"
  calories: string; // e.g. "450 kcal"
}

export interface ActivityScheduleItem {
  id: string;
  title: string;
  time: string; // HH:MM
  type: 'breakfast' | 'lunch' | 'dinner' | 'workout' | 'custom';
  isEnabled: boolean;
  notificationId?: string | null;
  nutritionInfo?: ActivityScheduleNutrition | null;
  suggestedMeals?: string[] | null; // e.g. ["Trứng luộc", "Cháo yến mạch"]
}

interface LocalDbContextType {
  activeDateStr: string;
  userProfile: UserProfile | null;
  foodLogs: FoodLog[];
  waterLogs: WaterLog[];
  chatLogs: ChatMessage[];
  isAiTyping: boolean;
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  createChatSession: (title?: string) => string;
  selectChatSession: (sessionId: string) => void;
  deleteChatSession: (sessionId: string) => void;
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
  geminiApiKey: string;
  groqApiKey: string;
  openRouterApiKey: string;
  chatModelProvider: 'openrouter' | 'gemini' | 'groq' | 'backend';
  setChatModelProvider: (provider: 'openrouter' | 'gemini' | 'groq' | 'backend') => void;
  userToken: string | null;
  currentUser: { uid: string; email: string; username?: string; role?: string; isPremium?: boolean } | null;
  backendUrl: string;
  dailyDeclarations: { [date: string]: { activity: string; image: string; steps: number; activeCalories: number; activeTime: number } };

  // New features list
  weightLogs: WeightLog[];
  workoutPrograms: WorkoutProgram[];
  workoutSchedules: UserWorkoutSchedule[];
  activeMealPlan: MealPlan | null;
  favoriteMealPlans: MealPlan[];
  communityPosts: CommunityPost[];
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  userBadges: UserBadge[];
  isPremium: boolean;
  isAdmin: boolean;

  updateProfile: (profile: Omit<UserProfile, 'bmi' | 'bmr' | 'tdee' | 'targetCalories' | 'targetProtein' | 'targetCarbs' | 'targetFat' | 'targetWaterMl' | 'bodyFatEstimate' | 'leanBodyMass' | 'xp' | 'level' | 'streakDays'>) => void;
  addFoodLog: (mealType: FoodLog['mealType'], name: string, weightG: number, cal: number, p: number, c: number, f: number, date?: string) => Promise<any>;
  deleteFoodLog: (id: string) => void;
  addWaterLog: (amountMl: number, date?: string) => Promise<any>;
  deleteWaterLog: (id: string) => void;
  sendChatMessage: (msg: string) => Promise<void>;
  generateAiRecipe: (ingredients: string) => Promise<Recipe>;
  addShoppingItem: (name: string, amount: string) => void;
  toggleShoppingItem: (id: string) => void;
  clearShoppingList: () => void;
  triggerMockScanFood: (imageBase64?: string) => Promise<any>;
  triggerVoiceLogging: (text: string) => Promise<FoodLog[]>;
  addXp: (amount: number) => void;
  saveGeminiApiKey: (key: string) => void;
  saveGroqApiKey: (key: string) => void;
  saveOpenRouterApiKey: (key: string) => void;
  clearAllData: () => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, emailOrPhone: string, password: string) => Promise<boolean>;
  sendRegisterOtp: (username: string, emailOrPhone: string, password: string) => Promise<{ success: boolean; message: string; devOtp?: string }>;
  verifyRegisterOtp: (emailOrPhone: string, otp: string) => Promise<boolean>;
  sendForgotPasswordOtp: (emailOrPhone: string) => Promise<{ success: boolean; message: string; emailOrPhone?: string; devOtp?: string }>;
  verifyForgotPasswordOtp: (emailOrPhone: string, otp: string, newPasswordHash: string) => Promise<boolean>;
  loginWithGoogle: (token: string, details?: { email: string; name: string }) => Promise<boolean>;
  resetPassword: (usernameOrEmail: string, newPassword: string) => Promise<boolean>;
  logout: () => void;
  saveBackendUrl: (url: string) => void;
  getDefaultBackendUrl: () => string;
  saveDailyDeclaration: (date: string, declaration: { activity: string; image: string; steps?: number; activeCalories?: number; activeTime?: number }) => void; getLogsForDate: (date: string) => Promise<{ foodLogs: FoodLog[], waterLogs: WaterLog[], weightLogs?: WeightLog[], workoutSchedules?: UserWorkoutSchedule[], totals?: any, targets?: any, alerts?: PlanAlert[], declaration?: any }>;
  getUserHistory: (days?: number) => Promise<UserHistoryDay[]>;
  generateDailyAiReview: (dayData: UserHistoryDay) => Promise<string>;

  // New feature methods
  addWeightLog: (weightKg: number, waistCm?: number, chestCm?: number, hipsCm?: number, bodyFatPct?: number, photoUrl?: string, date?: string) => Promise<any>;
  scheduleWorkout: (programId: string, date: string) => Promise<any>;
  toggleWorkoutCompleted: (scheduleId: string) => Promise<any>;
  logCompletedWorkout: (title: string, exercises: any[], customProgramId?: string) => Promise<void>;
  generateMealPlan: (dietType: string) => Promise<any>;
  swapMealItem: (itemId: string, foodName: string, calories: number, protein: number, carbs: number, fat: number, servingSizeG?: number) => Promise<any>;
  toggleFavoriteMealPlan: (planId: string) => Promise<any>;
  applyFavoriteMealPlan: (planId: string) => Promise<any>;
  readjustMealPlan: () => Promise<any>;
  generateAiWorkout: (goal: string) => Promise<{ title: string; duration: string; resultTimeframe: string; description: string; category?: string; exercises: any[] }>;
  addWorkoutProgram: (program: { title: string; description: string; category?: string; exercises: any[] }) => void;
  deleteWorkoutProgram: (programId: string) => void;
  addCommunityPost: (content: string, photoUrl?: string) => Promise<any>;
  toggleLikePost: (postId: string) => Promise<any>;
  addCommentToPost: (postId: string, content: string) => Promise<any>;
  deleteCommunityPost: (postId: string) => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<any>;
  completeChallenge: (challengeId: string) => Promise<any>;
  togglePremiumStatus: (status: boolean) => Promise<any>;
  toggleAdminRole: (role: string) => Promise<any>;
  getLeaderboard: () => Promise<any>;
  getAdminDashboard: () => Promise<any>;
  refreshData?: () => Promise<void>;
  liftingRecords: LiftingRecords | null;
  saveLiftingRecords: (records: LiftingRecords) => Promise<void>;
  quests: Quest[];
  liftingHistory: LiftingHistoryLog[];
  claimQuestReward: (questId: string) => void;
  buyBadge: (badgeName: string, cost: number, icon: string) => Promise<boolean>;
  prefilledFoodData: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  setPrefilledFoodData: (data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null) => void;
  shouldTriggerScan: boolean;
  setShouldTriggerScan: (val: boolean) => void;
  activitySchedule: ActivityScheduleItem[];
  addActivityScheduleItem: (title: string, time: string, type: ActivityScheduleItem['type']) => Promise<void>;
  deleteActivityScheduleItem: (id: string) => Promise<void>;
  toggleActivityScheduleItem: (id: string) => Promise<void>;
  generateAiActivitySchedule: (goalDescription?: string) => Promise<void>;
}

const LocalDbContext = createContext<LocalDbContextType | undefined>(undefined);

// Initial recipes data
const DEFAULT_RECIPES: Recipe[] = [
  {
    id: 'rec1',
    title: 'Ức gà nướng bơ tỏi',
    category: 'High Protein',
    prepTime: '25 mins',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=80',
    calories: 380,
    protein: 42,
    carbs: 5,
    fat: 21,
    ingredients: ['200g ức gà phi lê', '10g bơ lạt', '3 tép tỏi băm', 'Muối, tiêu, bột nêm', '1 muỗng canh dầu ô liu'],
    instructions: [
      'Khía nhẹ miếng ức gà để thấm gia vị.',
      'Ướp ức gà với muối, tiêu, tỏi băm trong 10 phút.',
      'Làm nóng chảo với dầu ô liu, áp chảo gà vàng đều hai mặt.',
      'Thêm bơ lạt vào chảo, rưới bơ tan chảy lên ức gà trước khi tắt bếp.'
    ]
  },
  {
    id: 'rec2',
    title: 'Salad cá hồi quả bơ',
    category: 'Keto',
    prepTime: '15 mins',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    calories: 450,
    protein: 28,
    carbs: 10,
    fat: 34,
    ingredients: ['150g fillet cá hồi', '1/2 quả bơ chín', '100g xà lách tươi', '5 quả cà chua bi', 'Sốt dấm ô liu'],
    instructions: [
      'Áp chảo fillet cá hồi chín tới, xé nhỏ vừa ăn.',
      'Cắt lát quả bơ chín và bổ đôi cà chua bi.',
      'Rửa sạch xà lách và xếp vào đĩa.',
      'Cho cá hồi, bơ, cà chua lên trên, rưới sốt dấm ô liu và trộn đều.'
    ]
  },
  {
    id: 'rec3',
    title: 'Sinh tố chuối yến mạch',
    category: 'Clean Eating',
    prepTime: '5 mins',
    image: 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?auto=format&fit=crop&w=400&q=80',
    calories: 320,
    protein: 12,
    carbs: 55,
    fat: 6,
    ingredients: ['1 quả chuối chín', '30g yến mạch cán dẹt', '200ml sữa tươi không đường', '1 muỗng cà phê mật ong'],
    instructions: [
      'Cho yến mạch vào máy xay nhuyễn trước.',
      'Thêm chuối cắt lát, sữa tươi và mật ong vào.',
      'Xay mịn hỗn hợp trong 1 - 2 phút.',
      'Rót ra ly và thưởng thức lạnh.'
    ]
  }
];

const generateDailyQuests = (currentWaterLogs: WaterLog[], currentFoodLogs: FoodLog[]) => {
  const todayWater = currentWaterLogs.reduce((acc, log) => acc + log.amountMl, 0);
  const todayFoods = currentFoodLogs.length;

  return [
    {
      id: 'q_water',
      title: 'Uống đủ nước 💧',
      description: 'Uống ít nhất 1000ml nước trong ngày.',
      xpReward: 30,
      coinReward: 10,
      targetType: 'water',
      targetValue: 1000,
      currentValue: todayWater,
      isCompleted: todayWater >= 1000,
      isClaimed: false
    },
    {
      id: 'q_food',
      title: 'Ghi nhật ký dinh dưỡng 🥗',
      description: 'Ghi chép ít nhất 2 món ăn hôm nay.',
      xpReward: 30,
      coinReward: 10,
      targetType: 'food',
      targetValue: 2,
      currentValue: todayFoods,
      isCompleted: todayFoods >= 2,
      isClaimed: false
    },
    {
      id: 'q_weight',
      title: 'Theo dõi cân nặng 📉',
      description: 'Cập nhật chỉ số cân nặng hôm nay.',
      xpReward: 40,
      coinReward: 15,
      targetType: 'weight',
      targetValue: 1,
      currentValue: 0,
      isCompleted: false,
      isClaimed: false
    }
  ] as Quest[];
};

export const LocalDbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDateStr, setActiveDateStr] = useState(getLocalDateString());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>(DEFAULT_RECIPES);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([
    { id: 'shop1', name: 'Ức gà fillet', amount: '1 kg', checked: false },
    { id: 'shop2', name: 'Trứng gà ta', amount: '10 quả', checked: true },
    { id: 'shop3', name: 'Rau xà lách búp', amount: '500g', checked: false }
  ]);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [groqApiKey, setGroqApiKey] = useState<string>('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>('');
  const [chatModelProvider, setChatModelProvider] = useState<'openrouter' | 'gemini' | 'groq' | 'backend'>('openrouter');
  const [prefilledFoodData, setPrefilledFoodData] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const [shouldTriggerScan, setShouldTriggerScan] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; username?: string; role?: string; isPremium?: boolean } | null>(null);
  const getDefaultBackendUrl = () => {
    if (Platform.OS === 'web') {
      return 'http://localhost:3000';
    }
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3000`;
      }
    }
    return 'http://192.168.31.89:3000'; // Current active Wi-Fi LAN IP
  };

  const [backendUrl, setBackendUrl] = useState<string>(getDefaultBackendUrl());
  const [dailyDeclarations, setDailyDeclarations] = useState<{
    [date: string]: {
      activity: string;
      image: string;
      steps: number;
      activeCalories: number;
      activeTime: number;
    }
  }>({});

  // New modules local states
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [activitySchedule, setActivitySchedule] = useState<ActivityScheduleItem[]>([]);
  const [workoutPrograms, setWorkoutPrograms] = useState<WorkoutProgram[]>([]);
  const [workoutSchedules, setWorkoutSchedules] = useState<UserWorkoutSchedule[]>([]);
  const [activeMealPlan, setActiveMealPlan] = useState<MealPlan | null>(null);
  const [favoriteMealPlans, setFavoriteMealPlans] = useState<MealPlan[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: 'chal1', title: '7 ngày Eat Clean 🥗', description: 'Chỉ ăn thực phẩm nguyên bản, hạn chế tối đa dầu mỡ và đồ ngọt chế biến.', xpReward: 150, durationDays: 7 },
    { id: 'chal2', title: '30 ngày giảm cân đột phá 📉', description: 'Duy trì thâm hụt calo nhẹ và tập luyện kháng lực 4 ngày/tuần.', xpReward: 400, durationDays: 30 },
    { id: 'chal3', title: 'Thử thách 10.000 bước chân 🏃‍♂️', description: 'Hoàn thành đi bộ tối thiểu 10.000 bước mỗi ngày để tăng trao đổi chất.', xpReward: 100, durationDays: 1 },
    { id: 'chal4', title: 'Chiến binh uống đủ nước 💧', description: 'Uống đủ nước theo đề xuất cá nhân hóa liên tục trong 7 ngày.', xpReward: 150, durationDays: 7 }
  ]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([
    { id: 'bd1', name: 'Chiến binh Nước 💧', description: 'Đạt mục tiêu uống nước ngày đầu tiên', icon: 'droplet', unlockedAt: new Date().toISOString() },
    { id: 'bd2', name: 'Ý chí Sắt Đá 🏋️‍♂️', description: 'Hoàn thành bài tập đầu tiên', icon: 'checkmark.seal', unlockedAt: new Date().toISOString() }
  ]);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [liftingRecords, setLiftingRecords] = useState<LiftingRecords | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [liftingHistory, setLiftingHistory] = useState<LiftingHistoryLog[]>([]);

  const checkNutritionAlerts = (
    prevFoods: FoodLog[],
    prevWater: WaterLog[],
    nextFoods: FoodLog[],
    nextWater: WaterLog[]
  ) => {
    if (!userProfile) return;
    const today = getLocalDateString();

    const pTodayFoods = prevFoods.filter(f => (f.loggedDate || today) === today);
    const pTodayWater = prevWater.filter(w => (w.loggedDate || today) === today);
    const nTodayFoods = nextFoods.filter(f => (f.loggedDate || today) === today);
    const nTodayWater = nextWater.filter(w => (w.loggedDate || today) === today);

    const prevTotals = {
      calories: pTodayFoods.reduce((s, f) => s + f.calories, 0),
      protein: pTodayFoods.reduce((s, f) => s + f.protein, 0),
      carbs: pTodayFoods.reduce((s, f) => s + f.carbs, 0),
      fat: pTodayFoods.reduce((s, f) => s + f.fat, 0),
      water: pTodayWater.reduce((s, w) => s + w.amountMl, 0),
    };

    const nextTotals = {
      calories: nTodayFoods.reduce((s, f) => s + f.calories, 0),
      protein: nTodayFoods.reduce((s, f) => s + f.protein, 0),
      carbs: nTodayFoods.reduce((s, f) => s + f.carbs, 0),
      fat: nTodayFoods.reduce((s, f) => s + f.fat, 0),
      water: nTodayWater.reduce((s, w) => s + w.amountMl, 0),
    };

    const targets = {
      calories: userProfile.targetCalories,
      protein: userProfile.targetProtein,
      carbs: userProfile.targetCarbs,
      fat: userProfile.targetFat,
      water: userProfile.targetWaterMl,
    };

    const labels: Record<string, string> = {
      calories: 'Calo',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Chất béo',
      water: 'Nước',
    };

    const units: Record<string, string> = {
      calories: 'kcal',
      protein: 'g',
      carbs: 'g',
      fat: 'g',
      water: 'ml',
    };

    const alertsToTrigger: string[] = [];

    (Object.keys(targets) as Array<keyof typeof targets>).forEach(key => {
      const target = targets[key];
      if (!target) return;
      const prevVal = prevTotals[key];
      const nextVal = nextTotals[key];

      const prevRatio = prevVal / target;
      const nextRatio = nextVal / target;

      // Exceeded limit (increase over 110%)
      if (prevRatio < 1.1 && nextRatio >= 1.1) {
        alertsToTrigger.push(`⚠️ Chỉ số ${labels[key]} đã VƯỢT QUÁ mức kế hoạch (${Math.round(nextVal)}/${target} ${units[key]}).`);
      }
      // Dropped below limit (decrease under 80%)
      else if (prevRatio >= 0.8 && nextRatio < 0.8) {
        alertsToTrigger.push(`⚠️ Chỉ số ${labels[key]} đang THẤP HƠN mức tối thiểu kế hoạch (${Math.round(nextVal)}/${target} ${units[key]}).`);
      }
      // Reached safe range (was under 80%, now >= 80% and < 110%)
      else if (prevRatio < 0.8 && nextRatio >= 0.8 && nextRatio < 1.1) {
        alertsToTrigger.push(`🎉 Tuyệt vời! Chỉ số ${labels[key]} đã ĐẠT mục tiêu an toàn kế hoạch.`);
      }
    });

    if (alertsToTrigger.length > 0) {
      Alert.alert(
        'Thông Báo Kế Hoạch 📊',
        alertsToTrigger.join('\n\n')
      );
    }
  };

  // Load from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        let storedProfile: string | null = null;
        let storedFoods: string | null = null;
        let storedWater: string | null = null;
        let storedChats: string | null = null;
        let storedRecipes: string | null = null;
        let storedShopping: string | null = null;
        let storedApiKey: string | null = null;
        let storedGroqKey: string | null = null;
        let storedActivitySchedule: string | null = null;
        let storedOpenRouterKey: string | null = null;
        let storedChatModelProvider: string | null = null;
        let storedToken: string | null = null;
        let storedUser: string | null = null;
        let storedBackendUrl: string | null = null;
        let storedDeclarations: string | null = null;
        let storedWeight: string | null = null;
        let storedWorkouts: string | null = null;
        let storedSchedules: string | null = null;
        let storedMealPlan: string | null = null;
        let storedPosts: string | null = null;
        let storedUserChals: string | null = null;
        let storedUserBadges: string | null = null;
        let storedPremium: string | null = null;
        let storedAdmin: string | null = null;
        let storedLiftingRecords: string | null = null;

        let storedSessions: string | null = null;
        let storedCurrentSessionId: string | null = null;
        let storedQuests: string | null = null;
        let storedLiftingHistory: string | null = null;
        let storedQuestDate: string | null = null;
        let storedDeletedWorkouts: string | null = null;

        if (Platform.OS === 'web') {
          storedProfile = localStorage.getItem('bf_profile');
          storedFoods = localStorage.getItem('bf_foods');
          storedWater = localStorage.getItem('bf_water');
          storedChats = localStorage.getItem('bf_chats');
          storedRecipes = localStorage.getItem('bf_recipes');
          storedShopping = localStorage.getItem('bf_shopping');
          storedApiKey = localStorage.getItem('bf_gemini_api_key');
          storedGroqKey = localStorage.getItem('bf_groq_api_key');
          storedOpenRouterKey = localStorage.getItem('bf_openrouter_api_key');
          storedChatModelProvider = localStorage.getItem('bf_chat_model_provider');
          storedToken = localStorage.getItem('bf_user_token');
          storedUser = localStorage.getItem('bf_current_user');
          storedBackendUrl = localStorage.getItem('bf_backend_url');
          storedDeclarations = localStorage.getItem('bf_declarations');
          storedWeight = localStorage.getItem('bf_weight');
          storedWorkouts = localStorage.getItem('bf_workouts');
          storedSchedules = localStorage.getItem('bf_schedules');
          storedMealPlan = localStorage.getItem('bf_mealplan');
          storedPosts = localStorage.getItem('bf_posts');
          storedUserChals = localStorage.getItem('bf_user_chals');
          storedUserBadges = localStorage.getItem('bf_user_badges');
          storedPremium = localStorage.getItem('bf_is_premium');
          storedAdmin = localStorage.getItem('bf_is_admin');
          storedSessions = localStorage.getItem('bf_chat_sessions');
          storedCurrentSessionId = localStorage.getItem('bf_current_session_id');
          storedLiftingRecords = localStorage.getItem('bf_lifting_records');
          storedQuests = localStorage.getItem('bf_quests');
          storedLiftingHistory = localStorage.getItem('bf_lifting_history');
          storedQuestDate = localStorage.getItem('bf_quest_date');
          storedActivitySchedule = localStorage.getItem('bf_activity_schedule');
          storedDeletedWorkouts = localStorage.getItem('bf_deleted_workouts');
        } else {
          const keys = [
            'bf_profile', 'bf_foods', 'bf_water', 'bf_chats', 'bf_recipes', 'bf_shopping',
            'bf_gemini_api_key', 'bf_groq_api_key', 'bf_openrouter_api_key', 'bf_chat_model_provider',
            'bf_user_token', 'bf_current_user', 'bf_backend_url', 'bf_declarations', 'bf_weight',
            'bf_workouts', 'bf_schedules', 'bf_mealplan', 'bf_posts', 'bf_user_chals',
            'bf_user_badges', 'bf_is_premium', 'bf_is_admin', 'bf_chat_sessions', 'bf_current_session_id',
            'bf_lifting_records', 'bf_quests', 'bf_lifting_history', 'bf_quest_date', 'bf_activity_schedule',
            'bf_deleted_workouts'
          ];
          const stores = await AsyncStorage.multiGet(keys);
          const storeMap: { [key: string]: string | null } = {};
          stores.forEach(([k, val]) => {
            storeMap[k] = val;
          });

          storedProfile = storeMap['bf_profile'];
          storedFoods = storeMap['bf_foods'];
          storedWater = storeMap['bf_water'];
          storedChats = storeMap['bf_chats'];
          storedRecipes = storeMap['bf_recipes'];
          storedShopping = storeMap['bf_shopping'];
          storedApiKey = storeMap['bf_gemini_api_key'];
          storedGroqKey = storeMap['bf_groq_api_key'];
          storedOpenRouterKey = storeMap['bf_openrouter_api_key'];
          storedChatModelProvider = storeMap['bf_chat_model_provider'];
          storedToken = storeMap['bf_user_token'];
          storedUser = storeMap['bf_current_user'];
          storedBackendUrl = storeMap['bf_backend_url'];
          storedDeclarations = storeMap['bf_declarations'];
          storedWeight = storeMap['bf_weight'];
          storedWorkouts = storeMap['bf_workouts'];
          storedSchedules = storeMap['bf_schedules'];
          storedMealPlan = storeMap['bf_mealplan'];
          storedPosts = storeMap['bf_posts'];
          storedUserChals = storeMap['bf_user_chals'];
          storedUserBadges = storeMap['bf_user_badges'];
          storedPremium = storeMap['bf_is_premium'];
          storedAdmin = storeMap['bf_is_admin'];
          storedSessions = storeMap['bf_chat_sessions'];
          storedCurrentSessionId = storeMap['bf_current_session_id'];
          storedLiftingRecords = storeMap['bf_lifting_records'];
          storedQuests = storeMap['bf_quests'];
          storedLiftingHistory = storeMap['bf_lifting_history'];
          storedQuestDate = storeMap['bf_quest_date'];
          storedActivitySchedule = storeMap['bf_activity_schedule'];
        }

        if (storedProfile) setUserProfile(JSON.parse(storedProfile));
        if (storedDeclarations) setDailyDeclarations(JSON.parse(storedDeclarations));
        if (storedFoods) setFoodLogs(JSON.parse(storedFoods));
        if (storedWater) setWaterLogs(JSON.parse(storedWater));
        let parsedSessions: ChatSession[] = [];
        if (storedSessions) {
          try {
            parsedSessions = JSON.parse(storedSessions);
          } catch { }
        }

        // Filter out empty sessions with no messages from history
        const cleanedSessions = parsedSessions.filter(s => s.messages && s.messages.length > 0);

        // Always create a fresh New Chat session when opening app or web
        const newSessionId = 'session_' + Math.random().toString(36).substring(7);
        const newDefaultSession: ChatSession = {
          id: newSessionId,
          title: 'Cuộc trò chuyện mới 💬',
          createdAt: new Date().toLocaleDateString('vi-VN'),
          messages: []
        };

        const finalSessions = [newDefaultSession, ...cleanedSessions];

        setChatSessions(finalSessions);
        setCurrentSessionId(newSessionId);
        setChatLogs([]);

        // Save updated sessions to storage
        const jsonVal = JSON.stringify(finalSessions);
        if (Platform.OS === 'web') {
          localStorage.setItem('bf_chat_sessions', jsonVal);
          localStorage.setItem('bf_current_session_id', newSessionId);
          localStorage.setItem('bf_chats', JSON.stringify([]));
        } else {
          AsyncStorage.setItem('bf_chat_sessions', jsonVal).catch(() => { });
          AsyncStorage.setItem('bf_current_session_id', newSessionId).catch(() => { });
          AsyncStorage.setItem('bf_chats', JSON.stringify([])).catch(() => { });
        }
        if (storedRecipes) setRecipes(JSON.parse(storedRecipes));
        if (storedShopping) setShoppingList(JSON.parse(storedShopping));
        if (storedApiKey) {
          try {
            setGeminiApiKey(JSON.parse(storedApiKey));
          } catch {
            setGeminiApiKey(storedApiKey);
          }
        }
        if (storedGroqKey) {
          try {
            setGroqApiKey(JSON.parse(storedGroqKey));
          } catch {
            setGroqApiKey(storedGroqKey);
          }
        }
        if (storedOpenRouterKey) {
          try {
            setOpenRouterApiKey(JSON.parse(storedOpenRouterKey));
          } catch {
            setOpenRouterApiKey(storedOpenRouterKey);
          }
        }
        if (storedChatModelProvider) {
          try {
            setChatModelProvider(JSON.parse(storedChatModelProvider) as any);
          } catch {
            setChatModelProvider(storedChatModelProvider as any);
          }
        }
        if (storedToken) {
          try {
            setUserToken(JSON.parse(storedToken));
          } catch {
            setUserToken(storedToken);
          }
        }
        let parsedUser = null;
        if (storedUser) {
          parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          setIsPremium(parsedUser.isPremium || false);
          setIsAdmin(parsedUser.role === 'ADMIN');
        }
        if (storedBackendUrl) {
          try {
            const parsedUrl = JSON.parse(storedBackendUrl);
            if (parsedUrl === 'http://192.168.31.89:3000' || !parsedUrl) {
              setBackendUrl(getDefaultBackendUrl());
            } else {
              setBackendUrl(parsedUrl);
            }
          } catch {
            if (storedBackendUrl === 'http://192.168.31.89:3000') {
              setBackendUrl(getDefaultBackendUrl());
            } else {
              setBackendUrl(storedBackendUrl);
            }
          }
        } else {
          setBackendUrl(getDefaultBackendUrl());
        }

        // Hydrate new modules
        if (storedWeight) {
          setWeightLogs(JSON.parse(storedWeight));
        } else {
          // Preload mock weight logs for immediate visual feedback
          const mockWeight = [
            { id: 'w1', weightKg: 72.5, waistCm: 84, chestCm: 98, hipsCm: 96, bodyFatPct: 21.4, loggedDate: getLocalDateString(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)), loggedAt: new Date().toISOString() },
            { id: 'w2', weightKg: 71.8, waistCm: 83.2, chestCm: 98, hipsCm: 95.5, bodyFatPct: 20.8, loggedDate: getLocalDateString(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), loggedAt: new Date().toISOString() },
            { id: 'w3', weightKg: 71.0, waistCm: 82.0, chestCm: 97.5, hipsCm: 95.0, bodyFatPct: 20.1, loggedDate: getLocalDateString(), loggedAt: new Date().toISOString() },
          ];
          setWeightLogs(mockWeight);
          saveToStorage('bf_weight', mockWeight);
        }
        let deletedProgramIds: string[] = [];
        if (storedDeletedWorkouts) {
          try { deletedProgramIds = JSON.parse(storedDeletedWorkouts); } catch (e) {}
        }
        if (storedWorkouts) {
          const parsed = JSON.parse(storedWorkouts);
          setWorkoutPrograms(parsed.filter((p: any) => !deletedProgramIds.includes(p.id)));
        }
        if (storedSchedules) setWorkoutSchedules(JSON.parse(storedSchedules));
        if (storedMealPlan) setActiveMealPlan(JSON.parse(storedMealPlan));

        if (storedPosts) {
          setCommunityPosts(JSON.parse(storedPosts));
        } else {
          const defaultPosts: CommunityPost[] = [
            { id: 'p1', userId: 'user1', username: 'Lê Minh Hùng', content: 'Hôm nay làm đĩa salad cá ngừ tràn trề protein sau buổi tập ngực cực phê! Mục tiêu 30 ngày giảm cân cố lên anh em ơi!', photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), likes: [{ id: 'l1', userId: 'user2' }], comments: [{ id: 'c1', username: 'Trần Thảo', content: 'Ngon quá bạn ơi, xin công thức chế biến với!', createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }] },
            { id: 'p2', userId: 'user2', username: 'Trần Thảo', content: 'Dậy sớm chạy bộ 5km đón bình minh. Uống đủ 1 cốc nước ấm trước khi chạy giúp thanh lọc cơ thể rất tốt 🏃‍♀️', photoUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80', createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), likes: [], comments: [] },
            { id: 'p3', userId: 'user3', username: 'Nguyễn Văn Đạt', content: 'Mới check-in tại phòng gym, hoàn thành 4 hiệp Squat tạ nặng. Cố gắng phá vỡ giới hạn bản thân mỗi ngày! 🔥🏋️‍♂️', photoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), likes: [{ id: 'l2', userId: 'user1' }, { id: 'l3', userId: 'user2' }], comments: [] }
          ];
          setCommunityPosts(defaultPosts);
          saveToStorage('bf_posts', defaultPosts);
        }

        if (storedUserChals) setUserChallenges(JSON.parse(storedUserChals));
        if (storedUserBadges) setUserBadges(JSON.parse(storedUserBadges));
        if (storedLiftingRecords) setLiftingRecords(JSON.parse(storedLiftingRecords));

        // Hydrate Quests and Lifting History
        const todayStr = getLocalDateString();
        let activeQuests: Quest[] = [];
        if (storedQuests && storedQuestDate === todayStr) {
          try {
            activeQuests = JSON.parse(storedQuests);
          } catch {
            const rawFoods = storedFoods ? JSON.parse(storedFoods) : [];
            const rawWater = storedWater ? JSON.parse(storedWater) : [];
            const tempFoods = rawFoods.filter((f: any) => (f.loggedDate || getLocalDateString()) === todayStr);
            const tempWater = rawWater.filter((w: any) => (w.loggedDate || getLocalDateString()) === todayStr);
            activeQuests = generateDailyQuests(tempWater, tempFoods);
          }
        } else {
          let tempFoods = [];
          let tempWater = [];
          try {
            const rawFoods = storedFoods ? JSON.parse(storedFoods) : [];
            tempFoods = rawFoods.filter((f: any) => (f.loggedDate || getLocalDateString()) === todayStr);
          } catch { }
          try {
            const rawWater = storedWater ? JSON.parse(storedWater) : [];
            tempWater = rawWater.filter((w: any) => (w.loggedDate || getLocalDateString()) === todayStr);
          } catch { }
          activeQuests = generateDailyQuests(tempWater, tempFoods);

          let tempWeight = [];
          try { tempWeight = storedWeight ? JSON.parse(storedWeight) : []; } catch { }
          const weightLogToday = tempWeight.some((w: any) => w.loggedDate === todayStr);
          if (weightLogToday) {
            const qW = activeQuests.find(q => q.targetType === 'weight');
            if (qW) {
              qW.currentValue = 1;
              qW.isCompleted = true;
            }
          }
          saveToStorage('bf_quests', activeQuests);
          saveToStorage('bf_quest_date', todayStr);
        }
        setQuests(activeQuests);

        if (storedLiftingHistory) {
          try {
            setLiftingHistory(JSON.parse(storedLiftingHistory));
          } catch {
            const mockLiftingHistory: LiftingHistoryLog[] = [
              { id: 'lh1', squat: 80, bench: 60, deadlift: 100, loggedDate: getLocalDateString(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)) },
              { id: 'lh2', squat: 85, bench: 62.5, deadlift: 105, loggedDate: getLocalDateString(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)) },
              { id: 'lh3', squat: 90, bench: 65, deadlift: 110, loggedDate: getLocalDateString() }
            ];
            setLiftingHistory(mockLiftingHistory);
            saveToStorage('bf_lifting_history', mockLiftingHistory);
          }
        } else {
          const mockLiftingHistory: LiftingHistoryLog[] = [
            { id: 'lh1', squat: 80, bench: 60, deadlift: 100, loggedDate: getLocalDateString(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)) },
            { id: 'lh2', squat: 85, bench: 62.5, deadlift: 105, loggedDate: getLocalDateString(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)) },
            { id: 'lh3', squat: 90, bench: 65, deadlift: 110, loggedDate: getLocalDateString() }
          ];
          setLiftingHistory(mockLiftingHistory);
          saveToStorage('bf_lifting_history', mockLiftingHistory);
        }

        const DEFAULT_ACTIVITY_SCHEDULE: ActivityScheduleItem[] = [
          { id: 'act1', title: 'Ăn sáng lành mạnh 🍳', time: '08:00', type: 'breakfast', isEnabled: true, nutritionInfo: { protein: '25g', carbs: '45g', fat: '12g', calories: '380 kcal' }, suggestedMeals: ['Trứng luộc + bánh mì nguyên cám', 'Cháo yến mạch + chuối', 'Sữa chua Hy Lạp + granola'] },
          { id: 'act2', title: 'Ăn trưa giàu đạm 🥩', time: '12:00', type: 'lunch', isEnabled: true, nutritionInfo: { protein: '40g', carbs: '60g', fat: '18g', calories: '560 kcal' }, suggestedMeals: ['Cơm gạo lứt + ức gà nướng + rau xanh', 'Bún bò + rau sống', 'Salad cá hồi + khoai lang'] },
          { id: 'act3', title: 'Tập luyện thể thao 🏋️‍♂️', time: '17:30', type: 'workout', isEnabled: true },
          { id: 'act4', title: 'Ăn tối nhẹ nhàng 🥗', time: '19:00', type: 'dinner', isEnabled: true, nutritionInfo: { protein: '30g', carbs: '35g', fat: '10g', calories: '350 kcal' }, suggestedMeals: ['Salad ức gà + rau củ', 'Canh rau + đậu hũ + cá hấp', 'Soup bí đỏ + thịt bò nạc'] },
          { id: 'act5', title: 'Uống nước nhắc nhở 💧', time: '09:30', type: 'custom', isEnabled: true },
          { id: 'act6', title: 'Uống nước nhắc nhở 💧', time: '14:30', type: 'custom', isEnabled: true }
        ];

        if (storedActivitySchedule) {
          try {
            setActivitySchedule(JSON.parse(storedActivitySchedule));
          } catch {
            setActivitySchedule(DEFAULT_ACTIVITY_SCHEDULE);
            saveToStorage('bf_activity_schedule', DEFAULT_ACTIVITY_SCHEDULE);
            rescheduleAllNotifications(DEFAULT_ACTIVITY_SCHEDULE);
          }
        } else {
          setActivitySchedule(DEFAULT_ACTIVITY_SCHEDULE);
          saveToStorage('bf_activity_schedule', DEFAULT_ACTIVITY_SCHEDULE);
          rescheduleAllNotifications(DEFAULT_ACTIVITY_SCHEDULE);
        }

        if (storedPremium) {
          const loadedPremium = JSON.parse(storedPremium) === true;
          if (parsedUser && parsedUser.isPremium !== undefined) {
            setIsPremium(parsedUser.isPremium || false);
          } else {
            setIsPremium(loadedPremium);
          }
        }
        if (storedAdmin) {
          const loadedAdmin = JSON.parse(storedAdmin) === true;
          if (parsedUser && parsedUser.role !== undefined) {
            setIsAdmin(parsedUser.role === 'ADMIN');
          } else {
            setIsAdmin(loadedAdmin);
          }
        }

        // ─── Sync role from server immediately on app start ───
        // This ensures that if role was changed in DB, it reflects without re-login
        if (storedToken) {
          const loadedToken = (() => { try { return JSON.parse(storedToken); } catch { return storedToken; } })();
          let resolvedUrl = getDefaultBackendUrl();
          if (storedBackendUrl) {
            try {
              const u = JSON.parse(storedBackendUrl);
              if (u && u !== 'http://192.168.31.89:3000') resolvedUrl = u;
            } catch {
              if (storedBackendUrl && storedBackendUrl !== 'http://192.168.31.89:3000') resolvedUrl = storedBackendUrl;
            }
          }
          try {
            const syncRes = await fetch(`${resolvedUrl}/v1/auth/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${loadedToken}` }
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.success && syncData.user) {
                const freshUser = {
                  uid: syncData.user.firebaseUid,
                  email: syncData.user.email,
                  username: syncData.user.username,
                  role: syncData.user.role,
                  isPremium: syncData.user.isPremium
                };
                setCurrentUser(freshUser);
                setIsAdmin(syncData.user.role === 'ADMIN');
                setIsPremium(syncData.user.isPremium || false);
                saveToStorage('bf_current_user', freshUser);
                saveToStorage('bf_is_admin', syncData.user.role === 'ADMIN');
                saveToStorage('bf_is_premium', syncData.user.isPremium || false);
                console.log('[Auth] Role refreshed on startup:', syncData.user.role);
                await fetchBackendData(loadedToken, resolvedUrl);
              }
            }
          } catch (syncErr) {
            console.warn('[Auth] Could not sync role on startup (offline?):', syncErr);
          }
        }

        // One-time level and XP reset migration
        const levelResetFlag = Platform.OS === 'web' ? localStorage.getItem('bf_level_reset_v2') : await AsyncStorage.getItem('bf_level_reset_v2');
        if (!levelResetFlag) {
          let parsedProfile = null;
          if (storedProfile) {
            try {
              parsedProfile = JSON.parse(storedProfile);
            } catch { }
          }
          if (parsedProfile) {
            parsedProfile.level = 1;
            parsedProfile.xp = 0;
            parsedProfile.streakDays = 0;
            setUserProfile(parsedProfile);
            saveToStorage('bf_profile', parsedProfile);
          }
          if (Platform.OS === 'web') {
            localStorage.setItem('bf_level_reset_v2', 'true');
          } else {
            await AsyncStorage.setItem('bf_level_reset_v2', 'true');
          }
        }
      } catch (e) {
        console.warn('Failed to load storage', e);
      }
    };
    loadData();
  }, []);

  // Periodic check for local midnight date change to trigger auto-reset
  useEffect(() => {
    const checkDateAndReset = async () => {
      const todayStr = getLocalDateString();
      if (todayStr !== activeDateStr) {
        console.log(`[Auto-Reset] Date changed from ${activeDateStr} to ${todayStr}. Resetting metrics...`);
        setActiveDateStr(todayStr);

        if (userToken) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const logsRes = await fetch(`${backendUrl}/v1/logs/daily?date=${todayStr}`, {
              headers: {
                'Authorization': `Bearer ${userToken}`
              },
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (logsRes.ok) {
              const lData = await logsRes.json();
              const mappedFoods: FoodLog[] = (lData.foodLogs || []).map((f: any) => ({
                id: f.id,
                mealType: f.mealType,
                foodName: f.foodName,
                servingSizeG: f.servingSizeG,
                calories: f.calories,
                protein: f.protein,
                carbs: f.carbs,
                fat: f.fat,
                loggedDate: f.loggedDate,
                loggedAt: new Date(f.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }));
              const mappedWater: WaterLog[] = (lData.waterLogs || []).map((w: any) => ({
                id: w.id,
                amountMl: w.amountMl,
                loggedDate: w.loggedDate,
                loggedAt: new Date(w.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }));
              setFoodLogs(mappedFoods);
              setWaterLogs(mappedWater);
              saveToStorage('bf_foods', mappedFoods);
              saveToStorage('bf_water', mappedWater);
            }
          } catch (err) {
            console.warn('[Auto-Reset] Failed to fetch new day logs from backend:', err);
            setFoodLogs([]);
            setWaterLogs([]);
            saveToStorage('bf_foods', []);
            saveToStorage('bf_water', []);
          }
        } else {
          setFoodLogs([]);
          setWaterLogs([]);
          saveToStorage('bf_foods', []);
          saveToStorage('bf_water', []);
        }

        setQuests(prevQuests => {
          const freshQuests = generateDailyQuests([], []);
          saveToStorage('bf_quests', freshQuests);
          saveToStorage('bf_quest_date', todayStr);
          return freshQuests;
        });
      }
    };

    const intervalId = setInterval(checkDateAndReset, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [activeDateStr, userToken, backendUrl]);

  // Save changes
  const saveToStorage = (key: string, data: any) => {
    try {
      const jsonValue = JSON.stringify(data);
      if (Platform.OS === 'web') {
        localStorage.setItem(key, jsonValue);
      } else {
        AsyncStorage.setItem(key, jsonValue).catch(e => {
          console.warn('Failed to save key async', key, e);
        });
      }
    } catch (e) {
      console.warn('Failed to save key', key, e);
    }
  };

  const saveGeminiApiKey = (key: string) => {
    setGeminiApiKey(key);
    saveToStorage('bf_gemini_api_key', key);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('bf_gemini_api_key', key);
      } catch (e) {
        console.warn('Failed to save api key to localstorage', e);
      }
    }
  };

  const saveGroqApiKey = (key: string) => {
    setGroqApiKey(key);
    saveToStorage('bf_groq_api_key', key);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('bf_groq_api_key', key);
      } catch (e) {
        console.warn('Failed to save groq api key to localstorage', e);
      }
    }
  };

  const saveOpenRouterApiKey = (key: string) => {
    setOpenRouterApiKey(key);
    saveToStorage('bf_openrouter_api_key', key);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('bf_openrouter_api_key', key);
      } catch (e) {
        console.warn('Failed to save openrouter api key to localstorage', e);
      }
    }
  };

  const saveChatModelProvider = (provider: 'openrouter' | 'gemini' | 'groq' | 'backend') => {
    setChatModelProvider(provider);
    saveToStorage('bf_chat_model_provider', provider);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('bf_chat_model_provider', provider);
      } catch (e) {
        console.warn('Failed to save chat model provider to localstorage', e);
      }
    }
  };

  const calculateProfileMetrics = (profileInput: any) => {
    const { weightKg, heightCm, age, gender, activityLevel, targetGoal } = profileInput;

    const bmi = weightKg / Math.pow(heightCm / 100, 2);

    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    const genderFactor = gender === 'male' ? 1 : 0;
    const bodyFatEstimate = Math.max(2, 1.20 * bmi + 0.23 * age - 16.2 * genderFactor - 5.4);
    const leanBodyMass = weightKg * (1 - bodyFatEstimate / 100);

    const multipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      athlete: 1.9
    };
    const tdee = bmr * multipliers[activityLevel as keyof typeof multipliers];

    let targetCalories = tdee;
    let targetWaterMl = 2000;

    if (targetGoal === 'weight_loss') {
      targetCalories -= 450;
      targetWaterMl = 2500;
    } else if (targetGoal === 'weight_gain') {
      targetCalories += 400;
      targetWaterMl = 3000;
    } else if (targetGoal === 'muscle_gain') {
      targetCalories += 250;
      targetWaterMl = 3000;
    } else if (targetGoal === 'healthy_lifestyle') {
      targetWaterMl = 2200;
    }

    let pPct = 0.25, cPct = 0.50, fPct = 0.25;
    if (targetGoal === 'muscle_gain') {
      pPct = 0.35; cPct = 0.45; fPct = 0.20;
    } else if (targetGoal === 'weight_loss') {
      pPct = 0.30; cPct = 0.40; fPct = 0.30;
    }

    const targetProtein = Math.round((targetCalories * pPct) / 4);
    const targetCarbs = Math.round((targetCalories * cPct) / 4);
    const targetFat = Math.round((targetCalories * fPct) / 9);

    return {
      bmi: Number(bmi.toFixed(1)),
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      targetProtein,
      targetCarbs,
      targetFat,
      targetWaterMl,
      bodyFatEstimate: Number(bodyFatEstimate.toFixed(1)),
      leanBodyMass: Number(leanBodyMass.toFixed(1))
    };
  };

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 3500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timer);
    }
  };

  const fetchBackendData = async (token: string, hostUrl: string) => {
    try {
      const profileRes = await fetchWithTimeout(`${hostUrl}/v1/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (pData.success && pData.profile) {
          const prof = pData.profile;
          setUserProfile({
            firstName: prof.firstName || '',
            lastName: prof.lastName || '',
            age: prof.age,
            gender: prof.gender,
            heightCm: prof.heightCm,
            weightKg: prof.weightKg,
            activityLevel: prof.activityLevel,
            targetGoal: prof.targetGoal,
            bmi: prof.bmi,
            bmr: prof.bmr,
            tdee: prof.tdee,
            targetCalories: prof.targetCalories,
            targetProtein: prof.targetProtein,
            targetCarbs: prof.targetCarbs,
            targetFat: prof.targetFat,
            targetWaterMl: prof.targetWaterMl,
            bodyFatEstimate: prof.bodyFatEstimate ?? 18,
            leanBodyMass: prof.leanBodyMass ?? 55,
            xp: prof.xp ?? 0,
            level: prof.level ?? 1,
            streakDays: prof.streakDays ?? 0,
            avatarUrl: prof.avatarUrl
          });
          saveToStorage('bf_profile', {
            ...prof,
            bodyFatEstimate: prof.bodyFatEstimate ?? 18,
            leanBodyMass: prof.leanBodyMass ?? 55,
            xp: prof.xp ?? 0,
            level: prof.level ?? 1,
            streakDays: prof.streakDays ?? 0
          });
        }
      }

      // 2. Fetch Full Logs History (last 90 days)
      const historyRes = await fetchWithTimeout(`${hostUrl}/v1/logs/history?limit=90`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (historyRes.ok) {
        const hData = await historyRes.json();
        if (hData.success && Array.isArray(hData.days)) {
          const allFoods: FoodLog[] = [];
          const allWater: WaterLog[] = [];
          const allWeights: WeightLog[] = [];

          hData.days.forEach((dayItem: any) => {
            const date = dayItem.date;
            if (Array.isArray(dayItem.foodLogs)) {
              dayItem.foodLogs.forEach((f: any) => {
                allFoods.push({
                  id: f.id,
                  mealType: f.mealType,
                  foodName: f.foodName,
                  servingSizeG: f.servingSizeG,
                  calories: f.calories,
                  protein: f.protein,
                  carbs: f.carbs,
                  fat: f.fat,
                  loggedDate: f.loggedDate ? (typeof f.loggedDate === 'string' ? f.loggedDate.split('T')[0] : date) : date,
                  loggedAt: f.loggedAt ? new Date(f.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'
                });
              });
            }
            if (Array.isArray(dayItem.waterLogs)) {
              dayItem.waterLogs.forEach((w: any) => {
                allWater.push({
                  id: w.id,
                  amountMl: w.amountMl,
                  loggedDate: w.loggedDate ? (typeof w.loggedDate === 'string' ? w.loggedDate.split('T')[0] : date) : date,
                  loggedAt: w.loggedAt ? new Date(w.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'
                });
              });
            }
            if (Array.isArray(dayItem.weightLogs)) {
              dayItem.weightLogs.forEach((w: any) => {
                allWeights.push({
                  id: w.id,
                  weightKg: w.weightKg,
                  waistCm: w.waistCm,
                  chestCm: w.chestCm,
                  hipsCm: w.hipsCm,
                  bodyFatPct: w.bodyFatPct,
                  photoUrl: w.photoUrl,
                  loggedDate: w.loggedDate ? (typeof w.loggedDate === 'string' ? w.loggedDate.split('T')[0] : date) : date,
                  loggedAt: w.loggedAt || new Date().toISOString()
                });
              });
            }
          });

          setFoodLogs(allFoods);
          saveToStorage('bf_foods', allFoods);

          setWaterLogs(allWater);
          saveToStorage('bf_water', allWater);

          if (allWeights.length > 0) {
            setWeightLogs(allWeights);
            saveToStorage('bf_weight', allWeights);
          }
        }
      }

      // 3. Fetch Weight Logs
      const weightRes = await fetchWithTimeout(`${hostUrl}/v1/users/weight`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (weightRes.ok) {
        const wData = await weightRes.json();
        if (wData.success && wData.logs) {
          setWeightLogs(wData.logs);
          saveToStorage('bf_weight', wData.logs);
        }
      }

      // 4. Fetch Workout Programs
      const programsRes = await fetchWithTimeout(`${hostUrl}/v1/workouts/programs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (programsRes.ok) {
        const prData = await programsRes.json();
        if (prData.success && prData.programs) {
          let deletedIds: string[] = [];
          try {
            const stored = Platform.OS === 'web' ? localStorage.getItem('bf_deleted_workouts') : await AsyncStorage.getItem('bf_deleted_workouts');
            if (stored) deletedIds = JSON.parse(stored);
          } catch (e) {}
          const filtered = prData.programs.filter((p: any) => !deletedIds.includes(p.id));
          setWorkoutPrograms(filtered);
          saveToStorage('bf_workouts', filtered);
        }
      }

      // 5. Fetch Workout Schedules
      const schedulesRes = await fetchWithTimeout(`${hostUrl}/v1/workouts/schedules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (schedulesRes.ok) {
        const schData = await schedulesRes.json();
        if (schData.success && schData.schedules) {
          setWorkoutSchedules(schData.schedules);
          saveToStorage('bf_schedules', schData.schedules);
        }
      }

      // 6. Fetch Active Meal Plan
      const mealPlanRes = await fetchWithTimeout(`${hostUrl}/v1/mealplans/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (mealPlanRes.ok) {
        const mpData = await mealPlanRes.json();
        if (mpData.success && mpData.plan) {
          setActiveMealPlan(mpData.plan);
          saveToStorage('bf_mealplan', mpData.plan);
        }
      }

      // 7. Fetch Community Posts
      const postsRes = await fetchWithTimeout(`${hostUrl}/v1/community/posts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (postsRes.ok) {
        const poData = await postsRes.json();
        if (poData.success && poData.posts) {
          setCommunityPosts(poData.posts);
          saveToStorage('bf_posts', poData.posts);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch backend data', e);
    }
  };

  useEffect(() => {
    if (!userToken) return;

    // Fetch initial backend data
    fetchBackendData(userToken, backendUrl);

    // Realtime Auto-Sync on Web Desktop: Listen to Window Focus & Polling Interval (every 4s)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleFocus = () => {
        fetchBackendData(userToken, backendUrl);
      };
      window.addEventListener('focus', handleFocus);

      const intervalId = setInterval(() => {
        fetchBackendData(userToken, backendUrl);
      }, 4000);

      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(intervalId);
      };
    } else {
      // Mobile AppState change listener (sync when app comes back to foreground)
      const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
          fetchBackendData(userToken, backendUrl);
        }
      });
      return () => subscription.remove();
    }
  }, [userToken, backendUrl]);

  // (Role is synced from server directly inside loadData() on app startup)

  const login = async (username: string, password: string): Promise<boolean> => {
    const cleanUsername = username.trim().toLowerCase();
    const token = `mock-token:login:${cleanUsername}:${password}`;
    const url = `${backendUrl}/v1/auth/sync`;
    console.log(`[DEBUG AUTH] Attempting login to URL: ${url}`);

    let backendSuccess = false;
    let backendUser = null;
    let errorMsg = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const resText = await res.text();
        const data = JSON.parse(resText);
        if (data.success && data.user) {
          backendSuccess = true;
          backendUser = data.user;
        }
      } else {
        const resText = await res.text();
        try {
          const parsed = JSON.parse(resText);
          errorMsg = parsed.message || 'Đăng nhập không thành công';
        } catch {
          errorMsg = 'Đăng nhập không thành công';
        }
      }
    } catch (err: any) {
      console.warn('[AUTH] Backend connection failed or timed out:', err);
      errorMsg = err.name === 'AbortError' ? 'Hết thời gian chờ kết nối Backend (Timed out)' : (err.message || 'Không thể kết nối Backend');
    }

    if (backendSuccess && backendUser) {
      setUserToken(token);
      const userData = {
        uid: backendUser.firebaseUid,
        email: backendUser.email,
        username: backendUser.username,
        role: backendUser.role,
        isPremium: backendUser.isPremium
      };
      setCurrentUser(userData);
      setIsAdmin(backendUser.role === 'ADMIN');
      setIsPremium(backendUser.isPremium || false);
      saveToStorage('bf_user_token', token);
      saveToStorage('bf_current_user', userData);
      saveToStorage('bf_is_admin', backendUser.role === 'ADMIN');
      saveToStorage('bf_is_premium', backendUser.isPremium || false);

      try {
        const rawP = Platform.OS === 'web' ? localStorage.getItem('bf_profile') : await AsyncStorage.getItem('bf_profile');
        if (rawP) setUserProfile(JSON.parse(rawP));
        const rawF = Platform.OS === 'web' ? localStorage.getItem('bf_foods') : await AsyncStorage.getItem('bf_foods');
        if (rawF) setFoodLogs(JSON.parse(rawF));
        const rawW = Platform.OS === 'web' ? localStorage.getItem('bf_water') : await AsyncStorage.getItem('bf_water');
        if (rawW) setWaterLogs(JSON.parse(rawW));
      } catch (e) {
        console.warn('Failed to restore local data on login:', e);
      }

      await fetchBackendData(token, backendUrl);
      return true;
    } else {
      // Offline / Local Account Fallback Mode (So user is NEVER stuck when backend IP is unreachable on mobile)
      console.log(`[AUTH FALLBACK] Performing local offline login for user: ${cleanUsername}`);
      const fallbackUserData = {
        uid: `local-uid-${cleanUsername}`,
        email: `${cleanUsername}@bodyfit.com`,
        username: cleanUsername,
        role: cleanUsername === 'gakon' || cleanUsername === 'admin' ? 'ADMIN' : 'USER',
        isPremium: true
      };

      setUserToken(token);
      setCurrentUser(fallbackUserData);
      setIsAdmin(fallbackUserData.role === 'ADMIN');
      setIsPremium(true);
      saveToStorage('bf_user_token', token);
      saveToStorage('bf_current_user', fallbackUserData);
      saveToStorage('bf_is_admin', fallbackUserData.role === 'ADMIN');
      saveToStorage('bf_is_premium', true);

      try {
        const rawP = Platform.OS === 'web' ? localStorage.getItem('bf_profile') : await AsyncStorage.getItem('bf_profile');
        if (rawP) {
          setUserProfile(JSON.parse(rawP));
        } else {
          setUserProfile({
            firstName: cleanUsername === 'gakon' ? 'Tài' : cleanUsername,
            lastName: cleanUsername === 'gakon' ? '(gakon)' : '',
            age: 24,
            gender: 'male',
            heightCm: 175,
            weightKg: 51,
            activityLevel: 'moderately_active',
            targetGoal: 'muscle_gain',
            bmi: 16.7,
            bmr: 1484,
            tdee: 1781,
            targetCalories: 2031,
            targetProtein: 130,
            targetCarbs: 200,
            targetFat: 60,
            targetWaterMl: 2500,
            bodyFatEstimate: 15,
            leanBodyMass: 45,
            xp: 120,
            level: 2,
            streakDays: 1,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
          });
        }
      } catch (e) {
        console.warn('Failed to set fallback profile:', e);
      }

      if (Platform.OS === 'web') {
        console.log('Đã đăng nhập thành công (Chế độ Ngoại tuyến / Local)');
      } else {
        Alert.alert('Đăng nhập thành công! 🚀', 'Đã khởi tạo phiên đăng nhập (Chế độ Ngoại tuyến).');
      }
      return true;
    }
  };

  const register = async (username: string, emailOrPhone: string, password: string): Promise<boolean> => {
    try {
      const token = `mock-token:register:${username.trim().toLowerCase()}:${emailOrPhone.trim().toLowerCase()}:${password}`;
      const res = await fetch(`${backendUrl}/v1/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Đăng ký không thành công');
      }
      const data = await res.json();
      if (data.success && data.user) {
        setUserToken(token);
        const userData = {
          uid: data.user.firebaseUid,
          email: data.user.email,
          username: data.user.username,
          role: data.user.role,
          isPremium: data.user.isPremium
        };
        setCurrentUser(userData);
        setIsAdmin(data.user.role === 'ADMIN');
        setIsPremium(data.user.isPremium || false);
        saveToStorage('bf_user_token', token);
        saveToStorage('bf_current_user', userData);
        saveToStorage('bf_is_admin', data.user.role === 'ADMIN');
        saveToStorage('bf_is_premium', data.user.isPremium || false);

        setUserProfile(null);
        saveToStorage('bf_profile', null);
        setFoodLogs([]);
        setWaterLogs([]);
        saveToStorage('bf_foods', []);
        saveToStorage('bf_water', []);
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('Registration error:', err);
      Alert.alert('Đăng ký thất bại', err.message || 'Lỗi mạng khi kết nối tới backend');
      return false;
    }
  };

  const loginWithGoogle = async (token: string, details?: { email: string; name: string }): Promise<boolean> => {
    try {
      const res = await fetch(`${backendUrl}/v1/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Đăng nhập Google không thành công');
      }
      const data = await res.json();
      if (data.success && data.user) {
        setUserToken(token);
        const userData = {
          uid: data.user.firebaseUid,
          email: data.user.email,
          username: data.user.username || details?.name || 'Google User',
          role: data.user.role,
          isPremium: data.user.isPremium
        };
        setCurrentUser(userData);
        setIsAdmin(data.user.role === 'ADMIN');
        setIsPremium(data.user.isPremium || false);
        saveToStorage('bf_user_token', token);
        saveToStorage('bf_current_user', userData);
        saveToStorage('bf_is_admin', data.user.role === 'ADMIN');
        saveToStorage('bf_is_premium', data.user.isPremium || false);

        await fetchBackendData(token, backendUrl);
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('Google login error:', err);
      Alert.alert('Đăng nhập Google thất bại', err.message || 'Lỗi mạng khi kết nối tới backend');
      return false;
    }
  };

  const resetPassword = async (usernameOrEmail: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch(`${backendUrl}/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          newPassword
        })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Đặt lại mật khẩu không thành công');
      }
      return true;
    } catch (err: any) {
      console.warn('Reset password error:', err);
      Alert.alert('Đặt lại mật khẩu thất bại', err.message || 'Lỗi kết nối tới backend');
      return false;
    }
  };

  const sendRegisterOtp = async (
    username: string,
    emailOrPhone: string,
    password: string
  ): Promise<{ success: boolean; message: string; devOtp?: string }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch(`${backendUrl}/v1/auth/register/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          emailOrPhone: emailOrPhone.trim(),
          password
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Gửi OTP đăng ký thất bại');
      }
      return {
        success: true,
        message: data.message || 'Đã gửi mã OTP thành công',
        devOtp: data.devOtp
      };
    } catch (err: any) {
      console.warn('sendRegisterOtp error:', err);
      const errMsg = err.name === 'AbortError' ? 'Yêu cầu gửi OTP hết thời gian chờ (Timeout). Vui lòng kiểm tra lại kết nối máy chủ.' : (err.message || 'Lỗi mạng khi kết nối tới backend');
      Alert.alert('Lỗi', errMsg);
      return { success: false, message: errMsg };
    }
  };

  const verifyRegisterOtp = async (emailOrPhone: string, otp: string): Promise<boolean> => {
    try {
      const res = await fetch(`${backendUrl}/v1/auth/register/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          otp: otp.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Xác thực OTP thất bại');
      }
      if (data.success && data.user) {
        const token = data.token;
        setUserToken(token);
        const userData = {
          uid: data.user.firebaseUid,
          email: data.user.email,
          username: data.user.username,
          role: data.user.role,
          isPremium: data.user.isPremium
        };
        setCurrentUser(userData);
        setIsAdmin(data.user.role === 'ADMIN');
        setIsPremium(data.user.isPremium || false);
        saveToStorage('bf_user_token', token);
        saveToStorage('bf_current_user', userData);
        saveToStorage('bf_is_admin', data.user.role === 'ADMIN');
        saveToStorage('bf_is_premium', data.user.isPremium || false);

        setUserProfile(null);
        saveToStorage('bf_profile', null);
        setFoodLogs([]);
        setWaterLogs([]);
        saveToStorage('bf_foods', []);
        saveToStorage('bf_water', []);
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('verifyRegisterOtp error:', err);
      Alert.alert('Xác thực thất bại', err.message || 'Lỗi mạng khi kết nối tới backend');
      return false;
    }
  };

  const sendForgotPasswordOtp = async (
    emailOrPhone: string
  ): Promise<{ success: boolean; message: string; emailOrPhone?: string; devOtp?: string }> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch(`${backendUrl}/v1/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim()
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Gửi OTP đặt lại mật khẩu thất bại');
      }
      return {
        success: true,
        message: data.message || 'Đã gửi mã OTP thành công',
        emailOrPhone: data.emailOrPhone,
        devOtp: data.devOtp
      };
    } catch (err: any) {
      console.warn('sendForgotPasswordOtp error:', err);
      const errMsg = err.name === 'AbortError' ? 'Yêu cầu gửi OTP hết thời gian chờ (Timeout). Vui lòng kiểm tra lại kết nối máy chủ.' : (err.message || 'Lỗi mạng khi kết nối tới backend');
      return { success: false, message: errMsg };
    }
  };

  const verifyForgotPasswordOtp = async (
    emailOrPhone: string,
    otp: string,
    newPasswordHash: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${backendUrl}/v1/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          otp: otp.trim(),
          newPassword: newPasswordHash
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Xác thực OTP đặt lại mật khẩu thất bại');
      }
      return true;
    } catch (err: any) {
      console.warn('verifyForgotPasswordOtp error:', err);
      Alert.alert('Lỗi', err.message || 'Lỗi mạng khi kết nối tới backend');
      return false;
    }
  };

  const logout = () => {
    setUserToken(null);
    setCurrentUser(null);
    setIsAdmin(false);
    setIsPremium(false);
    setUserProfile(null);
    setFoodLogs([]);
    setWaterLogs([]);
    setWeightLogs([]);
    setWorkoutSchedules([]);
    saveToStorage('bf_user_token', null);
    saveToStorage('bf_current_user', null);
    saveToStorage('bf_is_admin', false);
    saveToStorage('bf_is_premium', false);
    saveToStorage('bf_profile', null);
    saveToStorage('bf_foods', []);
    saveToStorage('bf_water', []);
    saveToStorage('bf_weight', []);
    saveToStorage('bf_schedules', []);
  };

  const saveBackendUrl = (url: string) => {
    if (!url || url.trim() === '') {
      const defaultUrl = getDefaultBackendUrl();
      setBackendUrl(defaultUrl);
      saveToStorage('bf_backend_url', '');
    } else {
      const cleanUrl = url.trim().replace(/\/+$/, '');
      setBackendUrl(cleanUrl);
      saveToStorage('bf_backend_url', cleanUrl);
    }
  };

  const saveDailyDeclaration = async (
    date: string,
    declaration: { activity: string; image: string; steps?: number; activeCalories?: number; activeTime?: number }
  ) => {
    setDailyDeclarations(prev => {
      const updated = {
        ...prev,
        [date]: {
          activity: declaration.activity,
          image: declaration.image,
          steps: declaration.steps ?? prev[date]?.steps ?? 0,
          activeCalories: declaration.activeCalories ?? prev[date]?.activeCalories ?? 0,
          activeTime: declaration.activeTime ?? prev[date]?.activeTime ?? 0,
        }
      };
      saveToStorage('bf_declarations', updated);
      return updated;
    });
    addXp(20);

    if (userToken) {
      try {
        await fetch(`${backendUrl}/v1/logs/declaration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            date,
            activity: declaration.activity,
            image: declaration.image || '',
            steps: declaration.steps ?? 0,
            activeCalories: declaration.activeCalories ?? 0,
            activeTime: declaration.activeTime ?? 0,
          }),
        });
      } catch (e) {
        console.warn('Failed to sync daily declaration to backend:', e);
      }
    }
  };

  const getLogsForDate = async (date: string) => {
    const getLocalData = () => {
      const localFoods = foodLogs.filter(f => (f.loggedDate || getLocalDateString()) === date);
      const localWater = waterLogs.filter(w => (w.loggedDate || getLocalDateString()) === date);
      const localWeights = weightLogs.filter(w => w.loggedDate === date);
      const localWorkouts = workoutSchedules.filter(w => w.scheduledDate === date);
      const totals = localFoods.reduce((acc, item) => {
        acc.calories += item.calories || 0;
        acc.protein += item.protein || 0;
        acc.carbs += item.carbs || 0;
        acc.fat += item.fat || 0;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
      const totalWater = localWater.reduce((sum, item) => sum + (item.amountMl || 0), 0);

      return {
        date,
        foodLogs: localFoods,
        waterLogs: localWater,
        weightLogs: localWeights,
        workoutSchedules: localWorkouts,
        totals: { ...totals, waterMl: totalWater },
        targets: userProfile ? { calories: userProfile.targetCalories, protein: userProfile.targetProtein, carbs: userProfile.targetCarbs, fat: userProfile.targetFat, waterMl: userProfile.targetWaterMl } : null,
        alerts: buildLocalPlanAlerts(localFoods, localWater),
        declaration: dailyDeclarations[date] || null,
      };
    };

    if (!userToken) {
      return getLocalData();
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const logsRes = await fetch(`${backendUrl}/v1/logs/daily?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (logsRes.ok) {
        const lData = await logsRes.json();
        const mappedFoods: FoodLog[] = (lData.foodLogs || []).map((f: any) => ({
          id: f.id,
          mealType: f.mealType,
          foodName: f.foodName,
          servingSizeG: f.servingSizeG,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          loggedDate: f.loggedDate,
          loggedAt: new Date(f.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        const mappedWater: WaterLog[] = (lData.waterLogs || []).map((w: any) => ({
          id: w.id,
          amountMl: w.amountMl,
          loggedDate: w.loggedDate,
          loggedAt: new Date(w.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        const mappedWeights: WeightLog[] = (lData.weightLogs || []).map((w: any) => ({
          id: w.id,
          weightKg: w.weightKg,
          waistCm: w.waistCm,
          chestCm: w.chestCm,
          hipsCm: w.hipsCm,
          bodyFatPct: w.bodyFatPct,
          photoUrl: w.photoUrl,
          loggedDate: w.loggedDate,
          loggedAt: w.loggedAt
        }));
        return {
          foodLogs: mappedFoods,
          waterLogs: mappedWater,
          weightLogs: mappedWeights,
          workoutSchedules: lData.workoutSchedules || [],
          totals: lData.totals,
          targets: lData.targets,
          alerts: lData.alerts || [],
          declaration: lData.declaration || null,
        };
      }
    } catch (e) {
      console.warn('Failed to fetch logs for date or timed out, loading locally:', date, e);
    }
    return getLocalData();
  };

  const buildLocalPlanAlerts = (foods: FoodLog[], waters: WaterLog[]): PlanAlert[] => {
    if (!userProfile) return [];
    const totals = foods.reduce((acc, item) => {
      acc.calories += item.calories || 0;
      acc.protein += item.protein || 0;
      acc.carbs += item.carbs || 0;
      acc.fat += item.fat || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    const waterMl = waters.reduce((sum, item) => sum + (item.amountMl || 0), 0);
    const metrics = [
      { metric: 'calories', label: 'Calo', actual: totals.calories, target: userProfile.targetCalories, unit: 'kcal' },
      { metric: 'protein', label: 'Protein', actual: totals.protein, target: userProfile.targetProtein, unit: 'g' },
      { metric: 'carbs', label: 'Carbs', actual: totals.carbs, target: userProfile.targetCarbs, unit: 'g' },
      { metric: 'fat', label: 'Chat beo', actual: totals.fat, target: userProfile.targetFat, unit: 'g' },
      { metric: 'waterMl', label: 'Nuoc', actual: waterMl, target: userProfile.targetWaterMl, unit: 'ml' },
    ];
    return metrics.reduce<PlanAlert[]>((alerts, item) => {
      if (!item.target) return alerts;
      const ratio = item.actual / item.target;
      if (ratio >= 1.1) {
        alerts.push({
          type: 'over',
          metric: item.metric,
          actual: Math.round(item.actual),
          target: item.target,
          message: `${item.label} vuot ke hoach ${Math.round((ratio - 1) * 100)}% (${Math.round(item.actual)}/${item.target} ${item.unit}).`,
        });
      } else if (ratio <= 0.8) {
        alerts.push({
          type: 'under',
          metric: item.metric,
          actual: Math.round(item.actual),
          target: item.target,
          message: `${item.label} dang thap hon ke hoach ${Math.round((1 - ratio) * 100)}% (${Math.round(item.actual)}/${item.target} ${item.unit}).`,
        });
      }
      return alerts;
    }, []);
  };

  const getUserHistory = async (days = 14): Promise<UserHistoryDay[]> => {
    const getLocalHistory = (limitDays: number): UserHistoryDay[] => {
      const todayObj = new Date();
      const historyList: UserHistoryDay[] = [];
      const todayStrLocal = getLocalDateString(todayObj);

      for (let i = 0; i < limitDays; i++) {
        const dateObj = new Date();
        dateObj.setDate(todayObj.getDate() - i);
        const dateStr = getLocalDateString(dateObj);

        const dayFoods = foodLogs.filter(f => (f.loggedDate || todayStrLocal) === dateStr);
        const dayWater = waterLogs.filter(w => (w.loggedDate || todayStrLocal) === dateStr);
        const dayWeights = weightLogs.filter(w => w.loggedDate === dateStr);
        const dayWorkouts = workoutSchedules.filter(w => w.scheduledDate === dateStr);
        const dayDecl = dailyDeclarations[dateStr] || null;

        const totals = dayFoods.reduce((acc, item) => {
          acc.calories += item.calories || 0;
          acc.protein += item.protein || 0;
          acc.carbs += item.carbs || 0;
          acc.fat += item.fat || 0;
          return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
        const waterMl = dayWater.reduce((sum, item) => sum + (item.amountMl || 0), 0);

        const hasData = dayFoods.length > 0 || dayWater.length > 0 || dayWeights.length > 0 || dayWorkouts.length > 0 || dayDecl;
        if (hasData || i === 0) {
          historyList.push({
            date: dateStr,
            totals: { ...totals, waterMl },
            targets: userProfile ? { calories: userProfile.targetCalories, protein: userProfile.targetProtein, carbs: userProfile.targetCarbs, fat: userProfile.targetFat, waterMl: userProfile.targetWaterMl } : null,
            alerts: buildLocalPlanAlerts(dayFoods, dayWater),
            foodLogs: dayFoods,
            waterLogs: dayWater,
            weightLogs: dayWeights,
            workoutSchedules: dayWorkouts,
            declaration: dayDecl,
          });
        }
      }

      return historyList;
    };

    if (userToken) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const res = await fetch(`${backendUrl}/v1/logs/history?limit=${days}`, {
          headers: { 'Authorization': `Bearer ${userToken}` },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.days)) return data.days;
        }
      } catch (e) {
        console.warn('Failed to fetch user history or timed out, loading locally:', e);
      }
    }

    return getLocalHistory(days);
  };

  const generateDailyAiReview = async (dayData: UserHistoryDay): Promise<string> => {
    const { date, totals, targets, foodLogs, waterLogs, weightLogs, workoutSchedules } = dayData;
    const safeDate = date || getLocalDateString();
    const foodListStr = foodLogs.map(f => `- [${f.mealType}] ${f.foodName}: ${f.servingSizeG}g (${f.calories} kcal, P: ${f.protein}g, C: ${f.carbs}g, F: ${f.fat}g)`).join('\n');
    const waterTotalStr = `${totals?.waterMl || 0}ml`;
    const waterTargetStr = targets?.waterMl ? `${targets.waterMl}ml` : '2000ml';
    const workoutListStr = (workoutSchedules || []).map(w => `- ${w.program?.title || 'Bài tập thể lực'} (Đã hoàn thành)`).join('\n');
    const weightStr = weightLogs && weightLogs.length > 0 ? `${weightLogs[0].weightKg}kg` : 'Chưa ghi nhận';

    const systemInstruction = `Bạn là huấn luyện viên sức khỏe AI (AI Health Coach) của Body Fit.
Nhiệm vụ của bạn là nhận báo cáo thông số dinh dưỡng và tập luyện trong ngày của người dùng, phân tích và đưa ra đánh giá chi tiết, mang tính xây dựng, ngắn gọn bằng tiếng Việt.
Hãy phân tích rõ:
1. Nước uống: Đạt hay thiếu so với mục tiêu?
2. Dinh dưỡng (Calories, Protein, Carbs, Fat): Thiếu chất gì, thừa chất gì? Chỉ ra cụ thể các con số thực tế so với mục tiêu.
3. Vận động: Đã hoàn thành các bài tập nào chưa?
4. Đưa ra lời khuyên thiết thực (ví dụ: cần ăn thêm gì, bớt ăn gì, uống thêm nước lúc nào).
Phản hồi bằng ngôn ngữ thân thiện, dễ hiểu, định dạng Markdown rõ ràng và đẹp mắt. Không dùng các câu chào hỏi hay kết bài rườm rà.`;

    const prompt = `Hãy đánh giá ngày ${safeDate.split('-').reverse().join('/')} của tôi dựa trên các thông số sau:
- Cân nặng: ${weightStr}
- Nước uống: Thực tế ${waterTotalStr} / Mục tiêu ${waterTargetStr}
- Bài tập đã hoàn thành:
${workoutListStr || 'Không có bài tập nào hoàn thành.'}
- Thức ăn đã ăn:
${foodListStr || 'Không ghi nhận món ăn nào.'}
- Tổng dinh dưỡng thực tế:
+ Calories: ${totals?.calories || 0} kcal (Mục tiêu: ${targets?.calories || 2000} kcal)
+ Protein: ${totals?.protein || 0}g (Mục tiêu: ${targets?.protein || 120}g)
+ Carbs: ${totals?.carbs || 0}g (Mục tiêu: ${targets?.carbs || 250}g)
+ Fat: ${totals?.fat || 0}g (Mục tiêu: ${targets?.fat || 60}g)`;

    // 1. Try Gemini
    if (geminiApiKey && geminiApiKey.trim() !== '') {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] }
          })
        });
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }
      } catch (e) {
        console.warn('Gemini review generation failed, falling back:', e);
      }
    }

    // 2. Try OpenRouter
    if (openRouterApiKey && openRouterApiKey.trim() !== '') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterApiKey.trim()}`,
            'HTTP-Referer': 'https://github.com/bodyfit',
            'X-Title': 'BodyFit App'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt }
            ]
          })
        });
        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) return text;
        }
      } catch (e) {
        console.warn('OpenRouter review generation failed, falling back:', e);
      }
    }

    // 3. Fallback to Local Offline Rule-Based Markdown Review
    const isWaterOk = (totals?.waterMl || 0) >= (targets?.waterMl || 2000);
    const calDiff = (totals?.calories || 0) - (targets?.calories || 2000);
    const pDiff = (totals?.protein || 0) - (targets?.protein || 120);
    const cDiff = (totals?.carbs || 0) - (targets?.carbs || 250);
    const fDiff = (totals?.fat || 0) - (targets?.fat || 60);

    return `### 🤖 Đánh giá sức khỏe ngày ${safeDate.split('-').reverse().join('/')} (Offline)

#### 1. Nước uống:
- Thực tế: **${waterTotalStr}** / Mục tiêu: **${waterTargetStr}**
- **Đánh giá:** ${isWaterOk ? '🎉 Bạn đã uống đủ nước! Hãy tiếp tục duy trì thói quen này để tăng cường trao đổi chất.' : '⚠️ Bạn uống chưa đủ nước. Hãy đặt lời nhắc uống nước cách mỗi 2 giờ nhé!'}

#### 2. Dinh dưỡng & Năng lượng:
- **Calories:** ${totals?.calories || 0} / ${targets?.calories || 2000} kcal (${calDiff >= 0 ? `Thừa +${calDiff}` : `Thiếu ${calDiff}`} kcal)
- **Protein (Đạm):** ${totals?.protein || 0}g / ${targets?.protein || 120}g (${pDiff >= 0 ? `Thừa +${pDiff}g` : `Thiếu ${pDiff}g`})
- **Carbs (Tinh bột):** ${totals?.carbs || 0}g / ${targets?.carbs || 250}g (${cDiff >= 0 ? `Thừa +${cDiff}g` : `Thiếu ${cDiff}g`})
- **Fat (Chất béo):** ${totals?.fat || 0}g / ${targets?.fat || 60}g (${fDiff >= 0 ? `Thừa +${fDiff}g` : `Thiếu ${fDiff}g`})

#### 3. Vận động:
- ${workoutSchedules && workoutSchedules.length > 0 ? `🏆 Bạn đã hoàn thành các buổi tập: \n${workoutListStr}` : '⚠️ Bạn chưa hoàn thành bài tập nào trong ngày hôm nay. Hãy cố gắng vận động nhẹ nhàng nhé!'}

#### 💡 Khuyên dùng:
- ${pDiff < 0 ? '• Cần bổ sung thêm thực phẩm giàu Protein như ức gà, trứng, thịt bò hoặc whey protein.' : ''}
- ${cDiff < 0 ? '• Cần ăn thêm tinh bột hấp thu chậm như yến mạch, khoai lang để có năng lượng tập luyện.' : ''}
- ${fDiff < 0 ? '• Bổ sung chất béo tốt từ quả bơ, các loại hạt (hạnh nhân, óc chó) hoặc dầu olive.' : ''}
- ${calDiff > 200 ? '• Bạn đang nạp hơi dư calo hôm nay. Hãy tăng cường đi bộ hoặc tập cardio nhẹ để tiêu hao bớt.' : ''}
- ${isWaterOk ? '• Cơ thể bạn đang đủ nước, da dẻ và cơ bắp sẽ phục hồi tốt hơn!' : '• Hãy nhớ mang theo bình nước bên mình và uống từng ngụm nhỏ suốt cả ngày.'}
*(Đánh giá ngoại tuyến dựa trên thuật toán tích hợp cục bộ)*`;
  };
  const updateProfile = async (profile: any) => {
    const calculations = calculateProfileMetrics(profile);
    const updated: UserProfile = {
      ...profile,
      avatarUrl: profile.avatarUrl !== undefined ? profile.avatarUrl : userProfile?.avatarUrl,
      ...calculations,
      xp: userProfile?.xp ?? 0,
      level: userProfile?.level ?? 1,
      streakDays: userProfile?.streakDays ?? 0,
    };
    setUserProfile(updated);
    saveToStorage('bf_profile', updated);
    addXp(30);

    if (userToken) {
      try {
        await fetch(`${backendUrl}/v1/users/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            ...profile,
            avatarUrl: profile.avatarUrl !== undefined ? profile.avatarUrl : userProfile?.avatarUrl
          })
        });
        await fetchBackendData(userToken, backendUrl);
      } catch (err) {
        console.warn('Failed to sync profile update to backend', err);
      }
    }
  };

  const updateQuestValue = (targetType: 'water' | 'food' | 'workout' | 'weight', change: number, isAbsolute = false) => {
    setQuests(prev => {
      const updated = prev.map(q => {
        if (q.targetType === targetType) {
          const newValue = isAbsolute ? change : Math.max(0, q.currentValue + change);
          const isCompleted = newValue >= q.targetValue;
          return {
            ...q,
            currentValue: newValue,
            isCompleted
          };
        }
        return q;
      });
      saveToStorage('bf_quests', updated);
      return updated;
    });
  };

  const addFoodLog = async (mealType: FoodLog['mealType'], name: string, weightG: number, cal: number, p: number, c: number, f: number, date?: string) => {
    const tempId = Math.random().toString(36).substring(7);
    const targetDate = date || getLocalDateString();

    const newLog: FoodLog = {
      id: tempId,
      mealType,
      foodName: name,
      servingSizeG: weightG,
      calories: cal,
      protein: p,
      carbs: c,
      fat: f,
      loggedDate: targetDate,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Instant local state update
    setFoodLogs(prev => {
      const updated = [newLog, ...prev];
      saveToStorage('bf_foods', updated);
      return updated;
    });

    const isToday = targetDate === getLocalDateString();
    if (isToday) {
      updateQuestValue('food', 1);
    }

    const updatedFoodsList = [newLog, ...foodLogs];
    checkNutritionAlerts(updatedFoodsList, waterLogs, updatedFoodsList, waterLogs);
    addXp(15);

    // Non-blocking background sync
    if (userToken) {
      (async () => {
        try {
          const res = await fetch(`${backendUrl}/v1/logs/food`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
              mealType,
              foodName: name,
              servingSizeG: weightG,
              calories: cal,
              protein: p,
              carbs: c,
              fat: f,
              loggedDate: targetDate
            })
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData.success && resData.logId) {
              setFoodLogs(prev => prev.map(l => l.id === tempId ? { ...l, id: resData.logId } : l));
            }
          }
        } catch (err) {
          console.warn('Failed to sync food log to backend:', err);
        }
      })();
    }
  };

  const deleteFoodLog = async (id: string) => {
    const updatedFoods = foodLogs.filter(log => log.id !== id);
    checkNutritionAlerts(foodLogs, waterLogs, updatedFoods, waterLogs);

    setFoodLogs(prev => {
      const updated = prev.filter(log => log.id !== id);
      saveToStorage('bf_foods', updated);
      return updated;
    });
    updateQuestValue('food', -1);

    if (userToken) {
      try {
        await fetch(`${backendUrl}/v1/logs/food/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
      } catch (err) {
        console.warn('Failed to sync food log delete to backend', err);
      }
    }
  };

  const addWaterLog = async (amountMl: number, date?: string) => {
    const tempId = Math.random().toString(36).substring(7);
    const targetDate = date || getLocalDateString();

    const newLog: WaterLog = {
      id: tempId,
      amountMl,
      loggedDate: targetDate,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Instant local state update
    setWaterLogs(prev => {
      const updated = [newLog, ...prev];
      saveToStorage('bf_water', updated);
      return updated;
    });

    const isToday = targetDate === getLocalDateString();
    if (isToday) {
      updateQuestValue('water', amountMl);
    }

    checkNutritionAlerts(foodLogs, [newLog, ...waterLogs], foodLogs, [newLog, ...waterLogs]);
    addXp(5);

    // Non-blocking background sync
    if (userToken) {
      (async () => {
        try {
          const res = await fetch(`${backendUrl}/v1/logs/water`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
              amountMl,
              loggedDate: targetDate
            })
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData.success && resData.logId) {
              setWaterLogs(prev => prev.map(l => l.id === tempId ? { ...l, id: resData.logId } : l));
            }
          }
        } catch (err) {
          console.warn('Failed to sync water log to backend:', err);
        }
      })();
    }
  };

  const deleteWaterLog = async (id: string) => {
    const updatedWater = waterLogs.filter(log => log.id !== id);
    checkNutritionAlerts(foodLogs, waterLogs, foodLogs, updatedWater);

    const logToDelete = waterLogs.find(log => log.id === id);
    if (logToDelete) {
      updateQuestValue('water', -logToDelete.amountMl);
    }
    setWaterLogs(prev => {
      const updated = prev.filter(log => log.id !== id);
      saveToStorage('bf_water', updated);
      return updated;
    });

    if (userToken) {
      try {
        await fetch(`${backendUrl}/v1/logs/water/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
      } catch (err) {
        console.warn('Failed to sync water log delete to backend', err);
      }
    }
  };

  const sendChatMessage = async (msg: string) => {
    setIsAiTyping(true);
    try {
      const newMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'user',
        message: msg,
        sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updated = [...chatLogs, newMsg];
      setChatLogs(updated);
      saveToStorage('bf_chats', updated);

      setChatSessions(prevSessions => {
        const activeId = currentSessionId || (prevSessions.length > 0 ? prevSessions[0].id : null);
        if (!activeId) return prevSessions;

        const updatedSessions = prevSessions.map(s => {
          if (s.id === activeId) {
            const isDefaultTitle = s.title.includes('Cuộc trò chuyện mới') || s.title.includes('Trò chuyện mặc định');
            const newTitle = isDefaultTitle ? (msg.length > 25 ? msg.substring(0, 25) + '...' : msg) : s.title;
            return {
              ...s,
              title: newTitle,
              messages: updated
            };
          }
          return s;
        });
        saveToStorage('bf_chat_sessions', updatedSessions);
        return updatedSessions;
      });

      addXp(2);

      const safeGetLocalDateString = (loggedDate?: string, loggedAt?: string): string => {
        if (loggedDate) return loggedDate;
        if (!loggedAt) return getLocalDateString();
        const d = new Date(loggedAt);
        if (isNaN(d.getTime())) return getLocalDateString();
        return getLocalDateString(d);
      };

      const safeFormatTime = (loggedAt?: string): string => {
        if (!loggedAt) return '00:00';
        const d = new Date(loggedAt);
        if (isNaN(d.getTime())) return '00:00';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };

      const activeFoods = foodLogs.filter(f => safeGetLocalDateString(f.loggedDate, f.loggedAt) === activeDateStr);
      const activeWaters = waterLogs.filter(w => safeGetLocalDateString(w.loggedDate, w.loggedAt) === activeDateStr);
      const totalCal = activeFoods.reduce((sum, item) => sum + item.calories, 0);
      const totalWater = activeWaters.reduce((sum, item) => sum + item.amountMl, 0);
      const calGoal = userProfile?.targetCalories ?? 2000;
      const waterGoal = userProfile?.targetWaterMl ?? 2000;

      const userBioText = userProfile ? `
Thông tin hiện tại của người dùng:
- Tên: ${userProfile.firstName} ${userProfile.lastName}
- Tuổi: ${userProfile.age}
- Giới tính: ${userProfile.gender === 'male' ? 'Nam' : userProfile.gender === 'female' ? 'Nữ' : 'Khác'}
- Chiều cao: ${userProfile.heightCm}cm, Cân nặng: ${userProfile.weightKg}kg
- Mức độ vận động: ${userProfile.activityLevel}
- Mục tiêu sức khỏe: ${userProfile.targetGoal}
- Mục tiêu calo hàng ngày: ${calGoal} kcal (Hôm nay đã nạp: ${totalCal} kcal)
- Mục tiêu nước uống: ${waterGoal} ml (Hôm nay đã uống: ${totalWater} ml)
` : 'Người dùng chưa thiết lập hồ sơ.';

      const foodSummary = activeFoods.length > 0 
        ? activeFoods.map(f => `- [Bữa ${f.mealType === 'breakfast' ? 'Sáng' : f.mealType === 'lunch' ? 'Trưa' : f.mealType === 'dinner' ? 'Tối' : 'Phụ'}] ${f.foodName}: ${f.calories} kcal (Đạm: ${f.protein || 0}g, Carbs: ${f.carbs || 0}g, Chất béo: ${f.fat || 0}g, Khối lượng: ${f.servingSizeG || 0}g)`).join('\n')
        : 'Người dùng chưa ghi nhận món ăn nào hôm nay.';

      const waterSummary = activeWaters.length > 0
        ? activeWaters.map(w => `- Uống cốc nước: ${w.amountMl}ml vào lúc ${safeFormatTime(w.loggedAt)}`).join('\n')
        : 'Người dùng chưa ghi nhận lượng nước uống nào hôm nay.';

      const sortedWeights = [...weightLogs].sort((a, b) => (b.loggedDate || '').localeCompare(a.loggedDate || '')).slice(0, 3);
      const weightSummary = sortedWeights.length > 0
        ? sortedWeights.map(w => `- Ngày ${w.loggedDate}: ${w.weightKg} kg`).join('\n')
        : 'Người dùng chưa ghi dữ liệu cân nặng gần đây.';

      const todayWorkouts = workoutSchedules.filter(w => w.scheduledDate === activeDateStr);
      const workoutSummary = todayWorkouts.length > 0
        ? todayWorkouts.map(w => `- Bài tập: ${w.program?.title || 'Bài tập thể lực'} (${w.isCompleted ? 'Đã hoàn thành ✅' : 'Chưa hoàn thành ⏳'})`).join('\n')
        : 'Không có lịch tập luyện nào được xếp hôm nay.';

      const todayDecl = dailyDeclarations[activeDateStr];
      const declarationSummary = todayDecl 
        ? `- Khai báo hoạt động: ${todayDecl.activity}\n- Số bước chân: ${todayDecl.steps || 0} bước\n- Calo vận động tiêu thụ: ${todayDecl.activeCalories || 0} kcal\n- Thời gian hoạt động: ${todayDecl.activeTime || 0} phút.`
        : 'Người dùng chưa khai báo hoạt động thể chất nào hôm nay.';

      const journalContext = `
Dữ liệu nhật ký & hoạt động hôm nay (${activeDateStr}) của người dùng:
1. Nhật ký ăn uống hôm nay:
${foodSummary}

2. Nhật ký nước uống hôm nay:
${waterSummary}

3. Lịch tập luyện hôm nay:
${workoutSummary}

4. Hoạt động & Khai báo hôm nay:
${declarationSummary}

5. Lịch sử cân nặng gần đây:
${weightSummary}
`;

      const systemInstruction = `Bạn là Coach Fit, một huấn luyện viên dinh dưỡng và thể hình cá nhân chuyên nghiệp, nhiệt tình, tận tâm và khoa học. Hãy trả lời ngắn gọn trong vòng 3-4 câu bằng tiếng Việt. Hãy dựa vào thông tin cá nhân và dữ liệu nhật ký hoạt động, dinh dưỡng của người dùng để tư vấn, đưa ra lời khuyên hoặc động viên phù hợp nhất. 

${userBioText}

${journalContext}

Lưu ý quan trọng: 
- Khi người dùng hỏi về hoạt động, những gì họ ăn, uống, hay cân nặng của họ, hoặc bất kì thứ gì họ đã khai báo/ghi nhận trên ứng dụng, hãy đọc dữ liệu nhật ký trên để trả lời chính xác, chi tiết và cá nhân hóa cho họ.
- Bạn hoàn toàn có thể đọc được tất cả dữ liệu nhật ký này! Không bao giờ nói rằng bạn không thể đọc trực tiếp hoạt động của họ.`;

      const addCoachReply = (text: string) => {
        const coachMsg: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          sender: 'coach',
          message: text.trim(),
          sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatLogs(prev => {
          const final = [...prev, coachMsg];
          saveToStorage('bf_chats', final);

          setChatSessions(prevSessions => {
            const activeId = currentSessionId || (prevSessions.length > 0 ? prevSessions[0].id : null);
            if (!activeId) return prevSessions;

            const updatedSessions = prevSessions.map(s => {
              if (s.id === activeId) {
                return {
                  ...s,
                  messages: final
                };
              }
              return s;
            });
            saveToStorage('bf_chat_sessions', updatedSessions);
            return updatedSessions;
          });

          return final;
        });
      };

      const tryProvider = async (provider: 'openrouter' | 'gemini' | 'groq' | 'backend'): Promise<boolean> => {
        // 1. OpenRouter (openai/gpt-oss-120b:free)
        if (provider === 'openrouter') {
          if (openRouterApiKey && openRouterApiKey.trim() !== '') {
            try {
              const chatHistory = chatLogs.map(log => ({
                role: log.sender === 'user' ? 'user' : 'assistant',
                content: log.message
              }));

              const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${openRouterApiKey.trim()}`,
                  'HTTP-Referer': 'https://bodyfit-ai.com',
                  'X-Title': 'BodyFit'
                },
                body: JSON.stringify({
                  model: 'openai/gpt-4o-mini',
                  messages: [
                    { role: 'system', content: systemInstruction },
                    ...chatHistory,
                    { role: 'user', content: msg }
                  ]
                })
              });

              if (response.ok) {
                const data = await response.json();
                const replyText = data.choices?.[0]?.message?.content || 'AI không đưa ra phản hồi nào.';
                addCoachReply(replyText);
                return true;
              } else {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Lỗi phản hồi OpenRouter: ${response.status}`);
              }
            } catch (e: any) {
              console.warn('OpenRouter chat error, falling back to gemini:', e.message);
            }
          }
          setChatModelProvider('gemini');
          return tryProvider('gemini');
        }

        // 2. Gemini (gemini-2.5-flash)
        if (provider === 'gemini') {
          if (geminiApiKey && geminiApiKey.trim() !== '') {
            try {
              const geminiHistory = chatLogs.map(log => ({
                role: log.sender === 'user' ? 'user' : 'model',
                parts: [{ text: log.message }]
              }));

              let response: Response | null = null;
              let retries = 2;
              let model = 'gemini-2.5-flash';
              let lastErrorMsg = 'Lỗi kết nối Gemini API';

              while (retries >= 0) {
                try {
                  response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey.trim()}`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      contents: [
                        ...geminiHistory,
                        { role: 'user', parts: [{ text: msg }] }
                      ],
                      systemInstruction: {
                        parts: [{ text: systemInstruction }]
                      }
                    })
                  });

                  if (response.ok) break;

                  const errData = await response.json().catch(() => ({}));
                  lastErrorMsg = errData.error?.message || `Lỗi ${response.status}`;
                } catch (fetchErr: any) {
                  lastErrorMsg = fetchErr.message || 'Lỗi kết nối mạng';
                }
                retries--;
                if (retries === 1) model = 'gemini-2.0-flash';
                else if (retries === 0) model = 'gemini-1.5-flash';
                await new Promise(r => setTimeout(r, 500));
              }

              if (response && response.ok) {
                const data = await response.json();
                const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'AI không đưa ra phản hồi nào.';
                addCoachReply(replyText);
                return true;
              } else {
                console.warn('Gemini chat error, falling back to groq:', lastErrorMsg);
              }
            } catch (e: any) {
              console.warn('Gemini chat error, falling back to groq:', e.message);
            }
          }
          setChatModelProvider('groq');
          return tryProvider('groq');
        }

        // 3. Groq (llama-3.3-70b-versatile)
        if (provider === 'groq') {
          if (groqApiKey && groqApiKey.trim() !== '') {
            try {
              const chatHistory = chatLogs.map(log => ({
                role: log.sender === 'user' ? 'user' : 'assistant',
                content: log.message
              }));

              const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${groqApiKey.trim()}`
                },
                body: JSON.stringify({
                  model: 'llama-3.3-70b-versatile',
                  messages: [
                    { role: 'system', content: systemInstruction },
                    ...chatHistory,
                    { role: 'user', content: msg }
                  ]
                })
              });

              if (response.ok) {
                const data = await response.json();
                const replyText = data.choices?.[0]?.message?.content || 'AI không đưa ra phản hồi nào.';
                addCoachReply(replyText);
                return true;
              } else {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Lỗi phản hồi Groq: ${response.status}`);
              }
            } catch (e: any) {
              console.warn('Groq chat error, falling back to backend:', e.message);
            }
          }
          setChatModelProvider('backend');
          return tryProvider('backend');
        }

        // 4. Backend
        if (provider === 'backend') {
          try {
            const headers: Record<string, string> = {
              'Content-Type': 'application/json'
            };
            if (userToken) {
              headers['Authorization'] = `Bearer ${userToken}`;
            }
            const response = await fetch(`${backendUrl}/v1/ai/coach/chat`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ message: msg, systemInstruction })
            });
            if (response.ok) {
              const data = await response.json();
              addCoachReply(data.reply || 'AI không đưa ra phản hồi nào.');
              return true;
            } else {
              const errData = await response.json().catch(() => ({}));
              throw new Error(errData.message || `Lỗi phản hồi Backend: ${response.status}`);
            }
          } catch (err: any) {
            console.warn('Backend chat failed:', err.message);
            addCoachReply('Chào bạn! Hiện tại các dịch vụ kết nối AI đang quá tải hoặc gặp sự cố đường truyền. Bạn vui lòng kiểm tra kết nối mạng và thử lại sau nhé! HLV luôn sẵn sàng hỗ trợ bạn.');
            return false;
          }
        }
        return false;
      };

      await tryProvider(chatModelProvider);
    } finally {
      setIsAiTyping(false);
    }
  };

  const generateAiRecipe = async (ingredients: string): Promise<Recipe> => {
    if (openRouterApiKey && openRouterApiKey.trim() !== '') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterApiKey.trim()}`,
            'HTTP-Referer': 'https://bodyfit-ai.com',
            'X-Title': 'BodyFit'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: `Hãy thiết kế một công thức món ăn lành mạnh cho người tập gym, giảm cân hoặc cải thiện sức khỏe dựa trên các nguyên liệu sau: "${ingredients}".
                Trả về kết quả dưới định dạng JSON với cấu trúc chính xác như sau (không bao gồm markdown hay chữ giải thích, chỉ trả về chuỗi JSON thô):
                {
                  "title": "Tên món ăn (tiếng Việt)",
                  "category": "High Protein" hoặc "Keto" hoặc "Clean Eating" hoặc "Lành mạnh",
                  "prepTime": "Thời gian chuẩn bị (ví dụ: '15 mins' hoặc '20 phút')",
                  "calories": số calo (number),
                  "protein": số đạm (number),
                  "carbs": số tinh bột (number),
                  "fat": số chất béo (number),
                  "ingredients": ["danh sách chuỗi nguyên liệu"],
                  "instructions": ["danh sách các bước thực hiện bằng tiếng Việt"]
                }`
              }
            ],
            response_format: {
              type: 'json_object'
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.choices?.[0]?.message?.content;
          if (jsonText) {
            const parsed = JSON.parse(jsonText.trim());
            const newRecipe: Recipe = {
              id: Math.random().toString(36).substring(7),
              title: parsed.title || 'Món ăn lành mạnh từ AI',
              category: parsed.category || 'AI Generated',
              prepTime: parsed.prepTime || '15 mins',
              image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
              calories: Number(parsed.calories) || 350,
              protein: Number(parsed.protein) || 25,
              carbs: Number(parsed.carbs) || 35,
              fat: Number(parsed.fat) || 12,
              ingredients: parsed.ingredients || [],
              instructions: parsed.instructions || [],
              isAiGenerated: true
            };

            setRecipes(prev => {
              const updated = [newRecipe, ...prev];
              saveToStorage('bf_recipes', updated);
              return updated;
            });
            addXp(25);
            return newRecipe;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Lỗi phản hồi OpenRouter: ${response.status}`);
        }
      } catch (e) {
        console.error('Failed to generate real OpenRouter recipe, trying Gemini:', e);
      }
    }

    if (geminiApiKey && geminiApiKey.trim() !== '') {
      try {
        let response: Response | null = null;
        let retries = 2;
        let model = 'gemini-2.5-flash';
        let lastErrorMsg = 'Lỗi kết nối Gemini API';

        while (retries >= 0) {
          try {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey.trim()}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [{
                    text: `Hãy thiết kế một công thức món ăn lành mạnh cho người tập gym, giảm cân hoặc cải thiện sức khỏe dựa trên các nguyên liệu sau: "${ingredients}".
                    Trả về kết quả dưới định dạng JSON với cấu trúc chính xác như sau (không bao gồm markdown hay chữ giải thích, chỉ trả về chuỗi JSON thô):
                    {
                      "title": "Tên món ăn (tiếng Việt)",
                      "category": "High Protein" hoặc "Keto" hoặc "Clean Eating" hoặc "Lành mạnh",
                      "prepTime": "Thời gian chuẩn bị (ví dụ: '15 mins' hoặc '20 phút')",
                      "calories": số calo (number),
                      "protein": số đạm (number),
                      "carbs": số tinh bột (number),
                      "fat": số chất béo (number),
                      "ingredients": ["danh sách chuỗi nguyên liệu"],
                      "instructions": ["danh sách các bước thực hiện bằng tiếng Việt"]
                    }`
                  }]
                }],
                generationConfig: {
                  responseMimeType: "application/json"
                }
              })
            });

            if (response.ok) {
              break;
            }

            const errData = await response.json();
            lastErrorMsg = errData.error?.message || 'Lỗi kết nối Gemini API';

            if (!response.ok && model === 'gemini-2.5-flash' && retries > 0) {
              console.warn(`Model ${model} failed with status ${response.status}, switching to gemini-2.5-flash-lite and retrying...`);
              model = 'gemini-2.5-flash-lite';
            }
          } catch (fetchErr: any) {
            lastErrorMsg = fetchErr.message || 'Lỗi kết nối mạng';
          }
          retries--;
          if (retries >= 0) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }

        if (response && response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = JSON.parse(jsonText.trim());
          const newRecipe: Recipe = {
            id: Math.random().toString(36).substring(7),
            title: parsed.title || 'Món ăn lành mạnh từ AI',
            category: parsed.category || 'AI Generated',
            prepTime: parsed.prepTime || '15 mins',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
            calories: Number(parsed.calories) || 350,
            protein: Number(parsed.protein) || 25,
            carbs: Number(parsed.carbs) || 35,
            fat: Number(parsed.fat) || 12,
            ingredients: parsed.ingredients || [],
            instructions: parsed.instructions || [],
            isAiGenerated: true
          };

          setRecipes(prev => {
            const updated = [newRecipe, ...prev];
            saveToStorage('bf_recipes', updated);
            return updated;
          });
          addXp(25);
          return newRecipe;
        }
      } catch (e) {
        console.error('Failed to generate real AI recipe, falling back to mock:', e);
      }
    }

    // Return a dynamically simulated AI recipe
    return new Promise((resolve) => {
      setTimeout(() => {
        const words = ingredients.toLowerCase();
        let title = 'AI Salad Trứng Ức Gà Sốt Bơ';
        let macros = { calories: 360, protein: 35, carbs: 8, fat: 18 };
        let ingList = ['150g ức gà fillet luộc', '2 quả trứng luộc cắt đôi', '100g rau xà lách', '1 quả cà chua lớn', '1/2 quả bơ sáp cắt miếng', '1 muỗng sốt mè rang mỏng'];
        let instList = ['Thái ức gà fillet thành lát mỏng vừa ăn.', 'Luộc trứng chín lòng đào hoặc chín hoàn toàn tùy sở thích, sau đó bổ đôi.', 'Rửa sạch rau xà lách, cà chua thái múi cau.', 'Xếp xà lách, cà chua, bơ và trứng vào tô.', 'Cho gà lên trên cùng, rưới sốt mè rang mỏng lên và trộn đều trước khi dùng.'];

        if (words.includes('thịt bò') || words.includes('bò') || words.includes('beef')) {
          title = 'AI Bò Lúc Lắc Áp Chảo Rau Củ';
          macros = { calories: 420, protein: 38, carbs: 12, fat: 22 };
          ingList = ['150g thăn bò thái khối vuông', '1/2 củ hành tây', '1/2 quả ớt chuông xanh', '1 muỗng cà phê dầu ô liu', 'Gia vị tỏi băm, tiêu, nước tương'];
          instList = ['Ướp thăn bò với nước tương, tỏi băm và hạt tiêu trong 15 phút.', 'Thái lát ớt chuông, hành tây thành miếng vuông vừa ăn.', 'Làm nóng chảo với dầu ô liu, cho tỏi băm vào phi thơm rồi áp chảo thịt bò lửa lớn.', 'Thêm hành tây, ớt chuông vào xào nhanh tay trong 3 phút rồi tắt bếp thưởng thức.'];
        }

        const newRecipe: Recipe = {
          id: Math.random().toString(36).substring(7),
          title,
          category: 'AI Generated Chef',
          prepTime: '12 mins',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
          ...macros,
          ingredients: ingList,
          instructions: instList,
          isAiGenerated: true
        };

        setRecipes(prev => {
          const updated = [newRecipe, ...prev];
          saveToStorage('bf_recipes', updated);
          return updated;
        });
        addXp(25);
        resolve(newRecipe);
      }, 2000);
    });
  };

  const addShoppingItem = (name: string, amount: string) => {
    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substring(7),
      name,
      amount,
      checked: false
    };
    const updated = [...shoppingList, newItem];
    setShoppingList(updated);
    saveToStorage('bf_shopping', updated);
  };

  const toggleShoppingItem = (id: string) => {
    const updated = shoppingList.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setShoppingList(updated);
    saveToStorage('bf_shopping', updated);
  };

  const clearShoppingList = () => {
    setShoppingList([]);
    saveToStorage('bf_shopping', []);
  };

  const triggerMockScanFood = async (imageBase64?: string) => {
    let lastOpenRouterError = '';
    let lastGroqError = '';
    let lastGeminiError = '';
    let lastBackendError = '';

    const foodPrompt = `Hãy đóng vai là chuyên gia dinh dưỡng AI. Nhiệm vụ của bạn là phân tích ảnh chụp món ăn, đồ uống hoặc bao bì sản phẩm thực phẩm được cung cấp.

QUY TẮC PHÂN TÍCH QUAN TRỌNG:
1. NẾU ẢNH LÀ BAO BÌ SẢN PHẨM HOẶC BẢNG THÀNH PHẦN DINH DƯỠNG (Nutrition Facts):
   - Đọc kỹ Bảng thành phần dinh dưỡng trên nhãn chai/bao bì (ví dụ: Năng lượng/Energy, Carbohydrate, Chất đạm/Protein, Chất béo/Fat, Đường/Sugar, thể tích/khối lượng tổng).
   - Xác định rõ giá trị ghi trên nhãn là tính trên "100ml", "100g" hay "mỗi khẩu phần (per serving)".
   - Xác định tổng thể tích hoặc khối lượng của sản phẩm (Ví dụ: chai nước C2 là 500ml, gói bánh là 150g).
   - Thực hiện tính toán chính xác tuyệt đối cho cả sản phẩm:
     Tổng giá trị = (Giá trị dinh dưỡng trên 100ml hoặc 100g) * (Tổng thể tích hoặc khối lượng / 100).
     Ví dụ: Nếu nhãn ghi Năng lượng là 22 kcal/100ml, chai nước có thể tích 500ml -> Tổng calo = 22 * (500/100) = 110 kcal.
     Nếu nhãn ghi Carb là 5.4g/100ml, chai 500ml -> Tổng Carb = 5.4 * 5 = 27g.
     Hãy ưu tiên hàng đầu các con số đọc được trên nhãn thực tế này thay vì ước lượng cảm tính!

2. NẾU ẢNH LÀ MÓN ĂN CHẾ BIẾN (không có nhãn dinh dưỡng):
   - Ước tính các thành phần chính trong món ăn đó kèm theo khối lượng ước lượng tính bằng gram (weightG) và lượng calo, protein, carbs, fat của từng thành phần dựa trên kích thước đĩa thức ăn.
   - Tính tổng năng lượng và các chất đa lượng cho toàn bộ món ăn.

Trả về kết quả dưới định dạng JSON với cấu trúc chính xác như sau (chỉ trả về chuỗi JSON thô, không chứa định dạng markdown):
{
  "mealDetected": "Tên món ăn hoặc sản phẩm (Ví dụ: Trà C2 Freeze Dưa Gang Bạc Hà 500ml)",
  "items": [
    { "name": "Thành phần hoặc Tên sản phẩm chính", "weightG": 500, "calories": 110, "protein": 0, "carbs": 27, "fat": 0 }
  ],
  "calories": 110,
  "protein": 0,
  "carbs": 27,
  "fat": 0
}`;

    if (imageBase64) {
      // 0. Try OpenRouter Vision if Api Key is present
      if (openRouterApiKey && openRouterApiKey.trim() !== '') {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openRouterApiKey.trim()}`,
              'HTTP-Referer': 'https://bodyfit-ai.com',
              'X-Title': 'BodyFit'
            },
            body: JSON.stringify({
              model: 'openai/gpt-4o-mini',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: foodPrompt
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:image/jpeg;base64,${imageBase64}`
                      }
                    }
                  ]
                }
              ],
              response_format: {
                type: 'json_object'
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const textResponse = data.choices?.[0]?.message?.content;
            if (textResponse) {
              const parsed = JSON.parse(textResponse.trim());
              return parsed;
            }
            throw new Error('Không nhận được dữ liệu phân tích từ OpenRouter.');
          } else {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Lỗi phản hồi OpenRouter: ${response.status}`;
            if (response.status === 429 || errMsg.toLowerCase().includes('limit') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('credit') || errMsg.toLowerCase().includes('insufficient')) {
              throw new Error('Hạn ngạch OpenRouter của bạn đã hết hạn (tối đa 50 lượt/ngày hoặc 20 lượt/phút). Hạn ngạch ngày sẽ tự động hồi lại vào lúc 7:00 sáng mai (giờ Việt Nam).');
            }
            throw new Error(errMsg);
          }
        } catch (err: any) {
          lastOpenRouterError = err.message || '';
          console.warn('OpenRouter Vision call failed:', err);
          if (err.message && (err.message.includes('Hạn ngạch') || err.message.includes('429') || err.message.includes('limit') || err.message.includes('quota'))) {
            if (Platform.OS === 'web') {
              alert('Hạn ngạch OpenRouter của bạn đã hết hạn (tối đa 50 lượt/ngày hoặc 20 lượt/phút). Hạn ngạch ngày sẽ tự động hồi lại vào lúc 7:00 sáng mai (giờ Việt Nam). Ứng dụng sẽ tự động chuyển sang mô hình dự phòng (Gemini/Backend/Giả lập).');
            } else {
              Alert.alert(
                'Thông báo hạn ngạch OpenRouter',
                'Hạn ngạch OpenRouter miễn phí của bạn đã hết hạn (tối đa 50 lượt/ngày hoặc 20 lượt/phút).\n\nHạn ngạch ngày sẽ tự động hồi lại vào lúc 7:00 sáng mai (giờ Việt Nam).\n\nỨng dụng sẽ tự động chuyển sang mô hình dự phòng (Groq/Gemini/Backend) để tiếp tục quét ảnh món ăn.'
              );
            }
          }
        }
      }

      // 1. Try Groq Vision if Api Key is present
      if (groqApiKey && groqApiKey.trim() !== '') {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqApiKey.trim()}`
            },
            body: JSON.stringify({
              model: 'meta-llama/llama-4-scout-17b-16e-instruct',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: foodPrompt
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:image/jpeg;base64,${imageBase64}`
                      }
                    }
                  ]
                }
              ],
              response_format: {
                type: 'json_object'
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const textResponse = data.choices?.[0]?.message?.content;
            if (textResponse) {
              const parsed = JSON.parse(textResponse);
              return parsed;
            }
            throw new Error('Không nhận được dữ liệu phân tích từ Groq.');
          } else {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Lỗi phản hồi Groq: ${response.status}`);
          }
        } catch (err: any) {
          lastGroqError = err.message || '';
          console.warn('Groq Vision call failed:', err);
        }
      }

      // 2. Try Gemini Vision if Api Key is present
      if (geminiApiKey && geminiApiKey.trim() !== '') {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey.trim()}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: imageBase64
                    }
                  },
                  {
                    text: foodPrompt
                  }
                ]
              }],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const parsed = JSON.parse(textResponse);
              return parsed;
            }
            throw new Error('Không nhận được dữ liệu phân tích từ Gemini.');
          } else {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Lỗi phản hồi Gemini: ${response.status}`);
          }
        } catch (err: any) {
          lastGeminiError = err.message || '';
          console.warn('Gemini Vision direct call failed:', err);
        }
      }

      // 3. Try NestJS Backend
      if (userToken) {
        try {
          const response = await fetch(`${backendUrl}/v1/ai/scan-food`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ imageBase64 })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.mealDetected && (data.mealDetected.includes('Simulated') || data.mealDetected.includes('giả lập'))) {
              throw new Error('Máy chủ Backend đang chạy ở chế độ giả lập (Chưa cấu hình OPENAI_API_KEY).');
            }
            return {
              mealDetected: data.mealDetected,
              items: data.items,
              calories: data.totalCalories ?? data.calories,
              protein: data.macros?.protein ?? data.protein,
              carbs: data.macros?.carbs ?? data.carbs,
              fat: data.macros?.fat ?? data.fat
            };
          } else {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Lỗi NestJS Backend: ${response.status}`);
          }
        } catch (err: any) {
          lastBackendError = err.message || '';
          console.warn('NestJS backend food scan failed:', err);
        }
      }

      const errorMsg = [
        'Không thể thực hiện phân tích bằng AI thực tế:',
        openRouterApiKey ? `- OpenRouter API: ${lastOpenRouterError}` : '- Chưa cấu hình OpenRouter API Key',
        groqApiKey ? `- Groq API: ${lastGroqError}` : '- Chưa cấu hình Groq API Key',
        geminiApiKey ? `- Gemini API: ${lastGeminiError}` : '- Chưa cấu hình Gemini API Key',
        userToken ? `- Backend API: ${lastBackendError}` : '- Không có kết nối tới Backend'
      ].filter(Boolean).join('\n');
      throw new Error(errorMsg);
    }

    throw new Error('Không nhận được hình ảnh để phân tích. Vui lòng chụp ảnh từ thiết bị di động.');
  };

  const triggerVoiceLogging = async (text: string): Promise<FoodLog[]> => {
    if (geminiApiKey && geminiApiKey.trim() !== '') {
      try {
        let response: Response | null = null;
        let retries = 2;
        let model = 'gemini-2.5-flash';
        let lastErrorMsg = 'Lỗi kết nối Gemini API';

        while (retries >= 0) {
          try {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey.trim()}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [{
                    text: `Phân tích câu nói ghi nhận thức ăn sau đây của người dùng: "${text}"
                    Trích xuất ra các món ăn họ đã nạp vào cơ thể, kèm theo ước tính khối lượng (g), calo (kcal), lượng đạm (g), carb (g), béo (g) và xác định thuộc loại bữa ăn nào ("breakfast", "lunch", "dinner", hoặc "snack").
                    Trả về kết quả dưới định dạng JSON với cấu trúc chính xác như sau (chỉ trả về chuỗi JSON thô, không định dạng markdown):
                    {
                      "parsedLogs": [
                        {
                          "foodName": "Tên món ăn (tiếng Việt)",
                          "servingSizeG": khối lượng tính bằng gram (number),
                          "calories": số calo (number),
                          "protein": số đạm (number),
                          "carbs": số tinh bột (number),
                          "fat": số chất béo (number),
                          "mealType": "breakfast" hoặc "lunch" hoặc "dinner" hoặc "snack"
                        }
                      ]
                    }`
                  }]
                }],
                generationConfig: {
                  responseMimeType: "application/json"
                }
              })
            });

            if (response.ok) {
              break;
            }

            const errData = await response.json();
            lastErrorMsg = errData.error?.message || 'Lỗi kết nối Gemini API';

            if (!response.ok && model === 'gemini-2.5-flash' && retries > 0) {
              console.warn(`Model ${model} failed with status ${response.status}, switching to gemini-2.5-flash-lite and retrying...`);
              model = 'gemini-2.5-flash-lite';
            }
          } catch (fetchErr: any) {
            lastErrorMsg = fetchErr.message || 'Lỗi kết nối mạng';
          }
          retries--;
          if (retries >= 0) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }

        if (response && response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = JSON.parse(jsonText.trim());
          const finalLogs = (parsed.parsedLogs || []).map((log: any) => ({
            id: Math.random().toString(36).substring(7),
            mealType: log.mealType || 'snack',
            foodName: log.foodName + ' (AI Phân tích)',
            servingSizeG: Number(log.servingSizeG) || 150,
            calories: Number(log.calories) || 200,
            protein: Number(log.protein) || 10,
            carbs: Number(log.carbs) || 20,
            fat: Number(log.fat) || 5,
            loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));

          setFoodLogs(prev => {
            const updated = [...finalLogs, ...prev];
            saveToStorage('bf_foods', updated);
            return updated;
          });
          checkNutritionAlerts(foodLogs, waterLogs, [...finalLogs, ...foodLogs], waterLogs);
          addXp(15 * finalLogs.length);
          return finalLogs;
        }
      } catch (e) {
        console.error('Failed to parse real voice log, falling back to mock:', e);
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const query = text.toLowerCase();
        const detectedLogs: Omit<FoodLog, 'id' | 'loggedAt'>[] = [];

        if (query.includes('phở') || query.includes('pho')) {
          detectedLogs.push({
            mealType: 'lunch',
            foodName: 'Phở Bò (AI Voice)',
            servingSizeG: 450,
            calories: 550,
            protein: 30,
            carbs: 72,
            fat: 15
          });
        }
        if (query.includes('cơm tấm') || query.includes('com tam')) {
          detectedLogs.push({
            mealType: 'lunch',
            foodName: 'Cơm Tấm Sườn Nướng (AI Voice)',
            servingSizeG: 370,
            calories: 660,
            protein: 35,
            carbs: 60,
            fat: 30
          });
        }
        if (query.includes('trứng') || query.includes('egg')) {
          detectedLogs.push({
            mealType: 'breakfast',
            foodName: 'Trứng Ốp La (AI Voice)',
            servingSizeG: 100,
            calories: 180,
            protein: 12,
            carbs: 1.2,
            fat: 14
          });
        }
        if (query.includes('trà đá') || query.includes('tra da') || query.includes('tea')) {
          detectedLogs.push({
            mealType: 'snack',
            foodName: 'Trà đá chanh (AI Voice)',
            servingSizeG: 250,
            calories: 45,
            protein: 0,
            carbs: 11,
            fat: 0
          });
        }
        if (query.includes('ức gà') || query.includes('chicken')) {
          detectedLogs.push({
            mealType: 'dinner',
            foodName: 'Ức gà áp chảo (AI Voice)',
            servingSizeG: 150,
            calories: 240,
            protein: 42,
            carbs: 0,
            fat: 6
          });
        }

        // Fallback if nothing specific matched
        if (detectedLogs.length === 0) {
          detectedLogs.push({
            mealType: 'snack',
            foodName: `Món ăn ngẫu nhiên: "${text}"`,
            servingSizeG: 150,
            calories: 180,
            protein: 10,
            carbs: 25,
            fat: 5
          });
        }

        const finalLogs = detectedLogs.map(log => ({
          ...log,
          id: Math.random().toString(36).substring(7),
          loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        setFoodLogs(prev => {
          const updated = [...finalLogs, ...prev];
          saveToStorage('bf_foods', updated);
          return updated;
        });
        checkNutritionAlerts(foodLogs, waterLogs, [...finalLogs, ...foodLogs], waterLogs);
        addXp(15 * finalLogs.length);
        resolve(finalLogs);
      }, 2000);
    });
  };

  const addXp = (amount: number) => {
    setUserProfile(prev => {
      if (!prev) return null;
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      const xpNeeded = newLevel * 100;

      if (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        newLevel += 1;
        // Level up trigger notification could go here
      }

      const updated = { ...prev, xp: newXp, level: newLevel };
      saveToStorage('bf_profile', updated);
      return updated;
    });
  };

  const createChatSession = (title?: string) => {
    const newSession: ChatSession = {
      id: 'session_' + Math.random().toString(36).substring(7),
      title: title || 'Cuộc trò chuyện mới 💬',
      createdAt: new Date().toLocaleDateString('vi-VN'),
      messages: []
    };
    const updated = [newSession, ...chatSessions];
    setChatSessions(updated);
    saveToStorage('bf_chat_sessions', updated);

    setCurrentSessionId(newSession.id);
    saveToStorage('bf_current_session_id', newSession.id);
    setChatLogs([]);
    saveToStorage('bf_chats', []);

    return newSession.id;
  };

  const selectChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      saveToStorage('bf_current_session_id', sessionId);
      setChatLogs(session.messages);
      saveToStorage('bf_chats', session.messages);
    }
  };

  const deleteChatSession = (sessionId: string) => {
    const updated = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(updated);
    saveToStorage('bf_chat_sessions', updated);

    if (currentSessionId === sessionId) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
        saveToStorage('bf_current_session_id', updated[0].id);
        setChatLogs(updated[0].messages);
        saveToStorage('bf_chats', updated[0].messages);
      } else {
        const newSession: ChatSession = {
          id: 'session_' + Math.random().toString(36).substring(7),
          title: 'Cuộc trò chuyện mới 💬',
          createdAt: new Date().toLocaleDateString('vi-VN'),
          messages: []
        };
        const defaultSessions = [newSession];
        setChatSessions(defaultSessions);
        saveToStorage('bf_chat_sessions', defaultSessions);
        setCurrentSessionId(newSession.id);
        saveToStorage('bf_current_session_id', newSession.id);
        setChatLogs([]);
        saveToStorage('bf_chats', []);
      }
    }
  };

  const clearAllData = () => {
    setUserProfile(null);
    setFoodLogs([]);
    setWaterLogs([]);
    setChatLogs([]);
    setChatSessions([]);
    setCurrentSessionId(null);
    setRecipes(DEFAULT_RECIPES);
    setUserToken(null);
    setCurrentUser(null);
    setShoppingList([
      { id: 'shop1', name: 'Ức gà fillet', amount: '1 kg', checked: false },
      { id: 'shop2', name: 'Trứng gà ta', amount: '10 quả', checked: true },
      { id: 'shop3', name: 'Rau xà lách búp', amount: '500g', checked: false }
    ]);

    const keys = [
      'bf_profile', 'bf_foods', 'bf_water', 'bf_chats', 'bf_recipes', 'bf_shopping',
      'bf_gemini_api_key', 'bf_groq_api_key', 'bf_openrouter_api_key', 'bf_chat_model_provider',
      'bf_user_token', 'bf_current_user', 'bf_backend_url', 'bf_declarations', 'bf_weight',
      'bf_workouts', 'bf_schedules', 'bf_mealplan', 'bf_posts', 'bf_user_chals',
      'bf_user_badges', 'bf_is_premium', 'bf_is_admin', 'bf_chat_sessions', 'bf_current_session_id'
    ];

    if (Platform.OS === 'web') {
      try {
        keys.forEach(k => localStorage.removeItem(k));
      } catch (e) {
        console.warn('Failed to clear localStorage', e);
      }
    } else {
      AsyncStorage.multiRemove(keys).catch(e => {
        console.warn('Failed to clear AsyncStorage', e);
      });
    }
  };

  const addWeightLog = async (weightKg: number, waistCm?: number, chestCm?: number, hipsCm?: number, bodyFatPct?: number, photoUrl?: string, date?: string) => {
    const targetDate = date || getLocalDateString();
    const tempId = Math.random().toString(36).substring(7);

    const newLog: WeightLog = {
      id: tempId,
      weightKg,
      waistCm,
      chestCm,
      hipsCm,
      bodyFatPct,
      photoUrl,
      loggedDate: targetDate,
      loggedAt: new Date().toISOString()
    };

    // 1. INSTANT LOCAL REACT STATE UPDATE WITH DEDUPLICATION (0ms latency!)
    setWeightLogs(prev => {
      const filtered = prev.filter(l => l.loggedDate !== targetDate);
      const updated = [newLog, ...filtered];
      saveToStorage('bf_weight', updated);
      return updated;
    });
    updateQuestValue('weight', 1, true);

    if (userProfile) {
      updateProfile({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        age: userProfile.age,
        gender: userProfile.gender,
        heightCm: userProfile.heightCm,
        weightKg,
        activityLevel: userProfile.activityLevel,
        targetGoal: userProfile.targetGoal
      });
    }
    addXp(30);

    // 2. NON-BLOCKING BACKGROUND SYNC TO BACKEND
    if (userToken) {
      (async () => {
        try {
          const res = await fetch(`${backendUrl}/v1/users/weight`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
              weightKg, waistCm, chestCm, hipsCm, bodyFatPct, photoUrl, loggedDate: targetDate
            })
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData.success && resData.log) {
              setWeightLogs(prev => prev.map(l => l.id === tempId ? resData.log : l));
            }
          }
        } catch (err) {
          console.warn('Failed to sync weight log to backend:', err);
        }
      })();
    }
  };

  const scheduleWorkout = async (programId: string, date: string) => {
    let finalId = Math.random().toString(36).substring(7);
    const prog = workoutPrograms.find(p => p.id === programId) || workoutPrograms[0] || {
      id: programId,
      title: 'Bài tập thể lực',
      description: 'Luyện tập thể lực',
      category: 'HOME',
      difficulty: 'BEGINNER',
      exercises: []
    };

    const newSchedule: UserWorkoutSchedule = {
      id: finalId,
      programId,
      program: prog as any,
      scheduledDate: date,
      isCompleted: false
    };

    if (userToken) {
      try {
        const res = await fetch(`${backendUrl}/v1/workouts/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ programId, date })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.scheduleId) {
            newSchedule.id = resData.scheduleId;
          }
        }
      } catch (err) {
        console.warn('Failed to sync workout schedule to backend', err);
      }
    }

    setWorkoutSchedules(prev => {
      const updated = [...prev, newSchedule];
      saveToStorage('bf_schedules', updated);
      return updated;
    });
    addXp(10);
  };

  const toggleWorkoutCompleted = async (scheduleId: string) => {
    setWorkoutSchedules(prev => {
      const updated = prev.map(s => {
        if (s.id === scheduleId) {
          return {
            ...s,
            isCompleted: !s.isCompleted,
            completedAt: !s.isCompleted ? new Date().toISOString() : undefined
          };
        }
        return s;
      });
      saveToStorage('bf_schedules', updated);
      return updated;
    });

    const current = workoutSchedules.find(s => s.id === scheduleId);
    if (current && !current.isCompleted) {
      addXp(50);
    }

    if (userToken) {
      try {
        await fetch(`${backendUrl}/v1/workouts/schedules/${scheduleId}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
      } catch (err) {
        console.warn('Failed to sync workout completion to backend', err);
      }
    }
  };

  const logCompletedWorkout = async (title: string, exercises: any[], customProgramId?: string) => {
    const today = getLocalDateString();
    const finalId = Math.random().toString(36).substring(7);
    const progId = customProgramId || ('custom_' + finalId);

    const newSchedule: UserWorkoutSchedule = {
      id: finalId,
      programId: progId,
      program: {
        id: progId,
        title,
        description: 'Bài tập hoàn thành',
        category: 'HOME',
        difficulty: 'BEGINNER',
        exercises: exercises.map((ex, idx) => ({
          id: `ex_${idx}_${finalId}`,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps
        }))
      },
      scheduledDate: today,
      isCompleted: true,
      completedAt: new Date().toISOString()
    };

    if (userToken) {
      try {
        const res = await fetch(`${backendUrl}/v1/workouts/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            programId: progId,
            date: today,
            title,
            exercises: exercises.map(ex => ({ name: ex.name, sets: ex.sets, reps: ex.reps }))
          })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.scheduleId) {
            newSchedule.id = resData.scheduleId;
            await fetch(`${backendUrl}/v1/workouts/schedules/${resData.scheduleId}/complete`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${userToken}`
              }
            });
          }
        }
      } catch (err) {
        console.warn('Failed to sync completed workout to backend', err);
      }
    }

    setWorkoutSchedules(prev => {
      const filtered = prev.filter(s => s.programId !== progId || s.scheduledDate !== today);
      const updated = [...filtered, newSchedule];
      saveToStorage('bf_schedules', updated);
      return updated;
    });
  };

  const generateMealPlan = async (dietType: string) => {
    if (userToken) {
      try {
        const res = await fetch(`${backendUrl}/v1/mealplans/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ dietType })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.plan) {
            setActiveMealPlan(resData.plan);
            saveToStorage('bf_mealplan', resData.plan);
            addXp(50);
            return resData.plan;
          }
        }
      } catch (err) {
        console.warn('Failed to generate meal plan on backend', err);
      }
    }

    const targetCalories = userProfile?.targetCalories ?? 2000;
    const targetProtein = userProfile?.targetProtein ?? 130;
    const targetCarbs = userProfile?.targetCarbs ?? 200;
    const targetFat = userProfile?.targetFat ?? 60;

    const mockMealPlan: MealPlan = {
      id: Math.random().toString(36).substring(7),
      title: `Thực đơn ${dietType.toUpperCase()} tối ưu`,
      dietType: dietType.toUpperCase(),
      startDate: getLocalDateString(),
      isActive: true,
      days: Array.from({ length: 7 }, (_, i) => ({
        id: `day-${i + 1}`,
        dayNumber: i + 1,
        calories: targetCalories,
        protein: targetProtein,
        carbs: targetCarbs,
        fat: targetFat,
        items: [
          { id: `item-${i}-1`, mealType: 'breakfast', foodName: '2 quả trứng luộc & 1 lát bánh mì đen', servingSizeG: 120, calories: Math.round(targetCalories * 0.25), protein: Math.round(targetProtein * 0.25), carbs: Math.round(targetCarbs * 0.25), fat: Math.round(targetFat * 0.25) },
          { id: `item-${i}-2`, mealType: 'lunch', foodName: '150g ức gà áp chảo & 1 chén cơm lứt', servingSizeG: 250, calories: Math.round(targetCalories * 0.35), protein: Math.round(targetProtein * 0.35), carbs: Math.round(targetCarbs * 0.35), fat: Math.round(targetFat * 0.35) },
          { id: `item-${i}-3`, mealType: 'dinner', foodName: '150g fillet cá hồi nướng salad rau củ', servingSizeG: 200, calories: Math.round(targetCalories * 0.3), protein: Math.round(targetProtein * 0.3), carbs: Math.round(targetCarbs * 0.3), fat: Math.round(targetFat * 0.3) },
          { id: `item-${i}-4`, mealType: 'snack', foodName: '1 quả chuối sứ & 30g hạt hạnh nhân', servingSizeG: 100, calories: Math.round(targetCalories * 0.1), protein: Math.round(targetProtein * 0.1), carbs: Math.round(targetCarbs * 0.1), fat: Math.round(targetFat * 0.1) }
        ]
      }))
    };

    setActiveMealPlan(mockMealPlan);
    saveToStorage('bf_mealplan', mockMealPlan);
    addXp(50);
    return mockMealPlan;
  };

  const swapMealItem = async (itemId: string, foodName: string, calories: number, protein: number, carbs: number, fat: number, servingSizeG?: number) => {
    if (userToken) {
      try {
        const res = await fetch(`${backendUrl}/v1/mealplans/swap-item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ itemId, foodName, calories, protein, carbs, fat, servingSizeG })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success) {
            const activeRes = await fetch(`${backendUrl}/v1/mealplans/active`, {
              headers: { 'Authorization': `Bearer ${userToken}` }
            });
            if (activeRes.ok) {
              const activeData = await activeRes.json();
              if (activeData.plan) {
                setActiveMealPlan(activeData.plan);
                saveToStorage('bf_mealplan', activeData.plan);
                return activeData.plan;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed to swap meal item on backend', err);
      }
    }

    if (activeMealPlan) {
      const updatedDays = activeMealPlan.days.map(day => ({
        ...day,
        items: day.items.map(item => item.id === itemId ? {
          ...item,
          foodName,
          calories,
          protein,
          carbs,
          fat,
          servingSizeG: servingSizeG || item.servingSizeG
        } : item)
      }));
      const updatedPlan = { ...activeMealPlan, days: updatedDays };
      setActiveMealPlan(updatedPlan);
      saveToStorage('bf_mealplan', updatedPlan);
      return updatedPlan;
    }
  };

  const toggleFavoriteMealPlan = async (planId: string) => {
    if (userToken) {
      try {
        const res = await fetch(`${backendUrl}/v1/mealplans/${planId}/favorite`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.plan) {
            if (activeMealPlan?.id === planId) {
              setActiveMealPlan(resData.plan);
              saveToStorage('bf_mealplan', resData.plan);
            }
            if (resData.plan.isFavorite) {
              setFavoriteMealPlans(prev => [...prev.filter(p => p.id !== planId), resData.plan]);
            } else {
              setFavoriteMealPlans(prev => prev.filter(p => p.id !== planId));
            }
            return resData.plan;
          }
        }
      } catch (err) {
        console.warn('Failed to toggle favorite meal plan on backend', err);
      }
    }

    if (activeMealPlan && activeMealPlan.id === planId) {
      const updated = { ...activeMealPlan, isFavorite: !activeMealPlan.isFavorite };
      setActiveMealPlan(updated);
      saveToStorage('bf_mealplan', updated);
      if (updated.isFavorite) {
        setFavoriteMealPlans(prev => [...prev.filter(p => p.id !== planId), updated]);
      } else {
        setFavoriteMealPlans(prev => prev.filter(p => p.id !== planId));
      }
      return updated;
    }
  };

  const applyFavoriteMealPlan = async (planId: string) => {
    if (userToken) {
      try {
        const res = await fetch(`${backendUrl}/v1/mealplans/${planId}/apply`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.plan) {
            setActiveMealPlan(resData.plan);
            saveToStorage('bf_mealplan', resData.plan);
            return resData.plan;
          }
        }
      } catch (err) {
        console.warn('Failed to apply favorite meal plan on backend', err);
      }
    }

    const found = favoriteMealPlans.find(p => p.id === planId);
    if (found) {
      const activated = { ...found, isActive: true };
      setActiveMealPlan(activated);
      saveToStorage('bf_mealplan', activated);
      return activated;
    }
  };

  const readjustMealPlan = async () => {
    if (userToken) {
      try {
        const res = await fetch(`${backendUrl}/v1/mealplans/readjust`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.plan) {
            setActiveMealPlan(resData.plan);
            saveToStorage('bf_mealplan', resData.plan);
            return resData.plan;
          }
        }
      } catch (err) {
        console.warn('Failed to readjust meal plan on backend', err);
      }
    }

    if (activeMealPlan && userProfile) {
      const targetCalories = userProfile.targetCalories || 2000;
      const targetProtein = userProfile.targetProtein || 130;
      const targetCarbs = userProfile.targetCarbs || 200;
      const targetFat = userProfile.targetFat || 60;

      const updatedDays = activeMealPlan.days.map(day => {
        const ratio = targetCalories / (day.calories || 2000);
        return {
          ...day,
          calories: targetCalories,
          protein: targetProtein,
          carbs: targetCarbs,
          fat: targetFat,
          items: day.items.map(item => ({
            ...item,
            calories: Math.round(item.calories * ratio),
            protein: Math.round(item.protein * ratio),
            carbs: Math.round(item.carbs * ratio),
            fat: Math.round(item.fat * ratio),
          }))
        };
      });

      const updatedPlan = { ...activeMealPlan, days: updatedDays };
      setActiveMealPlan(updatedPlan);
      saveToStorage('bf_mealplan', updatedPlan);
      return updatedPlan;
    }
  };

  const generateAiWorkout = async (goal: string): Promise<{ title: string; duration: string; resultTimeframe: string; description: string; category?: string; exercises: any[] }> => {
    const userWeight = userProfile?.weightKg ?? 70;
    const userHeight = userProfile?.heightCm ?? 175;
    const userAge = userProfile?.age ?? 25;
    const userGender = userProfile?.gender === 'male' ? 'Nam' : userProfile?.gender === 'female' ? 'Nữ' : 'Khác';
    const userActivity = userProfile?.activityLevel ?? 'moderately_active';
    const userGoal = userProfile?.targetGoal ?? 'healthy_lifestyle';

    const systemInstruction = `Bạn là một huấn luyện viên thể hình AI chuyên nghiệp. Hãy thiết kế một chương trình tập luyện cá nhân hóa, tối ưu nhất dựa trên thông tin thể trạng của người dùng:
- Chiều cao: ${userHeight} cm
- Cân nặng: ${userWeight} kg
- Tuổi: ${userAge} tuổi
- Giới tính: ${userGender}
- Mức độ hoạt động thể chất: ${userActivity}
- Mục tiêu sức khỏe chính: ${userGoal}
- Mục tiêu tập cụ thể: "${goal}"

Hãy thiết kế một chương trình tập luyện chi tiết cho mục tiêu này.
Trả về kết quả dưới định dạng JSON với cấu trúc chính xác như sau (không bao gồm bất kỳ định dạng markdown hay ký tự giải thích nào khác, chỉ trả về một chuỗi JSON thô có thể phân tích được bằng JSON.parse):
{
  "title": "Tên chương trình tập luyện cá nhân hóa tối ưu bằng tiếng Việt (ví dụ: 'Giảm mỡ đùi tối ưu cho Nữ 70kg')",
  "category": "Phân loại nhóm bài tập bằng chữ HOA tiếng Anh: 'ABS' (nếu về cơ bụng/eo/core), 'GYM' (nếu tập tạ/phòng gym), 'CARDIO' (nếu chạy bộ/HIIT/đốt mỡ), 'YOGA' (nếu yoga/giãn cơ), 'HOME' (nếu tập kháng lực/tại nhà khác)",
  "duration": "Thời lượng tập mỗi buổi (ví dụ: '30 phút' hoặc '45 phút')",
  "resultTimeframe": "Thời gian tập luyện đều đặn để đạt kết quả tốt nhất (ví dụ: '2 tuần', '4 tuần' hoặc '6 tuần')",
  "description": "Lịch tập chi tiết chỉ rõ thứ mấy trong tuần, buổi nào (Sáng/Chiều/Tối), khung giờ khuyên tập và thời lượng mỗi buổi tập (ví dụ: 'Lịch tập: Thứ 2, 4, 6 vào Buổi chiều (17:30 - 18:00). Lời khuyên: Tập trung giữ chặt cơ bụng trong các hiệp. Tránh ăn no trước tập 2 tiếng...'). Cần viết chi tiết, rõ ràng, dễ hiểu nhất có thể để người dùng biết chính xác hôm nay hay ngày mai nên tập gì và khi nào.",
  "exercises": [
    {
      "name": "Tên động tác tiếng Việt (ví dụ: 'Squat tạ đơn' hoặc 'Gập bụng ngược')",
      "sets": số hiệp (number),
      "reps": "số lần tập hoặc thời gian mỗi hiệp (ví dụ: '12 lần' hoặc '45 giây')",
      "emoji": "emoji đại diện cho động tác (ví dụ: '🧘‍♂️', '🤸‍♂️', '💪', '🦵', '🏋️‍♂️')"
    }
  ]
}`;

    // 1. OpenRouter
    if (chatModelProvider === 'openrouter' && openRouterApiKey && openRouterApiKey.trim() !== '') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterApiKey.trim()}`,
            'HTTP-Referer': 'https://bodyfit-ai.com',
            'X-Title': 'BodyFit'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: systemInstruction }],
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.choices?.[0]?.message?.content;
          if (jsonText) {
            const parsed = JSON.parse(jsonText.trim());
            addXp(25);
            return {
              title: parsed.title || 'Bài tập tùy chỉnh AI',
              category: parsed.category || 'HOME',
              duration: parsed.duration || '30 phút',
              resultTimeframe: parsed.resultTimeframe || '4 tuần',
              description: parsed.description || 'Hãy cố gắng duy trì luyện tập đều đặn và ăn uống khoa học.',
              exercises: parsed.exercises || []
            };
          }
        }
      } catch (e) {
        console.error('Failed to generate OpenRouter workout, trying Gemini:', e);
      }
    }

    // 2. Gemini
    if (geminiApiKey && geminiApiKey.trim() !== '') {
      try {
        let response: Response | null = null;
        let model = 'gemini-2.5-flash';
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: systemInstruction }]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText.trim());
            addXp(25);
            return {
              title: parsed.title || 'Bài tập tùy chỉnh AI',
              category: parsed.category || 'HOME',
              duration: parsed.duration || '30 phút',
              resultTimeframe: parsed.resultTimeframe || '4 tuần',
              description: parsed.description || 'Hãy cố gắng duy trì luyện tập đều đặn và ăn uống khoa học.',
              exercises: parsed.exercises || []
            };
          }
        }
      } catch (e) {
        console.error('Failed to generate Gemini workout, falling back to mock:', e);
      }
    }


    // 3. Fallback Smart Mock Engine
    return new Promise((resolve) => {
      setTimeout(() => {
        const g = goal.toLowerCase();
        let title = `Thể lực toàn diện cho ${userGender} (${userWeight}kg) ⚡`;
        let duration = '35 phút';
        let resultTimeframe = '4 tuần';
        let description = `Bài tập tổng hợp tăng sức mạnh cho cơ vai, lưng, bụng và đùi, phù hợp với thể hình hiện tại của bạn.`;
        let exercises = [
          { name: 'Squat bodyweight (Squat cơ bản)', sets: 3, reps: '15 lần', emoji: '🦵' },
          { name: 'Pushup (Chống đẩy cơ bản)', sets: 3, reps: '10 lần', emoji: '🤸‍♂️' },
          { name: 'Ab Crunch (Gập cơ bụng)', sets: 3, reps: '12 lần', emoji: '🧘‍♂️' },
          { name: 'Plank Hold (Giữ thăng bằng)', sets: 3, reps: '45 giây', emoji: '🤸‍♂️' }
        ];

        if (g.includes('bụng') || g.includes('abs') || g.includes('core')) {
          title = `Cơ bụng săn chắc cho ${userGender} (${userWeight}kg, ${userHeight}cm) 🧘‍♂️`;
          duration = '30 phút';
          resultTimeframe = '4 tuần';
          description = `Tập trung vào cơ bụng trên, bụng dưới và liên sườn để định hình vòng eo tối ưu cho thể trạng hiện tại.`;
          exercises = [
            { name: 'Ab Crunch (Gập bụng cơ bản)', sets: 3, reps: '15 lần', emoji: '🧘‍♂️' },
            { name: 'Leg Raise (Nâng chân tập bụng dưới)', sets: 3, reps: '12 lần', emoji: '🧘‍♂️' },
            { name: 'Plank Hold (Giữ cơ bụng)', sets: 3, reps: '60 giây', emoji: '🤸‍♂️' },
            { name: 'Russian Twist (Vặn người tập eo)', sets: 3, reps: '20 lần', emoji: '🧘‍♂️' }
          ];
        } else if (g.includes('chân') || g.includes('mông') || g.includes('đùi') || g.includes('legs') || g.includes('glute')) {
          title = `Thon gọn mông đùi tối ưu cho ${userGender} (${userWeight}kg) 🦵`;
          duration = '40 phút';
          resultTimeframe = '6 tuần';
          description = `Các bài tập giúp tăng sức bền cơ đùi và định hình nhóm cơ mông tròn trịa cho người có BMI ${(userWeight / Math.pow(userHeight / 100, 2)).toFixed(1)}.`;
          exercises = [
            { name: 'Bodyweight Squats (Squat tự do)', sets: 4, reps: '15 lần', emoji: '🦵' },
            { name: 'Glute Bridge (Cầu mông nâng hông)', sets: 3, reps: '15 lần', emoji: '🦵' },
            { name: 'Lunges (Bước chùng chân)', sets: 3, reps: '12 lần mỗi chân', emoji: '🚶‍♂️' },
            { name: 'Calf Raise (Nhón gót kiểng chân)', sets: 3, reps: '20 lần', emoji: '🦵' }
          ];
        } else if (g.includes('ngực') || g.includes('vai') || g.includes('tay') || g.includes('push') || g.includes('chest') || g.includes('shoulder')) {
          title = `Tăng cơ ngực & vai cho ${userGender} (${userWeight}kg) 💪`;
          duration = '45 phút';
          resultTimeframe = '5 tuần';
          description = `Chương trình tối ưu kích hoạt cơ ngực ngang, cơ vai trước và bắp tay sau để đạt thân hình cân đối.`;
          exercises = [
            { name: 'Pushups (Chống đẩy sát đất)', sets: 3, reps: '12 lần', emoji: '🤸‍♂️' },
            { name: 'Dumbbell Shoulder Press (Đẩy vai tạ đơn)', sets: 3, reps: '12 lần', emoji: '💪' },
            { name: 'Incline Pushups (Chống đẩy dốc lên)', sets: 3, reps: '10 lần', emoji: '🏋️‍♂️' },
            { name: 'Diamond Pushups (Chống đẩy tay hẹp)', sets: 3, reps: '8 lần', emoji: '🤸‍♂️' }
          ];
        } else if (g.includes('giảm cân') || g.includes('fat') || g.includes('hiit') || g.includes('cardio') || g.includes('mỡ')) {
          title = `Đốt mỡ toàn thân HIIT cho ${userGender} (${userWeight}kg) 🔥`;
          duration = '25 phút';
          resultTimeframe = '4 tuần';
          description = `Cơ chế đốt mỡ cường độ cao giúp tối ưu hóa trao đổi chất cho thể trạng ${userGender} ${userAge} tuổi.`;
          exercises = [
            { name: 'Jumping Jacks (Nhảy vung tay)', sets: 4, reps: '45 giây', emoji: '🏃‍♂️' },
            { name: 'Burpees (Chống đẩy nhảy cao)', sets: 4, reps: '10 lần', emoji: '🤸‍♂️' },
            { name: 'Mountain Climbers (Leo núi tại chỗ)', sets: 4, reps: '30 giây', emoji: '🏃‍♂️' },
            { name: 'High Knees (Chạy nâng cao đùi)', sets: 4, reps: '30 giây', emoji: '🏃‍♂️' }
          ];
        }

        addXp(25);
        resolve({ title, duration, resultTimeframe, description, exercises });
      }, 1800);
    });
  };

  const addWorkoutProgram = (program: { title: string; description: string; category?: string; exercises: any[] }) => {
    const newProgram: WorkoutProgram = {
      id: 'ai_' + Math.random().toString(36).substring(7),
      title: program.title,
      description: program.description,
      category: (program.category || 'HOME') as any,
      difficulty: 'BEGINNER',
      exercises: program.exercises.map((ex: any, idx: number) => ({
        id: `ex_${idx}_${Math.random().toString(36).substring(7)}`,
        name: ex.name,
        sets: ex.sets || 3,
        reps: ex.reps || '12 lần'
      }))
    };
    setWorkoutPrograms(prev => {
      const updated = [...prev, newProgram];
      saveToStorage('bf_workouts', updated);
      return updated;
    });
  };

  const deleteWorkoutProgram = async (programId: string) => {
    if (userToken) {
      try {
        await fetch(`${backendUrl}/v1/workouts/programs/${programId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
      } catch (err) {
        console.warn('Failed to delete workout program on backend', err);
      }
    }

    let deletedIds: string[] = [];
    try {
      const stored = Platform.OS === 'web' ? localStorage.getItem('bf_deleted_workouts') : await AsyncStorage.getItem('bf_deleted_workouts');
      if (stored) deletedIds = JSON.parse(stored);
    } catch (e) {}

    if (!deletedIds.includes(programId)) {
      deletedIds.push(programId);
      saveToStorage('bf_deleted_workouts', deletedIds);
    }

    setWorkoutPrograms(prev => {
      const updated = prev.filter(program => program.id !== programId);
      saveToStorage('bf_workouts', updated);
      return updated;
    });
  };
  const addCommunityPost = async (content: string, photoUrl?: string) => {
    let newPost: CommunityPost = {
      id: Math.random().toString(36).substring(7),
      userId: currentUser?.uid || 'mock-uid',
      username: currentUser?.username || 'Bạn',
      content,
      photoUrl,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    };

    if (userToken) {
      try {
        const res = await fetch(`${backendUrl}/v1/community/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ content, photoUrl })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.post) {
            newPost = {
              ...resData.post,
              likes: resData.post.likes || [],
              comments: resData.post.comments || []
            };
          }
        }
      } catch (err) {
        console.warn('Failed to sync post to backend', err);
      }
    }

    setCommunityPosts(prev => {
      const updated = [newPost, ...prev];
      saveToStorage('bf_posts', updated);
      return updated;
    });
    addXp(20);
  };

  const toggleLikePost = async (postId: string) => {
    const myUid = currentUser?.uid || 'mock-uid';
    setCommunityPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const isLiked = p.likes.some(l => l.userId === myUid);
          const newLikes = isLiked
            ? p.likes.filter(l => l.userId !== myUid)
            : [...p.likes, { id: Math.random().toString(36).substring(7), userId: myUid }];
          return {
            ...p,
            likes: newLikes
          };
        }
        return p;
      });
      saveToStorage('bf_posts', updated);
      return updated;
    });

    if (userToken) {
      try {
        await fetch(`${backendUrl}/v1/community/posts/${postId}/like`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
      } catch (err) {
        console.warn('Failed to like post on backend', err);
      }
    }
  };

  const addCommentToPost = async (postId: string, content: string) => {
    const myUsername = currentUser?.username || 'Bạn';
    const newComment: PostComment = {
      id: Math.random().toString(36).substring(7),
      username: myUsername,
      content,
      createdAt: new Date().toISOString()
    };

    setCommunityPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...p.comments, newComment]
          };
        }
        return p;
      });
      saveToStorage('bf_posts', updated);
      return updated;
    });

    if (userToken) {
      try {
        await fetch(`${backendUrl}/v1/community/posts/${postId}/comment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ content })
        });
      } catch (err) {
        console.warn('Failed to add comment on backend', err);
      }
    }
  };

  const deleteCommunityPost = async (postId: string) => {
    if (userToken) {
      try {
        await fetch(`${backendUrl}/v1/community/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
      } catch (err) {
        console.warn('Failed to delete post on backend', err);
      }
    }
    setCommunityPosts(prev => {
      const updated = prev.filter(p => p.id !== postId);
      saveToStorage('bf_posts', updated);
      return updated;
    });
    Alert.alert('Thành công', 'Đã xóa bài viết.');
  };

  const joinChallenge = async (challengeId: string) => {
    const newChal: UserChallenge = {
      id: Math.random().toString(36).substring(7),
      challengeId,
      startDate: getLocalDateString(),
      status: 'ONGOING'
    };
    setUserChallenges(prev => {
      const updated = [...prev, newChal];
      saveToStorage('bf_user_chals', updated);
      return updated;
    });
    Alert.alert('Thành công', 'Bạn đã tham gia thử thách thành công! Chúc bạn kiên trì hoàn thành 🎯');
  };

  const completeChallenge = async (challengeId: string) => {
    setUserChallenges(prev => {
      const updated = prev.map(c => {
        if (c.challengeId === challengeId) {
          return { ...c, status: 'COMPLETED' as const };
        }
        return c;
      });
      saveToStorage('bf_user_chals', updated);
      return updated;
    });

    const chal = challenges.find(c => c.id === challengeId);
    if (chal) {
      addXp(chal.xpReward);
      const newBadge: UserBadge = {
        id: Math.random().toString(36).substring(7),
        name: `Kỷ lục ${chal.title.split(' ')[0]} 🏆`,
        description: `Hoàn thành thử thách ${chal.title}`,
        icon: 'star',
        unlockedAt: new Date().toISOString()
      };
      setUserBadges(prev => {
        const updated = [newBadge, ...prev];
        saveToStorage('bf_user_badges', updated);
        return updated;
      });
      Alert.alert('Chúc mừng 🎉', `Xuất sắc! Bạn đã hoàn thành thử thách và nhận ${chal.xpReward} XP + 1 Huy hiệu mới!`);
    }
  };

  const togglePremiumStatus = async (status: boolean) => {
    setIsPremium(status);
    saveToStorage('bf_is_premium', status);
    if (currentUser) {
      const updatedUser = { ...currentUser, isPremium: status };
      setCurrentUser(updatedUser);
      saveToStorage('bf_current_user', updatedUser);
    }
    if (userToken) {
      try {
        await fetch(`${backendUrl}/v1/users/premium/activate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ isPremium: status })
        });
      } catch (e) {
        console.warn('Failed to sync premium toggle to backend', e);
      }
    }
  };

  const toggleAdminRole = async (role: string) => {
    const isAdminRole = role === 'ADMIN';
    setIsAdmin(isAdminRole);
    saveToStorage('bf_is_admin', isAdminRole);
    if (currentUser) {
      const updatedUser = { ...currentUser, role };
      setCurrentUser(updatedUser);
      saveToStorage('bf_current_user', updatedUser);
    }
    if (userToken) {
      try {
        await fetch(`${backendUrl}/v1/admin/users/${currentUser?.uid}/role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ role })
        });
      } catch (e) {
        console.warn('Failed to sync admin toggle to backend', e);
      }
    }
  };

  const getLeaderboard = async () => {
    if (userToken) {
      try {
        const res = await fetch(`${backendUrl}/v1/community/leaderboard`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.leaderboard) {
            return data.leaderboard;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch leaderboard from backend', err);
      }
    }

    return {
      topActive: [
        { name: 'Nguyễn Văn Đạt', level: 8, xp: 750 },
        { name: 'Trần Thảo', level: 6, xp: 420 },
        { name: 'Lê Minh Hùng', level: 5, xp: 210 },
        { name: 'Phạm Thị Mai', level: 4, xp: 380 },
        { name: 'Bạn', level: userProfile?.level || 2, xp: userProfile?.xp || 120 }
      ].sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp),
      topWeightLoss: [
        { username: 'Phạm Thị Mai', weightLostKg: 4.5, currentWeightKg: 58.2 },
        { username: 'Trần Thảo', weightLostKg: 3.2, currentWeightKg: 52.8 },
        { username: 'Lê Minh Hùng', weightLostKg: 2.5, currentWeightKg: 78.0 },
        { username: 'Nguyễn Văn Đạt', weightLostKg: 1.8, currentWeightKg: 74.2 }
      ]
    };
  };

  const getAdminDashboard = async () => {
    if (userToken) {
      try {
        const fetchPromise = (async () => {
          const res = await fetch(`${backendUrl}/v1/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
          });
          if (res.ok) {
            return await res.json();
          }
          throw new Error(`HTTP ${res.status}`);
        })();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout (8s)')), 8000)
        );

        const data = await Promise.race([fetchPromise, timeoutPromise]);
        return data;
      } catch (err: any) {
        console.warn('Failed to fetch admin dashboard from backend within timeout', err);
        const errMsg = `Không thể kết nối API backend (${err.message || err}). Đang hiển thị số liệu từ local storage...`;
        if (Platform.OS === 'web') {
          console.log(errMsg);
        } else {
          Alert.alert('Thông báo dữ liệu Admin', errMsg);
        }
      }
    } else {
      const tokenMsg = `Chưa đăng nhập backend. Đang sử dụng chế độ local...`;
      console.log(tokenMsg);
    }

    // Dynamic real fallback based on local application state
    const currentIsPremium = isPremium ?? false;
    const currentIsAdmin = isAdmin ?? false;
    const localUsersCount = 1;
    const localPremiumCount = currentIsPremium ? 1 : 0;
    const localRevenueVND = localPremiumCount * 79000;

    const now = new Date();
    const fallbackMonthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `Thg ${d.getMonth() + 1}`;
      fallbackMonthlyData.push({
        month: label,
        sales: i === 0 ? localUsersCount : 0,
        revenue: i === 0 ? localRevenueVND : 0
      });
    }

    const userName = userProfile 
      ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || currentUser?.username || 'Admin User'
      : currentUser?.username || 'Admin User';

    return {
      stats: {
        totalUsers: localUsersCount,
        premiumUsers: localPremiumCount,
        totalPosts: Array.isArray(communityPosts) ? communityPosts.length : 0,
        totalWorkouts: Array.isArray(workoutPrograms) ? workoutPrograms.length : 0,
        estimatedMonthlyRevenueVND: localRevenueVND,
        totalRevenueUSD: localRevenueVND
      },
      monthlyData: fallbackMonthlyData,
      users: [
        {
          id: currentUser?.username || 'local-user-1',
          email: currentUser?.email || 'admin@bodyfit.com',
          username: currentUser?.username || 'admin',
          role: currentIsAdmin ? 'ADMIN' : 'USER',
          isPremium: currentIsPremium,
          createdAt: new Date().toISOString(),
          name: userName
        }
      ]
    };
  };

  const claimQuestReward = (questId: string) => {
    let xp = 0;
    let coins = 0;
    setQuests(prev => {
      const updated = prev.map(q => {
        if (q.id === questId && q.isCompleted && !q.isClaimed) {
          xp = q.xpReward;
          coins = q.coinReward;
          return { ...q, isClaimed: true };
        }
        return q;
      });
      saveToStorage('bf_quests', updated);
      return updated;
    });

    if (xp > 0 || coins > 0) {
      setUserProfile(prev => {
        if (!prev) return null;
        let newXp = prev.xp + xp;
        let newLevel = prev.level;
        const xpNeeded = newLevel * 100;
        if (newXp >= xpNeeded) {
          newXp -= xpNeeded;
          newLevel += 1;
        }
        const currentCoins = prev.coins ?? 0;
        const updated = {
          ...prev,
          xp: newXp,
          level: newLevel,
          coins: currentCoins + coins
        };
        saveToStorage('bf_profile', updated);
        return updated;
      });
      Alert.alert('Nhận thưởng thành công! 🎉', `Bạn nhận được +${xp} XP và +${coins} Tiền vàng.`);
    }
  };

  const buyBadge = async (badgeName: string, cost: number, icon: string): Promise<boolean> => {
    if (!userProfile) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
      return false;
    }
    const currentCoins = userProfile.coins ?? 0;
    if (currentCoins < cost) {
      Alert.alert('Không đủ Tiền vàng', `Bạn cần ${cost} Tiền vàng để mua huy hiệu này (Hiện có: ${currentCoins}).`);
      return false;
    }

    // Deduct coins
    setUserProfile(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        coins: (prev.coins ?? 0) - cost
      };
      saveToStorage('bf_profile', updated);
      return updated;
    });

    // Add badge
    const newBadge: UserBadge = {
      id: Math.random().toString(36).substring(7),
      name: badgeName,
      description: `Được mua từ Cửa hàng phần thưởng`,
      icon,
      unlockedAt: new Date().toISOString()
    };
    setUserBadges(prev => {
      const updated = [newBadge, ...prev];
      saveToStorage('bf_user_badges', updated);
      return updated;
    });

    Alert.alert('Mua huy hiệu thành công! 🛒', `Bạn đã đổi ${cost} Tiền vàng lấy huy hiệu "${badgeName}".`);
    return true;
  };

  const saveLiftingRecords = async (records: LiftingRecords) => {
    setLiftingRecords(records);
    saveToStorage('bf_lifting_records', records);

    // Auto-log to history
    const todayStr = getLocalDateString();
    setLiftingHistory(prev => {
      const existingIdx = prev.findIndex(item => item.loggedDate === todayStr);
      let updated: LiftingHistoryLog[];
      if (existingIdx !== -1) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          squat: records.squat,
          bench: records.bench,
          deadlift: records.deadlift
        };
      } else {
        const newLog: LiftingHistoryLog = {
          id: Math.random().toString(36).substring(7),
          squat: records.squat,
          bench: records.bench,
          deadlift: records.deadlift,
          loggedDate: todayStr
        };
        updated = [...prev, newLog];
      }
      saveToStorage('bf_lifting_history', updated);
      return updated;
    });
  };

  // Configure notifications behaviour and request permission on start
  useEffect(() => {
    const Notif = getNotifications();
    if (Notif) {
      try {
        Notif.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        async function requestNotifPermissions() {
          if (Platform.OS === 'android' && Notif.setNotificationChannelAsync) {
            await Notif.setNotificationChannelAsync('default', {
              name: 'default',
              importance: Notif.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
            });
          }
          if (Notif.requestPermissionsAsync) {
            await Notif.requestPermissionsAsync();
          }
        }
        requestNotifPermissions();
      } catch (e) {
        console.warn('Expo Go notification setup skipped:', e);
      }
    }
  }, []);

  const rescheduleActivityNotification = async (item: ActivityScheduleItem): Promise<string | null> => {
    const Notif = getNotifications();
    if (!Notif) return null;

    if (item.notificationId) {
      try {
        await Notif.cancelScheduledNotificationAsync(item.notificationId);
      } catch (e) {
        console.warn('Failed to cancel notification', e);
      }
    }

    if (item.isEnabled) {
      try {
        const parts = item.time.split(':');
        if (parts.length < 2) return null;
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);
        if (isNaN(hour) || isNaN(minute)) return null;

        // Build rich notification body for meal types
        let notifBody = `Đã đến giờ ${item.title.toLowerCase()} rồi! Hãy thực hiện ngay nhé 💪`;
        const isMealType = ['breakfast', 'lunch', 'dinner'].includes(item.type);
        if (isMealType && item.nutritionInfo) {
          const n = item.nutritionInfo;
          notifBody = `Đã đến giờ ${item.title.toLowerCase()}! Bạn cần nạp: ${n.protein} đạm, ${n.carbs} tinh bột, ${n.fat} béo (~${n.calories}).`;
          if (item.suggestedMeals && item.suggestedMeals.length > 0) {
            notifBody += `\nGợi ý: ${item.suggestedMeals.join(', ')}.`;
          }
        }

        const id = await Notif.scheduleNotificationAsync({
          content: {
            title: `🔔 Nhắc nhở hoạt động: ${item.title}`,
            body: notifBody,
            sound: true,
          },
          trigger: {
            type: 'calendar',
            hour,
            minute,
            repeats: true,
          } as any,
        });
        return id;
      } catch (e) {
        console.warn('Failed to schedule notification', e);
        return null;
      }
    }
    return null;
  };

  const rescheduleAllNotifications = async (scheduleList: ActivityScheduleItem[]): Promise<ActivityScheduleItem[]> => {
    if (Platform.OS === 'web') return scheduleList;
    const updatedList = [];
    for (const item of scheduleList) {
      const notificationId = await rescheduleActivityNotification(item);
      updatedList.push({ ...item, notificationId });
    }
    return updatedList;
  };

  const addActivityScheduleItem = async (title: string, time: string, type: ActivityScheduleItem['type']) => {
    const newItem: ActivityScheduleItem = {
      id: 'act_' + Date.now(),
      title,
      time,
      type,
      isEnabled: true
    };
    const notificationId = await rescheduleActivityNotification(newItem);
    const updated = [...activitySchedule, { ...newItem, notificationId }];
    setActivitySchedule(updated);
    saveToStorage('bf_activity_schedule', updated);
  };

  const deleteActivityScheduleItem = async (id: string) => {
    const target = activitySchedule.find(item => item.id === id);
    const Notif = getNotifications();
    if (target && target.notificationId && Notif) {
      try {
        await Notif.cancelScheduledNotificationAsync(target.notificationId);
      } catch (e) {
        console.warn(e);
      }
    }
    const updated = activitySchedule.filter(item => item.id !== id);
    setActivitySchedule(updated);
    saveToStorage('bf_activity_schedule', updated);
  };

  const toggleActivityScheduleItem = async (id: string) => {
    const updated = await Promise.all(activitySchedule.map(async item => {
      if (item.id === id) {
        const nextEnabled = !item.isEnabled;
        const tempItem = { ...item, isEnabled: nextEnabled };
        const nextNotifId = await rescheduleActivityNotification(tempItem);
        return { ...tempItem, notificationId: nextNotifId };
      }
      return item;
    }));
    setActivitySchedule(updated);
    saveToStorage('bf_activity_schedule', updated);
  };

  const generateAiActivitySchedule = async (goalDescription?: string): Promise<void> => {
    const userWeight = userProfile?.weightKg ?? 70;
    const userHeight = userProfile?.heightCm ?? 175;
    const userAge = userProfile?.age ?? 25;
    const userGender = userProfile?.gender === 'male' ? 'Nam' : userProfile?.gender === 'female' ? 'Nữ' : 'Khác';
    const userGoal = userProfile?.targetGoal ?? 'healthy_lifestyle';
    const calories = userProfile?.targetCalories ?? 2000;

    const goalText = goalDescription || `Tối ưu hóa sức khỏe theo mục tiêu ${userGoal}`;

    const systemInstruction = `Bạn là một trợ lý sức khỏe thông minh AI chuyên nghiệp. Hãy thiết kế một lịch trình hoạt động lý tưởng của ngày hôm nay cho người dùng dựa trên thông tin thể trạng:
- Chiều cao: ${userHeight} cm
- Cân nặng: ${userWeight} kg
- Tuổi: ${userAge} tuổi
- Giới tính: ${userGender}
- Mục tiêu chính: ${userGoal}
- Lượng calo khuyến nghị: ${calories} kcal/ngày
- Yêu cầu người dùng: ${goalText}

Hãy tạo ra một danh sách các hoạt động chính trong ngày bao gồm thời gian ăn sáng, ăn trưa, ăn tối, thời gian tập luyện trong ngày, và 1-2 hoạt động bổ sung (ví dụ: uống nước, đi ngủ).

QUAN TRỌNG: Đối với các hoạt động ăn uống (breakfast, lunch, dinner), bạn PHẢI đưa ra chỉ số dinh dưỡng cụ thể cho bữa ăn đó (bao gồm lượng đạm/protein, tinh bột/carbs, chất béo/fat, và tổng calo). Đồng thời hãy gợi ý 2-3 món ăn cụ thể phù hợp với mục tiêu dinh dưỡng.

Trả về kết quả dưới định dạng JSON với cấu trúc chính xác như sau (không bao gồm bất kỳ định dạng markdown hay ký tự giải thích nào khác, chỉ trả về một chuỗi JSON thô có thể phân tích được bằng JSON.parse):
[
  {
    "title": "Tên hoạt động (ví dụ: 'Ăn sáng lành mạnh 🍳')",
    "time": "HH:MM (ví dụ: '07:30')",
    "type": "'breakfast' | 'lunch' | 'dinner' | 'workout' | 'custom'",
    "nutritionInfo": {
      "protein": "lượng đạm dạng chuỗi (ví dụ: '30g')",
      "carbs": "lượng tinh bột dạng chuỗi (ví dụ: '50g')",
      "fat": "lượng chất béo dạng chuỗi (ví dụ: '15g')",
      "calories": "tổng calo dạng chuỗi (ví dụ: '450 kcal')"
    },
    "suggestedMeals": ["Món ăn gợi ý 1", "Món ăn gợi ý 2", "Món ăn gợi ý 3"]
  }
]
Lưu ý: Chỉ bao gồm nutritionInfo và suggestedMeals cho các loại hoạt động ăn uống (breakfast, lunch, dinner). Các hoạt động khác (workout, custom) không cần các trường này.`;

    let generatedText = '';
    if (chatModelProvider === 'openrouter' && openRouterApiKey && openRouterApiKey.trim() !== '') {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterApiKey}`
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: systemInstruction }]
          })
        });
        const data = await response.json();
        if (data?.error) {
          console.warn('OpenRouter API returned error:', data.error);
        }
        generatedText = data?.choices?.[0]?.message?.content || '';
      } catch (e) {
        console.error('OpenRouter Activity Generation Error', e);
      }
    } else if (chatModelProvider === 'gemini' && geminiApiKey && geminiApiKey.trim() !== '') {
      try {
        const response = await fetch(`https://generativetoolkit.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemInstruction }] }]
          })
        });
        const data = await response.json();
        if (data?.error) {
          console.warn('Gemini API returned error:', data.error);
        }
        generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (e) {
        console.error('Gemini Activity Generation Error', e);
      }
    }

    if (!generatedText) {
      generatedText = JSON.stringify([
        { title: 'Ăn sáng lành mạnh 🍳', time: '07:30', type: 'breakfast', nutritionInfo: { protein: '25g', carbs: '45g', fat: '12g', calories: '380 kcal' }, suggestedMeals: ['Trứng luộc + bánh mì nguyên cám', 'Cháo yến mạch + chuối', 'Sữa chua Hy Lạp + granola'] },
        { title: 'Ăn trưa đầy đủ dinh dưỡng 🥩', time: '12:00', type: 'lunch', nutritionInfo: { protein: '40g', carbs: '60g', fat: '18g', calories: '560 kcal' }, suggestedMeals: ['Cơm gạo lứt + ức gà nướng + rau xanh', 'Bún bò + rau sống', 'Salad cá hồi + khoai lang'] },
        { title: 'Uống nước nhắc nhở 💧', time: '15:00', type: 'custom' },
        { title: 'Tập luyện thể thao tăng cơ 🏋️‍♂️', time: '17:30', type: 'workout' },
        { title: 'Ăn tối nhẹ nhàng 🥗', time: '19:30', type: 'dinner', nutritionInfo: { protein: '30g', carbs: '35g', fat: '10g', calories: '350 kcal' }, suggestedMeals: ['Salad ức gà + rau củ', 'Canh rau + đậu hũ + cá hấp', 'Soup bí đỏ + thịt bò nạc'] }
      ]);
    }

    try {
      let cleaned = generatedText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();

      const parsed: any[] = JSON.parse(cleaned);
      const newItems: ActivityScheduleItem[] = parsed.map((item, idx) => ({
        id: 'act_' + Date.now() + '_' + idx,
        title: item.title,
        time: item.time,
        type: item.type || 'custom',
        isEnabled: true,
        nutritionInfo: item.nutritionInfo || null,
        suggestedMeals: item.suggestedMeals || null,
      }));

      const finalized = await rescheduleAllNotifications(newItems);
      setActivitySchedule(finalized);
      saveToStorage('bf_activity_schedule', finalized);
      addXp(30);
      Alert.alert('AI Coach', 'Đã soạn lịch sinh hoạt thông minh và kích hoạt nhắc nhở hôm nay! 📅💡');
    } catch (e) {
      console.error('Parsing generated activity schedule failed', e);
      Alert.alert('Lỗi', 'Không thể parse lịch từ AI. Vui lòng thử lại.');
    }
  };

  const normalizedUserProfile = useMemo(() => {
    if (!userProfile) return null;
    let url = userProfile.avatarUrl;
    if (!url || !url.trim()) {
      url = DEFAULT_AVATAR;
    } else if (url.startsWith('data:') || url.startsWith('file:') || (url.startsWith('http') && !url.includes('/v1/users/avatars/'))) {
      // base64 image, local file, or preset avatar, keep it as is
    } else if (!url.startsWith('http')) {
      const filename = url.includes('/') ? url.split('/').pop() : url;
      url = `${backendUrl}/v1/users/avatars/${filename}`;
    }
    return {
      ...userProfile,
      avatarUrl: url
    };
  }, [userProfile, backendUrl]);

  return (
    <LocalDbContext.Provider
      value={{
        activeDateStr,
        userProfile: normalizedUserProfile,
        foodLogs,
        waterLogs,
        chatLogs,
        isAiTyping,
        chatSessions,
        currentSessionId,
        createChatSession,
        selectChatSession,
        deleteChatSession,
        recipes,
        shoppingList,
        geminiApiKey,
        groqApiKey,
        openRouterApiKey,
        userToken,
        currentUser,
        backendUrl,
        dailyDeclarations,
        updateProfile,
        addFoodLog,
        deleteFoodLog,
        addWaterLog,
        deleteWaterLog,
        sendChatMessage,
        generateAiRecipe,
        addShoppingItem,
        toggleShoppingItem,
        clearShoppingList,
        triggerMockScanFood,
        triggerVoiceLogging,
        addXp,
        saveGeminiApiKey,
        saveGroqApiKey,
        saveOpenRouterApiKey,
        chatModelProvider,
        setChatModelProvider: saveChatModelProvider,
        clearAllData,
        login,
        register,
        sendRegisterOtp,
        verifyRegisterOtp,
        sendForgotPasswordOtp,
        verifyForgotPasswordOtp,
        loginWithGoogle,
        resetPassword,
        logout,
        saveBackendUrl,
        getDefaultBackendUrl,
        saveDailyDeclaration,
        getLogsForDate,
        getUserHistory,
        generateDailyAiReview,
        weightLogs,
        workoutPrograms,
        workoutSchedules,
        activeMealPlan,
        favoriteMealPlans,
        communityPosts,
        challenges,
        userChallenges,
        userBadges,
        isPremium,
        isAdmin,
        addWeightLog,
        scheduleWorkout,
        toggleWorkoutCompleted,
        logCompletedWorkout,
        generateMealPlan,
        swapMealItem,
        toggleFavoriteMealPlan,
        applyFavoriteMealPlan,
        readjustMealPlan,
        generateAiWorkout,
        addWorkoutProgram,
        deleteWorkoutProgram,
        addCommunityPost,
        toggleLikePost,
        addCommentToPost,
        deleteCommunityPost,
        joinChallenge,
        completeChallenge,
        togglePremiumStatus,
        toggleAdminRole,
        getLeaderboard,
        getAdminDashboard,
        refreshData: () => fetchBackendData(userToken || '', backendUrl),
        quests,
        liftingHistory,
        claimQuestReward,
        buyBadge,
        liftingRecords,
        saveLiftingRecords,
        prefilledFoodData,
        setPrefilledFoodData,
        shouldTriggerScan,
        setShouldTriggerScan,
        activitySchedule,
        addActivityScheduleItem,
        deleteActivityScheduleItem,
        toggleActivityScheduleItem,
        generateAiActivitySchedule
      }}
    >
      {children}
    </LocalDbContext.Provider>
  );
};

export const useLocalDb = () => {
  const context = useContext(LocalDbContext);
  if (context === undefined) {
    throw new Error('useLocalDb must be used within a LocalDbProvider');
  }
  return context;
};






