import React, { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

export interface MonthlyViewProps {
  focusedDay: Date;
  selectedDay: Date;
  onDaySelected: (selected: Date, focused: Date) => void;
  lessons: Record<string, { lessonType?: string }[]>; // key: YYYY-MM-DD
  onClose: () => void;
}

function keyFor(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthMatrix(focused: Date): Date[] {
  const first = new Date(focused.getFullYear(), focused.getMonth(), 1);
  const start = new Date(first);
  const startWeekday = (start.getDay() || 7) - 1; // Monday=0
  start.setDate(start.getDate() - startWeekday);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

function MonthlyViewComponent({ focusedDay, selectedDay, onDaySelected, lessons, onClose }: MonthlyViewProps) {
  const days = useMemo(() => getMonthMatrix(focusedDay), [focusedDay.getFullYear(), focusedDay.getMonth()]);
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const inMonth = (d: Date) => d.getMonth() === focusedDay.getMonth();

  const legend = [
    { label: "Rijles", color: "#2f95dc" },
    { label: "Theorieles", color: "#8b5cf6" },
    { label: "Examen", color: "#ef4444" },
    { label: "Toets", color: "#d97706" },
  ] as const;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.sheet} testID="monthly-view">
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Maandoverzicht</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn} testID="close-monthly">
            <Text style={{ fontWeight: "700" }}>×</Text>
          </Pressable>
        </View>

        <View style={styles.calendarHeaderRow}>
          {(["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"] as const).map((d) => (
            <Text key={d} style={styles.calendarHeader}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {days.map((d) => {
            const events = lessons[keyFor(d)] ?? [];
            const selected = sameDay(d, selectedDay);
            const today = sameDay(d, new Date());
            return (
              <Pressable
                key={keyFor(d)}
                onPress={() => onDaySelected(d, new Date(d))}
                style={[styles.cell, !inMonth(d) && { opacity: 0.4 }]}
                accessibilityRole="button"
              >
                <View
                  style={[styles.dayCircle, selected ? styles.selected : today ? styles.today : undefined]}
                >
                  <Text style={[styles.dayText, selected ? { color: "#fff" } : undefined]}>{d.getDate()}</Text>
                </View>
                <View style={styles.markersRow}>
                  {events.slice(0, 3).map((e, idx) => (
                    <View
                      key={`${keyFor(d)}-${idx}`}
                      style={[styles.marker, { backgroundColor: colorForType(e.lessonType) }]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Text style={{ fontWeight: "700", marginBottom: 8 }}>Legenda</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {legend.map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={{ marginLeft: 8 }}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function colorForType(type?: string): string {
  switch (type) {
    case "Theorieles":
      return "#8b5cf6";
    case "Praktijkexamen":
    case "Examen":
      return "#ef4444";
    case "Tussentijdse toets":
    case "Toets":
      return "#d97706";
    default:
      return "#2f95dc";
  }
}

export const MonthlyView = memo(MonthlyViewComponent);

const styles = StyleSheet.create({
  overlay: {
    ...Platform.select({ default: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 } }),
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sheet: {
    height: "85%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  closeBtn: { padding: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8 },
  calendarHeaderRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, paddingTop: 12 },
  calendarHeader: { width: `${100 / 7}%`, textAlign: "center", fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8, paddingTop: 8 },
  cell: { width: `${100 / 7}%`, paddingVertical: 10, alignItems: "center" },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  selected: { backgroundColor: "#2f95dc" },
  today: { backgroundColor: "#e6f2fb" },
  dayText: { fontWeight: "700" },
  markersRow: { flexDirection: "row", gap: 4, marginTop: 4 },
  marker: { width: 6, height: 6, borderRadius: 3 },
  legendItem: { flexDirection: "row", alignItems: "center", marginRight: 16, marginBottom: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
});