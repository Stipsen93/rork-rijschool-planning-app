import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, TextInput, View, Pressable } from "react-native";
import { Filter, Search, X } from "lucide-react-native";

interface Props {
  value: string;
  onChange: (text: string) => void;
  onFilterPress?: () => void;
  activeFilter?: string;
  testID?: string;
}

function StudentSearchBarComponent({ value, onChange, onFilterPress, activeFilter = "all", testID = "student-search-bar" }: Props) {
  const [text, setText] = useState<string>(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleChange = useCallback((t: string) => {
    setText(t);
    onChange(t);
  }, [onChange]);

  const showDot = useMemo(() => activeFilter !== "all", [activeFilter]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.inputWrap}>
        <Search color="#6b7280" size={18} />
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleChange}
          placeholder="Zoek leerlingen..."
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {text.length > 0 && (
          <Pressable accessibilityRole="button" onPress={() => handleChange("")} style={styles.clearBtn} testID="clear-student-search">
            <X color="#6b7280" size={16} />
          </Pressable>
        )}
      </View>

      <Pressable accessibilityRole="button" onPress={onFilterPress} style={[styles.filterBtn, showDot && styles.filterActive]} testID="open-student-filters">
        <Filter color={showDot ? "#2f95dc" : "#6b7280"} size={18} />
        {showDot && <View style={styles.filterDot} />}
      </Pressable>
    </View>
  );
}

export const StudentSearchBar = memo(StudentSearchBarComponent);

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 12 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    height: 44,
    backgroundColor: "#fff",
  },
  input: { flex: 1, paddingVertical: Platform.OS === "web" ? 8 : 0, color: "#111827" },
  clearBtn: { padding: 6 },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  filterActive: { borderColor: "#2f95dc33", backgroundColor: "#e6f2fb" },
  filterDot: { position: "absolute", right: 8, top: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" },
});