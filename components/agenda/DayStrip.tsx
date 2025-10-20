import React, { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

export interface DayStripProps {
  currentWeekStart: Date;
  selectedDate: Date;
  onDateSelected: (d: Date) => void;
  lessonCounts: Record<string, number>; // key: YYYY-MM-DD
}

function keyFor(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function dayName(weekday: number): string {
  const days = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"] as const;
  return days[Math.max(0, weekday - 1)] ?? "";
}

function DayStripComponent({ currentWeekStart, selectedDate, onDateSelected, lessonCounts }: DayStripProps) {
  const data = Array.from({ length: 7 }, (_, i) => new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + i));
  const today = new Date();

  return (
    <View style={styles.wrapContainer} testID="day-strip">
      {data.map((date) => {
        const selected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, today);
        const count = lessonCounts[keyFor(date)] ?? 0;
        return (
          <Pressable
            key={keyFor(date)}
            accessibilityRole="button"
            onPress={() => onDateSelected(date)}
            style={({ pressed }) => [
              styles.day,
              styles.dayGrid,
              selected && styles.daySelected,
              isToday && !selected && styles.dayToday,
              pressed && { opacity: 0.95 },
            ]}
          >
            <Text style={[styles.dayName, selected ? { color: "#fff" } : { color: "#6b7280" }]}>{dayName(date.getDay() || 7)}</Text>
            <Text style={[styles.dayNum, selected ? { color: "#fff" } : { color: "#111827" }]}>{date.getDate()}</Text>
            {count > 0 && (
              <View style={[styles.countBadge, selected ? { backgroundColor: "rgba(255,255,255,0.22)" } : { backgroundColor: "#2f95dc" }]}>
                <Text style={styles.countText}>{count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export const DayStrip = memo(DayStripComponent);

const styles = StyleSheet.create({
  wrapContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  day: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "web" ? 0 : 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  dayGrid: {
    width: `${100 / 7}%`,
    marginVertical: 4,
  },
  daySelected: { backgroundColor: "#2f95dc", borderColor: "#2f95dc" },
  dayToday: { borderColor: "#2f95dc", borderWidth: 2 },
  dayName: { fontSize: 11, fontWeight: "600" },
  dayNum: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  countBadge: { marginTop: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  countText: { color: "#fff", fontWeight: "700", fontSize: 10 },
});