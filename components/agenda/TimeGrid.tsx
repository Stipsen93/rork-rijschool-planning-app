import React, { memo, useRef, useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Animated } from "react-native";
import { useAgenda } from "@/components/agenda/AgendaStore";
import { useWorkingHours, type DayKey } from "@/components/settings/WorkingHoursStore";
import { useFocusEffect } from "expo-router";
import { MapPin } from "lucide-react-native";

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
};

function AnimatedLessonItem({ lesson, index, onPress }: AnimatedLessonItemProps) {
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

  return (
    <Animated.View style={{ opacity, transform: [{ scale }], marginBottom: 12 }}>
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
            <Text style={[styles.lessonCardStudentName, isCancelled && styles.cancelledText]}>
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
            <Text style={[styles.lessonCardType, isCancelled && styles.cancelledText]}>
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

  const scrollRef = useRef<ScrollView | null>(null);

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
        
        {enabled && lessons.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>Geen lessen gepland</Text>
          </View>
        )}

        {enabled && lessons.map((lesson, index) => (
          <AnimatedLessonItem
            key={String(lesson.id)}
            lesson={lesson}
            index={index}
            onPress={() => onLessonPress?.(String(lesson.id))}
          />
        ))}
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
  lessonCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lessonCardContent: {
    gap: 8,
  },
  lessonCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lessonCardStudentName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  lessonCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lessonCardTime: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  lessonCardType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  lessonCardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lessonCardLocation: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  cancelledText: {
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  cancelledBadge: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cancelledBadgeText: {
    fontSize: 10,
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
  },
  emptyCardText: {
    color: "#9ca3af",
    fontSize: 16,
  },
});
