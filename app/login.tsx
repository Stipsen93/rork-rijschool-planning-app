import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Car, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/components/auth/AuthStore";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [obscurePassword, setObscurePassword] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [emailFocused, setEmailFocused] = useState<boolean>(false);
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const { login } = useAuth();
  const isMountedRef = useRef(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const formSlideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      isMountedRef.current = false;
    };
  }, [fadeAnim, slideAnim, logoScaleAnim, formSlideAnim]);

  useEffect(() => {
    Animated.timing(emailBorderAnim, {
      toValue: emailFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused, emailBorderAnim]);

  useEffect(() => {
    Animated.timing(passwordBorderAnim, {
      toValue: passwordFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused, passwordBorderAnim]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Validatiefout", "Vul alle velden in");
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsSubmitting(true);
    console.log('[LoginScreen] Starting login...');
    
    try {
      const result = await login(email.trim(), password.trim());

      if (!result.success) {
        console.log('[LoginScreen] ✗ Login failed:', result.error);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert('Inloggen mislukt', result.error || 'Onbekende fout');
        return;
      }

      console.log('[LoginScreen] ✓ Login success, navigating...');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/(tabs)/overview');
    } catch (error) {
      console.error('[LoginScreen] ✗ Unexpected error:', error);
      Alert.alert('Fout', 'Er is een onverwachte fout opgetreden');
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const emailBorderColor = emailBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e5e7eb', '#2563EB'],
  });

  const passwordBorderColor = passwordBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e5e7eb', '#2563EB'],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.backgroundGradient}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 48,
            paddingBottom: insets.bottom + 24,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.headerSection,
            {
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Car color="#2563EB" size={56} strokeWidth={2.5} />
          </View>
          <Text style={styles.appName}>Driveplannen</Text>
          <Text style={styles.subtitle}>Welkom terug</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.formSection,
            {
              transform: [{ translateY: formSlideAnim }],
            },
          ]}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mailadres</Text>
            <Animated.View
              style={[
                styles.inputContainer,
                { borderColor: emailBorderColor },
              ]}
            >
              <Mail color={emailFocused ? "#2563EB" : "#9ca3af"} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                testID="login-email-input"
                placeholder="jouw@email.nl"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isSubmitting}
              />
            </Animated.View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wachtwoord</Text>
            <Animated.View
              style={[
                styles.inputContainer,
                { borderColor: passwordBorderColor },
              ]}
            >
              <Lock color={passwordFocused ? "#2563EB" : "#9ca3af"} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                testID="login-password-input"
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={obscurePassword}
                autoComplete="password"
                editable={!isSubmitting}
              />
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                  setObscurePassword(!obscurePassword);
                }}
                style={styles.eyeIcon}
                disabled={isSubmitting}
              >
                {obscurePassword ? (
                  <Eye color="#9ca3af" size={20} />
                ) : (
                  <EyeOff color="#9ca3af" size={20} />
                )}
              </Pressable>
            </Animated.View>
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <Pressable
              style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
              testID="login-submit-button"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Inloggen</Text>
              )}
            </Pressable>
          </Animated.View>

          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Nog geen account? </Text>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                router.push('/register');
              }}
              disabled={isSubmitting}
            >
              <Text style={styles.registerLink}>Registreren</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0f172a",
  },
  circle: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.15,
  },
  circle1: {
    width: 400,
    height: 400,
    top: -150,
    right: -100,
    backgroundColor: "#3b82f6",
  },
  circle2: {
    width: 300,
    height: 300,
    bottom: -100,
    left: -50,
    backgroundColor: "#8b5cf6",
  },
  circle3: {
    width: 200,
    height: 200,
    top: "40%",
    left: "50%",
    backgroundColor: "#06b6d4",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  headerSection: {
    alignItems: "center",
    gap: 12,
    marginBottom: 56,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#334155",
  },
  appName: {
    fontSize: 40,
    fontWeight: "800" as const,
    color: "#ffffff",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    color: "#94a3b8",
    marginTop: 4,
    fontWeight: "500" as const,
  },
  formSection: {
    gap: 24,
  },
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#e2e8f0",
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500" as const,
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: "#1e3a5f",
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  registerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  registerText: {
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "500" as const,
  },
  registerLink: {
    fontSize: 15,
    color: "#60a5fa",
    fontWeight: "700" as const,
  },
});
