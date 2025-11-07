import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/components/auth/AuthStore";
import { Car, Mail, Lock, Eye, EyeOff, Touchpad } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DemoAccount = {
  role: string;
  email: string;
  password: string;
};

const demoAccounts: DemoAccount[] = [
  {
    role: "Instructeur",
    email: "instructor@example.com",
    password: "password123",
  },
  {
    role: "Leerling 1",
    email: "student1@example.com",
    password: "password123",
  },
  {
    role: "Leerling 2",
    email: "student2@example.com",
    password: "password123",
  },
];

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [obscurePassword, setObscurePassword] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, profile, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && profile) {
      if (profile.role === 'student') {
        router.replace('/(student-tabs)/student-overview');
      } else {
        router.replace('/(tabs)/overview');
      }
    }
  }, [isAuthenticated, profile, router]);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError("E-mailadres is verplicht");
      return false;
    }
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      setEmailError("Voer een geldig e-mailadres in");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError("Wachtwoord is verplicht");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleLogin = async () => {
    console.log("Starting login process for:", email.trim());

    const isEmailValid = validateEmail(email.trim());
    const isPasswordValid = validatePassword(password.trim());

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email.trim(), password.trim());

      if (!result.success) {
        Alert.alert(
          "Inloggen mislukt",
          result.error || "Controleer uw e-mailadres en wachtwoord.",
          [{ text: "OK" }]
        );
        return;
      }

      console.log("Login successful");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Inloggen mislukt",
        "Er is een fout opgetreden. Probeer het opnieuw.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccountPress = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setEmailError("");
    setPasswordError("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Car color="#2563EB" size={56} strokeWidth={2} />
          </View>
          <Text style={styles.appName}>DrivePlan</Text>
          <Text style={styles.title}>Welkom terug</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mailadres</Text>
            <View
              style={[
                styles.inputContainer,
                emailError ? styles.inputContainerError : null,
              ]}
            >
              <Mail
                color={emailError ? "#EF4444" : "#9ca3af"}
                size={20}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError("");
                }}
                placeholder="Voer E-mailadres in"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                testID="email-input"
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wachtwoord</Text>
            <View
              style={[
                styles.inputContainer,
                passwordError ? styles.inputContainerError : null,
              ]}
            >
              <Lock
                color={passwordError ? "#EF4444" : "#9ca3af"}
                size={20}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError("");
                }}
                placeholder="Voer Wachtwoord in"
                placeholderTextColor="#9ca3af"
                secureTextEntry={obscurePassword}
                autoComplete="password"
                testID="password-input"
              />
              <TouchableOpacity
                onPress={() => setObscurePassword(!obscurePassword)}
                style={styles.eyeIcon}
              >
                {obscurePassword ? (
                  <Eye color="#9ca3af" size={20} />
                ) : (
                  <EyeOff color="#9ca3af" size={20} />
                )}
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading ? styles.loginButtonDisabled : null,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            testID="login-button"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Inloggen</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Demo Inloggegevens</Text>
          {demoAccounts.map((account, index) => (
            <TouchableOpacity
              key={index}
              style={styles.demoCard}
              onPress={() => handleDemoAccountPress(account)}
              testID={`demo-account-${index}`}
            >
              <View style={styles.demoContent}>
                <Text style={styles.demoRole}>{account.role}</Text>
                <Text style={styles.demoEmail}>{account.email}</Text>
                <Text style={styles.demoPassword}>
                  Wachtwoord: {account.password}
                </Text>
              </View>
              <Touchpad color="#2563EB" size={24} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Nog geen account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}>Registreren</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 32,
  },
  headerSection: {
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#2563EB",
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 18,
    color: "#6b7280",
    marginTop: 4,
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#1f2937",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputContainerError: {
    borderColor: "#EF4444",
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  demoSection: {
    gap: 12,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2563EB",
    marginBottom: 4,
  },
  demoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 16,
  },
  demoContent: {
    flex: 1,
    gap: 4,
  },
  demoRole: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  demoEmail: {
    fontSize: 12,
    color: "#6b7280",
  },
  demoPassword: {
    fontSize: 12,
    color: "#6b7280",
  },
  registerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: "#6b7280",
  },
  registerLink: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600" as const,
  },
});
