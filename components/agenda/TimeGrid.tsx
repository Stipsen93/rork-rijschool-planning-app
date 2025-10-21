import React, { memo, useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAgenda } from "@/components/agenda/AgendaStore";
import { useWorkingHours, type DayKey, type DayConfig } from "@/components/settings/WorkingHoursStore";

export interface TimeGridProps {
  date: Date;
  onLessonPress?: (id: string) => void;
}


function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  const hh = Number.isFinite(h) ? h : 0;
  const mm = Number.isFinite(m) ? m : 0;
  return hh * 60 + mm;
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

function minutesBetween(start: string, end: string): number {
  const s = toMinutes(start);
  const e = toMinutes(end);
  let diff = e - s;
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function colorForType(type?: string): string {
  switch (type) {
    case "Theorieles":
      return "#8b5cf6";
    case "Praktijkexamen":
    case "Examen":
      return "#ef4444";
    case "Tussentijdse toets":
    case "Toets":
      return "#d97706";
    default:
      return "#a78bfa";
  }
}

function Inner({ date, onLessonPress }: TimeGridProps) {
  const { getLessonsForDate } = useAgenda();
  const lessons = getLessonsForDate(date);
  const { workingHours } = useWorkingHours();

  const dayKey = dutchDayName(date);
  const conf = workingHours[dayKey];
  const enabled = conf.enabled;
  const startMin = toMinutes(conf.startTime);
  const endMin = toMinutes(conf.endTime);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`), []);

  const PPM = 2.0 as const;
  const timelineHeight = 24 * 60 * PPM;

  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const y = Math.max(0, (enabled ? startMin : 8 * 60) * PPM - 180);
    const id = setTimeout(() => {
      try {
        scrollRef.current?.scrollTo({ y, animated: true });
      } catch (e) {
        console.log("TimeGrid initial scroll error", e);
      }
    }, 50);
    return () => clearTimeout(id);
  }, [dayKey, enabled, startMin]);

  return (
    <View style={styles.wrapper} testID="time-grid">
      <ScrollView ref={scrollRef} horizontal={false} showsVerticalScrollIndicator contentContainerStyle={[styles.scrollContent, { height: timelineHeight + 32 }]}>        
        <View style={styles.timelineCard}>
          {enabled && (
            <>
              {!conf.autoLunchBreak && (
                <View
                  testID="work-overlay"
                  style={[
                    styles.workOverlay,
                    { top: startMin * PPM, height: minutesBetween(conf.startTime, conf.endTime) * PPM },
                  ]}
                />
              )}
              {conf.autoLunchBreak && (
                <>
                  <View
                    testID="work-overlay-morning"
                    style={[
                      styles.workOverlay,
                      { top: startMin * PPM, height: minutesBetween(conf.startTime, conf.breakStartTime ?? conf.startTime) * PPM },
                    ]}
                  />
                  <View
                    testID="work-overlay-afternoon"
                    style={[
                      styles.workOverlay,
                      {
                        top: toMinutes(conf.breakEndTime ?? conf.endTime) * PPM,
                        height: Math.max(0, (toMinutes(conf.endTime) - toMinutes(conf.breakEndTime ?? conf.endTime)) * PPM),
                      },
                    ]}
                  />
                </>
              )}
            </>
          )}

          <View style={styles.gridArea}>
            {hours.map((h) => (
              <View key={h} style={styles.gridHourRow}>
                <View style={styles.hourLine} />
                <Text style={styles.hourLabel}>{h}</Text>
              </View>
            ))}

            {lessons.map((l) => {
              const top = toMinutes(l.startTime) * PPM;
              const height = minutesBetween(l.startTime, l.endTime) * PPM;
              const leftInset = 84;
              return (
                <Pressable
                  key={String(l.id)}
                  style={[
                    styles.lessonBlock,
                    { top, height, left: leftInset, right: 12, backgroundColor: colorForType(l.lessonType) },
                  ]}
                  onPress={() => onLessonPress?.(String(l.id))}
                  testID={`lesson-block-${l.id}`}
                >
                  <Text style={styles.lessonTitle}>{l.studentName ?? ""}</Text>
                  <Text style={styles.lessonMeta}>{`${l.startTime} - ${l.endTime}`}</Text>
                  {!!l.location && <Text numberOfLines={1} style={styles.lessonLocation}>{l.location}</Text>}
                </Pressable>
              );
            })}
          </View>

          {!enabled && <View style={styles.disabledBanner}><Text style={styles.disabledText}>Niet werkdag</Text></View>}
        </View>
      </ScrollView>
    </View>
  );
}

export const TimeGrid = memo(Inner);

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 0, marginHorizontal: -16 },
  scrollContent: { paddingBottom: 24 },
  timelineCard: {
    position: "relative",
    borderRadius: 16,
    backgroundColor: "#9ca3af",
    overflow: "hidden",
  },
  workOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    zIndex: 0,
  },
  timeLabels: { position: "absolute", top: 0, left: 0, right: 0 },
  labelRow: { height: 120, justifyContent: "center" },
  gridArea: { paddingLeft: 0, paddingRight: 0, zIndex: 1 },
  gridHourRow: { height: 120, alignItems: "flex-start", justifyContent: "flex-start", paddingHorizontal: 0 },
  hourLabel: { color: "#d1d5db", fontWeight: "700", marginTop: 4, paddingLeft: 12 },
  hourLine: { height: 1, backgroundColor: "#4b5563", opacity: 1, alignSelf: "stretch" },

  lessonBlock: {
    position: "absolute",
    left: 84,
    right: 16,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#a78bfa",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  lessonTitle: { color: "#111827", fontWeight: "700" },
  lessonMeta: { color: "#111827", opacity: 0.8, marginTop: 2, fontWeight: "600" },
  lessonLocation: { color: "#111827", opacity: 0.7, marginTop: 4 },

  disabledBanner: { position: "absolute", top: 12, left: 12, backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  disabledText: { color: "#6b7280", fontWeight: "600" },
});
