import React, { useState } from "react";
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
  Switch,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/components/auth/AuthStore";
import {
  Car,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  ArrowLeft,
  GraduationCap,
  Building,
  ChevronDown,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { trpc } from "@/lib/trpc";

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [certificationNumber, setCertificationNumber] = useState<string>("");
  const [selectedDrivingschool, setSelectedDrivingschool] = useState<{ id: string; name: string } | null>(null);
  const [showDrivingschoolPicker, setShowDrivingschoolPicker] = useState<boolean>(false);
  const [obscurePassword, setObscurePassword] = useState<boolean>(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState<boolean>(true);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();
  
  const drivingschoolsQuery = trpc.drivingschools.list.useQuery();
  const drivingschools = drivingschoolsQuery.data || [];

  const validateForm = (): string | null => {
    if (!firstName.trim()) return "Voornaam is verplicht";
    if (!lastName.trim()) return "Achternaam is verplicht";
    if (!email.trim()) return "E-mailadres is verplicht";
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) return "Ongeldig e-mailadres";
    if (!phone.trim()) return "Telefoonnummer is verplicht";
    if (!birthdate) return "Geboortedatum is verplicht";
    if (!password.trim()) return "Wachtwoord is verplicht";
    if (password.length < 8) return "Wachtwoord moet minimaal 8 karakters bevatten";
    if (!confirmPassword.trim()) return "Wachtwoord bevestiging is verplicht";
    if (password !== confirmPassword) return "Wachtwoorden komen niet overeen";
    if (!certificationNumber.trim()) return "WRM Pasnummer is verplicht";
    if (!/^\d+$/.test(certificationNumber)) return "WRM Pasnummer mag alleen cijfers bevatten";
    if (certificationNumber.length < 5) return "WRM Pasnummer moet minimaal 5 cijfers bevatten";
    if (!selectedDrivingschool) return "Rijschool is verplicht";
    if (!termsAccepted) return "Je moet de algemene voorwaarden accepteren om door te gaan";

    return null;
  };

  const handleRegister = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Validatiefout", error);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup(
        email.trim(),
        password.trim(),
        firstName.trim(),
        lastName.trim(),
        "instructor",
        phone.trim(),
        selectedDrivingschool!.id
      );

      if (!result.success) {
        Alert.alert(
          "Registratie mislukt",
          result.error || "Er is een fout opgetreden. Probeer het opnieuw.",
          [{ text: "OK" }]
        );
        return;
      }

      Alert.alert(
        "Registratie succesvol!",
        "Welkom bij DrivePlan!",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(tabs)/overview");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(
        "Registratie mislukt",
        "Er is een fout opgetreden. Probeer het opnieuw.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "Selecteer geboortedatum";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#1f2937" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Instructeur Registratie</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.logoSection}>
          <View style={styles.iconContainer}>
            <Car color="#2563EB" size={48} strokeWidth={2} />
          </View>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welkom bij Driveplannen</Text>
          <Text style={styles.welcomeSubtitle}>
            Maak een account aan om te beginnen met het beheren van je rijlessen en studenten.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Persoonlijke gegevens</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Voornaam</Text>
            <View style={styles.inputContainer}>
              <User color="#9ca3af" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Voer je voornaam in"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Achternaam</Text>
            <View style={styles.inputContainer}>
              <User color="#9ca3af" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Voer je achternaam in"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mailadres</Text>
            <View style={styles.inputContainer}>
              <Mail color="#9ca3af" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Voer je e-mailadres in"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefoonnummer</Text>
            <View style={styles.inputContainer}>
              <Phone color="#9ca3af" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Voer je telefoonnummer in"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Geboortedatum</Text>
            {Platform.OS === "web" ? (
              <View style={styles.inputContainer}>
                <Calendar color="#9ca3af" size={20} style={styles.inputIcon} />
                <input
                  type="date"
                  value={birthdate ? birthdate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value) : null;
                    setBirthdate(newDate);
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    flex: 1,
                    paddingTop: 14,
                    paddingBottom: 14,
                    fontSize: 16,
                    color: '#111827',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                  }}
                  placeholder="dd/mm/jjjj"
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar color="#9ca3af" size={20} style={styles.inputIcon} />
                <Text
                  style={[
                    styles.dateText,
                    !birthdate && styles.dateTextPlaceholder,
                  ]}
                >
                  {formatDate(birthdate)}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {showDatePicker && Platform.OS !== "web" && (
            <DateTimePicker
              value={birthdate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setBirthdate(selectedDate);
                }
              }}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructeur gegevens</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>WRM Pasnummer</Text>
            <View style={styles.inputContainer}>
              <GraduationCap
                color="#9ca3af"
                size={20}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={certificationNumber}
                onChangeText={(text) => {
                  const digitsOnly = text.replace(/\D/g, '');
                  setCertificationNumber(digitsOnly);
                }}
                placeholder="Voer je WRM pasnummer in"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rijschool</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDrivingschoolPicker(true)}
            >
              <Building
                color="#9ca3af"
                size={20}
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.pickerText,
                  !selectedDrivingschool && styles.pickerTextPlaceholder,
                ]}
              >
                {selectedDrivingschool ? selectedDrivingschool.name : "Selecteer je rijschool"}
              </Text>
              <ChevronDown color="#9ca3af" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wachtwoord</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wachtwoord</Text>
            <View style={styles.inputContainer}>
              <Lock color="#9ca3af" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Minimaal 8 karakters"
                placeholderTextColor="#9ca3af"
                secureTextEntry={obscurePassword}
                autoComplete="password"
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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bevestig wachtwoord</Text>
            <View style={styles.inputContainer}>
              <Lock color="#9ca3af" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Herhaal je wachtwoord"
                placeholderTextColor="#9ca3af"
                secureTextEntry={obscureConfirmPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() =>
                  setObscureConfirmPassword(!obscureConfirmPassword)
                }
                style={styles.eyeIcon}
              >
                {obscureConfirmPassword ? (
                  <Eye color="#9ca3af" size={20} />
                ) : (
                  <EyeOff color="#9ca3af" size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.termsSection}>
          <View style={styles.termsRow}>
            <Switch
              value={termsAccepted}
              onValueChange={setTermsAccepted}
              trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
              thumbColor={termsAccepted ? "#2563EB" : "#f3f4f6"}
            />
            <Text style={styles.termsText}>
              Ik accepteer de <Text style={styles.termsLink}>Algemene Voorwaarden</Text> en het <Text style={styles.termsLink}>Privacybeleid</Text>
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            (!termsAccepted || isLoading) &&
              styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={!termsAccepted || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.registerButtonText}>Account aanmaken</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Heb je al een account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>Inloggen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showDrivingschoolPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDrivingschoolPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDrivingschoolPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecteer Rijschool</Text>
              <TouchableOpacity
                onPress={() => setShowDrivingschoolPicker(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>Sluiten</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {drivingschoolsQuery.isLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator color="#2563EB" size="small" />
                </View>
              ) : (
                drivingschools.map((school) => (
                  <TouchableOpacity
                    key={school.id}
                    style={[
                      styles.modalItem,
                      selectedDrivingschool?.id === school.id &&
                        styles.modalItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedDrivingschool(school);
                      setShowDrivingschoolPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedDrivingschool?.id === school.id &&
                          styles.modalItemTextSelected,
                      ]}
                    >
                      {school.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
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
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  logoSection: {
    alignItems: "center",
    marginTop: 8,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  welcomeSection: {
    gap: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    textAlign: "left",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#111827",
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
  dateText: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  dateTextPlaceholder: {
    color: "#9ca3af",
  },
  termsSection: {
    marginTop: 8,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  termsLink: {
    color: "#2563EB",
    fontWeight: "600" as const,
  },
  registerButton: {
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
  registerButtonDisabled: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  loginSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
    color: "#6b7280",
  },
  loginLink: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600" as const,
  },
  pickerText: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  pickerTextPlaceholder: {
    color: "#9ca3af",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#111827",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: "#2563EB",
    fontWeight: "600" as const,
  },
  modalList: {
    paddingHorizontal: 24,
  },
  modalLoading: {
    paddingVertical: 32,
    alignItems: "center",
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: "#f9fafb",
  },
  modalItemSelected: {
    backgroundColor: "#dbeafe",
  },
  modalItemText: {
    fontSize: 16,
    color: "#111827",
  },
  modalItemTextSelected: {
    color: "#2563EB",
    fontWeight: "600" as const,
  },
});
