import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import { Save } from "lucide-react-native";

export default function AvailabilityRulesScreen() {
  const [holidayBlocking, setHolidayBlocking] = React.useState<boolean>(true);
  const [national, setNational] = React.useState<boolean>(true);
  const [regional, setRegional] = React.useState<boolean>(false);
  const [weatherCancel, setWeatherCancel] = React.useState<boolean>(false);
  const [selectedWeather, setSelectedWeather] = React.useState<string[]>([]);
  const [recurringUnavailable, setRecurringUnavailable] = React.useState<boolean>(false);

  const [regularDays, setRegularDays] = React.useState<number>(14);
  const [newDays, setNewDays] = React.useState<number>(7);
  const [autoApprove, setAutoApprove] = React.useState<boolean>(true);
  const [historyThreshold, setHistoryThreshold] = React.useState<number>(5);
  const [peakPricing, setPeakPricing] = React.useState<boolean>(false);
  const [peakMultiplier, setPeakMultiplier] = React.useState<number>(1.25);

  const [intelligentSpacing, setIntelligentSpacing] = React.useState<boolean>(true);
  const [practicalBuffer, setPracticalBuffer] = React.useState<number>(15);
  const [theoryBuffer, setTheoryBuffer] = React.useState<number>(10);
  const [travelTime, setTravelTime] = React.useState<boolean>(false);
  const [emergencySlots, setEmergencySlots] = React.useState<boolean>(true);
  const [emergencyPerWeek, setEmergencyPerWeek] = React.useState<number>(2);

  const [notifyChanges, setNotifyChanges] = React.useState<boolean>(true);
  const [notifyAvailability, setNotifyAvailability] = React.useState<boolean>(false);
  const [notifyConfirmations, setNotifyConfirmations] = React.useState<boolean>(true);

  const weatherOptions = React.useMemo(() => ["Zware regen", "Sneeuwval", "Dichte mist", "Storm", "IJzel"] as const, []);

  const save = () => {
    console.log("[AvailabilityRules] Save tapped");
    Alert.alert("Opgeslagen", "Beschikbaarheidsregels opgeslagen");
  };

  return (
    <View style={styles.screen} testID="availability-rules-screen">
      <Stack.Screen options={{ title: "Beschikbaarheid regels", headerRight: () => (
        <TouchableOpacity onPress={save} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
          <Save color="#0ea5e9" />
        </TouchableOpacity>
      ) }} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Automatische Blokkering</Text>
        <View style={styles.card}>
          <SwitchRow label="Feestdagen blokkeren" value={holidayBlocking} onChange={setHolidayBlocking} />
          {holidayBlocking && (
            <View style={{ gap: 6 }}>
              <CheckRow label="Nationale feestdagen" value={national} onChange={setNational} />
              <CheckRow label="Regionale feestdagen" value={regional} onChange={setRegional} />
            </View>
          )}
          <SwitchRow label="Weer-gerelateerde annuleringen" value={weatherCancel} onChange={setWeatherCancel} />
          {weatherCancel && (
            <View style={{ gap: 6 }}>
              <Text style={styles.muted}>Selecteer weersomstandigheden:</Text>
              <View style={styles.wrap}>
                {weatherOptions.map((w) => {
                  const selected = selectedWeather.includes(w);
                  return (
                    <TouchableOpacity key={w} onPress={() => setSelectedWeather((prev) => selected ? prev.filter((x) => x !== w) : [...prev, w])} style={[styles.chip, selected && styles.chipOn]}>
                      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{w}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          <SwitchRow label="Terugkerende onbeschikbaarheid" value={recurringUnavailable} onChange={setRecurringUnavailable} />
        </View>

        <Text style={styles.sectionTitle}>Boekingsregels</Text>
        <View style={styles.card}>
          <AdvanceRow label="Reguliere leerlingen" days={regularDays} setDays={setRegularDays} />
          <AdvanceRow label="Nieuwe leerlingen" days={newDays} setDays={setNewDays} />
          <SwitchRow label="Automatische goedkeuring" value={autoApprove} onChange={setAutoApprove} />
          {autoApprove && (
            <AdvanceRow label="Min. lessen voor auto-goedkeuring" unit="lessen" max={50} days={historyThreshold} setDays={setHistoryThreshold} />
          )}
          <SwitchRow label="Spitsuur prijsverhogingen" value={peakPricing} onChange={setPeakPricing} />
          {peakPricing && (
            <CounterRow label="Spitsuur vermenigvuldiger" suffix="x" value={peakMultiplier} setValue={setPeakMultiplier} min={1} max={3} step={0.05} />
          )}
        </View>

        <Text style={styles.sectionTitle}>Buffer Beheer</Text>
        <View style={styles.card}>
          <SwitchRow label="Intelligente tussenpozen" value={intelligentSpacing} onChange={setIntelligentSpacing} />
          {intelligentSpacing && (
            <View style={{ gap: 8 }}>
              <AdvanceRow label="Buffer na praktijkles" unit="min" max={60} days={practicalBuffer} setDays={setPracticalBuffer} />
              <AdvanceRow label="Buffer na theorieles" unit="min" max={60} days={theoryBuffer} setDays={setTheoryBuffer} />
            </View>
          )}
          <SwitchRow label="Reistijd berekening" value={travelTime} onChange={setTravelTime} />
          <SwitchRow label="Noodsituatie slots" value={emergencySlots} onChange={setEmergencySlots} />
          {emergencySlots && (
            <AdvanceRow label="Noodslots per week" unit="slots" max={10} days={emergencyPerWeek} setDays={setEmergencyPerWeek} />
          )}
        </View>

        <Text style={styles.sectionTitle}>Notificatie Automatisering</Text>
        <View style={styles.card}>
          <SwitchRow label="Planningswijzigingen" value={notifyChanges} onChange={setNotifyChanges} />
          <SwitchRow label="Beschikbaarheid updates" value={notifyAvailability} onChange={setNotifyAvailability} />
          <SwitchRow label="Boekingsbevestigingen" value={notifyConfirmations} onChange={setNotifyConfirmations} />
        </View>

        <Text style={styles.sectionTitle}>Regelvoorbeeldweek</Text>
        <View style={[styles.card, { backgroundColor: "#f8fafc" }]}>
          <PreviewRow color="#ef4444" text="Koningsdag (27 april) geblokkeerd" />
          <PreviewRow color="#0ea5e9" text={`${practicalBuffer}min buffer na praktijklessen`} />
          <PreviewRow color="#22c55e" text="Automatische bevestigingen verstuurd" />
          <PreviewRow color="#3b82f6" text={`Reguliere leerlingen ${regularDays} dagen vooruit`} />
        </View>

        <TouchableOpacity onPress={save} style={styles.primaryBtn} testID="save-rules">
          <Text style={styles.primaryBtnText}>Beschikbaarheidsregels Opslaan</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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

function CheckRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity accessibilityRole="checkbox" onPress={() => onChange(!value)} style={styles.checkboxRow}>
      <View style={[styles.checkbox, value && styles.checkboxChecked]} />
      <Text style={{ fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function AdvanceRow({ label, days, setDays, unit = "dagen", max = 30 }: { label: string; days: number; setDays: (n: number) => void; unit?: string; max?: number }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.rowBetween}>
        <Text style={styles.itemTitle}>{label}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{days} {unit}</Text></View>
      </View>
      <View style={styles.sliderWrap}>
        <TouchableOpacity accessibilityRole="button" onPress={() => setDays(Math.max(1, days - 1))} style={styles.stepBtn}><Text style={styles.stepTxt}>-</Text></TouchableOpacity>
        <Text style={styles.sliderValue}>{days}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => setDays(Math.min(max, days + 1))} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function CounterRow({ label, suffix, value, setValue, min, max, step }: { label: string; suffix?: string; value: number; setValue: (n: number) => void; min: number; max: number; step: number }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.itemTitle}>{label}</Text>
      <View style={styles.sliderWrap}>
        <TouchableOpacity accessibilityRole="button" onPress={() => setValue(Math.max(min, Number((value - step).toFixed(2))))} style={styles.stepBtn}><Text style={styles.stepTxt}>-</Text></TouchableOpacity>
        <Text style={styles.sliderValue}>{value.toFixed(2)}{suffix ?? ""}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => setValue(Math.min(max, Number((value + step).toFixed(2))))} style={styles.stepBtn}><Text style={styles.stepTxt}>+</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function PreviewRow({ color, text }: { color: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color }}>{text}</Text>
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
  itemTitle: { fontSize: 16, fontWeight: "600" },
  muted: { color: "#6b7280", fontSize: 12 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  switchKnob: { width: 38, height: 24, borderRadius: 12, backgroundColor: "#cbd5e1" },
  switchOn: { backgroundColor: "#22c55e" },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: "#94a3b8" },
  checkboxChecked: { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { backgroundColor: "#e0f2fe", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  badgeText: { color: "#0369a1", fontWeight: "700" },
  sliderWrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sliderValue: { fontSize: 16, fontWeight: "700" },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0" },
  chipOn: { backgroundColor: "#e0f2fe", borderColor: "#bae6fd" },
  chipText: { color: "#334155" },
  chipTextOn: { color: "#0369a1", fontWeight: "700" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  primaryBtn: { backgroundColor: "#0ea5e9", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  stepBtn: { backgroundColor: "#f1f5f9", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  stepTxt: { fontSize: 18, fontWeight: "700" },
});
