import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Platform, Modal, TouchableOpacity, FlatList } from "react-native";
import { Calendar, User, Phone, Mail, ChevronLeft, ChevronRight, X } from "lucide-react-native";

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate?: string | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

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

export function PersonalInformation({ value, onChange }: { value: PersonalInfo; onChange: (v: PersonalInfo) => void; }) {
  const [local, setLocal] = useState<PersonalInfo>(value);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  useEffect(() => { setLocal(value); }, [value]);
  useEffect(() => { onChange(local); }, [local, onChange]);

  const dateLabel = useMemo(() => {
    if (!local.birthDate) return "Selecteer geboortedatum";
    try { 
      const d = new Date(local.birthDate);
      return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch { 
      return String(local.birthDate); 
    }
  }, [local.birthDate]);

  return (
    <View style={styles.card} testID="personal-info">
      <Text style={styles.sectionTitle}>Persoonlijke Informatie</Text>

      <View style={styles.fieldBox}>
        <User color="#2f95dc" />
        <TextInput
          testID="pi-firstname"
          style={styles.input}
          placeholder="Voornaam"
          value={local.firstName}
          onChangeText={(t) => setLocal((p) => ({ ...p, firstName: t }))}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldBox}>
        <User color="#2f95dc" />
        <TextInput
          testID="pi-lastname"
          style={styles.input}
          placeholder="Achternaam"
          value={local.lastName}
          onChangeText={(t) => setLocal((p) => ({ ...p, lastName: t }))}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldBox}>
        <Mail color="#2f95dc" />
        <TextInput
          testID="pi-email"
          style={styles.input}
          placeholder="E-mailadres"
          keyboardType="email-address"
          autoCapitalize="none"
          value={local.email}
          onChangeText={(t) => setLocal((p) => ({ ...p, email: t }))}
        />
      </View>

      <View style={styles.fieldBox}>
        <Phone color="#2f95dc" />
        <TextInput
          testID="pi-phone"
          style={styles.input}
          placeholder="Telefoonnummer"
          keyboardType={Platform.select({ ios: "number-pad", android: "number-pad", default: "default" })}
          value={local.phoneNumber}
          onChangeText={(t) => setLocal((p) => ({ ...p, phoneNumber: t }))}
        />
      </View>

      <Pressable
        onPress={() => setShowDatePicker(true)}
        style={({ pressed }) => [styles.datePicker, { opacity: pressed ? 0.85 : 1 }]}
        testID="pi-birthdate"
      >
        <Calendar color="#2f95dc" />
        <Text style={styles.dateText}>{dateLabel}</Text>
      </Pressable>

      {showDatePicker && (
        <Modal visible animationType="fade" transparent>
          <View style={styles.modalBackdrop} testID="date-picker-modal">
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderInner}>
                <Text style={styles.modalTitleInner}>Kies datum</Text>
                <TouchableOpacity accessibilityRole="button" onPress={() => setShowDatePicker(false)}>
                  <X size={20} color="#111827" />
                </TouchableOpacity>
              </View>
              <View style={styles.pickerWrap}>
                <CalendarPicker
                  initialDate={local.birthDate ? new Date(local.birthDate) : new Date()}
                  onSelectDate={(date) => {
                    if (date) {
                      setLocal((p) => ({ ...p, birthDate: date.toISOString() }));
                    }
                    setShowDatePicker(false);
                  }}
                  testID="date-picker"
                  maximumDate={new Date()}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Text style={styles.subTitle}>Ouder/contactpersoon</Text>

      <TextInput
        testID="pi-em-name"
        style={styles.inputOnly}
        placeholder="Naam ouder/contactpersoon"
        value={local.emergencyContactName ?? ""}
        onChangeText={(t) => setLocal((p) => ({ ...p, emergencyContactName: t }))}
      />
      <TextInput
        testID="pi-em-phone"
        style={styles.inputOnly}
        placeholder="Telefoonnummer ouder/contactpersoon"
        keyboardType={Platform.select({ ios: "number-pad", android: "number-pad", default: "default" })}
        value={local.emergencyContactPhone ?? ""}
        onChangeText={(t) => setLocal((p) => ({ ...p, emergencyContactPhone: t }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2f95dc" },
  subTitle: { marginTop: 8, fontWeight: "700", color: "#111827" },
  fieldBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  input: { flex: 1, paddingVertical: 2 },
  inputOnly: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  datePicker: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 12 },
  dateText: { color: "#374151" },
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
  modalHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 4,
    paddingHorizontal: 8,
  },
  modalTitleInner: {
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
