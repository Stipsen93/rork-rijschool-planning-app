import React, { useCallback, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CalendarDays, Camera, User, X } from "lucide-react-native";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { trpc } from "@/lib/trpc";

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

interface CalendarPickerProps {
  initialDate: Date;
  onSelectDate: (d: Date | null) => void;
  testID?: string;
  maximumDate?: Date;
}

function CalendarPicker({ initialDate, onSelectDate, testID, maximumDate }: CalendarPickerProps) {
  const [cursor, setCursor] = useState<Date>(startOfMonth(initialDate));
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

  return (
    <View testID={testID}>
      <View style={calendarStyles.calendarHeader}>
        <TouchableOpacity 
          accessibilityRole="button" 
          onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          <Text style={calendarStyles.navText}>←</Text>
        </TouchableOpacity>
        <Text style={calendarStyles.calendarHeaderTitle}>
          {monthNames[cursor.getMonth()]} {cursor.getFullYear()}
        </Text>
        <TouchableOpacity 
          accessibilityRole="button" 
          onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          <Text style={calendarStyles.navText}>→</Text>
        </TouchableOpacity>
      </View>
      <View style={calendarStyles.weekRow}>
        {weekDays.map((w) => (
          <Text key={w} style={calendarStyles.weekCell}>{w}</Text>
        ))}
      </View>
      <View style={calendarStyles.daysGrid}>
        {days.map(({ date, inMonth }) => {
          const isToday = date.toDateString() === new Date(today.getFullYear(), today.getMonth(), today.getDate()).toDateString();
          const isSelected = date.toDateString() === new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()).toDateString();
          const isFuture = maximumDate && date > maximumDate;
          const isDisabled = !inMonth || isFuture;
          
          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => !isDisabled && onSelectDate(date)}
              disabled={isDisabled}
              style={[calendarStyles.dayCell, isDisabled && calendarStyles.dayCellOutside, isSelected && calendarStyles.daySelected]}
              testID={`day-${date.getDate()}`}
            >
              <Text style={[calendarStyles.dayText, isDisabled && calendarStyles.dayTextOutside, isSelected && calendarStyles.dayTextSelected]}>
                {date.getDate()}
              </Text>
              {isToday && !isSelected && <View style={calendarStyles.todayDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
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
  navText: {
    fontSize: 20,
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
    width: `${100 / 7}%` as any,
    textAlign: "center" as const,
    fontSize: 12,
    color: "#6b7280",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%` as any,
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
    position: "absolute",
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2563eb",
  },
});

export default function StudentPersonalInfoScreen() {
  const insets = useSafeAreaInsets();

  
  const profileQuery = trpc.students.profile.useQuery();
  const updateMutation = trpc.students.updateProfile.useMutation();
  
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [parentName, setParentName] = useState<string>("");
  const [parentPhone, setParentPhone] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  React.useEffect(() => {
    if (profileQuery.data) {
      const profile = profileQuery.data;
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setBirthDate(profile.birth_date || "");
      setEmail(profile.email || "");
      setAddress(profile.address || "");
      setPhone(profile.phone || "");
      setParentName(profile.parent_name || "");
      setParentPhone(profile.parent_phone || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profileQuery.data]);

  const pickImage = useCallback(() => {
    Alert.alert(
      Platform.OS === "web" ? "Niet beschikbaar" : "Mock",
      Platform.OS === "web"
        ? "Camera/Galerij is niet beschikbaar in deze preview."
        : "In de echte app zou hier de image picker openen.",
      [
        { text: "Kies voorbeeld", onPress: () => setAvatarUrl("https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=600&q=80&auto=format") },
        { text: "Annuleer" },
      ]
    );
  }, []);

  const onDatePicked = useCallback((dateObj: Date | null) => {
    if (!dateObj) return;
    setBirthDate(dateObj.toISOString());
    setShowDatePicker(false);
  }, []);

  const formatDateDisplay = useCallback((iso: string | null): string => {
    if (!iso) return "Selecteer datum";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "Selecteer datum";
    }
  }, []);

  const handleSave = useCallback(async () => {
    console.log("Saving student profile...");
    
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Ongeldige gegevens", "Vul een geldige voornaam en achternaam in.");
      return;
    }

    if (email && !email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      Alert.alert("Ongeldige gegevens", "Vul een geldig e-mailadres in.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate || null,
        email: email || null,
        address: address || null,
        phone: phone || null,
        parent_name: parentName || null,
        parent_phone: parentPhone || null,
        avatar_url: avatarUrl || null,
      });
      
      Alert.alert("Succes", "Profiel succesvol bijgewerkt");
      setIsEditing(false);
      profileQuery.refetch();
    } catch (error) {
      console.error("Failed to save student profile", error);
      Alert.alert("Fout", "Kon profiel niet opslaan");
    }
  }, [firstName, lastName, birthDate, email, address, phone, parentName, parentPhone, avatarUrl, updateMutation, profileQuery]);

  const handleCancel = useCallback(() => {
    if (profileQuery.data) {
      const profile = profileQuery.data;
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setBirthDate(profile.birth_date || "");
      setEmail(profile.email || "");
      setAddress(profile.address || "");
      setPhone(profile.phone || "");
      setParentName(profile.parent_name || "");
      setParentPhone(profile.parent_phone || "");
      setAvatarUrl(profile.avatar_url || "");
    }
    setIsEditing(false);
  }, [profileQuery.data]);

  if (profileQuery.isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Laden...</Text>
        </View>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <User color="#2563EB" size={48} />
                </View>
              )}
              {isEditing && (
                <TouchableOpacity onPress={pickImage} style={styles.cameraBtn} accessibilityRole="button">
                  <Camera color="#fff" size={16} />
                </TouchableOpacity>
              )}
              <Text style={styles.avatarTitle}>Profielfoto</Text>
              {isEditing && <Text style={styles.avatarHint}>Tik om je foto te wijzigen</Text>}
            </View>

            <Section title="Persoonlijke Gegevens">
              <Field 
                label="Voornaam" 
                value={firstName} 
                onChangeText={setFirstName} 
                editable={isEditing}
              />
              <Field 
                label="Achternaam" 
                value={lastName} 
                onChangeText={setLastName} 
                editable={isEditing}
              />
              
              <Text style={styles.fieldLabel}>Geboortedatum</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isEditing) return;
                  setShowDatePicker(true);
                }}
                style={[styles.input, !isEditing && styles.inputDisabled]}
                disabled={!isEditing}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <CalendarDays size={16} color={isEditing ? "#2563eb" : "#9ca3af"} />
                  <Text style={styles.inputText}>{formatDateDisplay(birthDate)}</Text>
                </View>
              </TouchableOpacity>

              {showDatePicker && (
                <Modal visible animationType="fade" transparent>
                  <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Kies datum</Text>
                        <TouchableOpacity accessibilityRole="button" onPress={() => setShowDatePicker(false)}>
                          <X size={20} color="#111827" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.pickerWrap}>
                        <CalendarPicker
                          initialDate={birthDate ? new Date(birthDate) : new Date()}
                          onSelectDate={onDatePicked}
                          maximumDate={new Date()}
                        />
                      </View>
                    </View>
                  </View>
                </Modal>
              )}

              <Field 
                label="E-mailadres" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address"
                editable={isEditing}
              />
              <Field 
                label="Woonadres" 
                value={address} 
                onChangeText={setAddress} 
                multiline
                editable={isEditing}
              />
              <Field 
                label="Mobiele nummer" 
                value={phone} 
                onChangeText={setPhone} 
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </Section>

            <Section title="Ouder/Contactpersoon">
              <Field 
                label="Naam ouders/contactpersoon" 
                value={parentName} 
                onChangeText={setParentName} 
                editable={isEditing}
              />
              <Field 
                label="Nummer van ouders/contactpersoon" 
                value={parentPhone} 
                onChangeText={setParentPhone} 
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </Section>

            <View style={styles.footer}>
              {!isEditing ? (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={styles.saveCta}
                >
                  <Text style={styles.saveCtaText}>Bewerken</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={handleCancel}
                    style={[styles.saveCta, styles.cancelCta]}
                  >
                    <Text style={[styles.saveCtaText, styles.cancelCtaText]}>Annuleren</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={styles.saveCta}
                    disabled={updateMutation.isPending}
                  >
                    <Text style={styles.saveCtaText}>
                      {updateMutation.isPending ? "Opslaan..." : "Opslaan"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  editable?: boolean;
  multiline?: boolean;
}

function Field({ label, value, onChangeText, keyboardType = "default", editable = true, multiline = false }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        selectTextOnFocus={editable}
        pointerEvents={editable ? "auto" : "none"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  avatarWrap: { alignItems: "center", gap: 6, marginBottom: 8 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  cameraBtn: {
    position: "absolute",
    right: 100 - 24,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTitle: { fontSize: 16, fontWeight: "600" as const, marginTop: 8 },
  avatarHint: { fontSize: 12, color: "#6b7280" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" as const, color: "#2563eb" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, color: "#6b7280", fontWeight: "500" as const },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#111827",
  },
  inputText: {
    fontSize: 16,
    color: "#111827",
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" as const },
  inputDisabled: { backgroundColor: "#f3f4f6", color: "#9ca3af" },
  footer: {
    marginTop: 8,
    marginBottom: 40,
  },
  saveCta: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
  },
  saveCtaText: { color: "#fff", fontWeight: "700" as const, fontSize: 16 },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelCta: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flex: 1,
  },
  cancelCtaText: {
    color: "#111827",
  },
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
});
