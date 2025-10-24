import React, { memo, useRef, useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Animated } from "react-native";
import { useAgenda } from "@/components/agenda/AgendaStore";
import { useWorkingHours, type DayKey } from "@/components/settings/WorkingHoursStore";
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
};

function AnimatedLessonItem({ lesson, index, onPress, startHour }: AnimatedLessonItemProps) {
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

  return (
    <Animated.View 
      style={[
        styles.lessonCardPositioned,
        {
          top: topOffset,
          height: Math.max(height, 50),
          opacity,
          transform: [{ scale }],
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

function Inner({ date, onLessonPress }: TimeGridProps) {
  const { getLessonsForDate } = useAgenda();
  const lessons = getLessonsForDate(date);
  const { workingHours } = useWorkingHours();

  const dayKey = dutchDayName(date);
  const conf = workingHours?.[dayKey];
  const enabled = conf?.enabled ?? false;

  const startHour = 0;
  const endHour = 23;

  const scrollRef = useRef<ScrollView | null>(null);

  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h);
  }

  useFocusEffect(
    React.useCallback(() => {
      const id = setTimeout(() => {
        try {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        } catch (e) {
          console.log("TimeGrid scroll error", e);
        }
      }, 100);
      
      return () => clearTimeout(id);
    }, [])
  );

  return (
    <View style={styles.wrapper} testID="time-grid">
      <ScrollView 
        ref={scrollRef} 
        showsVerticalScrollIndicator
        contentContainerStyle={styles.listContent}
      >
        {!enabled && (
          <View style={styles.disabledCard}>
            <Text style={styles.disabledCardText}>Niet werkdag</Text>
          </View>
        )}
        
        {enabled && (
          <View style={styles.gridContainer}>
            <View style={styles.gridBackground}>
              {hours.map((h) => {
                const hStr = h.toString().padStart(2, "0");
                
                let isWorkingHour = false;
                if (conf?.ranges) {
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
                {lessons.map((lesson, index) => (
                  <AnimatedLessonItem
                    key={String(lesson.id)}
                    lesson={lesson}
                    index={index}
                    startHour={startHour}
                    onPress={() => onLessonPress?.(String(lesson.id))}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
    left: 0,
    right: 0,
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
    left: 12,
    right: 12,
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
  disabledCard: {
    backgroundColor: "#f3f4f6",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledCardText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 16,
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
});
