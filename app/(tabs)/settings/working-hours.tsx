import React, { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Clock, ChevronRight, MoreVertical, Copy, RefreshCcw, Plus, Trash2 } from "lucide-react-native";
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
  const [workingHours, setWorkingHours] = useState<WorkingHours>(storedHours ?? defaultWorkingHours);
  const [expandedDay, setExpandedDay] = useState<DayKey | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [timePickerFor, setTimePickerFor] = useState<null | { day: DayKey; group: "ranges" | "pauses"; index: number; part: "start" | "end"; current: string }>(null);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (storedHours) {
      setWorkingHours(storedHours);
    }
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
      const ranges = conf.ranges ?? [];
      const pauses = conf.pauses ?? [];
      if (ranges.length === 0) return `Voeg minimaal één tijdsblok toe voor ${day}`;
      for (const r of ranges) {
        const [sh, sm] = r.start.split(":").map((n) => parseInt(n, 10));
        const [eh, em] = r.end.split(":").map((n) => parseInt(n, 10));
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        if (start >= end) return `Eindtijd moet na starttijd zijn voor ${day}`;
      }
      for (const p of pauses) {
        const [sh, sm] = p.start.split(":").map((n) => parseInt(n, 10));
        const [eh, em] = p.end.split(":").map((n) => parseInt(n, 10));
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        if (start >= end) return `Eindtijd pauze moet na starttijd zijn voor ${day}`;
      }
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
    const baseRanges = firstEnabled?.ranges ?? [];
    const basePauses = firstEnabled?.pauses ?? [];
    const pairs = (Object.entries(workingHours) as [DayKey, DayConfig][]).map(([k, v]) => [
      k,
      {
        ...v,
        ranges: baseRanges.slice(),
        pauses: basePauses.slice(),
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

  const openTimePicker = useCallback((params: { day: DayKey; group: "ranges" | "pauses"; index: number; part: "start" | "end"; current: string }) => {
    setTimePickerFor(params);
  }, []);

  const applyTime = useCallback((val: string) => {
    if (!timePickerFor) return;
    setWorkingHours((prev) => {
      const next = { ...prev } as WorkingHours;
      const dayCfg = next[timePickerFor.day];
      const list = (dayCfg as any)[timePickerFor.group] as { start: string; end: string }[] | undefined;
      const safeList = Array.isArray(list) ? list : [];
      const item = safeList[timePickerFor.index];
      if (!item) return next;
      const updated = { ...item, [timePickerFor.part]: val } as { start: string; end: string };
      const newList = safeList.slice();
      newList[timePickerFor.index] = updated;
      (dayCfg as any)[timePickerFor.group] = newList;
      return next;
    });
    if (Platform.OS !== "web") { try { Haptics.selectionAsync(); } catch {} }
    setTimePickerFor(null);
  }, [timePickerFor]);

  const addRange = useCallback((day: DayKey) => {
    setWorkingHours((prev) => {
      const next = { ...prev } as WorkingHours;
      const current = next[day];
      const list = (current.ranges ?? []).slice();
      const last = list[list.length - 1] ?? { start: "09:00", end: "17:00" };
      list.push({ start: last.end, end: last.end });
      next[day] = { ...current, ranges: list };
      return next;
    });
  }, []);

  const removeRange = useCallback((day: DayKey, index: number) => {
    setWorkingHours((prev) => {
      const next = { ...prev } as WorkingHours;
      const current = next[day];
      const list = (current.ranges ?? []).slice();
      list.splice(index, 1);
      next[day] = { ...current, ranges: list };
      return next;
    });
  }, []);

  const addPause = useCallback((day: DayKey) => {
    setWorkingHours((prev) => {
      const next = { ...prev } as WorkingHours;
      const current = next[day];
      const list = (current.pauses ?? []).slice();
      list.push({ start: "12:00", end: "12:30" });
      next[day] = { ...current, pauses: list };
      return next;
    });
  }, []);

  const removePause = useCallback((day: DayKey, index: number) => {
    setWorkingHours((prev) => {
      const next = { ...prev } as WorkingHours;
      const current = next[day];
      const list = (current.pauses ?? []).slice();
      list.splice(index, 1);
      next[day] = { ...current, pauses: list };
      return next;
    });
  }, []);

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
                    {conf.enabled ? (conf.ranges?.[0] ? `${conf.ranges?.[0]?.start} - ${conf.ranges?.[0]?.end}` : "Geen tijdsblokken") : "Niet actief"}
                  </Text>
                </View>

                <ChevronRight color="#9ca3af" style={{ transform: [{ rotate: expandedDay === day ? "90deg" : "0deg" }] }} />
              </TouchableOpacity>

              {expandedDay === day && conf.enabled && (
                <View style={styles.cardBody}>
                  <Text style={styles.sectionTitle}>Tijdsblokken</Text>
                  <View style={{ height: 8 }} />
                  {(conf.ranges ?? []).map((r, idx) => (
                    <View key={`r-${idx}`} style={[styles.row, { alignItems: "center", marginBottom: 8 }]}> 
                      <TimeField label="Start" value={r.start} onPress={() => openTimePicker({ day, group: "ranges", index: idx, part: "start", current: r.start })} />
                      <View style={{ width: 12 }} />
                      <TimeField label="Einde" value={r.end} onPress={() => openTimePicker({ day, group: "ranges", index: idx, part: "end", current: r.end })} />
                      <TouchableOpacity accessibilityRole="button" onPress={() => removeRange(day, idx)} style={styles.iconBtn} testID={`remove-range-${day}-${idx}`}>
                        <Trash2 color="#ef4444" size={18} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity accessibilityRole="button" onPress={() => addRange(day)} style={styles.addBtn} testID={`add-range-${day}`}>
                    <Plus color="#0ea5e9" size={16} />
                    <Text style={styles.addBtnText}>Blok toevoegen</Text>
                  </TouchableOpacity>

                  <View style={{ height: 16 }} />

                  <Text style={styles.sectionTitle}>Pauzes</Text>
                  <View style={{ height: 8 }} />
                  {((conf.pauses ?? []).length === 0) && (
                    <Text style={{ color: "#6b7280", marginBottom: 8 }}>Geen pauzes ingesteld</Text>
                  )}
                  {(conf.pauses ?? []).map((p, idx) => (
                    <View key={`p-${idx}`} style={[styles.row, { alignItems: "center", marginBottom: 8 }]}> 
                      <TimeField label="Start" value={p.start} onPress={() => openTimePicker({ day, group: "pauses", index: idx, part: "start", current: p.start })} />
                      <View style={{ width: 12 }} />
                      <TimeField label="Einde" value={p.end} onPress={() => openTimePicker({ day, group: "pauses", index: idx, part: "end", current: p.end })} />
                      <TouchableOpacity accessibilityRole="button" onPress={() => removePause(day, idx)} style={styles.iconBtn} testID={`remove-pause-${day}-${idx}`}>
                        <Trash2 color="#ef4444" size={18} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity accessibilityRole="button" onPress={() => addPause(day)} style={styles.addBtn} testID={`add-pause-${day}`}>
                    <Plus color="#0ea5e9" size={16} />
                    <Text style={styles.addBtnText}>Pauze toevoegen</Text>
                  </TouchableOpacity>
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

  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#e0f2fe", marginTop: 4 },
  addBtnText: { color: "#0ea5e9", fontWeight: "700" },
  iconBtn: { padding: 8, marginLeft: 8 },
});
