import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from "react-native";
import { Calendar, User, Phone, Mail } from "lucide-react-native";

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate?: string | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export function PersonalInformation({ value, onChange }: { value: PersonalInfo; onChange: (v: PersonalInfo) => void; }) {
  const [local, setLocal] = useState<PersonalInfo>(value);

  useEffect(() => { setLocal(value); }, [value]);
  useEffect(() => { onChange(local); }, [local, onChange]);

  const dateLabel = useMemo(() => {
    if (!local.birthDate) return "Selecteer geboortedatum";
    try { return new Date(local.birthDate).toLocaleDateString(); } catch { return String(local.birthDate); }
  }, [local.birthDate]);

  return (
    <View style={styles.card} testID="personal-info">
      <Text style={styles.sectionTitle}>Persoonlijke Informatie</Text>

      <View style={styles.fieldBox}>
        <User color="#2f95dc" />
        <TextInput
          testID="pi-firstname"
          style={styles.input}
          placeholder="Voornaam"
          value={local.firstName}
          onChangeText={(t) => setLocal((p) => ({ ...p, firstName: t }))}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldBox}>
        <User color="#2f95dc" />
        <TextInput
          testID="pi-lastname"
          style={styles.input}
          placeholder="Achternaam"
          value={local.lastName}
          onChangeText={(t) => setLocal((p) => ({ ...p, lastName: t }))}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldBox}>
        <Mail color="#2f95dc" />
        <TextInput
          testID="pi-email"
          style={styles.input}
          placeholder="E-mailadres"
          keyboardType="email-address"
          autoCapitalize="none"
          value={local.email}
          onChangeText={(t) => setLocal((p) => ({ ...p, email: t }))}
        />
      </View>

      <View style={styles.fieldBox}>
        <Phone color="#2f95dc" />
        <TextInput
          testID="pi-phone"
          style={styles.input}
          placeholder="Telefoonnummer"
          keyboardType={Platform.select({ ios: "number-pad", android: "number-pad", default: "default" })}
          value={local.phoneNumber}
          onChangeText={(t) => setLocal((p) => ({ ...p, phoneNumber: t }))}
        />
      </View>

      <Pressable
        onPress={() => {
          // simple prompt alternative for web compatibility
          const next = prompt("Geboortedatum (YYYY-MM-DD)", local.birthDate ?? "");
          if (typeof next === "string") setLocal((p) => ({ ...p, birthDate: next || null }));
        }}
        style={({ pressed }) => [styles.datePicker, { opacity: pressed ? 0.85 : 1 }]}
        testID="pi-birthdate"
      >
        <Calendar color="#2f95dc" />
        <Text style={styles.dateText}>{dateLabel}</Text>
      </Pressable>

      <Text style={styles.subTitle}>Ouder/contactpersoon</Text>

      <TextInput
        testID="pi-em-name"
        style={styles.inputOnly}
        placeholder="Naam ouder/contactpersoon"
        value={local.emergencyContactName ?? ""}
        onChangeText={(t) => setLocal((p) => ({ ...p, emergencyContactName: t }))}
      />
      <TextInput
        testID="pi-em-phone"
        style={styles.inputOnly}
        placeholder="Telefoonnummer ouder/contactpersoon"
        keyboardType={Platform.select({ ios: "number-pad", android: "number-pad", default: "default" })}
        value={local.emergencyContactPhone ?? ""}
        onChangeText={(t) => setLocal((p) => ({ ...p, emergencyContactPhone: t }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2f95dc" },
  subTitle: { marginTop: 8, fontWeight: "700", color: "#111827" },
  fieldBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  input: { flex: 1, paddingVertical: 2 },
  inputOnly: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  datePicker: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 12 },
  dateText: { color: "#374151" },
});