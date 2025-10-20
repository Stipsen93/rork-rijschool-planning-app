import React from "react";
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronRight, Package, Plus, Save, Trash2 } from "lucide-react-native";

type Product = { id: string; name: string; price: number; vatStatus: "incl" | "excl" };
type PackageItem = { id: string; name: string; hours: number; price: number; vatStatus: "incl" | "excl"; selectedProducts: string[] };
type HourlyRates = { price: number; vatStatus: "incl" | "excl" };

const PRODUCTS_KEY = "instructor_products";
const PACKAGES_KEY = "instructor_packages";
const HOURLY_RATES_KEY = "instructor_hourly_rates";

export default function PackagesAndHoursScreen() {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  const [products, setProducts] = React.useState<Product[]>([]);
  const [packages, setPackages] = React.useState<PackageItem[]>([]);
  const [hourlyRates, setHourlyRates] = React.useState<HourlyRates>({ price: 45, vatStatus: "incl" });

  const router = useRouter();

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
    const id = String(Date.now());
    const next: Product = { id, name: "Nieuw product", price: 0, vatStatus: "incl" };
    setProducts((prev) => [...prev, next]);
  }, []);

  const updateProduct = (id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const deleteProduct = (id: string) => {
    Alert.alert("Verwijderen", "Product verwijderen?", [
      { text: "Annuleren", style: "cancel" },
      {
        text: "Verwijderen",
        style: "destructive",
        onPress: () => setProducts((prev) => prev.filter((p) => p.id !== id)),
      },
    ]);
  };

  const addPackage = React.useCallback(() => {
    const id = String(Date.now());
    const next: PackageItem = { id, name: "Nieuw pakket", hours: 0, price: 0, vatStatus: "incl", selectedProducts: [] };
    setPackages((prev) => [...prev, next]);
  }, []);

  const updatePackage = (id: string, patch: Partial<PackageItem>) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const deletePackage = (id: string) => {
    Alert.alert("Verwijderen", "Pakket verwijderen?", [
      { text: "Annuleren", style: "cancel" },
      {
        text: "Verwijderen",
        style: "destructive",
        onPress: () => setPackages((prev) => prev.filter((p) => p.id !== id)),
      },
    ]);
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
          {products.length === 0 ? (
            <Text style={styles.muted}>Geen producten. Voeg je eerste product toe.</Text>
          ) : (
            products.map((p) => (
              <View key={p.id} style={styles.row}>
                <View style={{ flex: 1, gap: 6 }}>
                  <TextInput
                    testID={`product-name-${p.id}`}
                    style={styles.input}
                    placeholder="Naam product"
                    value={p.name}
                    onChangeText={(t) => updateProduct(p.id, { name: t })}
                  />
                  <View style={styles.inline}>
                    <TextInput
                      testID={`product-price-${p.id}`}
                      style={[styles.input, styles.inputSmall]}
                      placeholder="Prijs (€)"
                      keyboardType="decimal-pad"
                      value={String(p.price ?? 0)}
                      onChangeText={(t) => updateProduct(p.id, { price: Number(t) || 0 })}
                    />
                    <TouchableOpacity
                      testID={`product-vat-${p.id}`}
                      onPress={() => updateProduct(p.id, { vatStatus: p.vatStatus === "incl" ? "excl" : "incl" })}
                      style={styles.tag}
                    >
                      <Text style={styles.tagText}>{p.vatStatus === "incl" ? "Incl. BTW" : "Excl. BTW"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity accessibilityRole="button" onPress={() => deleteProduct(p.id)}>
                  <Trash2 color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
          <TouchableOpacity testID="add-product" style={styles.addBtn} onPress={addProduct}>
            <Plus color="#fff" />
            <Text style={styles.addBtnText}>Product toevoegen</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Pakketten</Text>
        <View style={styles.card}>
          {packages.length === 0 ? (
            <Text style={styles.muted}>Geen pakketten. Maak je eerste pakket.</Text>
          ) : (
            packages.map((pk) => (
              <View key={pk.id} style={styles.row}>
                <View style={{ flex: 1, gap: 6 }}>
                  <TextInput
                    testID={`package-name-${pk.id}`}
                    style={styles.input}
                    placeholder="Naam pakket"
                    value={pk.name}
                    onChangeText={(t) => updatePackage(pk.id, { name: t })}
                  />
                  <View style={styles.inlineBetween}>
                    <TextInput
                      testID={`package-hours-${pk.id}`}
                      style={[styles.input, styles.inputSmall]}
                      placeholder="Uren"
                      keyboardType="number-pad"
                      value={String(pk.hours ?? 0)}
                      onChangeText={(t) => updatePackage(pk.id, { hours: Number(t) || 0 })}
                    />
                    <TextInput
                      testID={`package-price-${pk.id}`}
                      style={[styles.input, styles.inputSmall]}
                      placeholder="Prijs (€)"
                      keyboardType="decimal-pad"
                      value={String(pk.price ?? 0)}
                      onChangeText={(t) => updatePackage(pk.id, { price: Number(t) || 0 })}
                    />
                    <TouchableOpacity
                      testID={`package-vat-${pk.id}`}
                      onPress={() => updatePackage(pk.id, { vatStatus: pk.vatStatus === "incl" ? "excl" : "incl" })}
                      style={styles.tag}
                    >
                      <Text style={styles.tagText}>{pk.vatStatus === "incl" ? "Incl. BTW" : "Excl. BTW"}</Text>
                    </TouchableOpacity>
                  </View>
                  {products.length > 0 && (
                    <View style={{ gap: 8 }}>
                      <Text style={styles.muted}>Inbegrepen producten</Text>
                      {products.map((prod) => {
                        const checked = pk.selectedProducts.includes(prod.id);
                        return (
                          <TouchableOpacity
                            key={`${pk.id}-${prod.id}`}
                            style={styles.checkboxRow}
                            onPress={() => {
                              const next = checked
                                ? pk.selectedProducts.filter((id) => id !== prod.id)
                                : [...pk.selectedProducts, prod.id];
                              updatePackage(pk.id, { selectedProducts: next });
                            }}
                          >
                            <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
                            <Text style={{ flex: 1 }}>{prod.name}</Text>
                            <Text style={styles.muted}>€ {prod.price.toFixed(2)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
                <TouchableOpacity accessibilityRole="button" onPress={() => deletePackage(pk.id)}>
                  <Trash2 color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
          <TouchableOpacity testID="add-package" style={styles.addBtn} onPress={addPackage}>
            <Plus color="#fff" />
            <Text style={styles.addBtnText}>Pakket toevoegen</Text>
          </TouchableOpacity>
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
});
