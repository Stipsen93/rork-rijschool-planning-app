import React, { memo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, School, Clock, History as HistoryIcon, CheckCircle2 } from "lucide-react-native";
import type { LessonCardLesson } from "./LessonCard";

export interface LessonDetailSheetProps {
  lesson: LessonCardLesson & {
    duration?: number;
    studentProgress?: {
      totalLessons?: number;
      hoursCompleted?: number;
      theoryScore?: number;
      examReady?: boolean;
    };
    lessonHistory?: { date: string | Date; notes?: string }[];
  };
  onClose: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

function formatDate(dateLike: string | Date | undefined): string {
  if (!dateLike) return "";
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
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

function LessonDetailSheetComponent({ lesson, onClose, onEdit, onCancel }: LessonDetailSheetProps) {
  const progress = lesson.studentProgress ?? {};
  const history = lesson.lessonHistory ?? [];
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.overlay} pointerEvents="box-none" testID="lesson-detail-overlay">
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={[styles.headerBar, { backgroundColor: colorForType(lesson.lessonType) }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{lesson.studentName ?? ""}</Text>
            <Text style={styles.headerMeta}>{`${lesson.startTime} - ${lesson.endTime} • ${lesson.duration ?? 60}min`}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.iconBtn} testID="close-lesson-details">
            <X size={20} color="#111827" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: Math.max(32, insets.bottom + 32) }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          testID="lesson-detail-scroll"
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Les informatie</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Type</Text>
                <Text style={styles.value}>{lesson.lessonType ?? "Rijles"}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Status</Text>
                <Text style={styles.value}>{lesson.status ?? "Gepland"}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Datum</Text>
                <Text style={styles.value}>{formatDate(lesson.date)}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Locatie</Text>
                <Text style={styles.value}>{lesson.location ?? "Rijschool"}</Text>
              </View>
            </View>
            {!!lesson.notes && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Notities</Text>
                <Text style={styles.value}>{lesson.notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Student voortgang</Text>
              <Pressable accessibilityRole="button" onPress={() => {}}>
                <Text style={{ color: "#2f95dc", fontWeight: "600" }}>Bekijk profiel</Text>
              </Pressable>
            </View>
            <View style={styles.row}>
              <View style={styles.progressItem}>
                <School size={20} color="#2f95dc" />
                <Text style={styles.progressValue}>{(progress.totalLessons ?? 0).toString()}</Text>
                <Text style={styles.progressLabel}>Totaal lessen</Text>
              </View>
              <View style={styles.progressItem}>
                <Clock size={20} color="#8b5cf6" />
                <Text style={styles.progressValue}>{`${progress.hoursCompleted ?? 0}h`}</Text>
                <Text style={styles.progressLabel}>Uren gereden</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.progressItem}>
                <Clock size={20} color="#8b5cf6" />
                <Text style={styles.progressValue}>{`${progress.theoryScore ?? 0}%`}</Text>
                <Text style={styles.progressLabel}>Theorie score</Text>
              </View>
              <View style={styles.progressItem}>
                <CheckCircle2 size={20} color={(progress.examReady ?? false) ? "#10b981" : "#6b7280"} />
                <Text style={styles.progressValue}>{(progress.examReady ?? false) ? "Ja" : "Nee"}</Text>
                <Text style={styles.progressLabel}>Examen klaar</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recente lessen</Text>
            {history.length === 0 ? (
              <Text style={styles.emptyState}>Geen eerdere lessen gevonden</Text>
            ) : (
              history.slice(0, 3).map((h, idx) => (
                <View key={idx} style={styles.historyItem}>
                  <View style={styles.historyIcon}><HistoryIcon size={16} color="#2f95dc" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>{formatDate(h.date)}</Text>
                    <Text style={styles.historyNotes} numberOfLines={2}>{h.notes ?? "Geen notities"}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable accessibilityRole="button" onPress={onEdit} style={[styles.cta, styles.ctaPrimary]} testID="edit-lesson">
              <Text style={styles.ctaPrimaryText}>Bewerken</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.cta, styles.ctaDanger]} testID="cancel-lesson">
              <Text style={styles.ctaDangerText}>Annuleren</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

export const LessonDetailSheet = memo(LessonDetailSheetComponent);

const styles = StyleSheet.create({
  overlay: {
    ...Platform.select({ default: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 } }),
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sheet: {
    height: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerBar: { width: 4, height: 48, borderRadius: 2 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerMeta: { color: "#6b7280", marginTop: 4 },
  iconBtn: { padding: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8 },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  label: { color: "#6b7280", fontWeight: "500", marginBottom: 4 },
  value: { fontWeight: "600" },
  progressItem: { flex: 1, alignItems: "center", paddingVertical: 8, gap: 8 },
  progressValue: { fontWeight: "700" },
  progressLabel: { color: "#6b7280", textAlign: "center", fontSize: 12 },
  emptyState: { color: "#6b7280" },
  historyItem: { flexDirection: "row", gap: 12, paddingVertical: 8 },
  historyIcon: { padding: 8, backgroundColor: "#e6f2fb", borderRadius: 8 },
  historyDate: { fontWeight: "600" },
  historyNotes: { color: "#6b7280" },
  cta: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ctaPrimary: { backgroundColor: "#2f95dc" },
  ctaPrimaryText: { color: "#fff", fontWeight: "700" },
  ctaDanger: { borderWidth: 1, borderColor: "#ef4444" },
  ctaDangerText: { color: "#ef4444", fontWeight: "700" },
});