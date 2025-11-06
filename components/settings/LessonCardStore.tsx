import { useEffect, useMemo, useState, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type LessonCardItem = {
  id: string;
  name: string;
  description?: string;
};

export type LessonCardCategory = {
  id: string;
  name: string;
  items: LessonCardItem[];
};

const LESSON_CARD_KEY = "lesson_card_categories" as const;

const defaultCategories: LessonCardCategory[] = [
  {
    id: "1",
    name: "Voertuigbeheersing",
    items: [
      { id: "1-1", name: "Zithouding/Stuurhouding/Spiegels" },
      { id: "1-2", name: "Wegrijden/Stoppen" },
      { id: "1-3", name: "Koppelen/Schakelen" },
      { id: "1-4", name: "Sturen" },
    ],
  },
  {
    id: "2",
    name: "Eenvoudige verkeerssituaties",
    items: [
      { id: "2-1", name: "Kijkgedrag" },
      { id: "2-2", name: "Plaats op de weg" },
      { id: "2-3", name: "Volgafstand" },
      { id: "2-4", name: "Rijstroken" },
      { id: "2-5", name: "Gelijkwaardige kruispunten" },
      { id: "2-6", name: "Eenvoudige rotondes" },
      { id: "2-7", name: "Invoegen/Uitvoegen" },
      { id: "2-8", name: "Bord C2" },
    ],
  },
  {
    id: "3",
    name: "Complexe verkeerssituaties",
    items: [
      { id: "3-1", name: "Ongelijkwaardige kruispunten" },
      { id: "3-2", name: "Complexe rotondes" },
      { id: "3-3", name: "Anticiperen/Aangepast rijgedrag" },
      { id: "3-4", name: "Veiligheid" },
      { id: "3-5", name: "Doorstroming" },
    ],
  },
  {
    id: "4",
    name: "Bijzondere verrichtingen",
    items: [
      { id: "4-1", name: "Vooruit parkeren" },
      { id: "4-2", name: "Achteruit parkeren" },
      { id: "4-3", name: "File Parkeren achteruit" },
      { id: "4-4", name: "File parkeren vooruit" },
      { id: "4-5", name: "Keren d.m.v. steken" },
      { id: "4-6", name: "Keren d.m.v. halve draai" },
      { id: "4-7", name: "Bocht achteruit" },
      { id: "4-8", name: "Helling proef" },
      { id: "4-9", name: "rechte lijn achteruit" },
    ],
  },
];

export const [LessonCardProvider, useLessonCard] = createContextHook(() => {
  const [categories, setCategories] = useState<LessonCardCategory[]>(defaultCategories);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      console.log("[LessonCardStore] Loading categories...");
      try {
        const stored = await AsyncStorage.getItem(LESSON_CARD_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as LessonCardCategory[];
          setCategories(parsed);
          console.log("[LessonCardStore] Loaded categories", parsed.length);
        }
      } catch (e) {
        console.error("[LessonCardStore] Failed to load categories", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateCategories = useCallback(async (cats: LessonCardCategory[]) => {
    console.log("[LessonCardStore] Updating categories", cats.length);
    setCategories(cats);
    await AsyncStorage.setItem(LESSON_CARD_KEY, JSON.stringify(cats));
  }, []);

  const addCategory = useCallback(
    async (name: string) => {
      const newCategory: LessonCardCategory = {
        id: Date.now().toString(),
        name,
        items: [],
      };
      const updated = [...categories, newCategory];
      await updateCategories(updated);
      return newCategory;
    },
    [categories, updateCategories]
  );

  const updateCategory = useCallback(
    async (categoryId: string, name: string) => {
      const updated = categories.map((cat) =>
        cat.id === categoryId ? { ...cat, name } : cat
      );
      await updateCategories(updated);
    },
    [categories, updateCategories]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      const updated = categories.filter((cat) => cat.id !== categoryId);
      await updateCategories(updated);
    },
    [categories, updateCategories]
  );

  const addItem = useCallback(
    async (categoryId: string, name: string) => {
      const newItem: LessonCardItem = {
        id: `${categoryId}-${Date.now()}`,
        name,
      };
      const updated = categories.map((cat) =>
        cat.id === categoryId ? { ...cat, items: [...cat.items, newItem] } : cat
      );
      await updateCategories(updated);
      return newItem;
    },
    [categories, updateCategories]
  );

  const updateItem = useCallback(
    async (categoryId: string, itemId: string, name: string, description?: string) => {
      const updated = categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, name, description } : item
              ),
            }
          : cat
      );
      await updateCategories(updated);
    },
    [categories, updateCategories]
  );

  const deleteItem = useCallback(
    async (categoryId: string, itemId: string) => {
      const updated = categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((item) => item.id !== itemId) }
          : cat
      );
      await updateCategories(updated);
    },
    [categories, updateCategories]
  );

  const value = useMemo(
    () => ({
      categories,
      loading,
      addCategory,
      updateCategory,
      deleteCategory,
      addItem,
      updateItem,
      deleteItem,
    }),
    [categories, loading, addCategory, updateCategory, deleteCategory, addItem, updateItem, deleteItem]
  );

  return value;
});
