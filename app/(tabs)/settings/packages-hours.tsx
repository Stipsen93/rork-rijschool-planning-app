import React from "react";
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from "react-native";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Check, Plus, Save, Trash2, ChevronDown, ChevronUp } from "lucide-react-native";

type Product = { id: string; name: string; price: number; vatStatus: "incl" | "excl" };
type PackageItem = { id: string; name: string; hours: number; price: number; vatStatus: "incl" | "excl"; selectedProducts: string[] };
type HourlyRates = { price: number; vatStatus: "incl" | "excl" };

const PRODUCTS_KEY = "instructor_products";
const PACKAGES_KEY = "instructor_packages";
const HOURLY_RATES_KEY = "instructor_hourly_rates";

function confirmCrossPlatform(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    const g = globalThis as unknown as { confirm?: (m: string) => boolean; alert?: (m: string) => void };
    const ok = g.confirm ? g.confirm(`${title}\n\n${message}`) : false;
    if (ok) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: "Annuleren", style: "cancel" },
      { text: "Verwijderen", style: "destructive", onPress: onConfirm },
    ]);
  }
}

function notifyCrossPlatform(message: string) {
  if (Platform.OS === "web") {
    const g = globalThis as unknown as { alert?: (m: string) => void };
    if (g.alert) g.alert(message);
    else console.log(message);
  } else {
    Alert.alert("Info", message);
  }
}

export default function PackagesAndHoursScreen() {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  const [products, setProducts] = React.useState<Product[]>([]);
  const [packages, setPackages] = React.useState<PackageItem[]>([]);
  const [hourlyRates, setHourlyRates] = React.useState<HourlyRates>({ price: 45, vatStatus: "incl" });

  const [showNewProduct, setShowNewProduct] = React.useState<boolean>(false);
  const [newProductName, setNewProductName] = React.useState<string>("");
  const [newProductPrice, setNewProductPrice] = React.useState<string>("");
  const [newProductVat, setNewProductVat] = React.useState<"incl" | "excl">("incl");

  const [showNewPackage, setShowNewPackage] = React.useState<boolean>(false);
  const [newPackageName, setNewPackageName] = React.useState<string>("");
  const [newPackageHours, setNewPackageHours] = React.useState<string>("");
  const [newPackagePrice, setNewPackagePrice] = React.useState<string>("");
  const [newPackageVat, setNewPackageVat] = React.useState<"incl" | "excl">("incl");
  const [newPackageSelectedProducts, setNewPackageSelectedProducts] = React.useState<string[]>([]);
  const [productDropdownOpen, setProductDropdownOpen] = React.useState<boolean>(false);

  const router = useRouter();

  const [confirmState, setConfirmState] = React.useState<{
    type: "product" | "package";
    id: string;
    name: string;
  } | null>(null);

  React.useEffect(() => {
    void loadData();
  }, []);

  const loadData = React.useCallback(async () => {
    console.log("[PackagesHours] Loading data from AsyncStorage...");
    try {
      setLoading(true);
      const [pStr, pkgStr, rateStr] = await Promise.all([
        AsyncStorage.getItem(PRODUCTS_KEY),
        AsyncStorage.getItem(PACKAGES_KEY),
        AsyncStorage.getItem(HOURLY_RATES_KEY),
      ]);
      if (pStr) setProducts(JSON.parse(pStr) as Product[]);
      if (pkgStr) setPackages(JSON.parse(pkgStr) as PackageItem[]);
      if (rateStr) setHourlyRates(JSON.parse(rateStr) as HourlyRates);
    } catch (e) {
      console.error("Failed to load data", e);
      Alert.alert("Fout", "Kon gegevens niet laden. Probeer opnieuw.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const persistAll = React.useCallback(async () => {
    if (saving) return;
    console.log("[PackagesHours] Saving data...");
    try {
      setSaving(true);
      await Promise.all([
        AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)),
        AsyncStorage.setItem(PACKAGES_KEY, JSON.stringify(packages)),
        AsyncStorage.setItem(HOURLY_RATES_KEY, JSON.stringify(hourlyRates)),
      ]);
      if (Platform.OS === "web") console.log("Saved successfully");
    } catch (e) {
      console.error("Failed to save", e);
      Alert.alert("Fout", "Opslaan mislukt. Probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  }, [hourlyRates, packages, products, saving]);

  const addProduct = React.useCallback(() => {
    setShowNewProduct((prev) => !prev);
  }, []);

  const confirmAddProduct = React.useCallback(() => {
    const name = newProductName.trim();
    const priceNum = Number(newProductPrice);
    if (!name) {
      Alert.alert("Let op", "Voer een productnaam in.");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      Alert.alert("Let op", "Voer een geldige prijs in.");
      return;
    }
    const id = String(Date.now());
    const next: Product = { id, name, price: priceNum, vatStatus: newProductVat };
    setProducts((prev) => [...prev, next]);
    setNewProductName("");
    setNewProductPrice("");
    setNewProductVat("incl");
    setShowNewProduct(false);
    console.log("[PackagesHours] Product added", next);
  }, [newProductName, newProductPrice, newProductVat]);

  const confirmAddPackage = React.useCallback((): void => {
    const name = newPackageName.trim();
    const hoursNum = Number(newPackageHours);
    const priceNum = Number(newPackagePrice);
    if (!name) {
      Alert.alert("Let op", "Voer een pakketnaam in.");
      return;
    }
    if (Number.isNaN(hoursNum) || hoursNum <= 0) {
      Alert.alert("Let op", "Voer geldige uren in.");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      Alert.alert("Let op", "Voer een geldige prijs in.");
      return;
    }
    const id = String(Date.now());
    const next: PackageItem = { id, name, hours: hoursNum, price: priceNum, vatStatus: newPackageVat, selectedProducts: newPackageSelectedProducts };
    setPackages((prev) => [...prev, next]);
    setNewPackageName("");
    setNewPackageHours("");
    setNewPackagePrice("");
    setNewPackageVat("incl");
    setNewPackageSelectedProducts([]);
    setProductDropdownOpen(false);
    setShowNewPackage(false);
    console.log("[PackagesHours] Package added", next);
  }, [newPackageName, newPackageHours, newPackagePrice, newPackageVat, newPackageSelectedProducts]);

  const updateProduct = (id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    const name = prod?.name ?? "product";
    setConfirmState({ type: "product", id, name });
  };

  const addPackage = React.useCallback(() => {
    setShowNewPackage((prev) => !prev);
  }, []);

  const updatePackage = (id: string, patch: Partial<PackageItem>) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const deletePackage = (id: string) => {
    const pkg = packages.find((p) => p.id === id);
    const name = pkg?.name ?? "pakket";
    setConfirmState({ type: "package", id, name });
  };

  return (
    <View style={styles.screen} testID="packages-hours-screen">
      <Stack.Screen
        options={{
          title: "Pakketten/Uren",
          headerRight: () => (
            <TouchableOpacity
              testID="save-btn"
              onPress={persistAll}
              disabled={saving}
              style={[styles.headerBtn, saving && { opacity: 0.5 }]}
            >
              <Save color="#0ea5e9" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadData(); }} />
        }
      >
        <Text style={styles.sectionTitle}>Producten</Text>
        <View style={styles.card}>
          <TouchableOpacity testID="add-product" style={styles.addBtn} onPress={addProduct}>
            <Plus color="#fff" />
            <Text style={styles.addBtnText}>Product toevoegen</Text>
          </TouchableOpacity>

          {showNewProduct && (
            <View style={styles.newProductBox}>
              <TextInput
                testID="new-product-name"
                style={styles.input}
                placeholder="Praktijkexamen B, Praktijkexamen B-H..."
                placeholderTextColor="#9ca3af"
                value={newProductName}
                onChangeText={setNewProductName}
              />
              <View style={{ gap: 8 }}>
                <View style={styles.inlineBetween}>
                  <TextInput
                    testID="new-product-price"
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Prijs (€)"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    value={newProductPrice}
                    onChangeText={setNewProductPrice}
                  />
                  <TouchableOpacity
                    testID="new-product-vat"
                    onPress={() => setNewProductVat((prev) => (prev === "incl" ? "excl" : "incl"))}
                    style={styles.tag}
                  >
                    <Text style={styles.tagText}>{newProductVat === "incl" ? "Incl. BTW" : "Excl. BTW"}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity testID="confirm-add-product" onPress={confirmAddProduct} style={styles.confirmBtn}>
                  <Check color="#fff" size={16} />
                  <Text style={styles.confirmBtnText}>Toevoegen</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {products.length === 0 ? (
            <Text style={styles.muted}>Geen producten. Voeg je eerste product toe.</Text>
          ) : (
            products.map((p) => (
              <View key={p.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{p.name}</Text>
                  <Text style={styles.itemSubtitle}>
                    € {p.price.toFixed(2)} {p.vatStatus === "incl" ? "(incl. btw)" : "(excl. btw)"}
                  </Text>
                </View>
                <TouchableOpacity accessibilityRole="button" onPress={() => deleteProduct(p.id)}>
                  <Trash2 color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Pakketten</Text>
        <View style={styles.card}>
          <TouchableOpacity testID="add-package" style={styles.addBtn} onPress={addPackage}>
            <Plus color="#fff" />
            <Text style={styles.addBtnText}>Pakket toevoegen</Text>
          </TouchableOpacity>

          {showNewPackage && (
            <View style={styles.newProductBox}>
              <TextInput
                testID="new-package-name"
                style={styles.input}
                placeholder="20 uur pakket, 30 uur pakket..."
                placeholderTextColor="#9ca3af"
                value={newPackageName}
                onChangeText={setNewPackageName}
              />
              <View style={styles.inlineBetween}>
                <TextInput
                  testID="new-package-hours"
                  style={[styles.input, styles.inputSmall]}
                  placeholder="Uren"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  value={newPackageHours}
                  onChangeText={setNewPackageHours}
                />
                <TextInput
                  testID="new-package-price"
                  style={[styles.input, styles.inputSmall]}
                  placeholder="Prijs (€)"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  value={newPackagePrice}
                  onChangeText={setNewPackagePrice}
                />
                <TouchableOpacity
                  testID="new-package-vat"
                  onPress={() => setNewPackageVat((prev) => (prev === "incl" ? "excl" : "incl"))}
                  style={styles.tag}
                >
                  <Text style={styles.tagText}>{newPackageVat === "incl" ? "Incl. BTW" : "Excl. BTW"}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  testID="product-dropdown-toggle"
                  onPress={() => setProductDropdownOpen((p) => !p)}
                  style={[styles.input, styles.dropdownToggle]}
                  accessibilityRole="button"
                >
                  <View style={styles.inlineBetween}>
                    <Text>{newPackageSelectedProducts.length > 0 ? `${newPackageSelectedProducts.length} geselecteerd` : "Producten kiezen"}</Text>
                    {productDropdownOpen ? <ChevronUp color="#64748b" /> : <ChevronDown color="#64748b" />}
                  </View>
                </TouchableOpacity>
                {productDropdownOpen && (
                  <View style={styles.dropdownPanel} testID="product-dropdown-panel">
                    {products.length === 0 ? (
                      <Text style={styles.muted}>Geen producten beschikbaar. Voeg ze eerst bij Producten toe.</Text>
                    ) : (
                      products.map((prod) => {
                        const checked = newPackageSelectedProducts.includes(prod.id);
                        return (
                          <TouchableOpacity
                            key={`np-${prod.id}`}
                            style={styles.checkboxRow}
                            onPress={() => {
                              setNewPackageSelectedProducts((prev) =>
                                prev.includes(prod.id) ? prev.filter((id) => id !== prod.id) : [...prev, prod.id]
                              );
                            }}
                          >
                            <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
                            <Text style={{ flex: 1 }}>{prod.name}</Text>
                            <Text style={styles.muted}>€ {prod.price.toFixed(2)}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
              <TouchableOpacity testID="confirm-add-package" onPress={confirmAddPackage} style={styles.confirmBtn}>
                <Check color="#fff" size={16} />
                <Text style={styles.confirmBtnText}>Toevoegen</Text>
              </TouchableOpacity>
            </View>
          )}

          {packages.length === 0 ? (
            <Text style={styles.muted}>Geen pakketten. Maak je eerste pakket.</Text>
          ) : (
            packages.map((pk) => (
              <View key={pk.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{pk.name}</Text>
                  <Text style={styles.itemSubtitle}>
                    € {pk.price.toFixed(2)} • {pk.hours} uur {pk.vatStatus === "incl" ? "(incl. btw)" : "(excl. btw)"}
                  </Text>
                </View>
                <TouchableOpacity accessibilityRole="button" onPress={() => deletePackage(pk.id)}>
                  <Trash2 color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Uren</Text>
        <View style={styles.card}>
          <View style={styles.inlineBetween}>
            <TextInput
              testID="hourly-price"
              style={[styles.input, styles.inputSmall]}
              placeholder="Prijs per uur (€)"
              keyboardType="decimal-pad"
              value={String(hourlyRates.price ?? 0)}
              onChangeText={(t) => setHourlyRates((prev) => ({ ...prev, price: Number(t) || 0 }))}
            />
            <TouchableOpacity
              testID="hourly-vat"
              onPress={() => setHourlyRates((prev) => ({ ...prev, vatStatus: prev.vatStatus === "incl" ? "excl" : "incl" }))}
              style={styles.tag}
            >
              <Text style={styles.tagText}>{hourlyRates.vatStatus === "incl" ? "Incl. BTW" : "Excl. BTW"}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={persistAll} style={[styles.addBtn, { backgroundColor: "#0ea5e9" }]}>
            <Save color="#fff" />
            <Text style={styles.addBtnText}>Uurprijs opslaan</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={!!confirmState}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmState(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} testID="confirm-delete-modal">
            <Text style={styles.modalTitle}>Weet je het zeker?</Text>
            <Text style={styles.modalMsg}>
              {confirmState?.type === "product" ? "Product" : "Pakket"} {`“${confirmState?.name ?? ""}”`} verwijderen?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                testID="cancel-delete"
                onPress={() => setConfirmState(null)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
                accessibilityRole="button"
              >
                <Text style={styles.modalBtnCancelText}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="confirm-delete"
                onPress={() => {
                  if (!confirmState) return;
                  if (confirmState.type === "product") {
                    setProducts((prev) => prev.filter((p) => p.id !== confirmState.id));
                    notifyCrossPlatform("Product is verwijderd.");
                  } else {
                    setPackages((prev) => prev.filter((p) => p.id !== confirmState.id));
                    notifyCrossPlatform("Pakket is verwijderd.");
                  }
                  setConfirmState(null);
                }}
                style={[styles.modalBtn, styles.modalBtnDanger]}
                accessibilityRole="button"
              >
                <Trash2 color="#fff" size={16} />
                <Text style={styles.modalBtnDangerText}>Verwijderen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fb" },
  container: { padding: 16, gap: 12, paddingBottom: 120 },
  headerBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  muted: { color: "#6b7280", fontSize: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  itemTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  itemSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  inlineBetween: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputSmall: { minWidth: 120, flex: 1 },
  addBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700" },
  newProductBox: { gap: 10 },
  dropdownToggle: { paddingVertical: 12 },
  dropdownPanel: { backgroundColor: "#f8fafc", borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", padding: 8, gap: 8 },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#16a34a",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  confirmBtnText: { color: "#fff", fontWeight: "700" },
  tag: {
    backgroundColor: "#e0f2fe",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  tagText: { color: "#0369a1", fontWeight: "600" },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: "#94a3b8" },
  checkboxChecked: { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "90%", maxWidth: 420, backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 12 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  modalMsg: { fontSize: 14, color: "#374151" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  modalBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  modalBtnCancel: { backgroundColor: "#e5e7eb" },
  modalBtnCancelText: { color: "#111827", fontWeight: "700" },
  modalBtnDanger: { backgroundColor: "#ef4444" },
  modalBtnDangerText: { color: "#fff", fontWeight: "700" },
});
