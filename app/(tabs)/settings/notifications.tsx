import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Bell, Check } from "lucide-react-native";
import { useNotifications } from "@/components/settings/NotificationsStore";

type ReminderOption = 15 | 30 | 45 | 60;

export default function NotificationsScreen() {
  const { notificationSettings, updateNotificationSettings } = useNotifications();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [localSettings, setLocalSettings] = useState(notificationSettings);

  const reminderOptions: ReminderOption[] = [15, 30, 45, 60];

  const handleSave = async () => {
    console.log("Saving notification settings...", localSettings);
    try {
      await updateNotificationSettings(localSettings);
      console.log("Notification settings saved successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save notification settings", error);
      Alert.alert("Fout", "Kon notificatie instellingen niet opslaan");
    }
  };

  const toggleInstructorReminder = (enabled: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      instructor: {
        ...prev.instructor,
        lessonReminder: {
          ...prev.instructor.lessonReminder,
          enabled,
        },
      },
    }));
  };

  const setInstructorReminderTime = (minutes: ReminderOption) => {
    setLocalSettings((prev) => ({
      ...prev,
      instructor: {
        ...prev.instructor,
        lessonReminder: {
          ...prev.instructor.lessonReminder,
          minutesBefore: minutes,
        },
      },
    }));
  };

  const toggleStudentReminder = (enabled: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      students: {
        ...prev.students,
        lessonReminder: {
          ...prev.students.lessonReminder,
          enabled,
        },
      },
    }));
  };

  const setStudentReminderTime = (minutes: ReminderOption) => {
    setLocalSettings((prev) => ({
      ...prev,
      students: {
        ...prev.students,
        lessonReminder: {
          ...prev.students.lessonReminder,
          minutesBefore: minutes,
        },
      },
    }));
  };

  const toggleStudentCancellation = (enabled: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      students: {
        ...prev.students,
        lessonCancellation: enabled,
      },
    }));
  };

  const toggleStudentRescheduled = (enabled: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      students: {
        ...prev.students,
        lessonRescheduled: enabled,
      },
    }));
  };

  return (
    <ErrorBoundary>
      <ScrollView contentContainerStyle={styles.container} testID="notifications-screen">
        <View style={styles.headerSpace}>
          <Bell color="#0ea5e9" size={48} />
          <Text style={styles.title}>Meldingen</Text>
          <Text style={styles.subtitle}>
            Beheer apparaatmeldingen voor jou en je leerlingen
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instructeur Meldingen</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Herinnering komende les</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Inschakelen</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isEditing) return;
                  toggleInstructorReminder(!localSettings.instructor.lessonReminder.enabled);
                }}
                disabled={!isEditing}
                style={[
                  styles.toggle,
                  localSettings.instructor.lessonReminder.enabled && styles.toggleActive,
                  !isEditing && styles.toggleDisabled,
                ]}
                testID="toggle-instructor-reminder"
              >
                <View
                  style={[
                    styles.toggleThumb,
                    localSettings.instructor.lessonReminder.enabled && styles.toggleThumbActive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            {localSettings.instructor.lessonReminder.enabled && (
              <View style={styles.optionsGrid}>
                {reminderOptions.map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    onPress={() => {
                      if (!isEditing) return;
                      setInstructorReminderTime(minutes);
                    }}
                    disabled={!isEditing}
                    style={[
                      styles.optionCard,
                      localSettings.instructor.lessonReminder.minutesBefore === minutes &&
                        styles.optionCardSelected,
                      !isEditing && styles.optionCardDisabled,
                    ]}
                    testID={`instructor-reminder-${minutes}`}
                  >
                    {localSettings.instructor.lessonReminder.minutesBefore === minutes && (
                      <Check color="#0ea5e9" size={18} style={styles.checkIcon} />
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        localSettings.instructor.lessonReminder.minutesBefore === minutes &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {minutes} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leerling Meldingen</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Herinnering komende les</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Inschakelen</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isEditing) return;
                  toggleStudentReminder(!localSettings.students.lessonReminder.enabled);
                }}
                disabled={!isEditing}
                style={[
                  styles.toggle,
                  localSettings.students.lessonReminder.enabled && styles.toggleActive,
                  !isEditing && styles.toggleDisabled,
                ]}
                testID="toggle-student-reminder"
              >
                <View
                  style={[
                    styles.toggleThumb,
                    localSettings.students.lessonReminder.enabled && styles.toggleThumbActive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            {localSettings.students.lessonReminder.enabled && (
              <View style={styles.optionsGrid}>
                {reminderOptions.map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    onPress={() => {
                      if (!isEditing) return;
                      setStudentReminderTime(minutes);
                    }}
                    disabled={!isEditing}
                    style={[
                      styles.optionCard,
                      localSettings.students.lessonReminder.minutesBefore === minutes &&
                        styles.optionCardSelected,
                      !isEditing && styles.optionCardDisabled,
                    ]}
                    testID={`student-reminder-${minutes}`}
                  >
                    {localSettings.students.lessonReminder.minutesBefore === minutes && (
                      <Check color="#0ea5e9" size={18} style={styles.checkIcon} />
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        localSettings.students.lessonReminder.minutesBefore === minutes &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {minutes} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Les geannuleerd</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Inschakelen</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isEditing) return;
                  toggleStudentCancellation(!localSettings.students.lessonCancellation);
                }}
                disabled={!isEditing}
                style={[
                  styles.toggle,
                  localSettings.students.lessonCancellation && styles.toggleActive,
                  !isEditing && styles.toggleDisabled,
                ]}
                testID="toggle-student-cancellation"
              >
                <View
                  style={[
                    styles.toggleThumb,
                    localSettings.students.lessonCancellation && styles.toggleThumbActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Les verplaatst</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Inschakelen</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isEditing) return;
                  toggleStudentRescheduled(!localSettings.students.lessonRescheduled);
                }}
                disabled={!isEditing}
                style={[
                  styles.toggle,
                  localSettings.students.lessonRescheduled && styles.toggleActive,
                  !isEditing && styles.toggleDisabled,
                ]}
                testID="toggle-student-rescheduled"
              >
                <View
                  style={[
                    styles.toggleThumb,
                    localSettings.students.lessonRescheduled && styles.toggleThumbActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          {!isEditing ? (
            <TouchableOpacity
              onPress={() => {
                console.log("[NotificationsScreen] Entering edit mode");
                setIsEditing(true);
              }}
              style={styles.saveBtn}
              testID="edit-btn"
            >
              <Text style={styles.saveBtnText}>Bewerken</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveBtn}
              testID="save-btn"
            >
              <Text style={styles.saveBtnText}>Opslaan</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  headerSpace: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0ea5e9",
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#0ea5e9",
  },
  toggleDisabled: {
    opacity: 0.6,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  optionCardSelected: {
    borderColor: "#0ea5e9",
    backgroundColor: "#eff6ff",
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
  },
  optionTextSelected: {
    color: "#0ea5e9",
  },
  checkIcon: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  saveBtn: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
