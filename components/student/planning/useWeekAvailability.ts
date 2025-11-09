import { useMemo } from "react";
import { useWorkingHours, type DayKey } from "@/components/settings/WorkingHoursStore";
import { useSettings } from "@/components/settings/SettingsStore";
import { generateTimeSlots } from "./AvailableTimeSlots";

function dutchDayName(d: Date): DayKey {
  const idx = d.getDay();
  switch (idx) {
    case 1: return "Maandag";
    case 2: return "Dinsdag";
    case 3: return "Woensdag";
    case 4: return "Donderdag";
    case 5: return "Vrijdag";
    case 6: return "Zaterdag";
    default: return "Zondag";
  }
}

function keyFor(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function useWeekAvailability(currentWeekStart: Date): Record<string, boolean> {
  const { workingHours } = useWorkingHours();
  const { lessonConfig } = useSettings();

  return useMemo(() => {
    const availabilityMap: Record<string, boolean> = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(
        currentWeekStart.getFullYear(),
        currentWeekStart.getMonth(),
        currentWeekStart.getDate() + i
      );
      const dayKey = dutchDayName(date);
      const dayConfig = workingHours?.[dayKey];
      
      if (dayConfig?.enabled && dayConfig.ranges && dayConfig.ranges.length > 0) {
        const lessonDuration = lessonConfig.baseLessonDuration || 60;
        const breakDuration = lessonConfig.breakBetweenLessons || 15;
        
        const slots = generateTimeSlots(
          dayConfig.ranges,
          dayConfig.pauses || [],
          lessonDuration,
          breakDuration
        );
        
        availabilityMap[keyFor(date)] = slots.length > 0;
      } else {
        availabilityMap[keyFor(date)] = false;
      }
    }
    
    return availabilityMap;
  }, [currentWeekStart, workingHours, lessonConfig]);
}
