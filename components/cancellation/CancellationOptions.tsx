import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

export interface CancellationOptionsProps {
  chargeCredit: boolean;
  notifyStudent: boolean;
  keepInAgenda: boolean;
  onChargeCreditChanged: (val: boolean) => void;
  onNotifyStudentChanged: (val: boolean) => void;
  onKeepInAgendaChanged: (val: boolean) => void;
}

export default function CancellationOptions({
  chargeCredit,
  notifyStudent,
  keepInAgenda,
  onChargeCreditChanged,
  onNotifyStudentChanged,
  onKeepInAgendaChanged,
}: CancellationOptionsProps) {
  return (
    <View style={styles.card} testID="cancellation-options">
      <Text style={styles.title}>Annuleringsopties</Text>

      <View style={styles.spacer} />

      <ToggleRow
        title="Tegoed doorberekenen"
        description="Kosten van de les doorberekenen aan student"
        value={chargeCredit}
        onChange={onChargeCreditChanged}
      />

      <View style={styles.rowGap} />

      <ToggleRow
        title="Leerling melden"
        description="Student automatisch informeren over annulering"
        value={notifyStudent}
        onChange={onNotifyStudentChanged}
      />

      <View style={styles.rowGap} />

      <ToggleRow
        title="Afspraak laten staan in agenda"
        value={keepInAgenda}
        onChange={onKeepInAgendaChanged}
      />

      {keepInAgenda && (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Voorbeeld agenda weergave:</Text>
          <View style={styles.previewPill}>
            <Text style={styles.previewText} numberOfLines={1}>
              Student Name • 10:00-11:00
            </Text>
            <Text style={styles.previewBadge}>GEANNULEERD</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function ToggleRow({ title, value, onChange, description }: { title: string; value: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Switch testID={`toggle-${title}`} value={value} onValueChange={onChange} thumbColor={value ? "#2563eb" : undefined} />
      </View>
      {!!description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
  },
  title: { fontSize: 16, fontWeight: "700" },
  spacer: { height: 8 },
  rowGap: { height: 12 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleTitle: { fontSize: 15, fontWeight: "600", flex: 1, paddingRight: 12 },
  description: { color: "#6b7280" },
  preview: {
    marginTop: 12,
    gap: 8,
    width: "100%",
  },
  previewLabel: { color: "#6b7280", fontWeight: "500" },
  previewPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 12,
  },
  previewText: { color: "#4b5563", textDecorationLine: "line-through", flex: 1 },
  previewBadge: { color: "#4b5563", fontWeight: "800" },
});
