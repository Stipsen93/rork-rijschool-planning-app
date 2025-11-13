import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Car, GraduationCap, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/components/auth/AuthStore";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleInstructorPress = () => {
    router.replace('/(tabs)/overview');
  };

  const handleStudentPress = async () => {
    setIsLoading(true);
    try {
      const result = await login('student1@example.com', 'password123');
      
      if (result.success) {
        router.replace('/(student-tabs)/student-overview');
      } else {
        Alert.alert('Inloggen mislukt', result.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Inloggen mislukt', 'Er is een fout opgetreden bij het inloggen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Car color="#2563EB" size={56} strokeWidth={2} />
          </View>
          <Text style={styles.appName}>DrivePlan</Text>
          <Text style={styles.subtitle}>Selecteer je rol</Text>
        </View>

        <View style={styles.buttonsSection}>
          <TouchableOpacity
            style={styles.roleButton}
            onPress={handleInstructorPress}
            testID="instructor-button"
          >
            <View style={styles.roleIconContainer}>
              <GraduationCap color="#2563EB" size={32} strokeWidth={2} />
            </View>
            <Text style={styles.roleButtonTitle}>Instructeur</Text>
            <Text style={styles.roleButtonSubtitle}>Ga naar instructeur omgeving</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleButton}
            onPress={handleStudentPress}
            disabled={isLoading}
            testID="student-button"
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#2563EB" />
            ) : (
              <>
                <View style={styles.roleIconContainer}>
                  <User color="#2563EB" size={32} strokeWidth={2} />
                </View>
                <Text style={styles.roleButtonTitle}>Student</Text>
                <Text style={styles.roleButtonSubtitle}>Inloggen als Emma Jansen</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  headerSection: {
    alignItems: "center",
    gap: 12,
    marginBottom: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: "#2563EB",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: "#6b7280",
    marginTop: 4,
  },
  buttonsSection: {
    gap: 16,
  },
  roleButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  roleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  roleButtonTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 4,
  },
  roleButtonSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
});
