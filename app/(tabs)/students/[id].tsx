import React, { useMemo, useMemo as _useMemo, useState, useCallback, useEffect } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

type StatusType = "active" | "irregular" | "inactive" | string | undefined;

type PackageItem = {
  id: string;
  name: string;
  hours: number;
  price: number;
  vatStatus?: "incl" | "excl";
  isProduct?: boolean;
};

type StudentPackage = {
  id: string;
  packageId: string;
  paymentTerms: string;
  installments: { installmentNumber: number; amount: number; paid: boolean; paidDate?: string | null; dueDate?: string | null }[];
  paymentStatus: "paid" | "unpaid" | "partial";
  addedDate: string;
};

export default function StudentProfileScreen() {
  const raw = useLocalSearchParams();
  const params = {
    id: (raw.id as string) ?? undefined,
    name: (raw.name as string) ?? undefined,
    email: (raw.email as string) ?? undefined,
    status: (raw.status as StatusType) ?? undefined,
    hasScheduledExam: raw.hasScheduledExam === "true",
  };
  const insets = useSafeAreaInsets();

  const statusColor = useMemo(() => {
    switch (params.status) {
      case "active":
        return "#22c55e";
      case "irregular":
        return "#f59e0b";
      case "inactive":
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  }, [params.status]);

  const [availablePackages, setAvailablePackages] = useState<PackageItem[]>([]);
  const [settingsPackages, setSettingsPackages] = useState<PackageItem[]>([]);
  const [settingsProducts, setSettingsProducts] = useState<PackageItem[]>([]);
  const [studentPackages, setStudentPackages] = useState<StudentPackage[]>([]);

  const [addVisible, setAddVisible] = useState<boolean>(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [paymentTerm, setPaymentTerm] = useState<string>("1x");
  const [customTerms, setCustomTerms] = useState<number>(2);
  const [looseHours, setLooseHours] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const [pkgStr, prodStr] = await Promise.all([
          AsyncStorage.getItem("instructor_packages"),
          AsyncStorage.getItem("instructor_products"),
        ]);
        const pkgs = (pkgStr ? JSON.parse(pkgStr) : []) as { id: string; name: string; hours: number; price: number; vatStatus: "incl" | "excl" }[];
        const prods = (prodStr ? JSON.parse(prodStr) : []) as { id: string; name: string; price: number; vatStatus: "incl" | "excl" }[];
        const mappedPkgs: PackageItem[] = pkgs.map((p) => ({ id: p.id, name: p.name, hours: p.hours, price: p.price, vatStatus: p.vatStatus, isProduct: false }));
        const mappedProds: PackageItem[] = prods.map((p) => ({ id: p.id, name: p.name, hours: 0, price: p.price, vatStatus: p.vatStatus, isProduct: true }));
        setSettingsPackages(mappedPkgs);
        setSettingsProducts(mappedProds);
        setAvailablePackages([...mappedPkgs, ...mappedProds]);
      } catch (e) {
        console.log("[StudentProfile] Failed to load settings packages/products", e);
      }
    })();
  }, []);

  const openAdd = useCallback(() => {
    setSelectedPackageId(null);
    setPaymentTerm("1x");
    setCustomTerms(2);
    setLooseHours("");
    setAddVisible(true);
  }, []);
  const closeAdd = useCallback(() => setAddVisible(false), []);

  const onAddConfirm = useCallback(() => {
    if (selectedPackageId) {
      const pkg = availablePackages.find(p => p.id === selectedPackageId);
      const terms = paymentTerm === "custom" ? customTerms : paymentTerm === "1x" ? 1 : parseInt(paymentTerm.replace("x", ""), 10);
      const totalPrice = pkg?.price ?? 0;
      const installmentAmount = terms > 0 ? totalPrice / terms : totalPrice;
      const installments = Array.from({ length: terms }, (_, i) => ({ installmentNumber: i + 1, amount: installmentAmount, paid: false, paidDate: null, dueDate: null }));
      const sp: StudentPackage = {
        id: Date.now().toString(),
        packageId: selectedPackageId,
        paymentTerms: paymentTerm,
        installments,
        paymentStatus: terms === 1 ? "unpaid" : "unpaid",
        addedDate: new Date().toISOString(),
      };
      setStudentPackages(prev => [...prev, sp]);
      console.log("Added package", sp);
      closeAdd();
      return;
    }
    const hoursNum = parseInt(looseHours, 10);
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) {
      Alert.alert("Ongeldig aantal", "Voer een geldig aantal uren in");
      return;
    }
    const pricePerHour = 45;
    const totalPrice = hoursNum * pricePerHour;
    const terms = paymentTerm === "custom" ? customTerms : paymentTerm === "1x" ? 1 : parseInt(paymentTerm.replace("x", ""), 10);
    const installmentAmount = terms > 0 ? totalPrice / terms : totalPrice;
    const installments = Array.from({ length: terms }, (_, i) => ({ installmentNumber: i + 1, amount: installmentAmount, paid: false, paidDate: null, dueDate: null }));
    const sp: StudentPackage = {
      id: Date.now().toString(),
      packageId: `loose_hours_${Date.now()}`,
      paymentTerms: paymentTerm,
      installments,
      paymentStatus: terms === 1 ? "unpaid" : "unpaid",
      addedDate: new Date().toISOString(),
    };
    setStudentPackages(prev => [...prev, sp]);
    console.log("Added loose hours", { hoursNum, totalPrice });
    closeAdd();
  }, [availablePackages, closeAdd, customTerms, looseHours, paymentTerm, selectedPackageId]);

  const markInstallmentPaid = useCallback((pkgIndex: number, installmentIndex: number) => {
    setStudentPackages(prev => {
      const copy = [...prev];
      const target = copy[pkgIndex];
      if (!target) return prev;
      const inst = [...target.installments];
      if (installmentIndex < 0 || installmentIndex >= inst.length) return prev;
      inst[installmentIndex] = { ...inst[installmentIndex], paid: true, paidDate: new Date().toISOString() };
      const paidCount = inst.filter(i => i.paid).length;
      const paymentStatus: StudentPackage["paymentStatus"] = paidCount === inst.length ? "paid" : paidCount > 0 ? "partial" : "unpaid";
      copy[pkgIndex] = { ...target, installments: inst, paymentStatus };
      return copy;
    });
  }, []);

  const setPaymentStatus = useCallback((pkgIndex: number, status: StudentPackage["paymentStatus"]) => {
    setStudentPackages(prev => {
      const copy = [...prev];
      if (!copy[pkgIndex]) return prev;
      copy[pkgIndex] = { ...copy[pkgIndex], paymentStatus: status };
      return copy;
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: params.name ?? "Leerling", headerBackTitle: "Terug" }} />
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]} testID="student-profile">
        <View style={styles.headerCard}>
          <View style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{params.name ?? "Onbekende leerling"}</Text>
            <Text style={styles.email}>{params.email ?? "-"}</Text>
            <Text style={[styles.badge, { backgroundColor: statusColor }]}>{labelForStatus(params.status)}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <StatCard title="Uren gereden" value="5u" color="#22c55e" />
          <StatCard title="Uren betaald" value="10u" color="#111827" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status informatie</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Huidige status</Text>
            <Text style={styles.statusValue}>{labelForStatus(params.status)}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Laatste les</Text>
            <Text style={styles.statusValue}>—</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recente lessen</Text>
          {["Theorieles • 2 okt 2025 • 60 min", "Praktijkles • 28 sep 2025 • 90 min", "Praktijkles • 25 sep 2025 • 90 min"].map((t, i) => (
            <View key={i} style={styles.lessonRow}>
              <Text style={styles.lessonText}>{t}</Text>
              <View style={styles.lessonBadge}><Text style={styles.lessonBadgeText}>Voltooid</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pakketten/Uren</Text>
          {studentPackages.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Nog geen pakketten of uren toegevoegd</Text>
              <Text style={styles.emptySub}>Voeg pakketten of uren toe om de leerling lessen te kunnen geven</Text>
              <TouchableOpacity onPress={openAdd} style={[styles.primaryBtn, { marginTop: 12 }]} testID="add-package-btn">
                <Text style={styles.primaryBtnText}>Pakket of Uren Toevoegen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {studentPackages.map((pkg, idx) => {
                const info = availablePackages.find(p => p.id === pkg.packageId);
                return (
                  <View key={pkg.id} style={styles.pkgCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.pkgTitle}>{info?.name ?? "Onbekend pakket"}</Text>
                        <Text style={styles.pkgSub}>{info?.isProduct ? `Product • €${(info?.price ?? 0).toFixed(2)}` : `${info?.hours ?? 0} uren • €${(info?.price ?? 0).toFixed(2)}`}</Text>
                      </View>
                    </View>

                    {pkg.installments.length > 0 ? (
                      <View style={{ gap: 8 }}>
                        <View style={styles.statusRow}>
                          <Text style={styles.statusLabel}>Betaalstatus</Text>
                          <Text style={[styles.statusValue, { color: pkg.paymentStatus === "paid" ? "#16a34a" : pkg.paymentStatus === "partial" ? "#f59e0b" : "#111827" }]}>{pkg.paymentStatus === "paid" ? "Volledig betaald" : pkg.paymentStatus === "partial" ? "Gedeeltelijk betaald" : "Niet betaald"}</Text>
                        </View>
                        <View style={styles.dropdownBox}>
                          <Text style={styles.dropdownLabel}>Markeer termijn als betaald</Text>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                            {pkg.installments.map((inst, i) => (
                              <TouchableOpacity
                                key={i}
                                onPress={() => (!inst.paid ? markInstallmentPaid(idx, i) : undefined)}
                                style={[styles.chip, inst.paid && { backgroundColor: "#16a34a" }]}>
                                <Text style={[styles.chipText, inst.paid && { color: "#fff" }]}>
                                  Termijn {inst.installmentNumber} {inst.paid ? "• Betaald" : ""}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.dropdownBox}>
                        <Text style={styles.dropdownLabel}>Betaalstatus</Text>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          {["paid", "unpaid"].map(s => (
                            <TouchableOpacity key={s} onPress={() => setPaymentStatus(idx, s as StudentPackage["paymentStatus"])} style={[styles.chip, pkg.paymentStatus === s && { backgroundColor: "#0ea5e9" }]}>
                              <Text style={[styles.chipText, pkg.paymentStatus === s && { color: "#fff" }]}>{s === "paid" ? "Betaald" : "Niet betaald"}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity onPress={openAdd} style={[styles.secondaryBtn]}>
                <Text style={styles.secondaryBtnText}>Nieuw pakket of uren toevoegen</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <AddPackageModal
        visible={addVisible}
        onClose={closeAdd}
        packages={availablePackages}
        packagesGroup={settingsPackages}
        productsGroup={settingsProducts}
        selectedPackageId={selectedPackageId}
        setSelectedPackageId={setSelectedPackageId}
        paymentTerm={paymentTerm}
        setPaymentTerm={setPaymentTerm}
        customTerms={customTerms}
        setCustomTerms={setCustomTerms}
        looseHours={looseHours}
        setLooseHours={setLooseHours}
        onConfirm={onAddConfirm}
      />
    </View>
  );
}

function labelForStatus(status?: StatusType) {
  switch (status) {
    case "active":
      return "Actief";
    case "irregular":
      return "Onregelmatig";
    case "inactive":
      return "Inactief";
    default:
      return "Onbekend";
  }
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "33" }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function AddPackageModal({
  visible,
  onClose,
  packages,
  packagesGroup,
  productsGroup,
  selectedPackageId,
  setSelectedPackageId,
  paymentTerm,
  setPaymentTerm,
  customTerms,
  setCustomTerms,
  looseHours,
  setLooseHours,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  packages: PackageItem[];
  packagesGroup: PackageItem[];
  productsGroup: PackageItem[];
  selectedPackageId: string | null;
  setSelectedPackageId: (v: string | null) => void;
  paymentTerm: string;
  setPaymentTerm: (v: string) => void;
  customTerms: number;
  setCustomTerms: (v: number) => void;
  looseHours: string;
  setLooseHours: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Pakket, Uren of Product Toevoegen</Text>

          <Text style={styles.modalLabel}>Selecteer Pakket/Uren/Product</Text>
          <View style={styles.dropdownBox}>
            <View style={{ gap: 12 }}>
              <Text style={styles.groupLabel}>Pakketten</Text>
              {packagesGroup.length === 0 ? (
                <Text style={styles.mutedText}>Geen pakketten gevonden. Voeg ze toe bij Instellingen → Pakketten/Uren.</Text>
              ) : (
                packagesGroup.map((p) => (
                  <TouchableOpacity key={`pkg-${p.id}`} onPress={() => setSelectedPackageId(p.id)} style={[styles.optionRow, selectedPackageId === p.id && styles.optionRowActive]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionTitle}>{p.name}</Text>
                      <Text style={styles.optionSub}>{`${p.hours} uren`}</Text>
                    </View>
                    <Text style={styles.optionPrice}>€{p.price.toFixed(2)}</Text>
                  </TouchableOpacity>
                ))
              )}

              <View style={{ height: 1, backgroundColor: "#e5e7eb" }} />

              <Text style={styles.groupLabel}>Producten</Text>
              {productsGroup.length === 0 ? (
                <Text style={styles.mutedText}>Geen producten gevonden. Voeg ze toe bij Instellingen → Pakketten/Uren.</Text>
              ) : (
                productsGroup.map((p) => (
                  <TouchableOpacity key={`prd-${p.id}`} onPress={() => setSelectedPackageId(p.id)} style={[styles.optionRow, selectedPackageId === p.id && styles.optionRowActive]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionTitle}>{p.name}</Text>
                      <Text style={styles.optionSub}>Product</Text>
                    </View>
                    <Text style={styles.optionPrice}>€{p.price.toFixed(2)}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          <Text style={styles.modalLabel}>Betalingstermijnen</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["1x", "2x", "3x", "4x", "custom"].map((t) => (
              <TouchableOpacity key={t} onPress={() => setPaymentTerm(t)} style={[styles.chip, paymentTerm === t && { backgroundColor: "#0ea5e9" }]}>
                <Text style={[styles.chipText, paymentTerm === t && { color: "#fff" }]}>{t === "custom" ? "Aangepast" : t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {paymentTerm === "custom" && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
              <TouchableOpacity onPress={() => setCustomTerms(Math.max(2, customTerms - 1))} style={styles.numberBtn}><Text style={styles.numberBtnText}>-</Text></TouchableOpacity>
              <Text style={styles.customTerms}>{customTerms} termijnen</Text>
              <TouchableOpacity onPress={() => setCustomTerms(Math.min(12, customTerms + 1))} style={styles.numberBtn}><Text style={styles.numberBtnText}>+</Text></TouchableOpacity>
            </View>
          )}

          <View style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 12 }} />

          <Text style={styles.modalLabel}>Losse Uren Toevoegen</Text>
          <TextInput
            value={looseHours}
            onChangeText={setLooseHours}
            placeholder="Aantal uren"
            keyboardType={Platform.OS === "web" ? "numeric" : "number-pad"}
            style={styles.input}
            testID="loose-hours-input"
          />

          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <TouchableOpacity onPress={onClose} style={[styles.secondaryBtn, { flex: 1 }]} testID="cancel-add">
              <Text style={styles.secondaryBtnText}>Annuleren</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={[styles.primaryBtn, { flex: 1 }]} testID="confirm-add">
              <Text style={styles.primaryBtnText}>Toevoegen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  headerCard: {
    flexDirection: "row",
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
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#e5e7eb" },
  name: { fontSize: 18, fontWeight: "700" },
  email: { color: "#6b7280", marginTop: 4 },
  badge: { alignSelf: "flex-start", color: "#fff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: "hidden", marginTop: 8, fontWeight: "700" },
  row: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1 },
  statValue: { fontSize: 20, fontWeight: "800", marginTop: 6 },
  statTitle: { color: "#6b7280", marginTop: 2 },
  card: { padding: 16, borderRadius: 12, backgroundColor: "#fff", gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  statusRow: { flexDirection: "row", justifyContent: "space-between" },
  statusLabel: { color: "#6b7280" },
  statusValue: { fontWeight: "700" },
  lessonRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lessonText: { color: "#111827" },
  lessonBadge: { backgroundColor: "#16a34a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  lessonBadgeText: { color: "#fff", fontWeight: "700" },
  emptyBox: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb", alignItems: "center" },
  emptyTitle: { fontWeight: "700", fontSize: 16, textAlign: "center" },
  emptySub: { color: "#6b7280", marginTop: 4, textAlign: "center" },
  primaryBtn: { backgroundColor: "#2f95dc", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { backgroundColor: "#e5e7eb", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: "center" },
  secondaryBtnText: { color: "#111827", fontWeight: "700" },
  pkgCard: { padding: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  pkgTitle: { fontWeight: "700", fontSize: 16 },
  pkgSub: { color: "#2563eb", marginTop: 2 },
  dropdownBox: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb" },
  dropdownLabel: { color: "#6b7280", marginBottom: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#e5e7eb" },
  chipText: { color: "#111827", fontWeight: "700" },
  optionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  optionRowActive: { borderColor: "#0ea5e9", backgroundColor: "#f0f9ff" },
  optionTitle: { fontWeight: "700" },
  optionSub: { color: "#6b7280" },
  optionPrice: { fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: "800" },
  modalLabel: { fontWeight: "700", marginTop: 8 },
  groupLabel: { fontWeight: "700", color: "#0f172a" },
  mutedText: { color: "#6b7280" },
  numberBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  numberBtnText: { fontSize: 18, fontWeight: "800" },
  customTerms: { fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
});
