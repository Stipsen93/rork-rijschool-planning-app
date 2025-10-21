import React, { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

export interface AgendaHeaderProps {
  currentDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onMonthlyView: () => void;
}

function monthYear(date: Date): string {
  const months = [
    "Januari",
    "Februari",
    "Maart",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Augustus",
    "September",
    "Oktober",
    "November",
    "December",
  ] as const;
  return `${months[Math.max(0, date.getMonth())] ?? ""} ${date.getFullYear()}`;
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
}

function AgendaHeaderComponent({ currentDate, onPreviousWeek, onNextWeek, onMonthlyView }: AgendaHeaderProps) {
  return (
    <View style={styles.container} testID="agenda-header">
      <View style={styles.rowBetween}>
        <Text style={styles.title}>{monthYear(currentDate)}</Text>
        <Pressable accessibilityRole="button" onPress={onMonthlyView} style={({ pressed }) => [styles.monthBtn, pressed && { opacity: 0.9 }]}> 
          <Text style={styles.monthBtnText}>Maandoverzicht</Text>
        </Pressable>
      </View>

      <View style={[styles.rowBetween, { marginTop: 12 }] }>
        <Pressable accessibilityRole="button" onPress={onPreviousWeek} style={styles.chevBtn} testID="prev-week">
          <Text style={styles.chevText}>{"<"}</Text>
        </Pressable>
        <Text style={styles.weekText}>{`Week ${getWeekNumber(currentDate)}`}</Text>
        <Pressable accessibilityRole="button" onPress={onNextWeek} style={styles.chevBtn} testID="next-week">
          <Text style={styles.chevText}>{">"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const AgendaHeader = memo(AgendaHeaderComponent);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "web" ? 0 : 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderRadius: 0,
  },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 20, fontWeight: "700" },
  monthBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#e6f2fb" },
  monthBtnText: { color: "#2f95dc", fontWeight: "600" },
  chevBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#fff",
    minWidth: 40,
    alignItems: "center",
  },
  chevText: { fontSize: 16, color: "#111827" },
  weekText: { fontSize: 16, fontWeight: "600" },
});