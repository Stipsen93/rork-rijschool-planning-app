import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Tag, Check, Clock } from "lucide-react-native";

export interface PackageItem { id: string; name: string; lessons: number; price: number; }
export interface PackageAssignmentData { packages: PackageItem[]; selectedPackage?: PackageItem | null; }

export function PackageAssignment({ value, onChange }: { value: PackageAssignmentData; onChange: (v: PackageAssignmentData) => void; }) {
  const [local, setLocal] = useState<PackageAssignmentData>(value);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => onChange(local), [local, onChange]);

  const select = (pkg: PackageItem | null) => {
    setLocal((p) => ({ ...p, selectedPackage: pkg }));
  };

  return (
    <View style={styles.card} testID="package-assignment">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Tag color="#2f95dc" />
        <Text style={styles.title}>Pakket toewijzen</Text>
      </View>
      <Text style={styles.hint}>Kies een lessenpakket om direct toe te wijzen</Text>

      <View style={{ gap: 12 }}>
        {local.packages.map((pkg) => {
          const sel = local.selectedPackage?.id === pkg.id;
          return (
            <Pressable key={pkg.id} onPress={() => select(pkg)} style={[styles.row, sel && styles.rowActive]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.pkgTitle, sel && styles.pkgTitleActive]}>{pkg.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Clock color="#9ca3af" size={16} />
                  <Text style={styles.pkgSub}>{pkg.lessons} lessen</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.price, sel && styles.priceActive]}>€{pkg.price.toFixed(2)}</Text>
                <View style={[styles.radio, sel && styles.radioActive]}>{sel ? <Check color="#fff" size={14} /> : null}</View>
              </View>
            </Pressable>
          );
        })}

        <Pressable onPress={() => select(null)} style={[styles.row, !local.selectedPackage && styles.rowActive]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.pkgTitle, !local.selectedPackage && styles.pkgTitleActive]}>Geen pakket toewijzing</Text>
            <Text style={styles.pkgSub}>Wijs later toe of gebruik losse lessen</Text>
          </View>
          <View style={[styles.radio, !local.selectedPackage && styles.radioActive]}>{!local.selectedPackage ? <Check color="#fff" size={14} /> : null}</View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  title: { fontWeight: "700", color: "#2f95dc" },
  hint: { color: "#6b7280", fontSize: 12 },
  row: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  rowActive: { borderColor: "#2f95dc", backgroundColor: "#e6f3fc" },
  pkgTitle: { fontWeight: "600", color: "#111827" },
  pkgTitleActive: { color: "#2f95dc" },
  pkgSub: { color: "#6b7280", fontSize: 12 },
  price: { fontWeight: "700", color: "#111827" },
  priceActive: { color: "#2f95dc" },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  radioActive: { backgroundColor: "#2f95dc", borderColor: "#2f95dc" },
});