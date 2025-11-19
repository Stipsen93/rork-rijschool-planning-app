import { useEffect, useMemo, useState, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../auth/AuthStore";

type ReminderOption = 15 | 30 | 45 | 60;

type NotificationSettings = {
  instructor: {
    lessonReminder: {
      enabled: boolean;
      minutesBefore: ReminderOption;
    };
  };
  students: {
    lessonReminder: {
      enabled: boolean;
      minutesBefore: ReminderOption;
    };
    lessonCancellation: boolean;
    lessonRescheduled: boolean;
  };
};

const NOTIFICATIONS_KEY = "notification_settings" as const;

const defaultNotificationSettings: NotificationSettings = {
  instructor: {
    lessonReminder: {
      enabled: true,
      minutesBefore: 30,
    },
  },
  students: {
    lessonReminder: {
      enabled: true,
      minutesBefore: 60,
    },
    lessonCancellation: true,
    lessonRescheduled: true,
  },
};

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    defaultNotificationSettings
  );
  const [loading, setLoading] = useState<boolean>(true);
  const { isAuthenticated, user } = useAuth();
  const activeUserId = user?.id ?? null;

  useEffect(() => {
    if (!isAuthenticated) {
      setNotificationSettings(defaultNotificationSettings);
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !activeUserId) {
      return;
    }

    setLoading(true);

    (async () => {
      console.log("[NotificationsStore] Loading notification settings...");
      try {
        const settingsStr = await AsyncStorage.getItem(NOTIFICATIONS_KEY);

        if (settingsStr) {
          try {
            const parsed = JSON.parse(settingsStr) as Partial<NotificationSettings>;
            const migrated: NotificationSettings = {
              instructor: {
                lessonReminder: {
                  enabled:
                    parsed.instructor?.lessonReminder?.enabled ??
                    defaultNotificationSettings.instructor.lessonReminder.enabled,
                  minutesBefore:
                    (parsed.instructor?.lessonReminder?.minutesBefore as ReminderOption) ??
                    defaultNotificationSettings.instructor.lessonReminder.minutesBefore,
                },
              },
              students: {
                lessonReminder: {
                  enabled:
                    parsed.students?.lessonReminder?.enabled ??
                    defaultNotificationSettings.students.lessonReminder.enabled,
                  minutesBefore:
                    (parsed.students?.lessonReminder?.minutesBefore as ReminderOption) ??
                    defaultNotificationSettings.students.lessonReminder.minutesBefore,
                },
                lessonCancellation:
                  parsed.students?.lessonCancellation ??
                  defaultNotificationSettings.students.lessonCancellation,
                lessonRescheduled:
                  parsed.students?.lessonRescheduled ??
                  defaultNotificationSettings.students.lessonRescheduled,
              },
            };
            setNotificationSettings(migrated);
            console.log("[NotificationsStore] Loaded notification settings", migrated);
          } catch (e) {
            console.log("[NotificationsStore] Failed to parse notification settings", e);
          }
        } else {
          setNotificationSettings(defaultNotificationSettings);
        }
      } catch (e) {
        console.error("[NotificationsStore] Failed to load notification settings", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, activeUserId]);

  const updateNotificationSettings = useCallback(
    async (settings: NotificationSettings) => {
      console.log("[NotificationsStore] Updating notification settings", settings);
      setNotificationSettings(settings);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(settings));
    },
    []
  );

  const value = useMemo(
    () => ({
      notificationSettings,
      loading,
      updateNotificationSettings,
    }),
    [notificationSettings, loading, updateNotificationSettings]
  );

  return value;
});
