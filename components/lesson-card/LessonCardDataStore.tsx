import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ItemStatus = "/" | "T" | "X";

export type LessonCardItemData = {
  itemId: string;
  status?: ItemStatus;
};

export type LessonCardData = {
  lessonId: string;
  studentId: string;
  lessonDate: string;
  items: LessonCardItemData[];
};

const LESSON_CARD_DATA_KEY = "lesson_card_data" as const;

export const [LessonCardDataProvider, useLessonCardData] = createContextHook(() => {
  const [allLessonCardData, setAllLessonCardData] = useState<LessonCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      console.log("[LessonCardDataStore] Loading lesson card data...");
      try {
        const stored = await AsyncStorage.getItem(LESSON_CARD_DATA_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as LessonCardData[];
          setAllLessonCardData(parsed);
          console.log("[LessonCardDataStore] Loaded lesson card data", parsed.length);
        }
      } catch (e) {
        console.error("[LessonCardDataStore] Failed to load lesson card data", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveLessonCardData = useCallback(async (data: LessonCardData[]) => {
    console.log("[LessonCardDataStore] Saving lesson card data", data.length);
    setAllLessonCardData(data);
    await AsyncStorage.setItem(LESSON_CARD_DATA_KEY, JSON.stringify(data));
  }, []);

  const getLessonCardData = useCallback((studentId: string, lessonId: string): LessonCardData | undefined => {
    return allLessonCardData.find((d) => d.studentId === studentId && d.lessonId === lessonId);
  }, [allLessonCardData]);

  const updateItemStatus = useCallback(async (
    studentId: string,
    lessonId: string,
    lessonDate: string,
    itemId: string,
    status?: ItemStatus
  ) => {
    console.log("[LessonCardDataStore] Updating item status", { studentId, lessonId, itemId, status });
    
    const existingIndex = allLessonCardData.findIndex(
      (d) => d.studentId === studentId && d.lessonId === lessonId
    );

    let updated: LessonCardData[];
    
    if (existingIndex >= 0) {
      const existing = allLessonCardData[existingIndex];
      const itemIndex = existing.items.findIndex((i) => i.itemId === itemId);
      
      let newItems: LessonCardItemData[];
      if (itemIndex >= 0) {
        if (status === undefined) {
          newItems = existing.items.filter((i) => i.itemId !== itemId);
        } else {
          newItems = existing.items.map((i) =>
            i.itemId === itemId ? { ...i, status } : i
          );
        }
      } else {
        if (status !== undefined) {
          newItems = [...existing.items, { itemId, status }];
        } else {
          newItems = existing.items;
        }
      }
      
      updated = allLessonCardData.map((d, idx) =>
        idx === existingIndex ? { ...d, items: newItems } : d
      );
    } else {
      if (status !== undefined) {
        const newData: LessonCardData = {
          studentId,
          lessonId,
          lessonDate,
          items: [{ itemId, status }],
        };
        updated = [...allLessonCardData, newData];
      } else {
        updated = allLessonCardData;
      }
    }
    
    await saveLessonCardData(updated);
  }, [allLessonCardData, saveLessonCardData]);

  const value = useMemo(
    () => ({
      allLessonCardData,
      loading,
      getLessonCardData,
      updateItemStatus,
    }),
    [allLessonCardData, loading, getLessonCardData, updateItemStatus]
  );

  return value;
});
