import React, { memo, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CalendarDays, Clock, Timer, X } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export interface ScheduleSectionProps {
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:MM
  lessonDurationHours: number;
  lessonDurationMinutes: number;
  location: string;
  onDateChanged: (v: string) => void;
  onTimeChanged: (v: string) => void;
  onDurationChanged: (h: number, m: number) => void;
  onLocationChanged: (v: string) => void;
  isFullDay?: boolean;
  showLocationField?: boolean;
  testID?: string;
}

function ScheduleSectionComponent({ selectedDate, selectedTime, lessonDurationHours, lessonDurationMinutes, location, onDateChanged, onTimeChanged, onDurationChanged, onLocationChanged, isFullDay = false, showLocationField = true, testID }: ScheduleSectionProps) {
  const durationString = useMemo(() => {
    const h = Math.max(0, Number(lessonDurationHours || 0));
    const m = Math.max(0, Math.min(59, Number(lessonDurationMinutes || 0)));
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [lessonDurationHours, lessonDurationMinutes]);

  const [showDate, setShowDate] = useState<boolean>(false);
  const [showTime, setShowTime] = useState<boolean>(false);
  const [showDuration, setShowDuration] = useState<boolean>(false);

  const parseDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map((v) => parseInt(v, 10));
    const dt = new Date(Number.isFinite(y) ? y : new Date().getFullYear(), (Number.isFinite(m) ? m : 1) - 1, Number.isFinite(d) ? d : new Date().getDate());
    return dt;
  };
  const parseTime = (hhmm: string) => {
    const [hh, mm] = hhmm.split(":").map((v) => parseInt(v, 10));
    const d = new Date();
    d.setHours(Number.isFinite(hh) ? hh : 0);
    d.setMinutes(Number.isFinite(mm) ? mm : 0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  };
  const pad = (n: number) => String(n).padStart(2, "0");

  const onDatePicked = (_event: unknown, dateObj?: Date) => {
    if (Platform.OS !== "ios") setShowDate(false);
    if (!dateObj) return;
    const y = dateObj.getFullYear();
    const m = pad(dateObj.getMonth() + 1);
    const d = pad(dateObj.getDate());
    onDateChanged(`${y}-${m}-${d}`);
  };

  const onTimePicked = (_event: unknown, dateObj?: Date) => {
    if (Platform.OS !== "ios") setShowTime(false);
    if (!dateObj) return;
    const h = pad(dateObj.getHours());
    const m = pad(dateObj.getMinutes());
    onTimeChanged(`${h}:${m}`);
  };

  const durationOptions = useMemo(() => {
    const arr: { label: string; h: number; m: number }[] = [];
    for (let minutes = 30; minutes <= 8 * 60; minutes += 30) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      arr.push({ label: `${pad(h)}:${pad(m)}`, h, m });
    }
    return arr;
  }, []);

  return (
    <View style={styles.container} testID={testID ?? "schedule-section"}>
      <Text style={styles.title}>Schema</Text>

      <View style={styles.tableRow}>
        <View style={styles.cell}>
          <Text style={styles.header}>Datum</Text>
          <TouchableOpacity
            accessibilityRole="button"
            testID="date-input"
            onPress={() => setShowDate(true)}
            activeOpacity={0.8}
            style={styles.inputWrap}
          >
            <CalendarDays size={16} color="#2563eb" />
            <Text style={styles.inputText}>{selectedDate}</Text>
          </TouchableOpacity>
          {showDate && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={parseDate(selectedDate)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDatePicked}
                maximumDate={new Date(2100, 11, 31)}
                minimumDate={new Date(2000, 0, 1)}
              />
              {Platform.OS === "ios" && (
                <View style={styles.iosToolbar}>
                  <TouchableOpacity onPress={() => setShowDate(false)} style={styles.toolbarBtn}>
                    <Text style={styles.toolbarBtnText}>Gereed</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={styles.cell}>
          <Text style={styles.header}>Tijd</Text>
          <TouchableOpacity
            accessibilityRole="button"
            testID="time-input"
            onPress={() => !isFullDay && setShowTime(true)}
            activeOpacity={0.8}
            style={[styles.inputWrap, isFullDay && { opacity: 0.6 }]}
            disabled={isFullDay}
          >
            <Clock size={16} color="#2563eb" />
            <Text style={styles.inputText}>{isFullDay ? "09:00" : selectedTime}</Text>
          </TouchableOpacity>
          {showTime && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={parseTime(selectedTime)}
                mode="time"
                is24Hour={true}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onTimePicked}
              />
              {Platform.OS === "ios" && (
                <View style={styles.iosToolbar}>
                  <TouchableOpacity onPress={() => setShowTime(false)} style={styles.toolbarBtn}>
                    <Text style={styles.toolbarBtnText}>Gereed</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={styles.cell}>
          <Text style={styles.header}>Lengte</Text>
          <TouchableOpacity accessibilityRole="button" testID="duration-input" onPress={() => setShowDuration(true)} activeOpacity={0.8} style={styles.inputWrap}>
            <Timer size={16} color="#2563eb" />
            <Text style={styles.inputText}>{durationString}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDuration && (
        <Modal visible animationType="fade" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Kies lengte</Text>
                <TouchableOpacity accessibilityRole="button" onPress={() => setShowDuration(false)}>
                  <X size={20} color="#111827" />
                </TouchableOpacity>
              </View>
              <View style={styles.optionsWrap}>
                {durationOptions.map((opt) => {
                  const selected = opt.h === lessonDurationHours && opt.m === lessonDurationMinutes;
                  return (
                    <Pressable
                      key={opt.label}
                      onPress={() => {
                        onDurationChanged(opt.h, opt.m);
                        setShowDuration(false);
                      }}
                      style={[styles.optionItem, selected && styles.optionItemSelected]}
                      testID={`duration-${opt.label}`}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showLocationField && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.header}>Locatie</Text>
          <View style={styles.inputWrap}>
            <TextInput value={location} onChangeText={onLocationChanged} placeholder="Adres" style={styles.input} testID="location-inline" />
          </View>
        </View>
      )}
    </View>
  );
}

export const ScheduleSection = memo(ScheduleSectionComponent);

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  header: { fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: "600" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#fff" },
  inputSmall: { flex: 1, minWidth: 0 },
  input: { flex: 1 },
  inputText: { flex: 1, color: "#111827" },
  tableRow: { flexDirection: "row", gap: 12 },
  cell: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  pickerWrap: { marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" },
  iosToolbar: { borderTopWidth: 1, borderTopColor: "#e5e7eb", padding: 8, alignItems: "flex-end", backgroundColor: "#f9fafb" },
  toolbarBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#2563eb", borderRadius: 8 },
  toolbarBtnText: { color: "#fff", fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 16 },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: "#fff", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 4, paddingHorizontal: 8 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  optionsWrap: { maxHeight: 360 },
  optionItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  optionItemSelected: { backgroundColor: "#eff6ff" },
  optionText: { fontSize: 16, color: "#111827" },
  optionTextSelected: { color: "#2563eb", fontWeight: "700" },
});
