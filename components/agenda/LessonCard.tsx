import React, { memo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { MapPin, Plus } from "lucide-react-native";

export type LessonCardLesson = {
  id?: string | number;
  studentName?: string;
  lessonType?: string;
  startTime: string;
  endTime: string;
  date: Date;
  status?: string;
  location?: string;
  notes?: string;
};

export interface LessonCardProps {
  lesson: LessonCardLesson;
  onPress?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

function colorForType(type?: string): string {
  switch (type) {
    case "Pauze":
      return "#3b82f6";
    case "Verlof":
      return "#ef4444";
    case "Theorieles":
      return "#8b5cf6";
    case "Praktijkexamen":
    case "Examen":
      return "#dc2626";
    case "Tussentijdse toets":
    case "Toets":
      return "#d97706";
    default:
      return "#2f95dc";
  }
}

function LessonCardComponent({ lesson, onPress, onDelete }: LessonCardProps) {
  const isCancelled = lesson.status === "Geannuleerd";
  const isBooked = Boolean(lesson.studentName);

  const confirmDelete = () => {
    Alert.alert(
      "Les verwijderen",
      "Weet je zeker dat je deze les wilt verwijderen?",
      [
        { text: "Annuleren", style: "cancel" },
        { text: "Verwijderen", style: "destructive", onPress: () => onDelete?.() },
      ],
    );
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]} testID="lesson-card">
      <View style={[styles.typeBar, { backgroundColor: isCancelled ? "#9ca3af" : isBooked ? colorForType(lesson.lessonType) : "#e5e7eb" }]} />

      <View style={{ flex: 1 }}>
        {isBooked ? (
          <>
            <View style={styles.rowBetween}>
              <Text style={[styles.title, isCancelled && styles.cancelled]}>{lesson.studentName ?? ""}</Text>
              {isCancelled && (
                <View style={styles.cancelBadge}><Text style={styles.cancelBadgeText}>GEANNULEERD</Text></View>
              )}
            </View>

            <Text style={[styles.meta, isCancelled && styles.lineThrough]}>{`${lesson.startTime} - ${lesson.endTime}`}</Text>
            <Text style={[styles.typeText, { color: isCancelled ? "#9ca3af" : colorForType(lesson.lessonType) }, isCancelled && styles.lineThrough]}>
              {lesson.lessonType ?? "Rijles"}
            </Text>

            {!!lesson.location && (
              <View style={styles.locationRow}>
                <MapPin size={14} color={isCancelled ? "#9ca3af" : "#6b7280"} />
                <Text numberOfLines={1} style={[styles.locationText, isCancelled && styles.lineThrough]}>{lesson.location}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyTime}>{`${lesson.startTime} - ${lesson.endTime}`}</Text>
            <Text style={styles.emptyLabel}>Beschikbaar</Text>
          </View>
        )}
      </View>

      {!isBooked && (
        <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.deleteBtn} testID="add-lesson-slot">
          <Plus size={18} color="#2f95dc" />
        </Pressable>
      )}
    </Pressable>
  );
}

export const LessonCard = memo(LessonCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: "flex-start",
    gap: 12,
  },
  typeBar: { width: 4, height: 48, borderRadius: 2 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontWeight: "700" },
  cancelled: { color: "#6b7280", textDecorationLine: "line-through" },
  meta: { color: "#6b7280", marginTop: 6 },
  typeText: { marginTop: 4, fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  locationText: { color: "#6b7280", flexShrink: 1 },
  cancelBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#e5e7eb", borderRadius: 6 },
  cancelBadgeText: { color: "#6b7280", fontSize: 10, fontWeight: "700" },
  emptyRow: { gap: 6 },
  emptyTime: { color: "#6b7280", fontWeight: "600" },
  emptyLabel: { color: "#6b7280" },
  deleteBtn: { padding: 6, marginLeft: 8 },
  lineThrough: { textDecorationLine: "line-through" },
});