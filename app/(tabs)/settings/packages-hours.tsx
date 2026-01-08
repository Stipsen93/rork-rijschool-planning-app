import React from "react";
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from "react-native";
import { Stack } from "expo-router";
import { Check, Plus, Save, Trash2, ChevronDown, ChevronUp, Pencil } from "lucide-react-native";
import { useSettings } from "@/components/settings/SettingsStore";

type Product = { id: string; name: string; price: number; vatStatus: "incl" | "excl"; installments: number };
type PackageItem = { id: string; name: string; hours: number; price: number; vatStatus: "incl" | "excl"; selectedProducts: string[]; installments: number };
type HourlyRates = { price: number; vatStatus: "incl" | "excl" };

type EditState =
  | null
  | {
      type: "product";
      id: string;
      name: string;
      price: string;
      vatStatus: "incl" | "excl";
      installments: number;
    }
  | {
      type: "package";
      id: string;
      name: string;
      hours: string;
      price: string;
      vatStatus: "incl" | "excl";
      selectedProducts: string[];
      dropdownOpen: boolean;
      installments: number;
      customInstallmentsInput?: string;
    };

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
  const { products: globalProducts, packages: globalPackages, hourlyRates: globalHourlyRates, updateProducts, updatePackages, updateHourlyRates } = useSettings();
  
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [products, setProducts] = React.useState<Product[]>(globalProducts);
  const [packages, setPackages] = React.useState<PackageItem[]>(globalPackages);
  const [hourlyRates, setHourlyRates] = React.useState<HourlyRates>(globalHourlyRates);
  const [showNewHour, setShowNewHour] = React.useState<boolean>(false);
  const [newHourPrice, setNewHourPrice] = React.useState<string>("");

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

  const [editState, setEditState] = React.useState<EditState>(null);

  const [confirmState, setConfirmState] = React.useState<{
    type: "product" | "package" | "hour";
    id: string;
    name: string;
  } | null>(null);

  React.useEffect(() => {
    setProducts(globalProducts);
    setPackages(globalPackages);
    setHourlyRates(globalHourlyRates);
  }, [globalProducts, globalPackages, globalHourlyRates]);

  const initializedRef = React.useRef<boolean>(false);
  const autoSaveRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      void updateProducts(products);
      void updatePackages(packages);
      void updateHourlyRates(hourlyRates);
    }, 350);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [products, packages, hourlyRates, updateProducts, updatePackages, updateHourlyRates]);

  const addProduct = React.useCallback(() => {
    setShowNewProduct((prev) => !prev);
  }, []);

  const confirmAddProduct = React.useCallback(async () => {
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
    const next: Product = { id, name, price: priceNum, vatStatus: newProductVat, installments: 1 };
    const updatedProducts = [...products, next];
    setProducts(updatedProducts);
    await updateProducts(updatedProducts);
    setNewProductName("");
    setNewProductPrice("");
    setNewProductVat("incl");
    setShowNewProduct(false);
    console.log("[PackagesHours] Product added", next);
  }, [newProductName, newProductPrice, newProductVat, products, updateProducts]);

  const confirmAddPackage = React.useCallback(async (): Promise<void> => {
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
    const next: PackageItem = { id, name, hours: hoursNum, price: priceNum, vatStatus: newPackageVat, selectedProducts: newPackageSelectedProducts, installments: 1 };
    const updatedPackages = [...packages, next];
    setPackages(updatedPackages);
    await updatePackages(updatedPackages);
    setNewPackageName("");
    setNewPackageHours("");
    setNewPackagePrice("");
    setNewPackageVat("incl");
    setNewPackageSelectedProducts([]);
    setProductDropdownOpen(false);
    setShowNewPackage(false);
    console.log("[PackagesHours] Package added", next);
  }, [newPackageName, newPackageHours, newPackagePrice, newPackageVat, newPackageSelectedProducts, packages, updatePackages]);

  const updateProduct = async (id: string, patch: Partial<Product>) => {
    const updatedProducts = products.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setProducts(updatedProducts);
    await updateProducts(updatedProducts);
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    const name = prod?.name ?? "product";
    setConfirmState({ type: "product", id, name });
  };

  const addPackage = React.useCallback(() => {
    setShowNewPackage((prev) => !prev);
  }, []);

  const toggleAddHour = React.useCallback(() => {
    setShowNewHour((prev) => !prev);
  }, []);

  const confirmAddHour = React.useCallback(async () => {
    const priceNum = Number(newHourPrice);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Let op", "Voer een geldige uurprijs in.");
      return;
    }
    const next: HourlyRates = { price: priceNum, vatStatus: "incl" };
    setHourlyRates(next);
    await updateHourlyRates(next);
    setNewHourPrice("");
    setShowNewHour(false);
    console.log("[PackagesHours] Hourly price set", next);
  }, [newHourPrice, updateHourlyRates]);

  const updatePackage = async (id: string, patch: Partial<PackageItem>) => {
    const updatedPackages = packages.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setPackages(updatedPackages);
    await updatePackages(updatedPackages);
  };

  const deletePackage = (id: string) => {
    const pkg = packages.find((p) => p.id === id);
    const name = pkg?.name ?? "pakket";
    setConfirmState({ type: "package", id, name });
  };

  const beginEditProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    setEditState({ type: "product", id, name: prod.name, price: String(prod.price), vatStatus: prod.vatStatus, installments: typeof (prod as Product).installments === "number" ? (prod as Product).installments : 1 });
  };

  const beginEditPackage = (id: string) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    setEditState({
      type: "package",
      id,
      name: pkg.name,
      hours: String(pkg.hours),
      price: String(pkg.price),
      vatStatus: pkg.vatStatus,
      selectedProducts: [...pkg.selectedProducts],
      dropdownOpen: false,
      installments: typeof (pkg as PackageItem).installments === "number" ? (pkg as PackageItem).installments : 1,
    });
  };

  const confirmEdit = async () => {
    if (!editState) return;
    if (editState.type === "product") {
      const name = editState.name.trim();
      const priceNum = Number(editState.price);
      if (!name || Number.isNaN(priceNum) || priceNum < 0) {
        Alert.alert("Let op", "Controleer de naam en prijs.");
        return;
      }
      await updateProduct(editState.id, { name, price: priceNum, vatStatus: editState.vatStatus, installments: editState.installments });
      setEditState(null);
    } else {
      const name = editState.name.trim();
      const hoursNum = Number(editState.hours);
      const priceNum = Number(editState.price);
      if (!name || Number.isNaN(hoursNum) || hoursNum <= 0 || Number.isNaN(priceNum) || priceNum < 0) {
        Alert.alert("Let op", "Controleer de naam, uren en prijs.");
        return;
      }
      await updatePackage(editState.id, {
        name,
        hours: hoursNum,
        price: priceNum,
        vatStatus: editState.vatStatus,
        selectedProducts: editState.selectedProducts,
        installments: editState.installments,
      });
      setEditState(null);
    }
  };

  return (
    <View style={styles.screen} testID="packages-hours-screen">
      <Stack.Screen
        options={{
          title: "Pakketten/Uren",
          headerRight: () => (
            <TouchableOpacity
              testID="save-btn"
              onPress={() => {
                void updateProducts(products);
                void updatePackages(packages);
                void updateHourlyRates(hourlyRates);
              }}
              style={styles.headerBtn}
            >
              <Save color="#0ea5e9" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            setProducts(globalProducts);
            setPackages(globalPackages);
            setHourlyRates(globalHourlyRates);
            setRefreshing(false);
          }} />
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
                <View style={styles.actionsRow}>
                  <TouchableOpacity accessibilityRole="button" testID={`edit-product-${p.id}`} onPress={() => beginEditProduct(p.id)}>
                    <Pencil color="#0ea5e9" />
                  </TouchableOpacity>
                  <TouchableOpacity accessibilityRole="button" onPress={() => deleteProduct(p.id)}>
                    <Trash2 color="#ef4444" />
                  </TouchableOpacity>
                </View>
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
                <View style={styles.actionsRow}>
                  <TouchableOpacity accessibilityRole="button" testID={`edit-package-${pk.id}`} onPress={() => beginEditPackage(pk.id)}>
                    <Pencil color="#0ea5e9" />
                  </TouchableOpacity>
                  <TouchableOpacity accessibilityRole="button" onPress={() => deletePackage(pk.id)}>
                    <Trash2 color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Uren</Text>
        <View style={styles.card}>
          {!showNewHour && (hourlyRates.price ?? 0) > 0 ? (
            <View style={styles.listRow} testID="hourly-list-row">
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Uurprijs</Text>
                <Text style={styles.itemSubtitle}>€ {hourlyRates.price.toFixed(2)}</Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  testID="hourly-edit"
                  onPress={() => {
                    setShowNewHour(true);
                    setNewHourPrice(String(hourlyRates.price));
                  }}
                >
                  <Pencil color="#0ea5e9" />
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  testID="hourly-delete"
                  onPress={() => setConfirmState({ type: "hour", id: "hour", name: "Uurprijs" })}
                >
                  <Trash2 color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity testID="add-hour" style={[styles.addBtn, styles.addBtnBlue]} onPress={toggleAddHour}>
                <Plus color="#fff" />
                <Text style={styles.addBtnText}>Uurprijs toevoegen</Text>
              </TouchableOpacity>
              {showNewHour && (
                <View style={styles.newProductBox}>
                  <TextInput
                    testID="new-hour-price"
                    style={[styles.input, styles.inputSmall, styles.inputWhite]}
                    placeholder="Uurprijs (€)"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    value={newHourPrice}
                    onChangeText={setNewHourPrice}
                  />
                  <TouchableOpacity testID="confirm-add-hour" onPress={confirmAddHour} style={[styles.confirmBtn, styles.confirmBtnBlue]}>
                    <Check color="#fff" size={16} />
                    <Text style={styles.confirmBtnText}>Toevoegen</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
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
              {confirmState?.type === "hour"
                ? "Uurprijs verwijderen?"
                : `${confirmState?.type === "product" ? "Product" : "Pakket"} “${confirmState?.name ?? ""}” verwijderen?`}
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
                onPress={async () => {
                  if (!confirmState) return;
                  if (confirmState.type === "product") {
                    const updatedProducts = products.filter((p) => p.id !== confirmState.id);
                    setProducts(updatedProducts);
                    await updateProducts(updatedProducts);
                    notifyCrossPlatform("Product is verwijderd.");
                  } else if (confirmState.type === "package") {
                    const updatedPackages = packages.filter((p) => p.id !== confirmState.id);
                    setPackages(updatedPackages);
                    await updatePackages(updatedPackages);
                    notifyCrossPlatform("Pakket is verwijderd.");
                  } else {
                    const newRates = { price: 0, vatStatus: "incl" as const };
                    setHourlyRates(newRates);
                    await updateHourlyRates(newRates);
                    setShowNewHour(false);
                    notifyCrossPlatform("Uurprijs is verwijderd.");
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

      <Modal
        visible={!!editState}
        transparent
        animationType="slide"
        onRequestClose={() => setEditState(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} testID="edit-item-modal">
            <Text style={styles.modalTitle}>{editState?.type === "product" ? "Product bewerken" : "Pakket bewerken"}</Text>
            {editState?.type === "product" ? (
              <View style={{ gap: 10 }}>
                <TextInput
                  key={`edit-product-name-${editState.id}`}
                  testID="edit-product-name"
                  style={styles.input}
                  placeholder="Productnaam"
                  placeholderTextColor="#9ca3af"
                  value={editState.name}
                  onChangeText={(t) => setEditState((prev) => (prev && prev.type === "product" ? { ...prev, name: t } : prev))}
                />
                <View style={styles.inlineBetween}>
                  <TextInput
                    key={`edit-product-price-${editState.id}`}
                    testID="edit-product-price"
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Prijs (€)"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    value={editState.price}
                    onChangeText={(t) => setEditState((prev) => (prev && prev.type === "product" ? { ...prev, price: t } : prev))}
                  />
                  <TouchableOpacity
                    testID="edit-product-vat"
                    onPress={() => setEditState((prev) => (prev && prev.type === "product" ? { ...prev, vatStatus: prev.vatStatus === "incl" ? "excl" : "incl" } : prev))}
                    style={styles.tag}
                  >
                    <Text style={styles.tagText}>{editState.vatStatus === "incl" ? "Incl. BTW" : "Excl. BTW"}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ gap: 8 }}>
                  <Text style={styles.sectionLabel}>Termijnen</Text>
                  <View style={styles.inline}>
                    <TouchableOpacity
                      testID="product-terms-1x"
                      style={[styles.chip, (editState.type === "product" && editState.installments === 1) && styles.chipActive]}
                      onPress={() => setEditState((prev) => (prev && prev.type === "product" ? { ...prev, installments: 1 } : prev))}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipLabel}>1x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="product-terms-2x"
                      style={[styles.chip, (editState.type === "product" && editState.installments === 2) && styles.chipActive]}
                      onPress={() => setEditState((prev) => (prev && prev.type === "product" ? { ...prev, installments: 2 } : prev))}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipLabel}>2x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="product-terms-3x"
                      style={[styles.chip, (editState.type === "product" && editState.installments === 3) && styles.chipActive]}
                      onPress={() => setEditState((prev) => (prev && prev.type === "product" ? { ...prev, installments: 3 } : prev))}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipLabel}>3x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="product-terms-4x"
                      style={[styles.chip, (editState.type === "product" && editState.installments === 4) && styles.chipActive]}
                      onPress={() => setEditState((prev) => (prev && prev.type === "product" ? { ...prev, installments: 4 } : prev))}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipLabel}>4x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="product-terms-custom"
                      style={[styles.chip, (editState.type === "product" && ![1,2,3,4].includes(editState.installments)) && styles.chipActive]}
                      onPress={() => {}}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipLabel}>Aangepast</Text>
                    </TouchableOpacity>
                  </View>
                  {editState.type === "product" && ![1,2,3,4].includes(editState.installments) && (
                    <Text style={styles.muted}>Huidige: {editState.installments}x</Text>
                  )}
                </View>
              </View>
            ) : editState ? (
              <View style={{ gap: 10 }}>
                <TextInput
                  key={`edit-package-name-${editState.id}`}
                  testID="edit-package-name"
                  style={styles.input}
                  placeholder="Pakketnaam"
                  placeholderTextColor="#9ca3af"
                  value={editState.name}
                  onChangeText={(t) => setEditState((prev) => (prev && prev.type === "package" ? { ...prev, name: t } : prev))}
                />
                <View style={styles.inlineBetween}>
                  <TextInput
                    key={`edit-package-hours-${editState.id}`}
                    testID="edit-package-hours"
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Uren"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    value={editState.hours}
                    onChangeText={(t) => setEditState((prev) => (prev && prev.type === "package" ? { ...prev, hours: t } : prev))}
                  />
                  <TextInput
                    key={`edit-package-price-${editState.id}`}
                    testID="edit-package-price"
                    style={[styles.input, styles.inputSmall]}
                    placeholder="Prijs (€)"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    value={editState.price}
                    onChangeText={(t) => setEditState((prev) => (prev && prev.type === "package" ? { ...prev, price: t } : prev))}
                  />
                  <TouchableOpacity
                    testID="edit-package-vat"
                    onPress={() => setEditState((prev) => (prev && prev.type === "package" ? { ...prev, vatStatus: prev.vatStatus === "incl" ? "excl" : "incl" } : prev))}
                    style={styles.tag}
                  >
                    <Text style={styles.tagText}>{editState.vatStatus === "incl" ? "Incl. BTW" : "Excl. BTW"}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  testID="edit-product-dropdown-toggle"
                  onPress={() => setEditState((prev) => (prev && prev.type === "package" ? { ...prev, dropdownOpen: !prev.dropdownOpen } : prev))}
                  style={[styles.input, styles.dropdownToggle]}
                  accessibilityRole="button"
                >
                  <View style={styles.inlineBetween}>
                    <Text>
                      {editState.type === "package" && editState.selectedProducts.length > 0
                        ? `${editState.selectedProducts.length} geselecteerd`
                        : "Producten kiezen"}
                    </Text>
                    {editState.type === "package" && editState.dropdownOpen ? <ChevronUp color="#64748b" /> : <ChevronDown color="#64748b" />}
                  </View>
                </TouchableOpacity>
                <View style={{ gap: 8, marginTop: 4 }}>
                  <Text style={styles.sectionLabel}>Termijnen</Text>
                  <View style={styles.inline}>
                    <TouchableOpacity
                      testID="package-terms-1x"
                      style={[styles.chip, (editState.type === "package" && editState.installments === 1) && styles.chipActive]}
                      onPress={() => setEditState((prev) => (prev && prev.type === "package" ? { ...prev, installments: 1, customInstallmentsInput: undefined } : prev))}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipLabel}>1x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="package-terms-2x"
                      style={[styles.chip, (editState.type === "package" && editState.installments === 2) && styles.chipActive]}
                      onPress={() => setEditState((prev) => (prev && prev.type === "package" ? { ...prev, installments: 2, customInstallmentsInput: undefined } : prev))}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipLabel}>2x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="package-terms-3x"
                      style={[styles.chip, (editState.type === "package" && editState.installments === 3) && styles.chipActive]}
                      onPress={() => setEditState((prev) => (prev && prev.type === "package" ? { ...prev, installments: 3, customInstallmentsInput: undefined } : prev))}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipLabel}>3x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="package-terms-4x"
                      style={[styles.chip, (editState.type === "package" && editState.installments === 4) && styles.chipActive]}
                      onPress={() => setEditState((prev) => (prev && prev.type === "package" ? { ...prev, installments: 4, customInstallmentsInput: undefined } : prev))}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipLabel}>4x</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="package-terms-custom"
                      style={[styles.chip, (editState.type === "package" && ![1,2,3,4].includes(editState.installments)) && styles.chipActive]}
                      onPress={() => setEditState((prev) => (prev && prev.type === "package" ? { ...prev, customInstallmentsInput: String(prev.installments) } : prev))}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipLabel}>Aangepast</Text>
                    </TouchableOpacity>
                  </View>
                  {editState.type === "package" && ![1,2,3,4].includes(editState.installments) && (
                    <View style={styles.inlineBetween}>
                      <TextInput
                        key={`package-terms-custom-${editState.id}`}
                        testID="package-terms-custom-input"
                        style={[styles.input, styles.inputSmall]}
                        placeholder="Aantal termijnen"
                        placeholderTextColor="#9ca3af"
                        keyboardType="number-pad"
                        value={editState.customInstallmentsInput ?? String(editState.installments)}
                        onChangeText={(t) => setEditState((prev) => (prev && prev.type === "package" ? { ...prev, customInstallmentsInput: t } : prev))}
                      />
                      <TouchableOpacity
                        testID="package-terms-apply-custom"
                        style={styles.tag}
                        onPress={() => setEditState((prev) => {
                          if (prev && prev.type === "package") {
                            const n = Number(prev.customInstallmentsInput);
                            if (!Number.isNaN(n) && n >= 1) return { ...prev, installments: n };
                            return prev;
                          }
                          return prev;
                        })}
                      >
                        <Text style={styles.tagText}>Toepassen</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {editState.type === "package" && editState.dropdownOpen && (
                  <View style={styles.dropdownPanel}>
                    {products.length === 0 ? (
                      <Text style={styles.muted}>Geen producten beschikbaar. Voeg ze eerst bij Producten toe.</Text>
                    ) : (
                      products.map((prod) => {
                        const checked = editState.selectedProducts.includes(prod.id);
                        return (
                          <TouchableOpacity
                            key={`ep-${prod.id}`}
                            style={styles.checkboxRow}
                            onPress={() =>
                              setEditState((prev) =>
                                prev && prev.type === "package"
                                  ? {
                                      ...prev,
                                      selectedProducts: checked
                                        ? prev.selectedProducts.filter((id) => id !== prod.id)
                                        : [...prev.selectedProducts, prod.id],
                                    }
                                  : prev
                              )
                            }
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
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                testID="cancel-edit"
                onPress={() => setEditState(null)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
                accessibilityRole="button"
              >
                <Text style={styles.modalBtnCancelText}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="confirm-edit"
                onPress={confirmEdit}
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                accessibilityRole="button"
              >
                <Check color="#fff" size={16} />
                <Text style={styles.modalBtnPrimaryText}>Opslaan</Text>
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
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  itemSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  inline: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  inlineBetween: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputSmall: { minWidth: 90, flex: 1 },
  inputDisabled: { backgroundColor: "#1f2937", borderColor: "#111827", color: "#fff" },
  inputWhite: { backgroundColor: "#ffffff", borderColor: "#e5e7eb" },
  currencyLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280", marginBottom: 6 },
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
  addBtnBlue: { backgroundColor: "#0ea5e9" },
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
  confirmBtnBlue: { backgroundColor: "#0ea5e9" },
  confirmBtnText: { color: "#fff", fontWeight: "700" },
  tag: {
    backgroundColor: "#e0f2fe",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
    minWidth: 85,
  },
  tagText: { color: "#0369a1", fontWeight: "600", fontSize: 13 },
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
  modalBtnPrimary: { backgroundColor: "#0ea5e9" },
  modalBtnPrimaryText: { color: "#fff", fontWeight: "700" },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  chipActive: { borderColor: "#0ea5e9", backgroundColor: "#e0f2fe" },
  chipLabel: { fontWeight: "700", color: "#0f172a" },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
});