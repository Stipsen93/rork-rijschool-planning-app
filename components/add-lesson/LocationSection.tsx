import React, { memo, useEffect, useMemo, useState } from "react";
import { FlatList, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MapPin, LocateFixed, Info, X } from "lucide-react-native";

export interface LocationSectionProps {
  location: string;
  onLocationChanged: (value: string) => void;
  testID?: string;
}

function LocationSectionComponent({ location, onLocationChanged, testID }: LocationSectionProps) {
  const suggestions = useMemo<string[]>(() => [
    "Rijschool Amsterdam - Hoofdlocatie",
    "Amsterdam Centraal Station",
    "Dam Square, Amsterdam",
    "Vondelpark, Amsterdam",
    "Schiphol Airport",
    "Amsterdam Zuid Station",
    "Bijlmermeer, Amsterdam",
  ], []);

  const [query, setQuery] = useState<string>(location);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [filtered, setFiltered] = useState<string[]>(suggestions);

  useEffect(() => { setQuery(location); }, [location]);

  const filter = (q: string) => {
    const f = q.trim().length === 0 ? suggestions : suggestions.filter((s) => s.toLowerCase().includes(q.toLowerCase()));
    setFiltered(f);
    setShowSuggestions(f.length > 0 && q.length >= 0);
  };

  const select = (s: string) => {
    onLocationChanged(s);
    setQuery(s);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const setCurrent = () => {
    const mock = "Huidige locatie: Dam Square, Amsterdam";
    onLocationChanged(mock);
    setQuery(mock);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container} testID={testID ?? "location-section"}>
      <Text style={styles.title}>Locatie</Text>
      <View style={styles.inputWrap}>
        <MapPin size={18} color="#2563eb" />
        <TextInput
          style={styles.input}
          placeholder="Voer een adres in..."
          value={query}
          onChangeText={(v) => { setQuery(v); onLocationChanged(v); filter(v); }}
          onFocus={() => filter(query)}
          testID="location-input"
        />
        {query.length > 0 && (
          <Pressable accessibilityRole="button" onPress={() => { setQuery(""); onLocationChanged(""); filter(""); }} style={styles.iconBtn} testID="clear-location">
            <X size={16} color="#6b7280" />
          </Pressable>
        )}
        <Pressable accessibilityRole="button" onPress={setCurrent} style={styles.iconBtn} testID="use-current-location">
          <LocateFixed size={18} color="#2563eb" />
        </Pressable>
      </View>

      {showSuggestions && (
        <View style={styles.suggestBox}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <Pressable onPress={() => select(item)} style={({ pressed }) => [styles.suggestion, pressed && Platform.OS !== "web" && { backgroundColor: "#f3f4f6" }]} testID={`suggest-${index}`}>
                <Text style={styles.suggestionText}>{item}</Text>
              </Pressable>
            )}
            style={{ maxHeight: 220 }}
          />
        </View>
      )}

      <View style={styles.tip}>
        <Info size={16} color="#2563eb" />
        <Text style={styles.tipText}>Tip: Gebruik de huidige locatie knop voor GPS-coördinaten</Text>
      </View>
    </View>
  );
}

export const LocationSection = memo(LocationSectionComponent);

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 16, fontWeight: "700" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff" },
  input: { flex: 1 },
  iconBtn: { padding: 6 },
  suggestBox: { marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, backgroundColor: "#fff", overflow: "hidden" },
  suggestion: { paddingVertical: 12, paddingHorizontal: 12 },
  suggestionText: { color: "#111827" },
  tip: { marginTop: 8, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "center", gap: 8 },
  tipText: { color: "#6b7280" },
});
