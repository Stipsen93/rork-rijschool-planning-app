import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable, Modal, Platform, Alert, Animated, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StudentSearchBar, StudentFilters } from "@/components/students/StudentSearchBar";
import { LoadingSkeleton } from "@/components/students/LoadingSkeleton";
import { FilterModal } from "@/components/students/FilterModal";
import { Users, Plus, X, UserPlus } from "lucide-react-native";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PersonalInformation, PersonalInfo } from "@/components/students/add/PersonalInformation";
import { NotesSection } from "@/components/students/add/NotesSection";

import { router, useFocusEffect } from "expo-router";
import { useStudents } from "@/components/students/StudentsStore";

function AnimatedListItem({ children, index, delay = 0 }: { children: React.ReactNode; index: number; delay?: number }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        delay,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, delay]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function StudentsScreen() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [filters, setFilters] = useState<StudentFilters>({
    activityStatus: [],
    showArchived: false,
    passed: null,
    theoryPassed: null,
    practicalExamBooked: null,
    dateAddedFrom: null,
    dateAddedTo: null,
  });
  const [archivedStudents, setArchivedStudents] = useState<Set<string>>(new Set());
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const { students: allStudents, addStudent, studentActivity, refetch: refetchStudents, error: studentsError, isLoading: studentsLoading } = useStudents();
  const { activeStudents, irregularStudents } = studentActivity;
  const [personalInfoCache, setPersonalInfoCache] = useState<Record<string, { firstName: string; lastName: string }>>({});

  const getStudentStatus = useCallback((studentName: string): "active" | "irregular" | "inactive" => {
    if (activeStudents.some(s => s.name === studentName)) return "active";
    if (irregularStudents.some(s => s.name === studentName)) return "irregular";
    return "inactive";
  }, [activeStudents, irregularStudents]);

  useFocusEffect(
    useCallback(() => {
      console.log("[StudentsScreen] Focused -> refetch students");
      refetchStudents?.();
    }, [refetchStudents])
  );

  useEffect(() => {
    if (studentsError) {
      const msg = studentsError instanceof Error ? studentsError.message : "Kon leerlingen niet laden";
      console.error("[StudentsScreen] studentsError", studentsError);
      Alert.alert("Fout", msg);
    }
  }, [studentsError]);

  const hasActiveFilters = useMemo(() => {
    return filters.activityStatus.length > 0 ||
      filters.showArchived ||
      filters.passed !== null ||
      filters.theoryPassed !== null ||
      filters.practicalExamBooked !== null ||
      filters.dateAddedFrom !== null ||
      filters.dateAddedTo !== null;
  }, [filters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = allStudents.map(s => ({
      ...s,
      calculatedStatus: getStudentStatus(s.name)
    }));

    if (filters.activityStatus.length > 0) {
      arr = arr.filter(s => filters.activityStatus.includes(s.calculatedStatus));
    }

    if (filters.passed !== null) {
      arr = arr.filter(s => s.passed === filters.passed);
    }

    if (filters.theoryPassed !== null) {
      arr = arr.filter(s => s.theoryPassed === filters.theoryPassed);
    }

    if (filters.practicalExamBooked !== null) {
      arr = arr.filter(s => s.practicalExamBooked === filters.practicalExamBooked);
    }

    if (filters.dateAddedFrom !== null) {
      arr = arr.filter(s => s.dateAdded && s.dateAdded >= filters.dateAddedFrom!);
    }

    if (filters.dateAddedTo !== null) {
      arr = arr.filter(s => s.dateAdded && s.dateAdded <= filters.dateAddedTo!);
    }

    if (filters.showArchived) {
      arr = arr.filter(s => archivedStudents.has(s.id));
    } else {
      arr = arr.filter(s => !archivedStudents.has(s.id));
    }

    if (q.length > 0) {
      arr = arr.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }

    arr.sort((a, b) => {
      const aInfo = personalInfoCache[a.id];
      const bInfo = personalInfoCache[b.id];
      
      const aName = aInfo && aInfo.firstName && aInfo.lastName
        ? `${aInfo.firstName} ${aInfo.lastName}`.trim().toLowerCase()
        : a.name.toLowerCase();
      
      const bName = bInfo && bInfo.firstName && bInfo.lastName
        ? `${bInfo.firstName} ${bInfo.lastName}`.trim().toLowerCase()
        : b.name.toLowerCase();
      
      return aName.localeCompare(bName);
    });

    return arr;
  }, [allStudents, query, filters, getStudentStatus, personalInfoCache, archivedStudents]);

  const loadPersonalInfo = useCallback(async () => {
    const cache: Record<string, { firstName: string; lastName: string }> = {};
    const archived = new Set<string>();
    
    for (const student of allStudents) {
      try {
        const key = `student_personal_info_${student.id}`;
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          cache[student.id] = {
            firstName: parsed.firstName || "",
            lastName: parsed.lastName || "",
          };
        }
        
        const archivedKey = `student_archived_${student.id}`;
        const archivedStr = await AsyncStorage.getItem(archivedKey);
        if (archivedStr === "true") {
          archived.add(student.id);
        }
      } catch (e) {
        console.log("[StudentsScreen] Failed to load personal info for student", student.id, e);
      }
    }
    setPersonalInfoCache(cache);
    setArchivedStudents(archived);
  }, [allStudents]);

  useEffect(() => {
    loadPersonalInfo();
  }, [loadPersonalInfo]);

  useFocusEffect(
    useCallback(() => {
      loadPersonalInfo();
    }, [loadPersonalInfo])
  );

  const onRefresh = useCallback(async () => {
    console.log("[StudentsScreen] Pull-to-refresh -> refetch students");
    setRefreshing(true);
    try {
      await refetchStudents?.();
      await loadPersonalInfo();
    } finally {
      setRefreshing(false);
    }
  }, [loadPersonalInfo, refetchStudents]);

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

          <TouchableOpacity
            style={styles.linkRequestsButton}
            onPress={() => {
              console.log("Navigating to link requests");
              router.push("/link-requests");
            }}
            testID="link-requests-button"
          >
            <UserPlus color="#2563EB" size={20} />
            <Text style={styles.linkRequestsButtonText}>Koppelverzoeken</Text>
          </TouchableOpacity>

          <StudentSearchBar 
            value={query} 
            onChange={setQuery} 
            onFilterPress={() => {
              console.log("Opening filter modal");
              setFilterModalOpen(true);
            }} 
            hasActiveFilters={hasActiveFilters} 
          />

          {studentsLoading ? (
            <LoadingSkeleton />
          ) : (
            <View style={{ gap: 12 }}>
              {filtered.map((s, index) => {
                const personalInfo = personalInfoCache[s.id];
                const displayName = personalInfo && personalInfo.firstName && personalInfo.lastName
                  ? `${personalInfo.firstName} ${personalInfo.lastName}`.trim()
                  : s.name;
                const dotColor = s.calculatedStatus === "active" ? "#22c55e" : s.calculatedStatus === "irregular" ? "#f59e0b" : "#ef4444";
                return (
                  <AnimatedListItem key={s.id} index={index} delay={index * 50}>
                    <Pressable
                      onPress={() => {
                        console.log("Navigating to student profile", s);
                        router.push({ pathname: "/(tabs)/students/[id]", params: { id: s.id, name: s.name, email: s.email, status: s.calculatedStatus } });
                      }}
                      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
                      testID={`student-${s.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Open profiel van ${displayName}`}
                    >
                      <View style={styles.avatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{displayName}</Text>
                        <Text style={styles.email}>{s.email}</Text>
                      </View>
                      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                    </Pressable>
                  </AnimatedListItem>
                );
              })}
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

        <FilterModal
          visible={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          filters={filters}
          onApply={(newFilters) => {
            console.log("Filters applied", newFilters);
            setFilters(newFilters);
          }}
        />

        <AddStudentModal
          visible={addOpen}
          onClose={() => setAddOpen(false)}
          onCreated={async (data) => {
            console.log("Student created", data);
            
            try {
              await addStudent({
                name: data.fullName,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phoneNumber,
                birthDate: data.birthDate ?? null,
                emergencyContactName: data.emergencyContactName ?? null,
                emergencyContactPhone: data.emergencyContactPhone ?? null,
                notes: data.notes ?? null,
                status: "active" as const,
                dateAdded: new Date(),
              });
              
              setAddOpen(false);
              loadPersonalInfo();
              Alert.alert("Succesvol", `${data.fullName} is succesvol toegevoegd aan je leerlingenlijst.`);
            } catch (error) {
              console.error("[AddStudent] Failed to add student:", error);
              const errorMessage = error instanceof Error ? error.message : "Kon leerling niet toevoegen. Probeer het opnieuw.";
              Alert.alert("Fout", errorMessage);
            }
          }}
        />
      </View>
    </ErrorBoundary>
  );
}

function AddStudentModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (data: { fullName: string; email: string; phoneNumber: string; notes?: string; birthDate?: string | null; emergencyContactName?: string; emergencyContactPhone?: string; firstName: string; lastName: string; }) => void; }) {
  const initialPersonal: PersonalInfo = { firstName: "", lastName: "", email: "", phoneNumber: "", birthDate: null, emergencyContactName: "", emergencyContactPhone: "" };
  const [personal, setPersonal] = useState<PersonalInfo>(initialPersonal);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const reset = useCallback(() => {
    setPersonal({ firstName: "", lastName: "", email: "", phoneNumber: "", birthDate: null, emergencyContactName: "", emergencyContactPhone: "" });
    setNotes("");
  }, []);

  useEffect(() => {
    if (visible) {
      reset();
    }
  }, [visible, reset]);

  const validate = useCallback(() => {
    if (personal.firstName.trim().length === 0) { Alert.alert("Fout", "Voornaam is verplicht"); return false; }
    if (personal.lastName.trim().length === 0) { Alert.alert("Fout", "Achternaam is verplicht"); return false; }
    const er = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!er.test(personal.email.trim())) { Alert.alert("Fout", "Voer een geldig e-mailadres in"); return false; }
    const pr = /^[0-9+\-\s()]{10,}$/;
    if (!pr.test(personal.phoneNumber.trim())) { Alert.alert("Fout", "Voer een geldig telefoonnummer in"); return false; }
    return true;
  }, [personal]);

  const onSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(async () => {
      const fullName = `${personal.firstName.trim()} ${personal.lastName.trim()}`.trim();
      
      onCreated({
        fullName,
        email: personal.email.trim(),
        phoneNumber: personal.phoneNumber.trim(),
        notes: notes.trim() || undefined,
        birthDate: personal.birthDate ?? null,
        emergencyContactName: personal.emergencyContactName,
        emergencyContactPhone: personal.emergencyContactPhone,
        firstName: personal.firstName.trim(),
        lastName: personal.lastName.trim(),
      });
      setSaving(false);
      reset();
    }, 600);
  }, [validate, onCreated, personal, notes, reset]);

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
          <View style={{ maxHeight: "85%" }}>
            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
              <PersonalInformation value={personal} onChange={setPersonal} />
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
  linkRequestsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2563EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  linkRequestsButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2563EB",
  },
});
