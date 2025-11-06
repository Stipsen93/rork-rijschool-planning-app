import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Calendar,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import type { Activity } from "../StudentStore";

interface RecentActivityProps {
  activities: Activity[];
  onToggleExpansion: (activityId: number) => void;
}

export default function RecentActivity({
  activities,
  onToggleExpansion,
}: RecentActivityProps) {
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
    };
    return date.toLocaleDateString("nl-NL", options);
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            color="#FFA500"
            size={14}
            fill={star <= rating ? "#FFA500" : "transparent"}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recente Lessen</Text>

      <ScrollView style={styles.activitiesList} showsVerticalScrollIndicator={false}>
        {activities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={styles.activityCard}
            onPress={() => onToggleExpansion(activity.id)}
            activeOpacity={0.7}
          >
            <View style={styles.activityHeader}>
              <Image
                source={{ uri: activity.instructorPhoto }}
                style={styles.instructorPhoto}
              />
              <View style={styles.activityHeaderInfo}>
                <Text style={styles.instructor}>{activity.instructor}</Text>
                <View style={styles.activityMeta}>
                  <Calendar color="#6b7280" size={14} />
                  <Text style={styles.metaText}>{formatDate(activity.date)}</Text>
                  <Clock color="#6b7280" size={14} style={{ marginLeft: 8 }} />
                  <Text style={styles.metaText}>{activity.duration} min</Text>
                </View>
              </View>
              <View style={styles.expandIcon}>
                {activity.isExpanded ? (
                  <ChevronUp color="#6b7280" size={20} />
                ) : (
                  <ChevronDown color="#6b7280" size={20} />
                )}
              </View>
            </View>

            <View style={styles.lessonTypeRow}>
              <View style={styles.lessonTypeBadge}>
                <Text style={styles.lessonTypeText}>{activity.lessonType}</Text>
              </View>
              {renderStars(activity.rating)}
            </View>

            {activity.isExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.skillsSection}>
                  <Text style={styles.sectionLabel}>Vaardigheden verbeterd</Text>
                  <View style={styles.skillsChips}>
                    {activity.skillsImproved.map((skill, index) => (
                      <View key={index} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.notesSection}>
                  <Text style={styles.sectionLabel}>Notities instructeur</Text>
                  <Text style={styles.noteText}>{activity.instructorNotes}</Text>
                </View>

                {activity.studentNotes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.sectionLabel}>Mijn notities</Text>
                    <Text style={styles.noteText}>{activity.studentNotes}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 100,
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
  activitiesList: {
    maxHeight: 600,
  },
  activityCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  instructorPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  activityHeaderInfo: {
    flex: 1,
  },
  instructor: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#1f2937",
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#6b7280",
  },
  expandIcon: {
    padding: 4,
  },
  lessonTypeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  lessonTypeBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lessonTypeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#2563EB",
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    gap: 12,
  },
  skillsSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  skillsChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillChipText: {
    fontSize: 12,
    color: "#0369a1",
  },
  notesSection: {
    gap: 6,
  },
  noteText: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
  },
});
