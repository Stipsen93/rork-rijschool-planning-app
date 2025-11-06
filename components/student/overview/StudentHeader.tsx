import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Flame, TrendingUp } from "lucide-react-native";
import type { StudentData } from "../StudentStore";

interface StudentHeaderProps {
  studentData: StudentData;
}

export default function StudentHeader({ studentData }: StudentHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Image
          source={{ uri: studentData.profileImage }}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.greeting}>Hallo,</Text>
          <Text style={styles.name}>{studentData.name}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{studentData.level}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Flame color="#FF6B35" size={20} />
          </View>
          <Text style={styles.statValue}>{studentData.lessonStreak}</Text>
          <Text style={styles.statLabel}>Dagen streak</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <TrendingUp color="#4CAF50" size={20} />
          </View>
          <Text style={styles.statValue}>72%</Text>
          <Text style={styles.statLabel}>Vooruitgang</Text>
        </View>
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
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 6,
  },
  levelBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  levelText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#2563EB",
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  divider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
  },
});
