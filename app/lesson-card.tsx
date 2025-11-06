import React, { memo, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useLessonCard } from "@/components/settings/LessonCardStore";
import { useLessonCardData, ItemStatus } from "@/components/lesson-card/LessonCardDataStore";
import { useAgenda } from "@/components/agenda/AgendaStore";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function LessonCardPageComponent() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { categories } = useLessonCard();
  const { getLessonCardData, updateItemStatus } = useLessonCardData();
  const { lessonsByDate } = useAgenda();

  const studentId = String(params.studentId || "");
  const studentName = String(params.studentName || "");
  const lessonId = String(params.lessonId || "");
  const lessonDate = String(params.lessonDate || "");

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const lessonCardData = useMemo(() => {
    return getLessonCardData(studentId, lessonId);
  }, [getLessonCardData, studentId, lessonId]);

  const getItemStatus = (itemId: string): ItemStatus | undefined => {
    return lessonCardData?.items.find((i) => i.itemId === itemId)?.status;
  };

  const studentLessons = useMemo(() => {
    const all: { id: string; date: Date; startTime: string; endTime: string }[] = [];
    Object.values(lessonsByDate).forEach((day) => {
      day.forEach((l) => {
        if ((l.studentId || l.studentName) === studentId || l.studentName === studentName) {
          all.push({
            id: l.id,
            date: l.date,
            startTime: l.startTime,
            endTime: l.endTime,
          });
        }
      });
    });
    return all.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [lessonsByDate, studentId, studentName]);

  const currentIndex = useMemo(() => {
    return studentLessons.findIndex((l) => l.id === lessonId);
  }, [studentLessons, lessonId]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < studentLessons.length - 1;

  const handlePrevious = () => {
    if (hasPrevious && currentIndex > 0) {
      const prev = studentLessons[currentIndex - 1];
      router.replace({
        pathname: "/lesson-card",
        params: {
          studentId,
          studentName,
          lessonId: prev.id,
          lessonDate: prev.date.toISOString(),
        },
      });
    }
  };

  const handleNext = () => {
    if (hasNext && currentIndex < studentLessons.length - 1) {
      const next = studentLessons[currentIndex + 1];
      router.replace({
        pathname: "/lesson-card",
        params: {
          studentId,
          studentName,
          lessonId: next.id,
          lessonDate: next.date.toISOString(),
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.closeBtn}>
          <X size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Leskaart</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.dateNav}>
        <Pressable
          accessibilityRole="button"
          onPress={handlePrevious}
          style={[styles.navBtn, !hasPrevious && styles.navBtnDisabled]}
          disabled={!hasPrevious}
        >
          {hasPrevious && <ChevronLeft size={20} color="#2f95dc" />}
        </Pressable>
        <Text style={styles.dateText}>{formatDate(lessonDate)}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={handleNext}
          style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
          disabled={!hasNext}
        >
          {hasNext && <ChevronRight size={20} color="#2f95dc" />}
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        {categories.map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <View style={styles.table}>
              {category.items.map((item, idx) => {
                const status = getItemStatus(item.id);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => setSelectedItemId(item.id)}
                    style={[
                      styles.tableRow,
                      idx === category.items.length - 1 && styles.tableRowLast,
                    ]}
                  >
                    <Text style={styles.itemText}>{item.name}</Text>
                    <View style={styles.statusBox}>
                      {status && <Text style={styles.statusText}>{status}</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {selectedItemId && (
        <StatusSelectionModal
          visible={true}
          onClose={() => setSelectedItemId(null)}
          currentStatus={getItemStatus(selectedItemId)}
          onSelectStatus={(status) => {
            updateItemStatus(studentId, lessonId, lessonDate, selectedItemId, status);
            setSelectedItemId(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

interface StatusSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  currentStatus?: ItemStatus;
  onSelectStatus: (status?: ItemStatus) => void;
}

const statusOptions: { symbol: ItemStatus; label: string; color: string }[] = [
  { symbol: "/", label: "Besproken", color: "#3b82f6" },
  { symbol: "T", label: "In behandeling", color: "#f59e0b" },
  { symbol: "X", label: "Goed", color: "#10b981" },
];

function StatusSelectionModal({ visible, onClose, currentStatus, onSelectStatus }: StatusSelectionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} accessibilityRole="button">
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>Selecteer status</Text>
          <View style={styles.optionsContainer}>
            {statusOptions.map((opt) => (
              <Pressable
                key={opt.symbol}
                accessibilityRole="button"
                onPress={() => onSelectStatus(opt.symbol)}
                style={[
                  styles.optionBtn,
                  currentStatus === opt.symbol && styles.optionBtnSelected,
                ]}
              >
                <View style={[styles.symbolCircle, { backgroundColor: opt.color }]}>
                  <Text style={styles.symbolText}>{opt.symbol}</Text>
                </View>
                <Text style={styles.optionLabel}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
          {currentStatus && (
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelectStatus(undefined)}
              style={styles.removeBtn}
            >
              <X size={16} color="#ef4444" />
              <Text style={styles.removeBtnText}>Verwijderen</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

export default memo(LessonCardPageComponent);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  closeBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  navBtn: { padding: 8 },
  navBtnDisabled: { opacity: 0 },
  dateText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  content: { flex: 1 },
  categorySection: { marginBottom: 24 },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  table: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRowLast: { borderBottomWidth: 0 },
  itemText: { fontSize: 14, color: "#374151", flex: 1, fontWeight: "500" },
  statusBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: { fontSize: 20, fontWeight: "700", color: "#111827" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  optionsContainer: { gap: 12, marginBottom: 16 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 12,
  },
  optionBtnSelected: { borderColor: "#2f95dc", backgroundColor: "#eff6ff" },
  symbolCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolText: { fontSize: 24, fontWeight: "700", color: "#fff" },
  optionLabel: { fontSize: 16, fontWeight: "600", color: "#374151", flex: 1 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fee2e2",
    backgroundColor: "#fef2f2",
    gap: 8,
  },
  removeBtnText: { fontSize: 14, fontWeight: "600", color: "#ef4444" },
});
