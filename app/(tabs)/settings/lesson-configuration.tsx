import React from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ChevronDown } from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LessonConfig = {
  baseLessonDuration: number; // Rijles
  productDurations: Record<string, number>; // key: product name, value: minutes
  breakBetweenLessons: number;
  automaticBreaks: boolean;
  allowBackToBackLessons: boolean;
  requireConfirmation: boolean;
  cancellationNoticeHours: 2 | 4 | 12 | 24 | 48;
};

const STORAGE_KEY = "lesson_configuration" as const;
const PRODUCTS_KEY = "instructor_products" as const;

type Product = { id: string; name: string; price: number; vatStatus: "incl" | "excl" };

const defaultConfig: LessonConfig = {
  baseLessonDuration: 60,
  productDurations: {},
  breakBetweenLessons: 15,
  automaticBreaks: false,
  allowBackToBackLessons: false,
  requireConfirmation: true,
  cancellationNoticeHours: 24,
};

async function storageGetString(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") return window.localStorage.getItem(key);
    const path = `${FileSystem.documentDirectory ?? ""}${key}.json`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(path);
  } catch (e) {
    console.log("storageGetString error", e);
    return null;
  }
}

async function storageSetString(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.setItem(key, value);
      return;
    }
    const path = `${FileSystem.documentDirectory ?? ""}${key}.json`;
    await FileSystem.writeAsStringAsync(path, value);
  } catch (e) {
    console.log("storageSetString error", e);
  }
}

export default function LessonConfigurationScreen() {
  const [config, setConfig] = React.useState<LessonConfig>(defaultConfig);
  const [openCancelDropdown, setOpenCancelDropdown] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    (async () => {
      console.log("Loading lesson configuration...");
      const raw = await storageGetString(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<LessonConfig> & Partial<{ practicalLessonDuration: number; theoryLessonDuration: number; examLessonDuration: number }>;
          const migrated: LessonConfig = {
            baseLessonDuration: typeof parsed.baseLessonDuration === "number" ? parsed.baseLessonDuration : (typeof parsed.practicalLessonDuration === "number" ? parsed.practicalLessonDuration : 60),
            productDurations: parsed.productDurations ?? {},
            breakBetweenLessons: typeof parsed.breakBetweenLessons === "number" ? parsed.breakBetweenLessons : defaultConfig.breakBetweenLessons,
            automaticBreaks: typeof parsed.automaticBreaks === "boolean" ? parsed.automaticBreaks : defaultConfig.automaticBreaks,
            allowBackToBackLessons: typeof parsed.allowBackToBackLessons === "boolean" ? parsed.allowBackToBackLessons : defaultConfig.allowBackToBackLessons,
            requireConfirmation: typeof parsed.requireConfirmation === "boolean" ? parsed.requireConfirmation : defaultConfig.requireConfirmation,
            cancellationNoticeHours: (parsed.cancellationNoticeHours as LessonConfig["cancellationNoticeHours"]) ?? defaultConfig.cancellationNoticeHours,
          };
          setConfig(migrated);
        } catch (e) {
          console.log("Failed to parse lesson configuration", e);
        }
      }
      try {
        const pStr = await AsyncStorage.getItem(PRODUCTS_KEY);
        if (pStr) {
          const list = JSON.parse(pStr) as Product[];
          setProducts(list);
          setConfig((prev) => {
            const nextDurations = { ...prev.productDurations };
            list.forEach((p) => { if (typeof nextDurations[p.name] !== "number") nextDurations[p.name] = 60; });
            return { ...prev, productDurations: nextDurations };
          });
        } else {
          setProducts([]);
        }
      } catch (e) {
        console.log("Failed to load products", e);
        setProducts([]);
      }
    })();
  }, []);

  const save = React.useCallback(async () => {
    setSaving(true);
    try {
      await storageSetString(STORAGE_KEY, JSON.stringify(config));
      if (Platform.OS === "android") {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ToastAndroid } = require("react-native");
        ToastAndroid.show("Les configuratie opgeslagen", ToastAndroid.SHORT);
      } else {
        Alert.alert("", "Les configuratie opgeslagen");
      }
    } catch (e) {
      console.log("Save configuration error", e);
      Alert.alert("Fout", "Kan configuratie niet opslaan");
    } finally {
      setSaving(false);
    }
  }, [config]);

  return (
    <ErrorBoundary>
      <View style={styles.root} testID="lesson-configuration-screen">
        <Stack.Screen
          options={{
            title: "Les configuratie",
            headerRight: () => (
              <TouchableOpacity testID="save-lesson-config" onPress={save} style={{ padding: 8 }} accessibilityRole="button">
                <Text style={{ color: "#0ea5e9", fontWeight: "600" }}>{saving ? "Opslaan…" : "Opslaan"}</Text>
              </TouchableOpacity>
            ),
          }}
        />

        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top ? 8 : 0, paddingBottom: 24 + insets.bottom }]}>
          <Text style={styles.muted}>Configureer je lesopties en instellingen</Text>

          <Card title="Lesduur Instellingen">
            <DurationControl
              label="Rijles"
              value={config.baseLessonDuration}
              min={30}
              max={180}
              onChange={(v) => setConfig((p) => ({ ...p, baseLessonDuration: v }))}
            />
          </Card>

          <Card title="Productduur">
            {products.length === 0 ? (
              <Text style={styles.muted}>Geen producten gevonden. Voeg producten toe via Instellingen → Pakketten/Uren.</Text>
            ) : (
              products.map((prod) => (
                <View key={prod.id} style={{ marginBottom: 12 }}>
                  <DurationControl
                    label={prod.name}
                    value={config.productDurations[prod.name] ?? 60}
                    min={15}
                    max={180}
                    step={5}
                    onChange={(v) => setConfig((p) => ({ ...p, productDurations: { ...p.productDurations, [prod.name]: v } }))}
                  />
                </View>
              ))
            )}
          </Card>

          <Card title="Wacht/reistijd">
            <ToggleRow
              title="Automatische wacht/reistijd"
              subtitle="Automatisch wacht/reistijd inplannen tussen lessen"
              value={config.automaticBreaks}
              onToggle={() => setConfig((p) => ({ ...p, automaticBreaks: !p.automaticBreaks }))}
            />
            {config.automaticBreaks && (
              <View style={{ marginTop: 12 }}>
                <DurationControl
                  label="Wacht/reistijd tussen lessen"
                  value={config.breakBetweenLessons}
                  min={5}
                  max={60}
                  step={5}
                  onChange={(v) => setConfig((p) => ({ ...p, breakBetweenLessons: v }))}
                />
              </View>
            )}
          </Card>

          <Card title="Planning Opties">
            
            <ToggleRow
              title="Bevestiging vereisen"
              subtitle="Leerlingen moeten lesboekingen bevestigen"
              value={config.requireConfirmation}
              onToggle={() => setConfig((p) => ({ ...p, requireConfirmation: !p.requireConfirmation }))}
            />

            <View style={{ height: 16 }} />
            <Text style={styles.fieldLabel}>Annuleringstermijn</Text>
            <TouchableOpacity
              testID="dropdown-cancellation-hours"
              style={styles.dropdown}
              onPress={() => setOpenCancelDropdown((o) => !o)}
              accessibilityRole="button"
            >
              <Text style={styles.dropdownText}>{hoursLabel(config.cancellationNoticeHours)}</Text>
              <ChevronDown color="#6b7280" size={18} />
            </TouchableOpacity>
            {openCancelDropdown && (
              <View style={styles.dropdownMenu}>
                {[2, 4, 12, 24, 48].map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setConfig((p) => ({ ...p, cancellationNoticeHours: h as LessonConfig["cancellationNoticeHours"] }));
                      setOpenCancelDropdown(false);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.dropdownItemText}>{hoursLabel(h as LessonConfig["cancellationNoticeHours"])}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

function hoursLabel(h: LessonConfig["cancellationNoticeHours"]): string {
  switch (h) {
    case 2:
      return "2 uur van tevoren";
    case 4:
      return "4 uur van tevoren";
    case 12:
      return "12 uur van tevoren";
    case 24:
      return "24 uur van tevoren";
    case 48:
      return "48 uur van tevoren";
  }
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={{ height: 8 }} />
      {children}
    </View>
  );
}

function DurationControl({ label, value, min, max, step = 5, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <View>
      <View style={styles.rowBetween}>
        <Text style={styles.durationLabel}>{label}</Text>
        <Text style={styles.durationValue}>{value} min</Text>
      </View>
      <View style={{ height: 8 }} />
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} />
      <View style={styles.rowBetween}>
        <Text style={styles.minMaxText}>{min} min</Text>
        <Text style={styles.minMaxText}>{max} min</Text>
      </View>
    </View>
  );
}

function ToggleRow({ title, subtitle, value, onToggle }: { title: string; subtitle?: string; value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.toggleRow} accessibilityRole="button">
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {subtitle ? <Text style={styles.toggleSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.switchPill, { backgroundColor: value ? "#e0f2fe" : "#f3f4f6" }]}>
        <View style={[styles.switchDot, { backgroundColor: value ? "#0ea5e9" : "#9ca3af", alignSelf: value ? "flex-end" : "flex-start" }]} />
      </View>
    </TouchableOpacity>
  );
}

function Slider({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const pct = Math.round(((value - min) / (max - min)) * 100);
  return (
    <View style={styles.sliderRoot}>
      <View style={[styles.sliderTrack]} />
      <View style={[styles.sliderFilled, { width: `${pct}%` }]} />
      <View style={[styles.sliderThumb, { left: `${pct}%` }]} />
      <View style={styles.sliderTicksRow} pointerEvents="none">
        {Array.from({ length: Math.floor((max - min) / step) + 1 }).map((_, i) => (
          <View key={i} style={styles.tick} />
        ))}
      </View>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={{ flex: 1, flexDirection: "row" }}>
          {Array.from({ length: Math.floor((max - min) / step) + 1 }).map((_, i) => (
            <TouchableOpacity
              key={i}
              style={{ flex: 1, height: 32 }}
              onPress={() => onChange(Math.min(max, Math.max(min, min + i * step)))}
              accessibilityRole="button"
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f3f4f6" },
  scroll: { padding: 16, paddingBottom: 32 },
  muted: { color: "#4b5563", marginBottom: 16 },

  card: {
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    padding: 16,
    marginTop: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: "700" },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  durationLabel: { fontSize: 16, fontWeight: "600" },
  durationValue: { fontSize: 16, fontWeight: "700", color: "#0ea5e9" },
  minMaxText: { fontSize: 12, color: "#6b7280" },

  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleTitle: { fontSize: 16, fontWeight: "600" },
  toggleSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  switchPill: { width: 46, height: 28, borderRadius: 999, padding: 4, justifyContent: "center" },
  switchDot: { width: 20, height: 20, borderRadius: 999 },

  fieldLabel: { fontSize: 16, fontWeight: "600" },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: { fontWeight: "600" },
  dropdownMenu: { marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, overflow: "hidden" },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#fff" },
  dropdownItemText: { fontSize: 14 },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#0ea5e9",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700" },

  sliderRoot: { height: 36, justifyContent: "center" },
  sliderTrack: { position: "absolute", left: 0, right: 0, height: 6, borderRadius: 999, backgroundColor: "#e5e7eb" },
  sliderFilled: { position: "absolute", left: 0, height: 6, borderRadius: 999, backgroundColor: "#0ea5e9" },
  sliderThumb: { position: "absolute", width: 20, height: 20, borderRadius: 999, backgroundColor: "#0ea5e9", marginLeft: -10 },
  sliderTicksRow: { position: "absolute", left: 0, right: 0, height: 6, flexDirection: "row", justifyContent: "space-between" },
  tick: { width: 1, height: 6, backgroundColor: "transparent" },
});