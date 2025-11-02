import React, { memo, useMemo } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, History as HistoryIcon } from "lucide-react-native";
import { useRouter } from "expo-router";
import type { LessonCardLesson } from "./LessonCard";
import { useAgenda } from "./AgendaStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LessonDetailSheetProps {
  lesson: LessonCardLesson & {
    duration?: number;
    lessonHistory?: { date: string | Date; notes?: string }[];
    recurringId?: string;
    studentId?: string;
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

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function minutesBetween(startHHMM: string, endHHMM: string): number {
  const [sh, sm] = startHHMM.split(":").map((v) => parseInt(v, 10));
  const [eh, em] = endHHMM.split(":").map((v) => parseInt(v, 10));
  const s = (Number.isFinite(sh) ? sh : 0) * 60 + (Number.isFinite(sm) ? sm : 0);
  const e = (Number.isFinite(eh) ? eh : 0) * 60 + (Number.isFinite(em) ? em : 0);
  return Math.max(0, e - s);
}

function LessonDetailSheetComponent({ lesson, onClose, onEdit, onCancel }: LessonDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const { lessonsByDate } = useAgenda();
  const studentName = lesson.studentName ?? "";
  const router = useRouter();

  const [studentPackages, setStudentPackages] = React.useState<any[]>([]);
  const [baseItems, setBaseItems] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const studentId = lesson.studentId || lesson.studentName;
        if (!studentId) return;

        const [pkgStr, prodStr, studentPkgStr] = await Promise.all([
          AsyncStorage.getItem("instructor_packages"),
          AsyncStorage.getItem("instructor_products"),
          AsyncStorage.getItem(`student_packages_${studentId}`),
        ]);

        const pkgs = (pkgStr ? JSON.parse(pkgStr) : []) as { id: string; name: string; hours: number; price: number; vatStatus: "incl" | "excl" }[];
        const prods = (prodStr ? JSON.parse(prodStr) : []) as { id: string; name: string; price: number; vatStatus: "incl" | "excl" }[];
        const mappedPkgs = pkgs.map((p) => ({ id: p.id, name: p.name, hours: p.hours, price: p.price, vatStatus: p.vatStatus, isProduct: false }));
        const mappedProds = prods.map((p) => ({ id: p.id, name: p.name, hours: 0, price: p.price, vatStatus: p.vatStatus, isProduct: true }));

        setBaseItems([...mappedPkgs, ...mappedProds]);
        setProducts(mappedProds);

        if (studentPkgStr) {
          const parsed = JSON.parse(studentPkgStr);
          setStudentPackages(parsed);
        }
      } catch (e) {
        console.log("[LessonDetailSheet] Failed to load data", e);
      }
    })();
  }, [lesson.studentName, lesson.studentId]);

  const hasRecurringId = !!lesson.recurringId;
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const { removeLessonById, removeLessonsByRecurringId } = useAgenda();

  const recentLessons = useMemo(() => {
    const now = new Date();
    const lessons: any[] = [];
    Object.values(lessonsByDate).forEach((day) => {
      day.forEach((l) => {
        if ((l.studentName ?? "") === studentName && l.id !== lesson.id) {
          const endDate = new Date(l.date);
          const [eh, em] = l.endTime.split(":").map((v) => parseInt(v, 10));
          endDate.setHours(Number.isFinite(eh) ? eh : 0, Number.isFinite(em) ? em : 0, 0, 0);
          if (endDate.getTime() <= now.getTime()) {
            lessons.push({
              date: l.date,
              startTime: l.startTime,
              endTime: l.endTime,
              lessonType: l.lessonType,
              notes: l.notes,
            });
          }
        }
      });
    });
    return lessons.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 3);
  }, [lessonsByDate, studentName, lesson.id]);

  const studentStats = useMemo(() => {
    const now = new Date();
    const lessons: { date: Date; startTime: string; endTime: string; studentName?: string; lessonType?: string }[] = [];
    Object.values(lessonsByDate).forEach((day) => {
      day.forEach((l) => lessons.push({ date: l.date, startTime: l.startTime, endTime: l.endTime, studentName: l.studentName, lessonType: l.lessonType }));
    });
    const studentLessons = lessons.filter((l) => (l.studentName ?? "") === studentName);

    let plannedMin = 0;
    let drivenMin = 0;
    const productNames = new Set(products.map(p => p.name));
    const prodPlanned: Record<string, boolean> = {};
    const prodDriven: Record<string, boolean> = {};

    studentLessons.forEach((l) => {
      const mins = minutesBetween(l.startTime, l.endTime);
      const endDate = new Date(l.date);
      const [eh, em] = l.endTime.split(":").map((v) => parseInt(v, 10));
      endDate.setHours(Number.isFinite(eh) ? eh : 0, Number.isFinite(em) ? em : 0, 0, 0);

      const isProduct = l.lessonType && productNames.has(l.lessonType);

      if (endDate.getTime() > now.getTime()) {
        if (!isProduct) {
          plannedMin += mins;
        }
        if (l.lessonType) {
          prodPlanned[l.lessonType] = true;
        }
      } else {
        if (!isProduct) {
          drivenMin += mins;
        }
        if (l.lessonType) {
          prodDriven[l.lessonType] = true;
        }
      }
    });

    const plannedHours = plannedMin / 60;
    const drivenHours = drivenMin / 60;

    const totalAddedHours = studentPackages.reduce((sum, sp) => {
      const baseItem = baseItems.find((p) => p.id === sp.packageId);
      const isProduct = baseItem?.isProduct === true;
      if (isProduct) return sum;
      const base = sp.customHours ?? (baseItem?.hours ?? 0);
      return sum + (base || 0);
    }, 0);

    const hoursPaid = studentPackages.reduce((sum, sp) => {
      const baseItem = baseItems.find((p) => p.id === sp.packageId);
      const isProduct = baseItem?.isProduct === true;
      if (isProduct) return sum;
      const baseHours = sp.customHours ?? (baseItem?.hours ?? 0);
      const total = baseHours || 0;
      const terms = sp.installments.length;
      if (terms === 0) {
        if (sp.paymentStatus === "paid") return sum + total;
        return sum;
      }
      const paidCount = sp.installments.filter((i: any) => i.paid).length;
      const fraction = total * (paidCount / terms);
      return sum + fraction;
    }, 0);

    const hoursOver = totalAddedHours - drivenHours - plannedHours;
    const hoursOverPositive = hoursOver < 0 ? 0 : hoursOver;

    const hoursPackages = studentPackages.filter((sp) => {
      const baseItem = baseItems.find((p) => p.id === sp.packageId);
      return baseItem?.isProduct !== true;
    });
    let aggregatePaymentStatus: "paid" | "partial" | "unpaid" = "unpaid";
    if (hoursPackages.length === 0) {
      aggregatePaymentStatus = "unpaid";
    } else {
      let anyPaid = false;
      let allPaid = true;
      for (const sp of hoursPackages) {
        const terms = sp.installments.length;
        const spAllPaid = terms > 0 ? sp.installments.every((i: any) => i.paid) : sp.paymentStatus === "paid";
        const spAnyPaid = terms > 0 ? sp.installments.some((i: any) => i.paid) : sp.paymentStatus === "paid";
        if (spAnyPaid) anyPaid = true;
        if (!spAllPaid) allPaid = false;
      }
      if (allPaid) aggregatePaymentStatus = "paid";
      else if (anyPaid) aggregatePaymentStatus = "partial";
      else aggregatePaymentStatus = "unpaid";
    }

    const productRows = products.map((prod) => {
      const direct = studentPackages.filter((sp) => sp.packageId === prod.id);
      const included = studentPackages.filter((sp) => (sp.includedProductIds ?? []).includes(prod.id));
      
      const allRelated = [...direct, ...included];
      
      const planned = Boolean(prodPlanned[prod.name]);
      const driven = Boolean(prodDriven[prod.name]);
      
      const paidCount = allRelated.filter((sp) => {
        const terms = sp.installments.length;
        return terms === 0 ? sp.paymentStatus === "paid" : sp.installments.every((i: any) => i.paid);
      }).length;
      
      const unpaidCount = allRelated.filter((sp) => {
        const terms = sp.installments.length;
        return terms === 0 ? sp.paymentStatus !== "paid" : !sp.installments.every((i: any) => i.paid);
      }).length;
      
      const drivenPaidCount = driven ? paidCount : 0;
      const drivenUnpaidCount = driven ? unpaidCount : 0;
      
      const remainingCount = driven ? 0 : allRelated.length;
      
      return { 
        name: prod.name, 
        remainingCount, 
        planned, 
        driven,
        drivenPaidCount,
        drivenUnpaidCount
      };
    });

    const noneAdded = totalAddedHours === 0 && !productRows.some((pr) => pr.remainingCount > 0 || pr.drivenPaidCount > 0 || pr.drivenUnpaidCount > 0);

    return { drivenHours, plannedHours, hoursPaid, hoursOver: hoursOverPositive, aggregatePaymentStatus, noneAdded, productRows };
  }, [lessonsByDate, studentName, studentPackages, baseItems, products]);

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

          {lesson.lessonType !== "Pauze" && lesson.lessonType !== "Verlof" && (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Student voortgang</Text>
                <Pressable accessibilityRole="button" onPress={() => {
                  const studentId = lesson.studentId || lesson.studentName;
                  if (studentId) {
                    router.push({
                      pathname: "/(tabs)/students/[id]",
                      params: { id: studentId, name: studentName },
                    });
                  }
                }} testID="view-student-profile">
                  <Text style={{ color: "#2f95dc", fontWeight: "600" }}>Bekijk profiel</Text>
                </Pressable>
              </View>
              <View style={{ gap: 10 }}>
                {(() => {
                  return (
                    <>
                      <ProgressRow label="Uren gereden" value={`${round1(studentStats.drivenHours)} u`} valueColor={studentStats.drivenHours <= 0 ? "#6b7280" : (studentStats.drivenHours > studentStats.hoursPaid ? "#ef4444" : "#22c55e")} />
                      {(() => {
                        const remainingPaid = Math.max(0, studentStats.hoursPaid - studentStats.drivenHours);
                        const plannedColor = studentStats.plannedHours <= 0
                          ? "#6b7280"
                          : (studentStats.drivenHours > studentStats.hoursPaid
                              ? "#ef4444"
                              : (studentStats.noneAdded
                                  ? "#6b7280"
                                  : (remainingPaid >= studentStats.plannedHours
                                      ? "#16a34a"
                                      : (remainingPaid > 0 ? "#f59e0b" : "#2563eb"))));
                        return (
                          <ProgressRow label="Uren gepland" value={`${round1(studentStats.plannedHours)} u`} valueColor={plannedColor} />
                        );
                      })()}
                      <ProgressRow label="Uren betaald" value={`${round1(studentStats.hoursPaid)} u`} valueColor={studentStats.hoursPaid > 0 ? "#16a34a" : "#6b7280"} />
                    </>
                  );
                })()}

                <ProgressRow
                  label="Uren over"
                  value={`${round1(studentStats.hoursOver)} u`}
                  valueColor={
                    studentStats.noneAdded
                      ? "#6b7280"
                      : studentStats.aggregatePaymentStatus === "unpaid" && studentStats.drivenHours === 0
                      ? "#6b7280"
                      : studentStats.aggregatePaymentStatus === "partial"
                      ? "#f59e0b"
                      : studentStats.aggregatePaymentStatus === "paid"
                      ? "#16a34a"
                      : (studentStats.hoursOver > 0 ? "#16a34a" : "#ef4444")
                  }
                />
                <View style={{ height: 8 }} />
                {studentStats.productRows.map((pr) => (
                  <View key={pr.name} style={styles.overviewRow}>
                    <Text style={styles.overviewLabel}>{pr.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {pr.planned && <View style={styles.plannedBadge}><Text style={styles.plannedBadgeText}>Gepland</Text></View>}
                      {pr.drivenPaidCount > 0 && (
                        <View style={styles.drivenBadge}>
                          <Text style={styles.drivenBadgeText}>Gereden {pr.drivenPaidCount}x</Text>
                        </View>
                      )}
                      {pr.drivenUnpaidCount > 0 && (
                        <View style={styles.drivenUnpaidBadge}>
                          <Text style={styles.drivenUnpaidBadgeText}>Gereden {pr.drivenUnpaidCount}x</Text>
                        </View>
                      )}
                      <Text style={[styles.overviewValue, { color: pr.remainingCount > 0 ? "#ef4444" : "#6b7280" }]}>{`${pr.remainingCount} st`}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recente lessen</Text>
            {recentLessons.length === 0 ? (
              <Text style={styles.emptyState}>Geen recente lessen</Text>
            ) : (
              recentLessons.map((h, idx) => (
                <View key={idx} style={styles.historyItem}>
                  <View style={styles.historyIcon}><HistoryIcon size={16} color="#2f95dc" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>{formatDate(h.date)} • {h.startTime} - {h.endTime}</Text>
                    <Text style={styles.historyNotes} numberOfLines={2}>{h.lessonType ?? "Rijles"}{h.notes ? ` • ${h.notes}` : ""}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable accessibilityRole="button" onPress={onEdit} style={[styles.cta, styles.ctaPrimary]} testID="edit-lesson">
              <Text style={styles.ctaPrimaryText}>Bewerken</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => {
              if (hasRecurringId) {
                setShowDeleteModal(true);
              } else {
                onCancel?.();
              }
            }} style={[styles.cta, styles.ctaDanger]} testID="cancel-lesson">
              <Text style={styles.ctaDangerText}>Annuleren</Text>
            </Pressable>
          </View>

          {showDeleteModal && hasRecurringId && (
            <Modal visible animationType="fade" transparent>
              <View style={styles.modalBackdrop}>
                <View style={styles.deleteModalCard}>
                  <Text style={styles.deleteModalTitle}>Afspraak verwijderen</Text>
                  <Text style={styles.deleteModalText}>Deze afspraak is onderdeel van een reeks. Wat wilt u verwijderen?</Text>
                  <View style={styles.deleteModalButtons}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        if (lesson.id) {
                          removeLessonById(String(lesson.id));
                        }
                        setShowDeleteModal(false);
                        onClose();
                      }}
                      style={styles.deleteModalButton}
                      testID="delete-this-lesson"
                    >
                      <Text style={styles.deleteModalButtonText}>Alleen deze afspraak</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        if (lesson.recurringId) {
                          removeLessonsByRecurringId(lesson.recurringId, lesson.date);
                        }
                        setShowDeleteModal(false);
                        onClose();
                      }}
                      style={styles.deleteModalButton}
                      testID="delete-following-lessons"
                    >
                      <Text style={styles.deleteModalButtonText}>Alle volgende afspraken</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowDeleteModal(false)}
                      style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                      testID="cancel-delete"
                    >
                      <Text style={[styles.deleteModalButtonText, styles.deleteModalButtonCancelText]}>Annuleren</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function ProgressRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.overviewRow}>
      <Text style={styles.overviewLabel}>{label}</Text>
      <Text style={[styles.overviewValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
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
  overviewRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  overviewLabel: { color: "#6b7280", fontWeight: "600" },
  overviewValue: { fontWeight: "800", color: "#111827" },
  plannedBadge: { backgroundColor: "#e0e7ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  plannedBadgeText: { color: "#3730a3", fontWeight: "700" },
  drivenBadge: { backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  drivenBadgeText: { color: "#166534", fontWeight: "700" },
  drivenUnpaidBadge: { backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  drivenUnpaidBadgeText: { color: "#991b1b", fontWeight: "700" },
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
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 16 },
  deleteModalCard: { width: "100%", maxWidth: 400, backgroundColor: "#fff", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#e5e7eb" },
  deleteModalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  deleteModalText: { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  deleteModalButtons: { gap: 8 },
  deleteModalButton: { paddingVertical: 14, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#2563eb" },
  deleteModalButtonText: { color: "#fff", fontWeight: "700" },
  deleteModalButtonCancel: { backgroundColor: "#f3f4f6" },
  deleteModalButtonCancelText: { color: "#111827" },
});