import React, { memo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, Star, Clock } from "lucide-react-native";

export interface PerformanceMetrics {
  completionRate: number; // 96.5
  studentSatisfaction: number; // 4.8
  averageLessonDuration: number; // minutes
}

interface Props {
  metrics: PerformanceMetrics;
}

function PerformanceMetricsComponent({ metrics }: Props) {
  return (
    <View style={styles.card} testID="performance-metrics">
      <View style={styles.headerRow}>
        <Clock size={18} color="#2f95dc" />
        <Text style={styles.headerText}>Week Prestaties</Text>
      </View>
      <View style={styles.metricsRow}>
        <View style={[styles.metricItem, { borderColor: `#22c55e33`, backgroundColor: `#22c55e14` }]}> 
          <View style={[styles.metricIconWrap, { backgroundColor: `#22c55e26` }]}> 
            <CheckCircle2 size={20} color="#22c55e" />
          </View>
          <Text style={[styles.metricValue, { color: "#22c55e" }]}>{`${metrics.completionRate}%`}</Text>
          <Text style={styles.metricLabel}>Les Voltooiing</Text>
        </View>
        <View style={[styles.metricItem, { borderColor: `#f59e0b33`, backgroundColor: `#f59e0b14` }]}> 
          <View style={[styles.metricIconWrap, { backgroundColor: `#f59e0b26` }]}> 
            <Star size={20} color="#f59e0b" />
          </View>
          <Text style={[styles.metricValue, { color: "#f59e0b" }]}>{`${metrics.studentSatisfaction}/5.0`}</Text>
          <Text style={styles.metricLabel}>Tevredenheid</Text>
        </View>
        <View style={[styles.metricItem, { borderColor: `#2f95dc33`, backgroundColor: `#2f95dc14` }]}> 
          <View style={[styles.metricIconWrap, { backgroundColor: `#2f95dc26` }]}> 
            <Clock size={20} color="#2f95dc" />
          </View>
          <Text style={[styles.metricValue, { color: "#2f95dc" }]}>{`${Math.round(metrics.averageLessonDuration)} min`}</Text>
          <Text style={styles.metricLabel}>Gem. Duur</Text>
        </View>
      </View>
    </View>
  );
}

export const PerformanceMetricsCard = memo(PerformanceMetricsComponent);

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
  metricsRow: { flexDirection: "row", gap: 12 },
  metricItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  metricValue: { fontSize: 18, fontWeight: "800" },
  metricLabel: { color: "#6b7280", textAlign: "center", marginTop: 4 },
});
