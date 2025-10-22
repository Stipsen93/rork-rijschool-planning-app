import React, { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { X, Check } from "lucide-react-native";
import { StudentFilters } from "./StudentSearchBar";

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: StudentFilters;
  onApply: (filters: StudentFilters) => void;
}

export function FilterModal({ visible, onClose, filters, onApply }: Props) {
  const [localFilters, setLocalFilters] = useState<StudentFilters>(filters);

  const toggleActivityStatus = (status: "active" | "irregular" | "inactive") => {
    setLocalFilters(prev => ({
      ...prev,
      activityStatus: prev.activityStatus.includes(status)
        ? prev.activityStatus.filter(s => s !== status)
        : [...prev.activityStatus, status]
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: StudentFilters = {
      activityStatus: [],
      passed: null,
      theoryPassed: null,
      practicalExamBooked: null,
      dateAddedFrom: null,
      dateAddedTo: null,
    };
    setLocalFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  return (
    <Modal visible={visible} animationType={Platform.OS === "web" ? "none" : "slide"} transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter leerlingen</Text>
            <Pressable accessibilityLabel="Sluiten" onPress={onClose} hitSlop={10} testID="close-filter-modal">
              <X color="#111827" size={24} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activiteitsstatus</Text>
              <View style={styles.optionsGrid}>
                <FilterOption
                  label="Actief"
                  selected={localFilters.activityStatus.includes("active")}
                  onPress={() => toggleActivityStatus("active")}
                  color="#22c55e"
                />
                <FilterOption
                  label="Onregelmatig"
                  selected={localFilters.activityStatus.includes("irregular")}
                  onPress={() => toggleActivityStatus("irregular")}
                  color="#f59e0b"
                />
                <FilterOption
                  label="Niet-actief"
                  selected={localFilters.activityStatus.includes("inactive")}
                  onPress={() => toggleActivityStatus("inactive")}
                  color="#ef4444"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status rijbewijs</Text>
              <View style={styles.optionsGrid}>
                <FilterOption
                  label="Geslaagd"
                  selected={localFilters.passed === true}
                  onPress={() => setLocalFilters(prev => ({ ...prev, passed: prev.passed === true ? null : true }))}
                />
                <FilterOption
                  label="Nog bezig"
                  selected={localFilters.passed === false}
                  onPress={() => setLocalFilters(prev => ({ ...prev, passed: prev.passed === false ? null : false }))}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Theorie status</Text>
              <View style={styles.optionsGrid}>
                <FilterOption
                  label="Theorie behaald"
                  selected={localFilters.theoryPassed === true}
                  onPress={() => setLocalFilters(prev => ({ ...prev, theoryPassed: prev.theoryPassed === true ? null : true }))}
                />
                <FilterOption
                  label="Theorie niet behaald"
                  selected={localFilters.theoryPassed === false}
                  onPress={() => setLocalFilters(prev => ({ ...prev, theoryPassed: prev.theoryPassed === false ? null : false }))}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Praktijkexamen</Text>
              <View style={styles.optionsGrid}>
                <FilterOption
                  label="Praktijkexamen geboekt"
                  selected={localFilters.practicalExamBooked === true}
                  onPress={() => setLocalFilters(prev => ({ ...prev, practicalExamBooked: prev.practicalExamBooked === true ? null : true }))}
                />
                <FilterOption
                  label="Nog niet geboekt"
                  selected={localFilters.practicalExamBooked === false}
                  onPress={() => setLocalFilters(prev => ({ ...prev, practicalExamBooked: prev.practicalExamBooked === false ? null : false }))}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.7 : 1 }]}
              testID="reset-filters"
            >
              <Text style={styles.secondaryBtnText}>Reset</Text>
            </Pressable>
            <Pressable
              onPress={handleApply}
              style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.7 : 1 }]}
              testID="apply-filters"
            >
              <Text style={styles.primaryBtnText}>Toepassen</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface FilterOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}

function FilterOption({ label, selected, onPress, color }: FilterOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        { opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Check color="#fff" size={16} />}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
        {color && <View style={[styles.colorDot, { backgroundColor: color }]} />}
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  optionsGrid: {
    gap: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  optionSelected: {
    borderColor: "#2f95dc",
    backgroundColor: "#e6f2fb",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#2f95dc",
    borderColor: "#2f95dc",
  },
  optionText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  optionTextSelected: {
    color: "#2f95dc",
    fontWeight: "600",
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  secondaryBtnText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#2f95dc",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
