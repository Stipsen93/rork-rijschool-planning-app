import React, { memo, useCallback, useState, useMemo } from "react";
import { Platform, StyleSheet, Text, View, Image, Pressable } from "react-native";
import { Users, TrendingUp, TriangleAlert, MessageSquare, NotebookPen } from "lucide-react-native";
import { useWorkingHours } from "../settings/WorkingHoursStore";
import { useSettings } from "../settings/SettingsStore";

interface StudentItem {
  name: string;
  pastLessons: number;
  futureLessons: number;
  daysSinceLastLesson: number;
  profileImage: string;
}

interface StudentActivityData {
  activeStudents: StudentItem[];
  irregularStudents: StudentItem[];
  nonActiveStudents: StudentItem[];
}

interface Props {
  studentActivity: StudentActivityData;
}

function StudentActivityDashboardComponent({ studentActivity }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { workingHours, loading: whLoading } = useWorkingHours();
  const { lessonConfig, loading: lcLoading } = useSettings();

  const { weeklyHours, weeklyMinutes, lessonDurationMinutes, maxLessons, maxActive, capacityDiff } = useMemo(() => {
    const toMinutes = (time: string): number => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    let totalMinutes = 0;
    Object.values(workingHours).forEach((day) => {
      if (!day.enabled) return;
      day.ranges.forEach((range) => {
        totalMinutes += toMinutes(range.end) - toMinutes(range.start);
      });
      day.pauses.forEach((pause) => {
        totalMinutes -= toMinutes(pause.end) - toMinutes(pause.start);
      });
    });

    const hours = totalMinutes / 60;
    const lessonDur = lessonConfig.baseLessonDuration || 60;
    const maxLessonsPerWeek = Math.floor(totalMinutes / lessonDur);
    const maxActiveStudents = Math.floor(maxLessonsPerWeek / 1.5);
    const diff = maxActiveStudents - studentActivity.activeStudents.length;

    return {
      weeklyHours: hours,
      weeklyMinutes: totalMinutes,
      lessonDurationMinutes: lessonDur,
      maxLessons: maxLessonsPerWeek,
      maxActive: maxActiveStudents,
      capacityDiff: diff,
    };
  }, [workingHours, lessonConfig.baseLessonDuration, studentActivity.activeStudents.length]);

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => (prev === key ? null : key));
  }, []);

  return (
    <View style={styles.card} testID="student-activity-dashboard">
      <View style={styles.headerRow}>
        <Users size={18} color="#2f95dc" />
        <Text style={styles.headerText}>Leerling Activiteit Dashboard</Text>
      </View>

      <View
        style={[
          styles.capacity,
          { backgroundColor: capacityDiff >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", borderColor: capacityDiff >= 0 ? "#22c55e55" : "#ef444455" },
        ]}
      >
        <View style={styles.rowAlign}>
          {capacityDiff >= 0 ? (
            <TrendingUp size={18} color="#22c55e" />
          ) : (
            <TriangleAlert size={18} color="#ef4444" />
          )}
          <Text style={styles.capacityTitle}>Leerling Capaciteit</Text>
        </View>
        <Text style={styles.capacitySub}>{`Gebaseerd op ${weeklyHours.toFixed(1)} uur/week en ${lessonDurationMinutes}min lessen`}</Text>
        <View
          style={[styles.capacityBadge, { backgroundColor: capacityDiff >= 0 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", borderColor: capacityDiff >= 0 ? "#22c55e66" : "#ef444466" }]}
        >
          <Text style={{ color: capacityDiff >= 0 ? "#22c55e" : "#ef4444", fontWeight: "800" }}>
            {`Aantal leerlingen erbij ${Math.abs(capacityDiff)}`}
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 3 }]}>Categorie</Text>
          <Text style={[styles.th, { flex: 2, textAlign: "center" }]}>Aantal</Text>
          <View style={{ width: 24 }} />
        </View>

        {renderCategory({
          key: "active",
          title: "Actieve Leerlingen",
          description: "Afgelopen maand ≥3 lessen & komende 3 weken ≥2 lessen",
          count: studentActivity.activeStudents.length,
          color: "#22c55e",
          expanded: expanded === "active",
          onPress: () => toggle("active"),
          students: studentActivity.activeStudents,
        })}
        <View style={styles.divider} />
        {renderCategory({
          key: "irregular",
          title: "Onregelmatige Leerlingen",
          description: "Afgelopen maand ≤2 lessen & komende 3 weken 1 les",
          count: studentActivity.irregularStudents.length,
          color: "#f59e0b",
          expanded: expanded === "irregular",
          onPress: () => toggle("irregular"),
          students: studentActivity.irregularStudents,
        })}
        <View style={styles.divider} />
        {renderCategory({
          key: "non_active",
          title: "Non-actieve Leerlingen",
          description: "Geen lessen ≥1 maand & komende 4 weken geen lessen",
          count: studentActivity.nonActiveStudents.length,
          color: "#ef4444",
          expanded: expanded === "non_active",
          onPress: () => toggle("non_active"),
          students: studentActivity.nonActiveStudents,
        })}
      </View>
    </View>
  );
}

function renderCategory({
  key,
  title,
  description,
  count,
  color,
  expanded,
  onPress,
  students,
}: {
  key: string;
  title: string;
  description: string;
  count: number;
  color: string;
  expanded: boolean;
  onPress: () => void;
  students: StudentItem[];
}) {
  return (
    <View key={key}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.categoryRow, pressed && { opacity: 0.9 }]}>
        <Text style={styles.categoryTitle}>{title}</Text>
        <View style={[styles.countBadge, { borderColor: `${color}55`, backgroundColor: `${color}14` }]}>
          <Text style={{ color, fontWeight: "800" }}>{count}</Text>
        </View>
      </Pressable>
      <Text style={styles.categoryDesc}>{description}</Text>

      {expanded && (
        <View>
          <View style={styles.divider} />
          {students.length === 0 ? (
            <View style={{ padding: 16 }}>
              <Text style={styles.emptyState}>Geen leerlingen in deze categorie</Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
              {students.map((s) => (
                <View key={`${key}-${s.name}`} style={[styles.studentRow, { borderColor: `${color}33`, backgroundColor: `${color}0D` }]}> 
                  <View style={[styles.studentAvatarBorder, { borderColor: `${color}55` }]}> 
                    <Image source={{ uri: s.profileImage }} style={styles.studentAvatar} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{s.name}</Text>
                    <Text style={styles.studentMeta}>{`Afgelopen: ${s.pastLessons} lessen • Gepland: ${s.futureLessons} lessen`}</Text>
                  </View>
                  <View style={styles.actionsRow}>
                    <Pressable accessibilityRole="button" style={[styles.actionBtn, { backgroundColor: `${color}1A` }]}> 
                      <NotebookPen size={16} color={color} />
                    </Pressable>
                    <Pressable accessibilityRole="button" style={[styles.actionBtn, { backgroundColor: `${color}1A` }]}> 
                      <MessageSquare size={16} color={color} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export const StudentActivityDashboard = memo(StudentActivityDashboardComponent);

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "web" ? 0 : 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  headerText: { fontSize: 16, fontWeight: "600" },
  capacity: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  rowAlign: { flexDirection: "row", alignItems: "center", gap: 8 },
  capacityTitle: { fontWeight: "700" },
  capacitySub: { color: "#6b7280", marginTop: 6 },
  capacityBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignSelf: "flex-start" },
  table: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, overflow: "hidden" },
  tableHeader: { padding: 16, backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "center" },
  th: { fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#e5e7eb" },
  categoryRow: { padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  categoryTitle: { fontWeight: "600" },
  countBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  categoryDesc: { color: "#6b7280", paddingHorizontal: 16, marginBottom: 8 },
  studentRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  studentAvatarBorder: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", borderWidth: 1, marginRight: 10 },
  studentAvatar: { width: "100%", height: "100%" },
  studentName: { fontWeight: "600" },
  studentMeta: { color: "#6b7280", marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  emptyState: { color: "#6b7280", fontStyle: "italic" },
});
