import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Pressable, FlatList } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react-native";

type PersonalInfo = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  address: string;
  phoneNumber: string;
  parentName: string;
  parentPhoneNumber: string;
};

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
  
  const days: { date: Date; inMonth: boolean }[] = useMemo(() => {
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

  const yearRange = useMemo(() => {
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
          <ChevronLeft size={18} color="#111827" />
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
          <ChevronRight size={18} color="#111827" />
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
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#f3f4f6",
  },
  weekCell: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 12,
    color: "#6b7280",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
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

export default function PersonalInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const studentId = params.id as string;
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [info, setInfo] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    address: "",
    phoneNumber: "",
    parentName: "",
    parentPhoneNumber: "",
  });

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const key = `student_personal_info_${studentId}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as PersonalInfo;
          setInfo(parsed);
          console.log("[PersonalInfo] Loaded personal info", parsed);
        }
      } catch (e) {
        console.log("[PersonalInfo] Failed to load personal info", e);
      }
    })();
  }, [studentId]);

  const saveInfo = useCallback(async () => {
    try {
      const key = `student_personal_info_${studentId}`;
      await AsyncStorage.setItem(key, JSON.stringify(info));
      console.log("[PersonalInfo] Saved personal info");
      setIsEditing(false);
    } catch (e) {
      console.log("[PersonalInfo] Failed to save personal info", e);
    }
  }, [info, studentId]);

  const calculateAge = useCallback((dob: string): string => {
    if (!dob) return "";
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} jaar`;
    } catch {
      return "";
    }
  }, []);

  const onDatePicked = useCallback((dateObj: Date | null) => {
    if (!dateObj) return;
    setInfo((prev) => ({ ...prev, dateOfBirth: dateObj.toISOString() }));
    setShowDatePicker(false);
  }, []);

  const formatDateDisplay = useCallback((iso: string): string => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "";
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <Stack.Screen options={{ title: "Persoonlijke informatie", headerBackTitle: "Terug" }} />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
        <View style={styles.card}>
          <Text style={styles.label}>Voornaam</Text>
          <TextInput
            value={info.firstName}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, firstName: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Voornaam"
            editable={isEditing}
            testID="input-firstName"
          />

          <Text style={styles.label}>Achternaam</Text>
          <TextInput
            value={info.lastName}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, lastName: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Achternaam"
            editable={isEditing}
            testID="input-lastName"
          />

          <Text style={styles.label}>Geboortedatum</Text>
          <TouchableOpacity
            onPress={() => {
              if (!isEditing) return;
              setShowDatePicker(true);
            }}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            disabled={!isEditing}
            testID="input-dateOfBirth"
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <CalendarDays size={16} color={isEditing ? "#2563eb" : "#9ca3af"} />
                <Text style={[styles.inputText, !info.dateOfBirth && styles.placeholderText]}>
                  {info.dateOfBirth ? formatDateDisplay(info.dateOfBirth) : "Selecteer datum"}
                </Text>
              </View>
              {info.dateOfBirth && <Text style={styles.ageText}>{calculateAge(info.dateOfBirth)}</Text>}
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
                      initialDate={info.dateOfBirth ? new Date(info.dateOfBirth) : new Date()}
                      onSelectDate={onDatePicked}
                      testID="date-picker"
                      maximumDate={new Date()}
                    />
                  </View>
                </View>
              </View>
            </Modal>
          )}

          <Text style={styles.label}>E-mailadres</Text>
          <TextInput
            value={info.email}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, email: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="E-mailadres"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={isEditing}
            testID="input-email"
          />

          <Text style={styles.label}>Woonadres</Text>
          <TextInput
            value={info.address}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, address: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Woonadres"
            editable={isEditing}
            testID="input-address"
          />

          <Text style={styles.label}>Mobiele nummer</Text>
          <TextInput
            value={info.phoneNumber}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, phoneNumber: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Mobiele nummer"
            keyboardType="phone-pad"
            editable={isEditing}
            testID="input-phoneNumber"
          />

          <Text style={styles.label}>Naam ouders/contactpersoon</Text>
          <TextInput
            value={info.parentName}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, parentName: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Naam ouders/contactpersoon"
            editable={isEditing}
            testID="input-parentName"
          />

          <Text style={styles.label}>Nummer van ouders/contactpersoon</Text>
          <TextInput
            value={info.parentPhoneNumber}
            onChangeText={(text) => setInfo((prev) => ({ ...prev, parentPhoneNumber: text }))}
            style={[styles.input, !isEditing && styles.inputDisabled]}
            placeholder="Nummer van ouders/contactpersoon"
            keyboardType="phone-pad"
            editable={isEditing}
            testID="input-parentPhoneNumber"
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!isEditing ? (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            style={[styles.btn, styles.btnPrimary]}
            testID="edit-btn"
          >
            <Text style={styles.btnPrimaryText}>Bewerken</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={saveInfo}
            style={[styles.btn, styles.btnPrimary]}
            testID="save-btn"
          >
            <Text style={styles.btnPrimaryText}>Opslaan</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: {
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  inputText: {
    fontSize: 16,
    color: "#111827",
  },
  placeholderText: {
    color: "#9ca3af",
  },
  ageText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
  },
  datePickerWeb: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: "#2f95dc",
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  btnSecondary: {
    backgroundColor: "#e5e7eb",
  },
  btnSecondaryText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
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
