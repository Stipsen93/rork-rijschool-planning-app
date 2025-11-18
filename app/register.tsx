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
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
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
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@/components/auth/AuthStore";

const monthNames = [
  "januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december",
] as const;
const weekDays = ["Ma","Di","Wo","Do","Vr","Za","Zo"] as const;

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

interface WebDatePickerModalProps {
  visible: boolean;
  value: Date | null;
  onClose: () => void;
  onSelect: (date: Date) => void;
  maximumDate?: Date;
}

function WebDatePickerModal({ visible, value, onClose, onSelect, maximumDate }: WebDatePickerModalProps) {
  const [cursor, setCursor] = React.useState<Date>(startOfMonth(value || new Date()));
  const [showYearPicker, setShowYearPicker] = React.useState<boolean>(false);
  const today = new Date();
  
  const days: { date: Date; inMonth: boolean }[] = React.useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const startWeekDay = (start.getDay() + 6) % 7;
    const totalDays = end.getDate();
    const arr: { date: Date; inMonth: boolean }[] = [];
    
    for (let i = 0; i < startWeekDay; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() - (startWeekDay - i));
      arr.push({ date: d, inMonth: false });
    }
    
    for (let i = 1; i <= totalDays; i++) {
      arr.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), i), inMonth: true });
    }
    
    const trailing = (7 - (arr.length % 7)) % 7;
    for (let i = 1; i <= trailing; i++) {
      const d = new Date(end);
      d.setDate(end.getDate() + i);
      arr.push({ date: d, inMonth: false });
    }
    
    return arr;
  }, [cursor]);

  const yearRange = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 100; year <= currentYear; year++) {
      years.push(year);
    }
    return years.reverse();
  }, []);

  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent>
      <View style={pickerStyles.modalBackdrop}>
        <View style={pickerStyles.modalCard}>
          <View style={pickerStyles.modalHeader}>
            <Text style={pickerStyles.modalTitle}>Kies datum</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={pickerStyles.pickerWrap}>
            <View style={pickerStyles.calendarHeader}>
              <TouchableOpacity onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft size={18} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowYearPicker(true)}>
                <Text style={pickerStyles.calendarHeaderTitle}>
                  {monthNames[cursor.getMonth()]} {cursor.getFullYear()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight size={18} color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={pickerStyles.weekRow}>
              {weekDays.map((w) => (
                <Text key={w} style={pickerStyles.weekCell}>{w}</Text>
              ))}
            </View>
            <View style={pickerStyles.daysGrid}>
              {days.map(({ date, inMonth }) => {
                const isToday = date.toDateString() === new Date(today.getFullYear(), today.getMonth(), today.getDate()).toDateString();
                const isSelected = value && date.toDateString() === new Date(value.getFullYear(), value.getMonth(), value.getDate()).toDateString();
                const isFuture = maximumDate && date > maximumDate;
                const isDisabled = !inMonth || isFuture;
                
                return (
                  <Pressable
                    key={date.toISOString()}
                    onPress={() => !isDisabled && onSelect(date)}
                    disabled={isDisabled}
                    style={[pickerStyles.dayCell, isDisabled && pickerStyles.dayCellOutside, isSelected && pickerStyles.daySelected]}
                  >
                    <Text style={[pickerStyles.dayText, isDisabled && pickerStyles.dayTextOutside, isSelected && pickerStyles.dayTextSelected]}>
                      {date.getDate()}
                    </Text>
                    {isToday && !isSelected && <View style={pickerStyles.todayDot} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
          {showYearPicker && (
            <Modal visible animationType="fade" transparent>
              <View style={pickerStyles.modalBackdrop}>
                <View style={pickerStyles.yearPickerCard}>
                  <View style={pickerStyles.modalHeader}>
                    <Text style={pickerStyles.modalTitle}>Kies jaar</Text>
                    <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                      <X size={20} color="#111827" />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={yearRange}
                    keyExtractor={(item) => `year-${item}`}
                    style={pickerStyles.yearList}
                    contentContainerStyle={pickerStyles.yearListContent}
                    renderItem={({ item }) => {
                      const isSelected = item === cursor.getFullYear();
                      return (
                        <Pressable
                          onPress={() => {
                            setCursor(new Date(item, cursor.getMonth(), 1));
                            setShowYearPicker(false);
                          }}
                          style={[pickerStyles.yearItem, isSelected && pickerStyles.yearItemSelected]}
                        >
                          <Text style={[pickerStyles.yearText, isSelected && pickerStyles.yearTextSelected]}>{item}</Text>
                        </Pressable>
                      );
                    }}
                  />
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}

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
  const [schoolName, setSchoolName] = useState<string>("");
  const [obscurePassword, setObscurePassword] = useState<boolean>(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState<boolean>(true);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();

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
    if (!schoolName.trim()) return "Rijschool naam is verplicht";
    if (!termsAccepted) return "Je moet de algemene voorwaarden accepteren om door te gaan";

    return null;
  };

  const handleRegister = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Validatiefout", error);
      return;
    }

    setIsSubmitting(true);
    const startTime = Date.now();
    console.log(`[Register:${Date.now() - startTime}ms] Starting registration...`);

    try {
      const result = await signup({
        email: email.trim(),
        password: password.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'instructor',
        phone: phone.trim(),
        birthDate: birthdate ? birthdate.toISOString().split('T')[0] : null,
        wrmNumber: certificationNumber.trim(),
        drivingSchoolName: schoolName.trim(),
      });

      console.log(`[Register:${Date.now() - startTime}ms] Registration result:`, result);

      if (!result.success) {
        const errorMsg = 'error' in result ? result.error : 'Onbekende fout';
        console.log(`[Register:${Date.now() - startTime}ms] ✗ Registration failed:`, errorMsg);
        Alert.alert('Registratie mislukt', errorMsg);
        setIsSubmitting(false);
        return;
      }

      console.log(`[Register:${Date.now() - startTime}ms] ✓ Registration success, navigating...`);
      router.replace('/(tabs)/overview');
      setIsSubmitting(false);
    } catch (error) {
      console.error(`[Register:${Date.now() - startTime}ms] ✗ Unexpected error:`, error);
      Alert.alert('Fout', 'Er is een onverwachte fout opgetreden');
      setIsSubmitting(false);
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
            disabled={isSubmitting}
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
                editable={!isSubmitting}
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
                editable={!isSubmitting}
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
                editable={!isSubmitting}
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
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Geboortedatum</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDatePicker(true)}
              disabled={isSubmitting}
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
          </View>

          {showDatePicker && (
            Platform.OS === "web" ? (
              <WebDatePickerModal
                visible={showDatePicker}
                value={birthdate}
                onClose={() => setShowDatePicker(false)}
                onSelect={(date) => {
                  setBirthdate(date);
                  setShowDatePicker(false);
                }}
                maximumDate={new Date()}
              />
            ) : (
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
            )
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
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rijschool naam</Text>
            <View style={styles.inputContainer}>
              <Building
                color="#9ca3af"
                size={20}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={schoolName}
                onChangeText={setSchoolName}
                placeholder="Voer je rijschool naam in"
                placeholderTextColor="#9ca3af"
                editable={!isSubmitting}
              />
            </View>
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
                editable={!isSubmitting}
              />
              <TouchableOpacity
                onPress={() => setObscurePassword(!obscurePassword)}
                style={styles.eyeIcon}
                disabled={isSubmitting}
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
                editable={!isSubmitting}
              />
              <TouchableOpacity
                onPress={() =>
                  setObscureConfirmPassword(!obscureConfirmPassword)
                }
                style={styles.eyeIcon}
                disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
            <Text style={styles.termsText}>
              Ik accepteer de <Text style={styles.termsLink}>Algemene Voorwaarden</Text> en het <Text style={styles.termsLink}>Privacybeleid</Text>
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            (!termsAccepted || isSubmitting) &&
              styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={!termsAccepted || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.registerButtonText}>Account aanmaken</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Heb je al een account? </Text>
          <TouchableOpacity onPress={() => router.back()} disabled={isSubmitting}>
            <Text style={styles.loginLink}>Inloggen</Text>
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
});

const pickerStyles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 4,
    paddingHorizontal: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  pickerWrap: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  calendarHeaderTitle: {
    fontWeight: "700" as const,
    color: "#111827",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#f3f4f6",
  },
  weekCell: {
    width: `${100 / 7}%`,
    textAlign: "center" as const,
    fontSize: 12,
    color: "#6b7280",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap" as const,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellOutside: {
    opacity: 0.35,
  },
  dayText: {
    color: "#111827",
    fontSize: 14,
  },
  dayTextOutside: {
    color: "#6b7280",
  },
  daySelected: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
  },
  dayTextSelected: {
    color: "#2563eb",
    fontWeight: "700" as const,
  },
  todayDot: {
    position: "absolute" as const,
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2563eb",
  },
  yearPickerCard: {
    width: "90%",
    maxWidth: 320,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    maxHeight: "70%",
  },
  yearList: {
    flexGrow: 0,
    maxHeight: 400,
  },
  yearListContent: {
    paddingVertical: 6,
  },
  yearItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center" as const,
  },
  yearItemSelected: {
    backgroundColor: "#eff6ff",
  },
  yearText: {
    fontSize: 18,
    color: "#111827",
  },
  yearTextSelected: {
    color: "#2563eb",
    fontWeight: "700" as const,
  },
});
