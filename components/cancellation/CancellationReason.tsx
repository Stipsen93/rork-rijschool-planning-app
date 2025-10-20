import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export interface CancellationReasonProps {
  selectedReason?: string | null;
  onReasonChanged: (reason: string | null) => void;
}

const REASONS = [
  "Instructeur ziek",
  "Leerling ziek",
  "Te laat afgezegd",
  "Leerling afwezig",
  "Overmacht",
  "Overige reden",
] as const;

export default function CancellationReason({ selectedReason, onReasonChanged }: CancellationReasonProps) {
  const [open, setOpen] = useState<boolean>(false);

  const display = useMemo(() => selectedReason ?? "Selecteer een reden (optioneel)", [selectedReason]);

  return (
    <View style={styles.card} testID="cancellation-reason">
      <Text style={styles.title}>Reden annulering (optioneel)</Text>
      <Pressable
        style={styles.selector}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        testID="open-reason-selector"
      >
        <Text style={[styles.selectorText, !selectedReason && { color: "#6b7280" }]} numberOfLines={1}>
          {display}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View />
        </Pressable>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Kies een reden</Text>
          <Pressable
            style={styles.option}
            onPress={() => {
              onReasonChanged(null);
              setOpen(false);
            }}
            testID="reason-none"
          >
            <Text style={styles.optionText}>Geen reden opgegeven</Text>
          </Pressable>
          {REASONS.map((r) => (
            <Pressable
              key={r}
              style={styles.option}
              onPress={() => {
                onReasonChanged(r);
                setOpen(false);
              }}
              testID={`reason-${r}`}
            >
              <Text style={styles.optionText}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
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
  selector: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  selectorText: { fontSize: 15, color: "#111827" },
  backdrop: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" as unknown as string },
  sheet: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 100,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
  },
  sheetTitle: { fontWeight: "700", fontSize: 16, marginBottom: 8 },
  option: { paddingVertical: 10 },
  optionText: { fontSize: 15 },
});
