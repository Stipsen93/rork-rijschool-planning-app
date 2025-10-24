import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Pencil } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAgenda } from "@/components/agenda/AgendaStore";

type Task = {
  id: string;
  label: string;
  completed: boolean;
};

type TasksWidgetProps = {
  studentId: string;
  studentName: string;
};

export default function TasksWidget({ studentId, studentName }: TasksWidgetProps) {
  const { lessonsByDate } = useAgenda();
  const [isEditMode, setIsEditMode] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "theory", label: "Theorie", completed: false },
    { id: "health", label: "Gezondheidsverklaring", completed: false },
    { id: "authorization", label: "Machtiging", completed: false },
  ]);

  useEffect(() => {
    AsyncStorage.getItem(`student_tasks_${studentId}`)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored) as Task[];
          setTasks(parsed);
        }
      })
      .catch((e) => console.log("[TasksWidget] Failed to load tasks", e));
  }, [studentId]);

  const saveDebounceTRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveDebounceTRef.current) clearTimeout(saveDebounceTRef.current);
    saveDebounceTRef.current = setTimeout(() => {
      AsyncStorage.setItem(`student_tasks_${studentId}`, JSON.stringify(tasks))
        .then(() => console.log("[TasksWidget] Saved tasks"))
        .catch((e) => console.log("[TasksWidget] Failed to save tasks", e));
    }, 400);
    return () => { if (saveDebounceTRef.current) clearTimeout(saveDebounceTRef.current); };
  }, [tasks, studentId]);

  const totalHoursForStudent = useMemo(() => {
    const now = new Date();
    const allLessons = Object.values(lessonsByDate).flat();
    const studentLessons = allLessons.filter(
      (lesson) =>
        lesson.studentName?.toLowerCase() === studentName.toLowerCase() &&
        lesson.date <= now
    );

    let totalMinutes = 0;
    studentLessons.forEach((lesson) => {
      const [sh, sm] = lesson.startTime.split(":").map((v) => parseInt(v, 10));
      const [eh, em] = lesson.endTime.split(":").map((v) => parseInt(v, 10));
      const start = (Number.isFinite(sh) ? sh : 0) * 60 + (Number.isFinite(sm) ? sm : 0);
      const end = (Number.isFinite(eh) ? eh : 0) * 60 + (Number.isFinite(em) ? em : 0);
      totalMinutes += Math.max(0, end - start);
    });

    return totalMinutes / 60;
  }, [lessonsByDate, studentName]);

  const packageHoursForStudent = useMemo(async () => {
    try {
      const stored = await AsyncStorage.getItem(`student_packages_${studentId}`);
      if (!stored) return 0;

      const packages = JSON.parse(stored) as any[];
      let total = 0;
      for (const pkg of packages) {
        const base = pkg.customHours ?? pkg.hours ?? 0;
        total += base;
      }
      return total;
    } catch (e) {
      console.log("[TasksWidget] Failed to load packages", e);
      return 0;
    }
  }, [studentId]);

  const [packageHours, setPackageHours] = useState<number>(0);

  useEffect(() => {
    packageHoursForStudent.then(setPackageHours);
  }, [packageHoursForStudent]);

  const shouldShowWarning = useMemo(() => {
    const twothirds = packageHours * (2 / 3);
    return totalHoursForStudent >= twothirds || totalHoursForStudent >= 20;
  }, [totalHoursForStudent, packageHours]);

  const toggleTask = useCallback((taskId: string) => {
    if (!isEditMode) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    );
  }, [isEditMode]);

  const getTaskColor = useCallback(
    (task: Task) => {
      if (task.completed) return "#22c55e";
      if (shouldShowWarning) return "#ef4444";
      return "#111827";
    },
    [shouldShowWarning]
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Taken</Text>
        <TouchableOpacity
          onPress={() => setIsEditMode(!isEditMode)}
          style={styles.editButton}
        >
          <Pencil size={18} color={isEditMode ? "#3b82f6" : "#6b7280"} />
        </TouchableOpacity>
      </View>
      <View style={{ gap: 12 }}>
        {tasks.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <TouchableOpacity
              onPress={() => toggleTask(task.id)}
              style={[styles.checkbox, task.completed && styles.checkboxChecked]}
              disabled={!isEditMode}
            >
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={[styles.taskLabel, { color: getTaskColor(task) }]}>
              {task.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  editButton: {
    padding: 4,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  taskLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
});
