import { useEffect, useMemo, useState, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../auth/AuthStore";
import { supabase } from "@/lib/supabase";

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

    let cancelled = false;

    const loadFromSupabase = async () => {
      if (!isInstructor || !activeUserId) {
        return;
      }

      try {
        console.log("[SettingsStore] Loading from Supabase...");
        const { data, error } = await supabase
          .from("instructor_profiles")
          .select("base_lesson_duration, product_durations, break_between_lessons, automatic_breaks, require_confirmation, cancellation_notice_hours, products, packages, hourly_rate, hourly_vat_status")
          .eq("user_id", activeUserId)
          .maybeSingle() as { data: any; error: any };

        if (error) {
          console.log("[SettingsStore] Supabase error:", error);
          return;
        }

        if (data) {
          if (data.base_lesson_duration !== null || data.break_between_lessons !== null) {
            const config: Partial<LessonConfig> & Partial<{ practicalLessonDuration: number }> = {
              baseLessonDuration: data.base_lesson_duration ?? 60,
              productDurations: data.product_durations ?? {},
              breakBetweenLessons: data.break_between_lessons ?? 15,
              automaticBreaks: data.automatic_breaks ?? false,
              requireConfirmation: data.require_confirmation ?? true,
              cancellationNoticeHours: data.cancellation_notice_hours ?? 24,
            };
            const migrated: LessonConfig = {
              baseLessonDuration: config.baseLessonDuration ?? 60,
              productDurations: config.productDurations ?? {},
              breakBetweenLessons: config.breakBetweenLessons ?? 15,
              automaticBreaks: config.automaticBreaks ?? false,
              requireConfirmation: config.requireConfirmation ?? true,
              cancellationNoticeHours: config.cancellationNoticeHours ?? 24,
            };
            setLessonConfig(migrated);
            await storageSetString(LESSON_CONFIG_KEY, JSON.stringify(migrated));
          }
          if (data.products) {
            const raw = data.products as Partial<Product>[];
            const list: Product[] = raw.map((p) => ({
              id: String(p.id ?? ""),
              name: String(p.name ?? ""),
              price: Number(p.price ?? 0),
              vatStatus: (p.vatStatus as Product["vatStatus"]) ?? "incl",
              installments: typeof p.installments === "number" && p.installments >= 1 ? p.installments : 1,
            }));
            setProducts(list);
            await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
          }
          if (data.packages) {
            const rawPk = data.packages as Partial<PackageItem>[];
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
            await AsyncStorage.setItem(PACKAGES_KEY, JSON.stringify(pkgs));
          }
          if (data.hourly_rate !== null) {
            const rates: HourlyRates = {
              price: data.hourly_rate ?? 0,
              vatStatus: (data.hourly_vat_status as HourlyRates["vatStatus"]) ?? "incl",
            };
            setHourlyRates(rates);
            await AsyncStorage.setItem(HOURLY_RATES_KEY, JSON.stringify(rates));
          }
          console.log("[SettingsStore] Loaded from Supabase successfully");
        }
      } catch (error) {
        console.log("[SettingsStore] Failed to load from Supabase:", error);
      }
    };

    const loadFromLocal = async () => {
      console.log("[SettingsStore] Loading settings from local storage...");
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
            baseLessonDuration:
              typeof parsed.baseLessonDuration === "number"
                ? parsed.baseLessonDuration
                : typeof parsed.practicalLessonDuration === "number"
                  ? parsed.practicalLessonDuration
                  : 60,
            productDurations: parsed.productDurations ?? {},
            breakBetweenLessons:
              typeof parsed.breakBetweenLessons === "number"
                ? parsed.breakBetweenLessons
                : defaultLessonConfig.breakBetweenLessons,
            automaticBreaks:
              typeof parsed.automaticBreaks === "boolean"
                ? parsed.automaticBreaks
                : defaultLessonConfig.automaticBreaks,
            requireConfirmation:
              typeof parsed.requireConfirmation === "boolean"
                ? parsed.requireConfirmation
                : defaultLessonConfig.requireConfirmation,
            cancellationNoticeHours:
              (parsed.cancellationNoticeHours as LessonConfig["cancellationNoticeHours"]) ??
              defaultLessonConfig.cancellationNoticeHours,
          };
          setLessonConfig(migrated);
          console.log("[SettingsStore] Loaded lesson config from local storage");
        } catch (e) {
          console.log("[SettingsStore] Failed to parse lesson config", e);
          setLessonConfig(defaultLessonConfig);
        }
      } else {
        setLessonConfig(defaultLessonConfig);
      }

      if (cancelled) {
        return;
      }

      if (productsStr) {
        try {
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
            list.forEach((p) => {
              if (typeof nextDurations[p.name] !== "number") {
                nextDurations[p.name] = prev.baseLessonDuration ?? 60;
              }
            });
            return { ...prev, productDurations: nextDurations };
          });
          console.log("[SettingsStore] Loaded products from local storage", list.length);
        } catch (error) {
          console.log("[SettingsStore] Failed to parse stored products", error);
          setProducts([]);
        }
      } else {
        setProducts([]);
      }

      if (cancelled) {
        return;
      }

      if (packagesStr) {
        try {
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
        } catch (error) {
          console.log("[SettingsStore] Failed to parse stored packages", error);
          setPackages([]);
        }
      } else {
        setPackages([]);
      }

      if (ratesStr) {
        try {
          setHourlyRates(JSON.parse(ratesStr) as HourlyRates);
        } catch (error) {
          console.log("[SettingsStore] Failed to parse stored hourly rates", error);
          setHourlyRates({ price: 0, vatStatus: "incl" });
        }
      } else {
        setHourlyRates({ price: 0, vatStatus: "incl" });
      }
    };



    const run = async () => {
      setLoading(true);
      if (isInstructor) {
        await loadFromSupabase();
      } else {
        await loadFromLocal();
      }
      if (!cancelled) {
        setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, activeUserId, isInstructor]);

  type SyncPayload = {
    lessonConfig?: LessonConfig;
    products?: Product[];
    packages?: PackageItem[];
    hourlyRates?: HourlyRates;
  };

  const syncRemote = useCallback(async (payload: SyncPayload) => {
    if (!isAuthenticated || !activeUserId || !isInstructor) {
      console.log("[SettingsStore] Skipping sync: not authenticated or not instructor");
      return;
    }

    try {
      console.log("[SettingsStore] Syncing to Supabase...");
      const updateData = {} as any;

      if (payload.lessonConfig) {
        updateData.base_lesson_duration = payload.lessonConfig.baseLessonDuration;
        updateData.product_durations = payload.lessonConfig.productDurations;
        updateData.break_between_lessons = payload.lessonConfig.breakBetweenLessons;
        updateData.automatic_breaks = payload.lessonConfig.automaticBreaks;
        updateData.require_confirmation = payload.lessonConfig.requireConfirmation;
        updateData.cancellation_notice_hours = payload.lessonConfig.cancellationNoticeHours;
      }
      if (payload.products) {
        updateData.products = payload.products;
      }
      if (payload.packages) {
        updateData.packages = payload.packages;
      }
      if (payload.hourlyRates) {
        updateData.hourly_rate = payload.hourlyRates.price;
        updateData.hourly_vat_status = payload.hourlyRates.vatStatus;
      }

      const { error } = await (supabase.from("instructor_profiles").update as any)(updateData).eq("user_id", activeUserId);
      
      if (error) {
        console.error("[SettingsStore] Failed to sync to Supabase:", error);
      } else {
        console.log("[SettingsStore] Successfully synced to Supabase");
      }
    } catch (error) {
      console.error("[SettingsStore] Failed to sync:", error);
    }
  }, [isAuthenticated, activeUserId, isInstructor]);

  const updateLessonConfig = useCallback(
    async (config: LessonConfig) => {
      console.log("[SettingsStore] Updating lesson config", config);
      setLessonConfig(config);
      await storageSetString(LESSON_CONFIG_KEY, JSON.stringify(config));
      await syncRemote({ lessonConfig: config });
    },
    [syncRemote],
  );

  const updateProducts = useCallback(
    async (prods: Product[]) => {
      console.log("[SettingsStore] Updating products", prods.length);
      const nextDurations = { ...lessonConfig.productDurations };
      prods.forEach((p) => {
        if (typeof nextDurations[p.name] !== "number") {
          nextDurations[p.name] = lessonConfig.baseLessonDuration ?? 60;
        }
      });
      const updatedLessonConfig: LessonConfig = { ...lessonConfig, productDurations: nextDurations };

      setProducts(prods);
      setLessonConfig(updatedLessonConfig);

      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods));
      await storageSetString(LESSON_CONFIG_KEY, JSON.stringify(updatedLessonConfig));
      await syncRemote({ products: prods, lessonConfig: updatedLessonConfig });
    },
    [lessonConfig, syncRemote],
  );

  const updatePackages = useCallback(
    async (pkgs: PackageItem[]) => {
      console.log("[SettingsStore] Updating packages", pkgs.length);
      setPackages(pkgs);
      await AsyncStorage.setItem(PACKAGES_KEY, JSON.stringify(pkgs));
      await syncRemote({ packages: pkgs });
    },
    [syncRemote],
  );

  const updateHourlyRates = useCallback(
    async (rates: HourlyRates) => {
      console.log("[SettingsStore] Updating hourly rates", rates);
      setHourlyRates(rates);
      await AsyncStorage.setItem(HOURLY_RATES_KEY, JSON.stringify(rates));
      await syncRemote({ hourlyRates: rates });
    },
    [syncRemote],
  );

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
