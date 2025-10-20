import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { GraduationCap } from "lucide-react-native";

export interface LearningPreferencesData {
  skillLevel: number; // 1-5
  lessonDuration: number; // minutes
  preferredTimeSlots: string[]; // e.g., "8:00-12:00"
}

export function LearningPreferences({ value, onChange }: { value: LearningPreferencesData; onChange: (v: LearningPreferencesData) => void; }) {
  const [local, setLocal] = useState<LearningPreferencesData>(value);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => onChange(local), [local, onChange]);

  const durations = [30, 45, 60, 90, 120] as const;
  const timeSlots = [
    { id: "morning", label: "Ochtend (8:00 - 12:00)", value: "8:00-12:00" },
    { id: "afternoon", label: "Middag (12:00 - 17:00)", value: "12:00-17:00" },
    { id: "evening", label: "Avond (17:00 - 20:00)", value: "17:00-20:00" },
    { id: "weekend", label: "Weekend", value: "weekend" },
  ];

  const levelText = (n: number) => ["Beginner", "Basis", "Gemiddeld", "Gevorderd", "Expert"][Math.min(4, Math.max(0, Math.round(n) - 1))];

  return (
    <View style={styles.card} testID="learning-preferences">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <GraduationCap color="#2f95dc" />
        <Text style={styles.title}>Leervoorkeuren</Text>
      </View>

      <Text style={styles.label}>Vaardigheidsniveau: <Text style={styles.highlight}>{levelText(local.skillLevel)}</Text></Text>
      <View style={styles.levelRow}>
        {Array.from({ length: 5 }).map((_, i) => {
          const idx = i + 1;
          const active = local.skillLevel >= idx;
          return (
            <Pressable key={idx} onPress={() => setLocal((p) => ({ ...p, skillLevel: idx }))} style={[styles.levelDot, active && styles.levelDotActive]} />
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: 8 }]}>Lesduur voorkeur</Text>
      <View style={styles.wrapRow}>
        {durations.map((d) => {
          const sel = local.lessonDuration === d;
          return (
            <Pressable key={d} onPress={() => setLocal((p) => ({ ...p, lessonDuration: d }))} style={[styles.pill, sel ? styles.pillActive : styles.pillIdle]}>
              <Text style={[styles.pillText, sel ? styles.pillTextActive : styles.pillTextIdle]}>{d} min</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: 8 }]}>Voorkeur tijdsloten</Text>
      {timeSlots.map((slot) => {
        const isSelected = local.preferredTimeSlots.includes(slot.value);
        return (
          <Pressable
            key={slot.id}
            onPress={() => {
              setLocal((p) => {
                const has = p.preferredTimeSlots.includes(slot.value);
                return {
                  ...p,
                  preferredTimeSlots: has ? p.preferredTimeSlots.filter((v) => v !== slot.value) : [...p.preferredTimeSlots, slot.value],
                };
              });
            }}
            style={[styles.checkboxRow]}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxActive]} />
            <Text>{slot.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  title: { fontWeight: "700", color: "#2f95dc" },
  label: { color: "#111827", fontWeight: "600" },
  highlight: { color: "#2f95dc" },
  levelRow: { flexDirection: "row", gap: 10 },
  levelDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#2f95dc" },
  levelDotActive: { backgroundColor: "#2f95dc" },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
  pillActive: { backgroundColor: "#2f95dc", borderColor: "#2f95dc" },
  pillIdle: { backgroundColor: "#e0f0fb", borderColor: "#b9e0fb" },
  pillText: { fontWeight: "600" },
  pillTextActive: { color: "#fff" },
  pillTextIdle: { color: "#2f95dc" },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#d1d5db" },
  checkboxActive: { backgroundColor: "#2f95dc", borderColor: "#2f95dc" },
});