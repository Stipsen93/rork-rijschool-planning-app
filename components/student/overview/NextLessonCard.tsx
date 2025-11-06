import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  XCircle,
  RefreshCcw,
} from "lucide-react-native";
import type { NextLesson } from "../StudentStore";

interface NextLessonCardProps {
  nextLesson: NextLesson;
  onCancel: () => void;
  onReschedule: () => void;
}

export default function NextLessonCard({
  nextLesson,
  onCancel,
  onReschedule,
}: NextLessonCardProps) {
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    };
    return date.toLocaleDateString("nl-NL", options);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Volgende Les</Text>
        <View style={styles.countdownBadge}>
          <Text style={styles.countdownText}>
            over {nextLesson.countdown.days}d {nextLesson.countdown.hours}u
          </Text>
        </View>
      </View>

      <View style={styles.instructorSection}>
        <Image
          source={{ uri: nextLesson.instructor.photo }}
          style={styles.instructorPhoto}
        />
        <View style={styles.instructorInfo}>
          <Text style={styles.instructorName}>
            {nextLesson.instructor.name}
          </Text>
          <View style={styles.ratingRow}>
            <Star color="#FFA500" size={16} fill="#FFA500" />
            <Text style={styles.rating}>{nextLesson.instructor.rating}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Calendar color="#6b7280" size={18} />
          <Text style={styles.detailText}>{formatDate(nextLesson.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock color="#6b7280" size={18} />
          <Text style={styles.detailText}>{nextLesson.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin color="#6b7280" size={18} />
          <Text style={styles.detailText}>{nextLesson.location}</Text>
        </View>
      </View>

      <View style={styles.typeBadge}>
        <Text style={styles.typeText}>{nextLesson.type}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButtonSecondary}
          onPress={onReschedule}
        >
          <RefreshCcw color="#2563EB" size={18} />
          <Text style={styles.actionTextSecondary}>Verplaatsen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonDanger} onPress={onCancel}>
          <XCircle color="#EF4444" size={18} />
          <Text style={styles.actionTextDanger}>Annuleren</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  countdownBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#d97706",
  },
  instructorSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  instructorPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1f2937",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
  detailsSection: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: "#1f2937",
  },
  typeBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  typeText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#2563EB",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563EB",
    backgroundColor: "#fff",
  },
  actionTextSecondary: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2563EB",
  },
  actionButtonDanger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
    backgroundColor: "#fff",
  },
  actionTextDanger: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
});
