import React, { memo, useMemo, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Search, ChevronDown, ChevronRight } from "lucide-react-native";

export type Student = { id: string; name: string; email: string; status: "active" | "irregular" | "inactive" };
export type Vehicle = { id: string; model: string; licensePlate: string; type: string; year: number };

export interface StudentVehicleSectionProps {
  students: Student[];
  vehicles: Vehicle[];
  selectedStudentId?: string | null;
  selectedVehicleId?: string | null;
  onStudentSelected: (id: string) => void;
  onVehicleSelected: (id: string) => void;
  testID?: string;
}

function StudentVehicleSectionComponent({ students, vehicles, selectedStudentId, selectedVehicleId, onStudentSelected, onVehicleSelected, testID }: StudentVehicleSectionProps) {
  const [showStudentSearch, setShowStudentSearch] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [vehicleOpen, setVehicleOpen] = useState<boolean>(false);

  const filtered = useMemo(() => {
    if (!query) return students;
    const q = query.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [students, query]);

  const selectedStudent = useMemo(() => students.find((s) => s.id === selectedStudentId), [students, selectedStudentId]);
  const selectedVehicle = useMemo(() => vehicles.find((v) => v.id === selectedVehicleId), [vehicles, selectedVehicleId]);

  return (
    <View style={styles.container} testID={testID ?? "student-vehicle-section"}>
      <Text style={styles.title}>Leerling & Voertuig</Text>

      <View style={styles.column}>
        <View>
          <Text style={styles.label}>Leerling</Text>
          {!showStudentSearch && !selectedStudent && (
            <Pressable onPress={() => setShowStudentSearch(true)} style={styles.searchLauncher} testID="launch-student-search">
              <Search size={18} color="#6b7280" />
              <Text style={styles.placeholder}>Zoek een leerling...</Text>
            </Pressable>
          )}

          {!showStudentSearch && selectedStudent && (
            <View style={styles.selectedCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName} numberOfLines={2}>{selectedStudent.name}</Text>
                  <Text style={styles.studentEmail} numberOfLines={1}>{selectedStudent.email}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: selectedStudent.status === "active" ? "#22c55e" : selectedStudent.status === "irregular" ? "#f59e0b" : "#ef4444" }]} />
              </View>
              <View style={styles.rowBetween}>
                <Pressable onPress={() => setShowStudentSearch(true)} accessibilityRole="button">
                  <Text style={styles.changeBtn}>Wijzig</Text>
                </Pressable>
              </View>
            </View>
          )}

          {showStudentSearch && (
            <View>
              <View style={styles.inputWrap}>
                <Search size={18} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Zoek op naam of email..."
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                />
                <Pressable onPress={() => { setShowStudentSearch(false); setQuery(""); }} accessibilityRole="button">
                  <Text style={styles.cancel}>Annuleer</Text>
                </Pressable>
              </View>

              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 240 }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => { onStudentSelected(item.id); setShowStudentSearch(false); setQuery(""); }} style={({ pressed }) => [styles.studentItem, pressed && Platform.OS !== "web" && { backgroundColor: "#f3f4f6" }]}>
                    <View style={styles.avatarSmall} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.studentItemEmail} numberOfLines={1}>{item.email}</Text>
                      <View style={[styles.statusDot, { backgroundColor: item.status === "active" ? "#22c55e" : item.status === "irregular" ? "#f59e0b" : "#ef4444" }]} />
                    </View>
                    <ChevronRight size={18} color="#6b7280" />
                  </Pressable>
                )}
              />
            </View>
          )}
        </View>

        <View style={{ height: 16 }} />

        <View>
          <Text style={styles.label}>Voertuig</Text>
          <Pressable onPress={() => setVehicleOpen((s) => !s)} style={styles.vehicleSelect} accessibilityRole="button" testID="open-vehicle-dropdown">
            <Text style={styles.vehicleValue} numberOfLines={1}>{selectedVehicle ? `${selectedVehicle.model} (${selectedVehicle.licensePlate})` : "Voertuig"}</Text>
            <ChevronDown size={18} color="#6b7280" />
          </Pressable>
          {vehicleOpen && (
            <View style={styles.menu}>
              {vehicles.map((v) => (
                <Pressable key={v.id} onPress={() => { onVehicleSelected(v.id); setVehicleOpen(false); }} style={({ pressed }) => [styles.menuItem, pressed && Platform.OS !== "web" && { backgroundColor: "#f3f4f6" }]}>
                  <Text style={styles.menuText} numberOfLines={1}>{`${v.model} • ${v.licensePlate}`}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export const StudentVehicleSection = memo(StudentVehicleSectionComponent);

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  column: { gap: 0 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  searchLauncher: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, backgroundColor: "#fff" },
  placeholder: { color: "#6b7280" },
  selectedCard: { padding: 12, backgroundColor: "#eff6ff", borderRadius: 8, borderWidth: 1, borderColor: "#93c5fd", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e5e7eb" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  studentName: { fontWeight: "700" },
  studentEmail: { color: "#6b7280" },
  studentStats: { color: "#2563eb", fontWeight: "600" },
  changeBtn: { color: "#2563eb", fontWeight: "600" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#fff" },
  input: { flex: 1 },
  cancel: { color: "#2563eb", fontWeight: "600" },
  studentItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 8 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e5e7eb" },
  studentItemName: { fontWeight: "600" },
  studentItemEmail: { color: "#6b7280", fontSize: 12 },
  studentItemMeta: { color: "#2563eb", fontSize: 12 },
  vehicleSelect: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, backgroundColor: "#fff" },
  vehicleValue: { color: "#111827" },
  menu: { marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" },
  menuItem: { paddingVertical: 12, paddingHorizontal: 12 },
  menuText: { color: "#111827" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
