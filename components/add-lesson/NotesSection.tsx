import React, { memo, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Plus, X, Lightbulb } from "lucide-react-native";

export interface NotesSectionProps {
  notes: string;
  onNotesChanged: (value: string) => void;
  testID?: string;
}

function NotesSectionComponent({ notes, onNotesChanged, testID }: NotesSectionProps) {
  const templates = useMemo(() => [
    { title: "Focus op parkeren", content: "Focus op parkeren en manoeuvreren in krappe ruimtes. Oefening met achteruitrijden." },
    { title: "Snelweg rijden", content: "Oefening met snelweg rijden, invoegen en uitvoegen. Rijstroken wisselen." },
    { title: "Stadsverkeer", content: "Navigatie in druk stadsverkeer. Aandacht voor voetgangers en fietsers." },
    { title: "Voorrang regels", content: "Herhaling van voorrangsregels en verkeerstekens. Praktische toepassing." },
    { title: "Examen voorbereiding", content: "Laatste voorbereiding voor het praktijkexamen. Controle van alle rijvaardigheden." },
  ], []);

  const [expanded, setExpanded] = useState<boolean>(false);
  useEffect(() => { setExpanded(notes.length > 0); }, [notes]);

  const insertTemplate = (content: string) => {
    const next = notes ? `${notes}\n\n${content}` : content;
    onNotesChanged(next);
    setExpanded(true);
  };

  return (
    <View style={styles.container} testID={testID ?? "notes-section"}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.title}>Notitie</Text>
        {!expanded && (
          <Pressable onPress={() => setExpanded(true)} style={styles.addBtn} accessibilityRole="button" testID="expand-notes">
            <Plus size={16} color="#2563eb" />
            <Text style={styles.addText}>Toevoegen</Text>
          </Pressable>
        )}
      </View>

      {expanded && (
        <View style={{ gap: 12 }}>
          <TextInput
            style={styles.textarea}
            multiline
            placeholder={"Voeg notities toe over deze les...\n\nBijvoorbeeld:\n• Leerdoelen voor deze les\n• Specifieke oefeningen\n• Aandachtspunten voor de leerling"}
            value={notes}
            onChangeText={onNotesChanged}
            testID="notes-input"
          />

          <View style={styles.rowBetween}>
            <Text style={styles.counter}>{notes.length} karakters</Text>
            {/* Simple inline templates instead of a modal */}
          </View>

          <View style={styles.templateWrap}>
            {templates.slice(0, 3).map((t) => (
              <Pressable key={t.title} onPress={() => insertTemplate(t.content)} style={styles.templateBtn} accessibilityRole="button" testID={`template-${t.title}`}>
                <Plus size={14} color="#2563eb" />
                <Text style={styles.templateText}>{t.title}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.tip}>
            <Lightbulb size={16} color="#2563eb" />
            <Text style={styles.tipText}>{"Tips voor goede notities:\n• Specifieke leerdoelen voor deze les\n• Voortgang en sterke punten van de leerling\n• Aandachtspunten voor volgende lessen"}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export const NotesSection = memo(NotesSectionComponent);

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  addBtn: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: "#eef2ff" },
  addText: { color: "#2563eb", fontWeight: "600" },
  textarea: { minHeight: 120, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", textAlignVertical: "top" },
  counter: { color: "#6b7280" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  templateWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  templateBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#93c5fd" },
  templateText: { color: "#2563eb", fontWeight: "600" },
  tip: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tipText: { color: "#6b7280", lineHeight: 18 },
});
