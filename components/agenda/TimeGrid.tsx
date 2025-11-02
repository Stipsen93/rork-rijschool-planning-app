import React, { memo, useRef, useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Animated, PanResponder } from "react-native";
import { useAgenda } from "@/components/agenda/AgendaStore";
import { useWorkingHours, type DayKey, type VacationPeriod } from "@/components/settings/WorkingHoursStore";
import { useFocusEffect } from "expo-router";
import { MapPin } from "lucide-react-native";

function parseTime(hhmm: string): { hours: number; minutes: number } {
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  return {
    hours: Number.isFinite(h) ? h : 0,
    minutes: Number.isFinite(m) ? m : 0,
  };
}

function timeToMinutes(hhmm: string): number {
  const { hours, minutes } = parseTime(hhmm);
  return hours * 60 + minutes;
}

export interface TimeGridProps {
  date: Date;
  onLessonPress?: (id: string) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

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

function colorForType(type?: string): string {
  switch (type) {
    case "Pauze":
      return "#3b82f6";
    case "Verlof":
      return "#ef4444";
    case "Product":
      return "#3b82f6";
    case "Theorieles":
      return "#8b5cf6";
    case "Praktijkexamen":
    case "Examen":
      return "#dc2626";
    case "Tussentijdse toets":
    case "Toets":
      return "#d97706";
    default:
      return "#a78bfa";
  }
}

type AnimatedLessonItemProps = {
  lesson: any;
  index: number;
  onPress: () => void;
  startHour: number;
  columnIndex: number;
  totalColumns: number;
};

function AnimatedLessonItem({ lesson, index, onPress, startHour, columnIndex, totalColumns }: AnimatedLessonItemProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      delay: index * 30,
      useNativeDriver: true,
    }).start();
  }, [animatedValue, index]);

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const opacity = animatedValue;

  const isCancelled = lesson.status === "Geannuleerd";

  const startMinutes = timeToMinutes(lesson.startTime);
  const endMinutes = timeToMinutes(lesson.endTime);
  const durationMinutes = endMinutes - startMinutes;

  const gridStartMinutes = startHour * 60;
  const topOffset = ((startMinutes - gridStartMinutes) / 60) * 80;
  const height = (durationMinutes / 60) * 80 - 4;

  const widthPercentage = totalColumns > 1 ? (100 / totalColumns) : 100;
  const leftPercentage = totalColumns > 1 ? (columnIndex * widthPercentage) : 0;

  return (
    <Animated.View 
      style={[
        styles.lessonCardPositioned,
        {
          top: topOffset,
          height: Math.max(height, 50),
          opacity,
          transform: [{ scale }],
          left: `${leftPercentage}%`,
          width: `${widthPercentage}%`,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.lessonCard,
          { backgroundColor: isCancelled ? "#f3f4f6" : colorForType(lesson.lessonType) },
          pressed && { opacity: 0.9 },
        ]}
        testID={`lesson-card-${lesson.id}`}
      >
        <View style={styles.lessonCardContent}>
          <View style={styles.lessonCardHeader}>
            <Text style={[styles.lessonCardStudentName, isCancelled && styles.cancelledText]} numberOfLines={1}>
              {lesson.studentName ?? "Onbekend"}
            </Text>
            {isCancelled && (
              <View style={styles.cancelledBadge}>
                <Text style={styles.cancelledBadgeText}>GEANNULEERD</Text>
              </View>
            )}
          </View>
          
          <View style={styles.lessonCardRow}>
            <Text style={[styles.lessonCardTime, isCancelled && styles.cancelledText]}>
              {`${lesson.startTime} - ${lesson.endTime}`}
            </Text>
            <Text style={[styles.lessonCardType, isCancelled && styles.cancelledText]} numberOfLines={1}>
              {lesson.lessonType ?? "Rijles"}
            </Text>
          </View>

          {!!lesson.location && (
            <View style={styles.lessonCardLocationRow}>
              <MapPin size={14} color={isCancelled ? "#9ca3af" : "#374151"} />
              <Text numberOfLines={1} style={[styles.lessonCardLocation, isCancelled && styles.cancelledText]}>
                {lesson.location}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function isDateInVacation(date: Date, vacationPeriods: VacationPeriod[]): boolean {
  const currentYear = date.getFullYear();
  
  return vacationPeriods.some((vacation) => {
    const startDate = new Date(vacation.startDate);
    const endDate = new Date(vacation.endDate);
    
    if (vacation.repeatAnnually) {
      const vacationStartInCurrentYear = new Date(currentYear, startDate.getMonth(), startDate.getDate());
      const vacationEndInCurrentYear = new Date(currentYear, endDate.getMonth(), endDate.getDate());
      
      return date >= vacationStartInCurrentYear && date <= vacationEndInCurrentYear;
    } else {
      return date >= startDate && date <= endDate;
    }
  });
}

type LessonWithLayout = {
  lesson: any;
  columnIndex: number;
  totalColumns: number;
};

function groupOverlappingLessons(lessons: any[]): LessonWithLayout[] {
  const result: LessonWithLayout[] = [];
  const timeSlots = new Map<string, any[]>();
  
  lessons.forEach(lesson => {
    const key = lesson.startTime;
    if (!timeSlots.has(key)) {
      timeSlots.set(key, []);
    }
    timeSlots.get(key)!.push(lesson);
  });
  
  lessons.forEach(lesson => {
    const overlappingLessons = timeSlots.get(lesson.startTime) || [];
    const totalColumns = overlappingLessons.length;
    const columnIndex = overlappingLessons.findIndex(l => l.id === lesson.id);
    
    result.push({
      lesson,
      columnIndex,
      totalColumns,
    });
  });
  
  return result;
}

function Inner({ date, onLessonPress, onSwipeLeft, onSwipeRight }: TimeGridProps) {
  const { getLessonsForDate } = useAgenda();
  const lessons = getLessonsForDate(date);
  const lessonsWithLayout = useMemo(() => groupOverlappingLessons(lessons), [lessons]);
  const { workingHours, vacationPeriods } = useWorkingHours();

  const dayKey = dutchDayName(date);
  const conf = workingHours?.[dayKey];
  const enabled = conf?.enabled ?? false;
  const isVacation = isDateInVacation(date, vacationPeriods);

  const startHour = 0;
  const endHour = 23;

  const scrollRef = useRef<ScrollView | null>(null);
  const panRef = useRef({
    startX: 0,
    startY: 0,
    isScrolling: false,
  });
  const swipeAnimValue = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        
        if (absX > 5 && absX > absY * 0.8) {
          return true;
        }
        return false;
      },
      onPanResponderGrant: (evt, gestureState) => {
        panRef.current.startX = gestureState.x0;
        panRef.current.startY = gestureState.y0;
        panRef.current.isScrolling = false;
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        
        if (absY > absX && !panRef.current.isScrolling) {
          panRef.current.isScrolling = true;
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX > 35 && absX > absY * 0.8 && !panRef.current.isScrolling) {
          if (dx > 0) {
            console.log("Swipe right - previous day");
            swipeAnimValue.setValue(0);
            Animated.sequence([
              Animated.timing(swipeAnimValue, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.timing(swipeAnimValue, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
            ]).start(() => {
              onSwipeRight?.();
            });
          } else {
            console.log("Swipe left - next day");
            swipeAnimValue.setValue(0);
            Animated.sequence([
              Animated.timing(swipeAnimValue, {
                toValue: -1,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.timing(swipeAnimValue, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
            ]).start(() => {
              onSwipeLeft?.();
            });
          }
        }
      },
      onPanResponderTerminate: () => {
        panRef.current.isScrolling = false;
      },
    })
  ).current;

  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h);
  }

  useFocusEffect(
    React.useCallback(() => {
      const id = setTimeout(() => {
        try {
          const targetHour = 12;
          const hourHeight = 80;
          const scrollY = (targetHour - startHour) * hourHeight;
          scrollRef.current?.scrollTo({ y: scrollY, animated: true });
        } catch (e) {
          console.log("TimeGrid scroll error", e);
        }
      }, 100);
      
      return () => clearTimeout(id);
    }, [])
  );

  const translateX = swipeAnimValue.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-300, 0, 300],
  });

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateX }] }]} testID="time-grid" {...panResponder.panHandlers}>
      <ScrollView 
        ref={scrollRef} 
        showsVerticalScrollIndicator
        contentContainerStyle={styles.listContent}
        scrollEnabled
      >
        {!enabled && (
          <View style={styles.nonWorkDayBanner}>
            <Text style={styles.nonWorkDayText}>Niet werkdag</Text>
          </View>
        )}
        
        {isVacation && (
          <View style={styles.vacationBanner}>
            <Text style={styles.vacationText}>🏖️ Vakantie</Text>
          </View>
        )}
        
        <View style={[styles.gridContainer, isVacation && styles.vacationBorder]}>
          <View style={styles.gridBackground}>
            {hours.map((h) => {
              const hStr = h.toString().padStart(2, "0");
              
              let isWorkingHour = false;
              if (enabled && conf?.ranges) {
                for (const range of conf.ranges) {
                  const startMin = timeToMinutes(range.start);
                  const endMin = timeToMinutes(range.end);
                  const hourMin = h * 60;
                  
                  if (hourMin >= startMin && hourMin < endMin) {
                    isWorkingHour = true;
                    break;
                  }
                }
              }
              
              return (
                <View key={hStr} style={styles.hourRow}>
                  <View style={styles.hourLabelContainer}>
                    <Text style={styles.hourLabel}>{hStr}:00</Text>
                  </View>
                  <View style={styles.hourLine} />
                  {isWorkingHour && <View style={styles.workingHourBg} />}
                </View>
              );
            })}
          </View>

          {lessons.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>Geen lessen gepland</Text>
            </View>
          )}

          {lessons.length > 0 && (
            <View style={styles.lessonsOverlay}>
              {lessonsWithLayout.map((item: LessonWithLayout, index: number) => (
                <AnimatedLessonItem
                  key={String(item.lesson.id)}
                  lesson={item.lesson}
                  index={index}
                  startHour={startHour}
                  columnIndex={item.columnIndex}
                  totalColumns={item.totalColumns}
                  onPress={() => onLessonPress?.(String(item.lesson.id))}
                />
              ))}
            </View>
          )}
          
          {isVacation && (
            <View style={styles.vacationOverlay}>
              <View style={[styles.lessonCardPositioned, { top: ((12 * 60 - startHour * 60) / 60) * 80, height: 60 }]}>
                <View style={[styles.vacationCard]}>
                  <Text style={styles.vacationCardText}>🏖️ Vakantie</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

export const TimeGrid = memo(Inner);

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  listContent: { 
    paddingVertical: 8,
    paddingBottom: 24,
  },
  gridContainer: {
    position: "relative",
    minHeight: 200,
  },
  gridBackground: {
    marginBottom: 16,
  },
  hourRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start",
    height: 80,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  workingHourBg: {
    position: "absolute",
    left: -60,
    right: -12,
    top: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    zIndex: -1,
  },
  hourLabelContainer: {
    width: 60,
    paddingRight: 12,
    paddingTop: 4,
    zIndex: 1,
  },
  hourLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "right",
  },
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  lessonsOverlay: {
    position: "absolute",
    top: 0,
    left: 60,
    right: 0,
    bottom: 16,
  },
  lessonCardPositioned: {
    position: "absolute",
    paddingHorizontal: 6,
  },
  lessonCard: {
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    flex: 1,
  },
  lessonCardContent: {
    gap: 6,
  },
  lessonCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  lessonCardStudentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  lessonCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  lessonCardTime: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  lessonCardType: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
    textAlign: "right",
  },
  lessonCardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lessonCardLocation: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  cancelledText: {
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  cancelledBadge: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cancelledBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6b7280",
  },
  nonWorkDayBanner: {
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  nonWorkDayText: {
    color: "#92400e",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    marginTop: 16,
  },
  emptyCardText: {
    color: "#9ca3af",
    fontSize: 16,
  },
  vacationBanner: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  vacationText: {
    color: "#991b1b",
    fontWeight: "700",
    fontSize: 14,
  },
  vacationBorder: {
    borderWidth: 2,
    borderColor: "#ef4444",
    borderRadius: 12,
    padding: 8,
  },
  vacationOverlay: {
    position: "absolute",
    top: 0,
    left: 60,
    right: 0,
    bottom: 16,
    pointerEvents: "none",
  },
  vacationCard: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fee2e2",
    borderWidth: 2,
    borderColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  vacationCardText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#991b1b",
  },
});
