import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { CalendarDays, Camera, Check, Plus, Trash2, User, X } from "lucide-react-native";
import { useProfile } from "@/components/settings/ProfileStore";

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
  const [showYearPicker, setShowYearPicker] = useState<boolean>(false);
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
    const currentYear = today.getFullYear();
    const years = [];
    for (let year = currentYear - 100; year <= currentYear + 50; year++) {
      years.push(year);
    }
    return years;
  }, [today]);

  return (
    <View testID={testID}>
      <View style={calendarStyles.calendarHeader}>
        <TouchableOpacity 
          accessibilityRole="button" 
          onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          <Text style={calendarStyles.navText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => setShowYearPicker(true)}>
          <Text style={calendarStyles.calendarHeaderTitle}>
            {monthNames[cursor.getMonth()]} {cursor.getFullYear()}
          </Text>
        </TouchableOpacity>
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
      {showYearPicker && (
        <Modal visible animationType="fade" transparent>
          <View style={calendarStyles.modalBackdrop}>
            <View style={calendarStyles.yearPickerCard}>
              <View style={calendarStyles.modalHeader}>
                <Text style={calendarStyles.modalTitle}>Kies jaar</Text>
                <TouchableOpacity accessibilityRole="button" onPress={() => setShowYearPicker(false)}>
                  <X size={20} color="#111827" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={yearRange}
                keyExtractor={(item) => `year-${item}`}
                style={calendarStyles.yearList}
                contentContainerStyle={calendarStyles.yearListContent}
                initialScrollIndex={yearRange.indexOf(cursor.getFullYear())}
                getItemLayout={(data, index) => ({ length: 48, offset: 48 * index, index })}
                renderItem={({ item }) => {
                  const isSelected = item === cursor.getFullYear();
                  return (
                    <Pressable
                      onPress={() => {
                        setCursor(new Date(item, cursor.getMonth(), 1));
                        setShowYearPicker(false);
                      }}
                      style={[calendarStyles.yearItem, isSelected && calendarStyles.yearItemSelected]}
                      testID={`year-${item}`}
                    >
                      <Text style={[calendarStyles.yearText, isSelected && calendarStyles.yearTextSelected]}>{item}</Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      )}
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
    fontWeight: "700",
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
    textAlign: "center",
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
    fontWeight: "700",
  },
  todayDot: {
    position: "absolute",
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2563eb",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
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
    fontWeight: "700",
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
    alignItems: "center",
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
    fontWeight: "700",
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [newSpecialization, setNewSpecialization] = useState<string>("");
  const [newSchool, setNewSchool] = useState<string>("");

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const onChange = useCallback(<K extends keyof typeof localProfile>(key: K, value: typeof localProfile[K]) => {
    setLocalProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    console.log("Saving profile...", localProfile);
    if (!localProfile.firstName || !localProfile.lastName || !localProfile.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      Alert.alert("Ongeldige gegevens", "Vul een geldige voornaam, achternaam en e-mail in.");
      return;
    }
    try {
      await updateProfile(localProfile);
      console.log("Profile saved successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile", error);
      Alert.alert("Fout", "Kon profiel niet opslaan");
    }
  }, [localProfile, updateProfile]);

  const pickImage = useCallback(() => {
    Alert.alert(
      Platform.OS === "web" ? "Niet beschikbaar" : "Mock",
      Platform.OS === "web"
        ? "Camera/Galerij is niet beschikbaar in deze preview."
        : "In de echte app zou hier de image picker openen.",
      [
        { text: "Kies voorbeeld", onPress: () => onChange("profileImageUrl", "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80&auto=format") },
        { text: "Annuleer" },
      ]
    );
  }, [onChange]);

  const onDatePicked = useCallback((dateObj: Date | null) => {
    if (!dateObj) return;
    onChange("birthDate", dateObj.toISOString());
    setShowDatePicker(false);
  }, [onChange]);

  const formatDateDisplay = useCallback((iso: string | null): string => {
    if (!iso) return "Selecteer datum";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "Selecteer datum";
    }
  }, []);

  const addSpecialization = useCallback(() => {
    if (!newSpecialization.trim()) return;
    if (localProfile.specializations.includes(newSpecialization.trim())) {
      Alert.alert("Duplicaat", "Deze specialisatie bestaat al.");
      return;
    }
    onChange("specializations", [...localProfile.specializations, newSpecialization.trim()]);
    setNewSpecialization("");
  }, [newSpecialization, localProfile.specializations, onChange]);

  const removeSpecialization = useCallback((spec: string) => {
    onChange("specializations", localProfile.specializations.filter((s) => s !== spec));
  }, [localProfile.specializations, onChange]);

  const addDrivingSchool = useCallback(() => {
    if (!newSchool.trim()) return;
    if (localProfile.drivingSchools.includes(newSchool.trim())) {
      Alert.alert("Duplicaat", "Deze rijschool bestaat al.");
      return;
    }
    onChange("drivingSchools", [...localProfile.drivingSchools, newSchool.trim()]);
    setNewSchool("");
  }, [newSchool, localProfile.drivingSchools, onChange]);

  const removeDrivingSchool = useCallback((school: string) => {
    onChange("drivingSchools", localProfile.drivingSchools.filter((s) => s !== school));
  }, [localProfile.drivingSchools, onChange]);

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} testID="profile-screen">
          <View style={styles.avatarWrap}>
            {localProfile.profileImageUrl ? (
              <Image source={{ uri: localProfile.profileImageUrl }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User color="#0ea5e9" size={48} />
              </View>
            )}
            {isEditing && (
              <TouchableOpacity onPress={pickImage} style={styles.cameraBtn} accessibilityRole="button" testID="pick-image">
                <Camera color="#fff" size={16} />
              </TouchableOpacity>
            )}
            <Text style={styles.avatarTitle}>Profielfoto</Text>
            <Text style={styles.avatarHint}>Tik om je foto te wijzigen</Text>
          </View>

          <Section title="Persoonlijke Gegevens">
            <Field label="Voornaam" value={localProfile.firstName} onChangeText={(t) => onChange("firstName", t)} editable={isEditing} testID="field-firstName" />
            <Field label="Achternaam" value={localProfile.lastName} onChangeText={(t) => onChange("lastName", t)} editable={isEditing} testID="field-lastName" />
            <Field label="Email" value={localProfile.email} keyboardType="email-address" onChangeText={(t) => onChange("email", t)} editable={isEditing} testID="field-email" />
            <Field label="Telefoon" value={localProfile.phoneNumber} keyboardType="phone-pad" onChangeText={(t) => onChange("phoneNumber", t)} editable={isEditing} testID="field-phone" />
            
            <Text style={styles.fieldLabel}>Geboortedatum</Text>
            <TouchableOpacity
              onPress={() => {
                if (!isEditing) return;
                setShowDatePicker(true);
              }}
              style={[styles.input, !isEditing && styles.inputDisabled]}
              disabled={!isEditing}
              testID="field-birth"
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <CalendarDays size={16} color={isEditing ? "#2563eb" : "#9ca3af"} />
                <Text style={styles.inputText}>{formatDateDisplay(localProfile.birthDate)}</Text>
              </View>
            </TouchableOpacity>

            {showDatePicker && (
              <Modal visible animationType="fade" transparent>
                <View style={styles.modalBackdrop} testID="date-picker-modal">
                  <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Kies datum</Text>
                      <TouchableOpacity accessibilityRole="button" onPress={() => setShowDatePicker(false)}>
                        <X size={20} color="#111827" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.pickerWrap}>
                      <CalendarPicker
                        initialDate={localProfile.birthDate ? new Date(localProfile.birthDate) : new Date()}
                        onSelectDate={onDatePicked}
                        testID="date-picker"
                        maximumDate={new Date()}
                      />
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            <Field label="Professionele titel" value={localProfile.title} onChangeText={(t) => onChange("title", t)} editable={isEditing} testID="field-title" />
          </Section>

          <Section title="Professionele Informatie">
            <Field label="WRM Pasnummer" value={localProfile.certificationNumber} onChangeText={(t) => onChange("certificationNumber", t)} editable={isEditing} testID="field-cert" />
            <Field label="Naam Rijschool" value={localProfile.drivingSchoolName} onChangeText={(t) => onChange("drivingSchoolName", t)} editable={isEditing} testID="field-school-name" />
            
            {isEditing && (
              <>
                <Text style={styles.fieldLabel}>Rijschool affiliatie</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.inputFlex}
                    value={newSchool}
                    onChangeText={setNewSchool}
                    onSubmitEditing={addDrivingSchool}
                    testID="field-school"
                  />
                  <TouchableOpacity onPress={addDrivingSchool} style={styles.iconBtn} testID="add-school">
                    <Plus size={20} color="#0ea5e9" />
                  </TouchableOpacity>
                </View>
              </>
            )}
            
            {localProfile.drivingSchools.length > 0 && (
              <>
                {!isEditing && <Text style={styles.fieldLabel}>Rijschool affiliatie</Text>}
                {localProfile.drivingSchools.map((school) => (
                  <View key={school} style={styles.listItem}>
                    <Text style={styles.listItemText}>{school}</Text>
                    {isEditing && (
                      <TouchableOpacity onPress={() => removeDrivingSchool(school)} testID={`remove-school-${school}`}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </>
            )}

            <Field label="Jaren ervaring" value={localProfile.experienceYears} keyboardType="number-pad" onChangeText={(t) => onChange("experienceYears", t)} editable={isEditing} testID="field-exp" />

            {isEditing && (
              <>
                <Text style={styles.subTitle}>Specialisaties</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.inputFlex}
                    value={newSpecialization}
                    onChangeText={setNewSpecialization}
                    onSubmitEditing={addSpecialization}
                    testID="field-specialization"
                  />
                  <TouchableOpacity onPress={addSpecialization} style={styles.iconBtn} testID="add-specialization">
                    <Check size={20} color="#22c55e" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {localProfile.specializations.length > 0 && (
              <>
                {!isEditing && <Text style={styles.subTitle}>Specialisaties</Text>}
                {localProfile.specializations.map((spec) => (
                  <View key={spec} style={styles.listItem}>
                    <Text style={styles.listItemText}>{spec}</Text>
                    {isEditing && (
                      <TouchableOpacity onPress={() => removeSpecialization(spec)} testID={`remove-spec-${spec}`}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </>
            )}
          </Section>

          <Section title="Zakelijke Informatie">
            <Field label="BTW nummer" value={localProfile.taxId} onChangeText={(t) => onChange("taxId", t)} editable={isEditing} testID="field-tax" />
            <Field label="Zakelijk adres" value={localProfile.address} onChangeText={(t) => onChange("address", t)} multiline editable={isEditing} testID="field-address" />
            <Field label="IBAN rekeningnummer" value={localProfile.iban} onChangeText={(t) => onChange("iban", t)} editable={isEditing} testID="field-iban" />
          </Section>

          <View style={styles.footer}>
            {!isEditing ? (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.saveCta}
                testID="edit-btn"
              >
                <Text style={styles.saveCtaText}>Bewerken</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSave}
                style={styles.saveCta}
                testID="save-btn"
              >
                <Text style={styles.saveCtaText}>Opslaan</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
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
  testID?: string;
}

function Field({ label, value, onChangeText, keyboardType = "default", editable = true, multiline = false, testID }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        testID={testID}
        style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
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
  avatarWrap: { alignItems: "center", gap: 6 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { backgroundColor: "#e5f3ff", alignItems: "center", justifyContent: "center" },
  cameraBtn: {
    position: "absolute",
    right: 100 - 24,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0ea5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
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
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0ea5e9" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, color: "#6b7280" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputText: {
    fontSize: 16,
    color: "#111827",
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  inputDisabled: { backgroundColor: "#f3f4f6" },
  subTitle: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  saveCta: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveCtaDisabled: { backgroundColor: "#93c5fd" },
  saveCtaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 120,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputFlex: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  listItemText: {
    fontSize: 15,
    color: "#111827",
    flex: 1,
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
    fontWeight: "700",
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
