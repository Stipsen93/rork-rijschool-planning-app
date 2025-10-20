import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Modal, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StudentSearchBar } from "@/components/students/StudentSearchBar";
import { LoadingSkeleton } from "@/components/students/LoadingSkeleton";
import { Users, Plus, X } from "lucide-react-native";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PersonalInformation, PersonalInfo } from "@/components/students/add/PersonalInformation";
import { NotesSection } from "@/components/students/add/NotesSection";
import { LearningPreferences, LearningPreferencesData } from "@/components/students/add/LearningPreferences";
import { PackageAssignment, PackageAssignmentData } from "@/components/students/add/PackageAssignment";
import { router } from "expo-router";

interface StudentItem {
  id: string;
  name: string;
  email: string;
  status: "active" | "irregular" | "inactive";
}

export default function StudentsScreen() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");
  const [customStudents, setCustomStudents] = useState<StudentItem[]>([]);
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const seed: StudentItem[] = useMemo(() => (
    Array.from({ length: 18 }).map((_, i) => ({
      id: String(i + 1),
      name: `Leerling ${i + 1}`,
      email: `student${i + 1}@mail.com`,
      status: i % 3 === 0 ? "active" : i % 3 === 1 ? "irregular" : "inactive",
    }))
  ), []);

  const allStudents = useMemo(() => [...customStudents, ...seed], [customStudents, seed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = allStudents;
    if (filter !== "all") arr = arr.filter(s => s.status === (filter as StudentItem["status"]));
    if (q.length > 0) arr = arr.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    return arr;
  }, [allStudents, query, filter]);

  const onRefresh = useCallback(() => {
    console.log("Refreshing students...");
    setRefreshing(true);
    setLoading(true);
    setTimeout(() => { setRefreshing(false); setLoading(false); }, 800);
  }, []);

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <ScrollView
          testID="students-screen"
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.headerSpace}>
            <Users color="#2f95dc" />
            <Text style={styles.title}>Leerlingen</Text>
            <Text style={styles.text}>Beheer je leerlingen, zoek en filter.</Text>
          </View>

          <StudentSearchBar value={query} onChange={setQuery} onFilterPress={() => {
            const order = ["all", "active", "irregular", "inactive"];
            const next = order[(order.indexOf(filter) + 1) % order.length];
            console.log("Filter toggled to", next);
            setFilter(next);
          }} activeFilter={filter} />

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <View style={{ gap: 12 }}>
              {filtered.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    console.log("Navigating to student profile", s);
                    router.push({ pathname: "/(tabs)/students/[id]", params: { id: s.id, name: s.name, email: s.email, status: s.status } });
                  }}
                  style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
                  testID={`student-${s.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Open profiel van ${s.name}`}
                >
                  <View style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{s.name}</Text>
                    <Text style={styles.email}>{s.email}</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: s.status === "active" ? "#22c55e" : s.status === "irregular" ? "#f59e0b" : "#ef4444" }]} />
                </Pressable>
              ))}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        <Pressable
          testID="add-student-fab"
          accessibilityRole="button"
          accessibilityLabel="Leerling toevoegen"
          onPress={() => setAddOpen(true)}
          style={({ pressed }) => [
            styles.fab,
            { bottom: (insets.bottom ?? 0) + 40, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Plus color="#fff" />
          <Text style={styles.fabText}>Leerling toevoegen</Text>
        </Pressable>

        <AddStudentModal
          visible={addOpen}
          onClose={() => setAddOpen(false)}
          onCreated={(data) => {
            console.log("Student created", data);
            setCustomStudents((prev) => [{
              id: String(Date.now()),
              name: data.fullName,
              email: data.email,
              status: "active",
            }, ...prev]);
            setAddOpen(false);
          }}
        />
      </View>
    </ErrorBoundary>
  );
}

function AddStudentModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (data: { fullName: string; email: string; phoneNumber: string; notes?: string; learning?: LearningPreferencesData; package?: PackageAssignmentData["selectedPackage"] | null; birthDate?: string | null; emergencyContactName?: string; emergencyContactPhone?: string; }) => void; }) {
  const [personal, setPersonal] = useState<PersonalInfo>({ fullName: "", email: "", phoneNumber: "", birthDate: null, emergencyContactName: "", emergencyContactPhone: "" });
  const [notes, setNotes] = useState<string>("");
  const [learning, setLearning] = useState<LearningPreferencesData>({ skillLevel: 3, lessonDuration: 60, preferredTimeSlots: [] });
  const [packages, setPackages] = useState<PackageAssignmentData>({ packages: [
    { id: "p1", name: "Startpakket", lessons: 5, price: 199 },
    { id: "p2", name: "Standaard", lessons: 10, price: 379 },
    { id: "p3", name: "Intensief", lessons: 20, price: 729 },
  ], selectedPackage: null });
  const [saving, setSaving] = useState<boolean>(false);

  const reset = useCallback(() => {
    setPersonal({ fullName: "", email: "", phoneNumber: "", birthDate: null, emergencyContactName: "", emergencyContactPhone: "" });
    setNotes("");
    setLearning({ skillLevel: 3, lessonDuration: 60, preferredTimeSlots: [] });
    setPackages((p) => ({ ...p, selectedPackage: null }));
  }, []);

  const validate = useCallback(() => {
    if (personal.fullName.trim().length === 0) { Alert.alert("Fout", "Volledige naam is verplicht"); return false; }
    const er = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!er.test(personal.email.trim())) { Alert.alert("Fout", "Voer een geldig e-mailadres in"); return false; }
    const pr = /^[0-9+\-\s()]{10,}$/;
    if (!pr.test(personal.phoneNumber.trim())) { Alert.alert("Fout", "Voer een geldig telefoonnummer in"); return false; }
    return true;
  }, [personal]);

  const onSave = useCallback(() => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      onCreated({
        fullName: personal.fullName.trim(),
        email: personal.email.trim(),
        phoneNumber: personal.phoneNumber.trim(),
        notes: notes.trim() || undefined,
        learning,
        package: packages.selectedPackage ?? null,
        birthDate: personal.birthDate ?? null,
        emergencyContactName: personal.emergencyContactName,
        emergencyContactPhone: personal.emergencyContactPhone,
      });
      setSaving(false);
      reset();
    }, 600);
  }, [validate, onCreated, personal, notes, learning, packages, reset]);

  return (
    <Modal visible={visible} animationType={Platform.OS === "web" ? "none" : "slide"} transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} testID="add-student-modal">
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Nieuwe leerling</Text>
            <Pressable accessibilityLabel="Sluiten" onPress={onClose} hitSlop={10}>
              <X color="#111827" />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: "85%" }} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            <PersonalInformation value={personal} onChange={setPersonal} />
            <LearningPreferences value={learning} onChange={setLearning} />
            <PackageAssignment value={packages} onChange={setPackages} />
            <NotesSection value={notes} onChange={setNotes} />
            <Pressable
              testID="save-student"
              accessibilityRole="button"
              onPress={saving ? undefined : onSave}
              style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || saving ? 0.7 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>{saving ? "Opslaan..." : "Leerling Aanmaken"}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  headerSpace: { alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "bold" },
  text: { fontSize: 14, textAlign: "center", color: "#6b7280" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e5e7eb" },
  name: { fontWeight: "700" },
  email: { color: "#6b7280", marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  fab: {
    position: "absolute",
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2f95dc",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: "#fff", fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "92%" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#fff" },
  primaryBtn: { backgroundColor: "#2f95dc", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
