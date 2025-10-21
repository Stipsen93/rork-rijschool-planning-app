import React, { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Clock, ChevronRight, MoreVertical, Copy, RefreshCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkingHours, defaultWorkingHours, type DayKey, type DayConfig, type WorkingHours } from "@/components/settings/WorkingHoursStore";

function showToast(msg: string, _color: string = "#16a34a") {
  if (Platform.OS === "android") {
    const { ToastAndroid } = require("react-native");
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert("", msg);
  }
}

export default function WorkingHoursScreen() {
  const { workingHours: storedHours, updateWorkingHours, loading } = useWorkingHours();
  const [workingHours, setWorkingHours] = useState<WorkingHours>(storedHours);
  const [expandedDay, setExpandedDay] = useState<DayKey | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [timePickerFor, setTimePickerFor] = useState<null | { day: DayKey; field: "startTime" | "endTime" | "breakStartTime" | "breakEndTime"; current: string }>(null);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    setWorkingHours(storedHours);
  }, [storedHours]);

  const lastSavedRef = React.useRef<string>(JSON.stringify(storedHours));
  React.useEffect(() => {
    const current = JSON.stringify(workingHours);
    if (current === lastSavedRef.current) return;
    const id = setTimeout(async () => {
      try {
        await updateWorkingHours(workingHours);
        lastSavedRef.current = JSON.stringify(workingHours);
        console.log("WorkingHoursScreen: Auto-saved changes");
      } catch (e) {
        console.log("WorkingHoursScreen: Auto-save error", e);
      }
    }, 400);
    return () => clearTimeout(id);
  }, [workingHours, updateWorkingHours]);

  const enabledDays = useMemo(() => Object.entries(workingHours).filter(([, v]) => v.enabled), [workingHours]);

  const validate = useCallback((): string | null => {
    const anyEnabled = enabledDays.length > 0;
    if (!anyEnabled) return "Selecteer minimaal één werkdag";
    for (const [day, conf] of Object.entries(workingHours) as [DayKey, DayConfig][]) {
      if (!conf.enabled) continue;
      const [sh, sm] = conf.startTime.split(":").map((n) => parseInt(n, 10));
      const [eh, em] = conf.endTime.split(":").map((n) => parseInt(n, 10));
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      if (start >= end) return `Eindtijd moet na starttijd zijn voor ${day}`;
      if (end - start < 60) return `Minimum 1 uur werktijd voor ${day}`;
    }
    return null;
  }, [enabledDays.length, workingHours]);

  const save = useCallback(async () => {
    const err = validate();
    if (err) {
      showToast(err, "#dc2626");
      return;
    }
    setIsSaving(true);
    try {
      await updateWorkingHours(workingHours);
      lastSavedRef.current = JSON.stringify(workingHours);
      if (Platform.OS !== "web") {
        try { await Haptics.selectionAsync(); } catch {}
      }
      showToast("Werkuren opgeslagen");
    } catch (e) {
      console.log("Save error", e);
      showToast("Fout bij opslaan", "#dc2626");
    } finally {
      setIsSaving(false);
    }
  }, [validate, workingHours, updateWorkingHours]);

  const copyFirstEnabledToAll = useCallback(() => {
    const firstEnabled = (Object.entries(workingHours) as [DayKey, DayConfig][])
      .find(([, v]) => v.enabled)?.[1] ?? Object.values(workingHours)[0];
    const pairs = (Object.entries(workingHours) as [DayKey, DayConfig][]).map(([k, v]) => [
      k,
      {
        ...v,
        startTime: firstEnabled.startTime,
        endTime: firstEnabled.endTime,
        breakDuration: firstEnabled.breakDuration,
        autoLunchBreak: firstEnabled.autoLunchBreak,
        breakStartTime: firstEnabled.breakStartTime,
        breakEndTime: firstEnabled.breakEndTime,
      } as DayConfig,
    ] as [DayKey, DayConfig]);
    const next: WorkingHours = Object.fromEntries(pairs) as WorkingHours;
    setWorkingHours(next);
    if (Platform.OS !== "web") { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {} }
    showToast("Instellingen gekopieerd naar alle dagen");
  }, [workingHours]);

  const resetDefaults = useCallback(() => {
    setWorkingHours(defaultWorkingHours);
    setExpandedDay(null);
  }, []);

  const openTimePicker = useCallback((day: DayKey, field: "startTime" | "endTime" | "breakStartTime" | "breakEndTime", current: string) => {
    setTimePickerFor({ day, field, current });
  }, []);

  const applyTime = useCallback((val: string) => {
    if (!timePickerFor) return;
    setWorkingHours((prev) => {
      const next = { ...prev };
      const day = next[timePickerFor.day];
      (day as any)[timePickerFor.field] = val;
      return next;
    });
    if (Platform.OS !== "web") { try { Haptics.selectionAsync(); } catch {} }
    setTimePickerFor(null);
  }, [timePickerFor]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text>Bezig met laden…</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.root} testID="working-hours-screen">
        <Stack.Screen
          options={{
            title: "Werkuren",
            headerRight: () => (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  testID="save-working-hours"
                  onPress={save}
                  style={{ padding: 8 }}
                  accessibilityRole="button"
                >
                  <Text style={{ color: "#0ea5e9", fontWeight: "600" }}>{isSaving ? "Opslaan…" : "Opslaan"}</Text>
                </TouchableOpacity>
                <Menu onCopyAll={copyFirstEnabledToAll} onReset={resetDefaults} />
              </View>
            ),
          }}
        />

        <ScrollView contentContainerStyle={styles.scroll}>
          {renderWeeklyPreview(enabledDays)}

          {(Object.entries(workingHours) as [DayKey, DayConfig][]).map(([day, conf]) => (
            <View key={day} style={styles.card}>
              <TouchableOpacity
                testID={`day-header-${day}`}
                style={styles.cardHeader}
                onPress={() => setExpandedDay(expandedDay === day ? null : day)}
                accessibilityRole="button"
              >
                <TouchableOpacity
                  onPress={() => {
                    setWorkingHours((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
                    if (Platform.OS !== "web") { try { Haptics.selectionAsync(); } catch {} }
                  }}
                  style={[styles.switchPill, { backgroundColor: conf.enabled ? "#e0f2fe" : "#f3f4f6" }]}
                >
                  <View style={[styles.switchDot, { backgroundColor: conf.enabled ? "#0ea5e9" : "#9ca3af", alignSelf: conf.enabled ? "flex-end" : "flex-start" }]} />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.dayTitle, { color: conf.enabled ? "#111827" : "#9ca3af" }]}>{day}</Text>
                  <Text style={[styles.daySubtitle, { color: conf.enabled ? "#0ea5e9" : "#9ca3af" }]}>
                    {conf.enabled ? `${conf.startTime} - ${conf.endTime}` : "Niet actief"}
                  </Text>
                </View>

                <ChevronRight color="#9ca3af" style={{ transform: [{ rotate: expandedDay === day ? "90deg" : "0deg" }] }} />
              </TouchableOpacity>

              {expandedDay === day && conf.enabled && (
                <View style={styles.cardBody}>
                  <View style={styles.row}>
                    <TimeField
                      label="Start tijd"
                      value={conf.startTime}
                      onPress={() => openTimePicker(day, "startTime", conf.startTime)}
                    />
                    <View style={{ width: 12 }} />
                    <TimeField
                      label="Eind tijd"
                      value={conf.endTime}
                      onPress={() => openTimePicker(day, "endTime", conf.endTime)}
                    />
                  </View>

                  <View style={{ height: 16 }} />

                  <Text style={styles.sectionTitle}>Pauze instellingen</Text>
                  <View style={{ height: 8 }} />

                  <TouchableOpacity
                    testID={`toggle-break-${day}`}
                    style={styles.toggleRow}
                    onPress={() => setWorkingHours((prev) => ({ ...prev, [day]: { ...prev[day], autoLunchBreak: !prev[day].autoLunchBreak, breakStartTime: prev[day].breakStartTime ?? "12:00", breakEndTime: prev[day].breakEndTime ?? "13:00" } }))}
                  >
                    <Text style={styles.toggleTitle}>Pauze</Text>
                    <View style={[styles.switchPill, { backgroundColor: conf.autoLunchBreak ? "#e0f2fe" : "#f3f4f6" }]}>
                      <View style={[styles.switchDot, { backgroundColor: conf.autoLunchBreak ? "#0ea5e9" : "#9ca3af", alignSelf: conf.autoLunchBreak ? "flex-end" : "flex-start" }]} />
                    </View>
                  </TouchableOpacity>

                  {conf.autoLunchBreak && (
                    <View style={styles.row}>
                      <TimeField
                        label="Pauze start"
                        value={conf.breakStartTime ?? "12:00"}
                        onPress={() => openTimePicker(day, "breakStartTime", conf.breakStartTime ?? "12:00")}
                      />
                      <View style={{ width: 12 }} />
                      <TimeField
                        label="Pauze eind"
                        value={conf.breakEndTime ?? "13:00"}
                        onPress={() => openTimePicker(day, "breakEndTime", conf.breakEndTime ?? "13:00")}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}

          <View style={{ height: 24 + insets.bottom }} />
        </ScrollView>

        <TimePickerModal
          visible={!!timePickerFor}
          initial={timePickerFor?.current ?? "09:00"}
          onClose={() => setTimePickerFor(null)}
          onSelect={applyTime}
        />
      </View>
    </ErrorBoundary>
  );
}

function Menu({ onCopyAll, onReset }: { onCopyAll: () => void; onReset: () => void }) {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <View>
      <TouchableOpacity testID="working-hours-menu" onPress={() => setOpen((p) => !p)} style={{ padding: 8 }} accessibilityRole="button">
        <MoreVertical color="#111827" />
      </TouchableOpacity>
      {open && (
        <View style={styles.menu}>
          <TouchableOpacity
            testID="copy-all"
            style={styles.menuItem}
            onPress={() => {
              onCopyAll();
              setOpen(false);
            }}
          >
            <Copy color="#111827" size={18} />
            <Text style={styles.menuText}>Kopieer naar alle dagen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="reset-defaults"
            style={styles.menuItem}
            onPress={() => {
              onReset();
              setOpen(false);
            }}
          >
            <RefreshCcw color="#ef4444" size={18} />
            <Text style={[styles.menuText, { color: "#ef4444" }]}>Reset naar standaard</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function TimeField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.timeField} onPress={onPress} accessibilityRole="button" testID={`time-${label}`}>
      <View style={{ flex: 1 }}>
        <Text style={styles.timeLabel}>{label}</Text>
        <Text style={styles.timeValue}>{value}</Text>
      </View>
      <Clock color="#9ca3af" size={18} />
    </TouchableOpacity>
  );
}

function renderWeeklyPreview(enabledDays: [string, DayConfig][]) {
  if (enabledDays.length === 0) return null;
  return (
    <View style={styles.preview}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Clock color="#0ea5e9" size={18} />
        <Text style={styles.previewTitle}>Wekelijks Overzicht</Text>
      </View>
      <View style={styles.previewChips}>
        {enabledDays.map(([day, v]) => (
          <View key={day} style={styles.chip}>
            <Text style={styles.chipText}>{`${day.slice(0, 2)} ${v.startTime}-${v.endTime}`}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TimePickerModal({ visible, initial, onSelect, onClose }: { visible: boolean; initial: string; onSelect: (val: string) => void; onClose: () => void }) {
  const times = React.useMemo<string[]>(() => {
    const out: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return out;
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose as any}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Selecteer tijd</Text>
          <TouchableOpacity onPress={onClose} accessibilityRole="button">
            <Text style={{ color: "#0ea5e9", fontWeight: "600" }}>Sluiten</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          <View style={styles.timeGrid}>
            {times.map((t) => (
              <TouchableOpacity key={t} style={styles.timeOption} onPress={() => onSelect(t)} accessibilityRole="button">
                <Text style={styles.timeOptionText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 12 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 16, paddingBottom: 24 },
  preview: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#e0f2fe",
    borderWidth: 1,
    borderColor: "#bae6fd",
    gap: 12,
  },
  previewTitle: { color: "#0ea5e9", fontWeight: "700" },
  previewChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#0ea5e9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999 },
  chipText: { color: "#fff", fontWeight: "600", fontSize: 12 },

  card: {
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginTop: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  dayTitle: { fontSize: 16, fontWeight: "700" },
  daySubtitle: { fontSize: 12, marginTop: 2 },
  cardBody: { padding: 16 },
  row: { flexDirection: "row" },

  timeField: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeLabel: { fontSize: 12, color: "#6b7280" },
  timeValue: { fontSize: 16, fontWeight: "600" },

  sectionTitle: { fontSize: 14, fontWeight: "700" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleTitle: { fontSize: 16, fontWeight: "600" },
  switchPill: { width: 46, height: 28, borderRadius: 999, padding: 4, justifyContent: "center" },
  switchDot: { width: 20, height: 20, borderRadius: 999 },

  menu: {
    position: "absolute",
    top: 36,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    minWidth: 200,
    zIndex: 10,
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 12 },
  menuText: { fontSize: 14, color: "#111827" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  modalSheet: { position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "80%", backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#f3f4f6" },
  timeOptionText: { fontWeight: "600" },
});
