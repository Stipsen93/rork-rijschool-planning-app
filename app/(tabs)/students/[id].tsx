import React, { useMemo, useMemo as _useMemo, useState, useCallback, useEffect } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pencil, Trash2, X } from "lucide-react-native";
import { useAgenda } from "@/components/agenda/AgendaStore";

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
  customName?: string;
  customPrice?: number;
  customHours?: number;
  includedProductIds?: string[];
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
  const [hourlyPrice, setHourlyPrice] = useState<number>(0);

  const [addVisible, setAddVisible] = useState<boolean>(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [paymentTerm, setPaymentTerm] = useState<string>("1x");
  const [customTerms, setCustomTerms] = useState<number>(2);
  const [looseHours, setLooseHours] = useState<string>("");
  const [editIdx, setEditIdx] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [pkgStr, prodStr, hourlyStr] = await Promise.all([
          AsyncStorage.getItem("instructor_packages"),
          AsyncStorage.getItem("instructor_products"),
          AsyncStorage.getItem("instructor_hourly_rates"),
        ]);
        const pkgs = (pkgStr ? JSON.parse(pkgStr) : []) as { id: string; name: string; hours: number; price: number; vatStatus: "incl" | "excl" }[];
        const prods = (prodStr ? JSON.parse(prodStr) : []) as { id: string; name: string; price: number; vatStatus: "incl" | "excl" }[];
        const mappedPkgs: PackageItem[] = pkgs.map((p) => ({ id: p.id, name: p.name, hours: p.hours, price: p.price, vatStatus: p.vatStatus, isProduct: false }));
        const mappedProds: PackageItem[] = prods.map((p) => ({ id: p.id, name: p.name, hours: 0, price: p.price, vatStatus: p.vatStatus, isProduct: true }));
        setSettingsPackages(mappedPkgs);
        setSettingsProducts(mappedProds);
        setAvailablePackages([...mappedPkgs, ...mappedProds]);
        if (hourlyStr) {
          try {
            const parsed = JSON.parse(hourlyStr) as { price?: number };
            setHourlyPrice(Number(parsed?.price ?? 0));
          } catch (err) {
            console.log("[StudentProfile] Failed to parse hourly rates", err);
          }
        }
        if (params.id) {
          try {
            const key = `student_packages_${params.id}`;
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
              const parsed = JSON.parse(stored) as StudentPackage[];
              setStudentPackages(parsed);
              console.log("[StudentProfile] Loaded student packages from storage", { count: parsed.length });
            }
          } catch (err) {
            console.log("[StudentProfile] Failed to load student packages", err);
          }
        }
      } catch (e) {
        console.log("[StudentProfile] Failed to load settings packages/products", e);
      }
    })();
  }, []);

  const saveDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!params.id) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      AsyncStorage.setItem(`student_packages_${params.id}` as const, JSON.stringify(studentPackages))
        .then(() => console.log("[StudentProfile] Persisted student packages", { id: params.id, count: studentPackages.length }))
        .catch((e) => console.log("[StudentProfile] Failed to persist student packages", e));
    }, 400);
    return () => { if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current); };
  }, [studentPackages, params.id]);

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
    const pricePerHour = hourlyPrice > 0 ? hourlyPrice : 45;
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
      customName: "Losse uren",
      customPrice: totalPrice,
      customHours: hoursNum,
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

  const unmarkInstallment = useCallback((pkgIndex: number, installmentIndex: number) => {
    setStudentPackages(prev => {
      const copy = [...prev];
      const target = copy[pkgIndex];
      if (!target) return prev;
      const inst = [...target.installments];
      if (installmentIndex < 0 || installmentIndex >= inst.length) return prev;
      inst[installmentIndex] = { ...inst[installmentIndex], paid: false, paidDate: null };
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
      <Stack.Screen options={{ title: "Leerlingen", headerBackTitle: "Terug" }} />
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]} testID="student-profile">
        <View style={styles.headerCard}>
          <View style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{params.name ?? "Onbekende leerling"}</Text>
            <Text style={styles.email}>{params.email ?? "-"}</Text>
            <Text style={[styles.badge, { backgroundColor: statusColor }]}>{labelForStatus(params.status)}</Text>
          </View>
        </View>

        <StudentOverviewTable studentName={params.name ?? ""} baseItems={availablePackages} products={settingsProducts} studentPackages={studentPackages} />

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
                const isLoose = pkg.packageId.startsWith("loose_hours_");
                const title = isLoose ? "Losse uren" : (pkg.customName ?? info?.name ?? "Onbekend pakket");
                const priceVal = isLoose ? (pkg.customPrice ?? 0) : (pkg.customPrice ?? info?.price ?? 0);
                const hoursVal = isLoose ? (pkg.customHours ?? 0) : (pkg.customHours ?? info?.hours ?? 0);
                const isProduct = Boolean(info?.isProduct) && !isLoose;
                return (
                  <View key={pkg.id} style={styles.pkgCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.pkgTitle}>{`${title} • ${formatDate(pkg.addedDate)}`}</Text>
                        <Text style={styles.pkgSub}>{isProduct ? `Product • €${priceVal.toFixed(2)}` : `${hoursVal} uren • €${priceVal.toFixed(2)}`}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setEditIdx(idx)} accessibilityRole="button" testID={`edit-pkg-${idx}`} style={{ padding: 8 }}>
                        <Pencil size={20} color="#111827" />
                      </TouchableOpacity>
                    </View>

                    {pkg.installments.length > 0 ? (
                      <View style={{ gap: 8 }}>
                        <View style={styles.statusRow}>
                          <Text style={styles.statusLabel}>Betaalstatus</Text>
                          <Text style={[styles.statusValue, { color: pkg.paymentStatus === "paid" ? "#16a34a" : pkg.paymentStatus === "partial" ? "#f59e0b" : "#111827" }]}>{pkg.paymentStatus === "paid" ? "Volledig betaald" : pkg.paymentStatus === "partial" ? "Gedeeltelijk betaald" : "Niet betaald"}</Text>
                        </View>
                        <View style={styles.dropdownBox}>
                          <Text style={styles.dropdownLabel}>Markeer termijn als betaald</Text>
                          <View style={{ gap: 8 }}>
                            {pkg.installments.map((inst, i) => (
                              <View key={i} style={styles.termRow}>
                                <TouchableOpacity
                                  onPress={() => (!inst.paid ? markInstallmentPaid(idx, i) : unmarkInstallment(idx, i))}
                                  style={[styles.termBtn, inst.paid && styles.termBtnPaid]}>
                                  <Text style={[styles.termBtnText, inst.paid && styles.termBtnTextPaid]}>Termijn {inst.installmentNumber}</Text>
                                </TouchableOpacity>
                                <Text style={styles.termDateText}>{inst.paid && inst.paidDate ? formatDate(inst.paidDate) : "–"}</Text>
                              </View>
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

              <TouchableOpacity onPress={openAdd} style={[styles.primaryBtn]}>
                <Text style={styles.primaryBtnText}>Nieuw pakket of uren toevoegen</Text>
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
        hourlyPrice={hourlyPrice}
      />

      <EditStudentPackageModal
        visible={editIdx !== null}
        onClose={() => setEditIdx(null)}
        pkgIndex={editIdx}
        studentPackages={studentPackages}
        setStudentPackages={setStudentPackages}
        basePackages={availablePackages}
        productsGroup={settingsProducts}
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

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
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

function minutesBetween(startHHMM: string, endHHMM: string): number {
  const [sh, sm] = startHHMM.split(":").map((v) => parseInt(v, 10));
  const [eh, em] = endHHMM.split(":").map((v) => parseInt(v, 10));
  const s = (Number.isFinite(sh) ? sh : 0) * 60 + (Number.isFinite(sm) ? sm : 0);
  const e = (Number.isFinite(eh) ? eh : 0) * 60 + (Number.isFinite(em) ? em : 0);
  return Math.max(0, e - s);
}

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.overviewRow}>
      <Text style={styles.overviewLabel}>{label}</Text>
      <Text style={[styles.overviewValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function StudentOverviewTable({ studentName, baseItems, products, studentPackages }: { studentName: string; baseItems: PackageItem[]; products: PackageItem[]; studentPackages: StudentPackage[]; }) {
  const { lessonsByDate } = useAgenda();
  const now = new Date();

  const lessons = useMemo(() => {
    const arr: { date: Date; startTime: string; endTime: string; studentName?: string; lessonType?: string }[] = [];
    Object.values(lessonsByDate).forEach((day) => {
      day.forEach((l) => arr.push({ date: l.date, startTime: l.startTime, endTime: l.endTime, studentName: l.studentName, lessonType: l.lessonType }));
    });
    return arr.filter((l) => (l.studentName ?? "") === studentName);
  }, [lessonsByDate, studentName]);

  const { plannedHours, drivenHours, productPlannedMap } = useMemo(() => {
    let plannedMin = 0;
    let drivenMin = 0;
    const prodPlanned: Record<string, boolean> = {};
    lessons.forEach((l) => {
      const mins = minutesBetween(l.startTime, l.endTime);
      const endDate = new Date(l.date);
      const [eh, em] = l.endTime.split(":").map((v) => parseInt(v, 10));
      endDate.setHours(Number.isFinite(eh) ? eh : 0, Number.isFinite(em) ? em : 0, 0, 0);
      if (endDate.getTime() > now.getTime()) {
        plannedMin += mins;
      } else {
        drivenMin += mins;
      }
      if (l.lessonType) {
        prodPlanned[l.lessonType] = true;
      }
    });
    return { plannedHours: plannedMin / 60, drivenHours: drivenMin / 60, productPlannedMap: prodPlanned };
  }, [lessons, now]);

  const totalAddedHours = useMemo(() => {
    return studentPackages.reduce((sum, sp) => {
      const baseItem = baseItems.find((p) => p.id === sp.packageId);
      const isProduct = baseItem?.isProduct === true;
      if (isProduct) return sum;
      const base = sp.customHours ?? (baseItem?.hours ?? 0);
      return sum + (base || 0);
    }, 0);
  }, [baseItems, studentPackages]);

  const hoursPaid = useMemo(() => {
    return studentPackages.reduce((sum, sp) => {
      const baseItem = baseItems.find((p) => p.id === sp.packageId);
      const isProduct = baseItem?.isProduct === true;
      if (isProduct) return sum;
      const baseHours = sp.customHours ?? (baseItem?.hours ?? 0);
      const total = baseHours || 0;
      const terms = sp.installments.length;
      if (terms === 0) return sum;
      const paidCount = sp.installments.filter((i) => i.paid).length;
      const fraction = total * (paidCount / terms);
      return sum + fraction;
    }, 0);
  }, [baseItems, studentPackages]);

  const hoursOver = useMemo(() => {
    const remaining = totalAddedHours - drivenHours - plannedHours;
    return remaining < 0 ? 0 : remaining;
  }, [totalAddedHours, drivenHours, plannedHours]);

  const aggregatePaymentStatus = useMemo(() => {
    const hoursPackages = studentPackages.filter((sp) => {
      const baseItem = baseItems.find((p) => p.id === sp.packageId);
      return baseItem?.isProduct !== true;
    });
    if (hoursPackages.length === 0) return "unpaid" as const;
    let anyPaid = false;
    let allPaid = true;
    for (const sp of hoursPackages) {
      const terms = sp.installments.length;
      const spAllPaid = terms > 0 ? sp.installments.every((i) => i.paid) : sp.paymentStatus === "paid";
      const spAnyPaid = terms > 0 ? sp.installments.some((i) => i.paid) : sp.paymentStatus === "paid";
      if (spAnyPaid) anyPaid = true;
      if (!spAllPaid) allPaid = false;
    }
    if (allPaid) return "paid" as const;
    if (anyPaid) return "partial" as const;
    return "unpaid" as const;
  }, [baseItems, studentPackages]);

  const productRows = useMemo(() => {
    return products.map((prod) => {
      const direct = studentPackages.filter((sp) => sp.packageId === prod.id);
      const included = studentPackages.filter((sp) => (sp.includedProductIds ?? []).includes(prod.id));
      const count = direct.length + included.length;
      const allPaid = [...direct, ...included].every((sp) => sp.installments.length === 0 ? sp.paymentStatus === "paid" : sp.installments.every((i) => i.paid));
      const planned = Boolean(productPlannedMap[prod.name]);
      return { name: prod.name, count, paid: allPaid && count > 0, planned };
    });
  }, [products, studentPackages, productPlannedMap]);

  const noneAdded = useMemo(() => {
    const hasHours = totalAddedHours > 0;
    const hasProducts = productRows.some((pr) => pr.count > 0);
    return !hasHours && !hasProducts;
  }, [totalAddedHours, productRows]);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Overzicht</Text>
      <View style={{ gap: 10 }}>
        {(() => {
          const neutral = drivenHours === 0 && plannedHours === 0 && hoursPaid === 0;
          return (
            <>
              <Row label="Uren gereden" value={`${round1(drivenHours)} u`} valueColor={drivenHours <= 0 ? "#6b7280" : (drivenHours > hoursPaid ? "#ef4444" : "#22c55e")} />
              {(() => {
                const remainingPaid = Math.max(0, hoursPaid - drivenHours);
                const plannedColor = plannedHours <= 0
                  ? "#6b7280"
                  : (drivenHours > hoursPaid
                      ? "#ef4444"
                      : (noneAdded
                          ? "#6b7280"
                          : (remainingPaid >= plannedHours
                              ? "#16a34a"
                              : (remainingPaid > 0 ? "#f59e0b" : "#2563eb"))));
                return (
                  <Row label="Uren gepland" value={`${round1(plannedHours)} u`} valueColor={plannedColor} />
                );
              })()}
              <Row label="Uren betaald" value={`${round1(hoursPaid)} u`} valueColor={hoursPaid > 0 ? "#16a34a" : "#6b7280"} />
            </>
          );
        })()}

        <Row
          label="Uren over"
          value={`${round1(hoursOver)} u`}
          valueColor={
            noneAdded
              ? "#6b7280"
              : aggregatePaymentStatus === "unpaid" && drivenHours === 0
              ? "#6b7280"
              : aggregatePaymentStatus === "partial"
              ? "#f59e0b"
              : aggregatePaymentStatus === "paid"
              ? "#16a34a"
              : (hoursOver > 0 ? "#16a34a" : "#ef4444")
          }
        />
        <View style={{ height: 8 }} />
        {productRows.map((pr) => (
          <View key={pr.name} style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>{pr.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {pr.planned ? <View style={styles.plannedBadge}><Text style={styles.plannedBadgeText}>Gepland</Text></View> : null}
              <Text style={[styles.overviewValue, { color: pr.count > 0 ? (pr.paid ? "#16a34a" : "#ef4444") : "#6b7280" }]}>{`${pr.count} st`}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function EditStudentPackageModal({
  visible,
  onClose,
  pkgIndex,
  studentPackages,
  setStudentPackages,
  basePackages,
  productsGroup,
}: {
  visible: boolean;
  onClose: () => void;
  pkgIndex: number | null;
  studentPackages: StudentPackage[];
  setStudentPackages: React.Dispatch<React.SetStateAction<StudentPackage[]>>;
  basePackages: PackageItem[];
  productsGroup: PackageItem[];
}) {
  const pkg = typeof pkgIndex === "number" ? studentPackages[pkgIndex] : undefined;
  const base = pkg ? basePackages.find(p => p.id === pkg.packageId) : undefined;

  const [name, setName] = useState<string>(pkg?.customName ?? base?.name ?? "");
  const [price, setPrice] = useState<string>((pkg?.customPrice ?? base?.price ?? 0).toString());
  const [hours, setHours] = useState<string>((pkg?.customHours ?? base?.hours ?? 0).toString());
  const [includedIds, setIncludedIds] = useState<string[]>(pkg?.includedProductIds ?? []);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!pkg) return;
    setName(pkg.customName ?? base?.name ?? "");
    setPrice((pkg.customPrice ?? base?.price ?? 0).toString());
    setHours((pkg.customHours ?? base?.hours ?? 0).toString());
    setIncludedIds(pkg.includedProductIds ?? []);
  }, [pkgIndex]);

  const toggleIncluded = useCallback((id: string) => {
    setIncludedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }, []);

  const save = useCallback(() => {
    if (typeof pkgIndex !== "number") return;
    setStudentPackages(prev => {
      const copy = [...prev];
      const target = copy[pkgIndex];
      if (!target) return prev;
      copy[pkgIndex] = {
        ...target,
        customName: name.trim() || undefined,
        customPrice: Number.isFinite(Number(price)) ? Number(price) : target.customPrice,
        customHours: Number.isFinite(Number(hours)) ? Number(hours) : target.customHours,
        includedProductIds: includedIds,
      };
      return copy;
    });
    onClose();
  }, [hours, includedIds, name, onClose, pkgIndex, price, setStudentPackages]);

  const confirmDelete = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const performDelete = useCallback(() => {
    if (typeof pkgIndex !== "number") return;
    setStudentPackages(prev => prev.filter((_, i) => i !== pkgIndex));
    setConfirmOpen(false);
    onClose();
  }, [onClose, pkgIndex, setStudentPackages]);

  const togglePaid = useCallback((i: number) => {
    if (typeof pkgIndex !== "number") return;
    const target = studentPackages[pkgIndex];
    if (!target) return;
    const inst = target.installments[i];
    if (!inst) return;
    if (inst.paid) {
      setStudentPackages(prev => {
        const copy = [...prev];
        const t = copy[pkgIndex];
        const arr = [...t.installments];
        arr[i] = { ...arr[i], paid: false, paidDate: null };
        const paidCount = arr.filter(x => x.paid).length;
        const paymentStatus: StudentPackage["paymentStatus"] = paidCount === arr.length ? "paid" : paidCount > 0 ? "partial" : "unpaid";
        copy[pkgIndex] = { ...t, installments: arr, paymentStatus };
        return copy;
      });
    } else {
      setStudentPackages(prev => {
        const copy = [...prev];
        const t = copy[pkgIndex];
        const arr = [...t.installments];
        arr[i] = { ...arr[i], paid: true, paidDate: new Date().toISOString() };
        const paidCount = arr.filter(x => x.paid).length;
        const paymentStatus: StudentPackage["paymentStatus"] = paidCount === arr.length ? "paid" : paidCount > 0 ? "partial" : "unpaid";
        copy[pkgIndex] = { ...t, installments: arr, paymentStatus };
        return copy;
      });
    }
  }, [pkgIndex, setStudentPackages, studentPackages]);

  if (!pkg) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.modalTitle}>Pakket/Product bewerken</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" style={{ padding: 8 }}>
              <X size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Naam</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Naam" />

          <Text style={styles.modalLabel}>Prijs (€)</Text>
          <TextInput value={price} onChangeText={setPrice} keyboardType={Platform.OS === "web" ? "numeric" : "decimal-pad"} style={styles.input} />

          {!base?.isProduct && (
            <>
              <Text style={styles.modalLabel}>Uren</Text>
              <TextInput value={hours} onChangeText={setHours} keyboardType={Platform.OS === "web" ? "numeric" : "number-pad"} style={styles.input} />
            </>
          )}

          <Text style={styles.modalLabel}>Inbegrepen producten</Text>
          <View style={styles.dropdownBox}>
            <View style={{ gap: 8 }}>
              {productsGroup.map(p => (
                <TouchableOpacity key={p.id} onPress={() => toggleIncluded(p.id)} style={[styles.optionRow, includedIds.includes(p.id) && styles.optionRowActive]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{p.name}</Text>
                    <Text style={styles.optionSub}>€{p.price.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.optionPrice}>{includedIds.includes(p.id) ? "✓" : ""}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.modalLabel}>Termijnen</Text>
          <View style={{ gap: 8 }}>
            {pkg.installments.map((inst, i) => (
              <View key={i} style={styles.termRow}>
                <TouchableOpacity onPress={() => togglePaid(i)} style={[styles.termBtn, inst.paid && styles.termBtnPaid]}>
                  <Text style={[styles.termBtnText, inst.paid && styles.termBtnTextPaid]}>Termijn {inst.installmentNumber}</Text>
                </TouchableOpacity>
                <Text style={styles.termDateText}>{inst.paid && inst.paidDate ? formatDate(inst.paidDate) : "–"}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <TouchableOpacity onPress={onClose} style={[styles.secondaryBtn, { flex: 1 }]}>
              <Text style={styles.secondaryBtnText}>Sluiten</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} style={[styles.primaryBtn, { flex: 1 }]} testID="save-student-pkg">
              <Text style={styles.primaryBtnText}>Opslaan</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={confirmDelete} style={[styles.destructiveBtn]} testID="delete-student-pkg">
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Trash2 size={18} color="#fff" />
              <Text style={styles.destructiveBtnText}>Verwijderen</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={confirmOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.modalTitle}>{pkg?.packageId?.startsWith("loose_hours_") ? "Losse uren verwijderen?" : (base?.isProduct ? "Product verwijderen?" : "Pakket verwijderen?")}</Text>
            <Text style={styles.mutedText}>
              Deze actie verwijdert dit item alleen voor deze leerling.
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setConfirmOpen(false)} style={[styles.secondaryBtn, { flex: 1 }]} testID="cancel-delete-student-pkg">
                <Text style={styles.secondaryBtnText}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={performDelete} style={[styles.destructiveBtn, { flex: 1 }]} testID="confirm-delete-student-pkg">
                <Text style={styles.destructiveBtnText}>Verwijderen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
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
  hourlyPrice,
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
  hourlyPrice: number;
}) {
  const [activeTab, setActiveTab] = useState<"packages" | "products" | "hours">("packages");

  const onSelectPackage = useCallback((id: string) => {
    setSelectedPackageId(id);
  }, [setSelectedPackageId]);

  useEffect(() => {
    if (activeTab === "hours") {
      setSelectedPackageId(null);
    }
  }, [activeTab, setSelectedPackageId]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Toevoegen</Text>

          <View style={{ flexDirection: "row", backgroundColor: "#e5e7eb", borderRadius: 10, padding: 4 }}>
            {[
              { key: "packages", label: "Pakketten" },
              { key: "products", label: "Producten" },
              { key: "hours", label: "Losse uren" },
            ].map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key as "packages" | "products" | "hours")}
                style={[
                  { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
                  activeTab === t.key && { backgroundColor: "#fff" },
                ]}
                testID={`add-tab-${t.key}`}
              >
                <Text style={{ fontWeight: "700", color: activeTab === t.key ? "#111827" : "#374151" }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "packages" && (
            <>
              <Text style={styles.modalLabel}>Pakketten</Text>
              <View style={styles.dropdownBox}>
                <View style={{ gap: 12 }}>
                  {packagesGroup.length === 0 ? (
                    <Text style={styles.mutedText}>Geen pakketten gevonden. Voeg ze toe bij Instellingen → Pakketten/Uren.</Text>
                  ) : (
                    packagesGroup.map((p) => (
                      <TouchableOpacity key={`pkg-${p.id}`} onPress={() => onSelectPackage(p.id)} style={[styles.optionRow, selectedPackageId === p.id && styles.optionRowActive]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optionTitle}>{p.name}</Text>
                          <Text style={styles.optionSub}>{`${p.hours} uren`}</Text>
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
            </>
          )}

          {activeTab === "products" && (
            <>
              <Text style={styles.modalLabel}>Producten</Text>
              <View style={styles.dropdownBox}>
                <View style={{ gap: 12 }}>
                  {productsGroup.length === 0 ? (
                    <Text style={styles.mutedText}>Geen producten gevonden. Voeg ze toe bij Instellingen → Pakketten/Uren.</Text>
                  ) : (
                    productsGroup.map((p) => (
                      <TouchableOpacity key={`prd-${p.id}`} onPress={() => onSelectPackage(p.id)} style={[styles.optionRow, selectedPackageId === p.id && styles.optionRowActive]}>
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
            </>
          )}

          {activeTab === "hours" && (
            <>
              <Text style={styles.modalLabel}>Losse Uren</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <TextInput
                  value={looseHours}
                  onChangeText={setLooseHours}
                  placeholder="Aantal uren"
                  keyboardType={Platform.OS === "web" ? "numeric" : "number-pad"}
                  style={[styles.input, { flex: 1 }]}
                  testID="loose-hours-input"
                />
                <View style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: "#f3f4f6" }}>
                  <Text style={{ fontWeight: "700" }}>Uurprijs</Text>
                  <Text style={{ color: "#111827" }}>€{(hourlyPrice ?? 0).toFixed(2)}</Text>
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
            </>
          )}

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
  overviewRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  overviewLabel: { color: "#6b7280", fontWeight: "600" },
  overviewValue: { fontWeight: "800", color: "#111827" },
  plannedBadge: { backgroundColor: "#e0e7ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  plannedBadgeText: { color: "#3730a3", fontWeight: "700" },
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
  termRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  termBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#e5e7eb" },
  termBtnPaid: { backgroundColor: "#16a34a" },
  termBtnText: { fontWeight: "700", color: "#111827" },
  termBtnTextPaid: { color: "#fff" },
  termDateText: { color: "#111827", fontWeight: "700" },
  optionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  optionRowActive: { borderColor: "#0ea5e9", backgroundColor: "#f0f9ff" },
  optionTitle: { fontWeight: "700" },
  optionSub: { color: "#6b7280" },
  optionPrice: { fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 10 },
  confirmCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginHorizontal: 16 },
  modalTitle: { fontSize: 16, fontWeight: "800" },
  modalLabel: { fontWeight: "700", marginTop: 8 },
  groupLabel: { fontWeight: "700", color: "#0f172a" },
  mutedText: { color: "#6b7280" },
  numberBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  numberBtnText: { fontSize: 18, fontWeight: "800" },
  customTerms: { fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  destructiveBtn: { backgroundColor: "#ef4444", paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  destructiveBtnText: { color: "#fff", fontWeight: "700", textAlign: "center" },
});
