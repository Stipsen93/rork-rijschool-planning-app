import { useEffect, useMemo, useState, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../auth/AuthStore";
import { trpc } from "@/lib/trpc";

type LessonConfig = {
  baseLessonDuration: number;
  productDurations: Record<string, number>;
  breakBetweenLessons: number;
  automaticBreaks: boolean;
  requireConfirmation: boolean;
  cancellationNoticeHours: 2 | 4 | 12 | 24 | 48;
};

type Product = { id: string; name: string; price: number; vatStatus: "incl" | "excl"; installments: number };
type PackageItem = { id: string; name: string; hours: number; price: number; vatStatus: "incl" | "excl"; selectedProducts: string[]; installments: number };
type HourlyRates = { price: number; vatStatus: "incl" | "excl" };

const LESSON_CONFIG_KEY = "lesson_configuration" as const;
const PRODUCTS_KEY = "instructor_products" as const;
const PACKAGES_KEY = "instructor_packages" as const;
const HOURLY_RATES_KEY = "instructor_hourly_rates" as const;

const defaultLessonConfig: LessonConfig = {
  baseLessonDuration: 60,
  productDurations: {},
  breakBetweenLessons: 15,
  automaticBreaks: false,
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
    console.log("[SettingsStore] storageGetString error", key, e);
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
    console.log("[SettingsStore] storageSetString error", key, e);
  }
}

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [lessonConfig, setLessonConfig] = useState<LessonConfig>(defaultLessonConfig);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [hourlyRates, setHourlyRates] = useState<HourlyRates>({ price: 0, vatStatus: "incl" });
  const [loading, setLoading] = useState<boolean>(true);
  const { isAuthenticated, user, profile: authProfile } = useAuth();
  const activeUserId = user?.id ?? null;
  const isInstructor = authProfile?.role === "instructor";

  const fetchSettingsQuery = trpc.instructor.fetchSettings.useQuery(undefined, {
    enabled: isAuthenticated && isInstructor,
    retry: 1,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLessonConfig(defaultLessonConfig);
      setProducts([]);
      setPackages([]);
      setHourlyRates({ price: 0, vatStatus: "incl" });
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !activeUserId) {
      return;
    }

    if (!isInstructor) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      console.log("[SettingsStore] Loading settings from Supabase...");
      try {
        if (fetchSettingsQuery.data) {
          const data = fetchSettingsQuery.data;

          if (data.lessonConfig) {
            setLessonConfig(data.lessonConfig);
            console.log("[SettingsStore] Loaded lesson config from Supabase");
          }

          if (data.products && Array.isArray(data.products)) {
            const list: Product[] = data.products.map((p: any) => ({
              id: String(p.id ?? ""),
              name: String(p.name ?? ""),
              price: Number(p.price ?? 0),
              vatStatus: (p.vatStatus as Product["vatStatus"]) ?? "incl",
              installments: typeof p.installments === "number" && p.installments >= 1 ? p.installments : 1,
            }));
            setProducts(list);
            console.log("[SettingsStore] Loaded", list.length, "products from Supabase");

            setLessonConfig((prev) => {
              const nextDurations = { ...prev.productDurations };
              list.forEach((p) => { if (typeof nextDurations[p.name] !== "number") nextDurations[p.name] = 60; });
              return { ...prev, productDurations: nextDurations };
            });
          }

          if (data.packages && Array.isArray(data.packages)) {
            const pkgs: PackageItem[] = data.packages.map((p: any) => ({
              id: String(p.id ?? ""),
              name: String(p.name ?? ""),
              hours: Number(p.hours ?? 0),
              price: Number(p.price ?? 0),
              vatStatus: (p.vatStatus as PackageItem["vatStatus"]) ?? "incl",
              selectedProducts: Array.isArray(p.selectedProducts) ? p.selectedProducts.map(String) : [],
              installments: typeof p.installments === "number" && p.installments >= 1 ? p.installments : 1,
            }));
            setPackages(pkgs);
            console.log("[SettingsStore] Loaded", pkgs.length, "packages from Supabase");
          }

          if (data.hourlyRates) {
            setHourlyRates(data.hourlyRates);
            console.log("[SettingsStore] Loaded hourly rates from Supabase");
          }
        } else {
          console.log("[SettingsStore] No data from Supabase, loading from local storage...");
          const [configStr, productsStr, packagesStr, ratesStr] = await Promise.all([
            storageGetString(LESSON_CONFIG_KEY),
            AsyncStorage.getItem(PRODUCTS_KEY),
            AsyncStorage.getItem(PACKAGES_KEY),
            AsyncStorage.getItem(HOURLY_RATES_KEY),
          ]);

          if (cancelled) {
            return;
          }

          if (configStr) {
            try {
              const parsed = JSON.parse(configStr) as Partial<LessonConfig> & Partial<{ practicalLessonDuration: number }>;
              const migrated: LessonConfig = {
                baseLessonDuration: typeof parsed.baseLessonDuration === "number" ? parsed.baseLessonDuration : (typeof parsed.practicalLessonDuration === "number" ? parsed.practicalLessonDuration : 60),
                productDurations: parsed.productDurations ?? {},
                breakBetweenLessons: typeof parsed.breakBetweenLessons === "number" ? parsed.breakBetweenLessons : defaultLessonConfig.breakBetweenLessons,
                automaticBreaks: typeof parsed.automaticBreaks === "boolean" ? parsed.automaticBreaks : defaultLessonConfig.automaticBreaks,
                requireConfirmation: typeof parsed.requireConfirmation === "boolean" ? parsed.requireConfirmation : defaultLessonConfig.requireConfirmation,
                cancellationNoticeHours: (parsed.cancellationNoticeHours as LessonConfig["cancellationNoticeHours"]) ?? defaultLessonConfig.cancellationNoticeHours,
              };
              setLessonConfig(migrated);
              console.log("[SettingsStore] Loaded lesson config from local storage");
            } catch (e) {
              console.log("[SettingsStore] Failed to parse lesson config", e);
            }
          } else {
            setLessonConfig(defaultLessonConfig);
          }

          if (cancelled) {
            return;
          }

          if (productsStr) {
            const raw = JSON.parse(productsStr) as Partial<Product>[];
            const list: Product[] = raw.map((p) => ({
              id: String(p.id ?? ""),
              name: String(p.name ?? ""),
              price: Number(p.price ?? 0),
              vatStatus: (p.vatStatus as Product["vatStatus"]) ?? "incl",
              installments: typeof p.installments === "number" && p.installments >= 1 ? p.installments : 1,
            }));
            setProducts(list);
            setLessonConfig((prev) => {
              const nextDurations = { ...prev.productDurations };
              list.forEach((p) => { if (typeof nextDurations[p.name] !== "number") nextDurations[p.name] = 60; });
              return { ...prev, productDurations: nextDurations };
            });
            console.log("[SettingsStore] Loaded products from local storage", list.length);
          } else {
            setProducts([]);
          }

          if (cancelled) {
            return;
          }

          if (packagesStr) {
            const rawPk = JSON.parse(packagesStr) as Partial<PackageItem>[];
            const pkgs: PackageItem[] = rawPk.map((p) => ({
              id: String(p.id ?? ""),
              name: String(p.name ?? ""),
              hours: Number(p.hours ?? 0),
              price: Number(p.price ?? 0),
              vatStatus: (p.vatStatus as PackageItem["vatStatus"]) ?? "incl",
              selectedProducts: Array.isArray(p.selectedProducts) ? p.selectedProducts.map(String) : [],
              installments: typeof p.installments === "number" && p.installments >= 1 ? p.installments : 1,
            }));
            setPackages(pkgs);
          } else {
            setPackages([]);
          }

          if (ratesStr) {
            setHourlyRates(JSON.parse(ratesStr) as HourlyRates);
          } else {
            setHourlyRates({ price: 0, vatStatus: "incl" });
          }
        }
      } catch (e) {
        console.error("[SettingsStore] Failed to load settings", e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, activeUserId, isInstructor, fetchSettingsQuery.data]);

  const updateLessonConfig = useCallback(async (config: LessonConfig) => {
    console.log("[SettingsStore] Updating lesson config", config);
    setLessonConfig(config);
    await storageSetString(LESSON_CONFIG_KEY, JSON.stringify(config));
  }, []);

  const updateProducts = useCallback(async (prods: Product[]) => {
    console.log("[SettingsStore] Updating products", prods.length);
    setProducts(prods);
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods));
    setLessonConfig((prev) => {
      const nextDurations = { ...prev.productDurations };
      prods.forEach((p) => { if (typeof nextDurations[p.name] !== "number") nextDurations[p.name] = 60; });
      const updated = { ...prev, productDurations: nextDurations };
      void storageSetString(LESSON_CONFIG_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updatePackages = useCallback(async (pkgs: PackageItem[]) => {
    console.log("[SettingsStore] Updating packages", pkgs.length);
    setPackages(pkgs);
    await AsyncStorage.setItem(PACKAGES_KEY, JSON.stringify(pkgs));
  }, []);

  const updateHourlyRates = useCallback(async (rates: HourlyRates) => {
    console.log("[SettingsStore] Updating hourly rates", rates);
    setHourlyRates(rates);
    await AsyncStorage.setItem(HOURLY_RATES_KEY, JSON.stringify(rates));
  }, []);

  const getDurationForType = useCallback((type: string): number => {
    if (type === "Rijles") return lessonConfig.baseLessonDuration;
    return lessonConfig.productDurations[type] ?? lessonConfig.baseLessonDuration ?? 60;
  }, [lessonConfig]);

  const value = useMemo(
    () => ({
      lessonConfig,
      products,
      packages,
      hourlyRates,
      loading,
      updateLessonConfig,
      updateProducts,
      updatePackages,
      updateHourlyRates,
      getDurationForType,
    }),
    [lessonConfig, products, packages, hourlyRates, loading, updateLessonConfig, updateProducts, updatePackages, updateHourlyRates, getDurationForType]
  );

  return value;
});
