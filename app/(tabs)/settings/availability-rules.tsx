import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import { Save, Calendar, Clock, Bell, Shield, Zap } from "lucide-react-native";

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
      <Stack.Screen options={{ 
        title: "Beschikbaarheid regels",
        headerStyle: { backgroundColor: "#fff" },
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity onPress={save} style={styles.headerBtn}>
            <Save size={22} color="#0ea5e9" strokeWidth={2.5} />
          </TouchableOpacity>
        ) 
      }} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <SectionCard 
          icon={Shield} 
          iconColor="#ef4444" 
          iconBg="#fee2e2" 
          title="Automatische Blokkering"
          description="Beheer automatische agenda blokkades"
        >
          <SwitchRow label="Feestdagen blokkeren" value={holidayBlocking} onChange={setHolidayBlocking} />
          {holidayBlocking && (
            <View style={styles.nestedSection}>
              <CheckRow label="Nationale feestdagen" value={national} onChange={setNational} />
              <CheckRow label="Regionale feestdagen" value={regional} onChange={setRegional} />
            </View>
          )}
          <View style={styles.divider} />
          <SwitchRow label="Weer-gerelateerde annuleringen" value={weatherCancel} onChange={setWeatherCancel} />
          {weatherCancel && (
            <View style={styles.nestedSection}>
              <Text style={styles.label}>Selecteer weersomstandigheden:</Text>
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
          <View style={styles.divider} />
          <SwitchRow label="Terugkerende onbeschikbaarheid" value={recurringUnavailable} onChange={setRecurringUnavailable} />
        </SectionCard>

        <SectionCard 
          icon={Calendar} 
          iconColor="#3b82f6" 
          iconBg="#dbeafe" 
          title="Boekingsregels"
          description="Stel boeking voorwaarden in"
        >
          <AdvanceRow label="Reguliere leerlingen" days={regularDays} setDays={setRegularDays} />
          <View style={styles.divider} />
          <AdvanceRow label="Nieuwe leerlingen" days={newDays} setDays={setNewDays} />
          <View style={styles.divider} />
          <SwitchRow label="Automatische goedkeuring" value={autoApprove} onChange={setAutoApprove} />
          {autoApprove && (
            <View style={styles.nestedSection}>
              <AdvanceRow label="Min. lessen voor auto-goedkeuring" unit="lessen" max={50} days={historyThreshold} setDays={setHistoryThreshold} />
            </View>
          )}
          <View style={styles.divider} />
          <SwitchRow label="Spitsuur prijsverhogingen" value={peakPricing} onChange={setPeakPricing} />
          {peakPricing && (
            <View style={styles.nestedSection}>
              <CounterRow label="Spitsuur vermenigvuldiger" suffix="x" value={peakMultiplier} setValue={setPeakMultiplier} min={1} max={3} step={0.05} />
            </View>
          )}
        </SectionCard>

        <SectionCard 
          icon={Clock} 
          iconColor="#8b5cf6" 
          iconBg="#ede9fe" 
          title="Buffer Beheer"
          description="Optimaliseer tijd tussen lessen"
        >
          <SwitchRow label="Intelligente tussenpozen" value={intelligentSpacing} onChange={setIntelligentSpacing} />
          {intelligentSpacing && (
            <View style={styles.nestedSection}>
              <AdvanceRow label="Buffer na praktijkles" unit="min" max={60} days={practicalBuffer} setDays={setPracticalBuffer} />
              <View style={styles.dividerSmall} />
              <AdvanceRow label="Buffer na theorieles" unit="min" max={60} days={theoryBuffer} setDays={setTheoryBuffer} />
            </View>
          )}
          <View style={styles.divider} />
          <SwitchRow label="Reistijd berekening" value={travelTime} onChange={setTravelTime} />
          <View style={styles.divider} />
          <SwitchRow label="Noodsituatie slots" value={emergencySlots} onChange={setEmergencySlots} />
          {emergencySlots && (
            <View style={styles.nestedSection}>
              <AdvanceRow label="Noodslots per week" unit="slots" max={10} days={emergencyPerWeek} setDays={setEmergencyPerWeek} />
            </View>
          )}
        </SectionCard>

        <SectionCard 
          icon={Bell} 
          iconColor="#f59e0b" 
          iconBg="#fef3c7" 
          title="Notificatie Automatisering"
          description="Beheer automatische meldingen"
        >
          <SwitchRow label="Planningswijzigingen" value={notifyChanges} onChange={setNotifyChanges} />
          <View style={styles.divider} />
          <SwitchRow label="Beschikbaarheid updates" value={notifyAvailability} onChange={setNotifyAvailability} />
          <View style={styles.divider} />
          <SwitchRow label="Boekingsbevestigingen" value={notifyConfirmations} onChange={setNotifyConfirmations} />
        </SectionCard>

        <SectionCard 
          icon={Zap} 
          iconColor="#22c55e" 
          iconBg="#dcfce7" 
          title="Regelvoorbeeldweek"
          description="Preview van actieve regels"
        >
          <View style={styles.previewList}>
            <PreviewRow color="#ef4444" text="Koningsdag (27 april) geblokkeerd" />
            <PreviewRow color="#8b5cf6" text={`${practicalBuffer}min buffer na praktijklessen`} />
            <PreviewRow color="#22c55e" text="Automatische bevestigingen verstuurd" />
            <PreviewRow color="#3b82f6" text={`Reguliere leerlingen ${regularDays} dagen vooruit`} />
          </View>
        </SectionCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SectionCard({ icon: Icon, iconColor, iconBg, title, description, children }: { 
  icon: React.ComponentType<any>; 
  iconColor: string; 
  iconBg: string; 
  title: string; 
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Icon size={20} color={iconColor} strokeWidth={2.5} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity 
      accessibilityRole="switch" 
      onPress={() => onChange(!value)} 
      style={styles.switchRow}
      activeOpacity={0.7}
    >
      <Text style={styles.itemTitle}>{label}</Text>
      <View style={[styles.switchContainer, value && styles.switchContainerOn]}>
        <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

function CheckRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity 
      accessibilityRole="checkbox" 
      onPress={() => onChange(!value)} 
      style={styles.checkboxRow}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <View style={styles.checkmark} />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function AdvanceRow({ label, days, setDays, unit = "dagen", max = 30 }: { label: string; days: number; setDays: (n: number) => void; unit?: string; max?: number }) {
  return (
    <View style={styles.advanceContainer}>
      <View style={styles.advanceHeader}>
        <Text style={styles.itemTitle}>{label}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{days} {unit}</Text>
        </View>
      </View>
      <View style={styles.sliderWrap}>
        <TouchableOpacity 
          accessibilityRole="button" 
          onPress={() => setDays(Math.max(1, days - 1))} 
          style={styles.stepBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.stepTxt}>−</Text>
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(days / max) * 100}%` }]} />
          <Text style={styles.progressText}>{days}</Text>
        </View>
        <TouchableOpacity 
          accessibilityRole="button" 
          onPress={() => setDays(Math.min(max, days + 1))} 
          style={styles.stepBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.stepTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CounterRow({ label, suffix, value, setValue, min, max, step }: { label: string; suffix?: string; value: number; setValue: (n: number) => void; min: number; max: number; step: number }) {
  return (
    <View style={styles.advanceContainer}>
      <Text style={styles.itemTitle}>{label}</Text>
      <View style={styles.sliderWrap}>
        <TouchableOpacity 
          accessibilityRole="button" 
          onPress={() => setValue(Math.max(min, Number((value - step).toFixed(2))))} 
          style={styles.stepBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.stepTxt}>−</Text>
        </TouchableOpacity>
        <View style={styles.counterValue}>
          <Text style={styles.counterValueText}>{value.toFixed(2)}{suffix ?? ""}</Text>
        </View>
        <TouchableOpacity 
          accessibilityRole="button" 
          onPress={() => setValue(Math.min(max, Number((value + step).toFixed(2))))} 
          style={styles.stepBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.stepTxt}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PreviewRow({ color, text }: { color: string; text: string }) {
  return (
    <View style={styles.previewRow}>
      <View style={[styles.previewDot, { backgroundColor: color }]} />
      <Text style={[styles.previewText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 16, gap: 16, paddingBottom: 100 },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#fafbfc",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionDescription: { 
    fontSize: 13, 
    color: "#64748b",
    fontWeight: "500",
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },

  itemTitle: { 
    fontSize: 15, 
    fontWeight: "600",
    color: "#1e293b",
  },
  label: { 
    color: "#64748b", 
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },

  switchRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  switchContainer: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: "#cbd5e1",
    padding: 2,
    justifyContent: "center",
  },
  switchContainerOn: {
    backgroundColor: "#22c55e",
  },
  switchThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  switchThumbOn: {
    alignSelf: "flex-end",
  },

  checkboxRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10,
    paddingVertical: 6,
  },
  checkbox: { 
    width: 22, 
    height: 22, 
    borderRadius: 6, 
    borderWidth: 2, 
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { 
    backgroundColor: "#0ea5e9", 
    borderColor: "#0ea5e9",
  },
  checkmark: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  checkboxLabel: { 
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },

  advanceContainer: {
    gap: 10,
  },
  advanceHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
  },
  badge: { 
    backgroundColor: "#dbeafe", 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
  },
  badgeText: { 
    color: "#0369a1", 
    fontWeight: "700",
    fontSize: 13,
  },

  sliderWrap: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12,
  },
  stepBtn: { 
    backgroundColor: "#f8fafc", 
    width: 40,
    height: 40,
    borderRadius: 10, 
    borderWidth: 1.5, 
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTxt: { 
    fontSize: 20, 
    fontWeight: "700",
    color: "#475569",
  },

  progressTrack: {
    flex: 1,
    height: 40,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#dbeafe",
    borderRadius: 10,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0369a1",
    zIndex: 1,
  },

  counterValue: {
    flex: 1,
    height: 40,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  counterValueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0369a1",
  },

  chip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: "#f8fafc", 
    borderWidth: 1.5, 
    borderColor: "#e2e8f0",
  },
  chipOn: { 
    backgroundColor: "#dbeafe", 
    borderColor: "#0ea5e9",
  },
  chipText: { 
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextOn: { 
    color: "#0369a1", 
    fontWeight: "700",
  },
  wrap: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 8,
  },

  nestedSection: {
    gap: 10,
    paddingLeft: 12,
    paddingTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 4,
  },
  dividerSmall: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },

  previewList: {
    gap: 12,
  },
  previewRow: {
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10,
    paddingVertical: 2,
  },
  previewDot: {
    width: 10, 
    height: 10, 
    borderRadius: 5,
  },
  previewText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  primaryBtn: { 
    backgroundColor: "#0ea5e9", 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnText: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 16,
  },
});
