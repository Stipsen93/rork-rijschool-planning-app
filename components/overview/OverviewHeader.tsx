import React, { memo } from "react";
import { Platform, StyleSheet, Text, View, Image } from "react-native";
import { Bell, User } from "lucide-react-native";
import { useProfile } from "@/components/settings/ProfileStore";

interface WeeklyEarnings {
  currentWeek: number;
  trend: number;
}

interface Props {
  weeklyEarnings: WeeklyEarnings;
}

function OverviewHeaderComponent({ weeklyEarnings }: Props) {
  const { profile, fullName } = useProfile();
  const isPositive = weeklyEarnings.trend > 0;
  return (
    <View style={styles.card} testID="overview-header">
      <View style={styles.row}>
        <View style={styles.avatarBorder}>
          {profile.profileImageUrl ? (
            <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <User color="#2f95dc" size={28} />
            </View>
          )}
        </View>
        <View style={styles.flex1}>
          <Text style={styles.hello}>Welkom terug,</Text>
          <Text style={styles.name}>{fullName}</Text>
        </View>
        <View style={styles.iconBadge}>
          <Bell size={18} color="#2f95dc" />
        </View>
      </View>

      <View style={styles.earnings}>
        <View style={styles.flex1}>
          <Text style={styles.earningsLabel}>Deze week verdiend</Text>
          <Text style={styles.earningsValue}>
            €{weeklyEarnings.currentWeek.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.trendBadge, { backgroundColor: isPositive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)" }]}> 
          <Text style={[styles.trendText, { color: isPositive ? "#22c55e" : "#ef4444" }]}>
            {isPositive ? "▲" : "▼"} {Math.abs(weeklyEarnings.trend).toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

export const OverviewHeader = memo(OverviewHeaderComponent);

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "web" ? 0 : 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(47,149,220,0.2)",
  },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: { backgroundColor: "#e5f3ff", alignItems: "center", justifyContent: "center" },
  flex1: { flex: 1 },
  hello: { color: "#6b7280" },
  name: { fontSize: 20, fontWeight: "800" },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(47,149,220,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  earnings: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(47,149,220,0.12)",
    backgroundColor: "rgba(47,149,220,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  earningsLabel: { color: "#6b7280", fontSize: 12 },
  earningsValue: { color: "#2f95dc", fontSize: 24, fontWeight: "800" },
  trendBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  trendText: { fontWeight: "700" },
});
