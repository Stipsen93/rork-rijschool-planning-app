import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Check, Loader2, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryTypeSection, Category } from "@/components/add-lesson/CategoryTypeSection";
import { StudentVehicleSection, Student, Vehicle } from "@/components/add-lesson/StudentVehicleSection";
import { ScheduleSection, RecurrenceType, RecurrenceLimit } from "@/components/add-lesson/ScheduleSection";
import { LocationSection } from "@/components/add-lesson/LocationSection";
import { NotesSection } from "@/components/add-lesson/NotesSection";
import { useAgenda } from "@/components/agenda/AgendaStore";
import { useSettings } from "@/components/settings/SettingsStore";
import { useWorkingHours } from "@/components/settings/WorkingHoursStore";
import { useStudents } from "@/components/students/StudentsStore";

export type Option = { label: string; value: string };

export default function AddLessonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addLesson, removeLessonById, lessonsByDate } = useAgenda();
  const { workingHours } = useWorkingHours();
  const { products, getDurationForType } = useSettings();
  const { students: allStudents } = useStudents();

  const baseAppointmentTypes: Option[] = useMemo(() => [
    { label: "Rijles", value: "Rijles" },
  ], []);

  const appointmentTypes: Option[] = useMemo(() => {
    const productOptions = products.map((p) => ({ label: p.name, value: p.name }));
    return [...baseAppointmentTypes, ...productOptions];
  }, [baseAppointmentTypes, products]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const params = useLocalSearchParams();

  const [category, setCategory] = useState<Category>("Auto");
  const [type, setType] = useState<string>("Rijles");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>("09:00");
  const [durationHours, setDurationHours] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [isFullDay, setIsFullDay] = useState<boolean>(false);

  useEffect(() => {
    const minutes = getDurationForType(type);
    const safe = Number.isFinite(minutes) ? minutes : 60;
    setDurationHours(Math.floor(safe / 60));
    setDurationMinutes(safe % 60);
  }, [type, getDurationForType]);
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("none");
  const [recurrenceLimit, setRecurrenceLimit] = useState<RecurrenceLimit>({ type: "count", value: 1 });

  const isPauseOrLeave = category === "Pauze" || category === "Verlof";

  const mockStudents: Student[] = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeWeeksLater = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
    const fourWeeksLater = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

    const allLessons = Object.values(lessonsByDate).flat();

    return allStudents.map(student => {
      const studentLessons = allLessons.filter(
        lesson => lesson.studentName?.toLowerCase() === student.name.toLowerCase()
      );

      const pastLessons = studentLessons.filter(
        lesson => lesson.date >= oneMonthAgo && lesson.date < now
      ).length;

      const futureLessons = studentLessons.filter(
        lesson => lesson.date >= now && lesson.date <= threeWeeksLater
      ).length;

      const futureToFourWeeks = studentLessons.filter(
        lesson => lesson.date >= now && lesson.date <= fourWeeksLater
      ).length;

      const lastLesson = studentLessons
        .filter(lesson => lesson.date < now)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

      const daysSinceLastLesson = lastLesson
        ? Math.floor((now.getTime() - lastLesson.date.getTime()) / (24 * 60 * 60 * 1000))
        : 999;

      let status: "active" | "irregular" | "inactive" = "inactive";
      if (pastLessons >= 3 && futureLessons >= 2) {
        status = "active";
      } else if (pastLessons <= 2 && futureLessons === 1) {
        status = "irregular";
      } else if (daysSinceLastLesson >= 30 && futureToFourWeeks === 0) {
        status = "inactive";
      }

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        status,
      };
    });
  }, [allStudents, lessonsByDate]);

  const mockVehicles: Vehicle[] = useMemo(() => ([
    { id: "1", model: "Volkswagen Polo", licensePlate: "12-ABC-3", type: "Handschakeling", year: 2022 },
    { id: "2", model: "Toyota Yaris", licensePlate: "45-DEF-6", type: "Automaat", year: 2023 },
    { id: "3", model: "Opel Corsa", licensePlate: "78-GHI-9", type: "Handschakeling", year: 2021 },
  ]), []);

  useEffect(() => {
    try {
      const mode = typeof params.mode === "string" ? params.mode : Array.isArray(params.mode) ? params.mode[0] : undefined;
      const dateParam = typeof params.date === "string" ? params.date : Array.isArray(params.date) ? params.date[0] : undefined;
      const timeParam = typeof params.time === "string" ? params.time : Array.isArray(params.time) ? params.time[0] : undefined;
      const typeParam = typeof params.type === "string" ? params.type : Array.isArray(params.type) ? params.type[0] : undefined;
      const durationMinParam = typeof params.durationMinutes === "string" ? params.durationMinutes : Array.isArray(params.durationMinutes) ? params.durationMinutes[0] : undefined;
      const locationParam = typeof params.location === "string" ? params.location : Array.isArray(params.location) ? params.location[0] : undefined;
      const notesParam = typeof params.notes === "string" ? params.notes : Array.isArray(params.notes) ? params.notes[0] : undefined;
      const idParam = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;

      if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) setDate(dateParam);
      if (timeParam && /^\d{2}:\d{2}$/.test(timeParam)) setTime(timeParam);
      if (typeParam) setType(typeParam);
      if (locationParam) setLocation(locationParam);
      if (notesParam) setNotes(notesParam);
      if (durationMinParam) {
        const total = parseInt(durationMinParam, 10);
        if (Number.isFinite(total)) {
          setDurationHours(Math.floor(total / 60));
          setDurationMinutes(total % 60);
        }
      }
      if (mode === "edit" && idParam) setEditingId(idParam);
    } catch (e) {
      console.log("[AddLesson] Failed to parse params", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Saving lesson", { category, type, selectedStudentId, selectedVehicleId, date, time, durationHours, durationMinutes, location, notes });
      await new Promise((res) => setTimeout(res, 600));

      const [y, m, d] = date.split("-").map((v) => parseInt(v, 10));
      const baseDate = new Date(Number.isFinite(y) ? y : new Date().getFullYear(), (Number.isFinite(m) ? m : 1) - 1, Number.isFinite(d) ? d : new Date().getDate());
      
      let startTime = time;
      let endTime = time;
      
      if (isPauseOrLeave && isFullDay && category === "Verlof") {
        const dayNames: ("Maandag" | "Dinsdag" | "Woensdag" | "Donderdag" | "Vrijdag" | "Zaterdag" | "Zondag")[] = [
          "Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"
        ];
        const dayName = dayNames[baseDate.getDay()];
        const dayConfig = workingHours[dayName];
        
        if (dayConfig && dayConfig.enabled && dayConfig.ranges.length > 0) {
          startTime = dayConfig.ranges[0].start;
          const lastRange = dayConfig.ranges[dayConfig.ranges.length - 1];
          endTime = lastRange.end;
        } else {
          startTime = "09:00";
          endTime = "18:00";
        }
      } else {
        const [sh, sm] = time.split(":").map((v) => parseInt(v, 10));
        const startH = Number.isFinite(sh) ? sh : 0;
        const startM = Number.isFinite(sm) ? sm : 0;
        const startTotal = startH * 60 + startM;
        const endTotal = startTotal + durationHours * 60 + durationMinutes;
        const endH = Math.floor(endTotal / 60) % 24;
        const endM = endTotal % 60;
        const pad = (n: number) => String(n).padStart(2, "0");
        endTime = `${pad(endH)}:${pad(endM)}`;
      }



      const studentName = mockStudents.find((s) => s.id === selectedStudentId)?.name ?? "Leerling";
      
      const shouldRecur = !isPauseOrLeave && !editingId && recurrenceType !== "none";
      const recurringId = shouldRecur ? Math.random().toString(36).slice(2, 10) : undefined;

      if (shouldRecur) {
        const studentPackagesStr = await AsyncStorage.getItem(`student_packages_${studentName}`);
        const studentPackages = studentPackagesStr ? JSON.parse(studentPackagesStr) : [];
        
        const [pkgStr, prodStr] = await Promise.all([
          AsyncStorage.getItem("instructor_packages"),
          AsyncStorage.getItem("instructor_products"),
        ]);
        const pkgs = (pkgStr ? JSON.parse(pkgStr) : []) as { id: string; name: string; hours: number; price: number; vatStatus: "incl" | "excl" }[];
        const prods = (prodStr ? JSON.parse(prodStr) : []) as { id: string; name: string; price: number; vatStatus: "incl" | "excl" }[];
        const mappedPkgs = pkgs.map((p) => ({ id: p.id, name: p.name, hours: p.hours, price: p.price, vatStatus: p.vatStatus, isProduct: false }));
        const mappedProds = prods.map((p) => ({ id: p.id, name: p.name, hours: 0, price: p.price, vatStatus: p.vatStatus, isProduct: true }));
        const baseItems = [...mappedPkgs, ...mappedProds];
        const products = mappedProds;
        const productNames = new Set(products.map(p => p.name));

        const allLessons = Object.values(lessonsByDate).flat();
        const studentLessons = allLessons.filter((l) => (l.studentName ?? "") === studentName);

        let plannedMin = 0;
        let drivenMin = 0;
        const now = new Date();

        studentLessons.forEach((l) => {
          const mins = (durationHours * 60 + durationMinutes);
          const endDate = new Date(l.date);
          const [eh, em] = l.endTime.split(":").map((v) => parseInt(v, 10));
          endDate.setHours(Number.isFinite(eh) ? eh : 0, Number.isFinite(em) ? em : 0, 0, 0);

          const isProduct = l.lessonType && productNames.has(l.lessonType);

          if (endDate.getTime() > now.getTime()) {
            if (!isProduct) plannedMin += mins;
          } else {
            if (!isProduct) drivenMin += mins;
          }
        });

        const drivenHours = drivenMin / 60;
        const plannedHours = plannedMin / 60;

        const totalAddedHours = studentPackages.reduce((sum: number, sp: any) => {
          const baseItem = baseItems.find((p) => p.id === sp.packageId);
          const isProduct = baseItem?.isProduct === true;
          if (isProduct) return sum;
          const base = sp.customHours ?? (baseItem?.hours ?? 0);
          return sum + (base || 0);
        }, 0);

        const hoursPaid = studentPackages.reduce((sum: number, sp: any) => {
          const baseItem = baseItems.find((p) => p.id === sp.packageId);
          const isProduct = baseItem?.isProduct === true;
          if (isProduct) return sum;
          const baseHours = sp.customHours ?? (baseItem?.hours ?? 0);
          const total = baseHours || 0;
          const terms = sp.installments?.length ?? 0;
          if (terms === 0) return sum;
          const paidCount = sp.installments.filter((i: any) => i.paid).length;
          const fraction = total * (paidCount / terms);
          return sum + fraction;
        }, 0);

        const hoursOver = Math.max(0, totalAddedHours - drivenHours - plannedHours);

        let maxOccurrences = 0;
        if (recurrenceLimit.type === "count") {
          maxOccurrences = recurrenceLimit.value;
        } else if (recurrenceLimit.type === "remaining") {
          const lessonDurationInHours = durationHours + durationMinutes / 60;
          maxOccurrences = Math.floor(hoursOver / lessonDurationInHours);
        } else if (recurrenceLimit.type === "paid") {
          const remainingPaidHours = Math.max(0, hoursPaid - drivenHours);
          const lessonDurationInHours = durationHours + durationMinutes / 60;
          maxOccurrences = Math.floor(remainingPaidHours / lessonDurationInHours);
        }

        let currentDate = new Date(baseDate);
        for (let i = 0; i < maxOccurrences; i++) {
          addLesson({
            date: new Date(currentDate),
            startTime,
            endTime,
            studentName,
            lessonType: type,
            location: location ?? "",
            notes: notes ?? "",
            status: "Gepland",
            recurringId,
          });

          if (recurrenceType === "daily") {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (recurrenceType === "weekly") {
            currentDate.setDate(currentDate.getDate() + 7);
          } else if (recurrenceType === "monthly") {
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        }
      } else {
        if (editingId) {
          removeLessonById(editingId);
        }

        if (isPauseOrLeave) {
          addLesson({
            id: editingId ?? undefined,
            date: baseDate,
            startTime,
            endTime,
            studentName: category,
            lessonType: category,
            location: "",
            notes: notes ?? "",
            status: "Gepland",
          });
        } else {
          addLesson({
            id: editingId ?? undefined,
            date: baseDate,
            startTime,
            endTime,
            studentName,
            lessonType: type,
            location: location ?? "",
            notes: notes ?? "",
            status: "Gepland",
          });
        }
      }

      Alert.alert("Opgeslagen", isPauseOrLeave ? `${category} opgeslagen.` : editingId ? "De les is bijgewerkt." : "De les is opgeslagen.");
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Fout", "Er is een fout opgetreden bij het opslaan.");
    } finally {
      setIsLoading(false);
    }
  }, [addLesson, removeLessonById, editingId, category, type, selectedStudentId, selectedVehicleId, date, time, durationHours, durationMinutes, location, notes, isPauseOrLeave, isFullDay, workingHours, router, mockStudents, recurrenceType, recurrenceLimit, lessonsByDate]);

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: isPauseOrLeave ? `${category} toevoegen` : editingId ? "Les bewerken" : "Les toevoegen", headerRight: () => (
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Sluiten" style={styles.iconBtn}>
          <X color="#111827" size={20} />
        </TouchableOpacity>
      ) }} />

      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: "height", default: undefined })} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={[styles.container, { paddingTop: 8 + insets.top, paddingBottom: 16 + insets.bottom }]} testID="add-lesson-screen" keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <CategoryTypeSection
              selectedCategory={category}
              selectedAppointmentType={type}
              appointmentTypes={appointmentTypes.map((a) => a.value)}
              onCategoryChanged={(c) => setCategory(c)}
              onAppointmentTypeChanged={(t) => setType(t)}
              showAppointmentType={!isPauseOrLeave}
              testID="category-type"
            />
          </View>

          {!isPauseOrLeave && (
            <View style={styles.section}>
              <StudentVehicleSection
                students={mockStudents}
                vehicles={mockVehicles}
                selectedStudentId={selectedStudentId}
                selectedVehicleId={selectedVehicleId}
                onStudentSelected={(id) => setSelectedStudentId(id)}
                onVehicleSelected={(id) => setSelectedVehicleId(id)}
              />
            </View>
          )}

          <View style={styles.section}>
            <ScheduleSection
              selectedDate={date}
              selectedTime={time}
              lessonDurationHours={durationHours}
              lessonDurationMinutes={durationMinutes}
              location={location}
              onDateChanged={setDate}
              onTimeChanged={setTime}
              onDurationChanged={(h, m) => { setDurationHours(h); setDurationMinutes(m); }}
              onLocationChanged={setLocation}
              isFullDay={isFullDay}
              showLocationField={false}
              isPauseOrLeave={isPauseOrLeave}
              isVerlof={category === "Verlof"}
              onFullDayToggle={setIsFullDay}
              showRecurrence={!isPauseOrLeave && type === "Rijles" && !editingId}
              recurrenceType={recurrenceType}
              recurrenceLimit={recurrenceLimit}
              onRecurrenceTypeChanged={setRecurrenceType}
              onRecurrenceLimitChanged={setRecurrenceLimit}
            />
          </View>

          {!isPauseOrLeave && (
            <View style={styles.section}>
              <LocationSection location={location} onLocationChanged={setLocation} />
            </View>
          )}

          <View style={styles.section}>
            <NotesSection notes={notes} onNotesChanged={setNotes} />
          </View>

            <View style={{ height: 16 }} />
          </ScrollView>
        </TouchableWithoutFeedback>

        <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
          <TouchableOpacity testID="save-lesson" onPress={!isLoading ? onSave : undefined} style={[styles.saveBtn, isLoading && { opacity: 0.7 }]} activeOpacity={0.9}>
            {isLoading ? <Loader2 color="#fff" size={18} /> : <Check color="#fff" size={18} />}
            <Text style={styles.saveText}>{isLoading ? "Opslaan..." : isPauseOrLeave ? `${category} opslaan` : "Les opslaan"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  iconBtn: { padding: 8 },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb", backgroundColor: "#fff" },
  saveBtn: { height: 48, backgroundColor: "#2563eb", borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  saveText: { color: "#fff", fontWeight: "700" },
});
