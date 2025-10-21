import React, { memo, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, Car, CalendarCheck, School, ClipboardCheck } from "lucide-react-native";

export type Category = "Auto" | "Pauze" | "Verlof";

export interface CategoryTypeSectionProps {
  selectedCategory: Category;
  selectedAppointmentType: string;
  appointmentTypes: string[];
  onCategoryChanged: (value: Category) => void;
  onAppointmentTypeChanged: (value: string) => void;
  showAppointmentType?: boolean;
  testID?: string;
}

function iconForType(type: string) {
  switch (type) {
    case "Rijles":
      return <Car size={18} color="#2563eb" />;
    case "Praktijkexamen":
      return <ClipboardCheck size={18} color="#2563eb" />;
    case "Theorieles":
      return <School size={18} color="#2563eb" />;
    case "Tussentijdse toets":
      return <CalendarCheck size={18} color="#2563eb" />;
    default:
      return <ClipboardCheck size={18} color="#2563eb" />;
  }
}

function CategoryTypeSectionComponent({ selectedCategory, selectedAppointmentType, appointmentTypes, onCategoryChanged, onAppointmentTypeChanged, showAppointmentType = true, testID }: CategoryTypeSectionProps) {
  const categories = useMemo<Category[]>(() => ["Auto", "Pauze", "Verlof"], []);
  const [typeOpen, setTypeOpen] = useState<boolean>(false);

  return (
    <View style={styles.container} testID={testID ?? "category-type-section"}>
      <Text style={styles.title}>Categorie{showAppointmentType ? " & Type" : ""}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Categorie</Text>
        <View style={styles.row}>
          {categories.map((c) => (
            <Pressable key={c} onPress={() => onCategoryChanged(c)} style={({ pressed }) => [styles.catBtn, selectedCategory === c && styles.catBtnActive, pressed && Platform.OS !== "web" && { opacity: 0.9 }]} accessibilityRole="button" accessibilityLabel={`Selecteer ${c}`}>
              <Text style={[styles.catText, selectedCategory === c && styles.catTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {showAppointmentType && (
        <View style={styles.card}>
          <Text style={styles.label}>Soort afspraak</Text>
          <Pressable onPress={() => setTypeOpen((s) => !s)} style={styles.select} accessibilityRole="button" testID="open-type-dropdown">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {iconForType(selectedAppointmentType)}
              <Text style={styles.selectValue}>{selectedAppointmentType}</Text>
            </View>
            <ChevronDown size={18} color="#6b7280" />
          </Pressable>

          {typeOpen && (
            <View style={styles.menu}>
              {appointmentTypes.map((t) => (
                <Pressable key={t} onPress={() => { onAppointmentTypeChanged(t); setTypeOpen(false); }} style={({ pressed }) => [styles.menuItem, pressed && Platform.OS !== "web" && { backgroundColor: "#f3f4f6" }]} accessibilityRole="button" testID={`type-${t}`}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {iconForType(t)}
                    <Text style={styles.menuText}>{t}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export const CategoryTypeSection = memo(CategoryTypeSectionComponent);

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  row: { flexDirection: "row", gap: 8 },
  catBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", backgroundColor: "#fff" },
  catBtnActive: { backgroundColor: "#2563eb" },
  catText: { color: "#111827", fontWeight: "600" },
  catTextActive: { color: "#fff" },
  select: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fafafa" },
  selectValue: { fontWeight: "600", color: "#111827" },
  menu: { marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, overflow: "hidden" },
  menuItem: { paddingVertical: 12, paddingHorizontal: 12, backgroundColor: "#fff" },
  menuText: { color: "#111827" },
});
