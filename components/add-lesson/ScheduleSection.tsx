import React, { memo, useMemo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { CalendarDays, Clock, Timer } from "lucide-react-native";

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

  const handleDurationChange = (v: string) => {
    const cleaned = v.replace(/[^0-9:]/g, "");
    const parts = cleaned.split(":");
    if (parts.length === 1) {
      const h = Number(parts[0] ?? "0");
      if (!Number.isNaN(h)) onDurationChanged(h, 0);
      return;
    }
    const h = Number(parts[0] ?? "0");
    const mRaw = Number(parts[1] ?? "0");
    const m = Number.isNaN(mRaw) ? 0 : Math.max(0, Math.min(59, mRaw));
    if (!Number.isNaN(h)) onDurationChanged(h, m);
  };

  return (
    <View style={styles.container} testID={testID ?? "schedule-section"}>
      <Text style={styles.title}>Schema</Text>

      <View style={styles.tableRow}>
        <View style={styles.cell}>
          <Text style={styles.header}>Datum</Text>
          <View style={styles.inputWrap}>
            <CalendarDays size={16} color="#2563eb" />
            <TextInput value={selectedDate} onChangeText={onDateChanged} placeholder="YYYY-MM-DD" style={styles.input} autoCapitalize="none" testID="date-input" />
          </View>
        </View>
        <View style={styles.cell}>
          <Text style={styles.header}>Tijd</Text>
          <View style={[styles.inputWrap, isFullDay && { opacity: 0.6 }]}>
            <Clock size={16} color="#2563eb" />
            <TextInput value={isFullDay ? "09:00" : selectedTime} onChangeText={(v) => !isFullDay && onTimeChanged(v)} placeholder="HH:MM" style={styles.input} autoCapitalize="none" editable={!isFullDay} testID="time-input" />
          </View>
        </View>
        <View style={styles.cell}>
          <Text style={styles.header}>Lengte</Text>
          <View style={styles.inputWrap}>
            <Timer size={16} color="#2563eb" />
            <TextInput
              value={durationString}
              onChangeText={handleDurationChange}
              placeholder="HH:MM"
              keyboardType="number-pad"
              style={styles.input}
              autoCapitalize="none"
              testID="duration-input"
            />
          </View>
        </View>
      </View>

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
  tableRow: { flexDirection: "row", gap: 12 },
  cell: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
});
