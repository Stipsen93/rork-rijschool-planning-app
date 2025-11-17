import React, { useEffect } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import { Save } from "lucide-react-native";
import { useStudentConfig } from "@/components/settings/StudentConfigStore";

function useSliderState(initial: number) {
  const [value, setValue] = React.useState<number>(initial);
  return { value, setValue } as const;
}

export default function StudentConfigurationScreen() {
  const { studentConfig, updateStudentConfig } = useStudentConfig();

  const maxPerWeek = useSliderState(studentConfig.maxPerWeek);
  const maxPerDay = useSliderState(studentConfig.maxPerDay);
  const consecutive = useSliderState(studentConfig.consecutive);
  const advanceDays = useSliderState(studentConfig.advanceDays);
  const cancellationHours = useSliderState(studentConfig.cancellationHours);
  const reminderHours = useSliderState(studentConfig.reminderHours);

  const [allowWeekend, setAllowWeekend] = React.useState<boolean>(studentConfig.allowWeekend);
  const [requireParentApproval, setRequireParentApproval] = React.useState<boolean>(studentConfig.requireParentApproval);
  const [allowStudentCancellation, setAllowStudentCancellation] = React.useState<boolean>(studentConfig.allowStudentCancellation);
  const [penaltyLate, setPenaltyLate] = React.useState<boolean>(studentConfig.penaltyLate);
  const [penaltyAmount, setPenaltyAmount] = React.useState<number>(studentConfig.penaltyAmount);
  const [requirePaymentBefore, setRequirePaymentBefore] = React.useState<boolean>(studentConfig.requirePaymentBefore);
  const [allowPaymentPlans, setAllowPaymentPlans] = React.useState<boolean>(studentConfig.allowPaymentPlans);
  const maxUnpaid = useSliderState(studentConfig.maxUnpaid);
  const [sendReminders, setSendReminders] = React.useState<boolean>(studentConfig.sendReminders);
  const [sendReports, setSendReports] = React.useState<boolean>(studentConfig.sendReports);
  const [allowDirectContact, setAllowDirectContact] = React.useState<boolean>(studentConfig.allowDirectContact);

  useEffect(() => {
    maxPerWeek.setValue(studentConfig.maxPerWeek);
    maxPerDay.setValue(studentConfig.maxPerDay);
    consecutive.setValue(studentConfig.consecutive);
    advanceDays.setValue(studentConfig.advanceDays);
    cancellationHours.setValue(studentConfig.cancellationHours);
    reminderHours.setValue(studentConfig.reminderHours);
    setAllowWeekend(studentConfig.allowWeekend);
    setRequireParentApproval(studentConfig.requireParentApproval);
    setAllowStudentCancellation(studentConfig.allowStudentCancellation);
    setPenaltyLate(studentConfig.penaltyLate);
    setPenaltyAmount(studentConfig.penaltyAmount);
    setRequirePaymentBefore(studentConfig.requirePaymentBefore);
    setAllowPaymentPlans(studentConfig.allowPaymentPlans);
    maxUnpaid.setValue(studentConfig.maxUnpaid);
    setSendReminders(studentConfig.sendReminders);
    setSendReports(studentConfig.sendReports);
    setAllowDirectContact(studentConfig.allowDirectContact);
  }, [studentConfig]);

  const save = async () => {
    console.log("[StudentConfig] Save tapped");
    await updateStudentConfig({
      maxPerWeek: maxPerWeek.value,
      maxPerDay: maxPerDay.value,
      consecutive: consecutive.value,
      advanceDays: advanceDays.value,
      allowWeekend,
      requireParentApproval,
      allowStudentCancellation,
      cancellationHours: cancellationHours.value,
      penaltyLate,
      penaltyAmount,
      requirePaymentBefore,
      allowPaymentPlans,
      maxUnpaid: maxUnpaid.value,
      sendReminders,
      reminderHours: reminderHours.value,
      sendReports,
      allowDirectContact,
    });
    Alert.alert("Opgeslagen", "Leerling configuratie opgeslagen");
  };

  return (
    <View style={styles.screen} testID="student-config-screen">
      <Stack.Screen options={{ title: "Leerling Configuratie", headerRight: () => (
        <TouchableOpacity onPress={save} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
          <Save color="#0ea5e9" />
        </TouchableOpacity>
      ) }} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Boekingslimieten</Text>
        <View style={styles.card}>
          <SliderRow label="Maximale lessen per week" unit="lessen" state={maxPerWeek} min={1} max={10} />
          <SliderRow label="Maximale lessen per dag" unit="lessen" state={maxPerDay} min={1} max={5} />
          <SliderRow label="Opeenvolgende lessen" unit="lessen" state={consecutive} min={1} max={3} />
        </View>

        <Text style={styles.sectionTitle}>Vooruitboeken</Text>
        <View style={styles.card}>
          <SliderRow label="Hoeveel dagen vooruit boeken" unit="dagen" state={advanceDays} min={1} max={30} />
          <SwitchRow label="Weekend boekingen toestaan" value={allowWeekend} onChange={setAllowWeekend} />
          <SwitchRow label="Ouderlijke goedkeuring vereist" value={requireParentApproval} onChange={setRequireParentApproval} />
        </View>

        <Text style={styles.sectionTitle}>Annuleringsbeleid</Text>
        <View style={styles.card}>
          <SwitchRow label="Leerlingen mogen annuleren" value={allowStudentCancellation} onChange={setAllowStudentCancellation} />
          {allowStudentCancellation && (
            <>
              <SliderRow label="Annuleringstermijn" unit="uur" state={cancellationHours} min={2} max={72} />
              <SwitchRow label="Boete voor late annulering" value={penaltyLate} onChange={setPenaltyLate} />
              {penaltyLate && (
                <CounterRow label="Boete bedrag" prefix="€" value={penaltyAmount} setValue={setPenaltyAmount} step={1} min={0} max={500} />
              )}
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Betalingsinstellingen</Text>
        <View style={styles.card}>
          <SwitchRow label="Vooruitbetaling verplicht" value={requirePaymentBefore} onChange={setRequirePaymentBefore} />
          <SwitchRow label="Betalingsplannen toestaan" value={allowPaymentPlans} onChange={setAllowPaymentPlans} />
          <SliderRow label="Max. onbetaalde lessen" unit="lessen" state={maxUnpaid} min={0} max={10} />
        </View>

        <Text style={styles.sectionTitle}>Communicatie Voorkeuren</Text>
        <View style={styles.card}>
          <SwitchRow label="Herinneringsnotificaties" value={sendReminders} onChange={setSendReminders} />
          {sendReminders && (
            <SliderRow label="Herinneringstijd" unit="uur" state={reminderHours} min={1} max={24} />
          )}
          <SwitchRow label="Voortgangsrapporten" value={sendReports} onChange={setSendReports} />
          <SwitchRow label="Direct contact toestaan" value={allowDirectContact} onChange={setAllowDirectContact} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

type SliderState = { value: number; setValue: (n: number) => void };

function SliderRow({ label, unit, state, min, max }: { label: string; unit: string; state: SliderState; min: number; max: number }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.rowBetween}>
        <Text style={styles.itemTitle}>{label}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{state.value} {unit}</Text></View>
      </View>
      <View style={styles.sliderWrap}>
        <TouchableOpacity accessibilityRole="button" onPress={() => state.setValue(Math.max(min, state.value - 1))} style={styles.stepBtn}><Text style={styles.stepTxt}>-</Text></TouchableOpacity>
        <Text style={styles.sliderValue}>{state.value}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => state.setValue(Math.min(max, state.value + 1))} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity accessibilityRole="switch" onPress={() => onChange(!value)} style={styles.switchRow}>
      <Text style={styles.itemTitle}>{label}</Text>
      <View style={[styles.switchKnob, value && styles.switchOn]} />
    </TouchableOpacity>
  );
}

function CounterRow({ label, prefix, value, setValue, step, min, max }: { label: string; prefix?: string; value: number; setValue: (n: number) => void; step: number; min: number; max: number }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.itemTitle}>{label}</Text>
      <View style={styles.counterRow}>
        <TouchableOpacity accessibilityRole="button" onPress={() => setValue(Math.max(min, value - step))} style={styles.stepBtn}><Text style={styles.stepTxt}>-</Text></TouchableOpacity>
        <Text style={styles.sliderValue}>{prefix ?? ""} {value.toFixed(2)}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => setValue(Math.min(max, value + step))} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fb" },
  container: { padding: 16, gap: 12, paddingBottom: 120 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemTitle: { fontSize: 16, fontWeight: "600" },
  badge: { backgroundColor: "#e0f2fe", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  badgeText: { color: "#0369a1", fontWeight: "700" },
  sliderWrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sliderValue: { fontSize: 16, fontWeight: "700" },
  stepBtn: { backgroundColor: "#f1f5f9", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  stepTxt: { fontSize: 18, fontWeight: "700" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  switchKnob: { width: 38, height: 24, borderRadius: 12, backgroundColor: "#cbd5e1" },
  switchOn: { backgroundColor: "#22c55e" },
  counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
