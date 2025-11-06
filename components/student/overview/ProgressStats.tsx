import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BookOpen, Clock } from "lucide-react-native";
import type { ProgressData } from "../StudentStore";

interface ProgressStatsProps {
  progressData: ProgressData;
}

export default function ProgressStats({ progressData }: ProgressStatsProps) {
  const skills = [
    { key: "parking", label: "Parkeren", value: progressData.skillsProgress.parking },
    { key: "highway", label: "Snelweg", value: progressData.skillsProgress.highway },
    { key: "cityDriving", label: "Stadsrijden", value: progressData.skillsProgress.cityDriving },
    { key: "nightDriving", label: "Nachtrijden", value: progressData.skillsProgress.nightDriving },
    {
      key: "weatherConditions",
      label: "Weersomstandigheden",
      value: progressData.skillsProgress.weatherConditions,
    },
  ];

  const getProgressColor = (value: number): string => {
    if (value >= 0.8) return "#4CAF50";
    if (value >= 0.6) return "#FFA500";
    return "#EF4444";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jouw Voortgang</Text>

      <View style={styles.overallSection}>
        <View style={styles.overallCircle}>
          <Text style={styles.overallPercentage}>
            {Math.round(progressData.overallProgress * 100)}%
          </Text>
          <Text style={styles.overallLabel}>Totaal</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <BookOpen color="#2563EB" size={20} />
            <Text style={styles.statValue}>{progressData.totalLessons}</Text>
            <Text style={styles.statLabel}>Lessen</Text>
          </View>
          <View style={styles.statBox}>
            <Clock color="#2563EB" size={20} />
            <Text style={styles.statValue}>{progressData.hoursDriven}u</Text>
            <Text style={styles.statLabel}>Gereden</Text>
          </View>
        </View>
      </View>

      <View style={styles.skillsSection}>
        <Text style={styles.skillsTitle}>Vaardigheidsoverzicht</Text>
        {skills.map((skill) => (
          <View key={skill.key} style={styles.skillItem}>
            <Text style={styles.skillLabel}>{skill.label}</Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${skill.value * 100}%`,
                    backgroundColor: getProgressColor(skill.value),
                  },
                ]}
              />
            </View>
            <Text style={styles.skillPercentage}>
              {Math.round(skill.value * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 16,
  },
  overallSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  overallCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  overallPercentage: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#2563EB",
  },
  overallLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  statsGrid: {
    flex: 1,
    gap: 12,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  statLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  skillsSection: {
    gap: 12,
  },
  skillsTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1f2937",
    marginBottom: 8,
  },
  skillItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skillLabel: {
    fontSize: 13,
    color: "#1f2937",
    width: 140,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  skillPercentage: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#6b7280",
    width: 40,
    textAlign: "right",
  },
});
