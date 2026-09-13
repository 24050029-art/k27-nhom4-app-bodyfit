import React, { useState } from 'react';
import { StyleSheet, Pressable, TextInput, View, ScrollView, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Modal, Alert, Keyboard } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useLocalDb, getFriendlyAuthErrorMessage } from '@/hooks/use-local-db';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

// Google Client IDs & Firebase configuration
// Cấu hình các Client ID này từ dự án Firebase & Google Developer Console của bạn để chạy thực tế
const GOOGLE_CLIENT_IDS = {
  firebaseApiKey: 'AIzaSyCFMjDb6BpHHcdFP6xlmEUitgMc6pbXyMU', // Lấy tại Firebase Console > Project Settings > Web API Key
  webClientId: '408574266456-h9ijc324bv4vvdg5q37etsqdjktcsel2.apps.googleusercontent.com', // Web Client ID (dùng cho Expo Go/Web)
  iosClientId: '408574266456-m333bg7s3lqp85mbr4gmseh3rn6opmso.apps.googleusercontent.com',   // iOS Client ID (dùng cho thiết bị iOS)
  androidClientId: '408574266456-buqgnpeo5cu2shjvhuk0iruhcjgr9j91.apps.googleusercontent.com', // Android Client ID (dùng cho thiết bị Android)
};

export default function AuthScreen() {
  const {
    login,
    register,
    sendRegisterOtp,
    verifyRegisterOtp,
    sendForgotPasswordOtp,
    verifyForgotPasswordOtp,
    loginWithGoogle,
    resetPassword,
    backendUrl,
    saveBackendUrl
  } = useLocalDb();
  const theme = useTheme();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register OTP states
  const [isOtpRegister, setIsOtpRegister] = useState(false);
  const [registerOtp, setRegisterOtp] = useState('');
  const [registerDevOtp, setRegisterDevOtp] = useState<string | undefined>(undefined);

  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isOtpReset, setIsOtpReset] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [resetDevOtp, setResetDevOtp] = useState<string | undefined>(undefined);
  const [verifiedEmailOrPhone, setVerifiedEmailOrPhone] = useState('');
  const [resetUsernameOrEmail, setResetUsernameOrEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  // Google sign in states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isCustomGoogle, setIsCustomGoogle] = useState(false);

  // Advanced settings (Backend Host configuration)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localBackendUrl, setLocalBackendUrl] = useState(backendUrl);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = React.useRef<ScrollView>(null);

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

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_IDS.webClientId,
    iosClientId: GOOGLE_CLIENT_IDS.iosClientId,
    androidClientId: GOOGLE_CLIENT_IDS.androidClientId,
    redirectUri: AuthSession.makeRedirectUri({
      preferLocalhost: false,
    }),
  });

  const handleFirebaseExchange = async (googleIdToken: string) => {
    setIsLoading(true);
    try {
      const firebaseApiKey = GOOGLE_CLIENT_IDS.firebaseApiKey;
      if (!firebaseApiKey || firebaseApiKey.startsWith('YOUR_')) {
        throw new Error('Chưa cấu hình Firebase API Key để đổi token Google thực.');
      }

      const firebaseRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${firebaseApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postBody: `${googleIdToken.startsWith('ya29.') ? 'access_token' : 'id_token'}=${googleIdToken}&providerId=google.com`,
            requestUri: 'http://localhost',
            returnIdToken: true,
            returnSecureToken: true,
          }),
        }
      );

      if (!firebaseRes.ok) {
        const errData = await firebaseRes.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Không thể đổi token với Firebase');
      }

      const firebaseData = await firebaseRes.json();
      const firebaseIdToken = firebaseData.idToken;
      const userEmail = firebaseData.email;
      const userName = firebaseData.displayName || 'Google User';

      const success = await loginWithGoogle(firebaseIdToken, { email: userEmail, name: userName });
      if (success) {
        console.log('Real Google Sign-In Successful!');
      }
    } catch (err: any) {
      console.error('Firebase OAuth exchange error:', err);
      Alert.alert('Lỗi đăng nhập Google', err.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (response?.type === 'success' && response.authentication) {
      const { idToken, accessToken } = response.authentication;
      const tokenToExchange = idToken || accessToken;
      if (tokenToExchange) {
        handleFirebaseExchange(tokenToExchange);
      } else {
        Alert.alert('Lỗi', 'Đăng nhập Google thành công nhưng không lấy được token. Vui lòng kiểm tra lại cấu hình Client ID.');
      }
    }
  }, [response]);

  const handleGooglePress = () => {
    const isMock =
      !GOOGLE_CLIENT_IDS.firebaseApiKey ||
      GOOGLE_CLIENT_IDS.firebaseApiKey.startsWith('YOUR_') ||
      !GOOGLE_CLIENT_IDS.webClientId ||
      GOOGLE_CLIENT_IDS.webClientId.startsWith('YOUR_');

    if (isMock) {
      Alert.alert(
        'Cấu hình Google Sign-In',
        'Ứng dụng chưa được cấu hình Client ID thật từ Google Console & Firebase API Key.\n\nBạn có muốn dùng tài khoản Google giả lập để chạy thử (không cần API Key), hay xem hướng dẫn cấu hình?',
        [
          {
            text: 'Dùng tài khoản giả lập',
            onPress: () => {
              setIsCustomGoogle(false);
              setCustomGoogleEmail('');
              setCustomGoogleName('');
              setShowGoogleModal(true);
            }
          },
          {
            text: 'Hướng dẫn cấu hình',
            onPress: () => {
              Alert.alert(
                'Hướng dẫn cấu hình Client ID',
                '1. Truy cập Firebase Console và copy Web API Key trong Project Settings.\n2. Truy cập Google Cloud Console tạo 3 Client IDs: Web Application (cho Web/Firebase), iOS (cho iOS), Android (cho Android).\n3. Mở file "src/components/auth-screen.tsx" và cập nhật thông số vào đối tượng "GOOGLE_CLIENT_IDS".'
              );
            }
          },
          {
            text: 'Hủy',
            style: 'cancel'
          }
        ]
      );
    } else {
      console.log('--- EXPO PROXY REDIRECT URI ---');
      console.log(request?.redirectUri);
      console.log('-------------------------------');
      promptAsync();
    }
  };

  React.useEffect(() => {
    setLocalBackendUrl(backendUrl);
  }, [backendUrl]);

  const handleSubmit = async () => {
    const cleanUsername = username.trim();
    const cleanPassword = password;

    if (isLogin) {
      if (!cleanUsername || !cleanPassword) {
        Alert.alert('Thông báo', 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
        return;
      }
    } else {
      const cleanEmailOrPhone = emailOrPhone.trim();
      const cleanConfirmPassword = confirmPassword;

      if (!cleanUsername || !cleanEmailOrPhone || !cleanPassword || !cleanConfirmPassword) {
        Alert.alert('Thông báo', 'Vui lòng điền đầy đủ tất cả các trường.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmailOrPhone)) {
        Alert.alert('Thông báo', 'Định dạng Email không hợp lệ.');
        return;
      }

      if (cleanPassword !== cleanConfirmPassword) {
        Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    setIsLoading(true);
    // Save backend url only if changed to avoid triggering unnecessary context re-renders during request execution
    if (localBackendUrl && localBackendUrl.trim() !== backendUrl) {
      saveBackendUrl(localBackendUrl);
    }

    try {
      if (isLogin) {
        const success = await login(cleanUsername, cleanPassword);
        if (success) {
          console.log('Login successful!');
        }
      } else {
        const res = await sendRegisterOtp(cleanUsername, emailOrPhone.trim(), cleanPassword);
        if (res.success) {
          setIsOtpRegister(true);
          setRegisterDevOtp(res.devOtp);
          if (res.devOtp) {
            Alert.alert(
              'Xác thực OTP (Test)',
              `Mã OTP của bạn là: ${res.devOtp}\n\n(Hệ thống tự động trả mã về máy khách do chạy thử)`
            );
          } else {
            Alert.alert('Gửi mã OTP', res.message);
          }
        }
      }
    } catch (e: any) {
      const friendly = getFriendlyAuthErrorMessage(e, isLogin ? 'đăng nhập' : 'đăng ký');
      Alert.alert(friendly.title, friendly.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRegisterOtp = async () => {
    const cleanOtp = registerOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ mã OTP 6 số.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await verifyRegisterOtp(emailOrPhone.trim(), cleanOtp);
      if (success) {
        Alert.alert('Thành công', 'Đăng ký tài khoản thành công!');
        setIsOtpRegister(false);
        setRegisterOtp('');
        setRegisterDevOtp(undefined);
      }
    } catch (e: any) {
      const friendly = getFriendlyAuthErrorMessage(e, 'xác thực OTP đăng ký');
      Alert.alert(friendly.title, friendly.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRegisterOtp = () => {
    setIsOtpRegister(false);
    setRegisterOtp('');
    setRegisterDevOtp(undefined);
  };

  const handleSendForgotPasswordOtp = async () => {
    const target = resetUsernameOrEmail.trim();
    if (!target) {
      Alert.alert('Thông báo', 'Vui lòng điền tên đăng nhập hoặc Email.');
      return;
    }

    setIsLoading(true);
    if (localBackendUrl && localBackendUrl.trim() !== backendUrl) {
      saveBackendUrl(localBackendUrl);
    }
    try {
      const res = await sendForgotPasswordOtp(target);
      if (res.success) {
        setIsOtpReset(true);
        setVerifiedEmailOrPhone(res.emailOrPhone || target);
        setResetDevOtp(res.devOtp);
        if (res.devOtp) {
          Alert.alert(
            'Xác thực OTP (Test)',
            `Mã OTP của bạn là: ${res.devOtp}\n\n(Hệ thống tự động trả mã về máy khách do chạy thử)`
          );
        } else {
          Alert.alert('Gửi mã OTP', res.message);
        }
      } else {
        const friendly = getFriendlyAuthErrorMessage(res.message, 'gửi OTP khôi phục mật khẩu');
        Alert.alert(friendly.title, friendly.message);
      }
    } catch (e: any) {
      const friendly = getFriendlyAuthErrorMessage(e, 'gửi OTP khôi phục mật khẩu');
      Alert.alert(friendly.title, friendly.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyForgotPassword = async () => {
    const otp = resetOtp.trim();
    const newPass = resetNewPassword;
    const confirmPass = resetConfirmPassword;

    if (!otp || otp.length !== 6 || !newPass || !confirmPass) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ mã OTP và mật khẩu mới.');
      return;
    }

    if (newPass !== confirmPass) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await verifyForgotPasswordOtp(verifiedEmailOrPhone, otp, newPass);
      if (success) {
        Alert.alert('Thành công', 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
        setIsForgotPassword(false);
        setIsOtpReset(false);
        setResetOtp('');
        setResetDevOtp(undefined);
        setUsername(verifiedEmailOrPhone);
        setPassword(newPass);
        setResetUsernameOrEmail('');
        setResetNewPassword('');
        setResetConfirmPassword('');
      }
    } catch (e: any) {
      const friendly = getFriendlyAuthErrorMessage(e, 'đặt lại mật khẩu');
      Alert.alert(friendly.title, friendly.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelResetOtp = () => {
    setIsOtpReset(false);
    setResetOtp('');
    setResetDevOtp(undefined);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, width: '100%' }}
      >
        <ScrollView 
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Header/Logo */}
          <View style={styles.headerContainer}>
            <ThemedView type="backgroundElement" style={[styles.logoCircle, { backgroundColor: theme.primary + '15' }]}>
              <ThemedText style={[styles.logoText, { color: theme.primary }]}>🏋️‍♂️</ThemedText>
            </ThemedView>
            <ThemedText type="subtitle" style={styles.appName}>BodyFit</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.appSub}>
              Huấn luyện viên dinh dưỡng & thể hình thông minh
            </ThemedText>
          </View>

          {/* Tab Selection */}
          <ThemedView type="backgroundElement" style={styles.tabContainer}>
            <Pressable
              onPress={() => setIsLogin(true)}
              style={[styles.tabButton, isLogin && [styles.activeTabButton, { backgroundColor: theme.backgroundSelected }]]}
            >
              <ThemedText type="smallBold" style={isLogin ? { color: theme.primary } : { color: theme.textSecondary }}>
                Đăng nhập
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setIsLogin(false)}
              style={[styles.tabButton, !isLogin && [styles.activeTabButton, { backgroundColor: theme.backgroundSelected }]]}
            >
              <ThemedText type="smallBold" style={!isLogin ? { color: theme.primary } : { color: theme.textSecondary }}>
                Đăng ký
              </ThemedText>
            </Pressable>
          </ThemedView>

          {/* Auth Card / Form */}
          <ThemedView type="backgroundElement" style={styles.formCard}>
            {isForgotPassword ? (
              // --- FORGOT PASSWORD PANEL ---
              isOtpReset ? (
                <>
                  <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.one }}>
                    Nhập mã OTP 6 số được gửi tới {verifiedEmailOrPhone} và mật khẩu mới của bạn:
                  </ThemedText>

                  <ThemedText type="smallBold" style={styles.label}>Mã xác thực OTP</ThemedText>
                  <TextInput
                    placeholder="Nhập mã OTP 6 số..."
                    placeholderTextColor={theme.textSecondary}
                    value={resetOtp}
                    onChangeText={setResetOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                  />

                  {resetDevOtp && (
                    <View style={{
                      backgroundColor: theme.primary + '10',
                      borderColor: theme.primary + '30',
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: Spacing.two,
                      alignItems: 'center'
                    }}>
                      <ThemedText style={{ color: theme.primary, fontSize: 13 }}>
                        💡 Mã OTP chạy thử (Dev/Console): <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 15 }}>{resetDevOtp}</ThemedText>
                      </ThemedText>
                    </View>
                  )}

                  <ThemedText type="smallBold" style={styles.label}>Mật khẩu mới</ThemedText>
                  <TextInput
                    placeholder="Nhập mật khẩu mới..."
                    placeholderTextColor={theme.textSecondary}
                    value={resetNewPassword}
                    onChangeText={setResetNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                  />

                  <ThemedText type="smallBold" style={styles.label}>Xác nhận mật khẩu mới</ThemedText>
                  <TextInput
                    placeholder="Nhập lại mật khẩu mới..."
                    placeholderTextColor={theme.textSecondary}
                    value={resetConfirmPassword}
                    onChangeText={setResetConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                  />

                  {isLoading ? (
                    <View style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: 0.8 }]}>
                      <ActivityIndicator color="#ffffff" size="small" />
                    </View>
                  ) : (
                    <Pressable
                      onPress={handleVerifyForgotPassword}
                      style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                    >
                      <ThemedText style={styles.btnText}>Xác nhận đặt lại mật khẩu</ThemedText>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={handleCancelResetOtp}
                    style={({ pressed }) => [
                      {
                        marginTop: Spacing.one,
                        alignItems: 'center',
                        paddingVertical: 4,
                        opacity: pressed ? 0.6 : 1
                      }
                    ]}
                  >
                    <ThemedText type="small" style={{ color: theme.primary, textDecorationLine: 'underline' }}>
                      Quay lại nhập Email
                    </ThemedText>
                  </Pressable>
                </>
              ) : (
                <>
                  <ThemedText type="smallBold" style={styles.label}>Tên đăng nhập hoặc Email</ThemedText>
                  <TextInput
                    placeholder="Nhập tên đăng nhập hoặc email..."
                    placeholderTextColor={theme.textSecondary}
                    value={resetUsernameOrEmail}
                    onChangeText={setResetUsernameOrEmail}
                    autoCapitalize="none"
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                  />

                  {isLoading ? (
                    <View style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: 0.8 }]}>
                      <ActivityIndicator color="#ffffff" size="small" />
                    </View>
                  ) : (
                    <Pressable
                      onPress={handleSendForgotPasswordOtp}
                      style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                    >
                      <ThemedText style={styles.btnText}>Gửi mã OTP đặt lại mật khẩu</ThemedText>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => setIsForgotPassword(false)}
                    style={({ pressed }) => [
                      {
                        marginTop: Spacing.one,
                        alignItems: 'center',
                        paddingVertical: 4,
                        opacity: pressed ? 0.6 : 1
                      }
                    ]}
                  >
                    <ThemedText type="small" style={{ color: theme.primary, textDecorationLine: 'underline' }}>
                      Quay lại Đăng nhập
                    </ThemedText>
                  </Pressable>
                </>
              )
            ) : (
              // --- LOGIN & REGISTER PANELS ---
              isOtpRegister ? (
                // --- REGISTER OTP PANEL ---
                <>
                  <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.one }}>
                    Một mã OTP 6 số đã được gửi tới: <ThemedText type="smallBold" style={{ color: theme.text }}>{emailOrPhone}</ThemedText>
                  </ThemedText>

                  <ThemedText type="smallBold" style={styles.label}>Nhập mã xác thực OTP</ThemedText>
                  <TextInput
                    placeholder="Nhập mã OTP 6 số..."
                    placeholderTextColor={theme.textSecondary}
                    value={registerOtp}
                    onChangeText={setRegisterOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                  />

                  {registerDevOtp && (
                    <View style={{
                      backgroundColor: theme.primary + '10',
                      borderColor: theme.primary + '30',
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: Spacing.two,
                      alignItems: 'center'
                    }}>
                      <ThemedText style={{ color: theme.primary, fontSize: 13 }}>
                        💡 Mã OTP chạy thử (Dev/Console): <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 15 }}>{registerDevOtp}</ThemedText>
                      </ThemedText>
                    </View>
                  )}

                  {isLoading ? (
                    <View style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: 0.8 }]}>
                      <ActivityIndicator color="#ffffff" size="small" />
                    </View>
                  ) : (
                    <Pressable
                      onPress={handleVerifyRegisterOtp}
                      style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                    >
                      <ThemedText style={styles.btnText}>Xác minh & Hoàn tất Đăng ký</ThemedText>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={handleCancelRegisterOtp}
                    style={({ pressed }) => [
                      {
                        marginTop: Spacing.one,
                        alignItems: 'center',
                        paddingVertical: 4,
                        opacity: pressed ? 0.6 : 1
                      }
                    ]}
                  >
                    <ThemedText type="small" style={{ color: theme.primary, textDecorationLine: 'underline' }}>
                      Quay lại thay đổi thông tin
                    </ThemedText>
                  </Pressable>
                </>
              ) : (
                // --- NORMAL LOGIN OR REGISTER FIELDS ---
                <>
                  <ThemedText type="smallBold" style={styles.label}>Tên đăng nhập</ThemedText>
                  <TextInput
                    placeholder="Nhập tên đăng nhập..."
                    placeholderTextColor={theme.textSecondary}
                    value={username}
                    
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                  />

                  {!isLogin && (
                    <>
                      <ThemedText type="smallBold" style={styles.label}>Email</ThemedText>
                      <TextInput
                        placeholder="nhap.email@example.com"
                        placeholderTextColor={theme.textSecondary}
                        value={emailOrPhone}
                        onChangeText={setEmailOrPhone}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                      />
                    </>
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ThemedText type="smallBold" style={styles.label}>Mật khẩu</ThemedText>
                    {isLogin && (
                      <Pressable onPress={() => setIsForgotPassword(true)}>
                        <ThemedText type="small" style={{ color: theme.primary, textDecorationLine: 'underline', marginBottom: Spacing.half }}>
                          Quên mật khẩu?
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                  <TextInput
                    placeholder="Nhập mật khẩu..."
                    placeholderTextColor={theme.textSecondary}
                    value={password}
                    
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                  />

                  {!isLogin && (
                    <>
                      <ThemedText type="smallBold" style={styles.label}>Xác nhận mật khẩu</ThemedText>
                      <TextInput
                        placeholder="Nhập lại mật khẩu..."
                        placeholderTextColor={theme.textSecondary}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                      />
                    </>
                  )}

                  {isLoading ? (
                    <View style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: 0.8 }]}>
                      <ActivityIndicator color="#ffffff" size="small" />
                    </View>
                  ) : (
                    <Pressable
                      onPress={handleSubmit}
                      style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                    >
                      <ThemedText style={styles.btnText}>
                        {isLogin ? 'Đăng nhập vào hệ thống' : 'Đăng ký tài khoản mới'}
                      </ThemedText>
                    </Pressable>
                  )}

                  <View style={styles.dividerContainer}>
                    <View style={[styles.dividerLine, { backgroundColor: theme.textSecondary }]} />
                    <ThemedText style={styles.dividerText} themeColor="textSecondary">hoặc</ThemedText>
                    <View style={[styles.dividerLine, { backgroundColor: theme.textSecondary }]} />
                  </View>

                  <Pressable
                    onPress={handleGooglePress}
                    style={({ pressed }) => [
                      styles.googleBtn,
                      {
                        borderColor: theme.backgroundSelected,
                        backgroundColor: pressed ? theme.backgroundSelected : theme.background
                      }
                    ]}
                  >
                    <View style={styles.googleLogo}>
                      <ThemedText style={styles.googleLetter}>G</ThemedText>
                    </View>
                    <ThemedText style={[styles.googleBtnText, { color: theme.text }]}>
                      Đăng nhập bằng Google
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setIsCustomGoogle(false);
                      setShowGoogleModal(true);
                    }}
                    style={({ pressed }) => [
                      {
                        marginTop: Spacing.one,
                        alignItems: 'center',
                        paddingVertical: 4,
                        opacity: pressed ? 0.6 : 1
                      }
                    ]}
                  >
                    <ThemedText type="small" style={{ color: theme.primary, textDecorationLine: 'underline' }}>
                      Hoặc dùng tài khoản giả lập để kiểm thử trên Expo Go
                    </ThemedText>
                  </Pressable>
                </>
              )
            )}
          </ThemedView>

          {/* Advanced Server Configuration */}
          <View style={styles.advancedWrapper}>
            <Pressable onPress={() => setShowAdvanced(!showAdvanced)} style={styles.advancedHeader}>
              <ThemedText type="code" themeColor="textSecondary">
                {showAdvanced ? '▼ Ẩn cấu hình máy chủ' : '▶ Cấu hình máy chủ kết nối'}
              </ThemedText>
            </Pressable>

            {showAdvanced && (
              <ThemedView type="backgroundElement" style={styles.advancedCard}>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.one }}>
                  Thiết lập địa chỉ IP máy chủ (NestJS API) của bạn. Mặc định là localhost cho máy ảo, hoặc nhập IP mạng nội bộ (ví dụ: http://192.168.1.15:3000) khi chạy trên điện thoại thật.
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <TextInput
                    placeholder="http://localhost:3000"
                    placeholderTextColor={theme.textSecondary}
                    value={localBackendUrl}
                    onChangeText={setLocalBackendUrl}
                    autoCapitalize="none"
                    style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background, marginBottom: 0 }]}
                  />
                  <Pressable
                    onPress={() => {
                      const hostUri = Constants.expoConfig?.hostUri;
                      if (hostUri) {
                        const ip = hostUri.split(':')[0];
                        setLocalBackendUrl(`http://${ip}:3000`);
                      } else {
                        setLocalBackendUrl('http://192.168.69.242:3000');
                      }
                    }}
                    style={({ pressed }) => [
                      {
                        backgroundColor: theme.backgroundSelected,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        opacity: pressed ? 0.8 : 1,
                      }
                    ]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.primary }}>Tự động IP</ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Account Picker Modal */}
      <Modal
        visible={showGoogleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView type="backgroundElement" style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Đăng nhập bằng Google</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.modalSubtitle}>
              Chọn một tài khoản Google giả lập bên dưới để tiếp tục trải nghiệm BodyFit
            </ThemedText>

            {!isCustomGoogle ? (
              <ScrollView style={styles.accountsList} contentContainerStyle={{ gap: 10 }}>
                {[
                  { name: 'Lê Minh Hùng', email: 'hung.le@gmail.com', avatar: '👨‍💻' },
                  { name: 'Trần Thảo', email: 'thao.tran@gmail.com', avatar: '👩‍💻' },
                  { name: 'Nguyễn Văn Đạt', email: 'dat.nguyen@gmail.com', avatar: '🏋️‍♂️' },
                  { name: 'Phạm Thị Mai', email: 'mai.pham@gmail.com', avatar: '🧘‍♀️' },
                ].map((acc) => (
                  <Pressable
                    key={acc.email}
                    onPress={async () => {
                      setShowGoogleModal(false);
                      setIsLoading(true);
                      const mockToken = `mock-token:google:${acc.email.trim().toLowerCase()}:${encodeURIComponent(acc.name.trim())}`;
                      const success = await loginWithGoogle(mockToken, { email: acc.email, name: acc.name });
                      setIsLoading(false);
                      if (success) {
                        console.log('Google login success for', acc.email);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.accountItem,
                      { borderColor: theme.backgroundSelected, backgroundColor: pressed ? theme.backgroundSelected : theme.background }
                    ]}
                  >
                    <View style={styles.avatarWrap}>
                      <ThemedText style={{ fontSize: 20 }}>{acc.avatar}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">{acc.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">{acc.email}</ThemedText>
                    </View>
                  </Pressable>
                ))}

                <Pressable
                  onPress={() => setIsCustomGoogle(true)}
                  style={({ pressed }) => [
                    styles.accountItem,
                    styles.otherAccountItem,
                    { borderColor: theme.backgroundSelected, backgroundColor: pressed ? theme.backgroundSelected : theme.background }
                  ]}
                >
                  <View style={styles.avatarWrap}>
                    <ThemedText style={{ fontSize: 20 }}>➕</ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>Sử dụng tài khoản khác...</ThemedText>
                </Pressable>
              </ScrollView>
            ) : (
              <View style={styles.customForm}>
                <ThemedText type="smallBold" style={styles.label}>Họ và tên</ThemedText>
                <TextInput
                  placeholder="Nhập họ và tên..."
                  placeholderTextColor={theme.textSecondary}
                  value={customGoogleName}
                  onChangeText={setCustomGoogleName}
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background, marginBottom: Spacing.two }]}
                />

                <ThemedText type="smallBold" style={styles.label}>Địa chỉ Email</ThemedText>
                <TextInput
                  placeholder="email@gmail.com"
                  placeholderTextColor={theme.textSecondary}
                  value={customGoogleEmail}
                  onChangeText={setCustomGoogleEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background, marginBottom: Spacing.two }]}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <Pressable
                    onPress={() => setIsCustomGoogle(false)}
                    style={[styles.modalBtn, { backgroundColor: theme.backgroundSelected, flex: 1 }]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.text }}>Quay lại</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      if (!customGoogleEmail || !customGoogleName) {
                        Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin.');
                        return;
                      }
                      if (!customGoogleEmail.includes('@') || !customGoogleEmail.includes('.')) {
                        Alert.alert('Thông báo', 'Địa chỉ email không đúng định dạng.');
                        return;
                      }
                      setShowGoogleModal(false);
                      setIsCustomGoogle(false);
                      setIsLoading(true);
                      const mockToken = `mock-token:google:${customGoogleEmail.trim().toLowerCase()}:${encodeURIComponent(customGoogleName.trim())}`;
                      await loginWithGoogle(mockToken, { email: customGoogleEmail, name: customGoogleName });
                      setIsLoading(false);
                    }}
                    style={[styles.modalBtn, { backgroundColor: theme.primary, flex: 1 }]}
                  >
                    <ThemedText type="smallBold" style={{ color: '#ffffff' }}>Xác nhận</ThemedText>
                  </Pressable>
                </View>
              </View>
            )}

            <Pressable
              onPress={() => {
                setShowGoogleModal(false);
                setIsCustomGoogle(false);
              }}
              style={[styles.closeBtn, { backgroundColor: theme.backgroundSelected }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>Hủy bỏ</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
    maxWidth: 460,
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: Spacing.three,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  logoText: {
    fontSize: 32,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  appSub: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.one,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTabButton: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  formCard: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.two,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.15)',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: Spacing.half,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  submitBtn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  advancedWrapper: {
    marginTop: Spacing.two,
  },
  advancedHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  advancedCard: {
    borderRadius: 8,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.one,
    justifyContent: 'center',
    gap: 10,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 14,
    opacity: 0.6,
  },
  googleBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: Spacing.half,
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  googleLetter: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.one,
  },
  accountsList: {
    maxHeight: 250,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  otherAccountItem: {
    borderStyle: 'dashed',
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customForm: {
    gap: Spacing.one,
  },
  modalBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
});
