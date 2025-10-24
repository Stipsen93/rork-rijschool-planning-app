import React, { useCallback, useMemo, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarDays, Clock, ArrowLeft } from "lucide-react-native";
import CancellationOptions from "@/components/cancellation/CancellationOptions";
import CancellationReason from "@/components/cancellation/CancellationReason";
import NotesInput from "@/components/cancellation/NotesInput";
import { useAgenda } from "@/components/agenda/AgendaStore";

interface LessonParam {
  id?: string | number;
  studentName?: string;
  lessonType?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
}


export default function LessonCancellationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lesson?: string }>();
  const { removeLessonById } = useAgenda();

  const lesson: LessonParam | null = useMemo(() => {
    try {
      return params.lesson ? (JSON.parse(params.lesson) as LessonParam) : null;
    } catch (e) {
      console.log("Failed to parse lesson param", e);
      return null;
    }
  }, [params.lesson]);

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [chargeCredit, setChargeCredit] = useState<boolean>(true);
  const [notifyStudent, setNotifyStudent] = useState<boolean>(true);
  const [keepInAgenda, setKeepInAgenda] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const isFormValid = true;

  const confirm = useCallback(() => {
    console.log("Confirm cancellation", { selectedReason, chargeCredit, notifyStudent, keepInAgenda, notes });
    const id = (lesson?.id ?? "").toString();
    try {
      if (!keepInAgenda && id) {
        removeLessonById(id);
      }
      router.replace("/(tabs)/agenda");
    } catch (e) {
      Alert.alert("Fout", "Er ging iets mis bij het annuleren. Probeer het opnieuw.");
      console.log("Cancellation error", e);
    }
  }, [router, selectedReason, chargeCredit, notifyStudent, keepInAgenda, notes, lesson?.id, removeLessonById]);

  const dateText = useMemo(() => {
    if (!lesson?.date) return "Onbekende datum";
    const d = new Date(lesson.date);
    const weekdays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"] as const;
    const months = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"] as const;
    return `${weekdays[(d.getDay() || 7) - 1]} ${d.getDate()} ${months[d.getMonth()]}`;
  }, [lesson?.date]);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Les annuleren", headerLeft: () => (
        <View style={{ paddingLeft: 8 }}>
          {/* eslint-disable-next-line react-native/no-inline-styles */}
          <Text onPress={() => router.back()} accessibilityRole="button">
            <ArrowLeft color="#111827" />
          </Text>
        </View>
      ) }} />

      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: "height", default: undefined })} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            testID="lesson-cancellation-screen"
            contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 120 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{lesson?.studentName ?? "Onbekende student"}</Text>
          <View style={styles.headerRow}>
            <DetailChip icon={<CalendarDays size={16} color="#2563eb" />} label="Datum" value={dateText} />
            <DetailChip icon={<Clock size={16} color="#2563eb" />} label="Tijd" value={`${lesson?.startTime ?? "00:00"} - ${lesson?.endTime ?? "00:00"}`} />
          </View>
          {!!lesson?.lessonType && (
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{lesson.lessonType}</Text>
            </View>
          )}
        </View>

        <CancellationReason selectedReason={selectedReason} onReasonChanged={setSelectedReason} />

        {lesson?.lessonType !== "Pauze" && lesson?.lessonType !== "Verlof" && (
          <CancellationOptions
            chargeCredit={chargeCredit}
            notifyStudent={notifyStudent}
            keepInAgenda={keepInAgenda}
            onChargeCreditChanged={setChargeCredit}
            onNotifyStudentChanged={setNotifyStudent}
            onKeepInAgendaChanged={setKeepInAgenda}
          />
        )}

            <NotesInput value={notes} onChangeText={setNotes} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>        
        <Text
          testID="confirm-cancel"
          onPress={() => (isFormValid ? confirm() : null)}
          style={[styles.confirmBtn, !isFormValid && { opacity: 0.6 }]}
          accessibilityRole="button"
        >
          Les annuleren bevestigen
        </Text>
      </View>
    </View>
  );
}

function DetailChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.detailChip}>
      <View style={{ marginBottom: 4 }}>{icon}</View>
      <Text style={styles.detailChipLabel}>{label}</Text>
      <Text style={styles.detailChipValue}>{value}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerRow: { flexDirection: "row", gap: 12 },
  typePill: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#dbeafe", borderRadius: 8 },
  typePillText: { color: "#2563eb", fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  detailChip: { alignItems: "center" },
  detailChipLabel: { color: "#6b7280", fontSize: 12 },
  detailChipValue: { fontWeight: "700", textAlign: "center" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  confirmBtn: {
    width: "100%",
    textAlign: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    color: "#fff",
    fontWeight: "700",
  },
});
