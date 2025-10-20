import React, { memo, useMemo } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { Clock, CalendarDays } from "lucide-react-native";

export interface Appointment {
  studentName: string;
  lessonType: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  date: Date;
  profileImage?: string;
}

interface Props {
  appointment?: Appointment | null;
}

function formatDate(date: Date): string {
  const weekdays = [
    "maandag",
    "dinsdag",
    "woensdag",
    "donderdag",
    "vrijdag",
    "zaterdag",
    "zondag",
  ] as const;
  const months = [
    "jan",
    "feb",
    "mrt",
    "apr",
    "mei",
    "jun",
    "jul",
    "aug",
    "sep",
    "okt",
    "nov",
    "dec",
  ] as const;
  const weekday = weekdays[Math.max(0, date.getDay() - 1)] ?? "";
  const day = date.getDate();
  const month = months[Math.max(0, date.getMonth())] ?? "";
  return `${weekday} ${day} ${month}`;
}

function getTimeUntil(appointmentDate: Date, startTime: string): string {
  const now = new Date();
  const [hh, mm] = startTime.split(":");
  const d = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate(),
    Number(hh ?? 0),
    Number(mm ?? 0),
    0,
    0,
  );
  const diffMs = d.getTime() - now.getTime();
  const min = Math.floor(diffMs / 60000);
  const hours = Math.floor(min / 60);
  const days = Math.floor(hours / 24);
  if (days > 1) return `${days} dagen`;
  if (days === 1) return "morgen";
  if (hours > 1) return `${hours} uur`;
  if (min > 0) return `${min} min`;
  return "nu";
}

function NextAppointmentComponent({ appointment }: Props) {
  console.log("NextAppointment render", { hasAppointment: !!appointment });
  const timeUntil = useMemo(() => {
    if (!appointment) return "";
    return getTimeUntil(appointment.date, appointment.startTime);
  }, [appointment?.date?.getTime?.(), appointment?.startTime]);

  return (
    <View style={styles.card} testID="next-appointment-card">
      <View style={styles.headerRow}>
        <Clock size={18} color="#2f95dc" />
        <Text style={styles.headerText}>Volgende Afspraak</Text>
      </View>

      {appointment ? (
        <View style={styles.row}>
          <View style={styles.avatarWrapper}>
            <Image
              testID="student-avatar"
              source={{
                uri:
                  appointment.profileImage ??
                  "https://images.unsplash.com/photo-1494790108755-2616b2e8c7c3?w=100&h=100&fit=crop&crop=face",
              }}
              resizeMode="cover"
              style={styles.avatar}
              accessible
              accessibilityLabel={`Profielfoto van ${appointment.studentName}`}
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.name}>{appointment.studentName}</Text>
            <Text style={styles.secondary}>{appointment.lessonType}</Text>
            <View style={styles.timeRow}>
              <CalendarDays size={14} color="#6b7280" />
              <Text style={styles.timeText}>
                {formatDate(appointment.date)} • {appointment.startTime} - {appointment.endTime}
              </Text>
            </View>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{timeUntil}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <CalendarDays size={22} color="#6b7280" />
          </View>
          <Text style={styles.emptyText}>Geen afspraken gepland</Text>
        </View>
      )}
    </View>
  );
}

export const NextAppointment = memo(NextAppointmentComponent);

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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  flex1: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700" },
  secondary: { color: "#6b7280", marginTop: 2 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  timeText: { color: "#6b7280", fontSize: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(47,149,220,0.12)",
    alignSelf: "flex-start",
  },
  badgeText: { color: "#2f95dc", fontWeight: "700", fontSize: 12 },
  emptyWrap: { alignItems: "center", gap: 8 },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(107,114,128,0.1)",
  },
  emptyText: { color: "#6b7280" },
});
