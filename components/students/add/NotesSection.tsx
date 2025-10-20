import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { NotebookPen } from "lucide-react-native";

export function NotesSection({ value, onChange }: { value: string; onChange: (v: string) => void; }) {
  const [text, setText] = useState<string>(value ?? "");
  useEffect(() => setText(value ?? ""), [value]);
  useEffect(() => onChange(text), [text, onChange]);

  return (
    <View style={styles.card} testID="notes-section">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <NotebookPen color="#2f95dc" />
        <Text style={styles.title}>Notities</Text>
      </View>
      <Text style={styles.hint}>Eerste observaties, speciale vereisten, leerdoelen</Text>
      <TextInput
        testID="notes-input"
        style={styles.textArea}
        value={text}
        onChangeText={setText}
        placeholder="Voer notities in..."
        multiline
        maxLength={500}
      />
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.counter}>{text.length}/500</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  title: { fontWeight: "700", color: "#2f95dc" },
  hint: { color: "#6b7280", fontSize: 12 },
  textArea: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, minHeight: 120, textAlignVertical: "top" as const },
  counter: { fontSize: 12, color: "#9ca3af" },
});