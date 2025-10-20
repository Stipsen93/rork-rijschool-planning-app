import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export interface NotesInputProps {
  value: string;
  onChangeText: (val: string) => void;
}

export default function NotesInput({ value, onChangeText }: NotesInputProps) {
  return (
    <View style={styles.card} testID="cancellation-notes-card">
      <Text style={styles.title}>Notitie</Text>
      <TextInput
        testID="notes-input"
        style={styles.input}
        placeholder="Voeg eventuele notities toe over de annulering..."
        placeholderTextColor="#6b7280"
        multiline
        value={value}
        onChangeText={onChangeText}
      />
      <Text style={styles.counter}>{value.length} karakters</Text>
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
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: "700" },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    minHeight: 110,
    textAlignVertical: "top",
    color: "#111827",
  },
  counter: { alignSelf: "flex-end", color: "#6b7280", fontSize: 12 },
});
