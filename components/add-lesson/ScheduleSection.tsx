import React, { memo, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList } from "react-native";
import { CalendarDays, Clock, ChevronLeft, ChevronRight, Timer, X } from "lucide-react-native";

export interface ScheduleSectionProps {
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:MM
  lessonDurationHours: number;
  lessonDurationMinutes: number;
  location: string;
  onDateChanged: (v: string) => void;
  onTimeChanged: (v: string) => void;
  onDurationChanged: (h: number, m: number) => void;
  onLocationChanged: (v: string) => void;
  isFullDay?: boolean;
  showLocationField?: boolean;
  testID?: string;
}

function ScheduleSectionComponent({ selectedDate, selectedTime, lessonDurationHours, lessonDurationMinutes, location, onDateChanged, onTimeChanged, onDurationChanged, onLocationChanged, isFullDay = false, showLocationField = true, testID }: ScheduleSectionProps) {
  const durationString = useMemo(() => {
    const h = Math.max(0, Number(lessonDurationHours || 0));
    const m = Math.max(0, Math.min(59, Number(lessonDurationMinutes || 0)));
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [lessonDurationHours, lessonDurationMinutes]);

  const [showDate, setShowDate] = useState<boolean>(false);
  const [showTime, setShowTime] = useState<boolean>(false);
  const [showDuration, setShowDuration] = useState<boolean>(false);

  const parseDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map((v) => parseInt(v, 10));
    const dt = new Date(Number.isFinite(y) ? y : new Date().getFullYear(), (Number.isFinite(m) ? m : 1) - 1, Number.isFinite(d) ? d : new Date().getDate());
    return dt;
  };
  const parseTime = (hhmm: string) => {
    const [hh, mm] = hhmm.split(":").map((v) => parseInt(v, 10));
    const d = new Date();
    d.setHours(Number.isFinite(hh) ? hh : 0);
    d.setMinutes(Number.isFinite(mm) ? mm : 0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  };


  const onDatePicked = (dateObj: Date | null) => {
    if (!dateObj) return;
    const y = dateObj.getFullYear();
    const m = pad(dateObj.getMonth() + 1);
    const d = pad(dateObj.getDate());
    onDateChanged(`${y}-${m}-${d}`);
    setShowDate(false);
  };

  const onTimePicked = (h: number, m: number) => {
    const hh = pad(h);
    const mm = pad(m);
    onTimeChanged(`${hh}:${mm}`);
    setShowTime(false);
  };

  const durationOptions = useMemo(() => {
    const durations = [30, 50, 60, 75, 90, 100, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480, 510, 540, 570, 600];
    return durations.map(minutes => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return { label: `${pad(h)}:${pad(m)}`, h, m, minutes };
    });
  }, []);

  return (
    <View style={styles.container} testID={testID ?? "schedule-section"}>
      <Text style={styles.title}>Schema</Text>

      <View style={styles.fieldColumn}>
        <View style={styles.fieldWrap}>
          <Text style={styles.header}>Datum</Text>
          <TouchableOpacity
            accessibilityRole="button"
            testID="date-input"
            onPress={() => setShowDate(true)}
            activeOpacity={0.8}
            style={styles.inputWrap}
          >
            <CalendarDays size={16} color="#2563eb" />
            <Text style={styles.inputText}>{selectedDate}</Text>
          </TouchableOpacity>
          {showDate && (
            <Modal visible animationType="fade" transparent>
              <View style={styles.modalBackdrop} testID="date-picker-modal">
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Kies datum</Text>
                    <TouchableOpacity accessibilityRole="button" onPress={() => setShowDate(false)}>
                      <X size={20} color="#111827" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.pickerWrap}>
                    <CalendarPicker
                      initialDate={parseDate(selectedDate)}
                      onSelectDate={onDatePicked}
                      testID="date-picker"
                    />
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.header}>Tijd</Text>
          <TouchableOpacity
            accessibilityRole="button"
            testID="time-input"
            onPress={() => !isFullDay && setShowTime(true)}
            activeOpacity={0.8}
            style={[styles.inputWrap, isFullDay && { opacity: 0.6 }]}
            disabled={isFullDay}
          >
            <Clock size={16} color="#2563eb" />
            <Text style={styles.inputText}>{isFullDay ? "09:00" : selectedTime}</Text>
          </TouchableOpacity>
          {showTime && (
            <Modal visible animationType="fade" transparent>
              <View style={styles.modalBackdrop} testID="time-picker-modal">
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Kies tijd</Text>
                    <TouchableOpacity accessibilityRole="button" onPress={() => setShowTime(false)}>
                      <X size={20} color="#111827" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.pickerWrap}>
                    <TimePicker24h
                      initialTime={parseTime(selectedTime)}
                      onSelectTime={onTimePicked}
                      testID="time-picker"
                    />
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.header}>Lengte</Text>
          <TouchableOpacity accessibilityRole="button" testID="duration-input" onPress={() => setShowDuration(true)} activeOpacity={0.8} style={styles.inputWrap}>
            <Timer size={16} color="#2563eb" />
            <Text style={styles.inputText}>{durationString}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDuration && (
        <Modal visible animationType="fade" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Kies lengte</Text>
                <TouchableOpacity accessibilityRole="button" onPress={() => setShowDuration(false)}>
                  <X size={20} color="#111827" />
                </TouchableOpacity>
              </View>
              <View style={styles.pickerWrap}>
                <FlatList
                  data={durationOptions}
                  keyExtractor={(item) => item.label}
                  contentContainerStyle={styles.durationListContent}
                  renderItem={({ item }) => {
                    const selected = item.h === lessonDurationHours && item.m === lessonDurationMinutes;
                    return (
                      <Pressable
                        onPress={() => {
                          onDurationChanged(item.h, item.m);
                          setShowDuration(false);
                        }}
                        style={[styles.durationItem, selected && styles.durationItemSelected]}
                        testID={`duration-${item.label}`}
                      >
                        <Text style={[styles.durationText, selected && styles.durationTextSelected]}>{item.label}</Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showLocationField && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.header}>Locatie</Text>
          <View style={styles.inputWrap}>
            <TextInput value={location} onChangeText={onLocationChanged} placeholder="Adres" style={styles.input} testID="location-inline" />
          </View>
        </View>
      )}
    </View>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

export const ScheduleSection = memo(ScheduleSectionComponent);

interface CalendarPickerProps {
  initialDate: Date;
  onSelectDate: (d: Date | null) => void;
  testID?: string;
}

const monthNames = [
  "januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december",
] as const;
const weekDays = ["Ma","Di","Wo","Do","Vr","Za","Zo"] as const;

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function CalendarPicker({ initialDate, onSelectDate, testID }: CalendarPickerProps) {
  const [cursor, setCursor] = useState<Date>(startOfMonth(initialDate));
  const today = new Date();
  const days: { date: Date; inMonth: boolean }[] = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const startWeekDay = (start.getDay() + 6) % 7; // make Monday=0
    const totalDays = end.getDate();
    const arr: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < startWeekDay; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() - (startWeekDay - i));
      arr.push({ date: d, inMonth: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      arr.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), i), inMonth: true });
    }
    const trailing = (7 - (arr.length % 7)) % 7;
    for (let i = 1; i <= trailing; i++) {
      const d = new Date(end);
      d.setDate(end.getDate() + i);
      arr.push({ date: d, inMonth: false });
    }
    return arr;
  }, [cursor]);

  return (
    <View testID={testID}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity accessibilityRole="button" onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
          <ChevronLeft size={18} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.calendarHeaderTitle}>{monthNames[cursor.getMonth()]} {cursor.getFullYear()}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
          <ChevronRight size={18} color="#111827" />
        </TouchableOpacity>
      </View>
      <View style={styles.weekRow}>
        {weekDays.map((w) => (
          <Text key={w} style={styles.weekCell}>{w}</Text>
        ))}
      </View>
      <View style={styles.daysGrid}>
        {days.map(({ date, inMonth }) => {
          const isToday = date.toDateString() === new Date(today.getFullYear(), today.getMonth(), today.getDate()).toDateString();
          const isSelected = date.toDateString() === new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()).toDateString();
          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => inMonth && onSelectDate(date)}
              disabled={!inMonth}
              style={[styles.dayCell, !inMonth && styles.dayCellOutside, isSelected && styles.daySelected]}
              testID={`day-${date.getDate()}`}
            >
              <Text style={[styles.dayText, !inMonth && styles.dayTextOutside, isSelected && styles.dayTextSelected]}>{date.getDate()}</Text>
              {isToday && !isSelected && <View style={styles.todayDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface TimePicker24hProps {
  initialTime: Date;
  onSelectTime: (h: number, m: number) => void;
  testID?: string;
}

function TimePicker24h({ initialTime, onSelectTime, testID }: TimePicker24hProps) {
  const [hour, setHour] = useState<number>(initialTime.getHours());
  const [minute, setMinute] = useState<number>(initialTime.getMinutes());

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);

  return (
    <View testID={testID} style={styles.timePickerWrap}>
      <Text style={styles.timePickerTitle}>Kies tijd</Text>
      <View style={styles.timeColumns}>
        <FlatList
          data={hours}
          keyExtractor={(i) => `h-${i}`}
          style={styles.timeColumn}
          contentContainerStyle={styles.timeColumnContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setHour(item)}
              style={[styles.timeItem, item === hour && styles.timeItemSelected]}
              testID={`hour-${item}`}
            >
              <Text style={[styles.timeText, item === hour && styles.timeTextSelected]}>{pad(item)}</Text>
            </Pressable>
          )}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <FlatList
          data={minutes}
          keyExtractor={(i) => `m-${i}`}
          style={styles.timeColumn}
          contentContainerStyle={styles.timeColumnContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setMinute(item)}
              style={[styles.timeItem, item === minute && styles.timeItemSelected]}
              testID={`minute-${item}`}
            >
              <Text style={[styles.timeText, item === minute && styles.timeTextSelected]}>{pad(item)}</Text>
            </Pressable>
          )}
        />
      </View>
      <View style={styles.iosToolbar}>
        <TouchableOpacity onPress={() => onSelectTime(hour, minute)} style={styles.toolbarBtn}>
          <Text style={styles.toolbarBtnText}>Gereed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  header: { fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: "600" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#fff" },
  inputSmall: { flex: 1, minWidth: 0 },
  input: { flex: 1 },
  inputText: { flex: 1, color: "#111827" },
  tableRow: { flexDirection: "row", gap: 12 },
  cell: { flex: 1 },
  fieldColumn: { gap: 12 },
  fieldWrap: {},
  row: { flexDirection: "row", alignItems: "center" },
  pickerWrap: { marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" },
  iosToolbar: { borderTopWidth: 1, borderTopColor: "#e5e7eb", padding: 8, alignItems: "flex-end", backgroundColor: "#f9fafb" },
  toolbarBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#2563eb", borderRadius: 8 },
  toolbarBtnText: { color: "#fff", fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 16 },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: "#fff", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 4, paddingHorizontal: 8 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  optionsWrap: { maxHeight: 360 },
  optionItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  optionItemSelected: { backgroundColor: "#eff6ff" },
  optionText: { fontSize: 16, color: "#111827" },
  optionTextSelected: { color: "#2563eb", fontWeight: "700" },
  calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#f9fafb" },
  calendarHeaderTitle: { fontWeight: "700", color: "#111827" },
  weekRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 6, backgroundColor: "#f3f4f6" },
  weekCell: { width: `${100 / 7}%`, textAlign: "center", fontSize: 12, color: "#6b7280" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  dayCellOutside: { opacity: 0.35 },
  dayText: { color: "#111827", fontSize: 14 },
  dayTextOutside: { color: "#6b7280" },
  daySelected: { backgroundColor: "#eff6ff", borderRadius: 12 },
  dayTextSelected: { color: "#2563eb", fontWeight: "700" },
  todayDot: { position: "absolute", bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: "#2563eb" },
  timePickerWrap: { padding: 12 },
  timePickerTitle: { fontWeight: "700", marginBottom: 8 },
  timeColumns: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  timeColumn: { flexGrow: 0, width: 96, maxHeight: 220, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10 },
  timeColumnContent: { paddingVertical: 6 },
  timeItem: { paddingVertical: 10, alignItems: "center" },
  timeItemSelected: { backgroundColor: "#eff6ff" },
  timeText: { fontSize: 18, color: "#111827" },
  timeTextSelected: { color: "#2563eb", fontWeight: "700" },
  timeSeparator: { fontSize: 18, fontWeight: "700", marginHorizontal: 4 },
  durationListContent: { paddingVertical: 6 },
  durationItem: { paddingVertical: 12, paddingHorizontal: 12, alignItems: "center" },
  durationItemSelected: { backgroundColor: "#eff6ff" },
  durationText: { fontSize: 18, color: "#111827" },
  durationTextSelected: { color: "#2563eb", fontWeight: "700" },
});
